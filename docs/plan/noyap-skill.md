# `/noyap` — the answer, and what the owner must act on; nothing else

Status: revised 2026-10-28 (§ Revision below: Decisions 2–5 and the Assumption row replaced after a transcript review); first decided 2026-10-28 after four design-time rounds — self-run `/akithink` (R1), clean-context challenger on Opus 5.5 (R2), revision (R3), challenger on the revised plan and the skill text, then a second revision (R4); executed the same day (skill, sweep, CHANGELOG); active until Verify 3 (the owner's canary) passes, then moves to `done/`; the `N` below outlives it. Origin: owner note task-1793166568668 (2026-10-28). The skill text is the spec: `skills/noyap/SKILL.md`; this doc records why.

## Reading of the note

- "skill này trải qua /akithink deep 2-4 rounds cho từng ý … => cần nghiên cứu và đúc kết": read as design-time — the four rounds above. The runtime reading (deep rounds per `/noyap` call) is adopted in part: where a thinking channel exists the sorting and the per-idea test run there, unprinted; full `/akithink` rounds per call are rejected because each is several passes per reply and impossible on a model without extended thinking (`skills/akiflow/references/harness-facts.md`: `claude` + haiku has none).
- "để AI trả lời lại ngắn gọn hơn" fixes the primary act: rewrite the reply just given.
- "ưu tiên nghiên cứu xem có thể chạy và áp trong luồng thinking không": answered under Thinking channel.
- "không thể nào tối ưu hơn được nữa": not claimable by any text; the bar is the owner's reading plus the Reopen triggers.

## Decision

1. **One skill, `skills/noyap/SKILL.md`, user-invocable, no script.** The fix procedure behind the `[FLUFF]` card on a reply, as `akilint` is behind `[WRAP]`/`[YAP]`; root law `agent.A4`, pointed at — the cut list, the deletion test and the `Q`/`T`/`N` codes are A4's and are not restated. A `[FLUFF]` on a file stays `docs.B3`.
2. **Two invocations, and the shape persists.** Bare `/noyap` (or the card, in any language) after a reply rewrites it; `/noyap <request>`, or a request carrying "no yapping / ngắn thôi", answers short the first time; every later reply to the owner keeps the shape until the owner asks for detail, while worker briefs, files and commit messages keep their own rules. (Revised: the first decision rejected a mode as invisible and ambiguous; transcripts showed the next reply relapsing to full length within 13 minutes, and bare `/noyap` always rewrites the last reply, so there is no ambiguity.)
3. **Shape = a whitelist, never slots:** the `[RULES]` receipt · the answer · what the owner must do or heed, each one plain sentence with its weight and its A4 letter. An idea stays only if the owner asked for it or would do or decide differently without it; everything else is cut, never moved to a note or an `N`. Leftovers are settled: doable → done before replying; unimportant → unsaid; important and decidable → self-run `/akithink` to convergence, then A3's decision block. (Revised: the four slots — Answer · Open items · Evidence · Notes — gave every idea a home, and measured rewrites under them kept every idea.)
4. **The owner's ratio, as a symptom.** A rewrite lands at 10–40% of the reply it replaces, mandated shapes aside; over 40% means an idea failing the test is still in. No count, script or hook measures it. (Revised: the first decision was "no numeric cap"; the owner set the number on 2026-10-28, and four forced rewrites at 12–20% that still drew objections show the ratio cannot stand in for the test.)
5. **Kept exact, said short, named in the skill:** a word carrying state, tense, negation or number (đã/chưa/không); a failed check or an unverified claim as a few words on the claim itself; an exact command, path, error or version the owner needs to act, with any code or marker the owner did not name spelled out or dropped; and every shape another rule or skill mandates — the `agent.A3` decision block where A3 places it, a rule line quoted verbatim with its meaning lines (repo `CLAUDE.md` § Reporting a rule change), an `akiship` or audit report, a worker receipt — as that rule defines it. Always cut: passed checks, files touched, process, seat or run, scope or cost, restated file or message content, hypotheticals, unasked reasoning, self-assessment, harness preambles and recaps.
6. **Scope = chat replies.** Files keep `docs.B3`, comments `coding.B4`, commit messages `release`, worker briefs `agent.A5`.
7. **No core edit.** The generated Antigravity `agent` file measured 25,790 bytes on 2026-10-26 against the 24,000 cap, target ≤23,500 (`docs/plan/agy-rule-loader-epistemic-floor.md` F2, C3.3); a `/noyap` pointer in the `[FLUFF]` row waits for that subtraction pass.

## Goal chain

shorter replies → the owner re-orients in seconds, in a terminal, across many projects (`agent.A4`'s purpose) → fewer re-reads and misses → faster decisions. The tension: extreme compression pulls against losing nothing and against comfort (`ux.A1` cognitive load, `ux.A6` mental-model match: fragments cost more to parse than short sentences). Resolution: the per-idea test is the floor; Notes is the comfort valve — a fact the reader needs later is grouped so it can be skipped, never deleted, never interleaved.

## Facts · constraints · assumptions

| Kind | Item |
|---|---|
| Fact | `agent.A4` already carries the deletion test, conclusion-first and the `Q`/`T`/`N` codes; `[FLUFF]` exists. Replies stay long → the gap is compliance and intensity, the same shape as note task-1793073500445 (a rule present, a model not complying). |
| Fact | Harness prompts inject padding — "say in a line what you're about to do", "brief updates while you work", "close with a short recap" (quoted from this session's live Claude Code system prompt, 2026-10-28; not `agent.B7` rows, so not covered by the release-time re-verification). `agent.B7` ranks the corpus above harness text, so a skill may cut them. |
| Fact | `payload/GEMINI.md` § 9 "NO YAPPING AT ALL" is always on for Antigravity and forbids unsolicited explanations. Not a conflict: Notes hold facts the owner named as "cần biết", grouped and skippable, never explanations of what was done; a Note that explains is cut by the same test. |
| Fact | Skills deploy unmodified to six harnesses; each lists name + description at session start (`docs/ref/fact-agent-skills-standard.md`), so the description is resident and carries the routing signals; the body loads on invoke. Typing `/noyap` on Codex, Kiro, Grok and WorkBuddy is unverified. |
| Constraint | `pattern.A2` bar — new and in no rule: the slot order, the idea as unit, the never-compressed list, harness-preamble suppression, the excerpt rule for long output, the Vietnamese state-word rule, the sentence techniques. |
| Constraint | English-only content; keyword-first; one logical line per physical line; no script can claim `[FLUFF]` (`agent.§0`). |
| Fact (replaced the assumption "a slot shape decays slower than an adjective") | In three box sessions the reply after a `/noyap` rewrite was back at full length (one at 600 tokens 13 minutes later, answered "khiếp lại nói dài nữa rồi. /noyap"); a shape with no persistence decays within the session. |

Techbiz lens (`think.B4`) skipped: personal tooling.

## Thinking channel — the note's research question

A sorting pass needs the draft as tokens somewhere. In rewrite mode the draft is the previous reply, on screen. For a fresh answer the slot order is the filter while writing, and the per-idea test runs on the text about to be sent — in the thinking channel where one exists, otherwise as a re-read before sending. In neither case is a draft, a bin or a ratio printed, so the owner's concern — reasoning spilled into a reply meant to be short — is met by construction, on a model with hidden thinking, visible thinking, or none.

## Critique — what each round changed

- R2: "nothing pending → one line" deleted Evidence; the decision block, rule-change meaning lines, path glosses, passed-check names and Vietnamese state words had no protection; the unit was the sentence; session mode was invisible and ambiguous; `akilint` also claimed `[FLUFF]`.
- R4: the R2 fix deleted Notes instead; A4's closing line and the `[RULES]` receipt had no slot; a Notes cap contradicted "no cap"; the skill restated A4 (cut list, deletion test, A3 template) instead of pointing; "unsolicited suggestion" cited an `agent.A3` allowance that now lives in A4 as `N`; the fresh-answer test had no draft; GEMINI § 9 was unexamined; "rút gọn" alone routes file edits — the description now says "a reply".
- Steelman, a core line: resident without invocation. Rejected: `A4` exists and is not followed; the file is over cap.
- Steelman, a harness output style: removes the padding at the source on Claude Code, visibly. Rejected as the mechanism: one harness of six; still the owner's option for an always-on preference.
- Steelman, a measure-only Stop hook logging reply length: the compliance diagnosis says measure before adding text (note task-1793073500445). Deferred as `N` below; the skill is the ordered artifact.
- Inversion: a numeric cap, a heavy template, printing the bins, stripping receipts and codes, fragments, delta-only reporting (loses the state a context-switching reader needs — `A4`'s purpose). Each excluded by name.
- Pre-mortem: a failure demoted to Notes and shipped on → Decision 5.
- Second-order: README, akihelp, akilint and the uninstall lists name every skill (Sweep). A model may self-invoke on "dài dòng / ngắn thôi / no yapping"; the note's hypothesis that "no yapping" plus harness brevity makes models skip steps is not answered by the skill's `agent.B7` line — whether a skill invoked at that moment holds the steps is the measure `N` below exists for.

## Rejected

- A `[FLUFF]` card alone: post-hoc, carries no slot shape, cannot cut harness preambles.
- A detector script or any word count: `[FLUFF]` is judgment (`agent.§0`).
- Delta-only reporting, extending `akilint` (mechanical by contract): see Critique. A session mode and a numeric cap were rejected in R1–R4 and adopted in the Revision below, in the forms Decisions 2 and 4 now state.
- Keeping the slots and tightening the test a fourth time: a fourth guard on a path that admits every idea by construction (`pattern.A8`, `flow.C2`).
- A word counter, a Stop-hook measure or any script: the owner forbade new check steps, `[FLUFF]` is judgment, and rewrites that met the ratio with the wrong content show length is not the failure.
- Moving the whole procedure into `agent.A4` and deleting the skill: A4 is resident and is the rule most often delivered and broken (`docs/research/agent-painpoints-oct28.md` P01); the skill is the invoked intensifier.

## Sweep (`CLAUDE.md` § Change sweep)

`skills/noyap/SKILL.md` (new) · `skills/akilint/SKILL.md:3` (`[FLUFF]` on a reply → `noyap`, on a file → `docs.B3`) · `skills/akihelp/SKILL.md:34` (padded → `/noyap`; wrapped → `/akilint`) · `README.md` (skills table, entry points, layout, uninstall lists) · `docs/index.md` · `CHANGELOG.md` `[Unreleased]`. `install.mjs` syncs `skills/` by directory. `docs/arch/corpus-map.md` density row keeps `agent.A4` as root. `payload/GEMINI.md` § 9 unchanged.

## Verify

1. `scythe.py` clean on every touched file; `release_lint.py --latest .` exit 0.
2. Install into a scratch HOME: the skill lands in all six skills roots unmodified.
3. Canary, this session: `/noyap` on the report that closes this work; the owner judges whether an idea was lost — an opinion, the only check available before use.

Reopen if: a failed check or an unverified claim is cut by a reply under the skill (tighten Decision 5); a later reply under persistence over-cuts a reply the owner wanted in full (narrow Decision 2's "until the owner asks for detail"); the agy plan's Phase B lands (add the `[FLUFF]` pointer). The Stop-hook length measure once held here as an `N` is withdrawn: the owner forbade new check steps, and the relapse it was meant to detect is already observed.

## Revision 2026-10-28 — transcript review

Trigger: the owner measured the first replies under the skill as longer than before and asked for 10%, at most 40%, of the replaced text, with obvious and unimportant ideas gone. An Opus 5.5 `aki-challenger` seat, read-only, judged the skill against 27 replies from 12 box sessions and the painpoint survey (`docs/research/agent-painpoints-oct28.md`), then ran self-run `/akithink` to convergence; the lead re-ran the critique on the exhibit and decided.
- Measured: the three `/noyap` rewrites on this box landed at 72%, 87% and 39% (assistant tokens), median 72%, under the text before the same-day patch; the patch applied by hand to the sample still left 20–60%, and the ideas the owner rejected (redundant `Q`, doable items listed, minor `N`, unglossed codes, caveat paragraphs, restated file content) survived under lines that licensed each one.
- Root cause: the skill was default-allow. Slots ran first and housed every idea; the test ran last on ideas already placed; its first half ("would the reader believe anything different") is passed by every true new fact. The same-day patch stacked three more guards on that path (`pattern.A8`).
- Change: the objective ("loses no idea") became "the answer, plus what the owner must do or heed"; slots became a whitelist with a do-or-decide test; a leftovers rule settles items instead of listing them; the shape persists after invocation; the ratio holds for rewrites only, mandated shapes aside. Decisions 2–5, the Assumption row, Rejected and the Reopen line above record the new state; the earlier wording stays in `CHANGELOG.md` `[Unreleased]`.
- Root rule aligned the same day, on the owner's instruction to settle leftovers without asking: `agent.A4`'s deletion test now asks "would the reader do or decide anything differently with it?" and a `T` item lists only a call the owner might overrule. Reopen if the owner corrects a call that went unsaid as minor.
