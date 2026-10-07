# Aki Method — Subtraction Audit

<!-- Address map: subtract.A1-3 · subtract.B1-3 · subtract.C1-2 · subtract.D1-2 -->

**Tier: Analytical.** Load when the request is to minimize, strip, or maximally simplify an existing repository rather than to check whether it is correct.

`METHOD-audit-zero-trust.md` asks *is this right*. This file asks **does this need to exist at all** — over the whole locked scope, across every domain, not one flow and not one component tree. It **inherits** zero-trust's discipline unchanged and never restates it: scope locked by command before the first read (`zero-trust` A), detectors before opinion (B), CERTAIN versus SUGGESTED evidence classes (C), signature propagation from any confirmed instance (D). What changes is the question the detectors are pointed at, and therefore the terminating condition, the severity classes, and the mandatory brake in B3.

Read-only by construction (`agent.B5`): it writes the report and the plan that schedules the removals. It deletes nothing. Deletion is a separate run, sized through the normal gate.

## A. Scope, and the honest terminating condition

### A1. "As minimal as possible" is not a stopping rule
No detector returns *minimal*. Any process that promises an absolute floor either runs forever or fakes completion, and faking it is the likelier outcome because the last rounds look like diligence. Say this out loud in the report rather than accepting the framing.

### A2. Terminate on loop-until-dry
Round = one full pass of the B1 domain sweeps over the locked scope. Stop after **two consecutive rounds that surface zero new findings**, and state the round count in the coverage line. Between rounds nothing is fixed — removals happen after the report, so a later round finds new candidates only when an earlier one taught the sweep a shape it did not have (`zero-trust` D signature propagation), which is exactly the signal worth chasing.

### A3. The scope is locked once and never grows mid-run
Per `zero-trust` A: declare project-wide or change-related, produce the file list by command, state the count before the first read. A subtraction sweep is unusually tempting to widen ("while we're here") — a widened scope invalidates every count already reported, so a genuinely necessary widening closes the run and reopens it with a new lock.

## B. The passes

### B1. Domain sweeps — each pass owns one kind of "unneeded"
Run only what the project actually has; name what was skipped and why (`zero-trust` B2). Each row delegates its detectors to the rule file that already owns them rather than defining a second set.

| Pass | Looks for | Detectors owned by |
|---|---|---|
| Code reachability | unreferenced exports, unreachable branches, dead files, parameters nobody passes | the project's own linter / typecheck |
| Abstraction | a shared layer with fewer call sites than its evidence bar — the inverse of the Rule of Three | `pattern.A2`, `pattern.B3` |
| Guards | repeated checks, fallbacks, and defensive branches around one transition | `pattern.A8`, `METHOD-audit-flow.md` B4, sized by `METHOD-proportionality.md` B4 |
| Duplication | one concept defined in two places, one name with two live definitions | `pattern.A1`, `ui.B4` |
| UI surface | class strings, arbitrary values, style blocks that survive the delete/inherit/hoist pass | `ui.A1`, `ui.C1` |
| Dependencies | packages nobody imports, polyfills the runtime no longer needs | package manifest versus import graph |
| Docs | docs nothing links, plans whose work shipped, superseded research with no chain marker | `docs.C3` |
| Content | i18n keys nobody reads, strings for removed features | `content.A3` |
| Operational leftovers | migrations already run and still pending-located, one-shot scripts, dead flags and env vars | `release.B5`, `stack.C8` |
| Tests | a test that checks nothing, duplicates another, compares to the implementation's own value, or carries a fixture larger than its boundary | `test.A1`, `test.A2`, `test.D` |

### B2. Severity classes for subtraction — and the class that forbids removal
- **Dead** — no reference anywhere in the locked scope. CERTAIN, machine-decidable, countable.
- **Redundant** — a second definition of something that already exists elsewhere; removing it is the SSoT fix (`pattern.A1`).
- **Oversized** — it exists for a real need, but a smaller shape covers that need entirely.
- **Unjustified** — an abstraction, layer, or option below its evidence bar. SUGGESTED, always: the mechanism locates it, judgment rules on it.
- **Load-bearing but ugly** — reported explicitly as *do not remove*. A subtraction report that lists only removals reads as though everything examined was removable, and the next reader deletes accordingly.

### B3. Chesterton's Fence is the mandatory brake
Every candidate passes `coding.B2` before it can be reported as CERTAIN: read the docs it references, then the code, then the git history where the logic has been reworked more than once. A candidate whose reason for existing cannot be found is not thereby unjustified — it is **SUGGESTED with the reason unknown**, and that phrasing is the finding. Aggressive minimization is the mirror image of over-engineering, and this is the only clause standing between the two.

## C. Output

### C1. The report
`zero-trust` F shape, unchanged: findings only, CERTAIN grouped by type → SUGGESTED → coverage line; every finding carries `path:line` and the command that produced it; the coverage line names files locked, detectors run, detectors skipped and why, rounds completed, and what remains unchecked. Add one line per B1 pass that produced nothing, so a silent pass is distinguishable from an unrun one.

### C2. The pair, and what removal is worth
The full audit produces the `docs.C2` pair — a `docs/research/` finding record plus a `docs/plan/` doc sequencing the removals. Each planned removal carries an estimate of what it actually buys (a file deleted, a dependency dropped, a flow shortened); a removal that buys nothing measurable and carries any risk of losing a reason nobody recorded is filed as B2's "No action" with that stated, not scheduled.

## D. Runner

### D1. The bulk sweep is not a council
akiflow's own gate says so (its Bulk-mechanical-work law): a sweep whose paths are known up front has nothing for a roster to arbitrate, and running it inside the room grows the lead's context with the item count. Route the sweeps to read-only workers enforced by mechanism, not wording (`agent.A5`) — Claude Code's `Workflow` tool for the fan-out, or cross-CLI headless workers in plan/read-only mode — each handed exact paths, exact patterns, exact output shape, and the `RULE-agent-behavior.md` floor.

### D2. Judgment stays above the sweep
Classifying a finding as *dead* versus *load-bearing but ugly* is the one output the owner acts on, and it never delegates downward to a cheap tier (`agent.A5`). The sweeps return locations; the strong context decides meaning. akiflow enters at exactly that seam — classification, severity, and the removal plan — not at the scanning.

## One-line reminder

Prove a thing is unneeded before removing it, and prove the sweep is dry before claiming it is finished — nothing else in this method is allowed to assert either.
