# Test discipline — a routed, gated rule for automated tests

**Created:** 2026-10-07.
**Status:** executed 2026-10-07 from a session in this repo on the owner's order ("phải xử lý cho vào đợt này"), installed on the dev box; Item 11 and the post-release read-rate measurement dropped by the owner on 2026-10-07 (no manual follow-up checks). The shipped text is `payload/RULE-test.md`, which differs from § Draft rule text by the amendments at the end of this file (12 items after the owner review).
**Evidence:** one measured read-only audit of a 42-file Node test suite (Repo A, § Evidence) plus a detector sweep run for this plan over 425 test files in 12 local repository roots on the dev box, 2026-10-07. Every count below is measured unless labeled *estimate*.

## Outcome

The corpus gains `RULE-test.md` (topic `test`, 24 items in four groups), routed by meaning and gated by the test-file path, plus one pointer each in six existing rules and a deterministic detector script. After it lands, an agent cannot read "the suite is green" as proof of anything the tests did not exercise, cannot write a test that touches the user's real data, machine or repo tree, and cannot add, keep or delete a test without the subtraction discipline the corpus already applies to code.

## Anchor — the owner's words, verbatim

- "mấy cái test liệu có viết đúng viết hiệu quả không, có làm rác không, có thừa không, đừng khiến việc test trở thành sai hoặc tạo ra rác hoặc tác động sai lên data hoặc code hoặc đánh giá sai vấn đề nhé. akirule method subtract"
- "xong cho một subagent nghiên cứu và đưa vào bộ rule một plan về mọi quy tắc ép chặt chẽ mọi khía cạnh vào luật về test đi. trước giờ chưa có bộ luật nào đủ chặt đủ mạnh về test, name, phạm vi, các ràng buộc, v.v.. đủ thứ akirule nên áp vào, đặc biệt là method subtract và những điều tôi vừa nêu ở trên, phải đầy đủ hết vào plan"

Demands, each traced to those words; the § Acceptance table checks every one:

| ID | Demand | Owner's words |
|---|---|---|
| R1 | tests written correctly: no false verdict, no wrong assessment of the problem | "viết đúng", "đừng khiến việc test trở thành sai", "đánh giá sai vấn đề" |
| R2 | efficient | "viết hiệu quả" |
| R3 | no junk or leftovers | "có làm rác không", "tạo ra rác" |
| R4 | nothing redundant | "có thừa không" |
| R5 | never acting wrongly on data or code | "tác động sai lên data hoặc code" |
| R6 | naming | "name" |
| R7 | scope | "phạm vi" |
| R8 | constraints | "các ràng buộc" |
| R9 | everything akirule should apply | "đủ thứ akirule nên áp vào" |
| R10 | METHOD subtract in particular | "akirule method subtract", "đặc biệt là method subtract" |

## Evidence

Repo A is the audited suite (a local Node server, 42 test files, `node --test`); the audit ran `subtract` over `zero-trust` with `flow` and `proportion`. Repos B–E are other local projects; "vendored suite" is a third-party upstream test tree copied into one of them. Names and paths are in § Handoff only.

| ID | Failure shape | Measured | Feeds |
|---|---|---|---|
| E1 | A fully green suite rewrote the user's live data dir | Repo A, real `HOME`: 51/51 green in 37.2 s, task registry and logs written into the real app data dir; with an empty `HOME` the same suite went 50/51 | A8, B1, B2, D3 |
| E2 | Assertions skipped silently by machine state | Repo A: two `if (homeInRoots)` blocks depending on the real settings file, one `if (bare.includes(...))` skipped on any box without a browser binary; Repo B: a loop `continue`s past a missing dir | A4 |
| E3 | Vacuous and tautological assertions, a test that never calls the code | Repo A: a test re-running a copy of the implementation's SQL and never calling the tool; four tautologies (a version compared to the same manifest, a tool name compared to its own constant, `assert.ok(server)`); `Array.isArray` on real profile dirs; seven regexes over source text with no function run. Cross-repo: bare `Array.isArray` assertions 25 lines / 15 files / 5 repos | A1, A2, A3, A6 |
| E4 | Version-bump time bomb in a fixture | Repo A: an assertion holds only because fixtures say `3.0.0` = the manifest version; the first bump turns it red with nothing broken | A5 |
| E5 | Temp dirs leaked | Repo A: 20 files remove temp dirs outside `finally`, one hardcoded `/tmp` dir never removed; 3 files in 3 other repos create temp dirs and contain no removal at all (9 dirs) | B3 |
| E6 | A child process outliving the test | Repo A: a cancelled child outlives its test by ~7.6 s (`execFile` without abort signal); a detached `tail -f` and a fake browser left running when a test fails | B3 |
| E7 | Fixed sleeps where an observable signal exists | Repo A: 4 files; vendored suite: 5 files (11 lines / 9 files / 2 repos) | C4 |
| E8 | Non-injectable production waits | Repo A: two real 5 s waits make one file 19.7 s of 37.2 s, 53% of suite time | C4, C5 |
| E9 | Redundant tests across files | Repo A: one file repeats another's flag checks, passphrase format checked twice, one launch called twice, a daemon check duplicated | C2 |
| E10 | One linear script per file; `process.exit` | Repo A: 41 of 42 files are one linear script, so the first failure hides the rest; `process.exit` in 12 files (17 lines, only Repo A) | A7 |
| E11 | Names claiming more than they check | Repo A: a file named for CLI *and* dev mode tests no dev mode; two more names overclaim | C3 |
| E12 | Change-history comments in tests | Repo A: "Fix 1", `S6` | C3 |
| E13 | Private-API coupling and source-text pins | Repo A: a private SDK field in 6 files, ~60 regexes over page scripts; source files read by tests in 3 files / 3 repos | A6 |
| E14 | Machine-dependent budgets and ambient env | Repo A: a size budget whose served set is 25 or 30 tools depending on the machine; a port check reading ambient env, a real `lsof` whose empty list passes | A4, A5 |
| E15 | Isolation by shape replaced per-file discipline | Repo A: one preload (fresh `HOME`/`USERPROFILE`/`TMPDIR`/`TMP`/`TEMP` per test process and child, removed on exit) replaced fixes for 7 unisolated importers, a child process, `~/.gitconfig`, real rule and browser dirs, and the 20 non-`finally` cleanups; verified: real-`HOME` run left the data dir and temp root unchanged except one hardcoded `/tmp` | B2 |
| E16 | Read-only reviewers briefed without the router returned incomplete receipts | Reported by the session that commissioned this plan, 2026-10-07; not recorded in the audit doc | § Decision D7 |
| E17 | Live network and real app data in a default suite | Vendored suite: `tests/unit` calls two live third-party endpoints (5 lines / 2 files); several `.real` tests read a real app data dir under `HOME` | B1, B4 |
| E18 | Oversized fixtures | Repo A: 2 MiB fixture for a 512 KB cap, a 20000-line flood | B5, C6 |
| E19 | Ports | Repo A: fixed-range random ports in 3 sites (collision ~1 in 450 per run, *estimate*); the correct shape `listen(0)` is already dominant: 41 lines / 28 files / 3 repos | B4 |
| E20 | Weak bounds that accept the failure | Repo A: `completed` or `exited` accepted for an exit-0 command, `includes(cwd) \|\| length > 0`, `> 800` for 900 | A2 |
| E21 | This repo's own right shapes | `scripts/test-agy-bias.sh` is a billed suite, never run automatically, restoring config in an `EXIT` trap; `.github/workflows/install-smoke.yml` runs with `HOME` in the runner temp dir | B2, B4 |

## Inventory — what the corpus says about tests today

Grep of `payload/`, `skills/`, `claude/`, `docs/arch/`, `README.md`, `install.mjs` for test, verify, fixture, mock, stub, assert, flaky, sleep, tmp, isolation and related terms, then every hit read in context. Strength is per demand: **S** strong, **W** weak (implicit, or a domain instance only), **–** silent.

| Address | What it says about tests | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R10 |
|---|---|---|---|---|---|---|---|---|---|---|
| `coding.B3` | done means verified; static reading is verification; related unit tests after edits, full suite at ship; runtime residue reported unverified; six-rung ladder | W (trusts green) | W (moments only) | – | – | W (rung 5 backup/restore) | – | – | – | – |
| `coding.B2` | Chesterton's fence before changing code | – | – | – | – | – | – | – | – | W |
| `coding.B4` | no change history in comments | – | – | – | – | – | W | – | – | – |
| `coding.C1` | no fake data as a production fallback; no guards for impossible states | – | – | – | – | – | – | W | – | – |
| `pattern.A1/A2/A6/A7/A8/B2` | SSoT, evidence bar, module boundary, naming root, one natural flow, reuse first | W | – | – | W | – | W | – | W | – |
| `agent.B3` | ask before any test run that spends paid credits or quota | – | – | – | – | S (spend only) | – | – | W | – |
| `agent.C5` | throwaway test scripts go to the scratchpad | – | – | S (throwaway only) | – | – | – | – | – | – |
| `agent.B1` (uncommitted line in the working tree) | what you create, you remove | – | – | W (agent's own artifacts) | – | – | – | – | – | – |
| `agent.B5`, `agent.A5` | audits are read-only; a worker's brief names its rule files | W | – | – | – | – | – | – | – | – |
| `release.B5` point 4 | a test on a fresh database proves nothing about an upgrade; "the tests pass" is not evidence | S (migrations only) | – | – | – | – | – | W | – | – |
| `release.B7` step 6 | build and test mirroring CI at ship | W (trusts green) | – | – | – | – | – | – | W (CI parity) | – |
| `release.B9` | packed `bin` run with a sandbox `HOME`, env scoped to the right command | – | – | – | – | S (packaging only) | – | – | – | – |
| `release.B11` | identity check vs function check; a constant `ok` health endpoint is a false instrument | W (analogy) | – | – | – | – | – | – | – | – |
| `zero-trust.B/C` | detectors first; CERTAIN vs SUGGESTED | W (no test detectors) | – | – | – | – | – | – | – | – |
| `subtract.B1–B3` | passes table, severity classes, Chesterton brake | – | – | – | W (no tests row) | – | – | – | – | W (no tests row) |
| `flow.B6/B8`, `proportion.B3` | make it impossible instead of checked; observable signal; rung 1 impossible by shape | W | W | – | – | W | – | – | – | – |
| `think.B5` | edge cases weighed by severity | – | – | – | – | – | – | W | – | – |
| `ui.C4`, `seo.C3`, `stack.C8` | verify build+type+visual; post-build validation script; deploy fetched live | W | – | – | – | – | – | – | – | – |
| `content.A3` | labels stable so tests can map them | – | – | – | – | – | – | – | – | – |
| `biz.B3` | "market test" — a homonym the new route's signals must not catch | – | – | – | – | – | – | – | – | – |
| `aki-route-guard.mjs` | a test file gates `coding`+`pattern` only; no test signature | – | – | – | – | – | – | – | – | – |
| `scythe.py` | `[WRAP]`/`[YAP]` already lint test-file comments | – | – | – | – | – | W | – | – | – |

No rule anywhere states what makes a test's verdict trustworthy, what a test may touch, or what earns a test its place; the two gates that consume test results (`coding.B3`, `release.B7` step 6) trust them unconditionally.

## Gap matrix

| Demand | Existing address | Gap | Closed by |
|---|---|---|---|
| R1 correct verdict | `coding.B3`, `release.B5`.4, `release.B11`, `zero-trust.C` | green trusted with no condition; no rule on vacuous, tautological, conditional or time-bombed assertions, on never-seen-red tests, on what a pass proves | `test.A1–A8`, `test.D3`, `coding.B3` pointer |
| R2 efficient | `coding.B3` moments, `agent.A2` | test-time cost unruled: fixed sleeps, non-injectable waits, oversized fixtures, a build inside tests | `test.B5`, `test.C4`, `test.C5` |
| R3 no junk | `agent.C5`, `agent.B1` (pending) | a durable suite's residue (temp dirs, children, servers) unruled; no after-run residue check | `test.B3`, `test.D3`, `release.B7` step 6 pointer |
| R4 no redundancy | `pattern.A1/A2/B2`, `subtract.B2` | no "one behavior, one owner test"; no tests row in `subtract.B1` | `test.C1`, `test.C2`, `subtract.B1` row |
| R5 data and code | `agent.B3`, `release.B9`, `coding.B3` rung 5 | no forbidden-target list for tests, no isolation shape, no rule against leaving an edit in code to make a test fail | `test.B1`, `test.B2`, `test.B4`, `test.A1` |
| R6 naming | `pattern.A7`, `coding.B4` | test names overclaiming, ticket numbers, change history | `test.C3`, `pattern.A7` domain list |
| R7 scope | `think.B5`, `coding.C1` | what a test is for and what a pass covers | `test.C1`, `test.A8` |
| R8 constraints | – | test seams in production code, fixtures, mocks, ports and live services, CI parity | `test.C5`, `test.C6`, `test.B4`, `test.C7` |
| R9 everything akirule | router, gate, receipt, audit methods | no route, no gate signature, no audit domain, no detector, no lens row | router row, gate signature, `test.D`, `test_lint.py`, `corpus-map` rows, `AG_RULE_MAP` |
| R10 subtract | `subtract.B1–B3`, `think.B4`, `pattern.B3` | subtraction never pointed at tests; deletion brake not applied to tests | `test.C1`, `test.C2`, `test.D1`, `test.D4`, `subtract.B1` row |

## Decision record (`/akithink` self-run)

**Goal chain:** a test verdict that depends only on the code under test → "green" is evidence the corpus's own gates (`coding.B3`, `release.B7`) can rest on → no false Done, no damaged user data, no junk tree → the owner stops auditing suites by hand across ~20 projects.

**Facts:** F1 the corpus has no test-authoring rule (§ Inventory). F2 the two gates that consume test results trust them (`coding.B3`, `release.B7` step 6). F3 the failure classes recur across repositories (E3, E5, E7, E17: 2–5 repos each), so this is not one project's root cause. F4 the correct shapes already exist in practice (E15 preload, E19 `listen(0)`, E21) and are unwritten. F5 the route gate fires only on Edit/Write (`aki-route-guard.mjs` `main`), so it never gates a read-only worker. F6 the installer throws when a payload rule has no `AG_RULE_MAP` entry (`install.mjs` `installAgRules`) and builds Antigravity descriptions by regex from the router row, so a route clause must not contain `|`. F7 skill scripts are pre-allowed by enumeration (`listSkillScripts`), so a new script needs no permission edit.

**Constraints:** C1 public English corpus. C2 overlap only as pointers; `pattern.A2` evidence bar; line budget follows violation frequency. C3 the change sweep in `CLAUDE.md`. C4 shared machines: a check must stay cheap.

**Assumptions to monitor:** A1 the gate makes the new file read on test edits as reliably as `coding` (measured by `second_hop_audit.py` after release). A2 the detector precision measured on JS/TS repos holds for Python and Go patterns (unmeasured: no Python/Go test files in the sampled set).

**D1 — Shape.** Decided: a new `RULE-test.md` (topic `test`), routed and gated, plus one-line pointers in `coding.B3`, `release.B7`, `subtract.B1`, `zero-trust.B1`, `agent.B5`, `pattern.A7` · because the content governs a minority of code edits and the gate makes a separate file as reliably read as `coding` on exactly those edits, while the audit form belongs beside the authoring rules the way `docs.C`, `ui.C` and `content.C2` sit inside their rule files · rejected: a `coding.D` section (paid on every code edit for content most edits never use, the `docs.A5` reach argument), a separate `METHOD-audit-test.md` (each failure class written twice, once as a rule and once as a detector, against `pattern.A1`), no payload change with a per-project fix (the `from-aug22` precedent parked one repo's single root cause; here the classes span 2–5 repos and the corpus gates themselves trust green) · reopen if `second_hop_audit.py` shows test-edit sessions reading `RULE-test.md` less often than `RULE-coding.md`, or the file grows past 12 KB after step 1.

**D2 — Route clause.** Decided: the route fires when a task creates, changes, reviews or audits a test, fixture or harness, or judges whether a test result can be trusted; a plain `npm test` inside a code task does not route it · because the verdict-weight law reaches every code task through the `coding.B3` pointer, and loading 24 items on every run would be paid for nothing · rejected: routing on every test run · reopen if a false Done traced to an unloaded `test` rule reaches a CHANGELOG entry.

**D3 — Gate signature.** Decided: a path routes to `RULE-test.md` when its name matches `\.(test|spec)\.[a-z]+$`, `_test\.[a-z]+$`, `^test_.*\.py$`, `^conftest\.py$`, or it sits under a `/(test|tests|__tests__|spec)/` directory · because these are the conventions of every runner in the sample (the 425 files were collected with this signature, so it is a convention check, not a recall measurement) and they catch fixture dirs too · rejected: content sniffing (a hook reading file bodies), `spec` anywhere in the path (`docs/spec/` false positives) · reopen if a test-file edit is missed in `second_hop_audit.py` output. Known limit: Rust inline `#[cfg(test)]` modules route by meaning only.

**D4 — Detectors.** Decided: a new `skills/akiflow/scripts/test_lint.py` beside `release_lint.py`, CERTAIN tags exit 1, SUGGESTED tags print as review lines; `scythe.py` unchanged · because three detectors need logic grep cannot express in one line (temp creation paired with removal, an `if` paired with the assertions under it, a configured preload suppressing per-file isolation tags), agents retype grep patterns from prose unreliably (the enforcement-over-content finding in `research/akiflow-compliance-enforcement-aug3.md`), and `release_lint.py` is the precedent for a domain linter · rejected: new tags in `scythe.py` (its tags are the `agent` §0 penalty cards; domain detectors would dilute that vocabulary), grep lines in the rule only (the pairing logic above) · reopen if after two releases `test_lint.py` reports nothing a single grep would not.

**D5 — Antigravity trigger.** Decided: `["RULE-test.md", "model_decision", ""]` in `AG_RULE_MAP` · because the route is by act as much as by artifact, like `coding` · rejected: `glob` (attaches only when a matching file is touched and never for a review or audit turn) · reopen if agy sessions edit test files without loading it.

**D6 — "Seen red" (`test.A1`).** Decided: kept, as a one-time check for a new or changed assertion, done by a wrong input or expectation and never by leaving an edit in the code under test · because it is the one cheap check that catches E3's never-calls-the-code and prints-ok-early tests before they ship · rejected: mutation testing as a rule (a tool, not a floor; cost on a weak machine) · reopen if agents report it as ritual (red claimed with no run shown).

**D7 — Reviewer briefs (E16).** Decided: no new item; correct `docs/arch/rule-delivery-architecture.md`, which says the gate "closes the `agent.A5` 'worker inherits nothing' gap by mechanism" — true for workers that edit, false for read-only reviewers (F5) · because `agent.A5` already requires the brief to name the files; E16 is a comply-fail, and restating a loaded rule changes nothing (`research/akiship-literal-activation-aug22.md`) · rejected: a `test.D` item repeating `agent.A5` · reopen if a second router-less reviewer brief is observed after the arch doc is corrected.

**D8 — Residue check scope.** Decided: the after-run check compares the repo tree (`git status --porcelain`) and the temp root's entries with the suite's prefix, never a snapshot of `HOME` · because on a shared machine other processes write `HOME` during the run, so a before/after diff of it is noise; `HOME` is protected by the preload's shape (`test.B2`) · rejected: a full `HOME` diff · reopen if a suite writes `HOME` despite a preload.

**Critique (all options).** *Steelman no rule:* the right shapes are already common (E19) and a project `CLAUDE.md` line could carry them — but E1 happened in a repo whose `CLAUDE.md` is long and careful, and the gates trusting green are corpus text, not project text. *Attack the new file:* it can grow into a style guide nobody reads — answered by one line per item, each tied to an E-row, and § Parked holding everything without evidence. *Inversion:* a test rule fails if it makes agents write more tests — so `test.C1` is subtraction-first and no coverage target exists. *Pre-mortem:* six months on, agents delete security tests as "redundant" — `test.D4` makes them load-bearing by default; detectors churn on false positives — only measured-precision tags are CERTAIN; the preload rule is copied as per-file boilerplate — `test.B2` names one suite-level mechanism. *Second-order:* a third gated file on test edits costs one more read per session that edits tests (9.6 KB, the draft as measured), paid only there.

## Draft rule text

Target `payload/RULE-test.md`; the draft below measures 9.6 KB (9,587 bytes). One line per item; every overlap is a pointer.

````markdown
# Test Rules

<!-- Address map: test.A1-8 · test.B1-5 · test.C1-7 · test.D1-4 -->

**Tier: Contextual, gated** — routed by `akirule` when a task creates, changes, reviews or audits an automated test, fixture or harness, or judges whether a test result can be trusted; on Claude Code `aki-route-guard` denies the first test-file edit of a session until this file was read. A test is code: `coding` and `pattern` apply in full and are not restated. This file owns three questions: what makes a verdict true, what a test may touch, and what earns a test its place.

## A. Verdict — a result means exactly what the test exercised

### A1. Seen red, then green
A new or changed assertion is trusted only after it failed once against a wrong input or expectation — never by leaving an edit in the code under test (`git diff` clean afterwards); the test calls the code under test through its public entry, never a copy of it.

### A2. No vacuous assertion
Never the sole check of a behavior: `Array.isArray(x)`, `typeof f === 'function'` on an import, `assert.ok(obj)`, `includes(x) || length > 0`, a bound any output meets, an accepted-states set containing the failure state; assert the exact value, shape or count from a seeded non-empty input — an empty list passes every shape check.

### A3. Expected values never come from the implementation
No comparing to the module's own exported constant, no re-running a copy of its SQL, regex or algorithm, no expected output computed by the code under test; expected values are literals or come from an independent source.

### A4. No machine-dependent verdict
An assertion under `if (<ambient state>)` — env var, file existence, binary on `PATH`, platform, real config — passes silently where the condition fails; make the condition a fixture the test controls, or skip through the runner's skip API with a reason the report shows.

### A5. No time bombs
A fixture hardcoding a value that moves with time or release (version, date, year, served-item count) turns red with nothing broken: read it from its single source (`pattern.A1`) or inject the clock; a size, duration or count budget asserts only its host-independent part, with the measured headroom stated.

### A6. Contract, not incidental text
Assert through the public API: a regex over source text or a read of a private field passes while behavior breaks and fails while behavior holds (`pattern.A6`); a source-text pin is allowed only as a labeled interim guard where no harness can run the code, its reason recorded.

### A7. One failure never hides the rest
Independent checks are separate runner-level cases (`test()`, `it()`, `def test_`), never one linear script whose first throw masks later assertions; no `process.exit()`/`sys.exit()` in a test — it truncates the run and hides leaked handles; nothing prints "ok" before the last assertion.

### A8. A pass proves only the scope it ran on
A mock proves the caller's assumption about the dependency, a fake service nothing about the live one, an empty database `CREATE` and not the upgrade (`release.B5` point 4); report that residue unverified (`coding.B3`), never covered.

## B. Side effects — a test never acts on what it does not own

### B1. Forbidden targets — reading counts
The real `HOME` and its dot-dirs (app data, `~/.gitconfig`, `~/.ssh`, browser profiles, agent config), the system temp root by literal path, the repo tree outside the suite's fixture dir, global git config, keychain, clipboard and OS settings, real network hosts, fixed ports, processes and apps the user runs, paid APIs and quota (`agent.B3`); a read of real user state makes the verdict machine-dependent (A4) and can copy personal data into logs.

### B2. Isolation by shape, once, at the suite boundary
One preload or global setup (`node --test --import`, `setupFiles`, `conftest.py`, `TestMain`) gives every test process and every child it spawns a fresh `HOME`, `USERPROFILE`, `TMPDIR`/`TMP`/`TEMP` (plus `XDG_*` where read), removed on exit even after failure — `proportion.B3` rung 1, `flow.B6`; per-file overrides only for what the preload cannot know; production code resolves user paths at call time, never cached at import; an env override scopes to the command that needs it (`release.B9`).

### B3. What a test creates, it removes — in `finally`/`after`, even on failure
Temp dirs through the runner or OS temp API (`mkdtemp(join(tmpdir(), prefix))`, `tmp_path`, `t.TempDir()`), servers closed, child processes and their groups killed through an abort path that runs on failure and timeout, timers and watchers cleared; after a full run `git status --porcelain` and the temp root's suite-prefixed entries match the state before it.

### B4. Ports and services: ephemeral and local
`listen(0)` and read the assigned port, never a fixed or random-range one; external HTTP through a local fake or an injected transport; a test needing a live service, credentials or quota lives in a separately named suite (`*.live.*`) outside the default command and runs only on explicit request (`agent.B3`).

### B5. Cost is part of correctness on a shared machine
The default command fits the weakest machine that runs it: no build inside tests, bounded parallelism, fixtures sized to the boundary they cross (one step past a cap, not four times it); after an edit run the narrowest related tests, the full suite only at `coding.B3`'s moments, never twice for one question.

## C. Shape — a test earns its place, its name and its seams

### C1. A test earns its existence
Only for a behavior a static read or typecheck does not already settle (`coding.B3`) and whose regression costs someone; none for a language or framework guarantee, a constant equal to itself, or a state the pinned facts rule out (`coding.C1`); no coverage-percentage target; a probe written to verify one change is scratch (`agent.C5`) and joins the suite only if it passes this item.

### C2. One behavior, one owner test
Search the suite before adding (`pattern.B2`); a second test of the same behavior through the same entry is redundant — extend the owner; tests at two layers stay only when each catches a failure the other cannot.

### C3. The name is the claim, and the body proves all of it
File and case names state the behavior and condition (`rejects write outside roots`), never more than the body asserts, never a ticket, phase or fix number (`pattern.A7`); no change-history comments in a test (`Fix 1`, `S6`, "was broken because") — `coding.B4`.

### C4. Wait on the signal, never a fixed sleep
Await the observable event (`once(emitter, 'close')`, a polled status with a deadline) instead of `sleep(n)`; a production wait (retry delay, pickup window, timeout) is injectable so the test runs it near zero — a non-injectable production wait in a suite is a finding; an elapsed-time bound asserts separation (detection ≪ timeout), never host speed.

### C5. One seam mechanism, production default
A parameter, option or exported setter whose default is the production value, the same shape across the module; never an `if (NODE_ENV === 'test')` branch, a test-only export of internals, or a code path the product never runs; a seam is added for a measured cost (time, nondeterminism, side effect), never speculatively (`pattern.A2`).

### C6. Fixtures: literal, minimal, owned
Under the suite's own fixture dir, the smallest input that crosses the boundary, hand-written or recorded once and never generated at run time by the code under test; no real personal data, credentials or production dumps in the repo (a real-data copy for migration rehearsal stays outside it, `release.B5` point 4); fake data in a test is correct, fake data as a production fallback is not (`coding.C1`).

### C7. CI parity: one command, one verdict everywhere
The default test command is the one CI runs (`release.B7` step 6); no test passes only because of local state (A4, B1) or only under CI's environment; a platform branch is tested by passing the platform as an argument, never by the host it runs on.

## D. Suite audit — reports, never fixes

### D1. Auditing a suite is an audit
`agent.B5`: scope locked by glob over the test files plus the preload, runner config and the production seams they reach (`zero-trust.A`); the `subtract` passes pointed at tests; the `docs.C2` research+plan pair when `docs.C1` qualifies; the "load-bearing but ugly" list is mandatory (`subtract.B2`).

### D2. Detectors before opinion
Run `skills/akiflow/scripts/test_lint.py` over the locked set and attach its output first (`zero-trust.B`): CERTAIN tags are verdicts, SUGGESTED tags are candidates for judgment; a per-file isolation tag is moot where a B2 preload covers the file.

### D3. What a green run proves
CERTAIN: this command exited 0 on this machine at this commit; "the behavior is covered" stays SUGGESTED until A1–A5 hold for the tests claiming it. A suite report carries the command, exit code, duration, slowest files, skipped count with reasons, and the B3 residue check.

### D4. Deleting a test passes the fence
`subtract.B3`: find the regression it was written for (the adding commit, `git log -S`) before removing it; reason unknown → SUGGESTED with that phrase, never removed by the audit; security and invariant tests (auth, SSRF, path traversal, lockout, data-loss guards) are load-bearing until proven otherwise (`pattern.A2` risk weighting).

## One-line reminder

A test is evidence only when it could have failed, touched nothing it does not own, and earned its place — anything else is noise that looks like safety.
````

## Detectors — `test_lint.py`

Output and exit contract copy `release_lint.py`: `[TAG] path:line | label`, exit 0 clean, 1 on any CERTAIN tag; SUGGESTED tags never change the exit code. Input: paths, or a repo root expanded to its git-tracked test files by the D3 signature. Measured column: the 425-file / 12-root sweep of 2026-10-07 with the pattern given; JS/TS only (no Python/Go test files in the sample).

| Tag | Item | Detects | Class | Measured |
|---|---|---|---|---|
| `[TMPLIT]` | B3 | a temp dir or file created at a literal `/tmp` path (`mkdtemp*`, `mkdir*`, `writeFile*`, `join`, `open` whose first argument starts `'/tmp`) | CERTAIN | 0 now (Repo A's one site already fixed); a bare `'/tmp/...'` string is never flagged: 11 lines / 6 files, every sampled hit outside Repo A was a path string used as data |
| `[CLEANUP]` | B3 | a file that creates a temp dir and contains no removal call | CERTAIN | 3 files / 3 repos, 9 dirs; suppressed when a B2 preload is configured |
| `[CLEANUP-FINALLY]` | B3 | removal present but outside `finally` / an `after` hook | SUGGESTED | Repo A: 20 files before its preload |
| `[EXIT]` | A7 | `process.exit(`, `sys.exit(`, `os.Exit(` in a test file | CERTAIN | 17 lines / 12 files / 1 repo |
| `[SLEEP]` | C4 | promise sleep `setTimeout(r, N)`, `time.sleep(`, `sleep N` in a test body | SUGGESTED | 11 lines / 9 files / 2 repos |
| `[VACUOUS]` | A2 | an assertion whose only argument is `Array.isArray(x)`, `typeof x === 'function'`, or a bare identifier | SUGGESTED | `isArray` 25 lines / 15 files / 5 repos; `typeof` 2 / 2 / 2; one sampled hit carried `&& length === 2` and is not flagged by the pattern |
| `[AMBIENT]` | A4 | an `if` whose condition reads `process.env`, `existsSync`, `process.platform`, `homedir`, `which` or `PATH`, with an assertion or `continue` within its body | SUGGESTED | 2 outside Repo A; a plain `if` plus assertion is not flagged: 10+ files, every sampled one a fake dispatching on its input |
| `[HOMEREAD]` | B1 | `os.homedir()`, `Path.home()`, `expanduser('~`, `process.env.HOME` read in a test, absent a preload and absent an override restored in `finally` | SUGGESTED | 14 files / 3 repos raw; one sampled file overrides and restores correctly |
| `[NET]` | B4 | `fetch(`/`request(` to a literal non-loopback URL in the default suite | SUGGESTED | 5 lines / 2 files / 1 repo |
| `[PORT]` | B4 | `.listen(<non-zero literal>)` or a port from `Math.random()` arithmetic | SUGGESTED | literal 0; random-range 3 sites in Repo A; `listen(0)` 41 lines / 28 files / 3 repos |
| `[SRCPIN]` | A6 | `readFileSync` of a project source file inside a test | SUGGESTED | 3 files / 3 repos |
| `[PRIVATE]` | A6 | a `._name` property read on an imported object | SUGGESTED | noisy raw count (top file 21 hits); precision to be measured at implementation |
| `[HISTORY]` | C3 | a test comment matching `Fix \d+`, `\bS\d+\b`, `was broken`, `regression from` | SUGGESTED | Repo A only |

Not a detector, by design: names that overclaim (C3), redundancy (C2), tautology (A3), seen-red (A1) — judgment, located by reading.

## Router and gate

Router row for `skills/akirule/SKILL.md` (no `|` inside the clause, F6):

````markdown
| `RULE-test.md` · `test` | creates, changes, reviews or audits an automated test, fixture or test harness, or judges whether a test result can be trusted | test file (`*.test.*`, `*.spec.*`, `*_test.*`, `test_*.py`, `conftest.py`, `test/`, `tests/`, `__tests__/`), unit/integration/e2e test, test suite, fixture, mock, stub, fake, assertion, flaky test, test isolation, test leftovers, slow tests, green but broken, skipped test, test seam, test runner, CI test job · viết test, kiểm thử, test sai, test rác, test thừa, test chậm, test xanh mà vẫn lỗi, test ghi đè dữ liệu thật |
````

The signals say "test" with an object (test file, test suite) so `biz.B3`'s market test is not caught. Delivery bullet in the same file: add `test file → test` to the gate's mapping list. Gate code (`claude/hooks/aki-route-guard.mjs` `routesFor`): `if (TEST_PATH.test(p)) rules.add("RULE-test.md")` with the D3 signature, evaluated before the extension checks so a fixture `.json` under `test/` routes too.

## Pointer edits — one line each, no restated text

| Site | Line added |
|---|---|
| `coding.B3` § What counts | A test result is evidence only for what that test exercised and could have failed on (`test.A`); a suite that touches real user state or skips by machine state proves nothing about the code (`test.B`). |
| `release.B7` step 6 | The run counts only with its residue check and skips listed with reasons (`test.B3`, `test.D3`); residue is a FAIL. |
| `subtract.B1` table | row `Tests` · a test that checks nothing, duplicates another, compares to the implementation's own value, or carries a fixture larger than its boundary · `test.C1`, `test.C2`, `test.D` |
| `zero-trust.B1` | add `test.D2` to the list of targeted scans a rule file already specifies |
| `agent.B5` domain audits | add `test.D` (test suite) |
| `pattern.A7` domain-application list | add `test.C3` test names |

`agent.B1`'s "what you create, you remove" line is uncommitted work of another session; `test.B3` names `agent.C5` until that line ships, then points at `agent.B1` as its root.

## Change sweep — every file that moves together

Paths verified to exist on 2026-10-07.

| File | Change |
|---|---|
| `payload/RULE-test.md` | new, from § Draft rule text |
| `payload/RULE-coding.md`, `RULE-release.md`, `METHOD-audit-subtraction.md`, `METHOD-audit-zero-trust.md`, `RULE-agent-behavior.md`, `RULE-pattern-core.md` | § Pointer edits |
| `skills/akirule/SKILL.md` | route row + Delivery bullet mapping |
| `claude/hooks/aki-route-guard.mjs` | test signature in `routesFor` |
| `docs/arch/rule-delivery-architecture.md` | gate mapping list (line 21) + D7 correction of the "closes the gap" sentence |
| `install.mjs` | `AG_RULE_MAP` entry (D5); printed summary unchanged (scripts enumerated, F7) |
| `skills/akiflow/scripts/test_lint.py` | new (D4) |
| `scripts/second_hop_audit.py` | `ROUTES['test']` with the D3 signature, so the gate's effect is measured |
| `docs/arch/corpus-map.md` | topic row `test` · A Verdict · B Side effects · C Shape · D Suite audit; lens rows: Naming + `test.C3`; Audit reports + `test.D`; Subtraction + `test.C1`; new row "What a passing check proves" — root `coding.B3`, applications `release.B5` point 4, `release.B11`, `test.A`, `test.D3` (earned by E1) |
| `README.md` | layout block, "Contextual and analytical" bullet, scripts list line for `test_lint.py` |
| `claude/agents/aki-maker.md` | rule list: `RULE-test.md` when the diff touches a test file or fixture (saves a denial round trip) |
| `claude/agents/aki-judge.md` | `test` in the description's standards list |
| `skills/akiflow/SKILL.md` | `audit` mode row: add `test.D` to the judge domains |
| `skills/akiship/SKILL.md` | step-6 summary line: re-read after the `release.B7` edit; edit only if it now restates the step |
| `CHANGELOG.md` | `[Unreleased]` entry: evidence (E1, E3, E5, cross-repo counts), root cause (gates trust green, no test rule), mechanism, rejected options from D1–D8, the sweep list |
| No edit, checked | `claude/CLAUDE.md` (gate paragraph enumerates no types), `skills/akihelp/SKILL.md` (reads live state; `CLAUDE.md` exempts normal content changes), `scythe.py` (D4), `.github/workflows/install-smoke.yml` (checks file presence only) |

## Execution

- [x] **1. Rule file.** Write `payload/RULE-test.md` from the draft; run the deletion test per line and the `pattern.B3` critique gate. Exit: every item traces to an E-row or is pointer-only; `scythe.py payload/RULE-test.md` clean; size recorded. — Done: 9,626 bytes, 23 items (Amendment 1), scythe clean.
- [x] **2. Pointer edits** (§ Pointer edits). Exit: `grep -n 'test\.' payload/*.md` shows each pointer and no sentence copied from `RULE-test.md`. — Done; `release.B7` and `zero-trust.B1` point at the renumbered `test.D2` / `test.D1` (Amendment 1). The three § Adjacent findings were fixed in the same files (Amendment 4).
- [x] **3. Router.** Row + Delivery bullet. Exit: `node -e` running `install.mjs`'s `routerClauses` regex over the edited file returns the `RULE-test.md` clause intact. — Done; the real install rendered `~/.gemini/config/rules/akirule-test.md` with the clause as its description (Item 5).
- [x] **4. Gate.** Signature in `aki-route-guard.mjs`. Exit: piping a synthetic PreToolUse JSON (empty transcript) for `test/x.test.js`, `test/fixtures/a.json`, `src/x.js`, `docs/spec/a.md` yields deny-with-`RULE-test.md` for the first two and no `RULE-test.md` for the last two. — Done, 7 paths: the two positives plus `tests/helper.mjs`, `src/foo_test.go`, `lib/test_util.py` denied on `RULE-test.md`; `src/x.js` → coding+pattern only; `docs/spec/a.md` → docs only.
- [x] **5. Installer and Antigravity.** `AG_RULE_MAP` entry. Exit: an install into a sandbox `HOME` (`HOME="$(mktemp -d)" node install.mjs`, the variable on the `node` command, `release.B9`) completes and renders `akirule-test.md` with the router clause as its description. — Done; the sandbox install completed (rc 0) but writes no Antigravity rules when the sandbox has no `~/.gemini`, so the rendering was checked on the real install instead: `trigger: model_decision`, description = the route clause.
- [x] **6. `test_lint.py`.** Exit: on a scratchpad fixture set (one positive and one negative snippet per tag) every tag fires exactly on its positive; on the 2026-10-07 local sweep the CERTAIN counts match the § Detectors column; exit codes 0/1 as specified; `[PRIVATE]` precision measured and recorded here, demoted or dropped if most sampled hits are legitimate. — Done with 12 tags: positive fixture fires all 12 (exit 1), negative fixture clean (exit 0). Local sweep, 431 files (the plan's earlier sweep the same day counted 425) after excluding the Repo A handoff copy and the Tauri reference tree: `[TMPLIT]` 0, `[CLEANUP]` 3 files / 3 repos (the three named in § Handoff), `[EXIT]` 15 lines / 7 files / 2 repos — fewer than the 17/12 measured when the plan was written because Repo A's own fix plan had removed some by the time of this run, and four files are `tests/__baseline__/verify-*.mjs` scripts in the vendored suite that the plan's count had not included. SUGGESTED totals on the same sweep: `[VACUOUS]` 51, `[SRCPIN]` 22, `[AMBIENT]` 20, `[CLEANUP-FINALLY]` 19, `[SLEEP]` 10, `[HOMEREAD]` 7, `[HISTORY]` 7, `[NET]` 5. `[PRIVATE]` dropped (Amendment 2).
- [x] **7. Measurement.** `ROUTES['test']` in `second_hop_audit.py`. Exit: the script prints a `test` row; baseline recorded here before release. — Done. Baseline, dev box, 2026-10-07, before the rule existed: `before` era 2 sessions edited a test path, 0 read `RULE-test.md`; `after` era 3 sessions, 2 read it (66%, both today, the executing session and the session that drafted it).
- [x] **8. Manifests, docs and the arch correction** (§ Change sweep rows for agents, akiflow, akiship, corpus-map, README, rule-delivery-architecture). Exit: `grep -rn 'RULE-test\|test\.D\|test_lint' .` lists every row of the sweep table. — Done; `skills/akiship/SKILL.md` step-6 line re-read and left unchanged (it does not restate the step).
- [x] **9. CHANGELOG** entry with reasoning. Exit: `release_lint.py --latest .` exits 0. — Done.
- [x] **10. Install and smoke** on the dev box (`node install.mjs`). Exit: a fresh session's first edit of a test file is denied until `RULE-test.md` is read; a `.md` edit is not gated on it. — Installed; the denial checked by the Item 4 fixture against the deployed hook and rule dir (an empty transcript is a fresh session to the gate). A live session's first test-file edit is the same code path.
- [x] **11. Field check, read-only.** Dropped by the owner 2026-10-07. Run `test_lint.py` on Repo A after its own fix plan lands. Exit: CERTAIN tags it reports are a subset of that audit's open items; anything new is a false positive to fix in step 6 or a miss of that audit, recorded here. — Not run; today's run already showed Repo A's `[EXIT]` count falling. Command, if ever wanted: `python3 ~/.claude/skills/akiflow/scripts/test_lint.py /home/guest/aki/pj/aki-mcp-sv`.

Order: 1–2, then 3–5 (route and delivery), 6–7, 8–9, 10, 11. Report each changed rule line verbatim with its meaning (`CLAUDE.md` § Reporting a rule change).

## Acceptance — every demand

| Demand | Covered by (plan section · rule items) |
|---|---|
| R1 correct verdict, no wrong assessment | § Draft rule text `test.A1–A8`, `test.D3` · § Pointer edits `coding.B3` · § Detectors `[VACUOUS]`, `[AMBIENT]`, `[EXIT]`, `[SRCPIN]`, `[PRIVATE]` |
| R2 efficient | `test.B5`, `test.C4`, `test.C5` · `[SLEEP]` · D2 (no route load on plain runs) |
| R3 no junk | `test.B3`, `test.D3` · § Pointer edits `release.B7` step 6 · `[TMPLIT]`, `[CLEANUP]`, `[CLEANUP-FINALLY]` · D8 |
| R4 nothing redundant | `test.C1`, `test.C2` · § Pointer edits `subtract.B1` row |
| R5 never acting wrongly on data or code | `test.B1`, `test.B2`, `test.B4`, `test.A1` (no edit left in code), `test.C6` (no real data) · `[HOMEREAD]`, `[NET]`, `[PORT]` |
| R6 naming | `test.C3` · § Pointer edits `pattern.A7` · `[HISTORY]` · corpus-map Naming row |
| R7 scope | `test.C1`, `test.A8`, `test.D1` (audit scope lock) |
| R8 constraints | `test.C5` seams, `test.C6` fixtures, `test.B4` live services and quota, `test.C7` CI parity, `test.B5` shared-machine cost |
| R9 everything akirule | § Router and gate · § Change sweep · `test.D1–D4` · D1–D8 decisions · § Parked |
| R10 subtract | `test.C1`, `test.C2`, `test.D1`, `test.D4` · `subtract.B1` row · § Parked (what was deliberately not written) |
| Brief extras | paid runs `test.B1`/`test.B4` → `agent.B3`; shared weak machine `test.B5`; fixture home and size `test.C6`, `test.B5`; seams `test.C5`; "is it done" ladder `test.A8`, `test.C1` → `coding.B3`; CI parity `test.C7`; never-touch list `test.B1`; evidence classes `test.D2`, `test.D3`; deletion fence `test.D4`; audit as routed act router clause + `test.D1`; signals § Router and gate |

## Parked — no evidence yet, each with its reopen trigger

| Candidate | Why not now | Reopen if |
|---|---|---|
| Committed `.only(` / `fit(` detector | 0 hits in 425 files | one reaches a commit |
| Snapshot-test discipline | no snapshot suite in the sample | a re-recorded snapshot hides a regression |
| Mock-depth rule (mock only owned edges) | covered in effect by A3, A6, C5; no distinct incident | a test passes by asserting its own mock |
| Coverage targets, test pyramid ratios | invert R4 (they reward more tests) | never by percentage; only a measured untested regression class |
| Property-based / mutation testing as a floor | a tool choice, costly on a weak machine | a regression class that example tests structurally miss |
| Rust inline `#[cfg(test)]` gate signature | not path-detectable (D3) | a Rust test edit misses the rule in `second_hop_audit.py` |
| `[PRIVATE]` detector (a `._name` read on an imported object) | precision never measured; the raw count was noisy (top file 21 hits), and `test.A6` locates it by reading | a private-field pin ships past a review that ran the script |

## Adjacent findings — outside this plan's scope

- `payload/RULE-stack-akiNuxtCf.md` `stack.C8` cites "[[RULE-coding]] B5's ladder"; the ladder is `coding.B3` since the B3/B5 merge — stale address.
- `payload/RULE-pattern-core.md` address map says `pattern.A1-8`; the file has `A9`.
- `README.md` repository-layout block omits `METHOD-audit-frozen-reference.md`, though the bullet list names it.

## Handoff — for the session that executes this plan

Written from a session opened in another repository; nothing in `payload/`, `skills/`, `claude/`, `install.mjs` or `CHANGELOG.md` was touched. The only edits are this file and its row in `docs/index.md`. The working tree also carries another session's uncommitted work (Codex delivery plan and research, the `agent.A4`/`agent.B1` lines, their CHANGELOG lines, the Claude 5.5 plan); do not fold it into this change's entry.

**Sources:**
- Repo A audit record and fix plan: `/home/guest/aki/pj/aki-mcp-sv/docs/research/test-suite-audit-oct07.md`, `/home/guest/aki/pj/aki-mcp-sv/docs/plan/test-suite-fixes.md`; the preload: `/home/guest/aki/pj/aki-mcp-sv/test/setup.js`.
- Cross-repo sweep: test files found under `/home/guest/aki` by the D3 signature, excluding `node_modules`, `.git`, build output, a handoff copy of Repo A and a third-party Tauri reference tree; 425 files. Hits named in § Evidence and § Detectors: Repo B `app/Aki-Dev-Sync/scripts/tests/audit-ui-architecture.test.mjs` (6 temp dirs, no removal), `run/prx/test/clprx-config.test.mjs` (3 temp dirs, no removal), the vendored suite under `web/aki-gateway-js/source-9router/tests/` (live endpoints, `.real` tests reading a real app data dir, fixed sleeps), the `[AMBIENT]` hit in `pj/aiobox/desktop/src-tauri/src/provider/macros.test.mjs:1056`.
- E16 is reported by the commissioning session, not recorded in a file.

**Verification state:** verified 2026-10-07 — every count in § Evidence and § Detectors (commands run on the dev box), the gate's Edit/Write-only trigger (F5), the `AG_RULE_MAP` throw and router-regex coupling (F6), script enumeration (F7), every path in § Change sweep. Unverified: Python/Go detector precision (A2), the gate's effect on read rates (A1); the final size after step 1's deletion test.

## Amendments — executing session, 2026-10-07

The executing session re-ran the decision record against `METHOD-deep-think.md` and `METHOD-audit-subtraction.md` before writing. The shape (D1–D8) held; four deltas, each a subtraction or a correction:

1. **`test.D1` merged into the detectors item.** The draft's D1 ("auditing a suite is an audit") was pointer-only — `agent.B5`, `zero-trust.A`, `subtract.B2`, `docs.C2` — and its one unique clause, the scope lock, now opens `test.D1` "Detectors before opinion, on a locked scope". Shipped addresses: `test.D1` detectors + scope, `test.D2` what a green run proves, `test.D3` deleting a test. 24 → 23 items; `release.B7` points at `test.D2`, `zero-trust.B1` at `test.D1`.
2. **`[PRIVATE]` dropped to § Parked.** Unmeasured and noisy by the plan's own column; `test.A6` is located by reading.
3. **`test.B3` roots in `agent.B1`.** The "what you create, you remove" line ships in the same release, so the pointer skips the interim `agent.C5` wording.
4. **§ Adjacent findings fixed in the sweep.** `stack.C8`'s three `coding.B5` ladder references → `B3`, `pattern`'s address map → `A1-9`, `README.md` layout gains `METHOD-audit-frozen-reference.md` — each in a file the sweep already edited, under `CLAUDE.md`'s standard-over-legacy principle.

Measured deltas against § Detectors: `[EXIT]` 15 lines / 7 files / 2 repos on the day of execution (Item 6 explains both directions). Everything else matched.

## Amendment — owner review, 2026-10-07

Owner intent, restated: "hạn chế tối đa việc viết test" — fewest tests, no junk or duplicate tests, no ad-hoc file names or folders, no real-data impact, no test that proves nothing. The 23-item file restated each check across groups, so it was rebuilt to 12 items under a new root (write as few tests as possible): A Fewest tests · B Side effects · C Verdict · D Suite audit. New: `test.A1` (no new test by default) and `test.A3` (no new test file/folder when an existing one fits). Address map old → new: C1→A1, C2→A2, C3→A3, B1–B3 kept, B4→B1, A1/A3/A6→C1, A2/A4→C2, A5/A7/C4→C3, D2→C4, D1 kept, D3→D2; every pointer, `test_lint.py` tag and corpus-map row follows. Same pass: `aki-route-guard` matches `TEST_DIR` against the cwd-relative path (an absolute path under a `tests/` parent gated every file), and `second_hop_audit.py` does the same with the transcript's `cwd`.
