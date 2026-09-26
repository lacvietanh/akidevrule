---
name: akidevsync-notes
description: Read and edit a project's `.akidevsync/notes.json` task/note file — the per-project task list written by the Aki-Dev-Sync app (github.com/lacvietanh/aki-dev-sync). Use whenever the task reads or changes that project task list — listing, adding, pinning, completing, editing or deleting a task or note, in any wording. Also use when asked to cross-check pinned/open notes against what a release actually shipped (CHANGELOG, code) before marking them done.
---

# akidevsync-notes — edit a project's Aki-Dev-Sync task file safely

The Aki-Dev-Sync app stores every project's task list at `<project>/.akidevsync/notes.json` (schema: `about`, `schema`, `notes`, `tasks[]`, `updated_at`; each task has `id`, `title`, `detail`, `done`, `pin`, `wish`, `created_at`, `updated_at` in epoch-ms). The file is normally gitignored (`.akidevsync/` — the app excludes it from PUSH/PULL by default too), so edits here are local-only and never show up in `git diff`.

**Never hand-edit the JSON with the Edit tool.** The app itself reads/writes this file, so any mutation must match its exact formatting (2-space indent, `ensure_ascii=False` so Vietnamese text stays literal, alphabetical per-task key order, a trailing newline) or the next diff a human looks at gets noisy for no reason. Always go through the bundled script:

```
python3 ~/.claude/skills/akidevsync-notes/scripts/notes_cli.py <path-to-notes.json> <command> [args]
```

(On Antigravity/Codex/Kiro/Grok, substitute that CLI's skills root — see `~/.aki/akidevrule/.source-repo`'s `README.md` for the list of sync targets.)

## Locating the file

`find <project-root> -maxdepth 2 -name notes.json -path '*/.akidevsync/*'` (or just check `<cwd>/.akidevsync/notes.json`). If it does not exist, the project has never opened in Aki-Dev-Sync, or task notes were never migrated — **do not create one uninvited**. Only run `... init` when the user explicitly asks to start tracking tasks for a project that doesn't use the app.

## Commands

```
list [--pin] [--done] [--pending] [--wish] [--detail]   # --detail also prints each task's detail body
add "<title>" [--detail "<text>"] [--pin] [--wish]
set <task-id> [--done true|false] [--pin true|false] [--wish true|false] [--title "<t>"] [--detail "<t>"]
delete <task-id>                                          # permanent — confirm with the user first
note "<text>"                                              # replaces the project-wide notes field (not a task)
init                                                        # only if the user explicitly wants a new file
```

`set`/`delete` need the task's `id` (shown by `list`) — never guess it from the title, titles are not unique.

## Cross-checking pinned notes against a shipped release

A recurring use: the user pins a wish/bug note while working, ships a release, then asks "does what I fixed in vX.Y actually cover this note — mark it done." Work like this, not by pattern-matching titles alone:

1. `list --pin` (or `list --pending` for everything still open) to get the candidate set.
2. For each note, read its `detail` too — the real bug report is usually there, not in the short title, and is often the most reliable string to grep the CHANGELOG for.
3. Read the actual CHANGELOG entry (or `git log`) for the release, and where the claim is non-trivial, verify against the code itself (grep the relevant file/function) rather than trusting the changelog prose alone — changelog text can overstate what shipped.
4. If the changelog or code itself flags the fix as unverified/runtime-only/needs-owner-confirmation, **ask the user** whether they've actually confirmed it before marking done — do not mark done on an unverified claim just because the code changed.
5. Only `set <id> --done true` for notes you can point to a specific matching commit/changelog line/code diff for. Leave ambiguous or unmatched ones pinned and tell the user why, rather than silently leaving them out of the report.
6. Summarize what you marked done and why (one line per note, citing the matching change) so the user can sanity-check the batch rather than re-deriving it.

## What this skill does not do

It has no opinion on the app's UI, sync, or release process — it only edits `notes.json`. Never touch other files in `.akidevsync/`, never run git commands on this path (it's meant to stay untracked), and never bulk-delete tasks without the user naming them explicitly.
