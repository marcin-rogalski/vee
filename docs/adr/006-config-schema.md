# ADR: JSON Schema as Universal Configuration Language

## Status

Accepted — 2026-06-15

## Context

The project uses JSON Schema (via Zod v4's native `z.fromJSONSchema()`) as the universal form language for:

1. **Provider configuration** — Each provider class declares a static `CONFIG_SCHEMA: JsonSchemaObject` that defines its config shape (apiKey, model, temperature, etc.)
2. **Interactive CLI forms** — `SchemaDrivenForm` component renders any JSON Schema as multi-step Ink TextInput/SelectInput fields
3. **Runtime validation** — `validateJsonSchema()` converts JSON Schema → Zod → validates config objects

## Decision: Config Files Mirror Code Schemas

When persistence is added (ISS-014), config files on disk will use the same JSON Schema definitions that drive the code:

- **`~/.vee/providers.json`** — Array of provider instances, each validated against its type's `CONFIG_SCHEMA`
- **`~/.vee/agents.json`** — Array of agent instances, validated against a composed schema that embeds the referenced provider's schema for `providerOverrides`

### Schema Composition

The Agent config schema is **composed** — it references the Provider's schema for the `providerOverrides` field:

```
AgentConfigSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    systemPrompt: { type: "string" },
    providerId: { type: "string" },
    providerOverrides: { $ref: "#/definitions/<providerType>/configSchema" },
    toolIds: { type: "array", items: { type: "string" } }
  },
  required: ["id", "name", "systemPrompt", "providerId"]
}
```

This means:
- The same schema that validates `Provider.config` also validates `Agent.providerOverrides`
- Manual edits to config files get the same validation as interactive CLI input
- Adding a new provider type automatically extends what agent overrides are valid

### Code Representation

The domain entities mirror this structure:

```typescript
// Provider stores its schema reference
type Provider = {
  id: string
  name: string
  type: string
  configSchema: JsonSchemaObject  // from provider class
  config: Record<string, unknown> // validated against configSchema
}

// Agent references provider's schema for overrides
type Agent = {
  id: string
  name: string
  description?: string
  systemPrompt: string
  providerId: string              // → Provider.id
  providerOverrides: Record<string, unknown>  // validated against Provider.configSchema
  toolIds: string[]
}
```

## Consequences

**Positive:**
- Single source of truth — schema drives forms, validation, AND file format
- Manual config file edits get the same validation as interactive input
- Adding a new provider type automatically updates what agent overrides are valid
- No custom DSL — JSON Schema is a standard with tooling support

**Negative:**
- Schema composition at load time requires resolving provider references before validating agents
- `Record<string, unknown>` for config/overrides loses TypeScript type safety (mitigated by Zod runtime validation)

## Alternatives Considered

- **YAML config files** — More human-readable but adds parsing complexity; JSON Schema validation still needed
- **TOML config files** — Similar to YAML, less ecosystem tooling for schema validation
- **Separate validation schemas** — Duplicating schemas for file vs code would drift; composition keeps them in sync
