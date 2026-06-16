# Plan: Persistence Layer (JSON Files)

**Status:** in-progress
**Created:** 2026-06-16
**Updated:** 2026-06-16

Replace InMemoryAgentRepository and InMemoryProviderRepository with JSON file-based
implementations storing data in `~/.vee/`. Sessions and Context remain in-memory for now.

## Decisions

- Storage: JSON files (no new dependencies)
- Location: `~/.vee/` (user home directory)
- Structure: One file per entity type (`agents.json`, `integrations.json`)
- Scope: Agents + Providers only (config entities). Sessions/Context stay in-memory.
- No schema migrations needed for v1 — simple JSON arrays, evolve as needed.
- Reuse existing `NodeEnvironment` paths (`agentRepositoryPath`, `integrationRepositoryPath`)

## References

- Issue: ISS-014 (Epic — No persistence layer)

## Tasks

1. [x] persistence-create-adapter — Create JsonFileRepository base adapter with read/write/file management
2. [x] persistence-agent-repo — Create JsonAgentRepository implementing AgentRepositoryPort
3. [x] persistence-provider-repo — Create JsonProviderRepository implementing ProviderRepositoryPort
4. [x] persistence-composition-root — Wire JSON repos in compositionRoot.ts
5. [x] persistence-tests — Unit tests for both JSON repositories
6. [x] persistence-cleanup — Remove InMemoryAgentRepository and InMemoryProviderRepository
7. [ ] persistence-verification — Full verification run (tsc, tests, lint)
