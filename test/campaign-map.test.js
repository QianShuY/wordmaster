'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../shared/campaign-map'),R=require('../shared/campaign-route');
test('early map conceals the final gate and route; only visited land and the near frontier are revealed',()=>{
 for(let done=0;done<=12;done++){const v=M.view(done);assert.ok(!v.visible.some(s=>s.boss));assert.ok(!v.hinted.includes(M.legs[12]));assert.equal(v.holes.length,done+1);assert.equal(v.current,done+1);assert.equal(v.traveler,Math.max(1,done));assert.ok(v.visible.length<=done+2);}
 assert.ok(M.view(13,false,true).visible.some(s=>s.boss));assert.equal(M.view(13,false,true).next,M.legs[12]);assert.equal(M.view(13,true,false).waiting,true);assert.equal(M.view(13,false,true).waiting,false);
});
test('walked roads end at the last actual arrival; future leg and previews cannot create real progress',()=>{
 for(let done=1;done<=13;done++){const v=M.view(done);assert.equal(v.walked,M.legs.slice(0,done-1).join(' '));assert.equal(v.next,M.legs[done-1]);}
 assert.equal(M.view(14).next,'');assert.equal(M.view(0).walked,'');assert.equal(M.view(0).next,'');
 const real=M.view(4),preview=M.view(12,false,false,true);assert.equal(preview.visible.length,14);assert.equal(M.view(4).done,real.done);assert.deepEqual(M.view(4),real);
});
test('painted route uses bends anchored to all fourteen actual landmarks',()=>{
 assert.equal(M.legs.length,13);for(let i=0;i<13;i++){const leg=M.legs[i],from=R.stages[i],to=R.stages[i+1];assert.ok(leg.startsWith(`M${+(from.x*10).toFixed(1)} ${+(from.y*6.67).toFixed(1)}`));assert.ok(leg.endsWith(`L${+(to.x*10).toFixed(1)} ${+(to.y*6.67).toFixed(1)}`));assert.ok(leg.includes(' Q'));assert.ok(!/NaN|undefined/.test(leg));}
});
test('regional encounters alternate recognitions and spelling and remain small optional rests',()=>{
 assert.equal(M.region(1).mode,'meaning');assert.equal(M.region(5).mode,'spelling');assert.equal(M.region(8).mode,'mixed');assert.equal(M.region(12).words,4);assert.equal(M.region(14).name,'迷雾高地');
 for(let id=1;id<=14;id++){const region=M.region(id);assert.ok(id>=region.from&&id<=region.to);assert.ok(region.words>=3&&region.words<=4);}
 assert.equal(M.view(-20).done,0);assert.equal(M.view(99).done,14);
});
