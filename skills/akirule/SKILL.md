---
name: akirule
description: Aki's contextual rule router — route EVERY task turn before acting, by what the task means (the domain it touches and the kind of act — write, decide, audit, ship), with listed signals as evidence, never as the test. Domains: docs and any .md, UI copy and i18n, frontend components and CSS, SEO, commit/push/deploy/release/CI, database schema and migrations, Nuxt/Cloudflare, Tauri/Rust, pricing and positioning, UX, guards and risk sizing, flow bugs, audits and minimization, conformance to a reference, and any decision or critique. Loads each contextual RULE/METHOD file whose domain the task touches; full corpus on an explicit load-everything request. Core rules are not routed here — the harness embeds them via CLAUDE.md.
user-invocable: false
---

# akirule — contextual rule router

## Delivery

- **Claude Code:** this file is `@`-imported by `~/.claude/CLAUDE.md`, so it is in context every session without a model decision. Do not invoke the skill as well — the routing below is already loaded.
- **Antigravity (IDE and `agy`):** routing is native — every rule is installed as `akirule-<topic>.md` (`agent` `always_on`, the rest by descriptions the installer generates from the routes below), so do not invoke this skill there.
- **Other harnesses (Codex, Kiro, Grok):** it is a skill; invoke it before acting on any task turn.
- **Not routed here:** `index.md`, `RULE-agent-behavior.md`, `RULE-coding.md`, `RULE-pattern-core.md` — core, harness-embedded, never `Read` again and never listed as `(router)`.
- What stays best-effort is the second hop: reading a routed file is still the model's `Read`. Nothing below is optional because of that — it is the reason the receipt exists.

## How to route — meaning first, signals as evidence

1. **Every task turn, before acting**, name the task in two terms: the **domains** it touches (the artifact and its subject) and the **act** (create/change, evaluate/decide, audit/verify, ship). Route on that classification in whatever language or phrasing it arrived. A signal is evidence of a domain, never the test: a request that names no listed signal still routes, a synonym or paraphrase of one counts as the signal itself, and a word used in passing does not.
2. **Load every file whose domain the task touches** — several at once is normal. **When in doubt, load:** a false positive costs a few tokens, a false negative ships wrong work.
3. **The artifact type alone is sufficient evidence** — the route applies whether or not the project has the matching folder or maturity.
4. **Skip a file already loaded this conversation.**
5. **A project binding is a standing signal:** when the project's own `CLAUDE.md`/docs bind a stack, a reference implementation, or a domain, its route is ON for every task in that project without waiting for the message to mention it.

## Routes

All files live in `~/.aki/akidevrule/`.

| File | Load when the task … | Signals — each stands for a concept; any synonym, in any language, counts the same (EN · VI) |
|---|---|---|
| `RULE-docs.md` | creates, edits, moves or completes any Markdown, doc, plan, instruction file (`CLAUDE.md`, `SKILL.md`, `README`, `CHANGELOG`), or checks docs against the code | any `.md`, `docs/**`, `SKILL.md`; docs, plan, README, diagram, mermaid, architecture, drift, stale/outdated docs · tài liệu, sơ đồ, kiến trúc, lệch, lỗi thời, rà soát tài liệu |
| `RULE-content-write.md` | writes, renames or audits text an end user reads — UI copy, messages, labels, i18n strings, page metadata copy | button/label/heading, error message, tooltip, empty state, tone, i18n, locale, translation, `locales/**`, renaming a user-facing term · nội dung giao diện, nhãn, thông báo lỗi, bản dịch |
| `RULE-stack-akiNuxtCf.md` | works in a Nuxt / Vue / Cloudflare Pages-Workers project — ON for the whole project when its binding names that stack | `.vue`, `nuxt.config`, `wrangler.toml`, Nuxt, Vue, Cloudflare Workers/Pages, D1, KV, Nitro, composable, middleware, `useFetch`, breadcrumb, layout width |
| `RULE-stack-tauri.md` | works in a Tauri / Rust desktop project — ON for the whole project | `.rs`, `src-tauri/`, `tauri.conf.json`, `Cargo.toml`, `#[tauri::command]`, IPC, `spawn_blocking`, freeze, hang, blocking UI, settings breaking after an upgrade · treo app, đứng app, đơ, khựng |
| `RULE-ui-pattern.md` | builds, styles, minimizes or audits frontend components, classes, tokens or style blocks | `.vue`/`.css`/`.scss`/`.tsx`, Tailwind, class, style block, inline style, design token, variant, `@apply`, `@theme`, arbitrary value, duplicate/bloated CSS, looks inconsistent · dọn CSS, class trùng, tối giản CSS, nhiều CSS quá |
| `RULE-seo.md` | shapes how pages are found or represented — metadata, structured data, sitemap/robots, canonical/hreflang, search or AI visibility, entity identity | SEO, meta title/description, OG image, JSON-LD, schema.org, sitemap, robots, canonical, hreflang, trailing slash, AI visibility, not indexed · không lên Google |
| `RULE-release.md` | records, versions, commits, pushes, tags, publishes, deploys or migrates; watches CI or verifies a deploy; or asks whether finished work is shippable | commit, push, deploy, tag, release, release notes, `CHANGELOG`, version, semver, bump, publish, npm/registry, 2FA/OTP, CI, GitHub Actions, migration, post-deploy, health check, "is it done / ready to ship?" · phát hành, phiên bản, nâng version, đẩy lên, triển khai, xong chưa, CI đỏ |
| `RULE-db-design.md` | designs or changes the shape of stored data — schema, migration, query structure, data refactor | `.sql`, `migrations/`, schema, table, column, index, D1, SQL, ERD, event sourcing, normalization, keeping history of a value, choosing a database · thiết kế DB, đổi schema, thêm cột |
| `RULE-biz.md` | makes a market-facing decision — audience, positioning, pricing, offer, sales/landing copy, `docs/biz/` | pricing, plan/tier, subscription, monetization, revenue, positioning, USP, target audience, customer, market, conversion, landing page, `docs/biz/` · định giá, gói, khách hàng, thị trường, định vị, doanh thu |
| `METHOD-audit-flow.md` | refactors or debugs across a chain of steps or files, or meets guards/fallbacks accumulating around one path, async/state/timing trouble | refactor, restructure, simplify, fragile, flaky, race condition, timing, state machine, async chain, nested conditionals, repeated guards, patchwork, a guard or fallback for a state the docs rule out, a fix that keeps not holding · luồng xử lý, điều kiện lồng nhau, tái cấu trúc, chắp vá, hiển nhiên, native flow, lúc được lúc không |
| `METHOD-deep-think.md` | evaluates, decides, critiques or discusses rather than only executes — approach choice, tradeoff, scope, value, strategy, a review of an idea/plan/rule | should we, is it worth it, which option, tradeoff, scope, first principles, critique, pre-mortem, edge case, side effect, one-way door, stuck after repeated failures, the owner hands over the decision, conflicting instructions, ambiguous wording · có nên, có đáng, đánh giá, phản biện, bế tắc, thử lại vẫn lỗi, tự chốt, mâu thuẫn |
| `METHOD-ux-psych.md` | judges an interface or flow by how users will behave | UX, usability, onboarding, user flow, friction, cognitive load, drop-off, conversion, no feedback after an action, dead end, dark pattern · khó dùng, rối, trải nghiệm người dùng, bỏ ngang |
| `METHOD-proportionality.md` | adds, keeps, sizes or removes a guard, limit, validation or permission, or accepts a risk deliberately | rate limit, quota, throttle, abuse, spam, bot, bypass, tamper, client-side check, hardening, threat model, over-engineering, overkill · chặn, giới hạn, lạm dụng, phòng thủ, vẽ vời, rủi ro, mấy ai làm được |
| `METHOD-audit-zero-trust.md` | demands an uncompromising, proof-driven sweep of a project or of a change plus everything that reads it | zero-trust audit, strict audit, sweep the whole project, miss nothing, prove it with tool output · audit khắt khe, rà soát toàn bộ, quét tuyệt đối, chứng minh sạch |
| `METHOD-audit-subtraction.md` | asks to minimize, strip or clean out what no longer needs to exist | dead code, unused, unreferenced, bloat, redundant guard or fallback, comment restating a known fact, strip down, lean as possible, heavy cleanup · code chết, code thừa, hiển nhiên, tối giản tối đa, dọn sạch repo, tinh gọn |
| `METHOD-audit-frozen-reference.md` | judges conformance to a concrete reference implementation (another repo, a pinned version, a specific file) at any strictness | frozen/pinned reference, canonical implementation, reference project, template repo, byte-identical, structurally identical, drifted from the original · đối chiếu, giống hệt, y hệt, lệch chuẩn, khớp chuẩn, so với dự án gốc |

**Sequential full audit** — the task asks to check a codebase thoroughly across every standard, one after another: load `zero-trust`, `flow`, `subtract`, `docs`, `content`, plus `ui` for a frontend, and run the passes in this order, each read-only: detectors (`zero-trust.B`) → structure (`pattern` laws, `flow`) → subtraction (`subtract`) → docs drift both directions (`docs.C`) → content (`content.C2`). One report, severity-ranked; fixes are a separate run (`agent.B5`).

**Deep-think depth** — when the `deep-think` route fires and the decision is a one-way door, the goal is unclear, it changes documented design or shared rules, or an `agent.A3` trigger holds: run `/akithink` in self-run mode without asking. The interactive session runs only when the owner asks for one.

## Full load

The owner asks, in any wording, to load the whole corpus: `ls ~/.aki/akidevrule/RULE-*.md ~/.aki/akidevrule/METHOD-*.md`, read every file (never `ref-ECC/`), and mark the set `(router:full)` in the receipt.

## Load confirmation — the `[RULES]` receipt

One line at the start of the response, reporting the **whole rule context**:

```
[RULES] agent,coding,pattern (core) + docs,ui (router)
```

| Element | Rule |
|---|---|
| Names | topic addresses from the `index.md` manifest Topic column — no new vocabulary |
| `(core)` | the three core rule files, always listed: their presence is otherwise unobservable |
| `(router)` | files this router loaded; full load writes `(router:full)` |
| `(brief)` | a worker/subagent's files named by its spawning prompt and actually read — it inherits no router, and emits the line first in its single round (`agent.A5`) |

**Mandatory:** the session agent emits it on its first response and on every turn where the set changes; a worker always. A later turn without one means exactly: set unchanged. The line is self-reported — a diagnostic signal, never evidence of conduct (`agent.B2`).
