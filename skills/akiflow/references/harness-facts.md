# akiflow — harness facts and cost model

The skill's rules are consequences of these facts. If a fact changes, the rule it supports must be revisited rather than patched. Each entry is marked:

- **[doc]** — stated in Anthropic's (or Antigravity's) published documentation, linked at the bottom.
- **[obs]** — observed runtime behaviour of the tooling (Claude Code or Antigravity/agy), not found in published docs. Treat as true-until-contradicted, and re-verify before relying on a detail.
- **[owner]** — supplied by the owner from a machine this repo has never run on. Not verified here and not verifiable here. Weakest tier: never let a rule depend on one without a verification step attached.

Every entry carries the date it was checked, because all of it is version-bound and expected to rot.

## Worker invocation quick-facts

The lookup table: literal command, read-only mechanism, and the one silent failure each lane hides. Every section below this one is the *why* — a caller assigning a lane needs none of it.

**Cross-file lock.** Sections in this file are addressed **by name** from `claude/agents/aki-hands.md` (§ Substrates) and `skills/akiflow/SKILL.md` (the closing pointer under § Harness notes). Renaming or removing a section means updating both in the same change; a stale section name reads as a missing fact and sends the reader back to probing.

| Lane | Literal command | Read-only by | Silent failure to check |
|---|---|---|---|
| **agy flash** — discovery default | `agy --model gemini-3.7-flash-high --mode plan --output-format json -p "<prompt>"` | `--mode plan` (mechanism, not wording) | a denied call still returns `status: "SUCCESS"` with empty `response`; `-p` takes the next token as its value, so any flag written after it is sent as prompt text |
| **kiro-cli** | `kiro-cli chat --no-interactive --trust-tools=fs_read --model claude-sonnet-4.5 --effort high "<prompt>"` | `--trust-tools=fs_read` | none recorded; `--effort` is operative on every Kiro model, unlike `claude` + haiku |
| **claude via proxy gateway** | `CLAUDE_CONFIG_DIR=~/.claude-9rt claude -p --tools "Read,Grep" --model <alias> --effort low "<prompt>"` | `--tools` allowlist | `cl-9rt` is a shell alias and does not exist in a non-interactive shell — run the expanded literal; the gateway may route an alias to a non-Anthropic core |
| **claude in-harness subagent** | Agent tool, `model` passed explicitly | the agent file's `tools:` frontmatter | an omitted `model` inherits the caller's top tier; the Agent tool has no `effort` parameter at all, so a declared effort is decorative |
| **claude persistent worker** | `claude -p --session-id <uuid> …`, then `--resume <uuid>` | `--tools` allowlist | the id is cwd-scoped — resuming from another directory fails with `No conversation found` (exit 5) |

Two cheapness dials, set independently: agy carries the thinking tier inside the model name (`-low`/`-medium`/`-high`) and has no separate dial; Claude-family lanes need `--model` **and** `--effort`, except haiku, which has no extended thinking and ignores the flag.

**Mandatory brief clause for any agy lane (L3, `docs/plan/done/agy-helpful-bias-containment.md`).** Gemini's helpful/shortcut bias is aligned-in, not a prompting accident (Google's own guidance: the model "may over-analyze verbose or overly complex prompt engineering," and the industry-default "if a tool fails, try a different approach" pattern trains the exact fabricate-past-failure reflex this bias produces). The agy flash row above already names the silent-`SUCCESS` failure mode; a silently denied tool is the vacuum the bias fills with an invented answer. Every prompt string sent to an agy lane — dispatch or council — carries this verbatim clause, not a paraphrase, and not a growth of `payload/GEMINI.md` itself (that file's size is now treated as a cost, per the containment plan's L4):

> If any tool call or permission fails: do NOT retry, do NOT work around it, do NOT substitute content. Output `BLOCKED:` followed by the verbatim error, then stop. Always prefer actual tool output over memory; never report a result no tool returned.

Verification scope, stated precisely: the clause was carried in three test prompts, but only **two of them actually hit a denial** (T2, T8) — T9 was an allow and evidences nothing about failure reporting. So the **failure-report sentence** (first sentence) is 2 for 2 on real denial events: both times, flash-tier agy emitted the `BLOCKED:` line with the verbatim error instead of a confident substitute. Two events is a signal, not a pass rate; no control run with default phrasing was recorded, so "better than the default" is inference from the documented industry pattern, not a measured A/B. Its wording here is normalized from the tested contract, and this block is the canonical form workers copy. The **tool-output-primacy sentence** (second) is an untested ToolFailBench-derived mitigation riding along, covered by nothing. A dispatch lane declared with `worker: agy` (`SKILL.md` Step 1b) is out of contract without this block in its prompt; the roster declaration alone does not carry it.

**Scope limit — in headless `-p`, a denied file write never reaches the model, so the clause cannot cover it (measured 2026-08-21, agy 1.1.17, Linux; every worker lane here is headless).** A denied `write_file` makes the CLI end the turn at the permission check: the caller gets a non-`SUCCESS` status and an empty `response`, and no model turn remains in which to emit `BLOCKED:`. The non-`SUCCESS` envelope varies and the reason is not always in the JSON — `ERROR` populates `error`, `CANCELED` leaves it empty and puts the verbatim reason on **stderr** (both seen on the same trap minutes apart, 2026-08-21), so **key on `status`, never on the `error` field being present**. The clause still earns its place for failures that surface *inside* a model turn (a failing shell command, a missing file, a tool returning an error the model then reacts to). **The caller's duty is unconditional: check `status != "SUCCESS"` OR a `SUCCESS` with an empty body** — those are two different gates with two different signatures (vendor doc: an approval-needed tool is *soft*-denied, run continues, exit 0, stderr notice; a boundary refusal is a hard error), and checking for only one misreads the other. Nothing here describes interactive or IDE agy: the vendor states there is no interactive prompt in headless mode, i.e. it is a different path, unmeasured. Evidence: `docs/research/handoff-vs-self-verification-aug21.md` §5.7 + [Antigravity headless docs](https://antigravity.google/docs/cli/headless).

Probe exactly two things, once, at the moment of assigning a lane: liveness/quota (a one-token `… -p "ok"`) and `test -d ~/.claude-9rt`. Capability is recorded — never re-run `--help` or `agy models`, unless a caller names a model absent from § agy headless.

## Subagents

| Fact | Design consequence |
|---|---|
| **[doc]** A subagent runs in its own context window with its own tool set and model; it does not see the parent's conversation. | Independence is available by construction. It also means a plain subagent inherits **no** akirule routing — every plain-subagent prompt must name the exact `~/.aki/akidevrule/*.md` files to Read. |
| **[obs]** A subagent that has a **name** and the `SendMessage` tool receives a *sibling roster* listing the other named agents, captured **at its own startup**. | Agents named later are invisible to agents named earlier — a silent one-way channel with no error. The roster is therefore convened in **one batch**, and mid-run escalation reconvenes rather than appends. |
| **[doc]** `/fork` and `/subtask` are **interactive slash commands**, not an Agent-tool `subagent_type`; both require `CLAUDE_CODE_FORK_SUBAGENT=1`. A real run on 2026-07-30 failed every `subagent_type: fork` spawn with `Agent type 'fork' not found`, matching official docs at the time (`code.claude.com/docs/en/agents`, `.../sub-agents`) — which is why a prior version of this row said flatly that no `subagent_type: fork` value existed. **[obs]** That claim is corrected for Claude Code 2.1.220: the `claude` binary contains a real fork agent type (telemetry field `is_fork`; error strings `"Fork is not available inside a forked worker"` and `"Fork cannot use isolation: \"remote\" — a remote session cannot inherit the conversation context"`), and the Agent tool's own `model` parameter documents *"Ignored for subagent_type: \"fork\" — forks always inherit the parent model."* It is gated behind `CLAUDE_CODE_FORK_SUBAGENT=1` and is **not** in the available-agent list of a default session, so it cannot be relied on. (Confirmed 2026-08-01 by inspecting the `claude` binary directly — undocumented on the public pages above.) | The design consequence is unchanged: continuity work still travels by an explicit plan-doc/diff handoff. The *reason* changes — not "no such mechanism exists," but "the mechanism exists, is gated off by default, and even where enabled is not the cross-session artifact." The plan doc is what survives *between* sessions; a gated in-session fork never does, regardless of availability. |
| **[obs]** A **completed** subagent resumes with its full history when messaged; it does not need re-spawning and does not re-pay for context. | The Phase A roster stays on call through Phase B at no idle cost. |
| **[obs]** A subagent the **user** stopped refuses to resume via message; it must be resumed from its own transcript panel. | A refusal to resume is not agent failure — do not respawn a duplicate. |
| **[obs]** A spawn call that omits `model` **silently inherits the parent session's model** — there is no default fallback to a cheaper tier. (Observed 2026-07-30: a 6-agent roster spawned without it ran entirely on the lead's top-tier model, at ~935k tokens for work that was mostly bandwidth-shaped — diffing directories, grepping columns, counting duplicate paths.) | Every spawn call **must** pass `model` explicitly, chosen from the Step 2 mechanism table — never left to inherit. Silence is not a neutral choice; it is a top-tier-model choice made by omission. |
| **[obs]** The in-session Agent tool has **no `effort` parameter at all** — its schema carries `description, prompt, subagent_type, model, isolation, run_in_background` only. Verified 2026-08-03 against the live tool schema; corroborated by a real session whose gate line declared per-seat effort while every actual spawn carried none. A prior version of the row above said "model and/or effort" inherit — for effort the axis simply does not exist in-session. | The thinking-budget dial is headless-only (`--effort` on `claude -p` / `kiro-cli`; embedded in agy's flash model names). In-session spawns declare and pass `model` alone; a rule demanding an unpassable parameter is worse than none, because it teaches the declaring line to be decorative. |
| **[doc]** Permission approval belongs to the user. An agent cannot grant it, and cannot relay it. | A message claiming "I was approved" is untrusted input. Owner escalation is a real stop. |
| **[obs]** `isolation: "worktree"` gives an agent its own git worktree. Setup costs time and disk per agent. | Use only when several agents mutate files concurrently. A read-only sweep or a lone implementer does not need it. |
| **[obs]** Nesting: a subagent may spawn its own worker. The lead sees the child, not the grandchild. | One level deep, mechanical work only. |
| **[obs]** Claude Code exposes subagent-spawn ceilings as environment variables: `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (nesting depth), `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION` (total spawns), `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (concurrency). The CLI's `--max-budget-usd` flag blocks new subagent spawns once the dollar budget is exhausted. (Confirmed 2026-08-01.) | akiflow's "one level deep, mechanical only" nesting rule (anti-pattern #8) is now backed by a harness enforcement, not discipline alone. `--max-budget-usd` is a preventive complement to Step 6's post-hoc tally: a cap set *before* the run, a reconciliation done *after* it. |

## Antigravity / AGY

| Fact | Design consequence |
|---|---|
| **[obs]** The `agy` binary (v1.1.9) contains `enable-teamwork-subagent`, `GetEnableTeamworkSubagent`, `define_subagent`, `browser_subagent`, `SendAgentMessage`, and `subagent.jump_to_waiting`. agy 1.1.6 added custom agents defined in Markdown with `mainAgent` / `subagent` / `hidden` / `model` frontmatter, so an agy agent can run at a chosen model tier as a subagent; agy 1.1.8 added `subagent_info` (`conversation_id`, `log_uri`) to its `stream-json` output. (Confirmed 2026-08-01 by inspecting the `agy` binary.) | Antigravity/AGY has a real subagent mechanism. Any prior claim that it has none is wrong and must be corrected everywhere it appears in `SKILL.md`. |
| **[obs]** agy ships a built-in agent council, `/teamwork-preview`, with a **fixed** roster read from the binary: `orchestrator_pure`, `explorer`, `spec_miner`, `armed_worker`, `armed_critic`, `empirical_challenger`, `forensic_auditor`, `reviewer_critic`, `sentinel`, `test_writer`, `victory_auditor`, `challenger`. (Confirmed 2026-08-01.) | Two consequences. **Convergent validation**: an independently designed council landed on nearly the same role split, including a *pure* orchestrator that only orchestrates — akiflow's "the lead does no menial work" was arrived at independently, not merely fashionable. **A gap**: akiflow has no **victory audit** role — *"did this achieve the goal that was asked for?"*, distinct from verification's *"did I do what I said?"* and adversarial review's *"should this have been done?"* **What not to copy**: the roster is fixed; akiflow derives its roster from the items it cut, and a fixed roster is exactly what R2 ("a seat is convened only when it traces to a requirement in the anchor") forbids. |

| **[owner]** `gemini-3.1-pro` (agy `gemini-3.1-pro-{low,high}`) writes noticeably softer, more natural user-facing prose than Sonnet-class implementers (owner observation across projects, 2026-08-03); its agy quota headroom is unmeasured here. | Default engine for akiflow's writer role (`SKILL.md` Step 5): a role split from the implementer, under an anti-fabrication brief — the writer phrases facts supplied in its brief, never sources its own. Probe quota before a long batch; fallback is a Claude-family writer plus a softening pass. |

## Cross-CLI worker (Claude Code lead → agy headless)

Verified by real runs, 2026-08-01; model re-probed 2026-08-15. Invocation, flag order load-bearing:

```
agy --model gemini-3.7-flash-high --mode plan --output-format json -p "<prompt>"
```

| Fact | Design consequence |
|---|---|
| **[obs]** `-p`/`--print` takes the prompt as **its value**, so it must come last. `agy -p --model X "prompt"` silently sends the wrong thing and returns a confident, unrelated answer with no error. (Hit in testing.) | The flag-order trap is the single most likely way this mechanism fails silently — state it explicitly in every prompt/script that invokes agy headless. |
| **[obs]** `--mode plan` enforces read-only **by mechanism**, not by prompt wording. | Strictly stronger than Claude Code's own subagent read-only story: the Agent tool's `mode` parameter is deprecated and ignored, and a Claude subagent inherits the parent session's permission mode. For read-only sweeps and audit mode, agy is the better substrate. akiflow's "restate read-only in every audit prompt" rule stays necessary on the Claude side and becomes belt-and-braces on the agy side. |
| **[obs]** `~/.gemini/GEMINI.md` auto-loads into every agy call, including headless `-p` — 15 sections of the akirule behavior baseline (scope discipline, no unrequested artifacts, no model-credit trailers, absolute factuality, communication-is-read-only, skill-token dispatch). | An agy worker gets the behavior floor for free, where a Claude subagent must be handed the file list explicitly. This does not exempt the prompt from naming the item's domain rule files on top — GEMINI.md carries the baseline, not the domain-specific layer. |
| **[obs]** agy headless cannot prompt for permission; a denied action auto-fails and the call still returns `status: "SUCCESS"` with `response: ""`. `~/.gemini/antigravity-cli/settings.json` already allows the common read tools (grep, rg, find, cat, head, ls, sed, awk, wc), so read-only sweeps work today without `--dangerously-skip-permissions`. | A caller that does not test for an empty `response` reads a failed call as a clean sweep. Every cross-CLI call must check for this before trusting its result — see the new anti-pattern in `SKILL.md`. |
| **[obs]** agy has `allowNonWorkspaceAccess: true` and a global workspace index; in testing it resolved file paths back to the real repository even when run inside a copied directory. | `cwd` is not a reliable scope boundary for an agy worker — the prompt must name the paths explicitly. |
| **[obs]** Measured on a real read-only repo sweep: 8.2s wall / 3.4s model time, correct answer; ~20–26k tokens of fixed input overhead per call (agy's system prompt plus `~/.gemini/GEMINI.md`). *A prior version of this row cited one observed `cache_read_tokens: 32621` as evidence that repeat calls hit a warm cache. That reading was too generous — see § Stateful workers, where a controlled three-turn test shows the cache is unreliable and the latency curve is the real constraint.* | The fixed overhead means this mechanism pays for itself on a non-trivial sweep, not on a one-line lookup — the same shape as the "self-contained question" cutoff already in the Step 2 mechanism table. |
| **[obs]** The `json`/`stream-json` output carries `usage`: `input_tokens`, `output_tokens`, `thinking_tokens`, `cache_read_tokens`, plus `conversation_id`. | Cost is measurable per call — but it is invisible to `council_cost.py`, which only parses the Claude Code session transcript. The lead must add it to the close-out tally by hand (`SKILL.md` Step 6). |
| **[obs]** agy 1.1.9 expands skills in print mode, so `agy -p "/akiflow …"` resolves the skill; `akiflow` is already deployed to agy at `~/.gemini/config/skills/akiflow`. | A cross-CLI call can invoke the skill itself, not just an ad hoc prompt — relevant if a future revision routes part of a run through agy directly. |
| **[owner]** + **[obs]** Model choice inside agy is not free-form. **`gemini-3.7-flash-high` is the default discovery tier** (owner directive, 2026-08-15, superseding the prior `gemini-3.6-flash-medium` default once `gemini-3.7-flash-*` shipped — see § agy headless below for the full re-probed model list): ~1M context, generous quota. Its weakness is carelessness, not capacity — it skims. The counter is prompt precision, not a bigger model: name the exact paths, the exact question, and the exact output shape, leaving it nothing to improvise. **`claude-sonnet-4-6` / `claude-opus-4-6-thinking` inside agy are quota-scarce even on a Pro plan** (owner-reported) and additionally sit on the no-cache resume curve above. | Route discovery to `gemini-3.7-flash-high` by default and hand it a fully-specified task. Reach for agy's Claude tiers only for a single-shot, self-contained, high-value call where context and cache are demonstrably under control — never for a conversation, never as a habit. When strong-model judgment is needed *and* stateful, that is a Claude session id, not agy. |
| **[obs]** A flash-tier worker (`gemini-*-flash-*`, any generation) is for **retrieval, never for judgment**. | akiflow's thinking floor turns on the FACT/CONSTRAINT/ASSUMPTION distinction, which the skill already names as the one unrecoverable error to mislabel — exactly what a cheap model does worst. Hard rule wherever this mechanism is used, in the same voice as the existing "never downgrade implementation to save cost": retrieval only. |

## Cost model

| Fact | Design consequence |
|---|---|
| **[doc]** Prompt caching has a limited TTL — 5 minutes by default, 1 hour on the extended option. Sessions differ. | Plain subagents spawned in one batch, sharing the same rule-file prefix, hit a warm cache; a subagent spawned late (after a long Phase A) pays a colder read instead. Reason enough, on top of the sibling-roster fact above, to convene the roster in one batch (Step 2). |
| **[obs]** Every `SendMessage` costs a full turn of the receiving agent. | Peer-to-peer is not free; it merely skips the lead. Budget it in the roster brief. |
| **[obs]** A skill's `SKILL.md` loads only when the skill is invoked (progressive disclosure); `references/` and `scripts/` load only when read or run. | Keep the runnable contract in `SKILL.md`; park the reasoning here so it costs nothing until someone needs it. |
| **[obs]** Claude Code writes the session transcript as JSONL under `~/.claude/projects/<cwd-path-with-slashes-as-dashes>/<session-id>.jsonl`. Every assistant turn is one line carrying `message.model` and `message.usage` (`input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`). **A subagent's turns are in a separate file, not the parent's** — `<session-id>/subagents/agent-<agent-id>.jsonl`, each with a sidecar `agent-<agent-id>.meta.json` carrying `agentType`, `description`, `toolUseId`, `spawnDepth` and `model`. That directory is flat even for nested spawns: a `spawnDepth: 2` seat sits beside its parent and names it in `parentAgentId`. `"isSidechain": true` marks subagent rows and appears **only** in those files — measured 2026-08-15 across 1094 transcripts on this machine, 71,839 occurrences (in 876 files), none in a main-session file. (First observed 2026-07-31, when both lived in one file; re-verified and corrected 2026-08-15.) | Per-agent token accounting needs no new bookkeeping during the run — the numbers already exist. A cheap subagent parses them at close-out (`scripts/council_cost.py`, Step 6) and aggregates in-shell. Labels come from the sidecar, and must be `agentType` **plus** `description`: real rooms spawn almost every seat as `general-purpose`, so `agentType` alone silently merges unrelated seats into one row. **Dollar prices are not in the transcript and drift — never bake a price table into the script; multiply tokens by the current per-model price at report time.** |

## Model tiers

Family names, not version ids — the mapping outlives any single release.

| Work | Tier | Why |
|---|---|---|
| Decomposition, arbitration, the final call (the lead) | top tier | every downstream cut inherits this |
| Adversarial review, business/UX judgment | top tier, high effort | judgment, and the output the owner acts on |
| Implementation | mid tier or above, never downgraded to save cost | code quality is created at the keyboard, not recovered in review |
| Verification against a written promise | mid tier, plain subagent handed the diff + the promise | mechanical comparison, but must know what was promised |
| Mechanical sweeps: inventory, grep, call-site lists, stats | cheapest capable tier, low effort | the task describes itself; instruct it to aggregate in-shell rather than pulling raw data into context |
| Read-only retrieval via the cross-CLI worker (agy headless, flash tier, `--mode plan`) | cheapest available tier, mechanical retrieval only, never judgment | `--mode plan` enforces read-only by mechanism rather than by prompt; the FACT/CONSTRAINT/ASSUMPTION judgment stays with the lead — see § Cross-CLI worker |

### Host resolution — a tier is a word, the host supplies the model

Skills are deployed unmodified to five hosts, and **[doc]** Cursor additionally reads `~/.claude/skills/`, `~/.agents/skills/`, `~/.claude/agents/` and `~/.codex/agents/` for compatibility (cursor.com/docs/skills, cursor.com/docs/subagents, checked 2026-09-08). So any model name written into a skill or agent file is read by every host, and a Claude alias in a shared file becomes a Claude call on a host that has cheaper native models. The rule: **a roster, lane, or brief names a tier — `top` / `mid` / `cheap` — and the host running the skill resolves it through its own row below. A skill never names another vendor's model.** The one deliberate exception is `claude/agents/*.md` frontmatter: `model: sonnet` / `model: haiku` are the Claude Code row written in the only syntax Claude Code reads, and Claude Code is the primary host, so they stay exact rather than degrading to `inherit`. On a non-Claude host that value is not a native model id: declare the seat's model explicitly at spawn from the host's row, and treat the frontmatter as Claude-only.

| Host | `cheap` — retrieval, never judgment | `mid` — implementation, verification | `top` — lead, adversarial judgment | Where the tier is set | Status |
|---|---|---|---|---|---|
| Claude Code | `haiku` (no `--effort`) | `sonnet` | `opus`, or `inherit` from the lead | agent frontmatter `model:`; Agent tool `model`; `claude -p --model <alias> --effort <e>` | **[obs]** verified across this file |
| Cursor (IDE + `agent` CLI) | Composer family — the current id from Cursor's model picker (`composer-2`-style), never an API-pool Claude/GPT model | `inherit` (the session's model) | `inherit`, or the session's top API-pool model | `.cursor/agents/*.md` or `~/.claude/agents/*.md` frontmatter `model: inherit \| <id>[effort=…]`; `agent -p --model <id>` | **[doc]** field and syntax; **UNCONFIRMED** how Cursor treats a Claude alias (`haiku`) it cannot resolve — reopen trigger: one measured Cursor run of an `aki-hands` spawn |
| Antigravity `agy` | `gemini-3.7-flash-high` (§ Cross-CLI worker) | `gemini-3.1-pro-low` | `gemini-3.1-pro-high` (`claude-opus-4-6-thinking` is quota-scarce, § agy headless) | `agy --model <slug>` — effort is inside the slug; agy 1.1.6+ agent markdown carries `model` | **[obs]** 2026-08-15 |
| Codex CLI | UNCONFIRMED low-cost alias | `[agents] default_subagent_model` in `config.toml`; `codex exec -c model=<id> -c model_reasoning_effort=medium` | same model, `model_reasoning_effort=xhigh` | `config.toml [agents]`, per-agent `model`; `codex exec -c …` | **[doc, secondary]** 2026-09-08, model ids drift monthly — read them from `codex` itself |
| Kiro CLI | `qwen3-coder-next` (0.05×) or `claude-haiku-4.5` (0.4×) | `auto` (1×) or `claude-sonnet-4.5` (1.3×) | Opus-class, ~22× — rarely worth it on this host | `kiro-cli chat --no-interactive --model <id> --effort <e>`; custom agent JSON `model` | **[obs]** 2026-08-02 list; multipliers re-read with `--list-models` |
| Grok CLI | UNCONFIRMED | `grok-build-0.1` default | UNCONFIRMED | `grok -p` (`--model` flag unconfirmed) | **[doc, secondary]** 2026-09-08 |

The `model` key in `SKILL.md` frontmatter is a Claude Code extension, rejected by the open-standard validator (github.com/anthropics/claude-code/issues/25380) — never put a tier or a model there.

## Headless — the cost levers, per CLI

Full narrative and the measurements behind these rows: `docs/research/headless-cli-workers-aug1.md`.

### Claude Code (`claude -p`), verified 2026-08-01 against 2.1.220

| Flag | Fact | Design consequence |
|---|---|---|
| `--bare` | **[obs]** Skips hooks, LSP, plugin sync, attribution, auto-memory, background prefetches, keychain reads, and CLAUDE.md auto-discovery. **It also refuses OAuth — auth is strictly `ANTHROPIC_API_KEY` or an `apiKeyHelper`.** A live call on an OAuth-only machine returned `is_error: true`, `terminal_reason: "api_error"`, zero tokens. | The largest available input-token cut on the Claude side, and unusable without a separate API key. Do not write it into a mechanism that must work on the owner's normal login — but on an API-key proxy-gateway lane (§ claude via a proxy gateway below) the objection vanishes and the cut applies in full. |
| `--disallowedTools "Workflow DesignSync"` | **[obs]+[doc]** Session-level tool block, no auth change (unlike `--bare`, still OAuth). Verified 2026-08-03: `Workflow` is Claude Code's native autonomous multi-step orchestrator (code.claude.com/docs/en/common-workflows) — akiflow's own `SKILL.md` (Step 1) already states it only *tells the owner* to invoke Workflow, never calls it itself, so blocking it removes nothing akiflow uses. `DesignSync` is the `/design-sync` bridge to claude.ai/design (design-token/component import-export, support.claude.com) — a different product surface with zero overlap with akiflow. | The OAuth-compatible alternative to `--bare` for cutting tool/context surface: same intent (fewer tools loaded at session start), none of `--bare`'s auth cost, and zero functional loss for akiflow specifically. Owner alias: `cl-9rt-min='CLAUDE_CONFIG_DIR="$HOME/.claude-9rt" claude --disallowedTools "Workflow DesignSync"'`. |
| `--tools "Read,Grep"` | **[obs]** Restricts the session to a named subset of built-in tools; `""` disables all. | Read-only **by mechanism** on the Claude side — the missing counterpart to agy's `--mode plan`. Prefer it over telling a subagent to behave. |
| `--json-schema` | **[obs]** Enforces structured output. `agy --json-schema` is the same capability. | The one Workflow feature worth having is available headless on both CLIs, so it is not a reason to adopt Workflow. |
| `--max-budget-usd` | **[obs]** Hard dollar cap; `-p` only. | Preventive counterpart to Step 6's post-hoc tally, and the second Workflow-only feature that turns out not to be Workflow-only. |
| `--effort low` | **[obs]** `low\|medium\|high\|xhigh\|max`. Present on `claude`, `agy`, and `kiro-cli`. **`claude` + haiku**: no `--effort` option — haiku has no extended thinking at API level; flag silently ignored. | Two cheapness axes: model tier **and** thinking budget. Cut both on sweeps. On `claude` CLI with haiku, only the model axis is available. |
| `--exclude-dynamic-system-prompt-sections` | **[doc, in `--help`]** Moves cwd/env/memory/git-status out of the system prompt into the first user message, improving cross-call prompt-cache reuse. | Matters when the same worker shape is called many times in a run — cache hits, not flag count, are what make fan-out cheap. |
| `--agents <json>` | **[obs]** Defines custom agents inline, as JSON, per call. | A worker roster can be declared at the call site without installing anything. |
| `--permission-mode plan`, `--add-dir`, `--no-session-persistence`, `--fallback-model`, `--disable-slash-commands`, `--setting-sources` | **[obs]** Present. | Scope, durability, and resilience are all per-call settable; a headless worker need not inherit the caller's environment. |

### claude via a proxy gateway (9router) — a parallel worker lane every machine should have

**[obs]** A gateway like 9router provisions a separate Claude config dir (`CLAUDE_CONFIG_DIR=~/.claude-9rt`) pointing the same `claude` binary at its own endpoint + API key — same harness, separate metering, and the gateway decides which core actually serves each model alias. Owner's `cl-9rt-min` alias pairs it with `--disallowedTools "Workflow DesignSync"` (row above) for a minimal-surface session. **`cl-9rt`/`cl-9rt-min` is a shell alias, not a binary** — it is defined in the owner's interactive shell rc and does not exist in a spawned/non-interactive process. A worker or script must run the expanded literal command (`CLAUDE_CONFIG_DIR=~/.claude-9rt claude ...`, `aki-hands.md` § Substrates), never the alias name.

| Fact | Design consequence |
|---|---|
| Separate config dir = separate quota, metered by the gateway, concurrent with the lead's session | A genuine **parallel** lane, not a spillover for "primary quota exhausted" — a second real worker runs alongside the lead without competing for the same tokens. |
| **[owner]** A gateway alias may route to a non-Anthropic core: the owner's lane's "Sn" alias is a deepseek-v4-pro-class model (2026-08-03). Which core answers is the gateway's routing table — per machine, re-verify before relying on model-specific behavior. | Treat the lane as an **explore/bandwidth seat** beside agy flash, never a second seat of the lead's model: strong enough for wide parallel exploration and synthesis, while judgment and arbitration stay with the lead. |
| Auth on this lane is the gateway's API key, not OAuth — so `--bare` (rejected for the main login, table above) **works here**. | The largest token cut becomes usable: `--bare --tools "Read,Grep,Bash"` is the minimal fresh-context worker shape for this lane. |
| Depends on a config dir the owner provisions (`~/.claude-9rt`); not present by default on every machine | Probe `test -d ~/.claude-9rt` like any cross-CLI lane. Where absent, **recommend the one-time setup** (CONFIG_DIR + gateway endpoint — every machine benefits from having this lane) instead of silently substituting another mechanism. |

*Consequence:* the quota-payer axis doubles as a parallelism axis — the lead plus one or more gateway workers run at once, each metered on its own account.

### agy headless — see § Cross-CLI worker above

**[obs]** Re-probed 2026-08-15 (prior check 2026-08-02 predates the `gemini-3.7-flash-*` release — do not cite the old list), `agy models`: `gemini-3.7-flash-{low,medium,high}`, `gemini-3.6-flash-{low,medium,high}`, `gemini-3.5-flash-{low,medium,high}`, `gemini-3.1-pro-{low,high}`, **`claude-sonnet-4-6`**, **`claude-opus-4-6-thinking`**, `gpt-oss-120b-medium`. Also present: `--json-schema`, `--effort`, `--agent`, `--add-dir`, `--print-timeout`, `--disable-slash-commands`, and an `agents` subcommand (empty on this machine — no custom agy agents defined).

*Consequence:* a Claude-family model can be reached **on the Antigravity quota**. The vendor paying and the model reasoning are independent choices, which is a second axis the Step 2 mechanism table did not previously have.

### Kiro CLI (`kiro-cli` 2.16.0) — **[obs]**, verified 2026-08-02

| Flag / Feature | Fact | Design consequence |
|---|---|---|
| Batch | `kiro-cli chat --no-interactive "<prompt>"` — positional arg also accepted | Drop-in headless substrate, same invocation shape as `claude -p` |
| Read-only | `--trust-tools=` blocks all; `--trust-tools=fs_read,fs_write` restricts to named set; `-a`/`--trust-all-tools` approves all | Read-only **by mechanism** — equivalent of `--mode plan` / `--tools ""`. Prefer over prompt wording. |
| Fail-loud | `--require-mcp-startup` — exit code 3 if any MCP server fails to start | A broken worker fails loudly instead of silently degrading |
| Effort | `--effort low\|medium\|high\|xhigh\|max` — present and operative on all model tiers | Unlike `claude` CLI + haiku, `--effort` is not a no-op on any Kiro model |
| Session | `--resume-id <ID>`, `-r` (most recent), `--resume-picker`; `--list-sessions`, `--delete-session` | Same persistent-worker pattern as `claude -p --session-id`; cwd-scoped |
| Engine | `--agent-engine v1\|v2\|v3` (v2 default); `--mode default\|spec` with v3; `--agent <name>`; built-ins: `kiro_default`, `kiro_planner`, `kiro_help`; custom in `.kiro/agents` or `~/.kiro/agents` | v3 spec mode available when needed |
| ACP | `kiro-cli acp` — exposes Kiro as an Agent Client Protocol server | Only machine protocol in this stack; an external orchestrator can drive Kiro directly |
| Models | **[obs]** (`--list-models`, 2026-08-02): `auto`(1×), `claude-sonnet-4.5`(1.3×), `claude-haiku-4.5`(0.4×), `minimax-m2.5`(0.25×), `glm-5`(0.5×), `qwen3-coder-next`(0.05×, 256k) | Cheapest bandwidth tier in this stack; only one exposing a machine protocol (ACP) |

### Stateful workers — both CLIs offer one, and they behave oppositely

**[obs]** Controlled test, 2026-08-01. Store a token in turn 1, ask for it back in turn 2, send a trivial turn 3. Both CLIs recalled it correctly, so *functionally* both resume. Economically they are not comparable:

| | `agy --conversation <id>` | `claude -p --session-id <uuid>` / `--resume <uuid>` |
|---|---|---|
| Turn 1 | 26.5k input, 2.6s | $0.0358 — 16.9k cache-creation, 17.5k cache-read |
| Turn 2 | 53.6k input, **`cache_read_tokens: 0`**, 8.8s | **$0.0043** — 34.4k cache-read, 219 new. ~8× cheaper than turn 1 |
| Turn 3 (trivial prompt) | 56.4k input, 24.5k cache-read, **57.6s** | $0.0038 — 34.6k cache-read, 90 new |
| Shape of the curve | input grows every turn, cache intermittent, **latency 2.6s → 8.8s → 57.6s** | flat: cost and latency stable from turn 2 onward |
| Lookup scope | conversation id resolves globally | **cwd-scoped** — resuming the same id from another directory fails with `No conversation found` (exit 5) |

Design consequences, and they are the sharpest in this file:

1. **`claude -p --session-id` is the persistent-worker mechanism this skill was missing.** A named uuid, called repeatedly, keeps its full history and gets *cheaper* after the first turn because the prefix is cached. It is not a fork — it is better for this purpose, because it survives between top-level sessions. Continuity no longer has to travel exclusively by plan-doc handoff; a long-lived worker can simply be re-addressed.
2. **Its cwd-scoping is a feature, not a limitation.** A worker id is bound to the project directory it was created in, so a worker cannot be accidentally re-addressed from the wrong repo.
3. **agy conversations are a trap. Use agy one-shot only.** It resumes correctly and looks fine at turn 2, then the latency curve makes it unusable — 57.6 seconds to answer "reply ok" on turn 3. Anything needing more than one exchange belongs on a Claude session id; agy's value is a fast, wide, self-contained single call.
4. **The cheap axis and the stateful axis are different mechanisms.** agy flash is cheap *per call* and stateless in practice; a Claude session id is cheap *per turn after the first* and stateful. Choosing "cheap" without saying which of the two is meant is how a run ends up paying full price for both.

### What breaks in headless mode, on every CLI

Two things, and both are structural:

1. **Nobody can answer an owner escalation.** The lead must not guess what the owner would have wanted. Record the escalation in the checklist as `BLOCKED: needs owner` and stop that item — the rest of the run continues.
2. **Nobody can answer a permission prompt.** Anything requiring approval fails rather than waits. Headless work must be scoped to what the current permissions already allow.

A bare cheap-model headless call is the right shape for a self-contained mechanical question — one that fits in a couple of hundred words with no project context and returns a short answer. It is the wrong shape for anything that would need to ask a follow-up question.

## Sources

Claude Code and Antigravity documentation both move; verify a detail before relying on it.

- Subagents (fork/subtask, `CLAUDE_CODE_FORK_SUBAGENT`) — <https://code.claude.com/docs/en/sub-agents>
- Run agents in parallel (subagents vs agent view vs agent teams vs workflows) — <https://code.claude.com/docs/en/agents>
- Changelog (version-dated behavior changes, e.g. the `/fork` → `/subtask` rename) — <https://code.claude.com/docs/en/changelog>
- Agent Skills — <https://code.claude.com/docs/en/skills>
- CLI reference (`-p` / non-interactive) — <https://code.claude.com/docs/en/cli-reference>
- Settings and permissions — <https://code.claude.com/docs/en/settings>
- Prompt caching and TTL — <https://docs.claude.com/en/docs/build-with-claude/prompt-caching>
- Cursor skills discovery paths (incl. `~/.claude/skills/`, `~/.agents/skills/`) — <https://cursor.com/docs/skills>
- Cursor subagent frontmatter (`model: inherit | <id>[effort=…]`, reads `~/.claude/agents/`) — <https://cursor.com/docs/subagents>
- Cursor headless CLI (`agent -p --model`) — <https://cursor.com/docs/cli/headless>
- Antigravity headless model slugs — <https://antigravity.google/docs/cli/headless/>
- `model` in SKILL.md is a Claude Code extension, rejected by the open-standard validator — <https://github.com/anthropics/claude-code/issues/25380>

Entries marked **[obs]** are not in these pages, including all of the Antigravity/AGY and cross-CLI rows above — no equivalent published reference for `agy`'s internal mechanisms was found; they were observed directly against the `claude` and `agy` binaries and a live transcript, and are recorded here so a future reader can tell the difference between what is documented and what is merely believed.
