#!/usr/bin/env node
/**
 * throughline CLI — minimal read/emit from any shell.
 *
 *   throughline read  [--root DIR] [--days N] [--cursor FILE]
 *   throughline emit  <type> <summary> [details] [--root DIR] [--source S]
 *
 * Default root resolution: $THROUGHLINE_ROOT, else the Dropbox adapter
 * (~/Dropbox/.throughline or $DROPBOX_DIR/.throughline).
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { Stream } from "./stream.js";
import { Cursor } from "./cursor.js";
import { dropboxAdapter } from "./sync/dropbox.js";

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

function resolveRoot(args: string[]): string {
  return (
    flag(args, "root") ??
    process.env.THROUGHLINE_ROOT ??
    dropboxAdapter().resolveRoot()
  );
}

function main(argv: string[]): number {
  const [cmd, ...rest] = argv;
  const root = resolveRoot(rest);

  if (cmd === "read") {
    const cursorPath =
      flag(rest, "cursor") ?? join(homedir(), ".throughline-cli-cursor");
    const cursor = new Cursor(cursorPath);
    const days = Number(flag(rest, "days") ?? 2);
    const stream = new Stream({ root });
    const events = stream.read({ sinceTs: cursor.read(), days });
    if (events.length === 0) {
      console.log("[throughline] no new cognitive events");
    } else {
      console.log(`[throughline] ${events.length} cognitive event(s):`);
      for (const e of events.slice(-15)) {
        const m = e.machine ? `@${e.machine}` : "";
        console.log(`  [${e.source}${m}] ${e.type}: ${e.summary}`);
      }
    }
    cursor.stampNow();
    return 0;
  }

  if (cmd === "emit") {
    const positional = rest.filter((a, i) => !a.startsWith("--") && !rest[i - 1]?.startsWith("--"));
    const [type, summary, details] = positional;
    if (!type || !summary) {
      console.error("usage: throughline emit <type> <summary> [details]");
      return 2;
    }
    const stream = new Stream({ root, source: flag(rest, "source") ?? "cli" });
    const ev = stream.emit({ source: flag(rest, "source") ?? "cli", type, summary, details });
    console.log(`[throughline] emitted: ${ev.type} — ${ev.summary}`);
    return 0;
  }

  console.error("usage: throughline <read|emit> ...");
  return 2;
}

process.exit(main(process.argv.slice(2)));
