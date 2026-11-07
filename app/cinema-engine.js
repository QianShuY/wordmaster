'use strict';
const fs=require('node:fs'),path=require('node:path'),net=require('node:net'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const nativeRoot=path.join(__dirname,'../runtime/cinema');
function binary(name){return path.join(nativeRoot,process.platform==='win32'?name+'.exe':name);}
function available(){return {downloader:fs.existsSync(binary('aria2c')),processor:fs.existsSync(binary('ffmpeg'))&&fs.existsSync(binary('ffprobe'))};}
async function freePort(){const s=net.createServer();await new Promise((r,j)=>s.once('error',j).listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
function createEngine(directory){
 let child,startPromise,port,secret,closed=false;
 async function rpc(method,params=[]){if(!port||!child)throw Error('下载组件未启动');const r=await fetch(`http://127.0.0.1:${port}/jsonrpc`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:crypto.randomUUID(),method:'aria2.'+method,params:['token:'+secret,...params]}),signal:AbortSignal.timeout(6000)});const body=await r.json();if(body.error)throw Error(body.error.message||'下载组件请求失败');return body.result;}
 async function start(){
  if(closed)throw Error('下载服务已关闭');if(startPromise)return startPromise;
  startPromise=(async()=>{if(!available().downloader)throw Error('此桌面版本缺少下载组件，请安装完整版本');fs.mkdirSync(directory,{recursive:true});port=await freePort();secret=crypto.randomBytes(32).toString('hex');
   child=spawn(binary('aria2c'),['--no-conf=true','--no-netrc=true','--enable-rpc=true','--rpc-listen-all=false',`--rpc-listen-port=${port}`,`--rpc-secret=${secret}`,'--rpc-allow-origin-all=false',`--stop-with-process=${process.pid}`,'--enable-dht=true','--enable-dht6=false','--dht-entry-point=router.utorrent.com:6881','--bt-tracker=udp://tracker.opentrackr.org:1337/announce,udp://tracker.torrent.eu.org:451/announce','--bt-tracker-connect-timeout=5','--bt-tracker-timeout=10',`--dht-file-path=${path.join(directory,'dht.dat')}`,'--bt-enable-lpd=false','--seed-time=0','--max-overall-upload-limit=16K','--max-concurrent-downloads=1','--file-allocation=none','--auto-save-interval=5','--max-download-result=100','--console-log-level=error','--summary-interval=0'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
   let failed;child.once('error',e=>{failed=e;});child.once('exit',()=>{startPromise=null;});child.stderr.on('data',()=>{});
   for(let i=0;i<40;i++){if(failed||child.exitCode!==null)throw Error('下载组件启动失败');try{await rpc('getVersion');return;}catch{await new Promise(r=>setTimeout(r,100));}}
   child.kill();throw Error('下载组件启动超时');
  })().catch(e=>{startPromise=null;throw e;});return startPromise;
 }
 function close(){closed=true;child?.kill();}
 return {start,rpc,close};
}
module.exports={createEngine,binary,available};
