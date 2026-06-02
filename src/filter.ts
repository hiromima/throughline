import type { StreamEvent } from "./types.js";

/**
 * Decide whether an event belongs in agent context.
 *
 * - kind === "cognitive"        -> include
 * - kind === "ops"|"telemetry"  -> exclude
 * - legacy (no kind): infer. Cognitive events carry a `type` + `source`
 *   envelope; ops telemetry uses an `event` key with no type/source.
 *
 * This MUST stay byte-for-byte equivalent to the shell `is_cognitive()` used by
 * the Claude Code / Codex adapters (drift guard in tests).
 */
export function isCognitive(e: Record<string, unknown>): boolean {
  const k = e["kind"];
  if (k === "cognitive") return true;
  if (k === "ops" || k === "telemetry") return false;
  return Boolean(e["type"]) && Boolean(e["source"]);
}

/** Filter a list to cognitive-only, preserving order. */
export function cognitiveOnly(events: StreamEvent[]): StreamEvent[] {
  return events.filter((e) => isCognitive(e));
}
