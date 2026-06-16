# 008: Inference Decomposition — Orchestrator with Phase Use Cases and Services

**Date:** 2026-06-16
**Status:** accepted

## Context

The `InferUseCase` was doing everything in one class: loading dependencies, building context, streaming provider events, executing tools, persisting entries, and publishing events. This made it hard to test, reason about, and extend.

We need a backend that serves multiple frontend heads (CLI, web, app) simultaneously — the backend is the single source of truth for all conversation data.

## Decision

Decompose inference into an **orchestrator use case** that coordinates **phase use cases**, which in turn depend on **services** that wrap **repositories**.

### Layering

```
Orchestrator UseCase (loop owner, fire-and-forget)
  │
  ├── Phase UseCases (pure transformations, input → output)
  │     │
  │     ├── Services (domain behavior, wrap repos)
  │     │     │
  │     │     └── Repositories (persistence + cache, infra only)
  │     │
  │     └── Ports (event bus, provider, tools)
```

### Components

#### Orchestrator — `InferOrchestratorUseCase`

- Owns the inference loop (build → infer → tools → persist → repeat)
- Returns `void` — no data returned to caller
- Coordinates phase use cases in order
- Publishes events via `EventBusPort` for all connected frontend heads
- Depends on: phase use cases, services, event bus

#### Phase Use Cases

| Use Case | Input | Output |
|---|---|---|
| `BuildContextUseCase` | agent, sessionId, ContextService | `ConversationEntry[]` (system prompt + history) |
| `InferUseCase` | context, provider, config, tools | `{ tokens, toolCalls?, thoughts }` |
| `ExecuteToolsUseCase` | tool calls, sessionId | `ConversationEntry[]` (tool response entries) |

#### Services

| Service | Wraps | Domain Behavior |
|---|---|---|
| `ContextService` | `ContextRepositoryPort` | Build context (system prompt + history), append, compact with provider |
| `ChatMessageService` | `ChatMessageRepositoryPort` | Append-only chat messages for UI display |

#### Repositories

| Repository | Purpose |
|---|---|
| `ContextRepositoryPort` | LLM context entries (can be compacted/replaced). Cache is infra detail. |
| `ChatMessageRepositoryPort` | UI chat messages (append-only, never compacted) |

### The Loop

```
Resolve phase:
  agent = agentRepository.get(agentId)
  provider = providerRegistry.resolve(providerRepository.get(agent.providerId))
  tools = toolRegistry.resolve(agent.toolIds)

Persist user prompt:
  contextService.append(sessionId, userEntry)
  chatMessageService.create(sessionId, userEntry)
  eventBus.publish(prompt event)

Loop:
  context = contextService.build(agent, sessionId)
  result = inferUseCase.execute(context, provider, config, tools)

  contextService.append(sessionId, assistantEntry)
  chatMessageService.create(sessionId, assistantEntry)
  eventBus.publish(token/tool-call events)

  if result.hasToolCalls:
    toolResults = executeToolsUseCase(result.toolCalls, sessionId)
    contextService.append(sessionId, toolResultEntries)
    eventBus.publish(tool-response events)
    continue

  break
```

### Context vs Chat Messages

Two separate persistence tracks with different lifecycles:

| | Context | Chat Messages |
|---|---|---|
| **Purpose** | LLM input (system prompt + history) | UI display (what users see) |
| **Consumer** | Provider (via context array) | Frontends (CLI, web, app) |
| **Mutated by** | Inference loop + compaction | Append-only |
| **Can shrink** | Yes (compaction via provider) | No (historical record) |
| **System prompt stored?** | No (assembled from agent at build time) | No (not a chat message) |

Compaction rewrites context but never touches chat messages. They diverge after compaction — chat messages remain the full historical record.

### Cache

Cache is an **infrastructure concern** owned by the repository implementation. The service layer knows nothing about caching — it just calls `get()`, `append()`, `replace()` on the repository port.

### Compaction

Compaction lives in the `ContextService` which delegates to the provider:

```
contextService.compact(sessionId, provider):
  context = repository.get(sessionId)
  if provider.shouldCompact(context):
    compacted = provider.compact(context)
    repository.replace(sessionId, compacted)
```

The orchestrator checks compaction before each loop iteration (via `contextService.build()` which may trigger compaction).

## Consequences

### Positive

- **Testability** — each phase use case is independently testable with pure inputs/outputs
- **Separation of concerns** — context (LLM) and chat messages (UI) have independent lifecycles
- **Extensibility** — adding new phases (skills, MCP tools) is a new use case wired into the orchestrator
- **Multi-head support** — event bus drives all frontend heads; backend is single source of truth
- **Cache transparency** — caching is an infra detail, not a domain concern

### Negative

- **More files** — 1 class becomes 4–6 classes + services
- **Orchestrator complexity** — the loop logic is still non-trivial, just moved to a different class
- **New port needed** — `ChatMessageRepositoryPort` doesn't exist yet

### Migration

1. Create `ContextService` — extract `getContext()` and compaction logic from current `InferUseCase`
2. Create `ChatMessageRepositoryPort` and `ChatMessageService`
3. Extract `InferUseCase` as single-turn (provider call + stream)
4. Extract `ExecuteToolsUseCase` for tool batch execution
5. Create `InferOrchestratorUseCase` with the loop
6. Wire in composition root
7. Update tests incrementally
8. Delete old `InferUseCase`

## References

- Audit: `docs/infer-usecase-audit.md`
- Decomposition proposals: `docs/infer-usecase-decomposition.md`
