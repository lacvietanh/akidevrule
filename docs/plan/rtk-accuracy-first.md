# rtk, accuracy first — offer it, but never let it drop evidence

Status: executed 2026-10-19 (P1–P3), every V item closed the same day against rtk 1.0.1; P4 is a dated follow-up on the dev box. Evidence: `../research/rtk-output-loss-oct19.md`.

## Principle

An output filter may drop noise; it never drops content an agent counts, quotes, diffs or uses to claim absence. rtk has no lossless mode (R3), so the only lossless control for its built-in filters is to stop the hook rewriting those commands. What stays compressed is the noise class: `git status/add/commit/push/pull/fetch`, package installs, build logs. Large output is already handled losslessly by Claude Code itself (saved to a file past ~30,000 characters, research R7).

## Changes

**G1 · The installer offers the config, opt-in.** D1 ruling (2026-10-19): the installer asks, in a terminal only, with the default and the non-interactive answer being "leave rtk alone"; `--rtk` says yes without a prompt; the summary always carries one rtk line so a human or an agent reading a non-interactive run still learns the option exists. Detection: `rtk` on `PATH`, resolved by running `rtk config`, whose first line prints the config path (V1: `~/.config/rtk/config.toml` on Linux, `~/Library/Application Support/rtk/config.toml` on macOS, `%APPDATA%\rtk\config.toml` on Windows — V6, by rtk's `user_dirs.rs`). Never installs rtk, never removes its hook, never touches `filters.toml` (its trust is cancelled silently by any edit, research R1).

Managed content, the `[hooks]` table only:

````toml
# akidevrule: accuracy-first rtk — commands whose output is evidence run unfiltered (akidevrule README § Optional: rtk)
[hooks]
exclude_commands = [
  "ls", "tree", "find", "grep", "rg", "ast-grep", "wc", "diff",
  "cat", "head", "tail",
  "jq", "stat", "du", "df", "ps", "ssh", "rsync", "curl", "wget",
  "gh", "glab", "psql", "aws", "kubectl", "oc", "docker",
  "^git(\\s+-[Cc]\\s+\\S+)*\\s+(diff|log|show|stash|branch)\\b",
]
````

Merge policy, smallest safe change: file absent → write it; no `[hooks]` table → append it; `[hooks]` without `exclude_commands` → insert the key inside that table; the user's own `exclude_commands` → leave it and print the entries still missing. Backup before any write, same convention as `settings.json`, dropped when the run succeeds. Idempotent: a re-run changes nothing. Opt-out: a line `# akidevrule: rtk off` in the file makes the installer skip it, `--rtk` included.

Why each part: the exclude list was tested through the real hook JSON, including `cd … &&` chains, pipes, `timeout` wrappers and `git -C <dir> diff`; `git status`/`commit`/`push`, `npm run`, `npx tsc`, `pytest`, `make` were still rewritten (research R3). `cat|head|tail` are lossless in 0.50.0, excluded anyway because that holds by version, not by contract, and excluding them costs nothing. `gh` … `docker` are rtk filter commands with fixed caps (V3, closed by source). The `[retriever]` table from the first draft (sqlite, 2,000 entries, 30 days — R4) is not written: the Mac runs rtk 0.47.0 from Homebrew with a `tee/` directory and no sqlite store, so the table would be a key an older rtk never reads; it stays a README line for 0.50+.

**G2 · One verification line for what stays compressed**, landed in `coding.B3` "What counts":

````
- **Output carrying a filter's elision marker (`omitted`, `hidden`, `truncated`, `filtered`, `capped`, `recall`) is a sample, never the result:** a count, a quote, a failure list or an absence claim taken from it is rerun raw first (rtk: `RTK_DISABLED=1 <cmd>`) — a compressor's "saved" bytes are the lines it dropped, and the sample does not say which.
````

Needed because test runners stay compressed and cap their failure list at 10–20 (research R2), and agents ignore markers (480 elisions, 3 recalls, R4). Text alone would not fix the evidence-bearing commands — that is G1's job; this line covers only the residue.

**G3 · The offer.** `README.md` § Optional: rtk: what rtk saves, what it drops (one line per family, research R2), the answer table, the managed TOML, how to opt out, the native ~30,000-character offload, the `[retriever]` line for 0.50+. Install step 7 names the prompt; the uninstall block names the table to remove.

## Rejected

| Option | Why not |
|---|---|
| Write the config on every install that has rtk (first draft) | a third-party shared config and the repo's Non-goals on personal settings; the owner's ruling is ask, default no |
| Recommend against rtk | the noise class saves real context and costs no evidence; the owner wants it offered |
| Lossless `filters.toml` overrides | reach only TOML commands (not `ls`/`grep`/`find`/`git`), and any later edit silently restores the lossy built-in |
| `RTK_RECALL=0` | TOML filters fall back to raw, but Rust filters keep cutting without a hash |
| Rule text only | 480 elisions, 3 recalls: markers are not followed; a rule cannot un-drop a line the model never saw |
| Wait for upstream lossless mode (#1313) | open since 2026-04-14 with no maintainer answer. Reopen trigger: a release with a lossless mode → switch G1 to it |
| Install rtk from the installer | a package manager is a Non-goal; rtk's own installer owns that |
| Detect rtk by the hook line in `settings.json` as well | a hook whose binary is off `PATH` is already broken, and without the binary the config path cannot be resolved |

## Steps

- [x] **P1 · G1 in `install.mjs`** (2026-10-19). Sandbox-`HOME` fixture with a fake `rtk` on `PATH`: no rtk → hint line, no file; rtk without `--rtk` (no TTY) → untouched; `--rtk` → written; re-run → byte-identical, no backup left; other table only → appended; `[hooks]` without the key → inserted inside the table; user's own list → kept, missing names printed; opt-out line → skipped. Then real rtk 0.50.0 reading the generated file via `XDG_CONFIG_HOME` through the hook JSON: `ls -la`, `grep -rn`, `git -C … diff`, `jq -c`, `cd … && ls | head` pass raw; `git status` still rewritten. The same cases run in `.github/workflows/install-smoke.yml` on ubuntu, macos and windows.
- [x] **P2 · G2** in `payload/RULE-coding.md` (2026-10-19), with the change sweep: `docs/arch/corpus-map.md` "what a passing check proves" lens, `README.md`, `CHANGELOG.md`.
- [x] **P3 · G3** README section, install step, uninstall line, installer summary lines (2026-10-19).
- [ ] **P4 · validate the offer** on the dev box from 2026-11-02: `rtk gain` by command against the 2026-10-19 baseline taken right after the upgrade to 1.0.1 — lifetime 901.6K tokens "saved" (29.5%), 8,263 commands; 1.0.0 changed the accounting (oversized outputs no longer count toward the headline rate), so the pre-upgrade 2.7M / 50.9% figure is not comparable. If what remains saved is negligible next to the native offload, downgrade the README from "optional, offered" to "optional, not needed". Record in an `## Amendments` entry of the research doc. Reminder lives in the dev box's `~/.claude/CLAUDE.local.md`.

## rtk 1.0.1 — what changed since the research (read 2026-10-19)

Releases after 0.50.0: 0.51.0, 0.52.0, 1.0.0 (2026-10-13), 1.0.1 (2026-10-14, Homebrew 1.0.1). Relevant to this plan, from the tagged CHANGELOG, `src/core/config.rs`, `src/core/truncate.rs`, `src/core/user_dirs.rs` and `src/core/README.md` at `v1.0.1`:

- **Still no lossless mode.** `Config` has no `lossless`/`raw`/`verbatim` field; `[limits]` holds only `grep_max_results`, `grep_max_per_file`, `status_max_files`, `status_max_untracked`, `passthrough_max_chars`. The filter caps (`CAP_ERRORS` 20, `CAP_WARNINGS` 10 for test failures, `CAP_LIST` 20, `CAP_INVENTORY` 50) are constants, "planned, not yet implemented" as config. #1313's author wrote on 2026-09-22 that the team "moved on"; no maintainer design reply. So G1's exclusion stays the only lossless control.
- **`exclude_commands` is honoured on every version in play**: present since 0.37.2; 0.47.0's changelog "hooks: honour exclude_commands for head and tail" and "keep exclude_commands honoured under routable wrappers"; the 14-command hook test of 2026-10-19 (REPORT.html) ran identically on the Mac's 0.47.0 and the dev box's 0.50.0; the dev box re-test on 1.0.1 passes the same set.
- **Quoted wrappers are now rewritten inside** (0.52.0: `sh/bash/zsh -c '…'`, `fish -c`): `bash -c 'git status'` is rewritten on 1.0.1 (raw on 0.50.0), `sh -c 'ls -la'` stays raw because the exclusion matches per segment. No change needed.
- **`RTK_DISABLED=1 <cmd>`** is honoured on 0.50.0 and 1.0.1 (0.52.0 fixed a path where it was not), so the `coding.B3` bullet's rerun form holds; `rtk proxy` became `rtk bypass` (alias kept).
- **Unknown config tables are ignored** (no `deny_unknown_fields`), so a `[retriever]` table on an older rtk is harmless, just inert; the installer still writes `[hooks]` only (`pattern.A2`: one table with a proven reason).
- **Config path by source**: `dirs::config_dir()/rtk/config.toml` — `$XDG_CONFIG_HOME` or `~/.config` on Linux, `~/Library/Application Support` on macOS, RoamingAppData on Windows (`%APPDATA%\rtk\config.toml`); no env override exists. `rtk config` prints it first, on 0.50.0 and 1.0.1.
- **#3262 (rewrite inside quoted string literals, `priority:critical`) is still open** at 1.0.1; fix PR #3462 is open, unmerged. The exclusions lower exposure for the listed commands only; nothing in config prevents it elsewhere.
- **Licence**: the default `rtk` binary is Apache-2.0 CLI plus a BUSL-1.1 compression engine ("production use is free"; reselling as a service is not); `rtk-oss` is Apache-only and ships without the engine. No effect on this plan; the README names it in one clause.
- **`rtk gain`** excludes oversized outputs from its headline rate since 1.0.0 (P4 baseline above). The dev box was upgraded 0.50.0 → 1.0.1 on 2026-10-19 with the pinned installer (`RTK_VERSION=v1.0.1 install.sh`; rollback is the same command with `v0.50.0`).

## Open items

| Code | Item | Weight if ignored |
|---|---|---|
| ~~D1~~ | Closed 2026-10-19: ask in a terminal, default no, `--rtk` for a silent yes, one summary line always | — |
| ~~V1~~ | Closed 2026-10-19: macOS keeps the config under `~/Library/Application Support/rtk/` (seen on the Mac, rtk 0.47.0); `rtk config` prints the path on its first line, which the installer reads | — |
| ~~V2~~ | Closed 2026-10-19 by source at `v1.0.1`: test failures capped at `CAP_WARNINGS` 10, errors at 20, not configurable; runners stay compressed (their passing output is the noise class) and G2 covers the capped failure list | — |
| ~~V3~~ | Closed 2026-10-19 by source: `gh`, `glab`, `psql`, `aws`, `kubectl`, `oc`, `docker` are real rtk filters bound to `CAP_LIST` 20 / `CAP_INVENTORY` 50, so their exclusion is grounded, not precautionary | — |
| ~~V4~~ | Closed as a known upstream risk 2026-10-19: #3262 open at 1.0.1, fix unmerged; no config knob. Reopen trigger: a quoted argument observed rewritten → report upstream and add the command to the exclusions | — |
| ~~V5~~ | Closed 2026-10-19: 0.47.0 honours `exclude_commands` (changelog, and the Mac ran the same hook test); the Mac was upgraded to 1.0.1 on 2026-10-20 and the hook test re-run with the same result | — |
| ~~V6~~ | Closed 2026-10-19 by source (`user_dirs.rs`): Windows is RoamingAppData, the installer's fallback | — |
