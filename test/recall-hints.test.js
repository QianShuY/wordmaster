'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Domain=require('../shared/domain');
const source=fs.readFileSync(require.resolve('../static/app.js'),'utf8');
function render({isNew=0,errors=0,stage=null,android=false}={}){
 const elements=new Map(),spoken=[];
 const $=key=>{if(!elements.has(key))elements.set(key,{innerHTML:'',value:'',isConnected:true,disabled:false,addEventListener(){},classList:{add(){},remove(){}},focus(){},setSelectionRange(){},querySelectorAll(){return [];}});return elements.get(key);};
 const context=vm.createContext({Set,Domain,IS_ANDROID_APP:android,$,esc:String,wordAnswer:w=>w.word,wordHeadword:w=>w.word,wordSpeech:w=>w.word,
  wordPosMarkup:()=>'<span>n.</span>',wordMeaningMarkup:()=>'<p>考试</p>',speakerIconMarkup:'',speak:text=>spoken.push(text),bindTapAction(){},requestAnimationFrame(){},
  window:{requestAnimationFrame(){}},document:{activeElement:null,addEventListener(){}}});
 const start=source.indexOf('const Study = {'),end=source.indexOf('\n};',start)+3;
 vm.runInContext(source.slice(start,end)+';globalThis.study=Study;',context);
 const study=context.study;study.todayFlow=stage?{stage}:null;study.reinforcement={'1':{errors}};
 study.renderSpelling({id:1,word:'test',pos:'n.',meaning:'考试',is_new:isNew});
 return {spoken,markup:$('#studyStage').innerHTML,up(){study.keyHandler({key:'ArrowUp',target:{closest:()=>false},preventDefault(){}});}};
}
test('old recall keeps automatic speech and initial letters hidden but permits requested audio hints',()=>{
 for(const options of [{stage:'review-spelling',isNew:1},{isNew:0},{isNew:1,errors:2}]){
  const x=render(options);assert.equal(x.spoken.length,0);assert.ok(x.markup.includes('不提供首字母提示'));assert.ok(!x.markup.includes('首字母 <b>'));
  assert.doesNotMatch(x.markup,/hidden" id="spellSpeak"/);assert.match(x.markup,/听读音提示/);x.up();assert.equal(x.spoken.length,1);
 }
 const fresh=render({isNew:1});assert.equal(fresh.spoken.length,1);assert.ok(fresh.markup.includes('首字母 <b>t</b>'));fresh.up();assert.equal(fresh.spoken.length,2);
 const native=render({isNew:0,android:true});assert.equal(native.spoken.length,1);
});
test('desktop speech prefers a British voice, retains an available English fallback and ignores intentional cancellation errors',()=>{
 const make=voices=>{
  const messages=[],utterances=[],synth={cancel(){},getVoices:()=>voices,speak:u=>utterances.push(u)};
  function Utterance(text){this.text=text;}
  const context=vm.createContext({IS_ANDROID_APP:false,toast:x=>messages.push(x),speechSynthesis:synth,SpeechSynthesisUtterance:Utterance,
   window:{speechSynthesis:synth,SpeechSynthesisUtterance:Utterance},document:{querySelectorAll:()=>[]}});
  const start=source.indexOf('function speak(text)'),end=source.indexOf('\nconst esc',start);vm.runInContext(source.slice(start,end),context);
  return {messages,utterances,say:()=>context.speak('blouse')};
 };
 const gb={lang:'en-GB'},us={lang:'en-US'},preferred=make([us,gb]);preferred.say();assert.equal(preferred.utterances[0].voice,gb);assert.equal(preferred.utterances[0].lang,'en-GB');
 preferred.utterances[0].onerror({error:'canceled'});preferred.utterances[0].onerror({error:'interrupted'});assert.equal(preferred.messages.length,0);
 preferred.utterances[0].onerror({error:'audio-busy'});assert.equal(preferred.messages.length,1);
 const fallback=make([us]);fallback.say();fallback.say();assert.equal(fallback.utterances[0].lang,'en-US');assert.equal(fallback.messages.length,1);
});
