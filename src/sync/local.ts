import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { SyncAdapter, SyncHealth } from "./adapter.js";

/** Single-machine / test adapter: the stream dir is a plain local path. */
export function localAdapter(root: string): SyncAdapter {
  return {
    resolveRoot: () => root,
    health: (): SyncHealth => scanHealth(root),
  };
}

/** Shared health scan reused by other adapters. */
export function scanHealth(root: string): SyncHealth {
  if (!existsSync(root)) return { lastSync: null, conflicts: [] };
  let newest = 0;
  const conflicts: string[] = [];
  for (const name of readdirSync(root)) {
    // Sync services name collisions like "stream (conflicted copy 2026-...).jsonl"
    if (/conflict|conflicted copy|\(\d+\)\.jsonl$/i.test(name)) conflicts.push(name);
    if (!name.endsWith(".jsonl")) continue;
    const m = statSync(join(root, name)).mtimeMs;
    if (m > newest) newest = m;
  }
  return {
    lastSync: newest ? new Date(newest).toISOString() : null,
    conflicts,
  };
}
