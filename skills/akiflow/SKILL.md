---
name: akiflow
description: Lead-coordinated agent council for work that needs more than one kind of judgment. The lead pins the owner's verbatim words as the run's immutable anchor, decomposes the request into owned work items each quoting a requirement from it, checks a three-condition activation gate, and convenes seats from the five installed agent definitions in ~/.claude/agents/ — one batch, each seat traced to a requirement, never picked from a menu. Every mechanism is off by default and turns on only when this run produces a reason. The lead does no menial work and settles what doctrine answers, escalating only a one-way door, a contradiction with documented design, or scope expansion — then writes the owner's answer back into doctrine so the same question never escalates twice. Two shapes discriminated by whether anything is being arbitrated — a council of items with adversaries, or a dispatch of lanes with exclusive file ownership for fan-out work whose answer is already knowable; and three modes discriminated by what changes outside the room — discuss, audit (read-only), execute. A mechanical gate script refuses closure on a missing anchor, a REQ that quotes nothing the owner wrote, a declared seat that left neither a turn nor a file, a seat with no rule receipt, an untagged seat, an unanswered reminder, or a requirement no item covers. Explicit invoke only.
---

# akiflow — lead-coordinated agent council

Invoke with `/akiflow <request>`. The session agent becomes the **lead**: it anchors, decomposes, convenes, arbitrates, and decides.

## The lead's job is two laws

Everything below is one of these two made operational. They are the lead's job description, not corpus-wide law.

| Law | Statement | What it forbids |
|---|---|---|
| **R1 — ANCHOR** | The owner's words are immutable and are the final test: the content, the mechanism they named, and the shape of the answer. | Paraphrasing the request into a pinned problem statement. The moment the lead restates, the anchor is gone and every seat downstream inherits the restatement — the failure mode that cost two full council runs. |
| **R2 — JUSTIFICATION** | Every mechanism — seat, check, step, script, consult — is **OFF by default** and turns on only when *this run* produces a reason. | "It is in the skill", "it is a standing seat", "we always run it". Being documented is not a reason. A gate that forces a seat to exist manufactures work; a roster derived from a tier instead of from a requirement is over-staffing with a procedure attached. |

The council is worth its cost only against three structural failures of a single thread, none of which a stronger model fixes: **context flooding** (one context holds request, code, plan, diff and review), **role collapse** (one agent applying one standard of "correct" to problems judged by different ones), and **self-approval** (the context that produced a decision cannot judge it). With none of the three present, this skill costs more than it returns.

## Step 0 — anchor, then cut

```bash
python3 ~/.claude/skills/akiflow/scripts/council_open.py <slug> "<the owner's message, verbatim>"
```

It refuses to open a room without the message, and writes it as chat.md's immutable `## anchor` block. Pinning used to be a discipline; two consecutive runs skipped it, so it is now a mechanism whose absence is impossible.

**The requirement ledger.** Extraction is bulk work, so it goes to `aki-hands`, not the lead: one numbered line per distinct requirement, `REQ-1 … REQ-n`, **each carrying a "quoted fragment" copied from the anchor**. The quote is what makes a line a requirement rather than an interpretation, and the closure gate checks it. The lead ratifies the draft against the anchor before cutting anything — only a ratified ledger counts, and the lead owns coverage even though a worker did the labor.

A **work item** is the atomic unit:

```
ITEM <id> · <one-line statement of what must be decided or built>
  covers:     <REQ-n, REQ-m, ...>
  owner:      <seat name>
  challenger: <a different seat name>
  closes when:<a criterion someone else can check>
  rationale:  <filled in at closure, <=3 lines>
```

Every REQ must be covered by ≥1 item; an orphan REQ is a decomposition bug, not a footnote. Cut along real boundaries — each item having its own definition of "correct" — never into phases of one undivided question. The checklist is a precondition for opening the room, never a product of it.

**`aki-challenger`'s first assignment is always the decomposition itself**, before any content attack: the REQ with no item, the missing item, the item with two owners, the item whose closing criterion nobody can check. A bad cut means the room debates the wrong squares thoroughly — the one failure no other mechanism catches, because every other mechanism operates *within* the item structure.

## Step 1 — the gate, and the mode

Declare both before any other output:

```
[akiflow] mode=execute · REQ 1-6 → 4 items · trigger: schema + API shape + migration ordering
roster: judge-schema(mid) · challenger(mid) · hands-callsites(cheap, ro:--tools Read,Grep,Glob) · maker-api(mid)
```

**Shape comes before the gate: is there anything to arbitrate?** If two competent seats could reach different defensible answers, this is a **council** and the rest of this step applies. If the answer is knowable and the work is merely large, it is a **dispatch** (Step 1b) — the same anchor, ledger, receipts and closure gate, partitioned into lanes with exclusive file ownership instead of items with an adversary. Shape and mode are independent: a dispatch can be `audit` or `execute` just as a council can.

All three conditions must hold, or this is not a council: **decomposable** into ≥2 items with real boundaries · **≥2 kinds of "correct"** (schema-correct ≠ UX-correct ≠ price-correct; if one standard covers everything, one good head suffices) · **cost of error exceeds cost of coordination**. Ambiguity resolves downward. Never ask the user which tier they want — the gate is auditable through these two lines.

**Mode is decided by one question: what changes outside the room?**

| Mode | Changes outside the room | Produces | Notes |
|---|---|---|---|
| `discuss` | nothing | a decision plus its record | no `aki-maker` is convened; a room that writes files is not in this mode |
| `audit` | nothing — read-only by construction (`agent.B5`) | findings, and a plan that schedules fixes | one item per domain, each owned by a `judge` seated on that domain's standard: `docs.C` · `ui.C` · `flow` · `release.B` · `ux.C` · `biz` · `subtract`. Fixes are a separate run through this gate |
| `execute` | files | a diff, verified | `aki-maker` is the only seat permitted to write |

**Bulk mechanical work is not a council — but it no longer has to leave the skill.** The same transform across many files, or a sweep whose paths are known up front, has nothing for a roster to arbitrate and grows the lead's context with the item count. It still wants the anchor, the REQ ledger, the `[RULES]` receipts, the durable record and the closure gate, and that combination is a dispatch (Step 1b), not a reason to fall back to bare spawns. Claude Code's native `Workflow` tool is still the better fit where the loop itself must be held outside any model's context — the owner must invoke it, this skill cannot. A subtraction audit is the clearest split: the scanning is dispatch lanes, and the council convenes only at classification, where *dead* versus *load-bearing but ugly* is the judgment the owner acts on.

## Step 1b — dispatch

A fan-out with a paper trail. Reuses this skill's workspace, its three file kinds and its closure gate unchanged; replaces the debate with a partition. Declare it the same way:

```
[akiflow] shape=dispatch · mode=execute · REQ 1-4 → 3 lanes
lanes: scripts(maker mid, writes skills/akiflow/scripts/*.py) · docs(maker mid, writes docs/** + CHANGELOG.md) · sweep(hands cheap, ro:--tools Read,Grep,Glob, writes none)
```

**A lane is an item whose adversary is replaced by an exclusive file set.** Every lane carries `covers` (the REQs it satisfies), `worker`, `writes`, `reads` and `returns`. `writes` is exclusive: a path claimed by two lanes is a gate failure, refused by `council_open.py --convene` before a token is spent, because two workers editing one file is the failure a fan-out actually dies of and it is invisible until the second one clobbers the first. `returns` exists because the lead merges the lanes and cannot merge a shape that was never specified.

**Every lane leaves its own trace, and the lead does not hold them all.** The trace name for a lane IS the lane's own short name, never its `worker:` value — a lane whose worker can write puts its report in `<lane>.md` in the session directory and returns only its conclusion; a read-only lane returns to the lead, who posts it as one turn under the lane name. Either satisfies `council_verify.py`, and the first keeps a long report out of the lead's context until something makes it worth reading. `worker:` stays a required field — it is roster/cost metadata, the same as a council item's `model` — but it is never the trace identity: two lanes may declare the same `worker` type and must still leave two separately-traceable reports.

**What dispatch drops, and why that is safe:** no challenger and no judge, because nothing is being arbitrated · no turn-numbered debate and no peer-to-peer laws, because lanes do not talk to each other · no three-condition gate, because the condition that justifies a dispatch is different — work partitionable into ≥2 independent lanes, each lane's paths and question nameable up front, and a result that must outlive the session. Fail the third and a bare spawn is enough; fail the second and it was a council question all along.

**What dispatch keeps is the whole point:** the anchor immutable (R1 is unconditional), every REQ quoting the owner's own words, every worker's `[RULES]` receipt, the durable on-disk record, and all seven checks of `council_verify.py` — a lane's `worker` is a declared seat exactly as a council's `owner` is, and an untraced one is a ghost.

**A lane declared `worker: agy` carries the failure-report clause in its prompt, not just in the roster line** — `references/harness-facts.md` § Worker invocation quick-facts has the verbatim text. Gemini's helpful-bias fabricates a result exactly where a tool call was silently denied; the clause is what turns that into an honest `BLOCKED:` instead.

## Step 2 — convene from the definitions, never from a menu

The five agents live in `~/.claude/agents/` and carry their own tools, model tier, rule manifest and output contract. Read the definition rather than re-describing it here.

| Definition | Seat is for |
|---|---|
| `aki-hands` | retrieval with `file:line`; judgment forbidden. Also the file that names every worker substrate (Claude subagent · agy · kiro-cli · `cl-9rt`) and the recorded harness facts that make re-probing them unnecessary |
| `aki-judge` | one standard, named at spawn — `pattern`, `proportion`, `ux`, `db`, `docs`, `release`, `biz`, whichever the item is judged by |
| `aki-conduct` | the process: whether rules arrived (LOAD-fail) and whether they were followed (COMPLY-fail); `scythe.py` is its tool |
| `aki-challenger` | attacks the result from a clean context; closes on *"what can be cut?"* and *"does this answer the anchored words?"* |
| `aki-maker` | turns a decision into a diff; `execute` mode only |

**The convening rule: a seat exists only when it traces to a requirement in the anchor.** Five definitions on disk is a catalog, not a roster, and picking seats from a catalog is exactly the over-staffing this skill was rebuilt to end. There are no standing seats — `conduct` is convened when the run writes durable artifacts, `judge -proportion` when an item adds, sizes, keeps or removes a guard, limit or accepted risk, and so on. A seat with nothing to act on is R2 violated with a procedure attached.

**Name each seat `<definition>-<scope>`** — `judge-schema`, `hands-callsites`, `challenger` — because the name is the address `SendMessage` routes to and the key `chat.md` turns are grouped by. **Convene the whole roster in one call**: each subagent's sibling list is captured at its own startup, so an agent named later is invisible to those named earlier — a silent one-way channel with no error. Assign each a distinct turn-number block at the same time (`judge-schema` 10–19, `challenger` 20–29), since parallel writers cannot see each other's latest number and would collide on `#1`. Check `disallowedTools` does not strip `SendMessage`, or the roster is decorative.

**Before the spawn batch, the checklist must pass its own gate** — the room is not convened on an uncut question:

```bash
python3 ~/.claude/skills/akiflow/scripts/council_open.py --convene <session-dir>
```

Exit 1 unless ≥1 `ITEM` carries all of `owner` / `challenger` / `closes when`. It gates *convening*, not file creation: the anchor has to be pinned before the ledger can quote it (R1), so `chat.md` necessarily exists first — the cost this prevents is N agents circling an undecomposed question, and that cost is paid at spawn.

**A seat is declared by tier — `top` / `mid` / `cheap` — never by a model name; the host running this skill resolves the tier through its own row in `references/harness-facts.md` § Model tiers › Host resolution.** On Claude Code the tier lives in each agent definition's frontmatter — that file is the Claude row, and a spawn passes `model` only to override it, not as a ritual on every call. On any other host (Cursor reads the same `~/.claude/agents/` files) the frontmatter value is a Claude alias the host cannot resolve, so the lead declares each seat's model explicitly at spawn from the host's row — a Claude alias written into a Cursor or Codex spawn buys an expensive API-pool model where a native cheap tier existed. The real remaining hazard is a generic subagent such as `general-purpose`, which carries no tier of its own and therefore inherits the lead's expensive default — this matters concretely at Step 6, where the cost seat must hold `Bash` and is spawned generically. The in-session Agent tool has **no `effort` parameter**; only headless calls take `--effort`, so do not declare per-seat effort for in-session spawns. A read-only seat names its enforcing mechanism (`--tools`, `--mode plan`, `--trust-tools=`) on the roster line; read-only by wording is not read-only.

**The lead does no menial work — ever.** Arbitration quality is its only product and it degrades with every unrelated token. Bulk reads, greps, inventory scans go to `aki-hands` even when doing it directly feels faster, because "faster" spends the one context the run cannot replace. The lead reads at orientation depth: the anchor, the checklist, `--stats`, and the specific excerpt a decision turns on.

## Step 3 — the room

`council_open.py` creates `~/.aki/agent-council/<project>/<YYYY.MM.DD-HHMM>-<slug>/` and prunes sessions older than 30 days. Three files, three jobs, never merged:

| File | Writer | Holds |
|---|---|---|
| `<seat-name>.md` | that seat | its pinned mandate and working notes |
| `chat.md` | everyone | the anchor, the pinned block, and the meeting in time order |
| `checklist.md` | **the lead only** | the REQ ledger, the items, their closures and rationale; the durable copy goes to `docs/plan/` (`docs.B1`) |

Turns are `### <HH:MM> <seat-name> #<n>`, under 200 words, never hard-wrapped, everyone appends and nobody edits another's turn. **Every claim in a turn is tagged `FACT` / `CONSTRAINT` / `ASSUMPTION`** (`METHOD-deep-think.md` B2) — the gate checks each posting agent used at least one, because an untagged room is where a guess closes an item wearing a fact's clothes.

```bash
R="python3 ~/.claude/skills/akiflow/scripts/council_read.py"
$R <chat.md> --index | --pinned | --stats | --agent challenger --tail 5 | --from 12
$R <chat.md> --grep "quota|pricing" --agent red-team     # locate: matching lines, tagged with the turn each came from
$R <chat.md> --turn 14                                   # then read only that turn
```

**Locate, then read — never scan.** `--grep` answers "did anyone raise X?" for a few hundred bytes; reading the room to answer the same question costs the whole file. That is the only pair of commands that removes a whole-file read, because every other flag (`--agent`, `--from`, `--tail`) needs you to already know where to look. A seat arriving reads `--pinned` plus `--index`, then only the turns its own mandate names — it has no `--from` to resume from, and pulling the whole file is exactly the context the spawn existed to avoid. A seat rejoining reads `--pinned` plus `--from <its last turn>`. The lead watches `--stats` and `--index` and reads full turns only where something looks wrong; a lead that reads the whole room has rebuilt the flooded main thread with the least independent context now holding the arbitration seat.

**A read is a subscription, not a purchase.** Every tool call re-sends the whole history, so anything pulled into context is charged again on every later turn: a read of size `S` at turn `t` of a `T`-turn run costs about `S × (T − t)`, not `S`. Reading a 50k-token room at turn 50 of 200 costs ~7.5M cache-read tokens — a fifth of a real measured run's entire lead spend, from one call. `--stats` prints bytes per agent precisely so the lead can price a read before making it.

**Peer-to-peer laws.** Direct challenge is the point of the room, but it removes the lead's view of how a conclusion was reached: every peer exchange ends in a `DECISION:` or `CONFLICT:` turn posted by whoever closes it · peer agreement is not a decision, only the lead closes an item · three rounds per pair then escalate, and cyclic chains (A→B→C→A) are forbidden · every message costs a full turn of the receiving agent.

**Domain consults are mandatory once a seat exists.** An item whose closure touches a domain with a seated judge closes only after that judge's recorded turn. "Nobody asked UX" is a closure defect. This does not create seats — it binds the ones the anchor already justified.

**Recurring conflict is a design smell, not a refereeing job.** The same ground contested across two or more items is the signature of a missing pattern underneath (`pattern.A8`). Open a root item, name the pattern, re-close the conflicted items against it.

**Steering is judgment, not a counter.** Depth is why this skill exists; never cut a productive argument short for being long. Intervene on a real signal — ground re-covered with no new evidence, a closing criterion that has stopped getting closer, scope drifting outside mandates, cost visibly outrunning the decision's worth — and then do the minimum: one pinned `CHECKPOINT` line, messaged only to the seats that are drifting.

## Step 4 — closure, and what reaches the owner

Before items close, and again before the Step 6 tally, the lead runs the gate and pastes its output into the room:

```bash
python3 ~/.claude/skills/akiflow/scripts/council_verify.py <session-dir>
```

It fails on a missing anchor, a REQ quoting nothing the owner wrote, a declared owner/challenger that never posted, a posting agent with no `[RULES]` receipt, a posting agent that never tagged evidence, an unanswered `REMIND-<n>`, and a ledger `REQ-<n>` no item's `covers` names. That last one is the only check aimed at the lead itself: `aki-challenger` sees the items the lead cut and therefore cannot see a requirement that never became one, so the gate diffs the ratified ledger against `covers` rather than asking the lead to declare its own omissions — a declaration the omitting party is the worst-placed to make (`agent.B2`). A FAIL is a closure blocker, not a note. It proves presence, never quality — and it deliberately does not require any named seat, because a gate that manufactures a seat gets gamed rather than questioned.

**A reminder from `conduct` blocks what it targets**: the target answers `ACK REMIND-<n>` plus the fix applied, or the lead posts `OVERRULE REMIND-<n> <reason>` — a logged lead judgment, never a default and never the target's own call.

**The lead decides and reports.** Exactly three things escalate: a genuine one-way door (`think.A1`) · anything contradicting `docs/biz/` or documented project design · scope expansion beyond what was asked. A fourth is possible but rare — the room deadlocked on something important *and* the lead cannot break the tie on the merits; present it as a decision with positions, tradeoff and a recommendation, never as an open question handed back. A seat-raised `CONFLICT` is a candidate, not an escalation: it reaches the owner only if it survives `agent.A3`'s kill-tests.

**Doctrine first, always.** Before anything reaches the owner the lead verifies the question is not already answered by `docs/biz/`, the project `CLAUDE.md`, or the relevant `docs/arch|feat` — and the escalation cites that search: which files were read and where exactly they fall silent. **Every owner answer becomes doctrine** in the same turn it is applied, so the identical question can never escalate again. An answer left in chat evaporates with the session; asking twice is failing twice.

**The closure rationale answers two one-liners**: *did this achieve what the owner actually asked for* (compared against the anchor, not against the lead's restatement of it), and *why is this the smallest shape that does*. An item that cannot name what was cut — or state that nothing needed cutting — has not faced the subtraction pass. Verification asks "did I do what I said"; adversarial review asks "should this have been done"; neither asks the first question, which is why it is written explicitly here.

## Step 5 — `execute` mode

| Job | Mechanism |
|---|---|
| Implement from the plan | `aki-maker`, given the plan doc path and the checklist items in its prompt — the plan doc *is* the continuity mechanism, since no subagent inherits the lead's context |
| Mechanical fan-out | `aki-hands` on the cheapest capable tier |
| **Verify** — "did I do what I said?" plus the drift sweep | a subagent given the diff and the closing criteria. The drift sweep is part of verifying, not an extra: every doc, comment, i18n string and CHANGELOG line referencing the changed behavior, reported if it still describes the old one |
| **Adversarial review** — "should this have been done?" | `aki-challenger`, at the tier its frontmatter declares. Contamination is disqualifying — that is what makes the seat work, not the tier |
| **Author user-facing prose** | a separate writer worker on the softest capable writing tier, never the implementer as a side effect, under an anti-fabrication brief: it phrases facts supplied in its prompt and tags anything else ASSUMPTION |

**The one boundary that must never blur.** A reviewer briefed with the lead's self-justifying chain will agree with it — sycophancy given structure, worse than no review because it emits a stamp. `aki-challenger` receives **only the diff, the closing criteria, and the anchor**. What is withheld is the lead's *reasoning*, never the behavior floor: rules are constraints, not justification, so they cannot contaminate a review.

**Parallel writers need isolation** (`isolation: "worktree"`) — it costs setup time and disk per agent, so a lone implementer or a read-only sweep does not get one. **Do not stall the roster on its slowest member**: wait for a whole stage only when the next stage genuinely needs every result together. **A truncated scope must be stated** — capping at top-N or sampling is allowed, doing it silently is not. **Unknown-size discovery loops until it runs dry** (two consecutive rounds surfacing nothing new), never until a fixed count. **Adversarial verifiers get distinct lenses**, not the same question repeated.

**The roster stays convened**, so a blocker goes back into the room rather than onto the owner's desk. A Phase B blocker that invalidates an assumption behind a closed item **reopens that item** — message its owner and challenger, re-close with a new rationale. It is never patched quietly; that is how a plan doc becomes fiction while everyone still cites it.

Even with no room at all, close direct work with a verifier subagent against what was promised, running the same drift sweep. It catches what dominates small tasks: a missed call site, an unupdated CHANGELOG, a "tested" claim that was never run.

## Step 6 — close-out accounting

The roster line declared `model` before a token was spent; this closes that loop with what was actually spent. Mandatory, not an extra the owner requests: a run that cost ten times its worth must not be indistinguishable from one that didn't. `council_verify.py` must already have passed.

```bash
python3 ~/.claude/skills/akiflow/scripts/council_cost.py <session-dir>            # session id read from the room's chat.md stamp
python3 ~/.claude/skills/akiflow/scripts/council_cost.py --session <uuid>         # for a room opened before the stamp existed
```

**One `haiku` subagent runs it and reports the table — never the lead**; reading the raw transcript is the largest bulk-read in the run. It must be a seat that actually holds `Bash` — `aki-conduct`, or a generic subagent — since the retrieval seat the lead reaches for by reflex (`aki-hands`) is `Read, Grep, Glob` only and will return a refusal rather than a table. The script aggregates in-shell and prints tokens only, because per-model prices drift and a hardcoded table in a distributed script would rot: look the price up, bill `input + cache_creation` as input, price `cache_read` and `output` separately. **It measures the Claude meter completely and stops there** — the main session plus every subagent under it, which is exactly the budget Step 1's roster declared. A headless lane (`agy`, or a separate `claude -p`) writes no turn into this transcript and bills another quota: report its own `usage` beside the table if it matters, never summed into it, or the total is in no single currency. The close-out line goes into the run's `docs/plan/` record, beside the roster declaration it reconciles.

## Anti-patterns — all of these are default behaviour unless forbidden by name

1. **A pinned problem statement that paraphrases the owner** → every seat inherits the paraphrase, and the room answers a question nobody asked. R1, and the most expensive failure this skill has actually produced.
2. **Convening a seat because it exists** → a seat with no surface to act on burns a full agent's budget on artifacts nobody will read again. R2.
3. **Opening the room before the checklist exists** → agents circling an uncut question at many times the cost of solving it alone.
4. **Briefing the adversarial reviewer with the lead's reasoning chain** → a rubber stamp wearing a review's clothes.
5. **Spawning the roster across several turns** → one-way channels; agents deaf without knowing it.
6. **Agreement with no falsifier** → manufactured consensus. Three prior agents agreeing is not evidence.
7. **Handing the owner an open question instead of a decision, or escalating past doctrine** → the council did not do its job, and the owner pays attention twice for one question.
8. **Nesting a subagent for context-dependent work** → the grandchild invents and the parent cannot tell. One level deep, mechanical only: if the task cannot be written in under 200 words with no project context, it is not a nested-spawn task.
9. **Merging `chat.md` into `checklist.md`** → the argument buries the conclusion, and execution inherits conclusions stripped of their reasons.
10. **Re-probing a CLI whose flags are already recorded** → one run spent three calls re-learning what `references/harness-facts.md` already stated. Liveness and quota are probeable; capability is not.
11. **Lead writing `chat.md` content on behalf of a seat** → the lead ran the council scripts correctly but then authored the turn content that only a real subagent should produce. `council_verify.py` catches this as `ghost-seats`, but the budget is already spent. The lead opens the room, decomposes, spawns — it never *is* a seat. Same severity as #1: a council whose seats are the lead in costume answers nothing the lead alone could not, at many times the cost.

## Harness notes

**Before choosing sequential or parallel execution, the lead checks its own tool set.** If `invoke_subagent` (or `Agent` on Claude Code) is available, the roster is spawned as real concurrent subagents — the fallback sequential path does not apply. If no spawn mechanism exists (headless `claude -p`, a read-only subagent), the sequential single-session path applies. This check is mandatory; defaulting to sequential when a spawn tool is present is anti-pattern #11.

- **Claude Code:** roster in one batch; `SendMessage` for peer challenge and for resuming completed seats; continuity travels as the plan doc or diff named in the prompt, since the one `subagent_type` that inherits session history (`fork`) is gated off by default; `isolation: "worktree"` for concurrent writers. An agent the *user* stopped refuses to resume via message and must be resumed from its own transcript panel — do not respawn a duplicate.
- **Headless (`claude -p`):** nobody can answer an escalation or a permission prompt. Record it as `BLOCKED: needs owner` in `checklist.md` and continue the other items — never guess what the owner would have wanted.
- **Antigravity / AGY:** supports native subagents via `invoke_subagent`. When `/akiflow` is invoked with multiple experts or dispatch lanes, the lead MUST spawn the roster via `invoke_subagent` concurrently in one batch. Simulating multiple seats sequentially in a single session context without spawning real subagents is strictly forbidden (role collapse / self-approval violation). Where AGY is reachable from a Claude Code lead, it may also serve as a wide-context worker substrate (`aki-hands`).
  - **Script paths in this skill's literal commands are written for Claude Code** (`~/.claude/skills/akiflow/scripts/...`). This file is deployed byte-identical to `~/.gemini/config/skills/` too (`docs/ref/agent-skills-standard.md`), so either root's path runs the same script under Antigravity/agy. **Run the command exactly as written above** — the installer pre-allows both roots in both renderings (expanded and tilde-literal), so the form you copy is never what gets denied. Background: agy's matcher compares command strings literally, with no glob or tilde expansion, so a rule and a command that render the same path differently do not match — which is why the pre-allow covers every rendering instead of asking you to normalize one (`docs/ref/cli-permission-allowlist-standard.md` §1.2).

Verified harness facts behind every flag named here: `references/harness-facts.md` — its § Worker invocation quick-facts is the lookup table (literal command, read-only mechanism, silent failure per lane); the rest of the file is why. Design record: `docs/arch/akiflow.md` in the akidevrule repo.

## Invocation scope

Explicit invoke only — akirule never auto-triggers this skill. When ordinary work makes the three activation conditions obvious, suggest `/akiflow` in a single line; do not self-invoke.
