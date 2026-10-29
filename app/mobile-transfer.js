'use strict';
const {createHash}=require('node:crypto');
const V=require('./vocabulary'),{unfinishedWords}=require('./unfinished-learning');
function mobileExport(db){
 db.exec('BEGIN');
 try{
  const identity=db.prepare('SELECT instance_id FROM desktop_database_identity WHERE id=1').get().instance_id;
  const history=new Set(db.prepare('SELECT book_id FROM book_history').all().map(b=>b.book_id));
  const books=db.prepare('SELECT * FROM wordbooks ORDER BY id').all().map(b=>{
   const spec=b.is_builtin?V.CONTENT_CATALOG.find(s=>s.name===b.name):null,code=spec?.file==='gaokao-preview.json'?'gaokao':spec?.file?.replace('.txt','');
   return {key:code?'builtin:'+code:`desktop:${identity}:book:${b.id}`,originalId:b.id,name:b.name,description:b.description||'',is_builtin:b.is_builtin,daily_new:b.daily_new,plan_active:b.plan_active,target_date:b.target_date,archived:history.has(b.id)?1:0};
  });
  const byBook=new Map(books.map(b=>[b.originalId,b])),key=id=>`desktop:${identity}:word:${id}`;
  const records=require('./vocabulary-history').create(db).policies(db.prepare('SELECT * FROM words ORDER BY id').all());
  const words=records.map(w=>({key:key(w.id),book_key:byBook.get(w.book_id).key,word:w.word,headword:w.headword,homograph:w.homograph,phonetic:w.phonetic||'',pos:w.pos||'',meaning:w.meaning,example:w.example||'',example_translation:w.example_translation||'',policy_json:w.answer_policy?JSON.stringify(w.answer_policy):'',source_file:w.source_file,source_line:w.source_line,source_raw:w.source_raw}));
  const progress=db.prepare('SELECT * FROM progress ORDER BY word_id').all().map(p=>({word_key:key(p.word_id),correct:p.correct,wrong:p.wrong,streak:p.streak,review_level:p.review_level,last_review:p.last_review,next_due:p.next_due,first_studied:p.first_studied}));
  const events=db.prepare('SELECT * FROM review_log ORDER BY id').all().map(l=>({event_id:`desktop:${identity}:event:${l.request_id||l.id}`,word_key:key(l.word_id),correct:l.correct,is_new:l.is_new,ts:l.ts,local_day:l.ts.slice(0,10),timezone_id:Intl.DateTimeFormat().resolvedOptions().timeZone,mode:l.practice_mode||'legacy',outcome:l.outcome||(l.correct?'first_correct':'wrong'),session_id:l.session_id||'legacy-desktop',payload:l.request_payload||''}));
  const pending=books.filter(b=>!b.archived).flatMap(b=>unfinishedWords(db,b.originalId).map(w=>{const saved=db.prepare('SELECT state_json FROM recall_cycles WHERE word_id=?').get(w.id);return {book_key:b.key,word_key:key(w.id),state:saved?JSON.parse(saved.state_json):null,meaning_passed:!!w.meaning_passed};}));
  const collected=db.prepare('SELECT c.palette,u.earned_at FROM user_cards u JOIN cards c ON c.id=u.card_id').all();
  const draws=db.prepare('SELECT d.day,d.created_at,c.palette FROM card_draws d LEFT JOIN cards c ON c.id=d.card_id').all();
  const payload=JSON.stringify({kind:'desktop',schema:1,createdAt:new Date().toISOString(),identity,books,words,progress,events,pending,collected,draws});
  return JSON.stringify({format:'moci-transfer',version:1,sha256:createHash('sha256').update(payload).digest('hex'),payload});
 }finally{db.exec('ROLLBACK');}
}
module.exports={mobileExport};
