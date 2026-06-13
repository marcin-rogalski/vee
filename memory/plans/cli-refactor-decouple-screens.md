---
type: plan
slug: cli-refactor-decouple-screens
status: implemented
created: 2025-05-22
last_synced: 8bdd38d
references:
  - src/infrastructure/utilities/CLI.ts
  - src/infrastructure/driving/cli/App.tsx
  - src/infrastructure/driving/screens/ConfigScreen.tsx
  - src/infrastructure/driving/screens/ChatScreen.tsx
  - src/infrastructure/driving/screens/SessionScreen.tsx
  - src/infrastructure/driving/screens/ConfigScreen.test.tsx
  - src/infrastructure/driving/screens/ChatScreen.test.tsx
  - src/infrastructure/driving/screens/SessionScreen.test.tsx
  - src/compositionRoot.ts
summary: Decouple screens from god Client interface by passing use case methods as individual props
---

# CLI Refactor: Decouple Screens from God Client Interface

## Goal
Remove the monolithic `Client` interface and `createClient()` factory from `CLI.ts`. Replace with per-screen props — each screen receives only the use case methods it needs, passed directly from `App.tsx`. Move the interactive state machine into `App.tsx`. Eliminate all abstraction layers between screens and `CompositionRoot`.

## Out of scope
- Changes to commands (CLI-driven mode) — they already use `CompositionRoot` directly
- Changes to application-layer ports or use cases
- Changes to domain layer
- HTTP adapters

## Open questions
- None

## WBS

### T1. Remove Client interface, ProviderEvent type, and createClient() from CLI.ts [DONE]
- files: `src/infrastructure/utilities/CLI.ts`
- depends on: -
- test: `tsc --noEmit` passes for CLI.ts alone

CLI.ts shrinks from 168 lines to ~35 lines:
- Keep: `CLI` class (constructor, `register()`, `run()`, `runInteractive()`)
- Remove: `ProviderEvent` type, `Client` interface, `createClient()` factory
- `runInteractive()` calls `render(<App core={this.compositionRoot} />)` instead of `render(<App client={createClient(this.compositionRoot)} />)`

### T2. Rewrite App.tsx as state machine + screen definitions [DONE]
- files: `src/infrastructure/driving/cli/App.tsx`
- depends on: T1
- test: `tsc --noEmit` passes for App.tsx

App.tsx grows from 67 to ~80 lines. New structure:
- State: `screen` ("menu" | "config" | "sessions" | "chat"), `sessionId`, `agentId`
- State machine: `setScreen`, `setSessionId`, `setAgentId`
- Renders each screen with individual props from `core`:
  - Config: `agents={core.agentList}`, `onUpsert={core.agentUpsert.execute}`, `onDelete={core.agentDelete.execute}`, `sessions={core.sessionList}`, `onCreateSession={core.sessionCreate.execute}`
  - Sessions: `sessions={core.sessionList}`, `onCreateSession={core.sessionCreate.execute}`, `agents={core.agentList}`
  - Chat: `streamMessage={core.infer.execute}`, `streamEvents={core.eventBus.subscribe}`, `sessionId`, `agentId`
- No `Client` type, no `createClient` import

### T3. Update ConfigScreen.tsx — drop inline Client type, add individual props [DONE]
- files: `src/infrastructure/driving/screens/ConfigScreen.tsx`
- depends on: T2
- test: `tsc --noEmit` passes for ConfigScreen.tsx

ConfigScreen drops its inline `Client` type (~12 lines) and gains individual props:
- `agents: ReturnType<typeof core.agentList>` (or `Promise<Array<...>>`)
- `onUpsert: (params) => Promise<void>`
- `onDelete: (id: string) => Promise<void>`
- `sessions: ReturnType<typeof core.sessionList>`
- `onCreateSession: (name?: string) => Promise<string>`
- `onBack: () => void`

Body logic stays the same, just replaces `client.agents.list()` → `agents`, `client.agents.upsert()` → `onUpsert()`, etc.

### T4. Update ChatScreen.tsx — drop Client type, add individual props [DONE]
- files: `src/infrastructure/driving/screens/ChatScreen.tsx`
- depends on: T2
- test: `tsc --noEmit` passes for ChatScreen.tsx

ChatScreen drops `Client` and `ProviderEvent` imports, gains:
- `streamMessage: (prompt: string, agentId: string, sessionId: string) => Promise<void>`
- `streamEvents: () => AsyncGenerator<any>` (or proper EventEnvelope type from EventBus.port)
- `sessionId: string`
- `agentId: string`
- `onBack: () => void`

Body logic: `client.streamMessage()` → `streamMessage()` call + event iteration from `streamEvents()`.

### T5. Update SessionScreen.tsx — drop Client type, add individual props [DONE]
- files: `src/infrastructure/driving/screens/SessionScreen.tsx`
- depends on: T2
- test: `tsc --noEmit` passes for SessionScreen.tsx

SessionScreen drops `Client` import, gains:
- `sessions: ReturnType<typeof core.sessionList>`
- `onCreateSession: (name?: string) => Promise<string>`
- `agents: ReturnType<typeof core.agentList>`
- `onSelectSession: (sessionId: string) => void`
- `onSelectAgent: (agentId: string) => void`
- `onBack: () => void`

### T6. Rewrite all 3 test files to match new prop structure [DONE - partial]
- files: `src/infrastructure/driving/screens/ConfigScreen.test.tsx`, `src/infrastructure/driving/screens/ChatScreen.test.tsx`, `src/infrastructure/driving/screens/SessionScreen.test.tsx`
- depends on: T3, T4, T5
- test: `npm test` passes for all 3 files

All 3 test files were testing an old version of the screens (mock methods like `client.getConfig`, `client.patchConfig`, `client.listSessions` don't exist in current production code). They were rewritten to match new props:
- Replace `mockClient` with individual mock functions matching the new props
- Remove `import type { Client }` from all test files
- Update render calls to pass individual props instead of a `client` object

Note: The 3 screen test files were already broken before this refactor (no DOM environment in vitest config). This is a pre-existing issue unrelated to this change.

### T7. Verify end-to-end: tsc + biome [DONE]
- files: all touched files
- depends on: T6
- test: `tsc --noEmit && biome check --fix --unsafe` passes (1 pre-existing error in entryServer.ts ignored)

## Critical path
T1 → T2 → T3 → T4 → T5 → T6 → T7

## Walking skeleton
T1, T2 — CLI.ts and App.tsx are decoupled. Screens still broken but CLI compiles.
