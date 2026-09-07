# Stack Rule — Nuxt 4 + Cloudflare

<!-- Address map: stack.A1-3 · stack.B1-5 · stack.C1-8 (⟨Aki⟩) -->

## Stack
Nuxt 4 · Vue 3 · Tailwind v4 · @nuxtjs/i18n · @nuxtjs/seo · SweetAlert2 · FontAwesome 7.2 · aki-info-detect

## A. Cloudflare & TypeScript foundation

### A1. Build & TypeScript
- Pin `packageManager` (e.g. `npm@10.9.2`) and `engines.node` in `package.json` to match the Cloudflare Pages build image version. Always use `npx npm@<pinned_version> install` to regenerate lockfiles before committing to avoid version drift (especially with optional peer dependencies).
- TypeScript `strict` mode
- Vue 3 `<script setup>` + Composition API only — Options API is forbidden
- Inside `server/`: use relative imports, never `~/server/...`
- Keep build logs clean — every remaining warning must be either traced to its root cause or filtered on purpose (`nitro.rollupConfig.onwarn`); never let warnings drift unexamined
- If the build spews sourcemap warnings, two Vite copies are likely loaded — pin one version via package.json `overrides` + clean reinstall
- Build-date stamp (e.g. a `__BUILD_DATE__` footer global): compute UTC in `nuxt.config.ts`, inject via `vite.define` — never via a shell env var (`VITE_BUILD_DATE=$(date -u ...) nuxt build` in `package.json` is dead code). Display side reads the raw global, formats with local `get*()` (never `getUTC*()`), wrapped in `<ClientOnly>` to avoid an SSR/client hydration mismatch.

### A2. Cloudflare Worker runtime constraints
- No `fs`, `child_process`, or `path` in Worker runtime
- Use `fetch()` for outbound requests
- Use `crypto.subtle`, not Node native crypto
- No `Buffer` here, so everything base64/UTF-8 is hand-rolled — this is exactly where the Unicode pitfalls in RULE-coding (Unicode / UTF-8 safety) bite in production. Concretely on this stack:
  - Decode Firebase/JWT/base64 payloads via `TextDecoder`, never `atob()`+`JSON.parse`, or unicode claims (e.g. a Firebase token's `name`) reach D1 already mojibaked — the DB stores the corrupt bytes faithfully, so this is an app-layer bug, not a DB one.
  - Non-ASCII in a response or `Set-Cookie` header value must be `encodeURIComponent`-ed — HTTP header values are Latin1.
  - Response size / `Content-Length` and any KV/D1 size check are counted in bytes (`new TextEncoder().encode(str).length`), not `str.length`.
  - `crypto.subtle` operates on bytes — feed it `new TextEncoder().encode(str)`, not the string.
- Do not enable `nodejs_compat` in `wrangler.toml` unless upstream issues are confirmed fixed
- Trailing slash: `trailingSlash: true` everywhere (routing, canonical, og:url, sitemap, schema.org) — canonical config lives in the i18n section below
- Never call h3's `readBody()` in a DELETE handler. On workerd, reading a body the runtime never actually attached to a DELETE request hangs the promise instead of rejecting it — the platform then kills the request as a bare 500 with no stack trace. This reproduces on real Cloudflare Pages/Workers but NOT under `nuxt dev` (Node), so it survives local testing and only surfaces in production. Pass the id (or any DELETE payload) via query string on both client and server instead — never body.
- After the response, keep the isolate alive with `event.context.cloudflare.context.waitUntil` (the path live notify modules use on tachnhac / vstshop / tuvi / kinhdich). Nitro 2.13 also wraps the same CF context as `event.waitUntil`. Do not copy Nitro v3 docs onto this stack: v3 puts the platform on `event.req.runtime.cloudflare`, and `event.req.waitUntil` does not exist on 2.13, so the isolate dies. `nuxt dev` cannot prove isolate lifetime. A 200 that returns before the background work is not evidence the work ran.

### A3. Preset and output
- Use `cloudflare_pages`, not `cloudflare_module`
- Output directory is `dist/`
- `wrangler.toml` must keep `pages_build_output_dir = "dist"`

## B. Render · i18n · Vue patterns

### B1. Rendering split
- Public pages: prerender/SSG when suitable
- Dynamic content: SSR
- Private admin routes: SPA/no-index when suitable
- NEVER index `/admin` or `/admin/**` in robots/sitemap

### B2. Vue/Nuxt patterns
- SSR guards belong at entry points only — no redundant client guards inside flows that are already client-only
- Prefer framework composables and runtime APIs over manual plumbing
- `v-for` must use stable `:key`
- `v-if` for conditional rendering; `v-show` for frequent toggles
- Internal links: `NuxtLink`
- External links: `<a target="_blank" rel="noopener noreferrer">`
- Dialogs: ONLY use `useSwal()`. Strictly forbidden to use `window.alert()` or `window.confirm()`.
- Template attribute order: `id` → `v-for :key` → `v-if/show` → `v-model` → `@events` → `:bindings` → `class/static`

### B3. i18n
- Follow the current project's existing locale key convention before introducing a new one
- For new locale keys, prefer one short, stable convention and keep it consistent within the same project
- Repeated/shared UI strings: i18n keys
- Page-specific text belongs co-located with the page — in the `.vue` file's own `<i18n>` block, or in a `.ts` file next to the page. The site-wide `en.json`/`vi.json` files hold ONLY strings shared across the whole site — never stuff page-specific copy into them.
- Strategy: `prefix_except_default`
- **`trailingSlash: true` must be set inside the `i18n` block** in addition to `router.options` and `site`. Without it, `localePath()` strips trailing slash from generated URLs, causing canonical mismatch warnings on every page:
  ```ts
  i18n: {
    strategy: 'prefix_except_default',
    trailingSlash: true,   // ← required; prevents localePath() from stripping slash
    // ...
  }
  ```

### B4. State
- Prefer Nuxt `useState` first; reach for Pinia only when the state's shape genuinely needs it (cross-page store with actions/getters, not just shared reactive data)
- Sync any `localStorage`-backed persistence inside `onMounted`, never at setup-time top level — avoids SSR/hydration mismatch

### B5. UI baseline
- Desktop-first, but responsive across narrow to wide screens
- Scale spacing by breakpoint instead of hardcoding large values
- Use a scientific z-index system (`--z-index` variables) and standard border-radius dimensions (`radius-sm`, `md`, `lg`, `xl`, `pill`)
- Use FontAwesome Free. DO NOT write anything for FontAwesome in `.npmrc` (the free version does not need config).
- Add `aria-label` to icon-only controls
- Use focus trap for modals when needed
- Favicon: keep `favicon.ico` at the project's `public/` root
- Web manifest: full `name`/`short_name`/`icons` (192 + 512 maskable)/`apple-touch-icon`/`theme_color`, linked via `<link rel="manifest">` in `<head>`

## C. ⟨Aki⟩ Ecosystem conventions

### C1. Canonical component names
Fixed names for these roles — do not invent new names for them. Each site assembles from this set as needed (top nav is the minimum required; sidebar/rail/dock added when the site needs them). Rename on drift whenever you touch one of these files.

| Role | Canonical name |
|---|---|
| Footer | `AppFooter.vue` |
| Top nav | `AppTopNav.vue` |
| Sidebar (one side) | `AppSidebar.vue` |
| Sidebar (two sides) | `AppSidebarLeft.vue` / `AppSidebarRight.vue` |
| Rail / dock (optional) | `AppRail.vue` / `AppDock.vue` |
| Admin sidebar (admin layout only) | `AdminSidebar.vue` |
| Breadcrumb | `Breadcrumb.vue` |
| Auth boundary util | `server/utils/auth.ts` |

### C2. Layout chrome — breadcrumb · back-to-home · scroll-to-top
ONE mechanism for every site on this stack. Do not reinvent it per page; any drift here breaks cross-project consistency.

**Breadcrumb — single source of truth**
- Exactly ONE `<Breadcrumb>`, rendered in `default.vue` inside `<main>` before `<slot/>`. No page renders its own breadcrumb nav.
- It owns the VISUAL trail only. Derive the trail from `route.path`: strip the non-default locale prefix, map known segments to i18n labels via a lookup table, humanize the rest. Hide it on home (`crumbs.length <= 1`).
- Dynamic leaf: a detail page supplies the real last-crumb label via `useBreadcrumb(() => label)` (path-keyed `useState`). Render the leaf through `<ClientOnly>` with the humanized segment as the SSR fallback. NEVER read the page-set leaf during the layout's synchronous SSR render — it is not set yet (hydration-mismatch trap).
- Crumb links point ONLY to real prerendered routes. An intermediate segment with no page of its own renders as plain text, never a link — a dead link makes the Nitro `no-error-response` prerender check fail with a 404.
- Translated-slug sites (locale-specific slugs for the same page, e.g. `bai-viet`↔`articles`): build links by reconstructing the real path and re-applying the locale prefix (`/en${acc}/`), NOT `localePath(acc)` — `localePath` cannot round-trip an already-localized slug.

**BreadcrumbList JSON-LD — owned by the page, never the layout**
- The `<Breadcrumb>` component emits NO structured data. The `BreadcrumbList` JSON-LD is the page's responsibility (in-page `useHead` / `useSeoSchemas().breadcrumb`, or a page-scoped SEO composable).
- Exactly ONE `BreadcrumbList` per page. If a SEO composable already emits it, do not add a second copy in the page.

**Pre-footer chrome**
- One `<ScrollToTop>` in the layout. No per-page back-to-top. Back-to-home is the Home crumb — no separate back-to-home button.

### C3. Layout width — single source of truth
The layout (`default.vue`'s outer content wrapper, e.g. `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`) is the ONLY place page/content width is decided for the whole site.

- A page (`app/pages/**/*.vue`) or app/tool page (e.g. a mini-app's `app.vue`) must never put its own `max-w-*` (Tailwind) or a custom CSS `max-width` on its outermost template element. Nesting a second, narrower container inside the layout's wrapper silently shrinks that one route below the site-wide standard and drifts wider over time as different pages pick different values with no functional reason (seen in production: `max-w-3xl` through `max-w-7xl` scattered across routes, plus a scoped CSS container fully disconnected from the layout's width).
- If a page or app already has its own `max-w-*`/`max-width` wrapper on its outermost element, delete it — it must inherit the layout's width, not redeclare its own.
- Narrower widths are still fine on an inner **reading-measure or widget** element nested *inside* an already full-width page — a short intro paragraph, a search box, an article's prose column. That is deliberate typography/component sizing, not page layout, and is not what this rule forbids.
- If a page or app genuinely needs to be full-bleed or a different overall width than the layout's standard, that is a conscious layout decision — it belongs in the layout (or a documented, named per-route exception), never quietly overridden inside the page.

### C4. Admin isolation — English-only, `i18n.pages=false`, `localePath` trap
- **Admin UI is always English-only** — it is an internal SPA tool, not user-facing content, so it does NOT need i18n routing at all. With `@nuxtjs/i18n` `customRoutes: 'config'`, disable each admin page from locale routing via `i18n.pages['admin/xxx'] = false` (not a `{ vi, en }` mapping) — this prevents Nuxt from ever generating a locale-prefixed `/admin/**` variant, so there is only one canonical admin URL. Admin UI copy is hardcoded in English directly, never duplicated via locale ternaries (`isVI ? '...' : '...'`) — that pattern is presentation clutter with no real audience (admin has no locale switcher, and the project's default/public locale is irrelevant here). Domain-specific terms may stay in their original language when no English equivalent is precise — see the project's own domain-terminology exception if it has one.
- ⚠️ **Once a route has `i18n.pages[x] = false`, link to it with a plain string `to="/..."`, never `localePath()`.** `localePath()` silently returns `undefined` for a route that's been removed from i18n's route map — no error, no console warning — and `<NuxtLink :to="undefined">` renders an `<a>` with no `href` at all, so the link looks correct in code review but never navigates on click. This bites hardest when porting a component between sibling projects: one project may keep a given page (e.g. a `/me` profile page) under normal i18n routing while another disables it — copying the first project's `localePath('/me')` call into the second breaks silently. Always check that project's own `i18n.pages` entry before reusing a `localePath()`/`switchLocalePath()` call from elsewhere.
- **The admin layout is fully isolated from public UI**: `layouts/admin.vue` has its own chrome — navigation lives in its own `AdminSidebar.vue` — and never imports public chrome components (`AppTopNav`/`AppFooter`/`Breadcrumb`/…) unless there is a clear, recorded benefit. Admin and public UI evolve at different paces; sharing nav/UI couples them so a client change breaks admin and vice versa
- **Each admin feature area is its own route/page under `/admin/**`** (its own router view) — admin views are feature-dense, so give each area a real URL instead of cramming several areas into one page behind tab state; this keeps each view single-responsibility and code-splits naturally
- On multi-layout sites (default ↔ admin), any listener/timer/subscription registered while in the admin layout must be cleaned up in `onUnmounted` so it does not leak across a layout switch

### C5. Firebase / external integrations — composable boundary
- **Composable is the only boundary** — page components and layouts never import the provider SDK directly (no `import { getFirestore } from 'firebase/firestore'` in a `.vue` file)
- All provider-specific code lives in composables or utility modules; pages only call composable functions
- This means swapping a provider (Firebase → Supabase → D1) only touches the composable layer, not any page
- **Organize by domain, not by provider** — split into one file per data concern, not one god-file:
  ```
  utils/firebase/core.ts      ← init app, getDb(), getAuth() only
  composables/useAuth.ts      ← login, logout, session state
  composables/useUser.ts      ← user profile CRUD
  composables/useProjects.ts  ← project data
  ```
- Apply the Result pattern (see RULE-coding.md) at the composable boundary — composables return `Result<T>`, pages check `.ok`

### C6. aki-info-detect + AkiTao favicon tool
- Use [`aki-info-detect`](https://www.npmjs.com/package/aki-info-detect) (npm) to separate bot and real-browser behavior when needed. Import only the specific **named exports** you need — **never** the default `akiInfoDetect()`, which auto-fires `getNetworkInfo()` (ipinfo/ipwhois/ipify) in the background. Do NOT plugin-load the **default/whole** library. Tree-shaken **named local-only** exports (`parseUserAgent`/`getHighEntropyValues`/`getScreen`/`detectGPU`/`getBattery`) MAY run early via a `.client.ts` plugin in an isolated dynamic-import chunk — but verify the network functions (`getIP`/`getISP`/`getCountry`/`getLocation`/`getNetworkInfo`) are absent from the built chunk (`grep` the bundle for the IP URLs). Never auto-run `getIP`/network features unless explicitly requested.
- Recommended tool: [AkiTao Favicon Generator](https://akitao.com/t/favicon-generator/) — emits the full standard icon set (favicon.ico + PNG sizes + maskable + apple-touch-icon + manifest) in one pass

### C7. Dev workflow scripts (package.json)
Standard utility scripts — fixed names, per-project values (port, DB name):

- `killport`: `lsof -t -i:<port> | xargs kill -9 2>/dev/null || true` — each site pins ONE fixed dev port, and the `dev` script always runs `npm run killport && nuxt dev` so a stale process never blocks the port
- Projects with a D1 database:
  - `db.init.local`: `rm -rf .wrangler/state/v3/d1 && wrangler d1 execute <db-name> --local --file=schema.sql` — wipe local D1 state, reload the schema
  - `db.push`: `wrangler d1 execute <db-name> --remote --file=schema.sql`
  - `db.pull`: `bash scripts/db-pull.sh` — export the remote D1 database to a local backup file; the backup path C8's execution-ownership clause requires before an agent runs a migration itself

### C8. Deploy verification — push is not done
A push only *requests* a Cloudflare build; the task is not closed until the newest build for this project reaches a terminal state. (This is deployment, not releasing — versioning and release artifacts are owned by `RULE-release.md`.)

Sites on this stack deploy via **Cloudflare Pages**, not Workers — the `cloudflare-builds` MCP only covers the Workers Builds API and will show zero builds for a Pages project. For Pages, use `wrangler pages deployment list --project-name=<pages-project-name>` (project name may differ from the repo/site name — check with `wrangler pages project list` if unsure) or the general-purpose `cloudflare` MCP (`https://mcp.cloudflare.com/mcp`, covers the full API including Pages). Only use `cloudflare-builds` for a project that is an actual standalone Worker.

After every push, watch the newest build/deployment (general `cloudflare` MCP if connected, otherwise `wrangler`), polling about every 30s:
- **running** → keep waiting. Do not fetch logs.
- **success** → **CRITICAL:** Do not claim a deploy is successful based on the CLI or Cloudflare dashboard status alone. Verification is ONLY complete when you explicitly fetch the live production URL (e.g. `curl -s -H "Cache-Control: no-cache" https://<production-domain>/releases.json`) ~3 minutes after the push, and confirm the new version or feature code is present in the returned payload. Report "✅ deployed" only after this manual check confirms it.
- **failed** → fetch the build log, isolate the failing lines, fix the cause in the working tree, and report. Do NOT commit or push the fix — the user decides.

**D1 migrations do not run themselves — a green Cloudflare build proves nothing about the database.** A build only compiles/deploys application code; it never executes a `scripts/migrate-*.sql` file. If a task ships a new migration script, closing that task requires, in order:
1. Run it against the real target: `wrangler d1 execute <db-name> --remote --file=scripts/migrate-*.sql` (never claim done from a `--local` run alone — local and remote are separate SQLite files).
2. Check the postconditions the migration itself states (row counts, `PRAGMA table_info`) against remote, not assumed from the script having no errors.
3. Move the file into `scripts/done/` — a migration file left in `scripts/` is itself a visible signal, to the next person or the next session, that step 1 may not have happened.

**Execution ownership — the agent runs steps 1-3 itself; this is [[RULE-coding]] B5's ladder, not [[RULE-agent-behavior]] B3's ask-first gate.** An additive, idempotent migration (`CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` — no `ALTER`/`DROP`, no existing-row mutation) with a backup path available (`db.pull`, C7, or an equivalent remote export) is a two-way door: back up, run `--local` then `--remote`, verify postconditions, move the file — in the same task, without a separate confirmation turn. B5's rung 5 applies first: `wrangler` must be present **and authenticated** (`wrangler whoami`) on this machine; when it is not, the item is a rung-5 hand-off carrying that reason, never an "ask first". Treating "touches production DB" as always-ask by reflex collapses B5's ladder straight to rung 6 and reproduces the forbidden rationalization it names, "only the owner can decide." B3's ask-before gate stays live for the actual irreversible case: any migration that alters or drops existing structure, rewrites existing rows, or has no backup path.

See [[RULE-release]] B5 — the CHANGELOG/release entry for this change is not truthful until all three steps above are done, not just written.

## SEO
See `RULE-seo.md` for all SEO rules (meta limits, schema matrix, robots, sitemap, OG image, AI visibility, entity linking).
