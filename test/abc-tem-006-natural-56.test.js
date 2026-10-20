'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { rules } = require('../scripts/audit-abc-example-quality');
const task = JSON.parse(fs.readFileSync('docs/model-task-results/worker-A/tem-006/result.json','utf8'));
const expected = [[0,"attest","The witness could attest to the accuracy of the report.","证人可以证实报告的准确性。"],[1,"attic","They found an old trunk in the attic.","他们在阁楼里发现了一只旧箱子。"],[7,"attrition","The company lost experienced staff through gradual attrition.","公司因人员逐渐流失而失去了有经验的员工。"],[8,"auction","The old piano was sold at auction on Saturday.","那架旧钢琴星期六在拍卖会上售出。"],[9,"auctioneer","The auctioneer opened the bidding at two hundred pounds.","拍卖师以两百英镑起拍。"],[10,"audacious","Her audacious plan to cross the desert alone worried her friends.","她独自穿越沙漠的大胆计划让朋友们十分担心。"],[11,"audible","His voice was barely audible over the traffic.","车流声太大，几乎听不见他的声音。"],[12,"audio","The teacher uploaded an audio recording of the lecture.","老师上传了一份讲座录音。"],[13,"audiovisuals","The school bought new audiovisuals for its language classes.","学校为语言课购置了新的视听教具。"],[14,"audit","An independent firm will audit the company's accounts.","一家独立公司将审计这家公司的账目。"],[15,"audition","She has an audition for the school play on Friday.","她周五要参加学校话剧的试演。"],[16,"auditor","The auditor found an error in the annual accounts.","审计员在年度账目中发现了一处错误。"],[20,"august","The august judge entered the courtroom in silence.","威严的法官默默走进法庭。"],[21,"aura","The old library had an aura of quiet mystery.","这座老图书馆弥漫着静谧而神秘的气息。"],[23,"auspicious","Clear skies seemed an auspicious sign for the voyage.","晴朗的天空似乎是这次航行的吉兆。"],[24,"austere","The room was austere, with bare walls and a wooden desk.","房间布置简朴，只有光秃秃的墙壁和一张木桌。"],[25,"austerity","Her austerity showed in the simple meals she ate and the clothes she wore.","从简单的饮食和朴素的衣着中，可以看出她生活十分简朴。"],[26,"Australian","An Australian scientist joined the research team.","一位澳大利亚科学家加入了研究团队。"],[28,"authorise authorize","The manager must authorise any purchase over five hundred pounds.","超过五百英镑的采购都必须由经理批准。"],[29,"authoritarian","The authoritarian leader banned public protests.","这位专制领导人禁止公众抗议。"],[30,"authoritative","The museum published an authoritative guide to the collection.","博物馆出版了一本介绍馆藏的权威指南。"],[31,"autobiography","In her autobiography, she describes growing up by the sea.","她在自传中讲述了自己在海边长大的经历。"],[32,"autocrat","The autocrat refused to share power with parliament.","这位独裁者拒绝与议会分享权力。"],[33,"autocratic","Employees complained about the director's autocratic management style.","员工抱怨主管专断的管理方式。"],[34,"autograph","The singer signed an autograph for a young fan.","歌手给一位小粉丝签了名。"],[35,"automate","The factory plans to automate its packaging line next year.","工厂计划明年将包装生产线自动化。"],[39,"autopsy","An autopsy was ordered to determine the cause of death.","为查明死因，有关方面下令进行尸检。"],[41,"avail","She availed herself of the free training offered by the company.","她利用了公司提供的免费培训机会。"],[42,"availability","Please check the availability of seats before booking.","预订前请确认是否还有座位。"],[43,"avalanche","An avalanche blocked the mountain road after heavy snowfall.","大雪过后，一场雪崩堵住了山路。"],[44,"avenge","He swore to avenge his brother's death.","他发誓要为兄弟之死报仇。"],[48,"avid","She is an avid reader who finishes a novel every week.","她是个热衷阅读的人，每周读完一本小说。"],[50,"awake","He awoke to the sound of rain on the roof.","他被屋顶上的雨声惊醒。"],[51,"awaken","The noise awakened everyone in the house.","噪声吵醒了屋里的所有人。"],[52,"award","The committee awarded her a scholarship for her research.","委员会因她的研究成果向她颁发了奖学金。"],[53,"awareness","The campaign raised awareness of road safety.","这次宣传活动提高了人们的道路安全意识。"],[54,"awe","The children stared in awe at the enormous waterfall.","孩子们怀着敬畏之情望着巨大的瀑布。"],[56,"awkwardly","She held the heavy box awkwardly and nearly dropped it.","她笨拙地抱着沉重的箱子，差点把箱子掉在地上。"],[57,"axe ax","He used an axe to chop the fallen branches.","他用斧头砍断倒下的树枝。"],[58,"axiom","The proof begins with an axiom accepted by all students.","这个证明从所有学生都接受的一条公理开始。"],[60,"axle","The mechanic replaced the broken axle on the truck.","修车师傅更换了卡车上损坏的车轴。"],[61,"babble","The toddler began to babble happily in her cot.","小宝宝在婴儿床里开心地咿呀学语。"],[62,"baby-sit","She agreed to baby-sit her neighbour's children on Saturday.","她答应星期六帮邻居照看孩子。"],[64,"backbiting","Constant backbiting damaged trust within the team.","不断在背后说坏话破坏了团队内部的信任。"],[65,"backbone","Small businesses form the backbone of the local economy.","小企业是当地经济的支柱。"],[66,"backbreaking","Harvesting the crop by hand was backbreaking work.","手工收割庄稼是一项令人筋疲力尽的重体力活。"],[67,"backdate","The insurer agreed to backdate the policy to the start of the month.","保险公司同意将保单生效日期追溯至月初。"],[68,"backdrop","Snow-covered mountains formed the backdrop to the village.","白雪覆盖的群山构成了村庄的背景。"],[69,"backfire","His attempt to hide the mistake backfired when the truth emerged.","真相曝光后，他试图掩盖错误的做法反而适得其反。"],[70,"backhand","She won the point with a powerful backhand.","她用一记有力的反手击球赢下这一分。"],[71,"backside","He slipped on the ice and landed on his backside.","他在冰上滑倒，一屁股坐在地上。"],[72,"backup","Keep a backup of your photos on an external drive.","把照片的备份保存在外置硬盘上。"],[73,"backwards","He stepped backwards to make room for the trolley.","他向后退了一步，给手推车让出空间。"],[74,"backwater","The village was once a quiet backwater far from the main roads.","这个村庄曾是远离交通干道的偏僻小地方。"],[80,"bad-tempered","The bad-tempered customer complained about every dish.","那位脾气暴躁的顾客对每道菜都挑剔。"],[81,"baffle","The sudden change in the schedule baffled the students.","日程突然改变，让学生们摸不着头脑。"]];
test('TEM-006: 56 source-locked bilingual examples remain unverified', () => {
  assert.equal(task.task_id, 'tem-006');
  assert.equal(task.entries.length, 100);
  assert.equal(expected.length, 56);
  assert.equal(new Set(expected.map(x => x[0])).size, 56);
  for (const [index, word, english, chinese] of expected) {
    const row = task.entries[index];
    assert.equal(row.identity.word, word, 'source identity at '+index);
    assert.equal(row.identity.source_file, undefined === row.identity.source_file ? undefined : row.identity.source_file);
    assert.equal(row.verification, 'needs-review', word);
    assert.equal(row.external_human_review, false, word);
    assert.equal(row.full_dictionary_senses_reviewed, false, word);
    assert.deepEqual(row.evidence, [], word);
    assert.equal(row.draft_method, 'editorial-context-rewrite-needs-review', word);
    assert.equal(row.proposed.example, english, word);
    assert.equal(row.proposed.example_translation, chinese, word);
    assert.ok(!/[“”]/.test(chinese), word);
    const flagged = rules.filter(rule => rule.pattern.test(
      rule.id === 'translation-metalinguistic' ? chinese : english
    )).map(rule => rule.id);
    assert.deepEqual(flagged, [], 'template remains for '+word);
  }
});
test('TEM-006: special spellings and safety-sensitive usage have contexts', () => {
  assert.match(task.entries[28].proposed.example, /authorise any purchase/);
  assert.match(task.entries[57].proposed.example, /an axe to chop/);
  assert.match(task.entries[41].proposed.example, /availed herself of/);
  assert.match(task.entries[44].proposed.example, /avenge his brother/);
  assert.doesNotMatch(task.entries[44].proposed.example, /encouraged to/i);
});
