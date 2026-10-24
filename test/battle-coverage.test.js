'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../shared/boss-battle'),{preparePool}=require('../app/battle-pool');
const pool=Array.from({length:80},(_,i)=>({id:i+1,answer:'word'+i,meaning:'词义'+i,pos:'n.',choices:['词义'+i,'甲','乙','丙']}));
const ready=()=>{const g=B.create(pool,'coverage');g.teach(B.DECLARATION);g.start();return g;};
const intro=g=>{while(g.state.phase==='stormIntro')g.elapseDomain(Math.min(1000,g.state.domain.introMs));};
test('a normal spell requires distinct words; defense tests meaning then unprompted spelling; resume keeps the partial cast',()=>{
 const g=ready();g.choose('defend');assert.equal(g.question.required,2);assert.equal(g.question.mode,'meaning');const first=g.question.id;
 assert.equal(g.answer(g.question.meaning).pending,true);assert.equal(g.state.bossHp,240);assert.notEqual(g.question.id,first);assert.equal(g.question.mode,'spelling');
 const restored=B.create(pool,'coverage',g.snapshot());assert.equal(restored.question.id,g.question.id);assert.equal(restored.state.chain,1);assert.equal(restored.coverage,1);
 restored.answer(restored.question.answer);assert.equal(restored.state.bossHp,228);assert.equal(restored.coverage,2);assert.equal(restored.state.phase,'feedback');
 const bad={...g.snapshot(),drawCounts:{[first]:0}};assert.equal(B.create(pool,'coverage',bad).state.phase,'camp');
});
test('full formal rules cover many distinct words without looping over a small subset',()=>{
 const g=ready(),ids=new Set(),sizes=[];let spelling=0,meaning=0,guard=0;
 while(g.state.phase!=='won'&&guard++<300){
  if(g.state.phase==='feedback'){g.next();continue;}
  if(g.state.phase==='choose')g.choose('defend');
  if(g.state.phase==='stormIntro'){sizes.push(g.state.domain.required);assert.equal(g.domainSeconds,g.state.domain.required===8?140:110);intro(g);}
  if(g.state.phase==='question'){const q=g.question;assert.ok(!ids.has(q.id),'no repeated correct words while unseen words remain');ids.add(q.id);q.mode==='meaning'?meaning++:spelling++;g.answer(q.mode==='meaning'?q.meaning:q.answer);}
 }
 assert.equal(g.state.phase,'won');assert.ok(ids.size>=40);assert.equal(g.coverage,ids.size);assert.ok(spelling>meaning);assert.ok(sizes.includes(6)&&sizes.includes(8));
});
test('a failed word returns after a gap; successful retries cannot displace unseen words indefinitely',()=>{
 const g=ready();g.choose('attack');const first=g.question.id;g.answer('bad');g.next();g.choose('attack');
 for(let i=0;i<2;i++){assert.notEqual(g.question.id,first);g.answer(g.question.answer);}
 g.next();g.choose('attack');assert.equal(g.question.id,first);assert.equal(g.question.reinforcing,true);g.answer(g.question.answer);
 assert.notEqual(g.question.id,first);assert.equal(g.mistakeWords()[0].recalls,1);
});
test('expanded domains need six/eight different words; clocks, wrong penalties and restore stay consistent',()=>{
 for(const [hp,count,time] of [[120,6,110],[60,8,140]]){
  const g=ready(),s=g.snapshot(),d=B.create(pool,'coverage',{...s,bossHp:hp,round:7});d.choose('attack');intro(d);
  const seen=new Set();for(let i=0;i<count-1;i++){const q=d.question;assert.ok(!seen.has(q.id));seen.add(q.id);assert.ok(d.answer(q.answer).pending);}
  assert.equal(d.state.phase,'question');assert.equal(d.state.bossHp,hp);assert.equal(d.state.domain.remainingMs,time*1000);
  const restored=B.create(pool,'coverage',d.snapshot());assert.equal(restored.state.chain,count-1);restored.answer('bad');assert.equal(restored.state.domain.remainingMs,time*1000-6000);assert.equal(restored.state.domain.solved.length,count-1);
  assert.ok(!seen.has(restored.question.id));restored.answer(restored.question.answer);assert.equal(restored.state.result.domainWords,count);assert.equal(restored.state.result.damage,48);
 }
});
test('roster mixes recent, weak and older learned vocabulary beyond the old first-sixty limit',()=>{
 const rows=Array.from({length:240},(_,i)=>({id:i+1,word:'term'+String.fromCharCode(97+Math.floor(i/26),97+i%26),meaning:String.fromCodePoint(0x4e00+i,0x5200+i),pos:'n.',source_file:'audited.txt',battle_first_studied:String(i).padStart(4,'0'),battle_wrong:i>=60&&i<120?10:0}));
 const selected=preparePool(rows),ids=new Set(selected.map(w=>w.id));assert.equal(selected.length,180);
 for(let id=181;id<=240;id++)assert.ok(ids.has(id),'recent words');for(let id=61;id<=120;id++)assert.ok(ids.has(id),'weak words');
 assert.ok(selected.some(w=>w.id<30));assert.ok(selected.some(w=>w.id>150&&w.id<=180));assert.deepEqual(preparePool(rows),selected);assert.equal(selected.some(w=>'wrong'in w||'recent'in w),false);
});
