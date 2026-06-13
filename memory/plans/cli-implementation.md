---
type: plan
slug: cli-implementation
status: draft
created: 2026-05-21
last_synced: 
references: [src/cli.ts, src/index.ts, src/infrastructure/utilities/CLI.ts, src/infrastructure/composition.ts, src/infrastructure/driving/commands/, src/infrastructure/driving/screens/]
related_decisions: [cli-as-driving-interface, two-modes-one-cli, commander-aligned-commands, composition-root, command-registration-pattern, screens-location]
summary: Implement CLI with command mode, interactive mode, and shared composition
---

# CLI Implementation

## Goal
Implement a CLI with two modes (command mode with args, interactive mode without) using commander, shared composition, and reusable screens.

## Out of scope
- Web GUI implementation (screens are ready for it)
- Persistence layer (file-based storage) — uses in-memory repos
- Authentication / authorization

## Open questions
- Should `composition.ts` export individual use cases or a single `Core` object? (resolve before T1)

## WBS
- [x] T1. Create `infrastructure/composition.ts` — core factory that builds shared dependencies (repositories, use cases, ports)
  - files: `src/infrastructure/composition.ts`
  - depends on: -
  - test: verify `buildCore()` returns all use cases and repositories

- [x] T2. Implement `infrastructure/utilities/CLI.ts` — CLI class with `register()` and `run()` methods
  - files: `src/infrastructure/utilities/CLI.ts`
  - depends on: T1
  - test: unit test CLI.register() stores commands, CLI.run() dispatches correctly

- [x] T3. Refactor all commands to work with commander — adapt HelpCommand, AgentsListCommand, AgentsUpsertCommand, AgentsDeleteCommand, SessionsListCommand, SessionsCreateCommand, SessionsDeleteCommand
  - files: `src/infrastructure/driving/commands/*.command.ts`
  - depends on: T2
  - test: each command passes existing unit tests with commander integration

- [x] T4. Move screens from `driving/cli/screens/` to `driving/screens/` — update all imports
  - files: `src/infrastructure/driving/screens/*`, `src/infrastructure/driving/cli/App.tsx`
  - depends on: T2
  - test: existing screen tests pass, App.tsx renders correctly

- [x] T5. Update `cli.ts` entry point — register commands, export `createCLI()`, call `run()`
  - files: `src/cli.ts`
  - depends on: T1, T2, T3
  - test: `npm run start:cli` with args dispatches to commands, without args renders TUI

- [x] T6. Update `index.ts` to use `composition.ts` — replace inline dependency wiring
  - files: `src/index.ts`
  - depends on: T1
  - test: `npm run start:server` starts HTTP server, routes work

- [x] T7. Add CLI dispatch tests — verify CLI registers commands and dispatches correctly
  - files: `src/infrastructure/utilities/CLI.unit.test.ts`
  - depends on: T2, T3
  - test: tests verify command registration, dispatch, mode detection

## Critical path
T1 → T2 → T3 → T5

## Walking skeleton
T1, T2, T5 — minimal end-to-end: composition → CLI class → working CLI with one command
