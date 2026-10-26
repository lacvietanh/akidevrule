# WorkBuddy — skill discovery and the missing resident-instruction surface

`updated 2026-10-26 · v3.8.0`

**Trail.** Verified 2026-10-26 on the owner's macOS WorkBuddy desktop install, against `~/.workbuddy-ai/` state and the shipped renderer bundle `WorkBuddy AI.app/Contents/Resources/app.asar.unpacked/renderer/assets/`. Research origin for every row: `../research/workbuddy-skill-delivery.md` § R1–R5, which also records what was not verified. The app build number was not recorded — re-verify before citing this against a newer build.

## The facts

| Claim | Evidence (research §) |
|---|---|
| User-level skills live at `~/.workbuddy-ai/skills/<name>/SKILL.md`, unmodified `SKILL.md` standard; frontmatter `name`, `description`, `user-invocable` are honored | Skill invocation returned `Base directory for this skill: /Users/aki/.workbuddy-ai/skills/akirule` plus the router body; `.skill-list-cache.json` maps `userInvocable: false` from the frontmatter (R1) |
| The skill list is cached in `~/.workbuddy-ai/.skill-list-cache.json`, watch-rooted at `~/.workbuddy-ai/skills`, with `source`, `overrideKey`, `disableModelInvocation` per skill | cache contents read directly (R1) |
| Nothing is resident: no `@`-import, no managed instruction block, no route-gate hook. The behavior floor and the router arrive only on skill invocation | absence-of-mechanism evidence — `grep -rlo "AGENTS.md" app.asar.unpacked` empty, no other global instruction file found (R2) |
| The one always-on user text surface is Settings → Personalization → "Instructions for {name}", stored at `personalization.customPrompt` in `~/.workbuddy-ai/app/app-config.json` | i18n keys `settings.personalization.customPrompt` / `.customPromptDesc` / `.customPromptHint` in the en bundle; the config file holds that exact key (R2) |
| A skill `description:` alone did not trigger `akirule`; the owner had to name it | one session, single sample (R3) |

## What this repo does with it

`install.mjs` syncs `skills/` to `~/.workbuddy-ai/skills/` exactly as for Kiro and Grok, and `skills/akirule/SKILL.md` § Delivery carries the behavior floor: on WorkBuddy the skill invocation also `Read`s `~/.aki/akidevrule/RULE-agent-behavior.md` once per session, which is what `(core)` reports there. The installer never writes `app/app-config.json` — naming `akirule` in Settings → Personalization is a manual, per-machine step.

## Open / re-verify

- Whether the app prunes `~/.workbuddy-ai/skills/`, and whether a real directory survives where a symlink did not (research § R4 — cause unknown, installer ruled out).
- Whether adding a skill needs an app restart or only a new session: the successful invocation happened after a restart, so the requirement was not isolated.
- Whether a later build grows a hard-loaded instruction file or a hook surface; either would obsolete the "nothing is resident" row and should move the floor off the skill body.
