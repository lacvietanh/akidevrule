---
name: akirule
description: Aki's contextual rule router — route EVERY task turn before acting, by what the task means (the domain it touches and the kind of act — write, decide, audit, ship), with listed signals as evidence, never as the test. Domains: code quality and structure (any code file), docs and any .md, UI copy and i18n, frontend components and CSS, SEO, commit/push/deploy/release/CI, database schema and migrations, Nuxt/Cloudflare, Tauri/Rust, pricing and positioning, UX, guards and risk sizing, flow bugs, audits and minimization, conformance to a reference, and any decision or critique. Loads each contextual RULE/METHOD file whose domain the task touches; full corpus on an explicit load-everything request. Core rules are not routed here — the harness embeds them via CLAUDE.md.
user-invocable: false
---

# akirule — contextual rule router

## Delivery

- **Claude Code:** this file is `@`-imported by `~/.claude/CLAUDE.md`, so it is in context every session without a model decision. Do not invoke the skill as well — the routing below is already loaded.
- **Antigravity (IDE and `agy`):** routing is native — every rule is installed as `akirule-<topic>.md` (`agent` `always_on`, the rest by descriptions the installer generates from the routes below), so do not invoke this skill there.
- **Other harnesses (Codex, Kiro, Grok):** it is a skill; invoke it before acting on any task turn.
- **Not routed here:** `RULE-agent-behavior.md` (`agent`) — core, harness-embedded, never `Read` again and never listed as `(router)`.
- **The second hop — reading a routed file — is the model's `Read`, and on Claude Code it is enforced for every route with an artifact signature:** the `aki-route-guard` PreToolUse hook denies the first Edit/Write of each artifact type in a session (code file → `coding`+`pattern`, `.md` → `docs`, `CHANGELOG.md` → `release`, `.vue`/`.css` → `ui`, Nuxt project → `stack`, `.rs` → `tauri`, `.sql` → `db`, `locales/` → `content`) until those files have been read in this transcript; the deny reason names them — read them in full, update the receipt, retry the edit. Routes with no artifact signature (`think`, `proportion`, `biz`, `ux`, the audits) rely on this table alone, so nothing below is optional — it is the reason the receipt exists.

## How to route — meaning first, signals as evidence

1. **Every task turn, before acting**, name the task in two terms: the **domains** it touches (the artifact and its subject) and the **act** (create/change, evaluate/decide, audit/verify, ship). Route on that classification in whatever language or phrasing it arrived. A signal is evidence of a domain, never the test: a request that names no listed signal still routes, a synonym or paraphrase of one counts as the signal itself, and a word used in passing does not.
2. **Load every file whose domain the task touches** — several at once is normal. **When in doubt about the domain, load:** a false positive costs a few tokens, a false negative ships wrong work. **A lookup routes nothing:** a turn that only reads, counts, locates or explains what exists (how big is the source, where is X handled, what does this function do) produces no artifact and passes no judgment, so no rule's act is performed and no file is loaded — the tiering exists for exactly these turns. The rule loads the moment the turn edits, reviews or decides; on Claude Code an under-route is caught by the gate at the first edit. This precedes rules 3 and 5: an artifact type or a project binding is evidence for a task turn, and a lookup is not one.
3. **The artifact type alone is sufficient evidence** — the route applies whether or not the project has the matching folder or maturity.
4. **Skip a file already loaded this conversation.**
5. **A project binding is a standing signal:** when the project's own `CLAUDE.md`/docs bind a stack, a reference implementation, or a domain, its route is ON for every task in that project without waiting for the message to mention it.

## Routes

All files live in `~/.aki/akidevrule/`.

| File · topic | Load when the task … | Signals — each stands for a concept; any synonym, in any language, counts the same (EN · VI) |
|---|---|---|
| `RULE-coding.md` · `coding` | creates or changes code, config, a script, a query, or judges how code is written or verified — a review, a bug diagnosis, "is it done?"; ON for every code edit, OFF for a lookup that only reads, counts or explains code | any code file (`.ts` `.js` `.vue` `.rs` `.py` `.go` `.sh` `.sql` `.css` …), function, module, bug fix, comment, error handling, verification, test, build, "is it done / verified?" · viết code, sửa code, sửa lỗi, kiểm tra, xong chưa |
| `RULE-pattern-core.md` · `pattern` | designs, extracts, splits, abstracts, guards, names or reviews structure — every turn `coding` is ON for, plus a design discussion before an edit exists; never a lookup | duplicate, abstraction, helper, shared/base module, extract, split, responsibility, boundary, repeated guard or fallback, naming, a value written twice, draft vs commit, live preview writing through · trùng lặp, tách hàm, gom chung, đặt tên, cấu trúc, chắp vá, xem trước mà đã ghi |
| `RULE-docs.md` · `docs` | creates, edits, moves or completes any Markdown, doc, plan, instruction file (`CLAUDE.md`, `SKILL.md`, `README`, `CHANGELOG`), or checks docs against the code | any `.md`, `docs/**`, `SKILL.md`; docs, plan, README, diagram, mermaid, architecture, drift, stale/outdated docs · tài liệu, sơ đồ, kiến trúc, lệch, lỗi thời, rà soát tài liệu |
| `RULE-content-write.md` · `content` | writes, renames, translates or audits text an end user reads — UI copy, messages, labels, i18n strings, page metadata copy, articles and posts | button/label/heading, error message, tooltip, empty state, tone, i18n, locale, translation, `locales/**`, renaming a user-facing term, article, blog/news post, announcement, content data file (`posts.ts`, `content/**`) · nội dung giao diện, nhãn, thông báo lỗi, bản dịch, bài viết, tin tức, bài đăng |
| `RULE-stack-akiNuxtCf.md` · `stack` | works in a Nuxt / Vue / Cloudflare Pages-Workers project — ON for the whole project when its binding names that stack | `.vue`, `nuxt.config`, `wrangler.toml`, Nuxt, Vue, Cloudflare Workers/Pages, D1, KV, Nitro, composable, middleware, `useFetch`, breadcrumb, layout width |
| `RULE-stack-tauri.md` · `tauri` | works in a Tauri / Rust desktop project — ON for the whole project | `.rs`, `src-tauri/`, `tauri.conf.json`, `Cargo.toml`, `#[tauri::command]`, IPC, `spawn_blocking`, freeze, hang, blocking UI, settings breaking after an upgrade · treo app, đứng app, đơ, khựng |
| `RULE-ui-pattern.md` · `ui` | builds, styles, minimizes or audits frontend components, classes, tokens or style blocks, or implements a pointer/keyboard gesture | `.vue`/`.css`/`.scss`/`.tsx`, Tailwind, class, style block, inline style, design token, variant, `@apply`, `@theme`, arbitrary value, duplicate/bloated CSS, looks inconsistent, drag and drop, reorder, resize, slider, live preview then commit · dọn CSS, class trùng, tối giản CSS, nhiều CSS quá, kéo thả, sắp xếp lại, xem trước |
| `RULE-seo.md` · `seo` | shapes how pages are found or represented — metadata, structured data, sitemap/robots, canonical/hreflang, search or AI visibility, entity identity | SEO, meta title/description, OG image, JSON-LD, schema.org, sitemap, robots, canonical, hreflang, trailing slash, absolute vs relative URL, image path, AI visibility, not indexed · không lên Google, link ảnh |
| `RULE-release.md` · `release` | records, versions, commits, pushes, tags, publishes, deploys or migrates; watches CI or verifies a deploy; or asks whether finished work is shippable | commit, push, deploy, tag, release, release notes, `CHANGELOG`, version, semver, bump, publish, npm/registry, 2FA/OTP, CI, GitHub Actions, migration, post-deploy, health check, "is it done / ready to ship?" · phát hành, phiên bản, nâng version, đẩy lên, triển khai, xong chưa, CI đỏ |
| `RULE-db-design.md` · `db` | designs or changes the shape of stored data — schema, migration, query structure, data refactor | `.sql`, `migrations/`, schema, table, column, index, D1, SQL, ERD, event sourcing, normalization, keeping history of a value, choosing a database · thiết kế DB, đổi schema, thêm cột |
| `RULE-biz.md` · `biz` | makes a market-facing decision — audience, positioning, pricing, offer, sales/landing copy, `docs/biz/` | pricing, plan/tier, subscription, monetization, revenue, positioning, USP, target audience, customer, market, conversion, landing page, `docs/biz/` · định giá, gói, khách hàng, thị trường, định vị, doanh thu |
| `METHOD-audit-flow.md` · `flow` | refactors or debugs across a chain of steps or files, or meets guards/fallbacks accumulating around one path, async/state/timing trouble | refactor, restructure, simplify, fragile, flaky, race condition, timing, state machine, async chain, nested conditionals, repeated guards, patchwork, a guard or fallback for a state the docs rule out, a fix that keeps not holding · luồng xử lý, điều kiện lồng nhau, tái cấu trúc, chắp vá, hiển nhiên, native flow, lúc được lúc không |
| `METHOD-deep-think.md` · `think` | evaluates, decides, critiques or discusses rather than only executes — approach choice, tradeoff, scope, value, strategy, a review of an idea/plan/rule | should we, is it worth it, which option, tradeoff, scope, first principles, critique, pre-mortem, edge case, side effect, one-way door, stuck after repeated failures, the owner hands over the decision, conflicting instructions, ambiguous wording · có nên, có đáng, đánh giá, phản biện, bế tắc, thử lại vẫn lỗi, tự chốt, mâu thuẫn |
| `METHOD-ux-psych.md` · `ux` | judges an interface or flow by how users will behave | UX, usability, onboarding, user flow, friction, cognitive load, drop-off, conversion, no feedback after an action, dead end, dark pattern · khó dùng, rối, trải nghiệm người dùng, bỏ ngang |
| `METHOD-proportionality.md` · `proportion` | adds, keeps, sizes or removes a guard, limit, validation or permission, or accepts a risk deliberately | rate limit, quota, throttle, abuse, spam, bot, bypass, tamper, client-side check, hardening, threat model, over-engineering, overkill · chặn, giới hạn, lạm dụng, phòng thủ, vẽ vời, rủi ro, mấy ai làm được |
| `METHOD-audit-zero-trust.md` · `zero-trust` | demands an uncompromising, proof-driven sweep of a project or of a change plus everything that reads it | zero-trust audit, strict audit, sweep the whole project, miss nothing, prove it with tool output · audit khắt khe, rà soát toàn bộ, quét tuyệt đối, chứng minh sạch |
| `METHOD-audit-subtraction.md` · `subtract` | asks to minimize, strip or clean out what no longer needs to exist | dead code, unused, unreferenced, bloat, redundant guard or fallback, comment restating a known fact, strip down, lean as possible, heavy cleanup · code chết, code thừa, hiển nhiên, tối giản tối đa, dọn sạch repo, tinh gọn |
| `METHOD-audit-frozen-reference.md` · `frozen-ref` | judges conformance to a concrete reference implementation (another repo, a pinned version, a specific file) at any strictness | frozen/pinned reference, canonical implementation, reference project, template repo, byte-identical, structurally identical, drifted from the original · đối chiếu, giống hệt, y hệt, lệch chuẩn, khớp chuẩn, so với dự án gốc |

**Publishable writing** — a task that writes, rewrites or translates an article, news or blog post, announcement or knowledge entry, in any wording, including "turn this release/finding into a post": invoke the `aki-article-writer` skill (the procedure) and load `content` and `seo` (the rules).

**Sequential full audit** — the task asks to check a codebase thoroughly across every standard, one after another: load `zero-trust`, `flow`, `subtract`, `docs`, `content`, plus `ui` for a frontend, and run the passes in this order, each read-only: detectors (`zero-trust.B`) → structure (`pattern` laws, `flow`) → subtraction (`subtract`) → docs drift both directions (`docs.C`) → content (`content.C2`). One report, severity-ranked; fixes are a separate run (`agent.B5`).

**Deep-think depth** — when the `deep-think` route fires and the decision is a one-way door, the goal is unclear, it changes documented design or shared rules, or an `agent.A3` trigger holds: run `/akithink` in self-run mode without asking. The interactive session runs only when the owner asks for one.

## Full load

The owner asks, in any wording, to load the whole corpus: `ls ~/.aki/akidevrule/RULE-*.md ~/.aki/akidevrule/METHOD-*.md`, read every file (never `ref-ECC/`), and mark the set `(router:full)` in the receipt.

## Load confirmation — the `[RULES]` receipt

One line at the start of the response, reporting the **whole rule context**:

```
[RULES] agent (core) + coding,pattern,docs (router)
```

| Element | Rule |
|---|---|
| Names | the topic beside each file in the Routes table, `agent` for the core file — no new vocabulary. An item inside a file is addressed `topic.A1`: group letter, item number (`coding.B2`) |
| `(core)` | the `@`-imported rule file, always listed (`agent`): its presence is otherwise unobservable |
| `(router)` | files this router loaded; full load writes `(router:full)` |
| `(brief)` | a worker/subagent's files named by its spawning prompt and actually read — it inherits no router, and emits the line first in its single round (`agent.A5`) |

**Mandatory:** the session agent emits it on its first response and on every turn where the set changes; a worker always. A later turn without one means exactly: set unchanged. The line is self-reported — a diagnostic signal, never evidence of conduct (`agent.B2`).
