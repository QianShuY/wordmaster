'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {create,states}=require('../static/adventure/boss-motion');
test('warden telegraphs before attacking; pause freezes the precise remaining phase',()=>{
 const m=create();m.trigger('charge');m.advance(1200);assert.equal(m.state,'charge');assert.equal(m.remaining,2000);
 m.pause(true);m.advance(9000);assert.equal(m.remaining,2000);m.pause(false);m.advance(2000);
 assert.equal(m.state,'attack');assert.equal(m.remaining,1000);m.advance(1000);assert.equal(m.state,'idle');
});
test('new effects replace old phase timers; breaking and clearing end in stable states',()=>{
 const m=create();m.trigger('charge');m.advance(3000);m.trigger('break');m.advance(1500);
 assert.equal(m.state,'exposed');m.advance(30000);assert.equal(m.state,'exposed');
 m.trigger('vanish');m.advance(2400);assert.equal(m.state,'cleared');m.advance(10000);assert.equal(m.state,'cleared');
 m.trigger('idle');assert.equal(m.state,'idle');assert.equal(m.remaining,0);
 assert.equal(m.trigger('unknown'),false);assert.equal(m.state,'idle');
});
test('phase advancement handles elapsed overflow and invalid deltas without phantom attacks',()=>{
 const m=create();m.trigger('charge');m.advance(3300);assert.equal(m.state,'attack');assert.equal(m.remaining,900);
 for(const value of [-1,NaN,Infinity]){m.advance(value);assert.equal(m.remaining,900);}
 m.trigger('hit');m.advance(10000);assert.equal(m.state,'idle');assert.equal(m.remaining,0);
 for(const state of Object.values(states))assert.ok(state.intent&&state.detail&&state.status);
});

test('all three skills telegraph and settle distinctly; storm can be interrupted by a hit',()=>{
 const m=create();m.trigger('sealCharge');m.advance(2200);assert.equal(m.state,'sealSlam');m.advance(1200);assert.equal(m.state,'sealed');
 m.trigger('break');m.advance(1500);assert.equal(m.state,'exposed');
 m.trigger('stormCharge');m.pause(true);m.advance(9000);assert.equal(m.state,'stormCharge');m.pause(false);m.advance(2600);assert.equal(m.state,'storm');
 m.trigger('hit');m.advance(1100);assert.equal(m.state,'idle');m.advance(10000);assert.equal(m.state,'idle');
 m.trigger('stormCharge');m.advance(6200);assert.equal(m.state,'idle');
});
