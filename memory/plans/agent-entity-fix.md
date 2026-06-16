# Plan: Fix Agent Entity Thoroughly

**Status:** complete (all Tasks 1-11 done)
**Created:** 2026-06-15
**Scope:** Agent entity — usecases, commands, CLI screen, validation, config schema

Fix every known issue with the Agent entity except persistence (ISS-014, deferred). Follows the same patterns as `provider-entity-fix` plan for consistency.

## ADR

See `docs/adr/006-config-schema.md` — JSON Schema as universal config language, including schema composition for agent overrides.

## Issues Addressed

| Issue | Description |
|---|---|
| ISS-001 | CLI creates agents with empty `providerId` (AddAgentForm only collects name/description) |
| ISS-003 | No validation that `Agent.providerId` references an existing provider |
| ISS-007 | No validation that `Agent.toolIds` reference existing tools |
| ISS-015 | No interactive test coverage for agent config flow |
| ISS-016 | No CLI command tests for agent commands |

## Issues Explicitly Deferred

| Issue | Reason |
|---|---|
| ISS-014 | Persistence layer — epic, separate plan |
| ISS-017 | Schema validation on file load — depends on ISS-014 |

---

## Phase 1 — UseCase Validation & Safety

### Task 1: Add provider reference validation to AgentUpsertUseCase

**Issue:** ISS-003

Before saving an agent, verify `providerId` exists in the provider repository.

**Changes:**
- `AgentUpsertUseCase` constructor accepts new dependency: `ProviderRepositoryPort`
- `execute()` calls `providerRepository.get(agent.providerId)` before `agentRepository.save()`
- If provider not found, throw `ValidationError` with message: `"Provider not found: {agent.providerId}"`

**Tests:**
- Valid providerId passes through
- Non-existent providerId throws ValidationError
- Error message contains the invalid providerId

---

### Task 2: Add tool reference validation to AgentUpsertUseCase

**Issue:** ISS-007

Before saving an agent, verify each `toolId` exists in the tool registry.

**Changes:**
- `AgentUpsertUseCase` constructor accepts new dependency: `ToolRegistryPort`
- `execute()` calls `toolRegistry.get(toolId)` for each tool in `agent.toolIds`
- If any tool not found, throw `ValidationError` listing missing tool IDs

**Tests:**
- Valid toolIds pass through
- Empty toolIds array passes through (tools are optional)
- Non-existent toolId throws ValidationError
- Error message lists all missing tool IDs

---

### Task 3: Remove `await` from eventBus.publish() in agent usecases

**Issue:** ISS-012 (agent scope only)

Same pattern as provider-entity-fix Task 3.

**Changes:**
- `AgentUpsertUseCase`: Remove `await` before `this.eventBus.publish(...)`
- `AgentDeleteUseCase`: Remove `await` before `this.eventBus.publish(...)`

---

### Task 4: Update compositionRoot for new usecase dependencies

Wire `providerRepository` and `toolRegistry` into `AgentUpsertUseCase`.

---

## Phase 2 — CLI Command Fixes

### Task 5: Fix AgentsUpsert.command.ts

**Issue:** ISS-001 (CLI command scope)

The command stubs `providerId: ''`, `systemPrompt: ''`, `providerOverrides: {}`, `toolIds: []`. Make it functional with CLI flags matching the Agent domain field names.

**Changes:**
- `--provider-id <id>` — required, references existing Provider.id
- `--prompt <text>` — required, maps to `systemPrompt`
- `--override <key>=<value>` — repeatable, maps to `providerOverrides`
- `--tool-id <toolId>` — repeatable, maps to `toolIds`

**Example:**
```bash
vee agents upsert --name "Coder" --provider-id p1 \
  --prompt "You are a helpful coding assistant." \
  --override model=gpt-4o \
  --override temperature=0.2 \
  --tool-id readFile --tool-id writeFile
```

**Tests (new file):**
- Command registers correct options
- `--provider-id` maps to `agent.providerId`
- `--prompt` maps to `agent.systemPrompt`
- `--override` flags parsed into `providerOverrides` Record
- `--tool-id` flags parsed into `toolIds` array

---

### Task 6: Add tests for AgentsList and AgentsDelete commands

**Issue:** ISS-016 (agent scope)

**Tests (new files):**
- `AgentsList.command.test.ts`
- `AgentsDelete.command.test.ts`

---

## Phase 3 — Interactive Agent Form

### Task 7: Refactor AddAgentForm

**Issue:** ISS-001 (interactive scope)

Replace the current name-only form with a full multi-step agent creation flow, following the same pattern as the provider config flow (select → input → schema-driven form).

**Flow:**
1. **Name** — TextInput for agent name
2. **Description** — TextInput for agent description (optional, can skip)
3. **System prompt** — TextInput for `systemPrompt`
4. **Provider selection** — SelectInput listing available providers from `providerList`
5. **Provider overrides** — SchemaDrivenForm using the selected provider's `configSchema` (same component as provider config, but pre-filled with provider's current config values as defaults)
6. **Tool selection** — SelectInput with multi-select for available tools from `toolRegistry`

**Changes:**
- `AddAgentForm.tsx` — Replace with multi-step flow (or decompose into sub-components like provider flow)
- `AGENT_ADD_FIELDS` constant — Updated to include all fields
- ConfigScreen `onUpsertAgent` prop type — Updated to accept full Agent shape (not just name/description)
- `CLI.ts` — Remove stubbing of `providerId`, `systemPrompt`, etc.

**Design decision:** Single component vs decomposed sub-components.
- **Choice:** Decompose into sub-components matching provider pattern: `AddAgentNameForm`, `AddAgentProviderSelect`, `AddAgentOverridesForm`, `AddAgentToolsSelect`. ConfigScreen orchestrates the steps via state (like `addProviderType` → `addProviderName` → `addProviderConfig`).

---

### Task 8: Update ConfigScreen for agent flow

Update ConfigScreen modes and state management for the new agent multi-step flow. Add modes: `addAgentName`, `addAgentDescription`, `addAgentPrompt`, `addAgentProvider`, `addAgentOverrides`, `addAgentTools`.

---

## Phase 4 — Agent Config Schema

### Task 9: Create AgentConfigSchema

Per ADR, define the JSON Schema that describes the shape of `agents.json` (the future persistence file). This schema **composes** provider schemas for the `providerOverrides` field.

**Changes:**
- New file: `src/domain/AgentConfigSchema.ts`
- Exports `AGENTS_CONFIG_SCHEMA: JsonSchemaObject` — describes `{ agents: Agent[] }` structure
- The `providerOverrides` property uses a schema that references provider type schemas
- Since an agent references a specific provider, the validation resolves the provider's schema at runtime

**Key design:** The schema is a *template* — the actual validation of `providerOverrides` requires knowing which provider an agent references, so the composed schema resolves at validation time (not static).

---

## Phase 5 — Interactive Screen Test Coverage

### Task 10: Add interactive tests for agent config flow

**Issue:** ISS-015 (agent scope)

**Tests (add to `ConfigScreen.test.tsx` or new `AddAgentForm.test.tsx`):**
- Selecting "Add agent" transitions to name input
- Name entry transitions to description (or skips to prompt)
- Description entry transitions to system prompt
- System prompt entry transitions to provider selection
- Provider SelectInput shows available providers
- Selecting a provider transitions to overrides form
- Overrides form uses selected provider's schema
- Completing overrides transitions to tool selection
- Tool SelectInput shows available tools
- Completing form calls `onUpsertAgent` with full agent data

---

## Phase 6 — Verification

### Task 11: Full verification run

- `tsc --noEmit` — 0 errors
- `biome check --fix --unsafe` — 0 violations
- `npm test` — all tests pass

---

## Task Summary

| # | Task | Issues | New Tests |
|---|---|---|---|
| 1 | Provider reference validation | ISS-003 | 3 |
| 2 | Tool reference validation | ISS-007 | 4 |
| 3 | Remove await on publish | ISS-012 | 0 |
| 4 | Update compositionRoot | — | 0 |
| 5 | Fix AgentsUpsert command | ISS-001 | 5 |
| 6 | Test AgentsList/Delete commands | ISS-016 | ~4 |
| 7 | Refactor AddAgentForm | ISS-001 | 0 (covered by Task 10) |
| 8 | Update ConfigScreen agent flow | ISS-001 | 0 (covered by Task 10) |
| 9 | AgentConfigSchema domain | ADR | 0 |
| 10 | Agent config flow tests | ISS-015 | ~10 |
| 11 | Final verification | — | — |

**Estimated new tests:** ~26
**Estimated files touched:** ~18
