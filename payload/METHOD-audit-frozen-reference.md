# Frozen-Reference Compliance Audit

<!-- Address map: frozen-ref.A1-3 · frozen-ref.B1-5 · frozen-ref.C1-5 -->

**Activation**: a rule or project doc names one or more concrete implementations as the canonical/frozen shape another project must match structurally (a pinned dependency version, a byte-identical component, a literal config key, a frozen page layout) — and the user asks whether the target actually conforms, at any strictness down to a single character.

## Why this method exists

Ordinary rule-following audits judge against *principles* (DRY, SRP, naming) — a project can satisfy those by reading well. A frozen-reference clause instead claims literal parity with a specific artifact that exists somewhere else. Reading the rule's prose and judging "this looks compliant" against memory or impression is the single highest-frequency failure mode for this class of clause: the rule text describes the shape, but only the reference file *is* the shape. A rule audited this way will keep re-surfacing the same violations across sessions, because "looks compliant" is not falsifiable and each session re-derives its own impression instead of re-running the same diff.

This method forces the audit to be a diff against the actual reference bytes, never a recollection of them. It inherits `zero-trust`'s CERTAIN/SUGGESTED evidence split and read-only discipline (`agent.B5`) — this file adds what is specific to *comparing against a named external artifact* rather than auditing a codebase against itself.

## A. Locate every reference before judging anything

1. **Resolve the exact file(s)** the clause points to — not "the project that implements X" but the literal path(s):line(s). A frozen-reference clause with no resolvable path is not yet auditable; resolve it first or say plainly it cannot be resolved.
2. **A single reference can itself have drifted from the written rule.** When more than one implementation of the standard exists, read at least two independently before ruling — where they disagree with each other, that is a defect in the *rule corpus*, not in the target project being audited. Report it as a **standard-vs-practice gap**, separate from target defects, and never charge it against the target.
3. **Note what changed since the clause was written.** A frozen reference frozen a year ago against a codebase that has since evolved elsewhere is now two artifacts pulling apart; say so rather than silently picking a side.

## B. Build the comparison mechanically, never from memory

1. **One row per literal unit**, not per file: a specific exported function name, a specific class/prop, a specific config key, a specific sequence of steps in a flow. "The auth composable looks similar" is not a row; "`loginWithGoogle` returns `Result<T>`, the reference throws" is.
2. **Verdict per row is one of exactly:** `MATCH` / `RENAMED` / `MISSING` / `EXTRA` / `STRUCTURAL-DIFF`. No row gets softened into "acceptable variance," "close enough," or "minor style difference" inside the audit — that judgment belongs to whoever reads the report, not to the auditor produced it. State the literal fact; let severity be decided downstream.
3. **Distinguish clauses that explicitly allow local naming** (a rule that says "class names follow each project's own tokens") from clauses that claim structural/sequence/value identity. The former makes a naming difference not-a-violation by the rule's own text; the latter makes even a one-character difference a row. Cite which kind of clause governs each row — do not apply free-naming leniency to a clause that never granted it, and do not manufacture a violation out of a clause that did.
4. **Every row carries `path:line` on both sides** — the target and whichever reference the row was checked against. A row without both sides is not yet evidence.
5. **When the target diverges from the frozen shape, check whether a separate, higher-precedence rule justifies the divergence** (a project-level constraint that pre-dates and conflicts with the frozen clause). Report the conflict explicitly rather than either silently fixing it or silently ignoring it — that decision is the project owner's, not the auditor's.

## C. Report

1. **Verdict first**: does the target meet the standard, plainly stated, before any table.
2. **Findings ranked by severity** (hard-rule / functional break → structural drift → cosmetic), each with the comparison row(s) that produced it.
3. **A separate, clearly labeled section for standard-vs-practice gaps** (A2) — these are follow-ups for the rule corpus, not the audited project.
4. **A coverage line**: which references were read, which clauses could not be resolved to a path, what was explicitly out of scope for this run.
5. **Read-only** (`agent.B5`): this produces a report, never a fix. Fixing what the report finds is a separate, explicitly authorized run.
