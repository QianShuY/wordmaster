'use strict';
/**
 * Non-destructive triage of cross-book example candidates.
 * Surface likely translation/sense disagreements for editorial review.
 *
 * Character overlap cannot prove semantics. This is a RANKING, not a
 * dictionary verification, and produces no approvals or learner writes.
 */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {ownerOf}=require('./audit-model-evidence');
const OUTPUT='docs/model-quality-patches/crossbook-semantic-review-queue.json';
const STOP=new Set('的了着和及与在是不有一个人种从到或则又里边上中为就某其所而以用等地之事使可更当如把将把无且第'.split(''));
const chars=s=>(String(s??'').match(/[\u3400-\u9fff]/g)||[]).filter(c=>!STOP.has(c));
const extractSense=raw=>{
 const text=String(raw??'').replace(/^\s*(?:\d+[.、．]\s*)/,'');
 // Source sense order is often numbered; all listed senses remain possible.
 return text.replace(/\[[^\]]*\]|（[^）]*）|\([^)]*\)/g,'')
  .replace(/[A-Za-z][A-Za-z0-9 .&/'-]*/g,' ')
  .replace(/\s+/g,'').trim();
};
function compareMeaning(raw,cn){
 const sourceChars=chars(extractSense(raw)),translationChars=chars(cn);
 const wordCount=sourceChars.length;
 const original=new Set(sourceChars),translated=new Set(translationChars);
 const sharedCharacters=[...original].filter(c=>translated.has(c));
 // Chinese two-character chunks carry more semantic information than
 // individual characters. Keep the stopword filtration symmetric.
 const makePairs=list=>{
  const out=new Set();
  for(let i=1;i<list.length;i++)out.add(list[i-1]+list[i]);
  return out;
 };
 const srcPairs=makePairs(sourceChars),translatedPairs=makePairs(translationChars);
 const commonPairs=[...srcPairs].filter(p=>translatedPairs.has(p));
 return {source_characters:wordCount,shared_character_count:sharedCharacters.length,
  shared_pair_count:commonPairs.length,source_pair_count:srcPairs.size,
  examples_of_shared_pairs:commonPairs.slice(0,4)};
}
function triage(root=ROOT,{save=false,maxExamples=150}={}){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
 const summary={
  total_proposals:0,crossbook_to_review:0,
  missing_translation:0,headword_not_visible:0,
  source_meaning_no_chinese_pairs:0,source_meaning_no_shared_characters:0,
  ranked_rows:0,by_book:{},high_priority_examples:[],
  independently_verified_senses:0,installed:0,approved:0,
  limitations:'Chinese character/bigram overlap is a weak review prioritizer. Many legitimate paraphrases have no lexical overlap. A matching bigram also does not establish sense correctness.'
 };
 const ranked=[];
 for(const file of manifest.files){
  const worker=ownerOf(file.task_id);
  if(!worker)throw Error('Missing task owner');
  const p=path.join(root,'docs/model-task-results','worker-'+worker,file.task_id,'result.json');
  const d=JSON.parse(fs.readFileSync(p,'utf8'));
  if(d.task_id!==file.task_id||d.input_sha256!==file.sha256||d.entries.length!==file.rows)throw Error('Source or output mismatch '+file.task_id);
  summary.total_proposals+=d.entries.length;
  for(let i=0;i<d.entries.length;i++){
   const e=d.entries[i];
   if(e.draft_method!=='crossbook-sense-unverified')continue;
   if(e.external_human_review===true||e.full_dictionary_senses_reviewed===true||e.verification!=='needs-review')
    throw Error('Crossbook candidate is unexpectedly approved: '+file.task_id+':'+i);
   summary.crossbook_to_review++;
   const book=file.task_id.split('-')[0];
   summary.by_book[book]=(summary.by_book[book]||0)+1;
   const translation=e.proposed?.example_translation||'',sentence=e.proposed?.example||'';
   if(!translation.trim())summary.missing_translation++;
   const word=e.identity?.word||e.identity?.headword||'';
   const base=word.replace(/ \d+$/,'').toLowerCase();
   const headwordVisible=sentence.toLowerCase().includes(base);
   if(!headwordVisible)summary.headword_not_visible++;
   const cmp=compareMeaning(e.selected_sense?.meaning||e.original?.meaning,translation);
   if(cmp.source_characters>=2&&cmp.shared_pair_count===0)summary.source_meaning_no_chinese_pairs++;
   if(cmp.source_characters>=2&&cmp.shared_character_count===0)summary.source_meaning_no_shared_characters++;
   // No semantic approval or rejection. This is purely a list of candidates
   // requiring close reading, sorted by evidence of mismatch.
   let priority=0;
   if(cmp.source_characters>=2&&cmp.shared_pair_count===0)priority+=3;
   if(cmp.source_characters>=2&&cmp.shared_character_count===0)priority+=3;
   if(!headwordVisible)priority+=1;
   if(!translation.trim())priority+=5;
   if(priority>0)ranked.push({worker,task_id:file.task_id,row_index:i,word,
    source_pos:e.original?.pos||null,source_meaning:e.original?.meaning||null,
    selected_sense:e.selected_sense||null,example:sentence,translation,
    current_draft_method:e.draft_method,flags:{
      no_bigrams:cmp.shared_pair_count===0,no_characters:cmp.shared_character_count===0,
      headword_not_visible:!headwordVisible,translation_empty:!translation.trim()},
    priority,lexical_similarity:cmp,approved:false});
  }
 }
 if(summary.total_proposals!==26612)throw Error('Expected all 26612 proposals');
 ranked.sort((a,b)=>b.priority-a.priority||
  a.task_id.localeCompare(b.task_id)||a.row_index-b.row_index);
 summary.ranked_rows=ranked.length;
 summary.high_priority_examples=ranked.slice(0,Math.max(0,Math.min(maxExamples,1000)));
 if(save){
  const filename=path.join(root,OUTPUT);
  fs.mkdirSync(path.dirname(filename),{recursive:true});
  fs.writeFileSync(filename,JSON.stringify(summary,null,2)+'\n');
 }
 return summary;
}
if(require.main===module){
 const argv=process.argv.slice(2);
 if(argv.some(v=>v!=='--save'))throw Error('Unknown command line option');
 const summary=triage(ROOT,{save:argv.includes('--save')});
 console.log(JSON.stringify({...summary,high_priority_examples:summary.high_priority_examples.slice(0,5)},null,2));
}
module.exports={triage,extractSense,compareMeaning};
