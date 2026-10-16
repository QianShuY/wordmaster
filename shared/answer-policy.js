(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordMasterAnswerPolicy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const normalize=value=>String(value??'').normalize('NFC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
 const form=value=>typeof value==='string'&&value.length>0&&value.length<=100&&/^[\p{Script=Latin}\p{M}]+(?:[.' -][\p{Script=Latin}\p{M}]+)*\.?$/u.test(value);
 function create(headword,accepted=[headword],rejected=[]){
  if(!form(headword)||!Array.isArray(accepted)||!accepted.length||accepted.length>12||!accepted.every(form)||!Array.isArray(rejected)||!rejected.every(form))throw new Error('Invalid reviewed spelling forms');
  const yes=[...new Set(accepted.map(normalize))],no=[...new Set(rejected.map(normalize))];
  if(!yes.includes(normalize(headword))||yes.some(x=>no.includes(x)))throw new Error('Conflicting reviewed spelling forms');
  return {version:1,headword,accepted:yes,rejected:no};
 }
 function grade(policy,value){
  if(policy?.version!==1||!Array.isArray(policy.accepted)||!Array.isArray(policy.rejected))return false;
  const answer=normalize(value);return !policy.rejected.includes(answer)&&policy.accepted.includes(answer);
 }
 function bound(policy,headword){
  if(policy?.version!==1||normalize(policy.headword)!==normalize(headword))return null;
  try{const checked=create(policy.headword,policy.accepted,policy.rejected);
   return JSON.stringify(checked.accepted)===JSON.stringify(policy.accepted)&&JSON.stringify(checked.rejected)===JSON.stringify(policy.rejected)?checked:null;
  }catch{return null;}
 }
 return {normalize,create,grade,bound};
});
