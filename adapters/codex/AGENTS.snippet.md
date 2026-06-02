<!-- Paste into ~/.codex/AGENTS.md -->

## throughline — shared cognitive context

Cross-AI context lives in a synced folder (`$THROUGHLINE_ROOT`, default
`~/Dropbox/.throughline`). Shared with Claude Code / Desktop and other agents.

### Session start (read)

```bash
throughline read --cursor ~/.throughline-cursor-codex
```

### At milestones / decisions / handoffs (emit)

```bash
throughline emit <type> "<summary>" "<details>" --source codex
```

`type` = `work_log` | `milestone` | `decision` | `handoff` | `next_session` | `failed_approach`.

### Rules

- Use your **own** cursor (`~/.throughline-cursor-codex`). Do not reuse another tool's cursor.
- Emit only cognitive context (decisions/progress/handoffs), never ops/telemetry.
