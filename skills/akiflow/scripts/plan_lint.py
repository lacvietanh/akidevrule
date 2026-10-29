#!/usr/bin/env python3
# plan_lint.py — mechanical checks that a project's plans and doc index agree with what shipped (RULE-docs.md B1, C3; RULE-release.md B7 step 5).
# Usage: plan_lint.py <project-dir> [...]
# Output: [TAG] path:line | short label      Exit: 0 clean · 1 any verdict tag · 2 usage error.   Same grammar as scythe.py and release_lint.py.
# Verdict tags: [DONE] an active plan in docs/plan/ whose every checkbox is ticked, so it belongs in docs/plan/done/ · [OPEN] a plan in docs/plan/done/ that still has an unticked box · [LINK] a docs/index.md link to a file that does not exist · [UNTRACKED] a docs/index.md link to a file git does not track, so a commit would ship the index without it.
# Review tag (never changes the exit code): [CLAIM] the newest CHANGELOG block cites a plan that still has unticked boxes — confirm the entry claims only the ticked items.

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

_BOX = re.compile(r'^\s*[-*+]\s+\[([ xX])\]')
_LINK = re.compile(r'\]\(([^)#\s]+\.md)(?:#[^)]*)?\)')
_PLAN_REF = re.compile(r'(?:docs/)?plan/((?!done/)[\w./-]+\.md)')
_VERSION = re.compile(r'^##\s+\[')


def _boxes(path: Path) -> list[tuple[int, bool]]:
    out: list[tuple[int, bool]] = []
    fence = False
    for n, raw in enumerate(path.read_text(encoding='utf-8', errors='replace').splitlines(), 1):
        if raw.lstrip().startswith(('```', '~~~')):
            fence = not fence
            continue
        m = None if fence else _BOX.match(raw)
        if m:
            out.append((n, m.group(1) != ' '))
    return out


def _tracked(root: Path) -> set[str] | None:
    r = subprocess.run(['git', '-C', str(root), 'ls-files', '-z'], capture_output=True)
    if r.returncode != 0:
        return None
    return {p.decode('utf-8', 'replace') for p in r.stdout.split(b'\0') if p}


def lint_plans(root: Path) -> list[str]:
    plan_dir = root / 'docs' / 'plan'
    findings: list[str] = []
    if not plan_dir.is_dir():
        return findings
    for p in sorted(plan_dir.glob('*.md')):
        boxes = _boxes(p)
        if boxes and all(done for _, done in boxes):
            findings.append(f"[DONE] {p}:1 | all {len(boxes)} items ticked — move to docs/plan/done/")
    for p in sorted((plan_dir / 'done').rglob('*.md')):
        for n, done in _boxes(p):
            if not done:
                findings.append(f"[OPEN] {p}:{n} | unticked item in a done plan — finish it, or move the plan back to docs/plan/")
    return findings


def lint_index(root: Path) -> list[str]:
    index = root / 'docs' / 'index.md'
    if not index.is_file():
        return []
    tracked = _tracked(root)
    findings: list[str] = []
    for n, raw in enumerate(index.read_text(encoding='utf-8', errors='replace').splitlines(), 1):
        for target in _LINK.findall(raw):
            if '://' in target:
                continue
            f = (index.parent / target).resolve()
            if not f.is_file():
                findings.append(f"[LINK] {index}:{n} | {target} does not exist")
                continue
            try:
                rel = f.relative_to(root.resolve()).as_posix()
            except ValueError:
                continue
            if tracked is not None and rel not in tracked:
                findings.append(f"[UNTRACKED] {index}:{n} | {target} exists but is not in git — `git add {rel}` or the commit ships a dead link")
    return findings


def review_changelog(root: Path) -> list[str]:
    changelog = root / 'CHANGELOG.md'
    if not changelog.is_file():
        return []
    lines = changelog.read_text(encoding='utf-8', errors='replace').splitlines()
    starts = [i for i, raw in enumerate(lines) if _VERSION.match(raw)]
    if not starts:
        return []
    end = starts[1] if len(starts) > 1 else len(lines)
    findings: list[str] = []
    seen: set[str] = set()
    for i in range(starts[0], end):
        for name in _PLAN_REF.findall(lines[i]):
            plan = root / 'docs' / 'plan' / name
            if name in seen or not plan.is_file():
                continue
            seen.add(name)
            open_boxes = [n for n, done in _boxes(plan) if not done]
            if open_boxes:
                findings.append(f"[CLAIM] {changelog}:{i + 1} | cites docs/plan/{name}, which has {len(open_boxes)} unticked item(s) (first at line {open_boxes[0]}) — review")
    return findings


def main() -> None:
    targets = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not targets:
        print("usage: plan_lint.py <project-dir> [...]", file=sys.stderr)
        sys.exit(2)
    verdicts: list[str] = []
    reviews: list[str] = []
    for t in targets:
        root = Path(t)
        if not root.is_dir():
            print(f"plan_lint: not a directory: {t}", file=sys.stderr)
            sys.exit(2)
        verdicts += lint_plans(root) + lint_index(root)
        reviews += review_changelog(root)
    for line in verdicts + reviews:
        print(line)
    sys.exit(1 if verdicts else 0)


if __name__ == '__main__':
    main()
