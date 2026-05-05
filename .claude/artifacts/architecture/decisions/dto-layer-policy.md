---
type: architecture-decision
slug: dto-layer-policy
status: accepted
created: 2026-05-03
last_synced: f3140b8
references:
  - src/application/ports/
  - src/application/usecases/
related_decisions: [hexagonal-port-policy, naming-convention]
related_entities: []
supersedes: null
superseded_by: null
summary: DTOs live in application layer (.dto.ts files); ports import from them; infrastructure never defines its own domain types.
---

# DTO layer policy

## What
Data Transfer Objects (shared data shapes crossing layer or port boundaries) live exclusively in `src/application/` as `.dto.ts` files. Port interfaces import from these; infrastructure adapters use the same types — they never redeclare domain shapes.

## Why
Without a clear home for shared types, they tend to land inside port files (mixing interface with data shape) or get duplicated in infrastructure adapters (breaking the swap guarantee). Centralising DTOs in the application layer means swapping an adapter never requires touching the data contract.

## Alternatives
- DTOs embedded in port file — rejected because a port file should be one concept: the interface. Mixing types creates coupling between the shape and the driving side.
- DTOs in domain layer — rejected because domain layer is for business rules, not transport shapes. DTOs represent wire/inter-layer data, not domain entities.
- DTOs duplicated per adapter — rejected because divergence breaks the swap guarantee: two adapters for the same port would produce structurally different data.

## Tradeoffs
- Gain: swapping an adapter (e.g. `StubLlm.adapter.ts` → real LLM) requires no changes to types consumed by use cases
- Gain: port files stay lean — one interface, zero data declarations
- Lose: one extra file per port that has non-trivial data shapes

## Consequences for code
- A `.port.ts` file must not declare types — only the interface and any re-exports of its `.dto.ts` companion
- A `.dto.ts` file lives beside its port in `src/application/ports/` or beside its use case in `src/application/usecases/<Name>/`
- Infrastructure files (`*.adapter.ts`, `*.endpoint.ts`) import DTOs from `@application/ports/<Name>.dto` or `@application/usecases/<Name>/<Name>.dto` — never re-declare them
- Exception: `LlmEvent` stays in `Llm.port.ts` — it is a streaming discriminated union tightly coupled to the port method signature, not a standalone data shape
