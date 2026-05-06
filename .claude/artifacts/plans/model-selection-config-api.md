---
type: plan
slug: model-selection-config-api
status: ready-to-implement
created: 2026-05-06
last_synced: 61f79b443a01b90604653d02e7c8d14b2122bf86
references:
  - src/infrastructure/config/AppConfig.ts
  - src/infrastructure/config/FSConfigRepository.adapter.ts
  - src/infrastructure/config/FSConfigRepository.unit.test.ts
  - src/application/ports/AppConfigRepository.port.ts
  - src/application/usecases/ChatMessage.usecase.ts
  - src/application/usecases/ChatMessage.usecase.unit.test.ts
  - src/application/usecases/GetConfig.usecase.ts
  - src/application/usecases/UpdateConfig.usecase.ts
  - src/infrastructure/http/adapters/Config.endpoint.ts
  - src/index.ts
related_ideas: [multi-model-selection]
summary: Models array in config with active flag; composition root wires active adapter; GET /config and PATCH /config endpoints
---

# Model selection + config API

## Goal

Replace the single hardcoded model config with a named list where at most one entry carries `active: true`. Add `GET /config` and `PATCH /config` HTTP endpoints backed by new use cases so the active model (and other config) can be read and updated at runtime.

## Out of scope

- Per-session model override — deferred
- New provider adapters (Anthropic, Ollama) — OpenAI adapter only
- Hot-swap without restart — PATCH writes file; takes effect on next request (composition root re-reads config is not in scope)
- Auth on config endpoints — deferred

## Resolved

- `PATCH /config` does a deep merge (partial update, unset fields unchanged)
- `GET /config` masks all `apiKey` fields as `"***"`

## WBS

- [ ] T1. Update AppConfig schema — replace single `model` with `models` array
  - files: `src/infrastructure/config/AppConfig.ts`
  - depends on: -
  - test: tsc --noEmit passes; existing unit tests updated and green
  - notes: each entry `{ id: string, type: "openai", apiKey, baseUrl, name, active?: true }`; `.refine()` asserts `models.filter(m => m.active).length <= 1`; `models` defaults to `[]`

- [ ] T2. Update FSConfigRepository — fromEnv() builds single-entry models array
  - files: `src/infrastructure/config/FSConfigRepository.adapter.ts`, `src/infrastructure/config/FSConfigRepository.unit.test.ts`
  - depends on: T1
  - test: all FSConfigRepository unit tests green; env vars produce `models: [{ type:"openai", active:true, ... }]`

- [ ] T3. Update ChatMessage use case — accept `ModelPort | null`; throw domain error when null
  - files: `src/application/usecases/ChatMessage.usecase.ts`, `src/application/usecases/ChatMessage.usecase.unit.test.ts`
  - depends on: T1
  - test: unit test asserts error `"No active model configured"` when model is null

- [ ] T4. Add AppConfigRepository port + add save() to FSConfigRepository
  - files: `src/application/ports/AppConfigRepository.port.ts`, `src/infrastructure/config/FSConfigRepository.adapter.ts`
  - depends on: T1
  - test: tsc --noEmit; FSConfigRepository structurally satisfies the port (no runtime test needed)
  - notes: port has `load(): Promise<AppConfig>` and `save(config: AppConfig): Promise<void>`; existing narrow `ConfigRepository.port.ts` (systemPrompt only) stays unchanged

- [ ] T5. Add GetConfig use case
  - files: `src/application/usecases/GetConfig.usecase.ts`
  - depends on: T4
  - test: unit test — returns config from repo; sensitive fields (apiKey) masked as `"***"`

- [ ] T6. Add UpdateConfig use case — deep-merges partial update, validates, persists
  - files: `src/application/usecases/UpdateConfig.usecase.ts`
  - depends on: T4
  - test: unit test — merged config is saved; zod validation error propagates on invalid input; at-most-one-active constraint checked

- [ ] T7. Add Config endpoint — GET /config and PATCH /config
  - files: `src/infrastructure/http/adapters/Config.endpoint.ts`
  - depends on: T5, T6
  - test: tsc --noEmit; endpoint registered and handlers resolve correctly

- [ ] T8. Wire in composition root — active model resolution + config endpoints
  - files: `src/index.ts`
  - depends on: T2, T3, T7
  - test: `npm run build` passes; app starts cleanly with empty models array; error returned on chat with no active model

## Critical path

T1 → T4 → T5 → T7 → T8

## Walking skeleton

T1 → T3 → T8 (model selection end-to-end, app starts with no model, fails gracefully on chat)
