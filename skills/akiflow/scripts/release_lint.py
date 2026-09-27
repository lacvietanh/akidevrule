#!/usr/bin/env python3
# release_lint.py — mechanical checks for the release record surfaces RULE-release.md owns: CHANGELOG.md shape (C1) and releases.json parity + highlight (C2–C4).
# Usage: release_lint.py [--latest] [--all] <project-dir|CHANGELOG.md> [...]   --latest checks only the newest version block (the B7 gate scope).
# Output: [TAG] path:line | short label      Exit: 0 clean · 1 findings · 2 usage error.   Same grammar as scythe.py.
# Verdict tags: [ORDER] sections out of canonical order · [SECTION] heading outside the closed vocabulary or duplicated · [LEVEL] version/section heading at the wrong level · [PARITY] version present in one surface and absent from the other · [TYPE] releases.json type outside new|improved|fixed|internal.
# Review tag (never a verdict): [HILITE] a version with a `new` change and no `highlight: true` line, more than two highlighted lines, a highlight not first, or a highlight on a `fixed`/`internal` line — a candidate for C2 judgment.

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SECTIONS = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']
TYPES = {'new', 'improved', 'fixed', 'internal'}
HIGHLIGHT_MAX = 2

_VERSION = re.compile(r'^(#+)\s*\[?(v?\d+\.\d+\.\d+[^\]\s]*|Unreleased)\]?', re.I)
_SECTION = re.compile(r'^(#+)\s*(\S+)')


def _changelog_blocks(lines: list[str]) -> list[dict]:
    """Split a CHANGELOG into version blocks: {version, line, level, sections:[(name, line, level)]}."""
    blocks: list[dict] = []
    fence = False
    for n, raw in enumerate(lines, 1):
        if raw.lstrip().startswith(('```', '~~~')):
            fence = not fence
            continue
        if fence or not raw.startswith('#'):
            continue
        vm = _VERSION.match(raw)
        if vm and (not blocks or len(vm.group(1)) <= 2 or blocks[-1]['level'] == len(vm.group(1))):
            blocks.append({'version': vm.group(2), 'line': n, 'level': len(vm.group(1)), 'sections': []})
            continue
        sm = _SECTION.match(raw)
        if sm and len(sm.group(1)) == 2 and sm.group(2) != 'Changelog':
            blocks.append({'version': None, 'line': n, 'level': 2, 'sections': [], 'heading': raw.lstrip('# ').strip()})
            continue
        if sm and blocks and blocks[-1]['version'] and len(sm.group(1)) > blocks[-1]['level']:
            blocks[-1]['sections'].append((sm.group(2).strip('*').rstrip(':'), n, len(sm.group(1))))
    return blocks


def lint_changelog(path: Path, latest: bool) -> tuple[list[str], list[str]]:
    lines = path.read_text(encoding='utf-8', errors='replace').splitlines()
    blocks = _changelog_blocks(lines)
    if latest:
        blocks = blocks[:1]
    findings: list[str] = []
    for b in blocks:
        if b['version'] is None:
            findings.append(f"[SECTION] {path}:{b['line']} | H2 `{b['heading']}` is not a version heading")
            continue
        if b['level'] != 2:
            findings.append(f"[LEVEL] {path}:{b['line']} | version heading at H{b['level']}, expected `## [{b['version']}] - <date>`")
        names = [s[0] for s in b['sections']]
        seen: set[str] = set()
        for name, n, lvl in b['sections']:
            if name not in SECTIONS:
                findings.append(f"[SECTION] {path}:{n} | `{name}` is not one of {', '.join(SECTIONS)}")
            elif name in seen:
                findings.append(f"[SECTION] {path}:{n} | `{name}` repeated inside {b['version']}")
            elif lvl != b['level'] + 1:
                findings.append(f"[LEVEL] {path}:{n} | section at H{lvl}, expected H{b['level'] + 1}")
            seen.add(name)
        std = [x for x in names if x in SECTIONS]
        if std != sorted(dict.fromkeys(std), key=SECTIONS.index) and len(set(std)) == len(std):
            expected = ', '.join(sorted(std, key=SECTIONS.index))
            findings.append(f"[ORDER] {path}:{b['line']} | {b['version']}: {', '.join(std)} — expected {expected}")
    return findings, [b['version'].lstrip('v') for b in blocks if b['version']]


def lint_releases(path: Path, changelog_versions: list[str], latest: bool) -> list[str]:
    findings: list[str] = []
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as e:
        return [f"[PARITY] {path}:1 | unreadable releases.json ({e})"]
    items = data if isinstance(data, list) else data.get('releases', [])
    if latest:
        items = items[:1]
    text = path.read_text(encoding='utf-8').splitlines()

    def line_of(version: str) -> int:
        for n, raw in enumerate(text, 1):
            if f'"{version}"' in raw:
                return n
        return 1

    json_versions = [str(r.get('version', '')).lstrip('v') for r in items]
    for v in [x for x in changelog_versions if x.lower() != 'unreleased']:
        if v not in json_versions:
            findings.append(f"[PARITY] {path}:1 | CHANGELOG version {v} has no releases.json entry")
    for r, v in zip(items, json_versions):
        n = line_of(v)
        if v not in changelog_versions:
            findings.append(f"[PARITY] {path}:{n} | releases.json version {v} has no CHANGELOG entry")
        changes = r.get('changes', [])
        for c in changes:
            if c.get('type') not in TYPES:
                findings.append(f"[TYPE] {path}:{n} | {v}: type `{c.get('type')}` not in {', '.join(sorted(TYPES))}")
        hl = [c for c in changes if c.get('highlight')]
        if not hl and any(c.get('type') == 'new' for c in changes):
            findings.append(f"[HILITE] {path}:{n} | {v}: has a `new` change but no `highlight: true` (review)")
        if len(hl) > HIGHLIGHT_MAX:
            findings.append(f"[HILITE] {path}:{n} | {v}: {len(hl)} highlighted lines, more than {HIGHLIGHT_MAX} (review)")
        if hl and changes and not changes[0].get('highlight'):
            findings.append(f"[HILITE] {path}:{n} | {v}: highlighted line is not the first change (review)")
        for c in hl:
            if c.get('type') in ('fixed', 'internal'):
                findings.append(f"[HILITE] {path}:{n} | {v}: highlight on a `{c.get('type')}` change, C2 allows only new/improved (review)")
    return findings


def lint_target(target: str, latest: bool) -> list[str]:
    p = Path(target)
    changelog = p if p.is_file() else p / 'CHANGELOG.md'
    if not changelog.is_file():
        print(f"release_lint: no CHANGELOG.md at {target}", file=sys.stderr)
        sys.exit(2)
    findings, versions = lint_changelog(changelog, latest)
    releases = changelog.parent / 'app' / 'data' / 'releases.json'
    if releases.is_file():
        findings.extend(lint_releases(releases, versions, latest))
    return findings


def main() -> None:
    latest = '--latest' in sys.argv
    show_all = '--all' in sys.argv
    targets = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not targets:
        print("usage: release_lint.py [--latest] [--all] <project-dir|CHANGELOG.md> [...]", file=sys.stderr)
        sys.exit(2)
    findings: list[str] = []
    for t in targets:
        findings.extend(lint_target(t, latest))
    if not findings:
        sys.exit(0)
    cap = 40
    shown = findings if show_all or len(findings) <= cap else findings[:cap]
    for line in shown:
        print(line)
    if len(shown) < len(findings):
        counts: dict[str, int] = {}
        for line in findings:
            tag = line.split()[0]
            counts[tag] = counts.get(tag, 0) + 1
        print(f"--- {len(findings) - cap} more findings suppressed ---")
        print('  '.join(f"{t} {c}" for t, c in counts.items()) + f"  (total {len(findings)})")
    sys.exit(1)


if __name__ == '__main__':
    main()
