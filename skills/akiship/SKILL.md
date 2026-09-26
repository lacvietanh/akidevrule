---
name: akiship
description: Full release ritual end-to-end — front-loaded checks, then an unattended pass. ACTIVATION = the literal token `/akiship`, or an imperative turn, in any language, ordering the release ritual for this repo. A question about it, or a completion word with no release object, activates nothing — consult the checklist and answer in chat, read-only. Sequences RULE-release.md B7's checklist under the B8 autonomy contract; the escalation floor, completion-intensity semantics, and push/deploy authorization are owned by B8 and referenced, never restated, here.
---

# akiship — one-command full release

Invoke with `/akiship` or an explicit release order, only as described in § Activation gate below. Goal: replace the daily hand-typed ritual ("resolve leftovers, sync every doc, lint, fix drift, changelog, commit, release…") with one invocation that runs to completion or stops once, early, with every blocker in a single batch.

## CRITICAL — MANDATORY LOAD, BEFORE ANY OTHER TOOL CALL OF THE RUN (execute AND consult mode)

**This skill sequences; it owns no content.** The checklist is `RULE-release.md` (B5 migration doctrine, B7 fail-closed gate, B8 autonomy contract, B10 CI, B11 post-deploy verification) and doc sync is `RULE-docs.md`. Both are installed at `~/.aki/akidevrule/`.

1. `Read` `~/.aki/akidevrule/RULE-release.md` IN FULL and `~/.aki/akidevrule/RULE-docs.md` as the FIRST tool calls after this skill loads. Keyword routing, memory of an earlier session, this file's summary, and a rule that happens to be in context do NOT count as loading — only a `Read` performed in THIS run does.
2. Emit as the first line of the run: `[RULES] agent,coding,pattern (core) + release,docs (akiship)`. If either file could not be read, say so and the run STOPS there.
3. A run that starts Phase 1 without those two `Read` calls is INVALID: every finding, commit, tag and deploy it produces is unauthorized and MUST be reported as such. Compliance is checked against the tool-call log, never against the receipt line (`agent.B2`).

If a step in this file disagrees with the rule file, the rule file wins — except the activation gate below, which this skill owns outright (`pattern.A1`) and which no rule file, keyword list, or routing table may widen.


## Activation gate — two conditions, both required, checked before anything else

**1. Release order.** The current user turn carries either the exact token `/akiship`, or a turn explicitly ordering the release ritual for this repo, in any wording (worked examples in the table below). A completion-intensity phrase with no release object activates nothing: it names no ritual, so it is ordinary vocabulary about finishing something, not an order to run this skill. Seeing this file, or `release.B8`, in context is not an invocation either: being loaded is not being called.

**2. Imperative, not interrogative** (`agent.A3`). The order alone authorizes nothing — the turn must ask for the run to be *performed*. Where both readings are available, consult.

**Why the token is not required.** The incident phrase ("tóm lại cần làm gì để trọn vẹn", `docs/research/akiship-literal-activation-aug22.md`) fails both conditions independently — no release object, and interrogative — and `agent.A3` alone was already resident when it misfired, which is why condition 1 stays a mechanical release-object check rather than judgment; the literal token on top adds only false negatives on a plainly-worded release order.

| Turn | Mode |
|---|---|
| `/akiship` · "release trọn vẹn đi" · "chạy full release" · "ship đợt này luôn" | **execute** — run the phases below |
| "nếu chạy /akiship thì cần gì để trọn vẹn?" · "/akiship sẽ làm những gì?" · "làm cho trọn vẹn" (no release object) | **consult / no activation** — read the checklist below and answer in chat what the run would do and what is still open on this tree; edit no file, no commit, no push, no tag, no release |

Consult is the default whenever both readings are available. A withheld execution costs one extra turn; a wrongly performed one costs a published push that cannot be taken back (`agent.A3` — calibrate by reversibility).

## Phase 1 — front check (all asks happen here or never)

1. Derive release state cold per `release.B1` (manifest, CHANGELOG top, boundary commit, accumulation log).
2. Triage the tree per B7 step 0 (the `/akigitcommit` step-0 taxonomy; read-only, `agent.B5`).
   - Registry-published package (`package.json` without `"private": true`, `Cargo.toml`, `pyproject.toml`): probe the account facts and 2FA mode per `release.B9` now, so the publish hand-off is known before the run starts, not discovered at its end.
3. Collect every hit on the B8 escalation floor — the three stop conditions and everything about completion-intensity phrasing are defined in `release.B8`, not here. Completion-intensity phrasing is read only inside an execute-mode invocation that already passed § Activation gate, and applies with exactly B8's two effects: the unclassifiable-work stop resolves toward mid-edit, and the push/deploy naming requirement is satisfied (Phase 3 step 4). Any hit on the two conditions no phrasing waives → report every hit in one batch and stop. No hits → proceed; from here the run asks nothing (`release.B8`: a question the repo already answers is a violation).

## Phase 2 — gate, fixing in place

Run B7 steps 2–7 in order, fixing findings as they surface (this is a gate, not an audit — no findings doc):

- **Hygiene, diff scope only**: `python3 ~/.claude/skills/akiflow/scripts/scythe.py <files changed since boundary>` for `[WRAP]`/`[YAP]`; dead code / redundant guards / duplication the accumulation introduced (`pattern.A8`); doc refs in touched comments still resolve (`docs.B3`). Never widen to the whole repo.
- **Migration & external-action completeness — FIRST gate step, every release.** Run the `release.B5` detector over the accumulation diff and paste its output. A hit (startup-embedded migration code included) obliges written answers to B5 points 2–5, including a rehearsal from the PREVIOUS state; a pending migration qualifying under `stack.C8`'s execution-ownership clause is run here, not deferred. Then record truthfulness (CHANGELOG + `releases.json` parity where it exists) and doc sync over every record surface B7 step 5 enumerates (plans → `done/`, `arch`/`feat` stamps per `docs.A4`, `README.md`, the task-note file via `akidevsync-notes`, any standards doc the project `CLAUDE.md` binds).
- **Build & test — mirror CI (B7 step 6)**: derive commands from `.github/workflows/*` first, else the manifest's own scripts; run them all locally; a failure blocks and is fixed in place, same as the hygiene step above; a CI-only leg (other-OS matrix, secrets) is named and left to `release.B10`.
- Verification honesty — anything else runtime-only, or a migration that does not qualify above, is carried to the final report as **unverified**, never silently assumed (`coding.B3`).

## Phase 3 — commit, mint, artifacts

1. Commit in logical groups per `/akigitcommit` (domain-grouped mode; anti-stage-loss rules apply in full). B8 pre-answers its confirmation step — "commit luôn" semantics.
2. Version decision per `release.A4`/`A5`: mint exactly once at the highest accumulated severity, or defer on the materiality test. Deferring is a normal outcome, not a failure.
3. Artifacts per the repo's own convention: bare tag only if the repo already tags (`release.A3` B8 exception); GitHub Release per `release.B4`; `releases.json` sync check per `release.C4`; registry publish per `release.B9` — tarball verified first, and an OTP-gated publish is the report's single hand-off with its `npm view` check.
4. **Push / deploy only if B8's push/deploy authorization holds for this invocation (named explicitly, or completion-intensity phrasing per `release.B8`).** Otherwise the run stays local-only. After any push, watch CI per `release.B10` — always, regardless of stack. If the stack additionally deploys on push, run live deploy verification per `release.C5` once CI is green. After ANY deploy or restart, `release.B11` is mandatory: verify a data path the release touched, not only the version.

## Report

**The FIRST block is the checklist receipt, and it is mandatory:** the `release.B7` lines `S0`–`S8` (`PASS | FIXED | FAIL | N/A — evidence`), the B5 detector output, and the four written self-interrogation answers. A report without them declares the run INCOMPLETE and says which steps were NOT RUN; an unreported step is a failed step (`release.B7` fail-closed contract), never an implicit pass.

Then one dense summary (`agent.A4`): state derived → findings fixed (counts per gate step) → commits made → version minted or deferred with the reason → artifacts created → CI results (`release.B10`) → any owner-worded criteria self-decided this run, as an `agent.A3` decision block (`Decided: X · because Y · rejected Z (why) · reopen if W`) → anything left **unverified**, each with the exact command that would settle it.

## Boundaries

- Never write `PASS` on a gate step without quoted evidence (`release.B7` fail-closed contract). "Should", "presumably", "looks fine" score `unverified`.
- Never run a phase above on a turn that failed either activation condition — answer in consult mode instead, and never treat your own consult answer as the go-ahead for a later turn.
- The B8 escalation floor is the only reason to stop mid-run; everything else is self-answered from repo, docs, and rules.
- Never push, deploy, or push tags without B8's push/deploy authorization (`release.B8`).
- A repo-wide hygiene/subtraction sweep is out of scope — point the user at `METHOD-audit-subtraction.md` instead of widening the gate.
