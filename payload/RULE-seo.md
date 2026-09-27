# SEO Rule — Nuxt + Cloudflare Stack

<!-- Address map: seo.A1-6 · seo.B1-3 · seo.C1-3 (⟨Aki⟩) -->

## Scope
Cross-project rules for all Nuxt 4 + Cloudflare Pages sites. For project-specific keyword strategy and schema values, see the project's own `docs/ref/seo.md` or equivalent.

---

## A. Meta & structure

### A1. Meta title & description

- **Title**: ≤ 60 chars total (including the ` | site.name` appended by `@nuxtjs/seo`). Source string must stay short enough to fit within the limit after the suffix is added. Exception: article/post/knowledge slug pages may use ≤ 80 chars when the title is inherently long.
- **Description**: ≤ 155 chars. Start with an action verb + keyword + benefit
- **No em/en dashes** (`—` or `–`) inside title or description — causes encoding issues in some SERPs. Use `|` or `-` instead
- **Single source of truth**: define `const title = '...'` once, pass to `usePageSeo`, OG, Twitter card, and JSON-LD — never repeat the string literal

### A2. Schema.org — page type matrix

| Page type | Required schemas | Optional |
|-----------|-----------------|----------|
| Homepage | `Organization` + `WebSite` + `WebPage` | `FAQPage` |
| Service / feature page | `Service` + `Organization` | `FAQPage` |
| Blog post / article | `BlogPosting` + `Person` + `Organization` + `BreadcrumbList` | `FAQPage` |
| Knowledge / glossary | `Article` + `DefinedTerm` + `DefinedTermSet` | `FAQPage` |
| Collection / listing | `CollectionPage` + `ItemList` | `BreadcrumbList` |
| Product | `Product` + `Offer` + `BreadcrumbList` | |
| About | `AboutPage` + `Organization` + `Person` | |
| Contact | `ContactPage` + `Organization` | |

> ⚠️ **`FAQPage` is inert schema as of 2026 — keep it, but never count it as an SEO deliverable.** Google retired FAQ rich results entirely (display stopped 7 May 2026; Search Console report and Rich Results Test support removed June 2026; API data removed August 2026). Outside Google, **no consumer is confirmed**: Bing's own docs can't be verified for FAQPage, OpenAI's official community thread is contradictory and inconclusive, Perplexity's "structured output" docs describe an API feature and say nothing about crawler parsing, and Claude/Gemini have made no statement. Google's own AI-features guidance says plainly there is *no special schema.org structured data you need to add*.
>
> **Rule:** leave existing `FAQPage` markup in place (it is not deprecated at the schema.org level, Google still parses it, and unused structured data causes no harm). But do **not** add an FAQ block to a page merely to emit schema, and do **not** list FAQPage as an SEO task in any plan.
>
> What actually earns citations is the **question format in the rendered HTML headings**, not the JSON-LD: passages cited by AI answers are roughly twice as likely to contain a question mark, and 78% of those question marks sit in headings. Write question-shaped `<h2>`s; the schema is a side effect.

**Organization — required fields across all projects**
```ts
defineOrganization({
  name: 'BrandName',
  alternateName: ['Brand Name', 'brandname', 'BRANDNAME', 'brandname.com'],
  url: 'https://domain.com',
  logo: 'https://domain.com/favicon/icon-192.png',
  sameAs: [/* social profiles, parent org, ecosystem siblings */],
  knowsAbout: [/* domain topics this brand covers */],
})
```

### A3. Trailing slash — SEO-critical for Cloudflare Pages

All internal links, canonical tags, `og:url`, sitemap entries, and JSON-LD `url` fields **must end with `/`**. Configured in `nuxt.config.ts`:
```ts
site: { trailingSlash: true }
```
See `RULE-stack-akiNuxtCf.md` for full config context.

### A4. Robots & sitemap

```ts
// nuxt.config.ts
routeRules: {
  '/admin/**': { robots: false, prerender: false, sitemap: false }
}
sitemap: {
  exclude: ['/admin', '/admin/**']
}
```

- `/login` defaults to **public and indexable** unless the project's own policy says otherwise
- Private/admin routes: `robots: false` + excluded from sitemap
- Public pages: `index, follow, max-image-preview:large, max-snippet:-1` (set in `usePageSeo` if the composable supports it)

### A5. OG image

- Manual approach — no `nuxt-og-image` (too heavy for static projects)
- **Size**: 1200×630px
- **Location**: `public/ogimage/[slug].jpg` or `.png`
- **Fallback**: if page-level image is absent, the composable falls back to the site-wide default OG image
- Never reference an OG image path that doesn't exist in `public/`
- Referenced site-relative (`/ogimage/slug.jpg`); the SEO composable makes it absolute (A6)

### A6. URL form — relative at rest, absolute only at emission

- Every same-site URL is stored and rendered root-relative (`/images/x.jpg`, `/path/`): content data, internal links, `<img src>`/`srcset`, asset references. An own-origin literal (`https://domain.com/...`) there breaks localhost and preview deploys, and hides a missing local asset behind the production copy.
- Consumers that require an absolute URL (`og:image`, `twitter:image`, `og:url`, canonical, hreflang, JSON-LD `url`/`image`/`logo`, sitemap, RSS, email, share text) get it from one helper at the emission boundary (SEO composable, schema builder, feed generator), never from the stored value. The helper is idempotent (relative → absolute, absolute → unchanged), so legacy absolute data keeps working without a migration.
- The origin comes from the one configured site URL (`pattern.A1`), never from the request host: a preview deploy must still emit production canonical and OG URLs.
- A subpath deploy (`baseURL` ≠ `/`) prefixes through the framework's base-URL mechanism, never by string concatenation per call site.
- Detected mechanically in C3.

## B. AI visibility & entity

### B1. AI / LLM visibility

These rules help content appear in AI-generated answers (Perplexity, ChatGPT, Gemini AI Overviews):

- **FAQ first sentence**: answer directly (subject + verb + predicate). No "Đây là...", "According to...", "In this article..." preambles
- **FAQ length**: < 150 words per answer — short enough for AI to extract verbatim
- **DefinedTerm**: use for specialized domain terminology pages (glossary, knowledge bases)
- **alternateName in Organization/WebSite schema**: include all brand spelling variants (accented + unaccented + lowercase + domain form) so AI can resolve them to a single entity
- **knowsAbout**: list the topics the brand covers — helps AI cite the site as a relevant source

> ⚠️ **`llms.txt` is not an AI-visibility strategy (2026).** A log study across 137,000 domains found **97% of `llms.txt` files received zero requests over a full month**; no major LLM vendor has committed to reading the format, and Google's John Mueller has compared it to the meta keywords tag — a standard proposed by publishers that no consumer agreed to honour. Keep the file if it already exists (it costs nothing and is genuinely useful for *internal* agents reading the site), but never list it as an SEO/GEO deliverable and never let it substitute for the thing that does work: getting the content into the server-rendered HTML (B3).

### B2. Entity & ecosystem linking

For sites that belong to a multi-site ecosystem or brand family:
- `parentOrganization`: link subsidiary sites back to the parent organization's site
- `sameAs` in `Organization`: include parent org, sibling products, social profiles, and knowledge graph anchors (Wikidata, LinkedIn, etc.)
- Footer cross-links to ecosystem sibling sites reinforce entity co-occurrence for crawlers
- `Person` (Founder): link `worksFor` and `sameAs` to founder profiles and project pages

Keep the concrete domain list (parent org URL, sibling sites) in the project's own docs — one source of truth per ecosystem, not hardcoded in shared rules.

### B3. Prerendering & SSR

- SEO-critical content must be in the HTML at crawl time — not injected by client-side JS. **This is the single highest-evidence rule in this file for AI visibility**: roughly 69% of AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, PerplexityBot) do **not** execute JavaScript, so a client-only SPA is simply invisible to them. Googlebot and Gemini do render; ChatGPT, Claude and Perplexity do not. Prerendering beats every schema tweak combined.
- Public pages: prerender/SSG preferred
- Dynamic SEO content (live prices, user-specific data): SSR, never defer to client
- `zeroRuntime: true` in sitemap config for static deployments

## C. ⟨Aki⟩ API & tooling stack

### C1. usePageSeo — standard API

Every public page must call `usePageSeo()`. Canonical URL is derived automatically from `route.path` inside the composable — do not pass it manually unless the composable API requires it.

```ts
usePageSeo({
  title: 'Page Topic',               // Max 60 chars total — NO brand suffix (see @nuxtjs/seo note below)
  description: 'Action-oriented…',   // Max 155 chars, unique per page
  ogImage: '/ogimage/slug.jpg',      // optional, site-relative — the composable absolutizes it (A6)
  ogImageAlt: 'Description of image',              // optional
  noindex: true,                      // optional, for admin/private pages
})
```

### C2. @nuxtjs/seo — titleTemplate behavior (CRITICAL)

`@nuxtjs/seo` automatically appends ` | site.name` to every title via `titleTemplate`.

**Rule: source title must NOT include the brand/site name.**

```ts
// ✅ Correct — module adds " | AkiTao" automatically
usePageSeo({ title: 'Knowledge Base' })
// → <title>Knowledge Base | AkiTao</title>

// ❌ Wrong — results in double suffix
usePageSeo({ title: 'Knowledge Base | AkiTao' })
// → <title>Knowledge Base | AkiTao | AkiTao</title>
```

This applies to `usePageSeo()`, `useHead({ title })`, and `useSeoMeta({ title })` — all go through `titleTemplate`.

### C3. Post-build validation checklist

Run `scripts/validate-seo.js` (or equivalent) after every build. At minimum it should verify:

- [ ] All page titles ≤ 60 chars (article/post/knowledge slug pages: ≤ 80 chars)
- [ ] All descriptions ≤ 155 chars
- [ ] No em dash (`—`) or en dash (`–`) in title or description
- [ ] All canonical URLs end with `/`
- [ ] No rendered `src`, `srcset` or `<a href>` carries the site's own origin (A6); `<head>` `link`/`meta` are exempt, they are emission targets
- [ ] Every `og:image`, `twitter:image` and JSON-LD `image` is an absolute `https://` URL
- [ ] Homepage `Organization` schema has `alternateName` and `sameAs`
- [ ] `/admin/**` pages absent from sitemap output
- [ ] Skip redirect stub files (`http-equiv="refresh"`) — they have no SEO content to validate

**Validator implementation notes:**
- Use `>` not `>=` for length checks — exactly 60/155 chars is valid
- Decode HTML entities before measuring length (`&amp;` = 1 char, not 5)
- Use `isArticlePage(relPath)` to apply the 80-char limit on article/post/knowledge slug pages

If the project doesn't have this script yet, port the validator from an existing project on the same stack as a baseline instead of writing one from scratch.
