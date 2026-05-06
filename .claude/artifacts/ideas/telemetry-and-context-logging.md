---
type: idea
slug: telemetry-and-context-logging
status: promoted-to-plan
created: 2026-05-06
last_synced: ffff3cf
references:
  - src/application/usecases/ChatMessage.usecase.ts
  - src/application/services/RollingWindowContext.ts
  - src/application/services/ChatCotextManager.ts
  - src/application/ports/ChatContext.port.ts
  - src/infrastructure/http/server/index.ts
summary: Structured per-turn logs with session ID, prompt/response snippets, and context stats; OTEL-compatible field names; Logger port in application layer
---

# Telemetry and context logging

## Problem

The app processes chat turns, manages rolling token windows, and calls external LLM APIs — but currently emits zero structured logs. There is no way to trace what happened in a session, how much context was consumed, or whether a model call succeeded. Debugging and monitoring require attaching a debugger or reading raw stdout noise from Docker.

## Goals

- One structured log entry per chat turn with: sessionId (from context), prompt snippet (≤90 chars), response snippet (≤2 non-empty lines, ≤90 chars each), token stats
- Token stats as primary context unit: `used/limit (pct%)` — entry counts omitted from default output
- OTEL-compatible field names so we can plug in an exporter later without renaming fields
- Logger port in application layer (no infrastructure imports in use cases)
- HTTP request logs: method, path, status, latency (no sessionId — it belongs to the turn log)
- No logging library dependency — console adapter is enough for a container
- Always JSON — no pretty-print mode

## Non-goals

- Full OpenTelemetry SDK (traces, spans, metrics export) — not now
- Log aggregation / shipping (Loki, Datadog, etc.) — not now
- Per-token streaming logs
- Distributed tracing / W3C trace context headers — sessionId is our correlation key for now
- Debug flag / verbose mode — deferred to a follow-up idea

## Use cases

- As a developer, I want to tail `docker compose logs server` and see each turn's sessionId + prompt snippet + response snippet so I can follow a conversation without connecting a debugger.
- As a developer, I want token usage in every turn log as `used/limit (pct%)` so I can see at a glance how full the context window is without mental arithmetic.
- As a developer, I want HTTP request logs (method, path, status, latency) so I can see traffic patterns without an APM tool.
- As a developer, I want startup logs (port, mongo URI masked, active model name or "none") so I can confirm config is correct from the container log.

## Constraints

- Logger must not appear in domain entities — only in use cases and service layer (application), and in infrastructure adapters
- No log library dependency in application layer — the port is a plain interface
- Field names must follow OTEL semantic conventions where they exist (e.g. `session.id` maps to our `sessionId`, `gen_ai.usage.input_tokens`)
- Snippets must be deterministic in length: prompt → first 90 chars + `…` if longer; response → first 2 non-empty lines, each capped at 90 chars + `…` if longer

## Possible directions

### A — Logger port injected into use case + console adapter (RECOMMENDED)
Define `LoggerPort` in application layer with `info / warn / error / debug(event, fields)`. Inject into `ChatMessageUseCase`. `RollingWindowContext` gains a `stats()` method (no logger knowledge); use case reads stats after `commitTurn()` and logs the turn entry. Infrastructure has `ConsoleLogger` that writes JSON to stdout. Express middleware logs HTTP separately.

**Tradeoffs:** Clean hex, full control over format, easy to swap for OTEL exporter. Logger must be wired in composition root — one more constructor param on use case.

### B — Logger as a service in application layer (singleton-style)
A module-level `logger` exported from `application/services/Logger.ts`, used directly. No injection.

**Tradeoffs:** Simpler wiring, but harder to test (global state) and harder to swap. Violates hex spirit slightly.

### C — Middleware-only logging (HTTP layer)
Log at the HTTP layer only — body in, body out, latency. No application-layer awareness.

**Tradeoffs:** Zero application changes, but can't surface context stats or token counts without coupling HTTP to domain internals.

**Direction A is what we want.** B and C are stepping stones, not destinations.

## Design sketch (Direction A)

### LoggerPort (application/ports/Logger.port.ts)
```ts
interface LoggerPort {
  info(event: string, fields: Record<string, unknown>): void;
  warn(event: string, fields: Record<string, unknown>): void;
  error(event: string, fields: Record<string, unknown>, err?: unknown): void;
  debug(event: string, fields: Record<string, unknown>): void;
}
```

### ContextStats (exposed by RollingWindowContext, added to ChatContextPort)
```ts
type ContextStats = {
  sessionId: string;  // already on RollingWindowContext, no new data needed
  tokensUsed: number;
  tokenLimit: number;
  // formatted helpers — computed in stats(), used directly in log fields
  tokenUsage: string;   // "1842/4096"
  tokenPct: string;     // "44%"
};
```
`RollingWindowContext.stats()` derives everything from existing fields in `computeWindow()`. No extra token passes.

### Turn log entry (chat.turn)
```json
{
  "level": "info",
  "event": "chat.turn",
  "sessionId": "abc-123",
  "promptSnippet": "How do I configure the model…",
  "responseSnippet": "You can configure the model by editing…\nThe config file lives at…",
  "tokens": "1842/4096 (44%)",
  "ts": 1746530000000
}
```

### HTTP request log (http.request)
```json
{
  "level": "info",
  "event": "http.request",
  "method": "POST",
  "path": "/message",
  "status": 200,
  "latencyMs": 340
}
```

### Startup log (app.start)
```json
{
  "level": "info",
  "event": "app.start",
  "port": 3000,
  "mongoUri": "mongodb://***@localhost:27017/vee",
  "activeModel": "local-model"
}
```

## Where logging is injected

| Location | What it logs | Logger source |
|---|---|---|
| `ChatMessageUseCase` | `chat.turn` after `commitTurn()` | injected `LoggerPort` |
| `Server` (express middleware) | `http.request` per request | injected `LoggerPort` |
| `start()` in `index.ts` | `app.start` on boot | `ConsoleLogger` directly |
| `ChatContextManager` | eviction events (optional, later) | injected or not at all |

## Change log

- 2026-05-06 — initial draft: Logger port + console adapter, turn log with context stats, HTTP request log, debug flag path — (by: user)
- 2026-05-06 — resolved format questions: always JSON (no pretty mode); snippets capped at 90 chars; sessionId comes from context stats not HTTP layer; HTTP logs have no sessionId; token stats as "used/limit (pct%)" string, entry counts dropped from default output — (by: user)
- 2026-05-06 — debug flag deferred to follow-up idea; removed from goals, use cases, and design sketch — (by: user)
