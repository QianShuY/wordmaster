'use strict';
// Offline selected-sense review ledger. This never connects to the live DB.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {prepare,readGap}=require('./prepare-gaokao-review'),Policy=require('../shared/answer-policy');
const root=path.join(__dirname,'..'),seed=path.join(root,'app/seed'),audit=path.join(root,'docs/vocabulary-audit');
const SHA={
 'gaokao-common-a-20261013.tsv':'81999641799806e010505685918c772b54b2162614b9c66f59cbf68394442219',
 'gaokao-common-a-phonetics-20261013.tsv':'1302c3b8c069c8199cffde064f52294e0924231f69d4289aa40fed4a6343ffb5',
 'gaokao-selected-reviewed-20261013.json':'82e3fb5987f0d834c3ffb8a2d60a57d7368d23e1eb6e66336c0fef327af158ca'
};
const sha=text=>createHash('sha256').update(text.replace(/\r\n/g,'\n')).digest('hex');
function checkedText(file,expected){const text=fs.readFileSync(file,'utf8');if(sha(text)!==expected)throw new Error('Reviewed content changed; re-review required: '+path.basename(file));return text;}
function tsv(text,header){
 const [first,...lines]=text.trim().split(/\r?\n/);if(first!==header)throw new Error('Unexpected reviewed TSV schema');
 const cols=first.split('\t');return lines.map(line=>{const cells=line.split('\t');if(cells.length!==cols.length||cells.some(c=>!c))throw new Error('Missing teaching field');return Object.fromEntries(cols.map((c,i)=>[c,cells[i]]));});
}
const labels={'n.':'noun','v.':'verb','adj.':'adjective','adv.':'adverb','prep.':'preposition','pron.':'pronoun','conj.':'conjunction'};
const rejected={advice:['advise'],advise:['advice'],adapt:['adopt'],adopt:['adapt'],affect:['effect']};
function build(scope,rows,phonetics,base){
 const draft=prepare(scope,readGap(path.join(seed,'gaokao-gap-examples-20261013.tsv')));
 const units=draft.items.flatMap(item=>item.learning_units.map(unit=>({item,unit})));
 const expected=units.filter(x=>!x.unit.authored&&x.item.handling.type==='single-headword').slice(0,100);
 const byPron=new Map(phonetics.map(p=>[p.headword,p]));
 if(rows.length!==100||new Set(rows.map(x=>x.headword)).size!==100||byPron.size!==100||phonetics.length!==100)throw new Error('Expected exactly 100 unique teaching and pronunciation rows');
 const entries=rows.map((r,i)=>{
  const {item,unit}=expected[i]||{};
  if(!item||unit.headword!==r.headword)throw new Error('Teaching/source order or identity mismatch');
  const pron=byPron.get(r.headword);
  if(!pron||!labels[r.pos]||pron.pos_label!==labels[r.pos])throw new Error('Pronunciation POS mismatch: '+r.headword);
  const url=new URL(pron.url);
  if(url.protocol!=='https:'||!['www.oxfordlearnersdictionaries.com','dictionary.cambridge.org'].includes(url.hostname)||!pron.phonetic||/[әє?]/.test(pron.phonetic))throw new Error('Unverified pronunciation evidence');
  const sourceHead=url.pathname.split('/').pop().replace(/_\d+$/,'').toLowerCase();
  if(url.username||url.password||url.port||url.search||url.hash||sourceHead!==r.headword.toLowerCase())throw new Error('Pronunciation source headword mismatch');
  const escaped=r.headword.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(!new RegExp('\\b'+escaped+'\\b','i').test(r.example)||!/[\u3400-\u9fff]/.test(r.meaning)||!/[\u3400-\u9fff]/.test(r.example_translation)||!r.note)throw new Error('Incomplete selected-sense teaching row');
  const accepted=[r.headword,...(r.headword==='afterward'?['afterwards']:[])];
  return {source_entry:item.source_entry,source_headword:item.headword,pdf_page:item.pdf_page,course_level:item.course_level,
   headword:r.headword,pos:r.pos,meaning:r.meaning,example:r.example,example_translation:r.example_translation,teaching_note:r.note,
   phonetic:pron.phonetic,pronunciation_variety:'British English',pronunciation_source:pron.url,
   pronunciation_note:r.headword==='altogether'?'Cambridge linking r represented as (r); syllable separators retained.':'Selected POS pronunciation; not a full homograph review.',
   accepted_spellings:accepted,answer_policy:Policy.create(r.headword,accepted,rejected[r.headword]||[]),
   spelling_evidence:r.headword==='afterward'?'https://www.oxfordlearnersdictionaries.com/definition/american_english/afterward':pron.url,
   review_status:'selected-sense-reviewed-not-installed',authorship:'original Chinese teaching gloss and bilingual example; dictionary checked selected POS pronunciation',
   review_method:'Codex selected-sense language review with primary dictionary evidence',external_human_review:false,full_dictionary_senses_reviewed:false};
 });
 if(base.status!=='selected-sense-reviewed-not-installed'||base.entries_count!==53||base.entries.length!==53||base.pdf_sha256!==scope.pdf_sha256)throw new Error('Unexpected first reviewed batch');
 const identity=x=>x.source_entry+'\0'+x.headword;
 const allowed=new Set(units.map(x=>identity({source_entry:x.item.source_entry,headword:x.unit.headword})));
 const combined=[...base.entries,...entries];
 if(new Set(combined.map(identity)).size!==combined.length||combined.some(x=>!allowed.has(identity(x))))throw new Error('Duplicate or out-of-scope reviewed unit');
 const index=new Map(combined.map(x=>[identity(x),x]));
 const coverage=units.map(({item,unit})=>({source_entry:item.source_entry,headword:unit.headword,pdf_page:item.pdf_page,course_level:item.course_level,
  review_status:index.has(identity({source_entry:item.source_entry,headword:unit.headword}))?'selected-sense-reviewed-not-installed':'pending-language-review'}));
 return {date:'2026-10-14',status:'partial-selected-sense-review-not-installed',pdf_sha256:scope.pdf_sha256,declared_words:scope.declared_words,
  source_entries:scope.items.length,learning_units:units.length,selected_senses_reviewed:combined.length,pending_units:units.length-combined.length,
  installed_units:0,full_dictionary_senses_reviewed:false,entries:combined,coverage,new_batch:entries,
  blockers:['Remaining selected senses, pronunciations and original examples require review.','Source count and usage evidence still need resolution.','Formal replacement, historical read-only UI and grading integration are not installed.','External human review of high-risk senses and full-site release acceptance remain pending.']};
}
function load(){
 const rows=tsv(checkedText(path.join(seed,'gaokao-common-a-20261013.tsv'),SHA['gaokao-common-a-20261013.tsv']),'headword\tpos\tmeaning\texample\texample_translation\tnote');
 const phonetics=tsv(checkedText(path.join(seed,'gaokao-common-a-phonetics-20261013.tsv'),SHA['gaokao-common-a-phonetics-20261013.tsv']),'headword\tpos_label\tphonetic\turl');
 const base=JSON.parse(checkedText(path.join(audit,'gaokao-selected-reviewed-20261013.json'),SHA['gaokao-selected-reviewed-20261013.json']));
 const scope=JSON.parse(fs.readFileSync(path.join(audit,'gaokao-2025-scope.json'),'utf8'));
 return {scope,rows,phonetics,base};
}
if(require.main===module){
 const {scope,rows,phonetics,base}=load(),report=build(scope,rows,phonetics,base);
 fs.writeFileSync(path.join(audit,'gaokao-reviewed-units-20261014.json'),JSON.stringify({...report,new_batch:undefined},null,2)+'\n');
 const escape=s=>s.replaceAll('|','\\|');
 fs.writeFileSync(path.join(audit,'GAOKAO_COMMON_A_2026-10-14.md'),['# 高考常用词第二批：100 条选定义项','',
  '状态：离线审稿，尚未安装。以下为 Codex 逐条选定义项与原创双语例句，音标按对应词性查对词典；不表示外部人工复核或完整多义词审校已经完成。','',
  '| 单词 | 选定义项与音标 | 原创双语例句 | 用法提示 | 来源 |','| --- | --- | --- | --- | --- |',
  ...report.new_batch.map(e=>`| ${e.headword} | ${escape(e.pos+' '+e.meaning)}<br>/${e.phonetic}/ | ${escape(e.example)}<br>${escape(e.example_translation)} | ${escape(e.teaching_note)} | [音标/词性](${e.pronunciation_source})；PDF ${e.pdf_page} |`),
  '',`累计 ${report.selected_senses_reviewed}/${report.learning_units} 个教学单元有选定义项审稿，仍有 ${report.pending_units} 个待审。修正遗漏的代词 I 后，3,099 源条目、3,111 拆分单元和原文声称的 3,100 不是同一计数口径。`,''].join('\n'));
 console.log(JSON.stringify({new_batch:100,reviewed:report.selected_senses_reviewed,total:report.learning_units,pending:report.pending_units,installed:0},null,2));
}
module.exports={build,load,tsv,checkedText,SHA};
