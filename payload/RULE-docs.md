# Core Docs Rules

<!-- Address map: docs.A1-4 · docs.B1-3 · docs.C1-4 -->

## Goals
Docs should be readable for both humans and LLMs.

## A. Index & Structure

### A1. Index
- `docs/index.md` is the master index
- Update it when docs or code changes affect discoverability
- Index entries should be short and descriptive

### A2. Topic folders
Use these short, stable topic folders:

- `docs/biz/` — business backbone: identity, USP, positioning, monetization (MANDATORY for any project with a business dimension)
- `docs/feat/` — features, systems, behaviors
- `docs/arch/` — architecture, structure, technical design
- `docs/plan/` — plans and execution notes
- `docs/ref/` — stable references, setup notes, lookup docs
- `docs/research/` — exploratory, comparative, or time-bound findings

Do not create new top-level doc topics unless the existing set clearly fails.

`biz/`, `feat/`, and `arch/` hold only current/target state — never accumulate history or superseded reasoning (`research/` is where that lives, see B2). Threshold: a rationale that fits in one sentence may stay inline (e.g. `(chose D1 over Postgres — serverless-native, no extra infra)`); a rationale that needs its own strategy, comparison, or verification to be trustworthy belongs in `research/` instead, with the doc here holding only the conclusion and a link.

Filenames across all `docs/*` never lead with a date — the content-identifying name comes first: concise, precise, and unique to that file's own content (short preferred). Dates live in the doc's own header stamp (A4), not the filename. A compact date suffix (abbreviated month + day, no year, no separator — e.g. `jun24`, `jul27`) may be appended at the very end as a lightweight, optional disambiguator (existing example: `docs/plan/done/improve-jun24.md`) — separate from the domain-specific supersede-chain naming already defined for `plan/` (B1, version-increment) and `research/` (B2, ADR-style numeric suffix).

### A3. Business backbone — `docs/biz/`
- For any project with a business dimension, `docs/biz/` is REQUIRED and is the spine.
- All `arch/`, `feat/`, and `plan/` docs that touch product direction or money must reference it.
- When code intent and a `biz/` doc disagree, the `biz/` doc wins — reconcile or escalate.

### A4. Anchor stamp — `updated <time> <version>` on every `arch|biz|feat` doc

`arch/`, `biz/` and `feat/` hold current state and are the SSoT other docs and code are written against, so a reader cannot tell a still-true doc from a silently rotted one without knowing when it was last confirmed. These three folders carry a stamp; `plan/`, `research/` and `ref/` do not — the first two are event records whose own schema already dates them (B1, B2), and `ref/` is verified by running its commands, not by a date.

**Placement** — first line of the file's own header block: immediately under the H1 for a plain Markdown doc, or as a `updated:` key in the frontmatter/description field where the file already has one. One stamp per file, never per section.

```markdown
# Rule delivery architecture

> updated 2026-08-12 · v2.1.0
```

**`<time>`** is `YYYY-MM-DD`, the date of this edit. **`<version>`** is the project version the doc's content was confirmed against — the last **released** version at edit time, read from `CHANGELOG.md` (`release.A`), never an `[Unreleased]` buffer and never a number invented for the doc. A project with no version scheme stamps the short commit hash instead.

**Every content update rewrites the stamp, in the same edit.** A stamp older than the change under it is worse than no stamp: it certifies as verified something nobody checked. Pure-cosmetic edits (typo, link fix, reflow) leave it alone — the stamp records when the *content* was last true, not when bytes last moved.

The stamp is what makes drift mechanically visible: a `docs/arch/` file stamped three releases back is a drift-audit lead (C3) before anyone reads a line of it.

## B. Lifecycle & Sync

### B1. Plan lifecycle & Filename Rules
- Active plans live in `docs/plan/` (or `plan/`)
- Completed plans move to `docs/plan/done/`
- Use `done`, not `archived`, for completed plans
- **Filenames**: see A2 for the repo-wide no-leading-date rule and the optional compact date suffix. Plan docs additionally use version-increment naming when execution can't wait for the plan (e.g. `v2-feature-name.md` or `v1.1-update.md`).
- **Prioritize Creating Plans (`docs/plan/`)**: Always prioritize creating a plan document in `docs/plan/` (or `plan/`) for any code/architectural changes.

### B2. Research doc structure (`docs/research/`)

A research doc is an **event record** — the reasoning as it stood when written (the current-state vs. history split is defined in A2). Its body is frozen: never rewrite a claim, a number, or a verification status in place, because the record of what was believed is the doc's whole value. What may change after writing, by class:
- **Cosmetic** (typo, broken link, a path after a rename) — edit in place, no marker.
- **Erratum on a claim** — a fact turned out wrong, a number was re-measured, an unverified claim was later verified or contradicted, but the **Decision** field still stands: append a dated entry to a closing `## Amendments` section (`- 2026-08-02 · § R9: verified on kiro-cli 2.16.0; the row above was written unverified`), naming the section it corrects and stating only the corrected fact (no story of finding it — `agent.C2`), and add `Status: amended <date>` under the H1 so a reader is warned before reaching the stale claim. The original text stays.
- **Decision changes** — applying the correction would alter the Decision field: create a **new** research doc and add `Status: superseded by <path>` at the top of the old one. Name the chain with a sequential numeric suffix, ADR-style: `db-engine-choice.md` → `db-engine-choice-2.md` → `db-engine-choice-3.md`, each `superseded by` pointing only at its immediate successor so the chain can be walked backward.
- **Decision-field links and cross-references** — an Action link to where the result landed, a new cross-ref: edit in place; those fields describe where the event's consequences live, not the event.

The discriminator is mechanical: read the Decision field; if the correction would change it, successor doc, otherwise amendment. Anything outside research that links to a chain (`arch/feat/biz`) points at the latest number and gets updated each time the chain grows — that edit is allowed because those docs hold current state, not history.

Required fields, in order:
1. **Start time** — when the research began
2. **Initial purpose** — the question/goal, plus the context/constraints at the time (needed later to judge whether the research still holds)
3. **Strategy** — the approach taken
4. **Checklist** — the steps executed
5. **Result** — the finding/conclusion itself, plus:
   - **Verification** — the evidence/method that hardens the result (data, test, cross-check against another case). If not verified, say so explicitly — silence reads as certainty when it isn't.
   - **Corroborating links** — links to the evidence/cases the result rests on or conflicts with (not just a verified/unverified flag)
6. **Decision** — the resolution reached, one of:
   - **Action** — link to the artifact(s) where it materialized (`arch/`, `plan/`, `feat/`, `biz/`, `ref/`, or code/commit); 0 or many. Landing in `ref/` always means a **new** clean lookup doc, never the research doc itself relocated or rewritten into ref format — `ref/` is a distilled answer, research is the narrative trail behind it.
   - **No action** — state why explicitly, so it reads as a deliberate stop, not an abandoned doc
   - **Follow-up research** — link to the new research doc opened by this result
   - **Rejected/closed** — an option eliminated with no replacement; no link needed
   - **Cross-references** — list any other existing docs affected by this decision, beyond the artifact(s) it materialized into

### B3. Documentation behavior
- Docs are dense by default (domain application of `agent.A4`): conclusion first, then structure (tables/bullets), prose last, deletion test per sentence — narrative filler and restatement make a doc worse for both humans and LLMs. Length follows content: never pad to look thorough, never cut load-bearing detail to look short.
- Keep docs synchronized with code. Code does not auto-generate docs unless complex/requested; when editing code derived from `feat|arch` docs, proactively sync the doc or comment the reference path.
- Comments should not restate what a doc already explains in detail — when the rationale/behavior is complex, or a doc already covers it precisely, comment a reference to that doc (its specific section/heading, not just the whole file, when only part of it applies) instead of duplicating the explanation inline. Keeps the doc as the single source of truth and stops the comment from silently drifting out of sync with it.
- Prefer one clear canonical doc over multiple overlapping docs
- Use Markdown
- Prefer Mermaid when the subject is complex enough that plain text is harder to follow — flows, architecture, state transitions, or pipelines
- README should stay focused on setup and entry-level usage unless the project explicitly wants more

## C. Drift audit

B3 is a **process** rule — sync the docs while the code changes. This group is the **verification** rule — check afterwards whether that sync actually held. Every discipline decays, and a topology that mandates plan lifecycles, supersede chains, and a master index needs a way to prove it was followed. Sibling audits own their own domains and must not be restated here: `release.B` (version/CHANGELOG state), `ui.C` (class and token drift), `METHOD-audit-flow.md` (flow and state drift). This group owns **docs-vs-reality** only.

### C1. When it runs — and when it does not

The discriminator is not how big the audit is. It is whether the baseline is stable and whether the findings outlive the session.

- **Runs here** — the tree is clean and the last release is published: the "open the repo after a release, audit before starting the next version" moment. The baseline is stable, so a recorded snapshot stays true.
- **Not here, unstable baseline** — a long half-finished working tree (some committed, some not, some mid-edit). That needs triage of the tree state, not a docs snapshot, and belongs to the commit workflow (`/akigitcommit` step 0). A "state of the tree today" record is false tomorrow and would fill the `research/` chain with expired findings.
- **Not here, pre-ship gate** — work finished but not yet pushed, deployed, or released. That is a pass/fail gate whose findings must be *fixed* before shipping rather than filed for posterity: `release.B7`.
- **Below threshold** — a spot-check of one doc, or anything answerable inline, produces no doc at all. Two docs per question is the failure mode this threshold exists to prevent. The bar for the C2 output is a fan-out across two or more domains, or findings that cannot all be fixed in the current session.

### C2. Output contract — a research doc paired with a plan doc

An audit that qualifies under C1 produces **both**, never only one:

1. **The finding record** — a `docs/research/` doc on the B2 schema, which already fits an audit exactly. *Start time* = when the audit ran · *Initial purpose* = the scope audited plus the version/commit it ran against, since that context is what lets a later reader judge whether the findings still hold · *Strategy* = which domains and lenses · *Checklist* = the steps executed · *Result + Verification* = the findings, with anything only checkable at runtime marked "unverified" per `coding.B3` · *Decision → Action* = a link to the plan doc below.
2. **The execution doc** — a `docs/plan/` doc per B1 that sequences the fixes and links back to the research doc.

What makes the pair trustworthy:
- **Name by what was audited — never version-first or date-first** (A2): `audit-ui-jul27.md`, `audit-docs-drift-jul27.md`. The version audited belongs in the *Initial purpose* field, not the filename: a version in the name reads ambiguously against B2's supersede-chain suffix (`audit-ui-2.md` is the second audit; `audit-1.4.2.md` would look like one).
- **Re-auditing later opens a new doc in the chain** (B2) and never edits the old audit's body. An audit is an event record, not a living document.
- **A finding deliberately left unscheduled must be recorded as B2's "No action" with its reason.** Silence makes a deliberate deferral indistinguishable from an oversight, and low-severity findings are exactly what a plan doc otherwise swallows.

### C3. What to compare

Walk the topology, checking each doc against what is actually true now:
- `docs/index.md` — every entry resolves, and nothing that exists is missing from it (A1)
- `docs/plan/` — an active plan whose work already shipped belongs in `done/` (B1); an active plan nobody is executing is either dead or unstarted and must be labeled as one, not left ambiguous
- `docs/arch/` — module boundaries, data shapes, and diagrams still match the actual tree
- `docs/feat/` — the described behavior still matches what the code does
- `docs/biz/` — where code intent contradicts it, A3 decides: the `biz/` doc wins until it is explicitly changed
- `docs/research/` — a conclusion whose recorded context no longer holds needs a successor doc plus a `Status: superseded by` line; a claim corrected while the Decision stands needs an `## Amendments` entry plus a `Status: amended` notice; a body rewritten in place with neither is a **Wrong** finding (B2)
- `docs/ref/` — commands, paths, and setup steps still run
- Doc references inside code comments (B3) still point at a heading that exists
- **The inverse walk — code → docs:** a complex feature or subsystem shipped with no corresponding `feat/`/`arch/` doc is an **Incomplete** finding (C4). The audit checks both directions, never only whether existing docs still hold

### C4. Severity — drift is not one thing

- **Wrong** — the doc states something a reader would act on and be harmed by: a stale command that destroys data, an architecture diagram that routes work to the wrong module. Fix before anything else; a wrong doc is worse than no doc.
- **Stale** — accurate when written, since superseded. Goes into the plan doc.
- **Incomplete** — nothing false, something missing.
- **Cosmetic** — index ordering, a broken relative link.

Report the count per level. Never compress "wrong" and "cosmetic" into one number — an audit that reports "14 drift issues" hides whether the docs are currently dangerous.

Audits are read-only by construction: `agent.B5`.
