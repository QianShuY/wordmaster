'use strict';
const Domain=require('../shared/domain');
const {unfinishedWords}=require('./unfinished-learning');
const ordinal=day=>Date.parse(day+'T00:00:00Z')/86400000;
const addDays=(day,n)=>new Date((ordinal(day)+n)*86400000).toISOString().slice(0,10);

// Balance the current backlog against the next two days' known due dates.
// Future words are never brought forward; this is task allocation, not a change
// to the forgetting curve or to recorded mastery.
function distribute(due,future,days=3){
 const baseline=Array.from({length:days},(_,i)=>i?Math.max(0,future[i]||0):0);
 let low=0,high=due+Math.max(0,...baseline);
 while(low<high){const mid=Math.floor((low+high)/2);if(baseline.reduce((sum,n)=>sum+Math.max(0,mid-n),0)>=due)high=mid;else low=mid+1;}
 let remaining=due;return baseline.map(n=>{const share=Math.min(remaining,Math.max(0,low-n));remaining-=share;return share;});
}
function createDailyWorkload(db){
 const clock=()=>db.prepare("SELECT date('now','localtime') day,datetime('now','localtime') now").get();
 const saved=(id,day=clock().day)=>db.prepare('SELECT * FROM desktop_daily_workload WHERE book_id=? AND day=?').get(id,day);
 function candidates(bookId,now){
  const pending=unfinishedWords(db,bookId),ids=new Set(pending.map(w=>w.id));
  const rows=db.prepare(`SELECT w.*,p.wrong,p.streak,p.review_level,p.last_review,p.next_due,p.first_studied,0 is_new
   FROM words w JOIN progress p ON p.word_id=w.id WHERE w.book_id=?
   AND p.next_due IS NOT NULL AND date(p.next_due)<=date(?,'+6 days')`).all(bookId,now);
  const byId=new Map(rows.map(w=>[w.id,w]));for(const word of pending)if(!byId.has(word.id))byId.set(word.id,word);
  return [...byId.values()].map(w=>({...w,unfinished:ids.has(w.id)}));
 }
 function complete(word,created){
  if(!word||!word.last_review||word.last_review<created||!word.next_due||word.next_due<=clock().now)return false;
  const row=db.prepare('SELECT state_json FROM recall_cycles WHERE word_id=?').get(word.id);
  if(row)return JSON.parse(row.state_json).complete===true;
  return !Domain.isSpellableWord(word.headword||word.word)&&word.next_due>clock().now;
 }
 function view(record,book,plan){
  const {day,now}=clock(),ids=JSON.parse(record.review_ids_json);
  const words=ids.length?db.prepare(`SELECT w.*,p.wrong,p.streak,p.review_level,p.last_review,p.next_due,0 is_new
    FROM words w JOIN progress p ON p.word_id=w.id WHERE w.book_id=? AND w.id IN (${ids.map(()=>'?').join(',')})`).all(book.id,...ids):[];
  const byId=new Map(words.map(w=>[w.id,w]));
  const remaining=ids.map(id=>byId.get(id)).filter(w=>w&&!complete(w,record.created_at));
  const newToday=db.prepare('SELECT COUNT(*) n FROM progress p JOIN words w ON w.id=p.word_id WHERE w.book_id=? AND date(p.first_studied)=?').get(book.id,day).n;
  const all=candidates(book.id,now),initialNew=new Set(JSON.parse(record.initial_new_ids_json));
  const recovery=all.filter(w=>w.unfinished&&w.first_studied?.slice(0,10)===day&&!initialNew.has(w.id)&&!byId.has(w.id));
  const outstanding=all.filter(w=>w.unfinished||w.next_due<=now).length;
  return {review:remaining,review_target:ids.length,review_remaining:remaining.length,review_done:ids.length-remaining.length,
   review_ids:ids,new_target:record.new_target,new_remaining:Math.min(plan.remaining_new,Math.max(0,record.new_target-newToday)),
   recovery,new_pending:recovery.length,deferred_total:Math.max(0,outstanding-remaining.length-recovery.length),due_total:outstanding,
   catchup_until:record.catchup_until,forecast:JSON.parse(record.forecast_json),frozen:true};
 }
 function get(book,plan,persist=false){
  const {day,now}=clock(),existing=saved(book.id,day);if(existing)return view(existing,book,plan);
  const rows=candidates(book.id,now),due=rows.filter(w=>w.unfinished||w.next_due<=now);
  due.sort((a,b)=>Number(b.unfinished)-Number(a.unfinished)||(a.next_due||'').localeCompare(b.next_due||'')||(b.wrong||0)-(a.wrong||0)||a.id-b.id);
  const prior=db.prepare('SELECT catchup_until,deferred_ids_json FROM desktop_daily_workload WHERE book_id=? AND day<? ORDER BY day DESC LIMIT 1').get(book.id,day);
  const priorIds=new Set(prior?JSON.parse(prior.deferred_ids_json):[]);
  const carrying=due.some(w=>priorIds.has(w.id))&&prior?.catchup_until>=day;
  const until=carrying?prior.catchup_until:addDays(day,2);
  const days=Math.max(1,Math.min(3,ordinal(until)-ordinal(day)+1));
  const future=Array(7).fill(0);for(const w of rows)if(!w.unfinished&&w.next_due>now){const d=ordinal(w.next_due.slice(0,10))-ordinal(day);if(d>0&&d<7)future[d]++;}
  const shares=due.length>30||carrying?distribute(due.length,future,days):[due.length];
  const target=Math.min(200,due.length,Math.max(due.length?Math.min(10,due.length):0,shares[0]||0));
  const learned=db.prepare('SELECT COUNT(*) n FROM progress p JOIN words w ON w.id=p.word_id WHERE w.book_id=? AND date(p.first_studied)=?').get(book.id,day).n;
  const overloaded=due.length>target&&due.length>30;
  const newTarget=Math.max(learned,Math.min(learned+plan.remaining_new,overloaded?Math.floor(plan.daily_quota/2):plan.daily_quota));
  const forecast=Array.from({length:7},(_,i)=>({day:addDays(day,i),review:(shares[i]||0)+(future[i]||0)}));
  forecast[0].review=target;
  const initialNew=db.prepare('SELECT w.id FROM words w JOIN progress p ON p.word_id=w.id WHERE w.book_id=? AND date(p.first_studied)=?').all(book.id,day).map(w=>w.id);
  const record={day,book_id:book.id,review_ids_json:JSON.stringify(due.slice(0,target).map(w=>w.id)),new_target:newTarget,catchup_until:until,forecast_json:JSON.stringify(forecast),initial_new_ids_json:JSON.stringify(initialNew),created_at:now};
  if(persist){db.prepare(`INSERT OR IGNORE INTO desktop_daily_workload(day,book_id,review_ids_json,new_target,catchup_until,forecast_json,deferred_ids_json,initial_new_ids_json,created_at) VALUES(?,?,?,?,?,?,?,?,?)`).run(day,book.id,record.review_ids_json,newTarget,until,record.forecast_json,JSON.stringify(due.slice(target).map(w=>w.id)),record.initial_new_ids_json,now);return view(saved(book.id,day),book,plan);}
  return {...view(record,book,plan),frozen:false};
 }
 return {get,saved,view};
}
module.exports={createDailyWorkload,distribute};
