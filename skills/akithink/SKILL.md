---
name: akithink
description: Structured deep-thinking session between agent and human for important decisions — restate the problem, excavate the goal chain to the ultimate goal, first-principles decomposition (facts/constraints/assumptions), mandatory critique (steelman, inversion, pre-mortem), then converge into a decision record. For big / hard-to-reverse / goal-ambiguous problems — small inline questions are already covered passively by akirule + METHOD-deep-think. Also runnable self-run (non-interactive) when owner-authorized or fired by an `agent.A3` trigger. Recommends running on a top-tier model (Opus/Fable).
---

# akithink — structured deep-thinking session

Invoke with `/akithink`, or when the user explicitly asks for a deep-thinking session on a decision ("let's think this through properly", "hãy tư duy sâu về việc này", "cần một session suy nghĩ kỹ"). This is the **active** consumption mode of `payload/METHOD-deep-think.md` — the same analytical brain that akirule loads passively for ordinary tasks, run here at maximum depth through an interactive protocol.

## When NOT to use this skill

Small, reversible, low-cost-of-error decisions should just be decided. Casual "should we…?" questions are already handled inline by akirule auto-loading `METHOD-deep-think.md` passively — that is enough for two-way-door decisions. Reach for `/akithink` only when the decision is big, hard to reverse (one-way-door), or the goal itself is still unclear. Do not open a session for something that a one-paragraph answer would resolve.

## Toolbox

At session start, Read `~/.aki/akidevrule/METHOD-deep-think.md`. It is the toolbox for every phase below — do not re-derive the modules from memory.

## Phase 0 — model check

If the current model is Haiku or Sonnet, print a recommendation: deep-thinking sessions are best run on a top-tier model (Opus/Fable) — suggest `/model` then re-invoke `/akithink`. This is a **recommendation only, never a block** — if the user wants to continue on the current model, proceed.

## Phase 1 — restate

Restate the problem in your own words. Wait for the user to confirm or correct it. **Do not proceed to Phase 2 on an unconfirmed restatement** — a session built on a misunderstood problem wastes the whole point of slowing down.

## Phase 2 — goal excavation

Apply METHOD Module 1 (goal excavation). Climb the goal hierarchy to the ultimate goal; produce the explicit goal chain; call out conflicting goals.

## Phase 3 — first principles

Apply METHOD Module 2 (facts / real constraints / assumptions). If the problem has business or product context, also apply Module 4 (techbiz lens). Skip Module 4 explicitly, and say so, when the problem is a personal tool, art project, or pure research question.

## Phase 4 — critique

Apply METHOD Module 3 (critique). **Mandatory, even if the user and agent already agree** — steelman the opposing option, attack the favored option, inversion, pre-mortem, second-order effects. Anti-sycophancy rule applies here exactly as in the METHOD: no "great idea!"-style agreement without critique.

## Phase 5 — convergence

Converge into a decision record with:
- the decision
- rationale
- rejected alternatives, with reasons
- assumptions to monitor going forward

Then:
1. **Always propose writing a decision record** under `docs/`, following `RULE-docs.md` conventions (read `~/.aki/akidevrule/RULE-docs.md` to align the exact path and lifecycle — typically `docs/research/` for the record of how the decision was reached, or `docs/plan/` if it converts directly into an execution plan).
2. **If** the converged material is large or complex (many decision points, several rejected options, interlocking tradeoffs), additionally suggest `/akihtmlreport` to visualize it. The docs file is the durable source of truth; the HTML is a view, not a replacement — do not suggest the HTML report as a substitute for writing the doc.

## Interaction rules

- **Pacing:** ask 1–2 highest-value questions per turn. `AskUserQuestion` is fine for discrete choices. Never dump a full questionnaire in one turn.
- **Escape hatch:** the user can say "chốt" (or an equivalent "let's converge/decide now") at any point to jump straight to Phase 5 with whatever has been established so far.
- **Anti-sycophancy:** same rule as METHOD Module 3 — do not agree without critique, in any phase.
- **Anti-overuse guard:** if the problem turns out to be small and reversible once restated in Phase 1, say so and offer to just decide it directly instead of running the full protocol.

## Self-run mode

Runs all phases without waiting, when the owner authorizes the agent to run it itself (e.g. "tự nạp /akithink", "tự chốt", "cho bạn tự quyết") or when fired by an `agent.A3` deep-think trigger:
- Phase 1 restatement is written, not confirmed.
- The Interaction rules pacing (1–2 questions per turn) does not apply — no questions are asked mid-session.
- Questions reach the owner only via `agent.A3`'s escalation outcomes, never through this skill's own turn-by-turn interaction.
- Phase 5 converges, acts, and reports the decision block (`agent.A3`'s converged outcome). A decision-record doc per `RULE-docs.md` still applies when the decision is durable.

## Invocation scope

Interactive mode is explicit-invoke only — akirule does not auto-trigger the interactive protocol; it is reached only when the user asks for it by name or in equivalent words. Self-run mode above is the exception: it fires from an `agent.A3` trigger or owner authorization, without an explicit `/akithink` invocation. The signals that matter for passive-mode auto-loading live on `METHOD-deep-think.md`.
