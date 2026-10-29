"""Corrections per 100 turns in main sessions, split by whether the first reply carried a [RULES] receipt and by whether compactions were followed by a receipt, bucketed by each session's primary model (the model with the most turns).
Input: the sessions.csv written by akistrict_extract.py. Output: a CSV table on stdout (model, split, bucket, sessions, turns, corrections, corrections_per100).
Command: python3 scripts/akistrict_loadcomply.py <dir>/sessions.csv
Verdict mode: python3 scripts/akistrict_loadcomply.py --verdict <dir>/corrections.jsonl --topic <topic> prints a CSV (ts, path, after_unreceipted_compaction, named, verdict) per correction and a final LOAD/COMPLY/UNDECIDABLE count line.
named: the topic is in receipt_topics_since, or "full" is, or the topic's file from TOPIC_FILES is in rule_files_read_since.
Verdict: topic agent (resident core) is COMPLY unless the correction followed an unreceipted compaction, then UNDECIDABLE; any other topic is COMPLY if named, else LOAD.
Reads one CSV or JSONL and never invokes a model; method and results: docs/research/agent-painpoints-oct28.md.
"""
import argparse, csv, json, sys
from collections import Counter, defaultdict


TOPIC_FILES = {
    "agent": "RULE-agent-behavior.md", "coding": "RULE-coding.md", "pattern": "RULE-pattern-core.md", "test": "RULE-test.md",
    "docs": "RULE-docs.md", "content": "RULE-content-write.md", "stack": "RULE-stack-akiNuxtCf.md", "tauri": "RULE-stack-tauri.md",
    "ui": "RULE-ui-pattern.md", "seo": "RULE-seo.md", "release": "RULE-release.md", "db": "RULE-db-design.md", "biz": "RULE-biz.md",
    "flow": "METHOD-audit-flow.md", "think": "METHOD-deep-think.md", "ux": "METHOD-ux-psych.md",
    "proportion": "METHOD-proportionality.md", "zero-trust": "METHOD-audit-zero-trust.md",
    "subtract": "METHOD-audit-subtraction.md", "frozen-ref": "METHOD-audit-frozen-reference.md",
}


def verdict_mode(path, topic):
    out = csv.writer(sys.stdout, lineterminator="\n")
    out.writerow(["ts", "path", "after_unreceipted_compaction", "named", "verdict"])
    counts = Counter()
    for line in open(path, encoding="utf-8"):
        c = json.loads(line)
        topics = c["receipt_topics_since"]
        named = topic in topics or "full" in topics or TOPIC_FILES[topic] in c["rule_files_read_since"]
        unreceipted = c["after_unreceipted_compaction"]
        if topic == "agent":
            verdict = "UNDECIDABLE" if unreceipted else "COMPLY"
        else:
            verdict = "COMPLY" if named else "LOAD"
        counts[verdict] += 1
        out.writerow([c["timestamp"], c["file"], unreceipted, named, verdict])
    print(f"LOAD={counts['LOAD']} COMPLY={counts['COMPLY']} UNDECIDABLE={counts['UNDECIDABLE']}")


if "--verdict" in sys.argv:
    ap = argparse.ArgumentParser()
    ap.add_argument("--verdict", required=True)
    ap.add_argument("--topic", required=True)
    args = ap.parse_args()
    if args.topic not in TOPIC_FILES:
        print(f"unknown topic {args.topic!r}; known: {', '.join(TOPIC_FILES)}", file=sys.stderr)
        sys.exit(2)
    verdict_mode(args.verdict, args.topic)
    sys.exit(0)

def primary(models):
    best, n = "none", -1
    for part in models.split(";"):
        if ":" in part:
            m, c = part.rsplit(":", 1)
            if int(c) > n: best, n = m, int(c)
    return best

rows = [r for r in csv.DictReader(open(sys.argv[1])) if r["sidechain"] == "False" and int(r["turns"] or 0) > 0]
print("distinct receipt_first:", sorted({r["receipt_first"] for r in rows}), "compact_receipt sample:", sorted({r["compact_receipt"] for r in rows})[:6])
agg = defaultdict(lambda: [0, 0, 0])  # (model, split, bucket) -> sessions, turns, corrections
for r in rows:
    m = primary(r["models"]); t = int(r["turns"]); c = int(r["corrections"] or 0)
    rf = r["receipt_first"]
    b1 = "n/a" if rf == "" else ("yes" if rf in ("1", "True", "true") else "no")
    comp = int(r["compactions"] or 0); cr = int(r["compact_receipt"] or 0)
    b2 = "no-compaction" if comp == 0 else ("all" if cr == comp else ("none" if cr == 0 else "partial"))
    for split, b in (("receipt_first", b1), ("compact_receipt", b2)):
        a = agg[(m, split, b)]; a[0] += 1; a[1] += t; a[2] += c
print("model,split,bucket,sessions,turns,corrections,corrections_per100")
for (m, split, b), (s, t, c) in sorted(agg.items()):
    print(f"{m},{split},{b},{s},{t},{c},{100*c/t:.2f}")
