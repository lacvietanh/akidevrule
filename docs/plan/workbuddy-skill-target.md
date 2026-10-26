# WorkBuddy skill target — execution plan

Source: `../research/workbuddy-skill-delivery.md`. Executed 2026-10-26 in one session against akidevrule 3.8.0 with `[Unreleased]` open; no version minted (`release.A5`).

## Goal

One `node install.mjs` puts the router and the behavior floor into WorkBuddy with no hand-made symlink and no write to the app's own config.

## Steps

- [x] 1. Read the routed rules (`agent`, `coding`, `pattern`, `docs`, `release`, `think`) and the repo `CLAUDE.md`; `git status` first — pre-existing dirty files left alone.
- [x] 2. `install.mjs`: `WORKBUDDY_SKILLS_DIR`, `syncAkiSkills()` beside Kiro/Grok, one summary line.
- [x] 3. `skills/akirule/SKILL.md`: WorkBuddy Delivery row (invoke + one floor `Read` per session), `Not routed here` exception, `(core)` receipt row naming all three residencies.
- [x] 4. Sweep: `README.md` (intro harness list, six implementations, mermaid T7, targets 5-7, installer step 5, exclusions, uninstall), repo `CLAUDE.md`, `skills/akihelp/SKILL.md`, `docs/arch/rule-delivery-architecture.md` (+ stamp), `CHANGELOG.md` `[Unreleased]`.
- [x] 5. New docs: this plan, `../research/workbuddy-skill-delivery.md`, `../ref/fact-workbuddy-harness.md`.
- [x] 6. `docs/index.md` rows added with the owner's approval (the file also holds another session's `test-isolation-every-entry.md` row); staged as HEAD + these rows only, so the other session's row stays uncommitted.
- [x] 7. Symlink removed, `node install.mjs` run — summary prints `🤖 WorkBuddy : /Users/aki/.workbuddy-ai/skills`; 11 skill dirs deployed, `~/.workbuddy-ai/skills/akirule/SKILL.md` is a real file, `diff` against `skills/akirule/SKILL.md` empty.
- [x] 8. Committed only this session's paths; no push, no tag (not ordered).

## Open

- [ ] N1 (watch, closes 2026-11-02): confirm `~/.workbuddy-ai/skills/` still holds the corpus after ordinary app restarts. If the app prunes it, the target needs a different home and `../ref/fact-workbuddy-harness.md` § Open is the record to update. Weight: the whole delivery rests on this directory surviving.
