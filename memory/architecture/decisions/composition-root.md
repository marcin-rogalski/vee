---
type: architecture-decision
slug: composition-root
status: proposed
created: 2026-05-21
last_synced: 
references: [src/infrastructure/composition.ts]
related_decisions: [two-modes-one-cli]
summary: Core composition in shared factory, entry points handle their own composition
---

# Composition Root

## What
`src/infrastructure/composition.ts` provides a core factory that builds shared dependencies (repositories, registries, config). Entry points (cli.ts, index.ts) handle their own entry-point-specific composition.

## Why
Multiple entry points (CLI, HTTP server, future web GUI) need the same use cases and repositories. A single factory avoids duplication. But entry points differ in what they need (e.g., CLI needs Ink, HTTP needs Express), so composition shouldn't be too deep.

## Alternatives
- Single monolithic factory — rejected: forces entry points to depend on unused things
- Composition in each entry point — rejected: duplicated dependency wiring

## Tradeoffs
- Gain: shared dependencies wired once, entry points stay simple
- Lose: one additional file

## Consequences for code
- `composition.ts` exports `buildCore()` returning use cases and shared ports
- `cli.ts` calls `buildCore()`, adds CLI-specific deps, registers commands
- `index.ts` calls `buildCore()`, adds HTTP-specific deps, mounts routes
- Tests can call `buildCore()` directly for isolated testing
