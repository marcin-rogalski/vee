# Architecture index

## Overview
- overview.md — last_synced: (none) — vee hexagonal app with CLI + HTTP

## Decisions
| Slug | Status | Summary | Created |
|---|---|---|---|
| cli-as-driving-interface | proposed | CLI commands and screens are driving interfaces | 2026-05-21 |
| two-modes-one-cli | proposed | CLI handles both command mode and interactive mode | 2026-05-21 |
| commander-aligned-commands | proposed | Commands refactored to match commander's API | 2026-05-21 |
| composition-root | proposed | Core composition in shared factory, entry points handle their own | 2026-05-21 |
| command-registration-pattern | proposed | CLI exposes register(), entry point registers commands | 2026-05-21 |
| screens-location | proposed | Screens at driving/screens/, reusable across CLI and web | 2026-05-21 |
