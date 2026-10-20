# Plan: agent.A3 rebuilt around one root — only an order moves the agent

Source: [question-vs-action-oct20.md](../../research/question-vs-action-oct20.md) § Decision. Status: approved 2026-10-20; applied.

## Steps

- [x] 1. `payload/RULE-agent-behavior.md` `A3`: lines 35-39 and the unsolicited-suggestions line replaced by the two bullets (understand before acting, act only on an order; an order runs to the end without asking); kill-tests, deep-think triggers, converged outcome and escalate-only-when list kept, condensed.
- [x] 2. `payload/RULE-agent-behavior.md` `A4`: open-item bullet replaced by the `Q`/`N`/`H` sorting bullet; `Q` also takes a fact only the owner holds (`agent.B5` unclassified work); the next bullet drops "one that needs nothing from the reader is not listed".
- [x] 3. `payload/RULE-agent-behavior.md` `B3`: header becomes "Ask before, unless the order names the step:"; the shared-standards line stays.
- [x] 4. `payload/RULE-agent-behavior.md` `B7`: row "When you have enough information to act, act" gains "acting on a question" in its skip cell and "the sentence never turns communication into an act (`A3`)" in its override cell; no new row, root unchanged.
- [x] 5. Pointers: `payload/RULE-release.md` `B8` (pointer only, over-asking sentence removed, stale "durably authorized" clause replaced by `B3`'s header), `skills/akiship/SKILL.md` activation condition 2 and reversibility citation, `skills/akithink/SKILL.md` description and communication-turn outcome, `payload/GEMINI.md` §8 and §12 lines that contradicted the new root (ambiguous task → stop and ask, "can you fix X?", correction of ordered work, CHECK 1 "literally requested") — its repetition is its recorded design (its own header note) and stays, `skills/akiship/SKILL.md` and `RULE-coding.md` `B3` unverified and hand-off items as `H`. `aki-challenger`, `aki-judge` and akiflow cite the kill-tests, which stay: no edit.
- [x] Challenger pass on the applied text: `B3`'s header no longer waives an unnamed design conflict; words that read both ways order nothing; "state-changing" excludes reading and checking; `N` never a menu; an `H` with no active plan opens one, and on a communication turn that write is an `N`.
- [x] CHANGELOG 3.8.0 entry with evidence, root cause, mechanism, rejected list, and the files updated together (`CLAUDE.md` change sweep).
- [x] `node install.mjs`; `scythe.py` and `release_lint.py --latest` clean.

## Change sweep

- `payload/RULE-agent-behavior.md` (A3, A4, B3 header, the B7 act-now row; the B7 row citing the decision block still resolves)
- `payload/METHOD-deep-think.md` (lines citing agent.A3 outcomes)
- `payload/RULE-release.md` (B8)
- `payload/RULE-coding.md` (hand-off ladder pointer)
- `payload/GEMINI.md` (§8)
- `skills/akiship/SKILL.md` (activation gate, decision-block use)
- `skills/akithink/SKILL.md` (description, self-run)
- `claude/agents/aki-challenger.md`
- `claude/agents/aki-judge.md`
- `docs/arch/corpus-map.md`
- `skills/akiflow/SKILL.md` (kill-test pointers)

## Acceptance

- The incident message yields an answer only.
- "sửa giúp được không?" yields the fix.
- "commit it — do we need a bump?" commits and answers.
- "you missed file X" on ordered work resumes it.
- An explicit order to edit a shared rule file runs without a `B3` ask.
- A report lists no doable-now item and no release as an item.
- Every listed item carries `Q`, `N` or `H` with its closing condition.
