'use strict';
const {DatabaseSync}=require('node:sqlite'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),db=new DatabaseSync(path.resolve(process.env.WORDMASTER_DB_PATH||path.join(root,'data/wordmaster.db')),{readOnly:true});
try{
 const items=db.prepare("SELECT w.id,w.source_file,w.source_line,w.word,w.headword,w.pos,w.meaning,w.phonetic,w.source_raw,b.name book FROM words w JOIN wordbooks b ON b.id=w.book_id WHERE b.is_builtin=1 AND trim(coalesce(w.phonetic,''))='' ORDER BY b.id,w.id").all();
 const counts={};for(const w of items)counts[w.book]=(counts[w.book]||0)+1;
 const report={date:'2026-10-14',operation:'read-only-missing-phonetic-check',total:items.length,counts,items};
 fs.writeFileSync(path.join(root,'docs/vocabulary-audit/missing-phonetics-20261014.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({file:'docs/vocabulary-audit/missing-phonetics-20261014.json',total:report.total,counts:report.counts},null,2));
}finally{db.close();}
