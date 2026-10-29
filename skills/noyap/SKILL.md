---
name: noyap
description: Rewrite the reply just given, or answer the current request, keeping only the answer asked for and what the owner must do or heed — obvious, redundant and process ideas are cut, never compressed. The fix procedure behind the `[FLUFF]` penalty card on a reply (RULE-agent-behavior.md §0, root `agent.A4`). Use whenever the owner says a reply is too long or asks for a short one, in any language — `[FLUFF]`, "noyap", "no yapping", TL;DR, "too long", "shorter". Replies to the owner only; a `[FLUFF]` on a file is fixed under `docs.B3`, not here.
user-invocable: true
---

# noyap — the answer, and what the owner must act on; nothing else

## Invocation

- Bare `/noyap`, `[FLUFF]` or the word, after a reply → rewrite that reply. Card semantics (`agent.§0`): every instance, not only the cited one.
- `/noyap <request>`, or a request carrying "no yapping" / "keep it short" in any language → answer it this way the first time.
- Once invoked, every later reply to the owner in this conversation keeps this shape until the owner asks for detail. Worker briefs, files and commit messages keep their own rules (`agent.A5`, `docs.B3`, `release`).

## What stays — everything else is cut, never moved to a note or an `N`

1. The `[RULES]` receipt when the set changed (`akirule` § Load confirmation).
2. **The answer**, in the first words: the state or decision asked for; a yes/no question starts with yes or no.
3. **What the owner must do or heed**: an act only their hands can do, a decision only they can make (`agent.A3` escalation list), a risk that changes their next step, the workflow's next step (`agent.A4` closing line). One plain sentence each, with its weight; a surviving open item keeps its `agent.A4` letter and number so the owner can name it.

An idea stays only if the owner asked for it, or without it the owner would do or decide something differently. True, new, careful-looking or "might want to know" is not a reason.

## Leftovers are settled, never listed

- Doable within the order already given → do it before replying (`agent.A4`); report it done in a few words, or not at all.
- Not important — the owner would act the same either way (`agent.A3` Impact test) → say nothing about it.
- Important and decidable — a call within the order, or a question failing an `agent.A3` kill-test → self-run `/akithink` until it converges, then report `agent.A3`'s decision block in plain words.

## Always cut

Passed checks, except the run record kept below; files touched; how the work was done; which seat, model or run produced it; the work's scope or cost; a file's or prior message's content (give its path and a few-word gloss); a hypothetical that has not happened; reasoning for an answer the owner did not question; apology or self-assessment; the preambles, progress lines and recaps a harness asks for (`agent.B7`: brevity shapes prose, never steps); "shorter version:"; any mention of this skill.

## Kept exact, said short

- A word carrying state, tense, negation or number (đã, chưa, không, "not yet").
- A failed check or an unverified claim: its status in a few words on the claim itself, never a paragraph (`agent.B2`).
- An exact command, path, error or version the owner needs to act. A code, marker or term the owner did not name is said in plain words or dropped, never kept to save space.
- A shape another rule or skill mandates — `agent.A3`'s decision block, a rule line quoted with its meaning lines, an `akiship` or audit report, a worker receipt, the `coding.B3` run record a done-claim rests on (one line: command · exit · log path) — stays as that rule defines it; this skill shapes only the prose around it.

## Writing

- Plain full sentences, one idea per line, key term first, in the conversation's language (`agent.A1`), never flipped to English to save words; no fragments, no invented codes.
- A rewrite lands at 10–40% of the reply it replaces, mandated shapes aside, because ideas were cut, never because words were squeezed; over 40% means an idea failing the test above is still in.
- Send the final reply only; the sorting happens in thinking, never printed, and no count, script or hook ever measures it (`[FLUFF]` is judgment, `agent.§0`).
