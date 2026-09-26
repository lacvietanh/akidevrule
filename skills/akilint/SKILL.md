---
name: akilint
description: Mechanical format lint for the penalty-card classes of RULE-agent-behavior.md §0 — hard-wrapped code comments and markdown prose ([WRAP]) and oversize comments ([YAP]) — via the shared scythe.py detector. Deterministic file:line output; judgment stays with the session. Use whenever formatting is in question — the user wants lines or comments checked, complains that text is hard-wrapped or comments are bloated, or calls a penalty card ([WRAP]/[YAP]/[FLUFF]) on recent output.
user-invocable: true
---

# akilint — penalty-card lint

Runs the shared detector — never a model sweep for what a grep settles:

```bash
python3 ~/.claude/skills/akiflow/scripts/scythe.py <file|dir> [...]   # on other CLIs: the same path under that CLI's skills root
```

The script is the SSoT for these detectors — akiflow's `aki-conduct` seat runs the same one, so a card name means the same thing everywhere. Exit code: 0 clean, 1 findings — usable from CI or hooks without parsing.

## Scope — what the script can and cannot claim

- `[WRAP]` — a logical line split across physical lines: a 2-line comment whose second line reads as a lowercase continuation, or a markdown prose line broken mid-sentence. Root rule: `agent.C3`.
- `[YAP]` — a comment block ≥3 lines, or a comment line >200 chars. Always labeled **(review)**: a flag for judgment against `coding.B4`, never an auto-delete verdict — a legitimate long WHY exists and `agent.C3` forbids wrapping it, so length alone convicts nothing.
- `[FLUFF]` (density, `agent.A4`) is content understanding — a script cannot check it and this skill never claims it.

## Protocol

1. Run scythe on the paths in scope. Default scope = the files this session touched or the paths the user named; a repo-wide sweep is proposed in one line first, not assumed (`agent.B1`).
2. Report the findings verbatim — they are already dense coordinates; do not re-narrate them.
3. Fix `[WRAP]` findings directly: rejoining is mechanical (`agent.C3`) — but honor C3's atomic-line cautions: never merge frontmatter fields, one-per-line directives, or any line something parses.
4. Judge each `[YAP]` finding against `coding.B4` before touching it: fix the name/shape first, delete second, keep a genuine WHY (or move an oversize rationale to a doc and leave the reference, `docs.B3`). State in one line what was kept and why.
5. False positives (a legitimate docblock, a keyword list): name them as such in the report — do not silently skip, and do not "fix" them.
