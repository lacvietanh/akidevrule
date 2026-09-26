# Aki global Claude Code guidance

Keep global context small. Prefer current project files and runtime output over stale docs or memory.

## Core rules and the router — mechanically loaded, every session

@~/.aki/akidevrule/index.md
@~/.aki/akidevrule/RULE-agent-behavior.md
@~/.aki/akidevrule/RULE-coding.md
@~/.aki/akidevrule/RULE-pattern-core.md
@~/.claude/skills/akirule/SKILL.md

The harness embeds these five when it reads this file at session start — no model decision is involved. `index.md` is the corpus map; `RULE-agent-behavior.md` the behavior floor; `RULE-coding.md` the code-quality floor; `RULE-pattern-core.md` the structural floor; `akirule/SKILL.md` the router that decides which contextual rule files to read on each task turn.

The router is imported rather than left as a skill because a skill runs only when the model decides to invoke it, and it went uninvoked until the owner asked by name. The same failure earlier promoted `RULE-coding.md` and `RULE-pattern-core.md` to core. All five are paid for in every session; that cost is the price of the guarantee.

What stays best-effort is the second hop: a routed file enters context only when the model `Read`s it on a route match.

## Shared Aki rule source

Aki's shared rule corpus lives at `~/.aki/akidevrule`.

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
