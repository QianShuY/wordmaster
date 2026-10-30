'use strict';
// Disposable, seed-only browser harness. Never imports the personal desktop DB.
const express=require('express'),fs=require('fs'),path=require('path'),os=require('os'),{DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'android-g0/mobile-dist'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-mobile-qa-')),file=path.join(dir,'qa.db');
fs.copyFileSync(path.join(root,'android-g0/android/app/src/main/assets/mobile-seed.db'),file);const db=new DatabaseSync(file);db.exec('PRAGMA foreign_keys=ON');const store=require('../android-g0/test/mobile-adapter.cjs').adapter(db),app=express();app.use(express.json({limit:'64mb'}));
app.get('/',(req,res)=>{const width=Number(req.query.width)||390,height=Number(req.query.height)||660;if(width<320||width>900||height<320||height>1000)return res.sendStatus(400);res.send(`<!doctype html><html><head><title>墨词 · 手机布局验收</title><style>body{margin:0;background:#dce1d5;display:grid;place-items:center;min-height:100vh}iframe{border:1px solid #b6c3ae;border-radius:16px;box-shadow:0 18px 60px #25382c22;background:#f5f1e8}small{position:fixed;left:12px;top:10px;font:12px sans-serif;color:#67745f}</style></head><body><small>浏览器布局预览 · ${width}×${height} · 独立测试数据</small><iframe title="手机布局预览" src="/mobile/index.html" width="${width}" height="${height}"></iframe></body></html>`);});
app.get('/mobile/index.html',(_req,res)=>res.send(fs.readFileSync(path.join(dist,'index.html'),'utf8').replace('<script src="app.js"></script>','<script src="preview-bridge.js"></script><script src="app.js"></script>')));
app.get('/mobile/preview-bridge.js',(_req,res)=>res.type('js').send(`const call=async(kind,data)=>{const r=await fetch('/qa/'+kind,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const v=await r.json();if(!r.ok)throw Error(v.error);return v;};window.MobilePreviewStore={query:d=>call('query',d),commit:d=>call('commit',d),speak:async()=>{throw Error('布局预览不模拟原生语音')},saveFile:async()=>({cancelled:true}),openFile:async()=>({cancelled:true}),exit:async()=>{}};`));
app.use('/mobile',express.static(dist));for(const kind of ['query','commit'])app.post('/qa/'+kind,async(req,res)=>{try{res.json(await store[kind](req.body));}catch(e){res.status(409).json({error:e.message});}});
let server;
async function start(){
 if(process.argv.includes('--storm')){
  // The normal service/engine prepares a disposable checkpoint; the UI still
  // enters the realm by choosing a spell. Never seed the user's application DB.
  const M=require('../android-g0/mobile/service'),B=require('../shared/boss-battle'),service=M.create(store);let view=await service.beginBattle(true);
  view=await service.battleAction('start',{preview:true,value:B.DECLARATION});
  for(let i=0;i<300;i++){
   const s=view.snapshot;if(s.phase==='choose'&&s.bossHp<=120&&s.round%2===1)break;
   if(s.phase==='choose')view=await service.battleAction('choose',{preview:true,value:'defend'});
   else if(s.phase==='question')view=await service.battleAction('answer',{preview:true,value:view.question.mode==='meaning'?view.question.meaning:view.question.answer});
   else if(s.phase==='feedback')view=await service.battleAction('next',{preview:true});
   else throw Error('Unexpected QA phase '+s.phase);
  }
  if(view.snapshot.phase!=='choose'||view.snapshot.bossHp>120)throw Error('QA storm checkpoint not ready');
  await service.readLetter();console.log('QA fixture: storm-ready trial, round '+view.snapshot.round);
 }
 if(process.argv.includes('--spelling')){
  const M=require('../android-g0/mobile/service'),service=M.create(store),book='builtin:cet6';
  await service.setPreference('selected_book',book);let study=await service.start(book);
  for(let i=0;i<100&&study.stage!=='spelling';i++){
   const data={sessionId:study.id,group:study.group,index:study.index,stage:study.stage,requestId:M.makeId()};
   study=await service.action(book,study.stage==='learn'||study.feedback?'next':'answer',{...data,value:study.word.meaning});
  }
  if(study.stage!=='spelling')throw Error('QA spelling checkpoint not ready');
  console.log('QA fixture: ten-word group ready for spelling');
 }
 server=app.listen(0,'127.0.0.1',()=>{const info={port:server.address().port,root:'http://127.0.0.1:'+server.address().port,isolated:true,db:file};fs.mkdirSync(path.join(root,'output/refinement'),{recursive:true});fs.writeFileSync(path.join(root,'output/refinement/mobile-qa-server.json'),JSON.stringify(info));console.log(JSON.stringify(info));});
}
void start().catch(error=>{console.error(error);db.close();process.exitCode=1;});
function stop(){server.close(()=>{db.close();const absolute=path.resolve(dir);if(absolute.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(absolute).startsWith('moci-mobile-qa-'))fs.rmSync(absolute,{recursive:true,force:true,maxRetries:5,retryDelay:100});process.exit();});}process.on('SIGINT',stop);process.on('SIGTERM',stop);
