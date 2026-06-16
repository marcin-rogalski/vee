# ADR: Provider Architecture

## Status

**Superseded** by [006-config-schema.md](006-config-schema.md) — 2026-06-15

The decision to use `ConfigurationSchema` DSL and `FORM_LAYOUT` constants was replaced with JSON Schema as the universal config language. The Provider Type vs Instance distinction and ProviderBase class design remain valid.

## Context (Original — 2026-06-14)

The provider system needs to support multiple AI provider types (OpenAI, Anthropic, etc.) with different configuration requirements. Currently, providers are stored as flat data without a clear relationship between provider types and their configuration schemas.

## Decision

### Provider Type vs Provider Instance

- **Provider Type** — A code-level class that defines capabilities, config schema, and inference logic. Immutable at runtime.
- **Provider Instance** — A user-created named configuration of a provider type. Stores credentials and settings. Mutable.

### Config Schema Ownership (Superseded)

Each Provider Type class owns a static `CONFIG_SCHEMA` property. Originally defined as `Array<ConfigurationSchema>` (custom DSL), later replaced with `JsonSchemaObject` (JSON Schema).

### Provider Registry

A `ProviderRegistry` maps type strings (`'openai'`, `'anthropic'`) to Provider Type classes. The registry:

1. Provides `get(type)` to instantiate provider classes
2. Provides `schema(type)` to get the config schema for form rendering
3. Provides `list()` to enumerate available provider types for selection

### Agent-Provider Relationship

Agents reference Provider Instances by ID. At inference time:

1. Load the Provider Instance (e.g., "My AI" → type: "openai", config: {apiKey: "..."})
2. Look up the Provider Type class from registry using the type string
3. Merge provider instance config with any agent-level overrides
4. Use the provider class to execute inference

## Consequences

**Positive:**
- Clear separation between code (provider types) and data (provider instances)
- Schema-driven forms ensure consistent UX across provider types
- Easy to add new provider types without modifying existing code
- Agent overrides work naturally on top of provider base config

**Negative:**
- Requires a registry step at startup to register all available provider types
- Provider type classes need to be importable without side effects
- Schema composition for agent overrides adds complexity
