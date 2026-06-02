import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { hostname } from "node:os";
import type { StreamEvent, EmitInput, Kind } from "./types.js";
import { isCognitive } from "./filter.js";

const SCHEMA = "throughline/v1" as const;

export interface StreamOptions {
  /** Absolute path to the `.throughline` stream directory (from a SyncAdapter). */
  root: string;
  /** Default `source` for emitted events (e.g. "claude-code"). */
  source?: string;
  /** Default `machine` label. Falls back to $THROUGHLINE_MACHINE then hostname. */
  machine?: string;
  /** Default `project` label. */
  project?: string;
}

export interface ReadOptions {
  /** Only return events with ts strictly greater than this ISO timestamp. */
  sinceTs?: string;
  /** How many trailing days of stream files to scan (default 2: today+yesterday). */
  days?: number;
  /** Include ops/telemetry too (default false: cognitive only). */
  includeNonCognitive?: boolean;
}

function utcDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Reads/writes a throughline stream directory. Pure filesystem, no network. */
export class Stream {
  private readonly root: string;
  private readonly source: string;
  private readonly machine: string;
  private readonly project?: string;

  constructor(opts: StreamOptions) {
    this.root = opts.root;
    this.source = opts.source ?? "unknown";
    this.machine =
      opts.machine ?? process.env.THROUGHLINE_MACHINE ?? hostname().split(".")[0]!;
    this.project = opts.project;
  }

  /** Build the full envelope and append one JSONL line. Returns the event. */
  emit(input: EmitInput): StreamEvent {
    const kind: Kind = input.kind ?? "cognitive";
    const event: StreamEvent = {
      ts: new Date().toISOString(),
      schema: SCHEMA,
      kind,
      source: input.source ?? this.source,
      machine: input.machine ?? this.machine,
      type: input.type,
      summary: input.summary,
    };
    if (input.session_id) event.session_id = input.session_id;
    const project = input.project ?? this.project;
    if (project) event.project = project;
    if (input.details) event.details = input.details;
    // Preserve any extra fields the caller attached.
    for (const [key, val] of Object.entries(input)) {
      if (!(key in event) && val !== undefined) event[key] = val;
    }

    mkdirSync(this.root, { recursive: true });
    // Route by kind: ops/telemetry land in ops-*.jsonl so readers stay clean.
    const prefix = kind === "cognitive" ? "stream" : "ops";
    const file = join(this.root, `${prefix}-${utcDate()}.jsonl`);
    appendFileSync(file, JSON.stringify(event) + "\n");
    return event;
  }

  /** Read events (cognitive-only by default), oldest-first. */
  read(opts: ReadOptions = {}): StreamEvent[] {
    const days = opts.days ?? 2;
    const since = opts.sinceTs ?? "";
    const out: StreamEvent[] = [];
    const now = Date.now();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000);
      const file = join(this.root, `stream-${utcDate(d)}.jsonl`);
      if (!existsSync(file)) continue;
      for (const line of readFileSync(file, "utf8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let e: StreamEvent;
        try {
          e = JSON.parse(trimmed) as StreamEvent;
        } catch {
          continue; // tolerate a torn final line (append-only resilience)
        }
        if (since && (e.ts ?? "") <= since) continue;
        if (!opts.includeNonCognitive && !isCognitive(e)) continue;
        out.push(e);
      }
    }
    return out;
  }
}
