/**
 * throughline — the cross-machine cognitive bus for AI agents.
 *
 * Public API. Zero network: everything is plain JSONL on a synced folder.
 */
export type {
  Kind,
  CognitiveType,
  StreamEvent,
  EmitInput,
} from "./types.js";
export { isCognitive, cognitiveOnly } from "./filter.js";
export { Cursor } from "./cursor.js";
export { Stream } from "./stream.js";
export type { StreamOptions, ReadOptions } from "./stream.js";
export type { SyncAdapter, SyncHealth } from "./sync/adapter.js";
export { localAdapter, scanHealth } from "./sync/local.js";
export { dropboxAdapter } from "./sync/dropbox.js";
export type { DropboxOptions } from "./sync/dropbox.js";
