---
type: idea
slug: multi-model-selection
status: promoted-to-plan
created: 2026-05-06
last_synced: 61f79b443a01b90604653d02e7c8d14b2122bf86
references:
  - src/infrastructure/config/AppConfig.ts
  - src/infrastructure/config/FSConfigRepository.adapter.ts
  - src/infrastructure/llm/OpenAiModel.adapter.ts
  - src/application/ports/ChatModel.port.ts
  - src/application/usecases/ChatMessage.usecase.ts
summary: Model list in config each with optional active flag; composition root resolves active adapter; at most one active enforced by zod
---

# Multi-model selection

## Problem

The app currently hardcodes a single OpenAI-compatible model in config. There is no way to register multiple providers, switch between them, or leave the model unconfigured. Starting without a model should be valid — the app should fail gracefully at message time, not at boot, so a config-setting endpoint can be added later without blocking startup.

## Goals

- Config holds a list of model configs, each entry optionally carrying `active: true`; at most one may be active (enforced by zod `.refine()`).
- Composition root finds the active entry (`models.find(m => m.active) ?? null`) and instantiates the right adapter, or passes `null` to the use case.
- The use case throws a clear domain error when no model is active.
- App starts cleanly with no model configured; failure surfaces only when a chat message is sent.

## Non-goals

- Per-session or per-message model override (deferred).
- Implementing new provider adapters (Anthropic, Ollama) — OpenAI adapter is the first and only concrete one for now.
- Hot-swapping active model without restart.

## Use cases

- As a user, I want to configure multiple model entries in `~/.vee/config.json` and mark one as active so that I can switch by flipping the `active` flag.
- As a user, I want the app to start with no model configured so that I can set one via a config endpoint before sending messages.
- As a user, I want a clear error when I send a chat message with no active model, so that I know what to configure.
- As a developer, I want the use case to receive `ModelPort | null` without knowing how it was selected, so that model selection is a composition root concern.

## Constraints

- `AppConfig` is zod-validated — new shape uses `z.array(z.discriminatedUnion("type", [...]))` with a `.refine()` asserting `filter(m => m.active).length <= 1`.
- No `ModelRegistry` port — selection is a composition root concern, not an application layer abstraction.
- No changes to `MongoSessionRepository` or session schema — model is not stored per session.

## Decision points

- Each model entry: `{ id: string, type: "openai", apiKey, baseUrl, name, active?: true }` — `active` absent means inactive; present and `true` means active.
- Composition root: `config.models.find(m => m.active) ?? null` → adapter instance or `null`.
- Use case: receives `ModelPort | null`; throws domain error `"No active model configured"` when null.

## Change log

- 2026-05-06 — initial idea captured; scope set to selection mechanism only, no new adapters, no per-session model (by: user)
- 2026-05-06 — dropped ModelRegistry port; selection moved to composition root; model list uses active flag instead of separate activeModelId; zod enforces at most one active (by: user)
