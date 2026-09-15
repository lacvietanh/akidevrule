---
name: akirule
description: Aki's contextual rule router — invoke BEFORE acting whenever the task touches any of - .md/.vue/.css/.tsx/.rs/.sql files; docs, plan, README, CHANGELOG; UI, component, CSS, tailwind; SEO, schema, sitemap; release, version, commit, push, deploy; DB schema, migration; Tauri; i18n, UI copy; pricing, biz; UX review; refactor, flow tracing; audit or minimize sweeps; big decisions (should we / có nên). Full corpus load on "nạp full". Core rules are not routed here — the harness embeds them via CLAUDE.md.
user-invocable: false
---

## What this skill does and does not guarantee

**Nothing in this file is guaranteed to run.** A skill loads only when the model chooses to invoke it, so every rule routed below is best-effort.

The rules that must apply unconditionally are not here. `index.md`, `RULE-agent-behavior.md`, `RULE-coding.md` and `RULE-pattern-core.md` are embedded by the harness through `@` imports in `~/.claude/CLAUDE.md`, which is read mechanically at session start. Do not move them back into this file: an `@` path inside a skill body is not expanded by the harness the way it is inside `CLAUDE.md`, so declaring them here would look like an import while loading nothing.

The last two used to be routed here as "default ON" Tier 1 entries. That phrasing promised a guarantee the mechanism could not deliver — a file routed by a skill loads only if the model first decides to invoke the skill — and the observed failure was not the rules being read and ignored but never being read at all. Do not re-add them below: they are already in context on every turn, so a signal block for them would only produce a redundant `Read`.

## Addressing scheme (recall only — does not affect routing)

Every rule file is internally organized into groups `A`/`B`/`C` and numbered items `1`/`2`/`3…` (e.g. `coding.B2`, `stack.C1`). `topic` = the manifest's Topic column in `index.md` — usually the filename minus its `RULE-`/`METHOD-` prefix; the audit methods keep their short topics (`flow`, `zero-trust`, `subtract`). This is a naming convention for referring to a specific rule precisely — it has no effect on which files load or when; that is still governed entirely by the tiers below. Full map: `~/.aki/akidevrule/index.md`.

---

## Tier 1 — Contextual loading

**Sensitivity bias: when in doubt, load. A false positive (loading an unused file) costs a few tokens. A false negative (missing a rule) causes wrong behavior.**

Before responding, scan the user message and any file paths mentioned. For each rule below: if ANY single signal matches → Read that file immediately, before generating a response.

Skip the Read if that file was already loaded earlier in this conversation — a signal match on an already-loaded rule costs a redundant Read and changes nothing.

**A file extension alone is a sufficient signal.** Touching a `.md` loads `RULE-docs.md`; a `.vue`/`.css` loads `RULE-ui-pattern.md`; `.rs`/`Cargo.toml` loads `RULE-stack-tauri.md`; `.sql`/`migrations/` loads `RULE-db-design.md`. The project does **not** need a matching folder structure, a `docs/` tree, or an existing design system first — match on what is being touched, not on how mature the project is. The keyword and action lists below are additional entry points, never a required second condition.

### RULE-coding.md · RULE-pattern-core.md — not routed, already loaded
Both are core `@` imports (see the section above) and are in context on every turn without this skill running. Nothing to match, nothing to `Read`, and they never appear in a load-confirmation line.

### RULE-docs.md
Load if message or file path contains any of:
- **Keywords:** `docs`, `CLAUDE.md`, `README`, `PLAN`, `plan/`, `diagram`, `mermaid`, `architecture`, `arch/`, `doc sync`, `documentation`, `docs/feat/`, `plan lifecycle`, `tài liệu`, `sơ đồ`, `kiến trúc`
- **Keywords (drift audit):** `drift`, `audit docs`, `stale docs`, `outdated docs`, `out of date`, `docs khớp code`, `còn khớp`, `lệch`, `lỗi thời`, `rà soát tài liệu`, `docs cũ`, `kiểm tra tài liệu`
- **Paths:** **any `.md` file, anywhere** — writing or editing Markdown *is* a docs task; do not wait for a `docs/` folder to exist. Also `docs/**`, `PLAN.md`, `CLAUDE.md`, `README.md`, `CHANGELOG.md`, `*.mdx`, `SKILL.md`
- **Actions:** creating, editing, moving, or completing any plan or doc file; checking whether docs still match the code after the fact (`docs.C`)

### RULE-content-write.md
Load if message or file path contains any of:
- **Keywords:** `button`, `label`, `heading`, `error message`, `tooltip`, `empty state`, `i18n`, `locale`, `translation`, `t(`, `$t(`, `meta title`, `meta description`, `og:`, `JSON-LD`, `FAQ`, `landing page`, `UI text`, `nội dung UI`, `nội dung giao diện`, `nhãn`, `thông báo lỗi`, `semantic stability`
- **Paths:** `locales/**`, `i18n/**`, `*.i18n.*`, `public/content/**`; any file where a string a user will read is being added or renamed
- **Actions:** renaming a concept or term used across the product

### RULE-stack-akiNuxtCf.md
**Default ON when the project CLAUDE.md references the Aki web stack (Nuxt/Cloudflare — AkiNuxtCf).** Skip only when the task is provably stack-independent (plain markdown, isolated script, config unrelated to the Aki frontend stack). Load if message or file path contains any of:
- **Keywords:** `nuxt`, `vue`, `cloudflare`, `cloudflare workers`, `cf workers`, `wrangler`, `tailwind`, `composable`, `middleware`, `nuxt layout`, `nuxt plugin`, `component`, `useRoute`, `useFetch`, `definePageMeta`, `nitro`, `vite`, `breadcrumb`, `scroll-to-top`, `back-to-home`, `layout chrome`, `useBreadcrumb`
- **Paths:** `components/**`, `pages/**`, `composables/**`, `layouts/**`, `plugins/**`, `middleware/**`, `wrangler.toml`, `nuxt.config.*`, `tailwind.config.*`, `app.vue`

### RULE-ui-pattern.md
Load if message or file path contains any of:
- **Keywords (enforcement):** `component`, `vue`, `nuxt`, `tailwind`, `css`, `class`, `style`, `design token`, `token`, `variant`, `design system`, `atomic design`, `pattern class`, `@apply`, `@layer`, `BaseButton`, `c-btn`, `c-card`
- **Keywords (audit):** `dọn dẹp`, `class trùng`, `duplicate class`, `duplicate CSS`, `trùng lặp`, `audit CSS`, `refactor CSS`, `refactor UI`, `arbitrary value`, `quét class`, `w-[`, `text-[`
- **Keywords (minimization):** `tối giản`, `giảm CSS`, `bớt CSS`, `minimize CSS`, `reduce CSS`, `gọn lại`, `CSS rác`, `style block`, `inline style`, `scoped style`, `@theme`, `theme block`, `token drift`, `nhiều CSS quá`, `code CSS nhiều`
- **Paths:** any `.vue`, `.css`, `.scss`, or `.tsx`; `components/**`, `assets/css/**`, `tailwind.config.*`
- **Actions:** writing/refactoring any component or style; auditing a frontend codebase for DRY/SOLID violations

### RULE-seo.md
Load if message or file path contains any of:
- **Keywords:** `seo`, `schema`, `sitemap`, `robots`, `canonical`, `usePageSeo`, `useSchemaOrg`, `JSON-LD`, `structured data`, `og:`, `ogImage`, `hreflang`, `alternateName`, `sameAs`, `knowsAbout`, `LLM visibility`, `AI visibility`, `AI Overview`, `entity`, `schema.org`, `DefinedTerm`, `validate-seo`, `meta title`, `meta description`, `OG image`, `trailing slash`
- **Paths:** `docs/seo/**`, `docs/ref/seo*`, `scripts/validate-seo*`, `composables/usePageSeo*`, `composables/useSeoSchemas*`
- **Actions:** creating a new page, adding schema, configuring sitemap or robots

### RULE-release.md
Load if message or file path contains any of:
- **Keywords:** `release`, `release note`, `release notes`, `changelog`, `CHANGELOG`, `version`, `versioning`, `semver`, `bump`, `bump version`, `major.minor.patch`, `releases.json`, `phát hành`, `phiên bản`, `cập nhật phiên bản`, `nâng version`
- **Paths:** `CHANGELOG.md`, `app/data/releases.json`, `pages/releases/**`
- **Keywords (pre-ship gate):** `chưa push`, `trước khi push`, `trước khi deploy`, `sắp release`, `chuẩn bị ship`, `pre-release`, `ready to ship`, `xong chưa`, `đã xong hết chưa`
- **Keywords (release-ritual context — these load this rule file, they never start a run; activation is owned entirely by akiship's own gate, an imperative release order):** `akiship`, `full release`, `release trọn gói`, `chạy full release`, `ship đợt này`, `ship trọn gói`
- **Keywords (commit/push/deploy — load even without an explicit "release" word):** `commit`, `git commit`, `push`, `git push`, `deploy`, `deployment`, `git tag`, `ship it`, `commit và push`, `push lên`, `đẩy lên`, `triển khai`
- **Keywords (registry publish — `release.B9`):** `npm publish`, `publish`, `npm`, `npx`, `registry`, `crates.io`, `cargo publish`, `PyPI`, `twine`, `2FA`, `OTP`, `lên npm`
- **Keywords (post-push CI — `release.B10`):** `CI`, `GitHub Actions`, `workflow run`, `gh run`, `CI fail`, `CI đỏ`, `build fail`, `test fail`
- **Actions:** committing or pushing code, deploying, shipping a change that should be recorded for users or maintainers; bumping a version; checking whether finished-but-unpushed work is actually shippable (`release.B7`); running the full release ritual unattended (`release.B8`, `/akiship`); verifying CI after a push (`release.B10`)

### RULE-stack-tauri.md
**Default ON for any Tauri project context.** Skip only when the task is provably unrelated to the Tauri/Rust backend (pure frontend copy change with no `src-tauri` involvement, isolated doc edit). Load if message or file path contains any of:
- **Keywords:** `tauri`, `#[tauri::command]`, `invoke(`, `spawn_blocking`, `async_runtime`, `Cargo.toml`, `tauri.conf.json`, `capabilities`, `IPC`, `blocking UI`, `freeze`, `treo app`, `đứng app`, `block UI`
- **Paths:** any `.rs`; `src-tauri/**`, `tauri.conf.json`, `Cargo.toml`, `capabilities/*.json`
- **Actions:** adding/editing any `#[tauri::command]`, touching window/IPC code, bumping app version, diagnosing an app freeze/hang

### RULE-db-design.md
Load if message or file path contains any of:
- **Keywords:** `schema`, `migration`, `D1`, `SQL`, `database design`, `ERD`, `refactor DB`, `event sourcing`, `bounded context`, `normalization`, `1NF`, `table design`, `thiết kế db`, `thiết kế database`, `migration DB`
- **Paths:** any `.sql`; `migrations/**`, `schema.sql`, `**/d1/**`
- **Actions:** designing a new table/schema, writing a DB migration, refactoring how data is stored

### METHOD-audit-flow.md
Load if message contains any of:
- **Keywords:** `refactor`, `restructure`, `simplify`, `fragile`, `complicated`, `state machine`, `async chain`, `tại sao phức tạp`, `luồng`, `luồng xử lý`, `tracing`, `cause and effect`, `over-guarded`, `nested conditional`, `điều kiện lồng nhau`, `timing issue`, `race condition`, `tái cấu trúc`, `đơn giản hóa`
- **Context:** fixing a bug spanning multiple files, tracing cause and effect across a chain

### RULE-biz.md
Load if message or file path contains any of:
- **Keywords:** `pricing`, `price`, `monetization`, `monetize`, `positioning`, `USP`, `target audience`, `customer`, `market`, `marketing`, `conversion`, `landing page`, `business model`, `revenue`, `tier`, `plan`, `subscription`, `giá`, `định giá`, `kiếm tiền`, `khách hàng`, `thị trường`, `đối tượng`, `chuyển đổi`, `mô hình kinh doanh`, `doanh thu`, `gói`, `định vị`
- **Paths:** `docs/biz/**`
- **Context:** any market-facing decision — evaluating an idea's commercial shape, writing/reviewing landing or sales copy, creating or editing `docs/biz/`, deciding what to charge or who the product is for

### METHOD-ux-psych.md
Load if message contains any of:
- **Keywords:** `UX`, `user experience`, `usability`, `user behavior`, `user psychology`, `onboarding`, `user flow`, `friction`, `cognitive load`, `empty state`, `first run`, `dead end`, `dark pattern`, `trải nghiệm người dùng`, `tâm lý người dùng`, `hành vi người dùng`, `khó dùng`, `rối`, `luồng người dùng`, `đánh giá giao diện`, `review UI`, `review UX`
- **Context:** evaluating an interface or flow through user behavior (not just visual styling — that is `RULE-ui-pattern.md`), designing an onboarding/conversion flow, diagnosing "why don't users do X"

### METHOD-audit-zero-trust.md
Load if message contains any of:
- **Keywords:** `audit khắt khe`, `ép rule`, `force audit`, `quét tuyệt đối`, `zero-trust audit`, `rà soát toàn bộ`, `quét toàn dự án`, `chứng minh sạch`, `audit tuyệt đối`
- **Context:** when the user asks for an uncompromising sweep — of the whole project or of a change plus everything that reads it — that must be driven by detectors rather than by impression. Read-only: it produces a short findings report, not fixes.

### METHOD-deep-think.md
Load if message contains any of:
- **Keywords:** `new feature`, `tính năng mới`, `should we`, `có nên`, `simplest way`, `đơn giản nhất`, `is this worth`, `có đáng`, `tradeoff`, `scope creep`, `mở rộng scope`, `premature`, `complexity`, `abstraction`, `tooling`, `first principles`, `tư duy nguyên bản`, `phản biện`, `mục tiêu tối thượng`, `one-way door`, `quyết định lớn`, `decision record`, `pre-mortem`, `evaluate`, `assess`, `review the approach`, `worth refactoring`, `good idea`, `side effect`, `edge case`, `đánh giá`, `bàn luận`, `nên refactor`, `đánh giá ý tưởng`, `đánh giá chiến lược`, `tác dụng phụ`, `trường hợp biên`, `leo thang`, `hỏi owner`, `mâu thuẫn`, `bế tắc`, `thử lại vẫn lỗi`, `tự chốt`
- **Context:** architectural or tooling decision, scope or effort/value discussion, a big or hard-to-reverse decision, a request for first-principles/critique-style thinking, *discussing/evaluating* (rather than just executing) a refactor, a code review, a strategy/plan, or an idea — the four cases that trigger Module 5 (MVP focus, side-effects/edge-cases weighed by severity) — plus, at extra sensitivity: about to ask or escalate to the owner, a fix that failed twice, conflicting rules/instructions, owner wording with multiple readings. `agent.A3` is the mechanical floor for escalation; this line is additional routing sensitivity on top of it, not a replacement.

### METHOD-proportionality.md
Load if message contains any of:
- **Keywords:** `rate limit`, `quota`, `throttle`, `abuse`, `spam`, `bot`, `exploit`, `bypass`, `tamper`, `client-side check`, `guard`, `defensive`, `hardening`, `threat model`, `attack surface`, `over-engineering`, `overthinking`, `paranoid`, `is it worth defending`, `lạm dụng`, `giới hạn`, `chặn`, `hạn mức`, `phòng thủ`, `bảo mật quá mức`, `nghĩ quá nhiều`, `vẽ vời`, `có cần chặn không`, `bao nhiêu user`, `mấy ai làm được`, `rủi ro`, `mức độ nghiêm trọng`
- **Context:** any proposal to add, keep, size, or remove a guard / limit / validation / permission check; deciding whether a client-side restriction is enough; accepting a risk deliberately; weighing MVP speed against security or abuse resistance. Also load when a discussion is stacking protection with no evidence of who could actually reach the state being protected.

### METHOD-audit-subtraction.md
Load if message contains any of:
- **Keywords:** `subtraction audit`, `dead code`, `unused`, `unreferenced`, `bloat`, `strip down`, `minimize the repo`, `tối giản tuyệt đối`, `tối giản tối đa`, `tinh gọn toàn bộ`, `cắt giảm tối đa`, `dọn sạch repo`, `xoá code thừa`, `code chết`, `refactor hạng nặng`, `không còn gì để bớt`, `gọn nhất có thể`
- **Context:** a request to minimize or strip an existing repository rather than to check its correctness. Pairs with `METHOD-audit-zero-trust.md`, whose scope-lock, detector-first order and evidence classes it inherits. Read-only: it reports and plans removals, it never deletes.

---

## Tier 2 — Full load

**Trigger** — match any of the following (case-insensitive): `nạp full`, `load full`, `full load`, `nạp tất cả rule`, `load all rules`, `full akirule`, `nạp hết rule`

**Protocol — execute in order:**
1. Run `ls ~/.aki/akidevrule/RULE-*.md ~/.aki/akidevrule/METHOD-*.md` to discover the actual file list
2. Read each file returned (skip anything under `ref-ECC/`)
3. Emit the `[RULES]` receipt per § Load confirmation, with the loaded set marked `(router:full)`

---

## Load confirmation — the `[RULES]` receipt

One line at the start of the response, reporting the **whole rule context**, not this skill's delta:

```
[RULES] agent,coding,pattern (core) + docs,ui (router) | missing: none
```

| Element | Rule |
|---|---|
| Names | topic addresses per the manifest Topic column (`~/.aki/akidevrule/index.md` § addressing scheme). No new vocabulary. |
| `(core)` | the four `@`-imported files. Always listed, even though this skill did not load them: their presence is otherwise unobservable, and they are the most-violated group. Listing them reports context state; it does not claim credit for the load. |
| `(router)` | files this skill loaded this turn. Tier 2 writes `(router:full)`. |
| `(brief)` | for a worker/subagent — the files its spawning prompt named and it actually read. A worker inherits no router, so it uses this instead of `(router)` and emits the line as the first line of its single round (`agent.A5`). |
| `missing:` | every file that was required and could not be read, else `none`. `[RULES] none \| missing: agent` is the loudest case and the reason this field exists. |

**The line is mandatory.** The session agent emits it on its first response of the session, and again on any turn where the set changes; a worker emits it always. Silence is never "nothing loaded" — a missing line is indistinguishable from a router that never ran, and those are different bugs with opposite fixes. With the line mandatory, a later turn without one carries exactly one meaning: the set is unchanged since the last line printed.

The receipt is **self-reported: a diagnostic signal, never evidence** (`agent.B2`). Do not gate closure on it. The cross-check that does carry weight is the agent definition's declared rule manifest against the line it emitted — a mismatch is a finding.
