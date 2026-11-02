'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {destination,commits,install}=require('../android-g0/mobile/swipe-navigation');
test('swipes follow the visible five-tab order without wrapping or leaving a lesson',()=>{
 assert.equal(destination('today',-100),'words');assert.equal(destination('words',100),'today');
 assert.equal(destination('journey',-100),'cards');assert.equal(destination('today',100),null);assert.equal(destination('mine',-100),null);
 assert.equal(destination('study',-100),null);assert.equal(destination('battle',100),null);
});
test('short slow drags rebound, flicks commit, vertical drags do not',()=>{
 assert.equal(commits(-90,5,400,390),true);assert.equal(commits(-40,4,60,390),true);
 assert.equal(commits(-30,3,500,390),false);assert.equal(commits(-90,100,100,390),false);
});
function fixture(){
 let route='today',blocked=false,open=false;const events={},options={},moves=[],styles={},bodyClasses=new Set();
 const app={style:styles,animate(frames){moves.push(frames);return {finished:Promise.resolve(),cancel(){}};}};
 const win={innerWidth:390,matchMedia:()=>({matches:false}),requestAnimationFrame:fn=>{fn();return 1;},cancelAnimationFrame(){},addEventListener(){}};
 const doc={defaultView:win,getElementById:()=>app,body:{classList:{add:k=>bodyClasses.add(k),remove:k=>bodyClasses.delete(k)}},querySelector:s=>s==='dialog[open]'&&open?{}:null,addEventListener:(k,f,o)=>{events[k]=f;options[k]=o;}};
 const navigated=[],api=install(doc,{route:()=>route,blocked:()=>blocked,navigate:r=>navigated.push(r)});
 const event=(x,y,t,excluded=false)=>({clientX:x,clientY:y,timeStamp:t,pointerId:1,button:0,cancelable:true,target:{closest:()=>excluded?{}:null},preventDefault(){}});
 const touch=(x,y,timeStamp,excluded=false)=>{const t={identifier:7,clientX:x,clientY:y};return {touches:[t],changedTouches:[t],timeStamp,target:{closest:()=>excluded?{}:null},cancelable:true,preventDefault(){this.prevented=true;}};};
 return {api,events,options,styles,navigated,moves,bodyClasses,route:r=>route=r,block:v=>blocked=v,dialog:v=>open=v,event,touch};
}
test('drag tracks the finger and commits once; render clears the old transform',()=>{
 const f=fixture();f.api.painted('today');f.events.pointerdown(f.event(300,150,0));f.events.pointermove(f.event(180,155,180));
 assert.match(f.styles.transform,/-120px/);f.events.pointerup(f.event(180,155,220));assert.deepEqual(f.navigated,['words']);
 f.route('words');f.api.painted('words');assert.equal(f.styles.transform,'');assert.equal(f.bodyClasses.has('swipe-dragging'),false);assert.equal(f.moves.length,1);
});
test('Android touch stream commits even if the compatibility pointer stream is cancelled',()=>{
 const f=fixture();f.api.painted('today');
 f.events.pointerdown({...f.event(300,150,0),pointerType:'touch'});
 assert.ok(f.events.touchstart,'touch input needs its own listener');
 f.events.touchstart(f.touch(300,150,0));
 f.events.pointercancel({...f.event(290,151,10),pointerType:'touch'});
 const move=f.touch(180,158,180);f.events.touchmove(move);
 assert.equal(move.prevented,true);assert.match(f.styles.transform,/-120px/);
 f.events.touchend({...f.touch(180,158,220),touches:[]});
 f.events.pointerup({...f.event(180,158,220),pointerType:'touch'});
 assert.deepEqual(f.navigated,['words']);
 assert.equal(f.options.touchmove.passive,false);assert.equal(f.options.touchmove.capture,true);
});
test('touch vertical scroll, cancellation, multiple fingers and excluded controls never change tabs',()=>{
 for(const kind of ['vertical','cancel','multiple','control']){
  const f=fixture();f.events.touchstart(f.touch(300,150,0,kind==='control'));
  const move=f.touch(kind==='vertical'?305:180,kind==='vertical'?220:155,100,kind==='control');
  if(kind==='multiple')move.touches.push({identifier:8,clientX:200,clientY:160});
  f.events.touchmove(move);
  if(kind==='vertical'||kind==='control')assert.equal(move.prevented,undefined);
  if(kind==='cancel')f.events.touchcancel({});
  f.events.touchend({...f.touch(100,230,200),touches:[]});
  assert.deepEqual(f.navigated,[],kind);
 }
});
test('touch can switch from every main screen in both available directions',()=>{
 const tabs=['today','words','journey','cards','mine'];
 for(const [index,route] of tabs.entries())for(const dx of [-100,100]){
  const f=fixture();f.route(route);f.api.painted(route);
  f.events.touchstart(f.touch(195,150,0));
  f.events.touchmove(f.touch(195+dx,158,150));
  f.events.touchend({...f.touch(195+dx,158,200),touches:[]});
  const expected=tabs[index+(dx<0?1:-1)];
  assert.deepEqual(f.navigated,expected?[expected]:[],`${route} ${dx}`);
 }
});
test('map, input, modal, busy and lesson gestures cannot navigate',()=>{
 for(const kind of ['map','input','modal','busy','study','battle']){
  const f=fixture();if(kind==='modal')f.dialog(true);if(kind==='busy')f.block(true);if(['study','battle'].includes(kind))f.route(kind);
  f.events.pointerdown(f.event(300,100,0,['map','input'].includes(kind)));f.events.pointermove(f.event(50,103,200));f.events.pointerup(f.event(50,103,240));assert.equal(f.navigated.length,0,kind);
 }
});
test('vertical movement and cancelled / boundary drags leave the current route intact',()=>{
 const f=fixture();f.events.pointerdown(f.event(200,100,0));f.events.pointermove(f.event(205,180,100));f.events.pointerup(f.event(50,220,150));assert.equal(f.navigated.length,0);
 f.events.pointerdown(f.event(100,100,200));f.events.pointermove(f.event(250,100,300));f.events.pointerup(f.event(250,100,350));assert.equal(f.navigated.length,0);assert.equal(f.moves.length,1);
 f.events.pointerdown(f.event(250,100,400));f.events.pointermove(f.event(100,100,500));f.events.pointercancel(f.event(100,100,550));assert.equal(f.navigated.length,0);assert.equal(f.moves.length,2);
});
