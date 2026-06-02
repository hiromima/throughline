# Claude Code adapter

Wire two hooks in `~/.claude/settings.json` (or project `.claude/settings.json`).
Both shell out to the `throughline` CLI.

## SessionStart — inject recent cognitive context

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "throughline read --cursor ~/.throughline-cursor-claude-code" } ] }
    ]
  }
}
```

## PostToolUse(Bash) — emit a milestone on git commit/push

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Bash",
        "hooks": [ { "type": "command", "command": "bash <path>/throughline-emit.sh" } ] }
    ]
  }
}
```

`throughline-emit.sh` inspects the tool input and emits a `milestone` for
`git commit` / `git push`. Customize freely — the only contract is
`throughline emit <type> <summary> --source claude-code`.

## Cursor

This adapter uses `~/.throughline-cursor-claude-code`, distinct from every other
tool's cursor (the protocol's one hard rule).
