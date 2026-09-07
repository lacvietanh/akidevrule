# Audit fixes on the post-2.7.0 unreleased batch

Executed 2026-09-08. Read-only rule audit of the working tree vs 2.7.0, then the fixes below; no version minted, no git mutation.

| # | Finding | Fix |
|---|---|---|
| 1 | CHANGELOG claimed "five other call sites already branch on `os.name`"; the file had three, two of them new in the same batch | Bullet reworded to the true count |
| 2 | `inspect_status()` skipped the overwrite prompt when installed == remote, but the overwrite source is the checkout, which on a dev machine carries `[Unreleased]` work | Skip only when `.version` `commit=` == HEAD and `git status --porcelain` is empty (`git_tree_clean`, `installed_commit`) |
| 3 | SessionStart hook registered as literal `python3`; Windows has `py -3` (same bug class as the propagate-command fix) | Platform split at registration; reinstall replaces the old entry |
| 4 | A `docs/ref` file is installed, but repo `CLAUDE.md` still said only `payload/` is installed, and the payload prune never enters `docs/` | `CLAUDE.md` names the one exception; installer recreates `~/.aki/akidevrule/docs/` each run |
| 5 | `stack.C8` execution-ownership named `db.pull` without defining it (present in 4 of 9 local projects) and skipped `coding.B5` rung 5 (tool present + authenticated) | `db.pull` added to `stack.C7`; `wrangler whoami` precondition added to C8 |
| 6 | `release.C3` required a `releases.json` line per `Removed` section but offered no type for it; carried a "standing guidance through 2026-09" sentence (task history in a durable file) | `Removed` → `improved`/`internal` mapping; sentence cut |
| 7 | `agents-md-standard.md` table header 3 columns vs 4-cell rows; `stack.A2` "A 200 specified to return" | Header gains `Source`; wording fixed |

Verified: `py_compile` on `install.py` and both hooks; scratchpad harness asserting `inspect_status()` returns True only for same-commit + clean tree; `install.py --check` runs (`unknown`, no network here); scythe on touched files; `bash install.sh` propagated and `~/.claude/settings.json` holds one hook entry. Not verifiable here: the Windows `py -3` hook launch (rung 3, README's documented Windows launcher).

Open, owner's notes not addressed by this batch: `.akidevsync/notes.json` items on Cursor preallowlist, research-doc mutability, model tiers per CLI, and `/akiship` sweeping UNIDOC + notes + plans + README.
