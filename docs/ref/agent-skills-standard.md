# Agent Skills is a shared open standard — Claude Code ↔ Antigravity/AGY

Not `AGENTS.md` (the repo instruction file). That standard: `docs/ref/agents-md-standard.md`.

## The fact

`SKILL.md` (YAML frontmatter + instructions, plus optional `references/`, `scripts/`, `assets/` subfolders, with progressive disclosure — the agent sees only name+description until the skill is actually triggered) is not a Claude-specific format. Google adopted the same open standard for Antigravity. Both platforms agree on:

- **File format** — `SKILL.md` as the source of truth, same frontmatter fields (`name`, `description`) used for discovery.
- **Folder contents** — identical: `SKILL.md` + optional `scripts/`, `references/`, `assets/`.
- **Progressive disclosure** — both list name+description at session start, load full content only when a skill is triggered.
- **Zero transformation needed** — a skill folder written for one platform works unmodified on the other. This is unlike this repo's `payload/` rule corpus, which *does* need a per-agent adapter (Antigravity requires generated YAML `trigger` frontmatter that Claude Code has no concept of).

The only real difference is **where each platform looks for skills**, not the format inside:

| Scope | Claude Code | Antigravity / AGY |
|---|---|---|
| Project-level | `.claude/skills/` | `.agent/skills/` |
| Global (this repo's target) | `~/.claude/skills/` | `~/.gemini/config/skills/` — the one root read by AG Desktop, AG IDE, and AGY CLI alike |

This repo already deploys to the two global paths — `install.py`'s `sync_aki_skills()` was already syncing the same folder to `~/.gemini/config/skills/` unmodified (Python `shutil` copy, rsync `--delete` semantics, no rsync binary) before this finding was verified; only the *source-repo* layout (`claude/skills/` implying Claude ownership) was inaccurate to what was actually happening.

Ollama CLI auto-loads every skill under `~/.claude` with no deploy step of its own — observed 2026-08-07.

## Decision — what changed in this repo

`claude/skills/*` → top-level `skills/*`, as a sibling of `payload/` (the other shared, agent-neutral source). `claude/` now holds only assets genuinely specific to Claude Code (the `CLAUDE.md` template, hooks, the settings fragment). See the `### Changed` entry in `CHANGELOG.md` (Unreleased) for the full list of files touched, and `docs/arch/rule-delivery-architecture.md` for the updated source-to-consumer diagram.

Nothing changes for an already-installed machine — the deployed target paths (`~/.claude/skills/`, `~/.gemini/config/skills/`) are identical before and after; re-running `install.sh` picks up the new source location automatically.

## Sources

- [Your Claude Skills Now Work in Antigravity (Here's How)](https://alexmcfarland.substack.com/p/your-claude-skills-now-work-in-antigravity) — directory difference (`.claude/skills/` vs `.agent/skills/`), same `SKILL.md` format and optional folders, same progressive-disclosure behavior.
- [Google Antigravity Can Now Use Your Claude Code Skills](https://medium.com/@joe.njenga/google-antigravity-can-now-use-your-claude-code-skills-i-just-tested-new-agent-skills-7c5d33ca8c86) — hands-on confirmation that skills built for Claude Code load in Antigravity without modification.
- [Confused About Where to Put Your Agent Skills? (Updated for Antigravity.)](https://medium.com/google-cloud/confused-about-where-to-put-your-agent-skills-ea778f3c64f3) — global skills path `~/.gemini/config/skills/` shared across Antigravity, Antigravity IDE, and Antigravity CLI; project-level path `.agent/skills/`.
- [Antigravity IDE Skills: SKILL.md Setup Guide (2026)](https://www.agensi.io/learn/antigravity-ide-skills-guide) — skill structure identical to Claude Code (`SKILL.md`, `scripts/`, `references/`, `assets/`).
- [What Are Awesome Claude Skills and How to Install Them in Google Antigravity](https://www.c-sharpcorner.com/article/what-are-awesome-claude-skills-and-how-to-install-them-in-google-antigravity/) — native compatibility, community porting of 300+ Claude Code skills to Antigravity with no changes.

## Cross-reference

This repo's own verification of the `~/.gemini/config/skills/` global path predates this finding — see `install.py`'s inline comment above `GEMINI_SKILLS_DIR` (canary-tested 2026-07-22) and `docs/arch/rule-delivery-architecture.md` § "Verified behavior (2026-07-23)".
