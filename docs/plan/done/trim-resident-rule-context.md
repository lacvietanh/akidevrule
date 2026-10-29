# Trim always-resident rule context

> status: done 2026-08-19 · Items 1, 3, 4 in full; Item 2 partial — Project binding + Change policy moved to `README.md`, Cross-cutting lens kept resident: the counter-argument below was accepted, and the same pass added a new lens row (`agent.A3` kill-tests, from `redundant-owner-interrupts.md`), evidence the table is still growing. `payload/index.md` 17,272 → 15,467 chars (lens kept + new row, so less than the projected 10.9k); `CLAUDE.local.md` 3,509 → 2,800; create-only guarantee held through a live `install.sh` run.

Cut ~7.8k characters (~1.9k est. tokens) from what every Claude Code session loads before it reads a single project file, without losing any rule. Four independent items, each reversible.

**Scope.** Items 1 and 2 edit `payload/index.md` in this repo and ship through `install.sh` like any other corpus change. Items 3 and 4 are machine-local settings on the owner's remote dev box (`~/.claude/CLAUDE.local.md`, `~/.claude/settings.json`) and are recorded here only because they were measured in the same pass — they are not part of the distributed corpus and nothing in `payload/`, `skills/`, or `claude/` depends on them.

**Origin.** Findings came from a `/doctor` health check run 2026-08-19 against Claude Code 2.1.235, scanning 250 transcripts across 25 projects (window 2026-08-14 → 2026-08-19). No paired `docs/research/` record was opened — the owner scoped the output to a plan doc only, so the evidence is inlined below instead.

## Baseline — what is resident today

Measured on the owner's machine, per session, in every project:

| Source | chars | est. tokens |
|---|---|---|
| `~/.aki/akidevrule/index.md` | 17,272 | 4,318 |
| `~/.aki/akidevrule/RULE-agent-behavior.md` | 17,033 | 4,258 |
| `~/.aki/akidevrule/RULE-coding.md` | 9,643 | 2,411 |
| `~/.aki/akidevrule/RULE-pattern-core.md` | 7,894 | 1,974 |
| project `CLAUDE.md` (varies; Aki-Dev-Sync measured) | 10,980 | 2,745 |
| `~/.claude/CLAUDE.md` (source half) | 4,229 | 1,057 |
| `~/.claude/CLAUDE.local.md` | 3,509 | 877 |
| skill listing (resident name+description) | ~4,900 | ~1,225 |
| **total** | **~75,460** | **~18,865** |

The four `@`-imported files are 69% of that. `docs/research/core-floor-promotion-aug6.md` already accepted that cost deliberately, and this plan does not reopen it — it removes only text inside the guarantee that is already available elsewhere in the same context.

`index.md` breaks down as:

| Section | chars | share |
|---|---|---|
| File manifest | 9,805 | 57% |
| Cross-cutting lens | 3,726 | 22% |
| Addressing scheme | 2,572 | 15% |
| Precedence | 411 | 2% |
| Project binding + Change policy | 396 | 2% |
| Purpose | 166 | 1% |

## Item 1 — collapse the manifest rows for the three always-loaded RULE files

**File**: `payload/index.md`, § File manifest · **Saving**: ~2,300 chars (~575 est. tokens) · **Confidence**: high — zero information loss.

The manifest summarizes every rule file so the model can decide whether to open it. Three rows describe files whose **full text is already in context on every turn** via the `@` imports in `claude/CLAUDE.md`: `RULE-agent-behavior.md`, `RULE-coding.md`, `RULE-pattern-core.md`. Those rows total **2,500 chars**, of which the `RULE-agent-behavior.md` row alone is **1,752 chars** — 18% of the entire manifest, spent summarizing a 17k-char file that is open beside it.

A summary earns its place by saving a read. These three save nothing, because there is no read to save. This is the same self-compliance bar the repo `CLAUDE.md` states: a section overlaps an existing one only as a pointer, never as restated text.

Replace each row's Purpose cell with a fixed short form, keeping the row so the manifest stays a complete inventory:

```
| `RULE-agent-behavior.md` | `agent` | Core — `@` import in `~/.claude/CLAUDE.md` | public | Core: full text already in context every turn — read it directly, not this summary |
```

Same treatment for the `RULE-coding.md` and `RULE-pattern-core.md` rows. Leave the `index.md` row and every routed (non-core) row untouched — those genuinely gate a `Read`.

## Item 2 — move maintainer-only sections out of the always-loaded file

**Files**: `payload/index.md` → new `docs/ref/cross-cutting-lens.md` and `README.md` · **Saving**: ~4,000 chars (~1,000 est. tokens) · **Confidence**: medium — needs an owner decision, see the counter-argument.

Three sections serve someone **editing this corpus**, not someone working in a project that merely loads it:

| Section | chars | destination | why there |
|---|---|---|---|
| Cross-cutting lens | 3,726 | `docs/ref/cross-cutting-lens.md` | `ref/` is this repo's home for stable lookup docs; the lens is exactly that — an address map consulted while authoring a rule |
| Project binding | 227 | `README.md` | README already documents file conventions and install flow for downstream users |
| Change policy | 169 | `README.md` | same audience: someone about to change the distribution |

Corpus editing happens inside this repo, where `CLAUDE.md` and `README.md` are read anyway and `RULE-docs.md` routes in on any `.md` touch. Paying for these in every unrelated project is paying for a tool at the times it cannot be used.

The Cross-cutting lens carries the strongest case: 4 of its 5 `Root` entries (`pattern.A7`, `coding.B3`, `agent.B5`, `agent.A4`) point into core files that are **already fully loaded**, so what the table still contributes is its *Domain applications* column — a pointer to files `skills/akirule/SKILL.md` already decides on by signal. Its own header says as much: *"This section is an address map only — never rule text."*

**Counter-argument to weigh before doing this.** The lens is what stops a rule from being restated across files, and that duplication is the failure it was added to prevent (`docs/plan/done/naming-rule-consolidation.md` — the run that consolidated naming into one callable address). Moving it out means it is absent at the moment a rule is being *applied* in a project — which is when a model is most likely to restate a rule locally instead of referencing its root. If that risk reads as larger than 1,000 tokens per session, take Item 1 alone and keep the lens resident.

Whichever way it goes, leave a one-line pointer in `index.md`:

```
Corpus-maintenance material: cross-cutting lens → `docs/ref/cross-cutting-lens.md`; project binding and change policy → `README.md`.
```

## Item 3 — dedupe the Reporting section in machine-local memory

**File**: `~/.claude/CLAUDE.local.md`, § "Reporting to the user (ABSOLUTE)" · **Saving**: ~1,030 chars (~257 est. tokens) · **Confidence**: high. Machine-local, not part of the distribution.

Five of its six bullets restate `RULE-agent-behavior.md` A4 near word-for-word. A4 is an `@` import, so it is resident in every project already — the local copy adds no coverage anywhere.

| local bullet | A4 equivalent |
|---|---|
| "Length follows content, no fixed cap. Per-line test: does this carry information the user does not already have?…" | "Length follows content — no fixed cap. Test each line: does it carry information the reader does not already have?…" |
| "Conclusion first, then table or bullets. Prose last." | "Conclusion first, then a short table or bullets; prose last." |
| "Never cite a path, file, symbol or doc bare — always with a few-word gloss…" | "Never cite a file, path, symbol, or doc bare — … Attach a few-word plain-language gloss…" |
| "Natural Vietnamese, not translated English… What happened + what it means first" | "Write natural prose, not translated-sounding text; in Vietnamese, avoid transliterated English sentence structure. Say what happened and what it means for the reader before the mechanism." |
| lead: "reads every reply in a terminal… re-orient in 20 seconds, correctly" | lead: "reads in a terminal; optimize each reply for 're-orient correctly in seconds'" |

Exactly one bullet is unique — the Mac-only-steps-ship-as-a-script rule — plus one machine-specific detail in the lead ("between ~20 parallel projects") worth keeping because it is the concrete *reason* behind A4 on that box. Target shape:

```markdown
## Reporting to the user (ABSOLUTE)

Concrete context for `agent.A4` (do not restate A4 here): the user reads every reply in a terminal, between ~20 parallel projects, cannot open a file, and holds no prior context.

- **Mac-only steps ship as a runnable script, never as prose.** D1 migrations, Tauri/Rust builds, anything needing the Mac → write into `scripts/` (match the convention in that dir + the active plan file), then give the exact command and record it in the plan file and/or a header comment.
```

Safe to hand-edit: `install.py` treats `~/.claude/CLAUDE.local.md` as **create-only** (line 760) and never overwrites it. Contrast with `~/.claude/CLAUDE.md`, which the same installer backs up and overwrites on every run (line 744) — never hand-edit that one.

## Item 4 — set `akihelp` to `name-only`

**File**: `~/.claude/settings.json` → `skillOverrides` · **Saving**: ~445 chars (~111 est. tokens) · **Confidence**: high, low value. Machine-local; the skill itself stays in the distribution untouched.

`akihelp` has 0 lifetime invocations since it was added 2026-07-29 (`skillUsage` in `~/.claude.json` has no entry at all), across 461 startups. It introduces the Aki tooling system — a deliberate, one-off ask, never something that should fire from topic matching.

```json
"skillOverrides": {
  "akirule": "on",
  "akihelp": "name-only"
}
```

The three override states, confirmed from live session context:

| value | in context | `/akihelp` works | auto-fires on topic match |
|---|---|---|---|
| absent (today) | name + description | yes | yes |
| `"name-only"` | name only | yes | no |
| `"off"` | nothing | no | no |

## Sequencing

1. **Items 1 + 2 together** — one edit pass over `payload/index.md`, plus the destination files Item 2 creates. Then `bash install.sh` to propagate to `~/.aki/akidevrule/`. Never edit the deployed copy.
2. **Item 3** — independent; survives step 1's install because `CLAUDE.local.md` is create-only.
3. **Item 4** — independent settings edit.

`install.sh` regenerates `~/.claude/CLAUDE.md` from `claude/CLAUDE.md` plus a machine-path block appended by `install.py:748-758`, and that block re-emits the `@~/.claude/CLAUDE.local.md` import. Item 3 is therefore never at risk from a reinstall.

### Repo obligations Items 1–2 trigger

Required by this repo's `CLAUDE.md`, not optional follow-ups:

- **`CHANGELOG.md`** — mandatory for every change to `payload/`.
- **`README.md` line 87** currently reads *"`index.md` — file manifest, precedence order, project-binding policy."* Item 2 moves project-binding out, so that line goes stale in the same commit that lands the move.
- **`docs/index.md`** — add a row for the new `docs/ref/cross-cutting-lens.md` under the `ref/` table (`docs.A1`).
- No `skills/` change, so the `skills/akihelp/SKILL.md` cross-check does not apply. `skills/akirule/SKILL.md` is unaffected: it already carries its own short addressing-scheme note and points at `index.md` for the full map, and neither item touches routing signals.

## Verify checklist

- [-] `wc -c payload/index.md` — expect ~13.0k after Item 1 alone, ~10.9k after Items 1+2 (from 17,272) — not run as listed; the status line records the measured sizes, and `payload/index.md` was later removed
- [-] Manifest row count in `payload/index.md` is still 36 — Item 1 shortens rows, it must not delete any — not run as listed; the status line records the measured sizes, and `payload/index.md` was later removed
- [-] Every routed file named in `skills/akirule/SKILL.md` still has a manifest row in `payload/index.md` — the router and the manifest must not diverge — not run as listed; the status line records the measured sizes, and `payload/index.md` was later removed
- [-] `bash install.sh`, then `wc -c ~/.aki/akidevrule/index.md` matches the source — propagation actually happened — not run as listed; the status line records the measured sizes, and `payload/index.md` was later removed
- [-] `wc -c ~/.claude/CLAUDE.local.md` — expect ~2.5k after Item 3 (from 3,509) — not run as listed; the status line records the measured sizes, and `payload/index.md` was later removed
- [-] Open a new session in an unrelated project: the `[RULES]` receipt still reports `agent,coding,pattern (core)` and `missing: none` — not run as listed; the status line records the measured sizes, and `payload/index.md` was later removed
- [-] `/akihelp` still dispatches after Item 4 (name-only keeps it invocable; only auto-matching is dropped) — not run as listed; the status line records the measured sizes, and `payload/index.md` was later removed
- [-] Re-run `bash install.sh` once more and confirm `~/.claude/CLAUDE.local.md` is unchanged — the create-only guarantee holds in practice, not just in the source — not run as listed; the status line records the measured sizes, and `payload/index.md` was later removed

Runtime-only, cannot be settled statically: whether dropping the Cross-cutting lens (Item 2) measurably increases rule restatement in practice. If Item 2 ships, watch for it over the following weeks rather than treating the item as closed on a character count.

## Considered and rejected

Recorded so the next audit does not re-litigate them.

| Candidate | Verdict | Why |
|---|---|---|
| "Contradiction: machine-local memory bans `git push`, project `CLAUDE.md` and `akiship` require it" | **Not a contradiction** | `~/.claude/CLAUDE.local.md` is scoped to the owner's remote dev box; the push/tag/release steps run on the Mac. Two machines, one coherent policy. `/akiship` stopping at the commit step on that box is the design working. |
| Deduplicate the "akidevrule — edit source (ABSOLUTE)" block in `~/.claude/CLAUDE.md` | **No action** | Not hand-written — generated by `install.py:748-758`, and it hardcodes the machine's absolute paths, which the generic `claude/CLAUDE.md` cannot. 430 chars is the price of that concreteness; editing the deployed file would be overwritten on the next install anyway. |
| `akilint` → `name-only` | **No action** | Its description *is* the trigger mechanism — it enumerates the phrasings the owner actually types (`wrapline`, `bẻ dòng`, `comment lảm nhảm`, the penalty cards). Dropping it removes the way the skill is used. Separately verified: `skills/akiflow/SKILL.md` has no reference to the `akilint` skill (it invokes `scythe.py` directly via the `aki-conduct` agent), so the two are not coupled. |
| `aki-article-writer` → `name-only` at user scope | **No action** | Already `name-only` in one project's `.claude/settings.local.json`, which is project- and machine-scoped. Other machines are unaffected and the owner uses it there. |
| `akiship` → disable (0 lifetime uses) | **No action** | Added 2026-08-17; two days is not a usage window. Re-evaluate after a release cycle. |
| Disable unused MCP servers / plugins | **Nothing to do** | No MCP servers configured at any scope. All three installed plugins (`frontend-design`, `rust-analyzer-lsp`, `cloudflare`) are already disabled — zero resident cost. |
| Install repair, version update, auto-mode default, hook tuning, permission allow-rules | **Clean** | Native install at `~/.local/bin/claude`, no npm leftovers, `installMethod` matches, all settings files parse. 2.1.235 = latest on channel `latest`. `permissions.defaultMode` already `auto` with no project override. One `SessionStart` hook (`aki-update-check.py`, deployed from `claude/hooks/`) with a 3s network timeout and its own throttle file — healthy. Only 4 tool denials across 250 sessions, no repeating pattern, so no allow-rule is justified. |

**Separate observation, no action proposed.** The owner's `~/.claude/settings.json` carries 35 `permissions.allow` rules, several of which are arbitrary-code-execution wildcards despite reading as narrow: `Bash(node *)`, `Bash(python3 *)`, `Bash(curl *)` (can POST and exfiltrate), `Bash(npm run *)`, `Bash(gh api *)` (matches POST/DELETE and GraphQL mutations, not just GET). Presumed deliberate; flagged only so the breadth is a known quantity rather than an assumed one. Note these are the owner's own rules, not the ones `install.py` merges in.

## Cross-references

- `payload/index.md` — the corpus manifest; Items 1 and 2's target
- `skills/akirule/SKILL.md` — the signal router; states why the corpus is split into a guaranteed `@`-import layer and a best-effort routed layer
- `docs/research/core-floor-promotion-aug6.md` — where the always-resident cost of the four core files was accepted, and the falsifier it was accepted against
- `install.py` — lines 744 (`~/.claude/CLAUDE.md` overwrite), 748-758 (generated machine-path block), 760 (`CLAUDE.local.md` create-only)
