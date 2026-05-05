---
type: architecture-decision
slug: endpoint-shape
status: superseded
created: 2026-05-02
last_synced: f3140b8
references:
  - src/infrastructure/http/server/endpoint.ts
  - src/infrastructure/http/server/types.ts
related_decisions: [handler-contract]
related_entities: []
supersedes: null
superseded_by: endpoint-shape-v2
summary: Each HTTP endpoint is an abstract class subclass; schemas are mutually exclusive (response | sse | none).
---

# Abstract class endpoint shape

## What
`Endpoint<Input, Output>` is an abstract class. Each concrete endpoint subclasses it, declaring `method`, `path`, `schemas`, `map`, and `handle`. The base class hides `toHandlers()`.

## Why
Endpoints need constructor injection (use case dependencies), a consistent validation/mapping/dispatch pipeline, and a place to enforce the mutual exclusivity of `response` vs `sse`. An abstract class gives all three naturally.

## Alternatives
- Plain function config with schemas as constructor args — rejected: no natural DI; handler captures schemas awkwardly
- Augmenting Express `RequestHandler` type — rejected: `res` type augmentation is fragile; no mutual exclusivity enforcement

## Tradeoffs
- Gain: DI via constructor; each endpoint is a self-contained named class
- Gain: mutual exclusivity enforced at the type level via a union on `schemas`
- Gain: `map` is the only domain-specific glue the subclass must write; base class handles the rest
- Lose: slightly more boilerplate than a functional config for trivial endpoints (e.g. health)

## Consequences for code
- `schemas` is a discriminated union: `{ response: Schema<R> } | { sse: Schema<E> } | {}` — TypeScript rejects mixing them
- `map(params, body, query): Input` is abstract — it assembles HTTP pieces into a clean domain object; no HTTP vocabulary enters `handle`
- `handle(input: Input, signal: AbortSignal): Output` is abstract
- `toHandlers(): RequestHandler[]` is non-abstract, final, internal — not visible to subclasses
- Naming: endpoint files use `<Name>Endpoint.ts` suffix (e.g. `UserMessageEndpoint.ts`, `HealthEndpoint.ts`)
