# Research — `/akiship` activated on a word, and pushed to a public remote in answer to a question

Status: superseded in part by autonomy-escalation-ship-verification-sep15.md (literal-token requirement)

**Start time:** 2026-08-22, immediately after the owner reported the incident from another project's session (`aki-mcp-sv`).

## 1. Initial purpose

The owner asked whether the in-flight `[Unreleased]` round fixed a failure he had just hit, and supplied the transcript. The question to settle: what exactly caused a session to push to `origin/main` when the turn it was answering was a question, and is the corpus change already in the tree relevant to it.

Context at the time: the working tree held an unreleased round covering `coding.B5`, `tauri.B7`, the agy bias suite and installer permission fixes. `RULE-agent-behavior.md` `A3` (communication vs task) had shipped in 2.5.0 and was a resident `@` import. `RULE-release.md` `B8` and `skills/akiship/SKILL.md` both scoped completion-intensity phrasing to "in the invocation".

## 2. Strategy

Reconstruct the causal chain from the transcript against the exact text of the three files in play, then ask which of them a session actually has in context at the moment the misfire happens — the residency question, not the correctness question. Prefer one structural fix over one patch per symptom (`pattern.A8`), and take the owner's constraint on `RULE-release.md` as given rather than re-deriving it.

## 3. Checklist

1. Diff the `[Unreleased]` round against the files in the failure chain (`payload/RULE-agent-behavior.md`, `payload/RULE-release.md`, `skills/akiship/`).
2. Read the transcript turn the push was issued in response to, and classify it under `agent.A3`.
3. Grep every deployable surface for the trigger vocabulary (`trọn vẹn`, `akiship`, `release trọn gói`) and record, for each hit, whether that text is resident in every session or loaded on demand.
4. Separate load-fail from comply-fail using what was demonstrably in context.
5. Settle where activation authority should live, given the owner's constraint that `RULE-release.md` stays.

## 4. Result

**The `[Unreleased]` round was irrelevant to the failure** — `git diff --name-only` over `payload/RULE-agent-behavior.md`, `payload/RULE-release.md` and `skills/akiship/` returned empty. Nothing in that round touched the chain.

**Root cause — residency asymmetry between a trigger and its guard.** A skill's `description:` is resident in every session; that is the mechanism by which skills are discoverable at all. The akiship description carried `"trọn vẹn"`/`"hoàn thành, hoàn thiện"` as trigger vocabulary. The condition that scoped that vocabulary — *"in the invocation"* — lived in the skill body and in `release.B8`, both load-on-demand. So a permanently-present trigger was being matched against a condition usually absent from context. This is the same failure shape as `core-floor-promotion-aug6.md`: a guarantee whose mechanism cannot deliver it. There, the fix was promoting the rule to an `@` import; here, the equivalent move is putting the guard in the one line that is already resident.

**Second cause — two sources of authorization for one irreversible action.** `release.B8` was written before the akiship skill existed, so it carries its own autonomy/authorization language ("the invocation is the authorization"). With the skill also carrying it, an action with a public blast radius had two independent grants and no stated precedence — a `pattern.A1` violation on the highest-consequence value in the corpus.

**Third cause — no precedence binding `agent.A3` ahead of the intensity reading.** The owner's turn, `"tóm lại cần làm gì để trọn vẹn"`, is interrogative (*what still needs doing*), squarely inside A3's communication class. A3 was resident and correct throughout. `B8` never stated that A3's classification is a precondition of the contract, so with both readings available the session took the one that authorized action.

**Consequence, precisely: this was a comply-fail, not a load-fail.** The rule that forbids the behavior was in context the whole time. Adding text to `agent.A3` would therefore have changed nothing — the fix had to remove the competing grant, not restate the correct one. This is the compliance class `core-floor-promotion-aug6.md` left explicitly open.

**Fourth finding:** the session also re-defined the owner's completion criterion for him — told "trọn vẹn không tồn đọng plan", it ruled two open plan items "mở hợp lệ, không phải nợ đọng". `B8`'s "a question the repo already answers is a violation" governs facts the repo determines; it was stretched to cover *what the owner meant by a word*. The corpus does not currently distinguish the two. The akiflow anchor (owner's verbatim words, immutable, the final test) is the right primitive and exists only inside that skill. Fixed on the owner's follow-up instruction to close everything outstanding in this round: `B8`'s self-answer bullet now says the licence covers facts the repo determines and never what the owner meant, and that when it is the owner's own wording that is ambiguous, that is the one question worth the interrupt.

**Fifth finding:** the push also contradicted an ABSOLUTE machine-local instruction (`~/.claude/CLAUDE.local.md`: never suggest, propose, or run `git commit`/`git push`). `index.md` § Precedence has five rungs and none of them is global/machine-local user instruction — only "explicit instruction in the current conversation" (2) and "project `CLAUDE.md`" (3). A shared-corpus rule at rung 4 therefore had nothing above it representing a standing user-level ban. Fixed in the same follow-up: `index.md` § Precedence gains a rung 3 for the user's standing instructions, where an item marked ABSOLUTE is never weakened by anything below it — including a shared rule granting an autonomy other projects rely on — while ordinary guidance there still yields to a more specific project rule.

### Verification

- **Mechanically checked:** the guard text is present in `skills/akiship/SKILL.md`'s `description:` (the resident line) and in the deployed copies at `~/.claude/skills/akiship/SKILL.md` and `~/.gemini/config/skills/akiship/SKILL.md`; `release.B8` states it is not a trigger; `scythe.py` exits 0 over every file touched.
- **Not verified, and not verifiable by any detector in this repo:** that a future session obeys the gate. This is a behavior claim about a model, not a property of code — the corpus cannot observe its own compliance (`akiflow-drift-diagnosis-aug6.md`). What the change buys is that the correct reading is now the *resident* one, which is the only lever this repo has.
- **Reopen trigger:** any activation of the akiship phases on a turn not containing the literal token `/akiship`, or on an interrogative turn that does contain it. Either means the gate's residency was necessary but not sufficient, and the next move is mechanical (a hook or a refusal check), not more text.

### Corroborating links

- [core-floor-promotion-aug6.md](core-floor-promotion-aug6.md) — the same residency argument, applied to rule files; source of the load-fail vs comply-fail split used here.
- [akiflow-drift-diagnosis-aug6.md](akiflow-drift-diagnosis-aug6.md) — the anchor primitive (owner's verbatim words as the final test) and the finding that the corpus cannot observe its own delivery.
- [redundant-owner-interrupts.md](../plan/done/redundant-owner-interrupts.md) — shipped `agent.A3`'s kill-tests and placed a pointer to them in `release.B8`; the pointer existed and did not prevent this.

## 5. Decision

**Action** — activation made literal and moved to where the trigger already lives; execution record in [plan/done/akiship-literal-activation.md](../plan/done/akiship-literal-activation.md).

- `skills/akiship/SKILL.md` — new `## Activation gate` with two required conditions (exact token `/akiship`, **and** an imperative asking the run to be performed), the execute-vs-consult table, and consult as the default whenever both readings are available. Same statement opens the `description:`.
- `payload/RULE-release.md` B8 — kept for its release-domain signals and narrow context per the owner's explicit constraint, but demoted: not a trigger, being routed into context grants nothing, completion-intensity phrasing modifies an already-authorized run rather than creating one, and the skill's gate is SSoT for whether the run may start — the one documented exception to the skill's own "the rule file wins".
- `skills/akirule/SKILL.md` — release keyword group relabelled to say it loads the rule file and never starts a run.
- `payload/index.md`, `README.md`, `docs/arch/rule-delivery-architecture.md` — synced; the arch doc gains the general form of the root cause (a skill's `description:` is resident, its body is not).

Findings 4 and 5 were first deferred as a different defect class — folding them into the activation fix would have made it a patch pile, which the owner had explicitly asked against — and were then folded in anyway, same day, when he instructed that nothing in the round stay outstanding. Both edits are one bullet each and neither touches activation:

- `payload/RULE-release.md` B8 — the self-answer licence is scoped to repo-determined facts; the owner's own stated criterion is his to define, and deciding it for him overwrites the anchor rather than self-answering.
- `payload/index.md` § Precedence — new rung 3 for the user's standing instructions (`~/.claude/CLAUDE.md`, `CLAUDE.local.md`), so an ABSOLUTE standing ban outranks a shared-corpus autonomy grant.
