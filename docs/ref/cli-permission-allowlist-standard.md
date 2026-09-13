# Multi-CLI Permission & Allowlist Standard

## The fact

Agent Skills (`SKILL.md`) frequently contain deterministic Python scripts (e.g. `scythe.py` format lint, `council_verify.py` gate validation) meant to run unattended. When an agent CLI/IDE executes these scripts via shell/command tools, platform security policies prompt the user for permission unless pre-allowed in the platform's configuration.

Each AI developer environment implements its own permission schema, syntax, and configuration path:

| Platform | Configuration Path | Rule Syntax | Wildcard Support | Evaluation Order |
|---|---|---|---|---|
| **Claude Code** | `~/.claude/settings.json` | `Bash(python3 ~/.claude/skills/*)` | `*` only | Deny → Ask → Allow |
| **Antigravity CLI (`agy`)** | `~/.gemini/antigravity-cli/settings.json` | `command(python3 <HOME>/.gemini/config/skills/akiflow/scripts/council_open.py)` — absolute, one rule per script | **None** — literal string-prefix match | Deny → Ask → Allow |
| **Antigravity IDE & Desktop** | `~/.gemini/settings.json` | same syntax as CLI | **None** — literal string-prefix match | Deny → Ask → Allow |
| **Kiro CLI (3.0+)** | `~/.kiro/settings/permissions.yaml` | `capability: shell`, `match: ["python3 ~/.kiro/skills/*"]` | Glob matching | Deny → Ask → Allow |
| **Grok CLI** | `~/.grok/user-settings.json` | `Bash(python3 ~/.grok/skills/*)` | `*` only | Deny → Ask → Allow |
| **Codex CLI** | `~/.codex/config.toml` | `prefix_rule(pattern = ["python3", ...], decision = "allow")` | Prefix array | Priority-based |

---

## 1. Platform Details & Configurations

### 1.1 Claude Code
- **Path**: `~/.claude/settings.json`
- **Schema**:
  ```json
  {
    "permissions": {
      "allow": [
        "Read(//~/.aki/akidevrule/**)",
        "Bash(python3 ~/.claude/skills/*)",
        "Bash(python3 ~/.aki/akidevrule/agskills/*)"
      ]
    }
  }
  ```
- **Semantics** (verified against Claude Code's own docs, `code.claude.com/docs/en/permissions`): `Bash` rules have **no** gitignore-style `**` — that distinction exists only for `Read`/`Edit` path rules. A bare `*` in a `Bash` rule already matches any sequence of characters *including* `/` and spaces, so it spans multiple path segments and arguments on its own (`Bash(git *)` matches `git log --oneline --all`). Writing `**` adds nothing — it is a dead-weight duplicate of `*`, not a broader match. A **space before a trailing `*`** enforces a word boundary (`Bash(ls *)` matches `ls -la` but not `lsof`; `Bash(ls*)` with no space matches both) — irrelevant here since the path's own `/` already acts as the boundary.

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
  The block above shows the **full rule set for one script** (`council_open.py`) plus the scoped file actions; the other four akiflow scripts repeat the same four lines. A single-rendering, single-root version of this block is what V1's first run proved insufficient — do not copy one line and expect a match. `install.mjs` writes four rules per script, not one: both skill roots (`~/.gemini/config/skills/…` and `~/.claude/skills/…`, since a `SKILL.md` deployed byte-identical to several roots shows the Claude path in its literal examples) × both renderings (expanded and tilde-literal). That is 20 `command()` rules for five scripts — deliberately, because each one is still a single exact script path with no glob: the redundancy costs nothing and removes the whole class of "the agent wrote the path the other way" denials. The interpreter token multiplies the same way and for the same reason: on Windows the installer emits `py -3`, `python` and `python3` (60 rules), since a rule naming an interpreter the platform does not have is a rule that never matches.
- **Two denial gates, three signatures — headless `-p` only (measured T8/T8b, plus `write_file` denials 2026-08-21 on agy 1.1.17, Linux; corroborated by the vendor's headless doc). Interactive CLI/IDE prompt instead and are a different path — unmeasured, do not carry these rows over.**
  - *Soft-deny — an approval-needed tool with nobody to ask* (shell commands default to **Ask**): the run **continues and exits 0**, a notice naming the tool goes to stderr, and structured output shows `status: "SUCCESS"` with an empty `response`. A caller that does not check reads a denied call as a clean run.
  - *Hard-deny — a workspace-boundary refusal* (`allowNonWorkspaceAccess` off, path uncovered): the CLI ends the turn at the permission check with an empty `response`, so **the model never learns of the denial** and cannot report it — a prompt contract asking the model to announce a permission failure is out of scope for this path. **Which non-SUCCESS envelope carries it is not stable, and the reason does not always land in the JSON:** `status: "ERROR"` puts it in `error` (`permission check failed for write_file "…": user denied permission for write_file(…)`), while `status: "CANCELED"` leaves `error` **empty** and writes the verbatim reason to **stderr** instead (`jetski: no output produced — a tool required the "write_file" permission that headless mode cannot prompt for, so it was auto-denied.`). Both shapes were observed on the same trap, same tier, minutes apart, 2026-08-21.
  - **Reliable caller check:** `status != "SUCCESS"` **OR** (`SUCCESS` with an empty body). Testing only one shape misses the other gate entirely. **Key on `status`, never on the presence of the `error` field** — a caller that treats an empty `error` as "no denial happened" reads a `CANCELED` refusal as a silent failure and blames the model for it, which is exactly the defect this suite's trap 4 shipped with. This is also the vacuum the helpful/shortcut bias tends to fill with a fabricated answer (`docs/plan/done/agy-helpful-bias-containment.md`).
- **Per-invocation fallback (measured, T3):** `agy --add-dir <path> -p "<prompt>"` brings a directory inside the workspace boundary for that one run, zero settings mutation. Use this in ad hoc/one-shot invocations instead of widening standing permissions.
- **`--dangerously-skip-permissions`**: approves everything, including sandbox bypass (agy issue #36). Not a standing mechanism — acceptable only for a deliberate, isolated one-shot the operator explicitly chose.

### 1.3 Kiro CLI
- **Path**: `~/.kiro/settings/permissions.yaml`
- **Schema**:
  ```yaml
  rules:
    - capability: shell
      match:
        - "python3 ~/.kiro/skills/*"
        - "python3 ~/.claude/skills/*"
        - "python3 ~/.aki/akidevrule/agskills/*"
      effect: allow
  ```
- **CLI Flag**: `kiro-cli chat --trust-all-tools`

### 1.4 Grok CLI
- **Path**: `~/.grok/user-settings.json`
- **Schema**: Uses Claude Code-compatible syntax:
  ```json
  {
    "permissions": {
      "allow": [
        "Bash(python3 ~/.grok/skills/*)",
        "Bash(python3 ~/.claude/skills/*)"
      ]
    }
  }
  ```

---

## 2. Pre-allow Principles for akidevrule

1. **Principle of Least Privilege**: Only pre-allow Python execution for explicitly managed skill and payload script paths. Where the platform's matcher supports globs (`~/.claude/skills/*`, `~/.kiro/skills/*`, `~/.grok/skills/*`) a directory-prefix wildcard is fine — never open-ended `Bash(python3 *)`. **Antigravity's matcher does not support globs at all** (measured, §1.2): its rules must be one absolute-path prefix per script, never a `*`-glob, which would silently match nothing rather than degrade to "broad".
2. **Non-destructive Merging**: `install.mjs` must preserve existing user permissions, settings keys, and comments/formatting where possible, only inserting or updating the managed entries idempotently — and must tolerate agy re-serializing `settings.json` after a session and dropping false/default-valued keys (observed live, `docs/research/agy-permissions-wrap-bias-aug21.md`).
3. **Multi-surface Portability**: A `SKILL.md` deployed unmodified to several CLI roots (`docs/ref/agent-skills-standard.md`) cannot hardcode one CLI's absolute script path as its literal invocation example — a Claude-rooted path silently fails Antigravity's per-root permission prefix even though the file exists at that path on disk. `skills/akiflow/SKILL.md` § Harness notes now states which root to substitute per harness.
