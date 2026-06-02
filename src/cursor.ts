import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * A per-reader cursor: the ISO timestamp of the last event consumed.
 *
 * Each AI keeps its OWN cursor file. Sharing a cursor between tools causes one
 * to mark events read and the other to miss them — the single most important
 * operational rule of the protocol.
 */
export class Cursor {
  constructor(private readonly path: string) {}

  read(): string {
    try {
      return readFileSync(this.path, "utf8").trim();
    } catch {
      return "";
    }
  }

  write(ts: string): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, ts);
  }

  /** Stamp "now" (UTC ISO). Call after a read pass completes. */
  stampNow(): void {
    this.write(new Date().toISOString());
  }
}
