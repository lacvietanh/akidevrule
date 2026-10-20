# Questions turned into actions — root cause and the `agent.A3` consolidation

## Start time
2026-10-20, after an agent on Claude Code (Opus 5.5) turned two consecutive owner questions into actions with `agent.A3` resident.

## Initial purpose
Why a question still becomes an action after eleven corpus changes on that boundary, which layer causes it (model, harness, corpus), and which change removes the cause instead of adding one more layer. Context: corpus 3.8.0 (unreleased), Claude Code 2.1.304 in auto permission mode.

## Strategy
Reconstruct the incident from the transcript; recount every corpus change on the boundary from git and `CHANGELOG.md`; inventory every clause that limits or pushes action; search the harness binary and the session transcript for action-pushing text and whether it was delivered; read the result as a flow (`METHOD-audit-flow.md`), not as a missing rule; put the final text through a clean-context challenger.

## Checklist
1. ✅ Incident chain reconstructed.
2. ✅ History: `git log -G` over the `A3` wording plus `CHANGELOG.md`, 2026-07-23 → 2026-10-20.
3. ✅ Clause inventory over `payload/`, `skills/`, `claude/`.
4. ✅ Claude Code 2.1.304 binary and the session transcript searched.
5. ✅ Countermeasures critiqued; final text challenged by an `aki-challenger` pass (Opus, high effort).
6. ✅ Owner idea tested — move the detail of `A3` to a dynamically loaded file; second challenger pass.
7. ✅ Open-item reports measured over 14 days of transcripts on the owner's Mac; third challenger pass.

## Result

### Incident
- The agent's reply ended with an offer ("if you agree I'll do it"). The owner asked: "phải làm sao để việc đấy được nhắc trong akiopen. có thể là ghi thành notes (akidevsync notes có commit kèm không vậy? tôi nghĩ là có nên, nhỉ?)". The agent read it as acceptance, invoked the notes skill and added a task.
- The owner: "tôi đang chỉ hỏi đáp." The agent deleted the task and ran `git restore` on the file (denied) — a second unrequested action, read off `agent.B1` "what you create, you remove" and `§0` "fix every instance".
- Asked next to classify the same messages, the same model classified every one correctly.

### History — eleven changes on one boundary
| Date | Change | Direction |
|---|---|---|
| 07-23 | `agent.A3` communication vs task; `GEMINI.md` §8 | limit |
| 07 | `GEMINI.md` §12 pre-action scope checklist | limit |
| 08-17 | `release.B8` autonomy contract | push |
| 08-19 | `A3` kill-tests | push |
| 08-22 | `/akiship` literal activation, after a push answered a question | limit |
| 08-22 | agy bias suite; containment plan "more rule text will not fix it" — Gemini only | limit |
| 09-08 | `GEMINI.md` anti-bias intensity pack | limit |
| 09-15 | decide-and-report, deep-think triggers; the `/akiship` gate loosened to "an explicit release order" | push |
| 09-22 | self-sufficiency kill-test | push |
| 09-26 | `/akithink` self-run thinks, never acts | limit |
| 10-08 | `B1` the request is the whole scope; `B6` trained defaults; `B7` harness overrides | limit |

Every Claude-side change was rule text; the 08-22 lesson (mechanism over wording) was applied to Gemini only.

### Clause inventory
108 clauses govern act vs ask: 79 limit action, 20 push it, 9 both. The limit is restated across `A3`, `B1`, `GEMINI.md` §0/§4/§8, `release.B8`, the `/akiship` gate and `/akithink`; the pushes concentrate in `A3` (task → execute, calibrate autonomy, kill-tests, converged → act), `METHOD-deep-think.md`, `release.B8` and `/akithink`. Claude's `A3` is plain prose; `GEMINI.md` §8 carries the strong-keyword form, including a correction-turn clause Claude's file lacks.

### Harness
Delivered in the session: "You are an agent … using your own judgment along the way." and "When you have enough information to act, act." (system prompt); after a compaction, "Whatever is still not started … is part of the work: finish it". In the 2.1.304 binary but not delivered: the auto-mode block "Execute immediately … Prefer action over planning". The harness adds pressure; `B7` already ranks it below the corpus. On this machine the act-now sentence first appears in transcripts on 2026-09-04 (they start 2026-08-16), matching the owner's report that the failure grew with recent Claude Code releases; transcripts do not store the full system prompt, so the exact release is not pinned.

### Reading
1. **Recognition is not the failure; the check is absent at the moment of action.** Classification succeeds when it is the asked task; on the action path (message → topic → skill → command) no step asks whether the message ordered anything.
2. **Rules that hold are bound to a moment and a literal cue.** `B4` (no credit trailer) fires when the commit message is written and matches a literal string; `A3` fired at no moment and asked for a judgment.
3. **The corpus has no source of authority, so it oscillates.** Each over-asking incident added a push, each over-acting incident a limit; the 08-22 literal gate was loosened on 09-15. The balance point sat in the model's judgment.
4. **The corpus ordered the second action.** `B1` (remove what you created) and `§0` (fix every instance) read as "repair by acting" on a correction turn.
5. **Intensity is untested on Claude.** The Gemini intensity A/B tied its null control because the trap suite could not discriminate (`gemini-helpfulness-bias-enforcement-2.md` § 5.5): no evidence either way.

### Challenger findings adopted
- The literal `?` collides with a polite order ("can you fix X?") under ABSOLUTE: an action verb aimed at the agent outranks the `?`.
- Whole-message classification under-acts on "commit it — do we need a version bump?": classify clause by clause.
- "A correction orders only a report" would stall ordered work ("you missed file X"): a correction returns to the order it corrects; report-only applies to an unordered action.
- The `B1` removal duty must carry the exception itself, or a reader of `B1` alone repeats the incident.
- `/akithink` writes a decision record on a question turn: proposed there, not written.
- Restatements left in place keep the pile: `release.B8`, the `/akiship` gate, `/akithink`, `GEMINI.md` §8 become pointers in the same change.
- Cut: a `B7` row (`B7` records skipped steps, and its root already ranks harness text below the corpus); a clause about the agent's own offer (the `?` cue covers it); a per-call check (once, before the turn's first state-changing call).

### Detail in a dynamically loaded file
- Owner idea: keep one root law resident and move the case lists and checklists to a file loaded on demand (a skill `references/` file or a `METHOD-` file), as skills do.
- Test: a clause can leave the resident core only if the moment it governs already forces that load on every host. Both sides of `A3` fail it. The act side fires at a non-deliberate moment (the incident: message → topic → skill → command); an on-demand file loads only after the judgment that fails, the asymmetry `akiship-literal-activation-aug22.md` recorded (resident trigger, on-demand guard). The ask side also fires without deliberation: the incident began with a trailing offer written while composing a report, and resident `agent.A4` open-item codes and `agent.B5` "report as unclassified and ask" create owner-facing asks with no "about to ask" moment.
- Delivery: `METHOD-deep-think.md` is routed by meaning only; Antigravity loads it by a generated description about evaluating and deciding, not asking; Codex has no route gate; `aki-challenger` and `aki-judge` receive the core file only. Moving the kill-tests there removes them from exactly the hosts that over-ask.
- Size is not a reason: the ask side is about 2.9k of the core's 25.5k characters, and no incident traces to its residency.
- What the idea yields here is subtraction inside the resident core, not relocation: `A3`'s "propose in one line" bullet duplicates its unsolicited-suggestions line, its reversibility door list and deep-think trigger (b) duplicate `agent.B3`, and `A3`'s escalate-only-when list is the narrowing of `B3`'s ask-before list, split across two sections.
- The four-bullet form adopted earlier lists cases (polite request, mixed message, correction) — leaves the root derives; a bare root without a moment, a literal cue that decides the incident and the over-asking clause loses the load-bearing parts. The incident message hid its only `?` inside a parenthesis behind "có thể là ghi thành notes" — a hedge, so the cue must include hedges, not only `?`.
- "Report and leave it for the owner" contradicts six fixes that cut owner interruptions (`A3` over-asking is a failure 07-23, `release.B8` 08-17, kill-tests 08-19, `coding.B5` 08-22 (now `coding.B3`), decide-and-report 09-15, self-sufficiency 09-22). A wait is legitimate only at a narrowed `B3` door or for a fact only the owner holds.

### Open items
- Evidence (14 days, 34 sessions): 301 replies carried an open-item block; letters used: V 401, T 371, S 243, D 229, F 99, M 91, W 86, P 83, B 41, O 28, R 27 and more; 163 owner messages asked "còn tồn gì?" or equivalent. `agent.A4` defines no kinds or letters beyond three examples, so each session invents its own.
- A sampled block shows all four failure shapes: a release listed as an item ("say ship and I run it"), a fact only the owner holds (legitimate), a check possible only after production (legitimate, but it blocked the release line that would close it), and a doc/code mismatch the agent could have fixed, left open.
- Collisions: `D1` is Cloudflare's database in every Nuxt/Cloudflare project; `P`, `W`, `T` appear in the owner's window handles (`P7·W301·T8`). Corpus addresses always carry a topic prefix (`test.D1`), so they do not collide.
- The owner named three kinds: still hanging, proposable and doable at once, open and needing a decision with a recommendation and why. Unverified is not a fourth kind: what can be verified here is verified; what cannot is hanging on the condition that allows it.
- `agent.B3` "modifying shared rule files, templates, or project-wide conventions" dates from the first commit (2026-05-22, a 41-line baseline, no recorded reason). It guards standards other repos consume (a rule corpus, UNIDOC, templates) edited from another project's session, so it stays; the over-asking comes from `B3` asking even when the owner's order names the step — the already-authorized kill-test inside `A3` does not reach `B3`'s list.

### Verification
Incident and history are transcript and git facts. The inventory is a retrieval pass with known gaps (long lines unread in `skills/akiflow/SKILL.md`, `skills/akiship/SKILL.md`, `payload/RULE-release.md`). The causal reading is untested by an intervention; the reopen trigger is the test.

### Corroborating links
[akiship-literal-activation-aug22.md](akiship-literal-activation-aug22.md) (first question-to-push incident; consult as default) · [autonomy-escalation-ship-verification-sep15.md](autonomy-escalation-ship-verification-sep15.md) (the loosening) · [gemini-helpfulness-bias-enforcement-2.md](gemini-helpfulness-bias-enforcement-2.md) (intensity null) · [../plan/done/agy-helpful-bias-containment.md](../plan/done/agy-helpful-bias-containment.md) (mechanism over wording, Gemini).

## Decision
**Action — approved by the owner 2026-10-20 and applied; execution plan: [../plan/done/a3-order-root.md](../plan/done/a3-order-root.md).** No relocation: `A3` stays resident, rebuilt around one root, and duplicates inside the core are removed.
1. `agent.A3` lines 35-39 and the unsolicited-suggestions line 44 replaced by two bullets:
   ````
   - **Understand what the owner asked before anything else; act only on an order (ABSOLUTE).** Communication — a question about something, a "maybe", a "how/should", thinking aloud, a correction of an act nobody ordered — gets an answer and nothing else; execution needs an order — an action verb aimed at you ("fix X", "can you fix X?"). Before the turn's first state-changing call, name the words that order it; none, no call.
   - **An order runs to the end without asking.** A correction of ordered work resumes it; over-asking on safe ordered work is as much a failure as acting unasked; a pause is only an escalation below.
   ````
   Kill-tests, deep-think triggers, the converged outcome and the escalate-only-when list stay, condensed; on a communication turn the decision block is the answer.
2. `agent.A4`'s open-item bullet replaced by:
   ````
   - **An open item is only what this turn cannot finish.** Sort every leftover before reporting: doable within the order → done now, never listed; a release or the workflow's next step → never an item, one closing line once no `Q` or `N` is open. The rest takes a letter for its kind plus a per-conversation number, never renumbered or reused:
     - `Q` — a decision `A3`'s escalation list leaves to the owner, presented as it says: options, the recommendation, why.
     - `N` — a step outside the order, ready to run on one word: what and why. One not taken in the next turn is dropped, not carried.
     - `H` — on hold for something outside this turn: a date, a CI run, a deploy, another machine, the owner's hands (OTP, a device); what closes it and when. One that outlives the session is written into the active plan's `- [ ]` in the same ordered turn.
   ````
   The next bullet drops its clause "one that needs nothing from the reader is not listed".
   The `Q`/`N`/`H` letters were replaced the same day by `Q`/`T`/`N`, coded by what the owner's silence does: [open-item-codes-oct20.md](open-item-codes-oct20.md).
3. `agent.B3` header becomes "Ask before, unless the order names the step:" — the already-authorized test applied where the ask list lives; the shared-standards line stays.
4. `agent.B7` row "When you have enough information to act, act": the override cell gains "; it never turns communication into an act (`A3`)". No new row, no change to the `B7` root.
5. Pointers in the same change: `release.B8` (question vs order, over-asking), `/akiship` activation condition 2 and its reversibility citation, `/akithink` (record proposed, not written, on a communication turn), `GEMINI.md` §8/§12 lines that contradict the root ("ambiguous task → stop and ask", "can you fix X?", a correction of ordered work, CHECK 1 "literally requested"), `coding.B3` and `/akiship` unverified items as `H`. `GEMINI.md` keeps its §0/§4/§8/§12 repetition: the file records it as deliberate for Gemini, and no Gemini incident motivates this change. `coding.B3`, `aki-challenger`, `aki-judge` and akiflow cite the kill-tests, which stay.

**Rejected**
- A PreToolUse gate denying the first write on a question-shaped message: a per-language heuristic and a second gate beside the route gate; the owner ruled no mechanism covers this fully and chose wording.
- A turn-class marker in the receipt: self-reported; it catches a forgotten classification, not a wrong one.
- A model call classifying every turn: paid quota per turn (`agent.B3`).
- A new penalty card, section or `B7` row: one more layer on the pile this change consolidates.
- Disabling auto mode: an owner setting, and its action block was not delivered.
- Moving the ask side to `METHOD-deep-think.md`, a new `METHOD-` file or `skills/akirule/references/`: fails the forced-load test on Antigravity, Codex and workers (see § Detail in a dynamically loaded file).
- The four-bullet case list: leaves the root derives.
- A bare root with no moment, no hedge cue and no over-asking clause: drops what the incident needed.
- `D`/`P`/`V` letters: `D1` and the window handles collide, and `V` splits "hanging" in two.
- A separate `B1` clause for residue of an unordered act: one incident against a permanent resident line.
- Moving the `B7` override into its root: the act-now sentence already has its row.

**Reopen trigger** — the owner again has to say "I was only asking" after this lands: count such corrections over transcripts and reconsider the gate.

**Cross-references** — `payload/RULE-agent-behavior.md` (`A3`, `A4`, `B3`, `B7`), `docs/arch/corpus-map.md`, `payload/RULE-release.md` (`B8`), `skills/akiship/SKILL.md`, `skills/akithink/SKILL.md`, `payload/GEMINI.md` (§8), `docs/plan/done/a3-order-root.md`.
