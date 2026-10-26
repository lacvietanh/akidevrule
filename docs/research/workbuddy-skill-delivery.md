# WorkBuddy skill delivery — how the router reaches the desktop app

- **Start time:** 2026-10-26 18:44 +07
- **Initial purpose:** the owner asked why `akirule` did not act inside WorkBuddy although it was installed machine-wide for Claude Code, Kiro, Grok, Antigravity and Codex. Constraints at the time: the WorkBuddy session had no `~/.claude/CLAUDE.md` import, and the only wiring was a hand-made symlink created earlier that day.
- **Strategy:** inspect the installed app bundle and its config/cache files instead of guessing from the harness's own documentation; compare with the five targets `install.mjs` already syncs; run `METHOD-deep-think.md` over symlink vs real copy vs a generic `--skills-dir` flag; change the smallest thing that makes one install command cover every harness.
- **Checklist:**
  - [x] `git -C /Volumes/DEV/AkiDevRule status --short` before any edit — `.gitignore` and `docs/index.md` dirty, `docs/plan/test-isolation-every-entry.md` untracked, none of them this session's.
  - [x] Read `~/.claude/CLAUDE.md`, `~/.claude/settings.json` (`skillOverrides.akirule = "on"`), `~/.aki/akidevrule/.version` (3.8.0, commit 9aafb7a).
  - [x] `ls ~/.workbuddy-ai/skills` at 18:58 — only the two migration JSON files, no `akirule`.
  - [x] Read `~/.workbuddy-ai/.skill-list-cache.json` (written 18:10) — already contains `{"name":"akirule","filePath":"/Users/aki/.workbuddy-ai/skills/akirule/SKILL.md","source":"userSettings","disableModelInvocation":false,"userInvocable":false,"overrideKey":"akirule"}` and a watch list rooted at `~/.workbuddy-ai/skills`.
  - [x] Read the app's i18n bundle `app.asar.unpacked/renderer/assets/en-*.js` for the `settings.personalization.*` keys.
  - [x] Invoke the `akirule` skill inside WorkBuddy after restoring the path — returns `Base directory for this skill: /Users/aki/.workbuddy-ai/skills/akirule` plus the full router body.
  - [x] Deep-think: goal chain, first principles, steelman of not adding the target, pre-mortem, second-order effects.

## Result

R1. **WorkBuddy consumes the unmodified `SKILL.md` standard from `~/.workbuddy-ai/skills/`.** Verified by invocation, not by reading a doc: the skill returned its base directory and body from that path. The cache shows frontmatter parsed the same way (`userInvocable: false` comes from `user-invocable: false`).

R2. **Nothing is resident on WorkBuddy.** The behavior floor and the router arrive only when the model invokes the skill; there is no `@`-import, no managed instruction block and no route-gate hook. Evidence is absence-of-mechanism, weaker than R1: `grep -rlo "AGENTS.md" app.asar.unpacked --include="*.js"` returned nothing, and the only always-on user text surface found is `personalization.customPrompt`. No claim is made about undocumented future surfaces.

R3. **The description alone did not invoke the router.** Across the session's first three turns the `akirule` description sat in the skill list and the skill was never invoked until the owner named it. "The description is aggressive enough to self-invoke" is falsified on this build; guaranteed invocation needs the owner's custom instruction. One session, one model — directional, not a measured rate.

R4. **The manual wiring rotted within hours, cause unknown.** At 18:10 the cache pointed at `~/.workbuddy-ai/skills/akirule/SKILL.md`; at 18:58 the directory held no `akirule`. `install.mjs` never touches that path, so the installer is not the remover. Whether the app prunes its skills dir, and whether a real directory survives better than a symlink, is **unverified** and is the reopen trigger.

R5. **The floor can ride the skill instead of app config.** `app/app-config.json` is app-owned state; editing it while the app runs risks being overwritten, and the repo's non-goals exclude runtime automation into another app's settings. One Delivery row in `skills/akirule/SKILL.md` reaches the same outcome through a file the installer already ships.

### Verification

R1 direct tool output (skill invocation). R2 grep result plus config read, labeled absence-of-mechanism. R3 session observation, single sample. R4 two directory reads at stated times, cause explicitly unknown. R5 reasoning against the repo's non-goals, not a runtime test.

### Corroborating links

- `docs/ref/fact-agent-skills-standard.md` — the standard this target reuses unchanged.
- `docs/research/codex-instruction-delivery.md` — the same "no `@`-import" problem solved differently, because Codex has a hard-loaded file and WorkBuddy does not.
- `docs/research/rule-delivery-second-hop-sep29.md` — precedent for "the router being present is not the router being invoked".

## Decision

**Action** — add WorkBuddy as a real-copy `syncAkiSkills()` target and carry the behavior floor in the router's Delivery section:

- `install.mjs` (target constant, sync call, summary line)
- `skills/akirule/SKILL.md` (Delivery row, Not-routed-here exception, `(core)` receipt row)
- `docs/ref/fact-workbuddy-harness.md` (distilled facts from R1–R5)
- `docs/plan/workbuddy-skill-target.md` (execution record and open watch item)
- `docs/arch/rule-delivery-architecture.md` § WorkBuddy

**Rejected/closed**

- Keep the symlink: outside the installer's ownership, invisible to the change sweep, and it broke once already (R4).
- A generic `--skills-dir <path>` flag: still requires remembering to pass it on every install, so it fails the actual goal — one command, every harness, nothing to remember. Reopen when a seventh harness appears.
- Writing `personalization.customPrompt` from the installer: app-owned state, and the repo's non-goals bar it (R5).

**Cross-references:** `README.md`, repo `CLAUDE.md`, `skills/akihelp/SKILL.md`, `CHANGELOG.md` `[Unreleased]`, `docs/index.md`.
