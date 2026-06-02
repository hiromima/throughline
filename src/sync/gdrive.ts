import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import type { SyncAdapter, SyncHealth } from "./adapter.js";
import { scanHealth } from "./local.js";

export interface GoogleDriveOptions {
  /**
   * Override the Google Drive base dir (the folder that holds `.throughline`).
   * Falls back to $GOOGLE_DRIVE_DIR, then best-effort autodetection.
   */
  base?: string;
  /** Subdirectory under the base (default ".throughline"). */
  subdir?: string;
}

/**
 * Best-effort detection of the locally-mounted Google Drive "My Drive" folder.
 *
 * - macOS (Google Drive for Desktop): ~/Library/CloudStorage/GoogleDrive-<acct>/My Drive
 * - Legacy / Windows-style mount:       ~/Google Drive  (optionally /My Drive)
 *
 * Returns null if nothing is found — callers should then require $GOOGLE_DRIVE_DIR.
 */
export function detectGoogleDriveBase(home = homedir()): string | null {
  const cloudStorage = join(home, "Library", "CloudStorage");
  if (existsSync(cloudStorage)) {
    const entry = readdirSync(cloudStorage)
      .filter((n) => n.startsWith("GoogleDrive-"))
      .sort()[0];
    if (entry) {
      const myDrive = join(cloudStorage, entry, "My Drive");
      return existsSync(myDrive) ? myDrive : join(cloudStorage, entry);
    }
  }
  const legacy = join(home, "Google Drive");
  if (existsSync(legacy)) {
    const myDrive = join(legacy, "My Drive");
    return existsSync(myDrive) ? myDrive : legacy;
  }
  return null;
}

/**
 * Google Drive adapter. Works with Google Drive for Desktop: the app mounts a
 * local folder and keeps it synced, so throughline just reads/writes files in it
 * — exactly like the Dropbox adapter. Nothing touches the Drive API.
 *
 * If autodetection fails (no Drive app, or a custom mount), set $GOOGLE_DRIVE_DIR
 * or pass `base` explicitly.
 */
export function googleDriveAdapter(opts: GoogleDriveOptions = {}): SyncAdapter {
  const base = opts.base ?? process.env.GOOGLE_DRIVE_DIR ?? detectGoogleDriveBase();
  if (!base) {
    throw new Error(
      "Google Drive folder not found. Set GOOGLE_DRIVE_DIR (e.g. " +
        '"~/Library/CloudStorage/GoogleDrive-you@gmail.com/My Drive") or pass { base }.',
    );
  }
  const root = join(base, opts.subdir ?? ".throughline");
  return {
    resolveRoot: () => root,
    health: (): SyncHealth => scanHealth(root),
  };
}
