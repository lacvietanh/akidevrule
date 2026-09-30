# Second-hop audit: for each Claude Code session that edited an artifact type, did the model Read the routed rule file? Runs locally against ~/.claude/projects, no API spend. From the Mac: ssh bien cat /home/guest/aki/AkiDevRule/scripts/second_hop_audit.py | python3 -
import json,glob,re,os,sys
from collections import defaultdict
ROUTES={'coding':(re.compile(r'\.(ts|tsx|js|mjs|cjs|vue|rs|py|go|swift|kt|sh|sql|css|scss)$'),'RULE-coding.md'),
        'pattern':(re.compile(r'\.(ts|tsx|js|mjs|cjs|vue|rs|py|go|swift|kt|sh|sql|css|scss)$'),'RULE-pattern-core.md'),
        'release':(re.compile(r'CHANGELOG\.md$'),'RULE-release.md'),
        'docs':(re.compile(r'(^|/)docs/.*\.md$'),'RULE-docs.md'),
        'stack':(re.compile(r'\.vue$'),'RULE-stack-akiNuxtCf.md'),
        'ui':(re.compile(r'\.(vue|css|scss)$'),'RULE-ui-pattern.md'),
        'tauri':(re.compile(r'\.rs$'),'RULE-stack-tauri.md'),
        'db':(re.compile(r'\.sql$'),'RULE-db-design.md')}
CODE=re.compile(r'\.(ts|js|mjs|vue|rs|py|go|swift|kt|css|scss)$')
CUT=sys.argv[1] if len(sys.argv)>1 else '2026-09-30'  # era split: before/after the route gate (2026-09-30); pass 2026-09-25 to reproduce the router-import split
stats=defaultdict(lambda: defaultdict(int))
codesess=defaultdict(int); allsess=defaultdict(int)
for f in glob.glob(os.path.expanduser('~/.claude/projects/*/*.jsonl')):
    edits=set(); reads=set(); receipts=set(); first=None
    with open(f,errors='ignore') as fh:
        for line in fh:
            try:o=json.loads(line)
            except: continue
            ts=o.get('timestamp','')[:10]
            if ts and (first is None or ts<first): first=ts
            m=o.get('message') or {}
            c=m.get('content')
            if not isinstance(c,list): continue
            for b in c:
                if b.get('type')=='tool_use':
                    i=b.get('input',{}) or {}
                    if b['name'] in('Edit','Write','NotebookEdit','MultiEdit'): edits.add(i.get('file_path',''))
                    elif b['name']=='Read': reads.add(os.path.basename(i.get('file_path','')))
                    elif b['name']=='Bash':
                        for mm in re.findall(r'(RULE-[\w-]+\.md|METHOD-[\w-]+\.md)',i.get('command','')): reads.add(mm)
                elif b.get('type')=='text' and o.get('type')=='assistant':
                    for mm in re.findall(r'\[RULES\][^\n]*',b.get('text','')): receipts.add(mm)
    if not first or not edits: continue
    era='after' if first>=CUT else 'before'
    allsess[era]+=1
    if any(CODE.search(e) for e in edits): codesess[era]+=1
    for name,(pat,rule) in ROUTES.items():
        if any(pat.search(e) for e in edits):
            stats[(era,name)]['sessions']+=1
            if rule in reads: stats[(era,name)]['read']+=1
            topic=name
            if any(re.search(r'\b'+topic+r'\b',r) for r in receipts): stats[(era,name)]['receipt']+=1
print('sessions with edits:',dict(allsess),'| with code edits:',dict(codesess))
print(f"{'era':7}{'route':9}{'sess':>5}{'read':>6}{'read%':>7}{'receipt':>9}")
for k in sorted(stats):
    s=stats[k]; print(f"{k[0]:7}{k[1]:9}{s['sessions']:5}{s['read']:6}{100*s['read']//s['sessions']:6}%{s['receipt']:9}")
