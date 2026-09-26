# Multi-CLI Permission & Allowlist Standard

## The fact

Agent Skills (`SKILL.md`) frequently contain deterministic Python scripts (e.g. `scythe.py` format lint, `council_verify.py` gate validation) meant to run unattended. When an agent CLI/IDE executes these scripts via shell/command tools, platform security policies prompt the user for permission unless pre-allowed in the platform's configuration.

Each AI developer environment implements its own permission schema, syntax, and configuration path:

Installer: `lib/permissions.mjs` — one adapter per rule dialect, fed by one inventory (every `skills/*/scripts/*.py` × the skill roots that harness reads × absolute and `~/`-literal renderings × the platform's Python launchers). Every rule names one exact script; none allows the interpreter as a whole.

| Platform | Config written | Rule written | Matcher | Status |
|---|---|---|---|---|
| **Claude Code** | `<profile>/settings.json` | `Bash(python3 /abs/…/scythe.py*)` + `~/` rendering | `*` glob on the raw string, **no `~` expansion** | verified (docs + issue #18160) |
| **Antigravity CLI / IDE** | `~/.gemini/antigravity-cli/settings.json`, `~/.gemini/settings.json` | `command(python3 /abs/…/scythe.py)` | literal string prefix, no glob | measured on CLI (§1.2) |
| **Kiro CLI 3.x** | `~/.kiro/settings/permissions.yaml` (marker block) | `match: ["python3 /abs/…/scythe.py*"]` | glob on the whole command, no regex | mechanism verified; full-path match unverified |
| **Codex CLI** | `~/.codex/rules/akidevrule.rules` (owned file) | `prefix_rule(pattern = ["python3", "/abs/…/scythe.py"], decision = "allow")` | token prefix, trailing args free | syntax verified; `~` expansion unverified |
| **Cursor CLI** | `~/.cursor/cli-config.json` | `Shell(python3:/abs/…/scythe.py*)` | first token + `:args` glob | syntax verified; full-path args example unverified |
| **OpenCode** | `~/.config/opencode/opencode.json` | `permission.bash["python3 /abs/…/scythe.py*"] = "allow"` | `*`/`?` glob on the full command, last match wins | verified |
| **Grok CLI** | — | — | no file-based shell allowlist found (xAI `grok-build`, community `grok-cli`) | nothing written |
| **Ollama** | — | — | a model server; no agent, approvals or skills | not applicable |

Sources: `code.claude.com/docs/en/permissions`, `github.com/anthropics/claude-code/issues/18160`, `kiro.dev/docs/cli/v3/permissions/`, `developers.openai.com/codex/rules`, `cursor.com/docs/cli/reference/permissions`, `opencode.ai/docs/permissions/`, `github.com/xai-org/grok-build` (permissions guide), `github.com/ollama/ollama` — read 2026-09-25.

---

## 1. Platform Details & Configurations

### 1.1 Claude Code
- **Path**: `<profile>/settings.json` for every detected `~/.claude*` profile.
- **Semantics** (`code.claude.com/docs/en/permissions`): a bare `*` in a `Bash` rule matches any sequence including `/` and spaces; `**` adds nothing. Matching runs on the raw command string **before** shell expansion, so a rule written `~/.claude/skills/…` never matches an invocation the model wrote as `/home/<you>/.claude/skills/…` (issue #18160). Releases before this one wrote only the `~` directory glob — the reason skill scripts still prompted. Both renderings are now written per script.
- The trailing `*` has no leading space so a call with no arguments matches too.

### 1.2 Google Antigravity (AGY CLI, IDE, Desktop)

Three shapes that look plausible and are not real on this platform, listed because they were previously documented here and still circulate: the key `nonWorkspaceFileAccess` (does not exist), `*`-glob `command()` rules (the `*` is a literal character), and `Read(//…/**)`/`Write(//…/**)` (Claude Code syntax). Verified empirically against live agy **CLI** 1.1.16 (`docs/research/agy-permissions-wrap-bias-aug21.md`, T1–T4, T7, T8, T8b, T9) and against `antigravity.google/docs/cli/settings`; the IDE/Desktop surface shares the documented schema but its matcher was **not** separately tested — treat IDE claims below as inferred.

- **Paths**:
  - CLI: `~/.gemini/antigravity-cli/settings.json`
  - Global IDE/Desktop: `~/.gemini/settings.json`
- **Matcher semantics (measured on CLI, T8/T8b/T9; IDE inferred): literal string-prefix — no glob expansion, no tilde expansion.** `command(python3 ~/.gemini/config/skills/*)` never matches a real invocation because `*` is compared as a literal character. The tilde is not special in either direction: a rule written with a literal `~` **does** match an invocation written with a literal `~` (measured, V1 2026-08-21). What fails is a *rendering mismatch* between rule and command — which is the normal case, because a skill's literal command line carries `~` while a generated pre-allow carries the expanded path. Emit both renderings per script rather than relying on the agent to expand. `command(git log)` matches `git log --oneline --all` (prefix + trailing args is the only flexibility the matcher grants). So a `command()` rule is one exact script path per rule, written once per rendering the caller might use — never a wildcard, and never a single rendering assumed to be the one that shows up.
- **Real permission keys** (official + measured):
  - `allowNonWorkspaceAccess` (boolean, global, default off) — gates non-workspace file writes. `true` → write outside the workspace succeeds promptless (T1); `false`/absent → the write tool refuses (T2). This is the actual "Non-Workspace File Access" toggle the Settings UI shows; there is no separate JSON key for it.
    - **It is not a general sandbox (measured in headless `-p`, 2026-08-21, agy 1.1.17, Linux, 2 repeats per case with `stream-json` tool names captured; interactive/IDE not measured).** With the boolean **off**, a write under `$HOME` is denied but a write anywhere under `/tmp` succeeds — the same `write_to_file` tool in both directions, so the gate follows the **path**, not the tool and not `--add-dir`. Do not reason about it as "agy cannot write outside the workspace"; temp locations stay writable.
    - **A scoped `write_file(<dir>/)` rule is sufficient on its own** with the boolean off (measured: a write into the rule-covered `~/.aki/agent-council/` succeeded, an uncovered `$HOME` path was denied 2/2). The boolean is not a prerequisite for a scoped lane.
    - **`trustedWorkspaces` is not a write allowlist** — `/home/guest` was listed in it while a write directly under `$HOME` was still denied. Workspace-open trust only, now measured rather than inferred.
  - `agentMode`, `trustedWorkspaces` — real keys present in live config; `trustedWorkspaces` semantics are workspace-open trust, not a path allowlist (sources ambiguous — treat as unverified beyond that).
- **Scoped file-action syntax**: `read_file(<path>)` / `write_file(<path>)`, not the `Read()`/`Write()` glob syntax Claude Code uses. Granting `write_file(<path>)` on a directory implicitly grants `read_file` on the same path per official docs.
- **Schema** (measured end-to-end 2026-08-21: V1 headless `/akiflow` smoke created its session dir with 0 denials, V3 idempotency and survival-across-an-agy-rewrite both hold; V2 measured the same day — see the scoped-rule bullet above — `docs/plan/done/antigravity-non-workspace-permissions.md` §5):
  ```json
  {
    "permissions": {
      "allow": [
        "command(python3 /Users/<you>/.gemini/config/skills/akiflow/scripts/council_open.py)",
        "command(python3 ~/.gemini/config/skills/akiflow/scripts/council_open.py)",
        "command(python3 /Users/<you>/.claude/skills/akiflow/scripts/council_open.py)",
        "command(python3 ~/.claude/skills/akiflow/scripts/council_open.py)",

        "write_file(/Users/<you>/.aki/agent-council/)",
        "write_file(~/.aki/agent-council/)",
        "read_file(/Users/<you>/.aki/akidevrule/)",
        "read_file(~/.aki/akidevrule/)"
      ]
    }
  }
  ```
  The block above shows the **full rule set for one script** (`council_open.py`) plus the scoped file actions; every other `skills/*/scripts/*.py` repeats the same four lines. A single-rendering, single-root version of this block is what V1's first run proved insufficient — do not copy one line and expect a match. The installer writes four rules per script: both skill roots (`~/.gemini/config/skills/…` and `~/.claude/skills/…`, since a `SKILL.md` deployed byte-identical to several roots shows the Claude path in its literal examples) × both renderings (expanded and tilde-literal). Each is still one exact script path with no glob; the redundancy removes the whole class of "the agent wrote the path the other way" denials. On Windows the interpreter token multiplies the same way (`py -3`, `python`, `python3`), since a rule naming an interpreter the platform lacks never matches.
- **Two denial gates, three signatures — headless `-p` only (measured T8/T8b, plus `write_file` denials 2026-08-21 on agy 1.1.17, Linux; corroborated by the vendor's headless doc). Interactive CLI/IDE prompt instead and are a different path — unmeasured, do not carry these rows over.**
  - *Soft-deny — an approval-needed tool with nobody to ask* (shell commands default to **Ask**): the run **continues and exits 0**, a notice naming the tool goes to stderr, and structured output shows `status: "SUCCESS"` with an empty `response`. A caller that does not check reads a denied call as a clean run.
  - *Hard-deny — a workspace-boundary refusal* (`allowNonWorkspaceAccess` off, path uncovered): the CLI ends the turn at the permission check with an empty `response`, so **the model never learns of the denial** and cannot report it — a prompt contract asking the model to announce a permission failure is out of scope for this path. **Which non-SUCCESS envelope carries it is not stable, and the reason does not always land in the JSON:** `status: "ERROR"` puts it in `error` (`permission check failed for write_file "…": user denied permission for write_file(…)`), while `status: "CANCELED"` leaves `error` **empty** and writes the verbatim reason to **stderr** instead (`jetski: no output produced — a tool required the "write_file" permission that headless mode cannot prompt for, so it was auto-denied.`). Both shapes were observed on the same trap, same tier, minutes apart, 2026-08-21.
  - **Reliable caller check:** `status != "SUCCESS"` **OR** (`SUCCESS` with an empty body). Testing only one shape misses the other gate entirely. **Key on `status`, never on the presence of the `error` field** — a caller that treats an empty `error` as "no denial happened" reads a `CANCELED` refusal as a silent failure and blames the model for it, which is exactly the defect this suite's trap 4 shipped with. This is also the vacuum the helpful/shortcut bias tends to fill with a fabricated answer (`docs/plan/done/agy-helpful-bias-containment.md`).
- **Per-invocation fallback (measured, T3):** `agy --add-dir <path> -p "<prompt>"` brings a directory inside the workspace boundary for that one run, zero settings mutation. Use this in ad hoc/one-shot invocations instead of widening standing permissions.
- **`--dangerously-skip-permissions`**: approves everything, including sandbox bypass (agy issue #36). Not a standing mechanism — acceptable only for a deliberate, isolated one-shot the operator explicitly chose.

### 1.3 Kiro CLI
- **Path**: `~/.kiro/settings/permissions.yaml` (CLI 3.x / IDE 1.x; superseded the regex `toolsSettings.shell.allowedCommands`). Evaluation deny > ask > allow, most restrictive scope wins.
- **Managed block**: the installer owns everything between `# >>> akidevrule managed` and `# <<< akidevrule managed` at the end of the `rules:` list and regenerates it each run; items outside it are the user's. Unmarked items from older releases are removed only when every `match` line is one the installer owns.

### 1.4 Codex CLI
- **Path**: `~/.codex/rules/*.rules` (Starlark execpolicy), not `config.toml` (that holds `approval_policy`/`sandbox_mode`). akidevrule writes its own `akidevrule.rules` and regenerates it whole. Precedence forbidden > prompt > allow.

### 1.5 Cursor CLI
- **Path**: `~/.cursor/cli-config.json` → `permissions.allow`. `Shell(<first token>)` alone allows every invocation of that command, so the installer always uses the `:args` form. The Cursor IDE's own `~/.cursor/permissions.json` is a separate pipeline with no published schema — not written.

### 1.6 OpenCode
- **Path**: `~/.config/opencode/opencode.json` → `permission.bash`, an object of glob → `allow|ask|deny`. Last match wins, so owned keys are appended after the user's; a string value (`"ask"`) is preserved as the `"*"` key. A JSONC file that does not parse as JSON is skipped and reported, never rewritten.

### 1.7 Grok CLI, Ollama
- No file-based command allowlist exists to write (§ table). Skills still deploy to `~/.grok/skills/`; script runs there are approved interactively.

---

## 2. Pre-allow Principles for akidevrule

1. **Least privilege, uniformly**: one rule per exact script path on every platform — never a directory wildcard, never the interpreter alone. The only glob used is the trailing argument wildcard, and Antigravity (no glob at all, §1.2) gets the bare prefix.
2. **Owned entries only**: an entry is the installer's when it points a Python launcher into `<aki-skill>/scripts/`, or is a directory-glob rule from an earlier release; those are replaced each run, everything else is preserved. `install.mjs` must preserve existing user permissions, settings keys, and comments/formatting where possible, only inserting or updating the managed entries idempotently — and must tolerate agy re-serializing `settings.json` after a session and dropping false/default-valued keys (observed live, `docs/research/agy-permissions-wrap-bias-aug21.md`).
3. **Multi-surface Portability**: A `SKILL.md` deployed unmodified to several CLI roots (`docs/ref/agent-skills-standard.md`) cannot hardcode one CLI's absolute script path as its literal invocation example — a Claude-rooted path silently fails Antigravity's per-root permission prefix even though the file exists at that path on disk. `skills/akiflow/SKILL.md` § Harness notes now states which root to substitute per harness.
