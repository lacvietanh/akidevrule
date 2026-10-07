#!/usr/bin/env python3
# scythe.py — mechanical lint for the greppable penalty-card classes (RULE-agent-behavior.md §0).
# Detects [WRAP] (hard-wrapped code comments / markdown prose) and [YAP] (oversize comments — flagged "review", never a verdict).
# [FLUFF] (density) and [SKIP] (a skipped mandatory step) are judgment and deliberately out of scope for a script.
# Usage: scythe.py [--all] <file|dir> [...]   A dir expands to its git-tracked files; outside a repo, to find(1).
# Output: [TAG] path:line[-line] | short label      Exit: 0 clean · 1 findings · 2 usage error.
# Past 40 findings (SCYTHE_CAP) output becomes a capped list plus per-tag and per-file counts; --all prints everything.

from __future__ import annotations

import os
import re
import sys
import subprocess
from pathlib import Path

SLASH_EXT = {'ts', 'tsx', 'js', 'jsx', 'mjs', 'rs', 'go', 'c', 'h', 'cc', 'cpp', 'swift', 'kt', 'scss'}
HASH_EXT = {'sh', 'bash', 'py', 'rb', 'toml', 'yaml', 'yml'}
DASH_EXT = {'sql'}
HTML_EXT = {'vue', 'html'}

# Directive/exempt prefixes inside a comment's text portion — mirrors the awk exempt list.
_EXEMPT_TEXT = re.compile(
    r'^(@|!|#|eslint|prettier|biome|ts-|type:|noqa|pylint|ruff|shellcheck|fmt:|region|endregion|-{3,}|={3,}|\*)'
)


def _scan_comment_runs(path: str, numbered: list[tuple[int, str]], marker: re.Pattern, in_header: bool) -> list[str]:
    """Comment-run logic shared by whole code files and fenced code blocks inside markdown."""
    findings: list[str] = []

    header = in_header
    rs = 0       # run size (number of comment lines accumulated)
    rstart = 0   # 1-based line number where the run started
    cont = False # True if a lowercase-continuation line was seen

    def flush() -> None:
        nonlocal rs
        if rs == 0:
            return
        if header:
            rs = 0
            return
        if rs >= 3:
            findings.append(f"[YAP] {path}:{rstart}-{rstart + rs - 1} | {rs}-line comment block (review)")
        elif rs == 2 and cont:
            findings.append(f"[WRAP] {path}:{rstart}-{rstart + 1} | wrapped comment (rejoin)")
        rs = 0

    for lineno, raw in numbered:
        m = marker.search(raw)
        if m:
            # Text after the marker, leading spaces/tabs dropped — mirrors the awk marker match's trailing [ \t]* consumption.
            text = raw[m.end():].lstrip(' \t')
            if not text or _EXEMPT_TEXT.match(text):
                flush()
                # blank-ish structural line — do NOT clear header here (matches awk: next skips header=0)
                continue
            if rs == 0:
                rstart = lineno
                cont = False
            rs += 1
            # continuation: second+ line whose text starts with a lowercase letter (awk: /^[a-z]/)
            # Vietnamese multibyte words (được, ở, …) are matched by \p{Ll} — use re.UNICODE default.
            if rs > 1 and re.match(r'^[a-z\u00c0-\u024f\u1e00-\u1eff]', text):
                cont = True
            if len(raw) > 200 and not header:
                findings.append(f"[YAP] {path}:{lineno} | comment {len(raw)} chars (review)")
            continue
        flush()
        if raw.strip():
            header = False

    flush()
    return findings


def _lint_code(path: str, marker: re.Pattern) -> list[str]:
    try:
        lines = Path(path).read_text(encoding='utf-8', errors='replace').splitlines()
    except OSError as e:
        print(f"scythe: cannot read {path}: {e}", file=sys.stderr)
        return []
    return _scan_comment_runs(path, list(enumerate(lines, 1)), marker, True)


def _marker_pattern(ext: str) -> re.Pattern | None:
    if ext in SLASH_EXT:
        return re.compile(r'^[ \t]*(//)')
    if ext in HASH_EXT:
        return re.compile(r'^[ \t]*(#)')
    if ext in DASH_EXT:
        return re.compile(r'^[ \t]*(--)')
    if ext in HTML_EXT:
        return re.compile(r'^[ \t]*(//)|(<!--)')
    return None


# --- Markdown detector -------------------------------------------------------

# Fence info strings that name a real language, mapped to the extension whose comment marker they share.
# An untagged fence stays exempt: it usually holds verbatim output, where a "comment" is not authored text.
_FENCE_LANG = {
    'ts': 'ts', 'typescript': 'ts', 'tsx': 'tsx', 'js': 'js', 'javascript': 'js', 'jsx': 'jsx', 'mjs': 'mjs',
    'rs': 'rs', 'rust': 'rs', 'go': 'go', 'golang': 'go', 'c': 'c', 'h': 'h', 'cc': 'cc', 'cpp': 'cpp',
    'c++': 'cpp', 'swift': 'swift', 'kt': 'kt', 'kotlin': 'kt', 'scss': 'scss',
    'sh': 'sh', 'bash': 'sh', 'shell': 'sh', 'zsh': 'sh', 'py': 'py', 'python': 'py', 'rb': 'rb', 'ruby': 'rb',
    'toml': 'toml', 'yaml': 'yaml', 'yml': 'yml',
    'sql': 'sql', 'vue': 'vue', 'html': 'html',
}


def _fence_marker(info: str) -> re.Pattern | None:
    return _marker_pattern(_FENCE_LANG.get(info.lower(), ''))

def _blockish(line: str) -> bool:
    return bool(
        re.match(r'^[ \t]*$', line)
        or re.match(r'^#', line)
        or re.match(r'^[ \t]*\|', line)
        or re.match(r'^>', line)
        or re.match(r'^<', line)
        or re.match(r'^[ \t]{4}', line)
        or re.match(r'^[ \t]*(---+|\*\*\*+|___+)[ \t]*$', line)
    )


def _listitem(line: str) -> bool:
    return bool(re.match(r'^[ \t]*([-*+]|[0-9]+[.)]|[a-z][.)])[ \t]', line))


# sig() classifies the structural marker of a line for the same-marker-run exemption.
# Returns "@", "bracket", "keyline", or "" (no marker → plain prose).
def _sig(line: str) -> str:
    stripped = line.lstrip()
    if stripped.startswith('@'):
        return '@'
    if stripped.startswith('['):
        return 'bracket'
    # One-or-two-word ASCII label closed by a colon (bold optional): **Key:** or Key:
    if re.match(r'^\**[A-Za-z_][A-Za-z0-9_ -]*\**:([ \t]|$)', stripped):
        return 'keyline'
    return ''


# Terminal-punctuation pattern — a line ending with these chars is NOT a wrapped line.
_TERMINAL = re.compile(r"""([.!?:;…→]|-->)[)"'\]*_`]*[ \t]*$""")
_TRAILING_SPACES = re.compile(r'  $')


def _lint_md(path: str) -> list[str]:
    """Detect [WRAP] in markdown/mdx files."""
    findings = []
    try:
        lines = Path(path).read_text(encoding='utf-8', errors='replace').splitlines()
    except OSError as e:
        print(f"scythe: cannot read {path}: {e}", file=sys.stderr)
        return findings

    front = False
    fence = False
    fence_marker: re.Pattern | None = None
    fence_body: list[tuple[int, str]] = []
    prev = ''
    prevset = False

    for lineno, raw in enumerate(lines, 1):
        if lineno == 1 and re.match(r'^---[ \t]*$', raw):
            front = True
            continue
        if front:
            if re.match(r'^---[ \t]*$', raw):
                front = False
            continue
        fm = re.match(r'^[ \t]*(?:```|~~~)[ \t]*([A-Za-z0-9_+#-]*)', raw)
        if fm:
            if fence:
                if fence_marker is not None:
                    findings.extend(_scan_comment_runs(path, fence_body, fence_marker, False))
                fence, fence_marker, fence_body = False, None, []
            else:
                fence, fence_marker, fence_body = True, _fence_marker(fm.group(1)), []
            # A fence is a block boundary: the lines either side of it are not a wrapped pair.
            prevset = False
            continue
        if fence:
            if fence_marker is not None:
                fence_body.append((lineno, raw))
            continue

        if prevset:
            if (
                not _blockish(prev)
                and not _blockish(raw)
                and not _listitem(raw)
                and not _TERMINAL.search(prev)
                and not _TRAILING_SPACES.search(prev)
                # Two adjacent lines with the same non-empty structural marker are a machine-parsed run — exempt.
                and not (_sig(prev) != '' and _sig(prev) == _sig(raw))
            ):
                findings.append(f"[WRAP] {path}:{lineno - 1}-{lineno} | wrapped prose (rejoin)")

        prev = raw
        prevset = True

    return findings


def lint_file(path: str) -> list[str]:
    p = Path(path)
    if p.suffix in ('.md', '.mdx'):
        return _lint_md(path)
    ext = p.suffix.lstrip('.')
    pat = _marker_pattern(ext)
    if pat is None:
        return []
    return _lint_code(path, pat)


def collect_files(target: str) -> list[str]:
    p = Path(target)
    if p.is_file():
        return [str(p)]
    if p.is_dir():
        try:
            result = subprocess.run(
                ['git', '-C', str(p), 'ls-files'],
                capture_output=True, text=True, check=True
            )
            base = str(p).rstrip('/')
            out = []
            for f in result.stdout.splitlines():
                full = f"{base}/{f}"
                if Path(full).is_file():
                    out.append(full)
            return out
        except (subprocess.CalledProcessError, FileNotFoundError):
            # Not a git repo or git not available — fall back to find.
            return [str(f) for f in p.rglob('*') if f.is_file()]
    print(f"scythe: no such path: {target}", file=sys.stderr)
    sys.exit(2)


def main() -> None:
    show_all = False
    cap = int(os.environ.get('SCYTHE_CAP', '40'))
    targets: list[str] = []

    for arg in sys.argv[1:]:
        if arg == '--all':
            show_all = True
        else:
            targets.append(arg)

    if not targets:
        print("usage: scythe.py [--all] <file|dir> [...]", file=sys.stderr)
        sys.exit(2)

    # Overlapping targets are a normal call shape, so identity is the real path: one file, one entry.
    seen: dict[str, str] = {}
    for t in targets:
        for f in collect_files(t):
            seen.setdefault(os.path.realpath(f), f)

    all_findings: list[str] = []
    for f in seen.values():
        all_findings.extend(lint_file(f))

    if not all_findings:
        sys.exit(0)

    total = len(all_findings)

    if not show_all and total > cap:
        for line in all_findings[:cap]:
            print(line)
        print(f"--- {total - cap} more findings suppressed ---")

        # Per-tag totals (first space-delimited token is the tag, e.g. "[WRAP]").
        tag_counts: dict[str, int] = {}
        for line in all_findings:
            tag = line.split()[0]
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
        parts = '  '.join(f"{t} {c}" for t, c in tag_counts.items())
        print(f"{parts}  (total {total})")

        # Worst-5 files: extract path by stripping ":digits..." suffix from the second token.
        print("worst files:")
        file_counts: dict[str, int] = {}
        for line in all_findings:
            tokens = line.split()
            if len(tokens) >= 2:
                file_path = re.sub(r':[0-9].*', '', tokens[1])
                file_counts[file_path] = file_counts.get(file_path, 0) + 1
        worst = sorted(file_counts.items(), key=lambda x: -x[1])[:5]
        for file_path, count in worst:
            print(f"{count:6d}  {file_path}")
        print("Narrow the path, or pass --all for every finding.")
    else:
        for line in all_findings:
            print(line)

    sys.exit(1)


if __name__ == "__main__":
    main()
