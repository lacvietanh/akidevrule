# Migrate this repo's `docs/ref/` lookups to `docs.A6` fact docs

**Status: done 2026-09-30** · opened 2026-09-27 · rule: `payload/RULE-docs.md` A6

All four `docs/ref/*.md` are claims about the outside world (two open standards, per-CLI permission dialects, macOS TCC), so each is a fact doc by `docs.A6` and must carry the `fact-` name, the `A4` stamp, and a per-claim trail to its research section. Deferred from the rule's own batch because `macos-codesign-tcc.md` is deployed by `install.mjs` to a path `tauri.B7` cites, and a rename leaves the old file on every installed machine unless the installer prunes it.

- [x] Rename `agent-skills-standard.md`, `agents-md-standard.md`, `cli-permission-allowlist-standard.md`, `macos-codesign-tcc.md` to `fact-*.md`; update every live reference (`README.md` ×3, `CLAUDE.md`, `docs/index.md`, `docs/arch/rule-delivery-architecture.md`, `lib/permissions.mjs` comment, `payload/RULE-stack-tauri.md` B7, the cross-links between the two standards docs)
- [x] `install.mjs`: deploy the renamed TCC lookup; the existing `rmrf(INSTALL_ROOT/docs)` before the copy already prunes the old `~/.aki/akidevrule/docs/ref/macos-codesign-tcc.md`; extend `install-smoke.yml` if it asserts the path
- [x] Add the `A4` stamp to each, and a trail on every load-bearing claim: research section where one exists (`macos-tcc-tauri-boundary-aug21.md`, `agy-permissions-wrap-bias-aug21.md`, `antigravity-claude-skills-native-discovery.md`), otherwise mark the claim unverified or re-verify against the vendor page with a read date
- [x] `CHANGELOG.md` `Changed` entry (deployed path moved) and `docs/index.md` rows

Outcome: the skills-standard doc's format-identity claims had no vendor page or read date behind them, so they are marked asserted rather than given a false trail; the other three carry a research section or a per-row vendor read date.
