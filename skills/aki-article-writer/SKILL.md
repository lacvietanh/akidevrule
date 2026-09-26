---
name: aki-article-writer
description: >-
  Per-project article writing skill: research & fact-verification, SEO metadata,
  JSON-LD schema generation, UX-psychology-aware content, and a separate Image Scout
  subagent (Gemini Flash / Haiku) for image search, download, visual inspection,
  slug-named processing, and WebP output. Activate when the user asks to write a
  new article, create content, draft a blog post, or produce a knowledge entry for
  any project.
---

# aki-article-writer

Invoke with `/aki-article-writer`, or whenever the user asks in any wording for an article to be written.

This skill delegates one full article to a dedicated **Article Worker subagent**. The worker spawns a separate **Image Scout subagent** (lightweight model) for all image work, keeping both agents' contexts clean and independent.

Read the full procedure before starting:

- **[references/article-workflow.md](references/article-workflow.md)** — the six-phase pipeline:
  Phase 1 Research & Fact-Verification →
  Phase 2 Metadata & JSON-LD Schema →
  Phase 3 Content & UX Psychology →
  Phase 4 Image Scout Pipeline →
  Phase 5 Image Embed →
  Phase 6 Self-Audit & Delivery

## Per-project configuration

Before spawning the Article Worker, read the project's own `CLAUDE.md` (or `docs/ref/article-schema.md` if present) to extract:

| Field | Where to find it | Fallback |
|---|---|---|
| `tone` | `CLAUDE.md` project context | conservative and informative |
| `lang` | `CLAUDE.md` or site locale config | `vi` |
| `schema_type` | `CLAUDE.md` or `docs/ref/seo.md` | `BlogPosting` |
| `image_dir` | `CLAUDE.md` or `nuxt.config` public path | `public/images/articles/` |
| `image_format` | `CLAUDE.md` | `webp` |
| `article_arch` | Inspect how existing articles are actually stored and rendered — `.md`/`.mdx` files under `content/`/`docs/` → `markdown`; structured records in `.ts`/`.js`/`.vue` (e.g. a `posts.ts` data file rendered by a shared Vue/React component) → `component` | detect from repo; never assume |

Pass these as the Article Worker brief alongside the topic and slug. `article_arch` gates Phase 4/5 image behavior — see workflow doc.

## Subagent model assignment

| Agent | Recommended model | Reason |
|---|---|---|
| Article Worker | Sonnet / Flash (default session model) | Holds full content context throughout |
| Image Scout | **Gemini Flash / Claude Haiku** | Mechanical: search → download → inspect → process. Cheap model; blank context is no handicap |

Never use the same subagent for both content writing and image processing — the image pipeline is iterative and token-heavy; keeping it separate prevents context flooding in the Article Worker.
