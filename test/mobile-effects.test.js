'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('../android-g0/mobile/battle-effects');
const before={answered:3,hp:100,phase:'question'};
test('partial word recall charges the spell without inventing damage or an enemy attack',()=>{
 const after={answered:4,hp:100,phase:'question',result:null};
 assert.deepEqual(E.plan(before,after,{ok:true,pending:true},'answer'),[{at:0,kind:'charge'}]);
 assert.deepEqual(E.plan(before,after,{ok:false,pending:true},'answer'),[{at:0,kind:'miss'}]);
});
test('a settled attack stages the actual shield break before the enemy response and uses real damage amounts',()=>{
 const after={answered:4,phase:'feedback',result:{ok:true,spell:'attack',enemy:'seal',shieldBroken:true,damage:18,received:9}};
 const p=E.plan(before,after,{},'answer');assert.deepEqual(p.map(e=>e.kind),['cast','break','slam','wound']);assert.equal(p[1].damage,18);assert.equal(p[3].received,9);assert.ok(p[1].at<p[2].at);
});
test('guard, heal, failure, revival, and realm timeout each get their own truthful presentation sequence',()=>{
 const result=r=>({answered:4,phase:'feedback',result:r});
 assert.deepEqual(E.plan(before,result({ok:true,spell:'defend',enemy:'lantern',damage:12,received:0}),{},'answer').map(e=>e.kind),['guard','sweep','block','hit']);
 assert.deepEqual(E.plan(before,result({ok:true,spell:'heal',enemy:'storm',damage:0,received:19,restored:24}),{},'answer').map(e=>e.kind),['restore','storm','wound']);
 assert.deepEqual(E.plan(before,result({ok:false,spell:'attack',enemy:'seal',damage:0,received:30}),{},'answer').map(e=>e.kind),['slam','wound']);
 assert.equal(E.plan({...before,domain:{}},result({ok:false,enemy:'storm',damage:0,received:38}),null,'tick')[0].kind,'storm');
 assert.deepEqual(E.plan({hp:0},{hp:40},null,'revive'),[{at:0,kind:'restore',restored:40}]);
 assert.deepEqual(E.plan(before,{phase:'stormIntro'},null,'choose'),[{at:0,kind:'domain'}]);
});
test('restoring or repeating an already acknowledged answer never replays an impact',()=>{
 const saved={...before,phase:'feedback',result:{ok:true,damage:28,received:0,spell:'attack'}};
 assert.deepEqual(E.plan(saved,saved,{},'answer'),[]);assert.deepEqual(E.plan(saved,saved,null,'draft'),[]);
});
test('backgrounding or replacing the scene cancels delayed enemy sounds',()=>{
 const callbacks=new Map(),sounds=[],events={};let serial=0;
 const doc={hidden:false,addEventListener:(k,f)=>events[k]=f,querySelector:s=>s==='.mobile-battle'?{}:null};
 const fx=E.create({document:doc,sound:n=>sounds.push(n),setTimer:fn=>{callbacks.set(++serial,fn);return serial;},clearTimer:id=>callbacks.delete(id)});
 fx.play(before,{answered:4,phase:'feedback',result:{ok:false,enemy:'seal',damage:0,received:30}},null,'answer');assert.deepEqual(sounds,['slam']);assert.equal(callbacks.size,1);
 doc.hidden=true;events.visibilitychange();assert.equal(callbacks.size,0);assert.deepEqual(sounds,['slam']);
 fx.cancel();assert.equal(callbacks.size,0);
});
