# Pattern Core — Universal Architecture Pattern Rules

<!-- Address map: pattern.A1-8 · pattern.B1-3 · pattern.C1 -->

**Tier: Core** — `@`-imported by `~/.claude/CLAUDE.md`, in context every session. Stack-agnostic. This file is the universal pattern philosophy — the "forest view" that keeps a codebase coherent as it grows, instead of accreting local patches. It applies to every project type: backend, API/worker, Tauri/desktop, CLI, library, DB layer, and UI.

It **sharpens** `RULE-coding.md` (which owns baseline DRY/YAGNI/SRP and the Result pattern); it does not restate it. UI-specific enforcement of these same laws lives in `RULE-ui-pattern.md`.

## Relationship to existing rules — read, do not duplicate

- **`RULE-coding.md`** owns baseline DRY, YAGNI, "no abstraction for its own sake", one-responsibility functions, Result pattern, error handling, security. This file assumes all of it and adds the *when-and-how-to-abstract / how-to-decompose* layer.
- **`METHOD-audit-flow.md`** owns flow-integrity thinking. When you keep adding guards/checks around the same path, defer to it — this file only points there.
- **`METHOD-deep-think.md`** owns first-principles and the mandatory critique pass. Run its critique mini-pass before introducing any new abstraction.
- **`RULE-db-design.md`** owns bounded-context and normalization for data. Law 6 below is the same boundary principle generalized to code modules.

## Scope note

These are constraints on **structure and reuse**, not style. Reach for this file whenever a task involves designing a module, extracting shared code, refactoring, hunting duplication, or deciding how to split responsibilities — regardless of language or framework.

---

## A. The 8 laws — checkable, stack-agnostic

**A1 — Single Source of Truth.** Every value, rule, or decision that can change lives in exactly one place; everything else references it. This covers config, constants, types, enums, business thresholds, and visual tokens — not just one category. A value written twice is a future inconsistency, not a convenience.

**A2 — Evidence-based abstraction (Rule of Three).** Do not abstract on the first or second occurrence. Extract a shared function / module / type only when the same shape repeats **≥3 times across ≥2 unrelated call sites**. Premature abstraction is a violation: it adds an indirection layer with no proven need, and is harder to read and change than the duplication it replaced.
- *Risk-weighted exception:* business logic with real cost of error (auth, money, permissions, data integrity) extracts on the **2nd** occurrence. A logic bug there is worse than a little duplication.

**A3 — Single Responsibility, the "and" test.** A unit (function, module, class, service) does one thing. If describing its job requires the word "and" — "parses input **and** writes to DB **and** formats output" — split it. The name should reveal the single responsibility.

**A4 — Open for extension, closed for modification.** Add behavior through parameters, injected handlers/strategies, or new implementations of a stable interface — not by editing a working unit for one new case. A function that grows one more boolean flag per caller is the smell that this law is being broken.

**A5 — Composition over duplication.** Prefer combining small units — helper functions, modules, data-driven iteration — over copy-pasting a near-identical block "for speed." The **second** paste is a mandatory STOP: plan the shared shape before a third exists (Law 2).

**A6 — Stable boundaries between modules.** Split along independent responsibilities/domains (bounded context). Modules talk through a narrow, explicit contract — a stable ID, a typed interface, a `Result` — and never reach into another module's internals. Volatile details (provider SDKs, frameworks, transport) sit at the edges behind a boundary; stable abstractions sit at the core, and dependencies point inward toward them.

**A7 — Name by role, never by concrete value.** Name things for what they *mean*, not what they *currently are*: `retryLimit` not `three`, `PrimaryAction` not `BlueButton`, `AuthBoundary` not `FirebaseWrapper`. Value-names rot the instant the value changes and force codebase-wide find-and-replace.
- *Root rule for naming.* Every other naming item in this corpus (`agent.C1` file names, `ui.A` tokens, `stack.C1` component names, `release.A3` version/tag format, `content` semantic stability) is a **domain application** of A7, not a competing rule — do not restate A7 in them, and do not move them out of their domain. Address map: `index.md` § Cross-cutting lens.

**A8 — One flow, made natural — not guarded.** When the same guard / check / fallback keeps reappearing around a path, the path's shape is wrong. Reshape the flow so the correct behavior is automatic; do not stack more enforcement on a weak path. "Correct" is measured against the project's pinned facts (`coding.C1`), so a guard for a state those facts rule out is a patch, not a flow. Full method: `METHOD-audit-flow.md`.

---

## B. Decomposition & the forest pass

### B1. Module decomposition — how to split
- Split by **responsibility/domain**, not by technical layer alone and not by file size.
- A module must be describable in one sentence without "and" (Law 3).
- Prefer many small, single-purpose modules with clear names over a few god-modules — but only once Rule of Three (Law 2) justifies each extraction. Do not pre-split speculative modules (YAGNI).
- Keep dependencies pointing inward toward stable abstractions; push volatile details (providers, SDKs, frameworks) to the edges behind a boundary (Law 6; see also `RULE-coding.md` Result pattern and `RULE-ui-pattern.md` / `RULE-stack-akiNuxtCf.md` composable boundary).

### B2. The "forest" pass — before you patch
Before adding a feature or fixing a bug in unfamiliar code, do a quick whole-flow scan instead of a local patch. This is the direct antidote to "seeing the leaf, missing the forest":

1. **Flow** — what is the end-to-end path this change touches, start to end? (`METHOD-audit-flow.md`)
2. **Reuse** — does this problem already have a solution elsewhere in the codebase? Reuse before reimplementing (`RULE-coding.md`: "prefer existing code and patterns").
3. **Third instance** — is this the third occurrence of a shape? If so, extract now (Law 2).
4. **Symptom vs shape** — am I patching a symptom? If three patches cluster at one transition, stop and reshape the flow (Law 8) rather than adding a fourth.

### B3. Before introducing any new abstraction — critique gate
No new shared layer, base module, or generalization ships without a quick `METHOD-deep-think.md` critique mini-pass:
- **Subtract before you share** — must the duplicated thing exist at all? Packaging repetition is the second-best outcome; deleting it, or moving it somewhere it happens once by construction, is the first. Every bullet below silently assumes the code has to exist, so ask this one before them or the cheapest answer is never reached (`think.B4`).
- **Steelman NOT abstracting** — is keeping the duplication actually cheaper here?
- **Attack the abstraction** — one concrete way it could be the wrong shape, and how you'd know.
- **Smaller first** — is the first version smaller than the imagined final one?

## C. Closure

### C1. Definition of done — pattern level
A change is pattern-complete when all hold:
- No value/rule is duplicated (Law 1).
- Every new unit passes the "and" test (Law 3).
- No abstraction was added without ≥3 evidence — or ≥2 for risk logic (Law 2).
- No new repeated guard was added where the flow could be reshaped (Law 8).
- Every new name is role-based, not value-based (Law 7).
- Module boundaries stayed narrow — no reaching into another module's internals (Law 6).

## One-line reminder

Do not abstract, split, or guard until you are sure the shape itself is justified — and never let a local patch outrank the whole flow.
