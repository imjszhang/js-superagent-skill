# Changelog

## 0.8.2 — 2026-11-28

- Require an independent Lark/Feishu App per project; global component reuse does not share channel identity or event delivery.
- Document read-only App ownership inspection, persistent ownership after service shutdown, and safe transfer without resetting tasks, approvals or history.
- Add a synthetic same-App conflict rehearsal covering stopped projects, separate chats, retained paused reviews and the absence of protection in older runtimes.
- Add exact js-superagent 0.15.0-alpha.19 knowledge/schema and material-layout compatibility, with published-candidate CI coverage and continued rejection of unknown versions.

## 0.8.1 — 2026-11-28

- Use an OS-backed component binding lock so crashed or rebooted writers cannot leave a new binding operation permanently blocked; retain a persistent protocol marker to exclude incompatible legacy writers.
- Verify global component discovery, SDK loading and existing bindings are unaffected by hostname changes or unavailable hostname diagnostics.
- Exclude npm-run project-local PATH bins from global discovery and assert candidate compatibility tests use the exact selected runtime.
- Document stable process identity across all runtime claims and conservative recovery of ambiguous legacy records.
- Add exact js-superagent 0.15.0-alpha.18 layout compatibility, with isolated knowledge, material and wrapper regressions against the published candidate.
- Validate the deployment combination with js-longrun 0.2.0-alpha.3; preserve project identities, knowledge, grants, tasks and service intent.

## 0.8.0 — 2026-11-28

- Default new deployments to compatible globally installed components, while preserving existing services and explicit project-local bindings.
- Share manifest-only discovery and public-export loading across installation inspection, coordinator knowledge and the project startup wrapper.
- Record project-specific machine bindings for Node and component paths, exact versions and manifest digests; reject drift instead of silently changing runtime.
- Verify the selected longrun peer and optional Feishu SDK resolve consistently, and provide a bound CLI entry for generic longrun use.
- Document state-preserving local-to-global migration, host SDK adaptations and coordinated upgrades of shared installations.
- Add isolated regression coverage for global/local selection, binding integrity, dependency closure, project isolation and startup without an interactive PATH.

## 0.7.7 — 2026-11-27

- Add exact js-superagent 0.15.0-alpha.17 knowledge/schema and material-layout compatibility; reject unknown alpha.18.
- Document DSH execution-path auditing, project-owned pinned installs, scoped dependency overrides, and frozen-session upgrade boundaries.
- Keep the older development baseline and validate the new candidate separately before deployment.

## 0.7.6 — 2026-11-27

- Add a maintenance guide for project task overviews, ticket business history and current execution, preserving component ownership, observation times and unknown historical attribution.
- Keep installation inspection manifest-only while reporting missing host-facts components and unobserved capability/synchronization; classify explicitly obtained public capability results separately from the knowledge schema matrix.
- Cover old SDKs, synchronization diagnostics, final-query failure receipts, access revocation and state-preserving upgrade acceptance without adding services or copying live progress into knowledge.
- Add exact js-superagent 0.15.0-alpha.16 compatibility for knowledge schema 14/15 and material package layout, reject unknown alpha.17, and preserve the older development baseline.
- Document the js-longrun 0.2.0-alpha.1 integration combination, upgrade ordering and final-query receipt wording without implying npm publication or live-channel validation.

## 0.7.5 — 2026-11-25

- Explain skill capabilities, deployment stages and goal-based setup choices before guiding first use.

- Improve deployment onboarding with project-specific capabilities, verified task intake and result locations, and everyday follow-up examples.
- Guide the first authorized use through execution and result verification, preserving deployment-only scope and existing task identity.

## 0.7.4 — 2026-11-16

- Add exact js-superagent 0.15.0-alpha.15 knowledge/schema and material-layout compatibility; reject unknown alpha.16.
- Document stable process identity verification after a normal upgraded restart and retain explicit legacy-locality recovery boundaries.
- Preserve knowledge, grants, task state, wrappers and pinned development dependencies.

## 0.7.3 — 2026-11-16

- Add exact js-superagent 0.15.0-alpha.14 package compatibility for knowledge schema 14/15 and public material capabilities; reject unknown alpha.15.
- Preserve existing knowledge, runtime rules, configuration and pinned development dependencies.

## 0.7.2 — 2026-11-16

- Add exact js-superagent 0.15.0-alpha.13 knowledge/schema and material package compatibility, retaining older validated layouts and rejecting unknown versions.
- Explain verified Worker input consumption, host unread-input fault notices and explicit recovery of the original ticket; preserve grants, sessions, budgets and retry limits.
- Distinguish controlled fault-injection checks from real Feishu delivery, and history-first intake from delayed WebSocket delivery during upgrade acceptance.

## 0.7.1 — 2026-11-15

- Validate the exact js-superagent 0.15.0-alpha.12 package layout for coordinator knowledge and material capabilities.
- Preserve existing knowledge, grants, wrappers and recovery boundaries; this compatibility update does not change configuration or retry counts.

## 0.7.0 — 2026-11-15

- Add longrun task-layout and independent runtime-management guidance, preserving existing task roots, frozen runs, host wrappers, operation locks and original service intent.
- Use longrun’s own watcher/timer management and read-only health observations without changing js-superagent, js-agent-runtime or the Feishu callback owner.
- Extend the read-only installation inventory with declared longrun configuration and management exports; never infer service readiness or import runtime code.
- Preserve exact js-superagent 0.15.0-alpha.10 / alpha.11 knowledge and material compatibility, with isolated regression coverage.
- Document explicit old-service cutover, post-write rollback limits, separate timer/card/settlement acceptance and candidate installation provenance.

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
