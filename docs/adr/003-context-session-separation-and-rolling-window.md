# ADR-003: Context-Session Separation and Rolling Window Design

## 1. Title

Decoupled Context Management with TTL-Cached ContextManager and Pure In-Memory RollingWindowContext

## 2. Status

Accepted

## 3. Context

The previous implementation (`src_old/application/services/RollingWindowContext.ts`) embedded persistence directly into the context object — `push()` called `sessionRepository.upsert()` synchronously. This created several problems:

- **Context depends on infrastructure**: `RollingWindowContext` received a `SessionRepositoryPort` in its constructor, violating the dependency inversion principle
- **Implicit persistence**: It was unclear from the use case what state was being persisted and when
- **Testing complexity**: Testing context logic required mocking the repository
- **Inflexible save strategy**: Every `push()` triggered a DB write, with no option for batching or deferred persistence

Additionally, the system needed:
- A caching layer for both sessions and contexts to avoid repeated DB reads
- Token-aware rolling window using `tiktoken` for accurate context sizing
- Per-agent configurable system prompt and token limit via `ModelConfigurationDto`

## 4. Decision

### 4.1 Context is Pure In-Memory, Use Case Owns Persistence

`ContextDto` is a fully internal, in-memory object with no repository dependencies. The use case explicitly persists session state after each turn.

**Context interface** (`ContextDto`):

```typescript
interface ContextDto {
  readonly entries: ContextEntryDto[]    // current rolling window

  push(...entries: ContextEntryDto[]): void      // synchronous
  startTurn(prompt: string): void
  commitTurn(): void
}
```

Note: `push()` is **synchronous** — no DB calls, no async overhead. The context only manages in-memory state.

**Use case flow** (InferUseCase):

```typescript
async *execute(agentId: string, sessionId: string, prompt: string): AsyncGenerator<InferenceEventDto> {
  const session = await this.sessionManager.get(sessionId)
  const agent = await this.agentManager.get(agentId)  // agentId from request, not session
  const context = await this.contextManager.getContext(session, agent)
  const tools = await this.toolManager.getTools()
  const integration = await this.integrationManager.get(agent.integrationId)

  context.startTurn(prompt)

  // Append prompt to session via sessionManager
  await this.sessionManager.appendMessages(sessionId, [{
    author: 'user', content: prompt, ts: Date.now()
  }])

  let done = false
  while (!done) {
    let chunkText = ''
    const toolCalls: PendingToolCall[] = []

    for await (const event of integration.infer(agent.model, context.entries, tools)) {
      yield event
      if (event.type === 'token') chunkText += event.data.content
      if (event.type === 'tool-call') {
        toolCalls.push({ id: event.data.id, toolName: event.data.name, toolArguments: event.data.arguments, ts: Date.now() })
      }
    }

    if (chunkText) {
      const entry = { author: 'assistant', content: chunkText, ts: Date.now() }
      await context.push(entry)
      await this.sessionManager.appendMessages(sessionId, [entry])
    }

    if (toolCalls.length) {
      const entries = toolCalls.map(({ id, toolName, toolArguments, ts }) => ({
        author: 'tool-call', id, name: toolName, arguments: toolArguments, ts
      }))
      context.push(...entries)
      await this.sessionManager.appendMessages(sessionId, entries)

      for (const { id, toolName, toolArguments } of toolCalls) {
        const result = await this.toolManager.executeTool(toolName, toolArguments)
        yield { type: 'tool-response', data: { toolCallId: id, result } }
        const resultEntry = { author: 'tool-result', id, result, ts: Date.now() }
        await context.push(resultEntry)
        await this.sessionManager.appendMessages(sessionId, [resultEntry])
      }
    } else {
      done = true
    }
  }

  context.commitTurn()
}
```

Key design decisions:
- `InferUseCase` accepts `agentId` from request (users can switch agents without session association)
- Session has no `agentId` field — agent identity comes from the request, not from session data
- `SessionManagerPort.appendMessages()` is called after each context entry to persist session state
- `SessionManagerPort` internally uses `SessionRepositoryPort` for persistence
- Session lifecycle (create/save) is managed by `InferUseCase` via `SessionManagerPort`

### 4.2 ContextManager with TTL-Based Caching

`ContextManager` owns two TTL-based caches: one for sessions and one for contexts. It creates `RollingWindowContext` instances on cache misses.

**Port interface** (`ContextManagerPort`):

```typescript
interface ContextManagerPort {
  getContext(session: ChatSessionDto, agent: AgentDto): Promise<ContextDto>
}
```

The port receives full `ChatSession` and `Agent` objects (not just IDs). This allows the use case to load session once and pass it to context creation.

Note: `ContextManagerPort` does NOT have a `dispose()` method — the context manager is not a disposable entity.

**Cache design**:

```typescript
class ContextManager implements ContextManagerPort {
  private readonly sessionCache = new Map<string, CacheEntry<SessionDto>>()
  private readonly contextCache = new Map<string, CacheEntry<ContextDto>>()
  private readonly evictionTimer: ReturnType<typeof setInterval>

  private readonly TTL_MS = 15 * 60 * 1000    // 15 minutes idle
  private readonly EVICTION_INTERVAL_MS = 60 * 1000  // 1 minute

  async getContext(session: SessionDto, agent: AgentDto): Promise<ContextDto> {
    this.cacheSession(session)

    const cached = this.contextCache.get(session.id)
    if (cached) {
      cached.lastRead = Date.now()
      return cached.context
    }

    const context = new RollingWindowContext(session, agent)
    this.contextCache.set(session.id, { context, lastRead: Date.now() })
    return context
  }
}
```

**Cache entry type**:

```typescript
type CacheEntry<T> = {
  data: T
  lastRead: number
}
```

**Eviction**: Periodic timer (every 60s) removes entries idle for >15 minutes. `dispose()` clears the timer on shutdown.

### 4.3 RollingWindowContext Constructor

```typescript
class RollingWindowContext implements ContextDto {
  constructor(
    private readonly session: SessionDto,
    private readonly agent: AgentDto,
  ) {
    // Initialize from session.history
    // Read systemPrompt from agent.systemPrompt
    // Read tokenLimit from agent.tokenLimit
    // Compute initial window
  }
}
```

The constructor receives the full `Session` and `Agent` objects. It extracts:
- `session.history` → initial history
- `agent.systemPrompt` → optional system prompt (pinned entry)
- `agent.tokenLimit` → token budget for rolling window

### 4.4 Token Counting with tiktoken

`RollingWindowContext` uses `tiktoken` (cl100k_base encoding) for token counting:

- `tokenCount` property returns tokens in current `entries`
- `computeWindow()` prunes oldest history entries when token budget is exceeded
- Pinned entries (system prompt, current turn) always count against budget

**Window computation**:

```
pinnedTokens = tokens(systemPrompt) + tokens(currentTurn)
budget = tokenLimit - pinnedTokens

window = []
for entry in history (reverse order):
  if tokens(entry) > budget: break
  window.unshift(entry)
  budget -= tokens(entry)

entries = [systemPrompt, ...window, ...currentTurn]
```

### 4.5 Model Configuration via Generic Type Parameter

`AgentDto` uses a generic type parameter `ModelConfiguration extends ModelConfigurationDto` for type-safe model configuration:

```typescript
interface AgentDto<
  ModelConfiguration extends ModelConfigurationDto = ModelConfigurationDto,
> {
  id: string
  integrationId: string
  model: ModelConfiguration
}
```

`ModelConfigurationDto` provides a base shape with common inference settings:

```typescript
interface ModelConfigurationDto {
  tokenLimit: number
  systemPrompt?: string
}
```

Infrastructure-layer types (e.g., `OpenAiModelConfig`) extend `ModelConfigurationDto` to add provider-specific fields:

```typescript
interface OpenAiModelConfig extends ModelConfigurationDto {
  provider: 'openai'
  modelId: string
  temperature?: number
  maxTokens?: number
}
```

This approach:
- Allows each integration to define its own model configuration shape
- Maintains type safety across the inference pipeline
- Provides `tokenLimit` and `systemPrompt` at the model configuration level, making them agent-specific
- Enables per-agent customization of system prompt and token limits without changing the agent structure

### 4.6 Session Caching in ContextManager

Sessions are also cached with the same TTL pattern. When `getContext()` receives a session object, it is stored in the session cache. This ensures that if the same session is passed multiple times (e.g., from different use case calls), the cached version is returned.

The session cache is keyed by `sessionId` and shares the same eviction timer.

## 5. Consequences

### Positive

- **Pure context logic**: `RollingWindowContext` is fully testable without DB mocks
- **Explicit persistence**: Use case clearly shows what is persisted and when
- **Synchronous push**: No async overhead for in-memory operations
- **TTL caching**: Both sessions and contexts benefit from reduced DB reads
- **Configurable per-agent**: System prompt and token limit are agent-specific
- **Easy to swap strategies**: Context implementation can change without affecting persistence

### Negative

- **Use case complexity**: Use case now orchestrates more steps (load, commit, save)
- **Two caches to manage**: Session and context caches need consistent lifecycle
- **Stale data risk**: Cached contexts may diverge from DB if use case crashes before save
- **tiktoken dependency**: Adds a native module dependency (encoding library)

### Mitigations

- Use case is the single source of truth for persistence flow
- Cache eviction runs on a fixed interval, cleanup on shutdown
- Stale data is acceptable for conversation context (best-effort caching)
- `tiktoken` is a well-maintained library with prebuilt binaries

## 6. Implementation Plan

### Completed

- [x] Update `ChatSessionDto` — remove `agentId`, add `createdAt`/`updatedAt` timestamps
- [x] Update `InferUseCase` — accept `agentId` + `sessionId` (throw error if missing), use `SessionManagerPort`
- [x] Remove `SessionUpsert` usecase (session lifecycle moved to Infer)
- [x] Create `ToolManagerPort` interface

### Pending

- [ ] Update `ContextDto` interface — add `history`, `tokenCount`, make `push()` synchronous
- [ ] Update `ContextManagerPort` — accept `SessionDto` + `AgentDto`, add `dispose()`
- [ ] Create `RollingWindowContext` implementation — token counting, window computation
- [ ] Create `ContextManager` implementation — TTL caching, eviction timer
- [ ] Update `AgentDto` — add `systemPrompt?` and `tokenLimit?`
- [ ] Update `InferUseCase` — explicit session save after `commitTurn()`
- [ ] Update `SessionDto` if needed for caching compatibility

## 7. Related Architecture Decisions

- [ADR-001: Infer Flow Architecture](001-infer-flow-architecture.md) — Establishes manager-based orchestration pattern
- [ADR-002: Integration Separation and Validation](002-integration-separation-and-validation.md) — Separates persistence DTOs from runtime interfaces

This ADR refines ADR-001 by:
- Clarifying that context is pure in-memory, not a persistence-aware object
- Adding TTL-based caching layer in `ContextManager`
- Defining the rolling window token strategy

## 8. References

- [Implementation Plan](../implementation-plan.md) — Consolidated implementation plan across all ADRs
- `src_old/application/services/RollingWindowContext.ts` — Reference implementation (embedded persistence)
- `src_old/application/services/ChatContextManager.ts` — Reference caching pattern
- `src/application/dto/Context.dto.ts` — Current (to be updated)
- `src/application/ports/ContextManager.port.ts` — Current (to be updated)
- `src/application/usecases/Infer.usecase.ts` — Current (to be updated)
