'use strict';
const Domain=require('../shared/domain');
function preparePool(rows){
 const seen=new Set();const pool=rows.flatMap(w=>{
  const answer=w.headword||w.word,meaning=String(w.meaning||'').split('||')[0].trim();
  // Only audited built-in rows with a real prior learning event are supplied.
  if(!w.source_file||!Domain.isSpellableWord(answer,w.answer_policy)||!/[\u3400-\u9fff]/.test(meaning)||/[a-z]/i.test(meaning)||!w.pos)return [];
  const key=Domain.normalizeSpelling(answer);if(seen.has(key))return [];seen.add(key);
  return [{id:w.id,answer,meaning,pos:w.pos,phonetic:w.phonetic||'',book:w.book_name,...(w.answer_policy?{answer_policy:w.answer_policy}:{})}];
 }).slice(0,60);
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
