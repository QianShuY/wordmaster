'use strict';
// Explicit taps commit the text visible in the input, even while an Android
// English IME marks it as composing. Enter used to select an IME candidate does
// not submit a form. Share the same behavior with learning and battle inputs.
(function(root){
 function install(doc,submit,clock=()=>Date.now()){
  let composingInput=null,blockedInput=null,blockedUntil=0;
  const supported=form=>form&&['battleForm','spellForm','searchForm'].includes(form.id);
  doc.addEventListener('compositionstart',e=>{composingInput=e.target;});
  doc.addEventListener('compositionend',e=>{if(composingInput===e.target)composingInput=null;});
  doc.addEventListener('focusout',e=>{if(composingInput===e.target)composingInput=null;});
  doc.addEventListener('keydown',e=>{
   if(!supported(e.target.form)||!(e.key==='Enter'||e.keyCode===13))return;
   if(e.isComposing||composingInput===e.target||e.keyCode===229){
    if(e.key==='Enter')e.preventDefault();blockedInput=e.target;blockedUntil=clock()+200;
   }
  });
  doc.addEventListener('click',e=>{
   const button=e.target.closest('button');
   if(!button||button.type!=='submit'||!supported(button.form)||button.disabled)return;
   e.preventDefault();blockedInput=null;blockedUntil=0;
   const input=button.form.querySelector('input');input?.blur();composingInput=null;
   void submit(button.form);
  });
  doc.addEventListener('submit',e=>{
   if(!supported(e.target))return;e.preventDefault();
   const input=e.target.querySelector('input');
   if(composingInput===input||blockedInput===input&&clock()<blockedUntil)return;
   void submit(e.target);
  });
 }
 const api={install};if(typeof module==='object'&&module.exports)module.exports=api;else root.MociFormInput=api;
})(typeof window==='object'?window:globalThis);
