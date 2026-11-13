# Changelog

## 0.6.8 — 2026-11-13

- Add exact js-superagent 0.15.0-alpha.7 compatibility and callback-invalidation recovery guidance. Preserve request identity, existing grants and explicit recovery of earlier failures.

## 0.6.7 — 2026-11-13

- Explain retained pre-ticket Feishu topic supplements without changing mention authority, batching, material grants or historical replay.
- Document bounded assessment-context refresh, original-request recovery and verified wrapper/child shutdown before restart or upgrade.
- Add the exact js-superagent 0.15.0-alpha.6 package layout and retain prior layout checks; keep configuration and dependency choices unchanged.

## 0.6.6 — 2026-11-13

- Correct Feishu grant identity checks to inspect `scope_type`, while recognizing equivalent client `type`/`tokenType` fields; never count user grants as bot permissions.
- Require actual bot API verification alongside grant checks when an identity field is absent; retain the existing runtime compatibility and configuration.

## 0.6.5 — 2026-11-13

- Add the exact js-superagent 0.15.0-alpha.5 layout with schema 14/15 and keep prior layouts; unknown versions remain rejected.
- Require bot application permission checks and actual group/thread history reads during Feishu deployment, upgrades and recovery; user authorization does not prove bot history access.
- Separate read-only diagnosis from recovery: inspect persisted failures, cursor backlog and subscriptions before resuming, without runtime initialization, replay or health-state mutation.
- Verify real mentions, disconnected group-message catch-up, non-mention follow-ups on active/subscribed threads, original-group replies and live/history deduplication through existing runtime paths, without new configuration switches.

## 0.6.4 — 2026-11-13

- Add the exact js-superagent 0.15.0-alpha.4 layout with schema 14/15, retaining older compatibility and rejecting unverified versions.
- Check group intake, sender admission, material readers and the actual output destination together; verify current uncommitted content and the reply in the originating group.
- Document alpha.4 material binding failures without adding configuration options: selected defaults or explicit materials must bind, while tasks without selected materials retain ordinary execution.
- Preserve old ticket history and inspect in-flight bindings before changing material settings; installation and configuration changes do not authorize replay.

## 0.6.3 — 2026-11-11

- Add the exact js-superagent 0.15.0-alpha.3 package layout with schema 14/15, preserving every previously supported package/schema pair.
- Distinguish fixed host ticket receipts from material reports when verifying the runtime fix for receipts incorrectly withdrawn as a Worker starts.
- Keep post-completion explanation corrections in the reply without reopening tickets or rewriting historical reports; ordinary status questions do not trigger recovery.

## 0.6.2 — 2026-11-11

- Add the exact js-superagent 0.15.0-alpha.2 package layout with schema 14/15 to the compatibility matrix, retaining all previously supported versions.
- Clarify that stale material reports provide explicit historical metadata; a current investigation must read authorized material again rather than reuse old report content.

## 0.6.1 — 2026-11-11

- Support the exact js-superagent 0.15.0-alpha.1 package layout with schema 14/15, retaining 0.15.0-alpha.0 and the earlier 0.14.0-alpha.1–alpha.4 compatibility matrix.
- Exercise both supported 0.15 material layouts through the candidate-package tests; unknown package/schema combinations remain rejected.

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
