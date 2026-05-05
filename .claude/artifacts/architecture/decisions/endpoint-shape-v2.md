---
type: architecture-decision
slug: endpoint-shape-v2
status: accepted
created: 2026-05-03
last_synced: f3140b8
references:
  - src/infrastructure/http/server/endpoint.ts
  - src/infrastructure/http/server/types.ts
  - src/infrastructure/http/adapters/
related_decisions: [handler-contract, naming-convention, endpoint-shape]
related_entities: []
supersedes: endpoint-shape
superseded_by: null
summary: Endpoint is a sealed class; Endpoint.typed() returns a typed abstract base for DI subclasses; Endpoint.create() for simple lambdas.
---

# Endpoint shape v2

## What
`Endpoint` has a protected constructor and two static entry points: `Endpoint.typed(method, path, schemas)` returns a typed abstract class for subclassing with constructor DI; `Endpoint.create(method, path, schemas, handler)` creates a simple endpoint inline.

## Why
The v1 abstract class required subclasses to repeat explicit generic parameters (`extends Endpoint<"/{path}", typeof schemas>`). TypeScript can only infer generics at function call sites, not at `extends` sites — so the only way to get inference without explicit annotations is to have the subclass extend the *result* of a static factory call. The two-entry-point design also removes the forced class boilerplate for trivial endpoints that need no DI.

## Alternatives
- Plain abstract class with explicit generics — rejected: every subclass must repeat type params verbatim; brittle when path or schemas change
- Handler as constructor parameter (concrete class, no abstract method) — rejected: handler types must be inferred via the same factory trick anyway; loses OOP enforcement of `handle`; DI endpoints need an awkward wrapper class
- External `createEndpoint()` function returning abstract class — rejected: same pattern, but the factory lives outside the class; consistency is better with static methods on `Endpoint` itself

## Tradeoffs
- Gain: no explicit generic annotations at subclass declaration site
- Gain: `abstract handle()` enforced by TypeScript; impossible to forget
- Gain: trivial endpoints stay one-expression via `Endpoint.create()`
- Gain: `Endpoint` constructor is sealed — only the two sanctioned entry points work
- Lose: `extends Endpoint.typed(...)` reads unusually on first encounter

## Consequences for code
- `Endpoint` constructor is `protected` — only `Endpoint.typed()` and `Endpoint.create()` may produce instances
- DI endpoints: `class FooEndpoint extends Endpoint.typed("POST", "/path", schemas)` — implement abstract `handle(params, body, query, signal)`; all parameter and return types inferred
- Simple endpoints: `Endpoint.create("GET", "/path", schemas, () => ...)` — one expression, no class needed
- `toHandlers()` remains on the base class; subclasses and consumers never call it directly
- `handle()` is the only method subclasses implement; it does not know about `req`/`res`/headers
- File suffix for adapter files: `<Name>.endpoint.ts` (see naming-convention ADR)
