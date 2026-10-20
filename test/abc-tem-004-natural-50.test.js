'use strict';
/** TEM-004 editorial examples are candidate drafts, not externally verified. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { rules } = require('../scripts/audit-abc-example-quality');
const task = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/model-task-results/worker-A/tem-004/result.json'), 'utf8'));
const expected = new Map([
  [
    0,
    "annex",
    "The kingdom tried to annex the neighboring province after the war.",
    "该王国试图在战后吞并邻近的省份。"
  ],
  [
    1,
    "annihilate",
    "The defending troops managed to annihilate the invading force.",
    "守军成功歼灭了入侵部队。"
  ],
  [
    2,
    "announcement",
    "The principal made an announcement about the exam schedule.",
    "校长发布了关于考试安排的通知。"
  ],
  [
    4,
    "annoyance",
    "The constant buzzing of the light was a minor annoyance.",
    "灯具持续的嗡嗡声让人有些心烦。"
  ],
  [
    5,
    "annuity",
    "She receives a small annuity each year after retirement.",
    "她退休后每年领取一笔小额年金。"
  ],
  [
    6,
    "annul",
    "The court agreed to annul the contract because it had been signed under pressure.",
    "法院同意撤销这份在胁迫下签署的合同。"
  ],
  [
    7,
    "anode",
    "In this electrolytic cell, the anode is connected to the positive terminal.",
    "在这个电解池中，阳极与正极端子相连。"
  ],
  [
    8,
    "anomaly",
    "The engineer noticed an anomaly in the temperature readings.",
    "工程师发现温度读数存在异常。"
  ],
  [
    9,
    "anonymity",
    "The survey promised anonymity to everyone who responded.",
    "调查承诺让所有答卷者保持匿名。"
  ],
  [
    10,
    "antagonism",
    "Years of antagonism between the two neighbors made cooperation difficult.",
    "两位邻居多年的对立让合作变得困难。"
  ],
  [
    11,
    "antagonist",
    "The novel's antagonist tries to prevent the hero from returning home.",
    "小说中的反派试图阻止主人公回家。"
  ],
  [
    12,
    "antagonize",
    "His dismissive remarks only antagonized the audience.",
    "他轻蔑的言论只会引起听众反感。"
  ],
  [
    13,
    "antarctic",
    "Antarctic winds made the research station difficult to reach.",
    "南极的强风使科考站难以抵达。"
  ],
  [
    14,
    "antecedent",
    "The researchers examined antecedent conditions before the outbreak.",
    "研究人员考察了疫情暴发前的情况。"
  ],
  [
    15,
    "antelope",
    "An antelope ran across the grassland at dawn.",
    "黎明时，一只羚羊跑过草原。"
  ],
  [
    17,
    "anthem",
    "The crowd stood as the national anthem began.",
    "国歌响起时，人群起立。"
  ],
  [
    18,
    "anthology",
    "This anthology brings together poems by young writers.",
    "这本诗集收录了青年作家的诗歌。"
  ],
  [
    19,
    "anthropology",
    "She studied anthropology to learn how different societies organize family life.",
    "她学习人类学，以了解不同社会如何组织家庭生活。"
  ],
  [
    20,
    "antibiotic",
    "The doctor prescribed an antibiotic for the bacterial infection.",
    "医生为这种细菌感染开了一种抗生素。"
  ],
  [
    21,
    "antibody",
    "The blood test detected an antibody to the virus.",
    "血液检测发现了针对这种病毒的抗体。"
  ],
  [
    22,
    "antic",
    "One of the clown's antics made the audience burst into laughter.",
    "小丑的一个滑稽举动逗得观众哈哈大笑。"
  ],
  [
    23,
    "anticipation",
    "The children waited in anticipation for the curtain to rise.",
    "孩子们满怀期待地等待幕布升起。"
  ],
  [
    24,
    "antidote",
    "The hospital kept an antidote for that particular poison.",
    "医院备有针对那种毒物的解毒剂。"
  ],
  [
    25,
    "antilogarithm",
    "To find the original value, calculate the antilogarithm of the result.",
    "要得到原始数值，需要计算结果的反对数。"
  ],
  [
    26,
    "antipathy",
    "She felt a strong antipathy toward the unfair policy.",
    "她对这项不公平的政策十分反感。"
  ],
  [
    27,
    "antiquity",
    "The collector donated a Roman antiquity to the museum.",
    "收藏家向博物馆捐赠了一件古罗马文物。"
  ],
  [
    28,
    "antiseptic",
    "The nurse cleaned the wound with an antiseptic solution.",
    "护士用消毒液清洁伤口。"
  ],
  [
    29,
    "antler",
    "The deer had a broken antler after the fight.",
    "那只鹿打斗后有一支鹿角断了。"
  ],
  [
    30,
    "antonym",
    "She wrote an antonym beside each word in her notebook.",
    "她在笔记本里每个单词旁都写了一个反义词。"
  ],
  [
    31,
    "anus",
    "The anatomy diagram labels the anus at the end of the digestive tract.",
    "解剖图标出了消化道末端的肛门。"
  ],
  [
    32,
    "anxiously",
    "She waited anxiously for news of the missing hikers.",
    "她焦急地等待失踪徒步者的消息。"
  ],
  [
    33,
    "any",
    "Do you have any questions about the new timetable?",
    "你对新时刻表有什么疑问吗？"
  ],
  [
    34,
    "anymore",
    "He doesn't live in this neighborhood anymore.",
    "他已经不住在这个街区了。"
  ],
  [
    35,
    "anytime",
    "You can visit the exhibition anytime before Sunday.",
    "你可以在星期日之前的任何时间参观展览。"
  ],
  [
    36,
    "apace",
    "Work on the new bridge continued apace throughout the summer.",
    "整个夏天，新桥的建设都在快速推进。"
  ],
  [
    37,
    "apartheid",
    "The exhibition documents resistance to apartheid in South Africa.",
    "这场展览记录了南非反对种族隔离制度的斗争。"
  ],
  [
    38,
    "apathy",
    "Voter apathy worried the volunteers working on the campaign.",
    "选民的冷漠让参与竞选活动的志愿者感到担忧。"
  ],
  [
    39,
    "ape",
    "A young ape climbed onto the fallen tree.",
    "一只年幼的类人猿爬上了倒下的树干。"
  ],
  [
    40,
    "aperture",
    "Light enters the camera through a small aperture.",
    "光线通过一个小孔进入相机。"
  ],
  [
    41,
    "apex",
    "The climbers reached the apex of the ridge just before sunset.",
    "登山者在日落前到达山脊最高点。"
  ],
  [
    42,
    "apiece",
    "The notebooks cost three dollars apiece.",
    "这些笔记本每本三美元。"
  ],
  [
    43,
    "apologetic",
    "He sounded apologetic when he explained why he was late.",
    "他解释迟到原因时，语气里带着歉意。"
  ],
  [
    45,
    "apoplexy",
    "The nineteenth-century medical record described the sudden illness as apoplexy.",
    "这份十九世纪的病历把这种突发疾病称为中风。"
  ],
  [
    46,
    "apostrophe",
    "An apostrophe marks the missing letter in 'can't'.",
    "撇号标示“can't”中省略的字母。"
  ],
  [
    47,
    "appalling",
    "The inspection revealed appalling conditions in the abandoned building.",
    "检查发现这栋废弃建筑内部的状况十分恶劣。"
  ],
  [
    49,
    "apparel",
    "The shop sells outdoor apparel for hikers.",
    "这家商店出售供徒步者穿着的户外服装。"
  ],
  [
    51,
    "appealing",
    "The quiet courtyard was especially appealing to visitors.",
    "宁静的庭院对游客尤其有吸引力。"
  ],
  [
    53,
    "appease",
    "The manager offered a refund to appease the angry customer.",
    "经理提出退款，以平息愤怒顾客的不满。"
  ],
  [
    54,
    "append",
    "Please append the reference list to the end of your report.",
    "请把参考文献列表附在报告末尾。"
  ],
  [
    55,
    "appendicitis",
    "The surgeon confirmed that the patient had appendicitis.",
    "外科医生确认患者患有阑尾炎。"
  ]
].map(([i, word, en, cn]) => [i, { word, en, cn }]));
test('TEM-004: 50 sense-matched bilingual proposals retain source and review flags', () => {
  assert.equal(task.task_id, 'tem-004');
  assert.equal(task.entries.length, 100);
  assert.equal(expected.size, 50);
  for (const [i, item] of expected) {
    const e = task.entries[i];
    assert.equal(e.identity.word, item.word, 'source word at row ' + i);
    assert.equal(e.identity.source_file, 'tem.txt');
    assert.equal(e.original.example, '');
    assert.equal(e.original.example_translation, '');
    assert.equal(e.draft_method, 'editorial-context-rewrite-needs-review');
    assert.equal(e.verification, 'needs-review');
    assert.equal(e.external_human_review, false);
    assert.equal(e.full_dictionary_senses_reviewed, false);
    assert.deepEqual(e.evidence, []);
    assert.equal(e.proposed.phonetic, null);
    assert.equal(e.proposed.example, item.en);
    assert.equal(e.proposed.example_translation, item.cn);
    assert.match(item.en, /[.!?]$/);
    assert.match(item.cn, /[。！？]$/);
    const flagged = rules.filter(rule => rule.pattern.test(
      rule.id === 'translation-metalinguistic' ? item.cn : item.en
    )).map(rule => rule.id);
    assert.deepEqual(flagged, [], 'mechanical template at row ' + i + ': ' + item.word);
  }
});
