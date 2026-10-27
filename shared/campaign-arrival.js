(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MociCampaignArrival=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const pendingKey='moci-campaign-arrival-pending-v1',seenKey='moci-campaign-arrival-seen-v1';
 const lifetime=36*60*60*1000;
 // A receipt describes an existing server record. It never grants a stage or reward.
 function receipt(state,stage){
  if(!Number.isInteger(stage)||stage<1||stage>13||!Number.isInteger(state?.completed)||stage>state.completed||!Array.isArray(state.days))return null;
  const days=state.days.filter(d=>d.stage_no<=stage).sort((a,b)=>a.stage_no-b.stage_no);
  if(days.length!==stage||days.some((d,i)=>d.stage_no!==i+1||!/^\d{4}-\d{2}-\d{2}$/.test(d.day)||!Number.isSafeInteger(d.book_id)||d.book_id<1||i>0&&d.day<=days[i-1].day))return null;
  const day=days.at(-1);
  return {stage,from:stage-1,day:day.day,book:day.book_name||'随行词袋',
   id:JSON.stringify(days.map(d=>[d.stage_no,d.day,d.book_id,d.book_name||'']))};
 }
 function createLedger({session,storage,now=Date.now}={}){
  const memory=new Map();
  const read=(store,key)=>{try{return store?.getItem(key)??memory.get(key)??null;}catch{return memory.get(key)??null;}};
  const write=(store,key,value)=>{memory.set(key,value);try{store?.setItem(key,value);}catch{}};
  const remove=(store,key)=>{memory.delete(key);try{store?.removeItem(key);}catch{}};
  const parse=value=>{try{return JSON.parse(value);}catch{return null;}};
  function queue(stage){if(Number.isInteger(stage)&&stage>=1&&stage<=13)write(session,pendingKey,JSON.stringify({stage,at:now()}));}
  function take(state,{preview=false}={}){
   if(preview)return null;
   const pending=parse(read(session,pendingKey));
   if(!pending)return null;
   remove(session,pendingKey);
   const elapsed=now()-pending.at,found=receipt(state,pending.stage);
   if(!Number.isFinite(pending.at)||elapsed<0||elapsed>lifetime||!found||found.day!==state.today||found.stage!==state.completed)return null;
   const parsed=parse(read(storage,seenKey)),seen=Array.isArray(parsed)?parsed.filter(s=>typeof s==='string'):[];
   if(seen.includes(found.id))return null;
   // Consume before playback: refresh, skip and duplicate responses cannot replay it.
   write(storage,seenKey,JSON.stringify([...seen,found.id].slice(-40)));
   return found;
  }
  return {queue,take};
 }
 let browserLedger;
 function ledger(){
  if(!browserLedger){let session,storage;try{session=globalThis.sessionStorage;}catch{}try{storage=globalThis.localStorage;}catch{}browserLedger=createLedger({session,storage});}
  return browserLedger;
 }
 return {receipt,createLedger,pendingKey,seenKey,queue:stage=>ledger().queue(stage),take:(state,options)=>ledger().take(state,options)};
});
