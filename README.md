# throughline

**The cross-machine cognitive bus for AI agents.**
The folder you already sync is the only backend — no server, no database. Append-only JSONL that any filesystem-capable AI can read and append.

[![npm](https://img.shields.io/npm/v/@hiromima/throughline)](https://www.npmjs.com/package/@hiromima/throughline)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

---

## Why

Every AI memory tool ([mem0](https://github.com/mem0ai/mem0), [letta](https://github.com/letta-ai/letta), [claude-mem](https://github.com/thedotmack/claude-mem)…) assumes **one machine + a server/DB or a hosted API**. None give you the simplest possible substrate: a **file on a folder you already sync**, shared across **every machine and every AI** at once.

throughline isn't an "AI memory" product — it's a **vendor-neutral context protocol**:

- **Zero infrastructure** — no daemon, no server, no database. The sync service you already run (Dropbox / Google Drive / Syncthing / iCloud) _is_ the transport.
- **Cross-machine** — laptop, desktop, and home server share one stream. Every comparable tool is single-machine.
- **AI-neutral** — Claude Code, Claude Desktop, Codex, Gemini CLI… anything that can read a file can join. One protocol, thin per-AI adapters — the _LSP model_ for AI context.
- **append-only JSONL** — torn-write resilient, mergeable across machines, greppable.

> **Honest boundary:** any AI that can reach the local filesystem participates. A pure cloud chat (e.g. vanilla ChatGPT web) cannot — its MCP is remote-only — so it needs a bridge that breaks the zero-infra property. See [`spec/PROTOCOL.md`](spec/PROTOCOL.md) §6.

## Install

```bash
# CLI (global) — provides the `throughline` command
npm install -g @hiromima/throughline

# Library (in a project) — for `import { Stream } from "@hiromima/throughline"`
npm install @hiromima/throughline
```

## Quickstart — library

```ts
import { Stream, googleDriveAdapter } from "@hiromima/throughline";

const stream = new Stream({
  root: googleDriveAdapter().resolveRoot(), // ~/.../My Drive/.throughline
  source: "my-agent",
});

// Append a cognitive event (ts/schema/kind/machine are filled in for you)
stream.emit({ source: "my-agent", type: "milestone", summary: "shipped v1" });

// Read recent cognitive events (ops/telemetry are filtered out)
for (const e of stream.read()) {
  console.log(`[${e.source}@${e.machine}] ${e.type}: ${e.summary}`);
}
```

## Quickstart — CLI

```bash
export THROUGHLINE_ROOT="$HOME/Dropbox/.throughline"   # or any synced folder

throughline emit milestone "shipped v1" "details here" --source my-agent
throughline read --cursor ~/.throughline-cursor
```

## Sync backends

throughline never syncs anything itself — it rides a folder your sync app keeps
in sync across machines. Pick the adapter for the service you already use; each
just resolves the local mount path (nothing touches any cloud API):

| Service                        | Adapter                | Default / detection                                                                     | Override                         |
| ------------------------------ | ---------------------- | --------------------------------------------------------------------------------------- | -------------------------------- |
| Dropbox                        | `dropboxAdapter()`     | `~/Dropbox/.throughline`                                                                | `DROPBOX_DIR` or `{ base }`      |
| Google Drive                   | `googleDriveAdapter()` | autodetects `~/Library/CloudStorage/GoogleDrive-*/My Drive` (macOS) or `~/Google Drive` | `GOOGLE_DRIVE_DIR` or `{ base }` |
| iCloud Drive                   | `icloudAdapter()`      | `~/Library/Mobile Documents/com~apple~CloudDocs/.throughline`                           | `ICLOUD_DIR` or `{ base }`       |
| Syncthing / any folder         | `mountedAdapter(path)` | — (you pass the synced folder)                                                          | n/a                              |
| Local (single machine / tests) | `localAdapter(path)`   | —                                                                                       | n/a                              |

```ts
import { googleDriveAdapter, mountedAdapter } from "@hiromima/throughline";

googleDriveAdapter().resolveRoot(); // autodetected My Drive
googleDriveAdapter({ base: "/Volumes/Work/My Drive" }); // explicit mount
mountedAdapter("/home/me/Sync/.throughline"); // Syncthing folder
```

The interface is just `resolveRoot()` + `health()`, so adding a new backend
(OneDrive, pCloud, an SMB share…) is a few lines — see `src/sync/`.

## The `kind` envelope

Every event is one JSONL line:

```json
{
  "ts": "2026-06-02T01:00:00Z",
  "schema": "throughline/v1",
  "kind": "cognitive",
  "source": "codex",
  "machine": "laptop",
  "type": "milestone",
  "summary": "shipped v1"
}
```

`kind` is the load-bearing field:

| kind        | meaning                                 | injected into agent context?   |
| ----------- | --------------------------------------- | ------------------------------ |
| `cognitive` | decisions, progress, findings, handoffs | ✅ yes                         |
| `ops`       | process supervision / automation logs   | ❌ no (separate `ops-*.jsonl`) |
| `telemetry` | high-frequency metrics                  | ❌ no                          |

Readers inject **cognitive only**, so operational noise never drowns durable context. Legacy events without `kind` are inferred (`type`+`source` ⇒ cognitive).

## AI adapters

throughline is a protocol; each AI joins via a thin adapter (see [`adapters/`](adapters/)):

| AI             | read                                       | status                          |
| -------------- | ------------------------------------------ | ------------------------------- |
| Claude Code    | SessionStart hook → `throughline read`     | `adapters/claude-code/`         |
| Codex          | AGENTS.md instruction → `throughline read` | `adapters/codex/`               |
| Claude Desktop | Filesystem MCP (local stdio)               | reads the folder directly       |
| ChatGPT (web)  | remote MCP bridge                          | bridge tier — breaks zero-infra |

**Cursor rule:** each AI keeps its _own_ cursor file. Sharing a cursor between
tools makes one mark events read and the other miss them — the one hard rule.

## Develop

```bash
npm install
npm run typecheck
npm test          # vitest
npm run build     # -> dist/
```

## License

MIT © hiromima.
