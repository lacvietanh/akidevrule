---
name: akihtmlreport
description: Visualize a complex report that already exists in the conversation as one self-contained HTML file — nothing else, no new analysis. Distills a dense analysis/report already discussed into a single-file, ultra-wide, visually dense HTML report (REPORT.html) at the project root, for content too dense to stay legible as chat text.
---

# akihtmlreport — single-file visual report extraction

Invoke with `/akihtmlreport`, or when the user asks, in any wording, to turn the discussion into a visual file. Its purpose is single and narrow: turn a complex analysis or report that already exists in this conversation into one self-contained HTML file for dense, at-a-glance reading — **nothing else, no new analysis**. Not a replacement for chat responses, and not something to reach for by default.

## When this skill actually applies

This is for content that has already gotten too dense to stay legible as chat text: a multi-part investigation report, a root-cause writeup with several code/log excerpts, a checklist spanning many items each with its own status, a comparison across several options, a Mac/manual test plan with many steps and expected results. The content must already exist in the conversation — this skill distills and formats, it does not originate new analysis.

**Do not use this skill for:**
- a short answer, a single fix explanation, or anything that already reads fine as chat text
- routine status updates or one-off command output
- anything the user hasn't actually asked to have extracted — only trigger on an explicit request, never proactively just because a response got long

If invoked on content that turns out not to be dense/complex enough to justify a visual file, say so and ask whether the user still wants one, instead of silently producing a thin HTML wrapper around a two-line answer.

## Target file — default path and the single-file rule

- Default output: **project root**, filename **`REPORT.html`** (uppercase, no variant names, no topic/version suffix).
- **Exactly one `REPORT.html` exists per project at a time.** This is deliberate: the point is to keep attention on ONE complex task at a time, not to accumulate a pile of past reports. Never create `REPORT-2.html`, `REPORT-v2.html`, `REPORT-<topic>.html`, and never move a prior one aside automatically to make room for a new one.
- **Before writing, handle any existing `REPORT.html` cheaply — never `Read` it.** A finished `REPORT.html` is large, dense HTML; reading it back burns tokens for nothing, since this skill always regenerates the file wholesale and never edits it in place. Inspect only its metadata with a shell one-liner (`ls -la REPORT.html`, or `find REPORT.html -mmin +720` — 720 min = 12 h):
  - Does not exist → write directly.
  - Exists but stale (last modified more than ~12 h ago) → a leftover from an unrelated past task. Delete it (`rm REPORT.html`) and write fresh — no read, no prompt. Deleting first also clears the read-before-write step, since the file no longer pre-exists. State in one line which stale file you removed.
  - Exists and recent (≤ ~12 h) → probably tied to the current or a closely related task. Still do not read it; stop and ask the user (overwrite, or skip). On overwrite, `rm` it first, then write. Never auto-rename to dodge the collision — that defeats the single-file rule.
- If the user explicitly names a different path or filename in their request, honor that instead — the default only applies when they haven't specified one.
- **Git-ignore it.** `REPORT.html` is a disposable visual export, not a doc source of truth (that's `docs/arch`/`docs/plan`) — it gets fully overwritten every time this skill runs, so tracking it in git only produces noise diffs unrelated to real code changes. If the target project is a git repo and its `.gitignore` doesn't already exclude `REPORT.html`, add an entry for it (with a one-line comment explaining why) the first time this skill writes the file there.

## Layout requirements — ultra-wide, narrow (dense)

- **Ultra-wide**: use the full viewport width, no centered narrow reading column. Use CSS grid/flex for multi-column layout wherever the content has parallel structure (comparison tables, side-by-side before/after, a checklist next to its rationale).
- **Narrow means dense, not cramped**: small, disciplined padding/margins and a compact type scale — mirrors Aki's "Extreme Narrow" UI philosophy. Every section should show as much signal as possible without unnecessary scrolling. No hero banners, no decorative whitespace, no filler — this is a working document, not a landing page.
- **Single file**: all CSS and JS inline in one `<head>`/`<body>`, zero external requests (fonts, CDNs, images, analytics) — must render correctly opened straight from disk via `file://`, no network required.
- **Theme-aware**: support both light and dark via `prefers-color-scheme` — the user may open this in any browser/OS setting, not necessarily a dark-themed one.
- Wide tables and code/log blocks get their own `overflow-x: auto` container — never let them force the page itself to scroll horizontally.
- Use real semantic structure — `<table>`, `<details>`, headers, color-coded status chips/badges for states like done/pending/confirmed/open/blocked or severity levels. The goal is scanability, not a prose wall reformatted with a few `<h2>` tags.

## Content — distill, don't just reformat

- **Header** (top of `<body>`): the report title, one line on what it is, and a generation timestamp. Compute the timestamp in **UTC** at write time — run `date -u +%Y-%m-%dT%H:%M:%SZ` in the shell and embed that exact ISO string in a `data-utc` attribute — then render it in the **viewer's local time**, down to hour:minute:second and with the zone, via a tiny inline script (e.g. `el.textContent = new Date(el.dataset.utc).toLocaleString()`). Never hard-code a local time: the file may be opened on a machine in a different timezone than where it was generated.
- **Table of contents** (directly under the header): a compact TOC listing every section as anchor links. Give each section a stable `id` (`<section id="findings">…</section>`) so the links jump to it. Keep it small and dense — a single row of links or a narrow box, never a full-height sidebar.
- Sections matching the natural structure of the analysis already discussed — one section per investigation area, one table per checklist, one card per open question/decision point. Each section carries the `id` that its TOC entry targets.
- Status/severity color-coding wherever the content has state — this is the main value-add over plain chat text, so don't skip it even under time pressure.
- **Evaluation reports only** — when the source is a *discussion or assessment* (a refactor, a code review, a strategy, or an idea — the Module 5 cases), surface each item's **side effects** and **edge cases** as a first-class element (its own column, chip, or card), never buried in prose, and separate what can be decided autonomously from what needs the user's call. Keep the MVP / main recommendation the headline and let SFX/EC support it — but if one is a blocker (severe enough to change the recommendation), flag it prominently as such, not as a footnote. Do NOT add this scaffolding to reports that aren't evaluations (status, investigation, test plans) — that would be over-fitting.
- Code/log excerpts go in `<pre>`/`<code>` blocks with their own scroll container, never inlined into prose paragraphs.
- **Preserve every concrete fact, file path, line reference, and command from the original discussion** — this is an extraction, not a re-summary. Do not drop detail to make it shorter; the whole point of a wide/dense layout is that it can hold more, not less.
- **A final summary is mandatory**: the closing takeaway section is always a short, plain-language bottom line — the decision, the outcome, or the single thing to remember — even when the body is exhaustive. It comes last, or immediately above the glossary appendix when one is present. Give it an `id` and a TOC entry like any other section.
- **Glossary / notes appendix (when needed)**: if the report leans on abbreviations, shortened forms, special jargon that could be misread, or even basic terms used without inline explanation, add a compact term → meaning table as the very last section, after the summary. Include it only when there is genuinely something to clarify — skip it entirely otherwise, and do not repeat terms already explained inline. Give it an `id` and a TOC entry.

## Pairs naturally with `/akithink`

A `/akithink` Phase 5 convergence (decision + rationale + rejected alternatives + assumptions to monitor) is a common source of exactly the kind of dense, multi-part material this skill exists to visualize — the docs file stays the source of truth, `/akihtmlreport` just gives it a scannable view.

## After writing

After writing the file, open it locally: `open REPORT.html` on macOS, falling back to `xdg-open` on Linux. If opening fails (headless environment, no `xdg-open`, etc.), just tell the user the file's path instead of failing the skill. Never publish or host it anywhere — if the user separately asks for a hosted, shareable version, that is a different request (the `Artifact` tool), not part of this skill.
