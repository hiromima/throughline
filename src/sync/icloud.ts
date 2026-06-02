import { homedir } from "node:os";
import { join } from "node:path";
import type { SyncAdapter, SyncHealth } from "./adapter.js";
import { scanHealth } from "./local.js";

export interface ICloudOptions {
  /** Override the iCloud Drive base dir. Falls back to $ICLOUD_DIR, then the macOS default. */
  base?: string;
  /** Subdirectory under the base (default ".throughline"). */
  subdir?: string;
}

/**
 * iCloud Drive adapter (macOS). iCloud mounts Drive at
 * ~/Library/Mobile Documents/com~apple~CloudDocs. throughline reads/writes files
 * there; iCloud handles sync. No Apple API is used.
 */
export function icloudAdapter(opts: ICloudOptions = {}): SyncAdapter {
  const base =
    opts.base ??
    process.env.ICLOUD_DIR ??
    join(homedir(), "Library", "Mobile Documents", "com~apple~CloudDocs");
  const root = join(base, opts.subdir ?? ".throughline");
  return {
    resolveRoot: () => root,
    health: (): SyncHealth => scanHealth(root),
  };
}
