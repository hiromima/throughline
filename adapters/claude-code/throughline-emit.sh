#!/bin/bash
# throughline-emit.sh — Claude Code PostToolUse(Bash) adapter.
# Emits a `milestone` cognitive event when the agent runs git commit / push.
# Thin wrapper over the throughline CLI (no protocol logic here).
set -u

INPUT=$(cat 2>/dev/null || true)
CMD=$(printf '%s' "$INPUT" | grep -o '"command":"[^"]*"' | head -1 | sed 's/"command":"//;s/"$//')

case "$CMD" in
  *git\ commit*) throughline emit milestone "Git commit" "$CMD" --source claude-code >/dev/null 2>&1 ;;
  *git\ push*)   throughline emit milestone "Git push"   "$CMD" --source claude-code >/dev/null 2>&1 ;;
esac
exit 0
