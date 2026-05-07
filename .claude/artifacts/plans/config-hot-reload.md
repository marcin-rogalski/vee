---
type: plan
slug: config-hot-reload
status: draft
created: 2026-05-06
last_synced: b960dc8
references:
  - src/application/services/ConfigService.ts
  - src/application/ports/ModelFactory.port.ts
  - src/infrastructure/llm/ModelFactory.adapter.ts
  - src/application/usecases/GetConfig.usecase.ts
  - src/application/usecases/UpdateConfig.usecase.ts
  - src/application/usecases/ChatMessage.usecase.ts
  - src/application/usecases/ChatMessage.usecase.unit.test.ts
  - src/infrastructure/http/adapters/UserMessage.endpoint.ts
  - src/index.ts
related_decisions: [hexagonal-port-policy]
related_entities: []
related_plans: [model-selection-config-api]
related_ideas: []
summary: In-memory ConfigService + ModelFactory port so PATCH /config takes effect without restart
---

# Config hot-reload

## Goal
`PATCH /config` updates the active model immediately. A `ConfigService` holds live config in memory; a `ModelFactory` port resolves the active `ModelPort` at call time (cached per model id, recreated on change).

## Out of scope
- File-watch hot-reload (inotify / fs.watch) — PATCH-driven invalidation is sufficient
- Multi-model concurrency / A-B routing — single active model only
- Config rollback / versioning

## WBS

- [ ] T1. `ConfigService` application service
  - files: `src/application/services/ConfigService.ts`
  - depends on: —
  - note: constructor takes `AppConfigRepositoryPort`; `load(): Promise<void>` populates cache at startup; `get(): AppConfig` sync read; `update(patch): Promise<AppConfig>` merge → validate → save → update cache

- [ ] T2. `ModelFactory` port
  - files: `src/application/ports/ModelFactory.port.ts`
  - depends on: —
  - test: `tsc --noEmit` passes with the new port file

- [ ] T3. `ModelFactory` adapter
  - files: `src/infrastructure/llm/ModelFactory.adapter.ts`
  - depends on: T1, T2
  - note: reads `configService.get()` on each call; caches adapter instances by model `id`; recreates when `baseUrl`/`apiKey`/`name` change; returns `null` if no active model

- [ ] T4. Wire `GetConfigUseCase` + `UpdateConfigUseCase` through `ConfigService`
  - files: `src/application/usecases/GetConfig.usecase.ts`, `src/application/usecases/UpdateConfig.usecase.ts`, their unit tests
  - depends on: T1
  - note: `GetConfigUseCase` replaces `configRepo.load()` with `configService.get()` (sync); `UpdateConfigUseCase` replaces direct repo calls with `configService.update(patch)`

- [ ] T5. `ChatMessage.usecase` — model from factory
  - files: `src/application/usecases/ChatMessage.usecase.ts`, `src/application/usecases/ChatMessage.usecase.unit.test.ts`
  - depends on: T2
  - note: replace `model: ModelPort | null` ctor param with `modelFactory: ModelFactoryPort`; call `this.modelFactory.getActive()` at start of `execute()`

- [ ] T6. Composition root + endpoint wiring
  - files: `src/index.ts`, `src/infrastructure/http/adapters/UserMessage.endpoint.ts`
  - depends on: T3, T4, T5
  - note: instantiate `ConfigService`, call `await configService.load()` before creating other objects; create `ModelFactory` adapter; pass `configService` to use cases, `modelFactory` to `UserMessageEndpoint`
  - test: server starts; `PATCH /config` with a new active model; next `POST /message` uses the new model without restart

## Critical path
T1 → T4 → T6  (T2 → T3 and T2 → T5 feed T6 in parallel)

## Walking skeleton
T1, T2, T3, T5, T6 — ConfigService + ModelFactory wired end-to-end; T4 (use case rewiring) completes the picture.
