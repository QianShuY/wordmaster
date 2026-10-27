'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Arrival=require('../shared/campaign-arrival');
function store(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
function saved(count=5,today='2026-10-27'){
 const days=Array.from({length:count},(_,i)=>({stage_no:i+1,day:'2026-10-'+String(28-count+i).padStart(2,'0'),book_id:3,book_name:'六级核心词汇'}));
 return {today,completed:count,days};
}
function fixture(){const session=store(),storage=store();let time=100000000;return {session,storage,tick:delta=>time+=delta,ledger:()=>Arrival.createLedger({session,storage,now:()=>time})};}

test('existing progress alone never plays an arrival or changes saved campaign data',()=>{
 const state=saved(),before=JSON.stringify(state),f=fixture();
 assert.equal(f.ledger().take(state),null);
 const receipt=Arrival.receipt(state,5);
 assert.equal(receipt.day,'2026-10-27');assert.equal(receipt.book,'六级核心词汇');assert.equal(receipt.from,4);
 assert.equal(JSON.stringify(state),before);
});
test('a fresh claimed stage is consumed once, including after refresh and duplicate completion responses',()=>{
 const f=fixture(),ledger=f.ledger(),state=saved();ledger.queue(5);
 assert.equal(ledger.take(state).stage,5);
 assert.equal(f.session.getItem(Arrival.pendingKey),null);
 const reloaded=f.ledger();assert.equal(reloaded.take(state),null);
 reloaded.queue(5);assert.equal(reloaded.take(state),null);
});
test('preview neither consumes real pending arrival nor records it as seen',()=>{
 const f=fixture(),ledger=f.ledger();ledger.queue(5);
 assert.equal(ledger.take(saved(),{preview:true}),null);
 assert.ok(f.session.getItem(Arrival.pendingKey));assert.equal(f.storage.getItem(Arrival.seenKey),null);
 assert.equal(ledger.take(saved()).stage,5);
});
test('an unearned stage, previous day or inconsistent route cannot create an arrival receipt',()=>{
 for(const stage of [0,6,14,1.5,'5'])assert.equal(Arrival.receipt(saved(),stage),null);
 const f=fixture(),ledger=f.ledger();ledger.queue(6);assert.equal(ledger.take(saved()),null);
 ledger.queue(5);assert.equal(ledger.take(saved(5,'2026-10-28')),null);
 ledger.queue(4);assert.equal(ledger.take(saved()),null);
 const broken=saved();broken.days[2].stage_no=4;assert.equal(Arrival.receipt(broken,5),null);
 const unordered=saved();unordered.days[3].day=unordered.days[2].day;assert.equal(Arrival.receipt(unordered,5),null);
});
test('pending arrival expires; corrupt or unavailable browser storage cannot interrupt learning',()=>{
 const f=fixture(),ledger=f.ledger();ledger.queue(5);f.tick(37*3600000);assert.equal(ledger.take(saved()),null);
 ledger.queue(5);f.tick(-1);assert.equal(ledger.take(saved()),null);
 f.session.setItem(Arrival.pendingKey,'{corrupt');assert.equal(ledger.take(saved()),null);
 f.session.setItem(Arrival.pendingKey,JSON.stringify({stage:5,at:'not a number'}));assert.equal(ledger.take(saved()),null);
 const denied={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
 const fallback=Arrival.createLedger({session:denied,storage:denied,now:()=>10});
 fallback.queue(5);assert.equal(fallback.take(saved()).stage,5);assert.equal(fallback.take(saved()),null);
});
test('seen presentation receipts are tied to actual trip history, not just the stage number',()=>{
 const f=fixture(),ledger=f.ledger();ledger.queue(5);const first=ledger.take(saved());assert.ok(first);
 const other=saved();other.days.forEach(d=>d.book_id=2);ledger.queue(5);const second=ledger.take(other);
 assert.ok(second);assert.notEqual(second.id,first.id);
});
test('first departure and the thirteenth arrival work; the final Boss stays outside daily arrival receipts',()=>{
 for(const stage of [1,13]){const f=fixture(),ledger=f.ledger();ledger.queue(stage);assert.equal(ledger.take(saved(stage)).stage,stage);}
 assert.equal(Arrival.receipt(saved(14),14),null);
});
