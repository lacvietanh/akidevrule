# Corpus map — addresses, groups and the cross-cutting lens

`updated 2026-09-30 · v3.5.0`

Maintainer's address map for `payload/`. Not installed and not resident: the router (`skills/akirule/SKILL.md`) is the only map the model carries, and it holds one line per file. This doc exists so a rule is written once — the lens table below records which file holds the root of a subject that several files touch, and it is an address map only, never rule text. Was `payload/index.md` until 2026-09-30 (`../plan/done/resident-context-slim-sep28.md` Item 1).

## Addressing scheme — `topic.A1`

Every file is internally organized into groups **A/B/C** (a topic's broad themes) and numbered items **1/2/3…** within each group — e.g. `coding.B2` (Changing existing code), `stack.C1` (Canonical component names). `topic` is the name beside each file in the router's Routes table (`skills/akirule/SKILL.md`) — usually the filename with its `RULE-`/`METHOD-` prefix dropped; the audit methods keep their short topics (`flow`, `zero-trust`, `subtract`, `frozen-ref`). This is purely a recall/reference convention — it does not change routing (still governed by `akirule/SKILL.md`) and does not rename any file.

**`⟨Aki⟩`** marks a group (always the last group in its file) that is specific to Aki's own AkiNuxtCf ecosystem rather than universal — currently `seo.C`, `release.C`, `stack.C`. These groups stay in this public repo (auto-load is more useful to Aki, the heaviest user, than a clean public/ private split), but are logically separable if a stripped public export is ever needed. Everything outside a `⟨Aki⟩` group is universal and applies to any project on the matching stack.

| Topic | Groups |
|---|---|
| `agent` | §0 Penalty cards · A Communication · B Scope & decision discipline · C Files & memory |
| `coding` | A Philosophy & source of truth · B Quality, changing code & who verifies · C Runtime safety |
| `pattern` | A The 9 laws · B Decomposition & the forest pass · C Closure |
| `db` | A Data principles · B Unicode |
| `docs` | A Index & Structure · B Lifecycle & Sync · C Drift audit |
| `content` | A Content principles · B Style & patterns · C Separation |
| `seo` | A Meta & structure · B AI visibility & entity · **C ⟨Aki⟩ API & tooling stack** |
| `release` | A Versioning core · B Identify & audit · **C ⟨Aki⟩ Web release artifacts** |
| `stack` | A Cloudflare & TypeScript foundation · B Render · i18n · Vue patterns · **C ⟨Aki⟩ Ecosystem conventions** |
| `tauri` | A Never block the UI · B Boundary & config |
| `ui` | A Taxonomy & tokens · B Component structure · C Audit playbook |
| `think` | A Decision framework · B 5 Modules · C Radar |
| `flow` | A Flow thinking · B 8 first-principles questions · C Closure & output |
| `biz` | A Positioning & audience · B Offer & pricing · C Messaging & customer psychology |
| `ux` | A Lenses · B Walkthrough protocol · C Output & decision |
| `zero-trust` | A Scope-lock · B Mechanical pass first · C Evidence classes · D Signature propagation · E Adversarial self-challenge · F Report |
| `proportion` | A Dimensioning · B Verdict · C Output & reuse |
| `subtract` | A Scope & terminating condition · B The passes · C Output · D Runner |
| `frozen-ref` | A Locate every reference · B Build the comparison mechanically · C Report |

Full item-level breakdown: `../research/public-private-abc-restructure.md`.

## Cross-cutting lens

Some subjects legitimately live in several files: one **root rule** stating the principle, plus **domain applications** that must stay inside their domain (moving them would strip the context where they are actually read). This section is an **address map only — never rule text** — so it stays a pointer, not a duplicate.

| Subject | Root | Domain applications |
|---|---|---|
| **Naming** | `pattern.A7` — name by role, never by concrete value | `agent.C1` file names · `ui.A` design tokens · `stack.C1` ⟨Aki⟩ canonical component names · `release.A3` version/tag format · `content.A3` semantic stability (renaming an existing concept) |
| **External-action completeness** ("done" needs the outside world to move, not just the file) | `coding.B3` — a change requiring a separate action against an external system isn't done when the file describing it is written | `release.B5` ⟨Aki⟩ CHANGELOG/release entry not truthful until a migration/infra step actually ran · `stack.C8` ⟨Aki⟩ D1 migration must run `--remote` and move to `scripts/done/`, a green build alone proves nothing about the database · `release.B10` a push or tag push is not Done until every triggered CI workflow is confirmed green · `release.B11` a deploy is not Done until a data path the release touched is exercised, not only the version |
| **Audit reports, never fixes** (and the output depends on whether the baseline is stable) | `agent.B5` — an audit writes only its report; never mutates git state, never auto-classifies ambiguous work | `docs.C` docs-vs-reality, research+plan doc pair on a published baseline · `content.C2` canonical-term drift, density deletion test, i18n coverage, fact-check sweeps · `release.B7` pre-ship pass/fail gate, no doc · `ui.C` class/token audit playbook · `flow` flow and state drift · `zero-trust` mechanical-first strict sweep, evidence weighted by the mechanism that produced it · `subtract` repo-wide does-this-need-to-exist sweep, terminating on two dry rounds |
| **Sizing a control against its real threat** (severity is impact **and** who can actually reach it) | `proportion.A` — reach, capability, motive, blast radius, each labeled measured or estimated, before any guard is added, kept, or removed | `coding.C1` no defensive guards for impossible internal states · `coding.C4` the security floor this sizing never argues below · `pattern.A2` risk-weighted extraction at the 2nd occurrence for auth/money/permissions · `think.A1` one-way vs two-way door depth · `think.B5` when an edge-case is promoted above the MVP · `ux.C1` findings ranked by severity, never padded flat |
| **Density — the deletion test** (a line exists only if deleting it loses information the reader needs) | `agent.A4` — report density: conclusion-first, no padding, no trimming of load-bearing detail | `coding.B4` code comments (naming first; comment only what code cannot say) · `docs.B3` doc prose · `docs.A5` the auto-loaded instruction file (deletion test plus a majority-of-requests reach bar, since every line is paid on every request) · `content.B2` product copy · akiflow Step 4 output-hygiene floor (the enforcement tier for subagents, which inherit no router) · mechanical detection: `skills/akiflow/scripts/scythe.py` (`[WRAP]`/`[YAP]` only — `[FLUFF]` stays judgment, `agent` §0) |
| **Subtraction before abstraction** (packaging repetition is second-best; not needing it is first) | `think.B4` — what can be deleted, skipped, merged, delayed, or made manual | `pattern.B3` first bullet of the critique gate · `ui.A1` delete/inherit/hoist pass ahead of the tier ladder · `subtract` the repo-wide audit form of the same question, read-only and detector-driven · akiflow's `aki-challenger`, which closes every solution-shaped item on "what can be cut?" |
| **Interrupting the owner** (a question must survive the kill-tests before it costs a read and an answer) | `agent.A3` — impact, already-authorized, silence≠contradiction, reversibility as the fourth, plus escalation outcomes and a `Decided: X · because Y · rejected Z (why) · reopen if W` decision block for what does get self-answered | `coding.B3` one human hand-off ledger per run, deduped by flow · `coding.B3` the six-rung ladder a check must fail before it may be handed to the owner at all, and the one-line reason each survivor carries · `release.B8` a question the repo already answers is a violation; owner-worded criteria decided and reported, escalated only when readings diverge on an irreversible artifact · akiflow Step 4 seat-raised `CONFLICT` filtered through the lead's kill-test pass |
| **Draft, then commit once** (exploration never writes the record; the record changes once, at the commit event) | `pattern.A9` | `ui` map bullet — preview handlers touch a local draft, the drop/enter/save handler writes once · `release.A5` version minted only at the release event, `[Unreleased]` is the draft · `agent.A3` a question is answered, never acted on — the answer is the draft, the owner's order is the commit |
| **Literal parity with a frozen external artifact** (a clause claiming byte/structural identity with a named reference is not satisfied by "looks compliant") | `frozen-ref.A` — resolve the reference to an exact path before judging; read ≥2 implementations when more than one exists, since one reference can itself have drifted | `stack.C1` ⟨Aki⟩ canonical component names — the naming half of this problem · `pattern.A7` root naming rule that frozen-reference structural clauses do not override · `zero-trust.C` evidence-class discipline this method inherits |

Add a lens row only when a subject has actually caused a miss — `pattern.A2` (Rule of Three) applies to this rule corpus too, and so did a real production incident where a migration script shipped in CHANGELOG but was never executed against remote D1 (2026-07-23). The `frozen-ref` row above was added after a private project spent over ten audit sessions re-discovering the same structural drift against its own frozen reference each time, because compliance was judged from the rule's prose instead of a literal diff against the reference file.
