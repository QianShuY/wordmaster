'use strict';
// Explicit preview publication: structural checks are not language approval.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),Policy=require('../shared/answer-policy');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const key=e=>JSON.stringify([e.source_entry,e.headword]);
function build(){
 const teaching=read('docs/vocabulary-audit/gaokao-2025-teaching-review.json');
 const reviewed=read('docs/vocabulary-audit/gaokao-reviewed-units-current.json');
 const approved=new Map(reviewed.entries.map(e=>[key(e),e])),drafts=new Map();
 const manifest=read('docs/model-tasks-20261015/manifest.json');
 for(const file of manifest.files.filter(f=>f.task_id.startsWith('gaokao-'))){
  const raw=fs.readFileSync(path.join(root,'docs/model-tasks-20261015',file.file));
  if(createHash('sha256').update(raw).digest('hex')!==file.sha256)throw Error('Changed task '+file.task_id);
  const input=JSON.parse(raw),result=read('docs/model-task-results/worker-B/'+file.task_id+'/result.json');
  if(result.input_sha256!==file.sha256||input.entries.length!==result.entries.length)throw Error('Incomplete task '+file.task_id);
  for(let i=0;i<input.entries.length;i++){
   const source=input.entries[i],row=result.entries[i];
   if(key(source)!==key(row.identity)||source.pdf_page!==row.identity.pdf_page||JSON.stringify(source.accepted_spellings)!==JSON.stringify(row.identity.accepted_spellings)||drafts.has(key(source)))throw Error('Draft identity '+file.task_id+':'+i);
   drafts.set(key(source),{...row,task_id:file.task_id});
  }
 }
 const entries=teaching.items.flatMap(item=>item.learning_units.map(unit=>{
  const identity={source_entry:item.source_entry,headword:unit.headword};
  const selected=approved.get(key(identity)),draft=drafts.get(key(identity)),content=selected||draft?.proposed||unit.authored;
  if(!content||!content.pos||!/[\u3400-\u9fff]/.test(content.meaning)||!content.example||!/[\u3400-\u9fff]/.test(content.example_translation))throw Error('Incomplete preview '+unit.headword);
  const candidate=unit.candidates.find(c=>c.pos===content.pos)||unit.candidates[0];
  const policy=selected?.answer_policy||Policy.create(unit.headword,unit.accepted_spellings);
  if(!Policy.bound(policy,unit.headword))throw Error('Invalid spelling policy');
  return {...identity,pdf_page:item.pdf_page,course_level:item.course_level,pos:content.pos,meaning:content.meaning,
   phonetic:content.phonetic||candidate?.phonetic||'',example:content.example,example_translation:content.example_translation,
   answer_policy:policy,content_status:selected?'selected-sense-reviewed':'draft-needs-review',
   provenance:selected?{ledger:'gaokao-reviewed-units-current.json'}:{task_id:draft?.task_id||null,method:draft?.draft_method||'authored-gap',phonetic_candidate:candidate||null}};
 }));
 if(entries.length!==3111||new Set(entries.map(e=>e.headword)).size!==entries.length)throw Error('Incomplete or duplicate Gaokao scope');
 return {version:'2026-10-28-preview',status:'learning-preview-quality-review-deferred',source_entries:teaching.source_entries,
  declared_source_count:3100,count_note:teaching.count_note,source_pdf_sha256:teaching.pdf_sha256,
  full_dictionary_senses_reviewed:false,external_human_review:false,
  counts:{entries:entries.length,selected_sense_reviewed:entries.filter(e=>e.content_status==='selected-sense-reviewed').length,
   draft_needs_review:entries.filter(e=>e.content_status==='draft-needs-review').length,missing_phonetic:entries.filter(e=>!e.phonetic).length},entries};
}
if(require.main===module){const data=build();fs.writeFileSync(path.join(root,'app/seed/gaokao-preview.json'),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(data.counts));}
module.exports={build};
