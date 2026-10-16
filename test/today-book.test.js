'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{chooseTodayBook}=require('../shared/domain');
test('new desktop sessions prefer due work and existing plans; explicit choice remains stable',()=>{
 const unplanned={id:1,word_count:1500,new_today:0,plan:{active:false,daily_quota:15}},planned={id:3,word_count:2200,new_today:0,plan:{active:true,daily_quota:20}},due={id:4,word_count:5000,due_review:2,plan:{active:false,daily_quota:15}};
 assert.equal(chooseTodayBook([unplanned,planned]).id,3);
 assert.equal(chooseTodayBook([unplanned,planned,due]).id,4);
 assert.equal(chooseTodayBook([unplanned,planned,due],1).id,1);
 assert.equal(chooseTodayBook([unplanned,{...planned,new_today:20}]).id,3);
 assert.equal(chooseTodayBook([unplanned,planned],999).id,3);
 assert.equal(chooseTodayBook([{...due,read_only:true},planned]).id,3);
 assert.equal(chooseTodayBook([{...due,word_count:0},unplanned]).id,1);
 assert.equal(chooseTodayBook([]),null);
});
