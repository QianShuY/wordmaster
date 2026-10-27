'use strict';
// Disposable database and origin. Never attaches to the learner's installation.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),express=require('express');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-formal-browser-'));
process.env.WORDMASTER_DB_PATH=path.join(dir,'isolated.db');
const {app:production,db}=require('../app/main'),{seedFormalBattle,play,replay}=require('../test/fixtures/formal-battle');
seedFormalBattle(db);
const protectedState=()=>JSON.stringify(['progress','review_log','user_cards','recall_cycles','adventure_days'].map(table=>db.prepare('SELECT * FROM '+table+' ORDER BY rowid').all()));
const before=protectedState(),qa=express(),boots={};let lostResponse=false;
qa.get('/qa/status',(_req,res)=>res.json({isolated:true,learningUnchanged:protectedState()===before,lostResponse,endings:db.prepare('SELECT COUNT(*) n FROM adventure_endings').get().n,sessions:db.prepare('SELECT COUNT(*) n FROM boss_sessions').get().n}));
qa.get('/qa',(_req,res)=>res.type('html').send(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>正式战斗 · 隔离验收</title><style>body{font:18px Georgia;background:#f1eee5;color:#27443a;padding:48px;max-width:760px;margin:auto}button{display:block;margin:18px 0;padding:18px 26px;font:inherit;background:#365548;color:#fff;border:0;border-radius:12px}p{line-height:1.8}</style><h1>正式战斗 · 隔离验收</h1><p>240 条内置六级来源词模拟已学记录，正式服务选出 180 词。全部使用临时数据库，不连接你的学习存档。以下按钮只装入由真实规则逐步生成的战斗手记。</p><button data-boot="storm">接续六词残页领域</button><button data-boot="final">接续八词最终领域</button><button data-boot="won">接续胜利并验收结局</button><p>首次封存：服务端成功保存后模拟响应中断；重试应读取同一结果。</p><script>const boots=${JSON.stringify(boots).replace(/</g,'\\u003c')};for(const b of document.querySelectorAll('[data-boot]'))b.onclick=()=>{const f=boots[b.dataset.boot];localStorage.setItem('moci-boss-formal-v1:'+f.instanceId,JSON.stringify(f.saved));location.href='/adventure/battle.html';};</script></html>`));
qa.use((req,res,next)=>{
 if(!['GET','HEAD'].includes(req.method)&&!(req.method==='POST'&&/^\/api\/adventure\/boss\/sessions(?:\/[^/]+\/finish)?$/.test(req.path)))return res.status(405).json({error:'Only isolated Boss sessions may be written'});
 if(req.method==='POST'&&req.path.endsWith('/finish')&&!lostResponse){
  const json=res.json.bind(res);res.json=data=>{if(data?.ok&&!lostResponse){lostResponse=true;res.status(503);return json({error:'隔离验收：结局已保存，模拟响应中断'});}return json(data);};
 }
 next();
});
qa.use(production);
const server=qa.listen(0,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port;
 try{
  for(const kind of ['storm','final','won']){
   const response=await fetch(base+'/api/adventure/boss/sessions',{method:'POST'}),session=await response.json();
   if(!response.ok)throw Error(session.error);
   const fight=play(session),events=[];let game;
   for(const event of fight.events){events.push(event);game=replay(session,events);
    if(kind!=='won'&&game.state.phase==='question'&&game.state.domain?.required===(kind==='storm'?6:8)&&game.state.chain===2)break;
   }
   boots[kind]={instanceId:session.initial.instanceId,saved:{sessionId:session.id,events,battle:game.snapshot(),domainElapsed:0,limit:0,seconds:0,assisted:false}};
  }
  console.log('FORMAL_BATTLE_QA '+base+'/qa');
 }catch(error){console.error(error);shutdown();}
});
function shutdown(){server.close(()=>{db.close();if(path.dirname(dir)===os.tmpdir()&&path.basename(dir).startsWith('moci-formal-browser-'))fs.rmSync(dir,{recursive:true,force:true});});}
process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
