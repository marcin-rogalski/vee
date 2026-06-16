# Infer Use Case Audit

_Created: 2026-06-16_

Comprehensive audit of `InferUseCase` covering concept, architecture, and implementation layers.

---

## Concept Layer

### What inference is

Inference in an LLM-based agent system is a **conversation loop** with these phases:

1. **Input** — User sends a prompt
2. **Context Assembly** — Gather system prompt + conversation history + (future: skills, MCP tools)
3. **Provider Call** — Stream tokens from the LLM
4. **Tool Orchestration** — If the LLM requests tool calls, execute them, feed results back, loop
5. **Persistence** — Save all entries (user prompt, assistant responses, tool results) to context
6. **Streaming Output** — Emit events to UI consumers in real-time

### Conceptual Gaps

| # | Gap | Impact |
|---|---|---|
| C1 | No cancellation mechanism | Once started, the loop runs to completion. No way to abort mid-inference (user presses Ctrl+C, timeout, etc.) |
| C2 | No max iterations guard | `while(true)` with no guard against infinite tool-call loops. A misbehaving tool could loop forever |
| C3 | No result returned | `execute()` returns `Promise<void>`. Caller has no way to know the final response, error state, or token usage |
| C4 | No structured error handling | Provider errors propagate raw. No distinction between "provider timeout" vs "invalid API key" vs "rate limited" |
| C5 | No token budget tracking | No way to track cost or enforce a token limit per inference run |
| C6 | Context compaction is reactive | `shouldCompact()` checks before each provider call, but the decision lives in the provider. The usecase can't enforce policy |

---

## Architecture Layer

### Current dependency graph

```
InferUseCase depends on:
  ├── SessionRepositoryPort   (reads session)
  ├── ContextRepositoryPort   (appends/updates context)
  ├── ProviderRepositoryPort  (loads provider entity)
  ├── ProviderRegistryPort    (resolves entity → live provider)
  ├── AgentRepositoryPort     (loads agent)
  ├── ToolRegistryPort        (resolves tools by ID)
  └── EventBusPort            (publishes events)
```

### Antipatterns

| # | Antipattern | Location | Why it matters |
|---|---|---|---|
| A1 | Too many dependencies | Constructor (7 ports) | Violates DI principle — hard to test, hard to reason about. Some deps could be grouped or resolved upstream |
| A2 | Registry + Repository duality | `ProviderRepository` + `ProviderRegistry` | Two ports for one domain concept. Repository loads the entity, Registry resolves to live object. Could be one port with `getLive(id)` |
| A3 | Event bus as synchronous publish | `eventBus.publish()` returns `void` | Events are fire-and-forget. If a subscriber throws, it's silent. No backpressure. Mixes inference events with CRUD events (ISS-009) |
| A4 | Tool execution inside usecase | `tool.execute(args)` in loop | The usecase orchestrates tool calls inline. Tool errors aren't caught per-tool — one failing tool breaks the whole loop |
| A5 | Session repository unused | `sessionRepository` injected but never called | Dead dependency (ISS-010). Was likely meant to validate the session exists |
| A6 | Mutable `entry` variable | `let entry: ConversationEntry` at loop scope | Shared mutable state across iterations makes reasoning about which entry gets saved difficult |
| A7 | Promise.race for tool results | `Promise.race(pendingToolCalls)` | Race means first-completed tool returns, but results aren't ordered. Tool responses get appended in completion order, not call order |
| A8 | Context assembly in usecase | `getContext()` builds system prompt + history | Context building is a distinct concern. Should be a separate "ContextBuilder" that the usecase delegates to |

### Libraries worth considering

| Library | Purpose | Recommendation |
|---|---|---|
| `ai` (Vercel AI SDK) | Streaming, tool orchestration, context management | Could replace provider abstraction entirely — but locks us into their format. Premature now. |
| `@langchain/core` | Agent loops, tool orchestration | Too heavy for current scope. Revisit if we need multi-agent or complex chains. |
| `eventemitter3` | Typed event emitter | Better than custom InMemoryEventBus for pub/sub. Low effort swap. |
| `AbortController` | Cancellation | Standard, already in Node.js. Just needs wiring through. **High priority.** |

---

## Implementation Layer

### Current execute() flow

```
1. Load agent, provider, tools
2. Create user entry, publish + persist
3. while(true):
   a. Build context (system + history)
   b. for await provider events:
      - token → accumulate, publish
      - tool-call → save entry, queue tool executions
   c. If tool calls pending:
      - Race them, publish results, persist
      - Continue loop
   d. Break
```

### Specific Issues

| # | Issue | Severity | Description |
|---|---|---|---|
| I1 | `pendingTokens` never saved to context if no tool call | 🔴 Critical | Final tokens only exist in `pendingTokens` array; they're never persisted as a conversation entry when the response is text-only |
| I2 | `Promise.race` loses ordering | 🔴 Critical | Replace with `Promise.allSettled` to preserve order and handle partial failures |
| I3 | No `done` event published | 🟡 Medium | Event bus has a `done` envelope type but it's never published |
| I4 | No error event on failure | 🟡 Medium | If provider throws mid-stream, no `error` event is published |
| I5 | `sessionRepository` injected but unused | 🟡 Medium | Dead dependency — remove or use for validation |
| I6 | `entry` variable reused across iterations | 🟢 Low | Use scoped constants per event type |
| I7 | Tool error breaks entire loop | 🔴 Critical | Wrap each tool execution in try/catch, publish error as tool response |
| I8 | No max iterations guard | 🔴 Critical | Add counter with configurable max (default 10) |

### Test Coverage Gaps

| # | Gap | Description |
|---|---|---|
| T1 | No test for tool-call loop | Mock only returns tokens, never tool calls |
| T2 | No test for context compaction path | `shouldCompact()` returning true is never tested |
| T3 | No test for error propagation from provider stream | Provider throwing mid-stream is not tested |
| T4 | No test for multiple tool calls in one response | Only single tool-call scenario covered |
| T5 | No test for tool execution failure | Tool throwing is not tested |

---

## Recommended Fix Order

1. **Fix critical bugs** — I1 (tokens not persisted), I2 (Promise.race ordering), I7 (tool error handling)
2. **Add safety guards** — I8 (max iterations), I4 (error events)
3. **Clean up** — I5 (dead dependency), I6 (mutable state), I3 (done event)
4. **Extract ContextBuilder** — Separate context assembly concern
5. **Add AbortSignal support** — Cancellation throughout the chain
6. **Return structured result** — Change return type from `void` to `InferenceResult`
7. **Add missing tests** — T1–T5
