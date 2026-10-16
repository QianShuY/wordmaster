'use strict';
const Domain=require('../shared/domain');
function advance(previous,mode,correct,spellable){
 const state=previous?JSON.parse(JSON.stringify(previous)):{meaning:{streak:0,errors:0},spelling:{streak:0,errors:0},complete:false};
 if(state.complete)return state;
 const step=state[mode];
 if(!step)return state;
 if(correct)step.streak++;else{step.errors++;step.streak=0;}
 const passed=s=>s.streak>=(s.errors?2:1);
 state.complete=passed(state.meaning)&&(!spellable||passed(state.spelling));
 return state;
}
function record(db,word,current,mode,correct,cycleId){
 const previous=db.prepare('SELECT * FROM recall_cycles WHERE word_id=?').get(word.id);
 const prior=previous&&JSON.parse(previous.state_json);
 if(correct&&prior?.complete&&(previous.cycle_id===cycleId||(current?.next_due&&new Date(current.next_due.replace(' ','T'))>new Date()))){
  return {state:prior,schedule:{level:Number(current?.review_level)||0,modifier:null,preserveDue:current?.next_due||null}};
 }
 // Leaving the page or changing sessions cannot discard an unfinished recall.
 // A new failure after completion is a fresh recall, even when a restored
 // client reuses its old cycle ID. Never let a completed flag swallow errors.
 const reuse=prior&&!prior.complete;
 const state=advance(reuse?prior:null,mode,correct,Domain.isSpellableWord(word.headword||word.word));
 const id=cycleId;
 db.prepare(`INSERT INTO recall_cycles(word_id,cycle_id,state_json) VALUES(?,?,?)
   ON CONFLICT(word_id) DO UPDATE SET cycle_id=excluded.cycle_id,state_json=excluded.state_json`).run(word.id,id,JSON.stringify(state));
 const finishedEarlier=reuse&&prior.complete;
 const schedule=!correct?Domain.recallSchedule(current,false):state.complete&&!finishedEarlier?Domain.recallSchedule(current,true):{
  level:Number(current?.review_level)||0,modifier:null,preserveDue:current?.next_due||null
 };
 return {state,schedule};
}
module.exports={advance,record};
