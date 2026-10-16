"""Independent position-based PDF extraction check; preserves count discrepancies."""
from collections import Counter
import json
import re
from pathlib import Path
import pdfplumber

ROOT=Path(__file__).resolve().parents[1]
scope=json.loads((ROOT/'docs/vocabulary-audit/gaokao-2025-scope.json').read_text(encoding='utf8'))
pdf=pdfplumber.open(ROOT/'output/refinement/gaokao-source/curriculum-2025.pdf')
items=[]
for index in range(75,132):
    page=pdf.pages[index]
    words=page.extract_words(extra_attrs=['fontname'])
    minimum=0
    if index==75:
        minimum=next(w['top'] for w in words if w['text']=='A')
    rows={}
    for w in words:
        if w['top']<minimum or w['top']>=680:
            continue
        key=(0 if w['x0']<250 else 1,round(w['top'],0))
        rows.setdefault(key,[]).append(w)
    for key,group in sorted(rows.items()):
        line=' '.join(w['text'] for w in sorted(group,key=lambda w:w['x0'])).strip()
        heading=re.fullmatch('[A-Z]',line) and any('Bold' in w['fontname'] for w in group)
        if line and not heading and re.fullmatch(r"[A-Za-zé0-9.*()/=,; '\-–’]+",line) and not line.isdigit():
            items.append(line)
normalize=lambda line: re.sub(r'\s+(?=\*+$)','',line)
expected=Counter(normalize(x['source_entry']) for x in scope['items'])
actual=Counter(normalize(line) for line in items)
report={'pypdf_entries':sum(expected.values()),'pdfplumber_entries':sum(actual.values()),
        'matched':actual==expected,'only_in_pypdf':list((expected-actual).elements()),
        'only_in_pdfplumber':list((actual-expected).elements()),
        'declared_words':scope['declared_words'],'unresolved_declared_count_difference':scope['declared_words']-sum(expected.values())}
(ROOT/'docs/vocabulary-audit/gaokao-2025-extraction-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(report,ensure_ascii=False,indent=2))
pdf.close()
