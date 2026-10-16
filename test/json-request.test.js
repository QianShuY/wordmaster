'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../shared/json-request');
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const response=data=>({ok:true,json:async()=>data});
test('concurrent reads share transport but never ownership objects; completed reads reload',async()=>{
 const gate=deferred();let calls=0;
 const request=create(async()=>{calls++;await gate.promise;return response({cards:[{owned:false}]});});
 const a=request('/cards'),b=request('/cards');assert.equal(calls,1);gate.resolve();
 const [first,second]=await Promise.all([a,b]);first.cards[0].owned=true;assert.equal(second.cards[0].owned,false);
 assert.equal((await request('/cards')).cards[0].owned,false);assert.equal(calls,2);
});
test('writes are never deduplicated and separate reads before/during/after a write',async()=>{
 const jobs=[];const request=create((url,opts)=>{const job=deferred();jobs.push({job,method:opts?.method||'GET'});return job.promise;});
 const before=request('/cards'),writeA=request('/draw',{method:'POST',body:{}}),writeB=request('/draw',{method:'POST',body:{}}),during=request('/cards');
 assert.deepEqual(jobs.map(j=>j.method),['GET','POST','POST','GET']);
 jobs[0].job.resolve(response({version:0}));await before;
 const duringAgain=request('/cards');assert.equal(jobs.length,4,'old completion must not erase a newer pending read');
 jobs[1].job.resolve(response({ok:true}));jobs[2].job.resolve(response({ok:true}));await Promise.all([writeA,writeB]);
 const after=request('/cards');assert.equal(jobs.length,5);
 jobs[3].job.resolve(response({version:1}));jobs[4].job.resolve(response({version:2}));
 assert.equal((await during).version,1);await duringAgain;assert.equal((await after).version,2);
});
test('failed shared reads release the slot so retry can recover',async()=>{
 let calls=0;const gate=deferred();const request=create(async()=>{calls++;if(calls===1){await gate.promise;return {ok:false,status:503,json:async()=>({error:'暂不可用'})};}return response({ok:true});});
 const a=request('/stats'),b=request('/stats');gate.resolve();const failed=await Promise.allSettled([a,b]);assert.ok(failed.every(r=>r.status==='rejected'));assert.equal(calls,1);assert.equal((await request('/stats')).ok,true);assert.equal(calls,2);
});
