# Rule delivery — the second hop measured on Claude Code: the model reads a routed rule in 18% of sessions unprompted

**Start time:** 2026-09-29, from the owner's proposal to demote `RULE-coding.md` and `RULE-pattern-core.md` out of the `@` imports ("tăng độ nhạy ở mức cực cao chứ không ép load mặc định nữa"), and the follow-up question once the numbers came in: *"en force lại đi? cần không? nghiên cứu lại đi. nghiên cứu focus vào đúng những mệnh đề mà ta đang cần cải thiện"*.

## 1. Initial purpose

Two questions. (1) Is it safe to move `coding`/`pattern` behind the router, i.e. how reliably does a Claude Code session `Read` a routed file on its own once the router is `@`-imported (`rule-delivery-force-load-sep25.md` §5 item 1 left that `Read` as "the only model-dependent hop", unmeasured on Claude Code)? (2) If not, which failure classes make up the miss, and which mechanism fixes each — text, or the enforcement tier that `core-floor-promotion-aug6.md`'s reopen trigger already named as the next move.

Constraints: no API spend (the 2026-09-25 probe incident, `agent.B3`); the owner codes on the Mac, so this dev box's transcripts are not representative (he said so, and the first pass on them read 87%); over one hundred downstream installs receive whatever ships.

## 2. Strategy

Measure from transcripts already on disk, not from new calls. The owner shipped every Claude Code transcript from the Mac (`~/.claude/projects`, 786 files, 26 projects, 715 MB) to `~/aki/debug/29Sep-transcripts/`. For every session that edited a file of a type the router maps to one rule, record whether that rule was `Read` (tool call, or a `cat` of it in Bash) at any point, whether before the first such edit, whether a `[RULES]` receipt was emitted, whether the receipt named the route, and whether the `Read` came only after a user message containing `akirule`. Split at 2026-09-25 (router force-import). Exclude sidechain transcripts and this repo's own sessions (editing the corpus reads the corpus for other reasons). Script: `scripts/second_hop_audit.py` (session-level, portable); the class breakdown was a scratchpad extension of it.

Route detectors (artifact → rule): `CHANGELOG.md` → release · `docs/**.md` → docs · `.vue` in a `www-*` Nuxt project → stack · `.vue|.css|.scss` → ui · `.rs` → tauri. Meaning-only routes (think, proportion, biz, content) have no artifact signature and were not measured.

## 3. Checklist

1. Extract, count, confirm no project `CLAUDE.md` in the ecosystem `@`-imports a rule file directly (none does: `grep '^@' ~/aki/*/CLAUDE.md ~/aki/web/*/CLAUDE.md` is empty), so every read below is the router's.
2. Session-level rate per route and era.
3. Classify each route-session: no receipt / receipt but route not named / route named but file not read / read.
4. Owner-reminder attribution: reads that happened only after the owner typed `akirule`.
5. Turn-level: read before the first edit of that artifact type.
6. Model and session-length splits.
7. Vendor facts for the candidate mechanism: PreToolUse deny shape, stdin fields, output caps (`code.claude.com/docs/en/hooks`, read 2026-09-29).
8. Owner cost: sessions and messages in which the owner typed `akirule` after 2026-09-25.

## 4. Result

**Headline.** After the router was force-imported, the model *emits the receipt* far more often (36% → 81% of edit sessions) but *reads the routed file* no more often (56% → 57%), and 26 of the 36 reads that did happen came only after the owner typed `akirule`. Organic second hop: about 10 of 57 route-sessions, **18%**. The import fixed what it could see (the receipt line) and not what it was for (the `Read`).

**Per route, after 2026-09-25** (Mac, AkiDevRule sessions excluded, n = route-sessions):

| Route | n | read at any point | read before first edit | any receipt |
|---|---:|---:|---:|---:|
| docs | 18 | 72% | 44% | 88% |
| release | 17 | 64% | 52% | 76% |
| tauri | 6 | 66% | 16% | 100% |
| ui | 12 | 50% | 16% | 75% |
| stack (Nuxt projects only) | 4 | 50% | 25% | 75% |
| **pooled** | **57** | **63%** | **37%** | **81%** |

Before 2026-09-25 (n = 201): 56% read, 43% before first edit, 36% any receipt. On this dev box the same script reads 87% after the cut, on 31 sessions that were mostly corpus editing: not representative, as the owner said.

**Failure classes, after 2026-09-25** (each route-session in exactly one):

| Class | n | share | What it is |
|---|---:|---:|---|
| Z · no receipt at all | 8 | 14% | the router was in context and ignored entirely |
| A · receipt, route not named | 9 | 16% | the router ran, the classification missed the domain |
| B · route named, file not read | 4 | 7% | the receipt claimed a file that was never opened |
| C · read | 36 | 63% | of which 26 came after an `akirule` reminder and 21 before the first edit |

**Owner cost, 2026-09-25 → 29 (four days):** 45 sessions, the owner typed `akirule` in 32 of them, 126 messages. About three reminders per session.

**Model split (after):** `claude-sonnet-5` 56 of 66 route-sessions, 33% read before first edit; `claude-opus-5-5` 5 sessions, 60%. Too few Opus sessions to conclude beyond "tier matters, and the owner's default is the weaker tier". Session length does not separate the classes (long 59%, short 40%, n = 5 short).

**Vendor facts** (`code.claude.com/docs/en/hooks`, read 2026-09-29, Claude Code 2.1.283–284 on the Mac per transcript `version`): a `PreToolUse` hook denies with `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"…"}}` or exit 2 with stderr, and the reason is shown to the model; stdin carries `session_id`, `transcript_path`, `cwd`, `tool_name`, `tool_input`; **`additionalContext` and plain stdout are capped at 10,000 characters** per string.

**What the evidence settles**

- Text has been tried twice at the mechanism level (Aug 6: promote to core; Sep 25: import the router) and both moved only what text can move. Class Z, A and B are three different model decisions, and no wording fixes a decision the model does not take. `agent.A5`'s own line applies to the session agent too: a rule address in the output proves the address was available, nothing about what was done.
- **Demoting `coding`/`pattern` behind the router is rejected** on this evidence: at 18% organic recall roughly four in five code sessions would run without them. The pre-registered threshold (≥90% demote, <85% keep) was set before the numbers were read.
- **SessionStart injection of rule text is dead as a mechanism**: the 10,000-character cap is below every rule file except `pattern` (8 KB).
- **The enforcement tier is the pre-registered next move** (`core-floor-promotion-aug6.md` § Reopen trigger: "the cause is compliance rather than loading … the next move is the enforcement tier (hook), not more context"), and the mechanism differs from the reminder hook rejected on 2026-08-03 (`akiflow-compliance-enforcement-aug3.md`: "still one model hop, per-turn cost"). A `PreToolUse` deny on `Edit|Write|MultiEdit|NotebookEdit` is **zero model hops**: the edit cannot proceed until the `Read` has happened, the mapping is a file-path pattern the hook computes, and the `transcript_path` on stdin lets the hook check whether the rule was already read this session with no state file. It covers Z, A, B and the after-reminder and after-first-edit halves of C in one mechanism, for every route that has an artifact signature. It fires only on the first edit of each artifact type per session, so the per-turn cost the 2026-08-03 rejection feared does not exist. Subagents get the same gate through their own transcript, which is the `agent.A5` "worker inherits nothing" gap closed by mechanism.
- **Residue the hook cannot reach:** meaning-only routes (`think`, `proportion`, `biz`, `content` outside `locales/**`, `seo` outside sitemap/robots files). Those stay model-dependent; their miss rate is unmeasured and unmeasurable from artifacts.
- **Once the gate exists, the demotion becomes safe by construction**: a code-file edit would be gated on `coding`+`pattern` exactly as a `.vue` edit is gated on `stack`. The owner's tiering goal and the delivery guarantee stop conflicting. That is a second step, after the gate has run for a few weeks and the same script shows the rate.

**Verification.** All counts are from the shipped transcripts and reproducible with the scratchpad extension of `scripts/second_hop_audit.py` pointed at the extracted directory. Caveats: session-level detection is generous (a `Read` anywhere in the session counts); "after 2026-09-25" is four days; the stack route has n = 4 after excluding Tauri projects that also edit `.vue`; the reminder regex is `akirule` only, so reads after a differently-worded reminder count as organic (the 18% is an upper bound). Not verified: that a `PreToolUse` deny reason is honoured by the model on the next action (vendor docs say it is shown; behaviour after the block is the spike in the plan); the miss rate on meaning-only routes.

**Corroborating links.** `core-floor-promotion-aug6.md` (loading vs compliance split; reopen trigger naming the enforcement tier), `rule-delivery-force-load-sep25.md` §4 (router import; Antigravity 9/10 under an *unconditional* imperative, which is not this mechanism), `akiflow-compliance-enforcement-aug3.md` (reminder hook declined as one model hop), `../plan/resident-context-slim-sep28.md` (the byte plan this decision does not block), `.akidevsync/notes.json` task *"hình như dạo gần đây không nạp akirule tự động"* (confirmed by the counts above, and not fixed by the 2026-09-25 batch).

## 5. Decision

**Rejected/closed** — demoting `coding`/`pattern` to router-loaded now. Reopen after the gate below has shipped and `scripts/second_hop_audit.py` on the Mac shows ≥90% read-before-first-edit for artifact routes over 30 days.

**Follow-up — plan, awaiting the owner's go** (a hook is shared runtime config on 100+ installs, `agent.B3`): a `PreToolUse` route gate, `claude/hooks/aki-route-guard.mjs`, registered by `install.mjs` beside the update-check hook, mapping file-path patterns to rule files and denying the first edit of each artifact type per session until the rule has been read in that transcript; exact map, spike list (deny-reason behaviour, `MultiEdit` coverage, subagent transcripts, opt-out env var), and the Non-goals check go in the plan. Not this doc.

**No action** — router or rule text. Wording cannot reach classes Z, A, B, and two rounds of it have shown that.

**Cross-references** — `docs/plan/resident-context-slim-sep28.md` (Items 1–3 unaffected; demotion removed from scope), `payload/index.md` (five files load mechanically: unchanged), `docs/arch/rule-delivery-architecture.md` (gains a third delivery tier once the plan lands), `scripts/second_hop_audit.py` (the instrument; run on the Mac with `ssh bien cat … | python3 -` or on shipped transcripts).

## Amendments

- **2026-09-30 — owner overruled the sequencing, not the decision.** The Decision above ordered gate first, a 30-day watch, then the demotion. The owner ordered both to ship together to the dev box ("cứ thử đi, tôi test vài phiên ở đây là đủ"), on two grounds: the dev box is a sandbox, since nothing reaches the 100+ downstream installs until the Mac commits and releases, so the two-step order is preserved at the release boundary rather than the install boundary; and the demotion's beneficiaries are the many downstream users whose sessions are questions rather than edits, a population this doc's Mac-only sample under-represents by construction. Shipped: `claude/hooks/aki-route-guard.mjs` (the gate as specified in §5, plus a three-denial cap and `AKI_ROUTE_GUARD=0`), `claude/CLAUDE.md` down to three imports, `coding`/`pattern` as router rows. The ≥90% read-before-first-edit criterion moves from "before demoting" to "before releasing", measured on this box with `scripts/second_hop_audit.py` (era split now 2026-09-30). Tracking: `../plan/done/resident-context-slim-sep28.md` Item 4.
- **2026-09-30 — measurements after the batch, and the challenge.** Resident bytes per Claude Code session 81,985 → 62,121 (index 21,405 → 22,559, agent 21,890 → 22,308, router 11,518 → 13,725, template 3,372 → 3,529; `coding` 15,216 and `pattern` 8,584 out). Gate blind spot measured on the same Mac set: 118 of 191 sessions wrote a file through Bash at some point, 9 wrote only that way. A clean-context challenge found the Antigravity surface untouched by the demotion (`payload/GEMINI.md` session-start read) and the release criterion above tautological under a gate; the plan's Item 4 now carries the corrected criteria and the accepted residues. The ≥90% figure stays as the historical threshold, not the release test.
