# Plan: Inference Decomposition

**Status:** in-progress
**Created:** 2026-06-16
**Updated:** 2026-06-16

Decompose `InferUseCase` into an orchestrator + phase use cases + services, following ADR-008.

## Decisions

- Orchestrator owns the loop, returns void, communicates via event bus
- Phase use cases are pure transformations (input → output)
- Services wrap repositories with domain behavior
- Context and chat messages are separate persistence tracks
- Scaffold first with mocks, then implement each piece incrementally

## References

- ADR: `docs/adr/008-inference-decomposition.md`
- Audit: `docs/infer-usecase-audit.md`

## Tasks

### Phase 1 — Scaffold

1. [x] scaffold-ports — Create port interfaces for `ContextService`, `ChatMessageRepositoryPort`, `ChatMessageService`
2. [x] scaffold-usecases — Create stub phase use cases (`BuildContextUseCase`, `InferUseCase`, `ExecuteToolsUseCase`) with mock implementations
3. [x] scaffold-orchestrator — Create `InferOrchestratorUseCase` with real loop logic wired to stub use cases
4. [x] scaffold-tests — Add orchestrator unit tests with mocked sub-use cases

### Phase 2 — Context Service

5. [x] context-service — Implement `ContextService` (build, append, compact) wrapping `ContextRepositoryPort`
6. [x] context-service-tests — Add unit tests for context service

### Phase 3 — Build Context Use Case

7. [ ] build-context-usecase — Implement `BuildContextUseCase` using `ContextService`
8. [ ] build-context-tests — Add unit tests

### Phase 4 — Infer Use Case (single turn)

9. [ ] infer-usecase — Implement `InferUseCase` for single-turn inference (provider call + stream)
10. [ ] infer-usecase-tests — Add unit tests

### Phase 5 — Execute Tools Use Case

11. [ ] execute-tools-usecase — Implement `ExecuteToolsUseCase` (batch execution with proper ordering)
12. [ ] execute-tools-tests — Add unit tests

### Phase 6 — Chat Messages

13. [ ] chat-message-repo — Create `ChatMessageRepositoryPort` and in-memory implementation
14. [ ] chat-message-service — Implement `ChatMessageService` (append-only)
15. [ ] chat-message-tests — Add unit tests

### Phase 7 — Wire & Cleanup

16. [ ] wire-composition-root — Update composition root with all new components
17. [ ] update-command — Update `Infer.command.ts` to use orchestrator
18. [ ] remove-old-infer — Remove old `InferUseCase` and dead code
19. [ ] verification — Run full test suite, tsc, biome, verify all pass
