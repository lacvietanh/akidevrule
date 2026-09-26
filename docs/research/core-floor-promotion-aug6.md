# Promoting coding and design-core to the core floor: reversing a three-day-old decision

Status: amended 2026-09-26

**Start time:** 2026-08-06

## Initial purpose

The owner opened with a process complaint rather than a content one: *"sao tôi cứ liên tục phải nhắc 'lại vi phạm akirule'"* — asking which skill or short keyword would stop the reminding. Asked which violations recur, the answer was `wrap`, `yap`, `pattern`, "đủ loại", followed by the sentence that framed the whole session: *"mà tôi cố dựng lên bộ rule này"*. The corpus is large, carefully addressed, and still being violated by the agent that is supposed to be bound by it.

The complaint is therefore about the delivery mechanism, not about rule text, and the first job was to separate the failure modes hiding under one label.

## Strategy

1. Split the reported violations by **why** they were possible, not by what they were.
2. Fix only the class the owner selected, at the mechanism tier, and leave the other class explicitly open.
3. Check the reversal against the decision that had rejected this same move three days earlier, and record the disagreement rather than quietly overwriting it.

## The diagnosis

Two failure classes were collapsed under "vi phạm akirule", and they have opposite fixes:

| Class | Example cards | Was the rule in context? | What a fix has to change |
|---|---|---|---|
| **Compliance** | `[WRAP]`, `[YAP]` | Yes — `RULE-agent-behavior.md` §0 is `@`-imported into every session | Nothing in the text. The rule was present and read. Only a mechanism running outside the model's judgment can change the outcome |
| **Loading** | `pattern` (`design.A2` Rule of Three, `ui.A1` tier ladder) | Usually not | Move the file out of the router into an `@` import |

The second class is the one that made the corpus look disobeyed when it was merely absent. `payload/index.md` labelled `RULE-coding.md` *"Contextual (high-sensitivity — default ON for any code work)"* and `RULE-design-core.md` *"default ON with coding for any structural work"* — but "default ON" described an intention held by a file that only loads after the model has already decided to invoke `akirule`. A router that must be voluntarily invoked cannot make anything default. The phrase read as a guarantee to every human who checked the manifest, including its author.

Third observation, worth separating: the phrase the owner was typing — "vi phạm akirule" — cannot work even when the rule *is* loaded. `akirule` names a router over nineteen files, so the correction points at no rule address, and the shape of the reply it invites is an apology plus a restatement. §0's penalty cards already exist to solve exactly this (one token → one root rule → a mandatory reply consisting of the fix, not of the rule). The owner was not using them.

## Decision

Promote `RULE-coding.md` and `RULE-design-core.md` to `@` imports in `claude/CLAUDE.md`, joining `index.md` and `RULE-agent-behavior.md`. Four core files, guaranteed by the harness, no model decision anywhere in the path.

The owner chose this option explicitly over two alternatives offered in the same turn (a `PostToolUse` lint hook; new penalty cards for the uncovered violation classes), and asked one question about the hook's cost before choosing — answered: `scythe.sh` takes a file argument and a hook receives the `file_path` of the tool call that just ran, so it lints one file per edit, never the repo.

**The cost is real and was accepted knowingly:** ~16.7 KB across the two files enters every session, including sessions that touch no code at all, on top of the ~31 KB already spent by the existing two. That is the price of the guarantee, and it is stated in all three places a reader might check rather than buried in a changelog.

**Not extended to Antigravity.** `install.sh`'s `AG_RULE_MAP` keeps both files at `model_decision`, because that installer carries a documented constraint Claude Code does not have: Antigravity silently truncates customizations past an internal budget, so `always_on` is rationed to behavior rules. Promoting two more files there risks losing the whole set silently — a worse failure than best-effort routing. The two surfaces now deliberately disagree, and the reason is written at the constraint, not in a memory.

**`RULE-ui-pattern.md` deliberately not promoted**, even though `pattern` was one of the three violations named. It already loads on file extension alone (`.vue`/`.css`), which is the strongest signal the router has, and the measured CSS sprawl in `ui-css-minimization-aug4.md` happened *with the file in context* — making it a compliance failure, not a loading one, and therefore untouched by this fix.

## Reversal of a recorded decision

`akirule-akiflow-upgrade-aug3.md` (three days earlier) explicitly rejected core-floor placement: *"owner chose to keep core small; revisit only if main-thread (non-akiflow) verbosity persists after this round"* — with a falsifier attached: *"still reminding >~2×/week after two weeks → escalate placement"*.

The falsifier fired early. Three days, not two weeks, and the owner's report is qualitative ("liên tục") rather than a counted rate — so this is an owner-initiated escalation on a live signal, not a measured threshold crossing. Recording that honestly matters: if the promotion later proves to have bought nothing, the evidence it was made on was weaker than the standard the earlier decision set for itself.

Two things also changed underneath that rejection. The August 3 decision was made when density enforcement lived at the akiflow floor clause — a tier that reaches subagents but never touches an ordinary main-thread session, which is where the owner actually works. And the same document's rejection of a lint hook (*"the property is content understanding, not mechanical format; a hook is too rigid"*) was written before `scythe.sh` existed; that script settled the boundary by carving out the mechanically detectable subset (`[WRAP]`, `[YAP]`) and leaving `[FLUFF]` to judgment, which is precisely the distinction the rejection was protecting.

**Reopen trigger:** if the owner still reports `pattern`-class violations after two weeks with both files core-loaded, the cause is compliance rather than loading, and no further promotion will help — the next move is the enforcement tier (hook), not more context.

## Follow-up in the same session: a `scythe.sh` false positive that instructed corrupting the loader

Linting the edited files with `scythe.sh` — the detector for the very rule under discussion — flagged the new `@` import block as `[WRAP]` and told the reader to rejoin the lines. Obeying it would merge four import directives into one line and silently stop three of the four core rules from loading. `agent.C3` names this exact hazard (`@import`/include directives, one path per line, never safe to merge), so the detector was contradicting the rule it enforces.

The owner asked for a principled exclusion rather than a patch for `@`. The cause is that the markdown detector was a **blacklist** — it enumerated known block structures and treated everything unrecognized as prose, so an unfamiliar shape produced a confident verdict. The comment detector in the same script had it right all along, requiring the second line to look like a continuation before claiming anything.

Four candidate rules were built and measured against a frozen list of 1,244 markdown files plus a hand-built fixture covering the wrap archetypes. Three failed on evidence:

| Rule | Why it failed |
|---|---|
| Second line must start with an ASCII lowercase letter | Vietnamese continuations start with multibyte characters (`được`, `ở`) that `[a-z]` cannot match in mawk; caught 1 of 4 fixture wraps |
| Both lines must have ≥3 whitespace tokens | The tail of a wrapped paragraph is often one or two words (`tagging.`, `behavior.`); cost 664 real detections |
| Both lines share any leading punctuation | Backtick and `**` open prose constantly in this corpus; cost ~2,000 real detections |

The rule that survived: **two adjacent lines carrying the same *directive* marker are a machine-parsed run, never wrapped prose** — because wrapped prose does not repeat a marker, while an `@import` block, a badge/link list, and a `Status:`/`Owner:`/`Created:` metadata header all do. Markers are restricted to three shapes (`@`, a leading `[`, and an ASCII label of one or two words closed by a colon and whitespace); a fourth, looser label pattern was rejected after measurement showed `file.ts:123` citations firing it and swallowing genuine wraps in code-heavy Vietnamese docs.

Result on the frozen corpus: **0 findings gained, 208 of 9,653 dropped (2.2%)**, and every dropped finding inspected across two independent slices was structural — badge runs, markdown link lists, YAML-ish checklist keys, document metadata headers, the import block itself. The fixture keeps all four wrap archetypes, including the Vietnamese and capitalized-continuation cases that the discarded rules lost.

**Two methodology errors are on record because both produced confident wrong numbers.** Redirecting the detector's stderr to `/dev/null` hid a mawk `REcompile()` panic on an interval regex (`{1,20}`, unsupported in mawk 1.3.4), so a total failure read as "zero findings — very clean". And two runs of the *same* `find` over `~/aki` returned different file sets, because live git worktrees under it changed between invocations, which made every early before/after comparison meaningless. Both were caught by an impossible result — a strictly-narrower rule reporting *more* findings than the original — not by suspicion. Any later change to this script should freeze its file list first and never discard the detector's stderr.

## Still open

The compliance class is untouched. `[WRAP]` and `[YAP]` were being violated with the rule in context and remain so after this change; nothing here addresses them. The `PostToolUse` hook over `scythe.sh` is the standing candidate and was neither accepted nor rejected in this session — the owner asked its cost, was told, and chose the other option first.

## Edits applied

- `claude/CLAUDE.md` — two `@` imports added; the "nothing else is guaranteed" paragraph no longer names `RULE-coding.md` as its example of an unguaranteed file
- `payload/index.md` — both manifest Tier cells changed to `Core — @ import`; the two-files paragraph rewritten as four, with the reasoning
- `skills/akirule/SKILL.md` — the guarantee paragraph lists four files; both Tier 1 signal blocks replaced by a not-routed note that forbids re-adding them (a signal block would now only cause a redundant `Read`); the load-confirmation example no longer prints a core file
- `skills/akihelp/SKILL.md` — the closing best-effort caveat names four guaranteed files
- `README.md` — core paragraph, Tier 1 list, and the `akirule` row (which had claimed the skill "loads core rules always" — it never did and now visibly does not)
- `docs/arch/rule-delivery-architecture.md` — the diagram edge labelled `@import Tier 1` on the skills→rules arrow was wrong in both halves; skills `Read` on signal match, `CLAUDE.md` `@`-imports

## Cross-references

- `docs/research/akirule-akiflow-upgrade-aug3.md` — the decision reversed here, and the falsifier that authorized the reversal
- `docs/research/penalty-cards-scythe-aug4.md` — the `[WRAP]`/`[YAP]`/`[FLUFF]` vocabulary the owner should be using instead of "vi phạm akirule", and the detector that makes two of the three mechanical
- `docs/research/ui-css-minimization-aug4.md` — the precedent for the distinction this session turns on: a rule violated *while loaded* is not a routing problem

## Amendments

- 2026-09-26 · § "Not extended to Antigravity": the constraint is not truncation but one shared budget of about 43 KB across all `always_on` rule files, past which a whole file is dropped silently, largest first; `model_decision` rules are never inlined and have no size limit. Measured in `rule-delivery-force-load-sep25.md`. The decision to keep `coding` and `pattern` at `model_decision` stands: promoting them (14.6 KB + 8 KB on top of 21.6 KB) would exceed the budget and evict the behavior rule.
