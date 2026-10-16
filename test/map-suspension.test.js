'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('hidden map freezes CSS and SVG; returning respects manual pause and reduced motion',()=>{
 const handlers={},classes=new Set(),map={classList:{contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)}};
 let svgPaused=false;const river={pauseAnimations:()=>svgPaused=true,unpauseAnimations:()=>svgPaused=false};
 const layer={insertAdjacentHTML(){},querySelector:s=>s==='.river-motion'?river:null},media={matches:false,addEventListener:(k,fn)=>handlers.media=fn};
 const document={hidden:false,querySelector:s=>s==='.world-atmosphere'?layer:map,getElementById:()=>({addEventListener:(k,fn)=>handlers.button=fn}),addEventListener:(k,fn)=>handlers[k]=fn};
 vm.runInNewContext(fs.readFileSync(require.resolve('../static/adventure/journey-atmosphere.js'),'utf8'),{document,window:{addEventListener:(k,fn)=>handlers[k]=fn},matchMedia:()=>media,queueMicrotask:fn=>fn()});
 const check=value=>{assert.equal(svgPaused,value);assert.equal(classes.has('motion-suspended'),value);};check(false);
 document.hidden=true;handlers.visibilitychange();check(true);document.hidden=false;handlers.visibilitychange();check(false);
 classes.add('wind-paused');handlers['moci-map-motion-change']();check(true);document.hidden=true;handlers.visibilitychange();document.hidden=false;handlers.visibilitychange();check(true);
 classes.delete('wind-paused');handlers['moci-map-motion-change']();check(false);media.matches=true;handlers.media();check(true);media.matches=false;handlers.media();check(false);
 handlers.pagehide();check(true);handlers.pageshow();check(false);
});
