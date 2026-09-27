# CHANGELOG shape and the releases.json highlight tier — /akithink decision record

## Start time
2026-09-26, right after 3.4.0 shipped, when the owner noticed this repo's own CHANGELOG ordered its sections differently from release to release.

## Initial purpose
Two questions. (1) Why do CHANGELOGs across the ecosystem disagree on section order and vocabulary, and what single rule stops it? (2) The public `/releases` page depends on a `highlight` flag that agents keep forgetting — is it in the rule corpus at all, and what should the rule say so the headline of a version is chosen well, not just present? Constraints at the time: the corpus is public, so the rule may not cite the private UNIDOC standard or a private site as its source of truth; no complex backfill of historical entries (owner decision); no `Internal` CHANGELOG section (owner accepted the recommendation).

## Strategy
Mechanical scan of all 25 `CHANGELOG.md` files under the workspace (section vocabulary, per-version order, heading level, dating) plus every `app/data/releases.json` (change keys, highlight coverage, `new`-without-highlight); a Haiku retrieval pass over 19 versions in 4 repos for bullets filed under the wrong section; grep of the corpus, the skills, UNIDOC and the reference site's page for the word `highlight`; then the deep-think modules (goal chain, first principles, critique, techbiz lens) on both questions before writing anything.

## Checklist
1. ✅ 25 CHANGELOGs scanned; 21 have out-of-order versions; up to 13 orderings in one file; 13 invented headings; 2 repos with version headings at H3; 1 repo date-headed with no versions.
2. ✅ 0 of 98 sampled bullets misfiled — the problem is order and vocabulary, not content placement.
3. ✅ `RULE-release.md` C1 named a vocabulary with no order; B4 named a different order; no skill or script checked either.
4. ✅ `highlight`: 0 mentions in `payload/`, `skills/`, `claude/`; defined only in UNIDOC §2.5 as a pattern pointing at the reference site, and in that site's page comment. Coverage: 4 of 11 sites have no highlight key; the reference site has 8 versions with a `new` change and no highlight.
5. ✅ Detector written and run on every repo; every finding inspected on 4 repos was a real violation.

## Result

### Goal chain
Consistent section order → an agent or reader finds the same thing in the same place in any repo → the record is trusted and mechanically checkable → releases cost less and lie less. Highlight present and well chosen → the public page shows what a visitor gains, not a flat log → a visitor or crawler judges the product alive and worth using (UNIDOC's stated purpose for the page; `biz.C1`). The two goals meet at one point: the same accumulation feeds both surfaces, so the developer record must be complete and the public one must be weighted.

### First principles
- Fact: Keep a Changelog already defines the order; the rule adopted its vocabulary and dropped its order. An order chosen per release is unobservable across releases, so it cannot converge — the same reasoning as `ui.A1`'s "the second copy is the STOP".
- Fact: `highlight` is a per-change boolean rendered as a distinct card; `title` is a per-version headline string. They are complementary (title summarizes, highlight points) and must agree.
- Assumption rejected: "the agent forgets highlight because it is careless". It forgets because the instruction lived in a private doc it never loads and in a comment on one page; the rule it does load said nothing. A rule fix is the flow fix (`pattern.A8`); the detector is the gate, not a runtime guard.
- Assumption rejected: "a detector can decide highlight". Whether a change is the headline is judgment (`agent.A5`: judgment does not delegate downward, not even to a script). The detector can only surface a candidate — a version with a `new` change and no highlight — so its tag is `(review)`, like scythe's `[YAP]`.

### Critique
- Steelman "fixes first" (B4's old order): a patch reader wants fixes first. Rejected: importance-ranking is exactly the per-release choice that drifted; the standard's fixed order costs one habit and buys machine-checkability.
- Steelman an `Internal` section: the owner's first instinct, and tachnhac already uses it. Rejected: `releases.json` carries `internal` for the audience that needs the badge; in the developer channel it is a second taxonomy that every invented heading (`Docs`, `Infra`, `Refactored`) would then compete with. `Changed` absorbs it.
- Attack the highlight rule: "at most two" may be wrong for a large release bundling three tools. Answer: three cards on one version means none stands out; a release that large should have been two releases (`release.A5` materiality). Reopen if a real release proves otherwise.
- Attack the detector: `[HILITE]` fires on every fix-only version? No — it fires only when a `new` change exists. It will still fire on a minor `new` line that does not deserve a card; that is why it is a review line answered in writing, not a failure.
- Inversion: to guarantee highlight is forgotten again, put the criterion in a page comment and a private doc and give the gate nothing to check. That was the state before this change.
- Pre-mortem: six months on, entries are ordered but highlights are chosen badly (every version highlights something, or the same "improved performance" line). The wording contract (benefit-first, mechanism as proof, title agrees) and the "zero is valid" clause exist for that failure; the reopen trigger is a page where every version wears a card.
- Second-order: the reference site's page comment and UNIDOC §2.5 now duplicate a criterion the rule owns. UNIDOC may reference the rule (one-way allowed); the page comment should shrink to a pointer. Both are outside this change's scope and listed as follow-ups.

### Techbiz lens
The value is concentrated in two lines of rule text and one `--latest` script run per release; the historical backfill would cost dozens of hand edits across 25 repos for a page nobody reads backwards. Smallest solution shipped; backfill rejected.

### Verification
Detector output inspected line by line on this repo, tachnhac, kinhdich and akitao: every `[ORDER]`, `[SECTION]`, `[LEVEL]` and `[TYPE]` line matched a real defect in the file (including `Internal` and `Performance` headings and an `added` type key the earlier hand scan had missed). `AkiNuxtCf` and the reference site's newest version exit 0. `scythe.py` exit 0 on every edited file.

## Decision
**Action** — `payload/RULE-release.md` C1 (canonical shape), C2 (highlight tier), C4 (script replaces greps), B4 (body order points to C1), B7 step 4 (script in the gate); `skills/akiflow/scripts/release_lint.py`; `skills/akiship/SKILL.md` gate bullet; `payload/index.md` release row; `README.md` script list; `CHANGELOG.md` `[Unreleased]`.

**Rejected/closed** — `Internal` CHANGELOG section; folding the detector into `scythe.py`; backfilling historical entries across repos.

**Follow-up (outside this repo, not started)** — UNIDOC §2.5 "highlight" pattern should point at `release.C2` instead of the reference site; the reference site's `releases/index.vue` comment should shrink to that pointer; its 8 `[HILITE]` candidates and `Internal`/`Performance` headings are that project's own release-time fixes.

**Cross-references** — `docs/research/release-b1-web-drift-ssot-aug22.md` (the B7 gate this detector joins); `docs/research/penalty-cards-scythe-aug4.md` (the output grammar reused).
