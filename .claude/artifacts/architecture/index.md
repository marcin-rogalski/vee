# Architecture index

## Overview
- [overview.md](overview.md) — Hexagonal TS/Node app — Express HTTP, OpenAI LLM adapter, rolling-window context management, streaming SSE.

## Decisions
| Slug | Status | Summary | Supersedes | Created |
|---|---|---|---|---|
| handler-contract | accepted | Return-based handlers; base class owns HTTP mechanics, status defaults, AbortSignal | - | 2026-05-02 |
| endpoint-shape | superseded | Abstract class endpoint; schemas mutually exclusive (response\|sse\|none); mapper pattern | - | 2026-05-02 |
| endpoint-shape-v2 | accepted | Endpoint sealed; Endpoint.typed() for DI subclasses, Endpoint.create() for simple lambdas; no explicit generics | endpoint-shape | 2026-05-03 |
| hexagonal-port-policy | accepted | No primary ports; secondary ports required for all infrastructure dependencies | - | 2026-05-02 |
| naming-convention | accepted | Every source file carries a dot-suffix (.port/.dto/.usecase/.adapter/.endpoint) matching its role | - | 2026-05-03 |
| dto-layer-policy | accepted | DTOs live in application layer (.dto.ts files); ports import from them; infrastructure never redefines domain types | - | 2026-05-03 |
