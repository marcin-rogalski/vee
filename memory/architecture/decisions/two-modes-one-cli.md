---
type: architecture-decision
slug: two-modes-one-cli
status: proposed
created: 2026-05-21
last_synced: 
references: [src/infrastructure/utilities/CLI.ts, src/cli.ts]
related_decisions: [commander-aligned-commands, composition-root]
summary: CLI class handles both command mode and interactive mode from one entry point
---

# Two Modes, One CLI Class

## What
`CLI.run()` detects mode from argv: arguments present → command dispatch, no args → Ink TUI.

## Why
Single tool, two interaction styles. Users expect `vee` (no args) to open the interactive app and `vee agents list` to run a command.

## Alternatives
- Separate binaries (`vee`, `vee-ui`) — rejected: single package, single entry point preferred
- Flag-based (`vee --interactive`) — rejected: implicit mode is more natural

## Tradeoffs
- Gain: single CLI surface, shared dependencies
- Lose: CLI class must know about both modes

## Consequences for code
- `CLI.run(args)` checks `args.length === 0` to decide mode
- Both modes share injected use cases
- CLI class is the mode router, not a command dispatcher
