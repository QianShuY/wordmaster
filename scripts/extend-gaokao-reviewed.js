'use strict';
// Continuous review ledger. No database connection or installation mode.
const fs=require('node:fs'),path=require('node:path'),Base=require('./build-gaokao-reviewed'),{prepare,readGap}=require('./prepare-gaokao-review'),Policy=require('../shared/answer-policy');
const root=path.resolve(__dirname,'..'),seed=path.join(root,'app/seed'),audit=path.join(root,'docs/vocabulary-audit');
const SHA={teaching:'37f2fd33670ecf4456c24678ea15e2538503e39fcbce54385c96fb421298e97d',phonetics:'d048880ca34fec3ecea0920557735ed935ad50ea65805f72cf8182c3c3bef5b6'};
const labels={'n.':'noun','v.':'verb','adj.':'adjective','adv.':'adverb','prep.':'preposition','pron.':'pronoun','conj.':'conjunction','det.':'determiner','num.':'number','modal v.':'modal verb'};
function load(){
 const x=Base.load(),previous=Base.build(x.scope,x.rows,x.phonetics,x.base);
 const rows=Base.tsv(Base.checkedText(path.join(seed,'gaokao-common-b-20261014.tsv'),SHA.teaching),'headword\tpos\tmeaning\texample\texample_translation\tnote');
 const phonetics=Base.tsv(Base.checkedText(path.join(seed,'gaokao-common-b-phonetics-20261014.tsv'),SHA.phonetics),'headword\tpos_label\tphonetic\turl');
 return {scope:x.scope,previous,rows,phonetics};
}
function extend(scope,previous,rows,phonetics,{baseCount=153,count=100,includeI=true}={}){
 const draft=prepare(scope,readGap(path.join(seed,'gaokao-gap-examples-20261013.tsv'))),identity=x=>x.source_entry+'\0'+x.headword;
 const units=draft.items.flatMap(item=>item.learning_units.map(unit=>({item,unit,key:identity({source_entry:item.source_entry,headword:unit.headword})})));
 const done=new Set(previous.entries.map(identity));
 if(done.size!==baseCount||previous.pdf_sha256!==scope.pdf_sha256||previous.learning_units!==units.length||previous.pending_units!==units.length-baseCount)throw new Error('Prior reviewed ledger differs');
 const expected=units.filter(x=>!done.has(x.key)&&x.item.handling.type==='single-headword').slice(0,count);
 const pronoun=units.find(x=>x.unit.headword==='I');
 if(includeI){if(!pronoun||pronoun.item.pdf_page!==101||done.has(pronoun.key))throw new Error('Corrected pronoun I scope differs');expected.push(pronoun);}
 const byPron=new Map(phonetics.map(p=>[p.headword,p]));
 const size=count+(includeI?1:0);
 if(rows.length!==size||new Set(rows.map(r=>r.headword)).size!==size||phonetics.length!==size||byPron.size!==size)throw new Error(`Expected ${size} unique reviewed teaching and pronunciation rows`);
 const extra=rows.map((r,i)=>{
  const target=expected[i];if(r.headword!==target.unit.headword)throw new Error('Source order or headword mismatch');
  const p=byPron.get(r.headword);if(!p||p.pos_label!==labels[r.pos])throw new Error('Selected POS mismatch');
  const url=new URL(p.url),head=url.pathname.split('/').pop().replace(/_\d+$/,'').toLowerCase();
  const verifiedHomograph=url.hostname==='www.oxfordlearnersdictionaries.com'&&r.pos==='v.'&&(
   r.headword==='bow'&&url.pathname==='/definition/english/bow1_1'||r.headword==='close'&&url.pathname==='/definition/english/close1_1'||r.headword==='do'&&url.pathname==='/definition/english/do1_1')||url.hostname==='www.oxfordlearnersdictionaries.com'&&(
   r.headword==='content'&&r.pos==='n.'&&url.pathname==='/definition/english/content1'||r.headword==='entrance'&&r.pos==='n.'&&url.pathname==='/definition/english/entrance1'||r.headword==='contrary'&&r.pos==='adj.'&&url.pathname==='/definition/english/contrary1_1');
  if(url.protocol!=='https:'||!['www.oxfordlearnersdictionaries.com','dictionary.cambridge.org','www.collinsdictionary.com'].includes(url.hostname)||url.username||url.password||url.search||url.hash||url.port||head!==r.headword.toLowerCase()&&!verifiedHomograph||!p.phonetic||/[әє?]/.test(p.phonetic))throw new Error('Unverified selected pronunciation evidence');
  const escaped=r.headword.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(!new RegExp('\\b'+escaped+'\\b','i').test(r.example)||!/[\u3400-\u9fff]/.test(r.meaning)||!/[\u3400-\u9fff]/.test(r.example_translation)||!r.note)throw new Error('Incomplete selected-sense teaching material');
  return {source_entry:target.item.source_entry,source_headword:target.item.headword,pdf_page:target.item.pdf_page,course_level:target.item.course_level,
   headword:r.headword,pos:r.pos,meaning:r.meaning,example:r.example,example_translation:r.example_translation,teaching_note:r.note,
   phonetic:p.phonetic,pronunciation_variety:'British English',pronunciation_source:p.url,pronunciation_note:r.headword==='chopsticks'?'Collins British-English food-utensil sense under In other languages; plural retained, not the musical composition.':r.headword==='cookie'?'Collins British-English biscuit sense; Oxford extraction exposed only the computing sense.':['and','as','at','but','can','could'].includes(r.headword)?'Strong form selected; weak forms also occur in connected speech.':'Selected POS pronunciation; not full homograph review.',
   accepted_spellings:target.unit.accepted_spellings,answer_policy:Policy.create(r.headword,target.unit.accepted_spellings),spelling_evidence:p.url,
   review_status:'selected-sense-reviewed-not-installed',authorship:'moci-original Chinese teaching gloss and bilingual example',review_method:'Codex selected-sense language review with primary dictionary evidence',external_human_review:false,full_dictionary_senses_reviewed:false};
 });
 const entries=[...previous.entries,...extra],allowed=new Set(units.map(x=>x.key));
 if(new Set(entries.map(identity)).size!==baseCount+size||entries.some(e=>!allowed.has(identity(e))))throw new Error('Duplicate or out-of-scope reviewed entry');
 const reviewed=new Set(entries.map(identity));
 const coverage=units.map(({item,unit,key})=>({source_entry:item.source_entry,headword:unit.headword,pdf_page:item.pdf_page,course_level:item.course_level,review_status:reviewed.has(key)?'selected-sense-reviewed-not-installed':'pending-language-review'}));
 return {...previous,new_batch:extra,entries,coverage,selected_senses_reviewed:entries.length,pending_units:units.length-entries.length};
}
if(require.main===module){
 const {scope,previous,rows,phonetics}=load(),report=extend(scope,previous,rows,phonetics);
 fs.writeFileSync(path.join(audit,'gaokao-reviewed-units-current.json'),JSON.stringify({...report,new_batch:undefined},null,2)+'\n');
 const escape=x=>x.replaceAll('|','\\|');
 fs.writeFileSync(path.join(audit,'GAOKAO_COMMON_B_2026-10-14.md'),['# 高考连续教学稿：America 至 awake，以及代词 I','',
  '以下为原创选定义项和双语例句，并逐词查对所选词性对应音标。仍为离线材料，不是外部人工复核或完整词典义项审校；尚未安装。','',
  '| 单词 | 所选义项与音标 | 原创双语例句 | 用法提示 | 音标依据 |','| --- | --- | --- | --- | --- |',
  ...report.new_batch.map(e=>`| ${e.headword} | ${escape(e.pos+' '+e.meaning)}<br>/${e.phonetic}/ | ${escape(e.example)}<br>${escape(e.example_translation)} | ${escape(e.teaching_note)} | [词典](${e.pronunciation_source})；PDF ${e.pdf_page} |`),
  '',`当前累计 ${report.selected_senses_reviewed}/${report.learning_units} 个教学单元有选定义项审稿，待审 ${report.pending_units} 个，正式安装 0。`,''].join('\n'));
 console.log(JSON.stringify({reviewed:report.selected_senses_reviewed,pending:report.pending_units,total:report.learning_units,installed:0}));
}
module.exports={load,extend,SHA};
