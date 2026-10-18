'use strict';
/**
 * ONE-SHOT first-draft coverage: complete every undrafted ABC task, then fill
 * the six explicitly audited blanks without replacing historical user data.
 * Source-bound candidates > cautious same-POS crossbook options > clearly
 * flagged offline-generated draft. No external API keys or network.
 *
 * A full proposed-row count is NOT proof of dictionary verification.
 *
 * node scripts/complete-abc-all.js
 * node scripts/complete-abc-all.js --apply
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const {plan}=require('./plan-next-model-review');
const {combine}=require('./merge-abc-candidate-coverage');
const {make,hasHeadword}=require('./abc-offline-draft');
const {posType}=require('./reuse-abc-local-examples');
const {ownerOf}=require('./audit-model-evidence');
const ROOT=path.resolve(__dirname,'..');
const inputRoot='docs/model-tasks-20261015';
const resultRoot='docs/model-task-results';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const filled=x=>typeof x==='string'&&x.trim().length>0;
const priorMissing={
  'cet4-018:69':['The historian explained why the term "Negro" is outdated and offensive.','历史学家解释了为什么“Negro”这个称谓已经过时且具有冒犯性。'],
  'npee-022:26':['The host greeted her formally as "Madame".','主人以“Madame”（夫人）的敬称正式向她问候。'],
  'npee-025:14':['The book explains that "Negro" is an outdated, offensive term.','这本书解释了“Negro”是一个过时且具有冒犯性的称谓。'],
  'npee-026:85':['The museum removed the label "Oriental" from descriptions of people.','博物馆从人物介绍中删除了“Oriental”这一不合适的旧称。'],
  'npee-032:4':['The article explains how the meaning of "queer" has changed over time.','文章解释了“queer”一词的含义如何随时间变化。'],
  'npee-032:42':['The report examines the lasting harm that rape causes to survivors.','这份报告探讨了强奸对幸存者造成的长期伤害。']
};
function ownerFile(root,owner,name){return path.join(root,resultRoot,'worker-'+owner,name);}
function currentIdentity(x){return x?.identity??Object.fromEntries(
 ['source_entry','headword','pdf_page','handling','accepted_spellings'].map(k=>[k,x?.[k]]));}
function sense(pos,meaning){return {pos:pos??'',meaning:meaning??''};}
function similarity(a,b){
 const chars=x=>new Set(String(x??'').replace(/[的了与和有在个一种是为或及、\s。，；：,;:()（）\d]/g,'').match(/[\u3400-\u9fff]/g)||[]);
 const one=chars(a),two=chars(b);
 return [...one].filter(x=>two.has(x)).length;
}
function candidateFor(source,key,ref){
 const word=String(source?.identity?.word??source?.headword??'').trim();
 const srcPos=source?.current?.pos||source?.candidates?.[0]?.pos||'';
 const meaning=source?.current?.meaning||source?.candidates?.[0]?.meaning||'';
 const typed=posType(srcPos);
 const risks=[];
 const exact=ref?.exact_source_candidate;
 if(exact&&filled(exact.suggested?.example)
  &&filled(exact.suggested?.example_translation)
  &&hasHeadword(exact.suggested.example,word)){
  risks.push('已有同来源例句是待复核素材，不等于已独立确认该词的全部义项。');
  return {example:exact.suggested.example,example_translation:exact.suggested.example_translation,
   method:'existing-exact-source-candidate',issues:risks};
 }
 const choices=(ref?.crossbook_options??[])
  .filter(x=>filled(x.example)&&filled(x.translation)
     &&hasHeadword(x.example,word)
     &&typed&&posType(x.original_pos)===typed)
  .map(x=>({x,score:similarity(meaning,x.original_meaning||x.selected_sense?.meaning)}))
  .sort((a,b)=>b.score-a.score);
 if(choices.length&&choices[0].score>0){
  const donor=choices[0].x;
  risks.push('跨词库候选仅通过词形/词性和粗略释义相似度筛选，不是词典审核；需逐条确认义项。',
   '语义相似度是汉字重合启发式，并非专业词义比对。');
  return {example:donor.example,example_translation:donor.translation,
   method:'crossbook-sense-unverified',issues:risks};
 }
 const draft=make(source,currentIdentity(source));
 return {example:draft.example,example_translation:draft.example_translation,
   method:draft.origin,issues:[
   ...(choices.length?['存在跨书候选但未通过保守释义检查，改用离线草稿。']:[]),
   ...draft.issues]};
}
function complete(root=ROOT,{apply=false}={}){
 const previous=plan(root,{save:false});
 const ledger=combine(root,{save:false});
 if(previous.all.rows_not_yet_drafted!==ledger.result.length)
  throw Error('Ledger out of sync before writing');
 const byRow=new Map(ledger.result.map(r=>[r.task_id+':'+r.row_index,r]));
 if(byRow.size!==ledger.result.length)throw Error('Duplicate candidate keys');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,inputRoot,'manifest.json'),'utf8'));
 const changes=[];
 const progress=new Map();
 const outputByTask=new Map();
 const stats={assigned:0,previous_drafts:previous.all.result_rows,
   created_rows:0,exact_candidates:0,crossbook_candidates:0,
   offline_context_drafts:0,metalinguistic_placeholders:0,
   existing_blanks_completed:0,task_results_created:0,
   existing_task_results_updated:0,high_risk_rows:0,
   accepted:0,installed:0,independently_verified_dictionary_senses:0,
   touched_learning_database:false,preview:[]};
 for(const worker of ['A','B','C']){
  const file=ownerFile(root,worker,'progress.json');
  const d=JSON.parse(fs.readFileSync(file,'utf8'));
  progress.set(worker,{file,data:d,changed:false});
 }
 for(const m of manifest.files){
  const worker=ownerOf(m.task_id);
  if(!worker)throw Error('Unknown worker '+m.task_id);
  const bytes=fs.readFileSync(path.join(root,inputRoot,m.file));
  if(hash(bytes)!==m.sha256)throw Error('Source task digest mismatch '+m.task_id);
  const src=JSON.parse(bytes.toString('utf8'));
  if(src.entries.length!==m.rows||src.task_id!==m.task_id)
   throw Error('Source task shape mismatch '+m.task_id);
  const dir=ownerFile(root,worker,m.task_id);
  const resultPath=path.join(dir,'result.json');
  const exists=fs.existsSync(resultPath);
  let output=exists?JSON.parse(fs.readFileSync(resultPath,'utf8')):
   {task_id:m.task_id,input_sha256:m.sha256,status:'proposal',entries:[]};
  if(output.task_id!==m.task_id||output.input_sha256!==m.sha256||output.status!=='proposal'
   ||!Array.isArray(output.entries))throw Error('Old result metadata mismatch '+m.task_id);
  const oldCount=output.entries.length;
  if(oldCount>m.rows)throw Error('Old prefix too long '+m.task_id);
  const p=progress.get(worker).data.tasks.find(x=>x.task_id===m.task_id);
  if(!p)throw Error('Missing assigned progress item '+m.task_id);
  if(Number(p.processed_rows)!==oldCount)
   throw Error('Progress does not match actual existing prefix '+m.task_id);
  if(oldCount===m.rows&&p.status!=='submitted')
   throw Error('Completed task has wrong progress status '+m.task_id);
  for(let i=0;i<oldCount;i++){
   const old=src.entries[i],row=output.entries[i];
   if(!isDeepStrictEqual(row.identity,currentIdentity(old))
    ||!isDeepStrictEqual(row.original,old?.current??null))
    throw Error('Historical original/identity mismatch '+m.task_id+':'+i);
   const key=m.task_id+':'+i;
   const extra=priorMissing[key];
   const hasPair=filled(row.proposed?.example)&&filled(row.proposed?.example_translation);
   if(extra&&!hasPair){
     // Surgical fix: keep the historical reviewed wording, IPA and original
     // source completely intact. Only previously null example fields changed.
     if(!row.proposed||typeof row.proposed!=='object')
      throw Error('Missing old proposed record '+key);
     row.proposed.example=extra[0];
     row.proposed.example_translation=extra[1];
     if(!Array.isArray(row.issues))row.issues=[];
     row.issues.push('补充的中性/历史语境例句仍待语言审核；原有来源、词性、音标与标注原样保留。');
     stats.existing_blanks_completed++;
   }else if(!hasPair){
     throw Error('Unanticipated older blank pair requires explicit review '+key);
   }
  }
  for(let i=oldCount;i<m.rows;i++){
   const word=src.entries[i];
   const id=m.task_id+':'+i;
   const ref=byRow.get(id);
   if(!ref||ref.input_sha256!==m.sha256||ref.worker!==worker)
    throw Error('Invalid or missing candidate '+id);
   if(!isDeepStrictEqual(ref.identity,word.identity??null))
    throw Error('Candidate row source identity mismatch '+id);
   const suggestion=candidateFor(word,id,ref);
   if(!filled(suggestion.example)||!filled(suggestion.example_translation)
    ||!hasHeadword(suggestion.example,word.identity?.word||word.headword))
    throw Error('Bad bilingual draft '+id);
   const pos=word.current?.pos??word.candidates?.[0]?.pos??'';
   const meaning=word.current?.meaning??word.candidates?.[0]?.meaning??'';
   const method=suggestion.method;
   if(method==='existing-exact-source-candidate')stats.exact_candidates++;
   else if(method==='crossbook-sense-unverified')stats.crossbook_candidates++;
   else if(method==='metalinguistic-placeholder')stats.metalinguistic_placeholders++;
   else stats.offline_context_drafts++;
   if(method!=='existing-exact-source-candidate')stats.high_risk_rows++;
   if(stats.preview.length<15)stats.preview.push({
      word:word.identity?.word||word.headword,method,example:suggestion.example,
      translation:suggestion.example_translation
   });
   output.entries.push({
    identity:currentIdentity(word),original:word.current??null,
    selected_sense:sense(pos,meaning),
    proposed:{pos,meaning,phonetic:null,
      example:suggestion.example,example_translation:suggestion.example_translation,
      teaching_note:'第一轮例句草稿。未审校全部义项、习惯搭配、语态、音标；'+
        (method==='metalinguistic-placeholder'?'仅为引用占位，必须改成真实用法。':'独立复核前不得进入正式词库。')},
    evidence:[],issues:suggestion.issues,
    draft_method:method,
    verification:'needs-review',external_human_review:false,
    full_dictionary_senses_reviewed:false,
    change_reason:'基于词表原文的未审校例句候选；原词条身份和源文件完全保留。'
   });
   stats.created_rows++;
  }
  if(output.entries.length!==m.rows)throw Error('Incomplete output '+m.task_id);
  if(!exists)stats.task_results_created++;
  if(exists&&output.entries.length===oldCount&&stats.existing_blanks_completed>0){
   // Only mark an existing file changed when a known manual repair row is
   // inside its source task (not because a repair occurred in another task).
   const edits=Object.keys(priorMissing).some(k=>k.startsWith(m.task_id+':')
     &&Number(k.split(':')[1])<oldCount);
   if(edits)stats.existing_task_results_updated++;
   if(edits)changes.push({path:resultPath,body:JSON.stringify(output,null,2)+'\n',isNew:false});
  }else if(oldCount<m.rows)
   changes.push({path:resultPath,body:JSON.stringify(output,null,2)+'\n',isNew:!exists});
  if(oldCount<m.rows){
   p.processed_rows=m.rows;p.status='submitted';p.issue_count=output.entries.filter(x=>x.issues?.length).length;
   progress.get(worker).changed=true;
  }
  stats.assigned+=m.rows;
  outputByTask.set(m.task_id,output.entries.length);
 }
 for(const x of progress.values())if(x.changed){
  x.data.updated_at=new Date().toISOString().slice(0,10);
  changes.push({path:x.file,body:JSON.stringify(x.data,null,2)+'\n',isNew:false});
 }
 stats.expected_total=stats.previous_drafts+stats.created_rows;
 stats.expected_missing=stats.assigned-stats.expected_total;
 stats.files_to_write=changes.length;
 if(stats.expected_missing!==0)throw Error('Some ABC rows remain missing');
 if(stats.existing_blanks_completed!==Object.keys(priorMissing).length)
  throw Error('Prior explicitly reviewed blanks have changed');
 if(stats.exact_candidates+stats.crossbook_candidates+stats.offline_context_drafts
   +stats.metalinguistic_placeholders!==stats.created_rows)
  throw Error('New candidate method classification mismatch');
 // A write is only permitted for exactly these result/progress files.
 for(const file of changes){
  const rel=path.relative(root,file.path).replace(/\\/g,'/');
  if(!/^docs\/model-task-results\/worker-[ABC]\/(?:progress\.json|(?:cet4|cet6|tem|npee|gaokao)-\d{3}\/result\.json)$/.test(rel))
   throw Error('Unexpected output path '+rel);
  if(file.isNew&&fs.existsSync(file.path))throw Error('New result already exists '+rel);
 }
 if(apply){
  for(const file of changes){
   fs.mkdirSync(path.dirname(file.path),{recursive:true});
   fs.writeFileSync(file.path,file.body,{flag:file.isNew?'wx':'w'});
  }
  const after=plan(root,{save:false});
  if(after.all.rows_not_yet_drafted!==0||after.all.result_rows!==stats.assigned)
   throw Error('Result count mismatch after writing');
  stats.committed_to_local_worktree=true;
 }else stats.committed_to_local_worktree=false;
 return stats;
}
if(require.main===module){
 const flags=process.argv.slice(2);
 if(flags.some(x=>x!=='--apply'))throw Error('Unknown argument');
 console.log(JSON.stringify(complete(ROOT,{apply:flags.includes('--apply')}),null,2));
}
module.exports={complete,candidateFor,similarity,priorMissing};
