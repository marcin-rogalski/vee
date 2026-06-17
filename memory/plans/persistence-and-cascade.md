# Plan: Persistence, Caching & Cascade Deletes

**Status:** pending
**Created:** 2026-06-17
**Updated:** 2026-06-17

Unify persistence across all entities: JSON file storage with in-memory caching layer. Add cascade deletes for referential integrity. Add `agentId` to Session entity. Validate JSON on load.

## Decisions

- **JSON files remain the storage backend** — no database migration, keep it simple
- **In-memory cache lives in infrastructure** — not in domain/application layers. The cache is a write-through layer that sits between the repository port and the JSON file
- **TTL becomes cache eviction policy** — data persists on disk; TTL controls how long the in-memory cache holds entries before they're evicted (ISS-008)
- **Cascade deletes over block** — Provider→Agents, Agent→Sessions→Context→ChatMessages. User expects cleanup, not errors
- **Session gains `agentId`** — explicit association (ISS-006)
- **Schema validation on JSON load** — prevents silent corruption from manual edits (ISS-017)

## References

- ISS-002: Context orphaned on session delete
- ISS-006: Sessions lose agent association
- ISS-008: 10-minute TTL with silent deletion
- ISS-010: Dead port methods (ContextRepository.delete never called)
- ISS-014: Partial persistence (agents/providers JSON, rest in-memory)
- ISS-017: No schema validation on JSON load

## Tasks

### Phase 1: Session entity — add `agentId` field

1. [x] session-agentid-field — Add `agentId: string` to Session domain type, update SessionCreateUseCase to accept agentId, update InMemorySessionRepository.create(), update all tests
2. [x] session-agentid-http — Update HTTP SessionCreate.adapter to require agentId in request body
3. [x] session-agentid-cli — Update CLI SessionsCreate.command to require --agent option, update SessionsList to display agentId

### Phase 2: JSON persistence for Session, Context, ChatMessage

4. [ ] session-json-repo — Create `JsonSessionRepository` extending `JsonFileRepository<Session>`, replacing InMemorySessionRepository. Remove TTL cleanup timer (cache layer handles eviction)
5. [ ] context-json-repo — Create `JsonContextRepository` extending `JsonFileRepository<Map<string, ConversationEntry[]>>`. Key: sessionId → entries array. File: `~/.vee/context.json`
6. [ ] chatmessage-json-repo — Create `JsonChatMessageRepository` extending `JsonFileRepository<ChatMessage[]>`. File: `~/.vee/chat-messages.json`
7. [ ] composition-root-json — Update compositionRoot to use JSON repositories for all entities

### Phase 3: In-memory cache layer (write-through)

8. [ ] cache-base-class — Create `CachedRepository<T>` abstract base that wraps a JSON repository with an in-memory Map. Write-through: writes hit memory immediately, then persist to disk. Read-through: reads check memory first, fall back to disk on miss
9. [ ] cache-session — Create `CachedSessionRepository` extending `CachedRepository<Session>` with configurable TTL for cache eviction
10. [ ] cache-context — Create `CachedContextRepository` extending `CachedRepository<Map<string, ConversationEntry[]>>` with TTL
11. [ ] cache-chatmessage — Create `CachedChatMessageRepository` extending `CachedRepository<ChatMessage[]>` with TTL
12. [ ] cache-composition — Wire cached repos in compositionRoot: `CachedSessionRepository(JsonSessionRepository(...))` etc.

### Phase 4: Cascade deletes

13. [ ] cascade-session-delete — Update `SessionDeleteUseCase` to accept `ContextRepositoryPort` and `ChatMessageRepositoryPort`. On delete: remove session, context entries for sessionId, chat messages for sessionId
14. [ ] cascade-agent-delete — Update `AgentDeleteUseCase` to accept `SessionRepositoryPort`. On delete: find all sessions with matching agentId, cascade delete each (session → context → chatMessages)
15. [ ] cascade-provider-delete — Update `ProviderDeleteUseCase` to cascade delete agents instead of blocking. Remove ConflictError check, iterate agentIds from `listByProviderId`, delete each agent (which cascades to sessions)

### Phase 5: Schema validation on JSON load

16. [ ] schema-validation-base — Add `validateItem(item: T): boolean` abstract method to `JsonFileRepository`. Override in each concrete repo to validate against domain schema. Call on every `read()` — reject invalid items with a warning logged
17. [ ] schema-validation-provider — Implement `validateItem` in `JsonProviderRepository` using provider's own `configSchema` to validate `config`
18. [ ] schema-validation-agent — Implement `validateItem` in `JsonAgentRepository` checking required fields (id, name, systemPrompt, providerId)
19. [ ] schema-validation-session — Implement `validateItem` in `JsonSessionRepository` checking required fields (id, name, agentId, createdAt)

### Phase 6: Cleanup and verification

20. [ ] remove-inmemory-repos — Delete InMemorySessionRepository, InMemoryContextRepository, InMemoryChatMessageRepository (replaced by cached JSON repos)
21. [ ] update-tests — Update all unit tests that depended on in-memory repos to work with cached JSON repos (use temp file paths)
22. [ ] final-verification — Run `tsc --noEmit` and `biome check --fix --unsafe`, run full test suite

## Architecture After Plan

```
Repository Port (application/ports)
    ↑
CachedRepository<T> (infrastructure/driven/repositories/cache)
    ├── In-memory Map with TTL eviction
    └── Write-through to JSON file
        ↑
JsonFileRepository<T> (infrastructure/driven/repositories)
    ├── Schema validation on read()
    └── File I/O (readFile/writeFile)
```

Cascade delete chain:
```
Provider.delete() → Agent.delete() × N → Session.delete() × M → Context.delete(sessionId) + ChatMessage.delete(sessionId)
```
