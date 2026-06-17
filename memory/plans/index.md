# Plans index

## Active Plans

| Slug | Status | Summary |
|---|---|---|
| persistence-and-cascade | pending | JSON persistence + in-memory cache for all entities, cascade deletes, Session.agentId, schema validation on load |

## Completed Plans

| Slug | Status | Summary |
|---|---|---|
| inference-decomposition | done | Decompose InferUseCase into orchestrator + phase use cases + services |
| provider-entity-fix | done | Fix every known Provider issue (validation, cascade, commands, tests) |
| agent-entity-fix | done | Fix every known Agent issue (validation, cascade, commands, tests) |
| provider-json-schema-flow | done | Replace ConfigurationSchema DSL with JSON Schema |
| cli-refactor-decouple-screens | implemented | Decouple screens from god Client interface |

## Draft / Superseded Plans

| Slug | Status | Summary |
|---|---|---|
| cli-implementation | superseded | Original CLI plan — superseded by entity fix plans |
| code-quality-audit | superseded | Code quality rules — rules absorbed into AGENTS.md |
| typecheck-lint-fix | superseded | Initial typecheck fixes — already applied |

## Cross-References

- **ADRs**: `docs/adr/` (numbered, never deleted)
- **Issues**: `issues.md` (workspace root)
