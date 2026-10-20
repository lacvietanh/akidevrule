# Agent churn: throwaway files, redundant reruns, command-gate stalls — decision record

## Start time
2026-10-20, after an owner report that agents leave junk files, rerun tests and checks the owner kept having to prompt against, and stall unattended runs on command-gate prompts.

## Initial purpose
Is each symptom produced by the corpus, by the harness, or by the model, and which layer fixes it with the least added machinery? Context: Claude Code on the owner's Mac, a machine-local PreToolUse command gate (outside this repo), rules `agent.B1`/`agent.C5`/`coding.B3` as of 3.8.0 drafting.

## Strategy
Measure from transcripts instead of recalling incidents: scan every Claude Code transcript including subagents for `rm` commands, gate prompts, temp-file creation and verification runs, then classify each count by cause. Read the harness binary for an instruction that could explain the behaviour.

## Checklist
1. ✅ `rm` targets and prompts counted over 516 transcripts.
2. ✅ Temp-file creation counted (Bash and `Write`).
3. ✅ Verification runs classified: repeated with or without an edit in between, after a filtered run, after a subagent, byte-identical.
4. ✅ Claude Code 2.1.304 binary searched for completion-time instructions.
5. ✅ Corpus sites that ordered deletion located (`agent.B1`, previous `agent.C5`).

## Result

### Evidence
516 Claude Code transcripts, subagents included, on the owner's Mac.

| Measure | Count |
|---|---|
| `rm` commands | 528 in 131 transcripts |
| `rm` targets | scratchpad 288 · `/tmp` 97 · relative 97 · other absolute 46 |
| Command-gate prompts | 212: 143 `rm -rf`, 62 git command-position patterns |
| `rm` prompts by form | 4 lone literal temp-path `rm` · 23 compound with a literal temp path · 88 variable assigned in the same command (`S=<scratchpad>/x; rm -rf $S; mkdir -p $S`) |
| Temp-file creation | 1,105 Bash commands; 149 of 704 `Write` calls target the scratchpad; a handful of side copies (`.bak`, `.scratch-*.mjs`, probe dirs) left in project trees |
| Verification runs | 2,522; 507 (20%) repeated the same check type with no edit by any tool in between |
| Of those 507 | 396 (78%) followed a run whose output was filtered; 8 (1%) followed a subagent; 1 byte-identical |

An earlier count of 58% did not count edits made through Bash and was wrong.

### Reading
- The `rm` volume is the corpus's own order: `agent.B1` made the agent remove what it created and the previous `agent.C5` said to delete the session folder, on a scratchpad the harness discards anyway. Most prompts came from the variable form, which a literal-path allowlist cannot match.
- Reruns are a filter effect: the first run's output was thrown away by `grep`/`head`/`tail`, so the only way back was another run. Distrust of a worker explains 1%.

### Harness context
The Claude Code 2.1.304 binary contains a conditionally included instruction: "When a task finishes, put yourself in the user's shoes … run the tests and fix what fails, fix lint and type errors, update affected docs, tie off loose ends you created …". It is not confirmed to reach the owner's sessions, so no `agent.B7` row was added. The owner's "hasty harness" failure is the separate, already-recorded one: models citing "resume directly, act" / "when you have enough information to act, act" to skip steps where no hook enforces them (`agent.B7`).

### Verification
Counts are transcript scans, not controlled runs. The causal reading of reruns (filtered output discarded) rests on the 78% and 1% splits; it is not tested by an intervention yet, which is what the reopen trigger measures.

## Decision
**Action**
1. Subtract the corpus's own deletion mandates and compress `agent.C5` to three bullets (`payload/RULE-agent-behavior.md`).
2. `coding.B3` "one run per change state": keep a long check's output once and grep it (`payload/RULE-coding.md`).
3. The machine-local command gate (outside this repo) now treats an `rm` whose every target resolves under a temp location as no danger: below `/tmp` or `/private/tmp` (inside the harness's own `claude-<uid>` tree only at session-item depth, so one session cannot wipe another's scratchpad), below a `/var/folders/…/T/` temp directory (never the cache tree beside it), or below `$TMPDIR`; a variable assigned literally earlier in the same command is resolved. Everything else — an unresolved variable, a temp root itself, a glob at the root, `..`, `$(…)` — still asks, and the rest of a compound command is still scanned.

**Rejected**
- A deny hook for scratchpad `rm`: a second gate layered on the one that asks; the owner's goal is automation, so the asking gate is relaxed instead.
- A `tee`-rewriting hook for check output: rewrites agent commands, carries parse risk, and the prize is about 0.8 filtered reruns per transcript.
- A hook blocking `.bak` writes: 4 cases, recoverable, and it misses `cp`.
- A per-project memory line restating `agent.C5`/`coding.B3`/`agent.A4`: a second copy that drifts.

**Reopen triggers** — re-run the same transcript measurement about two weeks after 3.8.0 is installed (from 2026-11-03):
- Filtered reruns per transcript have not halved: build the `tee` hook.
- `rm` prompts persist: find the uncovered form.
- `/akiopen` keeps finding untracked side copies in project trees: reconsider a write-time check.

**Cross-references** — `CHANGELOG.md` 3.8.0 `### Changed` (`agent.C5`, `coding.B3` entries), `claude/agents/aki-maker.md` (`C5` gloss).
