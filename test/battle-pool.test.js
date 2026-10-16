'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{once}=require('node:events');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-battle-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'test.db');
const {app,db}=require('../app/main');
test('battle roster is audited, learned, deduplicated and read-only; unfamiliar and abandoned words stay out',async t=>{
 const server=app.listen(0,'127.0.0.1');await once(server,'listening');t.after(async()=>{server.close();await once(server,'close');db.close();fs.rmSync(dir,{recursive:true,force:true});});
 db.exec("INSERT INTO wordbooks(id,name,is_builtin) VALUES(1,'测试词表',1),(2,'自建词表',0)");
 const meanings=['苹果','桥梁','蜡烛','石头','保护','河流','记忆','旅行','接受','拒绝','信封','复原'];
 const words=['apple','bridge','candle','stone','protect','river','memory','journey','accept','refuse','envelope','recover'];
 const put=db.prepare('INSERT INTO words(id,book_id,word,meaning,pos,source_file,headword) VALUES(?,1,?,?,?, ?,?)');
 for(let i=0;i<12;i++){put.run(i+1,words[i],meanings[i],'n.','cet6.txt',words[i]);db.prepare("INSERT INTO progress(word_id,first_studied,last_review) VALUES(?,datetime('now'),datetime('now'))").run(i+1);db.prepare("INSERT INTO review_log(word_id,correct,outcome) VALUES(?,1,'first_correct')").run(i+1);}
 put.run(20,'unknown','未知','adj.','cet6.txt','unknown');put.run(21,'abandon','放弃','v.','cet6.txt','abandon');db.exec("INSERT INTO progress(word_id,first_studied) VALUES(21,datetime('now')); INSERT INTO review_log(word_id,correct,outcome) VALUES(21,0,'abandoned')");
 const before=db.prepare('SELECT COUNT(*) n FROM review_log').get().n;
 const response=await fetch(`http://127.0.0.1:${server.address().port}/api/adventure/pool`),data=await response.json();
 assert.equal(response.status,200);assert.equal(data.minimum,10);assert.equal(data.words.length,12);assert.ok(data.instanceId);assert.equal(data.words.some(w=>[20,21].includes(w.id)),false);for(const w of data.words){assert.equal(new Set(w.choices).size,4);assert.ok(w.choices.includes(w.meaning));}
 assert.equal(db.prepare('SELECT COUNT(*) n FROM review_log').get().n,before);assert.equal(db.prepare('SELECT COUNT(*) n FROM user_cards').get().n,0);
});
