# Verification runs: gated by the claim, never by the edit — decision record

Status: amended 2026-10-28

## Start time
2026-10-28, on an owner order relayed from a peer Claude Code session (aiobox fix-audit room): "đừng có động tí là chạy test được không nhỉ? không thấy thừa à?" and "phải qua phân tích akithink deep thật kỹ các khía cạnh được / mất để mà đảm bảo cập nhật luật chống test/check/verify cho hiệu quả … đau đáu suốt hàng bao nhiêu tháng nay".

## Initial purpose
Which part of the over- and under-verification pain is a gap in the rule text, which part is a loaded rule not followed, and what change makes verification effective without bringing back unverified "done" claims. Context: corpus at 3.8.0 plus `[Unreleased]`; Claude Code with the route gate on both machines; Opus 5.5 and Sonnet 5.5 as the models in the evidence.

## Strategy
Self-run `/akithink` (`METHOD-deep-think.md` B1–B3, B5; B4 skipped, personal tooling) on five evidence items from the peer session, two spot-checked in the transcripts; map each to the rule that already governs it; draft the change; hand the diff and this record to an `aki-challenger` (Opus, clean context) anchored on the owner's words; ship the second draft.

## Checklist
1. ✅ Read `coding.B3`, `test.A/C`, `zero-trust.B`, akiflow Step 5, `aki-maker` output contract, `agent.B2`, `docs/research/agent-churn-temp-rerun-oct20.md`.
2. ✅ Spot-check E2: the peer transcript holds 10 `nuxt generate` mentions and three `npm test` invocations in the lead's own commands.
3. ✅ Spot-check E3: the Mac aiobox session reads `RULE-test.md` 17 times and the owner's "rác test" correction appears twice; the deployed `RULE-test.md` on the Mac is dated 2026-10-26 (3.8.0).
4. ✅ Grep every file restating the Verify stage, the check schedule or the one-run line (`skills/akiflow/SKILL.md`, `claude/agents/aki-maker.md`, `docs/arch/akiflow.md`, `docs/index.md`; the schedule and the rerun license exist only in `RULE-coding.md`).
5. ✅ First draft: cross-seat record reuse added to the `B3` one-run bullet. Challenger verdict: do not ship (below).
6. ✅ Second draft: the schedule itself rewritten; challenger's cuts applied.

## Result

### Evidence (peer session fc79ec8b, Mac session 0773a1ec, 2026-10-28)

| # | Observation | Rule that already governs it | Class |
|---|---|---|---|
| E1 | akiflow dispatch: the web lane ran `npm test` (710), `nuxt typecheck`, `vue-tsc`; the lead re-ran all three on an unchanged tree | `coding.B3` one run per change state — written for one seat's own output; the akiflow Verify row and the no-room closing line ("a 'tested' claim that was never run") read as *re-execute* | text gap |
| E2 | read-only audit turn ran `npm test`, `nuxt typecheck`, `npx nuxt generate` (91 routes) | `zero-trust.B2` prescribes the project's test and typecheck in an audit and forbids a build or dev server; only `nuxt generate` broke it | one run against the rule, two per the rule |
| E3 | regex-over-source test, a 20,480-byte cap test (the guide was trimmed to fit it), a banned-words test the type already guarantees, UI-string-constant tests with a fix-forward 9 min later | `test.A1` (no new test by default; never for a language or framework guarantee), `test.C1` (never a regex over source), `test.C3` (no fixture pinning a value that moves) — `RULE-test.md` read 17 times in that session; whether a brief ordered the tests (`A1`'s exception) was not checked | loaded, not followed (unconfirmed) |
| E4 | a real Windows focus bug dropped because "owner said keep tests light" | `agent.A3` (an order to fix a bug was in force; "light tests" limits test writing, not the fix) | order misread, not a verification rule |
| E5 | CHANGELOG "Checked: npm run typecheck; not looked at in a running window" on layout/UI changes | `coding.B3` runtime-only risk → report unverified as an `N` with the command; the line is honest, the check is what the rule prescribes | compliant |

### First reading (draft 1, rejected)
E1 was taken as the only text gap: no layer said a run another seat recorded on the same tree counts for every seat. Draft 1 added to the `B3` one-run bullet a record with a tree-state field (`git diff --stat | tail -1`), ownership by tree state, and "a verifier re-runs only what has no record for it", restated in the akiflow Verify row, the `aki-maker` contract and the Phase B diagram. E2 and E3 were classed as compliance gaps that "more text does not close", citing `rule-delivery-second-hop-sep29.md`.

### Challenge (aki-challenger, Opus, clean context, anchored on the owner's words)
Verdict: do not ship. Findings accepted, in severity order:
1. **Draft 1 answered a nearby question.** "Động tí là chạy test" is a run at every small edit, in a single-seat session. Draft 1 targeted a second seat re-running on an unchanged tree — 8 of 507 reruns (1%) in the 2026-10-20 measurement. The owner's complaint was licensed word for word by the untouched text: `B3`'s schedule "after edits → typecheck/lint/related unit tests" is a per-edit default the model follows without naming a doubt, and the one-run bullet's "a rerun needs a change in between (an edit by any tool)" makes any one-character edit a sanctioned full rerun. The inversion pass asked only what added text would keep the pain going, never what existing text causes it; subtraction was skipped.
2. **The record's exit code was fed by a command that hides it.** `npm test > log 2>&1; tail -20 log` reports `tail`'s status, always 0; a red suite would travel as a green record nobody may re-check.
3. **`git diff --stat | tail -1` cannot tell two trees apart** (a second edit to a changed line, an untracked file, a dirty tree on the same commit, an environment change), and the reopen trigger that depended on noticing a stale record could never fire.
4. **The record was checked against the tree, never against its log**: "a 'tested' claim with no run record behind it" turned the verifier's check into a format check that `aki-maker`'s contract satisfies by construction, against `agent.B2` (self-reported text is a signal, never evidence).
5. **"Compliance gap, no text fix" over-claimed**: the Sep 29 record measures whether a routed file is read, not whether read text is followed; E2's `npm test` and typecheck are what `zero-trust.B2` prescribes.
6. The open reason slot still allowed a "to be safe" rerun; 7. akiflow vocabulary (lane, lead, verifier, seat) landed in a public root rule paid on every code edit; 8. one clause restated in four places against repo `CLAUDE.md`'s pointer-only law.

### Second reading
- The text gap is `B3`'s own schedule, not the cross-seat case. Fix by subtraction and re-gating: the trigger moves from the edit to the claim.
- The honesty floor is kept by construction: a changed tree under a new claim is a new run; a run with no log is no evidence; the runtime-only `N` bullet is untouched.
- Cross-seat reuse belongs where seats exist (akiflow Verify row), with the lead's attestation that no edit followed the record standing in for a tree fingerprint the verifier cannot compute, and the verifier told to open the log.

### Verification
Spot-checks 2 and 3 are transcript greps, not controlled runs. The intervention's effect is unmeasured; the 2026-11-03 remeasure (below) is the test.

**Corroborating links** — `docs/research/agent-churn-temp-rerun-oct20.md` (20% reruns, 1% after a subagent, hook rejected); `docs/research/rule-delivery-second-hop-sep29.md` (read rate only, not comply rate); the peer transcript and the Mac session named in Checklist 2–3.

## Decision
**Action**
1. `coding.B3` "Self-authorized checks" bullet rewritten: gated by the claim, never by the edit — once per batch, at the tier the named doubt requires, "ten edits before one claim are one run" (`payload/RULE-coding.md`).
2. `coding.B3` "One run per change state" bullet: the example captures the exit code (`echo "exit=$?"`); a rerun needs a changed tree under a new claim; doubt about a recorded run is answered by opening its log; a run is reported as a record (command, exit code, log path) that belongs to the tree, not to the seat.
3. akiflow Step 5 Verify row: the verifier receives each lane's record with the lead's attestation that no edit followed it, opens the log (exit code, no elision marker, failure list), re-runs only a check with no such record; the no-room closing line checks the log, not the claim (`skills/akiflow/SKILL.md`). `claude/agents/aki-maker.md` reports the record; `docs/arch/akiflow.md` Phase B diagram names the records as input.
4. The N2 transcript extractor (pinned note task-1793166819433) counts reruns per edit and reruns after a subagent turn separately, so the 2026-11-03 remeasure scheduled by `agent-churn-temp-rerun-oct20.md` measures this change.

**Rejected**
- A tree-state fingerprint in the record (challenge finding 3).
- A rule naming which check fits which change: the rewritten schedule names the tier by doubt class; nothing further.
- A `PreToolUse` gate denying a heavy command repeated on an unchanged tree: false denials on flake probes and environment changes; the remeasure decides.
- A numeric cap on runs per session or per item: a count cannot tell a baseline from waste.
- New text for E3's junk-test shapes: `test.A1`, `C1`, `C3` already name them; whether they were ordered or ignored is N2's measurement.

**Reopen triggers**
- The 2026-11-03 remeasure shows per-edit runs unchanged in sessions that loaded `coding`: the schedule wording is not the lever; build the gate, deny with the last record's log path in the reason.
- A verifier accepts a record whose log it did not open: move the log check into `aki-maker`'s attestation line as a checkable fact.
- Junk-test shapes persist in sessions that read `RULE-test.md`: N2's compliance finding, not a verification-rule change.

**Cross-references** — `CHANGELOG.md` `[Unreleased]` `### Changed`; `docs/research/agent-churn-temp-rerun-oct20.md` (reopen trigger reused); `docs/plan/test-isolation-every-entry.md` (owner's open plan on test side effects, untouched).

## Amendments

- 2026-10-28 · § Decision, Action 1–2 extended: a second session the same day (aki-mcp-sv, Linux box, session 53913060) closed six runtime-only hand-offs with zero live runs by two inference shapes the text did not name — (a) the path under doubt is the function a live client goes through daily (a second machine's Bearer path is the `/mcp` gatekeeper another client exercises), (b) a live check at an earlier commit still holds because the diff since cannot reach what it observed (a constant renamed since the 3.1 client check). (a) is now the ladder's rung 1 second sentence; (b) is the rerun license's reach clause in the one-run bullet. The session's two further proposals were rejected: a `B4` line "a lint hit is one comment, never the set" (`agent` §0 card semantics already bind every instance) and an Impact kill-test clause for self-run checks (the claim gate and the ladder preamble already carry it). The Decision stands; the two clauses sharpen it.
- 2026-10-28 · § Decision, Reopen triggers, one added: a second delivery miss gated by a version marker (a fix that never reached its targets because a `# aki-rlcache vN` marker was not bumped, aki-dev-sync, 2026-10-28, one incident) adds "a version marker that gates delivery" to the external-action examples of `coding.B3`'s last bullet; one incident does not meet `pattern.A2`'s repeat bar, so no edit now.
