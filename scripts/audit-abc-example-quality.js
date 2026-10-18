'use strict';
/**
 * Read-only editorial triage of the 26,612 first-draft examples.
 * This is a rule-based review queue, NOT a grammar scoring model.
 * node scripts/audit-abc-example-quality.js
 * node scripts/audit-abc-example-quality.js --save
 */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {ownerOf}=require('./audit-model-evidence');
const REPORT='docs/model-quality-patches/example-quality-audit-20261018.json';
const rules=[
 {id:'generic-noun-template',pattern:/^(?:The report includes a discussion of|The students asked questions about|The guide described|The article examines the role of|They collected information about|We learned about|The book offers a clear introduction to) /i},
 {id:'generic-verb-template',pattern:/^(?:We need to .+ the materials carefully|The staff were asked to .+ the items before noon|The team decided to .+ the equipment after the inspection|It may be necessary to .+ the documents again|The students were encouraged to .+ during the activity|They agreed to .+ after a short break|We had to .+ before the meeting began|She hoped to .+ before the end of the day)\.$/i},
 {id:'generic-adjective-template',pattern:/^(?:The situation seemed|The results were described as|The group found the proposal|The final design looked) /i},
 {id:'generic-adverb-template',pattern:/^(?:She explained the decision|The group responded|The instructions were followed) /i},
 {id:'metalinguistic-nonexample',pattern:/^(?:The teacher wrote "|The expression ")/i},
 {id:'translation-metalinguistic',pattern:/“[^”]+”(?:这项操作|的处理|这一表达|这一词|的话题)/},
];
function report(root=ROOT,{save=false}={}){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
 const stats={
  assigned:0,rows:0,missing_pairs:0,by_method:{},by_owner:{},
  automatic_review_flags:{},flagged_unique:0,flagged_by_book:{},examples:[],
  independent_verified_dictionary_senses:0,approved:0,installed:0,
  note:'Regex rules find likely mechanical/incorrect examples, but cannot certify grammaticality or source meaning.'
 };
 for(const task of manifest.files){
  const owner=ownerOf(task.task_id);
  if(!owner)throw Error('Unknown worker');
  const file=path.join(root,'docs/model-task-results','worker-'+owner,task.task_id,'result.json');
  const src=JSON.parse(fs.readFileSync(file,'utf8'));
  if(src.entries.length!==task.rows||src.input_sha256!==task.sha256)
   throw Error('Identity or length mismatch '+task.task_id);
  stats.assigned+=task.rows;
  for(let i=0;i<src.entries.length;i++){
   const e=src.entries[i],word=e.identity?.word||e.identity?.headword;
   const method=e.draft_method||'historical-proposal-untagged';
   stats.by_method[method]=(stats.by_method[method]||0)+1;
   stats.by_owner[owner]=(stats.by_owner[owner]||0)+1;
   stats.rows++;
   const en=e.proposed?.example,cn=e.proposed?.example_translation;
   if(!en?.trim()||!cn?.trim())stats.missing_pairs++;
   const flags=rules.filter(rule=>rule.pattern.test(rule.id==='translation-metalinguistic'?cn||'':en||''))
    .map(rule=>rule.id);
   if(flags.length){
    stats.flagged_unique++;
    const book=task.task_id.split('-')[0];
    stats.flagged_by_book[book]=(stats.flagged_by_book[book]||0)+1;
    for(const flag of flags)stats.automatic_review_flags[flag]=(stats.automatic_review_flags[flag]||0)+1;
    if(stats.examples.length<80)stats.examples.push({
      task_id:task.task_id,row_index:i,word,pos:e.original?.pos||e.selected_sense?.pos,
      meaning:e.original?.meaning||e.selected_sense?.meaning,
      en,cn,method,flags
    });
   }
  }
 }
 if(stats.rows!==stats.assigned||stats.missing_pairs)throw Error('Corpus count or bilingual gap');
 if(save){
  const file=path.join(root,REPORT);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(stats,null,2)+'\n');
 }
 return stats;
}
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.some(x=>x!=='--save'))throw Error('Invalid flag');
 const result=report(ROOT,{save:args.includes('--save')});
 console.log(JSON.stringify({
  ...result,examples:result.examples.slice(0,12)
 },null,2));
}
module.exports={report,rules};
