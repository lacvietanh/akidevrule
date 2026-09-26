# Plan: parked proposals from the 2026-08-22 verification-redundancy review

**Status: closed 2026-09-25 — every item parked with a reopen trigger; §9 closed by `release.B7` step 6 (3.3.0).** Nothing here is scheduled; §6b, added 2026-08-22 as open, was parked on 2026-09-15 with its decision block. The owner's ruling on 2026-08-22 was *tạm thời không can thiệp* — record the reasoning so a later session neither loses it nor re-derives it. Each item below carries the argument **for** it, the argument that beat it, and the trigger that would reopen it.

## 1. The painpoint that produced this plan

A long session in `Aki-Dev-Sync` (Remote Control ingress rework) ended with the agent handing the owner a shell script whose only content was `cargo check` + `cargo test --lib`, immediately followed by a build step that compiles Rust anyway. The owner's objection, verbatim: *"cần không? để làm gì? … (redudant anoying)"*, and separately *"cái gì có trong /akiship thì không cần nhắc"*.

Two distinct wastes in one artifact:

- **A verification step whose evidence another step in the same plan already produces.** `cargo check` settles "does the Rust compile"; so does `npm run tauri dev`, which the owner runs regardless. The check was not expensive, not a question, and not a tier escalation — it passed every existing filter and was still pure waste.
- **A brief restating a contract its receiver already owns.** The hand-off prompt spelled out mint/CHANGELOG/tag/no-trailers, all of which `/akiship` defines. Naming the skill is the whole instruction.

The owner then asked whether the corpus's recent anti-redundancy work (`coding.B3`, `coding.B5`, `agent.A3`, `release.B8`) is sufficient or already excessive, and required that any answer be argued at corpus scale rather than from this one case.

## 2. What the review actually found

`coding.B5` — the six-rung hand-off ladder — was committed **the same day** (`037288f`, 2026-08-22 03:03), with its own 149-line evidence record (`docs/research/handoff-vs-self-verification-aug21.md`). Its §5.6 already states the gap it fills: `agent.A3` filters things shaped like questions, `coding.B3` regulates how a hand-off is packaged, and neither asks whether the item had to leave the agent at all. Every proposal below was therefore stacking on a rule with less than one day of field exposure.

Cross-repo sweep of every `docs/` tree under `~/aki` for the subsumption signature — a `cargo check`/typecheck handed to the owner alongside a build that compiles anyway:

| Instance | Date | Repo |
|---|---|---|
| `docs/plan/done/1.20.1-flow-audit-fixes.md`:7 | 2026-07-28 | Aki-Dev-Sync |
| `docs/plan/done/handtest-1.23.md`:67, :82 | 2026-08-03 | Aki-Dev-Sync |
| the session that opened this review | 2026-08-22 | Aki-Dev-Sync |
| anywhere else under `~/aki` | — | **none found** |

Three occurrences, one repository, one shared root: that project's `CLAUDE.md` never stated how to test a change, and its Rust cannot compile on the dev box, so `cargo check` became the reflex. `pattern.A2` requires ≥3 occurrences across **≥2 unrelated call sites**; this is one site. The root was removed with a single line in that project's own `CLAUDE.md` naming `npm run tauri dev` as both the test loop and the compile check — at zero cost to the shared corpus.

## 3. Proposal A — a "step subsumption" rule in `coding.B3`

**Shape considered.** One bullet after *narrowest tool*: before adding a verification step, check whether a step already in the plan produces the same evidence as a side effect.

**For it.** The general form is not stack-specific — it equally catches running a linter next to a build that lints, or scheduling a test suite CI already runs. It slips past every current filter: it is not a question (`agent.A3`), not a tier escalation (`coding.B3`), and not necessarily a hand-off (`coding.B5`) — the same-day ladder does not see it because the item may legitimately reach rung 6 and only then duplicate another rung-6 item. `coding.B3`'s existing dedupe clause says *"deduped by flow: the same flow is run once"*, which covers a flow repeated at several milestones but not two different commands where one implies the other.

**What beat it.**

1. **The evidence is one site, not three.** All instances share one repository and one root cause, already fixed locally. Rule of Three, which `index.md` explicitly applies to this corpus, is not met.
2. **`coding.B3` already answers it when read per-plan.** *"The narrowest tool that actually settles the doubt"* — if a step in the plan settles the doubt, the narrowest remaining tool is nothing at all. The failure was reading B3 per-step instead of per-plan: a comprehension failure, not a coverage gap. A rule added to fix a misreading of an adjacent rule usually produces two misread rules.
3. **Pre-mortem.** `coding.B3` is `@`-imported into every session including those that touch no code. An eighth bullet reading *do not check twice*, sitting beside *done means verified*, is read under time pressure as licence to skip verification — the exact inversion B3's honesty floor exists to prevent. Under-verification is the more expensive error and is why B3 was written.

**Reopen trigger.** The pattern is observed in a **second, unrelated repository** — one whose project `CLAUDE.md` does name its test command. That would prove the root is behavioral rather than a missing project fact, and the corpus becomes the right layer.

## 4. Proposal B — move the "one ledger" bullet from `coding.B3` to `coding.B5`

**For it.** `coding.B5` opens by declaring the split: *"B3 decides what counts as verification; this decides who performs it."* B3's bullet *"hand over one ledger, not one per phase"* governs how many times the human is interrupted, which is squarely the second question. By the file's own stated division of labour it is filed under the wrong heading, and a rule filed where a reader does not look for it is a rule that does not run.

**What beat it.** Moving prose between sections of a file that is in context every single session costs a re-read for zero behavioural change — the text is loaded either way, and nobody has been observed missing the bullet because of its position. Structural tidiness is not worth a churn event on a core file.

**Reopen trigger.** `coding.B5` is edited for any substantive reason. Fold this move into that edit rather than spending a change on it alone.

## 5. Proposal C — trim `coding.B5`'s *forbidden rationalizations* from four phrases to two

**Raised, then withdrawn by its own author.** The argument for it was density (`agent.A4`): the four phrases — *"can only be verified end-to-end"*, *"needs a real machine"*, *"only the owner can decide"*, *"I don't have access to that platform"* — assert one proposition four ways.

**What beat it.** They are not four phrasings of an idea; they are the four strings actually observed in the failures that produced the rule (`handoff-vs-self-verification-aug21.md` §5.1, §5.8). Their job is recognition, not exposition: the model catches itself mid-sentence because the sentence it is writing is *literally on the list*. Deleting half of them removes exactly the matching surface that makes the rule fire, while saving two lines. This proposal was wrong when made.

**Reopen trigger.** None. Recorded so it is not proposed again.

## 6. Proposal D — a rule about briefs restating what the receiver already owns

**Shape considered.** An addition near `agent.A5`: when the receiving agent has a skill or rule that already defines a procedure, name it and stop; do not restate its steps.

**For it.** `agent.A5` currently pushes the opposite way — *"a worker inherits nothing … name the exact rule files it must read"* — which is right for a worker with no router, and wrong for a session that will invoke `/akiship`. The two cases look identical when writing the brief, and the rule text only describes one of them. This is the same SSoT question as `pattern.A1`, one layer up: a restated contract is a second copy that drifts.

**What beat it.** One observation, from this session, and it was corrected inside the same session by ordinary reasoning. `pattern.A1` and `agent.A4` already cover it for anyone who reads them; the distinction between *a worker that inherits nothing* and *a session that owns the skill* is a judgment the existing text does not actually forbid getting right.

**Reopen trigger.** A second observation of a brief restating a skill's own contract, in any project — at which point the right edit is one clause inside `agent.A5` marking the two cases apart, not a new item.

## 6b. Proposal E — make peer linking the default in `seo.B2`, `parentOrganization` the conditional exception

**Status: parked 2026-09-15 by self-decision under `agent.A3`** — `Decided: no change to seo.B2 · because pattern.A2 is unmet (one ecosystem) and the drift lived in the delegated project doc, so a B2 reorder would not have prevented it · rejected the reorder: demoting parentOrganization invites a true subsidiary to omit it silently · reopen if the trigger below fires`. Raised 2026-08-22 from a UNIDOC entity-drift sweep, not from the review above.

**Shape considered.** `sameAs`/`isRelatedTo` becomes B2's stated default; `parentOrganization` moves to a conditional bullet requiring the parent to declare its own `Organization` `@id`.

**For it.** B2 makes `parentOrganization` its first bullet, which reads as the default for every multi-site family, peer families included. `UNIDOC/ref/seo/structured-data.md` §2b — the private instantiation B2 delegates to — demanded every site link back to AkiNet, which has no `Organization` `@id` at all, and `new-site-checklist.md` L1-14 had propagated that into the acceptance checklist for six sites. Both fixed 2026-08-22.

**What beat it.** One ecosystem, so `pattern.A2` is not met; and the drift lived in the project doc B2 already delegates to, so editing B2 would not have prevented it — a `docs.C` audit gap, not a coverage gap. *Weak spot: L1-14 was written by copying B2's bullet order, not by reading its delegation line, so bullet order does propagate.* Against that, demoting `parentOrganization` invites a true subsidiary to omit it — the quieter error, since no build fails.

**Reopen trigger.** A second ecosystem giving peers `parentOrganization`, or one agent declaring it against an entity with no `@id`. Fix then is one precondition clause on the existing bullet, not a reorder.

## 7. Assumptions this parking depends on

- That `Aki-Dev-Sync`'s new `CLAUDE.md` line does remove the subsumption reflex in that repo. If it recurs there **after** that line exists, the diagnosis in §2 is wrong and §3 reopens immediately regardless of the second-repo trigger.
- That `coding.B5` holds up in the field. It is one day old; the honest position is that nothing built on top of it should be considered until it has been exercised across several sessions and projects.

## 8. Decision

**No change to `payload/`.** Every proposal above is parked with its argument intact and a stated reopen condition, §6b included (parked 2026-09-15). The narrative of how the review reached these verdicts — the cross-repo sweep, the goal chain, the critique passes — is this document; there is no separate research doc, because the finding *is* the decision not to act.

## 9. Incident — `/akiship` 0.27.0 on tachnhac.com shipped a build-breaking doc-index gap

**Status: closed 2026-09-25.** `release.B7` step 6 (shipped in 3.3.0) now makes build & test mandatory on every release, derived from CI jobs or the manifest's own scripts; `npm run build` runs a declared `prebuild` hook, so the skipped `check-truth.js` gate is covered by construction. Originally: open, awaiting owner ruling (`agent.B3` gates edits to shared rules). Raised 2026-08-22, same day as the review above but unrelated to it — this is an under-verification failure, the opposite direction from §1-6's over-verification painpoint.

**What happened.** An `/akiship` run minted and pushed 0.27.0. The release-gate's hygiene sweep ran scythe (`[WRAP]`/`[YAP]`) and reviewed doc-sync by static reading against `RULE-docs.md` B1/B3, but never ran `node scripts/check-truth.js` — the project's own `prebuild` hook, wired into `package.json` and executed automatically by Cloudflare on every deploy. That script's check 9 (*every doc file indexed in `docs/index.md`*) failed on a new research doc the same run's own docs-sync commit had created without an index row. Cloudflare's build failed in production; the owner asked *"sao để xảy ra sai sót này? không tuân theo /akiship chuẩn mực tuyệt đối khắt khe à?"*. Root-caused, fixed, pushed, and rebuilt within the same session.

**The gap.** `RULE-release.md` B7 step 2 (hygiene sweep) enumerates scythe and dead-code/duplication by name; step 6 (verification honesty) only speaks to what stays runtime-unverified. Neither step names *"run whatever local check/lint/prebuild script the project's own `package.json` already declares"* — the exact category that would have caught this deterministically, cheaply, before push, with zero ambiguity about scope (diff-scoped or not: the script itself decides what it checks).

**For adding a clause to B7 step 2.** `coding.B3` — *"verify by the narrowest tool that actually settles the doubt"* — already covers this in principle, the same way it covered Proposal A in §3 above. But this file's own §3 verdict rejected inferring a new B3 clause from a single-repo, comprehension-level failure; the counter-argument doesn't obviously carry over here, because:
1. **Direction matters.** §3's incident was *too much* verification (redundant `cargo check`); B3's honesty floor exists precisely to bias toward catching *too little* (§3 point 3's own pre-mortem). An addition that only ever adds a check, never removes one, does not carry §3's risk of being misread as licence to skip verification.
2. **The tool is not stack-specific.** "Run the project's own declared prebuild/lint/check script before a release-gate push" generalizes to any project with a `package.json` (or equivalent) that names one — it is not a tachnhac.com-only fact the way `npm run tauri dev` was an Aki-Dev-Sync-only fact in §3.
3. **The failure was externally visible.** A local comprehension gap in §3 cost nothing outside the session; this one broke a production Cloudflare build the owner had to be told about after the fact.

**What weighs against it.** One occurrence, one repository — `pattern.A2`'s bar is not met on evidence alone, same as §3. And `coding.B5`'s ladder (rung 2: *"search the local tree ... a convention line ... an existing platform branch"*) arguably already tells the agent to look for exactly this before treating anything as needing a human or an external system: the `prebuild` line in `package.json` was one `grep` away and already visible in the Cloudflare build log quoted to the owner in the same session, before the fix. This may be the same comprehension-failure shape as §3's Proposal A, not a coverage gap — the agent had the evidence, in this session, before deciding the gate was clear.

**Reopen trigger.** A second `/akiship` run, in any project with a declared prebuild/build/lint script, that skips it and ships a break the script would have caught. That would move this from one comprehension lapse to a repeatable gap in B7's own checklist, meeting `pattern.A2` the way §3 explicitly did not.
