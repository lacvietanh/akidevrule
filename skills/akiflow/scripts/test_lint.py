#!/usr/bin/env python3
# test_lint.py — mechanical detectors for the test-file failure shapes RULE-test.md owns (test.D1); each tag names the item it serves.
# Usage: test_lint.py [--all] <path|dir> [...]   A dir expands to its git-tracked files matching the test-path signature (the aki-route-guard one); a file is linted as given.
# Output: [TAG] path:line | short label      Exit: 0 clean · 1 any CERTAIN tag · 2 usage error.   Same grammar as scythe.py and release_lint.py.
# CERTAIN (verdicts): [TMPLIT] temp dir or file created at a literal /tmp path (B3) · [CLEANUP] a file that creates a temp dir and contains no removal call, unless the repo configures a suite preload (B2) · [EXIT] process.exit/sys.exit/os.Exit in a test (C3).
# SUGGESTED (review): [CLEANUP-FINALLY] removal present but no finally/after hook (B3) · [SLEEP] fixed sleep (C3) · [VACUOUS] assertion whose only argument is Array.isArray, typeof === 'function' or a bare identifier (C2) · [AMBIENT] an if on env/filesystem/platform state with an assertion or continue under it (C2) · [HOMEREAD] real HOME read with no preload and no restored override (B1) · [NET] literal non-loopback URL fetched in the default suite (B1) · [PORT] fixed or random-range port (B1) · [SRCPIN] a project source file read by a test (C1) · [HISTORY] change-history comment (A3).

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

TEST_NAME = re.compile(r'\.(test|spec)\.[a-z]+$|_test\.[a-z]+$|^test_.*\.py$|^conftest\.py$')
TEST_DIR = re.compile(r'(^|/)(test|tests|__tests__|spec)/')
CODE_EXT = {'.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.go', '.rs', '.sh'}
CERTAIN = {'TMPLIT', 'CLEANUP', 'EXIT'}

TMPLIT = re.compile(r'\b(?:mkdtemp(?:Sync)?|mkdir(?:Sync)?|writeFile(?:Sync)?|open|join|makedirs|TemporaryDirectory|NamedTemporaryFile|mkdtemp)\(\s*[\'"]/tmp')
TMP_CREATE = re.compile(r'\b(?:mkdtemp(?:Sync)?|tempfile\.mkdtemp)\(')
TMP_REMOVE = re.compile(r'\b(?:rm(?:Sync)?|rmdir(?:Sync)?|rimraf|rmtree|RemoveAll|unlink(?:Sync)?)\(|\brm\s+-rf?\b')
FINALLY = re.compile(r'\bfinally\b|\bafter(?:Each|All)?\s*\(|\bt\.after\s*\(|\bt\.Cleanup\s*\(|\baddfinalizer\b|\bdefer\s+')
EXIT = re.compile(r'\b(?:process\.exit|sys\.exit|os\.Exit)\s*\(')
SLEEP = re.compile(r'\bsetTimeout\(\s*\w+\s*,\s*\d+\s*\)|\btime\.sleep\(|^\s*sleep\s+\d')
VACUOUS = re.compile(r'\b(?:assert(?:\.ok|\.equal|\.strictEqual)?|expect)\(\s*(?:Array\.isArray\([^()]*\)|typeof\s+[\w.$]+\s*===?\s*[\'"]function[\'"])\s*[,)]|\bassert(?:\.ok)?\(\s*[A-Za-z_$][\w$]*\s*[,)]|^\s*assert\s+[A-Za-z_]\w*\s*$')
AMBIENT_IF = re.compile(r'^\s*(?:if|elif)\b.*\b(?:process\.env|existsSync|process\.platform|homedir|which\b|PATH\b|os\.environ|os\.path\.exists|sys\.platform|shutil\.which)')
ASSERT_OR_SKIP = re.compile(r'\bassert\b|\bexpect\(|^\s*continue\b|^\s*return\b|\bt\.Skip')
HOMEREAD = re.compile(r'\bos\.homedir\(\)|\bhomedir\(\)|\bPath\.home\(\)|expanduser\(\s*[\'"]~|process\.env\.HOME\b|os\.environ(?:\.get)?\(?\[?[\'"]HOME[\'"]|\$HOME\b')
HOME_OVERRIDE = re.compile(r'process\.env\.HOME\s*=|os\.environ\[[\'"]HOME[\'"]\]\s*=|monkeypatch\.setenv\(\s*[\'"]HOME')
NET = re.compile(r'\b(?:fetch|request|axios(?:\.\w+)?|requests\.\w+|http\.Get|urlopen)\(\s*[\'"`]https?://(?!(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|example\.(?:com|org|net)|test\b))')
PORT = re.compile(r'\.listen\(\s*[1-9]\d*\b|(?i:port)[^\n]*Math\.random\(\)|Math\.random\(\)[^\n]*(?i:port)')
SRCPIN = re.compile(r'\b(?:readFile(?:Sync)?|open|read_text)\([^)]*[\'"][^\'"]*\.(?:m?js|cjs|tsx?|vue|rs|go|py)[\'"]')
COMMENT = re.compile(r'^\s*(?://|#|/\*|\*)')
HISTORY = re.compile(r'\bFix \d+\b|\b(?!S3\b)S[1-9]\d*\b|\bwas broken\b|\bregression from\b')
PRELOAD_PKG = re.compile(r'"test"\s*:\s*"[^"]*(?:--import|--require|\s-r\s)')
PRELOAD_CFG = re.compile(r'\bsetupFiles(?:AfterEach)?\b|\bglobalSetup\b')


def is_test_path(rel: str) -> bool:
    name = rel.rsplit('/', 1)[-1]
    return bool(TEST_NAME.search(name) or TEST_DIR.search(rel)) and Path(name).suffix in CODE_EXT


def expand(target: str) -> list[Path]:
    p = Path(target)
    if p.is_file():
        return [p]
    try:
        out = subprocess.run(['git', '-C', str(p), 'ls-files', '-z'], capture_output=True, check=True).stdout.decode('utf-8', 'replace')
        rels = [r for r in out.split('\0') if r]
    except (subprocess.CalledProcessError, FileNotFoundError):
        rels = [str(f.relative_to(p)) for f in p.rglob('*') if f.is_file() and 'node_modules' not in f.parts and '.git' not in f.parts]
    return [p / r for r in rels if is_test_path(r)]


def repo_root(f: Path) -> Path:
    for d in [f.parent, *f.parent.parents]:
        if any((d / m).exists() for m in ('package.json', 'pyproject.toml', 'go.mod', 'Cargo.toml', '.git')):
            return d
    return f.parent


_preload: dict[Path, bool] = {}


def has_preload(root: Path) -> bool:
    """A suite-level isolation preload (test.B2) makes per-file cleanup and HOME tags moot."""
    if root in _preload:
        return _preload[root]
    found = False
    pkg = root / 'package.json'
    if pkg.is_file() and PRELOAD_PKG.search(pkg.read_text(encoding='utf-8', errors='replace')):
        found = True
    if not found:
        for cfg in root.glob('*.config.*'):
            if cfg.name.startswith(('vitest', 'jest')) and PRELOAD_CFG.search(cfg.read_text(encoding='utf-8', errors='replace')):
                found = True
                break
    if not found and any(root.rglob('conftest.py')):
        found = True
    _preload[root] = found
    return found


def lint_file(f: Path) -> list[str]:
    try:
        lines = f.read_text(encoding='utf-8', errors='replace').splitlines()
    except OSError:
        return []
    out: list[str] = []
    preload = has_preload(repo_root(f))
    live = '.live.' in f.name
    text = '\n'.join(lines)
    creates = [n for n, l in enumerate(lines, 1) if TMP_CREATE.search(l)]
    removes = bool(TMP_REMOVE.search(text))
    if creates and not removes and not preload:
        out.append(f"[CLEANUP] {f}:{creates[0]} | creates a temp dir and never removes it (test.B3)")
    elif creates and removes and not FINALLY.search(text):
        out.append(f"[CLEANUP-FINALLY] {f}:{creates[0]} | temp dir removed outside finally/after — leaks on failure (test.B3, review)")
    home_hits = [n for n, l in enumerate(lines, 1) if HOMEREAD.search(l)]
    if home_hits and not preload and not (HOME_OVERRIDE.search(text) and FINALLY.search(text)):
        out.append(f"[HOMEREAD] {f}:{home_hits[0]} | reads the real HOME with no preload and no restored override (test.B1, review)")
    for n, l in enumerate(lines, 1):
        if TMPLIT.search(l):
            out.append(f"[TMPLIT] {f}:{n} | literal /tmp path (test.B3)")
        if EXIT.search(l):
            out.append(f"[EXIT] {f}:{n} | exit call truncates the run (test.C3)")
        if SLEEP.search(l):
            out.append(f"[SLEEP] {f}:{n} | fixed sleep (test.C3, review)")
        if VACUOUS.search(l):
            out.append(f"[VACUOUS] {f}:{n} | assertion that any non-empty output passes (test.C2, review)")
        if AMBIENT_IF.search(l) and any(ASSERT_OR_SKIP.search(x) for x in lines[n:n + 10]):
            out.append(f"[AMBIENT] {f}:{n} | assertion under a machine-state condition (test.C2, review)")
        if not live and NET.search(l):
            out.append(f"[NET] {f}:{n} | live URL in the default suite (test.B1, review)")
        if PORT.search(l):
            out.append(f"[PORT] {f}:{n} | fixed or random-range port (test.B1, review)")
        if SRCPIN.search(l):
            out.append(f"[SRCPIN] {f}:{n} | reads a source file instead of calling it (test.C1, review)")
        if COMMENT.match(l) and HISTORY.search(l):
            out.append(f"[HISTORY] {f}:{n} | change-history comment (test.A3, review)")
    return out


def main() -> None:
    show_all = '--all' in sys.argv
    targets = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not targets:
        print("usage: test_lint.py [--all] <path|dir> [...]", file=sys.stderr)
        sys.exit(2)
    files: list[Path] = []
    for t in targets:
        files.extend(expand(t))
    findings: list[str] = []
    for f in files:
        findings.extend(lint_file(f))
    certain = [x for x in findings if x.split(']')[0][1:] in CERTAIN]
    findings.sort(key=lambda x: (x.split(']')[0][1:] not in CERTAIN, x))
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
        print('  '.join(f"{t} {c}" for t, c in counts.items()) + f"  (total {len(findings)}, files {len(files)})")
    sys.exit(1 if certain else 0)


if __name__ == '__main__':
    main()
