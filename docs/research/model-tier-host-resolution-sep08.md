# Model tiers across hosts: a tier is a word, the host supplies the model

**Start time:** 2026-09-08.

**Initial purpose:** the owner's pinned note (2026-08-22): the corpus hardcodes Claude model names, so on Cursor (and agy, Codex, Kiro) `/akiflow` calls expensive Claude models instead of the host's own cheap ones (Composer, Grok); the design intent was "which tier", never "which model". Constraint set by the owner: research thoroughly and avoid trading away Claude Code's behavior, because Claude Code is the primary host, then agy, Codex, and the rest. Context: corpus at 2.7.0 plus the unreleased batch; skills deploy to five hosts; agent definitions deploy to `~/.claude/agents/` only.

**Strategy:** inventory every literal model token in the deployed surfaces (`skills/`, `claude/`, `payload/`, `README.md`, `docs/arch/`) with a retrieval worker; collect each host's model-selection mechanism from vendor docs with a web worker; verify the two facts the design turns on (where Cursor reads skills and agents from; whether `SKILL.md` frontmatter may carry `model`) directly against vendor pages; then design the smallest change that removes the cross-host leak without touching the Claude Code row.

**Checklist:**
1. Inventory: 50 matches in 13 files. Classified: `claude/agents/*.md` frontmatter (5, Claude-only syntax); literal lane commands in `harness-facts.md` and `aki-hands.md` (per-lane facts, each already host-qualified); `agent.A5`'s discovery-lane example (already phrased as "the current default wide-context tier, on Antigravity that is …"); and **three lines in `skills/akiflow/SKILL.md`** (52, 75, 112) that name `sonnet`/`haiku` as seat tiers on a surface every host reads.
2. Vendor mechanisms (web worker, 2026-09-08): Claude Code agent frontmatter `model: sonnet|haiku|opus|inherit|<id>`; Cursor `.cursor/agents/*.md` `model: inherit|<id>[effort=…]`, headless `agent -p --model <id>`; agy `--model <slug>` with effort in the slug; Codex `config.toml [agents] default_subagent_model`, `codex exec -c model=… -c model_reasoning_effort=…`; Kiro `--model` with `--list-models` multipliers; Grok mostly unconfirmed.
3. Direct verification (WebFetch, cursor.com/docs/skills and /docs/subagents): Cursor loads skills from `.cursor/skills/`, `.agents/skills/`, `~/.cursor/skills/`, `~/.agents/skills/` **and, for compatibility, `~/.claude/skills/`, `~/.codex/skills/`**; subagents from `.cursor/agents/`, `.claude/agents/`, `.codex/agents/` and their `~/` forms. `model` accepts `inherit` or a specific id (`composer-2`, `gpt-5.6-sol`), not `auto`, not bare `composer`. SKILL.md frontmatter fields honored: `name`, `description`, `paths`, `disable-model-invocation`, `icon`, `color`, `metadata` — no `model`.
4. `model` in SKILL.md frontmatter is a Claude Code extension rejected by the open-standard validator (github.com/anthropics/claude-code/issues/25380).
5. Critique pass, below.

## Result

**Finding 1 — Cursor support already exists by construction.** akidevrule installs to `~/.claude/skills/` and `~/.agents/skills/` (Codex target) and `~/.claude/agents/`; Cursor reads all three. No installer change is needed for Cursor to see every skill and every `aki-*` agent. The note's "CURSOR support" half is closed by this fact, not by new code.

**Finding 2 — the same fact is the cause of the symptom.** Cursor reads `~/.claude/agents/aki-hands.md` and finds `model: haiku`. Cursor's accepted values are `inherit` or a Cursor model id; `haiku` is neither. How Cursor treats it is not documented (UNCONFIRMED; plausible outcomes are fallback to `inherit`, or resolution to a Claude Haiku API-pool model). Either way the roster text `(sonnet)`/`(haiku)` in `SKILL.md` told a Cursor lead to spawn Claude-named seats, and Cursor does have Claude models in its API pool, so the expensive call is the expected outcome of the text as written.

**Finding 3 — the leak is on one surface only.** `harness-facts.md` lane commands are per-host literals and correct where they stand; `agent.A5` names a tier and gives the agy slug as the Antigravity instance; `claude/agents/*.md` frontmatter is Claude-only syntax in a file that was Claude-only until Cursor started reading it. The shared, host-neutral surface that names Claude models is `skills/akiflow/SKILL.md` lines 52, 75, 112.

**Finding 4 — designs, critiqued (`think.B3`).**

| Design | Steelman | Attack | Verdict |
|---|---|---|---|
| A. `model: inherit` everywhere | one value every host accepts | Claude Code loses the cheap retrieval tier: `aki-hands` would run on the lead's top model, the ~935k-token failure `harness-facts.md` § Subagents records | rejected — trades the primary host |
| B. Per-host rendered agent copies (`~/.cursor/agents/aki-*.md` with Cursor ids) | native ids per host | Cursor also reads `~/.claude/agents/`; precedence between two same-named definitions is undocumented; Cursor ids drift monthly (`composer-2` → `composer-2.5`) so the installer would ship rot; `agent.B3` shared-config change with no measurement | rejected for now — reopen if design C measures badly |
| C. Tier vocabulary + host-resolution table, frontmatter untouched | shared surfaces say `top`/`mid`/`cheap`; one table (SSOT) maps tier → model + mechanism per host; Claude row stays in frontmatter; other hosts declare the model at spawn from their row | a Cursor lead must read the table; an unresolvable `haiku` in frontmatter may still misbehave on Cursor before the lead's explicit spawn value applies | **adopted** — smallest change, zero Claude Code cost, reopen trigger stated |

**Inversion:** to guarantee the leak returns, let a future edit write a model alias into a SKILL.md example "for concreteness". Guard: the rule sentence in `SKILL.md` Step 2 and the table's preamble both forbid it by name.

**Pre-mortem:** six months on, Cursor changed how it resolves unknown `model` values and `aki-hands` silently runs on the session model in Cursor. The reopen trigger in the table row catches it only if someone runs the measurement; `harness-facts.md`'s dating convention makes the row visibly stale.

**Verification:** facts 3 and 4 are vendor-documented (URLs in `harness-facts.md` § Sources); the inventory is reproducible by the grep in the checklist; the Cursor handling of a Claude alias is **unverified** and is written as such in the table.

**Corroborating links:** `skills/akiflow/references/harness-facts.md` § Model tiers › Host resolution · `docs/research/headless-cli-workers-aug1.md` (the per-host cost measurements the tiers rest on) · `claude/agents/aki-hands.md` § Substrates · `payload/RULE-agent-behavior.md` A5.

## Decision

**Action:** `skills/akiflow/references/harness-facts.md` gains § Host resolution (tier → model per host, mechanism, status); `skills/akiflow/SKILL.md` lines 52/75 use tier words and Step 2's tier paragraph states the resolution rule; `claude/agents/*.md` frontmatter unchanged by design. Execution: `docs/plan/done/research-mutability-model-tiers.md`.

**Follow-up research:** one measured Cursor run spawning `aki-hands` (what model actually served it, from Cursor's usage view), which settles the UNCONFIRMED cell and decides whether design B is ever needed.

**Cross-references:** `README.md` agent-roster table (unchanged, describes Claude lanes); `skills/akihelp/SKILL.md` (reads `model:` from installed agents at runtime — still correct, it reports the Claude row).
