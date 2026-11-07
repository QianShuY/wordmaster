'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createEngine,available}=require('./cinema-engine');
const {normalizeMagnet,parseTorrent}=require('./cinema-torrent');
const {prepareMedia,cuesFromSrt}=require('./cinema-media');
function createManager({directory,engine=createEngine(path.join(directory,'engine')),prepare=prepareMedia,allowLocalWebSeeds=false,pollMs=1200,metadataDirectory=path.join(__dirname,'cinema-sources')}={}){
 const index=path.join(directory,'jobs.json'),jobs=new Map(),controllers=new Map(),actions=new Set();let timer,checking=false,closed=false,loadError='';
 const root=path.resolve(directory);
 function folder(id){if(!/^[0-9a-f-]{36}$/.test(id))throw Error('影片编号无效');const result=path.resolve(root,id);if(path.dirname(result)!==root)throw Error('下载目录无效');return result;}
 const readyDir=id=>path.join(folder(id),'ready');
 const storageName=file=>`media-${String(file.index).padStart(4,'0')}${path.extname(file.name).toLowerCase().slice(0,16)}`;
 function save(){if(loadError)throw Error(loadError);fs.mkdirSync(root,{recursive:true});fs.writeFileSync(index+'.tmp',JSON.stringify([...jobs.values()]));fs.renameSync(index+'.tmp',index);}
 try{if(fs.existsSync(index)){const rows=JSON.parse(fs.readFileSync(index,'utf8'));if(!Array.isArray(rows)||rows.length>500)throw Error('Invalid records');for(const row of rows){folder(row.id);normalizeMagnet(row.magnet);if(!['resolving','selecting','downloading','waiting','processing','queued','ready','needs-subtitles','paused','error'].includes(row.state))throw Error('Invalid state');if(['resolving','downloading','waiting','processing','queued'].includes(row.state)){row.state='paused';row.message='上次任务已暂停，点击继续';}delete row.gid;jobs.set(row.id,row);}}}catch{jobs.clear();loadError='影片下载记录无法读取，原文件已保留；其他学习功能不受影响。';}
 function view(job){return {id:job.id,title:job.title,state:job.state,message:job.message||'',bytes:job.bytes||0,received:job.received||0,speed:job.speed||0,connections:job.connections||0,progress:job.progress||0,files:job.files||[],selected:job.selected,updated:job.updated,bilingual:!!job.bilingual};}
 function list(){return [...jobs.values()].map(view).reverse();}
 function get(id){const job=jobs.get(id);if(!job)throw Error('找不到这项下载');return job;}
 function change(job,values){Object.assign(job,values,{updated:Date.now()});save();}
 function torrentPath(job){return path.join(folder(job.id),job.hash+'.torrent');}
 async function status(job){return engine.rpc('tellStatus',[job.gid,['status','files','downloadSpeed','connections','errorMessage','completedLength']]);}
 async function removeGid(job){const gid=job.gid;if(gid){delete job.gid;await engine.rpc('forceRemove',[gid]).catch(()=>{});await engine.rpc('removeDownloadResult',[gid]).catch(()=>{});}}
 function startTimer(){if(!timer){timer=setInterval(()=>void tick(),pollMs);timer.unref();}}
 function loadMetadata(job){const file=torrentPath(job);if(!fs.existsSync(file))return false;const meta=parseTorrent(fs.readFileSync(file),job.hash,{allowLocalWebSeeds});if(!meta.videos.length)throw Error('资源里没有支持的视频文件');job.files=meta.videos;job.allFiles=meta.files;change(job,{state:'selecting',message:'请选择要下载的一集',speed:0});return true;}
 async function add(input,title){
  if(loadError)throw Error(loadError);if(closed)throw Error('下载服务已关闭');if(jobs.size>=100)throw Error('下载列表已满，请先清理旧影片');
  const magnet=normalizeMagnet(input);const pending=[...jobs.values()].find(j=>j.hash===magnet.hash&&!['ready','needs-subtitles','error'].includes(j.state));if(pending)return view(pending);
  const job={id:crypto.randomUUID(),hash:magnet.hash,magnet:magnet.uri,title:typeof title==='string'&&title.trim()?title.trim().slice(0,200):magnet.name,state:'resolving',updated:Date.now(),received:0};job.seriesTitle=job.title;
  fs.mkdirSync(folder(job.id),{recursive:true});jobs.set(job.id,job);save();
  const bundled=path.join(metadataDirectory,job.hash+'.torrent');
  if(fs.existsSync(bundled)){try{parseTorrent(fs.readFileSync(bundled),job.hash);fs.copyFileSync(bundled,torrentPath(job));loadMetadata(job);return view(job);}catch(e){change(job,{state:'error',message:e.message});return view(job);}}
  const cached=[...jobs.values()].find(j=>j.id!==job.id&&j.hash===job.hash&&fs.existsSync(torrentPath(j)));
  if(cached){fs.copyFileSync(torrentPath(cached),torrentPath(job));try{loadMetadata(job);return view(job);}catch(e){change(job,{state:'error',message:e.message});return view(job);}}
  await guarded(resume)(job.id);return view(job);
 }
 async function resume(id){const job=get(id);if(['ready','needs-subtitles','processing'].includes(job.state)||(['selecting','downloading','waiting','resolving'].includes(job.state)&&job.gid))return view(job);
  try{await engine.start();
   if(fs.existsSync(torrentPath(job))){const meta=parseTorrent(fs.readFileSync(torrentPath(job)),job.hash,{allowLocalWebSeeds});job.files=meta.videos;job.allFiles=meta.files;
    if(!job.selected){change(job,{state:'selecting',message:'请选择要下载的一集'});return view(job);}
    const file=meta.videos.find(f=>f.index===job.selected);if(!file)throw Error('之前选择的影片已不存在');
    const raw=path.join(folder(id),'raw');fs.mkdirSync(raw,{recursive:true});
    job.gid=await engine.rpc('addTorrent',[fs.readFileSync(torrentPath(job)).toString('base64'),[],{dir:raw,'index-out':meta.files.map(f=>`${f.index}=${storageName(f)}`),'select-file':String(file.index),'seed-time':'0','file-allocation':'none','auto-file-renaming':'false','allow-overwrite':'false','check-integrity':'true'}]);
    change(job,{state:'downloading',bytes:file.bytes,message:'正在连接资源'});
   }else{
    job.gid=await engine.rpc('addUri',[[job.magnet],{dir:folder(id),'bt-metadata-only':'true','bt-save-metadata':'true','follow-torrent':'false','seed-time':'0'}]);change(job,{state:'resolving',message:'正在读取剧集列表；资源稀少时可能需要等待'});
   }startTimer();
  }catch(e){change(job,{state:'error',message:e.message});}return view(job);
 }
 async function select(id,index){const job=get(id);if(!['selecting','paused','error'].includes(job.state))throw Error('请先暂停当前任务');const file=job.files?.find(f=>f.index===Number(index));if(!file)throw Error('请选择列表中的视频');job.selected=file.index;const episode=file.name.match(/S\d+E(\d+)/i);job.title=episode&&job.seriesTitle?`${job.seriesTitle} · 第 ${Number(episode[1])} 集`:file.name;job.received=0;job.bytes=file.bytes;job.state='paused';await removeGid(job);return resume(id);}
 async function pause(id){const job=get(id);if(['ready','needs-subtitles','selecting'].includes(job.state))return view(job);change(job,{state:'paused',speed:0,message:'已暂停，文件和下载进度保留'});controllers.get(id)?.abort();await removeGid(job);save();return view(job);}
 function inputFile(job){const item=job.files?.find(f=>f.index===job.selected);if(!item)throw Error('尚未选择影片');const base=fs.realpathSync(path.join(folder(job.id),'raw')),file=fs.realpathSync(path.join(base,storageName(item)));if(!file.startsWith(base+path.sep))throw Error('影片路径超出下载目录');return file;}
 function processJob(job){if(controllers.size||closed)return;const controller=new AbortController();controllers.set(job.id,controller);change(job,{state:'processing',progress:0,message:'正在检查音轨与字幕'});
  void (async()=>{try{fs.mkdirSync(readyDir(job.id),{recursive:true});const result=await prepare(inputFile(job),readyDir(job.id),{signal:controller.signal,onProgress:p=>{if(!closed&&!controller.signal.aborted)change(job,p);}});if(!closed&&!controller.signal.aborted)change(job,{state:result.bilingual?'ready':'needs-subtitles',bilingual:result.bilingual,progress:1,message:result.message});}catch(e){if(!closed&&!controller.signal.aborted)change(job,{state:'error',message:e.message});}finally{controllers.delete(job.id);}})();
 }
 async function tick(){if(checking||closed)return;checking=true;try{for(const job of jobs.values()){
   if(actions.has(job.id))continue;
   if(job.state==='queued'){processJob(job);continue;}
   if(!job.gid||!['resolving','downloading','waiting'].includes(job.state))continue;
   actions.add(job.id);
   try{
    const gid=job.gid,current=await status(job);if(job.gid!==gid||!['resolving','downloading','waiting'].includes(job.state))continue;job.connections=Number(current.connections)||0;job.speed=Number(current.downloadSpeed)||0;
    if(job.state==='resolving'&&fs.existsSync(torrentPath(job))){await removeGid(job);if(job.state==='resolving')loadMetadata(job);continue;}
    if(current.status==='error'||current.status==='removed'){await removeGid(job);change(job,{state:'error',speed:0,message:current.errorMessage||'资源下载中断，可以重试'});continue;}
    if(['downloading','waiting'].includes(job.state)){
     const f=current.files?.find(f=>Number(f.index)===job.selected);job.received=Number(f?.completedLength)||0;
     if(current.status==='complete'){
      const selected=job.files.find(f=>f.index===job.selected);if(job.received!==selected.bytes)throw Error('影片下载尚未完整');const file=inputFile(job);if(fs.statSync(file).size!==selected.bytes)throw Error('影片文件大小不符');await removeGid(job);if(!['downloading','waiting'].includes(job.state))continue;change(job,{state:'queued',speed:0,message:'下载完成，等待整理'});processJob(job);continue;
     }
     job.state=current.status==='waiting'?'waiting':'downloading';
     job.message=job.state==='waiting'?'正在排队，前面的下载结束或暂停后开始':job.received>=job.bytes?'文件已接收，正在校验':job.speed>0?(job.received===0?'正在接收首个分块，校验完成后更新进度':'正在下载所选影片'):job.connections?'已连接资源，等待传输数据':'暂未连接到资源，正在继续寻找';
    }job.updated=Date.now();save();
   }catch(e){await removeGid(job);change(job,{state:'error',speed:0,message:e.message});}finally{actions.delete(job.id);}
  }}finally{checking=false;}}
 async function erase(id){const job=get(id);if(['resolving','downloading','waiting','processing','queued'].includes(job.state)||controllers.has(id))throw Error('请先暂停并等待处理停止，再删除');await removeGid(job);const dir=folder(id);fs.rmSync(dir,{recursive:true,force:true});jobs.delete(id);save();}
 function captions(id){const job=get(id);if(!['ready','needs-subtitles'].includes(job.state))throw Error('影片尚未准备好');const file=path.join(readyDir(id),'captions.json');return {id,title:job.title,cues:JSON.parse(fs.readFileSync(file,'utf8')),videoUrl:`/api/cinema/bt/jobs/${id}/video?v=${job.updated}`,videoKey:'desktop-bt:'+id,bilingual:job.bilingual};}
 function setSubtitles(id,raw){const job=get(id);if(!['ready','needs-subtitles','error'].includes(job.state)||!fs.existsSync(path.join(readyDir(id),'playback.mp4')))throw Error('请先完成影片下载和音轨整理');if(typeof raw!=='string'||Buffer.byteLength(raw)>2*1024*1024)throw Error('字幕文件过大');const cues=cuesFromSrt(raw);fs.writeFileSync(path.join(readyDir(id),'captions.json'),JSON.stringify(cues));const bilingual=cues.some(c=>c.text)&&cues.some(c=>c.translation);change(job,{state:bilingual?'ready':'needs-subtitles',bilingual,message:bilingual?'双语字幕已添加':'字幕已添加，可以观看；可继续补充双语字幕'});return view(job);}
 function videoPath(id){get(id);return path.join(readyDir(id),'playback.mp4');}
 function close(){closed=true;clearInterval(timer);for(const c of controllers.values())c.abort();for(const job of jobs.values())if(['resolving','downloading','waiting','processing','queued'].includes(job.state))Object.assign(job,{state:'paused',speed:0,message:'已随软件关闭而暂停'});if(jobs.size)save();engine.close();}
 const guarded=fn=>async(id,...args)=>{while(actions.has(id)){if(closed)throw Error('下载服务已关闭');await new Promise(r=>setTimeout(r,20));}if(closed)throw Error('下载服务已关闭');actions.add(id);try{return await fn(id,...args);}finally{actions.delete(id);}};
 return {list,add,resume:guarded(resume),select:guarded(select),pause:guarded(pause),erase:guarded(erase),tick,captions,setSubtitles,videoPath,close,folder,issue:()=>loadError};
}
function install(app,{directory=process.env.WORDMASTER_CINEMA_DIR||path.join(path.dirname(path.resolve(process.env.WORDMASTER_DB_PATH||path.join(__dirname,'../data/wordmaster.db'))),'cinema-bt'),manager=createManager({directory})}={}){
 const express=require('express');
 app.use('/api/cinema/bt',(req,res,next)=>{const host=new URL('http://'+req.get('host')).hostname;if(!['127.0.0.1','localhost','[::1]'].includes(host))return res.sendStatus(403);if(req.method!=='GET'&&req.method!=='HEAD'&&req.get('origin')!==`${req.protocol}://${req.get('host')}`)return res.sendStatus(403);res.set('Cache-Control','no-store');next();});
 const wrap=fn=>(req,res)=>Promise.resolve().then(()=>fn(req,res)).catch(e=>res.status(400).json({error:e.message}));
 app.get('/api/cinema/bt',(_req,res)=>res.json({available:available(),jobs:manager.list(),issue:manager.issue()}));
 app.post('/api/cinema/bt/jobs',wrap(async(req,res)=>res.json(await manager.add(req.body?.magnet,req.body?.title))));
 app.post('/api/cinema/bt/jobs/:id/select',wrap(async(req,res)=>res.json(await manager.select(req.params.id,req.body?.index))));
 for(const method of ['pause','resume'])app.post(`/api/cinema/bt/jobs/:id/${method}`,wrap(async(req,res)=>res.json(await manager[method](req.params.id))));
 app.delete('/api/cinema/bt/jobs/:id',wrap(async(req,res)=>{await manager.erase(req.params.id);res.json({ok:true});}));
 app.get('/api/cinema/bt/jobs/:id/play',wrap((req,res)=>res.json(manager.captions(req.params.id))));
 app.post('/api/cinema/bt/jobs/:id/subtitles',express.text({type:'text/plain',limit:'2mb'}),wrap((req,res)=>res.json(manager.setSubtitles(req.params.id,req.body))));
 app.get('/api/cinema/bt/jobs/:id/video',wrap((req,res)=>{
  manager.captions(req.params.id);const file=manager.videoPath(req.params.id),size=fs.statSync(file).size;let start=0,end=size-1;
  if(req.headers.range){const m=req.headers.range.match(/^bytes=(\d*)-(\d*)$/);if(!m||(!m[1]&&!m[2]))return res.status(416).set('Content-Range',`bytes */${size}`).end();if(m[1]){start=Number(m[1]);if(m[2])end=Math.min(Number(m[2]),end);}else start=Math.max(0,size-Number(m[2]));if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start)return res.status(416).set('Content-Range',`bytes */${size}`).end();res.status(206).set('Content-Range',`bytes ${start}-${end}/${size}`);}
  res.set({'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':String(end-start+1)});if(req.method==='HEAD')return res.end();const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }));return manager;
}
module.exports={createManager,install};
