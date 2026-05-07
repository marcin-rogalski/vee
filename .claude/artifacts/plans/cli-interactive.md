---
type: plan
slug: cli-interactive
status: draft
created: 2026-05-07
last_synced: b960dc8
references:
  - src/application/dto/ChatSession.ts
  - src/application/ports/ChatSessionRepository.port.ts
  - src/application/services/RollingWindowContext.ts
  - src/application/services/ChatCotextManager.ts
  - src/infrastructure/mongodb/MongoSessionRepository.adapter.ts
  - src/infrastructure/mongodb/MongoSessionRepository.unit.test.ts
  - src/infrastructure/http/adapters/Sessions.endpoint.ts
  - src/index.ts
  - cli/package.json
  - cli/src/index.ts
  - cli/src/client.ts
  - cli/src/commands/chat.ts
  - cli/src/commands/config.ts
related_decisions: []
related_entities: []
related_plans: [cli-dev-tool]
related_ideas: []
summary: Upsert-based session repo, GET/POST /sessions, full ink interactive CLI replacing commander
---

# CLI interactive rewrite

## Goal
Replace `create`+`update` on `SessionRepositoryPort` with a single `upsert` (auto-assigns UUID when id missing); add `list`. Add `GET /sessions` and `POST /sessions` endpoints. Rewrite the CLI with ink: interactive screens for config, session picker, and chat. CLI never generates session IDs.

## Out of scope
- Session metadata (createdAt, messageCount) — list returns ids only for now
- Auth headers
- Shared types between cli/ and src/
- Config hot-reload (tracked in config-hot-reload plan)

## WBS

- [x] T1. `SessionRepositoryPort` — upsert + list
  - files: `src/application/ports/ChatSessionRepository.port.ts`
  - depends on: —
  - note: replace `create(id): void` and `update(id, entry): void` with `upsert(session: { id?: string; history: ChatEntry[] }): Promise<ChatSession>` and `list(): Promise<string[]>`; `get` returns `ChatSession | null` (no throw)
  - test: `tsc --noEmit`

- [x] T2. `MongoSessionRepository` — implement new interface
  - files: `src/infrastructure/mongodb/MongoSessionRepository.adapter.ts`, `src/infrastructure/mongodb/MongoSessionRepository.unit.test.ts`
  - depends on: T1
  - note: `upsert` uses `replaceOne({ _id: id }, doc, { upsert: true })`; auto-assigns `crypto.randomUUID()` when id missing; `get` returns null instead of throwing; `list` uses `distinct('_id')`
  - test: `vitest run` on the unit test file; all 4 cases pass

- [x] T3. `RollingWindowContext` — replace update with upsert
  - files: `src/application/services/RollingWindowContext.ts`
  - depends on: T1
  - note: `push` computes full history = `[...this.history, ...(this.userEntry ? [this.userEntry] : []), ...this.currentTurn]` then calls `sessionRepository.upsert({ id: this.sessionId, history: fullHistory })`
  - test: `tsc --noEmit`

- [x] T4. `ChatContextManager` — null-aware get + upsert for auto-create
  - files: `src/application/services/ChatCotextManager.ts`
  - depends on: T1
  - note: replace `try/catch create` with `const session = await repo.get(id) ?? await repo.upsert({ id, history: [] })`
  - test: `tsc --noEmit`

- [x] T5. `GET /sessions` and `POST /sessions` endpoints
  - files: `src/infrastructure/http/adapters/Sessions.endpoint.ts` (new), `src/index.ts`
  - depends on: T1
  - note: `GET /sessions` → `{ sessions: string[] }`; `POST /sessions` → calls `upsert({ history: [] })` → `{ id: string }`; both endpoints receive `sessionRepository` directly (no use-case wrapper needed at this scale)
  - test: `curl GET /sessions` returns `{ sessions: [] }`; `curl POST /sessions` returns `{ id: "<uuid>" }`

- [ ] T6. CLI deps — add ink, remove commander
  - files: `cli/package.json`, `cli/tsconfig.json`
  - depends on: —
  - note: add `ink`, `react`, `ink-select-input`, `ink-text-input`; add `@types/react`; remove `commander`; set `jsx: react-jsx` in tsconfig if not present
  - test: `cd cli && npm install && npx tsc --noEmit`

- [ ] T7. CLI client — add `listSessions()` and `createSession()`
  - files: `cli/src/client.ts`
  - depends on: T5, T6
  - note: `listSessions(): Promise<string[]>`; `createSession(): Promise<string>`; keep `streamMessage` and `getConfig`/`patchConfig`
  - test: type-checks

- [ ] T8. CLI app shell + navigation
  - files: `cli/src/index.ts`, `cli/src/App.tsx`
  - depends on: T6
  - note: `App` manages `screen` state: `'menu' | 'config' | 'sessions' | 'chat'`; top-level `render(<App />)`; remove all commander usage
  - test: `npm run start` shows a menu with at least Config / Chat options

- [ ] T9. Config screen
  - files: `cli/src/screens/ConfigScreen.tsx`
  - depends on: T7, T8
  - note: shows current config (active model, token limit); allows picking active model by id using `ink-select-input`; PATCHes on confirm; press Esc → back to menu
  - test: screen renders without crash; selecting a model calls patchConfig

- [ ] T10. Session picker screen
  - files: `cli/src/screens/SessionScreen.tsx`
  - depends on: T7, T8
  - note: fetches session list on mount; shows ids + "New session" option at top; on select calls `createSession()` if new, otherwise uses picked id; transitions to ChatScreen with chosen sessionId
  - test: screen renders session list fetched from server; selecting "New session" creates one

- [ ] T11. Chat screen
  - files: `cli/src/screens/ChatScreen.tsx`
  - depends on: T7, T8
  - note: props: `sessionId`; shows `Session: <id>` header; renders conversation history (static entries + streaming tokens); text input at bottom; on submit calls `streamMessage`; status bar shows token usage from `done` event or context stats; Esc → session picker
  - test: sending a message streams tokens to screen; session id and token info visible

- [ ] T12. Remove old CLI command files
  - files: `cli/src/commands/chat.ts`, `cli/src/commands/config.ts`
  - depends on: T9, T10, T11
  - note: delete both files; verify no imports remain
  - test: `tsc --noEmit` clean; `npm run start` launches ink app

## Critical path
T1 → T2, T3, T4, T5  
T6 → T7 → T8 → T9, T10 → T11 → T12

## Walking skeleton
T1, T2, T4, T5, T6, T7, T8, T10, T11 — session upsert end-to-end + ink shell with session picker and chat. Config screen and cleanup are additive.
