# Changelog

## 0.1.0 (unreleased)

Initial extraction from a private multi-agent system's "cognitive stream" subsystem.

- Core (TypeScript): `Stream` (emit/read), `Cursor`, `isCognitive` filter, `SyncAdapter` (local / Dropbox).
- Protocol v1: append-only JSONL with a `kind: cognitive | ops | telemetry` envelope; readers inject cognitive-only.
- CLI: `throughline read` / `throughline emit`.
- Adapters (shell, thin CLI wrappers): Claude Code, Codex.
- Spec: `spec/PROTOCOL.md`.
