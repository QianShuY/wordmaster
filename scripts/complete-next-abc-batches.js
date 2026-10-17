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
 {worker:'A',task:'cet4-023',overrides:{
  previously:['We had previously discussed this issue at the meeting.','我们此前在会议上讨论过这个问题。','先前'],
  primarily:['The survey was designed primarily for university students.','这份调查主要面向大学生。','主要地'],
  print:['Please print the document on both sides of the paper.','请把文件双面打印。','打印；印刷（动词）'],
  prior:['You need prior permission to enter the laboratory.','进入实验室需要事先获得许可。','事先的；在先的（形容词）'],
  program:['This computer program helps students practise spelling.','这个计算机程序帮助学生练习拼写。','程序'],
  properly:['Please close the lid properly before shaking the bottle.','摇晃瓶子前请把盖子盖严。','适当地；正确地'],
  protest:['Students held a peaceful protest outside the building.','学生们在楼外举行了一场和平抗议。','抗议（名词；原词条为多词性）'],
  public:['This is a public library and anyone may enter.','这是一家公共图书馆，任何人都可以进入。','公共的（形容词）'],
  purple:['Purple is a common colour in these paintings.','紫色在这些画作中很常见。','紫色（名词）'],
  purchase:['Please keep the receipt as proof of purchase.','请保留收据作为购物凭证。','购买（名词）'],
  qualify:['This qualification will qualify her for the job.','这项资格将使她符合这份工作的要求。','使具有资格（及物动词）'],
  prospect:['The prospect of a long delay worried the passengers.','长时间延误的可能性让乘客感到担忧。','前景；可能性（名词）']
 }},
 {worker:'B',task:'npee-044',overrides:{
  travel:['Travel broadens our understanding of other cultures.','旅行拓宽了我们对其他文化的理解。','旅行（名词）'],
  treasure:['The museum displays a valuable treasure from the region.','博物馆展出了一件来自该地区的珍宝。','珍宝（名词）'],
  tremble:['There was a slight tremble in his voice.','他的声音有些微微颤抖。','颤抖（名词）'],
  trench:['The workers dug a trench to lay the new pipe.','工人挖了一条沟来铺设新管道。','沟；壕沟（名词）'],
  trigger:['The faulty trigger on the garden sprayer was replaced.','花园喷雾器上有故障的扳机式开关被更换了。','扳机；触发装置（名词）'],
  trim:['He kept the small garden neat and trim.','他把小花园打理得整洁利落。','整齐的（形容词）'],
  triple:['A triple jump has three phases.','三级跳远包含三个阶段。','三部分的；三倍的（形容词，原 n. 标记须核查）'],
  TRUE:['Her account of the accident was true.','她对事故的描述是真实的。','真实的'],
  trust:['You can trust her to keep the information private.','你可以信任她会保守这些信息。','信任（及物动词）'],
  tumble:['The loose books began to tumble off the shelf.','没放稳的书开始从架子上掉落。','跌落；摔倒'],
  turn:['Turn the handle slowly to open the door.','慢慢转动把手打开门。','转动（动词）'],
  TV:['The family watched a documentary on TV.','一家人在电视上看了一部纪录片。','电视'],
  twelve:['Twelve students volunteered to help.','十二名学生自愿前来帮忙。','十二'],
  twenty:['Twenty seats are still available.','还有二十个座位空着。','二十'],
  twin:['The sisters wore matching twin bracelets.','姐妹俩戴着一对相配的手链。','成双的（形容词）'],
  two:['We bought two tickets for the concert.','我们买了两张音乐会门票。','二'],
  ultraviolet:['Ultraviolet light can damage unprotected skin.','紫外线可能损伤没有防护的皮肤。','紫外线的（形容词）'],
  underground:['The city opened a new underground car park.','这座城市开放了一座新的地下停车场。','地下的（形容词）'],
  underlying:['The study examines the underlying causes of the problem.','这项研究调查了问题背后的根本原因。','潜在的；根本的'],
  undoubtedly:['She is undoubtedly one of the most experienced teachers here.','毫无疑问，她是这里经验最丰富的教师之一。','无疑地'],
  unfortunately:['Unfortunately, the museum was closed when we arrived.','遗憾的是，我们到达时博物馆已经关门了。','不幸地；遗憾地']
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
