'use strict';
/**
 * Finish two already-in-progress A/B 100-row task batches, with explicit
 * source-backed candidate selection and manually authored English/Chinese
 * exceptions. The entire output is a NEEDS-REVIEW proposal, never approval.
 *
 * node scripts/complete-current-abc-batches.js          # dry run
 * node scripts/complete-current-abc-batches.js --apply
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const {plan}=require('./plan-next-model-review');
const ROOT=path.resolve(__dirname,'..');
const records=[
 {worker:'A',task:'cet4-022',overrides:{
  plastic:['The clay remains plastic and easy to shape.','这块黏土仍有可塑性，容易塑形。','可塑的（形容词）'],
  plot:['The family rented a small plot of land to grow vegetables.','这家人租了一小块地来种蔬菜。','小块土地'],
  plunge:['The sudden news plunged the team into confusion.','突如其来的消息使团队陷入混乱。','使陷入'],
  please:['The gift will please her very much.','这份礼物会让她非常高兴。','使高兴'],
  Portuguese:['She has been learning Portuguese for two years.','她学习葡萄牙语已经两年了。','葡萄牙语'],
  power:['The council used its power to protect the park.','委员会运用自己的权力保护公园。','权力'],
  praise:['The coach offered praise after the team improved.','球队取得进步后，教练给予了赞扬。','赞扬（名词）'],
  pray:['They pray for peace every evening.','他们每晚都祈祷和平。','祈祷（动词）']
 }},
 {worker:'B',task:'npee-043',overrides:{
  thrust:['She thrust the letter into her coat pocket.','她把信猛地塞进外套口袋。','猛推；猛塞（动词）'],
  tidy:['His desk looks tidy after the cleanup.','整理过后，他的书桌看起来很整洁。','整洁的（形容词）'],
  till:['The library stays open till nine in the evening.','图书馆一直开放到晚上九点。','直到'],
  tip:['She left a small tip for the waiter.','她给服务员留了一点小费。','小费'],
  today:['Today we are reviewing the results of the experiment.','今天我们正在复核实验结果。','今天'],
  toll:['Drivers must pay a toll to use the bridge.','司机使用这座桥需要支付通行费。','通行费'],
  tomorrow:['We will discuss the proposal tomorrow.','我们明天将讨论这份提案。','明天'],
  torture:['The story describes how imprisonment can torture a person mentally.','故事描写了监禁如何在精神上折磨一个人。','折磨（动词）'],
  total:['The total was higher than we had expected.','总数比我们预期的高。','总数（名词）'],
  tow:['The truck came to tow the broken car away.','拖车前来拖走故障汽车。','拖走（动词）'],
  toward:['The hikers moved toward the distant village.','徒步者朝远处的村庄走去。','朝；向'],
  trace:['A faint trace of smoke remained in the room.','房间里还残留着一丝淡淡的烟味。','痕迹（名词）'],
  train:['The train leaves from platform two.','火车从二号站台出发。','列车（名词）'],
  transfer:['You can transfer to the underground at the next station.','你可以在下一站换乘地铁。','换乘（动词）'],
  transplant:['Doctors carried out a successful kidney transplant.','医生们成功实施了一次肾移植手术。','移植（名词）'],
  trade:['International trade supports many local jobs.','国际贸易支撑着许多本地就业岗位。','贸易（名词）'],
  tie:['He wore a striped tie to the interview.','他戴着条纹领带参加面试。','领带（名词）'],
  tight:['The lid was so tight that I could not open it.','盖子太紧，我打不开。','紧的（形容词）'],
  torch:['She used a torch to find the path after sunset.','日落后她用手电筒寻找道路。','手电筒（英式）'],
  tram:['We caught the tram near the museum.','我们在博物馆附近乘上了有轨电车。','有轨电车']
 }}
];
function sha(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
function go(root=ROOT,{apply=false}={}){
 const before=plan(root,{save:false});
 const meta=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8')).files;
 const writes=[];
 const tasks=[];
 for(const spec of records){
  const task=meta.find(m=>m.task_id===spec.task);
  if(!task)throw Error('Task absent '+spec.task);
  const srcPath=path.join(root,'docs/model-tasks-20261015',task.file);
  const sourceBytes=fs.readFileSync(srcPath);
  if(sha(sourceBytes)!==task.sha256)throw Error('Input SHA changed '+spec.task);
  const input=JSON.parse(sourceBytes.toString('utf8'));
  const resultFile=path.join(root,'docs/model-task-results','worker-'+spec.worker,spec.task,'result.json');
  if(fs.existsSync(resultFile))throw Error('Refuse to overwrite existing result '+spec.task);
  const reviewFile=path.join(path.dirname(resultFile),'remaining-review-material.json');
  const review=JSON.parse(fs.readFileSync(reviewFile,'utf8'));
  if(review.task_id!==spec.task||review.input_sha256!==task.sha256
   ||review.entries.length!==task.rows)throw Error('Review source drift '+spec.task);
  const usedOverrides=new Set();
  let reused=0,original=0,risks=0;
  const entries=input.entries.map((source,i)=>{
   const r=review.entries[i];
   if(!r||r.row_index!==i||!isDeepStrictEqual(r.identity,source.identity)
    ||!isDeepStrictEqual(r.original,source.current))
    throw Error('Review material identity/original changed '+spec.task+':'+i);
   const word=source.identity?.word;
   const override=spec.overrides[word];
   let text,translation,sense,origin,issues=[];
   if(override){
    [text,translation,sense]=override;
    if(!Array.isArray(override)||override.length!==3
     ||!text?.trim()||!translation?.trim()||!sense?.trim())
      throw Error('Malformed authored pair for '+word);
    usedOverrides.add(word);original++;
    origin='original-draft-authored-for-current-task';
   } else if(r.source_material){
    text=r.source_material.example;
    translation=r.source_material.example_translation;
    sense=r.source_material.selected_meaning??source.current.meaning;
    origin='prior-same-source-original-matched-example';
    reused++;
    issues.push('历史同来源例句仍需逐项审核词性、语义与真实词典证据。');
   } else if(r.crossbook_review_options.length){
    const option=r.crossbook_review_options[0];
    if(option.original_pos && source.current.pos) {
     // POS category matches are hints, not evidence of identical meaning.
     const {posType}=require('./reuse-abc-local-examples');
     const left=posType(source.current.pos),right=posType(option.original_pos);
     if(!left||!right||left!==right)
       throw Error('Cross-book option POS mismatch at '+spec.task+':'+i+' '+word);
    }
    text=option.example;translation=option.translation;
    sense=source.current.meaning;
    origin='crossbook-one-option-unverified-selected-sense';
    reused++;
    issues.push('跨词库仅凭词形/词性不能证明释义相同；候选例句需按当前源词条重新逐义复核。');
   }else throw Error('No bilingual pair for '+spec.task+':'+i+' '+word);
   if(!String(text||'').trim()||!String(translation||'').trim())
    throw Error('Missing bilingual example '+spec.task+':'+i);
   if(!/[一-鿿]/.test(translation))throw Error('Non-Chinese translation '+word);
   const sourceRisk=source.current?.pos??'';
   if(!/^[a-z]+(?:[-'][a-z]+)*$/i.test(word??''))
     issues.push('词头含复杂形式，必须单独核对示例是否对应原义项。');
   if(/[/&]|\bn\.|\bv\./i.test(sourceRisk.replace(/^n\.$/,'').replace(/^v\.$/,'')))
     issues.push('源词性包含多个类别或别名，需分别检查真实语法用法。');
   if(r.risk_flags?.length)risks++;
   issues.push('原创/既有双语例句只是未审核草稿；未进行独立权威词典全义项复核，禁止自动安装正式词库。');
   const pos=source.current?.pos??null;
   return {
    identity:source.identity,
    original:source.current,
    selected_sense:{pos,meaning:sense},
    proposed:{pos,meaning:source.current.meaning,phonetic:null,
     example:text,example_translation:translation,
     teaching_note:'本例句仅展示一个拟选义项，需逐词核实多义项、词性及英式 IPA，不能视为审校通过。'},
    evidence:[],
    issues,
    change_reason:'精确来源绑定的待审核双语例句起草（'+origin+'）；原词条、音标及来源行不变。',
    verification:'needs-review',
    external_human_review:false,
    full_dictionary_senses_reviewed:false
   };
  });
  if(usedOverrides.size!==Object.keys(spec.overrides).length)
   throw Error('Override word absent from task '+spec.task);
  const result={task_id:spec.task,input_sha256:task.sha256,status:'proposal',entries};
  writes.push({file:resultFile,body:JSON.stringify(result,null,2)+'\n'});
  const progressFile=path.join(root,'docs/model-task-results','worker-'+spec.worker,'progress.json');
  const old=JSON.parse(fs.readFileSync(progressFile,'utf8'));
  const p=old.tasks.find(x=>x.task_id===spec.task);
  if(!p||p.status!=='pending'||p.processed_rows!==0)
   throw Error('Task progress already modified '+spec.task);
  p.status='submitted';p.processed_rows=entries.length;
  p.issue_count=entries.filter(e=>e.issues.length).length;
  old.updated_at='2026-10-17';
  writes.push({file:progressFile,body:JSON.stringify(old,null,2)+'\n'});
  tasks.push({task:spec.task,rows:entries.length,original_bilingual_pairs:original,
    existing_sourced_candidates_reused:reused,risk_flag_rows:risks,approved:0,installed:0});
 }
 if(apply){
  for(const w of writes){
   fs.mkdirSync(path.dirname(w.file),{recursive:true});
   fs.writeFileSync(w.file,w.body,{flag:w.file.endsWith('/result.json')?'wx':'w'});
  }
  const after=plan(root,{save:false});
  if(after.all.result_rows-before.all.result_rows!==tasks.reduce((n,t)=>n+t.rows,0))
   throw Error('Unexpected change in drafted row count');
 }
 return {tasks,existing_before:before.all.result_rows,expected_after:before.all.result_rows+200,
    remaining_after:before.all.rows_not_yet_drafted-200,actual_results_written:apply,
    source_dictionaries_independently_reviewed:0,approved:0,installed:0};
}
if(require.main===module){
 const flags=process.argv.slice(2);
 if(flags.some(x=>x!=='--apply'))throw Error('Unknown argument');
 console.log(JSON.stringify(go(ROOT,{apply:flags.includes('--apply')}),null,2));
}
module.exports={go};
