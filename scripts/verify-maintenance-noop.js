'use strict';
// Run only after all pending exact-source updates have been applied. Never answers a word.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),{DatabaseSync}=require('node:sqlite'),{createHash}=require('node:crypto'),{improve,protectedDigest}=require('./content-quality');
const root=path.resolve(__dirname,'..'),dbFile=path.resolve(process.env.WORDMASTER_DB_PATH||path.join(root,'data/wordmaster.db')),db=new DatabaseSync(dbFile,{readOnly:true});
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const reports=['common-i-examples-applied-20261015.json','i-meanings-applied-20261015.json'];
const reportHashes=()=>Object.fromEntries(reports.map(file=>[file,hash(fs.readFileSync(path.join(root,'docs/vocabulary-audit',file),'utf8'))]));
const contentHash=()=>hash({words:db.prepare('SELECT * FROM words ORDER BY id').all(),builds:db.prepare('SELECT * FROM vocabulary_builds ORDER BY book_id').all()});
try{
 const pending=improve(db);assert.equal(pending.results.reduce((n,r)=>n+(r.items?.length||0),0),0,'Refuse to run while content changes are pending');
 const before={reports:reportHashes(),protected:protectedDigest(db),content:contentHash()},checks=[];
 for(const [script,args,expected] of [
  ['apply-reviewed-common-examples.js',['--common-i','--apply'],'noop'],['apply-reviewed-meanings.js',['--i','--apply'],'noop'],
  ['apply-reviewed-common-examples.js',['--common-i','--common-h'],'Choose one'],['apply-reviewed-meanings.js',['--i','--h'],'Choose one'],
  ['apply-reviewed-common-examples.js',['--common-unknown'],'Unknown'],['apply-reviewed-meanings.js',['--unknown'],'Unknown']]){
  const p=spawnSync(process.execPath,[path.join(root,'scripts',script),...args],{cwd:root,env:{...process.env,WORDMASTER_DB_PATH:dbFile},encoding:'utf8',timeout:60000});if(p.error)throw p.error;
  if(expected==='noop'){assert.equal(p.status,0,p.stderr);const result=JSON.parse(p.stdout);assert.equal(result.added??result.example_pairs,0);assert.equal(result.existing_application_report_preserved,true);}else{assert.notEqual(p.status,0);assert.ok(p.stderr.includes(expected),p.stderr);}
  checks.push({script,args,result:expected==='noop'?'zero-change-report-preserved':'invalid-selector-rejected'});
 }
 const after={reports:reportHashes(),protected:protectedDigest(db),content:contentHash()};assert.deepEqual(after,before);
 const report={date:'2026-10-15',operation:'actual-maintenance-noop-and-selector-check',checks,all_report_hashes_unchanged:true,all_content_hashes_unchanged:true,protected_state_unchanged:true};fs.writeFileSync(path.join(root,'docs/vocabulary-audit/maintenance-noop-20261015.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{db.close();}
