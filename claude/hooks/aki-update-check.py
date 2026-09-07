#!/usr/bin/env python3
"""akidevrule update-check hook (Claude Code SessionStart).

Notify-only. Classifies install status via aki_version_check's shared SSOT
parser -- missing / current / update / ahead / unknown, see README.md
"Update notifications" for the full table -- and prints a systemMessage on
missing/update only.

Design guarantees:
- Fail-silent: any error, missing file, or network problem exits 0 with no
  output, so it can never disrupt a session.
- The "missing" check is a local file-stat, always run and never throttled,
  so a not-installed machine hears about it every session, not once a day.
- The network-dependent check (current/update/ahead/unknown) is throttled at
  most once per THROTTLE_*_HOURS.
- Never auto-updates: it only reports and points at the manual install command.
- No third-party deps: stdlib only (urllib), so it runs anywhere python3 does.
"""
import json
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from aki_version_check import (
    STATE_AHEAD,
    STATE_CURRENT,
    STATE_UNKNOWN,
    classify_state,
    cmp_semver,
    fetch_remote_changelog,
    local_install_present,
    parse_changelog_version,
)

CHANGELOG_URL_HUMAN = "https://github.com/lacvietanh/akidevrule/blob/master/CHANGELOG.md"
REPO_CLONE_URL = "https://github.com/lacvietanh/akidevrule"
THROTTLE_OK_HOURS = 24    # after a definitive result, wait a full day
THROTTLE_FAIL_HOURS = 1   # after offline/timeout, retry sooner so a notice is not lost

HOME = os.path.expanduser("~")
INSTALL_ROOT = os.path.join(HOME, ".aki", "akidevrule")
LOCAL_CHANGELOG = os.path.join(INSTALL_ROOT, "CHANGELOG.md")
SOURCE_REPO_FILE = os.path.join(INSTALL_ROOT, ".source-repo")
THROTTLE_FILE = os.path.join(HOME, ".claude", "hooks", ".aki-update-check")


def silent_exit():
    sys.exit(0)


def check_due():
    """True if it is time to check again (also when the marker is missing/unreadable)."""
    try:
        with open(THROTTLE_FILE) as f:
            return time.time() >= float(f.read().strip())
    except (OSError, ValueError):
        return True


def defer_check(hours):
    """Record the next-allowed check time."""
    try:
        os.makedirs(os.path.dirname(THROTTLE_FILE), exist_ok=True)
        with open(THROTTLE_FILE, "w") as f:
            f.write(str(int(time.time() + hours * 3600)))
    except OSError:
        pass


def split_entries(text):
    """Return [(header, [lines])] for each '## ' section, in file order."""
    entries = []
    cur = None
    for line in text.splitlines():
        if line.startswith("## "):
            cur = (line[3:].strip(), [line])
            entries.append(cur)
        elif cur is not None:
            cur[1].append(line)
    return entries


def read_source_repo():
    try:
        with open(SOURCE_REPO_FILE, encoding="utf-8") as f:
            return f.read().strip()
    except OSError:
        return ""


def update_cmd_for(repo):
    launcher = "py -3 install.py" if os.name == "nt" else "./install.sh"
    if repo:
        return f"cd {repo} && git pull && {launcher}"
    return f"pull the akidevrule repo and run: {launcher}"


def emit(banner, context):
    print(json.dumps({
        "systemMessage": banner,
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": context,
        },
        "suppressOutput": True,
    }, ensure_ascii=False))


def report_missing():
    repo = read_source_repo()
    launcher = "py -3 install.py" if os.name == "nt" else "./install.sh"
    install_cmd = (
        f"cd {repo} && {launcher}"
        if repo
        else f"git clone {REPO_CLONE_URL} && cd akidevrule && {launcher}"
    )
    banner = (
        "📦 akidevrule is not installed on this machine\n"
        f"   Install: {install_cmd}\n"
        f"   Repo:    {REPO_CLONE_URL}"
    )
    context = (
        "The akidevrule shared-rule corpus is not installed on this machine.\n"
        f"To install it, run: {install_cmd}"
    )
    emit(banner, context)


def build_delta(remote_text, local_version):
    """Released entries strictly newer than local_version, newest-first, skipping [Unreleased]."""
    delta_lines = []
    for header, lines in split_entries(remote_text):
        m = re.match(r"\[(\d+\.\d+\.\d+)\]", header)
        if not m:
            continue  # [Unreleased] or any other non-version heading -- not a shipped version yet
        if cmp_semver(m.group(1), local_version) <= 0:
            break  # newest-first order: reached local's own version or older
        delta_lines.extend(lines)
    return "\n".join(delta_lines).strip()


def report_update(local_version, remote_version, remote_text):
    update_cmd = update_cmd_for(read_source_repo())
    delta = build_delta(remote_text, local_version)
    max_delta = 1400
    if len(delta) > max_delta:
        delta = delta[:max_delta].rstrip() + "\n… (see full changelog at the link below)"

    banner = (
        "📢 akidevrule has a new update available\n"
        f"   {local_version} → {remote_version}\n"
        f"   Update:    {update_cmd}\n"
        f"   Changelog: {CHANGELOG_URL_HUMAN}\n\n"
        f"{delta}"
    )
    context = (
        "The akidevrule shared-rule corpus has a newer version available.\n"
        f"Installed: {local_version}. Latest: {remote_version}.\n"
        f"To update, run: {update_cmd}\n\n"
        "What's new (from CHANGELOG.md):\n" + delta
    )
    emit(banner, context)


def main():
    # Local file-stat, always run and never throttled -- a not-installed
    # machine must hear about it every session, not once per THROTTLE_OK_HOURS.
    if not local_install_present(INSTALL_ROOT):
        report_missing()
        silent_exit()

    if not check_due():
        silent_exit()

    try:
        with open(LOCAL_CHANGELOG, encoding="utf-8") as f:
            local_text = f.read()
    except OSError:
        defer_check(THROTTLE_OK_HOURS)
        silent_exit()
    local_version = parse_changelog_version(local_text)

    remote_text = fetch_remote_changelog()
    remote_version = parse_changelog_version(remote_text) if remote_text else None

    state = classify_state(True, local_version, remote_version)

    if state == STATE_UNKNOWN:
        defer_check(THROTTLE_FAIL_HOURS)  # offline/timeout -> retry soon, do not lose the notice
        silent_exit()

    defer_check(THROTTLE_OK_HOURS)  # definitive answer -> next check in a day

    if state in (STATE_CURRENT, STATE_AHEAD):
        silent_exit()  # up to date, or a dev machine ahead of remote -- never nag

    report_update(local_version, remote_version, remote_text)
    silent_exit()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        silent_exit()
