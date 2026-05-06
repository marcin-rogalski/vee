---
type: plan
slug: infrastructure-ports
status: pending
created: 2026-05-05
last_synced: 909b2bb
references:
  - src/infrastructure/mongodb/
  - src/infrastructure/config/
  - src/infrastructure/tools/
  - src/application/ports/ChatSessionRepository.port.ts
  - src/application/ports/ConfigRepository.port.ts
  - src/application/ports/ChatToolManager.port.ts
  - src/index.ts
related_decisions: [hexagonal-port-policy, naming-convention, dto-layer-policy]
summary: MongoDB session repository, file+env config adapter, no-op tool manager stub, composition root wiring.
---

# Infrastructure Ports

## Goal
Implement all three missing secondary ports so `UserMessageEndpoint` can be wired in the composition root
and the app can fully start.

## Decisions
- MongoDB native driver `mongodb@6` (no Mongoose)
- Config file: `~/.vee/config.json` (home dir, survives repo wipes)
- Config priority: file → env → defaults
- Default token limit: `4096` (LM Studio default context window)
- Default mongo database name: `"vee"`
- Default mongo URI: `"mongodb://localhost:27017"`
- `OPENAI_API_KEY` is required — fail fast at startup if absent from both file and env
- `ChatToolManagerPort.executeTool` args aligned to `Record<string, unknown>` (matches ChatEvent DTO)
- MongoDB collection wiring owned entirely by `MongoDatabase`; repositories are purely declarative

## Config shape (`AppConfig`)

```ts
interface AppConfig {
    systemPrompt: string;   // default: "You are a helpful assistant."
    mongo: {
        uri: string;        // env: MONGO_URI,     default: "mongodb://localhost:27017"
        database: string;   // env: MONGO_DB,      default: "vee"
    };
    tokenLimit: number;     // env: TOKEN_LIMIT,   default: 4096
    openaiApiKey: string;   // env: OPENAI_API_KEY, required
}
```

| Field | File key | Env var | Default |
|---|---|---|---|
| `systemPrompt` | `systemPrompt` | `SYSTEM_PROMPT` | `"You are a helpful assistant."` |
| `mongo.uri` | `mongo.uri` | `MONGO_URI` | `"mongodb://localhost:27017"` |
| `mongo.database` | `mongo.database` | `MONGO_DB` | `"vee"` |
| `tokenLimit` | `tokenLimit` | `TOKEN_LIMIT` | `4096` |
| `openaiApiKey` | `openaiApiKey` | `OPENAI_API_KEY` | *(required)* |

After any env/default fallback the full resolved config is written back to `~/.vee/config.json`.

## MongoDB wiring pattern

```
MongoRepositoryBase — abstract class; declares collectionName, protected collection field
MongoDatabase       — owns MongoClient; register() + connect() injects collections
```

`MongoDatabase.connect()` sets `(repo as any).collection` after connecting — cast lives only here.
Repositories have zero injection code; they only declare `collectionName` and use `this.collection`.

## WBS

### T1 — Align `ChatToolManagerPort` args type
- [ ] `src/application/ports/ChatToolManager.port.ts` — change `args: object` → `args: Record<string, unknown>`

### T2 — `AppConfig` + `FileEnvConfig.adapter.ts`
- [ ] Create `src/infrastructure/config/AppConfig.ts` — `AppConfig` interface
- [ ] Create `src/infrastructure/config/FileEnvConfig.adapter.ts`
  - Config path: `path.join(os.homedir(), ".vee", "config.json")`
  - Static `load(): Promise<AppConfig>` factory:
    1. Try `fs.readFile(configPath)` → parse JSON → use as base
    2. For each field missing from file: check env var, then use default
    3. `openaiApiKey` missing from both → throw `Error("OPENAI_API_KEY is required")`
    4. After any fallback: write resolved config back to file
  - `ConfigRepositoryPort` satisfied at composition root with plain `{ systemPrompt: config.systemPrompt }`
- [ ] Unit test: `src/infrastructure/config/FileEnvConfig.unit.test.ts`
  - Mock `node:fs/promises` and `node:os`
  - Test: returns full config from file when valid and complete
  - Test: fills missing fields from env, writes file back
  - Test: falls back to defaults when neither file nor env present
  - Test: throws when `openaiApiKey` absent from both file and env

### T3 — `MongoRepositoryBase` + `MongoDatabase`
- [ ] Add `mongodb` package (`npm i mongodb`)
- [ ] Create `src/infrastructure/mongodb/MongoRepositoryBase.ts`
  - `abstract readonly collectionName: string`
  - `protected collection!: Collection`
- [ ] Create `src/infrastructure/mongodb/MongoDatabase.ts`
  - Constructor: `constructor(uri: string, dbName: string)`
  - `register(...repos: MongoRepositoryBase[]): void`
  - `connect(): Promise<void>` — connects, injects `(repo as any).collection` for each registered repo
  - `disconnect(): Promise<void>`

### T4 — `MongoSessionRepository.adapter.ts`
- [ ] Create `src/infrastructure/mongodb/MongoSessionRepository.adapter.ts`
  - Extends `MongoRepositoryBase<SessionDoc>`
  - `readonly collectionName = "sessions"`
  - `create()` → `insertOne({ history: [] })`, return `id.toString()`
  - `get(id)` → `findOne({ _id: new ObjectId(id) })`, throws `Error("Session not found")` on miss
  - `update(sessionId, entry)` → `updateOne({ _id: new ObjectId(sessionId) }, { $push: { history: entry } })`
- [ ] Unit test: `src/infrastructure/mongodb/MongoSessionRepository.unit.test.ts`
  - Set `repo.collection` directly (same `as any` cast) before each test
  - Test: create returns id string
  - Test: get maps doc to ChatSession
  - Test: get throws on null result
  - Test: update calls $push with correct args

### T5 — `NoOpToolManager.adapter.ts`
- [ ] Create `src/infrastructure/tools/NoOpToolManager.adapter.ts`
  - `getTools()` → `Promise.resolve([])`
  - `executeTool(name)` → `Promise.reject(new Error(\`No tools registered: \${name}\`))`
  - No test (trivial)

### T6 — Wire composition root (`src/index.ts`)
- [ ] `FileEnvConfig.load()` → `config`
- [ ] `new MongoDatabase(config.mongo.uri, config.mongo.database)`
- [ ] `new MongoSessionRepository()`
- [ ] `db.register(sessionRepo)`
- [ ] `await db.connect()`
- [ ] `new ChatContextManager({ systemPrompt: config.systemPrompt }, sessionRepo, config.tokenLimit)`
- [ ] `new NoOpToolManager()`
- [ ] `new OpenAiModelAdapter(config.openaiApiKey)`
- [ ] `new UserMessageEndpoint(contextManager, toolManager, model)`
- [ ] `server.register(Health, userMessageEndpoint)`
- [ ] Graceful shutdown on `SIGINT`/`SIGTERM`: `db.disconnect()` + `server.stop()`
