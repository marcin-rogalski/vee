---
type: plan
slug: telemetry-and-context-logging
status: implemented
created: 2026-05-06
last_synced: ffff3cf
references:
  - src/application/ports/Logger.port.ts
  - src/application/ports/ChatContext.port.ts
  - src/application/services/RollingWindowContext.ts
  - src/application/usecases/ChatMessage.usecase.ts
  - src/infrastructure/http/server/index.ts
  - src/infrastructure/logging/ConsoleLogger.adapter.ts
  - src/index.ts
related_ideas: [telemetry-and-context-logging]
summary: LoggerPort in application layer; ConsoleLogger adapter; chat.turn + http.request + app.start log entries; token stats on context
---

# Telemetry and context logging

## Goal
Add structured JSON logs for chat turns (sessionId, prompt/response snippets, token usage), HTTP requests, and app startup — all emitted via an injected `LoggerPort` with a `ConsoleLogger` infrastructure adapter.

## Out of scope
- Debug flag / verbose mode — deferred
- Log aggregation or shipping
- OpenTelemetry SDK or trace context headers
- Per-token streaming logs

## WBS

- [x] T1. Define `LoggerPort` in application layer
  - files: `src/application/ports/Logger.port.ts`
  - depends on: —
  - test: `tsc --noEmit` passes; interface has `info / warn / error / debug(event, fields)`

- [x] T2. Add `stats()` to `ChatContextPort` and implement in `RollingWindowContext`
  - files: `src/application/ports/ChatContext.port.ts`, `src/application/services/RollingWindowContext.ts`
  - depends on: —
  - test: unit test — `stats()` returns correct `sessionId`, `tokenUsage` (`"N/L"`), `tokenPct` (`"P%"`) after `computeWindow()`

- [x] T3. Inject `LoggerPort` into `ChatMessageUseCase`; emit `chat.turn` after `commitTurn()`
  - files: `src/application/usecases/ChatMessage.usecase.ts`
  - depends on: T1, T2
  - test: unit test — spy logger receives `chat.turn` with correct `sessionId`, `promptSnippet` (≤90 chars + `…`), `responseSnippet` (≤2 lines, each ≤90 chars + `…`), `tokens` field

- [x] T4. Implement `ConsoleLogger` infrastructure adapter
  - files: `src/infrastructure/logging/ConsoleLogger.adapter.ts`
  - depends on: T1
  - test: `JSON.parse(capturedStdout)` succeeds; fields `level`, `event`, `ts` always present

- [x] T5. Add HTTP request logging middleware to `Server`
  - files: `src/infrastructure/http/server/index.ts`
  - depends on: T1, T4
  - test: integration — POST /health returns 200 and stdout contains `http.request` entry with `method`, `path`, `status`, `latencyMs`

- [x] T6. Emit `app.start` log in composition root; remove bare `console.log` from `Server.start()`
  - files: `src/index.ts`, `src/infrastructure/http/server/index.ts`
  - depends on: T4
  - test: server startup stdout contains `app.start` with `port`, masked `mongoUri` (`***` over credentials), `activeModel`

- [x] T7. Wire `ConsoleLogger` into composition root and inject into `ChatMessageUseCase` + `Server`
  - files: `src/index.ts`
  - depends on: T3, T4, T5, T6
  - test: `npm run typecheck` passes; `docker compose` logs show all three event types on a single message round-trip

## Critical path
T1 → T3 → T7
T2 → T3

## Walking skeleton
T1, T2, T3, T4, T7 — Logger port defined, stats exposed, turn logged end-to-end with real ConsoleLogger. HTTP and startup logs are additive (T5, T6).
