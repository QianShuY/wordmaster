'use strict';
// An in-app spelling surface, not an Android-wide input method. It only edits
// the visible answer input and emits the same input/submit events as the IME.
(function(root){
 function edit(value,start,end,key,max=150){
  value=String(value||'');start=Math.max(0,Math.min(value.length,start??value.length));end=Math.max(start,Math.min(value.length,end??start));
  if(key==='left'||key==='right')return {value,caret:key==='left'?(start===end?Math.max(0,start-1):start):(start===end?Math.min(value.length,end+1):end)};
  if(key==='backspace'){if(start===end)start=Math.max(0,start-1);return {value:value.slice(0,start)+value.slice(end),caret:start};}
  if(key==='delete'){if(start===end)end=Math.min(value.length,end+1);return {value:value.slice(0,start)+value.slice(end),caret:start};}
  const text=key==='space'?' ':key;
  if(!/^[a-z'-]$|^ $/i.test(text))return {value,caret:end};
  if(value.length-(end-start)+text.length>max)return {value,caret:end};
  return {value:value.slice(0,start)+text+value.slice(end),caret:start+text.length};
 }
 const svg=path=>`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${path}"/></svg>`;
 function markup(){
  const key=(value,label=value,extra='')=>`<button type="button" data-word-key="${value}" ${extra}>${label}</button>`;
  return `<div class="word-keyboard-inner"><div class="word-keyboard-top"><span>墨词 <i>/</i> 拼写</span>${key('sound',svg('M4 9h4l5-4v14l-5-4H4ZM17 8a6 6 0 0 1 0 8')+'<small>读音</small>','aria-label="听读音提示"')}${key('system','系统键盘','class="keyboard-switch" aria-label="切换系统键盘"')}</div><div class="word-key-row">${[...'qwertyuiop'].map(c=>key(c,c.toUpperCase(),`aria-label="字母 ${c.toUpperCase()}"`)).join('')}</div><div class="word-key-row middle">${[...'asdfghjkl'].map(c=>key(c,c.toUpperCase(),`aria-label="字母 ${c.toUpperCase()}"`)).join('')}</div><div class="word-key-row lower">${[...'zxcvbnm'].map(c=>key(c,c.toUpperCase(),`aria-label="字母 ${c.toUpperCase()}"`)).join('')}${key('backspace',svg('m9 5-7 7 7 7h12V5Zm3 4 6 6m0-6-6 6'),'class="key-delete" aria-label="删除一个字母"')}</div><div class="word-key-row utilities">${key('left','←','aria-label="光标左移"')}${key('-','−','aria-label="连字符"')}${key("apostrophe","’",'aria-label="撇号"')}${key('space','空格','class="key-space"')}${key('right','→','aria-label="光标右移"')}${key('submit','落笔 '+svg('M5 12h14m-6-6 6 6-6 6'),'class="key-submit" aria-label="提交拼写"')}</div></div>`;
 }
 function install(doc,{storage,busy=()=>false,onSound=()=>{}}={}){
  const win=doc.defaultView,host=doc.getElementById('wordKeyboard');
  if(!host)return {sync(){}};
  let input=null,system=false,ink=null;
  try{system=storage?.getItem('moci-spelling-keyboard')==='system';}catch{}
  host.innerHTML=markup();
  function measure(){doc.documentElement.style.setProperty('--word-keyboard-height',host.hidden?'0px':host.getBoundingClientRect().height+'px');}
  function sync(){
   const next=doc.querySelector('#spellInput, #battleForm[data-kind="answer"] #battleInput'),changed=next!==input;
   if(next!==input&&input){input.readOnly=false;input.inputMode='text';}
   input=next;const active=Boolean(input&&!system);
   if(changed&&input)input.setSelectionRange(input.value.length,input.value.length);
   if(input){input.readOnly=!system;input.inputMode=system?'text':'none';input.dataset.wordKeyboard=system?'system':'custom';
    if(active){input.setAttribute('aria-describedby','wordKeyboardHelp');input.placeholder='用下方字母键写下答案';}
    else{input.removeAttribute('aria-describedby');input.placeholder='使用手机输入法拼写';}
   }
   host.hidden=!active;doc.body.classList.toggle('word-keyboard-open',active);
   if(active&&input.parentElement){
    if(!input.closest('.word-answer')){const wrap=doc.createElement('div');wrap.className='word-answer';input.before(wrap);wrap.append(input);}
    const wrap=input.parentElement;ink=wrap.querySelector('.word-answer-ink');
    if(!ink){ink=doc.createElement('div');ink.className='word-answer-ink';ink.setAttribute('aria-hidden','true');wrap.append(ink);}
    wrap.classList.add('custom-answer');const style=win.getComputedStyle(input);ink.style.font=style.font;ink.style.letterSpacing=style.letterSpacing;paintCursor();
   }else{input?.closest('.word-answer')?.classList.remove('custom-answer');ink=null;}
   const form=input?.form;let toggle=doc.getElementById('useWordKeyboard');
   if(input&&system){if(!toggle){toggle=doc.createElement('button');toggle.id='useWordKeyboard';toggle.type='button';toggle.textContent='切回墨词字母键盘';toggle.className='use-word-keyboard';form.append(toggle);}}
   else toggle?.remove();
   measure();
  }
  function paintCursor(){
   if(!input||!ink||system)return;
   const a=input.selectionStart??input.value.length,b=input.selectionEnd??a;
   const line=doc.createElement('span');line.className='word-answer-line';
   line.append(doc.createTextNode(input.value.slice(0,a)));
   const caret=doc.createElement('i');caret.className=a===b?'word-caret':'word-selection';caret.textContent=input.value.slice(a,b);line.append(caret,doc.createTextNode(input.value.slice(b)));
   if(!input.value)line.classList.add('empty-answer');
   ink.replaceChildren(line);const x=caret.offsetLeft;ink.scrollLeft=Math.max(0,x-ink.clientWidth+20);
  }
  function mode(useSystem){system=useSystem;input?.blur();try{storage?.setItem('moci-spelling-keyboard',system?'system':'custom');}catch{}sync();input?.focus({preventScroll:true});if(!system)input?.setSelectionRange(input.value.length,input.value.length);}
  function write(key){
   if(!input||system||busy()||!input.isConnected||doc.querySelector('dialog[open]'))return;
   const result=edit(input.value,input.selectionStart,input.selectionEnd,key==='apostrophe'?"'":key,input.maxLength>0?input.maxLength:150);
   const changed=result.value!==input.value;input.value=result.value;input.focus({preventScroll:true});input.setSelectionRange(result.caret,result.caret);
   if(changed)input.dispatchEvent(new win.Event('input',{bubbles:true}));paintCursor();
  }
  // Preserve the answer's selection while tapping the separate key surface.
  host.addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.preventDefault();});
  host.addEventListener('click',e=>{
   const key=e.target.closest('[data-word-key]')?.dataset.wordKey;
   if(!key||!input||busy()||doc.querySelector('dialog[open]'))return;
   if(key==='system')return mode(true);
   if(key==='sound')return onSound(input.id==='battleInput'?'battleSpeak':'speak');
   if(key==='submit'){input.form?.querySelector('[type="submit"]')?.click();return;}
   write(key);
  });
  doc.addEventListener('click',e=>{if(e.target.closest('#useWordKeyboard'))mode(false);});
  doc.addEventListener('selectionchange',paintCursor);
  doc.addEventListener('keydown',e=>{
   if(system||e.target!==input||e.isComposing||e.ctrlKey||e.metaKey||e.altKey)return;
   const keys={ArrowLeft:'left',ArrowRight:'right',Backspace:'backspace',Delete:'delete',' ':'space'};
   const key=keys[e.key]||(/^[a-z'-]$/i.test(e.key)?e.key:null);
   if(key){e.preventDefault();write(key);}
   else if(e.key==='Enter'){e.preventDefault();if(!e.repeat&&!busy())input.form?.querySelector('[type="submit"]')?.click();}
  });
  if(win.ResizeObserver)new win.ResizeObserver(measure).observe(host);
  win.addEventListener?.('resize',sync);
  // Observe only route content replacement, never countdown/text/FX changes:
  // those must not move the caret or steal focus during an answer.
  if(win.MutationObserver)new win.MutationObserver(()=>sync()).observe(doc.getElementById('app'),{childList:true});
  sync();return {sync};
 }
 const api={edit,install};if(typeof module==='object'&&module.exports)module.exports=api;else root.MociWordKeyboard=api;
})(typeof window==='object'?window:globalThis);
