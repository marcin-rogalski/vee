---
type: architecture-decision
slug: handler-contract
status: accepted
created: 2026-05-02
last_synced: f3140b8
references:
  - src/infrastructure/http/server/endpoint.ts
related_decisions: [endpoint-shape]
related_entities: []
supersedes: null
superseded_by: null
summary: Endpoint handlers are return-based; base class owns all HTTP mechanics including SSE, status codes, and AbortSignal.
---

# Return-based handler contract

## What
Endpoint handlers return data (`void | Response | AsyncGenerator<SseEvent>`) instead of writing to `res` directly.

## Why
Handlers that receive `res` carry the full weight of the HTTP protocol — they must set headers, choose status codes, format SSE, and call `res.end()`. This leaks transport concerns into what should be thin adapter glue.

## Alternatives
- `res.sendEvent(event)` augmentation — rejected: leaky; handler still owns SSE setup and teardown
- Full Express `RequestHandler` signature — rejected: exposes `req`, `res`, `next`; no natural return type to hang type safety on

## Tradeoffs
- Gain: handler is testable without an HTTP context; HTTP concerns live in exactly one place
- Gain: status codes and SSE framing are consistent across all endpoints by default
- Lose: unusual mid-stream error recovery requires extending the base class, not the handler

## Consequences for code
- Handler receives `(input: Input, signal: AbortSignal)` only — no HTTP vocabulary
- Status defaults enforced by base class: `void` → 204, `Response` → 200, SSE → 200 + `text/event-stream`
- `AbortController` created per-request; `req.on("close")` calls `controller.abort()`; `controller.signal` passed as second arg to `handle`
- No `res` import in any endpoint subclass
