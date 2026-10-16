'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const V=require('../app/vocabulary');
const SCOPE_SHA='4d2d0f33e511dc0d239d2cdc53fe16f38a107afde9bd1ae557cec9ce7bb1bba0';
const ITEMS_SHA='0d1175926ecbbe19a48b03e5aa4ceea87fe054c1a9878c654d8ea2663dff230a';
const set=text=>new Set(text.split('|'));
const spelling=set('analyse|apologise|centimetre|centre|civilisation|colour|criticise|dialogue|favour|favourite|flavour|gramme|grey|honour|humour|kilometre|labour|metre|millimetre|neighbour|neighbourhood|organisation|organise|realise|recognise|theatre|towards|per cent');
const contextual=set('disc|practise|programme');
const informal=set('father|grandfather|grandmother|mother|goodbye');
const synonyms=set('tofu|until');
const abbreviation=set('ad|AI|app|BCE|CE|bike|exam|fridge|gym|kilo|lab|maths|PE|photo|TV');
function handling(item){
 const h=item.headword,related=item.variants.flatMap(x=>x.replace(/^=/,'').split(',').map(x=>x.trim()));
 if(h.includes('/'))return {type:'split-headwords',units:h.split('/').map(headword=>({headword,accepted_spellings:[headword]})),note:'Separate source group members; gender, grammar and meaning may differ. Never interchange blindly.'};
 if(h==='according')return {type:'fixed-complement',units:[{headword:'according to',accepted_spellings:['according to']}],related_forms:['according'],note:'The preposition to is part of the taught phrase; bare according is not an answer.'};
 if(['be','have'].includes(h))return {type:'inflections',units:[{headword:h,accepted_spellings:[h]}],related_forms:related,note:'Conjugated forms are shown as grammar information, not interchangeable spelling answers.'};
 if(['Mr','Mrs','Ms'].includes(h))return {type:'punctuation-variant',units:[{headword:h,accepted_spellings:[h,...related]}],note:'Full stop is a punctuation variant; titles retain distinct meanings.'};
 if(spelling.has(h)&&related.length)return {type:'spelling-variant',units:[{headword:h,accepted_spellings:[h,...related]}]};
 if(contextual.has(h)&&related.length)return {type:'context-limited-variant',units:[{headword:h,accepted_spellings:[h]}],related_forms:related,note:h==='practise'?'practice may be a US verb spelling; its noun senses must not become aliases for the verb.':'Acceptability depends on the selected sense; review before enabling an alternate answer.'};
 if(abbreviation.has(h))return {type:'abbreviation-expansion',units:[{headword:h,accepted_spellings:[h]}],related_forms:related,note:'Expansion is explanatory, not an automatically interchangeable spelling answer.'};
 if(informal.has(h))return {type:'informal-equivalent',units:[{headword:h,accepted_spellings:[h]}],related_forms:related};
 if(synonyms.has(h))return {type:'related-expression',units:[{headword:h,accepted_spellings:[h]}],related_forms:related,note:'Related expressions need context review, not automatic synonym grading.'};
 if(related.length)throw new Error('Unreviewed parenthetical entry: '+item.source_entry);
 if(h==='humourous')return {type:'source-spelling-correction',units:[{headword:'humorous',accepted_spellings:['humorous']}],rejected_source_spelling:h,
  evidence:{pdf_page:101,visual_check:'output/refinement/gaokao-source/page101-spelling-check.png',dictionary:'https://www.oxfordlearnersdictionaries.com/us/definition/english/humorous'},note:'Preserve the source spelling as evidence, teach standard humorous; do not mark humourous correct.'};
 const headword=h.replace(/[’‘]/g,"'");return {type:headword===h?'single-headword':'apostrophe-normalisation',units:[{headword,accepted_spellings:[headword]}]};
}
function readGap(file){
 const [header,...lines]=fs.readFileSync(file,'utf8').trim().split(/\r?\n/),columns=header.split('\t');
 return lines.map(line=>{const cells=line.split('\t');if(cells.length!==columns.length)throw new Error('Bad bilingual gap row');return Object.fromEntries(columns.map((key,i)=>[key,cells[i]]));});
}
function prepare(scope,gaps){
 if(scope.pdf_sha256!==SCOPE_SHA||scope.entry_count!==scope.items.length||createHash('sha256').update(JSON.stringify(scope.items)).digest('hex')!==ITEMS_SHA)throw new Error('Scope evidence differs from reviewed PDF');
 const gapKey=(source,head)=>source+'\u0000'+head;
 const byGap=new Map(gaps.map(row=>[gapKey(row.source_headword,row.teaching_headword),row]));if(byGap.size!==gaps.length)throw new Error('Duplicate authored entry');
 const cases=new Map();for(const item of scope.items)for(const head of item.headword.split('/')){const lower=head.toLowerCase();if(!cases.has(lower))cases.set(lower,new Set());cases.get(lower).add(head);}
 const index=new Map(),exact=new Map();for(const spec of V.CATALOG)for(const w of V.buildBook(spec).words){
  const key=w.headword.toLowerCase(),candidate={source_file:spec.file,source_line:w.source_line,word:w.word,pos:w.pos,meaning:w.meaning,phonetic:w.phonetic};
  if(!index.has(key))index.set(key,[]);index.get(key).push(candidate);
  if(!exact.has(w.headword))exact.set(w.headword,[]);exact.get(w.headword).push(candidate);
 }
 const used=new Set();const items=scope.items.map(item=>{
  const rule=handling(item);
  if(gaps.some(row=>row.source_headword===item.headword&&!rule.units.some(unit=>unit.headword===row.teaching_headword)))throw new Error('Authored/source headword mismatch: '+item.headword);
  const units=rule.units.map(unit=>{
   const key=gapKey(item.headword,unit.headword),authored=byGap.get(key);if(authored)used.add(key);
   if(authored&&(!/[\u3400-\u9fff]/.test(authored.meaning)||!/[\u3400-\u9fff]/.test(authored.example_translation)||!authored.example.toLowerCase().includes(unit.headword.toLowerCase())))throw new Error('Incomplete bilingual teaching draft: '+key);
   const candidates=unit.accepted_spellings.flatMap(head=>cases.get(head.toLowerCase())?.size>1?exact.get(head)||[]:index.get(head.toLowerCase())||[]);
   return {...unit,candidates,review_status:'pending-full-sense-and-phonetic-review',
    authored:authored?{pos:authored.pos,meaning:authored.meaning,example:authored.example,example_translation:authored.example_translation,authorship:'original bilingual teaching draft; one selected sense',review_status:'selected-sense-and-example-reviewed-phonetic-pending'}:null};
  });
  return {...item,handling:{...rule,units:undefined},learning_units:units};
 });
 if(used.size!==byGap.size)throw new Error('Authored entries not present in the source');
 const units=items.flatMap(x=>x.learning_units),categories={};for(const x of items)categories[x.handling.type]=(categories[x.handling.type]||0)+1;
 return {edition:scope.edition,pdf_sha256:scope.pdf_sha256,status:'review-draft-not-installed',declared_words:scope.declared_words,source_entries:items.length,learning_units:units.length,
  count_note:'PDF declares 3100 words; corrected extraction has 3099 source groups, including pronoun I. Splitting slash groups produces learning units, not a reconciliation of the declared count.',
  authored_selected_senses:gaps.length,units_with_candidate_or_authored:units.filter(x=>x.candidates.length||x.authored).length,categories,
  install_blockers:['Declared count discrepancy unresolved; never pad to 3100.','All remaining candidate senses and phonetics require review.','Each installed learning unit requires an approved bilingual example.','Spelling grader must support reviewed variants without accepting inflections or unrelated senses.','Replacement migration must preserve learning identity and historical records.'],items};
}
if(require.main===module){
 const root=path.join(__dirname,'../docs/vocabulary-audit'),scope=JSON.parse(fs.readFileSync(path.join(root,'gaokao-2025-scope.json'),'utf8'));
 const gapFile=path.join(__dirname,'../app/seed/gaokao-gap-examples-20261013.tsv'),result=prepare(scope,readGap(gapFile));
 result.authored_sha256=createHash('sha256').update(fs.readFileSync(gapFile)).digest('hex');
 fs.writeFileSync(path.join(root,'gaokao-2025-teaching-review.json'),JSON.stringify(result,null,2)+'\n');
 const rows=result.items.flatMap(item=>item.learning_units.filter(unit=>unit.authored).map(unit=>`| ${item.headword} | ${unit.headword} | ${unit.authored.pos} ${unit.authored.meaning} | ${unit.authored.example}<br>${unit.authored.example_translation} | ${item.pdf_page} |`));
 fs.writeFileSync(path.join(root,'GAOKAO_SELECTED_SENSES_2026-10-13.md'),[
  '# 高考教学稿：53 条补缺义项与例句','',
  '本稿未安装，每条仅选取一个教学义项；不是词典全文，也不是完整高考词库。首批音标和判分审稿另见 [53 条音标审稿](GAOKAO_PRONUNCIATION_2026-10-13.md)。例句及中文释义为独立编写的教学内容。来源列保留课标原词头，教学列显示所采用的拼写或固定搭配。','',
  '| 来源词头 | 教学词头 | 选定义项 | 原创双语例句 | PDF 页 |','| --- | --- | --- | --- | --- |',...rows,'',
  'humourous 的原文拼写已核对 PDF 第 101 页；教学稿使用标准 humorous，依据 [Oxford Learner’s Dictionaries](https://www.oxfordlearnersdictionaries.com/us/definition/english/humorous)。',
  'according (to) 按固定搭配 according to 编写；chairman/chairwoman 拆分后为 chairwoman 单独配义，不把两者判作同一个拼写答案。',''].join('\n'));
 console.log(JSON.stringify(Object.fromEntries(Object.entries(result).filter(([key])=>key!=='items')),null,2));
}
module.exports={handling,readGap,prepare};
