'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {normalizeMagnet,parseTorrent}=require('../app/cinema-torrent');
const hash='fb875cba4374f235a2d28ecbe00e4070f66d4b32';
test('normalizes user Thunder wrapping without accepting arbitrary protocols',()=>{
 const magnet=`magnet:?xt=urn:btih:${hash}`;
 assert.equal(normalizeMagnet('thunder://'+Buffer.from('AA'+magnet+'ZZ').toString('base64')).hash,hash);
 assert.equal(normalizeMagnet(magnet+'&dn=Hello').uri,magnet+'&dn=Hello');
 for(const s of ['https://example.com', 'thunder://bad','magnet:?xt=urn:btih:no','magnet:?xt=urn:btih:'+hash+'&xs=file:///secret'])assert.throws(()=>normalizeMagnet(s));
});
function enc(v){if(Buffer.isBuffer(v))return Buffer.concat([Buffer.from(v.length+':'),v]);if(typeof v==='string')return enc(Buffer.from(v));if(typeof v==='number')return Buffer.from('i'+v+'e');if(Array.isArray(v))return Buffer.concat([Buffer.from('l'),...v.map(enc),Buffer.from('e')]);return Buffer.concat([Buffer.from('d'),...Object.keys(v).sort().flatMap(k=>[enc(k),enc(v[k])]),Buffer.from('e')]);}
test('lists video files with stable torrent indices and verifies the raw info hash',()=>{
 const info={name:'Season',files:[{length:100,path:['Episode 1.mkv']},{length:30,path:['readme.txt']}],'piece length':16384,pieces:Buffer.alloc(20)};const data=enc({info});
 const result=parseTorrent(data,crypto.createHash('sha1').update(enc(info)).digest('hex'));
 assert.equal(result.files.length,2);assert.equal(result.videos[0].index,1);assert.equal(result.videos[0].relative,'Season/Episode 1.mkv');
 assert.throws(()=>parseTorrent(data,hash),/校验/);
 for(const name of ['../escape','C:secret','CON','bad\\path','bad/path','file.'])assert.throws(()=>parseTorrent(enc({info:{...info,name}})),/路径/);
 assert.throws(()=>parseTorrent(enc({info:{...info,files:[{length:1,path:['..','x.mkv']}]}})),/路径/);
 assert.throws(()=>parseTorrent(Buffer.from('d4:infoi1ee')));
});
