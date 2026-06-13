---
type: architecture-overview
last_synced: 
references: [src/]
related_decisions: [cli-as-driving-interface, two-modes-one-cli, commander-aligned-commands, composition-root, command-registration-pattern, screens-location]
summary: vee — hexagonal app with CLI (command + interactive) and HTTP server
---

# Architecture overview

## Stack
- TypeScript (ESM), Node.js
- Express (HTTP), Ink (TUI)
- Vitest (tests), tsup (bundling), Biome (lint)

## Top-level components
- `src/cli.ts` — CLI entry point, registers commands, calls CLI.run()
- `src/index.ts` — HTTP server entry point, mounts routes
- `src/infrastructure/utilities/CLI.ts` — CLI class, mode router (command vs TUI)
- `src/infrastructure/composition.ts` — core dependency factory (shared across entry points)
- `src/infrastructure/driving/commands/` — CLI commands (refactored to commander)
- `src/infrastructure/driving/screens/` — interactive screens (Config, Session, Chat)
- `src/infrastructure/driving/http/` — HTTP endpoints
- `src/application/usecases/` — use cases (agents, sessions, providers, infer)
- `src/domain/` — domain models (Agent, Session, Provider, ConversationEntry)

## Data flow
- CLI: argv → CLI.run() → commander dispatch → command.handle() → use case → repository
- HTTP: request → Express route → adapter → use case → repository
- TUI: Ink render → event handler → use case → repository

## Persistence
- In-memory repositories (InMemoryAgentRepository, InMemorySessionRepository, etc.)
- File-based persistence via ReadFile/WriteFile adapters

## External integrations
- OpenAI (chat/inference)
- Tiktoken (token counting)
- Express (HTTP server)

## Key decisions
- CLI as driving interface → decisions/cli-as-driving-interface.md
- Two modes, one CLI → decisions/two-modes-one-cli.md
- Commander-aligned commands → decisions/commander-aligned-commands.md
- Composition root → decisions/composition-root.md
- Command registration → decisions/command-registration-pattern.md
- Screens location → decisions/screens-location.md
