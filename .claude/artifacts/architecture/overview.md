---
type: architecture-overview
last_synced: f3140b8 (uncommitted changes)
references:
  - src/
  - tsconfig.json
  - package.json
related_decisions: [handler-contract, endpoint-shape-v2, hexagonal-port-policy, naming-convention, dto-layer-policy]
summary: Hexagonal TS/Node app — Express HTTP primary adapter, OpenAI LLM secondary adapter, streaming SSE, rolling-window context management.
---

# Architecture overview

## Stack
- TypeScript, Node.js, ESM
- Express 5 — HTTP transport only; no business logic
- Zod — request validation inside Endpoint base class
- tiktoken — token counting for context window management
- OpenAI SDK — LLM streaming
- Vitest — unit tests

## Layer structure

```
src/
  application/
    dto/              — shared data shapes (ChatEntry, ChatEvent, ChatSession)
    ports/            — secondary port interfaces (*Port.ts)
    services/         — application services (ChatContextManager, RollingWindowContext)
    usecases/         — use case classes (*usecase.ts)
  infrastructure/
    http/
      server/         — Server, Endpoint base class, types
      adapters/       — one *.endpoint.ts per HTTP route
    llm/              — LLM secondary adapters (*Model.adapter.ts)
  index.ts            — composition root
```

## Key components

### ChatMessageUseCase
Owns the request loop: `startTurn` → stream model response → accumulate tokens/tool-calls → push to context → execute tools → loop until no tool calls → `commitTurn`.

### ChatContextManager
Application-layer context cache keyed by `sessionId`. 15-minute sliding TTL; background interval evicts expired entries. Cache miss loads from `ChatSessionRepositoryPort`. Returns a `ChatContextPort` instance.

### RollingWindowContext
Implements `ChatContextPort`. Holds three pinned sections (system, current user prompt, current-turn responses) and a rollable history. Token budget filled from history newest-to-oldest via tiktoken. `startTurn` / `commitTurn` manage the turn lifecycle; `push` persists entries and updates the in-memory window.

### Endpoint
Sealed base class. `Endpoint.create()` for simple lambda routes; `Endpoint.typed()` returns an abstract subclass for DI-style endpoints. `toHandlers()` produces Express middleware: validates params/body/query via Zod schemas, dispatches to handler, streams SSE for `AsyncGenerator` outputs. Custom path syntax `/{param:type}` is converted to Express `:param` on registration.

## Data flow
```
client → Express → Endpoint.toHandlers() (validate → dispatch)
       → ChatMessageUseCase.execute()
       → ChatContextManager (cache) → ChatSessionRepositoryPort
       → ModelPort.streamResponse() → OpenAiModelAdapter
       → yields ChatEvent stream back through Endpoint → SSE to client
```

## Port interfaces
| Port | Responsibility |
|---|---|
| `ModelPort` | Stream LLM response given context + tool definitions |
| `ChatContextManagerPort` | Get or create session context |
| `ChatSessionRepositoryPort` | Persist and load session history |
| `ConfigRepositoryPort` | Provide system prompt |
| `ChatToolManagerPort` | List and execute tools |

## Missing infrastructure (not yet implemented)
- `ChatSessionRepositoryPort` implementation
- `ConfigRepositoryPort` implementation
- `ChatToolManagerPort` implementation
