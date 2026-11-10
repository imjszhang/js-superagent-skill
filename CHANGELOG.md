# Changelog

## 0.2.1 — 2026-11-10

- Fix inspector CLI entry detection when installation paths traverse filesystem aliases (for example macOS temporary directories).
- Validate the copied skill independently of repository files. Use this version instead of 0.2.0.

## 0.2.0 — 2026-11-10

- Move the installable payload to skills/js-superagent-skill/; repository tests, release checks and history remain at the root.
- Installation paths change: copy only the payload directory. Keep host provenance outside the installed skill.
- Runtime guidance and inspection behavior are unchanged; no production-state migration.

## 0.1.1 — 2026-11-10

- Add explicit skill version metadata, VERSION, changelog and version consistency validation.
- Define immutable Git tags, SemVer rules and host installation provenance.
- Keep runtime operation guidance unchanged; no dependency or production-state migration.

## 0.1.0 — 2026-11-10

- Initial project operator skill for dependency installation, task design, Feishu reviews and runtime maintenance.
- Read-only installation inspector with import-only package support and regression tests.
