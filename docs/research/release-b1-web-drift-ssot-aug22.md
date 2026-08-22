# release.B1 web-drift threshold & akiship SSOT consolidation — /akithink decision record

## Start time
2026-08-22, immediately after the 0.24.0 → 0.26.0 production-jump incident was reported.

## Initial purpose
Two questions, raised by one incident. A web app minted 0.25.0 locally, never pushed/tagged/released; a later `/akiship` run — instead of applying `release.A5`'s squash-unpublished recovery — backfilled the orphan as a real tag + GitHub Release and minted 0.26.0 on top, so production received 0.24.0 → 0.26.0 in one deploy.
1. Root gap 1: `release.B1`'s Drifted state fired only at ≥2 unshipped versions — a threshold that fits distributed-artifact apps but contradicts A5's zero-tolerance for continuously-deployed web apps. How should the threshold be typed per app, without touching A5's wording (owner constraint)?
2. Root gap 2: the completion-intensity phrase list and the B8 three-condition escalation floor existed near-verbatim in six places (`skills/akiship/SKILL.md` frontmatter + body ×2, `release.B8` ×2 bullets, `payload/index.md` manifest row, `README.md`). Which single site owns them (`pattern.A1`), given that the 2.6.0 activation fix *deliberately* duplicated the guard into the resident frontmatter `description:`?

Context at decision time: corpus at 2.6.0 (released same day); the akiship literal-activation gate (2.6.0) already in force; `docs/arch/rule-delivery-architecture.md` records the residency rule "a trigger word in a `description:` carries its own guard, in that same line".

## Strategy
Read `payload/RULE-release.md`, `skills/akiship/SKILL.md`, `payload/RULE-docs.md` in full; grep-sweep all duplication sites; audit the core files and `index.md` cross-cutting lens for release pointer overgrowth; draft the diff proposal; then run the full `/akithink` protocol (goal excavation → first principles → mandatory critique → pre-mortem/second-order) over 4 rounds on the draft before execution. Techbiz lens skipped — internal tooling, no market-facing dimension.

## Checklist
1. ✅ Read target files in full; confirmed both root gaps at exact lines.
2. ✅ Grep sweep: 5 sites for the phrase list, 4 for the escalation floor.
3. ✅ Core-file audit: `agent.B5`, `coding.B3`, lens-table release pointers all within "address map only" policy; only overgrowth found was the three-condition enumeration in `payload/index.md`'s manifest row.
4. ✅ Critique rounds on the draft (see Result).
5. ✅ Verified `docs/arch/rule-delivery-architecture.md` states the residency rule generically and quotes no frontmatter verbatim — no arch-doc change needed.

## Result
**Both fixes hold; the critique produced one material revision to the draft.**

- **B1 typed threshold (web ≥1, distributed ≥2)** survived its steelman ("keep ≥2 uniform, A5 already states zero-tolerance"): the incident proves runs mechanically follow the *state table*, not A5's prose — a table row contradicting A5 is worse than a longer row. Crucially, the incident never even reached the Drifted row: the **Pre-bump** condition (`manifest == CHANGELOG top`) is decided from local files alone, and an orphan with a matching manifest reads as "nothing pending". So the fix needs two parts — the typed threshold *and* a production-baseline confirmation before a web app may conclude Pre-bump/Mid-release.
- **Critique-forced revision:** the draft's step-3 sentence made the remote check unconditional, adding a network round trip to *every* changelog-entry recording and breaking offline work. Scoped to the moment of concluding *Pre-bump*/*Mid-release* only; *Unreleased open* (the daily state) needs no remote check. Offline/unverifiable case is already covered by A5's existing "if unclear whether a version shipped, treat it as shipped and ask".
- **Pre-mortem, crashed mid-release run** (minted, not yet pushed, session dies): the next cold start reads Drifted ≥1 and squashes — safe, because squash-then-remint reproduces the same version number from the same accumulation (`release.A4` severity is deterministic); recovery converges, nothing is lost.
- **"Never backfill forward" clause** added to the Drifted action: the incident's exact wrong move (turning A5's squash into a B4-style backfill) was forbidden nowhere; B3's renumber protection shields *published* versions only, and an orphan was never public.
- **SSOT consolidation is safer than the status quo, not a trade-off against it** (bait-and-guard analysis): the activation risk is the model *associating* a resident word with activation authority, not the word's presence per se. Removing the full four-phrase list from the `description:` removes bait and guard symmetrically; keeping one exemplar ("trọn vẹn", the incident word) with its guard in the same sentence satisfies the arch doc's residency rule while leaving fewer permanently-armed bait words resident. The literal-token gate remains the load-bearing defense.
- **"B8 not loaded during a run" attack failed:** every execute run must read `RULE-release.md` (SKILL.md line "read that file first"; the checklist is B7, unusable without it), so B8's canonical list is guaranteed present when it matters; a consult answer without B8 costs only completeness, and consult is read-only.

**Verification:** static reading of the rule/skill files and the incident narrative; the duplication counts are mechanical grep results. The B1 behavior change is not runtime-testable inside this corpus repo — it is exercised by the next real `/akiship` run on a web project (see Assumptions).

**Corroborating links:** `docs/research/akiship-literal-activation-aug22.md` (the residency mechanics this decision preserves), `docs/arch/rule-delivery-architecture.md` § "The same asymmetry inside a skill", CHANGELOG 2.4.1/2.4.0/2.6.0 entries (history of B8 and the activation gate).

## Decision
**Action** — executed same day in `docs/plan/done/release-b1-web-drift-ssot.md`: `payload/RULE-release.md` (B1 step 3 + Drifted row + two B8 canonical labels), `skills/akiship/SKILL.md` (description, activation gate, Phase 1.3, Phase 3.4, Boundaries), `payload/index.md` manifest row, `README.md` akiship row, `CHANGELOG.md` `[Unreleased]`.

**Rejected alternatives:**
- *Keep the uniform ≥2 threshold, rely on A5's prose* — rejected: the incident is the falsifier; the table is what runs execute.
- *Keep the full phrase list in the frontmatter `description:` as a second allowed site* — rejected: two verbatim lists drift (they already had), and the residency goal is met by one guarded exemplar.
- *Unconditional remote check in B1 step 3* (the draft's own first version) — rejected in critique: per-entry network cost and offline breakage for zero added safety on the daily path.

**Assumptions to monitor:**
1. One guarded exemplar in the `description:` suffices to prevent recurrence — if a false activation ever recurs, the fix is tightening the literal-token gate, never re-duplicating the list.
2. The Pre-bump-time remote check is cheap enough in practice — if it proves noisy, insert a local pre-check (is the mint commit pushed?) before the remote fetch.

**Cross-references:** `payload/index.md` manifest row (trimmed), `README.md` akiship row (trimmed). Core files and the cross-cutting lens table audited and deliberately unchanged.
