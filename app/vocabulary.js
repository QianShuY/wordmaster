'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const VERSION = '2026-10-28.1';
const CATALOG = [
  { name: '中考核心词汇', file: 'zhongkao.txt', label: '中考词表' },
  { name: '四级核心词汇', file: 'cet4.txt', label: '四级词表' },
  { name: '六级核心词汇', file: 'cet6.txt', label: '六级词表' },
  { name: '考研大纲词汇', file: 'npee.txt', label: '考研词表' },
  { name: '英语专四专八词汇', file: 'tem.txt', label: '专四专八词表' },
];
const POS = '(?:vt|vi|adj|adv|prep|conj|pron|art|num|interj|int|aux|abbr|modal|n|v|a|ad)\\.';
const LINE = new RegExp(`^(.+?)\\s+(?:\\[([^\\]]+)\\]\\s*(?:[（(]pl\\s+[^)）]+[)）]\\s*)?)?(${POS}(?:\\s*[/&]\\s*${POS})*)\\s*(.+)$`, 'i');

function parseSourceLine(raw, { correctKnownErrors = true } = {}) {
  const text = raw.replace(/^\uFEFF/, '').trim().replace(/^([^\[]*\S)\[/, '$1 [');
  if (!text || /^[A-Z]$/.test(text)) return { status: 'heading' };
  const match = text.match(LINE);
  if (!match) return { status: 'excluded', reason: '无法可靠拆分词头、音标与词性' };
  let [, word, phonetic = '', pos, meaning] = match;
  word = word.trim().replace(/^\*+\s*/, '').replace(/[’‘]/g, "'");
  const numbered = word.match(/^(.+?)\s+([1-9]\d?)$/);
  const headword = numbered ? numbered[1] : word;
  if (!/^[A-Za-z]+(?:[-'][A-Za-z]+)*(?: [A-Za-z]+(?:[-'][A-Za-z]+)*)*$/.test(headword)) {
    return { status: 'excluded', reason: '词头含待核验变体或非拼写字符' };
  }
  meaning = meaning.trim();
  if (!/[\u3400-\u9fff]/.test(meaning) || /\[/.test(headword)) {
    return { status: 'excluded', reason: '释义缺少中文或字段错位' };
  }
  let corrected = correctKnownErrors && headword === 'abolish' && pos === 'n.' && meaning === '废除，消除 v. 废除，取消';
  if (corrected) { pos = 'v.'; meaning = '废除，取消'; }
  // Verified against Cambridge: the supplied CET6/TEM source omits final /n/.
  if (correctKnownErrors && headword === 'restrain' && phonetic === 'rɪˈstreɪ') {
    phonetic = 'rɪˈstreɪn'; corrected = true;
  }
  if(correctKnownErrors)for(const fix of require('./seed/cet6-corrections.json')){
    if(word===fix.word&&pos===fix.from.pos&&phonetic===fix.from.phonetic&&meaning===fix.from.meaning){phonetic=fix.to.phonetic;corrected=true;}
  }
  return {
    status: 'accepted', corrected,
    entry: { word, headword, homograph: numbered ? Number(numbered[2]) : null,
      phonetic: phonetic.trim(), pos: pos.replace(/\s/g, ''), meaning },
  };
}

function buildBook(spec, seedDir = path.join(__dirname, 'seed')) {
  const raw = fs.readFileSync(path.join(seedDir, spec.file), 'utf8');
  const report = { name: spec.name, file: spec.file, version: VERSION,
    sha256: createHash('sha256').update(raw).digest('hex'), nonempty: 0,
    headings: 0, accepted: 0, duplicates: 0, excluded: 0, corrected: 0, issues: [] };
  const entries = new Map();
  const conflicts = new Set();
  for (const [index, line] of raw.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    report.nonempty++;
    // Reviewed exceptions are source-file + exact-line + original-text scoped.
    // Do not relax the general parser or rewrite raw evidence/user imports.
    const recovery = require('./seed/cet6-recovered.json').find(item => item.source_file === spec.file && item.source_line === index+1 && item.source_raw === line);
    const parsed = parseSourceLine(recovery ? recovery.corrected : line);
    if(recovery && parsed.status==='accepted') {
      parsed.corrected=true;
      parsed.entry.reviewed_example=recovery.reviewed_example;
    }
    if (parsed.status === 'heading') { report.headings++; continue; }
    if (parsed.status === 'excluded') {
      report.excluded++; report.issues.push({ line: index + 1, reason: parsed.reason, raw: line }); continue;
    }
    const original={...parsed.entry,source_file:spec.file,source_line:index+1,source_raw:line};
    const pronunciation=require('../shared/content-batch').reviewedPhonetic(original);
    const meaningFix=require('../shared/content-corrections').reviewedMeaning(original);
    if(pronunciation){parsed.entry.phonetic=pronunciation.to.phonetic;parsed.corrected=true;}
    if(meaningFix){parsed.entry.meaning=meaningFix.to.meaning;parsed.corrected=true;}
    const symbol=require('../shared/phonetic-symbols').reviewedSymbol({...original,...parsed.entry});
    if(symbol){parsed.entry.phonetic=symbol.to.phonetic;parsed.corrected=true;}
    // Later reviews can bind the exact previously normalized pronunciation.
    // Keep both stages exact; do not normalize imports or weaken source guards.
    const subsequentMeaning=require('../shared/content-corrections').reviewedMeaning({...original,...parsed.entry});
    if(subsequentMeaning){parsed.entry.meaning=subsequentMeaning.to.meaning;parsed.corrected=true;}
    const lexical=require('../shared/lexical-corrections').reviewedLexical({...original,...parsed.entry});
    if(lexical){Object.assign(parsed.entry,lexical.to);parsed.corrected=true;}
    const suspect = parsed.entry;
    const knownIssue = (['cet6.txt', 'tem.txt'].includes(spec.file) && suspect.word === 'boom 2' && suspect.meaning.includes('帆的下析'))
      ? '抽查发现疑似文字损坏，待核验 nautical 义项'
      : spec.file === 'npee.txt' && suspect.word === 'vocal' && suspect.meaning.includes('n.元音')
      ? '抽查发现名词义项与 vowel 混淆，待核验'
      : spec.file === 'tem.txt' && suspect.word === 'pace' && suspect.meaning.includes('并驾齐驱  1. 踱步')
      ? '抽查发现名词释义中混入未标注的动词义项，待核验' : null;
    if (knownIssue) { report.excluded++; report.issues.push({ line: index + 1, reason: knownIssue, raw: line }); continue; }
    const key = parsed.entry.word;
    const prior = entries.get(key);
    if (conflicts.has(key)) {
      report.excluded++; report.issues.push({ line: index + 1, reason: '重复词头存在不同内容，待核验', raw: line }); continue;
    }
    if (prior) {
      if (JSON.stringify(parsed.entry) === JSON.stringify(prior.content)) { report.duplicates++; continue; }
      entries.delete(key); conflicts.add(key); report.excluded += 2;
      report.issues.push({ line: prior.source_line, reason: '重复词头存在不同内容，待核验', raw: prior.source_raw },
        { line: index + 1, reason: '重复词头存在不同内容，待核验', raw: line });
      continue;
    }
    if (parsed.corrected) report.corrected++;
    entries.set(key, { ...parsed.entry, content: parsed.entry, source_file: spec.file, source_line: index + 1, source_raw: line });
  }
  const words = [...entries.values()].map(({ content, ...entry }) => entry);
  report.accepted = words.length;
  report.unique_headwords = new Set(words.map(w => w.headword.toLowerCase())).size;
  report.letters = [...new Set(words.map(w => w.headword[0].toUpperCase()))].sort().join('');
  return { words, report };
}

// CSV fields retain empty columns and quoted commas; malformed quotes are rejected.
function splitFields(text, delimiter) {
  const fields = []; let field = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === delimiter) { fields.push(field.trim()); field = ''; closed = false; }
    else if (c === '"' && !field.trim() && !closed) { field = ''; quoted = true; }
    else if (closed && c.trim()) return null;
    else field += c;
  }
  if (quoted) return null;
  fields.push(field.trim());
  return fields;
}

function parseImportLine(line) {
  const text = String(line || '').replace(/^\uFEFF/, '').trim();
  if (!text) return null;
  const parsed = parseSourceLine(text, { correctKnownErrors: false });
  if (parsed.status === 'accepted') {
    // User imports keep their own headword; built-in metadata is never inferred.
    const { word, phonetic, pos, meaning } = parsed.entry;
    return { word, phonetic, pos, meaning };
  }
  const delimiter = text.includes('\t') ? '\t' : text.includes(',') ? ',' : text.includes('，') ? '，' : null;
  if (delimiter) {
    const fields = splitFields(text, delimiter);
    if (!fields || fields.length < 2 || !fields[0] || /[\u3400-\u9fff]/.test(fields[0])) return null;
    const [word, second, ...rest] = fields;
    const hasPos = new RegExp(`^${POS}(?:[/&]${POS})*$`, 'i').test(second);
    const meaning = hasPos || (!second && rest.length) ? rest.join(delimiter).trim() : [second, ...rest].join(delimiter).trim();
    return meaning ? { word, phonetic: '', pos: hasPos ? second : '', meaning } : null;
  }
  const match = text.match(/^([A-Za-z][A-Za-z\d\-' ]*?)\s+(.+[\u3400-\u9fff].*|[\u3400-\u9fff].*)$/);
  return match ? { word: match[1].trim(), phonetic: '', pos: '', meaning: match[2].trim() } : null;
}

module.exports = { VERSION, CATALOG, parseSourceLine, buildBook, parseImportLine, splitFields };
