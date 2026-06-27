# 010: EventBus Token Streaming — Real-Time Token Events for CLI

**Date:** 2026-06-17
**Status:** accepted

## Context

The CLI `infer` command needs to display streamed tokens in real-time as they arrive from the provider. The `InferTurnUseCase` already accumulates tokens internally (for persistence and return value), but the CLI command had no way to receive tokens as they stream — it only saw the final result.

The EventBus exists as a single event bus for all events (CRUD + inference), but `InferTurnUseCase` never published token events to it.

## Decision

`InferTurnUseCase` now accepts an optional `EventBus` in its constructor. When provided, it publishes a `'token'` event for each token chunk received from the provider stream:

```typescript
if (this.eventBus) {
  this.eventBus.publish({
    role: 'assistant',
    type: 'token',
    content: token,
    sessionId: agent.sessionId,
    agentId: agent.id,
  });
}
```

The CLI `Infer.command.ts` subscribes to the EventBus before calling the handler and listens for:
- `'token'` events — writes token content to stdout (no newline, for streaming effect)
- `'done'` events — writes a final newline
- `'error'` events — logs the error message

### Wiring

```
Infer.command.ts (CLI driving adapter)
  ├── subscribes to EventBus ('token', 'done', 'error')
  └── calls InferHandler
        └── InferTurnUseCase (has EventBus reference)
            ├── publishes 'token' for each chunk
            └── publishes 'done' when complete
```

### Why optional EventBus

The EventBus is optional in `InferTurnUseCase` because:
1. **Testability:** Unit tests can omit the EventBus and just check the return value.
2. **HTTP mode:** The HTTP infer endpoint doesn't need token events (it returns 204 and relies on SSE for streaming).
3. **Separation of concerns:** The use case's primary job is inference; publishing events is a side effect that only some consumers need.

## Consequences

### Positive
- **Real-time streaming:** CLI users see tokens as they arrive, not all at once at the end.
- **Backward compatible:** EventBus is optional — existing code that doesn't pass it still works.
- **Test isolation:** Unit tests don't need to mock the EventBus unless they care about events.
- **Single bus pattern maintained:** No need for a separate "inference event bus."

### Negative
- **Event ordering:** Token events are fire-and-forget — if a subscriber is slow, tokens may arrive out of order or be dropped.
- **Coupling:** `InferTurnUseCase` now knows about the EventBus interface, adding a dependency.
- **Memory pressure:** If no subscriber is listening, events are still created and discarded.

## Related Decisions

- [008-inference-decomposition](008-inference-decomposition.md) — Inference decomposition into phase use cases.
- [003-composition-root](003-composition-root.md) — CompositionRoot wires EventBus into InferTurnUseCase.
