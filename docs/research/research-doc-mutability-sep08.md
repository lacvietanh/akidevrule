# Research docs: immutable event record, or living document?

**Start time:** 2026-09-08.

**Initial purpose:** the owner's pinned note (`.akidevsync/notes.json`, 2026-08-22): "rule docs: research không nhất thiết là immutable, nó nên như vậy, chứ vẫn cần edit cập nhật, đính chính." `docs.B2` currently states a research doc is an immutable event record, never rewritten; any revisit opens a successor doc with a numeric suffix and a `Status: superseded by` line. Question: what may change in a research doc after it is written, by what mechanism, and where is the line past which a new doc is required? Context: corpus at 2.7.0 plus the unreleased batch; 25 research docs in `docs/research/`; `docs.C` (drift audit) and `release.B7` step 5 both read research docs as a stable baseline.

**Strategy:** measure the corpus's own compliance first (`git log --follow` per research doc, diff the post-creation edits), classify what those edits actually were, then run `think.B3` critique on three candidate designs and pick by the goal chain, not by purity.

**Checklist:**
1. Count post-creation commits per research doc. Result: 7 of 25 docs edited after creation; 4 of those beyond a repo-wide rename.
2. Read the edits. `headless-cli-workers-aug1.md` (2026-08-03, two days after creation): section R9 rewritten from "owner-supplied and unverified" to "verified 2026-08-02", the context line rewritten, a new section R12 appended. No marker, no successor doc. `versioning-critique-akithink.md`: touched by a release rewrite and a consistency sweep. Others: path renames after the repo rename.
3. Find the existing in-corpus precedent for a marked correction: `skills/akiflow/references/harness-facts.md` carries three "A prior version of this row said … that reading was too generous" annotations, inline, dated by the surrounding row. That is a `ref/`-class living doc, so B2 does not bind it, but it shows the shape the corpus already reaches for when a fact turns out wrong.
4. Goal chain (`think.B1`): a research doc exists so a later reader can judge whether a conclusion still holds → that needs (a) a faithful record of what was believed and why at the time, and (b) the current truth status of the claims. Immutability serves (a) completely and (b) not at all; the successor-doc mechanism serves (b) only at the granularity of a whole conclusion.
5. Critique pass over three designs, below.

## Result

**Finding 1 — the rule is already violated, silently, by edits that were substantively correct.** The R9 rewrite turned an unverified claim into a verified one two days later. Opening `headless-cli-workers-aug1-2.md` for that would have been absurd, so the author edited in place, and the rule left no way to mark it. A reader today cannot tell from the doc that R9 was ever unverified. The rule produced the worst outcome: history lost *and* the rule broken.

**Finding 2 — the edits fall into four classes with different risk.**

| Class | Example | Risk of editing in place |
|---|---|---|
| Cosmetic | path after a repo rename, broken link, typo | none |
| Erratum on a claim | R9 unverified → verified; a measured number corrected; a source retracted | the record of what was believed is lost if the old text is overwritten |
| Decision-field links | Action landed in a new plan; a cross-ref added; `Status:` line | already permitted by B2's own wording |
| Conclusion change | the answer to the initial purpose is now different | the doc would silently start lying about the event |

**Finding 3 — three designs, critiqued (`think.B3`).**

- **A. Keep strict immutability.** Steelman: git holds every diff, the rule is one sentence, readers trust the body unconditionally. Attack: git history is not read by an LLM reader or a skimming human; the corpus already breaks the rule; a one-word correction requires a new file and a chain suffix. Inversion: to guarantee stale facts in research docs, make correcting them expensive. That is the current state.
- **B. Living document.** Steelman: always current, no chain. Attack: `docs.C` and `release.B7` read research as a fixed baseline; the "context at the time" field becomes meaningless once the body drifts; the A2 current-state vs history split collapses. Pre-mortem: six months on, nobody can reconstruct why a decision was made because the reasoning was edited to match the later outcome.
- **C. Frozen body plus dated amendments.** The body is never rewritten. A correction is appended as a dated entry in a closing `## Amendments` section that names the section it corrects and states the new fact; a `Status: amended <date>` line at the top warns the reader before they read a superseded claim. The successor-doc chain is reserved for the case where the Decision changes. Attack: readers may miss an amendment three screens below the claim it corrects. Mitigation: the top `Status:` line is the notice, and the amendment must name the section. Second attack: authors will stretch "amendment" to cover a changed conclusion. Mitigation: one mechanical discriminator, stated in the rule.

**Discriminator:** if applying the correction would change the doc's **Decision** field, it is a successor doc. If it changes a **Result/Verification** claim but the Decision stands, it is an amendment. Cosmetic edits need nothing. This is checkable by reading the Decision field, not by judgment.

**Verification:** the git-log measurement and the R9 diff are reproducible (`git log --follow -p -- docs/research/headless-cli-workers-aug1.md`). The design choice is judgment, verified only by the critique pass above; the reopen trigger is an amendment that a later reader reports as having hidden a real conclusion change.

**Corroborating links:** `docs/research/headless-cli-workers-aug1.md` (the R9 case) · `skills/akiflow/references/harness-facts.md` ("A prior version of this row" annotations) · `payload/RULE-docs.md` A2, B2, C3 · `payload/RULE-agent-behavior.md` C2 (durable files hold no task history, which an amendment must respect: state the corrected fact, not the story of finding it).

## Decision

**Action:** `payload/RULE-docs.md` B2 rewritten to design C — frozen body, `## Amendments` section with dated entries, `Status: amended` notice, the Decision-field discriminator for successor docs, cosmetic edits exempt. Execution: `docs/plan/done/research-mutability-model-tiers.md`.

**Cross-references:** `docs.C3` (the drift audit's research row now checks that an amended doc carries the top notice); `skills/akithink/SKILL.md` § closing (decision record path) is unaffected; the R9 edit in `headless-cli-workers-aug1.md` is left as-is, since retrofitting an amendment onto a past event would itself be task history.
