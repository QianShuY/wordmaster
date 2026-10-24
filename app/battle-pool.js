'use strict';
const Domain=require('../shared/domain');
function preparePool(rows){
 // Freeze a broad roster for each fight: recent learning, weak words, and older coverage.
 // Deterministic selection also keeps the read-only roster stable across refreshes.
 const seen=new Set();const eligible=rows.flatMap(w=>{
  const answer=w.headword||w.word,meaning=String(w.meaning||'').split('||')[0].trim();
  // Only audited built-in rows with a real prior learning event are supplied.
  if(!w.source_file||!Domain.isSpellableWord(answer,w.answer_policy)||!/[\u3400-\u9fff]/.test(meaning)||/[a-z]/i.test(meaning)||!w.pos)return [];
  const key=Domain.normalizeSpelling(answer);if(seen.has(key))return [];seen.add(key);
  return [{id:w.id,answer,meaning,pos:w.pos,phonetic:w.phonetic||'',book:w.book_name,...(w.answer_policy?{answer_policy:w.answer_policy}:{}),recent:String(w.battle_first_studied||w.battle_last_review||''),wrong:Number(w.battle_wrong)||0}];
 });
 const selected=new Map(),add=w=>selected.set(w.id,w);
 const recent=[...eligible].sort((a,b)=>b.recent.localeCompare(a.recent)||a.id-b.id);
 recent.slice(0,60).forEach(add);
 const weak=[...eligible].filter(w=>w.wrong>0).sort((a,b)=>b.wrong-a.wrong||a.id-b.id);
 let added=0;for(const w of weak){if(!selected.has(w.id)){add(w);if(++added===60)break;}}
 const older=recent.filter(w=>!selected.has(w.id)),slots=Math.min(180-selected.size,older.length);
 for(let i=0;i<slots;i++)add(older[Math.min(older.length-1,Math.floor((i+.5)*older.length/slots))]);
 const pool=[...selected.values()].map(({recent,wrong,...w})=>w);
 const pieces=text=>text.split(/[，,；;、。.（）()\s\d]+/).filter(p=>p.length>=2);
 return pool.flatMap(w=>{
  const options=[w.meaning],fragments=pieces(w.meaning);
  for(const other of pool){if(options.length===4)break;
   if(options.includes(other.meaning)||fragments.some(f=>other.meaning.includes(f))||pieces(other.meaning).some(f=>w.meaning.includes(f)))continue;
   options.push(other.meaning);
  }
  return options.length===4?[{...w,choices:options}]:[];
 });
}
module.exports={preparePool};
