# Issues Registry

**Created:** 2026-06-15
**Updated:** 2026-06-16

Living list of issues discovered during lifecycle audit. Grouped by severity. Each issue has an ID for reference in future plans.

---

## Critical

### ISS-001: CLI creates agents with empty `providerId`

**Status:** Fixed
**Area:** CLI / ConfigScreen / AddAgentForm
**Severity:** Critical

`CLI.ts` stubs `providerId: ''`, `systemPrompt: ''`, `providerOverrides: {}`, `toolIds: []` when saving agents via the interactive CLI. The `AddAgentForm` only collects `name` and `description`. Agents created through the CLI can never be used for inference because they have no provider reference.

**Impact:** Agent creation via CLI is non-functional for inference.
**Fix Required:** Task 15 from provider-json-schema-flow plan (refactor AddAgentForm to include provider selection + systemPrompt).

**Fixed:** 2026-06-16 — ConfigScreen refactored to 6-step agent flow (name → description → prompt → provider → overrides → tools). CLI command fixed with --provider, --override, --tool flags.

---

### ISS-002: Context data orphaned on session delete

**Area:** SessionDeleteUseCase / ContextRepository
**Severity:** Critical

`SessionDeleteUseCase` calls `sessionRepository.delete(id)` but never calls `contextRepository.delete(sessionId)`. The conversation entries remain in memory indefinitely, orphaned from any session.

**Impact:** Memory leak — context entries accumulate even after sessions are deleted.
**Fix Required:** Add `contextRepository.delete(id)` to `SessionDeleteUseCase`.

---

### ISS-003: No validation that `Agent.providerId` references an existing provider

**Status:** Fixed
**Area:** AgentUpsertUseCase
**Severity:** Critical

`AgentUpsertUseCase` saves agents without verifying `providerId` exists in the provider repository. An agent can reference a non-existent provider, causing runtime errors during inference.

**Impact:** Silent data corruption — invalid agent saved, error only surfaces at inference time.
**Fix Required:** Add `providerRepository.get(agent.providerId)` check in `AgentUpsertUseCase` before save.

**Fixed:** 2026-06-16 — `ProviderRepositoryPort` injected into `AgentUpsertUseCase`, provider existence validated before save.

---

## High

### ISS-004: No validation of `Provider.config` against `configSchema` at save time

**Status:** Fixed
**Area:** ProviderUpsertUseCase
**Severity:** High

`ProviderUpsertUseCase` saves providers without validating `config` against `configSchema`. The `validateJsonSchema()` utility exists in `jsonSchemaToZod.ts` but is never called in the usecase layer. Invalid config is only caught at inference time.

**Impact:** Invalid provider config saved silently, errors surface during inference.
**Fix Required:** Call `validateJsonSchema(config, configSchema)` in `ProviderUpsertUseCase.execute()`.

---

### ISS-005: CLI `ProvidersUpsert.command.ts` hardcodes empty schema

**Area:** Commands / ProvidersUpsert
**Severity:** High
**Status:** Fixed

The CLI command creates providers with `configSchema: { properties: {} }` instead of fetching the real schema from `providerRegistry.schema(type)`. The interactive CLI screen does it correctly, but the command-line path does not.

**Impact:** Providers created via CLI command have empty schemas, breaking schema-driven validation.
**Fix Required:** Inject `providerRegistry` into command deps, use `schema(type)` instead of hardcoded empty object.

**Fixed:** 2026-06-15 — `providerRegistry` injected into command deps, `schema(type)` used, `--config key=value` repeatable option added.

---

### ISS-006: Sessions lose agent association on navigation

**Area:** MainScreen / Session flow
**Severity:** High

`MainScreen` tracks `sessionId` and `agentId` in separate React state variables. When navigating away from the session screen and back, the selected agent is lost. The Session entity itself has no `agentId` field.

**Impact:** User must re-select agent every time they navigate to sessions.
**Fix Required:** Either add `agentId` to Session entity, or persist the selection in MainScreen state across navigation.

---

### ISS-007: No validation that `Agent.toolIds` reference existing tools

**Status:** Fixed
**Area:** AgentUpsertUseCase
**Severity:** High

`AgentUpsertUseCase` doesn't verify `toolIds` exist in the tool registry before saving.

**Impact:** Agents can reference non-existent tools, errors surface at inference time.
**Fix Required:** Add tool registry validation in `AgentUpsertUseCase`.

**Fixed:** 2026-06-16 — `ToolRegistryPort` injected into `AgentUpsertUseCase`, tool existence validated before save.

---

## Medium

### ISS-008: 10-minute session TTL with silent deletion

**Area:** InMemorySessionRepository
**Severity:** Medium

Sessions auto-expire after 10 minutes of inactivity via a background cleanup timer. No event is published when this happens. Users won't know their session/context was deleted.

**Impact:** Silent data loss.
**Fix Required:** Publish `session-expired` event on TTL cleanup, or make TTL configurable/longer.

---

### ISS-009: CRUD events mixed with inference events on EventBus

**Area:** EventBus / EventsSSE
**Severity:** Medium

All events (inference tokens, thoughts, tool-calls AND session/provider/agent CRUD) share the same EventBus. The SSE endpoint broadcasts everything on one channel. A client subscribing for config changes will also receive inference streaming tokens.

**Impact:** Clients can't filter by event category. SSE consumers get noise.
**Fix Required:** Either add event categories/channels to EventBus, or split into separate buses (inference vs CRUD).

---

### ISS-010: Dead port methods with no usecase

**Area:** Ports / UseCases
**Severity:** Medium

- `SessionRepository.setName()` — no usecase wraps it
- `ContextRepository.delete()` — never called by SessionDeleteUseCase

**Impact:** Dead code, port surface area larger than needed.
**Fix Required:** Either create usecases or remove from ports.

---

### ISS-011: No dedicated Get usecases

**Area:** UseCases
**Severity:** Medium

`InferUseCase` calls `agentRepository.get()` and `providerRepository.get()` directly, bypassing the usecase layer. No `AgentGetUseCase` or `ProviderGetUseCase` exists.

**Impact:** Repository accessed from usecase layer directly (minor clean architecture violation).
**Fix Required:** Create Get usecases or accept that InferUseCase is a legitimate composite usecase that needs direct repository access.

---

### ISS-012: `await` on void `eventBus.publish()` is misleading

**Status:** Fixed
**Area:** UseCases / EventBus
**Severity:** Low

All CRUD usecases do `await this.eventBus.publish(...)` but `publish()` returns `void`. The await is a no-op that suggests async behavior.

**Impact:** Code readability only.
**Fix Required:** Remove `await` before `eventBus.publish()` calls.

**Fixed:** 2026-06-15 — Provider usecases fixed. 2026-06-16 — Agent + Infer usecases fixed (all usecases now clean).

---

### ISS-016: No CLI command integration tests

**Status:** Fixed (provider + agent scope)
**Area:** Testing / Commands
**Severity:** Medium

Zero test files exist under `src/infrastructure/driving/commands/`. All 12 command files are untested.

**Impact:** Command argument parsing, option validation, and usecase wiring are untested.
**Fix Required:** Add tests for each command that verify: (a) correct Commander.js options are registered, (b) usecase is called with correct arguments parsed from CLI flags.

**Fixed (Provider scope):** 2026-06-15 — Tests added for `ProvidersList.command.ts` (4 tests) and `ProvidersDelete.command.ts` (5 tests).
**Fixed (Agent scope):** 2026-06-16 — Tests added for `AgentsList.command.ts`, `AgentsDelete.command.ts`, `AgentsUpsert.command.ts`.

---

### ISS-017: Config files should use JSON Schema for typed manual edits

**Area:** Persistence / Configuration
**Severity:** Medium

Once persistence is added (ISS-014), config files stored on disk will be editable by users. Without schema validation on load, manual edits can corrupt data silently.

**Impact:** Manual edits to config files may produce invalid data that only fails at runtime.
**Fix Required:** When loading persisted data, validate against JSON Schema using `validateJsonSchema()`. Provide clear error messages on load failure.

---

## Low

### ISS-013: No cascade delete for providers referenced by agents

**Status:** Fixed
**Area:** ProviderDeleteUseCase
**Severity:** Low (currently in-memory)

Deleting a provider doesn't check if any agents reference it via `providerId`. In an in-memory setup this is low risk, but would be critical with persistent storage.

**Impact:** Agents may reference deleted providers.
**Fix Required:** Add check in `ProviderDeleteUseCase` or soft-delete pattern.

---

## Epic

### ISS-014: No persistence layer — all data is in-memory

**Area:** Infrastructure / Repositories
**Severity:** Epic

All four repositories use `Map<string, T>` in memory. Data is lost on process exit. No file-based storage exists.

**Impact:** Zero data durability. Every restart wipes all agents, providers, sessions, and conversation history.
**Fix Required:** Implement file-based persistence (JSON files in `~/.vee/` or similar). Consider JSON schema validation on load to catch manual edit corruption.

---

### ISS-015: No interactive mode test coverage for provider/agent config flows

**Status:** Fixed
**Area:** Testing / ConfigScreen
**Severity:** High

`ConfigScreen.test.tsx` has 6 test cases but none test the schema-driven provider or agent configuration flows. The `SchemaDrivenForm` component also has zero test coverage.

**Impact:** Provider and agent configuration flows are untested in the interactive UI. Regression risk on future changes.
**Fix Ready:** Add tests for: (a) provider type selection, (b) provider name entry, (c) schema-driven config form submission, (d) agent form with provider selection + overrides.

**Fixed:** 2026-06-16 — Provider flow tests added (7 tests in ConfigScreen.test.tsx, 6 tests in SchemaDrivenForm.test.tsx). Agent config flow tests added (17 total ConfigScreen tests including 4 new agent flow tests).

---

## Summary

| Status | Count | Issues |
|---|---|---|
| Fixed | 9 | ISS-001, ISS-003, ISS-004, ISS-005, ISS-007, ISS-012, ISS-013, ISS-015, ISS-016 |
| Open | 7 | ISS-002, ISS-006, ISS-008, ISS-009, ISS-010, ISS-011, ISS-017 |
| Epic | 1 | ISS-014 |

---

## Status Legend

- **Open** — Discovered, not yet planned
- **Planned** — Assigned to a plan/task
- **Fixed** — Resolved in codebase

## Assignment to Plans

| Issue | Assigned To | Status |
|---|---|---|
| ISS-001 | `agent-entity-fix` Phase 3 | ✅ Fixed |
| ISS-002 | *(unassigned — needs new plan)* | Open |
| ISS-003 | `agent-entity-fix` Phase 1 | ✅ Fixed |
| ISS-004 | `provider-entity-fix` Phase 1 Task 1 | ✅ Fixed |
| ISS-005 | — | ✅ Fixed |
| ISS-006 | *(unassigned — needs new plan)* | Open |
| ISS-007 | `agent-entity-fix` Phase 1 | ✅ Fixed |
| ISS-008 | *(unassigned — needs new plan)* | Open |
| ISS-009 | *(unassigned — needs new plan)* | Open |
| ISS-010 | *(unassigned — needs new plan)* | Open |
| ISS-011 | *(unassigned — needs new plan)* | Open |
| ISS-012 | `provider-entity-fix` + `agent-entity-fix` | ✅ Fixed |
| ISS-013 | `provider-entity-fix` Phase 1 Task 2 | ✅ Fixed |
| ISS-014 | *(unassigned — epic, separate plan)* | Epic |
| ISS-015 | `provider-entity-fix` + `agent-entity-fix` | ✅ Fixed |
| ISS-016 | `provider-entity-fix` + `agent-entity-fix` | ✅ Fixed |
| ISS-017 | *(depends on ISS-014)* | Open |
