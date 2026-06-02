/**
 * throughline — event envelope types (protocol v1).
 *
 * The protocol is intentionally a plain JSONL line. `kind` separates durable
 * cognitive context from operational noise so readers never drown (see spec).
 */

/** Top-level classification. Only `cognitive` is injected into agent context. */
export type Kind = "cognitive" | "ops" | "telemetry";

/** Conventional cognitive event types. Free-form strings are also allowed. */
export type CognitiveType =
  | "task_complete"
  | "milestone"
  | "work_log"
  | "failed_approach"
  | "next_session"
  | "state_change"
  | "handoff"
  | "decision";

/** One append-only stream event. */
export interface StreamEvent {
  /** ISO-8601 UTC timestamp. Sort key across machines. */
  ts: string;
  /** Protocol namespace + version. */
  schema: "throughline/v1";
  /** cognitive | ops | telemetry. Readers default to cognitive only. */
  kind: Kind;
  /** Originating interface: "claude-code" | "claude-desktop" | "codex" | ... */
  source: string;
  /** Machine identifier (hostname, or a user-defined label). */
  machine: string;
  /** Optional session identifier. */
  session_id?: string;
  /** Optional project/workspace label. */
  project?: string;
  /** Event type (see CognitiveType; free-form allowed). */
  type: CognitiveType | (string & {});
  /** One-line human-readable summary (the injection unit). */
  summary: string;
  /** Optional longer detail. */
  details?: string;
  /** Adapters may attach extra fields; they round-trip untouched. */
  [extra: string]: unknown;
}

/** Fields a caller provides; envelope (ts/schema/kind/machine) is filled by emit(). */
export interface EmitInput {
  source: string;
  type: CognitiveType | (string & {});
  summary: string;
  kind?: Kind;
  machine?: string;
  session_id?: string;
  project?: string;
  details?: string;
  [extra: string]: unknown;
}
