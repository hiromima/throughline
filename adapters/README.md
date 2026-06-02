# Adapters

throughline is a protocol; each AI joins via a thin adapter that does two things:
**read** (inject recent cognitive events at session start) and **emit** (append
an event tagged with the agent's `source` + `kind:"cognitive"`).

All adapters here are thin wrappers over the `throughline` CLI, so there is one
implementation of the protocol (the TS core) and no drift.

Prereq: `npm install -g throughline` and set `THROUGHLINE_ROOT` (or rely on the
Dropbox default `~/Dropbox/.throughline`).

| Adapter | dir | read trigger | emit |
|---------|-----|--------------|------|
| Claude Code | `claude-code/` | SessionStart hook | PostToolUse hook / manual |
| Codex | `codex/` | AGENTS.md instruction | shell |

**The cursor rule:** every adapter uses its OWN cursor file
(`~/.throughline-cursor-<agent>`). Never share a cursor between tools — one
would mark events read and the other would miss them.
