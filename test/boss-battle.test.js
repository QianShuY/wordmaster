'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../shared/boss-battle');
const pool=Array.from({length:12},(_,i)=>({id:i+1,answer:'word'+i,meaning:'释义'+i,pos:'n.',choices:['释义'+i,'另一项','其他项','干扰项']}));
function ready(){const game=B.create(pool,'db-a');assert.equal(game.start(),false);assert.equal(game.teach('wrong'),false);assert.equal(game.teach(' i refuse TO accept this ending! '),true);game.start();return game;}
test('three spells have distinct costs; shield breaks and repeated answers cannot deal duplicate damage',()=>{
 const g=ready();g.choose('attack');const q=g.question;g.answer(q.answer);assert.equal(g.state.bossHp,102);assert.equal(g.state.shield,false);assert.equal(g.state.hp,91);assert.equal(g.answer(q.answer),null);assert.equal(g.state.bossHp,102);
 g.next();assert.equal(g.intent,'seal');assert.equal(g.state.shield,true);g.choose('defend');assert.equal(g.question.mode,'meaning');g.answer(g.question.meaning);assert.equal(g.state.hp,91);assert.equal(g.state.bossHp,90);
 g.next();g.choose('heal');g.answer(g.question.answer);assert.equal(g.state.heals,1);assert.equal(g.state.hp,89);
});
test('storm requires two different words and can be interrupted, while a second failure still counts as a failed spell',()=>{
 const g=ready();while(g.state.bossHp>60){g.choose('defend');g.answer(g.question.meaning);g.next();}
 if(g.intent!=='storm'){g.choose('defend');g.answer(g.question.meaning);g.next();}
 assert.equal(g.intent,'storm');g.choose('attack');assert.equal(g.question.mode,'spelling');const first=g.question.id,oldHp=g.state.hp,oldBoss=g.state.bossHp;
 assert.equal(g.answer(g.question.answer).pending,true);assert.notEqual(g.question.id,first);assert.equal(g.state.bossHp,oldBoss);const restored=B.create(pool,'db-a',g.snapshot());assert.equal(restored.state.chain,1);assert.equal(restored.question.id,g.question.id);g.answer(g.question.answer);assert.equal(g.state.hp,oldHp);assert.equal(g.state.bossHp,oldBoss-18);
 const failed=B.create(pool,'db-a',restored.snapshot());failed.answer('bad');assert.equal(failed.state.hp,oldHp-38);assert.equal(failed.state.bossHp,oldBoss);
});
test('defeat offers one taught resurrection; mistakes stay in the separate battle state',()=>{
 const g=ready();while(g.state.phase==='choose'){g.choose('attack');const id=g.question.id;g.answer('bad');assert.ok(g.state.mistakes.includes(id));if(g.state.phase==='feedback')g.next();}
 assert.equal(g.state.phase,'fallen');assert.equal(g.revive('incorrect'),false);assert.equal(g.state.hp,0);assert.equal(g.revive(B.DECLARATION),true);assert.equal(g.state.hp,40);assert.equal(g.revive(B.DECLARATION),false);
 while(g.state.phase==='choose'){g.choose('attack');g.answer('bad');if(g.state.phase==='feedback')g.next();}assert.equal(g.state.phase,'lost');
});
test('checkpoint restores a partial two-word spell and rejects another database or changed word content',()=>{
 const g=ready();g.choose('attack');const snapshot=g.snapshot();const restored=B.create(pool,'db-a',snapshot);assert.equal(restored.state.phase,'question');assert.equal(restored.question.id,g.question.id);
 assert.equal(B.create(pool,'db-b',snapshot).state.phase,'camp');assert.equal(B.create([{...pool[0],meaning:'changed'},...pool.slice(1)],'db-a',snapshot).state.phase,'camp');assert.equal(B.create(pool,'db-a',{...snapshot,cursor:-1}).state.phase,'camp');
});
test('all-correct defense can win and final answers are locked',()=>{
 const g=ready();for(let i=0;i<20&&g.state.phase!=='won';i++){g.choose('defend');const mode=g.question.mode;const r=g.answer(mode==='meaning'?g.question.meaning:g.question.answer);if(r.pending)g.answer(g.question.answer);if(g.state.phase==='feedback')g.next();}
 assert.equal(g.state.phase,'won');assert.equal(g.state.bossHp,0);assert.equal(g.choose('attack'),false);assert.equal(g.answer('bad'),null);
});
test('failed words return after intervening answers; hints cannot satisfy the two independent recalls',()=>{
 const g=ready();g.choose('defend');const failedId=g.question.id;g.answer('bad');g.next();
 for(let i=0;i<2;i++){g.choose('defend');assert.notEqual(g.question.id,failedId);g.answer(g.question.meaning);g.next();}
 g.choose('defend');assert.equal(g.question.id,failedId);assert.equal(g.question.mode,'spelling');assert.equal(g.question.reinforcing,true);g.answer(g.question.answer,true);assert.equal(g.mistakeWords()[0].recalls,0);g.next();
 let recalls=0;
 for(let turn=0;turn<6&&g.state.phase!=='won'&&recalls<2;turn++){
  g.choose('defend');let result;
  do{const q=g.question;result=g.answer(q.mode==='meaning'?q.meaning:q.answer);}while(result.pending);
  recalls=g.mistakeWords()[0].recalls;if(g.state.phase==='feedback')g.next();
 }
 assert.equal(recalls,2);assert.equal(g.state.retries.some(r=>r.id===failedId),false);
 const restored=B.create(pool,'db-a',g.snapshot());assert.equal(restored.mistakeWords()[0].recalls,2);assert.deepEqual(restored.state.history,g.state.history);
});
test('full health cannot waste a healing charge; finishing blow prevents a posthumous counterattack',()=>{
 const g=ready();assert.equal(g.choose('heal'),false);assert.equal(g.state.heals,2);
 const snap=g.snapshot();snap.hp=1;snap.bossHp=10;snap.shield=false;const final=B.create(pool,'db-a',snap);final.choose('attack');let r=final.answer(final.question.answer);if(r.pending)r=final.answer(final.question.answer);assert.equal(final.state.phase,'won');assert.equal(final.state.hp,1);assert.equal(r.damage,10);assert.equal(r.received,0);
});
test('old battle saves upgrade safely; malformed recall queues cannot crash the question picker',()=>{
 const g=ready(),snapshot=g.snapshot();delete snapshot.retries;delete snapshot.wordStats;delete snapshot.history;delete snapshot.chainWordId;
 assert.equal(B.create(pool,'db-a',snapshot).state.phase,'choose');assert.equal(B.create(pool,'db-a',{...snapshot,retries:null}).state.phase,'camp');assert.equal(B.create(pool,'db-a',{...snapshot,history:[null]}).state.phase,'camp');
});
