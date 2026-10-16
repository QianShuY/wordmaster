"""Extract factual headwords/level markers from the 2025 curriculum appendix.
This makes a review manifest, never an installed wordbook or official Chinese definitions.
"""
import hashlib
import json
import re
import sys
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'output/refinement/gaokao-source/curriculum-2025.pdf'
DEST = ROOT / 'docs/vocabulary-audit/gaokao-2025-scope.json'

def extract(source=SOURCE):
    reader = PdfReader(source)
    if len(reader.pages) != 178:
        raise ValueError('Unexpected PDF edition/page count')
    introduction = reader.pages[75].extract_text()
    if not re.search(r'3100\s*个单词', introduction):
        raise ValueError('Expected appendix introduction not found')
    items, rejected = [], []
    headings = {'A'}
    for index in range(75, 132):
        lines = reader.pages[index].extract_text().splitlines()
        started = index > 75
        for line in lines:
            raw = re.sub(r'\s+', ' ', line).strip()
            if not started:
                if raw == 'A':
                    started = True
                continue
            if re.fullmatch(r'[A-Z]', raw):
                if raw not in headings:
                    headings.add(raw)
                    continue
                if raw != 'I' or index != 100:
                    raise ValueError('Unexpected repeated single-letter entry: ' + raw)
                # PDF 101 contains a bold section I, then the regular pronoun I.
                # The independent positional/font check validates that distinction.
            if not raw or re.search(r'[\u3400-\u9fff│]', raw) or raw.isdigit():
                continue
            if not re.fullmatch(r"[A-Za-zé0-9.*()/=,; '\-–’]+", raw):
                rejected.append({'pdf_page': index+1, 'raw': raw})
                continue
            markers = len(re.search(r'\*+$',raw).group()) if re.search(r'\*+$',raw) else 0
            spelling = re.sub(r'\*+$','',raw).strip()
            main = spelling.split('(')[0].strip()
            variants = re.findall(r'\(([^)]+)\)',spelling)
            items.append({'source_entry':raw, 'headword':main, 'variants':variants,
                          'course_level': ['compulsory-education','high-school-required','high-school-selective'][min(markers,2)],
                          'pdf_page':index+1, 'printed_page':index-2})
    download = json.loads((Path(source).parent / 'download.json').read_text(encoding='utf8'))
    return {'edition':'2017 edition, 2025 revision', 'declared_words':3100,
            'download_url':download['url'],
            'pdf_sha256':hashlib.sha256(Path(source).read_bytes()).hexdigest(),
            'source_kind':'republished curriculum PDF; headwords and level facts only',
            'status':'scope-extracted-not-language-approved-not-installed',
            'entry_count':len(items), 'unparsed_lines':rejected,
            'extraction_revision':'2026-10-14: preserve pronoun I after the letter heading; independently font checked', 'items':items}

if __name__ == '__main__':
    result = extract(Path(sys.argv[1]) if len(sys.argv)>1 else SOURCE)
    DEST.parent.mkdir(parents=True,exist_ok=True)
    DEST.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({k:v for k,v in result.items() if k!='items'},ensure_ascii=False,indent=2))
