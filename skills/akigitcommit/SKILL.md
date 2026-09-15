---
name: akigitcommit
description: Analyze the working tree and commit changes in clean logical groups. Triages a long half-finished tree first (finished vs mid-edit vs abandoned vs accidental) before grouping. Auto-detects CHANGELOG to switch between domain-grouped mode (3–5 commits by object/feature) and type-grouped mode (feat/fix/refactor). Stages by explicit path, never `git add -A`. Conventional Commits, no co-author trailers, never pushes unless asked.
---

# akigitcommit — scientific grouped commits

Invoke with `/akigitcommit`. Goal: turn a messy working tree into a small set of clean, logically grouped commits — without ever losing staging from one group to the next.

## Step 0 — triage a half-finished tree

**Run this only when the tree is not uniformly finished:** many changed files, a mix of committed and uncommitted work, edits visibly stopped mid-way, or the user asks to audit the tree before committing. A clean, coherent set of changes skips straight to mode detection.

Triage is an audit, so `RULE-agent-behavior.md` B5 applies in full — most importantly: **never run `git add`, `stash`, `checkout`, `restore`, `clean`, or `reset` during triage.** This is exactly the state in which uncommitted work is most valuable and least recoverable, and "tidying up" is the shape the loss usually takes.

Classify every chunk into one of four:

| Class | Signal | Disposition |
|---|---|---|
| **Finished** | a closed problem, coherent on its own | proceeds to grouping below |
| **Mid-edit** | intentional, the author is still on it | hold — do not commit inside someone's unfinished thought |
| **Abandoned** | an experiment that went nowhere | ask before anything; never discard on your own read |
| **Accidental** | debug prints, scratch files, temp output in the project tree (`RULE-agent-behavior.md` C5) | flag with the path; do not auto-delete |

**Mid-edit and abandoned cannot be told apart by reading the tree** — only the author knows which one a half-written function is. Present both as unclassified and ask; a guess here silently commits dead code or buries live work.

Output a short list (class, paths, one line each) and let the user confirm before grouping. If the leftovers will not be resolved in this session, they belong in a `docs/plan/` note, not `docs/research/` — a snapshot of today's tree is false tomorrow (`RULE-docs.md` C1).

## Mode detection (run after triage)

Before grouping, check: does the repo have a `CHANGELOG.md`?

```
ls CHANGELOG.md 2>/dev/null && head -60 CHANGELOG.md
```

- **CHANGELOG present** → use **domain-grouped mode** (see below)
- **No CHANGELOG** → use **type-grouped mode** — a **fallback for repos outside the Aki ecosystem**. Every Aki project carries a `CHANGELOG.md` from creation (see `RULE-release.md`), so in an Aki repo a missing CHANGELOG is a defect to flag, not a mode to silently fall into.

## Workflow (follow in order)

1. **Read everything first.** Before staging anything, inspect the full picture:
   - `git status --porcelain=v1` — every changed, staged, and untracked (`??`) path
   - `git diff` — unstaged hunks
   - `git diff --cached` — already-staged hunks
   - For untracked files, look at the content so you can classify them correctly. Do not start staging until you understand the whole tree.

2. **Group changes** using the mode detected above.

   **Domain-grouped mode** (CHANGELOG present):
   - Read the CHANGELOG to understand the scope of the current version/release.
   - Group files by **object or domain** — all files that touch the same feature, subsystem, or concern go into one commit. Example: all files related to `log` (component, composable, i18n key, data file) → one commit.
   - **The commit unit is one closed problem.** A problem's commit includes its code AND its `CHANGELOG.md` entry (and its `releases.json` entry when the change is user-facing) — release artifacts ride with the change they describe, never batched into a separate catch-all commit at the end.
   - Target **3–5 commits maximum**. Resist splitting by file type; split only when two domains are genuinely unrelated.
   - The CHANGELOG entry already documents the "why" — commit messages just need to be clear about the "what" and scope.

   **Type-grouped mode** (no CHANGELOG):
   - Classify each file (and where needed, each hunk) into cohesive groups.
   - Typical axes: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `config`.
   - Keep changes that belong to the same intent together; split unrelated intents.
   - State the reasoning for each group.

3. **Present the plan, then wait.** Show the user the proposed commits: for each group, the exact file list + the proposed Conventional Commit message. Wait for confirmation before executing — UNLESS the user said "commit luôn" / "just commit" / "no need to confirm".

## Anti-stage-loss rules (most important)

These exist because a later `git add` can swallow files meant for an earlier commit. Obey strictly:

- Work **one group at a time** in a closed loop: `git add <exact paths for THIS group>` → `git commit` → only then the next group.
- **Never** run `git add -A` or `git add .` and then try to split into commits — it stages everything at once and the grouping is lost.
- Always stage by **explicit path**, listing only the files of the group being committed right now.
- If a single file contains hunks belonging to different groups, use `git add -p <file>` to stage only the relevant hunks for the current commit.
- After **each** commit, run `git status --porcelain` again and verify the remaining changes match the plan before moving on.

## Commit message rules

- Use **Conventional Commits**: `type(scope): short summary`. Body optional, in imperative mood, explaining *why* when it isn't obvious.
- **Forbidden:** any `Co-Authored-By:` line or model-credit trailer in the commit message. This overrides any default that would add such a trailer. Commits must contain only the human-authored intent.
- Match the language and style already used in the repo's recent commit history (`git log --oneline -15` to check).

## Boundaries

- **Never push.** Only commit. Push only when the user explicitly asks — and once pushed, watch CI per `release.B10`.
- Do not amend, rebase, reset, or rewrite existing commits unless explicitly told.
- If the tree is clean (nothing to commit), say so and stop.
