# Plan: rebalance exploration delegation

**Status: completed 2026-09-18.** The canonical `agent.A2`/`agent.A5` policy was changed, focused mechanical checks passed, and the installer propagated an identical deployed copy.

## 1. Problem and scope

The corpus intends to protect the main agent's finite context by delegating retrieval-heavy exploration. In practice, it can make delegation the reflex even when the main agent could answer with one bounded read, grep, pipeline, or batch. This matters beyond one repository because the rule corpus is installed across many clients.

The starting hypotheses were: agents overestimate task difficulty; overlapping rules do not establish a clear priority; and the wording makes context loss vivid while understating worker startup, briefing, latency, observability, and cross-process spend.

Scope is deliberately narrow:

- Change only the delegation decision policy in `RULE-agent-behavior.md`.
- Preserve delegation for broad audits, inventories, log trawls, and large semantic reading.
- Preserve main-thread ownership of judgment.
- Do not add a penalty card, harness feature, fixed token budget, or automatic third-operation STOP in the first change.

## 2. Current rule shape and why it over-fires

Two passages currently establish the same directional default:

- `agent.A2` says to do menial work through a worker and frames main-thread context as the one resource a task cannot recover.
- `agent.A5` says to default to delegating exploration and permits inline work only when the answer is one file already known.

The exception is weaker than the default in salience, ordering, and testability. “One file already known” excludes common bounded work such as one grep plus one trace, a shell aggregation over many files, or two known semantic reads. The corpus names worker costs later, but does not feed those costs back into the initial route decision.

This is also a single-source-of-truth defect: A2 grants the license while A5 contains the costs and caveats. An agent can act on the first without applying the second.

## 3. Observed evidence

Three independent runs reproduced the same failure family while the relevant core rule was already loaded:

| Incident | Observed cost | What happened | Why the proposed policy routes it differently |
|---|---:|---|---|
| Gegrok/checkjoin investigation | approximately 92k tokens and about 30 minutes before cancellation | A bounded history-loss question expanded into broad delegated exploration. The useful answer ultimately came from tracing the live history path and prompt construction. | Start with one bounded probe over the known runtime path; if grep or a pipeline narrows to the relevant records and functions, keep it main. Delegate only a remaining large semantic corpus. |
| Delegation-rule review, round 1 | 67,329 tokens, 16 tool uses, 568,376 ms | The reviewer chased rule paths and line numbers despite a read-only, bounded question. Its own report called this over-exploration. | Known rule excerpts and one bounded search stay main; only a raw corpus sweep whose digest is much smaller goes to a worker. |
| Delegation-ladder stress test, round 3 | 56,965 tokens, 8 tool uses, 442,002 ms | The reviewer again explored paths and rule material beyond what the decision required. | A precise question plus bounded source set stays main or uses one fresh worker only when whole-file comprehension would flood context. |

These are at least three occurrences across unrelated call sites, enough to justify correcting the shared shape rather than treating the issue as a one-off model mistake. They do not prove a universal numeric threshold, so the first fix should not invent one.

## 4. Six rounds of deep reasoning

### Round 1 — rule structure or model estimation

The review found structural bias, not merely poor estimation:

- Two prominent pro-delegation imperatives outweigh one trailing inline exception.
- Context loss is framed as irreversible; wasted delegation is described only as fixed overhead.
- There is no executable discriminator comparable to `pattern.A2` or `coding.B5`.
- The rule explicitly teaches the agent to distrust the intuition that direct work is faster, even when the whole task is one bounded operation.

Steelman: over-delegation may be the intended safe failure mode because retained context is irreversible while a worker call is only spend. This prevented an immediate wording edit.

### Round 2 — compare candidate mechanisms

Three mechanisms were compared:

1. **Main-first budget:** simple, but forces known-large sweeps to poison main context before delegation.
2. **Scope-certainty gate:** prevents vague briefs, but traps fuzzy large discovery in main.
3. **Bounded discovery followed by a route decision:** converts uncertainty into a precise brief without requiring every task to delegate.

The stronger principle emerged: **narrow at the source first; delegate only what cannot be narrowed effectively.** Direct shell aggregation and restricted batch reads are not failures to delegate because their raw volume never enters the main context.

A penalty card was rejected because needless delegation is a pre-action decision defect, not a locally detectable output defect that can be repaired by rewriting the answer.

### Round 3 — attack the first ladder

Stress tests exposed five important distinctions:

- A small digest is valid only if it is lossless for the decision; a count is not enough when matched lines matter.
- Retrieval may decompose while the answer does not; shared-state synthesis remains a main-context judgment task.
- A probe must be allowed to finish the task rather than mechanically trigger delegation afterward.
- Forking is not selected merely because context exists; it is justified only when accumulated context is expensive to serialize and the work is bounded.
- Worker recursion must be denied by default because each layer resets visibility and multiplies unaccounted spend.

Latency and cumulative context remained unresolved; neither had a trustworthy live meter suitable for a hard gate.

### Round 4 — test a countable third-operation trip-wire

A proposed rule said the third main-thread discovery operation should STOP and invoke A5. It had one advantage: it converted a vague disposition into an observable event and caught all three incidents retrospectively.

It was rejected for the initial fix because STOP did not answer the routing question. If STOP automatically delegates, it still sends a tiny task to a worker after two cheap operations and contradicts the source-narrowing principle. If STOP merely re-evaluates, it adds a second mechanism before the primary route policy has field evidence.

Token and time budgets were also rejected as gates: the main agent lacks a reliable live meter, cross-process spend is invisible, and fixed thresholds would be repository- and task-dependent.

### Round 5 — separate drift detection from routing

The review corrected the trip-wire's role: a future operation count could detect scope drift, but must never itself mean “delegate.” Routing must still depend on whether the answer can be narrowed in place and whether it needs live-context judgment.

This round also confirmed that broad audits remain canonical worker work: raw input is large, the requested output is a digest, and the audit can be briefed precisely. The main agent still owns severity and meaning where judgment is not mechanically specified.

### Round 6 — converge on the minimal policy

The final mechanism is intentionally small:

1. A5 is the sole source of truth for main-versus-worker routing; A2 points to it.
2. Default to narrowing data at the source, not defaulting to delegation.
3. Main executes a command, pipeline, restricted read, or batch when it returns a bounded answer rather than a raw dump.
4. If target, question, or output shape is unclear, main may run one bounded probe; the probe may complete the task.
5. Delegate only the residue that requires reading or understanding a volume that cannot be narrowed before entering context.
6. Keep conversation-dependent and per-item judgment in main; delegate retrieval and return a digest.
7. Prefer a fresh worker. Use a fork only when the task genuinely needs substantial accumulated context that would be expensive to restate.
8. Workers do not recursively delegate unless the caller explicitly grants a bounded fan-out.

## 5. Proposed edit locations

### `agent.A2` — remove the competing default

Replace the bold “do the menial work through a worker” policy with a short pointer: batch independent calls and narrow output here; use `agent.A5` to decide whether exploration crosses a worker boundary.

A2 continues to own round-trip economics:

- Read or Edit known files instead of shell-printing them.
- Find all edit sites before editing.
- Batch independent calls.
- Aggregate in shell when that directly answers the question.

### `agent.A5` — own the complete route decision

Rewrite the opening disposition into an ordered decision:

- **Narrow first.** If one bounded command, read, or batch can return the answer or a lossless decision digest, run it in main.
- **Probe once when necessary.** If the target or output shape is unclear, run one bounded orientation probe; stop if it answers the task.
- **Delegate flooding, not mere size.** Use a fresh worker when raw material must enter a context before it can be reduced and the worker can receive exact paths, question, and output shape.
- **Keep judgment here.** Delegate retrieval, not conversation-dependent synthesis or ambiguous classification.
- **Fork rarely.** Require substantial inherited context plus bounded bulk work.
- **No recursive delegation by default.** Fan-out requires explicit depth and width from the caller.

Retain the existing requirements for rule receipts, explicit model and effort dials, read-only enforcement, structured output, conclusion-not-dump returns, and manual accounting of cross-process spend.

## 6. Before and after

**Before:** A2 and A5 both establish delegation as the default; the inline exception is narrow and worker costs are separated from the license.

**After:** A2 owns efficient in-thread operations and points to A5; A5 first asks whether the source can be narrowed, then delegates only unavoidable context flooding while keeping judgment in main.

## 7. Verification plan

Before editing, turn the incidents and counterexamples into a route table. After editing, ask independent agents to classify each case using only the revised A2/A5 text.

| Case | Expected route |
|---|---|
| One bounded grep plus trace | Main |
| Large log reducible by one `awk` or `jq` pipeline | Main |
| List files and line counts | Main shell aggregation |
| Two known files requiring semantic comparison | Main |
| Known 5k-line file, precise shell-extractable question | Main |
| Known 5k-line file requiring whole-file comprehension | Fresh worker |
| Twenty independent semantic retrieval targets | One fresh worker or caller-controlled batch |
| Broad repository audit returning a compact table | Worker from the start |
| Debugging dependent on current conversation state | Main |
| Architecture critique over a large repository | Worker for inventory, main for judgment |

Acceptance criteria:

- All three observed incidents route to a bounded main probe or a precisely scoped single worker, not open-ended delegation.
- Broad audits and large semantic reading still route to workers without first consuming main context.
- Shell-answerable tasks never delegate merely because the repository or input is large.
- No case routes by a file-count, token, or elapsed-time magic number.
- No worker recursively fans out without an explicit bound.
- The revised text contains one delegation default, not two.

Observe subsequent real sessions. Reopen for a stronger trip-wire only after new evidence shows repeated scope drift despite the revised route policy.

## 8. Rejected alternatives

- **Keep the current default and merely add worker costs:** insufficient because the salient default still resolves ambiguity toward delegation.
- **Always perform one main-thread probe:** wastes a round trip when a broad audit or precise large task is already briefable.
- **Third discovery operation automatically delegates:** detects drift but chooses the route incorrectly for small bounded tasks.
- **Fixed file, line, token, or time threshold:** not portable and not reliably measurable before action.
- **Penalty card:** wrong lifecycle; the defect occurs before output and has no local rewrite fix.
- **Self-reported delegation receipt:** diagnostic claim with no evidentiary weight under `agent.B2`.
- **Default recursive delegation:** hides spend and breaks caller control.
- **Merge all of A2 into A5:** loses A2's distinct ownership of round-trip and batching mechanics.

## 9. Decision record

**Decided:** Change `RULE-agent-behavior.md` so `agent.A2` points to `agent.A5`, and `agent.A5` defaults to source narrowing before delegating only unavoidable context flooding; keep judgment in main, prefer fresh workers, and deny recursive delegation by default.

**Because:** the relevant rule was loaded during at least three independent over-exploration incidents, so the failure is not rule availability; the current duplicated, asymmetric defaults make delegation the easiest interpretation, while the converged discriminator preserves both main context and small-task efficiency.

**Rejected:** wording that merely softens the current default, hard budgets, automatic operation-count delegation, penalty cards, self-reported receipts, and unrestricted recursion.

**Reopen if:** revised wording still produces repeated over-exploration, broad audits begin staying in main, or transcript review shows agents cannot reliably distinguish lossless narrowing from lossy summarization. At that point evaluate a separate scope-drift trip-wire or a harness-level tool-call counter.

## 10. Gegrok finding kept separate from this rule change

The Gegrok investigation did not show that history vanished from disk. The bot has two distinct stores:

- Recent conversational history is selected by the exact chat and topic and capped at roughly eight turns and 2,000 characters.
- The `/checkjoin` ledger in `facts.jsonl` is a digest containing counts and dates, not detailed conversation content.

The matching message in topic `651` did retrieve history and produced a detailed response. Therefore the strongest current explanation is a context-selection and digest-design limitation — topic boundaries, truncation, and an intentionally sparse checkjoin digest — rather than storage loss. Reopen this conclusion only with the exact allegedly missing message ID and topic showing that a stored matching record was omitted from the constructed prompt.

## 11. Execution record — 2026-09-18

- `agent.A2`'s duplicated worker-first license was removed and replaced with a pointer that keeps direct batching and source narrowing in A2 while making A5 the sole process-boundary decision.
- `agent.A5` now runs bounded commands, restricted reads, pipelines, and batches in main when they return the answer or a lossless decision digest; permits one bounded route-discovery probe that may finish the task; delegates only unavoidable context flooding with an exact brief; keeps conversation-dependent and ambiguous judgment in main; prefers a fresh worker; reserves forks for bounded work needing substantial accumulated context; and denies recursive delegation without explicit depth and width.
- Mechanical text checks confirmed both old defaults are absent and the new narrowing, probe, context-need, and bounded-recursion clauses are present.
- `scythe.py` reported no `[WRAP]` or `[YAP]` findings over the rule, plan, and CHANGELOG; `git diff --check` was clean.
- `bash install.sh --yes` succeeded across six Claude profiles and the configured Antigravity, Codex, Kiro, and Grok roots; `cmp` confirmed `~/.aki/akidevrule/RULE-agent-behavior.md` is identical to the canonical payload source.
- The static and propagation checks settle the artifact change, not future model behavior. The §9 reopen trigger governs field evidence: reopen if over-exploration repeats, broad audits remain in main, or lossless narrowing cannot be distinguished reliably from lossy summarization.
