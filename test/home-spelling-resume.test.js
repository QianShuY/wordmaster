'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('resuming one spelling group never describes all later review words as already having passed meaning',()=>{
 const source=fs.readFileSync(require.resolve('../static/app.js'),'utf8'),start=source.indexOf('const DesktopHub = {'),end=source.indexOf('\n};',start)+3;
 const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{style:{},classList:{toggle(){},add(){}},setAttribute(){}});return nodes.get(id);};
 const checkpoint={stage:'review-spelling',total:10,done:4,phaseDone:false,flow:{learnTotal:10,reviewTotal:10}};
 const context=vm.createContext({IS_ANDROID_APP:false,$:node,Date,Math,Number,String,Boolean,esc:s=>s,
  localStorage:{getItem:()=>true},sessionStorage:{getItem:()=>false},Home:{stats:{},instanceId:'test'},
  Domain:{localDayKey:()=> '2026-10-22'},DesktopCheckpoint:{read:()=>checkpoint,resumePendingSpelling:s=>s,progress:()=>({achieved:4,expected:20,steps:{review:10,learn:0}})}});
 vm.runInContext(source.slice(start,end)+';globalThis.hub=DesktopHub;',context);
 const book={id:1,name:'样本',word_count:98,plan:{remaining_new:20,daily_quota:20},workload:{review_remaining:22,new_pending:0,new_remaining:10,new_target:10}};
 context.hub.render([book],book,0);
 assert.match(node('#hubActionSummary').textContent,/本组 6 个词/);
 assert.match(node('#hubActionSummary').textContent,/其余 16 个复习词会另分组/);
 assert.equal(node('#hubReviewLabel').textContent,'待完成复习');
 assert.equal(node('#hubDueCount').innerHTML,'22 <small>词</small>');
 book.workload.review_remaining=6;context.hub.render([book],book,0);
 assert.equal(node('#hubReviewLabel').textContent,'待完成拼写');assert.ok(!node('#hubActionSummary').textContent.includes('其余'));
 checkpoint.done=10;checkpoint.phaseDone=true;book.workload.review_remaining=16;context.hub.render([book],book,0);
 assert.match(node('#hubActionSummary').textContent,/本组拼写已完成/);assert.match(node('#hubActionSummary').textContent,/其余 16 个复习词/);
});
