# Full-file reads — a rule file counts as read only when it was read whole

Status: executed 2026-10-20 (CHANGELOG 3.8.0). Deviations: F2 widens a partial `Read` instead of denying it, and F4 is deferred (see Outcome). Reopens a residue accepted in `done/resident-context-slim-sep28.md` (Item 4, "A `Read` with `limit` or a `head` fragment counts as read — 'in full' is not enforced"), which carried no reopen trigger; the incident below is the evidence.

## Why

- **Incident, 2026-10-19.** A Sonnet worker briefed to read `RULE-agent-behavior.md` and `skills/akirule/SKILL.md` called `Read` with `limit: 40` and `limit: 30`, read `RULE-docs.md` whole, used no Bash, then opened its reply `[RULES] agent,akirule,docs (brief)`. The receipt named two files it had seen the first fifth of. Traced in its own transcript; not an output filter (no Bash call) and not the MCP server.
- **Rate, measured 2026-10-19 on the Linux dev box** (495 Claude Code transcripts, every `Read` whose target is under `.aki/akidevrule/` or is a `skills/*/SKILL.md`): 1,345 reads, 64 with `limit` or `offset` (4.8%). Subagents 57 of 1,104 (5.2%), main sessions 7 of 241 (2.9%). By file: `RULE-agent-behavior.md` 35, `akiflow/SKILL.md` 7, `akirule/SKILL.md` 6, `RULE-release.md` 6, `RULE-coding.md` 3, `RULE-docs.md` 2, four others 1 each. The Mac's transcripts are not counted yet (P0).
- **A partial read saves nothing worth having.** Every installed rule file fits one plain `Read`: the largest is 268 lines, the longest line 1,366 characters (deployed copies, 2026-10-19), under the tool's 2,000-line default.

## Root causes

| # | Cause | Evidence |
|---|---|---|
| R1 | The harness asks for partial reads. Claude Code's `Read` description: "When you already know which part of the file you need, only read that part. This can be important for larger files." A model that believes it knows a rule file reads its head. `agent.B7` has no row for this instruction. | the tool description as shipped in Claude Code 2.1.303 |
| R2 | The gate counts any read. `aki-route-guard.mjs` `scanTranscript` matches a `Read` by `file_path` alone and a Bash call by `cat\|sed\|head\|bat\|less` + file name, so `limit: 30` or `head -20` marks the file read. `scripts/second_hop_audit.py` counts the same way, so the audit cannot see the gap either. | `claude/hooks/aki-route-guard.mjs` `scanTranscript`; `scripts/second_hop_audit.py:49` |
| R3 | A read-only worker is never checked. The gate fires only on Edit/Write, so a worker that only reads and reports never meets it; its receipt is self-reported (`agent.B2`) and nothing compares it with what it read. The incident took this path. `agent.A5` makes the brief name the rule files, but says neither "whole" nor how the caller could check. | `aki-route-guard.mjs` `main` (Edit-family matcher); `docs/arch/rule-delivery-architecture.md` § gate ("a read-only reviewer never triggers it") |
| R4 | A Bash read of a rule file can come back shortened before the model sees it, if an output-compression hook is installed (observed on the dev box with rtk 0.50.0: listings and long lines elided, with a `recall` marker). The gate counts such a `cat` as a whole read. | session observation 2026-10-19; `../../research/rtk-output-loss-oct19.md` R2: `cat`/`head`/`tail` are byte-identical through rtk 0.50.0, lossy in older versions |

## Changes (proposed)

**F1 · The gate counts only whole reads.** In `scanTranscript`: a `Read` counts when `offset` is absent or ≤ 1 and `limit` is absent or ≥ the file's current line count; `head`, `sed`, `tail` never count; `cat`, `bat`, `less` keep counting until R4 is settled (F5). The deny reason adds one clause when a partial read was the only one found: "a Read with limit/offset does not count — read the whole file". The three-denial fail-open and the compaction reset stay as they are. A denied `Read` (F2) still appears in the transcript as a `tool_use` with `limit`, so F1 also stops it from counting.

**F2 · Partial reads of rule files are refused at the moment they happen.** The same hook gains a `Read` branch (matcher `Read` added by `install.mjs`): a `Read` of `~/.aki/akidevrule/*.md` or `*/skills/*/SKILL.md` that would not count under F1 is denied with "rule files are read whole: retry without limit/offset". Every other `Read` exits before any transcript scan. This is the one change that covers R3, because `PreToolUse` fires inside subagents (the gate already relies on `agent_id`). Fail-open on any error, `AKI_ROUTE_GUARD=0` disables it. One file, one responsibility — enforcing that routed rules are read whole — so it is a branch of `aki-route-guard.mjs`, not a second hook.

**F3 · An `agent.B7` row for the `Read` description.** Draft, for the owner to judge the wording:

````
| "When you already know which part of the file you need, only read that part. This can be important for larger files." (`Read` tool description) | a rule file, a `SKILL.md`, or a file the request says to read in full is read with `limit`/`offset` or `head`, then cited as read | `A5`: a file the request, a brief, a rule or a deny reason says to read in full is read whole, in one call; every rule file fits one `Read` |
````

The row covers what F2 cannot: a file the owner or a brief names "in full" that is not a rule file, and harnesses without the hook. Re-verified against the live tool description before every release (repo `CLAUDE.md` § Release process).

**F4 · `agent.A5`: the brief demands whole reads, and the receipt proves them.** Draft sentence for the "A worker inherits nothing" bullet:

````
Rule files are read whole, and the receipt proves it: after each file named, its line count and its last non-empty line, which the caller checks against the file before trusting the worker's output.
````

Cheap (one line per file) and harness-independent: it covers `agy -p`, Codex and Kiro workers, where no hook runs, and a worker that claims a file it never opened, which F2 cannot see. Mirrored in the receipt format (`skills/akirule/SKILL.md` § Load confirmation, `(brief)` row) and in every `claude/agents/*.md` receipt line.

**F5 · Bash reads stay counted.** `cat` through rtk 0.50.0 is lossless, and `plan/rtk-accuracy-first.md` G1 (shipped 2026-10-19, opt-in) excludes `cat|head|tail` from the rewrite, which makes that independent of rtk's version on a machine that opted in. A machine that declined keeps rtk's version-dependent `cat`, so the gate still counts a Bash read only because 0.50.0 passes it byte-identical; if an older rtk is found lossy on `cat`, the gate stops counting Bash reads of rule files instead (`agent.A2` already says a known file is read with `Read`).

**F6 · The audit sees partial reads.** `scripts/second_hop_audit.py` reports partial reads as their own column and no longer counts them as reads, so the P0 baseline and the post-release figure are comparable.

## Rejected

| Option | Why not |
|---|---|
| Wording only (F3/F4 without F1/F2) | the second hop was already re-worded twice (2026-08-06, 2026-09-25) without moving the read rate; a mechanism moved it (CHANGELOG 3.7.0 gate entry). Text stays for the cases no hook reaches |
| Deny `limit`/`offset` on every `Read` | a partial read of a large code file or log is correct and saves context; only files that must be whole are refused |
| A `SubagentStop` hook comparing the worker's receipt with its transcript | heavier, and its input fields are unverified here; parked behind F2 + F4. Reopen if P5 still finds a receipt naming a file the worker did not read whole |
| Inject rule text at `SessionStart` | dead: each hook string is capped at 10,000 characters (`research/rule-delivery-second-hop-sep29.md`) |

## Steps

- [x] **P0 · baseline (read-only).** Run the partial-read count on the Mac's transcripts (main vs subagent, by model with `second_hop_audit.py --by-model`). Settle V1 and V2.
- [x] **P1 · F1 + F6.** Fixture, kept in the session scratchpad and listed in the CHANGELOG: whole `Read` → allow; `limit` below the line count → deny with the clause; `limit` ≥ line count → allow; `offset: 50` → deny; `head -20` → deny; `cat` → allow (until F5); partial read then compaction then whole read → allow.
- [x] **P2 · F2.** Fixture: `Read` of a rule file with `limit` → deny; the same without → allow; `Read` of a project file with `limit` → allow, no transcript read; a subagent's `Read` with `limit` on a rule file → deny. Measure the added latency per `Read` (V2).
- [x] **P3 · F3 + F4** in `payload/RULE-agent-behavior.md`, with the change sweep from the repo `CLAUDE.md`: `skills/akirule/SKILL.md` (delivery bullet, receipt row), `claude/CLAUDE.md` gate paragraph, `claude/agents/*.md` receipt lines, `skills/akiflow` worker briefs and `references/harness-facts.md` if they name the receipt, `install.mjs` (matcher, printed summary), `README.md` (gate paragraph, install list), `docs/arch/rule-delivery-architecture.md` (gate section, "a read-only reviewer never triggers it"), `docs/arch/corpus-map.md` if a lens row names `A5`/`B7`, `CHANGELOG.md` with the reasoning above.
- [x] **P4 · F5** — G1 shipped opt-in on 2026-10-19, so F5 is decided as written above; nothing to change in the gate unless an older rtk is found lossy on `cat`.
- [x] **P5 · live check** on the dev box after install: one worker briefed with two rule files, then its transcript: no partial `Read` of a rule file succeeded, and the receipt carries line counts and last lines that match.

Sequencing: `plan/done/route-map-json.md` rewrote the same hook file. Whichever lands second rebases onto the other; this plan touches `scanTranscript` and `main`, that one the path map.

## Outcome

| Item | Result |
|---|---|
| F1 | done: `scanTranscript` counts a `Read` only when `offset` ≤ 1 and `limit` is absent or ≥ the file's line count; `cat`/`bat`/`less` in Bash/Shell count, `head`/`sed`/`tail` never; the deny reason adds the whole-file clause when only partial reads were found |
| F2 | done as **widen**, not deny: the hook also runs on matcher `Read` (registered by `install.mjs`) and rewrites a partial `Read` of a rule file (`~/.aki/akidevrule/*.md` or a `SKILL.md` under `~/.claude/skills/`, judged on the resolved path, at most 60,000 bytes) into a whole one through `PreToolUse` `updatedInput` with `permissionDecision: allow`. Why: a deny costs a round trip per partial read and a model may retry partially; widening costs none. Above 60,000 bytes the `Read` tool's ~25k-token cap makes a partial read the only possible one, so it passes |
| F3 | done: the `agent.B7` row for the `Read` tool description |
| F4 | deferred: evidence of partial reads exists only on Claude Code, where F2 now widens them mechanically. Reopen on a partial rule read observed in a worker on a harness without the hook (agy, Codex, Kiro) or a receipt naming a file the worker did not read whole |
| F5 | unchanged: Bash `cat` stays counted |
| F6 | done: `second_hop_audit.py` prints `rule reads: N (partial K, P%)` for main and subagent and no longer counts a partial read as a read |
| P0 | Mac baseline (2026-10-20): main 44 of 1,164 rule reads partial (3.8%), subagents 34 of 440 (7.7%) |
| P5 | live check done on the Mac for F2 (Claude Code 2.1.303, 2026-10-20): a `Read` of `METHOD-proportionality.md` with `limit` 5 returned all 63 lines |

## Open items

| Code | Item | Weight if ignored |
|---|---|---|
| ~~D1~~ | closed: the owner delegated the decision on 2026-10-20; F1–F3, F5, F6 executed, F4 deferred | — |
| ~~V1~~ | moot with F4 deferred. Was: whether a Claude Code subagent receives the global `CLAUDE.md` `@` imports. If it does, a brief that orders `agent` and `akirule` re-read pays twice for files already in the worker's context, and F4 should name only routed files | medium: decides brief wording and worker cost, not correctness |
| ~~V2~~ | answered: about 29 ms per non-rule `Read` (one `node` start), measured. Was: latency a `Read`-matcher hook adds to every `Read` | low: if material, the matcher narrows to rule paths where the harness allows, else F2 drops to F1 + F4 |
| V3 | Answered 2026-10-19: rtk 0.50.0 passes `cat` byte-identical; older versions did not (`../../research/rtk-output-loss-oct19.md` R2); rtk G1 shipped opt-in the same day | low: closed by G1 where it was accepted, by F5's fallback elsewhere |
