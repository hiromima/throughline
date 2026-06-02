/**
 * throughline — the cross-machine cognitive bus for AI agents.
 *
 * Public API. Zero network: everything is plain JSONL on a synced folder.
 */
export type { Kind, CognitiveType, StreamEvent, EmitInput } from "./types.js";
export { isCognitive, cognitiveOnly } from "./filter.js";
export { Cursor } from "./cursor.js";
export { Stream } from "./stream.js";
export type { StreamOptions, ReadOptions } from "./stream.js";
export type { SyncAdapter, SyncHealth } from "./sync/adapter.js";
export { localAdapter, scanHealth } from "./sync/local.js";
/**
 * Alias of `localAdapter` for Syncthing or any custom mount: point it at the
 * folder your sync tool keeps in sync. There is no autodetection because
 * Syncthing folders are user-configured.
 */
export { localAdapter as mountedAdapter } from "./sync/local.js";
export { dropboxAdapter } from "./sync/dropbox.js";
export type { DropboxOptions } from "./sync/dropbox.js";
export { googleDriveAdapter, detectGoogleDriveBase } from "./sync/gdrive.js";
export type { GoogleDriveOptions } from "./sync/gdrive.js";
export { icloudAdapter } from "./sync/icloud.js";
export type { ICloudOptions } from "./sync/icloud.js";
