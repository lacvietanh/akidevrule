# Aki global Claude Code guidance

Keep global context small. Prefer current project files and runtime output over stale docs or memory.

## Core rules — mechanically loaded, every session

@~/.aki/akidevrule/index.md
@~/.aki/akidevrule/RULE-agent-behavior.md
@~/.aki/akidevrule/RULE-coding.md
@~/.aki/akidevrule/RULE-pattern-core.md

These four are embedded by the harness when it reads this file at session start. No model decision is involved, so they apply to every task whether or not any skill runs. The rule corpus map lives in `index.md`; the behavior floor lives in `RULE-agent-behavior.md`; the code-quality floor in `RULE-coding.md`; the structural floor in `RULE-pattern-core.md`.

`RULE-coding.md` and `RULE-pattern-core.md` were promoted here because being labelled "default ON" in the router never made them load — a skill runs only when the model decides to invoke it, so the rules the owner had to re-state most often were frequently the ones that had never entered the context at all. They are paid for in every session, including sessions that touch no code; that cost is deliberate and is the price of the guarantee.

Nothing else in the corpus is guaranteed. Every other rule file loads only when the `akirule` skill runs and matches a signal, and invoking a skill is the model's decision, not a harness mechanism.

## Shared Aki rule source

Aki's shared rule corpus lives at `~/.aki/akidevrule`.

The `akirule` skill routes everything beyond the core above: contextual and analytical rules on signal match with high sensitivity, and full load on explicit command. See `~/.claude/skills/akirule/SKILL.md` for the complete routing spec and signal list.

**IMPORTANT — editing shared rules:** The installed `~/.aki/akidevrule` directory is a **deployed copy**, not the source of truth. To change a shared rule:
1. Find the source repo: its absolute path on this machine is recorded in `~/.aki/akidevrule/.source-repo`, written by the installer on every install. Read that file — do not guess a location, and do not ask the user for something already recorded. Ask only if the recorded path no longer exists.
2. Edit under `<source-repo>/payload/` (shared rule corpus), `<source-repo>/skills/` (Agent Skills, shared with Antigravity), or `<source-repo>/claude/` (Claude Code-only runtime assets: global guidance, hooks, settings fragment).
3. **Read `<source-repo>/CLAUDE.md` before editing.** It carries that repo's own operating rules — which files must be updated together (`payload/index.md`, `skills/akirule/SKILL.md`, `README.md`, `CHANGELOG.md`), file-naming conventions, and non-goals. This step matters most when the request arrives from *another* project's working directory, where that file is not auto-loaded.
4. Run the installer to propagate changes to the installed copy — `node install.mjs` (any platform), or `./install.sh` / `.\install.ps1`.

Never edit the installed `~/.aki/akidevrule` files directly — changes will be silently overwritten on the next install.

## Named local corpora

Doc corpora that live outside any single project are often referred to by short name in conversation (e.g. "UNIDOC", "the standards doc"). Their names, paths, and usage notes are **machine-specific**, so they are recorded in `~/.claude/CLAUDE.local.md` — not in this shared file. When the user names a corpus you cannot resolve, read that file before searching the filesystem or asking.

## ref-ECC guard

`~/.aki/akidevrule/ref-ECC` is intentionally very large. Do not scan, summarize, or bulk-load it by default.

Only use `ref-ECC` when the user explicitly asks for it or when a task has a specific, narrow need for that reference corpus. Prefer targeted file/path lookup over broad search to avoid context bloat.
