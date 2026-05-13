# ADR-004: Global Async Event Bus

## Status
Proposed

## Context
The `InferUseCase.execute()` method currently runs synchronously, blocking until the entire inference is complete. The TODO at line 50 (`// todo: emit events`) indicates the need to stream inference events to clients. The user wants:
- `execute()` to return immediately with only the session ID
- Events to flow through a **permanent global channel** (not per-session)
- A single SSE endpoint for all events (infer, config changes, errors, etc.)
- A decoupled async architecture where inference runs in the background

## Decision
Use a **global EventEmitter-based event bus** with a single HTTP SSE endpoint (`GET /events`) for client subscription.

### Architecture
```
┌──────────────────────┐         ┌──────────────────────┐
│ InferUseCase.execute │         │ GlobalEventBus       │
│  → returns sessionID │         │  (singleton bus)     │
│  → starts background │         │                      │
│    inference task    │────────▶│  emit(event)         │
└──────────────────────┘         │  emit(config:*)      │
                                 │  emit(error)         │
                                 └──────────┬───────────┘
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │ HTTP SSE Endpoint           │
                              │ GET /events                 │
                              │  → subscribe                │
                              │  → receive all events       │
                              └─────────────────────────────┘
```

### Event Structure
```typescript
interface GlobalEvent {
  type: string        // e.g., 'infer:token', 'infer:done', 'config:changed', 'error'
  sessionId?: string  // optional, for session-scoped events
  data: unknown
  ts: number
}
```

### Key Design Choices
1. **GlobalEventBusPort** — abstraction for the global event bus
2. **NodeEventBus** — implementation using `EventEmitter` with SSE support
3. **InferUseCase** — returns `Promise<string>` (session ID), starts inference in background, emits events
4. **SSE Endpoint** — `GET /events` streams all events to clients
5. **Lifecycle** — bus is a singleton, lives for the duration of the process

## Consequences
- **Pros**: Single endpoint, type-safe, zero external dependencies, SSE is standard HTTP, extensible for all event types
- **Cons**: Events are in-memory only (not durable across restarts), no event replay
- **Future**: Can swap to Redis Pub/Sub if distributed event handling is needed
