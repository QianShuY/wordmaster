'use strict';
// Read-only typography inventory. Character checks never constitute pronunciation review.
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..');
function audit(db){
 const rows=db.prepare('SELECT w.id,w.word,w.headword,w.homograph,w.pos,w.meaning,w.phonetic,w.source_file,w.source_line,w.source_raw,b.name book,b.is_builtin FROM words w JOIN wordbooks b ON b.id=w.book_id ORDER BY b.id,w.id').all();
 const chars=new Map(),items=[];
 for(const w of rows){for(const c of new Set(w.phonetic||'')){const key=c.codePointAt(0);const old=chars.get(key)||{character:c,codepoint:'U+'+key.toString(16).toUpperCase().padStart(4,'0'),entries:0};old.entries++;chars.set(key,old);}
  const flags=[];if(/[∫]/u.test(w.phonetic))flags.push('integral-sign-in-phonetic');if(/[\uE000-\uF8FF\uFFFD]/u.test(w.phonetic))flags.push('private-use-or-replacement-character');if(/[әє?]/u.test(w.phonetic))flags.push('legacy-suspicious-character');if(!String(w.phonetic||'').trim())flags.push('missing-phonetic');
  if(flags.length)items.push({...w,flags});
 }
 const counts={};for(const w of items){const c=counts[w.book]||{flagged:0,integral:0,missing:0};c.flagged++;c.integral+=Number(w.flags.includes('integral-sign-in-phonetic'));c.missing+=Number(w.flags.includes('missing-phonetic'));counts[w.book]=c;}
 return {date:'2026-10-15',operation:'read-only-phonetic-character-inventory',total:rows.length,flagged:items.length,counts,limitation:'Typography flags only; not a review of stress, phonemes, variants or all dictionary senses.',ipa_symbol_reference:'https://www.internationalphoneticassociation.org/IPAcharts/IPA_charts_EI/IPA_charts_EI.html',characters:[...chars.values()].sort((a,b)=>a.character.codePointAt(0)-b.character.codePointAt(0)),items};
}
if(require.main===module){const db=new DatabaseSync(path.resolve(process.env.WORDMASTER_DB_PATH||path.join(root,'data/wordmaster.db')),{readOnly:true});try{const report=audit(db);const file=path.join(root,'docs/vocabulary-audit/phonetic-characters-20261015.json');fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,flagged:report.flagged,counts:report.counts,characters:report.characters},null,2));}finally{db.close();}}
module.exports={audit};
