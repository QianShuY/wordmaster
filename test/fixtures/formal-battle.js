'use strict';
const Vocabulary=require('../../app/vocabulary'),Domain=require('../../shared/domain'),B=require('../../shared/boss-battle');

function seedFormalBattle(db){
 const spec=Vocabulary.CATALOG.find(s=>s.file==='cet6.txt');
 const seen=new Set(),words=Vocabulary.buildBook(spec).words.filter(w=>{
  const answer=w.headword||w.word,key=Domain.normalizeSpelling(answer),meaning=w.meaning.split('||')[0].trim();
  if(seen.has(key)||!Domain.isSpellableWord(answer)||!/[\u3400-\u9fff]/.test(meaning)||/[a-z]/i.test(meaning)||!w.pos)return false;
  seen.add(key);return true;
 }).slice(0,240);
 if(words.length!==240)throw Error('Formal QA needs 240 eligible source entries');
 db.exec("INSERT INTO wordbooks(id,name,is_builtin) VALUES(1,'六级来源词·隔离验收',1)");
 const put=db.prepare('INSERT INTO words(id,book_id,word,headword,meaning,pos,source_file,phonetic) VALUES(?,1,?,?,?,?,?,?)');
 const progress=db.prepare("INSERT INTO progress(word_id,correct,wrong,streak,first_studied,last_review,next_due) VALUES(?,2,?,1,datetime('now','localtime',?),datetime('now','localtime',?),datetime('now','localtime','+2 days'))");
 const log=db.prepare("INSERT INTO review_log(word_id,correct,outcome,practice_mode,ts) VALUES(?,1,'first_correct','spelling',datetime('now','localtime',?))");
 words.forEach((w,i)=>{
  put.run(i+1,w.word,w.headword,w.meaning,w.pos,w.source_file,w.phonetic);
  const age=`-${240-i} days`;progress.run(i+1,i>=60&&i<120?5:0,age,age);log.run(i+1,age);
 });
 const day=db.prepare("INSERT INTO adventure_days(day,stage_no,book_id,book_name) VALUES(date('now','localtime',?),?,1,'隔离验收')");
 for(let stage=1;stage<=13;stage++)day.run(`-${14-stage} days`,stage);
 return words;
}

function replay(session,events){
 const game=B.create(session.pool,session.initial.instanceId,session.initial);
 for(const e of events)if(!game[e.action](...e.args))throw Error('Invalid QA transcript');
 return game;
}

function play(session,{failFirstStorm=false,revive=false}={}){
 let game=replay(session,[]);const events=[],ids=new Set(),tiers=new Set();let spelling=0,meaning=0,partialRestored=false,domainRestored=false,timedOut=false,missed=false;
 const act=(action,...args)=>{const result=game[action](...args);if(!result)throw Error('Invalid QA action '+action);events.push({action,args});return result;};
 const restore=()=>{const old=game.snapshot();game=replay(session,events);if(JSON.stringify(game.snapshot())!==JSON.stringify(old))throw Error('Replay drift');};
 act('teach',B.DECLARATION);act('start');
 for(let guard=0;game.state.phase!=='won'&&guard<1600;guard++){
  const s=game.state;
  if(s.phase==='fallen'){act('revive',B.DECLARATION);restore();continue;}
  if(s.phase==='feedback'){act('next');continue;}
  if(s.phase==='choose'){act('choose',revive&&!s.revived?'attack':'defend');continue;}
  if(s.phase==='stormIntro'){tiers.add(s.domain.required);act('elapseDomain',Math.min(1000,s.domain.introMs));continue;}
  if(s.phase!=='question')throw Error('Unexpected QA phase '+s.phase);
  if(s.domain&&!domainRestored){
   // A partially solved seal and elapsed clock must replay without renewal.
   const q=game.question;ids.add(q.id);spelling++;act('answer',q.answer,false);
   for(let i=0;i<13;i++)act('elapseDomain',1000);
   restore();domainRestored=true;continue;
  }
  if(s.domain&&failFirstStorm&&!timedOut){
   if(!missed){act('answer','not-a-correct-word',false);missed=true;continue;}
   act('elapseDomain',Math.min(1000,s.domain.remainingMs));
   if(!game.state.domain)timedOut=true;
   continue;
  }
  const q=game.question;ids.add(q.id);q.mode==='meaning'?meaning++:spelling++;
  act('answer',revive&&!s.revived?'not-a-correct-word':q.mode==='meaning'?q.meaning:q.answer,false);
  if(!partialRestored&&game.state.phase==='question'&&game.state.chain>0&&!game.state.domain){restore();partialRestored=true;}
 }
 if(game.state.phase!=='won')throw Error('QA fight did not finish');
 return {events,game,metrics:{rounds:game.state.round,answers:game.state.answered,distinct:game.coverage,spelling,meaning,tiers:[...tiers],partialRestored,domainRestored,timedOut,revived:game.state.revived}};
}
module.exports={seedFormalBattle,replay,play};
