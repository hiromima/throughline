import { homedir } from "node:os";
import { join } from "node:path";
import type { SyncAdapter, SyncHealth } from "./adapter.js";
import { scanHealth } from "./local.js";

export interface DropboxOptions {
  /** Override the Dropbox base dir. Falls back to $DROPBOX_DIR, then ~/Dropbox. */
  base?: string;
  /** Subdirectory under the base that holds the stream (default ".throughline"). */
  subdir?: string;
}

/**
 * Dropbox adapter. The Dropbox app keeps the folder synced across machines;
 * throughline just reads/writes files inside it. Nothing is sent to Dropbox's
 * API — it is purely the local mount point of a synced folder.
 */
export function dropboxAdapter(opts: DropboxOptions = {}): SyncAdapter {
  const base = opts.base ?? process.env.DROPBOX_DIR ?? join(homedir(), "Dropbox");
  const root = join(base, opts.subdir ?? ".throughline");
  return {
    resolveRoot: () => root,
    health: (): SyncHealth => scanHealth(root),
  };
}
