# `AGENTS.md` is a repo instruction file — not `SKILL.md`, not `CLAUDE.md`

Lookup. **`SKILL.md` (Agent Skills)** is a different standard: `docs/ref/agent-skills-standard.md`. This repo’s Claude vs Gemini *rule delivery* is `docs/arch/rule-delivery-architecture.md`.

**`AGENTS.md`** is plain Markdown at a repo root (or nested; closest file wins; user chat overrides). No schema. Steward: [agents.md](https://agents.md/) / Agentic AI Foundation under the Linux Foundation (donated 2025). ~60k public repos. It is a growing convention, not a file every agent is required to hard-load.

## Who reads it (checked 2026-08-28)

| Tool | Native `AGENTS.md`? | What it actually loads | Source |
|---|---|---|---|
| **Cursor** (IDE + CLI) | yes | `AGENTS.md` in root and nested dirs; also `.cursor/rules/*.mdc` and `CLAUDE.md` | [cursor.com/docs/rules](https://cursor.com/docs/rules) |
| **Claude Code** | **no** | `CLAUDE.md` only. Official: *“reads `CLAUDE.md`, not `AGENTS.md`.”* Bridge: first line `@AGENTS.md` in `CLAUDE.md`, or a symlink. `/init` can ingest `AGENTS.md` into a generated `CLAUDE.md`. | [code.claude.com/docs/en/memory](https://code.claude.com/docs/en/memory) |
| **Gemini CLI** | configurable | Default historically `GEMINI.md`. `context.fileName` in `.gemini/settings.json` can list `AGENTS.md`. PRs exist to default both names; do not assume an old binary does. | [agents.md FAQ](https://agents.md/), [google-gemini/gemini-cli#24913](https://github.com/google-gemini/gemini-cli/pull/24913) |
| **Antigravity CLI (`agy`) + IDE** | yes | Workspace: `GEMINI.md` **and** `AGENTS.md`. Global: `~/.gemini/GEMINI.md`. | [antigravity.google … gcli-migration](https://www.antigravity.google/docs/cli/gcli-migration) |
| **Kiro** (IDE + CLI, v0.5+) | yes | Root or `~/.kiro/steering/` `AGENTS.md`, always included (no inclusion modes). Plus `.kiro/steering/*.md` with always/fileMatch/manual/auto. Nested `AGENTS.md` supported. | [kiro.dev/docs/cli/steering](https://kiro.dev/docs/cli/steering/) (updated 2026-08-04) |
| **Codex, Copilot coding agent, Jules, Windsurf, Aider, Amp, Factory, …** | yes (per [agents.md](https://agents.md/) logo list) | `AGENTS.md` |
| **Postman Agent Mode** | **no** as a git-tree coding agent | In-app Skills `/`, `@` collections/specs, MCP. Official docs do not say it reads repo `AGENTS.md`. | [learning.postman.com Agent Mode](https://learning.postman.com/docs/agent-mode/overview.mdx) |

A claim that “Claude Code reads `AGENTS.md` as a fallback” is **not** in Anthropic’s memory docs (checked 2026-08-28). Do not rely on it.

## This corpus

akidevrule installs **`~/.claude/CLAUDE.md`** and **`~/.gemini/GEMINI.md`**, not a global `AGENTS.md`. A **project** that must serve Claude Code **and** Cursor/Kiro/`agy` either:

- keeps `CLAUDE.md` as Claude’s file and a byte-identical `AGENTS.md` for tools that will not follow `@` imports (this is the pattern some Aki apps use — non-Claude tools often do not expand `@AGENTS.md`), or
- uses a thin `CLAUDE.md` whose first line is `@AGENTS.md` (Anthropic’s recommended bridge when the other tools already own `AGENTS.md`).

Do not merge the two files and expect Claude Code to load `AGENTS.md` by filename.
