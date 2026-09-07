# Version-status check at akidevrule startup

Executed 2026-09-01.

## Problem

`claude/hooks/aki-update-check.py` (SessionStart hook) compared the raw first `## ` heading of the installed vs. remote `CHANGELOG.md`. Both always start with `## [Unreleased]` (release.A5's normal working state), so the two heads matched on every run and the hook silently reported "current" regardless of the real version gap. The notify-only update mechanism had never actually fired.

## Approach

Ported aki-mcp-sv's `scripts/update-check.js` algorithm (`parseChangelogVersion` / `cmpSemver`) to Python as one shared module, imported by both consumers so they can never classify a CHANGELOG differently (pattern.A1 SSOT):

- **`claude/hooks/aki_version_check.py`** (new) — `parse_changelog_version` (regex `^##\s*\[(\d+\.\d+\.\d+)\]` over the file, multiline — naturally skips `[Unreleased]` since it has no numeric heading), `cmp_semver` (3-part numeric compare), `fetch_remote_changelog` (3s-timeout `urllib` fetch, `None` on any failure), `local_install_present` (both `CHANGELOG.md` and `index.md` present), and `classify_state` producing one of five states: `missing` / `current` / `update` / `ahead` / `unknown`.
- **`claude/hooks/aki-update-check.py`** (rewritten) — the "missing" check is a local file-stat run unconditionally, before the existing 24h/1h throttle gate, so a not-installed machine hears about it every session rather than once a day. The network-dependent branch (current/update/ahead/unknown) keeps the prior throttle timing. The update banner's delta list is now built by scanning remote entries with `cmp_semver` against the local version (skipping any `[Unreleased]` entry) instead of exact-string heading match, which is both correct and more robust to heading-format drift.
- **`install.py`** — imports the same module (`sys.path.insert` onto `claude/hooks/`, since neither is a package). Added `get_version_status()` (one-shot local-vs-remote check against `INSTALL_ROOT`), `print_version_check()` (backs the new `--check` flag: prints installed/latest/status, always exits 0, never installs), and `inspect_status()` now prints the same version comparison and returns whether the install is already current so `run_install()` can skip the y/n overwrite confirmation on a no-op reinstall (the sync itself still runs — only the scary prompt is skipped, since a same-version resync is idempotent and safe). `.version` gains a `version=<semver>` line (the just-installed CHANGELOG's own latest released version), keeping `installed=`/`commit=`/`branch=` unchanged.
- **`README.md`** § Update notifications — five-state table (condition × hook behavior × `--check` behavior), plus layout/mermaid/uninstall mentions of the new shared file.

## Explicitly not done (per the owner's scope)

No auto-pull, no auto-install, no new daemon/background service, no status JSON for other CLIs, no HTML panel, no `package.json` version field (this project has none), no change to `aki-mcp-sv` itself (its JS implementation was only the reference algorithm).

## Verification

Static reading plus scripted runs (scratchpad harness, not committed) against both files with monkeypatched `INSTALL_ROOT` / `fetch_remote_changelog` — no network dependency, no real install performed:

- `parse_changelog_version` on this repo's own `CHANGELOG.md` (`## [Unreleased]` on top) returns `2.7.0`, not `None`/`Unreleased`.
- Unit tests on `cmp_semver` and `classify_state` cover all five states plus the `None`-side no-claim case.
- End-to-end hook runs for all five states (missing / current / update / ahead / unknown) each produced the exact `systemMessage`/silence the state table specifies, exit code 0 in every case. A same-state re-run inside the 24h window made no second call to the (stubbed, assertion-guarded) network fetch, confirming the throttle still gates only the network-dependent branch.
- `install.py --check` run against the real installed `~/.aki/akidevrule` (v2.7.0) with no network access in this sandbox correctly reported `unknown (network/parse error)`, never `current` — the "never claim current on failure" guarantee holds.
- `inspect_status()`/`print_version_check()` unit-tested via a monkeypatched `get_version_status()` (no filesystem writes): `current` → returns `True`; `update`/`missing` → correct printed status and command.
- `python3 -m py_compile` on all three touched/added files.

Not run: a real `install.py` invocation (explicitly out of scope per the task) and a live network fetch against the actual public repo (sandbox has no outbound network — the `unknown` state is the correct, honest outcome for that condition, not a gap in the implementation).

## Decision

Action: `claude/hooks/aki_version_check.py` (new), `claude/hooks/aki-update-check.py` (rewritten), `install.py`, `README.md`, `CHANGELOG.md` — see the `Fixed`/`Added` entries under `[Unreleased]`.
