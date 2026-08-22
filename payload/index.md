# Aki-RULE

Shared source-of-truth rules for Aki projects.

## Purpose
Provides reusable rules for agent behavior, coding, content, docs, and stack-specific work. Project `CLAUDE.md` files bind these shared rules to a specific project.

## File manifest

| File | Topic | Tier | Type | Purpose |
|------|-------|------|------|---------|
| `RULE-agent-behavior.md` | `agent` | Core — `@` import in `~/.claude/CLAUDE.md` | public | Core: full text already in context every turn — read it directly, not this summary |
| `RULE-coding.md` | `coding` | Core — `@` import in `~/.claude/CLAUDE.md` | public | Core: full text already in context every turn — read it directly, not this summary |
| `RULE-pattern-core.md` | `pattern` | Core — `@` import in `~/.claude/CLAUDE.md` | public | Core: full text already in context every turn — read it directly, not this summary |
| `RULE-docs.md` | `docs` | Contextual | public | Docs structure (incl. mandatory `docs/biz/` backbone), `updated <date> <version>` anchor stamp on every `arch|biz|feat` doc, plan lifecycle, research doc schema (immutable event record: start time/purpose/strategy/checklist/result+verification/decision+cross-refs), doc-sync behavior, drift audit (when it runs vs the two situations it does not, research+plan doc pair, comparison checklist, wrong/stale/incomplete/cosmetic severity) |
| `RULE-content-write.md` | `content` | Contextual | public | UI copy, semantic stability, writing style (density enforced by deletion test), i18n, content audit (`content.C2` — canonical-term drift, density deletion test, i18n coverage, severity-classified per `docs.C4`) |
| `RULE-stack-akiNuxtCf.md` | `stack` | Contextual | **mixed** — group C is ⟨Aki⟩ | Nuxt/Vue/Cloudflare Pages/Workers, Tailwind, i18n, canonical component names, state (useState-first), build & TypeScript, admin layout isolation, dev workflow scripts (killport/D1), layout chrome (breadcrumb/scroll-to-top), layout width (single source of truth in the layout, pages/apps never redeclare max-w), deploy verification after push |
| `RULE-stack-tauri.md` | `tauri` | Contextual | public | Tauri v2 + Rust: absolute never-block-the-UI rule for any command running a subprocess/network call (`spawn_blocking`), titlebar boundary, version SSOT, IPC capability silent-fail, serde default for persisted JSON, cfg(target_os) scoping, subprocess PATH-resolution cold-start race, salient target context (ship platform) surfaced in the project CLAUDE.md, macOS TCC/Gatekeeper boundary for spawned sidecars (responsible-process attribution, FDA vs Files & Folders vs Developer Tools, sticky denials, ad-hoc signing losing grants on every rebuild, and the read-only scope limit of the whole chain) |
| `RULE-ui-pattern.md` | `ui` | Contextual | public | Frontend enforcement of pattern-core: subtraction pass before any tier (delete/inherit/hoist — the ladder packages repetition, only this removes it), 4-tier class taxonomy with the second copy as the STOP (the ≥3 threshold is repo-wide and unobservable inside one file), inline `style=` as a runtime-only escape hatch, `<style>`-block budget measured in aggregate against the shared layer, design tokens in whichever mechanism the installed framework version uses with one theme source per project, arbitrary-value policy, atomic structure, variant API, two-way lookup-then-record pattern duty, UI audit/refactor playbook led by the inversion check |
| `RULE-seo.md` | `seo` | Contextual | **mixed** — group C is ⟨Aki⟩ | Meta limits, schema.org matrix, robots, sitemap, OG, AI visibility, entity linking |
| `RULE-release.md` | `release` | Contextual | **mixed** — group C is ⟨Aki⟩ | CHANGELOG.md mandatory in every project, release notes vs changelog split, GitHub Release compare-link footer, releases.json (web-only), release vs deploy boundary, cold-start version reconstruction, severity-driven bump, version minted only at the release event (`[Unreleased]` buffer, no local drift ahead of production), audit mode, pre-ship gate expanded into the full-release checklist (B7: leftover triage, diff-scoped hygiene — scythe/dead-code/comment-refs on the accumulation only, never repo-wide), autonomous-run contract (B8: only an explicit `/akiship` invocation is the authorization — activation owned by that skill's literal-token gate, this rule is never itself a trigger; asks front-loaded into one batch, three-case escalation floor and completion-intensity phrase list owned solely by B8 (the `/akiship` skill references, never restates them), redundant questions forbidden; entry point `/akiship`) |
| `RULE-db-design.md` | `db` | Contextual | public | Immutability & Event Sourcing, 1NF, Bounded Context (DDD), flat-query discipline — load when designing schema/migration/DB refactor |
| `RULE-biz.md` | `biz` | Contextual | public | Positioning & audience (one primary audience, falsifiable USP, `docs/biz/` as SSoT, niche-first), offer & pricing (value-based, few tiers, validate before building), messaging & customer psychology (benefit-first, anxiety at decision points, no dark patterns) — load on any market-facing decision |
| `METHOD-audit-flow.md` | `flow` | Analytical | public | Flow integrity audit method |
| `METHOD-deep-think.md` | `think` | Analytical | public | Deep-think brain: goal excavation, first principles, critique, conditional techbiz lens; passive via akirule, active via /akithink |
| `METHOD-ux-psych.md` | `ux` | Analytical | public | UX psychology audit: cognitive-load/recognition/feedback/defaults/motor-cost/mental-model lenses, persona walkthrough protocol (first-run, friction ledger, failure paths, state completeness), severity-weighted output routed through the design system |
| `METHOD-audit-zero-trust.md` | `zero-trust` | Analytical | public | Strict mechanical-first audit: scope locked by command (project-wide or change-plus-callers), detectors run before any opinion, findings split into CERTAIN (exact machine match — a verdict) vs SUGGESTED (pattern/naming — a candidate judgment must settle), signature propagation across the locked scope, short findings-only report. Read-only like every audit |
| `METHOD-proportionality.md` | `proportion` | Analytical | public | Sizing a defense against its real threat: four measures before any verdict (reach against the `docs/biz/` audience, capability ladder, motive, blast radius by recoverability), every number labeled measured or estimated; asymmetry law (irreversibility outranks frequency), the `coding.C4`/`biz.C3` floor that is never sizeable, the cheapest-sufficient-control ladder (impossible by shape → one trust boundary → detect → accept-and-record) with client-side limits classified as UX and never enforcement; verdict record carries a reopen trigger. Seated in akiflow as `risk-sizing` |
| `METHOD-audit-subtraction.md` | `subtract` | Analytical | public | Repo-wide "does this need to exist" sweep: inherits zero-trust's scope-lock, detector-first order, CERTAIN/SUGGESTED classes and signature propagation, changes only the question. Loop-until-dry termination (two empty rounds) because no detector returns "minimal", nine domain passes each delegating detectors to the rule that owns them, subtraction severity classes including the mandatory *load-bearing but ugly* class, Chesterton's Fence as the brake before any CERTAIN removal. Read-only; bulk sweeps route to workers, judgment does not |

Four files load mechanically, not by routing: this `index.md`, `RULE-agent-behavior.md`, `RULE-coding.md` and `RULE-pattern-core.md` are `@`-imported by `~/.claude/CLAUDE.md`, which the harness reads at session start. Routing for every other file is defined in `~/.claude/skills/akirule/SKILL.md` and takes effect only when the model invokes that skill.

The two rule files were promoted out of Tier 1 because "default ON" was a description of intent, not a mechanism: a router that runs only when the model chooses to invoke it cannot guarantee anything, and the rules the owner had to re-state most often (`coding.B4` comment budget, `pattern.A2` Rule of Three, `pattern.A8` fix-at-the-root) turned out to be missing from the context rather than present and ignored. A rule that must hold unconditionally belongs in an `@` import; anything left to the router is best-effort by construction. The cost — both files in every session, including sessions that touch no code — is the price of that guarantee and was accepted knowingly.

## Addressing scheme — `topic.A1`

Every file is internally organized into groups **A/B/C** (a topic's broad themes) and numbered items **1/2/3…** within each group — e.g. `coding.B2` (Changing existing code), `stack.C1` (Canonical component names). `topic` is the manifest's Topic column above — usually the filename with its `RULE-`/`METHOD-` prefix dropped; the audit methods keep their short topics (`flow`, `zero-trust`, `subtract`). This is purely a recall/reference convention — it does not change routing (still governed by `akirule/SKILL.md`) and does not rename any file.

**`⟨Aki⟩`** marks a group (always the last group in its file) that is specific to Aki's own AkiNuxtCf ecosystem rather than universal — currently `seo.C`, `release.C`, `stack.C`. These groups stay in this public repo (auto-load is more useful to Aki, the heaviest user, than a clean public/ private split), but are logically separable if a stripped public export is ever needed. Everything outside a `⟨Aki⟩` group is universal and applies to any project on the matching stack.

| Topic | Groups |
|---|---|
| `agent` | §0 Penalty cards · A Communication · B Scope & decision discipline · C Files & memory |
| `coding` | A Philosophy & source of truth · B Quality, changing code & who verifies · C Runtime safety |
| `pattern` | A The 8 laws · B Decomposition & the forest pass · C Closure |
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

Full item-level breakdown: `docs/research/public-private-abc-restructure.md`.

## Cross-cutting lens

Some subjects legitimately live in several files: one **root rule** stating the principle, plus **domain applications** that must stay inside their domain (moving them would strip the context where they are actually read). This section is an **address map only — never rule text** — so it stays a pointer, not a duplicate.

| Subject | Root | Domain applications |
|---|---|---|
| **Naming** | `pattern.A7` — name by role, never by concrete value | `agent.C1` file names · `ui.A` design tokens · `stack.C1` ⟨Aki⟩ canonical component names · `release.A3` version/tag format · `content.A3` semantic stability (renaming an existing concept) |
| **External-action completeness** ("done" needs the outside world to move, not just the file) | `coding.B3` — a change requiring a separate action against an external system isn't done when the file describing it is written | `release.B5` ⟨Aki⟩ CHANGELOG/release entry not truthful until a migration/infra step actually ran · `stack.C8` ⟨Aki⟩ D1 migration must run `--remote` and move to `scripts/done/`, a green build alone proves nothing about the database |
| **Audit reports, never fixes** (and the output depends on whether the baseline is stable) | `agent.B5` — an audit writes only its report; never mutates git state, never auto-classifies ambiguous work | `docs.C` docs-vs-reality, research+plan doc pair on a published baseline · `content.C2` canonical-term drift, density deletion test, i18n coverage sweeps · `release.B7` pre-ship pass/fail gate, no doc · `ui.C` class/token audit playbook · `flow` flow and state drift · `zero-trust` mechanical-first strict sweep, evidence weighted by the mechanism that produced it · `subtract` repo-wide does-this-need-to-exist sweep, terminating on two dry rounds |
| **Sizing a control against its real threat** (severity is impact **and** who can actually reach it) | `proportion.A` — reach, capability, motive, blast radius, each labeled measured or estimated, before any guard is added, kept, or removed | `coding.C1` no defensive guards for impossible internal states · `coding.C4` the security floor this sizing never argues below · `pattern.A2` risk-weighted extraction at the 2nd occurrence for auth/money/permissions · `think.A1` one-way vs two-way door depth · `think.B5` when an edge-case is promoted above the MVP · `ux.C1` findings ranked by severity, never padded flat |
| **Density — the deletion test** (a line exists only if deleting it loses information the reader needs) | `agent.A4` — report density: conclusion-first, no padding, no trimming of load-bearing detail | `coding.B4` code comments (naming first; comment only what code cannot say) · `docs.B3` doc prose · `content.B2` product copy · akiflow Step 4 output-hygiene floor (the enforcement tier for subagents, which inherit no router) · mechanical detection: `skills/akiflow/scripts/scythe.py` (`[WRAP]`/`[YAP]` only — `[FLUFF]` stays judgment, `agent` §0) |
| **Subtraction before abstraction** (packaging repetition is second-best; not needing it is first) | `think.B4` — what can be deleted, skipped, merged, delayed, or made manual | `pattern.B3` first bullet of the critique gate · `ui.A1` delete/inherit/hoist pass ahead of the tier ladder · `subtract` the repo-wide audit form of the same question, read-only and detector-driven · akiflow's `aki-challenger`, which closes every solution-shaped item on "what can be cut?" |
| **Interrupting the owner** (a question must survive the kill-tests before it costs a read and an answer) | `agent.A3` — impact, already-authorized, silence≠contradiction, with reversibility as the fourth | `coding.B3` one human hand-off ledger per run, deduped by flow · `coding.B5` the six-rung ladder a check must fail before it may be handed to the owner at all, and the one-line reason each survivor carries · `release.B8` a question the repo already answers is a violation · akiflow Step 4 seat-raised `CONFLICT` filtered through the lead's kill-test pass |

Add a lens row only when a subject has actually caused a miss — `pattern.A2` (Rule of Three) applies to this rule corpus too, and so did a real production incident where a migration script shipped in CHANGELOG but was never executed against remote D1 (2026-07-23).

## Precedence
When rules conflict, use this order:
1. Current local source code, runtime output, and build output
2. User's explicit instruction in the current conversation
3. User's standing instructions — `~/.claude/CLAUDE.md` and the machine-local `~/.claude/CLAUDE.local.md`. An item marked ABSOLUTE there is never weakened by anything below it, including a shared rule that grants an autonomy other projects rely on; ordinary guidance there yields to a more specific project rule.
4. Project `CLAUDE.md`
5. Aki-RULE shared files
6. Older docs, memory, or prior conversation context

Project `CLAUDE.md` may add project facts and stricter constraints. It must not silently weaken core safety, verification, or source-of-truth rules.

Corpus-maintenance material (project binding, change policy) lives in the source repo's `README.md` — repo path recorded in `~/.aki/akidevrule/.source-repo`.
