'use strict';
const crypto=require('node:crypto');
function normalizeMagnet(input){
 if(typeof input!=='string'||input.length>16000)throw Error('请粘贴有效的磁力或迅雷链接');
 let value=input.trim();
 if(/^thunder:\/\//i.test(value)){const code=value.slice(10);if(!/^[a-z0-9+/=]+$/i.test(code))throw Error('迅雷链接编码无效');const decoded=Buffer.from(code,'base64').toString('utf8');if(!decoded.startsWith('AA')||!decoded.endsWith('ZZ'))throw Error('迅雷链接格式无效');value=decoded.slice(2,-2);}
 const u=new URL(value);if(u.protocol!=='magnet:')throw Error('仅支持磁力链接或包含磁力的迅雷链接');
 const xt=u.searchParams.get('xt')||'';if(!/^urn:btih:[a-f0-9]{40}$/i.test(xt)||u.searchParams.getAll('xt').length!==1)throw Error('磁力链接需要有效的 BT v1 校验码');
 for(const [key,val] of u.searchParams){if(!['xt','dn','tr'].includes(key))throw Error('此磁力链接含暂不支持的参数');if(key==='tr'){const t=new URL(val);if(!['udp:','https:','http:'].includes(t.protocol)||t.username||t.password||!t.hostname||/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[)/i.test(t.hostname))throw Error('Tracker 地址无效');}}
 return {uri:value,hash:xt.slice(9).toLowerCase(),name:(u.searchParams.get('dn')||'新影片').slice(0,200)};
}
function parseTorrent(bytes,expectedHash,{allowLocalWebSeeds=false}={}){
 const data=Buffer.from(bytes);if(!data.length||data.length>5*1024*1024)throw Error('种子文件大小无效');
 let at=0,nodes=0,infoBytes;
 function read(depth=0){
  if(depth>16||++nodes>100000||at>=data.length)throw Error('种子结构无效');
  const ch=data[at++];
  if(ch===105){const end=data.indexOf(101,at),s=data.subarray(at,end).toString();if(end<0||! /^-?(0|[1-9]\d*)$/.test(s))throw Error('种子数字无效');at=end+1;const n=Number(s);if(!Number.isSafeInteger(n))throw Error('种子数字过大');return n;}
  if(ch===108||ch===100){const out=ch===108?[]:Object.create(null);while(data[at]!==101){if(ch===108)out.push(read(depth+1));else{const k=read(depth+1);if(!Buffer.isBuffer(k))throw Error('种子键无效');const key=k.toString('utf8');if(Object.hasOwn(out,key))throw Error('种子键重复');const start=at;out[key]=read(depth+1);if(depth===0&&key==='info')infoBytes=data.subarray(start,at);}}at++;return out;}
  if(ch<48||ch>57)throw Error('种子内容无效');at--;const end=data.indexOf(58,at),s=data.subarray(at,end).toString();if(end<0||!/^(0|[1-9]\d*)$/.test(s))throw Error('种子文本长度无效');const size=Number(s);at=end+1;if(!Number.isSafeInteger(size)||at+size>data.length)throw Error('种子文件不完整');const text=data.subarray(at,at+size);at+=size;return text;
 }
 const root=read();if(at!==data.length||!infoBytes||!root.info||typeof root.info!=='object'||Buffer.isBuffer(root.info))throw Error('种子内容不完整');
 const hash=crypto.createHash('sha1').update(infoBytes).digest('hex');if(expectedHash&&hash!==expectedHash.toLowerCase())throw Error('种子校验码不符');
 const info=root.info;
 if(info['symlink path']||info.attr?.toString().includes('l'))throw Error('种子路径类型无效');
 for(const key of ['url-list','httpseeds'])if(root[key])for(const entry of Array.isArray(root[key])?root[key]:[root[key]]){
  if(!Buffer.isBuffer(entry))throw Error('种子下载地址无效');const url=new URL(entry.toString());
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||(!allowLocalWebSeeds&&/^(localhost$|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(url.hostname)))throw Error('种子下载地址无效');
 }
 function segment(v){if(!Buffer.isBuffer(v))throw Error('种子路径无效');let s;try{s=new TextDecoder('utf-8',{fatal:true}).decode(v);}catch{throw Error('种子路径编码无效');}if(!s||s.length>240||/[<>:"/\\|?*\x00-\x1f]/.test(s)||/[. ]$/.test(s)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(s))throw Error('种子路径不安全');return s;}
 const name=segment(info['name.utf-8']||info.name),list=info.files||[{length:info.length,path:[]}];
 if(!Array.isArray(list)||!list.length||list.length>2000)throw Error('种子文件数量无效');
 const seen=new Set();let total=0;
 const files=list.map((f,i)=>{
  if(!f||!Number.isSafeInteger(f.length)||f.length<0||f.length>16*1024**3||f['symlink path']||f.attr?.toString().includes('l'))throw Error('种子文件大小或类型无效');
  const parts=f['path.utf-8']||f.path;if(!Array.isArray(parts)||parts.length>12||(info.files&&!parts.length))throw Error('种子路径无效');
  const relative=[name,...parts.map(segment)].join('/');if(seen.has(relative.toLowerCase()))throw Error('种子路径重复');seen.add(relative.toLowerCase());total+=f.length;
  return {index:i+1,relative,name:relative.split('/').at(-1),bytes:f.length};
 });
 if(total>200*1024**3)throw Error('资源合集过大，请换单季或单集资源');
 return {hash,name,files,videos:files.filter(f=>/\.(mkv|mp4|mov|webm|m4v)$/i.test(f.name)&&f.bytes>0).sort((a,b)=>a.name.localeCompare(b.name,'en',{numeric:true,sensitivity:'base'}))};
}
module.exports={normalizeMagnet,parseTorrent};
