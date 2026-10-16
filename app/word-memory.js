'use strict';
function createWordMemory(db){
 function read(ids){
  const result=new Map(),unique=[...new Set(ids)];
  for(let offset=0;offset<unique.length;offset+=200){
   const chunk=unique.slice(offset,offset+200),marks=chunk.map(()=>'?').join(',');
   const progress=db.prepare(`SELECT word_id,streak,first_studied,next_due,review_level,wrong,correct FROM progress WHERE word_id IN (${marks})`).all(...chunk);
   if(!progress.length)continue;
   const errors=db.prepare(`SELECT word_id,practice_mode,COUNT(*) n FROM review_log WHERE correct=0 AND word_id IN (${marks}) GROUP BY word_id,practice_mode ORDER BY word_id,n DESC,practice_mode`).all(...chunk);
   const cycles=new Map(db.prepare(`SELECT word_id,state_json FROM recall_cycles WHERE word_id IN (${marks})`).all(...chunk).map(r=>[r.word_id,r.state_json]));
   const grouped=new Map();for(const row of errors){if(!grouped.has(row.word_id))grouped.set(row.word_id,[]);grouped.get(row.word_id).push(row);}
   for(const {word_id,...p} of progress){const rows=grouped.get(word_id)||[],weak=rows.find(r=>['spelling','meaning','pos'].includes(r.practice_mode));
    result.set(word_id,{...p,recall_cycle:cycles.has(word_id)?JSON.parse(cycles.get(word_id)):null,errors_total:Math.max(Number(p.wrong)||0,rows.reduce((sum,r)=>sum+r.n,0)),weak_mode:weak?.practice_mode||null,weak_errors:weak?.n||0});
   }
  }
  return result;
 }
 return {read,one:id=>read([id]).get(id)||null};
}
module.exports={createWordMemory};
