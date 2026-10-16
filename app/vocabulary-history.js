'use strict';
const {createHash}=require('node:crypto'),Policy=require('../shared/answer-policy');
const contentHash=w=>createHash('sha256').update(JSON.stringify([w.word,w.headword,w.pos,w.meaning,w.phonetic,w.example,w.example_translation,w.source_file,w.source_line,w.source_raw])).digest('hex');
function create(db){
 const history=db.prepare('SELECT * FROM book_history WHERE book_id=?'),any=db.prepare('SELECT 1 FROM book_history LIMIT 1'),anyPolicy=db.prepare('SELECT 1 FROM word_answer_policies LIMIT 1');
 const wordBook=db.prepare('SELECT book_id FROM words WHERE id=?');
 const isHistory=id=>Number.isSafeInteger(Number(id))&&Number(id)>0&&Boolean(history.get(Number(id)));
 function guard(req,res,next){
  if(!any.get())return next();
  const path=req.path,mutating=!['GET','HEAD','OPTIONS'].includes(req.method);
  const bookMatch=path.match(/^\/api\/(?:desktop\/)?books\/(\d+)(?:\/|$)/);
  const wordMatch=path.match(/^\/api\/(?:words|mistakes)\/(\d+)(?:\/|$)/);
  const bookIds=[bookMatch?.[1],req.body?.book_id,req.query?.book_id];
  for(const wordId of [wordMatch?.[1],req.body?.word_id])if(Number.isSafeInteger(Number(wordId)))bookIds.push(wordBook.get(Number(wordId))?.book_id);
  const learning=/\/(?:study|today|choices)$/.test(path);
  if(bookIds.some(isHistory)&&(mutating||learning))return res.status(403).json({error:'这本词库已保留为历史只读资料，请使用替换后的词库继续学习。',code:'HISTORICAL_BOOK_READONLY'});
  next();
 }
 function policies(words){
  if(!words.length||!anyPolicy.get())return words;
  const bindings=new Map();
  for(let i=0;i<words.length;i+=200){const ids=words.slice(i,i+200).map(w=>w.id),rows=db.prepare(`SELECT * FROM word_answer_policies WHERE word_id IN (${ids.map(()=>'?').join(',')})`).all(...ids);for(const r of rows)bindings.set(r.word_id,r);}
  return words.map(w=>{
   const row=bindings.get(w.id);if(!row||row.content_sha256!==contentHash(w))return w;
   try{const p=JSON.parse(row.policy_json),checked=Policy.bound(p,w.headword||w.word);
    if(!checked)return w;
    return {...w,answer_policy:checked};
   }catch{return w;}
  });
 }
 return {guard,isHistory,policies};
}
module.exports={create,contentHash};
