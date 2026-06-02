/**
 * SyncAdapter — resolves WHERE the stream lives and reports sync health.
 *
 * throughline never implements sync itself. It rides a consumer sync service
 * (Dropbox / Drive / Syncthing / iCloud) or a plain local dir. The adapter only
 * answers "which directory" and "is it healthy".
 */
export interface SyncHealth {
  /** ISO timestamp of the newest stream file mtime, or null if none. */
  lastSync: string | null;
  /** Conflicted-copy files the sync service created (need manual merge). */
  conflicts: string[];
}

export interface SyncAdapter {
  /** Absolute path to the `.throughline` stream directory. */
  resolveRoot(): string;
  /** Current sync health snapshot. */
  health(): SyncHealth;
}
