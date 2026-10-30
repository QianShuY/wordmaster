'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {install}=require('../android-g0/mobile/form-input');
function fixture(id='battleForm'){
 const events={},submitted=[],form={id},input={form,value:'miracle',blur(){events.focusout?.({target:input});}},button={type:'submit',form,disabled:false};
 form.querySelector=()=>input;
 const doc={addEventListener:(k,f)=>events[k]=f};let now=1000;
 install(doc,f=>submitted.push({id:f.id,value:input.value}),()=>now);
 const event=extra=>({target:input,preventDefault(){this.prevented=true;},...extra});
 return {events,submitted,input,form,event,tap(){const e=event({target:{closest:()=>button}});events.click(e);return e;},advance(ms){now+=ms;}};
}
test('explicit Android submit taps commit the visible composing word in battle and study, exactly once',()=>{
 for(const id of ['battleForm','spellForm']){const f=fixture(id);f.events.compositionstart(f.event());const tap=f.tap();assert.equal(tap.prevented,true);assert.deepEqual(f.submitted,[{id,value:'miracle'}]);}
});
test('IME candidate Enter cannot submit, including a submit arriving just after compositionend; a later committed Enter works',()=>{
 const f=fixture();f.events.compositionstart(f.event());const key=f.event({key:'Enter',keyCode:229,isComposing:true});f.events.keydown(key);assert.equal(key.prevented,true);
 f.events.compositionend(f.event());f.events.submit(f.event({target:f.form}));assert.equal(f.submitted.length,0);
 f.advance(250);f.events.submit(f.event({target:f.form}));assert.equal(f.submitted.length,1);
});
test('an explicit tap is never swallowed by an IME Enter guard or a previous input composition',()=>{
 const f=fixture();f.events.compositionstart(f.event());f.events.keydown(f.event({key:'Enter',isComposing:true}));f.tap();assert.equal(f.submitted.length,1);
 f.events.compositionstart(f.event());f.events.focusout(f.event());f.advance(250);f.events.submit(f.event({target:f.form}));assert.equal(f.submitted.length,2);
});
test('ordinary Android letter keycode 229 does not swallow the next committed keyboard Done',()=>{
 const f=fixture();f.events.compositionstart(f.event());f.events.keydown(f.event({key:'Unidentified',keyCode:229,isComposing:true}));
 f.events.compositionend(f.event());f.events.keydown(f.event({key:'Enter',keyCode:13,isComposing:false}));f.events.submit(f.event({target:f.form}));assert.equal(f.submitted.length,1);
});
