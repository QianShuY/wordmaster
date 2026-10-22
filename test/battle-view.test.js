'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(supported=true){
 const events={},listeners={},attrs={},button={textContent:'',setAttribute(k,v){attrs[k]=v;},addEventListener(k,fn){listeners[k]=fn;}},status={textContent:''};
 const document={fullscreenElement:null,documentElement:{},getElementById:id=>id==='battleFullscreen'?button:status,addEventListener(k,fn){events[k]=fn;},async exitFullscreen(){document.fullscreenElement=null;events.fullscreenchange();}};
 if(supported)document.documentElement.requestFullscreen=async()=>{document.fullscreenElement=document.documentElement;events.fullscreenchange();};
 vm.runInNewContext(fs.readFileSync(require.resolve('../static/adventure/battle-view.js'),'utf8'),{document});
 return {document,button,status,attrs,click:()=>listeners.click(),events};
}
test('fullscreen is explicit and the label follows entry, exit and browser Escape without mutating combat',async()=>{
 const s=setup();assert.equal(s.document.fullscreenElement,null);assert.equal(s.button.textContent,'进入全屏');
 await s.click();assert.equal(s.button.textContent,'退出全屏');assert.equal(s.attrs['aria-pressed'],'true');
 await s.click();assert.equal(s.button.textContent,'进入全屏');assert.equal(s.attrs['aria-pressed'],'false');
 await s.click();s.document.fullscreenElement=null;s.events.fullscreenchange();assert.equal(s.button.textContent,'进入全屏');
});
test('unsupported or denied fullscreen leaves the immersive layout usable with a clear status',async()=>{
 const s=setup(false);await s.click();assert.match(s.status.textContent,/仍会铺满可用画面/);assert.equal(s.attrs['aria-pressed'],'false');
 s.document.documentElement.requestFullscreen=async()=>{throw Error('denied');};await s.click();assert.equal(s.document.fullscreenElement,null);assert.equal(s.button.textContent,'进入全屏');
});
