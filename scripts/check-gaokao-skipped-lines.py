"""Read-only audit of lines excluded by the curriculum scope extractor."""
from collections import Counter
from pathlib import Path
import hashlib
import json
import re
import sys
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
scope = json.loads((ROOT / 'docs/vocabulary-audit/gaokao-2025-scope.json').read_text(encoding='utf8'))
source = ROOT / 'output/refinement/gaokao-source/curriculum-2025.pdf'
if hashlib.sha256(source.read_bytes()).hexdigest() != scope['pdf_sha256']:
    raise ValueError('Source PDF differs from frozen scope')
reader = PdfReader(source)
skipped, unexpected = [], []
headings = {'A'}
for index in range(75, 132):
    started = index > 75
    for line in reader.pages[index].extract_text().splitlines():
        raw = re.sub(r'\s+', ' ', line).strip()
        if not started:
            if raw == 'A':
                started = True
            continue
        if re.fullmatch(r'[A-Z]', raw):
            if raw not in headings:
                headings.add(raw)
                skipped.append({'pdf_page': index + 1, 'raw': raw, 'reason': 'letter-heading'})
                continue
            if raw == 'I' and index == 100:
                continue  # Retained pronoun, separately font-checked.
            unexpected.append({'pdf_page': index + 1, 'raw': raw, 'reason': 'unexpected-repeated-single-letter'})
        elif not raw or raw.isdigit():
            skipped.append({'pdf_page': index + 1, 'raw': raw, 'reason': 'blank-or-page-number'})
        elif re.search(r'[\u3400-\u9fff│]', raw):
            item = {'pdf_page': index + 1, 'raw': raw, 'reason': 'chinese-or-divider'}
            skipped.append(item)
            normalized = re.sub(r'\s+', '', raw)
            normalized = re.sub(r'^\d+|\d+$', '', normalized)
            if normalized not in ['普通高中英语课程标准（2017年版2025年修订）', '│附录│']:
                unexpected.append(item)
        elif not re.fullmatch(r"[A-Za-zé0-9.*()/=,; '\-–’]+", raw):
            item = {'pdf_page': index + 1, 'raw': raw, 'reason': 'unsupported-character'}
            skipped.append(item)
            unexpected.append(item)
report = {'date': '2026-10-15', 'operation': 'read-only-skipped-source-lines-audit',
          'pdf_sha256': scope['pdf_sha256'], 'retained_scope_entries': scope['entry_count'],
          'declared_words': scope['declared_words'], 'counts': dict(Counter(x['reason'] for x in skipped)),
          'unexpected_lines': unexpected, 'skipped_lines': skipped,
          'printed_declared_levels': {'compulsory-education': 1600, 'high-school-required': 500, 'high-school-selective': 1000},
          'extracted_level_groups': dict(Counter(x['course_level'] for x in scope['items'])),
          'limitation': 'Independent inspection of exclusions; does not reconcile declared word count or approve a distribution license.'}
dest = ROOT / 'docs/vocabulary-audit/gaokao-skipped-lines-20261015.json'
dest.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(json.dumps({k: v for k, v in report.items() if k != 'skipped_lines'}, ensure_ascii=False, indent=2))
if '--render-intro' in sys.argv:
    import pdfplumber
    out = ROOT / 'output/pdf/gaokao-appendix-introduction-20261015.png'
    out.parent.mkdir(parents=True, exist_ok=True)
    with pdfplumber.open(source) as pdf:
        pdf.pages[75].to_image(resolution=120).save(str(out))
    print(str(out))
