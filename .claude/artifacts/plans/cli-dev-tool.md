---
type: plan
slug: cli-dev-tool
status: implemented
created: 2026-05-06
last_synced: b960dc8
references:
  - cli/package.json
  - cli/tsconfig.json
  - cli/src/index.ts
  - cli/src/client.ts
  - cli/src/commands/config.ts
  - cli/src/commands/chat.ts
related_plans: [model-selection-config-api]
summary: Dev CLI in cli/ — config show/set-model and streaming chat against the vee API
---

# CLI dev tool

## Goal
A standalone `cli/` package (no build step, tsx) with two commands: `config` to inspect and switch the active model, and `chat` to stream a message to the API and print tokens to the terminal.

## Out of scope
- Interactive REPL / multi-turn session loop — single message per invocation for now
- Auth headers — server has no auth yet
- Shared types with `src/` — CLI copies what it needs or uses plain fetch

## WBS

- [x] T1. Scaffold `cli/` package
  - files: `cli/package.json`, `cli/tsconfig.json`, `cli/src/index.ts`
  - depends on: —
  - test: `cd cli && npx tsx src/index.ts --help` prints usage

- [x] T2. HTTP client module
  - files: `cli/src/client.ts`
  - depends on: T1
  - test: `getConfig()` returns parsed JSON from `GET /config`; `streamMessage()` returns an async iterator of SSE event objects

- [x] T3. `config show` subcommand
  - files: `cli/src/commands/config.ts`
  - depends on: T2
  - test: `config show` prints active model name and token limit

- [x] T4. `config set-model <name>` subcommand
  - files: `cli/src/commands/config.ts`
  - depends on: T2
  - test: flips `active` flag on the named model, clears it on others, PATCHes config, prints confirmation

- [x] T5. `chat` command — stream tokens to stdout
  - files: `cli/src/commands/chat.ts`
  - depends on: T2
  - test: `chat --session s1 "hello"` prints streamed tokens then exits cleanly; tool-call events print a one-line notice

## Critical path
T1 → T2 → T5

## Walking skeleton
T1, T2, T5 — scaffold + client + chat. Config commands are additive.
