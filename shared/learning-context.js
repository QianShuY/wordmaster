(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordMasterLearningContext=api;})(globalThis,function(){
  'use strict';
  const companion = [
    ['Every journey begins with a single step.','每段旅程都从迈出一步开始。'],
    ['A little practice today makes tomorrow easier.','今天的一点练习，会让明天轻松一些。'],
    ['Take your time and notice the details.','慢慢来，留意眼前的细节。'],
    ['You can pause and begin again.','你可以停一停，再重新开始。'],
    ['There is always something new to discover.','总有新的事物等待发现。'],
    ['Keep a place in your day for learning.','在每天的生活中，为学习留一点时间。'],
    ['The path becomes clearer as you move forward.','随着你向前走，道路会越来越清晰。'],
  ];
  // Original supplementary examples for the early CET6 learning set.
  const examples={
    define:['Can you define this term in your own words?','你能用自己的话解释这个术语吗？'],
    fragrance:['The fragrance of fresh flowers filled the room.','鲜花的芳香弥漫了整个房间。'],
    theft:['The police are investigating the theft of a bicycle.','警方正在调查一起自行车盗窃案。'],
    crush:['Crush the garlic before adding it to the soup.','把大蒜压碎后再加入汤中。'],
    remainder:['She saved the remainder of the cake for tomorrow.','她把剩下的蛋糕留到了明天。'],
    remnant:['A remnant of the old wall still stands near the river.','河边仍矗立着一段旧墙的残迹。'],
    invariably:['He invariably arrives a few minutes early.','他总会提前几分钟到达。'],
    combination:['This dish uses a combination of herbs and spices.','这道菜混合使用了香草和香料。'],
    apology:['She offered an apology for arriving late.','她为迟到表示了歉意。'],
    vital:['Clean water is vital to human health.','洁净的水对人类健康至关重要。'],
    multiply:['Multiply the number by three.','把这个数乘以三。'],
    cholesterol:['The doctor advised him to lower his cholesterol.','医生建议他降低胆固醇水平。'],
    compartment:['She put her bag in the overhead compartment.','她把包放进了头顶的行李舱。'],
    glide:['We watched the birds glide over the lake.','我们看着鸟儿在湖面上滑翔。'],
    sneak:['He tried to sneak out without waking anyone.','他试着偷偷溜出去，不惊醒任何人。'],
    gloomy:['The sky looked gloomy before the storm.','暴风雨来临前，天空显得阴沉。'],
    loyalty:['Her loyalty to her friends never changed.','她对朋友的忠诚从未改变。'],
    bonus:['The company paid its employees a year-end bonus.','公司向员工发放了年终奖金。'],
    velocity:['The velocity of the train increased steadily.','火车的速度稳步提高。'],
    token:['Please accept this gift as a token of our gratitude.','请收下这份礼物，以表我们的谢意。'],
    aisle:['Please keep your bags out of the aisle.','请不要把包放在过道上。']
  };
  function context(word,now=new Date()) {
    if(word.example) return {label:'语境例句',text:word.example,translation:word.example_translation||'',example:true};
    const key=String(word.headword||word.answer_word||word.word||'').trim().toLowerCase();
    const sample=word.source_file&&!word.homograph&&Object.hasOwn(examples,key)?examples[key]:null;
    if(sample)return {label:'语境例句 · 墨词补充',text:sample[0],translation:sample[1],example:true};
    const pair=companion[(now.getFullYear()+now.getMonth()+now.getDate())%companion.length];
    return {label:'今日伴读 · 通用短句',text:pair[0],translation:pair[1],example:false};
  }
  function choiceSummary(meaning) {
    // Keep the dictionary record intact; quiz choices omit phrase notes and other POS entries.
    const core=String(meaning||'').split(/\|\||[｜]{2}/)[0]
      .replace(/^\s*(?:n|v|vt|vi|adj|adv|prep|pron|conj|num|art|int)\.\s*/i,'')
      .split(/\s+(?:n|v|vt|vi|adj|adv|prep|pron|conj|num|art|int)\.\s*/i)[0]
      .replace(/\b\d+\s*[.、)]\s*/g,'；')
      .replace(/[A-Za-z][A-Za-z’' -]*/g,'')
      .replace(/^[；;，,\s]+|[；;，,\s]+$/g,'')
      .replace(/[；;]\s*[；;]+/g,'；');
    return core || '释义待核验';
  }
  function series(rows,days,now=new Date()) {
    const map=new Map(rows.map(row=>[row.day,row]));
    return Array.from({length:days},(_,i)=>{
      const date=new Date(now.getFullYear(),now.getMonth(),now.getDate()-days+1+i);
      const day=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const row=map.get(day)||{};const total=Number(row.total)||0,correct=Number(row.correct)||0;
      return {day,total,correct,new_words:Number(row.new_words)||0,accuracy:total?Math.round(correct/total*100):null};
    });
  }
  return {context,series,choiceSummary};
});
