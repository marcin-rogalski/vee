# ADR-002: Integration Separation and Validation

## 1. Title

Separation of Persistence DTOs from Runtime Interfaces for Integrations, with Schema-Based Validation

## 2. Status

Accepted

## 3. Context

The existing `IntegrationDto` interface embeds the `infer` method directly in the DTO:

```typescript
interface IntegrationDto<IntegrationConfiguration, ModelConfiguration> {
  id: string
  type: string
  configuration: IntegrationConfiguration
  infer(agent, context, tools): AsyncGenerator<InferenceEventDto>
}
```

This creates several problems:
- **Serialization impossibility**: Methods cannot be JSON-serialized for database storage
- **Manager port inconsistency**: `IntegrationManagerPort.get()` returns an object with behavior, but the persistence layer cannot actually store it
- **Tight coupling**: `ModelConfiguration` is embedded in `IntegrationDto`, but the actual model config lives on `Agent`, not on the integration

Additionally, integrations need validation schemas for both their own configuration (stored with the integration) and the model configuration they accept (stored with the agent).

## 4. Decision

### 4.1 Separate IntegrationDto from IntegrationRuntime

**Persistence Layer** — plain data for DB storage (DTO):

```typescript
interface IntegrationDto<IntegrationConfiguration extends object> {
  id: string
  type: string
  configuration: IntegrationConfiguration
}
```

**Runtime Layer** — interface with behavior, no serialization:

```typescript
interface IntegrationRuntime {
  readonly configSchema: ZodSchema    // Validates integration configuration
  readonly modelSchema: ZodSchema     // Declares accepted model configuration shapes
  
  infer(
    modelConfiguration: object,
    context: ContextEntryDto[],
    tools: ToolDefinitionDto[],
  ): AsyncGenerator<InferenceEventDto>
}
```

### 4.2 No IntegrationExecutor Wrapper

The `IntegrationExecutor` type (a bound wrapper combining `IntegrationRuntime` with `Agent.model`) is **not** introduced. Instead, binding is explicit at the call site:

```typescript
// Infer usecase flow:
const agent = await agentManager.get(session.agentId)
const integration = await integrationManager.get(agent.integrationId)

for await (const event of integration.infer(agent.model, context, tools)) {
  yield event
}
```

### 4.3 IntegrationManagerPort with Validation

```typescript
interface IntegrationManagerPort {
  list(): Promise<string[]>
  get(id: string): Promise<IntegrationRuntime>
  upsert(dto: IntegrationDto): Promise<void>  // Validates configSchema before save
  delete(id: string): Promise<void>
}
```

The `IntegrationManager` is responsible for:
- Loading `IntegrationDto` from persistence via `IntegrationRepositoryPort`
- Instantiating the correct `IntegrationRuntime` adapter based on `type`
- Validating `dto.configuration` against `runtime.configSchema` before save
- Returning `IntegrationRuntime` with working `infer()` method

### 4.4 Schema Ownership and Validation Flow

| Schema | Validated By | When | Where |
|--------|--------------|------|-------|
| `configSchema` | `IntegrationManager.upsert()` | On integration save | Integration layer |
| `modelSchema` | `AgentManager.upsert()` | On agent save/load | Agent layer |

The `modelSchema` on `IntegrationRuntime` serves as a **contract declaration** — it tells the `AgentManager` what model configuration shapes this integration accepts. The actual validation happens in `AgentManager.upsert()` when saving an agent.

### 4.5 Example Implementation

```typescript
class SlackIntegrationRuntime implements IntegrationRuntime {
  readonly configSchema = z.object({
    webhookUrl: z.string().url(),
    channelId: z.string(),
  })

  readonly modelSchema = z.object({
    provider: z.literal('openai'),
    modelId: z.string(),
    apiKey: z.string(),
  })

  async infer(modelConfiguration, context, tools) {
    this.modelSchema.parse(modelConfiguration)
    // ... inference logic
  }
}
```

## 5. Consequences

### Positive
- **Clean persistence**: `IntegrationDto` is pure data, fully serializable to JSON
- **Runtime flexibility**: `IntegrationRuntime` implementations can hold non-serializable state (clients, connections)
- **Validation at boundaries**: Each integration declares and enforces its own schema requirements
- **Explicit binding**: No hidden wrapper objects — model config binding is visible at call site
- **Type safety**: Zod schemas provide runtime validation with TypeScript type inference

### Negative
- **Schema duplication risk**: `configSchema` in runtime vs potential schema in persistence layer
- **Manager complexity**: `IntegrationManager` must maintain a registry of factory functions
- **Schema maintenance**: Two schemas per integration (config + model) increase maintenance burden

### Mitigations
- Use code generation or template files to generate both schema and runtime together
- `IntegrationManager` registry is populated once at bootstrap
- Document schema ownership clearly — `configSchema` for integration config, `modelSchema` for agent model config

## 6. Implementation Plan

1. Create `IntegrationDto` type in `src/application/dto/Integration.dto.ts`
2. Create `IntegrationRuntime` interface in `src/application/ports/IntegrationRuntime.port.ts`
3. Update `IntegrationManagerPort` to use new types
4. Update `IntegrationUpsert.usecase.ts` to use `IntegrationDto`
5. Implement first runtime adapter (e.g., OpenAI) with schemas
6. Wire up registry in application bootstrap

## 7. Related Architecture Decisions

- [ADR-001: Infer Flow Architecture](001-infer-flow-architecture.md) — Original separation decision, now superseded for context details
- [ADR-003: Context-Session Separation and Rolling Window Design](003-context-session-separation-and-rolling-window.md) — Decouples context from persistence, defines rolling window with caching

## 8. References

- [Implementation Plan](../implementation-plan.md) — Consolidated implementation plan across all ADRs
- `src/application/dto/Integration.dto.ts` — Current (to be replaced)
- `src/application/ports/IntegrationManager.port.ts` — To be updated
- `src/application/dto/Agent.dto.ts` — Model config lives here, validated against IntegrationRuntime.modelSchema
