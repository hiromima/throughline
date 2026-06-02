# Quickstart: two machines, two AIs, one stream

Goal: a decision made by Codex on your **laptop** shows up for Claude Code on your
**desktop** at its next session — with no server.

## 1. Pick a synced folder (both machines)

```bash
npm install -g throughline
export THROUGHLINE_ROOT="$HOME/Dropbox/.throughline"   # Dropbox syncs this dir to every machine
```

(Or use Google Drive / Syncthing / iCloud — anything that mounts the same folder
on both machines.)

## 2. Laptop — Codex emits

```bash
throughline emit decision "Adopt RRF for search ranking" "TF-IDF mis-ranked; switching to reciprocal rank fusion" --source codex
```

This appends one line to `~/Dropbox/.throughline/stream-YYYY-MM-DD.jsonl`.
Dropbox syncs it to the desktop within seconds.

## 3. Desktop — Claude Code reads (next session)

The SessionStart hook runs:

```bash
throughline read --cursor ~/.throughline-cursor-claude-code
# [throughline] 1 cognitive event(s):
#   [codex@laptop] decision: Adopt RRF for search ranking
```

That's it. No daemon, no database, no API. The file *is* the bus.

## What about ops noise?

A watchdog emitting `kind:"ops"` events writes to `ops-*.jsonl`, which `read`
ignores. Only `kind:"cognitive"` reaches the agent — durable context never drowns
in operational logs.
