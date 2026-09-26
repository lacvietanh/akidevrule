# UI Pattern — Frontend Enforcement (Nuxt / Vue / Tailwind)

<!-- Address map: ui.A1-4 · ui.B1-5 · ui.C1-5 -->

**Tier: Contextual.** Load on any UI authoring/refactor signal, or on an audit signal (see the Audit section). This file is the **UI-specific enforcement** of the universal laws in `RULE-pattern-core.md` — it does not redefine them. Nuxt/Cloudflare stack mechanics (rendering, i18n, layout chrome, deploy) live in `RULE-stack-akiNuxtCf.md`; this file owns the design-system layer: tokens, class taxonomy, variant API, and UI audit.

## Map to RULE-pattern-core (which universal law each rule enforces)

- **SSoT (Law 1)** → design tokens are the single source for every visual value.
- **Evidence-based abstraction (Law 2)** → Rule of Three before a pattern class or base component.
- **Composition over duplication (Law 5)** → slots / dynamic components / `v-for`, never hand-copied markup.
- **OCP (Law 4)** → extend a component via props / variant / slot, never fork a copy.
- **Name by role (Law 7)** → semantic tokens and variants, never value-names.
- **Reshape, don't stack (Law 8)** → before packaging a repeated style, try to remove it. The tier ladder only *packages* repetition; Law 8 is the only thing that *eliminates* it, and without it a codebase obeys every rule here while growing without bound.
- **Documentation** → every global pattern is looked up before writing and recorded after, so the next agent reuses instead of rewriting.

---

## A. Taxonomy & tokens

### A1. Four-tier class taxonomy

Every style belongs to exactly one tier — there is no fifth tier.

| Tier | Name | Definition | Lives in | Example |
|---|---|---|---|---|
| 0 | Design Token | Atomic value of the visual system | one source per project — `@theme` (Tailwind v4) or `tailwind.config` (v3), see A2 | `--color-primary`, `theme.spacing` |
| 1 | Utility | Single-property atomic class, used inline | Tailwind core | `flex`, `gap-4`, `text-sm` |
| 2 | Pattern class | Repeated utilities behind one semantic name, defined **once** — `@apply` or plain CSS, both valid | the shared stylesheet in `assets/css/*`, never an SFC `<style>` | `.c-card`, `.c-btn` |
| 3 | Variant (modifier) | Variation of a pattern — prefer a Vue prop + computed class-map; BEM modifier only where Vue can't control markup | SFC `computed()` or `.c-btn--sm` | `variant="primary"` |
| 4 | Component | Markup + variant logic packaged as a reusable SFC | `components/base/*.vue` | `<BaseButton variant="danger" />` |

**Before any tier — the subtraction pass (Law 8).** Every rung above adds something; none removes anything. Run these three first, and only what survives gets a tier:
1. **Delete** — does the element need this style at all, or is it restating a browser or framework default?
2. **Inherit** — is the property inheritable (color, font, size, leading, tracking, alignment)? Set it once on the nearest container and delete it from every child. A typography class repeated across siblings is almost always this case.
3. **Hoist** — if siblings share a non-inheritable style, does it belong on the parent as a layout rule (`space-y-*`, `divide-*`, a grid/flex gap) rather than on each child?

Rules between tiers:
- Tier 1 is the default first reach for any styling need that survives the subtraction pass.
- **The second copy is the STOP; the third is only the extraction threshold.** Rule of Three (Law 2) counts ≥3 occurrences *repo-wide* — a count no editing session can observe, since one open file cannot see the other ninety. Waiting for a trigger nothing can fire is why a codebase reaches thousands of duplicates with an empty pattern layer. The observable trigger is the one in front of you (`pattern.A5`): the moment you are about to write a class string you already wrote once, stop and decide the shared shape. "Leave both inline" is a legitimate outcome — but it must be a decision, not a default. When the decision needs the real count, scan for it (`C1`); never estimate it.
- Tier 3 in Vue is **always prop-driven** (a computed class-map). Loose CSS modifiers are only for markup Vue does not render — Markdown/CMS output, static email templates.
- Tier 4 is the destination: once a pattern has variants, package it as a base component so callers never hand-assemble class strings.

**Mandatory order:** subtraction → Utility → Pattern class → Component variant → hand-written CSS.

**Inline `style=` is not a fifth tier — it is a single escape hatch for a value computed at runtime** (`:style="{ width: pct + '%' }"`). A static inline style is always a violation: no scan in `C1` sees it, it cannot carry a token, and it cannot be overridden without `!important`. Convert it; never add one.

**A `<style>` block must earn its place, and "last resort" is a quantity claim.** No single file reveals whether the mandatory order holds — inversion is only visible in aggregate, so it must be measured in aggregate (`C1`): when the CSS inside SFC `<style>` blocks outweighs the project's shared stylesheet, the order above has been inverted in practice no matter how reasonable each file looks alone. Legitimate residents of a `<style>` block: keyframes, selectors the framework cannot express (`:has()`, `::-webkit-scrollbar`, print rules, complex sibling logic), third-party overrides, and styling for markup the project does not author (CMS/Markdown output). Everything else belongs to a token, a utility, or a component.

### A2. Design tokens = the single visual source (Law 1)

- Every visual value — color, spacing, radius, shadow, font, breakpoint, z-index, easing, duration — exists **once**, in whichever mechanism the installed framework version actually uses: a `@theme` block for Tailwind v4 (CSS-first), `tailwind.config` for v3, plain CSS custom properties otherwise. Read the project's own setup before writing a token — a rule that names the wrong file teaches the reader that the rule is decorative. Never rewrite a hex / px / ms value anywhere else.
- **The token layer is itself subject to SSoT: one theme source per project.** Several `@theme` blocks, or custom properties declared ad hoc across dozens of files, reintroduce exactly the drift tokens exist to prevent — a second definition wins by load order, which nothing in the source makes visible.
- Name tokens by **role**, not by hue/value: `primary`, `surface`, `danger`, `on-surface` — never `bg-blue-500` sprinkled across code. Rebrand = edit one place, not hundreds.
- Reuse the scientific scales required by `RULE-stack-akiNuxtCf.md`: z-index via `--z-index` variables, radius via `radius-sm | md | lg | xl | pill`.

### A3. Arbitrary-value policy (Law 1 + Law 7)

`w-[123px]`, `text-[#3b82f6]`, `top-[13px]` are forbidden unless **all three** hold: (a) no existing token in the scale fits, (b) the value provably appears exactly once system-wide, (c) an inline comment explains why it is a one-off. A value likely to repeat → add a token first, use the token second.

### A4. Framework-native scale first (Law 1 + Law 7)

Before adding **any** custom token — font-size, spacing, radius, shadow, whatever the framework already ships a scale for — check the framework's own default scale first. A custom token is only justified for the part of the range the framework genuinely does not cover.

- **Order of preference:** framework default utility (`text-sm`, `text-base`, `rounded-lg`, …) > project token that extends the framework's scale for a gap it doesn't cover > one-off arbitrary value (§A3).
- Never invent a parallel scale that duplicates what the framework already provides "for consistency" — that is the opposite of consistency; it is a second source of truth (Law 1 violation) and the exact drift this rule exists to prevent.
- When cleaning up scattered ad-hoc values (see §C), snap each value to the **nearest existing step** (framework or already-established project token) by midpoint, not the raw value — a cluster of `0.78rem / 0.8rem / 0.82rem` is drift around one intended size, not three intended sizes. Do not mint a new token per raw value found in the wild; that fossilizes noise instead of correcting it.
- Prefer **fewer, framework-aligned steps** over a deep bespoke scale. If a redesign of the scale is on the table, count how many genuine semantic roles exist (not how many raw values exist) — they are almost always far fewer than the raw-value count suggests.
- This is a stack-wide UI hygiene issue, not a one-page fix: when the same drift pattern (e.g. a near-continuous spread of hardcoded font-sizes) shows up on more than one page/component, treat it as a systemic gap in the token set, not N independent one-off violations — fix the pattern once at the token layer, then sweep every call site.

## B. Component structure

### B1. Atomic component structure (Law 3 + Law 6)

```
components/
  base/       # Atom — pure presentation, no fetch, no business logic
  composite/  # Molecule — ≥2 base components into one meaningful unit
  sections/   # Organism — page blocks; may use composables for data
  layout/     # Layout singletons (app.vue / layouts/)
composables/  # All data + business logic lives here — never duplicated in components
```

- Data and side effects live in composables (the boundary — see `RULE-stack-akiNuxtCf.md` External integrations), never duplicated across components.
- For the fixed layout roles (footer, top nav, sidebar, breadcrumb, admin sidebar…), reuse the **canonical component names** defined in `RULE-stack-akiNuxtCf.md`. Do not invent new names for those roles.

### B2. Variant API (CVA-style) (Law 4)

A base component exposes a **finite enum** of variants/sizes; a `computed` class-map resolves `prop → classes`. A new visual need is a **new entry in the same map**, never a forked `BaseButtonRed.vue`. Props / slots / emits are a stable contract — extend it, do not mutate it for one caller.

### B3. Composition, not hand-copied markup (Law 5)

Never duplicate a markup + logic block across components "for speed." Use slots, dynamic components (`<component :is>`), a composable, or `v-for` over data instead of writing N near-identical templates by hand.

### B4. Documentation duty (Law 1 for knowledge)

The duty runs **both ways, and the lookup half comes first**: grep the project's shared stylesheet and token source for the concept before defining any named style, and record a new **global** pattern class or variant in the project's pattern library the moment it is created. An undocumented pattern does not exist — the next agent rewrites it and the duplication returns.

Recording alone does not prevent this. A write-only duty produces a documented pattern that the next session never reads, then redefines locally in an SFC `<style>` block; the shared name now has two live definitions, and the one that wins depends on load order rather than on anything visible at either site. That is strictly worse than raw duplication, because the shared name promises a consistency it no longer delivers. One name, one definition, one file — checked by lookup, not by memory.

### B5. Hover proximity — no dead gap on the pointer path (Law 8)

Invariant: a `:hover`-shown popup/menu/tooltip stays open while the pointer travels trigger → content. Root fix first: eliminate the gap — nest the popup in the trigger's hover scope (parent `:hover` / `group-hover`) and create visual spacing with inner `padding`, never external `margin`. Only when the popup must escape the flow (portal/teleport, `overflow` clipping): transparent `::before`/`::after` bridge over the gap, or a short close-grace delay (~300ms). Closing mid-travel is a bug, not a styling choice.

---

## C. Audit playbook — cleaning existing code

**Triggers for this section:** any request to clean up, deduplicate, audit or refactor classes, tokens or styles. Pair with `METHOD-audit-flow.md` for the flow-level mindset; this section is the concrete UI grep layer. Run the steps in order — do not skip.

### C1. Inventory by scan (quantify before refactoring by feel)

**Run the inversion check first — it decides whether anything else here is worth doing** (§A1, mandatory order). Compare the shared stylesheet against the CSS scattered through SFC `<style>` blocks; scattered outweighing shared means the tier order is inverted project-wide, which is a token/component-layer problem no amount of per-file tidying reaches:
```bash
find . -path ./node_modules -prune -o -name '*.css' -print | xargs cat | wc -l        # shared layer
find . -path ./node_modules -prune -o -name '*.vue' -print | xargs awk '/<style/{f=1} f{n++} /<\/style>/{f=0} END{print n+0}' | awk '{s+=$1} END{print s+0}'   # scattered layer
```
One name, several definitions (§B4 — the failure that is worse than duplication):
```bash
grep -rhoE '^\.[a-zA-Z][a-zA-Z0-9_-]*[ ]*\{' --include="*.css" --include="*.vue" . | tr -d ' {' | sort | uniq -c | awk '$1>=2' | sort -rn
```
Duplicate long class strings (pattern-class candidates — Law 2):
```bash
grep -rhoE 'class="[^"]{20,}"' --include="*.vue" . | sort | uniq -c | sort -rn | awk '$1>=3'
```
Un-tokenized arbitrary values (Law 1 + Law 7 / §A3):
```bash
grep -rnoE 'class="[^"]*\[[^]]+\][^"]*"' --include="*.vue" .
```
Hardcoded hex/rgb outside the token source (Law 1 / §A2):
```bash
grep -rnoE '#[0-9a-fA-F]{3,6}\b|rgb\([^)]+\)' --include="*.vue" --include="*.css" --include="*.ts" . | grep -viE 'tokens|theme|tailwind\.config'
```
Hand-written `px`/`ms` in `<style>`, and static inline `style=` — same treatment.

**Two blind spots these commands have; state them in the report rather than letting a clean number imply a clean codebase.** Only literal `class="…"` is matched, so every `:class`/`v-bind:class` binding is invisible and the duplicate counts are floors, not totals. And the presence of a pattern layer must never be inferred from an `@apply` grep — a project may express Tier 2 as ordinary CSS rules (entirely valid, and the norm under Tailwind v4), so absence of `@apply` says nothing about whether Tier 2 exists.

### C2. Classify severity

SSoT breach (hardcoded value that should be a token) **>** duplicated business/logic **>** duplicated presentation style. Fix in that order of danger.

### C3. Priority matrix (impact × effort)

Plot each finding on impact × effort. Do high-impact / low-effort first. Do not start a large refactor by feel before this matrix exists.

### C4. Safe refactor loop

One pattern at a time: extract the token / pattern class / variant → replace every call site → verify build + type + visual → commit. Follow `RULE-release.md` for CHANGELOG/version; never push unasked (`RULE-agent-behavior.md`).

### C5. Compliance scorecard

Score the codebase against `RULE-pattern-core.md` Definition of Done and the four-tier taxonomy: any tier-0 breach (hardcoded value), any un-evidenced abstraction, any forked component, any value-named token is a fail to record.

**Report template**

```
UI Pattern Audit — <project> — <date>
1. Inventory counts: dup class strings / arbitrary values / hardcoded colors / hand px-ms
2. Top violations by severity (SSoT > logic > style)
3. Priority matrix: quick wins vs large refactors
4. Recommended extractions (token / pattern class / base component) with call-site counts
5. Score against Definition of Done
```

## One-line reminder

Diversity of UI comes from a controlled variant system, not from ad-hoc class strings — one source per value, one pattern per repeated problem.
