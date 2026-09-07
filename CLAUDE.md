# akidevrule

This repository is the source of truth for Aki's reusable Claude Code rule and skill baseline.

## Project role

akidevrule packages Markdown rules, Claude Code skills, global Claude guidance, and installer fragments so the same baseline can be installed into another user's local Claude environment.

Treat this repository as a standards distribution project, not as an application repository.

## Source of truth

- Edit canonical rule and skill content in this Git repository first.
- `payload/` contains the packaged Aki rule corpus installed to `~/.aki/akidevrule`. `docs/` is repo-internal and never installed, with one exception: `docs/ref/macos-codesign-tcc.md`, a lookup with no `RULE-`/`METHOD-` shape, which `install.py` deploys to `~/.aki/akidevrule/docs/ref/`.
- `skills/` contains the shared Agent Skills corpus (the `SKILL.md` open standard) deployed unmodified to `~/.claude/skills/`, `~/.gemini/config/skills/`, `~/.agents/skills/` (Codex CLI), `~/.kiro/skills/` (Kiro CLI), and `~/.grok/skills/` (Grok CLI) — see `docs/ref/agent-skills-standard.md`.
- `claude/` contains Claude Code-only runtime assets (CLAUDE.md template, `agents/` definitions, hooks, settings fragment) installed to `~/.claude`. `agents/*.md` is Claude Code's own agent format and lives here, not in a vendor-neutral top-level folder, because that format currently has one implementation — unlike `SKILL.md`, which has five. It is copied per file into a directory shared with the user's own agents, so it is never mirrored with `--delete`.
- `README.md` documents the architecture, file conventions, and install flow for both humans and agents. Read it when you need to understand the full layout or how the smart router works. It is not an agent instruction file — it does not override this CLAUDE.md.

## File naming conventions

Files in `payload/` follow this convention:
- `RULE-*.md` — constraint rules: behavior, coding, content, stack requirements.
- `METHOD-*.md` — analytical frameworks loaded on demand for auditing or optimization tasks.

Do not rename existing files or introduce new top-level prefixes without updating `payload/index.md`, `skills/akirule/SKILL.md`, `claude/CLAUDE.md`, `README.md`, and `install.py` (the installer SSOT; `install.sh`/`install.ps1` are thin launchers) consistently.

## Rule authoring principles

- **Standard over legacy.** This repo IS the standard. When a better name, shape, or convention is identified, adopt it fully and migrate every live reference in the same change — never keep a worse form for backward compatibility. Only immutable event records (past CHANGELOG entries, `docs/research/`, `docs/plan/done/`) keep their historical wording.
- **Dense technical wording, keyword-first.** A rule is written in condensed scientific-technical language whose exact terms are the trigger keywords an AI pattern-matches on (`group-hover`, `spawn_blocking`, `NFC`) — never narrative prose. Line budget follows violation frequency, not felt importance; every line passes the deletion test (`agent.A4`).
- **Self-compliance (dogfood).** The corpus obeys its own rules: a new rule, section, or skill needs a unique evidence-backed reason to exist (`pattern.A2` bar), overlaps an existing rule only as a pointer (never restated text), and passes the `pattern.B3` critique gate before shipping. A corpus that violates itself teaches violation.

## Content language

`payload/`, `skills/`, and `claude/` are **PUBLIC**, distributed to many users — not just Aki's own. All authored content, including section/group headers (`## A. …`), must be English. Vietnamese is allowed only in these narrow, functional cases:
- keyword/signal lists that must match a Vietnamese-speaking user's actual words (e.g. Tier 2 routing keywords in `akirule/SKILL.md`)
- a worked example that specifically needs Vietnamese text to illustrate the point (e.g. accented-vs-unaccented SEO queries, NFC normalization of a Vietnamese name)
- a literal trigger phrase the user actually types (e.g. `nạp full`, `commit luôn`)

A ready-to-paste prompt template (e.g. in `payload/GEMINI.md`) must not hardcode Vietnamese output either — instruct the agent to compose it in whatever language the current session is using, not ship a fixed-language example as the literal text.

## Required operating rules

- Use the `akirule` skill before editing durable project files, rule files, skill files, installer behavior, or project instructions.
- Keep project instructions short and bind them to the current repository instead of duplicating the full shared rule corpus.
- Changes to rules, skills, install targets, or generated Claude configuration can affect many downstream environments; clarify scope and tradeoffs before broad changes unless the requested edit is explicit.
- Preserve the separation between packaged source files in this repository and installed runtime files under `~/.aki/akidevrule` or `~/.claude`.
- Any change to `payload/*` or `skills/*` that adds/removes a topic, changes what a file covers, or changes install behavior must also update `README.md` (file manifest / "What you get" / layout sections) wherever the change makes it stale.
- **Any change to `skills/*` (add/remove/rename a skill, or change what a skill covers) must be checked against `skills/akihelp/SKILL.md`.** It reads live installed state at runtime and never needs a content update for the normal case — but when the *mechanism* of introducing the system changes (e.g. a new deploy surface, a new category of thing to introduce), update its steps, not just the other docs.
- Always update `CHANGELOG.md` for every change to `payload/`, `skills/`, or `claude/`.

## Non-goals

This project is not an auto-updater, daemon, package manager, application framework, or control plane.

Do not add runtime automation, background services, unrelated personal Claude settings, secrets, model-router tokens, localhost project permissions, or bundled large reference corpora unless explicitly requested.
