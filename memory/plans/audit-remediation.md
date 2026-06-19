# Plan: Audit Remediation

**Status:** in_progress
**Created:** 2026-06-19
**Updated:** 2026-06-19

Comprehensive audit of the codebase revealed 41 issues across architecture, code quality, test coverage, performance, and security. This plan addresses the trivial fixes in two phases, then defers non-trivial items for separate planning.

## Decisions

- Phase 1 & 2 handle only trivial fixes (no architecture changes, no external libraries, no non-obvious choices)
- Phase 3 items will be planned separately after phases 1 & 2 complete
- Cache repositories will use `Map` with ID keys for O(1) lookups instead of array filtering
- Chat messages capped at 100 per session (oldest removed first) to bound growth
- Context rebuild per inference loop iteration is acceptable for current scale — marked with code comment only

## References

- Audit findings: conversation transcript

## Tasks

### Phase 1: Critical — Trivial Fixes ✅ COMPLETE

1. [x] move-chatmessage-to-domain — Move `ChatMessage` type from port file to `domain/ChatMessage.ts` (#2)
2. [x] deduplicate-providerevent — Remove duplicate `ProviderEvent` from `ProviderBase.ts`, import from port (#3)
3. [x] sessioncreate-validation-error — Replace plain `Error` with `ValidationError` in SessionCreate (#8)
4. [x] agentupsert-tool-error-error-handling — Wrap `toolRegistry.get()` with contextual error in AgentUpsert (#9)
5. [x] add-listbyagentid — Add `listByAgentId` to SessionRepositoryPort and update AgentDelete (#25)

### Phase 2: Non-Critical — Trivial Fixes ✅ COMPLETE

6. [x] cache-map-refactor — Refactor cache repositories to use `Map` with ID keys (#6)
7. [x] single-tool-resolution-loop — Combine two `toolRegistry.get()` passes in InferOrchestrator (#5)
8. [x] delete-existence-checks — Add `get()` before `delete()` in all delete usecases (#7)
9. [x] consolelogger-stderr — Route error-level logs to stderr in ConsoleLogger (#14)
10. [x] process-import-shadowing — Remove `import * as process` from NodeEnvironment (#15)
11. [x] message-size-limit — Cap messages at 100 per session in chat message repositories (#28)
12. [x] cache-test-coverage — Add comprehensive tests for all three cache repositories (#20)
13. [x] context-rebuild-comment — Add code comment noting context rebuild pattern in InferOrchestrator (#27)

### Phase 3: Non-Trivial — Plan Separately

| # | Issue | Why Non-Trivial |
|---|-------|-----------------|
| 1 | Anemic domain models | Class vs factory pattern, validation scope, migration strategy |
| 10 | Cache casting bug (list → full entity) | Design decision: `listFull()` port method vs cache hydration redesign |
| 11 | EventBus error handling | Error propagation strategy (swallow, retry, unsubscribe, bubble) |
| 12 | ExpressEndpoint `any` types | Express type surface, custom middleware types |
| 16–19 | Test coverage gaps (integration, InferOrchestrator, InferTurn, ExecuteTools) | Mock strategy, test infrastructure, provider simulation |
| 37 | Path traversal in file tools | Allowed directory scope, sandboxing strategy |
| 38 | Plain text API keys | Encryption approach, key management, backward compatibility |
| 39 | No rate limiting | Limits, storage backend, exemption rules |
| 40 | No HTTP authentication | Auth strategy (API key, JWT, none for local-only) |
