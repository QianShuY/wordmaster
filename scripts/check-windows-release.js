'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFile}=require('node:child_process');
const {promisify}=require('node:util'),{createHash}=require('node:crypto'),{DatabaseSync,backup}=require('node:sqlite');
const {installationKey}=require('../app/runtime-info');
const {snapshot,verifyUpgrade,verifyContentUpdate}=require('./release-data-check');
const run=promisify(execFile),root=path.resolve(__dirname,'..');
const digest=db=>createHash('sha256').update(JSON.stringify(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(({name})=>[name,db.prepare('SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid').all()]))).digest('hex');
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function main(){
 if(process.platform!=='win32')throw new Error('This acceptance requires Windows and the actual EXE');
 const release=path.resolve(process.argv[2]||path.join(root,'output/releases/WordMaster-2026-10-28.1-preview'));
 const manifest=JSON.parse(fs.readFileSync(path.join(release,'release-manifest.json'),'utf8'));
 for(const f of manifest.files){
  assert(!/\.(db|sqlite|sqlite3)(-|$)/i.test(f.path),'Database in manifest');
  const target=path.resolve(release,f.path);assert(target.startsWith(release+path.sep),'Manifest path escaped release');
  const b=fs.readFileSync(target);assert(b.length===f.bytes&&createHash('sha256').update(b).digest('hex')===f.sha256,'Manifest mismatch: '+f.path);
 }
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'墨词 Windows 验收 ')),exe=path.join(release,'WordMaster.exe'),running=new Set(),results=[];
 async function launch(database){
  const start=performance.now();
  const {stdout}=await run(exe,['--headless'],{cwd:release,windowsHide:true,timeout:60000,env:{...process.env,WORDMASTER_DB_PATH:database}});
  const result=JSON.parse(stdout.trim());assert(result.ready,'Launcher failed');
  if(result.processId)running.add(result.processId);
  assert(result.installationKey===installationKey(release,database),'Wrong installation or DB reused');
  return {...result,ready_ms:performance.now()-start};
 }
 async function get(port,url){const response=await fetch('http://127.0.0.1:'+port+url);assert(response.ok,'HTTP '+response.status+': '+url);return response;}
 async function stop(result){
  if(!result.processId)return;
  const {stdout}=await run('powershell.exe',['-NoProfile','-Command',`[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false); Get-CimInstance Win32_Process -Filter 'ProcessId = ${result.processId}' | Select-Object ExecutablePath | ConvertTo-Json -Compress`],{windowsHide:true});
  const info=JSON.parse(stdout);assert(path.resolve(info.ExecutablePath).toLowerCase()===path.join(release,'runtime/node.exe').toLowerCase(),'Refusing to stop an unrelated process');
  process.kill(result.processId);running.delete(result.processId);
  for(let i=0;i<30;i++){try{await fetch('http://127.0.0.1:'+result.port+'/api/desktop/runtime');await pause(100);}catch{return;}}
  throw new Error('Stopped release process still answers');
 }
 const live=new DatabaseSync(path.join(root,'data/wordmaster.db'),{readOnly:true}),liveBefore=digest(live);
 try{
  let defaultPortReachable=false;
  try{const response=await fetch('http://127.0.0.1:3456/',{signal:AbortSignal.timeout(800)});await response.arrayBuffer();defaultPortReachable=true;}catch{}
  const freshDb=path.join(dir,'全新 学习.db'),concurrent=await Promise.all([launch(freshDb),launch(freshDb)]);
  const fresh=concurrent.find(x=>x.processId),concurrentReuse=concurrent.find(x=>x.reused);
  assert(fresh&&concurrentReuse&&fresh.port===concurrentReuse.port,'Concurrent first launch duplicated or failed');
  assert(!defaultPortReachable||fresh.port!==3456,'Occupied default port was incorrectly reused');
  const reused=await launch(freshDb);assert(reused.reused&&reused.port===fresh.port&&reused.processId===0,'Repeated launch started another process');
  const pages=['/','/adventure/index.html','/adventure/journey.html','/adventure/camp.html','/adventure/battle.html','/adventure/ending.html'];
  for(const url of pages)await get(fresh.port,url);
  for(const url of ['/api/books','/api/adventure/campaign','/api/adventure/ending','/api/adventure/pool','/api/desktop/runtime'])await (await get(fresh.port,url)).json();
  const firstDb=new DatabaseSync(freshDb,{readOnly:true});
  const first={words:firstDb.prepare('SELECT COUNT(*) n FROM words').get().n,progress:firstDb.prepare('SELECT COUNT(*) n FROM progress').get().n,schema:firstDb.prepare('SELECT schema_version FROM schema_meta').get().schema_version};firstDb.close();
  const vocabulary=require(path.join(release,'app/vocabulary'));
  const expectedWords=vocabulary.CATALOG.reduce((n,spec)=>n+vocabulary.buildBook(spec,path.join(release,'app/seed')).words.length,0);
  assert(first.words===expectedWords&&first.progress===0&&first.schema===13,'Fresh package contains unexpected content, study data or schema');
  await stop(fresh);results.push({scenario:'fresh-install-and-double-launch',first,reused:true,concurrent_launch_reused:true,
   default_port_already_serving:defaultPortReachable,selected_port:fresh.port,ready_ms:fresh.ready_ms,repeat_ready_ms:reused.ready_ms,pages});
  const copyDb=path.join(dir,'已有 学习 副本.db');await backup(live,copyDb);
  const prepared=new DatabaseSync(copyDb);
  const sourceSchema=prepared.prepare('SELECT schema_version FROM schema_meta WHERE id=1').get().schema_version;
  let reconstructedSchema11=false;
  // Only reconstruct an older schema in this disposable copy when the added
  // tables are empty. All existing learning/content rows remain in the fixture.
  if([12,13].includes(sourceSchema)&&['book_history','word_answer_policies',...(sourceSchema===13?['desktop_daily_workload']:[])].every(name=>prepared.prepare('SELECT COUNT(*) n FROM '+name).get().n===0)){
   prepared.exec('BEGIN; '+(sourceSchema===13?'DROP TABLE desktop_daily_workload; ':'')+'DROP TABLE book_history; DROP TABLE word_answer_policies; UPDATE schema_meta SET schema_version=11 WHERE id=1; COMMIT');
   reconstructedSchema11=true;
  }
  prepared.close();
  const original=new DatabaseSync(copyDb,{readOnly:true}),before=snapshot(original);original.close();
  const upgraded=await launch(copyDb);
  const checked=new DatabaseSync(copyDb,{readOnly:true});const after=snapshot(checked),afterDigest=digest(checked);
  const migration=verifyUpgrade(before,after);
  const integrity=checked.prepare('PRAGMA integrity_check').get(),fk=checked.prepare('PRAGMA foreign_key_check').all();checked.close();
  assert(integrity.integrity_check==='ok'&&!fk.length,'Upgraded copy failed integrity');await stop(upgraded);
  const reopened=await launch(copyDb),again=new DatabaseSync(copyDb,{readOnly:true});const reopenedDigest=digest(again);again.close();assert(reopenedDigest===afterDigest,'Reopen changed migrated rows');await stop(reopened);
  results.push({scenario:'existing-database-upgrade-and-reopen',source_schema:sourceSchema,reconstructed_schema11_in_disposable_copy:reconstructedSchema11,all_existing_rows_unchanged:true,migration,integrity,foreign_keys:fk,ready_ms:upgraded.ready_ms,reopen_ready_ms:reopened.ready_ms});
  // This is separate from the schema-only gate. Only this reviewed row and its
  // build stamp may change; learning, plans, collections and all other rows stay exact.
  const agedDb=path.join(dir,'旧内容 学习 副本.db');await backup(live,agedDb);
  const aged=new DatabaseSync(agedDb),spec=vocabulary.CATALOG.find(s=>s.file==='cet4.txt'),built=vocabulary.buildBook(spec,path.join(release,'app/seed'));
  const target=aged.prepare("SELECT w.* FROM words w JOIN wordbooks b ON b.id=w.book_id WHERE b.name=? AND b.is_builtin=1 AND w.word='duration'").get(spec.name),updatedWord=built.words.find(w=>w.word==='duration'),reviewed=require(path.join(release,'shared/content-batch')).reviewedExample(updatedWord);
  assert(target&&reviewed,'Reviewed aged-content fixture missing');const raw=vocabulary.parseSourceLine(target.source_raw).entry;
  aged.prepare('UPDATE words SET meaning=?,phonetic=?,example=?,example_translation=? WHERE id=?').run(raw.meaning,raw.phonetic,'','',target.id);aged.prepare('UPDATE vocabulary_builds SET content_version=? WHERE book_id=?').run('older-installed-content',target.book_id);
  const lexical=require(path.join(release,'app/seed/lexical-cet6-reviewed-20261022.json'));
  const lexicalUpdates=lexical.map(p=>{
   const row=aged.prepare('SELECT * FROM words WHERE source_file=? AND source_line=? AND source_raw=? AND word=?').get(p.source_file,p.source_line,p.source_raw,p.word);
   assert(row,'Lexical upgrade fixture missing: '+p.word);
   aged.prepare('UPDATE words SET pos=?,meaning=?,phonetic=?,example=?,example_translation=? WHERE id=?').run(p.from.pos,p.from.meaning,p.from.phonetic,'','',row.id);
   aged.prepare("UPDATE vocabulary_builds SET content_version='2026-10-21.2' WHERE book_id=?").run(row.book_id);
   return {id:row.id,book_id:row.book_id,changes:{...p.to,example:p.example.text,example_translation:p.example.translation}};
  });
  const agedBefore=snapshot(aged);aged.close();const backupDir=path.join(dir,'backups'),backupFilesBefore=fs.existsSync(backupDir)?fs.readdirSync(backupDir):[];
  const contentRun=await launch(agedDb),contentRuntime=await(await get(contentRun.port,'/api/desktop/runtime')).json();assert(contentRuntime.contentUpgrade?.status==='applied'&&contentRuntime.contentCurrent,'Packaged content upgrade did not complete');assert(JSON.stringify(contentRuntime.contentUpgrade.counts)===JSON.stringify({examples:7,meanings:4,phonetics:2,parts_of_speech:6}),'Unexpected packaged content fields changed');
  const contentChecked=new DatabaseSync(agedDb,{readOnly:true}),contentAfter=snapshot(contentChecked),contentDigest=digest(contentChecked);contentChecked.close();
  const lexicalBook=lexicalUpdates[0].book_id,lexicalSpec=vocabulary.CATALOG.find(s=>s.file==='cet6.txt');
  const contentMigration=verifyContentUpdate(agedBefore,contentAfter,{words:[{id:target.id,changes:{meaning:updatedWord.meaning,phonetic:updatedWord.phonetic,example:reviewed.text,example_translation:reviewed.translation}},...lexicalUpdates.map(({id,changes})=>({id,changes}))],builds:[{id:target.book_id,changes:{content_version:vocabulary.VERSION,audit_json:JSON.stringify(built.report)}},{id:lexicalBook,changes:{content_version:vocabulary.VERSION,audit_json:JSON.stringify(vocabulary.buildBook(lexicalSpec).report)}}]});
  const newFiles=fs.readdirSync(backupDir).filter(f=>!backupFilesBefore.includes(f)),newBackups=newFiles.filter(f=>f.endsWith('.db')),newReceipts=newFiles.filter(f=>f.endsWith('.json'));assert(newBackups.length===1&&newReceipts.length===1,'Packaged upgrade backup or receipt missing');const saved=new DatabaseSync(path.join(backupDir,newBackups[0]),{readOnly:true});assert(JSON.stringify(snapshot(saved))===JSON.stringify(agedBefore),'Packaged backup differs from pre-update rows');saved.close();await stop(contentRun);
  const contentReopen=await launch(agedDb),reopenRuntime=await(await get(contentReopen.port,'/api/desktop/runtime')).json(),contentAgain=new DatabaseSync(agedDb,{readOnly:true});assert(reopenRuntime.contentUpgrade?.status==='up-to-date'&&digest(contentAgain)===contentDigest,'Packaged content reopen changed saved rows');contentAgain.close();assert(fs.readdirSync(backupDir).filter(f=>!backupFilesBefore.includes(f)).length===2,'Reopen created another backup');await stop(contentReopen);
  results.push({scenario:'reviewed-content-upgrade-and-reopen',reverted_reviewed_rows_only:7,production_database_untouched:true,contentMigration,counts:contentRuntime.contentUpgrade.counts,one_consistent_backup_and_receipt:true,reopen_no_changes:true,ready_ms:contentRun.ready_ms,reopen_ready_ms:contentReopen.ready_ms});
  assert(digest(live)===liveBefore,'Live database differs from start; inspect concurrent user activity');
  const report={release,manifest_files:manifest.files.length,actual_windows_exe_tested:true,headless_launcher_only:true,
   real_database_unchanged:true,results,remaining:['Current package browser visual acceptance','Long-duration use and animation measurements','Gaokao replacement and full-book language review','Default-browser interactive desktop acceptance']};
  assert(/^[a-zA-Z0-9][a-zA-Z0-9.-]{0,60}$/.test(manifest.version),'Unsafe report version');
  fs.writeFileSync(path.join(root,'docs','WINDOWS_RELEASE_CHECK_'+manifest.version+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{
  live.close();
  // Only PIDs returned by our own fresh launch are candidates for cleanup.
  for(const pid of running){try{const {stdout}=await run('powershell.exe',['-NoProfile','-Command',`[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false); Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}' | Select-Object ExecutablePath | ConvertTo-Json -Compress`],{windowsHide:true});if(JSON.parse(stdout)?.ExecutablePath?.toLowerCase()===path.join(release,'runtime/node.exe').toLowerCase())process.kill(pid);}catch{}}
  const resolved=path.resolve(dir);assert(resolved.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(resolved).startsWith('墨词 Windows 验收 '),'Unsafe temporary cleanup');
  try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch(error){console.error('Temporary QA files retained:',resolved,error.code);}
 }
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
