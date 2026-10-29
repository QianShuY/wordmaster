'use strict';
const {createHash}=require('node:crypto');
function adapter(db){const api={failBeforeCommit:false,loseResponse:false,backups:0,
 async query({sql,args=[]}){return {rows:db.prepare(sql).all(...args).map(row=>({...row})),revision:Number(db.prepare("SELECT value FROM native_meta WHERE key='revision'").get().value)};},
 async commit(data){const hash=createHash('sha256').update(JSON.stringify(data)).digest('hex'),saved=db.prepare('SELECT * FROM native_requests WHERE request_id=?').get(data.requestId);if(saved){if(saved.payload_sha256!==hash)throw Error('REQUEST_CONFLICT');return JSON.parse(saved.response_json);}
  const current=Number(db.prepare("SELECT value FROM native_meta WHERE key='revision'").get().value);if(data.expectedRevision!==current)throw Error('REVISION_CONFLICT');if(data.backup)api.backups++;
  db.exec('BEGIN IMMEDIATE');let result;try{for(const s of data.statements)db.prepare(s.sql).run(...s.args);if(api.failBeforeCommit){api.failBeforeCommit=false;throw Error('simulated write failure');}result={ok:true,revision:current+1};db.prepare("UPDATE native_meta SET value=? WHERE key='revision'").run(String(result.revision));db.prepare('INSERT INTO native_requests VALUES(?,?,?)').run(data.requestId,hash,JSON.stringify(result));db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}if(api.loseResponse){api.loseResponse=false;throw Error('saved response lost');}return result;
 }};return api;}
module.exports={adapter};
