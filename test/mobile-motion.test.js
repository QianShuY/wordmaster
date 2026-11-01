'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(reduced=false){
 let route='today',removed=0,cancelled=0;const animations=[],events={};
 function node(){return {style:{},classList:{add(){}},setAttribute(){},removeAttribute(){},querySelectorAll:()=>[],getBoundingClientRect:()=>({left:0,top:0,width:390,height:660}),cloneNode:node,remove(){removed++;},animate(frames,options){let done;const finished=new Promise(resolve=>done=resolve);const a={frames,options,finished,done,cancel(){cancelled++;done();}};animations.push(a);return a;}};}
 const app={firstElementChild:node(),querySelector:()=>node(),set innerHTML(html){this.html=html;this.firstElementChild=node();}};
 const doc={hidden:false,body:{append(){}},defaultView:{matchMedia:()=>({matches:reduced})},getElementById:()=>app,addEventListener:(k,f)=>events[k]=f};
 const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../android-g0/mobile/motion'),'utf8'),context);
 const motion=context.window.MociMotion.create(doc,()=>route);
 return {motion,doc,app,animations,events,route:r=>route=r,removed:()=>removed,cancelled:()=>cancelled};
}
test('motion swaps content synchronously and cancels outgoing effects on rapid navigation',async()=>{
 const f=fixture();f.motion.paint('first');assert.equal(f.app.html,'first');
 f.route('study');f.motion.paint('answer');assert.equal(f.app.html,'answer');assert.ok(f.cancelled()>=2);assert.ok(f.removed()>0);
 f.doc.hidden=true;f.events.visibilitychange();assert.ok(f.cancelled()>=4);
});
test('reduced motion replaces content without ghosts or animations',()=>{
 const f=fixture(true);f.motion.paint('answer');assert.equal(f.app.html,'answer');assert.equal(f.animations.length,0);
});
test('a closing dialog cannot later close a newly opened dialog',async()=>{
 const f=fixture(),sheet={open:true,close(){this.open=false;},showModal(){this.open=true;},animate(){let done;const finished=new Promise(resolve=>done=resolve);const a={finished,done,cancel:()=>done()};f.animations.push(a);return a;}};
 const closing=f.motion.closeDialog(sheet);f.motion.openDialog(sheet,'new word');await closing;assert.equal(sheet.open,true);assert.equal(sheet.innerHTML,'new word');
});
