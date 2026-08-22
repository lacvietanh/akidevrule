---
name: akiship
description: Full release ritual end-to-end — front-loaded checks, then an unattended pass. ACTIVATION IS LITERAL: this skill runs only on a user turn containing the exact token `/akiship` that asks for the run to be performed. Nothing else activates it — not the bare word "akiship", not a release-flavored paraphrase, and never a completion-intensity phrase on its own ("trọn vẹn" and its siblings — canonical list in RULE-release.md B8): outside a valid invocation those are ordinary vocabulary carrying zero authorization to fix, commit, push, tag, or release. `/akiship` inside a question means consult the checklist and answer in chat — read-only. Sequences RULE-release.md B7's checklist under the B8 autonomy contract; the escalation floor, completion-intensity semantics, and push/deploy authorization are owned by B8 and referenced, never restated, here.
---

# akiship — one-command full release

Invoke with the literal `/akiship`, and only as described in § Activation gate below. Goal: replace the daily hand-typed ritual ("resolve leftovers, sync every doc, lint, fix drift, changelog, commit, release…") with one invocation that runs to completion or stops once, early, with every blocker in a single batch.

**This skill sequences; it does not own content.** The checklist is `RULE-release.md` B7 and the autonomy/escalation contract is B8 — read that file first (installed at `~/.aki/akidevrule/RULE-release.md`), plus `RULE-docs.md` for the doc-sync step. If a step here ever disagrees with the rule file, the rule file wins — except the activation gate below, which this skill owns outright (`pattern.A1`) and which no rule file, keyword list, or routing table may widen.

## Activation gate — two conditions, both required, checked before anything else

**1. The literal token.** The current user turn contains the exact string `/akiship`. Nothing else activates this skill: not the bare word "akiship", not a release-flavored paraphrase ("release trọn gói", "chạy full release", "ship đợt này"), and above all not a completion-intensity phrase standing on its own (e.g. "trọn vẹn" — canonical list: `release.B8`). Those are how an owner talks while thinking about finishing something — reading one as an invocation turns a conversation into a push to a public remote. Seeing this file, or `release.B8`, in context is not an invocation either: being loaded is not being called.

**2. Imperative, not interrogative** (`agent.A3`). The token alone authorizes nothing — the turn must ask for the run to be *performed*.

| Turn | Mode |
|---|---|
| `/akiship` · "thực hiện /akiship trọn vẹn" · "chạy /akiship đi" | **execute** — run the phases below |
| "nếu chạy /akiship thì cần gì để trọn vẹn?" · "/akiship sẽ làm những gì?" · "/akiship có push không?" | **consult** — read the checklist below and answer in chat what the run would do and what is still open on this tree; edit no file, no commit, no push, no tag, no release |

Consult is the default whenever both readings are available. A withheld execution costs one extra turn; a wrongly performed one costs a published push that cannot be taken back (`agent.A3` — calibrate by reversibility).

## Phase 1 — front check (all asks happen here or never)

1. Derive release state cold per `release.B1` (manifest, CHANGELOG top, boundary commit, accumulation log).
2. Triage the tree per B7 step 0 (the `/akigitcommit` step-0 taxonomy; read-only, `agent.B5`).
3. Collect every hit on the B8 escalation floor — the three stop conditions and everything about completion-intensity phrasing are defined in `release.B8`, not here. Completion-intensity phrasing is read only inside an execute-mode invocation that already passed § Activation gate, and applies with exactly B8's two effects: the unclassifiable-work stop resolves toward mid-edit, and the push/deploy naming requirement is satisfied (Phase 3 step 4). Any hit on the two conditions no phrasing waives → report every hit in one batch and stop. No hits → proceed; from here the run asks nothing (`release.B8`: a question the repo already answers is a violation).

## Phase 2 — gate, fixing in place

Run B7 steps 2–6 in order, fixing findings as they surface (this is a gate, not an audit — no findings doc):

- **Hygiene, diff scope only**: `python3 ~/.claude/skills/akiflow/scripts/scythe.py <files changed since boundary>` for `[WRAP]`/`[YAP]`; dead code / redundant guards / duplication the accumulation introduced (`pattern.A8`); doc refs in touched comments still resolve (`docs.B3`). Never widen to the whole repo.
- External-action completeness, record truthfulness (CHANGELOG + `releases.json` parity where it exists), doc sync (plans → `done/`, `arch`/`feat` stamps per `docs.A4`), verification honesty — anything runtime-only is carried to the final report as **unverified**, never silently assumed (`coding.B3`).

## Phase 3 — commit, mint, artifacts

1. Commit in logical groups per `/akigitcommit` (domain-grouped mode; anti-stage-loss rules apply in full). B8 pre-answers its confirmation step — "commit luôn" semantics.
2. Version decision per `release.A4`/`A5`: mint exactly once at the highest accumulated severity, or defer on the materiality test. Deferring is a normal outcome, not a failure.
3. Artifacts per the repo's own convention: bare tag only if the repo already tags (`release.A3` B8 exception); GitHub Release per `release.B4`; `releases.json` sync check per `release.C4`.
4. **Push / deploy only if B8's push/deploy authorization holds for this invocation (named explicitly, or completion-intensity phrasing per `release.B8`).** Otherwise the run stays local-only. If pushed and the stack deploys, run live verification per `release.C5` afterward.

## Report

One dense summary (`agent.A4`): state derived → findings fixed (counts per gate step) → commits made → version minted or deferred with the reason → artifacts created → anything left **unverified**, each with the exact command that would settle it.

## Boundaries

- Never run a phase above on a turn that failed either activation condition — answer in consult mode instead, and never treat your own consult answer as the go-ahead for a later turn.
- The B8 escalation floor is the only reason to stop mid-run; everything else is self-answered from repo, docs, and rules.
- Never push, deploy, or push tags without B8's push/deploy authorization (`release.B8`).
- A repo-wide hygiene/subtraction sweep is out of scope — point the user at `METHOD-audit-subtraction.md` instead of widening the gate.
