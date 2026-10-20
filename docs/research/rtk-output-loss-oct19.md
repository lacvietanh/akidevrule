# rtk output loss — what it drops, how the world treats it, and an accuracy-first setup

Status: amended 2026-10-20

## Start time

2026-10-19, Linux dev box, rtk 0.50.0 installed as Claude Code's `PreToolUse` Bash hook (`rtk hook claude`).

## Initial purpose

In one session rtk elided Bash output the agent was reading as evidence: `ls` of two directories merged them and printed `(2 filtered)` / `[+2 hidden: rtk recall …]`; a `jq -c` output had every line cut to 120 characters with `[full output: rtk recall …]`. The owner's standing priority is accuracy over savings. Questions: what rtk drops and why; whether upstream and its users accept the loss; whether rtk can be configured lossless for evidence-bearing commands; what this corpus should do (installer setting, rule, or both). The corpus does not mention rtk anywhere before this doc.

## Strategy

Source reading of tag v0.50.0 (commit 1d87b8e7), raw-vs-filtered runs in a sandbox config and data dir (stdout captured, not a TTY — the shape of Claude Code's Bash tool), the real hook JSON path through `rtk hook claude`, upstream issues and docs, Hacker News via the Algolia API. Read-only towards the live config; a worker retrieved, the caller judged.

## Checklist

1. Map the hook's rewrite rules and the two filter engines (built-in Rust, TOML).
2. Reproduce both observed elisions raw vs filtered and name the filter.
3. Enumerate every knob; test the ones that could make output lossless.
4. Read upstream issues, maintainer statements, savings methodology, user threads.
5. Classify command families by whether their output is used as evidence.

## Result

**R1 · Two filter engines, different escape routes** (source `src/discover/rules.rs`, `src/core/toml_filter.rs:16-24, 259-311, 579-715`). Built-in Rust filters (`ls`, `grep`, `rg`, `find`, `tree`, `wc`, `diff`, `git`, `curl`, `cat|head|tail` → `rtk read`) run before any TOML lookup, so no `filters.toml` can change them. TOML filters (`jq`, `stat`, `du`, `df`, `ps`, `ssh`, …) can be overridden by a project or global `filters.toml`, which loads only after `rtk trust` — and any edit silently cancels trust, restoring the lossy built-in with no warning.

**R2 · What is dropped (tested raw vs filtered unless marked).**

| Command | Loss |
|---|---|
| `ls` | always reformatted from `ls -l`; noise dirs hidden (`node_modules`, `dist`, `build`, `coverage`, …); ≤ 50 entries; multi-dir headers lost (observed case: which file is in which dir is unrecoverable, recall holds only the two header lines); owner/group/date lost from `-la`; **names ending in `.` dropped with no marker** (`ls.rs:226-228`, still on `develop` 2026-10-19) |
| `grep` / `rg` | lines cut at 80 chars, ≤ 200 results, 25 per file, indentation stripped, regrouped by file; from a pipe the overflow is dropped with no recall (#4107 open). `-rn` test: 211 of 480 lines |
| `find` | dotfiles and gitignored paths hidden; the hidden path was not recoverable from recall in the test |
| `git log` | 10 commits without `-n` (50 with `--oneline`), no "more" marker; bodies cut to 3 lines |
| `git diff` | 100 changed lines per hunk, 500 total, most context dropped; marker `[full diff: rtk git diff --no-compact]`. Test: 7,541 → 610 lines |
| `jq` (TOML) | `truncate_lines_at = 120`, `max_lines = 40` (built-in `src/filters/jq.toml`) — the observed case |
| `ps`, `ssh` (TOML) | 30 / 200 lines, 120 chars — a remote `cat` over `ssh` is cut |
| test and build runners | listed failures capped at 10 (tests) / 20 (errors), fixed in code (`core/truncate.rs`) — read, not run |
| filtered commands generally | stdout captured, stderr passed through: order changes (`make` errors printed before build lines) |
| lossless in 0.50.0 | `cat`, `head -N`, `tail -n N` byte-identical (900 lines, 57,379 bytes; `rtk read` defaults to `--level none`); `git status` kept all 45 entries; `--stat` forms, `grep -c`/`-l`, `curl` JSON to a non-TTY identical |

**R3 · Knobs.** `[hooks] exclude_commands` in rtk's `config.toml` stops the rewrite for matching commands (plain word → `^word($|\s)`, `^…` → regex), matched per segment inside `&&` chains, pipes and `timeout` wrappers, no trust step — tested through the hook JSON. `RTK_DISABLED=1 <cmd>` and `rtk run '<cmd>'` give raw output for one call. `RTK_RECALL=0` / `[retriever] mode = "disabled"` makes TOML filters fall back to raw but leaves Rust filters cutting with no hash — worse. `[limits] grep_*` does not make grep lossless (CLI default `--max 200` still applies). There is **no** rewrite allowlist and **no** lossless mode (requested in #1313, open since 2026-04-14).

**R4 · Recall is not used.** The store (`~/.local/share/rtk/recall.db`) defaults to 200 entries; on this box it was full, spanning 2026-10-07..19. Lifetime counters: 480 elisions, 3 recalls — all 3 made during this research. Agents do not follow the markers.

**R5 · How upstream and users treat it.** Maintainers: `RTK_DISABLED` is "the master 'filter off'" (#2176, 2026-05-31); diff truncation answered with markers plus `--no-compact`, not removal (#3022, closed 2026-09-13); policy "Any truncated list has a recovery hint" (CONTRIBUTING.md:276); configurable caps "planned, not yet implemented" (`src/core/README.md:154`). #1313 ("lossless-only mode", 18 comments) has only an automated triage label from the maintainer side; its reporter, 2026-09-05: "I stopped using RTK because of this… We asked everyone in our company to cease using it." HN 47081527 (2026-03-03): problems arise "when I need an output to debug/troubleshoot something and it's suppressed by RTK". The trade-off is accepted upstream, softened by markers, not configurable.

**R6 · Savings are measured as bytes dropped.** README "up to 90%"; tokens = bytes/4 of raw minus filtered (`docs/guide/resources/savings-explained.md`), so dropped content counts as saving and the cost of a re-run or a wrong conclusion is not counted. A `head -n N` read is booked against the whole file size (`read.rs`), a phantom saving. This box: 2.6M tokens "saved" (50.4%), largest `rtk read` 1.6M, `rtk grep` 516K, `rtk find` 66K, then `rtk ls` — the evidence-bearing families.

**R7 · The harness already has a lossless limit.** Claude Code saves a successful Bash output over ~30,000 characters to a file in the session folder and gives the model the path plus a 2,000-character preview; `BASH_MAX_OUTPUT_LENGTH` sets the limit (max 150,000). A failed command gets only a ~10,000-character head-and-tail excerpt. Claude Code's own `Read`/`Grep`/`Glob` never pass through rtk.

### Verification

R1–R4 and the tested rows of R2 verified by source lines and sandbox runs (raw via `rtk run`, filtered via the hook). Not run: test-runner caps (cargo banned on this box; pytest/vitest unused), `gh`/`glab`/`psql`/`aws`/`kubectl`/`docker` filters, the quoted-string rewrite bug #3262 (not reproduced by simple probes), macOS config path. R5 read 2026-10-19. R7 from vendor docs, not measured here.

### Corroborating links

- https://github.com/rtk-ai/rtk/issues/1313 · #2176 · #3022 · #4107 · #3262 · #2436 · #2579 (`status_max_*` not wired)
- https://github.com/rtk-ai/rtk/blob/v0.50.0/CONTRIBUTING.md · `docs/guide/resources/savings-explained.md`
- https://news.ycombinator.com/item?id=46974740 · https://news.ycombinator.com/item?id=47081527
- https://code.claude.com/docs/en/tools-reference ("Output limits")

## Decision

Accuracy-first, not abandonment. rtk violates "accuracy over savings" for every command family whose output is counted, quoted, diffed or used to claim absence, and upstream offers no lossless mode. The safe remainder (`git status/add/commit/push/pull`, package installs, build logs) still saves real noise. So: exclude the evidence-bearing families from the rewrite (R3, the only lossless knob for Rust filters), keep recall on with a larger store, never touch `filters.toml`, and add one verification line for the families that stay compressed.

- **Action:** `../plan/rtk-accuracy-first.md` — executed 2026-10-19 as an opt-in installer step (`install.mjs --rtk` or a terminal prompt), `coding.B3` one bullet, `README.md` § Optional: rtk.
- **Cross-references:** `../plan/done/full-file-reads.md` (R4, V3: a `cat` of a rule file is lossless in 0.50.0, and the exclusion makes it independent of rtk's version).

## Amendments

- 2026-10-19 · § Verification "macOS config path" not run: verified on the owner's Mac — rtk 0.47.0 (Homebrew) keeps `config.toml`, `filters.toml`, `history.db` and a `tee/` directory under `~/Library/Application Support/rtk/`, and `~/.config/rtk/` does not exist there. `rtk config` prints `Config: <path>` as its first line on 0.50.0, which the installer reads instead of guessing per OS.
- 2026-10-19 · § R4: the sqlite recall store is a 0.50.0 feature; the Mac's 0.47.0 has the `tee/` file mode only, so the `[retriever]` table in the Decision's "larger store" is not part of the installer's managed content (README line for 0.50+ instead). The Decision stands.
- 2026-10-19 · § R3, the hook test on 0.47.0: `exclude_commands` is honoured there — present since 0.37.2, 0.47.0's changelog names it ("honour exclude_commands for head and tail", "keep exclude_commands honoured under routable wrappers"), and the same 14-command hook test ran on the Mac's 0.47.0 with results identical to the dev box.
- 2026-10-19 · § R3, R5 re-read against rtk 1.0.1 (released 2026-10-14; 0.51.0, 0.52.0, 1.0.0 in between): still no lossless mode — `Config` at `v1.0.1` has no such field and `[limits]` holds only `grep_max_results`, `grep_max_per_file`, `status_max_files`, `status_max_untracked`, `passthrough_max_chars`; filter caps remain constants (`CAP_ERRORS` 20, `CAP_WARNINGS` 10 for test failures, `CAP_LIST` 20, `CAP_INVENTORY` 50; "planned, not yet implemented" as config in `src/core/README.md`). 0.52.0 rewrites inside quoted `sh/bash/zsh -c` wrappers (the exclusion still matches per segment: `sh -c 'ls -la'` raw, `bash -c 'git status'` rewritten on 1.0.1) and fixed a path where `RTK_DISABLED=1` was not honoured. 1.0.0 renamed `rtk proxy` to `rtk bypass` (alias kept), removed `--ultra-compact`, made `rtk gain` exclude oversized outputs from its headline rate, and split licences (default binary Apache-2.0 CLI + BUSL-1.1 engine, `rtk-oss` Apache-only without the engine). #1313: the reporter wrote on 2026-09-22 that the team "moved on"; no maintainer design reply. #3262 (quoted-literal rewrite, `priority:critical`): open, fix PR #3462 unmerged. Unknown config tables are ignored (no `deny_unknown_fields`).
- 2026-10-19 · § R2, R4, test-runner caps and `gh`/`docker` filters "read, not run": confirmed from `src/core/truncate.rs` at `v1.0.1` — test failures bind `CAP_WARNINGS` 10, errors 20, flat lists (PRs, services, packages) 20, inventories (`pip list`, `docker images`) 50; `gh`, `glab`, `psql`, `aws`, `kubectl`, `oc`, `docker` are rtk filter commands, so excluding them is grounded.
- 2026-10-19 · § Verification, config path: `src/core/user_dirs.rs` at `v1.0.1` resolves it as `dirs::config_dir()/rtk` — `$XDG_CONFIG_HOME` or `~/.config` on Linux, `~/Library/Application Support` on macOS, RoamingAppData on Windows — with no env override. The dev box was upgraded 0.50.0 → 1.0.1 the same day; the exclusions held unchanged, and `rtk gain` now reports 901.6K tokens saved (29.5%) lifetime under the new accounting, versus 2.7M (50.9%) before — the two are not comparable.
- 2026-10-20 · § R3, Mac version: the Mac was upgraded 0.47.0 → 1.0.1 (Homebrew); its existing `[hooks] exclude_commands` held — through `rtk hook claude`, `ls -la`, `grep -rn`, `git -C <dir> diff`, `jq -c`, `cd … && ls | head` and `cat` pass raw, `git status` is still rewritten.
