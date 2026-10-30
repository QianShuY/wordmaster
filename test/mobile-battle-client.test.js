'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../android-g0/mobile/battle-ui.js'),'utf8');
function fixture(){
 const events={},calls=[],input={value:'',blur(){},focus(){}},view={preview:true,snapshot:{phase:'question'},question:{answer:'miracle'}};
 const context={document:{addEventListener:(k,f)=>events[k]=f,hidden:false},window:{},clearTimeout(){},clearInterval(){},setInterval(){},performance:{now:()=>0},tab:'battle',busy:false,
  $:s=>s==='#battleInput'?input:null,MobileSound:{effect(){},pause(){}},MociMobile:{makeId:()=>String(calls.length+1)},
  service:{battle:async()=>view,battleAction:async(type,data)=>{calls.push({type,data});return {...view,outcome:{ok:true}};}}};
 vm.createContext(context);vm.runInContext(source+'\nrenderBattle=async()=>{};battleView=initialView;',Object.assign(context,{initialView:view}));
 return {context,calls,view,input,run:(type,data)=>{context.args={type,data};return vm.runInContext('battleCommand(args.type,args.data)',context);},pending:()=>vm.runInContext('battlePending',context)};
}
test('empty battle submission cannot freeze later typed or skip answers',async()=>{
 const f=fixture();await assert.rejects(f.run('answer',{value:''}),/先写下答案/);assert.equal(f.pending(),null);assert.equal(f.calls.length,0);
 await f.run('answer',{value:'miracle'});assert.equal(f.calls[0].data.value,'miracle');
 await assert.rejects(f.run('answer',{value:' '}),/先写下答案/);await f.run('answer',{skip:true});assert.equal(f.calls[1].data.skip,true);
});
test('a known failed write releases its pending payload so a corrected answer can be submitted',async()=>{
 const f=fixture();let fail=true;f.context.service.battleAction=async(type,data)=>{f.calls.push({type,data});if(fail){fail=false;throw Error('failed transaction');}return {...f.view,outcome:{ok:true}};};
 await assert.rejects(f.run('answer',{value:'old'}),/failed/);assert.equal(f.pending(),null);await f.run('answer',{value:'miracle'});assert.equal(f.calls[1].data.value,'miracle');
});
test('an uncertain saved answer is reconciled before another click and is not counted twice',async()=>{
 const f=fixture();let saved=null,readFail=true;
 f.context.service.battle=async()=>{if(readFail){readFail=false;throw Error('read offline');}return saved||f.view;};
 f.context.service.battleAction=async(type,data)=>{f.calls.push({type,data});if(!saved){saved={...f.view,lastRequest:data.requestId,lastOutcome:{ok:true}};throw Error('response lost');}assert.equal(data.requestId,saved.lastRequest);return {...saved,outcome:saved.lastOutcome};};
 await assert.rejects(f.run('answer',{value:'miracle'}),/response lost/);assert.ok(f.pending());await f.run('answer',{skip:true});assert.equal(f.pending(),null);assert.equal(f.calls.length,2);assert.equal(f.calls[1].data.skip,undefined);assert.equal(f.calls[1].data.requestId,f.calls[0].data.requestId);
});
test('an unresolved native speech request cannot lock combat writes',async()=>{
 const app=fs.readFileSync(require.resolve('../android-g0/mobile/app.js'),'utf8');const handle=app.slice(app.indexOf('async function handle('),app.indexOf("document.addEventListener('click'",app.indexOf('async function handle(')));
 const actions=[],context={busy:false,pending:null,$:()=>null,toast(){},doAction:async action=>{actions.push(action);if(action==='battleSpeak')await new Promise(()=>{});}};vm.createContext(context);vm.runInContext(handle,context);void vm.runInContext("handle('battleSpeak',null)",context);await vm.runInContext("handle('battleSkip',null)",context);assert.deepEqual(actions,['battleSpeak','battleSkip']);assert.equal(context.busy,false);
});
