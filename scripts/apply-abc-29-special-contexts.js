'use strict';
/**
 * Replace remaining 29 literal mention-only examples with contextual
 * auxiliary/interjection/pronoun examples, retaining exact source identity.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const {ownerOf}=require('./audit-model-evidence');
const ROOT=path.resolve(__dirname,'..'),FILE='docs/model-quality-patches/manual-natural-29-metalinguistic-20261018.json';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const originalId=e=>e.identity??Object.fromEntries(['source_entry','headword','pdf_page','handling','accepted_spellings'].map(k=>[k,e[k]]));
function patch(root=ROOT,{apply=false}={}){
 const d=JSON.parse(fs.readFileSync(path.join(root,FILE),'utf8'));
 if(d.approved!==false||d.entries.length!==29)throw Error('Review-only file missing');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
 const meta=new Map(manifest.files.map(x=>[x.task_id,x]));
 const group=new Map(),seen=new Set();
 for(const item of d.entries){
  const key=item.task_id+':'+item.row_index;
  if(seen.has(key))throw Error('Duplicate '+key);
  seen.add(key);
  if(item.worker!==ownerOf(item.task_id)||!Number.isInteger(item.row_index)||item.row_index<0)
   throw Error('Wrong identity '+key);
  if(!item.example||!item.translation||!/[一-鿿]/.test(item.translation))
   throw Error('Invalid bilingual '+key);
  const base=item.word.toLowerCase().replace(/ \d+$/,'');
  if(!item.example.toLowerCase().includes(base))throw Error('Word missing '+key);
  if(!group.has(item.task_id))group.set(item.task_id,[]);
  group.get(item.task_id).push(item);
 }
 let edited=0,already=0;const writes=[];
 for(const [task,items] of group){
  const m=meta.get(task),worker=ownerOf(task);
  if(!m)throw Error('Unknown task '+task);
  const bytes=fs.readFileSync(path.join(root,'docs/model-tasks-20261015',m.file));
  if(sha(bytes)!==m.sha256)throw Error('Source SHA changed '+task);
  const original=JSON.parse(bytes);
  const target=path.join(root,'docs/model-task-results','worker-'+worker,task,'result.json');
  const contents=JSON.parse(fs.readFileSync(target,'utf8'));
  if(contents.input_sha256!==m.sha256||contents.task_id!==task||contents.entries.length!==m.rows)
   throw Error('Result source binding changed '+task);
  let changed=false;
  for(const item of items){
   const source=original.entries[item.row_index],row=contents.entries[item.row_index];
   if(!row||!source||!isDeepStrictEqual(row.identity,originalId(source))
    ||!isDeepStrictEqual(row.original,source.current??null)
    ||(row.identity.word||row.identity.headword)!==item.word)
    throw Error('Mutated source identity '+task+':'+item.row_index);
   if(row.verification!=='needs-review'||row.external_human_review!==false
     ||row.full_dictionary_senses_reviewed!==false)
    throw Error('Unexpected approval '+task+':'+item.row_index);
   const before=row.draft_method==='metalinguistic-placeholder'
     &&row.proposed.example===item.old_example&&row.proposed.example_translation===item.old_translation;
   const after=row.draft_method==='editorial-context-rewrite-needs-review'
     &&row.proposed.example===item.example&&row.proposed.example_translation===item.translation;
   if(!before&&!after)throw Error('Unexpected concurrent edit '+task+':'+item.row_index);
   if(after){already++;continue}
   row.proposed.example=item.example;
   row.proposed.example_translation=item.translation;
   row.draft_method='editorial-context-rewrite-needs-review';
   if(!Array.isArray(row.issues))throw Error('Invalid history');
   row.issues.push('由词语引用占位改写为实际用法例句；仍需独立词典审校。');
   row.change_reason='替换无语境占位，保留词条原始来源和未审核状态。';
   changed=true;edited++;
  }
  if(changed)writes.push({path:target,text:JSON.stringify(contents,null,2)+'\n'});
 }
 if(edited+already!==29)throw Error('Not all 29 accounted');
 if(apply)for(const file of writes)fs.writeFileSync(file.path,file.text);
 return {all:29,edited,already,files:writes.length,applied:apply,approved:0,installed:0,learning_data_changed:false};
}
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.some(x=>x!=='--apply'))throw Error('Invalid argument');
 console.log(JSON.stringify(patch(ROOT,{apply:args.includes('--apply')}),null,2));
}
module.exports={patch};
