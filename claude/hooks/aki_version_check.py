#!/usr/bin/env python3
"""Shared version-status parser for akidevrule (pattern.A1 SSOT).

Used by both claude/hooks/aki-update-check.py (SessionStart notify hook) and
install.py (--check / inspect_status), so the two never classify the same
CHANGELOG differently. A keep-a-changelog file's *latest released* version is
its first `## [x.y.z]` heading -- the `[Unreleased]` buffer at the top
(release.A5's normal working state) is never a version and must be skipped,
never compared as if it were one. Ported from aki-mcp-sv's
scripts/update-check.js (parseChangelogVersion / cmpSemver) so both projects
compare versions the same way.
"""
import os
import re
import urllib.request

REMOTE_CHANGELOG_URL = "https://raw.githubusercontent.com/lacvietanh/akidevrule/master/CHANGELOG.md"
NETWORK_TIMEOUT = 3  # seconds

STATE_MISSING = "missing"
STATE_CURRENT = "current"
STATE_UPDATE = "update"
STATE_AHEAD = "ahead"
STATE_UNKNOWN = "unknown"

_VERSION_HEADING_RE = re.compile(r"^##\s*\[(\d+\.\d+\.\d+)\]", re.MULTILINE)


def parse_changelog_version(text):
    """First released `## [x.y.z]` heading, skipping `[Unreleased]`. None if absent/unparseable."""
    if not text:
        return None
    m = _VERSION_HEADING_RE.search(text)
    return m.group(1) if m else None


def cmp_semver(a, b):
    """-1/0/1 for a<b / a==b / a>b on 3-part numeric semver. Either side missing -> 0 (no claim)."""
    if not a or not b:
        return 0
    pa, pb = a.split("."), b.split(".")
    for i in range(3):
        x = int(pa[i]) if i < len(pa) else 0
        y = int(pb[i]) if i < len(pb) else 0
        if x != y:
            return -1 if x < y else 1
    return 0


def fetch_remote_changelog(timeout=NETWORK_TIMEOUT):
    """Raw text of the public CHANGELOG.md. None on any network/HTTP failure -- never raises."""
    try:
        req = urllib.request.Request(REMOTE_CHANGELOG_URL, headers={"User-Agent": "aki-update-check"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", "replace")
    except Exception:
        return None


def local_install_present(install_root):
    """True when install_root looks intact enough to compare (CHANGELOG.md and index.md both present)."""
    return (
        os.path.isfile(os.path.join(install_root, "CHANGELOG.md"))
        and os.path.isfile(os.path.join(install_root, "index.md"))
    )


def classify_state(local_present, local_version, remote_version):
    """One of the STATE_* constants -- see README.md "Update notifications" for the full 5-state table."""
    if not local_present:
        return STATE_MISSING
    if remote_version is None:
        return STATE_UNKNOWN
    if local_version is None:
        return STATE_AHEAD
    cmp = cmp_semver(local_version, remote_version)
    if cmp == 0:
        return STATE_CURRENT
    if cmp < 0:
        return STATE_UPDATE
    return STATE_AHEAD
