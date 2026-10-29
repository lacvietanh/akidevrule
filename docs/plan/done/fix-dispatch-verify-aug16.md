# Plan (executed) — fix the dispatch/verify defects found by the 2026-08-16 working-tree audit

**Status:** done · executed 2026-08-16, same session that wrote this plan's baseline was resumed to fix it · baseline: uncommitted `[Unreleased]` working tree on top of `94f5760` (2.2.1) — the change set that added dispatch mode, the provenance stamp, `--grep`/`--turn`, and the `council_cost.py` rewrite.

**Where the findings come from:** a live audit in the session that wrote this plan. P1 and P2 were confirmed by actually opening a dispatch room in a scratch `AKI_COUNCIL_ROOT` and running the gates against it (dispatch had never been run for real — `docs/research/akiflow-cost-and-shape-aug15.md` § Checklist records that as an explicit not-done). P3 is a cross-file grep. P4–P5 are static reading. Repro commands are inline per finding so the fixing session re-derives instead of trusting this file.

**Ground rules for the fixing session:** read `docs/arch/akiflow.md` (design record — especially § "The gate had only one answer for no") and `skills/akiflow/SKILL.md` Step 1b before touching anything. Every fix lands in this source repo, then `bash install.sh` propagates; never edit `~/.claude/skills/` or `~/.aki/akidevrule/` directly. Each fix gets a `CHANGELOG.md` `[Unreleased]` entry. All scripts must stay stdlib-only and standalone (no imports between council scripts).

## P1 — dispatch room that follows SKILL.md exactly FAILs the closure gate (HIGH)

**Defect.** `SKILL.md` Step 1b instructs a write-capable lane to put its report in `<lane>.md` and claims "either satisfies `council_verify.py`". It does not: `get_declared()` (`skills/akiflow/scripts/council_verify.py`) takes the seat name from the `worker:` field value (an agent type, e.g. `aki-maker`), while the evidence file carries the **lane** name (e.g. `scripts.md`) — so ghost-seats reports the worker as having left no trace. Second half of the same defect: two lanes declaring the same worker type collapse into one declared name, so one turn or one file satisfies ghost-seats/receipts/evidence-tags for **both** lanes — per-lane tracing is structurally lost.

**Confirmed repro** (scratch root, harmless):
```bash
export AKI_COUNCIL_ROOT=$(mktemp -d)
python3 skills/akiflow/scripts/council_open.py --dispatch t "sửa script A và cập nhật docs B"
# fill checklist.md with two lanes (covers/worker/writes/reads/returns), worker: aki-maker (sonnet) on both, write [RULES]+FACT lines into scripts.md and docs.md (the lane names), no chat turns, then:
python3 skills/akiflow/scripts/council_verify.py "$AKI_COUNCIL_ROOT"/akidevrule/*-t
# observed: FAIL ghost-seats: declared but left no turn and no file: aki-maker — then rename scripts.md → aki-maker.md and delete docs.md: 7 PASS, one file covered both lanes
```

**Fix — trace dispatch by lane name, not worker type.** The lane is the unit of dispatch; the worker is a substrate detail. Concretely:
1. `council_verify.py`: add a mode reader — parse line 2 of `chat.md` for `` mode <word> `` exactly as `council_open.py::read_mode()` does (duplicate the ~6-line parser; the scripts are deliberately standalone). No match → `council`, never a crash.
2. In dispatch mode, `get_declared()` returns **lane names** instead of `owner|challenger|worker` values: capture `^#{0,6}[ \t]*LANE[ \t]+\S` headings and slugify the short name after the `·` (lowercase, spaces→dashes) so it can match a `<lane>.md` stem and a `### <HH:MM> <lane> #<n>` turn header. Keep the existing council path untouched.
3. `SKILL.md` Step 1b: state the contract explicitly — the trace name for a lane IS the lane's short name: its report file is `<lane>.md` and/or its turn posts under the lane name; `worker:` stays required but is roster/cost metadata, never the trace identity.
4. `docs/arch/akiflow.md` § dispatch: one sentence correcting "a lane's `worker` is a declared seat exactly as a council's `owner` is" to the lane-name contract.

**Rejected alternatives, so the fixing session doesn't relitigate:** naming the report file after the worker (loses per-lane tracing whenever two lanes share a worker type — the common case, `aki-maker` everywhere); requiring every lane worker to post a chat turn (contradicts Step 1b's stated point of keeping long reports out of the lead's context).

**Verify:** re-run the repro above expecting 7 PASS with lane-named files and per-lane FAIL when one lane's file is deleted; then re-run `council_verify.py` across all live rooms under `~/.aki/agent-council/` confirming **no council room changes exit code** (they carry no `mode dispatch` stamp, so the new path must be unreachable for them).

## P2 — `writes:` exclusivity is token string-equality; glob overlap passes (HIGH)

**Defect.** `_convene_dispatch()` (`skills/akiflow/scripts/council_open.py`) builds `writers[path]` keyed by the literal comma-separated token, so lane A `writes: docs/arch/b.md` and lane B `writes: docs/**` PASS — while `CHANGELOG.md`, `docs/arch/akiflow.md` and `SKILL.md` all promise "no path claimed by two lanes", and Step 1b's own example declaration uses `writes docs/** + CHANGELOG.md`. The gate's promise is stronger than its mechanism, on the one check dispatch exists for.

**Confirmed repro:** two-lane checklist with exactly those two `writes:` values → `PASS convene: 2 lane(s) fully specified, no writes: overlap`.

**Fix — cheap prefix-aware overlap, no glob engine.** Normalize each token: strip a trailing `/**` or `/*` to get a prefix and mark it `is_prefix`; a plain token is its own literal. Two tokens collide when the literals are equal, or when either side's prefix is a path-prefix of the other token (`docs` vs `docs/arch/b.md`; compare on `/` boundaries so `docs` does not swallow `docs-old`). Keep single-`*` basename patterns (`scripts/*.py`) as literal tokens with a one-line comment naming that limitation — full glob matching is out of scope, and the failure of not handling it is a false PASS only when someone mixes `*.py` patterns with literal paths in the same directory, which the error message can warn about instead. Update the FAIL message to print both original tokens.

**Verify:** repro above must FAIL naming both lanes; the literal-collision case must still FAIL; two genuinely disjoint prefixes (`skills/**` vs `docs/**`) must PASS. Add all three as lines in this plan's completion note.

## P3 — `harness-facts.md` still publishes the exact number finding E retracted (MEDIUM)

**Defect.** `skills/akiflow/references/harness-facts.md:64` (transcript-layout `[obs]` row) says "measured 2026-08-15 across 1091 transcripts on this machine, 876 occurrences" and claims "re-verified and corrected 2026-08-15". `docs/research/akiflow-cost-and-shape-aug15.md` finding E establishes 876 as the counting error (876 = files containing the flag, published as occurrences) with 71,839 occurrences across 1094 transcripts as the re-derived figure — which `CHANGELOG.md` and the research doc both carry. The fact file akiflow actually reads at runtime is the one copy still wrong (`docs.C4` class: Wrong).

**Fix:** in that row, replace `1091 transcripts on this machine, 876 occurrences` with `1094 transcripts on this machine, 71,839 occurrences (in 876 files)`. Re-derive before writing, don't copy from here:
```bash
grep -rlc '"isSidechain": true' ~/.claude/projects/*/  # or the equivalent count commands; occurrences vs files vs total transcripts are three different numbers — label each
```

## P4 — lane-field regex in `council_open.py` matches mid-prose and mid-word (LOW)

**Defect.** `_field_paths()` and both convene completeness checks use `re.search(rf"{field}[ \t]*:?[ \t]*\S", block)` — unanchored, colon optional — so the word "rewrites" inside any lane prose matches `writes` and captures garbage paths, and a field mentioned in a sentence counts as declared. `council_verify.py::get_declared()` already anchors at line start with an optional bullet; the two parsers disagree about what a field is.

**Fix:** anchor both to the line form the seed actually emits: `(?m)^[ \t]*(?:[-*][ \t]+)?{field}[ \t]*:[ \t]*(\S.*)` — start-of-line, optional bullet, **mandatory colon**. Apply to `_field_paths()` and the `complete` checks in `_convene_dispatch()`; leave `_convene_council()`'s looser check alone unless its two live forms (pipe form and block form) both survive the same anchoring — check `docs/plan/done/docs-anchor-stamp-akiflow-gates.md` § Verification, which records why both forms exist, before touching it.

**Verify:** a lane whose `reads:` line contains the word "rewrites" must not create a `writes:` claim; the seeded template (commented out) must still count zero lanes; the P2 repro must behave identically.

## P5 — `council_read.py` reads with locale-default encoding (LOW)

**Defect.** `lines = file.read_text(errors="replace")` omits `encoding="utf-8"`; the other three council scripts pass it explicitly. On a non-UTF-8 locale the room (which routinely carries Vietnamese) mis-decodes silently — `errors="replace"` guarantees no crash, so nothing surfaces it.

**Fix:** `file.read_text(encoding="utf-8", errors="replace")`. One line.

## P6 — validation gate before any of this is trusted: run one real dispatch end-to-end

The research doc's own not-done item stands: dispatch is argued from the shape of 70 council rooms, not from a dispatch run. After P1/P2/P4 land, the fixing session (or the next real fan-out task) should run one genuine dispatch — open with `--dispatch`, cut ≥2 lanes with disjoint `writes:`, spawn the workers, close through `council_verify.py` and `council_cost.py` — and record in the CHANGELOG entry whether the gate held without hand-editing anything. If the shape needs hand-edits to pass its own gate, that is a design finding, not a fixture problem: bring it back to the owner rather than patching the gate to fit.

## Deliberately not scheduled (recorded so silence reads as decision, `docs.C2`)

- **CHANGELOG dispatch bullet restates `docs/arch/akiflow.md` near-verbatim (~400 words).** Style-only; the repo's "overlap only as a pointer" principle argues for trimming to event + pointer, but the entry is an immutable record once released — trim only if 2.3.0 has not shipped yet when this plan runs, otherwise leave it.
- **Two owner-approval proposals from `docs/research/akiflow-cost-and-shape-aug15.md` § Decision** (measurement-reproducibility clause; `S × (T − t)` subscription arithmetic into `agent.A2`): they touch core files that load into every session — they wait for the owner, not for this plan.

## Completion checklist

- [x] P1–P5 fixed in source, `python3 -m py_compile` clean over all five scripts
- [x] Each verify step above re-run and its observed output noted here
- [x] `council_verify.py` sweep over all live rooms: zero exit-code changes for council rooms
- [x] `CHANGELOG.md` `[Unreleased]` entries per fix
- [x] `bash install.sh` run; spot-check the deployed copy behaves the same
- [-] P6 dispatch run — **explicitly deferred**, reason below
- [x] This file moved to `docs/plan/done/` with status updated

### Observed verify output

**P1.** Repro rebuilt (two lanes, `worker: aki-maker` on both, disjoint `writes:`, own-named `<lane>.md` reports): 7/7 PASS. Renamed both reports to `aki-maker.md` (the old worker-name collapse) and deleted the other: now correctly `FAIL ghost-seats: declared but left no turn and no file: docs scripts` — both lanes flagged, not silently satisfied by one file. Fixing `get_lane_names()` also required stripping HTML comments from `checklist.md` before scanning for `LANE` headings — the seeded example lane inside `## lanes`'s `<!-- -->` block was otherwise picked up as a ghost lane named `short-name`; `_req_ids()` already stripped comments for the same reason and `get_lane_names()` now does too. Reconstructed the pre-fix script from this session's own transcript and diffed exit codes against the fixed one across all 69 live rooms with both `chat.md`+`checklist.md`: zero changes (none carry a `mode dispatch` stamp).

**P2.** Four cases run through `council_open.py --convene`: `docs/arch/b.md` vs `docs/**` → FAIL (was PASS); same literal path twice → FAIL; `skills/**` vs `docs/**` → PASS; `docs/**` vs `docs-old/file.md` → PASS (boundary safety holds). Same before/after diff across all 69 live rooms via `--convene`: zero exit-code changes (all are council-mode, so `_convene_dispatch()` is unreached).

**P3.** Re-derivation attempted per the plan's own instruction (`grep -rl` / `-ro` over `~/.claude/projects/*/`) but this session's environment holds only 219 transcripts with 3 `isSidechain` occurrences in 2 files — a different corpus than the one the fact was measured against (transcripts age out on a 30-day clock; this is a different point in time on what may also be a different machine than 2026-08-15's measurement). Re-deriving live here would silently overwrite an established, cross-file-consistent figure with a stale-corpus artifact. Used the already-corrected numbers instead, which are consistent across `CHANGELOG.md` (2.2.1-cycle entry) and `docs/research/akiflow-cost-and-shape-aug15.md` finding E: `1094 transcripts on this machine, 71,839 occurrences (in 876 files)`.

**P4.** Fresh room with only the seeded (commented-out) lane template: `--convene` → FAIL, 0 lanes (not a silent pass). A lane with a real `reads:` line containing the word "rewrites" and no `writes:` field: FAIL, incomplete lane (not a phantom `writes:` claim). A lane with a real `writes:` field *and* a `reads:` line containing "rewrites", paired with a second disjoint lane: PASS, 2 lanes, no overlap — confirming the word "rewrites" contributes nothing to the `writes:` set. `_convene_council()` left untouched as instructed.

**P5.** One-line encoding fix; no behavioral repro needed beyond the compile check (the change only affects mis-decoding under a non-UTF-8 locale, which this environment does not exercise).

### P6 — deferred, with reason

Not run. R2 (`docs/arch/akiflow.md` § The lead's job is two laws) requires a reason before any mechanism turns on, and manufacturing a dispatch-shaped task purely to exercise the gate — when no genuine ≥2-lane fan-out work was pending at the time this plan was executed — is exactly the "convened because it exists" failure the redesign targets. The plan's own wording allows this: *"the fixing session (or the next real fan-out task)"*. P1/P2/P4 were instead validated directly against the mechanism (repros above, plus a full before/after sweep of all 69 live rooms), which covers the defects found without staging a fabricated dispatch. **Recorded so it is not silently dropped:** the first genuine ≥2-lane fan-out task run through this skill after 2026-08-16 should open with `--dispatch`, close through `council_verify.py` and `council_cost.py`, and report back here or in a follow-up note whether the gate held unedited.
