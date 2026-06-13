---
type: architecture-decision
slug: cli-as-driving-interface
status: proposed
created: 2026-05-21
last_synced: 
references: [src/infrastructure/driving/]
related_decisions: [commander-aligned-commands, two-modes-one-cli, screens-location]
summary: CLI commands and screens are driving interfaces under infrastructure/driving/
---

# CLI as Driving Interface

## What
CLI commands and interactive screens live under `infrastructure/driving/`, mirroring HTTP adapters.

## Why
Both CLI and HTTP are driving interfaces — the user drives the application through them. They share the same use cases (application layer).

## Consequences for code
- Commands go in `infrastructure/driving/commands/`
- Screens go in `infrastructure/driving/screens/`
- Both inject the same use case instances from the application layer
