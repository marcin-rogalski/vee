# VEE

An AI agent CLI and server framework with OpenAI-compatible provider support, built on clean architecture principles.

## Overview

VEE provides a modular infrastructure for building AI-powered conversational agents. It supports multiple providers (OpenAI, LM Studio, Ollama, vLLM), persistent sessions, tool use, and both CLI and HTTP interfaces.

### Architecture

The project follows **Hexagonal Architecture** (Ports & Adapters) with three layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Driving Layer                            │
│  CLI Commands  │  HTTP Endpoints  │  REPL Screen  │  Handlers│
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                        │
│  Use Cases  │  Ports (Interfaces)  │  Domain Models         │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                     │
│  JSON Repos  │  OpenAI Provider  │  EventBus  │  Adapters   │
└─────────────────────────────────────────────────────────────┘
```

- **Domain** — Core entities (`Agent`, `Provider`, `Session`, `ConversationEntry`) and error types.
- **Application** — Use cases (`AgentUpsert`, `InferTurn`, `BuildContext`, etc.) and port interfaces defining contracts.
- **Infrastructure** — Concrete implementations: JSON file repositories, OpenAI provider adapter, InMemoryEventBus, CLI/HTTP driving adapters.

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Single CompositionRoot | Centralized dependency injection; tests use `CONFIG_FOLDER` env var for isolation |
| Single EventBus | One bus for all events (inference + CRUD); simplicity over segregation |
| JSON Schema for config | Universal configuration language; drives CLI forms, HTTP validation, and provider schemas |
| InferHandler over Orchestrator | Decomposed inference loop: resolve → persist → infer → loop (tool calls) |
| REPL as default CLI | Claude Code-style interactive interface with slash commands |

See `docs/adr/` for full architectural decision records.

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
npm install
```

### Development

```bash
# Run CLI
npm run cli

# Run CLI with commands
npm run cli -- agents list
npm run cli -- providers list
npm run cli -- sessions list

# Start HTTP server (watch mode)
npm run start:server

# Build
npm run build
```

### Testing

```bash
# Run all tests (unit + integration + E2E)
npm test

# Run E2E tests only
npm run test:e2e

# Lint
npm run lint

# Type check
npm run typecheck
```

### CLI Commands

```
vee agents list                    List all agents
vee agents upsert --name "..."     Create or update an agent
vee agents delete <id>             Delete an agent

vee providers list                 List all providers
vee providers upsert --name "..."  Create or update a provider
vee providers delete <id>          Delete a provider

vee sessions list                  List all sessions
vee sessions create <name>         Create a new session
vee sessions delete <id>           Delete a session

vee infer <prompt>                 Run inference with an agent
```

### Interactive Mode

Run `npm run cli` without arguments to enter the interactive REPL:

- Type a message to send it to the selected agent
- `/help` — show available commands
- `/config` — open configuration screen (manage providers, agents, sessions)
- `/sessions` — list sessions
- `/agent` — switch agent
- `/quit` — exit

## Project Structure

```
src/
├── compositionRoot.ts          # Dependency injection & wiring
├── entryCli.ts                 # CLI entry point
├── entryServer.ts              # HTTP server entry point
├── application/
│   ├── ports/                  # Interface contracts
│   └── usecases/               # Business logic
├── domain/
│   ├── *.ts                    # Entity definitions
│   └── errors/                 # Error types
└── infrastructure/
    ├── driven/                 # Driven adapters (repositories, providers, registries)
    ├── driving/                # Driving adapters (CLI commands, HTTP endpoints, screens)
    └── utilities/              # Shared utilities (EventBus, CLI, environment)
test/
├── e2e/                        # End-to-end tests
└── integration/                # Integration tests
```

## Provider Support

VEE supports any OpenAI-compatible API endpoint:

| Provider | Configuration |
|---|---|
| OpenAI | `model`, `apiKey` |
| LM Studio | `model`, `baseUrl: http://localhost:1234` |
| Ollama | `model`, `baseUrl: http://localhost:11434` |
| vLLM | `model`, `baseUrl` |

## License

ISC
