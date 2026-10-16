(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordMasterJsonRequest=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 // Share only concurrent reads. Completed responses are never cached, and every
 // caller gets its own object so a card preview cannot mutate real ownership.
 function create(fetcher){
  const pending=new Map();
  async function perform(url,opts){
   const response=await fetcher(url,opts&&{method:opts.method||'GET',headers:{'Content-Type':'application/json'},body:opts.body?JSON.stringify(opts.body):undefined});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||`请求失败 (${response.status})`);
   return data;
  }
  return async function request(url,opts){
   const reading=!opts||!opts.method||opts.method.toUpperCase()==='GET';
   if(!reading){pending.clear();try{return await perform(url,opts);}finally{pending.clear();}}
   let task=pending.get(url);
   if(!task){task=perform(url,opts);pending.set(url,task);}
   try{return structuredClone(await task);}finally{if(pending.get(url)===task)pending.delete(url);}
  };
 }
 return {create};
});
