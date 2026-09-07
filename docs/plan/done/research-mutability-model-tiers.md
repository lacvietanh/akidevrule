# Research-doc mutability and model-tier host resolution

Executed 2026-09-08, closing two pinned owner notes from 2026-08-22.

| Note | Research | Change |
|---|---|---|
| research docs are not truly immutable, but should be; still need corrections | `docs/research/research-doc-mutability-sep08.md` | `docs.B2` rewritten: frozen body, four edit classes, `## Amendments` + `Status: amended` for errata, successor doc only when the Decision changes; `docs.C3` research row; `payload/index.md` manifest; README layout line |
| Cursor support and a model-tier system instead of hardcoded Claude models | `docs/research/model-tier-host-resolution-sep08.md` | `harness-facts.md` § Model tiers › Host resolution table; `akiflow/SKILL.md` roster/lane examples in tier words and the resolution rule in Step 2; `claude/agents/*.md` frontmatter deliberately unchanged |

Verified: scythe on every touched file; `bash install.sh` propagated; `grep -c "(sonnet)\|(haiku)" ~/.claude/skills/akiflow/SKILL.md` = 0; deployed `RULE-docs.md` carries `## Amendments`. Not verifiable here: how Cursor treats `model: haiku` in a `~/.claude/agents/` file (rung 3 exhausted, vendor docs silent; reopen trigger recorded in the table row).

Left open from the same note batch: Cursor preallowlist for skill scripts (Cursor's permission format not yet researched), model tiers per CLI beyond the six hosts tabled.
