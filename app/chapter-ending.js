'use strict';
const {randomUUID,createHash}=require('node:crypto');
const Battle=require('../shared/boss-battle');
const STORY={chapter:1,title:'雾桥之后，仍有来信',memorial:'渡雾者之印',paragraphs:[
 '最后一个词落在桥上，石印终于松开。守卫收起灯，向你让出通往彼岸的道路。',
 '“旅人，吾所看守的，并非此桥，而是那些被遗忘的言语。今日，你以记忆为它们重燃了灯火。”',
 '你拆开那封无字的来信。纸上渐渐浮现一行墨迹：道路不会替你记住一切，但每一次回忆，都能带你走得更远。',
 '你将一枚渡雾者之印夹入手账。远处的群山仍藏在云里，而这一章，已有了属于你的落款。'
]};
function createChapterEnding(db,campaign,getPool,instanceId){
 const ending=()=>{const row=db.prepare('SELECT * FROM adventure_endings WHERE chapter=1').get();return row?{...STORY,completedAt:row.completed_at,summary:JSON.parse(row.summary_json)}:null;};
 function session(id){const row=db.prepare('SELECT * FROM boss_sessions WHERE id=?').get(id);if(!row)return null;return {id:row.id,pool:JSON.parse(row.pool_json),initial:JSON.parse(row.initial_json),result:row.result_json?JSON.parse(row.result_json):null};}
 function start(){
  if(!campaign.state().bossAvailable)throw new Error('尚未抵达雾桥，请继续完成每日旅程');
  const pool=getPool();if(pool.length<10)throw new Error('正式挑战至少需要 10 个合格已学词');
  const initial=Battle.create(pool,instanceId()).snapshot(),id=randomUUID();
  db.prepare('INSERT INTO boss_sessions(id,chapter,pool_json,initial_json) VALUES(?,1,?,?)').run(id,JSON.stringify(pool),JSON.stringify(initial));
  return session(id);
 }
 function finish(id,events){
  if(!Array.isArray(events)||events.length<3||events.length>2000||JSON.stringify(events).length>90000)throw new Error('战斗手记不完整或过长');
  const hash=createHash('sha256').update(JSON.stringify(events)).digest('hex');
  db.exec('BEGIN IMMEDIATE');try{
   const row=db.prepare('SELECT * FROM boss_sessions WHERE id=?').get(id);if(!row)throw new Error('正式挑战记录不存在，请回营重开');
   if(row.result_json){if(row.transcript_sha256!==hash)throw new Error('这场挑战已经结算，手记不可更换');db.exec('COMMIT');return {...JSON.parse(row.result_json),duplicate:true};}
   const pool=JSON.parse(row.pool_json),initial=JSON.parse(row.initial_json),game=Battle.create(pool,initial.instanceId,initial);
   for(const event of events){
    if(!event||!['teach','start','choose','answer','next','revive'].includes(event.action)||!Array.isArray(event.args))throw new Error('无效的战斗操作');
    const a=event.args,needsText=['teach','choose','answer','revive'].includes(event.action);
    if(needsText?(typeof a[0]!=='string'||a[0].length>1000||a.length>(event.action==='answer'?2:1)||event.action==='answer'&&a.length===2&&typeof a[1]!=='boolean'):a.length!==0)throw new Error('无效的咒语记录');
    if(game.state.phase==='won'||!game[event.action](...a))throw new Error('战斗操作顺序不成立');
   }
   const s=game.state;if(s.phase!=='won'||s.bossHp!==0)throw new Error('守卫尚未被击败');
   const summary={answered:s.answered,correct:s.correct,revived:s.revived,mistakes:s.mistakes.length};
   const firstClear=!db.prepare('SELECT 1 FROM adventure_endings WHERE chapter=1').get();
   db.prepare('INSERT OR IGNORE INTO adventure_endings(chapter,session_id,memorial,summary_json) VALUES(1,?,?,?)').run(id,STORY.memorial,JSON.stringify(summary));
   const result={ok:true,firstClear,duplicate:false,ending:ending()};
   db.prepare('UPDATE boss_sessions SET transcript_sha256=?,result_json=? WHERE id=?').run(hash,JSON.stringify(result),id);
   db.exec('COMMIT');return result;
  }catch(e){db.exec('ROLLBACK');throw e;}
 }
 return {start,session,finish,ending};
}
module.exports={createChapterEnding,STORY};
