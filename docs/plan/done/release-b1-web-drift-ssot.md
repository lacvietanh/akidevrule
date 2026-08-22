# release.B1 web-drift threshold + akiship SSOT consolidation — execution record

Decision record: [../../research/release-b1-web-drift-ssot-aug22.md](../../research/release-b1-web-drift-ssot-aug22.md). Executed 2026-08-22, same session as the decision.

## Changes applied

| File | Change |
|------|--------|
| `payload/RULE-release.md` | B1 step 3: web apps confirm the production baseline (step 4b) before concluding *Pre-bump*/*Mid-release*; *Unreleased open* needs no remote check. B1 Drifted row: threshold typed per app (web ≥1, distributed-artifact ≥2) and the recovery action now states its direction — squash backward per A5, never backfill an orphan forward as a tag/Release. B8: escalation-floor and completion-intensity bullets labeled canonical (`pattern.A1`), referenced by `/akiship` and `README.md`. A5 wording untouched (owner constraint). |
| `skills/akiship/SKILL.md` | Frontmatter `description:` and § Activation gate trimmed to one guarded exemplar ("trọn vẹn") + pointer to `release.B8` for the canonical list; Phase 1 step 3, Phase 3 step 4, and the Boundaries push line reduced to B8 pointers with minimal gloss. The skill now owns only the activation gate and phase sequencing. |
| `payload/index.md` | RULE-release manifest row: three-condition enumeration replaced with "escalation floor and completion-intensity phrase list owned solely by B8". |
| `README.md` | akiship row: verbatim phrase list replaced with a B8 pointer + exemplar. |
| `CHANGELOG.md` | Two `Fixed` entries under `## [Unreleased]` (per `release.A5` — this repo's 2.6.0 is already released). |

## Verification

- Static reading is the settling tier (`coding.B3`): all changes are rule prose; grep confirms the four-phrase list now appears exactly once in the repo's live rule text (`release.B8`), with only guarded exemplars elsewhere.
- Checked and deliberately unchanged: `skills/akirule/SKILL.md` (its akiship keywords are routing signals, already labeled "load, never start"), `docs/arch/rule-delivery-architecture.md` (states the residency rule generically), core rule files and the `index.md` cross-cutting lens (all release pointers within policy).
- Not runtime-verifiable here: the B1 behavior change fires on the next real `/akiship` run against a web project with an orphan version — expected outcome is Drifted → squash, never backfill.

## Owner steps (Mac)

```bash
bash /Volumes/DEV/AkiDevRule/install.sh   # propagate payload/ + skills/ to installed copies
```

Then commit from the Mac per `CLAUDE.local.md` (this box never commits). No migration, no deploy — rule corpus only.
