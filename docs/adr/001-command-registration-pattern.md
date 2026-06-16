---
type: architecture-decision
slug: command-registration-pattern
status: proposed
created: 2026-05-21
last_synced: 
references: [src/cli.ts, src/infrastructure/utilities/CLI.ts]
related_decisions: [two-modes-one-cli]
summary: CLI exposes register() method, entry point registers commands
---

# Command Registration Pattern

## What
CLI class exposes a `register(command)` method. The entry point (cli.ts) imports commands, initializes them, and registers them. Tests verify CLI dispatches to registered commands.

## Why
The CLI class shouldn't hardcode its command list — that belongs in the entry point. This keeps CLI reusable and testable. The entry point is where the decision about "which commands are available" lives.

## Alternatives
- CLI constructor accepts command list — rejected: couples CLI to specific commands, hard to test in isolation
- Reflection/discovery — rejected: unreliable, slow, hidden dependencies

## Tradeoffs
- Gain: CLI is a plain dispatcher, testable without knowing commands
- Lose: entry point must import and wire all commands

## Consequences for code
- `CLI` has `register(command: CommanderCommand)` method
- `cli.ts` creates CLI instance, registers commands, calls `run()`
- Tests create CLI instance, register mock commands, verify dispatch
- Entry point exports `createCLI()` for testable composition
