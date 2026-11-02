'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {validateTheme} = require('../app/desktop-theme');
test('desktop theme only accepts complete palette data or explicit classic reset',()=>{
 const values={accent:'#123456',deep:'#123456',paper:'#fff',ground:'#fff',wash:'#fff',line:'#ddd',ink:'#111',muted:'#666'};
 assert.deepEqual(validateTheme({palette:'andes',values}),{palette:'andes',values});
 assert.equal(validateTheme(null),null);
 assert.equal(validateTheme({palette:'../bad',values}),undefined);
 assert.equal(validateTheme({palette:'andes',values:{...values,paper:'url(evil)'}}),undefined);
 assert.equal(validateTheme({palette:'andes',values:{}}),undefined);
});

const express=require('express');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {install}=require('../app/desktop-theme');
test('theme API rejects external writes and persists valid themes and classic reset',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'moci-theme-'));
 const file=path.join(directory,'theme.json');
 const app=express();app.use(express.json());install(app,{file});
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const post=(theme,source=origin)=>fetch(origin+'/api/desktop/theme',{method:'POST',headers:{Origin:source,'Content-Type':'application/json'},body:JSON.stringify({theme})});
 try{
  assert.equal((await post(null,'http://evil.test')).status,403);
  assert.equal((await post({palette:'../bad'})).status,400);
  const values={accent:'#123456',deep:'#123456',paper:'#fff',ground:'#fff',wash:'#fff',line:'#ddd',ink:'#111',muted:'#666'};
  const theme={palette:'andes',values};
  assert.equal((await post(theme)).status,200);
  assert.deepEqual(await (await fetch(origin+'/api/desktop/theme')).json(),{available:true,theme});
  assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')).theme,theme);
  assert.equal((await post(null)).status,200);
  assert.deepEqual(await (await fetch(origin+'/api/desktop/theme')).json(),{available:true,theme:null});
 }finally{await new Promise(resolve=>server.close(resolve));if(fs.existsSync(file))fs.unlinkSync(file);fs.rmdirSync(directory);}
});
