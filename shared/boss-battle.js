(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./answer-policy'):root.WordMasterAnswerPolicy);if(typeof module==='object'&&module.exports)module.exports=api;else root.MociBossBattle=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Policy){
 'use strict';
 const RULES={bossHp:240,domainSeconds:60,finalDomainSeconds:70,introMs:2400,wrongPenaltyMs:6000,domainWords:6,finalDomainWords:8,expandedDomainSeconds:110,expandedFinalSeconds:140};
 const DECLARATION='I refuse to accept this ending.';
 const normalize=value=>String(value??'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
 const phrase=value=>normalize(value).replace(/[.!?。！？]+$/,'');
 const spellingMatches=(value,word)=>{if(word.answer_policy){const policy=Policy?.bound(word.answer_policy,word.answer);return Boolean(policy&&Policy.grade(policy,value));}return normalize(value)===normalize(word.answer);};
 const spells={attack:{name:'墨矢',description:'默写命中，破盾或造成 28 点伤害'},defend:{name:'护页',description:'词义辨识，格挡本回合攻击并反击 12 点'},heal:{name:'回春',description:'默写恢复 24 点生命，承受一半伤害；每场两次'}};
 const intents={lantern:{name:'提灯扫雾',damage:22,motion:'attack'},seal:{name:'石印封路',damage:30,motion:'sealSlam'},storm:{name:'残页风暴',damage:38,motion:'storm'}};
 function create(words,instanceId,snapshot){
  if(!Array.isArray(words)||words.length<10||new Set(words.map(w=>normalize(w.answer))).size<10)throw new Error('至少需要 10 个合格已学词');
  const pool=words.map(w=>({...w})),ids=new Set(pool.map(w=>w.id));
  const signature=JSON.stringify(pool.map(w=>[w.id,w.answer,w.meaning,w.pos,...(w.answer_policy?[w.answer_policy]:[])]));
  const order=pool.map(w=>w.id);for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  let s={version:3,domain:null,castSolved:[],drawCounts:{},instanceId,signature,order,phase:'camp',hp:100,bossHp:RULES.bossHp,shield:true,round:1,cursor:0,spell:null,chain:0,chainWordId:null,chainAssisted:false,heals:2,revived:false,taught:false,mistakes:[],answered:0,correct:0,result:null,retries:[],wordStats:{},history:[]};
  if(snapshot){
   const valid=[1,2,3].includes(snapshot.version)&&snapshot.instanceId===instanceId&&snapshot.signature===signature&&['camp','choose','question','feedback','fallen','won','lost',...(snapshot.version>=2?['stormIntro']:[])].includes(snapshot.phase)&&Number.isInteger(snapshot.hp)&&snapshot.hp>=0&&snapshot.hp<=100&&Number.isInteger(snapshot.bossHp)&&snapshot.bossHp>=0&&snapshot.bossHp<=(snapshot.version===1?120:RULES.bossHp)&&Number.isInteger(snapshot.round)&&snapshot.round>=1&&snapshot.round<=10000&&Number.isInteger(snapshot.cursor)&&snapshot.cursor>=0&&snapshot.cursor<=100000&&Number.isInteger(snapshot.chain)&&snapshot.chain>=0&&snapshot.chain<=(snapshot.version===1?1:snapshot.version===2?3:7)&&Number.isInteger(snapshot.heals)&&snapshot.heals>=0&&snapshot.heals<=2&&['shield','revived','taught'].every(k=>typeof snapshot[k]==='boolean')&&[null,...Object.keys(spells)].includes(snapshot.spell)&&Array.isArray(snapshot.mistakes)&&snapshot.mistakes.every(id=>ids.has(id))&&['answered','correct'].every(k=>Number.isInteger(snapshot[k])&&snapshot[k]>=0)&&snapshot.correct<=snapshot.answered;
   const extraValid=(snapshot.retries===undefined||Array.isArray(snapshot.retries)&&new Set(snapshot.retries.map(r=>r?.id)).size===snapshot.retries.length&&snapshot.retries.every(r=>r&&ids.has(r.id)&&Number.isInteger(r.after)&&r.after>=0))&&(snapshot.wordStats===undefined||snapshot.wordStats&&typeof snapshot.wordStats==='object'&&Object.entries(snapshot.wordStats).every(([id,v])=>ids.has(Number(id))&&v&&Number.isInteger(v.wrong)&&v.wrong>0&&Number.isInteger(v.recalls)&&v.recalls>=0&&v.recalls<=2))&&(snapshot.history===undefined||Array.isArray(snapshot.history)&&snapshot.history.length<=8&&snapshot.history.every(h=>h&&Number.isInteger(h.round)&&(h.type==='revive'||Object.hasOwn(spells,h.spell)&&Object.hasOwn(intents,h.enemy)&&typeof h.ok==='boolean'&&['damage','received','restored'].every(k=>Number.isInteger(h[k])&&h[k]>=0))))&&(!snapshot.chainWordId||ids.has(snapshot.chainWordId));
   const d=snapshot.domain,domainValid=snapshot.version===1||d===null||Boolean(d&&(snapshot.version===3?[RULES.domainWords,RULES.finalDomainWords]:[3,4]).includes(d.required)&&Number.isInteger(d.remainingMs)&&d.remainingMs>=0&&d.remainingMs<=(snapshot.version===3?(d.required===RULES.finalDomainWords?RULES.expandedFinalSeconds:RULES.expandedDomainSeconds):d.required===4?RULES.finalDomainSeconds:RULES.domainSeconds)*1000&&Number.isInteger(d.introMs)&&d.introMs>=0&&d.introMs<=RULES.introMs&&Array.isArray(d.solved)&&new Set(d.solved).size===d.solved.length&&d.solved.length<=d.required&&d.solved.every(id=>ids.has(id))&&Number.isInteger(d.wrong)&&d.wrong>=0);
   const stormRound=snapshot.bossHp<=RULES.bossHp/2&&snapshot.round%2===1;
   const activeDomainValid=snapshot.version===1||(d
    ? ['stormIntro','question'].includes(snapshot.phase)&&stormRound&&Boolean(snapshot.spell)&&d.remainingMs>0&&d.solved.length<d.required&&snapshot.chain===d.solved.length&&(snapshot.phase==='stormIntro'?d.introMs>0:d.introMs===0)
    : snapshot.phase!=='stormIntro'&&!(snapshot.phase==='question'&&stormRound));
   const rosterValid=snapshot.version!==3||Boolean(Array.isArray(snapshot.castSolved)&&new Set(snapshot.castSolved).size===snapshot.castSolved.length&&snapshot.castSolved.length<=2&&snapshot.castSolved.every(id=>ids.has(id))&&snapshot.drawCounts&&typeof snapshot.drawCounts==='object'&&!Array.isArray(snapshot.drawCounts)&&Object.entries(snapshot.drawCounts).every(([id,n])=>ids.has(Number(id))&&Number.isInteger(n)&&n>=0&&n<=snapshot.answered)&&Object.values(snapshot.drawCounts).reduce((a,b)=>a+b,0)===snapshot.answered&&(snapshot.phase==='question'&&!d?snapshot.chain===snapshot.castSolved.length:snapshot.castSolved.length===0));
   if(valid&&extraValid&&domainValid&&activeDomainValid&&rosterValid&&Array.isArray(snapshot.order)&&snapshot.order.length===pool.length&&new Set(snapshot.order).size===pool.length&&snapshot.order.every(id=>ids.has(id))&&(!(snapshot.phase==='question')||snapshot.spell)&&(!(snapshot.phase==='feedback')||snapshot.result&&typeof snapshot.result.text==='string'))s={...s,...JSON.parse(JSON.stringify(snapshot))};
  }
  const maxBossHp=()=>s.version===1?120:RULES.bossHp;
  const intent=()=>s.bossHp<=maxBossHp()/2&&(s.round%2===1)?'storm':s.round%2===0?'seal':'lantern';
  const current=()=>{
   const available=id=>id!==s.chainWordId&&!s.domain?.solved.includes(id)&&(s.version!==3||!s.castSolved.includes(id));
   const retry=s.retries.find(r=>r.after<=s.answered&&available(r.id));
   if(retry)return pool.find(w=>w.id===retry.id);
   const candidates=Array.from({length:pool.length},(_,n)=>s.order[(s.cursor+n)%pool.length]).filter(available);
   const id=s.version===3?candidates.reduce((best,id)=>best===undefined||(s.drawCounts[id]||0)<(s.drawCounts[best]||0)?id:best,undefined):candidates[0];
   return pool.find(w=>w.id===id);
  };
  const reinforcing=w=>Boolean(s.wordStats[w.id]&&s.wordStats[w.id].recalls<2);
  const required=()=>s.domain?.required||(s.version===3?(s.bossHp<=maxBossHp()/2?3:2):intent()==='storm'?2:1);
  const modeFor=w=>s.spell==='defend'&&intent()!=='storm'&&!reinforcing(w)&&(s.version!==3||s.chain===0)?'meaning':'spelling';
  const remember=event=>{s.history.push(event);s.history=s.history.slice(-8);};
  function recordAnswer(w,ok,mode,assisted){
    s.answered++;if(s.version===3)s.drawCounts[w.id]=(s.drawCounts[w.id]||0)+1;if(ok)s.correct++;else if(!s.mistakes.includes(w.id))s.mistakes.push(w.id);
    if(!ok){s.wordStats[w.id]={wrong:(s.wordStats[w.id]?.wrong||0)+1,recalls:0};s.retries=s.retries.filter(r=>r.id!==w.id);s.retries.push({id:w.id,after:s.answered+2});}
    else if(s.wordStats[w.id]){const stat=s.wordStats[w.id];if(mode==='spelling'&&!assisted)stat.recalls=Math.min(2,stat.recalls+1);s.retries=s.retries.filter(r=>r.id!==w.id);if(stat.recalls<2)s.retries.push({id:w.id,after:s.answered+2});}
    s.cursor++;
  }
  function settle(ok,assisted){
   const enemy=intent(),action=s.spell,domainCleared=ok&&s.version>=2&&Boolean(s.domain);let damage=0,received=0,restored=0,motion='hit',text='';const shieldBroken=ok&&action==='attack'&&s.shield;
   if(ok){
    if(action==='attack'){damage=domainCleared?48:s.shield?18:28;motion=s.shield?'break':'hit';s.shield=false;received=enemy==='storm'?0:Math.ceil(intents[enemy].damage*.4);text=`墨矢命中${damage}点${enemy==='storm'?'，风暴被打断':`，承受余波${received}点`}。`;}
    if(action==='defend'){damage=domainCleared?30:12;text=`护页展开，完全格挡，反击${damage}点。`;motion='hit';}
    if(action==='heal'){restored=Math.min(24,100-s.hp);s.hp+=restored;s.heals--;received=Math.ceil(intents[enemy].damage*.5);text=`恢复${restored}点，承受${received}点伤害。`;motion=intents[enemy].motion;}
   }else{received=intents[enemy].damage;motion=intents[enemy].motion;text=`咒语未成，${intents[enemy].name}造成${received}点伤害。`;}
   if(domainCleared)text=`领域击破！${text}`;
   damage=Math.min(damage,s.bossHp);s.bossHp=Math.max(0,s.bossHp-damage);if(s.bossHp===0){received=0;text=`${spells[action].name}命中最后${damage}点，雾桥守卫停下了攻击。`;}
   received=Math.min(received,s.hp);s.hp=Math.max(0,s.hp-received);
   s.result={ok,assisted:Boolean(assisted||s.chainAssisted),text,motion,damage,received,restored,spell:action,enemy,shieldBroken,...(s.domain?{domainCleared,domainWords:s.domain.solved.length,domainRequired:s.domain.required,domainWrong:s.domain.wrong}: {})};remember({round:s.round,...s.result});s.phase=s.bossHp===0?'won':s.hp===0?(s.revived?'lost':'fallen'):'feedback';s.chain=0;s.chainWordId=null;s.chainAssisted=false;s.domain=null;s.castSolved=[];
   return s.result;
  }
  return {
   get state(){return JSON.parse(JSON.stringify(s));},get maxBossHp(){return maxBossHp();},get coverage(){return s.version===3?Object.keys(s.drawCounts).length:null;},get domainSeconds(){const d=s.domain;return s.version===3?(d?.required===RULES.finalDomainWords?RULES.expandedFinalSeconds:RULES.expandedDomainSeconds):d?.required===4?RULES.finalDomainSeconds:RULES.domainSeconds;},get intent(){return intent();},get question(){const w=current();return {...w,mode:modeFor(w),reinforcing:reinforcing(w),recalls:s.wordStats[w.id]?.recalls||0,errors:s.wordStats[w.id]?.wrong||0,required:required()};},
   teach(value){if(s.phase!=='camp'||phrase(value)!==phrase(DECLARATION))return false;s.taught=true;return true;},
   start(){if(s.phase!=='camp'||!s.taught)return false;s.phase='choose';return true;},
   choose(name){if(s.phase!=='choose'||!Object.hasOwn(spells,name)||(name==='heal'&&(s.heals===0||s.hp===100)))return false;s.spell=name;s.chain=0;s.chainWordId=null;s.chainAssisted=false;s.castSolved=[];s.phase='question';if(s.version>=2&&intent()==='storm'){const final=s.bossHp<=maxBossHp()/4,required=s.version===3?(final?RULES.finalDomainWords:RULES.domainWords):final?4:3;s.domain={required,solved:[],remainingMs:(s.version===3?(final?RULES.expandedFinalSeconds:RULES.expandedDomainSeconds):final?RULES.finalDomainSeconds:RULES.domainSeconds)*1000,introMs:RULES.introMs,wrong:0};s.phase='stormIntro';}return true;},
   elapseDomain(ms){if(s.version<2||!s.domain||!['stormIntro','question'].includes(s.phase)||!Number.isInteger(ms)||ms<=0||ms>1000)return false;
    if(s.phase==='stormIntro'){s.domain.introMs=Math.max(0,s.domain.introMs-ms);if(s.domain.introMs===0)s.phase='question';return {pending:true,intro:true};}
    s.domain.remainingMs=Math.max(0,s.domain.remainingMs-ms);if(s.domain.remainingMs===0){const w=current();recordAnswer(w,false,'spelling',s.chainAssisted);settle(false,s.chainAssisted);s.result.text='领域未能及时击破，残页风暴造成38点伤害。';s.result.answer=w.answer;s.result.meaning=w.meaning;return {...s.result};}return {pending:true};
   },
   answer(value,assisted=false){if(s.phase!=='question')return null;const w=current(),mode=modeFor(w);
    const ok=mode==='meaning'?value===w.meaning:pool.filter(p=>p.meaning===w.meaning&&p.pos===w.pos).some(p=>spellingMatches(value,p));
    recordAnswer(w,ok,mode,assisted);
    if(s.domain){s.chainAssisted=s.chainAssisted||Boolean(assisted);
     if(ok){s.domain.solved.push(w.id);s.chain=s.domain.solved.length;if(s.domain.solved.length<s.domain.required)return {ok:true,pending:true,text:`已击破 ${s.domain.solved.length} / ${s.domain.required} 道封印，继续默写。`};}
     else{s.domain.wrong++;s.domain.remainingMs=Math.max(0,s.domain.remainingMs-RULES.wrongPenaltyMs);if(s.domain.remainingMs>0)return {ok:false,pending:true,miss:true,answer:w.answer,meaning:w.meaning,text:`${w.answer} · ${w.meaning}。时间减少 6 秒，继续破阵。`};}
    }
    if(!s.domain&&s.version===3&&ok){s.castSolved.push(w.id);s.chain=s.castSolved.length;s.chainAssisted=s.chainAssisted||Boolean(assisted);if(s.chain<required())return {ok:true,pending:true,text:'咒文已记起 '+s.chain+' / '+required()+' 词，继续回忆不同的词。'};}
    if(s.version!==3&&!s.domain&&ok&&intent()==='storm'&&s.chain===0){s.chain=1;s.chainWordId=w.id;s.chainAssisted=Boolean(assisted);return {ok:true,pending:true,text:'第一道咒语已记起。再回忆一个不同单词，打断风暴。'};}
    settle(ok,assisted);s.result.answer=w.answer;s.result.meaning=w.meaning;return {...s.result};
   },
   next(){if(s.phase!=='feedback')return false;s.round++;s.phase='choose';s.spell=null;s.result=null;s.domain=null;if(intent()==='seal')s.shield=true;return true;},
   revive(value){if(s.phase!=='fallen'||s.revived||!s.taught||phrase(value)!==phrase(DECLARATION))return false;s.revived=true;s.hp=40;remember({round:s.round,type:'revive',restored:40});s.round++;s.phase='choose';s.spell=null;s.result=null;return true;},
   leave(){s.phase='lost';},
   snapshot(){return JSON.parse(JSON.stringify(s));},
   mistakeWords(){return pool.filter(w=>s.mistakes.includes(w.id)).map(w=>({...w,wrong:s.wordStats[w.id]?.wrong||1,recalls:s.wordStats[w.id]?.recalls||0}));}
  };
 }
 return {create,RULES,spells,intents,DECLARATION,normalize,spellingMatches};
});
