'use strict';
const Domain=require('../shared/domain');
function createCampaign(db,planFor){
 const day=()=>db.prepare("SELECT date('now','localtime') day").get().day;
 function eligibility(book){
  const today=day(),plan=planFor(book);
  const fresh=db.prepare('SELECT w.* FROM words w JOIN progress p ON p.word_id=w.id WHERE w.book_id=? AND date(p.first_studied)=?').all(book.id,today);
  const due=db.prepare("SELECT COUNT(*) n FROM progress p JOIN words w ON w.id=p.word_id WHERE w.book_id=? AND p.next_due<=datetime('now','localtime')").get(book.id).n;
  const logs=db.prepare('SELECT l.* FROM review_log l JOIN words w ON w.id=l.word_id WHERE w.book_id=? AND date(l.ts)=? ORDER BY l.id').all(book.id,today);
  const good=l=>l.correct===1&&(l.outcome===null||['first_correct','retry_correct'].includes(l.outcome));
  const successes=logs.filter(good),last=new Map();
  for(const log of logs)if(['spelling','meaning'].includes(log.practice_mode))last.set(log.word_id,log);
  const quota=Math.min(plan.daily_quota,fresh.length+plan.remaining_new);
  const pending=fresh.filter(w=>!successes.some(l=>l.word_id===w.id&&l.practice_mode==='meaning')||(Domain.isSpellableWord(w.headword||w.word)&&!successes.some(l=>l.word_id===w.id&&l.practice_mode==='spelling'))).length;
  const unresolved=[...last.values()].filter(l=>!good(l)).length;
  const recallPending=db.prepare("SELECT COUNT(*) n FROM recall_cycles c JOIN words w ON w.id=c.word_id WHERE w.book_id=? AND json_extract(c.state_json,'$.complete')=0").get(book.id).n;
  const ready=recallPending===0&&successes.length>0&&due===0&&fresh.length>=quota&&pending===0&&unresolved===0;
  return {id:book.id,name:book.name,ready,newDone:fresh.length,newTarget:quota,pending,due,unresolved,recallPending,reason:recallPending?'旧词还需完成词义与拼写回忆':ready?'今日计划已完成，可通过一关':!successes.length?'先完成今天的学习计划':pending?'新词还需完成选择与拼写巩固':due?'还有到期复习待完成':unresolved?'还有待强化的词需要回忆':'今日新词安排尚未完成'};
 }
 function state(){const days=db.prepare('SELECT day,stage_no,book_id,book_name FROM adventure_days ORDER BY stage_no').all(),today=day();return {today,completed:days.length,current:Math.min(14,days.length+1),todayCleared:days.some(d=>d.day===today),bossAvailable:days.length>=13&&days.at(-1).day<today,days,books:db.prepare('SELECT * FROM wordbooks b WHERE NOT EXISTS(SELECT 1 FROM book_history h WHERE h.book_id=b.id) ORDER BY is_builtin DESC,id').all().map(eligibility)};}
 function claim(bookId){
  db.exec('BEGIN IMMEDIATE');try{
   const today=day(),prior=db.prepare('SELECT * FROM adventure_days WHERE day=?').get(today);
   if(prior){db.exec('COMMIT');return {ok:true,duplicate:true,stage:prior.stage_no};}
   const count=db.prepare('SELECT COUNT(*) n FROM adventure_days').get().n;
   if(count>=13){db.exec('COMMIT');return {ok:false,reason:'普通旅程已完成，下一站是雾桥守卫'};}
   const book=db.prepare('SELECT * FROM wordbooks WHERE id=?').get(bookId);
   if(db.prepare('SELECT 1 FROM book_history WHERE book_id=?').get(bookId)){db.exec('COMMIT');return {ok:false,reason:'历史词库只读，请选择当前词库'};}
   if(!book){db.exec('COMMIT');return {ok:false,reason:'请先选择学习词库'};}
   const check=eligibility(book);if(!check.ready){db.exec('COMMIT');return {ok:false,reason:check.reason};}
   db.prepare('INSERT INTO adventure_days(day,stage_no,book_id,book_name) VALUES(?,?,?,?)').run(today,count+1,book.id,book.name);db.exec('COMMIT');return {ok:true,duplicate:false,stage:count+1};
  }catch(e){try{db.exec('ROLLBACK');}catch{}throw e;}
 }
 return {state,claim};
}
module.exports={createCampaign};
