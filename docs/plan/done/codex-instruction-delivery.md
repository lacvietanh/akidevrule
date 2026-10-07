# Codex instruction delivery

**Created:** 2026-09-30.
**Status:** executed 2026-10-07 on the dev box (no Codex CLI there); Item 6, the runtime probe, stays unverified — the owner dropped manual follow-up checks on 2026-10-07 (`scripts/codex_probe.sh` remains for anyone who wants it). Decisions taken while executing: ownership = a marker-delimited managed block inside `$CODEX_HOME/AGENTS.md` (user lines kept, backup first, regenerated every install), never a whole-file overwrite; `project_doc_max_bytes` written once when absent because the 32 KiB default binds the combined chain and the floor + router are 35.6 KB (research § Amendments); the project bridge is the documented opt-in `project_doc_fallback_filenames = ["CLAUDE.md"]`, printed by the installer and never set by it, with no thin project `AGENTS.md` generated — a pointer file would be the soft hop the research measured as inert.
**Evidence:** [Codex instruction-delivery research](../../research/codex-instruction-delivery.md), baseline v3.6.0 / `1204b7a`.

## Outcome

Codex starts with akidevrule's behavior floor and router through its native global instruction mechanism, without relying on automatic skill invocation or Claude-style imports. Existing project instructions and user-owned configuration remain intact.

## Scope

- Native global guidance generated from canonical rule/router sources; no second authored rule corpus.
- Explicit project compatibility for repositories whose source instructions are `CLAUDE.md`.
- Preserve today's skill sync and script execution rules; do not present them as instruction loading.
- No Claude hook port, new model policy, broad corpus rewrite, automatic project-file migration, or deployment during this plan-authoring task.

## Execution

- [x] Record the target Codex CLI version and inspect supported discovery/config semantics. Verify `CODEX_HOME`, global override precedence, per-directory fallback precedence and instruction budget. Do not assume `@` expansion. — 2026-10-07: `@openai/codex` 0.160.1 latest on npm (none installed on the dev box); vendor pages re-read, facts in `docs/ref/fact-agents-md-standard.md` Codex row; budget is combined global + project (research § Amendments); no `@` expansion documented.
- [x] Agree on ownership before installer changes: managed global content, preservation of pre-existing AGENTS files, custom homes, overrides, backups, reinstall and uninstall. Never overwrite a user file or modify fallback configuration silently. — managed block with markers, `CODEX_HOME` honored, `AGENTS.override.md` reported as shadowing, backups pruned to two, uninstall lines in `README.md`; the fallback key is printed, never written; the only config write is `project_doc_max_bytes` when absent, printed in the summary.
- [x] Generate resident behavior-floor and router bodies from the existing canonical sources, rendering host paths and replacing Claude-specific delivery assertions. Preserve provenance; keep domain rules routed on demand. A pointer-only global bootstrap is not equivalent to resident injection. — `codexInstructionBlock()` in `install.mjs`: preamble + `payload/RULE-agent-behavior.md` + `skills/akirule/SKILL.md`; the router's own Delivery section now carries the Codex line, so no text is rewritten at render time.
- [x] Choose an explicit project bridge: opt-in `CLAUDE.md` fallback for existing projects, or thin project `AGENTS.md` bootstrap consistent with `docs.A5`. Document that fallback is project-only, native files take precedence, and imported Claude dependencies need separate handling. Global delivery must work without this bridge. — opt-in fallback, documented in `README.md` and the arch doc; global delivery is independent of it.
- [x] Add isolated installer checks for missing/existing user guidance, managed updates, custom home, shadowing override, malformed config, reinstall idempotence and uninstall preservation. Verify generated content and budget without paid model calls. — `.github/workflows/install-smoke.yml`: no `~/.codex` created when absent; user text kept; block written once across two runs; `## Routes` and `### B7.` present; key written once before the first table; passed locally against a temp `HOME` on 2026-10-07. Not covered: custom `CODEX_HOME` and a malformed `config.toml` (the installer only prepends a line and never parses TOML).
- [ ] Run a minimal runtime discovery probe only after authorization to spend session quota. Record the exact CLI/version, instruction content observed, project override/fallback case and imported-file behavior. Report residual model-dependent routing; a receipt alone is not evidence of reads or compliance. — hand-off: `bash scripts/codex_probe.sh` on a machine with Codex, after `node install.mjs` there; expected output is a `[RULES] agent (core) …` line and the `B7` heading; anything else means the block did not arrive (check `AGENTS.override.md` and `project_doc_max_bytes` first).
- [x] Update `README.md`, `docs/arch/rule-delivery-architecture.md`, `docs/ref/fact-agents-md-standard.md`, relevant router harness notes, uninstall guidance, CHANGELOG and docs index together. Amend the research with measured results or create a successor if its decision changes. — all done 2026-10-07; research amended in place (Decision unchanged).

## Acceptance

- Global behavior floor and router content actually reach a fresh Codex session; skills-only and execution allowlists are labeled separately.
- Project guidance precedence matches the tested CLI; fallback never substitutes for global guidance.
- No unowned file/config entry is lost; override shadowing and truncation are visible.
- Claude/Antigravity delivery continues unchanged; no unsupported claim of hook parity or import expansion.
- Runtime claims are marked unverified until measured; no install, release, commit or push is implied by this plan.
