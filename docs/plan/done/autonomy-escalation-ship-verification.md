# Execution — autonomy escalation fixes + ship verification tiers

Research: [autonomy-escalation-ship-verification-sep15.md](../research/autonomy-escalation-ship-verification-sep15.md).

## Items executed

1. `payload/RULE-agent-behavior.md` `A3` — mandatory deep-think trigger list (a–f), converged→act outcome with `Decided: X · because Y · rejected Z (why) · reopen if W` decision block, escalate-only-when list.
2. `payload/RULE-agent-behavior.md` `B3` — hard-to-reverse defined as no backup/fix-forward path; a two-way-door action with a backup path routes to `coding.B5` instead of the ask-before list.
3. `payload/METHOD-deep-think.md` — third consumption mode (triggered self-run); radar section no longer offers an interactive `/akithink` inside an autonomous run.
4. `skills/akithink/SKILL.md` — Self-run mode section; description/Invocation scope updated.
5. `skills/akirule/SKILL.md` — deep-think routing sensitivity extended; new CI-keyword routing group for `RULE-release.md`.
6. `payload/RULE-release.md` `B8` — activation demoted to "an explicit release order", owned by `akiship`'s gate; self-answer bullet rewritten (derive, decide, report; escalate only on diverging irreversible artifacts).
7. `payload/RULE-release.md` `B7` — new step 6, Build & test mirroring CI; old steps 6–7 renumbered 7–8.
8. `payload/RULE-coding.md` `B3` — full build/test reclassified by moment (edit / large-batch commit / ship-release-deploy), self-authorized at the ship tier.
9. `payload/RULE-release.md` — new `B10`, post-push CI watch, applicable to any flow.
10. `skills/akiship/SKILL.md` — activation gate reworded (token or explicit release order); Phase 2 gains build-and-test; Phase 3/Report gain CI watch + decision-block reporting.
11. `skills/akigitcommit/SKILL.md` — pointer to `B10` after the push boundary.
12. `payload/index.md` — manifest rows (`release`, `think`, "Interrupting the owner" lens) and address-map comment updated.
13. `CLAUDE.md` (this repo) — new "Release records carry their reasoning" principle.

## Status

Executed 2026-09-15. Files 1–13 above were already present in the working tree at the start of this documentation task; this record and its research pair are the doc-sync pass required before the change can be considered pattern-complete (`docs.B3`, `pattern.C1`).

## Verification

Static reading of `git diff` against the files listed; `scythe.py` clean on every `.md` file this pass touched. Behavior change (does a future session actually converge on the new triggers, does the escalate-only-when list reduce interrupts, does B10 get run inside a live `/akiship` execution) is **unverified — needs observation across real sessions**, per `coding.B3`; there is no static or automated tier that settles a model-behavior claim.
