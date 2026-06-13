# Code Quality Audit — Implementation Plan

## Goal
Apply high-value rules from `.artifacts/code-quality-rules.md` to the project, starting with the Dependency Rule and working through each rule sequentially.

## Tasks

### 1. Enforce Dependency Rule (AGENTS.md)
- Add Dependency Rule to AGENTS.md as a project-level rule
- Anchor it to hexagonal (ports & adapters) architecture
- Define the layer structure (domain → application → infrastructure)
- Document what "knowing nothing about outer layers" means concretely
- Status: **pending**

### 2. Enforce Port/Adapter Pattern
- Verify ports are interfaces in application layer, implementations in infrastructure
- Document the pattern as a rule
- **COMPLETED**: Removed `CorePort` interface, moved `composition.ts` → `src/compositionRoot.ts`, renamed entry points to `entryCli.ts` / `entryServer.ts`, updated all imports
- Status: **completed**

### 3. No Framework Coupling
- Rule: domain/application must not import framework classes
- Status: **pending**

### 4. Testability by Design
- Pure functions/classes in domain are trivially testable
- Infrastructure isolated behind ports
- Status: **pending**

### 5. File Organization
- One file, one export. Named exports only.
- Status: **pending**

### 6. Testing Trophy — Shift Strategy
- Prioritize: Static (TS/lint) > E2E > Integration > Unit
- Minimize mocking in tests
- Test user-visible behavior, not internals
- Status: **pending**

### 7. Testability Rules — SOLID
- Dependency injection via constructors
- Pure functions where possible
- No global state
- Single responsibility (≤4 params, ≤20 lines)
- Status: **pending**

## Dependencies
- Task 1 must be completed before proceeding (foundational rule)
- Tasks 2-5 build on the architectural foundation
- Task 6 is independent (testing strategy)
- Task 7 is independent (code review criteria)

## Walking Skeleton
1. Add Dependency Rule to AGENTS.md
2. Verify current codebase already follows it (no inward violations)
3. Document as a rule that AI must enforce on future changes
