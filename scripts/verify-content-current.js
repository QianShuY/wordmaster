'use strict';
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite'),{inventory,protectedDigest}=require('./content-quality'),{audit}=require('./check-phonetic-characters');
const root=path.resolve(__dirname,'..'),db=new DatabaseSync(path.resolve(process.env.WORDMASTER_DB_PATH||path.join(root,'data/wordmaster.db')),{readOnly:true});
try{
 const current=protectedDigest(db),reports=['deferred-meanings-applied-20261014.json','phonetic-symbols-applied-20261015.json','phonetics-private-use-applied-20261015.json','common-g-examples-applied-20261015.json','g-meanings-applied-20261015.json','common-h-examples-applied-20261015.json','h-meanings-applied-20261015.json','common-i-examples-applied-20261015.json','i-meanings-applied-20261015.json'];
 const comparisons=reports.map(file=>{const r=JSON.parse(fs.readFileSync(path.join(root,'docs/vocabulary-audit',file),'utf8')),old=new DatabaseSync(r.backup,{readOnly:true});try{const match=current===protectedDigest(old);if(!match)throw Error('Protected state differs from '+file);return {report:file,protected_state_matches:true};}finally{old.close();}});
 const content=inventory(db),typography=audit(db),integrity=db.prepare('PRAGMA integrity_check').get().integrity_check,foreignKeys=db.prepare('PRAGMA foreign_key_check').all();if(integrity!=='ok'||foreignKeys.length)throw Error('Integrity check failed');
 const report={date:'2026-10-15',version:content.version,operation:'read-only-content-verification',protected_digest:current,comparisons,integrity,foreign_key_violations:foreignKeys.length,words:typography.total,progress:db.prepare('SELECT count(*) n FROM progress').get().n,review_log:db.prepare('SELECT count(*) n FROM review_log').get().n,typography_flagged:typography.flagged,books:content.books.map(({items,excluded,...b})=>b),limitations:'Example presence, typography normalization and selected-sense checks are not complete language review.'};
 fs.writeFileSync(path.join(root,'docs/vocabulary-audit/content-current-20261015.json'),JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(path.join(root,'docs/vocabulary-audit/phonetic-characters-20261015.json'),JSON.stringify(typography,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{db.close();}
