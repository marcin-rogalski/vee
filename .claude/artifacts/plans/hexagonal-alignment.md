---
type: plan
slug: hexagonal-alignment
status: implemented
created: 2026-05-03
last_synced: f3140b8 (uncommitted changes)
references:
  - src/application/
  - src/infrastructure/http/
related_decisions: [naming-convention, dto-layer-policy, hexagonal-port-policy, endpoint-shape-v2]
summary: File suffix conventions, DTO extraction, port interfaces, sealed Endpoint with typed()/create() statics — all implemented.
---

# Hexagonal Alignment

## Goal
Enforce file suffix naming conventions across all layers. Extract DTOs from port files. Refactor `Endpoint` into a sealed class with `Endpoint.typed()` and `Endpoint.create()` static entry points so DI endpoints need no explicit generics.

## WBS

- [x] T1. ADR: naming-convention
- [x] T2. ADR: dto-layer-policy
- [x] T3. ADR: endpoint-shape-v2 (supersedes endpoint-shape)
- [x] T4. Extract DTOs
  - `ChatEntry.dto.ts`, `ChatEvent.dto.ts`, `ChatSession.ts` in `src/application/dto/`
- [x] T5. Port files use `*.port.ts` suffix
  - `Model.port.ts`, `ChatContextManager.port.ts`, `ChatContext.port.ts`, `ChatSessionRepository.port.ts`, `ChatToolManager.port.ts`, `ConfigRepository.port.ts`
- [x] T6. Use case files use `*.usecase.ts` suffix
  - `ChatMessage.uscase.ts` (replaces old `UserMessage.ts`)
- [x] T7. LLM adapter uses `*.adapter.ts` suffix
  - `OpenAiModel.adapter.ts`
- [x] T8. HTTP endpoint files use `*.endpoint.ts` suffix
  - `Health.endpoint.ts`, `UserMessage.endpoint.ts`
- [x] T9. Endpoint class sealed — `Endpoint.typed()` and `Endpoint.create()` implemented; constructor `protected`
- [x] T10. HTTP adapters updated to new Endpoint API
  - `Health.endpoint.ts` uses `Endpoint.create()`
  - `UserMessage.endpoint.ts` extends `Endpoint.typed(...)`, wires `ChatMessageUseCase`
