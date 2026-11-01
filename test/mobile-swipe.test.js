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
 let route='today',blocked=false,open=false;const events={},moves=[],styles={},bodyClasses=new Set();
 const app={style:styles,animate(frames){moves.push(frames);return {finished:Promise.resolve(),cancel(){}};}};
 const win={innerWidth:390,matchMedia:()=>({matches:false}),requestAnimationFrame:fn=>{fn();return 1;},cancelAnimationFrame(){},addEventListener(){}};
 const doc={defaultView:win,getElementById:()=>app,body:{classList:{add:k=>bodyClasses.add(k),remove:k=>bodyClasses.delete(k)}},querySelector:s=>s==='dialog[open]'&&open?{}:null,addEventListener:(k,f)=>events[k]=f};
 const navigated=[],api=install(doc,{route:()=>route,blocked:()=>blocked,navigate:r=>navigated.push(r)});
 const event=(x,y,t,excluded=false)=>({clientX:x,clientY:y,timeStamp:t,pointerId:1,button:0,cancelable:true,target:{closest:()=>excluded?{}:null},preventDefault(){}});
 return {api,events,styles,navigated,moves,bodyClasses,route:r=>route=r,block:v=>blocked=v,dialog:v=>open=v,event};
}
test('drag tracks the finger and commits once; render clears the old transform',()=>{
 const f=fixture();f.api.painted('today');f.events.pointerdown(f.event(300,150,0));f.events.pointermove(f.event(180,155,180));
 assert.match(f.styles.transform,/-120px/);f.events.pointerup(f.event(180,155,220));assert.deepEqual(f.navigated,['words']);
 f.route('words');f.api.painted('words');assert.equal(f.styles.transform,'');assert.equal(f.bodyClasses.has('swipe-dragging'),false);assert.equal(f.moves.length,1);
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
