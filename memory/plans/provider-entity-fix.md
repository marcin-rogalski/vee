# Plan: Fix Provider Entity Thoroughly

**Status:** complete (All phases done: Tasks 1-10 ✅)
**Created:** 2026-06-15
**Scope:** Provider entity — usecases, commands, CLI screen tests, validation, cascade safety, config schema

Fix every known issue with the Provider entity except persistence (ISS-014, deferred). After this plan, Provider will be the first "properly done" entity in the codebase: validated on save, safe on delete, tested on all three entry points (usecase, command, interactive screen).

## ADR

See `docs/adr/006-config-schema.md` — JSON Schema as universal config language.

## Issues Addressed

| Issue | Description |
|---|---|
| ISS-004 | No validation of `Provider.config` against `configSchema` at save time |
| ISS-005 | CLI `ProvidersUpsert.command.ts` hardcodes empty schema |
| ISS-012 | `await` on void `eventBus.publish()` (provider scope) |
| ISS-013 | No cascade delete check for providers referenced by agents |
| ISS-015 | No interactive test coverage for provider config flow |

## Issues Explicitly Deferred

| Issue | Reason |
|---|---|
| ISS-014 | Persistence layer — epic, separate plan |
| ISS-017 | Schema validation on file load — depends on ISS-014 |

---

## Phase 1 — UseCase Validation & Safety

### Task 1: Add config validation to ProviderUpsertUseCase ✅

**Issue:** ISS-004 → **Fixed**

Inject `validateJsonSchema` from `jsonSchemaToZod.ts` into ProviderUpsertUseCase. Validate `provider.config` against `provider.configSchema` before saving. Throw `ValidationError` if config doesn't match schema.

**Changes:**
- `ProviderUpsertUseCase` constructor accepts validation function
- `execute()` calls `validateJsonSchema(provider.config, provider.configSchema)` before `repository.save()`
- Import `ValidationError` from `@domain/errors`

**Tests:**
- Valid config passes through
- Invalid config throws ValidationError
- Missing required field throws ValidationError

---

### Task 2: Add cascade safety to ProviderDeleteUseCase ✅

**Issue:** ISS-013 → **Fixed**

Before deleting a provider, check if any agents reference it via `providerId`. If so, refuse the delete with a clear error.

**Changes:**
- `ProviderDeleteUseCase` gets `AgentRepositoryPort` dependency
- Add `listByProviderId(providerId: string)` to `AgentRepositoryPort`
- Throw error listing referencing agents if any exist

**Tests:**
- Delete succeeds when no agents reference provider
- Delete fails when agent references provider
- Error message contains referencing agent names

---

### Task 3: Remove `await` from eventBus.publish() in provider usecases ✅

**Issue:** ISS-012 (provider scope only) → **Fixed**

`eventBus.publish()` returns `void`. Remove misleading `await`.

---

### Task 4: Update compositionRoot for new usecase dependencies ✅

Wire new dependencies into usecase constructors.

---

## Phase 2 — CLI Command Fixes

### Task 5: Fix ProvidersUpsert.command.ts

**Issue:** ISS-005

- Inject `providerRegistry` into command deps
- Use `providerRegistry.schema(type)` instead of hardcoded empty schema
- Add `--config key=value` repeatable option for config values

**Example:**
```bash
vee providers upsert --name "My AI" --type openai \
  --config apiKey=sk-abc123 \
  --config model=gpt-4o \
  --config temperature=0.7
```

**Tests (new file):**
- Command registers correct options
- Usecase called with schema from registry
- Config key-value pairs parsed correctly

---

### Task 6: Add tests for ProvidersList and ProvidersDelete commands ✅

**Issue:** ISS-016 (provider scope) → **Fixed (provider scope)**

**Tests (new files):**
- `ProvidersList.command.test.ts`
- `ProvidersDelete.command.test.ts`

---

## Phase 3 — Provider Config Schema

### Task 7: Create ProviderConfigSchema

Per ADR, define the JSON Schema that describes the shape of `providers.json` (the future persistence file). This schema will:
- Validate arrays of provider instances
- Reference each provider type's `CONFIG_SCHEMA` for the `config` field
- Be used both for file validation (ISS-017, later) and as documentation

**Changes:**
- New file: `src/domain/ProviderConfigSchema.ts`
- Exports `PROVIDERS_CONFIG_SCHEMA: JsonSchemaObject` — describes `{ providers: Provider[] }` structure
- This is a *composition* schema — it references provider type schemas via `$ref`

---

## Phase 4 — Interactive Screen Test Coverage

### Task 8: Add interactive tests for provider config flow

**Issue:** ISS-015 (provider scope)

**Tests (add to `ConfigScreen.test.tsx`):**
- Selecting "Add provider" transitions to provider type selection
- Provider type SelectInput shows available types
- Selecting type transitions to name input
- Name entry transitions to schema-driven config form
- Config form renders correct fields from provider schema
- Completing form calls `onUpsertProvider` with correct values
- Provider save success returns to menu

---

### Task 9: Add tests for SchemaDrivenForm component

**Tests (new file: `SchemaDrivenForm.test.tsx`):**
- Renders correct number of fields from JSON Schema
- Renders TextInput for string fields
- Renders SelectInput for string enum fields
- Renders TextInput for number fields
- Calls onComplete with all field values
- Marks required fields visually

---

## Phase 5 — Verification

### Task 10: Full verification run ✅

- `tsc --noEmit` — 0 errors
- `biome check --fix --unsafe` — 0 violations
- `npm test` — 471/471 tests pass

---

## Task Summary

| # | Task | Issues | New Tests |
|---|---|---|---|
| 1 | Config validation in ProviderUpsert | ISS-004 | 3 |
| 2 | Cascade safety in ProviderDelete | ISS-013 | 3 |
| 3 | Remove await on publish | ISS-012 | 0 |
| 4 | Update compositionRoot | — | 0 |
| 5 | Fix ProvidersUpsert command | ISS-005 | 3 |
| 6 | Test ProvidersList/Delete commands | ISS-016 | 9 |
| 7 | ProviderConfigSchema domain | ADR | 8 |
| 8 | ConfigScreen provider flow tests | ISS-015 | ~7 |
| 9 | SchemaDrivenForm component tests | ISS-015 | ~7 |
| 10 | Final verification | — | — |

**Estimated new tests:** ~35
**Estimated files touched:** ~18
