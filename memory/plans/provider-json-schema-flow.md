# Plan: Provider JSON Schema & Config Flow (Option C)

**Status:** done
**Created:** 2026-06-14
**Updated:** 2026-06-15

Replace the custom `ConfigurationSchema` DSL with native JSON Schema as the universal form language. Simultaneously fix the disconnected provider/agent config flow so that providers store shared credentials and agents store per-agent overrides, merged at inference time.

## Decisions

- **Option C — Hybrid config model:** Provider instances hold shared base config (apiKey, baseUrl). Agents hold per-agent overrides (model, temperature). InferUseCase merges them at runtime.
- **JSON Schema as primary format:** Each provider class declares a static `CONFIG_SCHEMA` in JSON Schema format. Replaces the custom `ConfigurationSchema` DSL entirely.
- **Zod v4 for validation round-trips:** Already installed at 4.4.1 with native `z.toJSONSchema()` support.
- **Providers are code, not user data:** Replace "Add Provider" screen with "Configure Provider" — pick a registered provider type → fill its schema form → save as named instance.

## ADR

See `docs/adr/006-config-schema.md`

## Tasks

### Phase 1 — Domain Foundation
1. [x] json-schema-types — `src/domain/JsonSchema.ts`
2. [x] replace-configschema-domain — Provider uses `configSchema: JsonSchemaObject`
3. [x] update-agent-domain — `providerOverrides` with JSDoc
4. [x] config-schema-dto — Updated for JsonSchemaObject

### Phase 2 — Provider Class Architecture
5. [x] provider-base-class — `ProviderBase.ts`
6. [x] openai-provider-stub — `OpenAIProvider` with real JSON Schema
7. [x] registry-schema-access — `schema(type): JsonSchemaObject`
8. [x] register-providers-root — OpenAI registered in compositionRoot

### Phase 3 — Validation Layer
9. [x] json-schema-to-zod-util — `validateJsonSchema()` using Zod `fromJSONSchema()`
10. [x] provider-config-validation — Standalone utility in `jsonSchemaToZod.ts`

### Phase 4 — InferUseCase Merge Logic
11. [x] infer-merge-config — Merge `provider.config` with `agent.providerOverrides`

### Phase 5 — CLI Screen Refactor
12. [x] schema-to-form-fields-util — `jsonSchemaToFormFields.ts`
13. [x] schema-driven-form-component — `SchemaDrivenForm.tsx`
14. [x] refactor-addprovider-screen — ConfigScreen provider flow
15. [ ] refactor-addagent-screen — Moved to `agent-entity-fix` plan (ISS-001)

### Phase 6 — Cleanup & Verification
16. [ ] remove-old-configschema-tests — Delete/rewrite old tests
17. [ ] verify-full-stack — Final verification

## Status

**Phase 1-4:** Complete
**Phase 5:** Tasks 12-14 complete. Task 15 moved to agent-entity-fix plan.
**Phase 6:** Tasks 16-17 pending (will run after all entity fix plans complete).
