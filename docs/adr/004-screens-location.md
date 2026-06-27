---
type: architecture-decision
slug: screens-location
status: accepted
created: 2026-05-21
last_synced: 
references: [src/infrastructure/driving/screens/]
related_decisions: [cli-as-driving-interface]
summary: Screens moved to driving/screens/, reusable across CLI and future web
---

# Screens Location and Reusability

## What
Screens move from `infrastructure/driving/cli/screens/` to `infrastructure/driving/screens/`. They are not CLI-specific and could be reused for a web GUI.

## Why
Screens (ConfigScreen, SessionScreen, ChatScreen) are interactive UI components. They're not tied to CLI — they're tied to the interaction model. A future web GUI could reuse the same screens with different rendering (React DOM vs Ink).

## Alternatives
- Keep under `cli/screens/` — rejected: prevents reuse, implies CLI-specific
- Duplicate screens per entry point — rejected: violates DRY

## Tradeoffs
- Gain: screens are reusable, clear separation between interaction style and UI logic
- Lose: screens need to be framework-agnostic (Ink-specific code stays in rendering layer)

## Consequences for code
- Screens at `infrastructure/driving/screens/`
- Each screen receives a `client` prop (from `createClient`)
- Ink-specific rendering stays in screen components
- Future web screens could import the same screen logic with different rendering
