'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createEngine,available}=require('../app/cinema-engine');
test('fresh native engine has peer discovery bootstrap and tracker fallback without global proxy changes',{skip:!available().downloader},async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'moci-engine-')),engine=createEngine(directory);
 try{await engine.start();const options=await engine.rpc('getGlobalOption');
  assert.equal(options['dht-entry-point'],'router.utorrent.com:6881');
  assert.match(options['bt-tracker'],/tracker\.opentrackr\.org:1337/);
  assert.equal(options['bt-tracker-connect-timeout'],'5');
  assert.equal(options['bt-tracker-timeout'],'10');
  assert.equal(options['rpc-listen-all'],'false');
 }finally{engine.close();await new Promise(r=>setTimeout(r,250));fs.rmSync(directory,{recursive:true,force:true});}
});
