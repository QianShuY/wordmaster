'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Domain=require('../shared/domain'),Context=require('../shared/learning-context'),Journal=require('../shared/journal');
test('due recalls advance spaced intervals, early drills cannot postpone due dates, failures reset',()=>{
  const now=new Date(2026,9,11,12);
  assert.deepEqual(Domain.recallSchedule(null,true,now),{level:1,modifier:'+1 days',preserveDue:null});
  const future={review_level:3,next_due:'2026-10-12 12:00:00'};
  assert.deepEqual(Domain.recallSchedule(future,true,now),{level:3,modifier:null,preserveDue:future.next_due});
  assert.equal(Domain.recallSchedule({...future,next_due:'2026-10-11 12:00:00'},true,now).modifier,'+7 days');
  assert.equal(Domain.recallSchedule({review_level:6,next_due:'2026-10-01 00:00:00'},true,now).modifier,'+30 days');
  assert.deepEqual(Domain.recallSchedule(future,false,now),{level:0,modifier:'+10 minutes',preserveDue:null});
  for(let level=0;level<6;level++)assert.equal(Domain.recallSchedule({review_level:level,next_due:'2026-10-01 00:00:00'},true,now).modifier,`+${[1,2,4,7,15,30][level]} days`);
});
test('calendar chart retains gaps and null accuracy; companion prose is never passed off as a word example',()=>{
  const rows=Context.series([{day:'2026-10-10',total:2,correct:0,new_words:3}],3,new Date(2026,9,11));
  assert.deepEqual(rows.map(d=>d.day),['2026-10-09','2026-10-10','2026-10-11']);
  assert.deepEqual(rows.map(d=>d.accuracy),[null,0,null]);
  assert.equal(Context.context({word:'unlisted-test-word'}).example,false);
  assert.equal(Context.context({example:'A real sentence.',example_translation:'例句'}).example,true);
});
test('album reveals at most two unowned previews per chapter and never reveals hidden art',()=>{
  const cards=Journal.chapters.flatMap(c=>c.palettes.map(palette=>({palette,owned:false,hidden:false})));
  cards.push({palette:'secret',owned:false,hidden:true});
  const previews=Journal.previews(cards);assert.equal(previews.length,6);assert.ok(!previews.includes('secret'));
  for(const chapter of Journal.chapters)assert.ok(previews.includes(chapter.cover));
  cards.forEach(c=>{c.owned=true;});assert.deepEqual(Journal.previews(cards),[]);
});

test('choice labels omit phrase notes without changing raw grading values',()=>{
  const raw='1. (织布机的)梭 2. 定期的短程往返班机(车) || shuttle diplomacy穿梭外交 /shuttle service穿梭营运 v. 穿梭般往返';
  const summary=Context.choiceSummary(raw);
  assert.ok(summary.includes('短程往返班机'));
  assert.ok(!/[A-Za-z]|\|\||穿梭外交/.test(summary));
  assert.equal(Context.choiceSummary('家庭，户 adj. 家庭的，家常的，普通的'),'家庭，户');
  assert.equal(Context.context({word:'define',source_file:'cet6.txt'}).example,true);
  assert.match(Context.context({word:'define',source_file:'cet6.txt'}).text,/define/);
});
