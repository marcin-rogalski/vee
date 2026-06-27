# 009: Session Persistence — REPL State File with Auto-Resume

**Date:** 2026-06-17
**Status:** accepted

## Context

The REPL (REPLScreen) needs to persist state across CLI invocations so users don't lose their session context when they exit and restart the CLI. Without persistence, each CLI launch starts fresh — no active session, no agent selection, no command history.

## Decision

Persist REPL state to a JSON file (`~/.vee/repl-state.json`) containing:
- `activeSessionId` — the currently selected session
- `activeAgentId` — the currently selected agent
- `commandHistory` — array of previously entered commands

On startup, REPLScreen reads the state file and restores the session/agent selection. On exit (or session/agent switch), the state is written back.

### Implementation

- **State file location:** `~/.vee/repl-state.json` (same directory as config files)
- **Format:** Flat JSON object with string IDs and command history array
- **Read on startup:** REPLScreen constructor reads state, sets initial `activeSessionId` and `activeAgentId`
- **Write on change:** State is written whenever the user switches sessions or agents via slash commands
- **Graceful degradation:** If the file doesn't exist or is malformed, start with empty state

### Why this approach

- **Simplicity:** Single file, no database dependency.
- **Consistency:** Uses the same JSON-file pattern as the rest of the infrastructure layer.
- **User-accessible:** Users can inspect or edit the state file manually if needed.

## Consequences

### Positive
- Users resume where they left off — no need to re-select session/agent on every launch.
- Command history provides a basic "up arrow" experience.
- No external dependencies — pure JSON file I/O.

### Negative
- **Race conditions:** If multiple CLI instances run simultaneously, they may overwrite each other's state.
- **Stale references:** If a session or agent is deleted while referenced in the state file, the REPL will try to restore a non-existent entity. The REPL handles this gracefully by falling back to empty state.
- **No encryption:** State file is plain text — not suitable for sensitive data (but it only contains IDs, not secrets).

## Related Decisions

- [005-two-modes-one-cli](005-two-modes-one-cli.md) — CLI modes and REPL design.
- [003-composition-root](003-composition-root.md) — CompositionRoot manages the config directory where state is stored.
