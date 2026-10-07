# Test Rules

<!-- Address map: test.A1-3 · test.B1-3 · test.C1-4 · test.D1-2 -->

**Tier: Contextual, gated** — routed by `akirule` when a task creates, changes, reviews or audits an automated test, fixture or harness, or judges whether a test result can be trusted; on Claude Code `aki-route-guard` denies the first test-file edit of a session until this file was read. A test is code: `coding` and `pattern` apply in full and are not restated. Root: **write as few tests as possible** — a test that is wrong, redundant, touches what it does not own, or proves nothing is worse than no test, because it looks like safety.

## A. Fewest tests — a test earns its place, its file and its name

### A1. Default: no new test
Write one only when the owner asks, or when a behavior's regression costs someone and no static read, typecheck or existing test already settles it (`coding.B3`); never for a language or framework guarantee, a constant equal to itself, or a state the pinned facts rule out (`coding.C1`); no coverage target. A probe written to verify one change is scratch (`agent.C5`): delete it, never promote it into the suite.

### A2. One behavior, one owner test
Search the suite before writing (`pattern.B2`); a behavior already tested through the same entry gets its existing test extended, never a second test; tests at two layers stay only when each catches a failure the other cannot.

### A3. No new file, folder or seam when an existing place fits
Add the case to the module's existing test file; a new test file, directory, helper, fixture dir, runner config or test dependency only when none exists, placed and named by the repo's existing convention. A name states the behavior and condition it proves (`rejects write outside roots`) — never more than the body asserts, never a ticket, phase or fix number (`pattern.A7`), no change-history comments (`coding.B4`). Fixtures are the smallest literal input that crosses the boundary, under the suite's own fixture dir. Production code gets no `NODE_ENV === 'test'` branch and no test-only export; a seam is a parameter whose default is the production value, added only for a measured cost (time, nondeterminism, side effect).

## B. Side effects — a test never acts on what it does not own

### B1. Forbidden targets — reading counts
The real `HOME` and its dot-dirs (app data, `~/.gitconfig`, `~/.ssh`, browser profiles, agent config), the system temp root by literal path, the repo tree outside the suite's fixture dir, global git config, keychain, clipboard and OS settings, real network hosts, fixed ports (`listen(0)` and read the port), processes and apps the user runs, paid APIs and quota (`agent.B3`); no real personal data, credentials or production dumps in fixtures. A test that needs a live service lives in a separately named suite (`*.live.*`) outside the default command and runs only on explicit request.

### B2. Isolation by shape, once, at the suite boundary
One preload or global setup (`node --test --import`, `setupFiles`, `conftest.py`, `TestMain`) gives every test process and every child it spawns a fresh `HOME`, `USERPROFILE`, `TMPDIR`/`TMP`/`TEMP` (plus `XDG_*` where read), removed on exit even after failure; production code resolves user paths at call time, never cached at import.

### B3. What a test creates, it removes — in `finally`/`after`, even on failure
`agent.B1` applied to a suite: temp dirs through the runner or OS temp API (`mkdtemp(join(tmpdir(), prefix))`, `tmp_path`, `t.TempDir()`), servers closed, child processes killed on failure and timeout, timers and watchers cleared; after a full run `git status --porcelain` and the temp root match the state before it.

## C. Verdict — a pass means exactly what the test exercised

### C1. Seen red, then green, through the public entry
A new or changed assertion is trusted only after it failed once against a wrong input or expectation (`git diff` of the code under test clean afterwards); the test calls the code through its public API — never a copy of it, a regex over its source or a private field; expected values are literals or come from an independent source, never from the implementation's own constant or algorithm.

### C2. No vacuous or machine-dependent assertion
Never the sole check: `Array.isArray(x)`, `typeof f === 'function'`, `assert.ok(obj)`, a bound any output meets — assert the exact value, shape or count from a seeded non-empty input. No assertion under `if (<ambient state>)` (env var, file existence, binary on `PATH`, platform): make the condition a fixture, or skip through the runner's skip API with a reason the report shows.

### C3. Stable and complete
Independent checks are separate runner cases, never one linear script whose first throw hides the rest; no `process.exit()`/`sys.exit()` in a test; wait on the signal (`once(emitter, 'close')`, a polled status with a deadline), never a fixed sleep; no fixture hardcoding a value that moves with time or release (version, date, count) — read it from its single source (`pattern.A1`) or inject the clock.

### C4. A green run proves only what ran
CERTAIN: this command exited 0 on this machine at this commit. A mock proves the caller's assumption, a fake service nothing about the live one, an empty database `CREATE` and not the upgrade (`release.B5` point 4); "the behavior is covered" stays SUGGESTED until C1–C3 hold for the tests claiming it, and the residue is reported unverified (`coding.B3`). A suite report carries the command, exit code, skipped count with reasons and the B3 residue check.

## D. Suite audit — reports, never fixes

### D1. Detectors before opinion, on a locked scope
Auditing a suite is an audit (`agent.B5`): scope locked by glob over the test files plus the preload and runner config (`zero-trust.A`); run `skills/akiflow/scripts/test_lint.py` over that set and attach its output first (`zero-trust.B`) — CERTAIN tags are verdicts, SUGGESTED tags candidates for judgment; the `subtract` passes pointed at tests are mandatory, so redundant and vacuous tests are listed for removal (A1, A2, C2).

### D2. Deleting a test passes the fence
`subtract.B3`: find the regression it was written for (`git log -S`) before removing it; reason unknown → SUGGESTED with that phrase, never removed by the audit; security and invariant tests (auth, SSRF, path traversal, lockout, data-loss guards) are load-bearing until proven otherwise.

## One-line reminder

Fewest tests: each one could have failed, touched nothing it does not own, and earned its place — anything else is noise that looks like safety.
