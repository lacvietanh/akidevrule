---
name: akithink
description: Structured deep thinking for decisions — restate the problem, excavate the goal chain to the ultimate goal, first-principles decomposition (facts/constraints/assumptions), mandatory critique (steelman, inversion, pre-mortem), then converge into a decision record. Thinking only: it never edits, runs or ships anything — what happens after the record is decided by the originating turn's class (`agent.A3`), outside this skill. Self-run mode (non-interactive, decide and report) fires on an `agent.A3` deep-think trigger or on owner authorization; trivial two-way-door calls stay inline. Interactive session only when the owner asks for one. Best on a top-tier model (Opus/Fable).
---

# akithink — structured deep-thinking session

The **active** consumption mode of `payload/METHOD-deep-think.md` — the same analytical brain the router loads passively for ordinary tasks, run at maximum depth: interactively when the owner asks for a session, in self-run mode when an `agent.A3` deep-think trigger holds (Invocation scope). It thinks; it never acts (`pattern.A3`).

## When NOT to use this skill

Trivial, reversible execution with nothing to decide gets no session — act. An interactive session is reserved for a decision the owner wants to reason through together; a decision that meets an `agent.A3` trigger runs in self-run mode (see Invocation scope), scaled in depth to how hard the decision is to reverse; a two-way-door call is decided inline.

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
- **Escape hatch:** the user can ask to converge or decide now, in any wording, at any point to jump straight to Phase 5 with whatever has been established so far.
- **Anti-sycophancy:** same rule as METHOD Module 3 — do not agree without critique, in any phase.
- **Anti-overuse guard:** if the problem turns out to be small and reversible once restated in Phase 1, say so and offer to just decide it directly instead of running the full protocol.

## Self-run mode

Runs all phases without waiting, when the owner authorizes the agent to decide on its own, in any wording, or when fired by an `agent.A3` deep-think trigger:
- Phase 1 restatement is written, not confirmed.
- The Interaction rules pacing (1–2 questions per turn) does not apply — no questions are asked mid-session.
- Questions reach the owner only via `agent.A3`'s escalation outcomes, never through this skill's own turn-by-turn interaction.
- Phase 5 converges and reports the decision block (`agent.A3`'s converged outcome), and the session ends there. This skill thinks and never acts (`pattern.A3`): whether anything is then executed is decided by the class of the originating turn — a task turn proceeds under `agent.A3`, a question turn gets the block and nothing else. A decision-record doc per `RULE-docs.md` still applies when the decision is durable.

## Invocation scope

- **Self-run — model-invoked, no confirmation.** Fires on an `agent.A3` deep-think trigger (that list is the only trigger list — not restated here), on the router's deep-think-depth line (`akirule`), or on owner authorization. Two-way-door work stays below it: decide inline with `METHOD-deep-think.md` passively.
- **Interactive — owner-invoked only**, by name or in equivalent words; never auto-started, because it spends the owner's turns.
