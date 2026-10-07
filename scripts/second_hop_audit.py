# Second-hop audit: for each Claude Code session that edited an artifact type, did the model Read the routed rule file? Runs locally against ~/.claude/projects, no API spend. From the Mac: ssh bien cat /home/guest/aki/AkiDevRule/scripts/second_hop_audit.py | python3 - [CUT] [--by-model]
# --by-model splits every row by the assistant `model` field and adds the compaction/shell-read table (docs/plan/done/claude-5-5-overrides.md Item 4): receipt in the first assistant text after a compact_boundary, routed rule re-read after the last boundary before an edit, Bash cat/head/sed of one known file versus Read.
import json,glob,re,os,sys
from collections import defaultdict,Counter
ROUTES={'coding':(re.compile(r'\.(ts|tsx|js|mjs|cjs|vue|rs|py|go|swift|kt|sh|sql|css|scss)$'),'RULE-coding.md'),
        'pattern':(re.compile(r'\.(ts|tsx|js|mjs|cjs|vue|rs|py|go|swift|kt|sh|sql|css|scss)$'),'RULE-pattern-core.md'),
        'release':(re.compile(r'CHANGELOG\.md$'),'RULE-release.md'),
        'docs':(re.compile(r'(^|/)docs/.*\.md$'),'RULE-docs.md'),
        'stack':(re.compile(r'\.vue$'),'RULE-stack-akiNuxtCf.md'),
        'ui':(re.compile(r'\.(vue|css|scss)$'),'RULE-ui-pattern.md'),
        'tauri':(re.compile(r'\.rs$'),'RULE-stack-tauri.md'),
        'db':(re.compile(r'\.sql$'),'RULE-db-design.md'),
        'test':(re.compile(r'\.(test|spec)\.[a-z]+$|_test\.[a-z]+$|(^|/)test_[^/]*\.py$|(^|/)conftest\.py$|(^|/)(test|tests|__tests__|spec)/(?!.*\.md$)'),'RULE-test.md')}
CODE=re.compile(r'\.(ts|js|mjs|vue|rs|py|go|swift|kt|css|scss)$')
RULEREF=re.compile(r'(RULE-[\w-]+\.md|METHOD-[\w-]+\.md)')
SHELL_READ=re.compile(r'''^\s*(?:cat|bat|less|head(?:\s+-n?\s*\d+)?|sed\s+-n\s+\S+)\s+(['"]?)[^\s|;&<>*$]+\1\s*$''')  # one known file printed to read it (agent.A2); pipes, globs and multi-file scans are not counted
EDITS=('Edit','Write','NotebookEdit','MultiEdit')
args=[a for a in sys.argv[1:] if not a.startswith('--')]
BY_MODEL='--by-model' in sys.argv
CUT=args[0] if args else '2026-09-30'  # era split: before/after the route gate (2026-09-30); pass 2026-09-25 to reproduce the router-import split
stats=defaultdict(lambda: defaultdict(int)); comp=defaultdict(lambda: defaultdict(int))
codesess=defaultdict(int); allsess=defaultdict(int)
for f in glob.glob(os.path.expanduser('~/.claude/projects/*/*.jsonl')):
    edits=set(); reads=set(); receipts=set(); first=None; models=Counter()
    boundaries=0; after_boundary=False; want_receipt=False; receipt_ok=0; since=set(); pair=0; pair_ok=0; shell_reads=0; tool_reads=0
    with open(f,errors='ignore') as fh:
        for line in fh:
            try:o=json.loads(line)
            except: continue
            if o.get('type')=='system' and o.get('subtype')=='compact_boundary':
                boundaries+=1; after_boundary=True; want_receipt=True; since=set(); continue
            ts=o.get('timestamp','')[:10]
            if ts and (first is None or ts<first): first=ts
            m=o.get('message') or {}
            if o.get('type')=='assistant' and isinstance(m.get('model'),str) and not m['model'].startswith('<'): models[m['model']]+=1
            c=m.get('content')
            if not isinstance(c,list): continue
            for b in c:
                if b.get('type')=='tool_use':
                    i=b.get('input',{}) or {}
                    if b['name'] in EDITS:
                        p=i.get('file_path','') or i.get('notebook_path',''); root=(o.get('cwd') or '').rstrip('/')+'/'
                        if root!='/' and p.startswith(root): p=p[len(root):]  # route on the project-relative path, as aki-route-guard does
                        edits.add(p)
                        if after_boundary:
                            for name,(pat,rule) in ROUTES.items():
                                if pat.search(p): pair+=1; pair_ok+=rule in since
                    elif b['name']=='Read':
                        base=os.path.basename(i.get('file_path','')); reads.add(base); since.add(base); tool_reads+=1
                    elif b['name']=='Bash':
                        cmd=i.get('command','')
                        for mm in RULEREF.findall(cmd): reads.add(mm); since.add(mm)
                        if SHELL_READ.match(cmd): shell_reads+=1
                elif b.get('type')=='text' and o.get('type')=='assistant':
                    txt=b.get('text','')
                    for mm in re.findall(r'\[RULES\][^\n]*',txt): receipts.add(mm)
                    if want_receipt and txt.strip(): receipt_ok+='[RULES]' in txt; want_receipt=False
    if not first or not edits: continue
    era='after' if first>=CUT else 'before'
    key=(era,models.most_common(1)[0][0] if models else '?') if BY_MODEL else (era,)
    allsess[key]+=1
    if any(CODE.search(e) for e in edits): codesess[key]+=1
    for name,(pat,rule) in ROUTES.items():
        if any(pat.search(e) for e in edits):
            stats[key+(name,)]['sessions']+=1
            if rule in reads: stats[key+(name,)]['read']+=1
            if any(re.search(r'\b'+name+r'\b',r) for r in receipts): stats[key+(name,)]['receipt']+=1
    k=comp[key]; k['sessions']+=1; k['compacted']+=boundaries>0; k['boundaries']+=boundaries; k['receipt_after']+=receipt_ok; k['edit_pairs']+=pair; k['edit_pairs_ok']+=pair_ok; k['shell_reads']+=shell_reads; k['tool_reads']+=tool_reads
W=max([len(k[1]) for k in allsess] or [5]) if BY_MODEL else 0
def head(k): return f"{k[0]:7}"+(f"{k[1]:{W+1}}" if BY_MODEL else '')
print('sessions with edits:',{'/'.join(k):v for k,v in allsess.items()},'| with code edits:',{'/'.join(k):v for k,v in codesess.items()})
print(f"{'era':7}"+(f"{'model':{W+1}}" if BY_MODEL else '')+f"{'route':9}{'sess':>5}{'read':>6}{'read%':>7}{'receipt':>9}")
for k in sorted(stats):
    s=stats[k]; print(head(k)+f"{k[-1]:9}{s['sessions']:5}{s['read']:6}{100*s['read']//s['sessions']:6}%{s['receipt']:9}")
if BY_MODEL:
    print(f"\n{'era':7}{'model':{W+1}}{'sess':>5}{'compacted':>10}{'bounds':>7}{'receipt>cmp':>12}{'reread>cmp':>11}{'shellread':>10}{'Read':>6}")
    for k in sorted(comp):
        s=comp[k]; rc=f"{s['receipt_after']}/{s['boundaries']}"; rr=f"{s['edit_pairs_ok']}/{s['edit_pairs']}"
        print(head(k)+f"{s['sessions']:5}{s['compacted']:10}{s['boundaries']:7}{rc:>12}{rr:>11}{s['shell_reads']:10}{s['tool_reads']:6}")
