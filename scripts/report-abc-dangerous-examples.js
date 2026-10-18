'use strict';
const fs=require('node:fs'),path=require('node:path');
const {ownerOf}=require('./audit-model-evidence');
const ROOT=path.resolve(__dirname,'..');
function scan(root=ROOT,{save=false}={}){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
 const result={count:0,metalinguistic:[],homograph_number_leaks:[],all_numbered_headwords:0};
 for(const task of manifest.files){
  const owner=ownerOf(task.task_id);
  const file=path.join(root,'docs/model-task-results','worker-'+owner,task.task_id,'result.json');
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  for(let i=0;i<data.entries.length;i++){
   const e=data.entries[i],word=e.identity?.word||e.identity?.headword||'';
   const en=e.proposed?.example||'';
   if(e.draft_method==='metalinguistic-placeholder'){
    result.metalinguistic.push({worker:owner,task_id:task.task_id,index:i,word,pos:e.original?.pos||e.selected_sense?.pos,
     meaning:e.original?.meaning||e.selected_sense?.meaning,en,cn:e.proposed?.example_translation});
   }
   if(/ \d+$/.test(word)){
    result.all_numbered_headwords++;
    if(en.toLowerCase().includes(word.toLowerCase())){
     result.homograph_number_leaks.push({worker:owner,task_id:task.task_id,index:i,word,en,meaning:e.original?.meaning||null,
      method:e.draft_method||'historical'});
    }
   }
  }
 }
 result.count=result.metalinguistic.length;
 if(save){
  const file=path.join(root,'docs/model-quality-patches/dangerous-example-check.json');
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
 }
 return result;
}
if(require.main===module){
 const flags=process.argv.slice(2);
 if(flags.some(x=>x!=='--save'))throw Error('Unknown option');
 console.log(JSON.stringify(scan(ROOT,{save:flags.includes('--save')}),null,2));
}
module.exports={scan};
