# throughline protocol v1

A vendor-neutral, zero-infrastructure protocol for sharing cognitive context
across machines and AI tools. The substrate is the lowest common denominator:
**a file on a synced folder**.

## 1. Layout

```
<sync-root>/.throughline/
├── stream-{YYYY-MM-DD}.jsonl   # append-only cognitive event log (kind:cognitive)
├── ops-{YYYY-MM-DD}.jsonl      # operational telemetry (kind:ops/telemetry; readers ignore)
└── cursors/                    # (optional) per-reader cursor files
```

`<sync-root>` is provided by a **SyncAdapter** (Dropbox / Drive / Syncthing /
iCloud / local). The protocol never performs sync itself — it relies on the
consumer sync service mounting the folder on every machine.

## 2. Event envelope

One JSONL line per event:

```jsonc
{
  "ts": "2026-06-02T01:00:00Z",   // ISO-8601 UTC, sort key (REQUIRED)
  "schema": "throughline/v1",      // namespace + version (REQUIRED)
  "kind": "cognitive",             // cognitive | ops | telemetry (REQUIRED)
  "source": "codex",               // originating interface (REQUIRED)
  "machine": "mac-mini",           // machine label (REQUIRED)
  "type": "milestone",             // event type (REQUIRED; free-form allowed)
  "summary": "shipped v1",         // one-line human summary (REQUIRED)
  "session_id": "…",               // optional
  "project": "…",                  // optional
  "details": "…"                   // optional
}
```

Unknown fields round-trip untouched (adapters may attach extras).

## 3. `kind` separation (load-bearing)

Operational noise must never bury durable context. Empirically, an unfiltered
stream can run **>100 ops events per cognitive event** (watchdog logs etc.).

- `cognitive` → decisions, progress, findings, handoffs. **Injected** into agent context.
- `ops` → process supervision / automation. Written to `ops-*.jsonl`. **Not injected.**
- `telemetry` → high-frequency metrics. **Not injected.**

### Legacy inference (no `kind`)

```
is_cognitive(e):
  if e.kind == "cognitive": return true
  if e.kind in ("ops","telemetry"): return false
  return bool(e.type) and bool(e.source)   # cognitive carries type+source;
                                            # ops telemetry uses an "event" key only
```

This predicate is the contract. Every adapter (TS `isCognitive`, shell
`is_cognitive()`) MUST implement it identically.

## 4. Reading (cursors)

Each reader keeps its **own** cursor — the ts of the last consumed event.
Reading returns cognitive events with `ts > cursor`, oldest-first, then advances
the cursor.

> **Rule:** never share a cursor between two tools. One would mark events read
> and the other would miss them.

## 5. Invariants

1. **append-only** — never rewrite history; tolerate a torn final line on read.
2. **one line = one event** — partial writes recover by dropping the last line.
3. **ts monotonic-ish** — clocks differ across machines; sort by ts, accept skew.
4. **conflicts** — sync services may create `… (conflicted copy).jsonl`. Because
   the log is append-only, a conflict is resolved by ts-merging both files
   (lossless). `SyncAdapter.health()` surfaces conflicts.

## 6. Per-AI adapters (the LSP model)

The stream is the protocol; each AI implements a thin adapter exposing two ops:

- **read / inject** — at session start, surface cognitive events since the
  reader's cursor into the agent's context.
- **emit** — append an event with the agent's `source` and `kind:"cognitive"`.

| Tier | AI | mechanism |
|------|----|-----------|
| native | Claude Code | SessionStart + PostToolUse hooks |
| native | Codex | AGENTS.md instruction + shell |
| native | Claude Desktop / Gemini CLI / OpenClaw | local MCP or hook |
| **bridge** | ChatGPT (web/app) | remote MCP (HTTPS+OAuth) — ChatGPT's MCP is remote-only, so the local stream must be exposed over the internet. This **breaks zero-infra**; documented as a separate tier. |

## 7. Non-goals

- No vector/graph store, no semantic search (bring your own; the stream is the substrate).
- No sync implementation (delegated to Dropbox/Drive/Syncthing).
- No server, no auth (file permissions are the boundary; do not put secrets in events).
