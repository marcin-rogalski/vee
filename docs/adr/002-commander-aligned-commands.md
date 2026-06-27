---
type: architecture-decision
slug: commander-aligned-commands
status: accepted
created: 2026-05-21
last_synced: 
references: [src/infrastructure/driving/commands/]
related_decisions: [cli-as-driving-interface]
summary: Existing commands refactored to match commander's API pattern
---

# Commander-Aligned Commands

## What
Existing command classes are refactored to match commander's command pattern instead of a custom CommandHandler interface.

## Why
Commander already handles argument parsing, help generation, and alias resolution. Aligning commands to its pattern means less custom code and commander gives a free port for command extensions.

## Alternatives
- Keep custom CommandHandler — rejected: reinvents argument parsing, harder to extend
- Use commander's callback style — rejected: loses command object structure, harder to test

## Tradeoffs
- Gain: commander handles parsing/help, less custom code, familiar to users
- Lose: commands must adapt to commander's API (name, options, action)

## Consequences for code
- Commands implement commander's interface: `.name`, `.options()`, `.action()`
- Help command adapted to list commander commands
- CLI class uses commander's `Command` class for dispatch
