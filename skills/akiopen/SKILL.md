---
name: akiopen
description: Session-opening brief — what is still pending in this project, and nothing else. Use whenever a session opens on a project or the owner asks, in any wording, what is unfinished, what the active plans or notes say, what an inbox file still lists, or what to pick up next. Read-only; reports only what needs doing, in a fixed four-field shape, ranked by severity.
user-invocable: true
---

# akiopen — what is pending here

Opening a project means rebuilding the picture of unfinished work from five places nobody should have to remember (`ux.A2`). This skill reads all five in one pass and reports only what still needs doing. It is an audit (`agent.B5`): no file edits, no git mutation, no note or plan marked done.

## Scan — one batched pass, only surfaces that exist

```bash
git status --short && git diff --stat | tail -1
python3 ~/.claude/skills/akidevsync-notes/scripts/notes_cli.py .akidevsync/notes.json list --pending --detail
grep -c '^\s*- \[ \]' docs/plan/*.md docs/*.md /dev/null 2>/dev/null | grep -v ':0$'
grep -n '^Status:' docs/plan/*.md 2>/dev/null
awk '/^## \[Unreleased\]/{f=1;next} /^## \[/{f=0} f' CHANGELOG.md | grep -c '^- '
grep -rn -i 'needs owner\|needs mac\|manual test\|unverified' docs/plan/*.md 2>/dev/null
```

| Surface | Pending means |
|---|---|
| Working tree | modified or untracked files; group them by directory, not one line per file |
| Notes | `.akidevsync/notes.json` tasks with `done: false`; pinned first |
| Active plans | `docs/plan/*.md` outside `done/` with open `- [ ]` items, or a plan whose text says done but still sits outside `done/` (`docs.B1`) |
| Inbox files | any top-level `docs/*.md` with open `- [ ]` items — tasks pushed in from an upstream standard or another repo |
| Release | `[Unreleased]` has entries, or the tree changed with no entry yet (`release.A`) |
| Hand-offs | a line in an active plan waiting on the owner or another machine (`coding.B3`) |

A surface the project does not have is skipped silently. A project `CLAUDE.md` may name additional inbox or plan paths; read it before scanning.

## Report — pending only, never an inventory

- One item per pending thing, at most seven, ranked by severity (`ux.C1`); the rest collapse into one count line.
- **Pending = actionable now.** A box in a plan whose `Status:` parks it (wishlist, not scheduled, on hold), a step its own line gates on a date still ahead (`on or after`, `due`), and a check the plan marks optional (`when convenient`) are *waiting*: none takes a ranked slot; one waiting line names each with its trigger (`P9 ≥ 2026-11-09 · R1 due 2026-12-10 · P0–P5 wishlist`). A gate whose date has passed, or whose condition the scan sees met, is pending again.
- **Closed-but-unticked is checked before ranking.** An open box whose closing evidence already exists (a commit naming the step, the file or test the line names present in the tree, a later `Status:` saying done) is one *tick it* item, never open work (`docs.C3`).
- Each item carries four fields: **problem** (what is pending, `path:line`) · **why it is still open** (from the plan text, note age, git dates — measured, never guessed; write *unclear* when the sources do not say) · **proposal** (one sentence) · **goal** (what closes it).
- Nothing pending: one line, plus the waiting line when there is one.
- Half-finished work that cannot be told from an abandoned experiment is reported as unclassified and asked about, never sorted by guess (`agent.B5`).
- The report is the deliverable. Fixing anything, including moving a finished plan to `done/`, is a separate request.
