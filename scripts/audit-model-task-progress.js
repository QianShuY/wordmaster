'use strict';
// Read-only inspection of worker submissions; never approves or installs content.
const fs=require('node:fs'),path=require('node:path'),{isDeepStrictEqual:eq}=require('node:util');
const root=path.resolve(__dirname,'..'),inputs=path.join(root,'docs/model-tasks-20261015'),outputs=path.join(root,'docs/model-task-results');
const manifest=JSON.parse(fs.readFileSync(path.join(inputs,'manifest.json'),'utf8'));
const owners={A:f=>/^cet[46]-/.test(f.task_id)||(/^tem-/.test(f.task_id)&&+f.task_id.slice(4)<=22),B:f=>/^(npee|gaokao)-/.test(f.task_id)||(/^tem-/.test(f.task_id)&&+f.task_id.slice(4)>=23&&+f.task_id.slice(4)<=36),C:f=>/^tem-/.test(f.task_id)&&+f.task_id.slice(4)>=37};
const report={operation:'worker-progress-inspection-not-approval',checked_at:new Date().toISOString(),workers:[]};
for(const [owner,accept] of Object.entries(owners)){
 const folder=path.join(outputs,'worker-'+owner),assigned=manifest.files.filter(accept);
 const progress=fs.existsSync(path.join(folder,'progress.json'))?JSON.parse(fs.readFileSync(path.join(folder,'progress.json'),'utf8')):null;
 const worker={worker:owner,assigned_tasks:assigned.length,assigned_rows:assigned.reduce((n,f)=>n+f.rows,0),result_files:0,complete_files:0,partial_files:0,actual_rows:0,source_checked_claims:0,needs_review:0,with_example_pair:0,with_issues:0,empty_evidence:0,hash_mismatches:[],identity_mismatches:[],original_mismatches:[],invalid_files:[],claimed_submitted_without_complete_file:[],outside_assignment:[],latest_result_time:null,tasks:[]};
 const ids=new Set(assigned.map(f=>f.task_id));
 if(fs.existsSync(folder))for(const item of fs.readdirSync(folder,{withFileTypes:true}))if(item.isDirectory()&&!ids.has(item.name)&&fs.existsSync(path.join(folder,item.name,'result.json')))worker.outside_assignment.push(item.name);
 for(const f of assigned){
  const filename=path.join(folder,f.task_id,'result.json'),p=progress?.tasks?.find(t=>t.task_id===f.task_id);
  if(!fs.existsSync(filename)){if(p?.status==='submitted')worker.claimed_submitted_without_complete_file.push(f.task_id);continue;}
  try{
   const raw=fs.readFileSync(filename,'utf8'),data=JSON.parse(raw),input=JSON.parse(fs.readFileSync(path.join(inputs,f.file),'utf8'));
   if(!Array.isArray(data.entries))throw Error('entries is not an array');
   worker.result_files++;worker.actual_rows+=data.entries.length;
   const complete=data.entries.length===f.rows;
   worker[complete?'complete_files':'partial_files']++;
   if(p?.status==='submitted'&&!complete)worker.claimed_submitted_without_complete_file.push(f.task_id);
   if(data.input_sha256!==f.sha256||data.task_id!==f.task_id)worker.hash_mismatches.push(f.task_id);
   const time=fs.statSync(filename).mtime.toISOString();if(!worker.latest_result_time||time>worker.latest_result_time)worker.latest_result_time=time;
   worker.tasks.push({task_id:f.task_id,rows:data.entries.length,expected:f.rows,reported_status:p?.status||null});
   for(let i=0;i<data.entries.length;i++){
    const row=data.entries[i],original=input.entries[i];
    const identity=original?.identity||Object.fromEntries(['source_entry','headword','pdf_page','handling','accepted_spellings'].map(k=>[k,original?.[k]]));
    if(!eq(identity,row.identity))worker.identity_mismatches.push(f.task_id+':'+i);
    if(!eq(original?.current??null,row.original))worker.original_mismatches.push(f.task_id+':'+i);
    if(row.verification==='source-checked')worker.source_checked_claims++;
    if(row.verification==='needs-review')worker.needs_review++;
    if(row.proposed?.example?.trim()&&row.proposed?.example_translation?.trim())worker.with_example_pair++;
    if(Array.isArray(row.issues)&&row.issues.length)worker.with_issues++;
    if(!Array.isArray(row.evidence)||!row.evidence.length)worker.empty_evidence++;
   }
  }catch(e){worker.invalid_files.push({task_id:f.task_id,error:e.message});}
 }
 worker.progress_claimed_rows=(progress?.tasks||[]).reduce((n,t)=>n+(Number(t.processed_rows)||0),0);
 report.workers.push(worker);
}
const file=path.join(root,'output/refinement/model-worker-progress-20261016.json');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({file,workers:report.workers.map(({tasks,identity_mismatches,original_mismatches,...w})=>({...w,identity_mismatches:identity_mismatches.length,original_mismatches:original_mismatches.length}))},null,2));
