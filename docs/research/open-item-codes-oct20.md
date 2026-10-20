# Open-item codes — root patterns across Claude Code and agy transcripts

## Start time
2026-10-20, after `agent.A4` `Q`/`N`/`H` was applied (uncommitted, `question-vs-action-oct20.md`) and the owner asked to settle the patterns, the letters and their psychology before 3.8.0 freezes them: "bộ akidevrule một khi release là sẽ cần nó ổn định, hạn chế tối đa sự thay đổi".

## Initial purpose
Reduce every open-item shape agents produced on this machine, on Claude Code and on the agy CLI, to the fewest root patterns, and choose letters that hold once released. The owner's starting hints, not a fixed list:
- a decision only he makes, with what it solves, the root cause, the options, the recommendation and why;
- work the agent can carry out itself that is neither dangerous nor huge (a restructure, a large change), reported so he grasps at a glance what and why, mostly accepted, still open to his adjustment — under a letter other than `N`;
- things to keep in mind, with nothing to do.

Context: Claude Code with Opus 5.5 and Sonnet 5.5; agy CLI with Gemini; `agent.A3` (act only on an order) applied in the same change.

## Strategy
- Extraction in-shell, never raw transcripts in context: a script walks both stores and keeps only coded lines in assistant replies, the owner message right after each block, and owner messages matched by theme.
- Classification by keyword (estimated), checked against stratified samples read by hand: six items per letter, 70 owner follow-ups, 30 unmatched items.
- The candidate scheme attacked by clean-context `aki-challenger` passes (Opus, high effort) before it was proposed.

## Checklist
1. ✅ Stores located and sized.
2. ✅ Coded items and owner follow-ups extracted from both hosts.
3. ✅ Items classified by kind; owner messages by theme.
4. ✅ Samples read; root patterns derived.
5. ✅ Letters chosen against collisions and readability.
6. ✅ First draft (`Q`/`G`/`N`) challenged and replaced; second draft (`Q`/`T`/`N`) approved by the owner and applied.

## Result

### Sources
| Host | Store | Format | Sessions | Span | Replies | Blocks with codes | Coded items |
|---|---|---|---|---|---|---|---|
| Claude Code | `~/.claude/projects/*/*.jsonl`, 29 projects, 1.0 GB | JSONL, `type: assistant`/`user`; sidechains, meta and hook text excluded | 254 | 2026-08-28 → 10-20 | 8,095 | 283 | 1,159 |
| agy CLI | `~/.gemini/antigravity-cli/conversations/*.db`, 1.4 GB | SQLite `steps`, `step_type` 14 user / 15 response, text in protobuf blobs | 500 | 2026-09-17 → 10-20 | 37,961 | 15 | 101 |

A coded line is a bullet, numbered line or table row opening with one capital and one or two digits (`- **V3:**`, `| D1 |`). agy coded almost nothing: Gemini rarely numbers what it leaves.

### Letters in use
| Letter | Items | Meanings found |
|---|---|---|
| T | 291 | doable fix left open, release step, doc drift, AIObox window handle (`T8`) |
| V | 267 | production-only check, device test, a check never run, already closed |
| D | 191 | decision, keep-or-revert, plain task |
| S | 151 | `release.B7` gate receipts (`S5 FIXED`), design options (`S2-b`), tasks |
| F | 81 | findings, deferred features |
| P | 75 | AIObox window handles (`P13·W14`), proposals, rejected items |
| R | 30 | risks, evidence rows, release steps (`R2 — push main`) |
| Q | 29 | questions, tasks, release steps (`Q5–Q8: push, notarize`) |
| K, E, O, B, M, C, N, W, others | 145 | variants, entries, findings, gate steps (`B10`, `B11`), notes |

One letter carried up to four meanings, often inside one project.

### Item kinds (keyword classification, estimated)
| Kind | Items | Share |
|---|---|---|
| unmatched — sampled: doable work left open (doc stamp drift, version pin mismatch, missing doc line), keep-or-revert calls, option labels | 364 | 29% |
| finding, option or step ID in a table, not an open item | 203 | 16% |
| closed or fixed, reported under its code | 175 | 14% |
| decision for the owner | 135 | 11% |
| release or commit step listed as an item | 133 | 11% |
| waiting on CI, production, a date | 87 | 7% |
| unverified | 64 | 5% |
| caution ("skipping is fine", "low") | 48 | 4% |
| proposal outside the order | 27 | 2% |
| the owner's hands (OTP, device, real app) | 24 | 2% |

### Owner reactions (3,905 messages, regex, estimated)
| Theme | Messages | Examples |
|---|---|---|
| done yet / why left / what remains | 274 | "còn rất nhiều vấn đề mà nhỉ? cái nào nhỏ tồn cứ phải xử lý hết đi chứ" · "sao không theo /akirule mà xử lý lần lượt hết đi?" |
| summarize, shorter | 222 | "nói dưới 30 chữ: phiên này đang làm gì và cần làm gì vậy?" · "no yapping. tóm lại còn cái gì ?" |
| replies by code or number | ~100 | "vậy làm cái 1 2 3 như đề xuất đi" · "A. … B. chưa làm ngay" · lowercase "t1", "v4" |
| where is it recorded, will the next session see it | 60 | "v4 với p4 ghi ở đâu vậy?" · "tôi có thể đóng phiên này và mở phiên khác bảo /akiopen là được?" |
| what is it, does it matter | 54 | "V6 là gì, có quan trọng không" |
| stop asking | 37 | "cấm hỏi thừa" · "theo /akirule kill-test và chống phiền chống overthinking, làm ơn xử lý mọi thứ đi" |
| false completion | sampled | "còn bước /prx-report chưa làm … thế mà cũng ship??? thế mà cũng ghi release????" |

### Reading
1. **The owner sorts by what an item asks of him, not by the kind of work.** Every reaction asks one of: what needs me, what are you doing, what can I forget. A kind letter (`V` unverified, `T` task) makes him read the item to learn which; the 54 "what is it / does it matter" messages are that cost.
2. **What his silence does partitions every item.** Silence blocks (nothing moves until he answers), lets the work proceed (the agent goes ahead, he may adjust), or changes nothing. One consequence per item gives one letter per item, and a new kind of work needs no fourth — the stability asked for. Every kind found maps once:

   | Kind | Silence | Code |
   |---|---|---|
   | decision on `A3`'s escalation list; fact only the owner holds (`B5` unclassified work); OTP or device step a run waits on | blocks | `Q` |
   | a call the agent makes within the order: restructure, approach, keep-or-revert, the `A3` decision block | proceeds | `T` |
   | waiting on CI, a date, a deploy, another machine; production- or device-only check after the work; caution; idea outside the order | nothing | `N` |
   | doable within the order; verifiable here | — | done now, not coded |
   | release, the workflow's next step | nothing | one closing line, not coded |
   | finding, option, step inside an analysis | — | `1`, `2` / `a`, `b` |
   | closed item | — | its own code, marked closed |
3. **The top frustration is doable work left listed** (274 messages). Sorting "doable → done now" before any code is the load-bearing rule; the letters only shape what is left.
4. **Reading order is cost order.** A `Q` costs an interrupt, a `T` a review, an `N` only memory. Listed `Q` → `T` → `N`, the owner stops reading once no `Q` is left, which answers the 222 "shorter" messages without cutting content.
5. **The owner's second kind is announce-then-proceed inside work he ordered.** "bạn sẽ làm gì, vì sao … hầu hết tôi chấp nhận, nhưng vẫn có thể chọn để tinh chỉnh" is `A3`'s decision block, which carried no code to point at. Outside the order the same shape acts unordered (`A3`), so an idea outside the order is an `N` that runs only on an order naming its code and costs nothing ignored. On a communication turn there is no order, so there is no `T`: the agent's intended approach is the answer, or an `N`.
6. **The owner's hands block only when work waits on them.** An OTP inside a publish blocks (`Q`); a device test after shipped work does not — skipping it leaves a known risk (`N`). `H` grouped both with CI and dates.
7. **A release is never an item.** 11% of items listed a release or commit step; the owner: "phải xử lý các tồn mới đề xuất phát hành chứ". It is one closing line once no `Q` is open; an `N` does not hold it back, because ignoring an `N` costs nothing.
8. **Persistence is the hold's problem, not the letter's.** The 60 "where is it recorded" messages concern items that outlive the session. Codes stay per conversation; a hold that outlives it goes into the active plan's `- [ ]` (a new `docs/plan/` doc when none exists), which `/akiopen` scans. The plan line is the durable form; the code is not carried across sessions.
9. **Codes collide with everything else that is enumerated.** Gate steps `S0`–`S8`, bare rule addresses (`B3`, `A4`), option labels `A.`/`B.`, `D1` the Cloudflare database, AIObox `P`/`W`/`T` handles, finding IDs, `G1`–`G3` goals in `docs/plan/rtk-accuracy-first.md`, `Q1` research questions in older docs. Open-item letters are reserved in a report and everything else there is numbered or lettered lowercase; a report citing a doc's own ID names the doc with it.
10. **The owner answers in batches and in lowercase.** "làm cái 1 2 3", "t1", "v4": a code must survive lowercase and a batch reply; `Q`, `T`, `N` stay distinct in lowercase (`q`, `t`, `n`), unlike `I`/`l`/`1`.
11. **The letter must not read as an order.** A code the owner quotes in a question ("G1 là gì?") must not carry a run verb; `Q`/`T`/`N` name a state, not an action, and an `N` runs only on an order naming it (`A3`: an action verb aimed at the agent).

### Letter choice
Criteria, in order: names what silence does; reads in both languages the owner uses; distinct in uppercase, lowercase and a terminal font; no live meaning in his reports or this corpus.

| Letter | English | Vietnamese | Why it holds |
|---|---|---|---|
| `Q` | question | quyết (decide) | the only item that waits on him; already his own choice for decisions |
| `T` | taking it | tự làm (doing it myself) | the most frequent past letter (291, "task"), narrowed to the agent's own work; `T8` handles appear only inside `P·W·T` triples |
| `N` | note | nhớ (keep in mind) | his third kind "chỉ lưu ý"; `N` meant "next" in the first applied set, inside the same unreleased version |

| Avoided | Reason |
|---|---|
| `A`–`D` | bare rule addresses (`A3`, `B3`), `A.`/`B.` option labels, `D1` database |
| `G` | reads as "go", so a quoted code reads as a run order; `G1`–`G3` already label goals in an active plan |
| `S` | `release.B7` gate steps |
| `M` | Apple `M1`/`M2` |
| `P`, `W` | window handles |
| `V`, `F`, `K`, `E`, `R` | ad-hoc finding and evidence IDs |
| `H` | split: hands a run waits on → `Q`, a wait → `N` |
| `I`, `L` | read as `1`/`l` |

`Q1` also means a calendar quarter in business talk; every item carries its plain sentence, so the residue is accepted.

### Edge cases
- **Several turns of ordered work:** a `T` is stated before the work it announces, so the owner can adjust before it lands; a code keeps its number to the end of the conversation.
- **Subagent and worker reports:** the caller stands in for the owner; the same three letters apply.
- **A `T` the owner adjusts:** the adjustment is an order; the `T` is reported closed or amended under its own code.
- **An `N` idea the owner orders:** it becomes ordered work; nothing else in its text authorizes it.
- **The workflow's next step left undone at closing:** it is named in the closing line, never claimed done (`agent.B2`).
- **Vietnamese in a public rule file:** the glosses beside the letters fall outside the narrow cases the repo's `CLAUDE.md` content-language list names; the owner approved the text with them, so the list, not the rule, carries the gap.

### Challenger findings adopted
- Round 1, on `Q`/`G`/`N`: `G` reversed the owner's default (an idea outside the order dropped on silence while he described announce-then-proceed) and held two opposite states under one letter; the bare code `G1` was a run token, so "G1 là gì?" carried an order; `G1`–`G3` and `Q1` collide in this repo's own docs; `Q` lacked the root cause and the decision asked; the partition was asserted, not tested (now § Reading 2); the closing line waited on a silence that costs nothing; the plan-writing mechanics belong to the hold, not to another letter.
- Round 1 points not adopted: cutting the coded decision block (it is the owner's second kind, § Reading 5); persistent cross-session IDs (the plan line is the durable form, § Reading 8).

### Verification
Counts come from the extraction over both stores on 2026-10-20. Kinds and themes are regex classifications, estimated, checked against the stratified samples. agy text is recovered as the longest printable segment of each blob, so agy counts are a floor. The partition is tested against every kind found, not against future kinds; the reopen trigger is the live test.

### Corroborating links
[question-vs-action-oct20.md](question-vs-action-oct20.md) § Open items (14-day Claude sample, first letter set) · [../plan/done/a3-order-root.md](../plan/done/a3-order-root.md) (the change that first applied `Q`/`N`/`H`).

## Decision
**Action — approved by the owner 2026-10-20 and applied** (`payload/RULE-agent-behavior.md` `A4`, CHANGELOG 3.8.0):
````
- **An open item is only what this turn cannot finish, coded by what the owner's silence does to it.** Sort every leftover before reporting: doable within the order → done now, never listed; a release or the workflow's next step → never an item, one closing line once no `Q` is open. The rest takes one letter plus a per-conversation number, listed in this order, never renumbered or reused; a closed item is reported closed under its own code; findings, options and steps inside an analysis are numbered (`1`, `2`) or lettered (`a`, `b`), never with these:
  - `Q` (question · quyết) — silence blocks: the owner must answer before it moves (`A3`'s escalation list, a fact only they hold, an act only their hands can do mid-run). The problem and its root cause, the decision asked, then `A3`'s options and recommendation.
  - `T` (taking it · tự làm) — silence proceeds: a call the agent makes within the order, stated before or as it is carried out — what, why, the alternative rejected; the owner may adjust.
  - `N` (note · nhớ) — silence changes nothing: a hold (what closes it and when; one that outlives the session goes into the active plan's `- [ ]`, none: a new `docs/plan/` doc), a caution with its weight, or an idea outside the order, run only on an order naming its code.
````
Updated together: `agent.A3` (the decision block is coded `T`), `coding.B3` (runtime-unverified items and the hand-off ledger are `N`, `Q` when a run waits on one), `skills/akiship/SKILL.md` (unverified leftovers are `N`).

**Rejected**
- `Q`/`N`/`H` as first applied: kind-based; `H` mixed an act a run waits on with a passive wait; the decision block had no code.
- `Q`/`G`/`N` (first draft of this doc): § Challenger findings adopted.
- Announce-then-proceed outside the order: acts unordered (`A3`).
- A fourth letter for unverified: verifiable here → done; production- or device-only → `N`; a run waiting on it → `Q`.
- A letter for done work: closed items keep their own code.
- Persistent cross-session codes: the plan line is the durable form.

**Reopen trigger** — the owner asks "what is X1" or "is it important" about a `Q`/`T`/`N` item, an item's silence has two consequences, or a report needs an item none of the three fits.

**Cross-references** — `payload/RULE-agent-behavior.md` (`A3`, `A4`), `payload/RULE-coding.md` (`B3`), `skills/akiship/SKILL.md`, `CLAUDE.md` § Content language, [question-vs-action-oct20.md](question-vs-action-oct20.md).
