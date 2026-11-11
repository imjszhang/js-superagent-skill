# Changelog

## 0.6.0 — 2026-11-11

- Add explicit project material deployment, bounded current reads, workspace preparation, local adoption and frozen-task ownership guidance.
- Preserve coordinator-only knowledge and require separate material authorization, source identity and output destination configuration.
- Support the 0.15.0-alpha.0 package layout with schema 14/15 while keeping the earlier alpha.1–alpha.4 schema 14 matrix and refusing unknown combinations.
- Keep installation inventory read-only and require public capability checks before enabling materials.

## 0.5.3 — 2026-11-11

- Support the verified js-superagent 0.14.0-alpha.4 package layout while preserving earlier compatible versions.
- Distinguish candidate recovery from failed-ticket recovery and document bounded final-report continuation with complete conversation acceptance checks.

## 0.5.2 — 2026-11-11

- Support the verified js-superagent 0.14.0-alpha.3 layout for conversation-based candidate recovery while preserving earlier compatible versions.
- Document recovery of original requests through the operator conversation without creating replacements.

## 0.5.1 — 2026-11-10

- Allow the verified js-superagent 0.14.0-alpha.2 package layout for coordinator knowledge synchronization, retaining alpha.1 support and schema checks.
- Preserve existing knowledge, prompts and service startup behavior when deploying the assessment recovery fix.

## 0.5.0 — 2026-11-10

- Add project-local runtime `knowledge/`, with one Markdown document per coordinator-only knowledge entry and a default project overview template.
- Add deterministic, revision-checked synchronization that preserves Worker prompts, shared knowledge and existing coordinator guidance.
- Add a native service CLI wrapper that synchronizes before startup/restart, including login starts; no runtime package modification or hot reload.
- Document existing-service migration, author edits, size limits and business-context acceptance.

## 0.4.0 — 2026-11-10

- Add project-aware first-use guidance after installation and deployment, including a concrete suggested next message.
- Distinguish installation-only, verified empty deployments, existing drafts/tasks, blocked setup and unknown readiness.
- Recommend from project inputs and actual capabilities; continue work already authorized instead of returning to an onboarding menu.
- Include the guidance in the installable skill and explicitly invoke it from the README installation recipe.
- Add reproducible offline onboarding scenarios and independent behavioral validation; preserve existing tasks and runtime dependencies on upgrade.

## 0.3.0 — 2026-11-10

- Center the skill on a Project Agent that maintains ongoing project tasks.
- Add a task brief, version-tested example definitions, and design-to-operation handoff.
- Define cadence changes, in-flight preservation, pause/resume/disable, re-review and retirement workflows.
- Add isolated lifecycle tests and independent scenario reviews; keep private host data out of public artifacts.
- Upgrade only skill files; no runtime package upgrade or production-state migration.

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
