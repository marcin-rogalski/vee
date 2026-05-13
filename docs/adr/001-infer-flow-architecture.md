# ADR-001: Infer Flow Architecture

## 1. Title

Hexagonal Architecture for Agent Inference Flow with Manager-Based Orchestration

## 2. Status

Superseded by ADR-003 for context/session details

## 3. Context (Historical)

The system requires an inference pipeline that:
- Supports multiple integration providers (OpenAI, Anthropic, etc.)
- Allows multiple instances of each provider type
- Links agents to integrations and sessions to agents
- Streams inference results via AsyncGenerator
- Manages conversation context with tool support

The existing codebase has:
- DTOs for Agent, Integration, Session, Context, Tools, and Inference Events
- Empty usecase files that need implementation
- Empty manager port files that need definition
- An old implementation (`src_old`) with ChatMessage usecase that provides reference patterns
- Hexagonal folder structure (`driven/`, `driving/`) already in place

Key challenge: The current `IntegrationDto` embeds the `infer` method directly in the DTO, mixing persistence data with runtime behavior. This needs to be separated for proper hexagonal architecture.

## 4. Decision (Historical)

We will adopt the following architecture:

### 4.1 Separate Persistence DTOs from Runtime Interfaces

**Persistence DTOs** (stored in database):
- `IntegrationDto` - plain data with id, type, configuration
- `AgentDto` - plain data with id, name, integrationId, model
- `SessionDto` - plain data with id, agentId, history

**Runtime Interfaces** (provided by adapters):
- `IntegrationRuntime` - has `infer()` method

> Note: `IntegrationExecutor` was removed per ADR-002. Binding is explicit at the call site.

### 4.2 Use Manager Classes for Orchestration

Four manager ports will be defined:

| Manager | Responsibility |
|---------|---------------|
| `AgentManagerPort` | Agent CRUD + agent→integration resolution |
| `IntegrationManagerPort` | Integration CRUD + factory pattern |
| `ContextManagerPort` | Context loading with TTL caching, entries, rolling window |
| `ToolManagerPort` | Tool discovery and execution |

### 4.3 Define Explicit Repository Ports

Three new repository ports will be created:
- `IntegrationRepositoryPort`
- `AgentRepositoryPort`
- `SessionRepositoryPort`

Each with: `findById`, `findAll`, `save`, `delete`

### 4.4 Integration Registry Pattern

Integrations are registered by type at bootstrap:
```typescript
integrationRegistry.register('openai', createOpenAiIntegration)
```

The `IntegrationManager.get()` method uses this registry to create runtime instances.

### 4.5 Infer Use Case Flow

The `InferUseCase.execute()` method (refined by ADR-003):
1. Loads session via `sessionManager.get(sessionId)`
2. Loads agent via `agentManager.get(session.agentId)`
3. Gets context via `contextManager.getContext(session, agent)` — TTL-cached
4. Gets tools via `toolManager.getTools()`
5. Resolves integration via `integrationManager.get(agent.integrationId)`
6. Runs `integration.infer(agent.model, context.entries, tools)` as AsyncGenerator
7. Handles tool calls within the inference loop
8. Commits context via `context.commitTurn()`
9. Persists session via `sessionRepo.save(session)` — explicit, after each turn

## 5. Consequences

### Positive
- **Clear separation of concerns**: DTOs are pure data, managers handle orchestration
- **Testability**: Each manager and usecase can be tested in isolation with mocked ports
- **Extensibility**: New integration providers are added by registering with the registry
- **Hexagonal compliance**: Application layer depends only on ports, infrastructure implements adapters
- **Streaming support**: AsyncGenerator enables real-time token streaming

### Negative
- **More files**: Separation creates additional interface files
- **Indirection**: Agent→Integration resolution adds a layer between usecase and integration
- **Boilerplate**: Repository ports need implementation for each storage backend

### Mitigations
- Use code generation or templates for repository boilerplate
- Manager methods are thin wrappers around repository + registry calls
- Document the flow clearly for new developers

## 6. Implementation Plan

### Phase 1: Foundation
1. Define repository ports (`IntegrationRepositoryPort`, `AgentRepositoryPort`, `SessionRepositoryPort`)
2. Refine `IntegrationDto` and `AgentDto` DTOs
3. Define `IntegrationRuntime` interface

### Phase 2: Manager Ports
4. Complete `AgentManagerPort` with full interface
5. Refine `IntegrationManagerPort` to include factory method
6. Define `ToolManagerPort`

### Phase 3: Use Cases
7. Implement `InferUseCase` with full flow
8. Implement CRUD usecases for Agent, Integration, Session

### Phase 4: Infrastructure
9. Implement repository adapters
10. Implement integration adapters (OpenAI first)
11. Implement tool manager adapter
12. Wire up application bootstrap

## 7. Related Architecture Decisions

- [ADR-002: Integration Separation and Validation](002-integration-separation-and-validation.md) — Refines separation of IntegrationDto from IntegrationRuntime, adds schema-based validation, removes IntegrationExecutor
- [ADR-003: Context-Session Separation and Rolling Window Design](003-context-session-separation-and-rolling-window.md) — Decouples context from persistence, adds TTL-based caching, defines rolling window with tiktoken

## 8. References

- [Hexagonal Architecture](https://herbertograca.com/2017/09/21/hexagonal-architecture/)
- [Implementation Plan](../implementation-plan.md) — Consolidated implementation plan across all ADRs
- `src_old/application/usecases/ChatMessage.usecase.ts` - Reference implementation
