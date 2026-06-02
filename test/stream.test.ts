import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Stream } from "../src/stream.js";
import { isCognitive } from "../src/filter.js";
import { Cursor } from "../src/cursor.js";

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "throughline-test-"));
});

describe("isCognitive", () => {
  it("includes kind:cognitive", () => {
    expect(
      isCognitive({ kind: "cognitive", type: "milestone", source: "x" }),
    ).toBe(true);
  });
  it("excludes kind:ops and kind:telemetry", () => {
    expect(isCognitive({ kind: "ops", event: "bun_orphan_kill" })).toBe(false);
    expect(isCognitive({ kind: "telemetry", metric: "cpu" })).toBe(false);
  });
  it("infers legacy: type+source => cognitive", () => {
    expect(isCognitive({ type: "work_log", source: "code" })).toBe(true);
  });
  it("infers legacy: event-only (no type/source) => excluded", () => {
    expect(isCognitive({ event: "bun_orphan_kill", trigger: "watchdog" })).toBe(
      false,
    );
  });
});

describe("Stream.emit", () => {
  it("fills the envelope and writes cognitive to stream-*.jsonl", () => {
    const s = new Stream({ root, source: "codex", machine: "main" });
    const ev = s.emit({ source: "codex", type: "milestone", summary: "hello" });
    expect(ev.schema).toBe("throughline/v1");
    expect(ev.kind).toBe("cognitive");
    expect(ev.source).toBe("codex");
    const files = readdirSync(root);
    const streamFile = files.find((f) => f.startsWith("stream-"));
    expect(streamFile).toBeTruthy();
    const line = readFileSync(join(root, streamFile!), "utf8").trim();
    expect(JSON.parse(line).summary).toBe("hello");
  });

  it("routes ops to ops-*.jsonl, not stream-*.jsonl", () => {
    const s = new Stream({ root, source: "watchdog" });
    s.emit({
      source: "watchdog",
      type: "kill",
      summary: "orphan",
      kind: "ops",
    });
    const files = readdirSync(root);
    expect(files.some((f) => f.startsWith("ops-"))).toBe(true);
    expect(files.some((f) => f.startsWith("stream-"))).toBe(false);
  });

  it("preserves extra fields", () => {
    const s = new Stream({ root, source: "x" });
    const ev = s.emit({
      source: "x",
      type: "decision",
      summary: "s",
      handoff_id: "abc",
    });
    expect(ev.handoff_id).toBe("abc");
  });
});

describe("Stream.read", () => {
  it("returns cognitive only and excludes ops", () => {
    const s = new Stream({ root, source: "code" });
    s.emit({ source: "code", type: "milestone", summary: "keep me" });
    s.emit({
      source: "watchdog",
      type: "kill",
      summary: "drop me",
      kind: "ops",
    });
    const events = s.read();
    expect(events).toHaveLength(1);
    expect(events[0]!.summary).toBe("keep me");
  });

  it("respects sinceTs (cursor)", () => {
    const s = new Stream({ root, source: "code" });
    const first = s.emit({ source: "code", type: "work_log", summary: "old" });
    const events = s.read({ sinceTs: first.ts });
    // strictly greater than first.ts -> the first event is excluded
    expect(events.find((e) => e.summary === "old")).toBeUndefined();
  });
});

describe("Cursor", () => {
  it("round-trips and defaults empty", () => {
    const c = new Cursor(join(root, "cur"));
    expect(c.read()).toBe("");
    c.write("2026-06-02T00:00:00Z");
    expect(c.read()).toBe("2026-06-02T00:00:00Z");
  });
});
