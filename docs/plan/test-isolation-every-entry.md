# Test isolation must hold on every entry, not only the suite command

Status: proposed 2026-10-23, not executed. Evidence: aki-mcp-sv `docs/plan/test-bare-run-isolation.md` (incident, measurements, phase 1 already applied there).

## Evidence

| # | Finding | Source |
|---|---|---|
| F1 | A bare single-file run (`node test/rule-gate.test.js`) skipped the suite preload and wrote one-line stubs over the real `~/.aki/akidevrule/RULE-coding.md`, `RULE-pattern-core.md`, `RULE-docs.md` and deleted `route-map.json`; every session on the machine loaded empty rules and the route guard lost its map until a reinstall 7 minutes later. | aki-mcp-sv incident 2026-10-22 22:51 |
| F2 | The suite had exactly the shape `test.B2` prescribes (one `--import` preload giving a fresh HOME/TMP). The rule and its detector both certified it: `skills/akiflow/scripts/suite_lint.py:81` treats a preload as making `[HOMEREAD]` and cleanup tags moot. | `payload/RULE-test.md` B2, `suite_lint.py:81` |
| F3 | Single-file runs are routine, not misuse: the session that caused F1 ran five test files that way in one turn. A rule telling agents to use the suite command would be skipped the same way. | aki-mcp-sv council room 2026-10-22, lead #3 |
| F4 | A second leak the preload did not cover: the app under test exports its real data dir (`AKI_MCP_DATA_DIR`) into its own env, and every shell it starts inherits it. Even the full suite, run from such a shell, read the real `setting.json` (4 of 60 tests failed on it) and one test would have rewritten the live task registry. `B2` lists `HOME`, `USERPROFILE`, `TMP*`, `XDG_*` only. | aki-mcp-sv measurement 2026-10-23 02:25 |
| F5 | Blast radius is machine-wide and partly irreversible: the rule corpus every agent loads, a live task registry. `proportion.B1` protects it on blast radius alone. | F1, F4 |

Root cause: `B2` makes isolation a property of one command, not of every way a test process can start, and names a fixed variable list instead of "everything the code under test reads as a path".

## Changes

**C1 · `test.B2` reworded** (same address, same group). Proposed text:

````markdown
### B2. Isolation by shape, once, at the suite boundary — reached by every entry
One preload or global setup (`node --test --import`, `setupFiles`, `conftest.py`, `TestMain`) gives every test process and every child it spawns a fresh `HOME`, `USERPROFILE`, `TMPDIR`/`TMP`/`TEMP` (plus `XDG_*`, `APPDATA`/`LOCALAPPDATA` where read), drops every inherited variable the code under test reads as a path (the project's own env prefix: a shell started by the running app carries its real data dir), and is removed on exit even after failure. Every entry reaches it: where one test file can run without the suite command and the runner does not load the preload itself (`node x.test.js`; pytest's `conftest.py` is loaded either way), that file's first import is the preload, and the preload fails a test file that does not bind to it. Production code resolves user paths at call time, never cached at import.
````

Meaning: isolation is judged by the command an agent will actually type, not the one in `package.json`; the preload owns clearing app-specific path overrides, not only OS ones; a file that forgets the binding fails the suite instead of passing silently. Root law stays `pattern.A8` (one flow made natural); this is its domain application.

**C2 · `test.B3` residue widened.** Add to the residue sentence: the real HOME's dot-dirs the project's code reads or writes (`~/.aki/…`, `~/.claude`, app data) hash the same before and after a run. That check is what caught F1 and F4; `git status` and the temp root alone did not.

**C3 · `suite_lint.py` detectors.**
- `[UNBOUND]` CERTAIN: the suite preloads a setup module through the runner command (`--import`, `--require`) and a test file's first import/require is not that module. Today's `preload` flag stops suppressing `[HOMEREAD]` and `[CLEANUP-FINALLY]` for an unbound file.
- `[ENVLEAK]` SUGGESTED: source outside the tests reads `process.env.<NAME>` / `os.environ[...]` for a name ending in `_DIR`, `_HOME`, `_PATH`, `_FILE` or `_ROOT`, and the preload neither deletes nor sets it.
- Fixture cases: one bound and one unbound file, one preload that clears the prefix and one that does not; seen red, then green (`test.C1`).

**C4 · Router signals** (`skills/akirule/SKILL.md`, `test` row): add the concepts "running one test file by hand / bare test run" and "inherited env / env leak", EN + VI (`chạy lẻ một file test`, `biến môi trường kế thừa`).

Not changed: `test.A1` already says write as few tests as possible; no new rule about how agents should run tests (F3: guidance is skipped; the shape in C1 makes the safe run the only run).

## Rejected

- An agent rule "run single tests only through the documented command": F3, and it costs every session a line to prevent what C1 prevents by shape.
- Blocking bare test commands in a harness or tool layer: each harness would need its own copy, and native shells bypass it.
- A per-file "set your own HOME when you write it" rule: judgment, and F1's author relied on the preload exactly as `B2` told them to.

## Sweep (per `CLAUDE.md` § Change sweep)

`payload/RULE-test.md` (B2, B3) · `skills/akiflow/scripts/suite_lint.py` (+ its header tag list, line 6) · `skills/akirule/SKILL.md` (test row signals) · `docs/arch/corpus-map.md` (no address change expected; confirm) · `README.md` if it lists suite_lint tags · `CHANGELOG.md` entry with evidence, root cause, mechanism, rejected options.

## Verify

1. `suite_lint.py` on aki-mcp-sv today: `[UNBOUND]` on exactly the 13 test files that still lack the import (phase 2 there), none on the 30 bound ones; `[ENVLEAK]` none (its preload drops `AKI_*`/`MCP_*`).
2. Fixture red/green for both detectors.
3. `python3 skills/akiflow/scripts/scythe.py` / `release_lint.py --latest` clean on the changed files.

Reopen if: a runner in a supported stack loads setup files on single-file runs by itself (the binding clause then names it as an exception, like pytest), or `[ENVLEAK]` proves noisy on two or more real suites.
