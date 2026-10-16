'use strict';
// Release startup may migrate schema 11 to 12, but it must not rewrite user rows.
const {createHash}=require('node:crypto');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const quote=name=>'"'+name.replaceAll('"','""')+'"';
function snapshot(db){
 const tables=db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' ORDER BY name").all().map(({name,sql})=>({
  name,sql,columns:db.prepare('PRAGMA table_info('+quote(name)+')').all(),rows:db.prepare('SELECT * FROM '+quote(name)+' ORDER BY rowid').all(),
 }));
 return {version:db.prepare('SELECT schema_version FROM schema_meta WHERE id=1').get().schema_version,tables};
}
const newTables={book_history:['book_id','replacement_book_id','reason_json','original_plan_json','archived_at'],word_answer_policies:['word_id','policy_json','content_sha256']};
function verifyUpgrade(before,after){
 if(![11,12].includes(before.version)||after.version!==12)throw new Error('Unexpected release schema transition');
 const old=new Map(before.tables.map(t=>[t.name,t])),next=new Map(after.tables.map(t=>[t.name,t]));
 for(const [name,table] of old){
  const updated=next.get(name);if(!updated||table.sql!==updated.sql||hash(table.columns)!==hash(updated.columns))throw new Error('Existing table structure changed: '+name);
  const expected=name==='schema_meta'?table.rows.map(row=>row.id===1?{...row,schema_version:12}:row):table.rows;
  if(hash(expected)!==hash(updated.rows))throw new Error('Existing rows changed: '+name);
 }
 for(const [name,table] of next)if(!old.has(name)){
  if(before.version!==11||!newTables[name]||table.rows.length||JSON.stringify(table.columns.map(c=>c.name))!==JSON.stringify(newTables[name]))throw new Error('Unexpected added table or rows: '+name);
 }
 for(const name of Object.keys(newTables))if(!next.has(name))throw new Error('Migration table missing: '+name);
 return {from_schema:before.version,to_schema:after.version,existing_tables_checked:old.size,existing_rows_unchanged:true,new_tables_empty:Object.keys(newTables).filter(name=>!old.has(name))};
}
function patchedRows(table,patches,key,fields){
 const allowed=new Set(fields),byId=new Map();
 for(const patch of patches){if(!Number.isSafeInteger(patch.id)||patch.id<1||byId.has(patch.id)||!patch.changes||Object.keys(patch.changes).some(field=>!allowed.has(field)))throw Error('Invalid reviewed content update patch');byId.set(patch.id,patch.changes);}
 const seen=new Set(),rows=table.rows.map(row=>{if(!byId.has(row[key]))return row;seen.add(row[key]);return {...row,...byId.get(row[key])};});
 if(seen.size!==byId.size)throw Error('Reviewed content update identity missing');return rows;
}
function verifyContentUpdate(before,after,{words=[],builds=[]}={}){
 if(before.version!==12||after.version!==12)throw Error('Content update must follow schema migration');
 const old=new Map(before.tables.map(t=>[t.name,t])),next=new Map(after.tables.map(t=>[t.name,t]));
 if(old.size!==next.size||!old.has('words')||!old.has('vocabulary_builds'))throw Error('Content update changed table identities');
 for(const [name,table] of old){const updated=next.get(name);if(!updated||table.sql!==updated.sql||hash(table.columns)!==hash(updated.columns))throw Error('Content update changed table structure: '+name);
  const expected=name==='words'?patchedRows(table,words,'id',['meaning','phonetic','example','example_translation']):name==='vocabulary_builds'?patchedRows(table,builds,'book_id',['content_version','audit_json']):table.rows;
  if(hash(expected)!==hash(updated.rows))throw Error('Unexpected content update rows: '+name);
 }
 return {schema:12,reviewed_word_ids:words.map(p=>p.id),reviewed_build_ids:builds.map(p=>p.id),all_other_rows_unchanged:true,all_table_structures_unchanged:true};
}
module.exports={snapshot,verifyUpgrade,verifyContentUpdate};
