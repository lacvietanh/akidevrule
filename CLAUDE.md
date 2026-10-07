# akidevrule

This repository is the source of truth for Aki's reusable Claude Code rule and skill baseline.

## Project role

akidevrule packages Markdown rules, Claude Code skills, global Claude guidance, and installer fragments so the same baseline can be installed into another user's local Claude environment.

Treat this repository as a standards distribution project, not as an application repository.

## Source of truth

- Edit canonical rule and skill content in this Git repository first.
- `payload/` contains the packaged Aki rule corpus installed to `~/.aki/akidevrule`. `docs/` is repo-internal and never installed, with one exception: `docs/ref/fact-macos-codesign-tcc.md`, a lookup with no `RULE-`/`METHOD-` shape, which the installer (`install.mjs`) deploys to `~/.aki/akidevrule/docs/ref/`.
- `skills/` contains the shared Agent Skills corpus (the `SKILL.md` open standard) deployed unmodified to `~/.claude/skills/`, `~/.gemini/config/skills/`, `~/.agents/skills/` (Codex CLI), `~/.kiro/skills/` (Kiro CLI), and `~/.grok/skills/` (Grok CLI) — see `docs/ref/fact-agent-skills-standard.md`.
- `claude/` contains Claude Code-only runtime assets (CLAUDE.md template, `agents/` definitions, hooks, settings fragment) installed to `~/.claude`. `agents/*.md` is Claude Code's own agent format and lives here, not in a vendor-neutral top-level folder, because that format currently has one implementation — unlike `SKILL.md`, which has five. It is copied per file into a directory shared with the user's own agents, so it is never mirrored with `--delete`.
- `README.md` documents the architecture, file conventions, and install flow for both humans and agents. Read it when you need to understand the full layout or how the smart router works. It is not an agent instruction file — it does not override this CLAUDE.md.

## File naming conventions

Files in `payload/` follow this convention:
- `RULE-*.md` — constraint rules: behavior, coding, content, stack requirements.
- `METHOD-*.md` — analytical frameworks loaded on demand for auditing or optimization tasks.

Do not rename existing files or introduce new top-level prefixes without the change sweep below; `install.mjs` is the pure-Node installer SSOT (`install.sh`/`install.ps1` are thin `node` launchers).

## Rule authoring principles

- **Standard over legacy.** This repo IS the standard. When a better name, shape, or convention is identified, adopt it fully and migrate every live reference in the same change — never keep a worse form for backward compatibility. Only immutable event records (past CHANGELOG entries, `docs/research/`, `docs/plan/done/`) keep their historical wording.
- **Dense technical wording, keyword-first.** A rule is written in condensed scientific-technical language whose exact terms are the trigger keywords an AI pattern-matches on (`group-hover`, `spawn_blocking`, `NFC`) — never narrative prose. Line budget follows violation frequency, not felt importance; every line passes the deletion test (`agent.A4`).
- **Route by meaning; signals anchor the meaning.** A trigger — router route, skill `description:`, Antigravity rule description — names the domain and the act in one semantic clause that holds in any language; that clause is the test. A router route also carries a signals list: one term per concept the domain owns (artifact, symptom, question shape), in English and Vietnamese, standing for every synonym. Signals raise recall on terse wording, which a clause alone lost on a weaker model; they never gate — a request with no listed signal still routes. Adding a phrasing variant of a concept already listed is a leaf patch; adding a missing concept is not. Only a literal command gate (`/akiship`) is a literal string.
- **Self-compliance (dogfood).** The corpus obeys its own rules: a new rule, section, or skill needs a unique evidence-backed reason to exist (`pattern.A2` bar), overlaps an existing rule only as a pointer (never restated text), and passes the `pattern.B3` critique gate before shipping. A corpus that violates itself teaches violation.
- **Release records carry their reasoning.** Every CHANGELOG entry and release note for this repo states why, not only what — the observed failure or evidence, the root cause, the mechanism chosen, and the tradeoff or rejected alternative. A bare list of changes is an incomplete entry. The reasoning is the durable value: downstream users and future sessions judge whether a rule still applies by the argument behind it, not by the diff alone.

## Content language

`payload/`, `skills/`, and `claude/` are **PUBLIC**, distributed to many users — not just Aki's own. All authored content, including section/group headers (`## A. …`), must be English. Vietnamese is allowed only in these narrow, functional cases:
- a worked example that specifically needs Vietnamese text to illustrate the point (e.g. a `Đây là...` FAQ preamble, NFC normalization of a Vietnamese name)
- a literal command token the user actually types, where the literal string itself is the gate (e.g. `commit luôn`)
- a concept term in the router's signals column (`skills/akirule/SKILL.md`), beside its English equivalent

A ready-to-paste prompt template (e.g. in `payload/GEMINI.md`) must not hardcode Vietnamese output either — instruct the agent to compose it in whatever language the current session is using, not ship a fixed-language example as the literal text.

## Required operating rules

- Route through `akirule` (imported via `~/.claude/CLAUDE.md`) and Read every routed file before editing durable project files, rule files, skill files, installer behavior, or project instructions.
- Keep project instructions short and bind them to the current repository instead of duplicating the full shared rule corpus.
- Changes to rules, skills, install targets, or generated Claude configuration can affect many downstream environments; clarify scope and tradeoffs before broad changes unless the requested edit is explicit.
- Preserve the separation between packaged source files in this repository and installed runtime files under `~/.aki/akidevrule` or `~/.claude`.
- **Change sweep — every add, change or removal of a rule, law, section, address, tier, skill or delivery mechanism is finished only when every reference to it in the tree agrees.** The rule text is one copy; the corpus carries it in many more places, each of which goes stale silently. Before closing, grep the repo for the old name, address, file name and tier wording, and update every hit: `docs/arch/corpus-map.md` (groups, lens rows), `skills/akirule/SKILL.md` (route clause and signals), `claude/CLAUDE.md`, `README.md` (manifest / "What you get" / layout), `docs/arch/*` and the active `docs/plan/*`, every `skills/*/SKILL.md` and `references/*` that names the rule or emits a `[RULES]` receipt (`akiship`, `akiflow`, `akihelp`), every `claude/agents/*.md` manifest and receipt, `install.mjs` (`AG_RULE_MAP`, hook registration, printed summary), the hooks under `claude/hooks/`, the scripts under `scripts/` and `skills/*/scripts/` (`scythe.py`, `release_lint.py`, `second_hop_audit.py`), the CI workflows, and code comments that cite an address. The CHANGELOG entry lists what was updated together, so a reviewer can check the sweep rather than repeat it. `skills/akihelp/SKILL.md` reads live installed state and needs no edit for a normal content change — it changes only when the *mechanism* of introducing the system changes (a new deploy surface, a new category of thing to introduce).
- Always update `CHANGELOG.md` for every change to `payload/`, `skills/`, or `claude/`.

## Reporting a rule change to the owner

When a rule line was added or changed, the report quotes it verbatim in a four-backtick fence (`agent.C3`), then gives its meaning in one or two plain sentences in the conversation's language directly beneath — what the line rules in, what it rules out, and where it sits (root law vs domain application, with the address). The owner reads rule text in a terminal between many projects and judges wording, not diffs: a paraphrase hides drift, a bare diff hides meaning, and the two together are what gets checked. One quoted line per change; a section that changed shape gets its address and a one-line summary, not a full paste.

## Release process

Governed directly by `RULE-release.md` (`A3`, `B4`, `B7`, `B10`). Repo-specific deltas:
- **Bare semver tags** (`3.0.0`, never `v3.0.0`), annotated with the `release.B4` title as subject (`git tag -a 3.1.0 -m "v3.1.0: <impact>"`) — pushing one triggers `.github/workflows/release.yml`, which creates the GitHub Release from the tagged CHANGELOG section and takes the title from that subject (a lightweight tag falls back to the bare tag as title). No npm publish in CI.
- **`agent.B7` quotes are re-verified before every release:** each harness fragment in the B7 table is grepped against the Claude Code version about to be used (the current binary under `~/.local/share/claude/versions/`, or the live system prompt of a session), on Opus 5.5 and, when available, Sonnet 5.5; a fragment that no longer matches is updated with the row's meaning kept, never dropped silently.
- **`npm publish` is a manual local step**, same as `@akinet/akimcp` (`aki-mcp-sv`) — run `npm run sync-version && npm publish` from an already-authenticated `npm login` session. This account has 2FA on writes, so publish cannot be scripted in CI without an automation token; none exists for this repo, and none should be added (see Non-goals below).

## Non-goals

This project is not an auto-updater, daemon, package manager, application framework, or control plane.

Do not add runtime automation, background services, unrelated personal Claude settings, secrets, model-router tokens, localhost project permissions, or bundled large reference corpora unless explicitly requested.
