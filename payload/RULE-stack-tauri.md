# Tauri v2 + Rust Stack Rule

<!-- Address map: tauri.A1-2 · tauri.B1-8 -->

## Scope — when this applies
Every Aki desktop project built on Tauri v2 + Rust (backend commands) + any JS frontend framework. Generic lessons only — project-specific facts (titlebar height, bundle naming, etc.) stay in that project's own `CLAUDE.md`.

## A. Never block the UI

### A1. Never block the UI (ABSOLUTE — zero exceptions, no case-by-case judgment calls)

This bug class recurs constantly across Aki's Tauri projects because it is easy to miss in review: a `#[tauri::command]` that runs a **blocking subprocess wait** (`Command::output()`, `.wait()`, `.wait_with_output()`, an SSH round-trip, a poll-and-sleep loop) or a **blocking network call** directly on the thread that dispatches the IPC call. Tauri does not put a plain `fn` command on a separate thread for you — a slow subprocess or a dead network directly freezes window repaint and all input for however long that call takes, with zero partial-progress feedback to the user. Two concrete real-world instances: an app's statusline-customizer auto-install froze the whole window on modal-open because its host-check ran a blocking SSH probe synchronously; a `check_for_updates` command ran a blocking `curl` call on every single app launch with no timeout.

**The rule, no exceptions:** any `#[tauri::command]` whose body runs a subprocess or a blocking network call **must** be `async fn`, and the blocking call **must** be wrapped in `tauri::async_runtime::spawn_blocking(move || { … }).await.map_err(|e| format!("spawn_blocking panicked: {}", e))?`. Never call the blocking function directly inside the `async fn` body "just this once because it's quick" — network and remote-host calls have no fast-path guarantee; a bad connection is exactly the case that must not freeze the app.

**Before adding or reviewing any `#[tauri::command]`**, ask: does this call a subprocess, SSH, or the network? If yes, `spawn_blocking` goes in from the first draft, not as a follow-up fix. Audit with `grep -n "#\[tauri::command\]" -A2 src-tauri/src/*.rs` before closing out any Tauri-touching task, and check every new/changed command against this rule.

Plain, fast, synchronous local file I/O (reading a small JSON/config file, a single `Path::exists()` check) is **not** this bug class and does not need `spawn_blocking` — the line is "does this call wait on a subprocess or the network," not "is this technically a syscall."

### A2. Subprocess PATH-resolution race at cold start (ABSOLUTE — apply to every spawned CLI binary)

Any Rust code that spawns a shell to invoke a user-installed CLI (`Command::new("sh"/"zsh"/"bash")`, or over `ssh host sh`) and relies on `zsh -lc`/`bash -lc` login-shell PATH resolution to find that binary is racing the user's shell rc/profile (nvm, path_helper, zinit, etc.) — which may not have finished sourcing yet if the subprocess is spawned right at/near app cold-start. Symptom: intermittent `exit=127 command not found: <bin>` that self-heals within minutes and is NOT reproducible when testing the identical command manually a bit later — easy to misdiagnose as a CLI-version or auth problem instead of a timing race.

**Fix pattern**: resolve the binary via static, well-known install-directory candidates FIRST (a `[ -x "$path" ]` file-existence test has zero dependency on rc-sourcing timing), falling back to `command -v` / login-shell PATH lookup only if none match — do this in ONE shared preamble injected at the single funnel where scripts are dispatched, not patched ad hoc at each call site. Seed the candidate path list for the platform(s) the app actually ships for first (e.g. macOS-only apps: `~/.local/bin`, `~/.claude/local`, `/opt/homebrew/bin`, `/usr/local/bin` for Claude Code specifically) — extend the list only when a new platform build actually ships, rather than guessing paths for platforms not yet supported.

## B. Boundary & config

### B1. Titlebar sacred boundary
`"decorations": false` + `"transparent": true` → no native titlebar. All `position: fixed/absolute` elements **must** start at `top: var(--titlebar-h)` (or the app's titlebar height), never `top: 0`. Window controls (drag/minimize/close) via JS `@tauri-apps/api/window`.

### B2. IPC capability silent fail
Every Tauri command AND window API call must be granted in `src-tauri/capabilities/default.json`. Missing → **silent no-op**, no error, no log. Window needs: `core:window:allow-minimize`, `core:window:allow-close`, `core:window:allow-start-dragging`.

### B3. Serde fields + old JSON
New fields on structs deserialized from persisted JSON need `#[serde(default)]` or old records silently drop the field instead of erroring.

### B4. `#[cfg(target_os = "macos")]` scoping
Declare variables **inside** the cfg block. Declared outside but used only inside → unused-variable warning on non-macOS builds.

### B5. Version SSOT
`package.json` only. `tauri.conf.json` → `"version": "../package.json"`. Never hardcode version in `tauri.conf.json`. `Cargo.toml` has its own crate version (separate concern) and **must always be bumped to the same number in the same commit** — a mismatch between `package.json` and `Cargo.toml` is the same class of bug as a bad tag. See [[RULE-release]] § Version string format for the absolute no-`v`-prefix rule that governs both fields and every git tag.

### B6. Salient target context up front in the project CLAUDE.md
State the few decision-shaping target facts the agent must grasp without inferring — first of them the platform(s) the app actually ships to (drives shortcut glyphs ⌘ vs Ctrl, path shapes, packaging, the A2 candidate list). Surface the load-bearing few, not an inventory; when a platform-specific string is needed and the target is undeclared, ask — don't guess.

### B7. macOS: a sidecar that works in Terminal can be denied inside the shipped `.app`

Symptom first: `git`/`rsync`/`ssh`/a CLI agent runner spawned by the backend (`std::process::Command`, `tauri-plugin-shell`, a PTY) fails only inside the bundled app — silent `EPERM`, or a consent dialog naming *your app* for a folder the user never associated with it. Cause: TCC — Transparency, Consent and Control, the macOS subsystem behind every "X would like to access your Documents" dialog — judges a child process by the **responsible process** at the head of the chain, inherited across `fork`/`posix_spawn`. For a shipped Tauri app that is the `.app` bundle, never the user's Terminal — so the child inherits your bundle's permission state, not the terminal's freedom, and every grant is charged to your bundle identity.

Three switches, routinely confused — pick by what each actually controls:
- **Full Disk Access** (`kTCCServiceSystemPolicyAllFiles`) — the top of the decision chain and a superset, not a peer: if the responsible app holds it, protected locations are readable with no per-folder prompt. Request it only when the app's reach is genuinely unbounded (backup, indexing); for a project-scoped tool it is far more privilege than the task needs.
- **Files & Folders** (`kTCCServiceSystemPolicyDocumentsFolder`, `…DesktopFolder`, `…DownloadsFolder`, plus separate removable/network-volume entries) — the least-privilege path, consulted only when the responsible app has no FDA; with no entry, first access prompts. A refusal is **sticky**: one "Don't Allow" persists as a denial with no re-prompt, so the user's reflexive dismissal looks like a bug in your app forever. Recovery is `tccutil reset` or **removing** the app's entry — flipping the existing toggle back on restores access but not prompting, so it does not reproduce a first-run.
- **Developer Tools** (`kTCCServiceDeveloperTool`) — **not file access.** It exempts the app from the system security policy when it *runs* software (unsigned/ad-hoc sidecars, local toolchains), i.e. Gatekeeper for what you spawn. It silences no file-consent dialog; reaching for it to stop folder prompts is the standard misdiagnosis and wastes a debugging session.

- **Scope every spawn.** Bind subprocesses, sidecars and filesystem probes to an explicit target (`cwd`, the project workspace, the app data dir). An unbounded walk from `$HOME` or `/` hits protected domains and turns into a prompt storm or a silent-`EPERM` storm — and per the sticky rule above, the damage outlives the run.
- **Ad-hoc signing loses the grant on every rebuild.** `codesign --sign -` (Xcode's "Sign to Run Locally") produces a new signature each build, and the authorization is tied to that exact build — so a permission granted yesterday is simply gone today, which reads as a random TCC bug. The fix is a **stable self-signed certificate**, which keeps grants across rebuilds; `tccutil reset All <bundle-id>` only clears the stale state, it does not prevent the next loss.
- **Scope limit — this chain governs consent-based reads.** It does not apply to paths the user picked in an Open/Save dialog or by drag-and-drop (user intent grants access directly), and Apple's own analysis excludes file *writes* from it. A write-only or file-picker-driven sidecar failing is a different diagnosis; don't reach for these switches first.

When you cannot tell which switch fired, watch it rather than guess: `log show --predicate 'subsystem == "com.apple.TCC"' --last 5m` prints the `AttributionChain` (which process was held responsible) and the request's result. Claims and sources: `docs/research/macos-tcc-tauri-boundary-aug21.md` in the akidevrule repo. Full lookup (switches + rebuild/DR mechanism): `~/.aki/akidevrule/docs/ref/fact-macos-codesign-tcc.md`.

### B8. Windows: a cross-compile proves it builds, never that it runs

Symptom first: an app cross-built for Windows on macOS/Linux (`cargo xwin check`, `cargo check --target *-pc-windows-msvc`) passes every check and fails for the first Windows user — `Access is denied (os error 5)` on a file the app owns, a path shown as `\\?\C:\…`, a CLI that is found but cannot start (os error 193). A compile check never executes Windows file, path or process semantics; only a native test run does, so a change touching files, paths or processes runs the suite on Windows (VM or machine) before it ships (`coding.B3` rung 5).
- **Native run from the build host:** `cargo xwin test --no-run --lib --target <arch>-pc-windows-msvc --message-format=json` → the last `executable`, run in the VM. Three traps: (1) a Tauri test exe imports `comctl32!TaskDialogIndirect`, present only in Common Controls v6, and has no manifest → dies at load with `0xC0000139` before any test runs; put `<exe>.manifest` declaring `Microsoft.Windows.Common-Controls` `6.0.0.0` beside it, in a fresh directory each run (Windows caches the manifest decision per exe path); (2) start the exe directly, never through `cmd /c` — a parent whose command line names the exe reads as a second instance to process-table code; (3) pass only on the harness summary line (`test result: ok. N passed; 0 failed`), never on exit code: a test that ends its own process (its own pid inside a Job Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`) exits 0 with the rest of the suite unrun.
- **Append handles cannot truncate:** `OpenOptions::append(true)` grants `FILE_GENERIC_WRITE` minus `FILE_WRITE_DATA`, so `set_len` on it is `os error 5` on Windows and silently fine on unix. Empty through a `write(true)` handle, then open for append.
- **Verbatim paths:** `std::fs::canonicalize` returns `\\?\C:\…` and `\\?\UNC\server\…`; strip the prefix (`\\?\UNC\` → `\\`) before showing a path or comparing it with one a person typed. Tests build expected paths with `Path::join` and compare `display()`, never a literal `/`.
- **npm global bins are shims, not symlinks:** `%APPDATA%\npm\<bin>` (sh script), `<bin>.cmd`, `<bin>.ps1`, the package at `%APPDATA%\npm\node_modules\<pkg>` (a junction under `npm link`). Find the package through that `node_modules` entry and check its `package.json` `name`; walking up from the shim to "the nearest `package.json`" can land in the user's home folder.
- **Only four extensions start:** `std::process::Command` runs `.com`, `.exe`, `.bat`, `.cmd`; resolving a bare name through every `PATHEXT` entry can pick a `.ps1` or `.js` → os error 193. Filter `PATHEXT` to those four, keeping its order.
- **A test owns the processes it signals:** one that needs a live pid spawns a sleeper child (`ping -n 120 127.0.0.1` on Windows, `sleep 120` on unix) and kills it on drop (`test.B3`), never its own pid.
