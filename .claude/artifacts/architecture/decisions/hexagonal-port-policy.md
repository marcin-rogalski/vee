---
type: architecture-decision
slug: hexagonal-port-policy
status: accepted
created: 2026-05-02
last_synced: f3140b8
references:
  - src/application/ports/LlmPort.ts
  - src/application/usecases/
related_decisions: [endpoint-shape]
related_entities: []
supersedes: null
superseded_by: null
summary: No primary (input) ports; secondary (output) ports required for all infrastructure dependencies.
---

# Hexagonal port policy

## What
Primary (driving) ports are not used. Secondary (driven) ports are required for every infrastructure dependency.

## Why
Primary ports (interfaces the use case implements for its callers) add a layer of indirection between the HTTP adapter and the application layer with no practical benefit — use cases are not infrastructure and will not be swapped for a different framework. Secondary ports (interfaces the use case depends on for infrastructure calls) are essential because the driven side IS infrastructure and IS replaceable.

## Alternatives
- Full symmetry (primary + secondary ports) — rejected: `UserMessagePort` wrapping `UserMessageUseCase` is pure indirection; no scenario where the same adapter drives a different use case implementation
- No ports at all — rejected: secondary side would couple use cases directly to LLM providers, databases, etc., defeating the architecture

## Tradeoffs
- Gain: fewer files and abstractions; adapter-to-use-case path is direct and readable
- Lose: adapters are not swappable via the port (acceptable — adapters are not abstract)

## Consequences for code
- Ports live in `src/application/ports/` — one file per secondary boundary (e.g. `LlmPort.ts`)
- Use cases live in `src/application/usecases/<ClassName>/index.ts` — directory named after the class (CamelCase)
- Adapters receive use case instances via constructor injection at the composition root (`src/index.ts`)
- No interface wrapping a use case class; the class itself is the abstraction
