'use strict';
const path=require('node:path'),fs=require('node:fs'),{createHash}=require('node:crypto');
const express=require('express');
function text(value,max){return typeof value==='string'?value.trim().slice(0,max):'';}
function decode(entry){
 if(!entry||typeof entry!=='object')throw Error('单词格式不正确');
 const word=text(entry.word,81).normalize('NFKC').toLowerCase().replaceAll('’',"'");
 if(word.length>80||!/^[a-z]+(?:[ '-][a-z]+)*$/.test(word))throw Error('单词需为英文单词或短语，最多 80 字符');
 const meaning=text(entry.translation,2001);
 if(!meaning||meaning.length>2000)throw Error('请先补充有效释义，再收进墨词');
 const input=entry.source||{},source={};
 for(const [key,max] of [['examId',150],['examTitle',200],['sectionType',40],['questionId',150],['sentence',1000]]){
  const value=text(input[key],max);if(value)source[key]=value;
 }
 return {word,meaning,phonetic:text(entry.phonetic,120),pos:text(entry.pos,40),source};
}
function create(db){
 // Viewing training and starting WordMaster must not change learner state or
 // the protected content-upgrade snapshot. Create metadata with the first save.
 function initialize(){db.exec(`CREATE TABLE IF NOT EXISTS desktop_training_config(id INTEGER PRIMARY KEY CHECK(id=1),book_id INTEGER REFERENCES wordbooks(id) ON DELETE SET NULL);
 CREATE TABLE IF NOT EXISTS desktop_training_sources(word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,source_key TEXT NOT NULL,source_json TEXT NOT NULL,collected_at TEXT NOT NULL DEFAULT(datetime('now','localtime')),PRIMARY KEY(word_id,source_key));`);}
 function summary(){
  if(!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='desktop_training_config'").get())return null;
  return db.prepare(`SELECT b.id,b.name,(SELECT count(*) FROM words w WHERE w.book_id=b.id) count FROM desktop_training_config c JOIN wordbooks b ON b.id=c.book_id WHERE c.id=1 AND b.is_builtin=0`).get()||null;
 }
 function collect(entries){
  if(!Array.isArray(entries)||!entries.length||entries.length>200)throw Error('每次请选择 1 至 200 个生词');
  const words=entries.map(decode);let added=0;const items=[];
  db.exec('BEGIN IMMEDIATE');
  try{
   initialize();
   let book=summary();
   if(!book){
    const id=Number(db.prepare('INSERT INTO wordbooks(name,description,is_builtin) VALUES(?,?,0)').run('训练生词','在英语训练中主动收集的词。选择此词袋后才安排学习；收词不会自动计入已学或今日复习。').lastInsertRowid);
    db.prepare('INSERT INTO desktop_training_config(id,book_id) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET book_id=excluded.book_id').run(id);book={id};
   }
   for(const w of words){
    let word=db.prepare('SELECT id FROM words WHERE book_id=? AND lower(trim(word))=?').get(book.id,w.word),created=false;
    if(!word){
     word={id:Number(db.prepare('INSERT INTO words(book_id,word,meaning,phonetic,pos,example,source_file,source_raw) VALUES(?,?,?,?,?,?,?,?)').run(book.id,w.word,w.meaning,w.phonetic,w.pos,w.source.sentence||'','practice:'+(w.source.examId||'notebook'),JSON.stringify(w.source)).lastInsertRowid)};
     created=true;added++;
    }
    const source=JSON.stringify(w.source),key=createHash('sha256').update(source).digest('hex');
    db.prepare('INSERT OR IGNORE INTO desktop_training_sources(word_id,source_key,source_json) VALUES(?,?,?)').run(word.id,key,source);
    items.push({word:w.word,id:word.id,created});
   }
   const result={added,existing:words.length-added,book:summary(),items};db.exec('COMMIT');return result;
  }catch(error){db.exec('ROLLBACK');throw error;}
 }
 return {summary,collect};
}
function install(app,db,{directory=path.join(__dirname,'../static/practice')}={}){
 const store=create(db),available=()=>fs.existsSync(path.join(directory,'index.html'));
 app.get('/api/desktop/training',(_req,res)=>res.set('Cache-Control','no-store').json({available:available(),url:'/practice/',vocabulary:store.summary()}));
 app.get('/api/desktop/training/dictionary',(req,res)=>{
  const word=text(req.query.word,81).normalize('NFKC').toLowerCase();
  const row=/^[a-z]+(?:[ '-][a-z]+)*$/.test(word)&&word.length<=80?db.prepare(`SELECT w.*,b.name book_name FROM words w JOIN wordbooks b ON b.id=w.book_id
   WHERE (lower(w.word)=? OR lower(w.headword)=?) AND NOT EXISTS(SELECT 1 FROM book_history h WHERE h.book_id=b.id)
   ORDER BY b.is_builtin DESC,w.id LIMIT 1`).get(word,word):null;
  res.set('Cache-Control','no-store').json({entry:row?{word:row.headword||row.word,translation:row.meaning,phonetic:row.phonetic,pos:row.pos,tag:'墨词 · '+row.book_name}:null});
 });
 app.post('/api/desktop/training/vocabulary',(req,res)=>{
  if(req.get('origin')!==`${req.protocol}://${req.get('host')}`)return res.sendStatus(403);
  try{res.set('Cache-Control','no-store').json(store.collect(req.body?.entries));}
  catch(error){res.status(400).json({error:error.message});}
 });
 app.get(/^\/practice$/,(_req,res)=>res.redirect(308,'/practice/'));
 app.use('/practice',(req,res,next)=>{
  if(available())return next();
  res.status(503).type('html').send('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>墨词 · 英语训练</title><body style="font:18px/1.8 Georgia,serif;background:#f5f1e8;color:#304e40;padding:10vh 10vw"><h1>训练书房，正在整理。</h1><p>此安装目录尚未包含英语训练资源，请先运行接入构建。</p><a href="/#/">返回墨词</a></body></html>');
 },express.static(directory,{index:'index.html',setHeaders(res,file){if(file.endsWith('index.html'))res.set('Cache-Control','no-cache');}}),(_req,res)=>res.sendStatus(404));
 return store;
}
module.exports={decode,create,install};
