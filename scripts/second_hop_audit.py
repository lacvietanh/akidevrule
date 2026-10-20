# Second-hop audit: for each Claude Code session that edited an artifact type, did the model Read the routed rule file? Runs locally against ~/.claude/projects, no API spend. From the Mac: ssh bien cat /home/guest/aki/AkiDevRule/scripts/second_hop_audit.py | python3 - [CUT] [--by-model]
# --by-model splits every row by the assistant `model` field and adds the compaction/shell-read table (docs/plan/done/claude-5-5-overrides.md Item 4): receipt in the first assistant text after a compact_boundary, routed rule re-read after the last boundary before an edit, Bash cat/head/sed of one known file versus Read.
import json,glob,re,os,sys
from pathlib import Path
from collections import defaultdict,Counter
TOPIC={'RULE-coding.md':'coding','RULE-pattern-core.md':'pattern','RULE-release.md':'release','RULE-docs.md':'docs','RULE-stack-akiNuxtCf.md':'stack','RULE-ui-pattern.md':'ui','RULE-stack-tauri.md':'tauri','RULE-db-design.md':'db','RULE-test.md':'test','RULE-content-write.md':'content'}
def load_map():
    here=[Path(__file__).resolve().parents[1]/'payload'/'route-map.json'] if '__file__' in globals() else []
    for p in [Path.home()/'.aki'/'akidevrule'/'route-map.json']+here:
        try: return json.loads(p.read_text())['routes']
        except (OSError,ValueError,KeyError): pass
    print('second_hop_audit: route-map.json not found in ~/.aki/akidevrule or payload/',file=sys.stderr); sys.exit(2)
ROUTES=load_map()
def routed(path,cwd):
    p=path.replace('\\','/'); name=p.rsplit('/',1)[-1]; ext=os.path.splitext(name)[1][1:].lower()
    root=(cwd or '').replace('\\','/').rstrip('/')+'/'
    rel='/'+(p[len(root):] if root!='/' and p.startswith(root) else p.lstrip('/'))
    out=set()
    for r in ROUTES:
        hit=ext in r.get('ext',[]) or name in r.get('name',[]) or bool(r.get('nameRe') and re.search(r['nameRe'],name)) or bool(r.get('dirRe') and ext not in r.get('dirSkipExt',[]) and re.search(r['dirRe'],rel))
        if hit and (not r.get('projectHas') or (cwd and any(os.path.exists(os.path.join(cwd,m)) for m in r['projectHas']))): out.update(r['rules'])
    return out
RULEREF=re.compile(r'(RULE-[\w-]+\.md|METHOD-[\w-]+\.md)')
SHELL_READ=re.compile(r'''^\s*(?:cat|bat|less|head(?:\s+-n?\s*\d+)?|sed\s+-n\s+\S+)\s+(['"]?)[^\s|;&<>*$]+\1\s*$''')  # one known file printed to read it (agent.A2); pipes, globs and multi-file scans are not counted
EDITS=('Edit','Write','NotebookEdit','MultiEdit')
args=[a for a in sys.argv[1:] if not a.startswith('--')]
BY_MODEL='--by-model' in sys.argv
CUT=args[0] if args else '2026-09-30'  # era split: before/after the route gate (2026-09-30); pass 2026-09-25 to reproduce the router-import split
stats=defaultdict(lambda: defaultdict(int)); comp=defaultdict(lambda: defaultdict(int))
codesess=defaultdict(int); allsess=defaultdict(int); ruleread={'main':[0,0],'subagent':[0,0]}
for f in glob.glob(os.path.expanduser('~/.claude/projects/*/*.jsonl'))+glob.glob(os.path.expanduser('~/.claude/projects/*/*/subagents/*.jsonl')):
    sub='/subagents/' in f; rr=ruleread['subagent' if sub else 'main']
    edits=set(); routed_rules=set(); reads=set(); receipts=set(); first=None; models=Counter()
    boundaries=0; after_boundary=False; want_receipt=False; receipt_ok=0; since=set(); pair=0; pair_ok=0; shell_reads=0; tool_reads=0
    try: fh=open(f,errors='ignore')
    except OSError: continue
    with fh:
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
                        p=i.get('file_path','') or i.get('notebook_path','')
                        rules=routed(p,o.get('cwd')); edits.add(p); routed_rules|=rules
                        if after_boundary:
                            for rule in rules: pair+=1; pair_ok+=rule in since
                    elif b['name']=='Read':
                        fp=i.get('file_path','') or i.get('path','') or ''; base=os.path.basename(fp); tool_reads+=1
                        if '/.aki/akidevrule/' in fp or base=='SKILL.md':
                            part=bool(i.get('limit')) or (i.get('offset') or 0)>1; rr[0]+=1; rr[1]+=part
                            if part: continue
                        reads.add(base); since.add(base)
                    elif b['name']=='Bash':
                        cmd=i.get('command','')
                        for mm in RULEREF.findall(cmd): reads.add(mm); since.add(mm)
                        if SHELL_READ.match(cmd): shell_reads+=1
                elif b.get('type')=='text' and o.get('type')=='assistant':
                    txt=b.get('text','')
                    for mm in re.findall(r'\[RULES\][^\n]*',txt): receipts.add(mm)
                    if want_receipt and txt.strip(): receipt_ok+='[RULES]' in txt; want_receipt=False
    if sub or not first or not edits: continue
    era='after' if first>=CUT else 'before'
    key=(era,models.most_common(1)[0][0] if models else '?') if BY_MODEL else (era,)
    allsess[key]+=1
    if 'RULE-coding.md' in routed_rules: codesess[key]+=1
    for rule,name in TOPIC.items():
        if rule in routed_rules:
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
print('rule reads: '+' | '.join(f"{n} (partial {k}, {100*k/n if n else 0:.1f}%) {w}" for w,(n,k) in ruleread.items()))
