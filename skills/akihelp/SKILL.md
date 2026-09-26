---
name: akihelp
description: Introduce the whole Aki Claude Code system — installed skills, the akirule rule router (imported, routes by meaning), the deep-think passive/active split, and a painpoint-to-prompt table for the situations people actually hit — by reading live installed state, never a hardcoded inventory. Use when the user asks what Aki tools/rules/skills are available, how the system works, or what to say for a recurring problem they keep running into.
---

# akihelp — live introduction to the Aki system

Invoke with `/akihelp`, or whenever the user asks, in any wording, what this setup offers or how to use it. Goal: give the user a clear, accurate picture of the whole Aki Claude Code system so they can fully exploit it.

**This skill must never go stale.** Do not hardcode a skill/rule inventory in this file — read live state every time it runs, so the output is always correct even after `install.sh` adds, renames, or removes something.

## Steps

1. Read `~/.aki/akidevrule/index.md` — the file manifest with tiers and purposes.
2. List `~/.claude/skills/` and read the frontmatter (`name` + `description`) of each skill whose directory is prefixed `aki` — these are the installed Aki skills.
3. List `~/.claude/agents/` and read the frontmatter (`name` / `description` / `tools` / `model`) of each file prefixed `aki-` — these are the installed Aki agent definitions. The directory is shared with the user's own agents, so introduce only the `aki-` ones. If the directory does not exist, that layer is simply not installed: drop the section rather than describing it.
4. Render a compact overview with these sections:

   - **Skills (active, user-invoked)** — one row per aki-skill: its `/name`, its one-line description (from frontmatter), and when to reach for it.
   - **Agent definitions (who the work gets handed to)** — one row per installed `aki-` agent from step 3: what it is for, and the property that is mechanical rather than promised (its `tools:` list, which is what makes a read-only agent actually read-only, and its `model:`, so a tier is never improvised). Say the thing people get wrong: this is a catalog, not a roster — an agent is spawned because a specific requirement needs it, never because it exists.
   - **Passive system (akirule)** — explain the load mechanisms: core rules and the router always loaded (`@`-imported by `CLAUDE.md`); contextual/analytical rules read when the task's domain matches a route — by meaning, never keywords; full load when the owner asks for the whole corpus. `akirule` is hidden from the `/` menu by design (`user-invocable: false`) — it is imported, not a command.
   - **One brain, three modes** — `METHOD-deep-think.md` is read passively by the router inside normal tasks (brief, inline, at most one clarifying question), as a triggered self-run when an `agent.A3` trigger holds or `/akithink` self-runs on a genuine decision (non-interactive, depth scaled to difficulty, ends in decide-and-report or escalation), and interactively by `/akithink` when the owner asks for a session. Short version of the comparison, not the full METHOD text.
   - **Editing rules** — this whole system is generated from a source repo (akidevrule); the installed copies under `~/.aki/akidevrule` and `~/.claude` are deployed output, never edited directly. Changes go through the source repo + `install.sh`. Note for context: the same skill corpus (not the rule corpus) is also synced by `install.sh` to Antigravity/Gemini and to Codex, Kiro, and Grok CLIs on this machine if present — this skill itself only introduces the Claude Code side.

5. Render a **painpoint → what to say** table. This is the section most people actually need: a capability list tells them what exists, this tells them which words to type when a specific problem is in front of them. Build every row from what steps 1–3 actually returned, and **drop any row whose skill or rule file did not appear there** — a row pointing at something uninstalled is worse than a missing row.

   | The situation they are actually in | What to say | What it reaches |
   |---|---|---|
   | Styles are sprawling — duplicated classes, hardcoded colors, CSS piling up in component `<style>` blocks | *"Audit CSS this repo per `ui.C`. Read-only, produce a plan."* then a separate *"Clean per the plan, one pattern per pass."* | `RULE-ui-pattern.md` §C — the inversion check runs first and decides whether the rest is even worth doing |
   | Docs describe something the code no longer does | *"Drift audit the docs against the code."* | `RULE-docs.md` §C — severity split across wrong / stale / incomplete / cosmetic |
   | Long half-finished working tree, unclear what is safe to commit | `/akigitcommit` | Triages finished vs mid-edit vs abandoned vs accidental **before** grouping; stages by explicit path, never `git add -A` |
   | Work is finished but not pushed, and they want to know if it is genuinely shippable | *"Is this ready to ship?"* | `RULE-release.md` B7 pre-ship gate — a pass/fail check, not a document |
   | A decision is big, hard to reverse, or the real goal is still fuzzy | `/akithink` | Full 5-phase session: restate → goal excavation → first principles → mandatory critique → decision record. Small reversible calls should just be decided instead |
   | Replies are padded, or lines are hard-wrapped mid-sentence | Name the penalty card: *"`[FLUFF]`"* / *"`[WRAP]`"* / *"`[YAP]`"*, or run `/akilint` | `RULE-agent-behavior.md` §0. `/akilint` runs the deterministic detector for the two mechanical cards; `[FLUFF]` stays human judgment and no script claims it |
   | One task genuinely needs several kinds of judgment at once (architecture *and* UX *and* market) | `/akiflow` | Lead-coordinated council with `aki-challenger`'s subtraction pass ("what can be cut?") and a mechanical closure gate. Overkill for ordinary work — say so plainly rather than routing everything here |
   | Work is large and parallel but the answer is already knowable — a sweep, a migration, a fan-out across many files | `/akiflow`, as a **dispatch** rather than a council | Same anchor, rule receipts, durable record and closure gate; lanes with an exclusive `writes:` file set replace items with adversaries, and `--convene` refuses two lanes claiming one path. Wanting a challenger mid-run means it was a council question after all |
   | The same guard, check, or fallback keeps reappearing around one path | *"Why does this flow need so many guards?"* | `METHOD-audit-flow.md` + `pattern.A8` — reshape the flow instead of stacking another guard on it |
   | A guard, limit, or quota is being added against abuse nobody has measured — or a client-side check is about to be treated as enforcement | *"How many people can actually reach this, and what does that earn in protection?"* | `METHOD-proportionality.md` — reach, capability, motive, blast radius before the verdict; irreversible damage outranks low frequency, and anything the browser computes the browser can change |
   | The repo has accumulated, and the ask is to cut it back as far as it can go | *"Subtraction audit this repo — read-only, report plus a plan."* | `METHOD-audit-subtraction.md` — "as minimal as possible" is not a stopping rule, so it terminates on two consecutive rounds with no new findings, with Chesterton's Fence before any certain removal |
   | The interface works but feels confusing or people do not complete the flow | *"Review the UX of this screen."* | `METHOD-ux-psych.md` — a behavioral lens, distinct from `RULE-ui-pattern.md` which owns visual structure |
   | A pricing, positioning, or audience call | *"Who is this for and what should it cost?"* | `RULE-biz.md` — plus `docs/biz/` as the project's source of truth |
   | An analysis in chat is too dense to read as text | `/akihtmlreport` | Renders the analysis already in the conversation as one self-contained HTML file — it visualizes, it does not re-analyze |
   | Unsure whether a rule loaded at all | Read the `[RULES]` line, or ask to load the whole corpus | Every response carries a `[RULES]` receipt naming every rule file in context, so "the rule never arrived" (absent from the line) is visibly different from "the rule arrived and was ignored" — the two have opposite fixes. A full-load request reads everything |

6. Close with the one caveat that changes how people use all of the above: **the router is guaranteed, a routed file is not** — `index.md`, the three core rule files and the router are `@`-imported through `CLAUDE.md`, but a contextual file enters context only when the model `Read`s it on a route match. When something must be deterministic, name the file in the prompt (*"Read `~/.aki/akidevrule/RULE-ui-pattern.md`, then …"*) instead of trusting the signal to fire.

7. Keep the output scannable: compact tables or short bulleted sections, not an essay. Respond in the user's language, and translate the example prompts into that language rather than pasting them verbatim in English.
