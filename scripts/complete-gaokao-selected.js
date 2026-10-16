'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {prepare,readGap}=require('./prepare-gaokao-review'),Policy=require('../shared/answer-policy');
const GAP_SHA='8ca3d1cf59c66c3d9646d45eee46c69f4793b6ca2c521bda4ef326ee2a3dc1e8';
const extraForms={behaviour:['behavior'],'café':['cafe'],BCE:['B.C.E.'],CE:['C.E.'],email:['e-mail'],yoghurt:['yogurt'],'a.m.':['am'],'p.m.':['pm']};
const extraEvidence={'a.m.':'https://dictionary.cambridge.org/dictionary/learner-english/a-m','p.m.':'https://dictionary.cambridge.org/us/dictionary/learner-english/p-m'};
function readPhonetics(file){const [heading,...lines]=fs.readFileSync(file,'utf8').trim().split(/\r?\n/),columns=heading.split('\t');return lines.map(line=>{const fields=line.split('\t');if(fields.length!==columns.length)throw new Error('Invalid phonetic row');return Object.fromEntries(columns.map((key,i)=>[key,fields[i]]));});}
function complete(scope,gaps,phonetics){
 const draft=prepare(scope,gaps),byHead=new Map(phonetics.map(row=>[row.headword,row]));
 if(byHead.size!==phonetics.length)throw new Error('Duplicate pronunciation binding');
 const entries=draft.items.flatMap(item=>item.learning_units.filter(unit=>unit.authored).map(unit=>{
  const pron=byHead.get(unit.headword);if(!pron?.phonetic||!pron.url)throw new Error('Missing verified pronunciation: '+unit.headword);
  const url=new URL(pron.url);if(!['www.oxfordlearnersdictionaries.com','dictionary.cambridge.org','www.collinsdictionary.com'].includes(url.hostname)||url.protocol!=='https:')throw new Error('Unexpected dictionary evidence');
  const accepted=[...unit.accepted_spellings,...(extraForms[unit.headword]||[])],rejected=item.handling.rejected_source_spelling?[item.handling.rejected_source_spelling]:[];
  const answerPolicy=Policy.create(unit.headword,accepted,rejected);
  return {source_entry:item.source_entry,source_headword:item.headword,pdf_page:item.pdf_page,course_level:item.course_level,
   headword:unit.headword,pos:unit.authored.pos,meaning:unit.authored.meaning,example:unit.authored.example,example_translation:unit.authored.example_translation,
   phonetic:pron.phonetic,pronunciation_variety:'British English',pronunciation_source:pron.url,pronunciation_note:pron.note,
   accepted_spellings:accepted,answer_policy:answerPolicy,spelling_evidence:extraEvidence[unit.headword]||pron.url,
   review_status:'selected-sense-reviewed-not-installed',authorship:'original definition and bilingual example; dictionary checked pronunciation',full_dictionary_senses_reviewed:false};
 }));
 if(entries.length!==phonetics.length)throw new Error('Unused pronunciation bindings');
 return {status:'selected-sense-reviewed-not-installed',edition:scope.edition,pdf_sha256:scope.pdf_sha256,entries_count:entries.length,
  limits:['This is an offline selected-sense batch, not the complete Gaokao book.','No production vocabulary or grading behavior is changed by generating this file.','Other units, source count and safe replacement migration remain pending.'],entries};
}
if(require.main===module){
 const root=path.join(__dirname,'..'),seed=path.join(root,'app/seed'),audit=path.join(root,'docs/vocabulary-audit');
 const gapFile=path.join(seed,'gaokao-gap-examples-20261013.tsv');if(createHash('sha256').update(fs.readFileSync(gapFile)).digest('hex')!==GAP_SHA)throw new Error('Selected meanings/examples changed; review bindings again');
 const scope=JSON.parse(fs.readFileSync(path.join(audit,'gaokao-2025-scope.json'),'utf8')),gaps=readGap(gapFile),phonetics=readPhonetics(path.join(seed,'gaokao-phonetics-20261013.tsv'));
 const report=complete(scope,gaps,phonetics);
 fs.writeFileSync(path.join(audit,'gaokao-selected-reviewed-20261013.json'),JSON.stringify(report,null,2)+'\n');
 const rows=report.entries.map(e=>`| ${e.headword} | /${e.phonetic}/ | ${e.accepted_spellings.join('、')} | [核对来源](${e.pronunciation_source}) |`);
 fs.writeFileSync(path.join(audit,'GAOKAO_PRONUNCIATION_2026-10-13.md'),['# 高考首批 53 条音标与判分审稿','',
  '状态：离线审稿，尚未安装。音标选用英式；保留词典可连读 r 与音节分隔，按义项核对称谓和缩写。大小写、首尾空格、连续空格及直弯撇号按统一输入规则处理；标点、重音字符与连字符不全局删除，仅接受逐词核验形式。','',
  '| 教学词头 | 英式音标 | 可接受拼写 | 来源 |','| --- | --- | --- | --- |',...rows,'',
  'AI 的全称、be 的变形、按性别拆开的词头等不自动互判正确。café/cafe 是此词的已核验变体，不代表可以删除所有法语重音字符。','',
  '生成命令：runtime/node.exe scripts/complete-gaokao-selected.js。原 3,100 计数口径与全库审核仍待完成。',''].join('\n'));
 console.log(JSON.stringify({status:report.status,reviewed_entries:report.entries_count,with_phonetic:report.entries.filter(x=>x.phonetic).length,with_multiple_forms:report.entries.filter(x=>x.accepted_spellings.length>1).length},null,2));
}
module.exports={readPhonetics,complete};
