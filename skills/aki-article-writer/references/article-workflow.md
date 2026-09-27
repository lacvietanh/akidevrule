# aki-article-writer — Full Six-Phase Pipeline

This document is the complete operating procedure for the **Article Worker subagent**.
The Article Worker reads this file in full before beginning any work.

---

## Phase 1 — Research & Fact-Verification

**Goal:** Collect verified information. Zero hallucination.

### 1.1 Source collection

Use `search_web` to gather information from at least **two independent authoritative sources** for every major claim. Authority by project domain:

| Domain | Authoritative sources |
|---|---|
| `kinhdich` / `tuvi` | Classical texts (I Ching, Tử Vi Bình Chú), recognised scholars with wide citations |
| `vstshop` | Manufacturer website, official release notes (FabFilter, Spectrasonics, Native Instruments…) |
| `akinet` / `akitao` | Official API docs, RFC, vendor technical documentation |
| General | Wikipedia (as a pointer to primary sources, not the source itself), reputable publications |

### 1.2 Claim classification

Label every load-bearing statement before writing:

| Tag | Meaning | Requirement |
|---|---|---|
| `FACT` | Verified across 2+ independent sources | Cite sources inline in draft notes |
| `ANALYSIS` | Author's reasoned interpretation | Signal in text: "Có thể thấy rằng…" / "According to this reading…" |
| `UNVERIFIED` | Cannot be confirmed right now | **Do not include in the published article** |

A mislabelled FACT that is actually an ASSUMPTION is the one unrecoverable error in this phase.

### 1.3 File vs chat separation

Article content must be context-independent and durable. Do not copy conversation wording, task-specific shorthand, or ephemeral discussion into the published file.

---

## Phase 2 — Metadata & JSON-LD Schema

**Execute before writing body content.** Everything downstream inherits the terminology and framing defined here.

### 2.1 Slug

```
Format: lowercase, hyphen-separated, no diacritics
Example: giai-ma-que-thuan-can
```

### 2.2 Meta title

- ≤ 60 characters total (articles/knowledge/post slug pages: ≤ 80 chars)
- **Do NOT include the brand name** — the framework appends ` | BrandName` automatically; including it produces a double suffix
- Focus keyphrase at the start
- No em-dash (`—`) or en-dash (`–`) — use `|` or `-` instead
- Define once as a `const`; pass the same variable to OG, Twitter card, and JSON-LD — never repeat the literal string

### 2.3 Meta description

- ≤ 155 characters
- Structure: `[Action verb] + [Focus keyphrase] + [User benefit]`
- Example: "Khám phá quẻ Thuần Càn trong Kinh Dịch — ý nghĩa 6 hào, ứng dụng phong thủy và bài học lãnh đạo đích thực."

### 2.4 JSON-LD schema — type matrix

Select the correct schema type based on project:

| Content type | Required schemas | Key fields |
|---|---|---|
| Blog / news | `BlogPosting` + `Person` + `Organization` + `BreadcrumbList` | `headline`, `author`, `publisher`, `datePublished`, `image` |
| Knowledge / glossary (kinhdich, tuvi) | `Article` + `DefinedTerm` + `DefinedTermSet` + `BreadcrumbList` | `definedTermCode`, `inDefinedTermSet` |
| Product (vstshop) | `Product` + `Organization` + `Offer` + `BreadcrumbList` | `price`, `priceCurrency`, `availability` |
| Service / feature | `Service` + `Organization` + `BreadcrumbList` | `serviceType`, `provider` |

**Organization block — required on every page:**

```json
{
  "@type": "Organization",
  "name": "BrandName",
  "alternateName": ["Brand Name", "brandname", "brandname.com"],
  "url": "https://domain.com/",
  "logo": "https://domain.com/favicon/icon-192.png",
  "sameAs": ["https://facebook.com/...", "https://wikidata.org/..."],
  "knowsAbout": ["Topic 1", "Topic 2"]
}
```

> **FAQPage schema (2026 note):** Google retired FAQ rich results in May 2026. Do not write an FAQ block solely to emit schema. Instead, write H2s phrased as questions — AI crawlers (Perplexity, ChatGPT, Gemini) cite paragraphs following question-phrased H2s at roughly double the rate of JSON-LD FAQPage entries. Existing FAQPage markup may be kept (it causes no harm), but never create it as a new SEO deliverable.

### 2.5 URL canonical & trailing slash

All canonical URLs, sitemap entries, `og:url`, internal links, and JSON-LD `url` fields must end with `/`. Required for Cloudflare Pages compatibility. Those absolute URLs are produced at emission; every URL stored in the record or rendered in the body is site-relative (`seo.A6`).

---

## Phase 3 — Content Writing & UX Psychology

### 3.1 Heading structure

```
H1 — exactly one per article; contains the focus keyphrase
  H2 — 3–5 main sections
    H3 — sub-detail within an H2 (only when genuinely needed)
```

Write at least one H2 as a direct question (ending with `?`). AI crawlers are roughly twice as likely to cite a passage when it follows a question-shaped heading.

### 3.2 Cognitive budget — opening sentences

Users scan web content; they do not read linearly. Every paragraph opening and every FAQ answer must lead with the core answer in the first sentence (Subject + Verb + Predicate). No warm-up.

**Banned openers:**
- "Đây là…" / "This is…"
- "Trong bài viết này…" / "In this article…"
- "Theo như chúng ta đã biết…" / "As we all know…"
- "According to…" at the start of a paragraph

**Paragraph length:** ≤ 5 lines. If longer, split or convert to a list.

Example:
```
❌  "Trong phần này, chúng ta sẽ cùng tìm hiểu về những ứng dụng thú vị…"
✅  "Quẻ Thuần Càn chỉ dẫn 3 nguyên tắc lãnh đạo: kiên trì, thuận thời và học hỏi không ngừng."
```

### 3.3 Semantic stability

Use exactly one canonical term for each concept throughout the article. Synonym variation may seem stylistically rich but confuses both readers and AI crawlers. Pick the term, define it once, use it consistently.

### 3.4 Anxiety handling at CTA

At every call-to-action point (sign-up, purchase, download, consult), identify the dominant user anxiety at that moment and answer it right there — not on a distant FAQ page:

| Anxiety | Answer at the CTA |
|---|---|
| Price / lock-in | "Dùng thử miễn phí 14 ngày, không cần thẻ tín dụng" |
| Complexity | "Tư vấn 1-1 miễn phí trong 15 phút" |
| Compatibility | "Hỗ trợ Win/Mac, tương thích mọi DAW phổ biến" |
| Privacy | "Không lưu dữ liệu cá nhân, xoá tài khoản bất cứ lúc nào" |

### 3.5 Internal & external links

- **Internal links:** ≥ 2 links to related articles or service pages within the same project
- **External links:** link to authoritative sources when citing data; add `rel="noopener"`

### 3.6 SSR / prerender requirement

69% of AI crawlers (ChatGPT, ClaudeBot, PerplexityBot, OAI-SearchBot) do not execute JavaScript. All article content, meta tags, and schema must be present in the server-rendered HTML at crawl time — never client-side only.

---

## Phase 4 — Image Scout Pipeline

Spawn a separate **Image Scout subagent** with model Gemini Flash or Claude Haiku.

### Step 0 — Resolve `article_arch` before spawning

Check the render path, not just `CLAUDE.md` prose: open the component/template that actually renders an article body (e.g. `ContentArticle.vue`, an MDX renderer, a markdown-to-HTML pipeline) and confirm whether it parses inline markdown image syntax `![]()` inside body content.

- **Renderer parses `![]()` or reads a per-block `image` field → `article_arch: markdown`.** Multiple images (hero + N body) are safe. Proceed with `count_needed: <1 hero + N body images>` as before.
- **Renderer does NOT parse `![]()`** (e.g. a hand-written `renderMarkdown()` that only handles bold/link/code, with no image field in the content schema) **→ `article_arch: component`, single-image mode.** `count_needed` is forced to **1**. Do not generate body images the renderer cannot display — they would ship as literal, broken `![alt](path)` text.

**Brief to pass:**
```
{
  "slug": "<article-slug>",
  "topic": "<article topic in plain language>",
  "article_arch": "markdown" | "component",
  "count_needed": <1 hero + N body images, or exactly 1 if article_arch is "component">,
  "output_dir": "<project image directory, e.g. public/images/articles/>",
  "format": "webp"   // or "jpg" per project config
}
```

The Image Scout executes the following seven steps:

### Step 1 — Search (`search_web`)

```
Query patterns:
  "<topic> cover art official high resolution"
  "<topic> image 16:9 landscape"
  "<product name> <brand> official product image square"

Preferred sources:
  Manufacturer / official rights-holder website
  Unsplash, Pexels (CC0 / royalty-free)
  Wikimedia Commons

Disqualified sources:
  Images bearing a third-party watermark
  Images showing a competitor's logo or branding
  Images with visible text unrelated to the topic
```

Collect 3–5 candidate image URLs.

### Step 2 — Download (`curl`)

```bash
curl -sSL \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "<IMAGE_URL>" \
  -o /tmp/raw-<slug>-<index>.jpg
```

The browser User-Agent string is required — many CDNs block requests without it.

### Step 3 — Visual inspection before processing (`view_file`)

**Mandatory:** call `view_file` on `/tmp/raw-<slug>-<index>.jpg` for every candidate.

Reject if any of the following is true:
- [ ] Wrong subject / wrong product version
- [ ] Blurry, pixelated, or heavily compression-artefacted
- [ ] Visible third-party watermark
- [ ] Competitor logo or branding visible
- [ ] Key content is not centred (will be lost in square or 16:9 crop)

If a candidate fails → go back to Step 1 and find a replacement URL.

### Step 4 — File naming (slug convention)

```
Multi-image mode (article_arch: markdown):
  Pattern:  <article-slug>-<zero-padded-index>.<ext>
  Hero:     giai-ma-que-thuan-can-01.webp
  Body 1:   giai-ma-que-thuan-can-02.webp
  Body 2:   giai-ma-que-thuan-can-03.webp

Single-image mode (article_arch: component, count_needed: 1):
  Pattern:  <article-slug>.<ext>
  File:     giai-ma-que-thuan-can.webp
```

Single-image mode always writes to `public/images/articles/<slug>.<ext>` regardless of the project's `image_dir` fallback default — this is the one path the record's `ogImage`/share-image field and the rendered hero both point to (see Phase 5).

### Step 5 — Processing (`ffmpeg` / `sips`)

**Option A — `ffmpeg` (recommended, most accurate):**

```bash
# Hero / OG image — 1200×630 px, 16:9 center crop
ffmpeg -i /tmp/raw-<slug>-01.jpg \
  -vf "crop='min(iw,ih*16/9)':'min(ih,iw*9/16)',scale=1200:630:flags=lanczos" \
  -q:v 2 <output_dir>/<slug>-01.webp -y

# Body image — 800 px width, original ratio preserved
ffmpeg -i /tmp/raw-<slug>-02.jpg \
  -vf "scale=800:-1:flags=lanczos" \
  -q:v 80 <output_dir>/<slug>-02.webp -y

# Square product image — 800×800 px, center crop (for vstshop-style)
ffmpeg -i /tmp/raw-<slug>-01.jpg \
  -vf "crop='min(iw,ih)':'min(iw,ih)',scale=800:800:flags=lanczos" \
  -q:v 2 <output_dir>/<slug>-01.webp -y
```

**Option B — `sips` (macOS native fallback):**

```bash
# Resize to 1200 px wide first
sips --resampleWidth 1200 /tmp/raw-<slug>-01.jpg --out /tmp/resized-<slug>-01.jpg
# Crop 1200×630 from centre
sips --cropToHeightWidth 630 1200 /tmp/resized-<slug>-01.jpg --out <output_dir>/<slug>-01.jpg
```

**Size and weight targets:**

| Image role | Dimensions | Max file size |
|---|---|---|
| Hero / OG (16:9) | 1200 × 630 px | < 150 KB |
| Square product cover | 800 × 800 px | < 120 KB |
| Body / inline | Width 800 px | < 90 KB |

### Step 6 — Visual inspection after processing (`view_file`)

**Mandatory:** call `view_file` on the output file.

Confirm:
- [ ] File opens and displays correctly (not corrupt)
- [ ] Correct dimensions (width and height match spec)
- [ ] No important content clipped by the crop
- [ ] Acceptable visual quality

### Step 7 — Cleanup and handoff

```bash
rm /tmp/raw-<slug>-*.jpg /tmp/resized-<slug>-*.jpg 2>/dev/null
```

Return structured result to Article Worker:
```
hero:  { file: "<slug>-01.webp", alt: "<SEO alt text containing focus keyphrase>" }
body:  [
  { file: "<slug>-02.webp", alt: "..." },
  { file: "<slug>-03.webp", alt: "..." }
]
```

---

## Phase 5 — Image Embed

Article Worker receives the Image Scout's result. Embed method depends on `article_arch` resolved in Phase 4 Step 0 — never default to markdown syntax without checking.

**Alt text rules (both paths):**
- Must contain the focus keyphrase
- Must accurately describe the image content (no keyword stuffing)
- ≤ 125 characters

### `article_arch: markdown`

Embed with markdown image syntax directly in body content:
```markdown
![Giải mã quẻ Thuần Càn trong Kinh Dịch — ý nghĩa và ứng dụng](/images/articles/giai-ma-que-thuan-can-01.webp)
```

### `article_arch: component` (single-image mode)

Do **not** write `![]()` anywhere in body/paragraph fields — the renderer does not parse it and will print the literal text. Instead:
1. Set the content record's existing share-image field (e.g. `ogImage`) to `/images/articles/<slug>.<ext>`, site-relative. Confirm the SEO composable and schema make it absolute (`seo.A6`); if either passes it through raw, fix that helper once — never write the site origin into the record, even when neighbouring records do.
2. Confirm the shared render component (e.g. `ContentArticle.vue`) already displays that field as a hero image above the body. If it does not yet, that is a one-time component change to flag to the user — do not route around it with markdown text in a paragraph.
3. No separate body images in this mode; one image serves as both hero and OG/share image.

---

## Phase 6 — Self-Audit & Delivery

Article Worker runs through the full checklist before reporting completion.

### 6.1 Meta & technical SEO
- [ ] Meta title ≤ 60 chars (≤ 80 for article/knowledge slug pages)
- [ ] Meta title: no brand suffix, no em-dash, no en-dash
- [ ] Meta description ≤ 155 chars, starts with an action verb
- [ ] Canonical URL and all internal links end with `/`
- [ ] Exactly one H1
- [ ] JSON-LD valid; Organization block has `alternateName`, `knowsAbout`, `sameAs`
- [ ] Focus keyphrase appears in: H1, Meta title, Meta description, first paragraph opening, ≥ 1 H2

### 6.2 Content quality
- [ ] No `UNVERIFIED` claim appears in the published text
- [ ] No banned openers in any paragraph or FAQ answer
- [ ] No paragraph exceeds 5 lines
- [ ] CTA point has an anxiety-answering line
- [ ] ≥ 1 H2 is a direct question (ends with `?`)
- [ ] ≥ 2 internal links
- [ ] External links carry `rel="noopener"`

### 6.3 Image
- [ ] Hero image exists at the correct path, correct dimensions, visually sharp
- [ ] `article_arch` was resolved from the actual renderer, not assumed
- [ ] If `markdown`: all body images exist, correct spec, filenames follow slug-index convention (`<slug>-01.webp`, etc.), every `![]()` has a focus-keyphrase alt text ≤ 125 chars
- [ ] If `component` (single-image mode): exactly one image at `public/images/articles/<slug>.<ext>`, no `![]()` written into any body/paragraph field, the record's `ogImage`/share-image field points to that same file
- [ ] `/tmp/` scratch files removed

### 6.4 SSR / prerender
- [ ] Article content, meta tags, and schema are present in server-rendered HTML, not deferred to client-side JS

### 6.5 Rendered-output pass
Source strings, a green build and a passing SEO validator do not show what the reader sees. After the build, open the article's built HTML (every locale) — the build is self-authorized, no dev server needed (`coding.B3`):
- [ ] `grep` the page body: no `src`, `srcset` or `<a href>` carries the site's own origin; `og:image` and JSON-LD `image` are absolute (`seo.C3`)
- [ ] Read the full rendered text top to bottom as the target reader, in each locale, and fix anything that reader would stumble on — before reporting the article done
- [ ] Any SEO device visible in the text (a parenthetical keyword variant, a repeated keyphrase) is listed as a review line, never shipped silently

---

## Antigravity / AGY note

AGY has no native subagent spawn mechanism. When running under AGY (CLI or IDE), execute phases 1–6 sequentially in a single session. For Phase 4, open the Image Scout as a separate AGY conversation and paste its output back into the main session. This trades true isolation for sequential clarity — the content quality rules are unchanged.
