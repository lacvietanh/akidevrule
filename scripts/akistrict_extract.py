#!/usr/bin/env python3
"""Count agent-behavior signals in Claude Code transcripts.

Inputs: one or more roots (a transcript .jsonl or a directory scanned recursively, e.g. ~/.claude/projects); main transcripts are <session>.jsonl, subagent transcripts are <session>/subagents/agent-*.jsonl and count as sidechain.
Outputs in --out: sessions.csv (one row per transcript), models.csv (one row per model and sidechain flag, counters plus per-100-turn rates), corrections.jsonl (owner messages matched as corrections, with the preceding assistant tail), reruns.jsonl (each counted verification rerun: file, timestamp, model, kind, command).
Caveat: corrections are found by the CORRECTION regex over owner messages, so recall is below 100% (corrections phrased without a listed keyword are missed) and precision is imperfect (words like "stop" or "again" also occur in ordinary requests).
rerun_per_edit: a HEAVY_CMD Bash run in a main transcript whose normalized command equals an earlier heavy run in the same transcript with no Edit/Write/NotebookEdit tool_use and no EDIT_CMD Bash command between them.
rerun_after_subagent: a HEAVY_CMD Bash run in a main transcript whose normalized command a subagent transcript of the same session ran earlier, with no edit (as above) in the main transcript between that subagent run and this one; a run can count in both.
Window: transcripts modified within --days (default 30) and at least --min-kb (default 20) KB; smaller files are skipped without a count.
v3 only adds outputs; every v2 column, file and number is unchanged.
compactions.jsonl: one row per compaction (path, ts of the first assistant text turn after it, receipt_after, boundary_ts of the summary or compactMetadata record).
receipts.jsonl: one row per assistant text containing [RULES] (path, ts, model, side, topics parsed from the line, raw line truncated to 200 chars).
corrections.jsonl rows gain last_compaction_ts (the boundary record's timestamp), after_unreceipted_compaction, receipt_topics_since and rule_files_read_since (whole Reads of files under /akidevrule/ since the last compaction or file start).
edits_per_heavy_run.csv: per model, how many main-side edit events (edit tools plus EDIT_CMD commands) fell between a heavy run and the previous one in the same transcript (buckets 0-4, 5-9, 10+).
sessions-v3.csv: path, first_ts, compactions_ts (;-joined), receipt_count.
summary.txt: the stdout summary plus files_skipped_min_kb, unmatched_total and matched_total.
--sample-unmatched N (default 0) with --seed S (default 20261028): draws N owner messages the CORRECTION regex did not match, uniformly over all files, into unmatched-sample.jsonl (corrections.jsonl keys plus sample_index).
Command: python3 scripts/akistrict_extract.py ~/.claude/projects --out <dir> [--sample-unmatched N] [--seed S]
Reads transcripts only and never invokes a model; method and results: docs/research/agent-painpoints-oct28.md.
"""
import argparse
import csv
import json
import random
import re
import shlex
import statistics
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

RECEIPT = "[RULES]"
LONG_REPLY = 2500
SHELL_READERS = {"cat", "head", "tail", "sed"}
SHELL_REJECT = re.compile(r"[|;&<>`\n]|\$\(")
GLOB_CHARS = re.compile(r"[*?\[\]{}]")
CORRECTION = re.compile(
    r"vi phạm|sai rồi|đã nói|sao lại|đừng|không được|lại nữa|lần nữa|\[SKIP\]|\[FLUFF\]|\[WRAP\]|\[YAP\]"
    r"|no yapping|not what I asked|stop|wrong|again|why did you|tôi đã|đã bảo|lặp lại|lãng phí|tốn|chậm"
    r"|dài dòng|hỏi nhiều|tự ý|không hỏi|mất|quên",
    re.IGNORECASE,
)
HEAVY_CMD = re.compile(
    r"\b(?:npm (?:run )?(?:test|build|typecheck|lint|check)|npx (?:vitest|jest|vue-tsc|tsc|nuxt (?:typecheck|build|generate))"
    r"|vitest|jest|pytest|python3? -m pytest|cargo (?:test|build|check|clippy)|vue-tsc|tsc|node --test|go test"
    r"|nuxt (?:typecheck|build|generate))\b"
)
EDIT_CMD = re.compile(
    r"sed -i|>|\btee |\bmv |\brm |\bcp |\bgit (?:checkout|stash|reset|restore|apply|pull|merge|rebase|cherry-pick)\b"
    r"|\bnpm (?:install|i|ci|update)\b|install\.mjs"
)
EDIT_TOOLS = {"Edit", "Write", "NotebookEdit"}
RECEIPT_TAIL = re.compile(r"\((?:core|router(?::full)?|brief)\)")
KNOWN_TOPICS = {
    "agent", "coding", "pattern", "test", "docs", "content", "stack", "tauri", "ui", "seo", "release", "db", "biz", "flow",
    "think", "ux", "proportion", "zero-trust", "subtract", "frozen-ref", "maker", "hands", "judge", "challenger", "conduct",
}
EDIT_BUCKETS =("0", "1", "2", "3", "4", "5-9", "10+")
LEADING_CD = re.compile(r"^\s*cd\s+[^&;]+&&\s*")
LEADING_ENV = re.compile(r"^\s*(?:[A-Za-z_]\w*=\S*\s+)+")
PIPE_TAIL = re.compile(r"\s*\|\s*(?:tail|head|grep)\b.*$")
REDIRECT = re.compile(r"\s*(?:\d*|&)>>?\s*(?:&\d|\S+)")
COUNTERS = (
    "turns", "receipt_first_eligible", "receipt_first_yes", "compactions", "compact_receipt",
    "guard_deny", "guard_match_loose", "shell_read", "ask_tool", "ask_text", "coauthor", "partial_rule_read",
    "over2500", "corrections", "heavy_runs", "rerun_per_edit", "rerun_after_subagent",
)


class Stats:
    def __init__(self):
        self.n = Counter()
        self.reply_lens = []


def percentile(sorted_vals, q):
    if not sorted_vals:
        return None
    pos = (len(sorted_vals) - 1) * q
    lo = int(pos)
    hi = min(lo + 1, len(sorted_vals) - 1)
    return sorted_vals[lo] + (sorted_vals[hi] - sorted_vals[lo]) * (pos - lo)


def reply_summary(lens):
    s = sorted(lens)
    return (statistics.median(s) if s else None), percentile(s, 0.9)


def block_text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text")
    return ""


def is_single_file_read(command):
    if SHELL_REJECT.search(command.replace("2>/dev/null", "").replace("2>&1", "")):
        return False
    try:
        tokens = shlex.split(command.replace("2>/dev/null", ""))
    except ValueError:
        return False
    if not tokens or tokens[0] not in SHELL_READERS:
        return False
    tool, args = tokens[0], tokens[1:]
    paths = []
    if tool == "sed":
        if "-n" not in args and not any(a.startswith("-n") for a in args):
            return False
        rest = [a for a in args if not a.startswith("-")]
        paths = rest[1:]
    elif tool == "cat":
        paths = [a for a in args if not a.startswith("-")]
    else:
        skip = False
        for a in args:
            if skip:
                skip = False
            elif a in ("-n", "-c"):
                skip = True
            elif not a.startswith("-"):
                paths.append(a)
    return len(paths) == 1 and not GLOB_CHARS.search(paths[0])


def command_key(command):
    prev = None
    while prev != command:
        prev = command
        command = LEADING_CD.sub("", command, count=1)
        command = LEADING_ENV.sub("", command, count=1)
    command = PIPE_TAIL.sub("", command)
    command = REDIRECT.sub("", command)
    return " ".join(command.split())


def parse_receipt(text):
    line = next(l for l in text.splitlines() if RECEIPT in l)
    rest = line[line.index(RECEIPT) + len(RECEIPT):]
    tags = list(RECEIPT_TAIL.finditer(rest))
    if tags:
        rest = rest[:tags[-1].end()]
    topics = [w for w in re.findall(r"[\w-]+", re.sub(r"\([^)]*\)", " ", rest)) if w in KNOWN_TOPICS]
    if "(router:full)" in rest:
        topics.append("full")
    return list(dict.fromkeys(topics)), line.strip()[:200]


def edit_bucket(n):
    return str(n) if n < 5 else ("5-9" if n < 10 else "10+")


def session_dir(path, file_side):
    return path.parent.parent if file_side else path.with_suffix("")


class FileScan:
    def __init__(self, path, project, file_side):
        self.events = []
        self.reruns = []
        self.path = path
        self.project = project
        self.file_side = file_side
        self.stats = defaultdict(Stats)
        self.corrections = []
        self.start = None
        self.cwd = None
        self.shell_cmds = []
        self.turn = None
        self.first_text_seen = False
        self.pending_compaction = False
        self.tool_model = {}
        self.last_text_turn = None
        self.compactions = []
        self.receipts = []
        self.edit_gaps = []
        self.unmatched = []
        self.has_compaction = False
        self.unreceipted = False
        self.last_compaction_ts = ""
        self.topics_since = set()
        self.reads_since = set()

    def mark_compaction_boundary(self, ts):
        self.pending_compaction = True
        self.last_compaction_ts = ts or ""
        self.has_compaction = True
        self.unreceipted = True
        self.topics_since.clear()
        self.reads_since.clear()

    def record_receipts(self, t):
        for text in t["texts"]:
            if RECEIPT not in text:
                continue
            topics, raw = parse_receipt(text)
            self.receipts.append({"path": str(self.path), "ts": t["ts"], "model": t["model"], "side": t["side"],
                                  "topics": topics, "raw": raw})
            if not t["side"]:
                self.topics_since.update(topics)
                self.unreceipted = False

    def owner_row(self, o, text):
        if not self.last_text_turn:
            model, prev = "none", ""
        else:
            model, _, prev = self.last_text_turn
        row = {
            "file": str(self.path), "timestamp": o.get("timestamp"), "model": model,
            "owner_text": text[:400], "prev_assistant_tail": prev[-400:],
            "last_compaction_ts": self.last_compaction_ts,
            "after_unreceipted_compaction": self.has_compaction and self.unreceipted,
            "receipt_topics_since": sorted(self.topics_since),
            "rule_files_read_since": sorted(self.reads_since),
        }
        return model, row

    def finalize_turn(self):
        t = self.turn
        if not t:
            return
        self.turn = None
        st = self.stats[(t["model"], t["side"])]
        st.n["turns"] += 1
        text = "\n".join(t["texts"])
        if t["texts"]:
            st.reply_lens.append(len(text))
            if len(text) > LONG_REPLY:
                st.n["over2500"] += 1
            self.last_text_turn = (t["model"], t["side"], text)
        if t["blocks"] and t["blocks"][-1] == "text" and t["texts"][-1].rstrip().endswith("?"):
            st.n["ask_text"] += 1
        if t["texts"] and not t["side"] and not self.first_text_seen:
            self.first_text_seen = True
            st.n["receipt_first_eligible"] += 1
            if RECEIPT in t["texts"][0]:
                st.n["receipt_first_yes"] += 1
        if t["texts"]:
            self.record_receipts(t)
        if t["texts"] and self.pending_compaction:
            self.pending_compaction = False
            st.n["compactions"] += 1
            self.compactions.append({"path": str(self.path), "ts": t["ts"], "receipt_after": RECEIPT in text,
                                     "boundary_ts": self.last_compaction_ts})
            if RECEIPT in text:
                st.n["compact_receipt"] += 1
        track_events = t["side"] == self.file_side
        for tu in t["tool_uses"]:
            self.tool_model[tu.get("id")] = (t["model"], t["side"])
            name, inp = tu.get("name"), tu.get("input") or {}
            if track_events and name in EDIT_TOOLS:
                self.events.append((t["ts"], "edit", None, None, t["model"]))
            if name == "AskUserQuestion":
                st.n["ask_tool"] += 1
            elif name == "Bash":
                cmd = inp.get("command") or ""
                if track_events:
                    key = command_key(cmd)
                    if EDIT_CMD.search(key):
                        self.events.append((t["ts"], "edit", None, None, t["model"]))
                    if HEAVY_CMD.search(key):
                        self.events.append((t["ts"], "heavy", key, cmd, t["model"]))
                if "co-authored-by" in cmd.lower():
                    st.n["coauthor"] += 1
                if is_single_file_read(cmd):
                    st.n["shell_read"] += 1
                    self.shell_cmds.append(cmd[:120])
            elif name == "Read":
                fp = inp.get("file_path") or ""
                if "/akidevrule/" in fp:
                    if inp.get("limit") is not None or inp.get("offset") is not None:
                        st.n["partial_rule_read"] += 1
                    elif not t["side"]:
                        self.reads_since.add(fp.rsplit("/", 1)[-1])

    def on_assistant(self, o):
        msg = o.get("message") or {}
        side = bool(self.file_side or o.get("isSidechain"))
        mid = msg.get("id") or o.get("uuid")
        if not self.turn or self.turn["id"] != mid:
            self.finalize_turn()
            self.turn = {"id": mid, "model": msg.get("model") or "unknown", "side": side, "ts": o.get("timestamp") or "",
                         "texts": [], "blocks": [], "tool_uses": []}
        content = msg.get("content")
        if isinstance(content, str):
            content = [{"type": "text", "text": content}]
        for b in content or []:
            if not isinstance(b, dict):
                continue
            kind = b.get("type")
            self.turn["blocks"].append(kind)
            if kind == "text":
                self.turn["texts"].append(b.get("text") or "")
            elif kind == "tool_use":
                self.turn["tool_uses"].append(b)

    def on_user(self, o):
        self.finalize_turn()
        msg = o.get("message") or {}
        content = msg.get("content")
        side = bool(self.file_side or o.get("isSidechain"))
        if o.get("isCompactSummary"):
            self.mark_compaction_boundary(o.get("timestamp"))
            return
        if isinstance(content, list):
            for b in content:
                if isinstance(b, dict) and b.get("type") == "tool_result":
                    self.on_tool_result(b)
        if side or o.get("isMeta"):
            return
        text = block_text(content).strip()
        if not text or text.startswith("<"):
            return
        model, row = self.owner_row(o, text)
        if not CORRECTION.search(text):
            self.unmatched.append(row)
            return
        self.stats[(model, side)].n["corrections"] += 1
        self.corrections.append(row)

    def on_tool_result(self, b):
        text = block_text(b.get("content")).lower()
        if "aki-route-guard" in text or ("denied" in text and "rule-" in text):
            key = self.tool_model.get(b.get("tool_use_id"), ("unknown", self.file_side))
            self.stats[key].n["guard_match_loose"] += 1
            if b.get("is_error"):
                self.stats[key].n["guard_deny"] += 1

    def on_system(self, o):
        self.finalize_turn()
        if o.get("compactMetadata"):
            self.mark_compaction_boundary(o.get("timestamp"))

    def classify_reruns(self, subagent_runs):
        seen, last_edit = set(), ""
        edits_since_heavy = None
        for ts, kind, key, cmd, model in self.events:
            if kind == "edit":
                seen.clear()
                last_edit = ts
                if edits_since_heavy is not None:
                    edits_since_heavy += 1
                continue
            if edits_since_heavy is not None:
                self.edit_gaps.append((model, edits_since_heavy))
            edits_since_heavy = 0
            n = self.stats[(model, False)].n
            n["heavy_runs"] += 1
            if key in seen:
                n["rerun_per_edit"] += 1
                self.reruns.append(self.rerun_row(ts, model, "per_edit", cmd))
            seen.add(key)
            earlier = [x for x in subagent_runs.get(key, ()) if x < ts]
            if earlier and max(earlier) > last_edit:
                n["rerun_after_subagent"] += 1
                self.reruns.append(self.rerun_row(ts, model, "after_subagent", cmd))

    def rerun_row(self, ts, model, kind, cmd):
        return {"file": str(self.path), "timestamp": ts, "model": model, "kind": kind, "command": cmd}

    def run(self):
        with open(self.path, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                try:
                    o = json.loads(line)
                except ValueError:
                    continue
                if not isinstance(o, dict):
                    continue
                if self.start is None and o.get("timestamp"):
                    self.start = o["timestamp"]
                if self.cwd is None and o.get("cwd"):
                    self.cwd = o["cwd"]
                kind = o.get("type")
                if kind == "assistant":
                    self.on_assistant(o)
                elif kind == "user":
                    self.on_user(o)
                elif kind == "system":
                    self.on_system(o)
        self.finalize_turn()
        return self


def find_files(roots, days, min_kb, skipped):
    cutoff = time.time() - days * 86400
    for root in roots:
        root = Path(root)
        candidates = [root] if root.is_file() else sorted(root.rglob("*.jsonl"))
        for p in candidates:
            try:
                st = p.stat()
            except FileNotFoundError:
                continue
            if st.st_mtime < cutoff:
                continue
            if st.st_size >= min_kb * 1024:
                yield root, p
            else:
                skipped[0] += 1


def project_of(root, path):
    parts = path.relative_to(root).parts if root.is_dir() else ()
    return parts[0] if len(parts) > 1 else root.name


def rate(num, den, scale=1):
    return "" if not den else round(num / den * scale, 3)


def fmt(v):
    return "" if v is None else round(v, 1)


def write_sessions(out, scans):
    cols = ["path", "project", "cwd", "start", "sidechain", "models", "turns", "receipt_first",
            "compactions", "compact_receipt", "guard_deny", "guard_match_loose", "shell_read", "ask_tool", "ask_text",
            "coauthor", "partial_rule_read", "reply_median", "reply_p90", "over2500", "corrections",
            "heavy_runs", "rerun_per_edit", "rerun_after_subagent", "shell_read_cmds"]
    with open(out / "sessions.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(cols)
        for s in scans:
            total, lens, mix = Counter(), [], Counter()
            for (model, _), st in s.stats.items():
                total.update(st.n)
                lens += st.reply_lens
                mix[model] += st.n["turns"]
            med, p90 = reply_summary(lens)
            first = "" if not total["receipt_first_eligible"] else int(total["receipt_first_yes"] > 0)
            w.writerow([s.path, s.project, s.cwd, s.start, s.file_side,
                        ";".join(f"{m}:{n}" for m, n in mix.most_common()), total["turns"], first,
                        total["compactions"], total["compact_receipt"], total["guard_deny"],
                        total["guard_match_loose"], total["shell_read"], total["ask_tool"], total["ask_text"], total["coauthor"],
                        total["partial_rule_read"], fmt(med), fmt(p90), total["over2500"],
                        total["corrections"], total["heavy_runs"], total["rerun_per_edit"],
                        total["rerun_after_subagent"], " || ".join(s.shell_cmds)])


def write_jsonl(path, rows):
    with open(path, "w", encoding="utf-8") as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")


def write_v3(out, scans):
    write_jsonl(out / "compactions.jsonl", [c for s in scans for c in s.compactions])
    write_jsonl(out / "receipts.jsonl", [r for s in scans for r in s.receipts])
    with open(out / "sessions-v3.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["path", "first_ts", "compactions_ts", "receipt_count"])
        for s in scans:
            w.writerow([s.path, s.start, ";".join(c["ts"] for c in s.compactions), len(s.receipts)])
    gaps = defaultdict(Counter)
    for s in scans:
        for model, n in s.edit_gaps:
            gaps[model][edit_bucket(n)] += 1
    with open(out / "edits_per_heavy_run.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["model", "edits_between", "runs"])
        for model in sorted(gaps):
            for b in EDIT_BUCKETS:
                w.writerow([model, b, gaps[model][b]])


def sample_unmatched(scans, count, seed):
    population = [r for s in scans for r in s.unmatched]
    picked = random.Random(seed).sample(population, min(count, len(population)))
    return len(population), [{**r, "sample_index": i} for i, r in enumerate(picked)]


def aggregate(scans):
    agg = defaultdict(Stats)
    sessions = defaultdict(set)
    for s in scans:
        for key, st in s.stats.items():
            agg[key].n.update(st.n)
            agg[key].reply_lens += st.reply_lens
            sessions[key].add(s.path)
    return agg, sessions


def write_models(out, agg, sessions):
    cols = ["model", "sidechain", "files"] + list(COUNTERS) + [
        "receipt_first_rate", "compact_receipt_rate", "guard_deny_per100", "shell_read_per100",
        "ask_tool_per100", "ask_text_per100", "coauthor_per100", "partial_rule_read_per100",
        "corrections_per100", "reply_turns_with_text", "reply_median", "reply_p90", "over2500_rate",
        "rerun_per_edit_per100", "rerun_after_subagent_per100"]
    rows = []
    for (model, side), st in sorted(agg.items(), key=lambda kv: (-kv[1].n["turns"], kv[0])):
        n, t = st.n, st.n["turns"]
        med, p90 = reply_summary(st.reply_lens)
        rows.append([model, side, len(sessions[(model, side)])] + [n[c] for c in COUNTERS] + [
            rate(n["receipt_first_yes"], n["receipt_first_eligible"]),
            rate(n["compact_receipt"], n["compactions"]),
            rate(n["guard_deny"], t, 100), rate(n["shell_read"], t, 100), rate(n["ask_tool"], t, 100),
            rate(n["ask_text"], t, 100), rate(n["coauthor"], t, 100), rate(n["partial_rule_read"], t, 100),
            rate(n["corrections"], t, 100), len(st.reply_lens), fmt(med), fmt(p90),
            rate(n["over2500"], len(st.reply_lens)),
            rate(n["rerun_per_edit"], t, 100), rate(n["rerun_after_subagent"], t, 100)])
    with open(out / "models.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(cols)
        w.writerows(rows)
    return cols, rows


def summarize(scans, agg, corrections, cols, rows):
    totals = Counter()
    for st in agg.values():
        totals.update(st.n)
    lines = [f"files={len(scans)} main={sum(not s.file_side for s in scans)} sidechain={sum(s.file_side for s in scans)}"
             f" turns={totals['turns']} corrections={len(corrections)}"]
    idx = {c: i for i, c in enumerate(cols)}
    for r in rows:
        if r[idx["turns"]] < 20:
            continue
        lines.append(
            f"{r[0]}{' [side]' if r[1] else ''}: turns={r[idx['turns']]} receipt_first={r[idx['receipt_first_rate']]}"
            f" compact_receipt={r[idx['compact_receipt_rate']]} guard/100={r[idx['guard_deny_per100']]}"
            f" shell_read/100={r[idx['shell_read_per100']]} ask/100={r[idx['ask_tool_per100']]}+{r[idx['ask_text_per100']]}"
            f" reply_med/p90={r[idx['reply_median']]}/{r[idx['reply_p90']]} >2500={r[idx['over2500_rate']]}")
    zero = [c for c in COUNTERS if c != "turns" and not totals[c]]
    lines.append("zero everywhere: " + (", ".join(zero) if zero else "none"))
    return lines


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("roots", nargs="+")
    ap.add_argument("--days", type=float, default=30)
    ap.add_argument("--min-kb", type=float, default=20)
    ap.add_argument("--out", default="out")
    ap.add_argument("--sample-unmatched", type=int, default=0)
    ap.add_argument("--seed", type=int, default=20261028)
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    scans = []
    skipped = [0]
    for root, path in find_files(args.roots, args.days, args.min_kb, skipped):
        file_side = "subagents" in path.parts
        scans.append(FileScan(path, project_of(root, path), file_side).run())
    subagent_runs = defaultdict(lambda: defaultdict(list))
    for s in scans:
        if s.file_side:
            for ts, kind, key, _, _ in s.events:
                if kind == "heavy":
                    subagent_runs[session_dir(s.path, True)][key].append(ts)
    for s in scans:
        if not s.file_side:
            s.classify_reruns(subagent_runs.get(session_dir(s.path, False), {}))
    write_sessions(out, scans)
    write_jsonl(out / "reruns.jsonl", [r for s in scans for r in s.reruns])
    agg, sessions = aggregate(scans)
    cols, rows = write_models(out, agg, sessions)
    corrections = [c for s in scans for c in s.corrections]
    write_jsonl(out / "corrections.jsonl", corrections)
    write_v3(out, scans)
    unmatched_total, sample = sample_unmatched(scans, args.sample_unmatched, args.seed)
    write_jsonl(out / "unmatched-sample.jsonl", sample)
    lines = summarize(scans, agg, corrections, cols, rows)
    print("\n".join(lines[:30]))
    extra = [f"files_skipped_min_kb={skipped[0]}", f"unmatched_total={unmatched_total} matched_total={len(corrections)}"]
    (out / "summary.txt").write_text("\n".join(lines + extra) + "\n", encoding="utf-8")


if __name__ == "__main__":
    sys.exit(main())
