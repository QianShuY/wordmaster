'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {edit,install}=require('../android-g0/mobile/word-keyboard');

test('spelling keyboard inserts and replaces at the selection, including phrase punctuation',()=>{
 assert.deepEqual(edit('suspension',3,6,'t'),{value:'sustsion',caret:4});
 assert.deepEqual(edit('aircondition',3,3,'-'),{value:'air-condition',caret:4});
 assert.deepEqual(edit('takeoff',4,4,'space'),{value:'take off',caret:5});
 assert.deepEqual(edit('dont',3,3,"'"),{value:"don't",caret:4});
});
test('spelling keyboard deletion and navigation respect ranges and word edges',()=>{
 assert.deepEqual(edit('word',0,0,'backspace'),{value:'word',caret:0});
 assert.deepEqual(edit('word',1,3,'backspace'),{value:'wd',caret:1});
 assert.deepEqual(edit('word',2,2,'delete'),{value:'wod',caret:2});
 assert.deepEqual(edit('word',1,3,'left'),{value:'word',caret:1});
 assert.deepEqual(edit('word',1,3,'right'),{value:'word',caret:3});
 assert.deepEqual(edit('word',4,4,'right'),{value:'word',caret:4});
});
test('spelling keyboard accepts no predictions or Chinese characters and cannot exceed the input limit',()=>{
 assert.deepEqual(edit('abc',3,3,'d',3),{value:'abc',caret:3});
 assert.deepEqual(edit('abc',1,2,'d',3),{value:'adc',caret:2});
 assert.deepEqual(edit('ab',2,2,'建议词'),{value:'ab',caret:2});
});

function fixture(){
 const listeners={},keys={},classes=new Set(),saved={},inputs=[];let current=null,busy=false,submitted=0,sound=[];
 const host={hidden:true,addEventListener:(type,fn)=>keys[type]=fn,getBoundingClientRect:()=>({height:242})};
 const doc={defaultView:{Event:class{constructor(type,opts){this.type=type;Object.assign(this,opts);}}},getElementById:id=>id==='wordKeyboard'?host:null,
  documentElement:{style:{setProperty(){}}},body:{classList:{toggle:(k,on)=>on?classes.add(k):classes.delete(k)}},
  createElement:()=>({remove(){}}),addEventListener:(type,fn)=>listeners[type]=fn,querySelector:s=>s.startsWith('#spellInput')?current:null};
 const keyboard=install(doc,{storage:{getItem:k=>saved[k],setItem:(k,v)=>saved[k]=v},busy:()=>busy,onSound:a=>sound.push(a)});
 function input(id='spellInput',value=''){const el={id,value,isConnected:true,selectionStart:0,selectionEnd:0,maxLength:150,
  dataset:{},closest:()=>null,setAttribute(){},removeAttribute(){},focus(){},blur(){},setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;},dispatchEvent:e=>inputs.push(e.type)};
  el.form={append(){},querySelector:()=>({click(){submitted++;}})};current=el;keyboard.sync();return el;}
 const tap=key=>keys.click({target:{closest:()=>({dataset:{wordKey:key}})}});
 return {input,tap,keyboard,host,classes,inputs,sound,saved,setBusy:on=>busy=on,leave(){current=null;keyboard.sync();},submitted:()=>submitted,listeners};
}
test('custom keys edit the real draft and submit once through the existing form, without judging the answer',()=>{
 const f=fixture(),input=f.input();assert.equal(input.readOnly,true);assert.equal(input.inputMode,'none');assert.equal(f.host.hidden,false);
 for(const c of 'miracle')f.tap(c);assert.equal(input.value,'miracle');assert.equal(f.inputs.length,7);
 f.tap('left');f.tap('backspace');assert.equal(input.value,'mirace');
 f.tap('sound');assert.deepEqual(f.sound,['speak']);f.tap('submit');assert.equal(f.submitted(),1);
 f.setBusy(true);f.tap('x');f.tap('submit');assert.equal(input.value,'mirace');assert.equal(f.submitted(),1);
 f.setBusy(false);f.leave();assert.equal(f.host.hidden,true);assert.equal(f.classes.has('word-keyboard-open'),false);
});
test('system fallback preserves the same draft; a new question has no stale key target',()=>{
 const f=fixture(),first=f.input('battleInput','air');f.tap('-');f.tap('sound');assert.deepEqual(f.sound,['battleSpeak']);
 f.tap('system');assert.equal(first.value,'air-');assert.equal(first.readOnly,false);assert.equal(first.inputMode,'text');assert.equal(f.host.hidden,true);assert.equal(f.saved['moci-spelling-keyboard'],'system');
 // A DOM replacement is synchronized instead of typing into the detached word.
 first.isConnected=false;const next=f.input('battleInput','next');assert.equal(next.readOnly,false);f.tap('x');assert.equal(next.value,'next');assert.equal(first.value,'air-');
});
