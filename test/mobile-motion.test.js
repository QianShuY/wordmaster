'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(reduced=false){
 let route='today',removed=0,cancelled=0;const animations=[],events={};
 function node(){return {cloneNode(){throw Error('Do not clone the previous screen');},getBoundingClientRect(){throw Error('Do not measure the previous screen');},animate(frames,options){let done;const finished=new Promise(resolve=>done=resolve);const a={frames,options,finished,done,cancel(){cancelled++;done();}};animations.push(a);return a;}};}
 const app={firstElementChild:node(),querySelector:()=>node(),set innerHTML(html){this.html=html;this.firstElementChild=node();}};
 const doc={hidden:false,body:{append(){}},defaultView:{matchMedia:()=>({matches:reduced})},getElementById:()=>app,addEventListener:(k,f)=>events[k]=f};
 const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../android-g0/mobile/motion'),'utf8'),context);
 const motion=context.window.MociMotion.create(doc,()=>route);
 return {motion,doc,app,animations,events,route:r=>route=r,removed:()=>removed,cancelled:()=>cancelled};
}
test('route fade never clones or measures old screens, and repeated questions have no entry animation',()=>{
 const f=fixture();f.motion.paint('first');assert.equal(f.app.html,'first');
 f.route('study');f.motion.paint('answer');assert.equal(f.app.html,'answer');assert.equal(f.cancelled(),1);
 assert.equal(f.animations.length,2);assert.ok(f.animations.every(a=>a.frames[0].opacity>=.9&&!a.frames[0].translate));
 f.motion.paint('next question');assert.equal(f.animations.length,2);assert.equal(f.app.html,'next question');
 f.route('mine');f.motion.paint('settings');f.doc.hidden=true;f.events.visibilitychange();assert.equal(f.cancelled(),3);
});
test('reduced motion replaces content without ghosts or animations',()=>{
 const f=fixture(true);f.motion.paint('answer');assert.equal(f.app.html,'answer');assert.equal(f.animations.length,0);
});
test('dialog close is synchronous and cannot later close a newly opened dialog',()=>{
 const f=fixture(),sheet={open:true,close(){this.open=false;},showModal(){this.open=true;},animate(){let done;const finished=new Promise(resolve=>done=resolve);const a={finished,done,cancel:()=>done()};f.animations.push(a);return a;}};
 f.motion.openDialog(sheet,'first');f.motion.closeDialog(sheet);assert.equal(sheet.open,false);
 f.motion.openDialog(sheet,'new word');assert.equal(sheet.open,true);assert.equal(sheet.innerHTML,'new word');
});
