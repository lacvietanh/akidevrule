#!/usr/bin/env python3
# ship_gate.py — refuses push/deploy when an /akiship run's B7 receipt is incomplete or holds an unverified flow (RULE-release.md B7 fail-closed contract, step 7; B8).
# Usage: ship_gate.py <receipt.md>   The receipt is the run's report block written to a scratchpad file before Phase 3 step 4 (skills/akiship/SKILL.md § Report).
# Receipt grammar: one line per gate step `S<n> PASS|FIXED|FAIL|N/A — <evidence>` for S0–S8; self-interrogation answers as lines `(1)`–`(4)`; open items as lines starting `Q<n>` / `N<n>`. A leading `- ` or backticks are ignored.
# Output: [TAG] path:line | short label      Exit: 0 push allowed · 1 push refused · 2 usage error.   Same grammar as scythe.py and release_lint.py.
# Tags: [MISSING] a step or self-interrogation answer with no line (NOT RUN = FAIL) · [FAIL] a step scored FAIL · [EVIDENCE] a step with no evidence after the dash · [HEDGE] PASS/FIXED evidence resting on a forbidden word (should, presumably, probably, looks fine, seems, expected to) · [HOLD] a `Q` item that is unverified.

from __future__ import annotations

import re
import sys
from pathlib import Path

STEPS = range(9)
QUESTIONS = range(1, 5)
HEDGES = re.compile(r'\b(should|presumably|probably|looks fine|seems|expected to)\b', re.I)

_PREFIX = re.compile(r'^\s*(?:[-*]\s+)?`?')
_STEP = re.compile(r'S(\d)`?\s+(PASS|FIXED|FAIL|N/A)\b\s*(?:[—–-]+\s*(.*))?$', re.I)
_ANSWER = re.compile(r'\((\d)\)\s*(.*)$')
_QITEM = re.compile(r'Q\d+\b`?(.*)$')


def check(path: Path) -> list[str]:
    lines = path.read_text(encoding='utf-8', errors='replace').splitlines()
    steps: dict[int, int] = {}
    answers: dict[int, int] = {}
    findings: list[str] = []
    for n, raw in enumerate(lines, 1):
        body = _PREFIX.sub('', raw, count=1)
        if m := _STEP.match(body):
            step, status, evidence = int(m.group(1)), m.group(2).upper(), (m.group(3) or '').strip()
            steps.setdefault(step, n)
            if status == 'FAIL':
                findings.append(f"[FAIL] {path}:{n} | S{step} scored FAIL — fix it before push")
            if len(evidence) < 3:
                findings.append(f"[EVIDENCE] {path}:{n} | S{step} {status} has no evidence after the dash")
            elif status in ('PASS', 'FIXED') and (h := HEDGES.search(evidence)):
                findings.append(f"[HEDGE] {path}:{n} | S{step} {status} rests on `{h.group(0)}` — an unverified claim, never a PASS")
        elif m := _ANSWER.match(body):
            if m.group(2).strip():
                answers.setdefault(int(m.group(1)), n)
        elif (m := _QITEM.match(body)) and 'unverified' in m.group(1).lower():
            findings.append(f"[HOLD] {path}:{n} | unverified touched flow is an open question — push and deploy stay held (B7 step 7)")
    findings += [f"[MISSING] {path}:1 | no S{s} line — a step with no receipt was NOT RUN" for s in STEPS if s not in steps]
    findings += [f"[MISSING] {path}:1 | no self-interrogation answer ({q})" for q in QUESTIONS if q not in answers]
    return findings


def main() -> None:
    targets = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(targets) != 1 or not Path(targets[0]).is_file():
        print("usage: ship_gate.py <receipt.md>", file=sys.stderr)
        sys.exit(2)
    findings = check(Path(targets[0]))
    for line in findings:
        print(line)
    if findings:
        print(f"push refused: {len(findings)} finding(s)")
        sys.exit(1)
    print("push allowed")


if __name__ == '__main__':
    main()
