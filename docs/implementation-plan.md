# Implementation Plan

## Overview

This document consolidates the implementation steps from ADR-001, ADR-002, and ADR-003 into a single, ordered plan. Each task references the ADR(s) that justify it.

**Status**: Planning  
**Last Updated**: 2026-05-10

---

## Phase 1: DTO Foundation

### 1.1 Update `ContextEntryDto` — Already Complete
- **File**: [`src/application/dto/ContextEntry.dto.ts`](src/application/dto/ContextEntry.dto.ts)
- **Status**: ✅ Already matches ADR-003 specification
- **Content**: Discriminated union with `system`, `user`/`assistant`, `tool-call`, `tool-result` variants

### 1.2 Update `ContextDto` — Synchronous Push, Add History and Token Count
- **File**: [`src/application/dto/Context.dto.ts`](src/application/dto/Context.dto.ts)
- **Current**: `push(...entries): Promise<void>` (async)
- **Required** (per ADR-003 §4.1):
  ```typescript
  interface ContextDto {
    readonly entries: ContextEntryDto[]    // current rolling window
    readonly history: ContextEntryDto[]    // full accumulated history
    readonly tokenCount: number            // tokens in entries

    push(...entries: ContextEntryDto[]): void      // synchronous
    startTurn(prompt: string): void
    commitTurn(): void
    getStats(): ContextStats
  }

  interface ContextStats {
    sessionId: string
    tokensUsed: number
    tokenUsage: string
    tokenPct: string
    promptSnippet?: string
    responseSnippet?: string
  }
  ```
- **ADR Reference**: ADR-003 §4.1

### 1.3 Update `ChatSessionDto` — Already Complete
- **File**: [`src/application/dto/Session.dto.ts`](src/application/dto/Session.dto.ts)
- **Status**: ✅ Already matches ADR-001/003 specification
- **Content**: `id`, `agentId`, `history: ContextEntryDto[]`

### 1.4 Update `AgentDto` — Add System Prompt and Token Limit
- **File**: [`src/application/dto/Agent.dto.ts`](src/application/dto/Agent.dto.ts)
- **Current**:
  ```typescript
  interface AgentDto<ModelConfiguration extends object = object> {
    id: string
    integrationId: string
    model: ModelConfiguration
  }
  ```
- **Required** (per ADR-003 §4.5):
  ```typescript
  interface AgentDto<ModelConfiguration extends object = object> {
    id: string
    name: string
    integrationId: string
    model: ModelConfiguration
    systemPrompt?: string    // temporary
    tokenLimit?: number      // temporary
  }
  ```
- **ADR Reference**: ADR-003 §4.5

### 1.5 `IntegrationDto` — Already Complete
- **File**: [`src/application/dto/Integration.dto.ts`](src/application/dto/Integration.dto.ts)
- **Status**: ✅ Already matches ADR-002 specification (pure data, no methods)

### 1.6 `InferenceEventDto` — Already Complete
- **File**: [`src/application/dto/InferenceEvent.dto.ts`](src/application/dto/InferenceEvent.dto.ts)
- **Status**: ✅ Already matches specification

### 1.7 `ToolDefinitionDto` — Already Complete
- **File**: [`src/application/dto/ToolDefinition.dto.ts`](src/application/dto/ToolDefinition.dto.ts)
- **Status**: ✅ Already matches specification

---

## Phase 2: Port Definitions

### 2.1 Update `ContextManagerPort` — Accept Session + Agent, Add Dispose
- **File**: [`src/application/ports/ContextManager.port.ts`](src/application/ports/ContextManager.port.ts)
- **Current**:
  ```typescript
  interface ContextManagerPort {
    getContext(sessionId: string): Promise<Context>
  }
  ```
- **Required** (per ADR-003 §4.2):
  ```typescript
  import type ContextDto from '@application/dto/Context.dto'
  import type ChatSessionDto from '@application/dto/Session.dto'
  import type AgentDto from '@application/dto/Agent.dto'

  interface ContextManagerPort {
    getContext(session: ChatSessionDto, agent: AgentDto): Promise<ContextDto>
    dispose(): void
  }
  ```
- **ADR Reference**: ADR-003 §4.2

### 2.2 `IntegrationRuntimePort` — Already Complete
- **File**: [`src/application/ports/IntegrationRuntime.port.ts`](src/application/ports/IntegrationRuntime.port.ts)
- **Status**: ✅ Already matches ADR-002 specification (configSchema, modelSchema, infer)

### 2.3 `IntegrationManagerPort` — Already Complete
- **File**: [`src/application/ports/IntegrationManager.port.ts`](src/application/ports/IntegrationManager.port.ts)
- **Status**: ✅ Already matches ADR-002 specification

### 2.4 `AgentManagerPort` — Already Complete
- **File**: [`src/application/ports/AgentManager.port.ts`](src/application/ports/AgentManager.port.ts)
- **Status**: ✅ Already matches ADR-001 specification

### 2.5 Define `ToolManagerPort`
- **File**: [`src/application/ports/ToolManager.port.ts`](src/application/ports/ToolManager.port.ts) — **NEW**
- **Required** (per ADR-001 §4.2):
  ```typescript
  import type ToolDefinitionDto from '@application/dto/ToolDefinition.dto'

  interface ToolManagerPort {
    getTools(): Promise<ToolDefinitionDto[]>
    executeTool(toolName: string, args: Record<string, unknown>): Promise<string>
  }
  ```
- **ADR Reference**: ADR-001 §4.2, ADR-003 §4.1

### 2.6 Repository Ports — Already Complete
- **Files**:
  - [`src/application/ports/AgentRepository.port.ts`](src/application/ports/AgentRepository.port.ts) ✅
  - [`src/application/ports/IntegrationRepository.port.ts`](src/application/ports/IntegrationRepository.port.ts) ✅
  - [`src/application/ports/SessionRepository.port.ts`](src/application/ports/SessionRepository.port.ts) ✅
- **Status**: All match ADR-001 §4.3 specification

---

## Phase 3: Service Implementations

### 3.1 Create `RollingWindowContext` Implementation
- **File**: [`src/application/services/RollingWindowContext.ts`](src/application/services/RollingWindowContext.ts) — **NEW**
- **Required** (per ADR-003 §4.3, §4.4):
  ```typescript
  import type ContextDto from '@application/dto/Context.dto'
  import type ContextEntryDto from '@application/dto/ContextEntry.dto'
  import type ChatSessionDto from '@application/dto/Session.dto'
  import type AgentDto from '@application/dto/Agent.dto'

  class RollingWindowContext implements ContextDto {
    constructor(
      private readonly session: ChatSessionDto,
      private readonly agent: AgentDto,
    )

    readonly entries: ContextEntryDto[]
    readonly history: ContextEntryDto[]
    readonly tokenCount: number

    push(...entries: ContextEntryDto[]): void
    startTurn(prompt: string): void
    commitTurn(): void
    getStats(): ContextStats
  }
  ```
- **Key behaviors**:
  - Constructor initializes from `session.history`
  - Reads `agent.systemPrompt` (optional, pinned entry)
  - Reads `agent.tokenLimit` (optional, default to provider max)
  - `push()` is synchronous — no DB calls
  - Uses `tiktoken` (cl100k_base) for token counting
  - `computeWindow()` prunes oldest entries when token budget exceeded
  - Pinned entries (system prompt, current turn) always count against budget
- **ADR Reference**: ADR-003 §4.3, §4.4

### 3.2 Create `ContextManager` Implementation
- **File**: [`src/application/services/ContextManager.ts`](src/application/services/ContextManager.ts) — **NEW**
- **Required** (per ADR-003 §4.2):
  ```typescript
  import type ContextManagerPort from '@application/ports/ContextManager.port'
  import type ContextDto from '@application/dto/Context.dto'
  import type ChatSessionDto from '@application/dto/Session.dto'
  import type AgentDto from '@application/dto/Agent.dto'

  type CacheEntry<T> = {
    context: ContextDto
    lastRead: number
  }

  class ContextManager implements ContextManagerPort {
    private readonly sessionCache = new Map<string, { data: ChatSessionDto; lastRead: number }>()
    private readonly contextCache = new Map<string, CacheEntry>()
    private readonly evictionTimer: ReturnType<typeof setInterval>

    private readonly TTL_MS = 15 * 60 * 1000
    private readonly EVICTION_INTERVAL_MS = 60 * 1000

    getContext(session: ChatSessionDto, agent: AgentDto): Promise<ContextDto>
    dispose(): void
  }
  ```
- **Key behaviors**:
  - TTL-based caching for both sessions and contexts
  - On `getContext()`: cache session, check context cache, create `RollingWindowContext` on miss
  - Eviction timer runs every 60s, removes entries idle >15 minutes
  - `dispose()` clears timer on shutdown
- **ADR Reference**: ADR-003 §4.2, §4.6

---

## Phase 4: Use Case Updates

### 4.1 Update `InferUseCase` — Align with ADR-003
- **File**: [`src/application/usecases/Infer.usecase.ts`](src/application/usecases/Infer.usecase.ts)
- **Current issues**:
  - Missing imports: `SessionManagerPort`, `ToolManagerPort`
  - Typo: `integartion` → `integration`
  - `await context.push(...)` should be `context.push(...)` (synchronous)
  - Missing explicit `sessionRepo.save()` after `commitTurn()`
  - `contextManager.getContext(sessionId)` should be `contextManager.getContext(session, agent)`
- **Required** (per ADR-003 §4.1):
  ```typescript
  import type InferenceEventDto from '@application/dto/InferenceEvent.dto'
  import type ContextDto from '@application/dto/Context.dto'
  import type ContextEntryDto from '@application/dto/ContextEntry.dto'
  import type AgentManagerPort from '@application/ports/AgentManager.port'
  import type ContextManagerPort from '@application/ports/ContextManager.port'
  import type IntegrationManagerPort from '@application/ports/IntegrationManager.port'
  import type SessionRepositoryPort from '@application/ports/SessionRepository.port'
  import type LoggerPort from '@application/ports/Logger.port'
  import type ToolManagerPort from '@application/ports/ToolManager.port'

  interface PendingToolCall {
    id: string
    toolName: string
    toolArguments: Record<string, unknown>
    ts: number
  }

  class InferUseCase {
    constructor(
      readonly logger: LoggerPort,
      readonly sessionManager: SessionManagerPort,
      readonly contextManager: ContextManagerPort,
      readonly agentManager: AgentManagerPort,
      readonly integrationManager: IntegrationManagerPort,
      readonly toolManager: ToolManagerPort,
      readonly sessionRepo: SessionRepositoryPort,
    ) {}

    async *execute(sessionId: string, prompt: string): AsyncGenerator<InferenceEventDto> {
      const session = await this.sessionManager.get(sessionId)
      const agent = await this.agentManager.get(session.agentId)
      const context = await this.contextManager.getContext(session, agent)
      const tools = await this.toolManager.getTools()
      const integration = await this.integrationManager.get(agent.integrationId)

      context.startTurn(prompt)

      let done = false
      while (!done) {
        let chunkText = ''
        const toolCalls: PendingToolCall[] = []

        for await (const event of integration.infer(agent.model, context.entries, tools)) {
          yield event
          if (event.type === 'token') chunkText += event.data.content
          if (event.type === 'tool-call') {
            toolCalls.push({
              id: event.data.id,
              toolName: event.data.name,
              toolArguments: event.data.arguments,
              ts: Date.now(),
            })
          }
        }

        if (chunkText) {
          context.push({ author: 'assistant', content: chunkText, ts: Date.now() })
        }

        if (toolCalls.length) {
          context.push(...toolCalls.map(({ id, toolName, toolArguments, ts }) => ({
            author: 'tool-call', id, name: toolName, arguments: toolArguments, ts,
          })))

          for (const { id, toolName, toolArguments } of toolCalls) {
            const toolResult = await this.toolManager.executeTool(toolName, toolArguments)
            yield { type: 'tool-response', data: { toolCallId: id, result: toolResult } }
            context.push({ author: 'tool-result', id, result: toolResult, ts: Date.now() })
          }
        } else {
          done = true
        }
      }

      context.commitTurn()
      await this.sessionRepo.save(session)  // explicit persistence
    }
  }
  ```
- **ADR Reference**: ADR-003 §4.1

### 4.2 `SessionManagerPort` — Define
- **File**: [`src/application/ports/SessionManager.port.ts`](src/application/ports/SessionManager.port.ts) — **NEW**
- **Required** (per ADR-001 §4.5, ADR-003 §4.1):
  ```typescript
  import type ChatSessionDto from '@application/dto/Session.dto'

  interface SessionManagerPort {
    get(id: string): Promise<ChatSessionDto>
  }
  ```
- **Note**: The `SessionManager` is a thin wrapper around `SessionRepositoryPort` with optional caching. It is NOT the same as `SessionRepositoryPort`.
- **ADR Reference**: ADR-001 §4.5

### 4.3 CRUD Use Cases — Already Complete
- **Files**:
  - [`src/application/usecases/AgentUpsert.usecase.ts`](src/application/usecases/AgentUpsert.usecase.ts) ✅
  - [`src/application/usecases/AgentDelete.usecase.ts`](src/application/usecases/AgentDelete.usecase.ts) ✅
  - [`src/application/usecases/AgentList.usecase.ts`](src/application/usecases/AgentList.usecase.ts) ✅
  - [`src/application/usecases/IntegrationUpsert.usecase.ts`](src/application/usecases/IntegrationUpsert.usecase.ts) ✅
  - [`src/application/usecases/IntegrationDelete.usecase.ts`](src/application/usecases/IntegrationDelete.usecase.ts) ✅
  - [`src/application/usecases/IntegrationList.usecase.ts`](src/application/usecases/IntegrationList.usecase.ts) ✅
  - [`src/application/usecases/SessionUpsert.usecase.ts`](src/application/usecases/SessionUpsert.usecase.ts) ✅
  - [`src/application/usecases/SessionDelete.usecase.ts`](src/application/usecases/SessionDelete.usecase.ts) ✅
  - [`src/application/usecases/SessionList.usecase.ts`](src/application/usecases/SessionList.usecase.ts) ✅
- **Status**: All match ADR-001 specification (thin wrappers around managers/repositories)

---

## Phase 5: Infrastructure Adapters

### 5.1 Create `SessionManager` Implementation
- **File**: [`src/infrastructure/services/SessionManager.adapter.ts`](src/infrastructure/services/SessionManager.adapter.ts) — **NEW**
- **Implementation**: Thin wrapper around `SessionRepositoryPort` with optional TTL caching
- **ADR Reference**: ADR-001 §4.5

### 5.2 Create `ToolManager` Implementation
- **File**: [`src/infrastructure/services/ToolManager.adapter.ts`](src/infrastructure/services/ToolManager.adapter.ts) — **NEW**
- **Implementation**: Registry pattern for tool discovery and execution
- **ADR Reference**: ADR-001 §4.2

### 5.3 Create `IntegrationManager` Implementation
- **File**: [`src/infrastructure/services/IntegrationManager.adapter.ts`](src/infrastructure/services/IntegrationManager.adapter.ts) — **NEW**
- **Implementation**:
  - Registry of factory functions keyed by integration type
  - `upsert()` validates `dto.configuration` against `runtime.configSchema` before save
  - `get()` loads `IntegrationDto` from repository, instantiates runtime via registry
- **ADR Reference**: ADR-002 §4.3, §4.5

### 5.4 Create Integration Runtime Adapters
- **File**: [`src/infrastructure/adapters/OpenAIIntegrationRuntime.ts`](src/infrastructure/adapters/OpenAIIntegrationRuntime.ts) — **NEW**
- **Implementation**:
  ```typescript
  import type IntegrationRuntimePort from '@application/ports/IntegrationRuntime.port'

  class OpenAIIntegrationRuntime implements IntegrationRuntimePort {
    readonly configSchema = z.object({
      apiKey: z.string(),
      apiUrl: z.string().url().optional(),
    })

    readonly modelSchema = z.object({
      provider: z.literal('openai'),
      modelId: z.string(),
      // ... other model config fields
    })

    async infer(modelConfiguration, context, tools): AsyncGenerator<InferenceEventDto> {
      this.modelSchema.parse(modelConfiguration)
      // ... inference logic
    }
  }
  ```
- **ADR Reference**: ADR-002 §4.5

### 5.5 Repository Adapters — Already Complete
- **Files**:
  - [`src/infrastructure/driven/repositories/InMemoryAgentRepository.ts`](src/infrastructure/driven/repositories/InMemoryAgentRepository.ts) ✅
  - [`src/infrastructure/driven/repositories/InMemoryIntegrationRepository.ts`](src/infrastructure/driven/repositories/InMemoryIntegrationRepository.ts) ✅
  - [`src/infrastructure/driven/repositories/InMemorySessionRepository.ts`](src/infrastructure/driven/repositories/InMemorySessionRepository.ts) ✅
- **Status**: All match ADR-001 specification

---

## Phase 6: Application Bootstrap

### 6.1 Wire Up Application in `src/index.ts`
- **File**: [`src/index.ts`](src/index.ts)
- **Required** (per ADR-001 §4.4, ADR-002 §4.3):
  ```typescript
  async function main() {
    // Utilities
    const logger = new ConsoleLogger()
    const environment = new NodeEnvironment(logger)
    const server = new ExpressServer(environment.serverPort, logger)

    // Repositories (driven)
    const sessionRepo = new InMemorySessionRepository()
    const agentRepo = new InMemoryAgentRepository()
    const integrationRepo = new InMemoryIntegrationRepository()

    // Managers
    const sessionManager = new SessionManager(sessionRepo)
    const contextManager = new ContextManager()
    const agentManager = new AgentManager(agentRepo)
    const integrationManager = new IntegrationManager(integrationRepo)
    integrationManager.register('openai', createOpenAiIntegration)  // ADR-002 registry
    const toolManager = new ToolManager()

    // Use cases
    const inferUseCase = new InferUseCase(
      logger, sessionManager, contextManager, agentManager,
      integrationManager, toolManager, sessionRepo,
    )
    // ... other use cases

    // Endpoints (driving)
    // ... register endpoints that delegate to use cases

    server.register(/* endpoints */)
    await server.start()
  }
  ```
- **ADR Reference**: ADR-001 §4.4, ADR-002 §4.3

---

## Summary of Changes Needed

| # | Task | File | Status | ADR |
|---|------|------|--------|-----|
| 1.1 | `ContextEntryDto` | `ContextEntry.dto.ts` | ✅ Complete | — |
| 1.2 | **Update `ContextDto`** | `Context.dto.ts` | 🔴 Needs work | ADR-003 §4.1 |
| 1.3 | `ChatSessionDto` | `Session.dto.ts` | ✅ Complete | — |
| 1.4 | **Update `AgentDto`** | `Agent.dto.ts` | 🔴 Needs work | ADR-003 §4.5 |
| 1.5 | `IntegrationDto` | `Integration.dto.ts` | ✅ Complete | ADR-002 |
| 1.6 | `InferenceEventDto` | `InferenceEvent.dto.ts` | ✅ Complete | — |
| 1.7 | `ToolDefinitionDto` | `ToolDefinition.dto.ts` | ✅ Complete | — |
| 2.1 | **Update `ContextManagerPort`** | `ContextManager.port.ts` | 🔴 Needs work | ADR-003 §4.2 |
| 2.2 | `IntegrationRuntimePort` | `IntegrationRuntime.port.ts` | ✅ Complete | ADR-002 |
| 2.3 | `IntegrationManagerPort` | `IntegrationManager.port.ts` | ✅ Complete | ADR-002 |
| 2.4 | `AgentManagerPort` | `AgentManager.port.ts` | ✅ Complete | ADR-001 |
| 2.5 | **Create `ToolManagerPort`** | `ToolManager.port.ts` | 🔴 New file | ADR-001 §4.2 |
| 2.6 | Repository ports | `*Repository.port.ts` | ✅ Complete | ADR-001 §4.3 |
| 3.1 | **Create `RollingWindowContext`** | `RollingWindowContext.ts` | 🔴 New file | ADR-003 §4.3, §4.4 |
| 3.2 | **Create `ContextManager`** | `ContextManager.ts` | 🔴 New file | ADR-003 §4.2, §4.6 |
| 4.1 | **Update `InferUseCase`** | `Infer.usecase.ts` | 🔴 Needs work | ADR-003 §4.1 |
| 4.2 | **Create `SessionManagerPort`** | `SessionManager.port.ts` | 🔴 New file | ADR-001 §4.5 |
| 4.3 | CRUD use cases | `*usecase.ts` | ✅ Complete | ADR-001 |
| 5.1 | **Create `SessionManager`** | `SessionManager.adapter.ts` | 🔴 New file | ADR-001 §4.5 |
| 5.2 | **Create `ToolManager`** | `ToolManager.adapter.ts` | 🔴 New file | ADR-001 §4.2 |
| 5.3 | **Create `IntegrationManager`** | `IntegrationManager.adapter.ts` | 🔴 New file | ADR-002 §4.3 |
| 5.4 | **Create `OpenAIIntegrationRuntime`** | `OpenAIIntegrationRuntime.ts` | 🔴 New file | ADR-002 §4.5 |
| 5.5 | Repository adapters | `InMemory*Repository.ts` | ✅ Complete | ADR-001 |
| 6.1 | **Wire up bootstrap** | `index.ts` | 🔴 Needs work | ADR-001 §4.4 |

**Total**: 26 tasks, 11 complete, 15 remaining
