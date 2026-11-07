'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),express=require('express');
const {createManager,install}=require('../app/cinema-bt'),{chooseTracks,cuesFromSrt,mergeCues}=require('../app/cinema-media');
function enc(v){if(Buffer.isBuffer(v))return Buffer.concat([Buffer.from(v.length+':'),v]);if(typeof v==='string')return enc(Buffer.from(v));if(typeof v==='number')return Buffer.from('i'+v+'e');if(Array.isArray(v))return Buffer.concat([Buffer.from('l'),...v.map(enc),Buffer.from('e')]);return Buffer.concat([Buffer.from('d'),...Object.keys(v).sort().flatMap(k=>[enc(k),enc(v[k])]),Buffer.from('e')]);}
const info={name:'season',files:[{length:4,path:['episode.mkv']},{length:1,path:['note.txt']}],'piece length':16384,pieces:Buffer.alloc(20)},torrent=enc({info}),hash=crypto.createHash('sha1').update(enc(info)).digest('hex');
const fake=()=>{const calls=[];let complete=false;return {calls,start:async()=>{},close:()=>{},done:()=>{complete=true;},rpc:async(method,args)=>{calls.push([method,args]);if(method==='addUri')return 'meta';if(method==='addTorrent')return 'film';if(method==='tellStatus')return {status:complete?'complete':'active',connections:'0',downloadSpeed:'0',files:[{index:'1',completedLength:complete?'4':'0'}]};return 'OK';}};};
test('download waiting is distinct from preparation queue and resumes without duplicate downloads',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'moci-bt-wait-')),engine=fake();let phase='waiting',prepared=0,speed='0',connections='0';
 const original=engine.rpc;engine.rpc=async(method,args)=>method==='tellStatus'?{status:phase,connections,downloadSpeed:speed,files:[{index:'1',completedLength:'0'}]}:original(method,args);
 const manager=createManager({directory,engine,pollMs:60000,prepare:async()=>{prepared++;}});
 try{
  const job=await manager.add(`magnet:?xt=urn:btih:${hash}`);
  fs.writeFileSync(path.join(manager.folder(job.id),hash+'.torrent'),torrent);await manager.tick();await manager.select(job.id,1);await manager.tick();
  assert.equal(manager.list()[0].state,'waiting');assert.match(manager.list()[0].message,/排队/);assert.equal(prepared,0);
  await manager.resume(job.id);assert.equal(engine.calls.filter(c=>c[0]==='addTorrent').length,1);
  phase='active';await manager.tick();assert.equal(manager.list()[0].state,'downloading');assert.match(manager.list()[0].message,/连接/);
  speed='24000';connections='3';await manager.tick();assert.match(manager.list()[0].message,/首个分块/);
  speed='0';await manager.tick();assert.match(manager.list()[0].message,/等待传输/);
  phase='waiting';await manager.tick();await manager.pause(job.id);assert.equal(manager.list()[0].state,'paused');
  await manager.resume(job.id);await manager.tick();manager.close();
  const restored=createManager({directory,engine:fake()});try{assert.equal(restored.list()[0].state,'paused');}finally{restored.close();}
 }finally{manager.close();fs.rmSync(directory,{recursive:true,force:true});}
});
test('metadata does not start the season; selection, progress, pause and automatic preparation are explicit',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'moci-bt-')),engine=fake();let prepared=0;
 const manager=createManager({directory,engine,pollMs:60000,prepare:async(file,dir)=>{prepared++;assert.equal(fs.readFileSync(file,'utf8'),'data');assert.notEqual(path.dirname(file),dir,'generated files must never replace torrent originals');fs.writeFileSync(path.join(dir,'playback.mp4'),'movie');fs.writeFileSync(path.join(dir,'captions.json'),'[]');return {bilingual:true,message:'ready'};}});
 try{
  const job=await manager.add(`magnet:?xt=urn:btih:${hash}`,'Test');assert.equal(job.state,'resolving');assert.equal(engine.calls[0][1][1]['bt-metadata-only'],'true');assert.equal(engine.calls.some(c=>c[0]==='addTorrent'),false);
  fs.writeFileSync(path.join(manager.folder(job.id),hash+'.torrent'),torrent);await manager.tick();assert.equal(manager.list()[0].state,'selecting');assert.equal(manager.list()[0].files.length,1);
  await assert.rejects(()=>manager.select(job.id,2),/视频/);
  await manager.select(job.id,1);assert.equal(engine.calls.find(c=>c[0]==='addTorrent')[1][2]['select-file'],'1');await manager.tick();assert.equal(manager.list()[0].message,'暂未连接到资源，正在继续寻找');
  await manager.pause(job.id);assert.equal(manager.list()[0].state,'paused');assert.equal(prepared,0);
  await manager.resume(job.id);fs.writeFileSync(path.join(manager.folder(job.id),'raw/media-0001.mkv'),'data');engine.done();await manager.tick();await new Promise(r=>setImmediate(r));
  assert.equal(manager.list()[0].state,'ready');assert.equal(prepared,1);assert.match(manager.captions(job.id).videoUrl,/\/video/);assert.equal(manager.list()[0].magnet,undefined);assert.equal(fs.readFileSync(path.join(manager.folder(job.id),'raw/media-0001.mkv'),'utf8'),'data');
  assert.throws(()=>manager.setSubtitles(job.id,'broken'),/字幕/);assert.deepEqual(manager.captions(job.id).cues,[]);
  manager.setSubtitles(job.id,'1\n00:00:01,000 --> 00:00:02,000\nHello');assert.equal(manager.list()[0].state,'needs-subtitles');
  manager.setSubtitles(job.id,'1\n00:00:01,000 --> 00:00:02,000\nHello\n你好');assert.equal(manager.list()[0].state,'ready');assert.equal(manager.captions(job.id).cues[0].translation,'你好');
 }finally{manager.close();fs.rmSync(directory,{recursive:true,force:true});}
});
test('poll completion cleanup is serialized with pause and resume and never removes the new gid',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'moci-bt-race-'));let downloads=0,complete=false,entered,release;
 const started=new Promise(r=>{entered=r;}),gate=new Promise(r=>{release=r;}),removed=[];
 const engine={start:async()=>{},close:()=>{},rpc:async(method,args)=>{
  if(method==='addUri')return 'meta';if(method==='addTorrent')return 'film'+(++downloads);
  if(method==='tellStatus')return {status:complete?'complete':'active',files:[{index:'1',completedLength:complete?'4':'0'}]};
  if(method==='forceRemove'&&args[0]==='film1'){entered();await gate;}
  if(method==='removeDownloadResult')removed.push(args[0]);return 'OK';
 }};
 const m=createManager({directory,engine,pollMs:60000,prepare:async(_f,_d,{signal})=>new Promise((_r,j)=>{if(signal.aborted)j(new DOMException('paused','AbortError'));else signal.addEventListener('abort',()=>j(new DOMException('paused','AbortError')),{once:true});})});
 try{const j=await m.add(`magnet:?xt=urn:btih:${hash}`);fs.writeFileSync(path.join(m.folder(j.id),hash+'.torrent'),torrent);await m.tick();await m.select(j.id,1);fs.writeFileSync(path.join(m.folder(j.id),'raw/media-0001.mkv'),'data');complete=true;
  const ticking=m.tick();await started;const pausing=m.pause(j.id);release();await ticking;await pausing;complete=false;await m.resume(j.id);
  assert.equal(m.list()[0].state,'downloading');assert.equal(downloads,2);assert.ok(!removed.includes('film2'));
 }finally{m.close();fs.rmSync(directory,{recursive:true,force:true});}
});
test('restart pauses incomplete tasks and corrupt cinema records do not overwrite themselves',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'moci-bt-restart-'));let m=createManager({directory,engine:fake(),pollMs:60000});
 try{const j=await m.add(`magnet:?xt=urn:btih:${hash}`);m.close();m=createManager({directory,engine:fake()});assert.equal(m.list()[0].state,'paused');m.close();fs.writeFileSync(path.join(directory,'jobs.json'),'broken');m=createManager({directory,engine:fake()});assert.match(m.issue(),/无法读取/);await assert.rejects(()=>m.add(`magnet:?xt=urn:btih:${hash}`),/无法读取/);assert.equal(fs.readFileSync(path.join(directory,'jobs.json'),'utf8'),'broken');}finally{m.close();fs.rmSync(directory,{recursive:true,force:true});}
});
test('track selection does not mistake Italian or forced subtitles for full English and simplified Chinese',()=>{
 const streams=[{index:0,codec_type:'audio',tags:{language:'ita'}},{index:1,codec_type:'audio',tags:{language:'eng'}},{index:2,codec_type:'subtitle',codec_name:'subrip',tags:{language:'eng',title:'Forced'}},{index:3,codec_type:'subtitle',codec_name:'subrip',tags:{language:'eng'}},{index:4,codec_type:'subtitle',codec_name:'subrip',tags:{language:'chi',title:'Traditional'}},{index:5,codec_type:'subtitle',codec_name:'subrip',tags:{language:'chi',title:'Simplified'}}];
 const tracks=chooseTracks(streams);assert.equal(tracks.audio.index,1);assert.equal(tracks.english.index,3);assert.equal(tracks.chinese.index,5);
 const en=cuesFromSrt('1\n00:00:01,000 --> 00:00:02,000\nHello'),zh=cuesFromSrt('1\n00:00:01,000 --> 00:00:02,000\n你好');assert.equal(mergeCues(en,zh)[0].translation,'你好');assert.throws(()=>cuesFromSrt('bad'));
});
test('native routes protect mutations and serve owned video byte ranges',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-bt-http-')),file=path.join(dir,'video.mp4');fs.writeFileSync(file,'abcdefgh');let changes=0;
 const manager={issue:()=>'',list:()=>[],add:async()=>{changes++;return{};},captions:id=>{if(id!=='valid')throw Error('not ready');return{};},videoPath:()=>file};
 const app=express();app.use(express.json());install(app,{manager});const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  assert.equal((await fetch(base+'/api/cinema/bt/jobs',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://other.test'},body:'{}'})).status,403);assert.equal(changes,0);
  assert.equal((await fetch(base+'/api/cinema/bt/jobs',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:'{}'})).status,200);assert.equal(changes,1);
  const part=await fetch(base+'/api/cinema/bt/jobs/valid/video',{headers:{Range:'bytes=1-3'}});assert.equal(part.status,206);assert.equal(part.headers.get('Content-Range'),'bytes 1-3/8');assert.equal(await part.text(),'bcd');
  assert.equal((await fetch(base+'/api/cinema/bt/jobs/valid/video',{headers:{Range:'bytes=99-'}})).status,416);assert.equal((await fetch(base+'/api/cinema/bt/jobs/not-ready/video')).status,400);
 }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
