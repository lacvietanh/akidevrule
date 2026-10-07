# Codex instruction delivery

Status: amended 2026-10-07

**Start time:** 2026-09-30 20:47 Asia/Ho_Chi_Minh.

**Initial purpose:** determine whether akidevrule needs an execution plan for native Codex instruction discovery. Baseline: v3.6.0, commit `1204b7a`, clean working tree before this research. Scope is Codex delivery; no installer or user-configuration changes.

**Strategy:** compare the source installer and existing delivery docs with official OpenAI documentation; separate global guidance, project guidance, skill discovery, and execution permissions.

**Checklist:**
- [x] Read repository instructions, docs index, instruction-file reference, architecture, Claude template, and installer delivery tail.
- [x] Search the source tree for Codex delivery, AGENTS.md and fallback configuration; no active Codex instruction-delivery plan found.
- [x] Read official Codex instruction-discovery documentation.
- [x] Evaluate native delivery and alternatives without running a paid model session.

## Result

### R1. Vendor behavior

Official source: [OpenAI — Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), read 2026-09-30, sections “How Codex discovers guidance” and “Customize fallback filenames”.

- Global discovery uses `CODEX_HOME` (default `~/.codex`): first non-empty `AGENTS.override.md`, otherwise `AGENTS.md`.
- Project discovery walks repository root to current working directory; each directory contributes at most one file, ordered `AGENTS.override.md`, `AGENTS.md`, configured fallback names. Later directory guidance overrides earlier guidance.
- `project_doc_fallback_filenames = ["CLAUDE.md"]` enables project fallback only. It does not load Claude's global guidance and is shadowed by a native instruction file in the same directory.
- Default combined project-instruction limit is 32 KiB. Filename compatibility does not establish Claude-style `@` import expansion; that behavior remains unverified for Codex.

### R2. Current distribution

Evidence: `install.mjs` “Other CLI skill roots” calls `syncAkiSkills(CODEX_SKILLS_DIR)`; source-tree search found no Codex global instruction generation or fallback configuration. `lib/permissions.mjs` provides Codex script execution rules, a separate mechanism. `README.md` installer step 5 explicitly says skills-only. `skills/akirule/SKILL.md` requires invocation on other harnesses; the router body is not automatically resident merely because its skill is discoverable.

`claude/CLAUDE.md` depends on native Claude `@` imports to deliver the behavior floor and router. Copying that file to Codex is not evidence that those imported bodies arrive. `docs/ref/fact-agents-md-standard.md` groups Codex under a logo-list source and does not document its native global/fallback precedence.

**Verification:** source inspection and vendor documentation only. No Codex version, runtime auto-load, import expansion, or rule-compliance measurement was performed. AkiMCP effective-context delivery in a web session is not proof of CLI startup delivery.

**Corroborating links:** `../arch/rule-delivery-architecture.md`; `../ref/fact-agents-md-standard.md`; `../../install.mjs`; `../../claude/CLAUDE.md`; `../../skills/akirule/SKILL.md`.

### R3. Decision reasoning

Goal chain: load the same baseline in Codex without owner reminders → avoid missing rules on unfamiliar projects → reliable cross-harness work.

Preferred direction: generate Codex-native resident behavior-floor and router content from canonical sources, with a separately explicit project-compatibility policy. This is generated delivery, not a second authored corpus. Keep routed domain rules on demand; do not claim Claude's route hook exists in Codex.

Alternatives: skills-only is smallest and preserves today's contract, but leaves startup routing dependent on invocation; CLAUDE.md fallback reuses project content cheaply, but does not fix global delivery or import semantics; symlinking Claude's global file preserves one file but retains unverified imports and may shadow user guidance.

Critique: native generated guidance adds ownership and context-budget obligations; overwriting an existing global file or adding fallback silently would be a failure. An existing global override can shadow managed guidance. Six-month failure scenario: docs claim parity while only a pointer or truncated router arrived. Acceptance therefore requires content-level evidence, user-content preservation, explicit limits, and honest distinction between deterministic injection and subsequent model-dependent reads. Business analysis is out of scope.

## Decision

**Action:** create [Codex instruction delivery plan](../plan/done/codex-instruction-delivery.md). Implementation remains proposed; shared configuration changes require separate authorization. No payload/rules/skills/installer changes in this research.

**Cross-references:** future implementation must synchronize README, delivery architecture, instruction-file facts, installer ownership/uninstall behavior, router harness notes and CHANGELOG. Existing records are not rewritten by this research. Implementation landed 2026-10-07: `install.mjs` (`installCodexInstructions`, `ensureCodexDocBudget`), `docs/arch/rule-delivery-architecture.md` § Codex, `docs/ref/fact-agents-md-standard.md` Codex row.

## Amendments

- 2026-10-07 · § R1: re-read the same vendor page and the config reference ([learn.chatgpt.com config reference](https://learn.chatgpt.com/docs/config-file/config-reference)); the 32 KiB `project_doc_max_bytes` limit applies to the **combined** chain — "Codex skips empty files and stops adding files once the combined size reaches the limit" — so it binds the global file too, not project files alone as R1 implied. The behavior floor (21.4 KB) plus the router (14.2 KB) already exceed it, which is why the installer writes the key. Latest `@openai/codex` on npm that day: 0.160.1; the dev box has no Codex CLI, so runtime loading stays unmeasured (`scripts/codex_probe.sh` is the hand-off).
- 2026-10-08 · § R2 Verification: runtime loading measured with `scripts/codex_probe.sh` on `codex-cli 0.160.1` — a fresh session in an empty repo returned `[RULES] agent (core)` and the `agent.B7` heading verbatim, so the managed block in `~/.codex/AGENTS.md` reaches the session. Project-level override/fallback and import expansion remain unmeasured.
- 2026-10-07 · § R2: no longer current — the installer now writes the managed block; the paragraph stands as the state this research was written against.
