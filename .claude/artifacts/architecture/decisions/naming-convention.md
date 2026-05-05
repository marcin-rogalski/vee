---
type: architecture-decision
slug: naming-convention
status: accepted
created: 2026-05-03
last_synced: f3140b8
references:
  - src/application/ports/
  - src/application/usecases/
  - src/infrastructure/
related_decisions: [hexagonal-port-policy, dto-layer-policy]
related_entities: []
supersedes: null
superseded_by: null
summary: Every source file carries a dot-suffix (.port/.dto/.usecase/.adapter/.endpoint) matching its architectural role.
---

# File naming convention

## What
Every source file in `src/` carries a dot-suffix that identifies its architectural type: `.port.ts`, `.dto.ts`, `.usecase.ts`, `.adapter.ts`, `.endpoint.ts`.

## Why
With `@application/*` and `@infrastructure/*` path aliases, the directory already signals the layer — but not the role within that layer. A suffix makes the role readable from any import line or file list without opening the file.

## Alternatives
- No suffixes — rejected because role is only discoverable by reading the file
- Directory-only grouping — rejected because usecase folders contain multiple files (usecase + dto) that need to be distinguishable
- CamelCase filename only — rejected because multi-word adapters like `StubLlmAdapter` lose the role signal at a glance

## Tradeoffs
- Gain: role readable from filename in any import, grep, or directory listing
- Gain: class/type names predictably match filename (`Llm.port.ts` → `LlmPort`)
- Lose: slightly longer filenames

## Consequences for code
- `.port.ts` — secondary port interface; file in `src/application/ports/`; exported name is `<Name>Port`
- `.dto.ts` — shared data shape; file in `src/application/ports/` or `src/application/usecases/<Name>/`; exported names are plain types/interfaces
- `.usecase.ts` — use case class; file in `src/application/usecases/<Name>/`; exported name is `<Name>UseCase`
- `.adapter.ts` — infrastructure implementation of a port; file in `src/infrastructure/<domain>/`; exported name is `<Qualifier><Name>Adapter`
- `.endpoint.ts` — HTTP primary adapter (Endpoint factory call); file in `src/infrastructure/http/adapters/`; exported name is `<Name>Endpoint` or default export
- Framework/config/composition-root files (`server/index.ts`, `src/index.ts`) carry no suffix
