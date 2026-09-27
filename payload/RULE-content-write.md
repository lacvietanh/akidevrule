# Core Content Rules

<!-- Address map: content.A1-3 · content.B1-3 · content.C1-2 -->

## A. Content principles

### A1. Scope
These rules apply to all product content: interface text, meta titles/descriptions, FAQ answers, JSON-LD text fields, article copy, and empty states. All of these are "content" — the channel (visible UI, SERP snippet, schema bot) does not change the authoring principles.

### A2. Interface text
- Use the current UI language
- Small local strings may stay inline
- Shared or repeated strings should use i18n keys. Exception: Text content that is exactly the same in both EN/VI should be directly hardcoded in the UI.

### A3. Semantic stability
- Use one canonical term for one concept across the product
- Avoid synonyms for the same action unless the context truly differs
- Keep labels stable so users, translators, tests, and LLMs can map concepts reliably

## B. Style & patterns

### B1. Interface text patterns
- Action buttons should usually start with verbs
- Field labels and setting names should usually be noun-based
- Error messages should state the problem first, then the next action if needed
- Empty states should explain what is missing and what the user can do next

### B2. Writing style — density is enforced, not preferred
- Prefer clear, concrete wording
- Deletion test per sentence (domain application of `agent.A4`): a sentence ships only if cutting it loses information the reader needs. Cut preamble, filler connectives, restatement, and reassurance — length follows content, never the reverse.
- First sentence carries the point (the benefit, the instruction, or the answer); detail follows. An FAQ answer is the sharpest case: answer in the first sentence, never a "Đây là...", "According to..." preamble.
- Avoid filler and vague marketing language unless the project explicitly wants it
- Keep headings short and literal
- Punctuation: Strictly limit the use of em dash (—) and en dash (–)

### B3. Human + LLM readability
- Prefer explicit nouns over clever wording
- Use stable labels for repeated concepts
- Avoid unnecessary abbreviations in user-facing text
- Make important entity definitions obvious near the start of a page or section

## C. Separation

### C1. Separation
- Do not mix chat wording into product content
- Do not let temporary task context leak into permanent copy

### C2. Content audit
Read-only (`agent.B5`). Four sweeps, each anchored to the rule it checks:
1. **Canonical-term drift** (A3) — grep UI strings and i18n keys for synonyms of one concept; one concept with two live labels is a finding.
2. **Density** (B2) — deletion test per shipped sentence; preamble, restatement, and reassurance in product copy are findings.
3. **i18n coverage** (A2) — hardcoded user-facing strings that should be keys (excluding the EN=VI exception).
4. **Fact-check** (`agent.B2`) — every claim about a product, feature, version or number must trace to the project's `ref/fact-*` (`docs.A6`) first, then to that product's own repo or live page; a claim that cannot be traced is a finding, not a style note.
Classify severity per `docs.C4` (wrong / stale / incomplete / cosmetic); findings spanning domains route into the `docs.C2` research+plan pair.
