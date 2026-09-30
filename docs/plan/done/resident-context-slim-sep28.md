# Slim the always-resident rule context (second pass)

**Status: done 2026-09-30** · opened 2026-09-28 · rule: `payload/RULE-docs.md` A5 · predecessor: `docs/plan/done/trim-resident-rule-context.md`

Every Claude Code session loads about 86 KB (~25k est. tokens) of rule text before it reads a project file. The cost that matters is not money, since the prefix is cache-read after the first turn, but dilution: a rule in 86 KB weighs less than the same rule in 55 KB. The corpus also breaks its own `docs.A5` bar in three places. This plan cuts about 30 KB (~35%) without removing a rule. Three independent items, each reversible; take any subset.

**Evidence.** Sizes below come from `wc -c` and per-section `awk` on the deployed files (chars, not tokens). Token figures use ~3.5 bytes/token and carry roughly ±15% error. Nothing here measures whether the resident rules change agent behavior; see Unscheduled. No paired `docs/research/` doc: the owner scoped the output to a plan, so the evidence is inlined, as in the predecessor.

## Baseline

| Source | bytes | share |
|---|---:|---:|
| `payload/index.md` (deployed) | 21,405 | 24.8% |
| `RULE-agent-behavior.md` | 21,890 | 25.3% |
| `RULE-coding.md` | 15,216 | 17.6% |
| `RULE-pattern-core.md` | 8,034 | 9.3% |
| `skills/akirule/SKILL.md` | 11,518 | 13.3% |
| `~/.claude/CLAUDE.md` (template + installer block) | 3,837 | 4.4% |
| `~/.claude/CLAUDE.local.md` (machine-local, not distributed) | 4,573 | 5.3% |
| **total** | **86,473** | 100% |

`index.md` has regrown from 15.5 KB after the August trim to 21.4 KB, mostly the manifest Purpose column (11.6 KB) and the cross-cutting lens (5.8 KB, up from 3.7 KB).

## Item 1 — stop importing `index.md`; make it a maintainer and `akihelp` manifest

**Files**: `claude/CLAUDE.md`, `skills/akirule/SKILL.md`, `payload/RULE-agent-behavior.md`, `payload/RULE-docs.md` A5, `payload/index.md`, `docs/arch/rule-delivery-architecture.md`, `README.md`, `CHANGELOG.md` · **Saving**: ~20 KB · **Confidence**: high on mechanism, medium on the lens (see counter-argument).

`SKILL.md`'s route table and `index.md`'s manifest both answer "which file, when". The router is the one that decides loading, so it is the one that must be resident. Who actually needs `index.md` at run time:

| Consumer | Needs | Resident needed |
|---|---|---|
| `[RULES]` receipt in `SKILL.md` | the Topic column, as the name vocabulary | yes, only that column |
| `docs.A5` item 5 | § Precedence (900 B) | yes |
| `pattern.A7` | § Cross-cutting lens as an address map | no, read on demand |
| `akihelp` step 1 | full manifest | no, it `Read`s it explicitly |
| `payload/GEMINI.md` | Topic column for the receipt | no, Gemini does not import `index.md`; it views it |
| `aki_version_check.mjs` | file exists | no |

Steps:
- [x] `SKILL.md`: add each file's topic to the route table's File cell (`RULE-docs.md` · `docs`). This makes the router the single resident source for topic names. Point the receipt table at it.
- [x] `RULE-agent-behavior.md`: add § Precedence (the 900 B block from `index.md`), and repoint `docs.A5` item 5 from `index.md § Precedence` to the new address. Precedence is behavior, so it belongs with the behavior floor, not in `CLAUDE.md`, which `docs.A5` item 5 reserves for facts and limits.
- [x] `claude/CLAUDE.md`: remove the `@…/index.md` import. `install.mjs` needs no change: it validates only the router import.
- [x] `index.md`: drop the Purpose column's contents-of-file prose down to one clause per row (it now serves `akihelp`, README readers and rule authors, not the model on every turn); delete the "Five files load mechanically" paragraph's history and rewrite it to four. Keep the Addressing scheme and the Cross-cutting lens.
- [x] Update `docs/arch/rule-delivery-architecture.md` and `README.md` § How rules load: five resident files become four.
- [x] Verify: install into a scratch `CLAUDE_CONFIG_DIR`, read the resulting `CLAUDE.md` for four imports, and confirm `akihelp` still resolves `~/.aki/akidevrule/index.md`.

**Counter-argument.** `index.md` was promoted to a resident import on purpose (`docs/research/core-floor-promotion-aug6.md`), and the August plan kept the lens resident because a lens absent at apply time invites local restatement of a rule (`docs/plan/done/trim-resident-rule-context.md` Item 2). This item reverses the second outcome. Mitigation: `pattern.A7` and `agent.A4`, both resident, already name the lens by address, and a model that needs it can `Read` it. If the restatement risk reads as larger than ~1.5k tokens per session, keep the lens resident by moving it, alone, into `SKILL.md`; the rest of the item stands.

**Outcome 2026-09-30 (owner ruling: "akirule skill chính là router, không cần file index trong payload nữa").** Went further than the steps above: `payload/index.md` deleted, not trimmed. Topic names moved into the router's File cell; § Precedence became `agent.B6`; the Groups table and the lens became `docs/arch/corpus-map.md` (repo-only, not installed); the manifest Purpose prose was dropped — `README.md` is the human manifest. Consumers retargeted: installer printout derives from `AG_RULE_MAP` + router clauses, `aki_version_check.mjs` intact-test uses `RULE-agent-behavior.md`, smoke asserts it, `akihelp` reads the router table, `GEMINI.md` derives topics from rule names; akimcp's `rule-version-core.cjs` only tests `CHANGELOG.md || index.md` existence, so it needs no change. Resident now: agent 23.4 KB + router 14.1 KB + template 0.9 KB.

## Item 2 — the global `CLAUDE.md` template

**Files**: `claude/CLAUDE.md`, `install.mjs` (installer block) · **Saving**: ~2 KB · **Confidence**: high.

The installed file is three layers: the `claude/CLAUDE.md` template, a block `install.mjs` appends with this machine's absolute paths, and an import of the machine-local `CLAUDE.local.md`. It is a payload file installed on every machine, not a per-machine file. Defects:

| Defect | Where | Fix |
|---|---|---|
| "Edit source, not the deployed copy" appears three times: template § Shared Aki rule source, the installer block, and `CLAUDE.local.md` on the owner's box | template + installer | delete the template section; keep the installer block (it carries the real path); add to it the one step only the template had: read the source repo's `CLAUDE.md` before editing |
| History of why the router is imported instead of a skill duplicates `index.md` and `docs/research/rule-delivery-force-load-sep25.md` | template § Core rules | keep the import list and one line naming the second-hop caveat; delete the narrative (`docs.A5` tests 4 and 5) |
| `ref-ECC` guard is dead text on every install: `install.mjs` excludes `ref-ECC`, and `payload/ref-ECC` does not exist in this repo | template | delete; a machine that copies that corpus in records the guard in its own `CLAUDE.local.md` |
| Named local corpora fails the reach test (matters only when the user names a corpus) | template | one line pointing at `CLAUDE.local.md` |
| Opening line "Keep global context small" sits above 60 KB of imports | template | delete |

- [x] Rewrite the template to: four imports, one corpora line, the second-hop caveat. Target ~1.2 KB before the installer block.
- [x] Extend the installer block with the read-repo-`CLAUDE.md`-first step.
- [x] Verify: run the installer against a scratch config dir and diff the result against the target shape; confirm the `CLAUDE.local.md` import line and create-only behavior are unchanged.
- [x] `CHANGELOG.md`, with the reasoning per the repo `CLAUDE.md`.

**Outcome 2026-09-30.** Template is two imports, one gate paragraph, one corpora line (`ref-ECC` guard and the narrative deleted); the installer block gained "read the repo `CLAUDE.md` first" and names the three source dirs.

## Item 3 — `RULE-agent-behavior.md` and `RULE-coding.md`

**Files**: the two rule files, `skills/akiflow/references/harness-facts.md` · **Saving**: ~8 KB · **Confidence**: high for 3a–3c, medium for 3d.

Section sizes (chars): agent A5 4.7k, A3 4.5k, C3 2.0k, A2 1.5k; coding B3 4.0k, B5 3.7k, C2 1.1k.

**3a — agent A5 (delegating to a worker), 4.7k → ~1.5k.** It fires only when a worker is about to be spawned, a minority of turns, and about half of it is cost economics (stateless vs persistent workers, session ids, cache ratios) that `harness-facts.md` already hosts. Keep the mechanics: a worker inherits nothing, set model tier and effort explicitly, read-only by mechanism, the `[RULES]` receipt, judgment does not delegate down. Move the rest.
- [x] Spike settled by the vendor facts already on file (hooks doc read 2026-09-29): a `PreToolUse` hook can return `additionalContext`, but it fires after the model has composed the `Agent` call, so the text can only shape the *next* spawn — that is the per-turn reminder rejected 2026-08-03, not delivery at the moment it matters. A deny-with-reason gate on `Agent` (the route-gate shape) would need to know which spawns need a rule brief and which are bare lookups, which no path pattern tells it. Decision: no hook; A5 trimmed 4.7k → 2.6k, the cost economics and host tiers live only in `harness-facts.md`. Reopen if `aki-conduct` traces a worker LOAD-fail to a brief that named no rule file. Spike first: confirm whether a `PreToolUse` hook on `Agent` can inject context into the model at the installed Claude Code version, and how that interacts with `aki-hands` and friends. If yes, ship the full A5 text through a hook so it arrives deterministically at the moment it matters, at zero resident cost. If no, keep the trimmed A5 resident. Do not route it: corpus history shows a routed file is a file skipped (`docs/research/core-floor-promotion-aug6.md`). Rung: 4, probe mechanically; the spike is mine to run, not an owner hand-off.

**3b — coding B3 + B5 are one topic written twice, 7.7k → ~4.5k (done 2026-09-30: one section `B3`, address map `coding.B1-4`, every `coding.B5` reference repointed — `agent.B3`, `release.B9`, `akiopen`, `corpus-map`, the owner's `CLAUDE.local.md`).** B3 defines what counts as verified; B5 defines who performs the check. B3's four gap bullets (no gating on manual tests, running the app is not default, one hand-off ledger, external-action completeness) are the raw material of B5's ladder. Merge into one section: a three-line honesty floor, the six-rung ladder, the ledger rules. Keep the `README`/`py -3` worked example and the list of forbidden rationalizations: both record real observed evasions. Keep the address `coding.B3` for the merged section; `coding.B5` references across the corpus are repointed in the same change (grep first, edit every site once).

**3c — one rule in two files (done 2026-09-30: `coding.B3` bullet is a pointer to `agent.B3`).** The ban on `git stash`/`checkout`/`reset` to attribute a failing check is in `agent.B3` and `coding.B3`; `agent.B3` itself calls the latter "the narrow instance". Keep the root in `agent.B3`, reduce the coding side to a pointer.

**3d — smaller cuts.**
- [x] `agent.A2`: keep the three habits (read/edit with the direct tools, find all edit sites before editing, batch independent calls). Reword the rationale from "every call re-sends the whole conversation" to "round trips are the unit of cost". The first is true for tokens and misleading for money under caching.
- [x] `agent.C3`: the YAML-merging example is ~700 B for a one-line rule. State the rule ("never merge lines something parses: frontmatter keys, `@import` lines, marker-prefixed lines"); move the example to `docs/`.
- [x] `agent.A3`: keep. It covers the highest-frequency violations. Shorten only the "Self-sufficiency" kill-test to the length of its siblings.

## Item 4 — the route gate, and `coding`/`pattern` out of the imports

**Files**: `claude/hooks/aki-route-guard.mjs`, `install.mjs`, `claude/CLAUDE.md`, `skills/akirule/SKILL.md`, `payload/index.md`, `payload/RULE-pattern-core.md`, `docs/arch/rule-delivery-architecture.md`, `README.md`, `skills/akihelp/SKILL.md`, `scripts/second_hop_audit.py`, `CHANGELOG.md` · **Saving**: 23.2 KB in every session with no code edit, 0 in code sessions (the `Read` costs what the import cost) · **Confidence**: high on the mechanism (seven synthetic stdin cases pass, 46 ms on a 2 MB transcript), unmeasured on live model behaviour after a denial.

Decided 2026-09-30 by the owner, overruling the 30-day watch in `../research/rule-delivery-second-hop-sep29.md` § Amendments: gate and demotion ship together to the dev box; downstream release waits on a few live sessions here. Rationale in the CHANGELOG entry.

- [x] Hook, installer registration, three-import template, router rows and receipt semantics, manifest, arch doc, README, akihelp, CI smoke assertion, CHANGELOG.
- [x] 2026-09-30 sweep after the owner's agy transcript (a source-size question loaded `coding`+`pattern`): router rule 2 gains "a lookup routes nothing", the `coding`/`pattern` clauses drop "any talk about code / when in doubt, load", the installer derives the Antigravity descriptions for both from the router instead of hardcoded text, `akiship`'s receipt no longer lists them as core, the `index.md` lens table lost a stray blank line.
- [x] Owner ruled one test enough (2026-09-30): a source-size question in a code project on both `claude` and `agy` loaded no routed file. Owner: a few live sessions on the dev box that edit code, `.md` and a `.vue`; watch for a deny that the model does not resolve by reading (the one spike no synthetic case settles), and for a false denial (a rule read that the scan missed — the three-denial cap bounds the damage, but it is a bug to fix, not a feature).
- [x] 2026-09-30 challenge (aki-challenger, clean context) fixed in the same batch: `payload/GEMINI.md` still ordered an unconditional session-start read of `coding`+`pattern` on Antigravity (the actual cause of the agy size-question load; the demotion had not reached that surface); router rule 2 collided with rules 3 and 5 (project binding ON for every task) — rule 2 now precedes them for lookups; the gate had no path exemption, so a Q&A session writing a scratchpad script or a memory note re-loaded 23 KB — now ungated: `/tmp/`, `*/scratchpad/*`, the config dir, `/.aki/`, and any path outside `cwd`; `MultiEdit` added to the matcher; `index.md` lost its import-history paragraph (in the research doc and CHANGELOG already).
- Known gate residues, accepted (owner ruling 2026-09-30: the hook is a safety net for rare long-context or post-compaction misses, not a wall), each with its reopen trigger: edits made through Bash (`sed -i`, redirects, heredocs) are invisible to the hook — 9 of 191 Mac sessions wrote files only that way; reopen if `aki-conduct` traces a LOAD-fail to one. Extension set omits `.json`/`.toml`/`.yaml`/`.html`/`.mdx` and extensionless files — a config edit is not gated on `coding`; reopen on a config-file violation. Nuxt detection reads `cwd` only, a monorepo subdirectory is missed; reopen on a `stack` miss there. A `Read` with `limit` or a `head` fragment counts as read — "in full" is not enforced. A subagent whose transcript file is not found falls back to the parent transcript. The rules arrive at the first edit, after exploration and planning — `coding.B2`/`pattern.B2-B3` govern the step before; the router clause still carries that step.
- [x] Decided 2026-09-30 with 3b: `coding.B3` stays in `coding` — an audit-only session has `agent.B2` (verified vs assumed) and `agent.B5` (read-only) resident, which is the floor an audit needs; the ladder is only needed once there is a check to perform, i.e. a code turn. `C4` stays where the security floor is applied. Decide whether `coding.B3`/`B5`/`C4` (verification honesty, the hand-off ladder, the security floor) belong in `RULE-agent-behavior.md`: they are behavior, and an audit or report-only session no longer has them resident. Fold into Item 3b (which already merges B3 and B5) rather than a separate pass.
- [x] Release: nothing blocks it; `install-smoke.yml` asserts the hook file, nothing asserts the settings entry — add that if the install ever regresses.

## Order and dependencies

Items are independent. Suggested order: Item 2 (no dependency, smallest risk), Item 1 (larger, touches five docs), Item 3 (3c, 3b, 3d, then the 3a spike). Every item changes `payload/`, `skills/` or `claude/`, so each needs its own `CHANGELOG.md` entry with reasoning, a `README.md` staleness check, and a check against `skills/akihelp/SKILL.md` per the repo `CLAUDE.md`. The `install.mjs` runs only after the edits are complete, per `~/.claude/CLAUDE.md`. Nothing is committed from the dev box (`CLAUDE.local.md`); the working tree is left for the Mac.

## Expected result

| | bytes |
|---|---:|
| Baseline | 86,473 |
| Item 1 | −20,000 |
| Item 2 | −2,000 |
| Item 3 (3a–3d) | −8,000 |
| **After** | **~56,500** (−35%) |

All savings are estimates from section sizes, not from edited files. Re-measure with `wc -c` after each item and record the actual figure here.

## Unscheduled — deliberate, with reasons

- **Removing the reasoning attached to each rule.** Kept. The repo `CLAUDE.md` requires records to carry their reasoning, and a bare rule is applied more rigidly and dropped more easily.
- **`coding.C2` code examples (~600 B).** Not scheduled. Dropping them risks the model producing a different `Result` shape; only cut with a before/after trial.
- **`coding.C5` Unicode.** Kept. Fails the reach test, but it is a non-derivable fact with high cost when missed.
- **Measuring whether the resident rules reduce violations.** The `[RULES]` receipt measures delivery, not compliance, and `scythe.py` sees only wrap and comment violations. A repeated 10-task run with and without one section, counting violations, is the cheapest instrument. Not scheduled because it spends session quota (`agent.B3`); worth doing before any cut beyond this plan.
- **`CLAUDE.local.md` on the owner's box.** Its own duplicate reporting bullets were already handled by the predecessor's Item 3 and are machine-local, outside this repo's distribution.
