# Zero-Trust Audit Method

**Activation**: the user asks for a strict, uncompromising sweep that must be proven by detectors rather than impression — of the whole project, or of a change plus everything that reads it.

Zero trust means nothing counts as clean because it looks clean: a finding exists only when a mechanism produced it, and it weighs exactly what that mechanism weighs — an exact match is a verdict, a pattern match is a candidate. This is **read-only** like every audit (`agent.B5`): it reports, it does not fix, it never mutates git state. Fixing is a separate run, sized after the report is read.

## A. Scope-lock (mechanical, before reading anything)

1. **Declare which of the two scopes applies** — *project-wide* (every file of the relevant kind) or *change-related* (the current change plus everything that reads it). Say which, in one line, before any finding.
2. **Produce the file list by command, never from memory and never from a diff alone.**
   - project-wide: `find`/glob by extension or directory.
   - change-related: `git diff --name-only` **union** a grep for the callers of every changed symbol. A change scope without its callers is a diff, not a scope — the defect a change introduces usually lands in the file that was not touched.
3. **State the exact file count** before the first read. Every count in the report is relative to this locked set.

## B. Mechanical pass runs first

1. **Run the detectors before forming any opinion** — typecheck, the repo's linter, `scythe.py` (`skills/akiflow/scripts/scythe.py` in the akidevrule source repo) for `[WRAP]`/`[YAP]`, and the targeted `grep` scans the relevant rule file already specifies (`ui.C1` for frontend, `flow` for state, `release.B` for version state).
2. **Run only what the project actually has**, and name what you skipped and why. A missing `tsconfig.json` means there is no typecheck to run, not a gap to invent one for. Never run a build or a dev server to satisfy this step.
3. **Attach the raw output**, and attach it *before* stating a conclusion. A tool run afterwards to confirm something already asserted is not verification.

## C. Two evidence classes — never merge them

| Class | What produces it | Weight in the report |
|---|---|---|
| **CERTAIN** | an exact, machine-decidable match | a verdict, may be counted and totalled |
| **SUGGESTED** | a heuristic, pattern, shape, or naming signal | a candidate only — the mechanism locates it, judgment decides it |

CERTAIN: a selector defined twice, an export nobody imports, a type error, a hardcoded hex outside the token source, a hard-wrapped comment, an i18n key with no translation, a migration in the CHANGELOG that never ran.

SUGGESTED: three blocks that look extractable, a name that reads ambiguously, a file that may belong in another directory, a flow that looks dead. A script can point at these; it cannot rule on them.

Three rules hold the line: a SUGGESTED item is never phrased as a verdict, never enters a "N violations" total, and never carries an imperative — it is offered for a decision. A CERTAIN item always carries `path:line` and the command that produced it. Silence from a detector is never evidence of cleanliness for anything that detector cannot see; say so instead of implying coverage.

## D. Signature propagation

The moment one instance of a violation shape is confirmed: stop, grep that exact shape across the **whole locked scope**, and report the match count — including when it is zero. One instance found by reading is almost never one instance present, and the owner should never have to ask "did you check the others?".

## E. Adversarial self-challenge

Before writing the report, answer the question that breaks the illusion of being done: *"if the owner asks why I did not check X, what is X?"* Run those checks, then report. What genuinely cannot be checked goes in the coverage line as unchecked, never as clean.

## F. Report — specific and short

- **Findings only.** A row per file in the scope is a coverage claim, not a report; coverage is one line, not a table.
- **Order:** CERTAIN grouped by type → SUGGESTED → coverage line.
- **Every finding:** `path:line`, one sentence of what is wrong, and the detector or command that found it.
- **Coverage line:** files locked, detectors run, detectors skipped and why, what remains unchecked.
- **Forbidden:** "mostly clean", "looks good", "almost done" — and equally forbidden is a clean verdict on anything only a heuristic examined.
- **No edits, no fixes, no `git add`/`stash`/`restore`** (`agent.B5`). Ambiguous work is reported as unclassified and asked about, never auto-classified.
