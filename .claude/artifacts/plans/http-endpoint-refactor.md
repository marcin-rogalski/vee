---
type: plan
slug: http-endpoint-refactor
status: implemented
created: 2026-05-02
last_synced: f3140b8
references:
  - src/infrastruture/http/server/endpoint.ts
  - src/infrastruture/http/server/types.ts
  - src/infrastruture/http/server/index.ts
  - src/infrastruture/http/adapters/health.ts
  - src/infrastruture/http/adapters/message.ts
  - src/application/usecases/UserMessage/index.ts
  - src/application/usecases/UserMessage/types.ts
  - src/application/ports/LlmPort.ts
  - src/index.ts
related_decisions: [handler-contract, endpoint-shape, hexagonal-port-policy]
related_entities: []
related_plans: []
related_ideas: []
summary: Make Endpoint an abstract return-based controller; add SSE schema; wire DI for message endpoint.
---

# HTTP Endpoint refactor — return-based controller with SSE

## Goal
Turn `Endpoint` into an abstract class that owns all HTTP mechanics. Subclasses declare schemas + a mapper + a return-based handler. Add SSE support (mutually exclusive with `response`). Wire the message endpoint end-to-end with DI.

## Out of scope
- Real LLM adapter (Anthropic/OpenAI) — stub only; separate plan
- Auth, rate limiting, CORS — not yet needed
- OpenAPI/JSONSchema generation — possible later, not now
- Primary (input) ports for use cases — explicitly rejected; see hexagonal-port-policy

## Naming conventions
- HTTP adapters: `<Name>Endpoint.ts` / class `<Name>Endpoint` (e.g. `HealthEndpoint`, `UserMessageEndpoint`)
- Secondary adapters: `<Provider>LlmAdapter.ts` / class `<Provider>LlmAdapter` (e.g. `StubLlmAdapter`)
- Ports: `<Concern>Port.ts` (e.g. `LlmPort.ts`)
- Use case directories: CamelCase matching the class name (e.g. `UserMessage/` not `user-message/`)

## WBS

- [x] T0. Rename `src/infrastruture` → `src/infrastructure`; update all imports; tsconfig alias already correct
  - files: all under `src/infrastruture/`, `src/index.ts`
  - depends on: -
  - test: `npx tsc --noEmit` passes

- [x] T1. Rename use case dir `user-message/` → `UserMessage/`; update imports in message adapter
  - files: `src/application/usecases/user-message/` → `UserMessage/`, `src/infrastruture/http/adapters/message.ts`
  - depends on: -
  - test: `npx tsc --noEmit` passes

- [x] T2. Define `EndpointSchemas` discriminated union and update server types
  - files: `src/infrastructure/http/server/types.ts`
  - changes: add `EndpointSchemas<Response, SseEvent>` union (`{response:Schema<R>} | {sse:Schema<E>} | {}`)
  - depends on: T0
  - test: `npx tsc --noEmit` passes

- [x] T3. Refactor `Endpoint` to abstract class; hide HTTP machinery in `toHandlers()`
  - files: `src/infrastructure/http/server/endpoint.ts`
  - changes: abstract `method`, `path`, `schemas`, `map(params,body,query)→Input`, `handle(input,signal)→Output`; `toHandlers()` does validate → map → dispatch (void→204, json→200, sse→stream+`text/event-stream`); AbortController wired from `req.on("close")`
  - depends on: T2
  - test: `npx tsc --noEmit` passes

- [x] T4. Migrate health endpoint to `HealthEndpoint` subclass
  - files: `src/infrastructure/http/adapters/health.ts` → `HealthEndpoint.ts`
  - depends on: T3
  - test: `curl localhost:3000/health` → `{"status":"ok"}` 200

- [x] T5. Update `Server.register` to call `endpoint.toHandlers()`
  - files: `src/infrastructure/http/server/index.ts`
  - depends on: T3
  - test: server starts; health route works

- [x] T6. Implement use case body — consume `LlmPort`, map to `GenerateResponseEvent`
  - files: `src/application/usecases/UserMessage/index.ts`
  - changes: iterate `llm.streamResponse(...)`, map each `LlmEvent` variant to the correct `Envelope`
  - depends on: T1
  - test: vitest unit with fake `LlmPort` yielding token/thought/done; assert envelope shapes

- [x] T7. Create `StubLlmAdapter` implementing `LlmPort`
  - files: `src/infrastructure/llm/StubLlmAdapter.ts` (new)
  - changes: yields 2–3 fake `token` events then `done`
  - depends on: T0
  - test: `npx tsc --noEmit` passes

- [x] T8. Implement `UserMessageEndpoint` as subclass with SSE schema
  - files: `src/infrastructure/http/adapters/UserMessageEndpoint.ts` (replaces `message.ts`)
  - changes: extends `Endpoint`; constructor takes `UserMessageUseCase`; `map` → `{sessionId, message}`; `handle` yields from `useCase.generateResponse()`
  - depends on: T3, T6
  - test: `npx tsc --noEmit` passes

- [x] T9. Wire composition root — `StubLlmAdapter` → `UserMessageUseCase` → `UserMessageEndpoint` → server
  - files: `src/index.ts`
  - depends on: T4, T5, T7, T8
  - test: `curl -N -X POST localhost:3000/abc/message -d '{"message":"hi"}' -H 'content-type: application/json'` streams SSE token events then done

## Critical path
T0 → T2 → T3 → T5 → T9

## Walking skeleton
T0 + T1 (rename cleanup) → T2 → T3 → T4 → T5 (refactored HTTP layer, health works) → T6 + T7 (use case + stub) → T8 → T9 (message streams SSE end-to-end)
