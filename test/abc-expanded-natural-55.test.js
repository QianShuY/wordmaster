'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { rules } = require('../scripts/audit-abc-example-quality');
const cases = {
  "cet6-015": {
    "reform": [
      "The government promised to reform the public transport system.",
      "政府承诺改革公共交通系统。"
    ],
    "refute": [
      "The scientist used new evidence to refute the claim.",
      "科学家用新证据驳斥了这一说法。"
    ],
    "regulation": [
      "All laboratories must comply with the new safety regulations.",
      "所有实验室都必须遵守新的安全规定。"
    ],
    "rejoice": [
      "The villagers rejoiced when the missing child returned safely.",
      "失踪的孩子平安归来时，村民们欣喜不已。"
    ],
    "release": [
      "The record label will release the album next month.",
      "唱片公司将在下个月发行这张专辑。"
    ],
    "render": [
      "Heavy snowfall rendered the mountain road impassable.",
      "大雪使山路无法通行。"
    ],
    "repay": [
      "She plans to repay the loan within three years.",
      "她打算在三年内还清贷款。"
    ],
    "repel": [
      "The guards repelled an attack on the village.",
      "守卫们击退了对村庄的袭击。"
    ],
    "reproach": [
      "His mother reproached him for ignoring the warning.",
      "母亲责备他不听劝告。"
    ],
    "resolve": [
      "They resolved to finish the repairs before winter.",
      "他们决心在冬天来临前完成修缮。"
    ],
    "restraint": [
      "She showed great restraint and did not respond to the insult.",
      "她表现出极大的克制，没有回击对方的侮辱。"
    ],
    "retort": [
      "He retorted that the accusation was unfair.",
      "他反驳说，这项指控并不公平。"
    ],
    "revelation": [
      "The revelation of the accounting error led to an investigation.",
      "账目错误被揭露后，有关方面展开了调查。"
    ],
    "revenge": [
      "Rather than seek revenge, she reported the attack to the police.",
      "她没有寻求报复，而是向警方报案。"
    ],
    "reverse": [
      "The new policy could reverse the decline in local employment.",
      "新政策可能扭转当地就业人数下降的趋势。"
    ],
    "rivalry": [
      "The rivalry between the two schools lasted for decades.",
      "两所学校之间的竞争持续了数十年。"
    ],
    "robust": [
      "Despite his age, the farmer remained robust and active.",
      "尽管年事已高，这位农民依然身体强健、精力充沛。"
    ],
    "romance": [
      "A romance blossomed between the two musicians during the tour.",
      "巡演期间，两位音乐家之间萌生了一段恋情。"
    ],
    "royalty": [
      "The author receives a royalty for every copy of the book sold.",
      "这本书每卖出一本，作者就能获得一笔版税。"
    ],
    "salute": [
      "The soldiers saluted as the flag was raised.",
      "国旗升起时，士兵们敬了军礼。"
    ]
  },
  "cet4-045": {
    "explore": [
      "We spent the afternoon exploring the caves along the coast.",
      "我们花了一下午探索海岸边的洞穴。"
    ],
    "learn": [
      "The children are learning to swim at the local pool.",
      "孩子们正在当地游泳馆学习游泳。"
    ],
    "prepare": [
      "She prepared a list of questions before the interview.",
      "面试前，她准备了一份问题清单。"
    ],
    "recover": [
      "The police recovered the stolen bicycle near the station.",
      "警方在车站附近找回了被盗的自行车。"
    ],
    "return": [
      "We returned to the village before sunset.",
      "我们在日落前回到了村庄。"
    ],
    "travel": [
      "They travelled by train across the country last summer.",
      "去年夏天，他们乘火车游历了全国。"
    ]
  },
  "cet6-016": {
    "saturate": [
      "The heavy rain saturated the soil overnight.",
      "一夜大雨把土壤浸透了。"
    ],
    "scan": [
      "She scanned the timetable for the next train.",
      "她快速查看时刻表，寻找下一班列车。"
    ],
    "scramble": [
      "The hikers scrambled up the rocky slope.",
      "徒步者手脚并用地爬上了陡峭的岩坡。"
    ],
    "segregate": [
      "The school no longer segregates students by gender.",
      "这所学校不再按性别将学生分开。"
    ],
    "sergeant": [
      "The sergeant briefed the soldiers before the patrol.",
      "巡逻前，中士向士兵们说明了任务。"
    ],
    "serial": [
      "The magazine published the story in serial form.",
      "这家杂志以连载形式刊登了这个故事。"
    ],
    "settle": [
      "After years abroad, the couple settled in a small town.",
      "在国外生活多年后，这对夫妇在一座小镇定居下来。"
    ],
    "shove": [
      "Someone shoved me as I stepped onto the crowded train.",
      "我走上拥挤的列车时，有人推了我一把。"
    ],
    "shrug": [
      "She shrugged when asked about the broken vase.",
      "被问起打碎的花瓶时，她耸了耸肩。"
    ],
    "sip": [
      "He sipped his tea while reading the letter.",
      "他一边读信，一边小口啜饮茶水。"
    ],
    "slaughter": [
      "The documentary examines the slaughter of animals for food.",
      "这部纪录片探讨了为获取食物而屠宰动物的问题。"
    ],
    "snatch": [
      "A thief snatched her bag and ran into the crowd.",
      "一名小偷抢走了她的包，钻进人群逃跑了。"
    ]
  },
  "cet6-017": {
    "specialty": [
      "Fresh seafood is a specialty of this coastal town.",
      "新鲜海鲜是这座海滨小镇的特色美食。"
    ],
    "stab": [
      "She stabbed a potato with a fork to check whether it was cooked.",
      "她用叉子戳了戳土豆，看看是否煮熟。"
    ],
    "stabilize": [
      "Doctors worked through the night to stabilize the patient.",
      "医生们彻夜努力，使患者的病情稳定下来。"
    ],
    "startle": [
      "The sudden alarm startled everyone in the office.",
      "突然响起的警报吓了办公室里的所有人一跳。"
    ],
    "streamline": [
      "The company streamlined its approval process to save time.",
      "公司精简了审批流程以节省时间。"
    ],
    "stride": [
      "She strode across the platform to catch the train.",
      "她大步穿过站台去赶火车。"
    ],
    "stroll": [
      "We strolled along the river after dinner.",
      "晚饭后，我们沿着河边散步。"
    ],
    "stumble": [
      "He stumbled over a loose stone on the path.",
      "他被小路上一块松动的石头绊了一下。"
    ],
    "stun": [
      "The unexpected result stunned the researchers.",
      "意想不到的结果让研究人员震惊不已。"
    ]
  },
  "cet6-018": {
    "surge": [
      "Demand for electric cars surged after the subsidy was announced.",
      "补贴政策公布后，电动汽车的需求激增。"
    ],
    "tack": [
      "We need to take a different tack if this plan fails.",
      "如果这个计划行不通，我们需要换一种思路。"
    ],
    "tangle": [
      "Strong winds tangled the fishing lines.",
      "大风把钓鱼线缠在了一起。"
    ],
    "telecommunication": [
      "The island relies on telecommunication links to contact the mainland.",
      "这座岛屿依靠通信线路与大陆保持联系。"
    ],
    "thanksgiving": [
      "The villagers held a ceremony of thanksgiving after the harvest.",
      "丰收之后，村民们举行了感恩仪式。"
    ],
    "therefore": [
      "The road was flooded; therefore, the buses had to turn back.",
      "道路被水淹没，因此公交车不得不折返。"
    ],
    "tickle": [
      "The feathers tickled the baby's feet and made her laugh.",
      "羽毛挠得宝宝脚底发痒，逗得她笑了起来。"
    ],
    "tow": [
      "A truck arrived to tow the broken-down car away.",
      "一辆拖车赶来，把抛锚的汽车拖走。"
    ]
  }
};
// Candidates are not verified dictionary entries.
test('55 bilingual CET4/CET6 rewrites retain source identity and review status', () => {
 let n = 0;
 for (const [id, words] of Object.entries(cases)) {
  const task = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/model-task-results/worker-A', id, 'result.json'), 'utf8'));
  assert.equal(task.task_id, id);
  for (const [word, [en, cn]] of Object.entries(words)) {
   const matching = task.entries.filter(e => e.identity.word === word);
   assert.equal(matching.length, 1, id + '/' + word);
   const e = matching[0];
   assert.equal(e.identity.source_file, id.startsWith('cet4') ? 'cet4.txt' : 'cet6.txt');
   assert.ok(e.original && e.original.meaning);
   assert.equal(e.verification, 'needs-review');
   assert.equal(e.external_human_review, false);
   assert.equal(e.full_dictionary_senses_reviewed, false);
   assert.deepEqual(e.evidence, []);
   assert.equal(e.draft_method, 'editorial-context-rewrite-needs-review');
   assert.equal(e.proposed.example, en);
   assert.equal(e.proposed.example_translation, cn);
   assert.doesNotMatch(cn, /[“”]/);
   const flagged = rules.filter(rule => rule.pattern.test(rule.id === 'translation-metalinguistic' ? cn : en));
   assert.deepEqual(flagged.map(rule => rule.id), [], id + '/' + word);
   n++;
  }
 }
 assert.equal(n, 55);
});
test('CET6 regulation source POS conflict stays visible, not silently rewritten', () => {
 const task = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/model-task-results/worker-A/cet6-015/result.json'), 'utf8'));
 const e = task.entries.find(e => e.identity.word === 'regulation');
 assert.equal(e.original.pos, 'v.');
 assert.match(e.issues.join(' '), /名词用法/);
 assert.equal(e.verification, 'needs-review');
});
