# throughline

**The cross-machine cognitive bus for AI agents.**
Your Dropbox/Drive is the only backend — no server, no database. Append-only JSONL that any filesystem-capable AI can read and append.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Why

Every AI memory tool ([mem0](https://github.com/mem0ai/mem0), [letta](https://github.com/letta-ai/letta), [claude-mem](https://github.com/thedotmack/claude-mem), …) assumes **one machine + a server/DB or a hosted API**. None of them give you the simplest possible substrate: a **file on a folder you already sync**, shared across **every machine and every AI** at once.

throughline is the missing piece — not an "AI memory" product, but a **vendor-neutral context protocol**:

- **Zero infrastructure** — no daemon, no server, no database. The sync service you already run (Dropbox / Google Drive / Syncthing / iCloud) *is* the transport.
- **Cross-machine** — your laptop, desktop, and home server share one stream. Every competitor is single-machine.
- **AI-neutral** — Claude Code, Claude Desktop, Codex, Gemini CLI… anything that can read a file can join. One protocol, thin per-AI adapters (the *LSP* model for AI context).
- **append-only JSONL** — torn-write resilient, mergeable across machines, greppable.

> **Boundary (honest):** any AI that can reach the local filesystem participates. A pure cloud chat (vanilla ChatGPT web) cannot — its MCP is remote-only — so it needs a bridge that breaks the zero-infra property. See [`spec/PROTOCOL.md`](spec/PROTOCOL.md).

## Install

```bash
npm install -g throughline      # CLI + library
```

## Quickstart (library)

```ts
import { Stream, dropboxAdapter } from "throughline";

const stream = new Stream({
  root: dropboxAdapter().resolveRoot(),   // ~/Dropbox/.throughline
  source: "my-agent",
});

// Append a cognitive event (envelope ts/schema/kind/machine filled for you)
stream.emit({ source: "my-agent", type: "milestone", summary: "shipped v1" });

// Read recent cognitive events (ops/telemetry are filtered out)
for (const e of stream.read()) {
  console.log(`[${e.source}@${e.machine}] ${e.type}: ${e.summary}`);
}
```

## Quickstart (CLI)

```bash
export THROUGHLINE_ROOT="$HOME/Dropbox/.throughline"   # or rely on the Dropbox default

throughline emit milestone "shipped v1" "details here" --source my-agent
throughline read --cursor ~/.throughline-cursor
```

## The `kind` envelope

Every event is one JSONL line:

```json
{"ts":"2026-06-02T01:00:00Z","schema":"throughline/v1","kind":"cognitive","source":"codex","machine":"mac-mini","type":"milestone","summary":"shipped v1"}
```

`kind` is the load-bearing field:

| kind | meaning | injected into agent context? |
|------|---------|------------------------------|
| `cognitive` | decisions, progress, findings, handoffs | ✅ yes |
| `ops` | process supervision / automation logs | ❌ no (separate `ops-*.jsonl`) |
| `telemetry` | high-frequency metrics | ❌ no |

Readers (`Stream.read`, CLI `read`, adapters) inject **cognitive only**, so operational noise never drowns durable context. Legacy events without `kind` are inferred (`type`+`source` ⇒ cognitive).

## Adapters

throughline is a protocol; each AI joins via a thin adapter. See [`adapters/`](adapters/):

| AI | read | status |
|----|------|--------|
| Claude Code | SessionStart hook → `throughline read` | ✅ `adapters/claude-code/` |
| Codex | AGENTS.md instruction → `throughline read` | ✅ `adapters/codex/` |
| Claude Desktop | Filesystem MCP (local stdio) | works (reads the dir) |
| ChatGPT (web) | remote MCP bridge | bridge tier (breaks zero-infra) |

**Cursor rule:** each AI keeps its *own* cursor file. Sharing a cursor between tools makes one mark events read and the other miss them — the single most important operational rule.

## Develop

```bash
npm install
npm run typecheck
npm test          # vitest
npm run build     # -> dist/
```

## License

MIT © hiromima. Extracted from the Inif "Cognitive Stream" subsystem.
