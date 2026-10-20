'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { rules } = require('../scripts/audit-abc-example-quality');
const root = path.resolve(__dirname, '..');
const result = JSON.parse(fs.readFileSync(path.join(root, 'docs/model-task-results/worker-A/tem-008/result.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/model-tasks-20261015/manifest.json'), 'utf8'));
const task = manifest.files.find(x => x.task_id === 'tem-008');
const input = JSON.parse(fs.readFileSync(path.join(root, 'docs/model-tasks-20261015', task.file), 'utf8'));
const expected = [
  [
    0,
    "begrudge",
    "She begrudged her colleague the promotion.",
    "她对同事获得晋升心怀不满。",
    1013
  ],
  [
    1,
    "beguile",
    "The storyteller beguiled the children with tales of distant islands.",
    "讲故事的人用遥远岛屿的故事吸引了孩子们。",
    1014
  ],
  [
    2,
    "behead",
    "The historical account says the rebel leader was beheaded after the trial.",
    "史料记载，这名叛军首领在审判后被斩首。",
    1018
  ],
  [
    4,
    "belie",
    "Her calm voice belied the anxiety she felt.",
    "她平静的声音掩盖了内心的焦虑。",
    1022
  ],
  [
    5,
    "bellow",
    "The captain bellowed orders over the noise of the engines.",
    "船长顶着发动机的轰鸣声大声下达命令。",
    1026
  ],
  [
    7,
    "belongings",
    "Passengers should keep their belongings with them at all times.",
    "乘客应随时保管好自己的随身物品。",
    1029
  ],
  [
    8,
    "beloved",
    "The town gathered to honour its beloved teacher.",
    "镇上的人聚在一起向他们敬爱的老师致敬。",
    1030
  ],
  [
    9,
    "bemoan",
    "Residents bemoaned the loss of the old library.",
    "居民们为老图书馆的消失感到惋惜。",
    1033
  ],
  [
    10,
    "bemused",
    "He looked bemused when the instructions contradicted each other.",
    "看到互相矛盾的说明，他露出了困惑的神情。",
    1034
  ],
  [
    12,
    "benchmark",
    "Last year's sales figures provide a benchmark for this year's targets.",
    "去年的销售数据为今年的目标提供了参照标准。",
    1036
  ],
  [
    13,
    "benediction",
    "The ceremony ended with a benediction from the priest.",
    "仪式以牧师的祝福结束。",
    1039
  ],
  [
    15,
    "beneficiary",
    "Her daughter was named as the beneficiary of the insurance policy.",
    "她的女儿被指定为这份保险单的受益人。",
    1041
  ],
  [
    16,
    "benevolence",
    "The charity was founded through the benevolence of local residents.",
    "这家慈善机构是在当地居民的善意资助下成立的。",
    1043
  ],
  [
    17,
    "benevolent",
    "A benevolent neighbour brought meals to the family after the fire.",
    "火灾后，一位善良的邻居给这家人送来了饭菜。",
    1044
  ],
  [
    19,
    "bequeath",
    "In her will, she bequeathed the cottage to her niece.",
    "她在遗嘱中把小屋遗赠给侄女。",
    1046
  ],
  [
    20,
    "bequest",
    "The museum acquired the painting through a bequest from a collector.",
    "博物馆通过一位收藏家的遗赠获得了这幅画。",
    1047
  ],
  [
    21,
    "bereaved",
    "Volunteers offered support to bereaved families after the accident.",
    "事故发生后，志愿者向失去亲人的家庭提供帮助。",
    1048
  ],
  [
    22,
    "berry",
    "She picked a ripe berry from the bush.",
    "她从灌木上摘下一颗成熟的浆果。",
    1049
  ],
  [
    23,
    "berth",
    "The ferry waited for an empty berth at the harbour.",
    "渡轮在港口等待空泊位。",
    1050
  ],
  [
    24,
    "beset",
    "The village was beset by repeated raids during the war.",
    "战争期间，村庄屡遭袭击。",
    1051
  ],
  [
    25,
    "besiege",
    "The army besieged the fortress for several weeks.",
    "军队围攻了那座要塞数周。",
    1054
  ],
  [
    26,
    "bestow",
    "The university bestowed an honorary degree on the scientist.",
    "大学授予了这位科学家荣誉学位。",
    1056
  ],
  [
    27,
    "bestseller",
    "Her first novel became a bestseller within a month.",
    "她的第一部小说在一个月内成为畅销书。",
    1057
  ],
  [
    32,
    "bewitch",
    "The singer's voice bewitched the audience.",
    "歌手的嗓音令观众着迷。",
    1065
  ],
  [
    33,
    "bias",
    "The hiring panel took steps to reduce bias in its decisions.",
    "招聘评审小组采取措施，减少决策中的偏见。",
    1067
  ],
  [
    36,
    "bicker",
    "The siblings bickered over who should wash the dishes.",
    "兄妹俩为谁该洗碗而拌嘴。",
    1070
  ],
  [
    38,
    "bid",
    "She bid two hundred pounds for the antique chair.",
    "她为那把古董椅出价两百英镑。",
    1072
  ],
  [
    39,
    "bifocals",
    "He wears bifocals so he can read and see distant signs.",
    "他戴着双焦眼镜，既能阅读，也能看清远处的标志。",
    1073
  ],
  [
    40,
    "bigot",
    "The speaker was criticised as a bigot for his intolerant remarks.",
    "这名发言人因发表不宽容的言论而被批评为偏执者。",
    1075
  ],
  [
    42,
    "bilateral",
    "The two countries signed a bilateral trade agreement.",
    "两国签署了一项双边贸易协定。",
    1078
  ],
  [
    43,
    "bile",
    "The liver produces bile to help digest fats.",
    "肝脏产生胆汁，帮助消化脂肪。",
    1079
  ],
  [
    44,
    "bilingual",
    "The school provides bilingual lessons in English and Spanish.",
    "学校提供英语和西班牙语双语课程。",
    1080
  ],
  [
    46,
    "billow",
    "A billow of smoke rose from the chimney.",
    "一团浓烟从烟囱中滚滚升起。",
    1084
  ],
  [
    47,
    "binary",
    "Computers store information using binary digits.",
    "计算机用二进制数字存储信息。",
    1086
  ],
  [
    49,
    "binder",
    "She placed the notes in a ring binder.",
    "她把笔记放进活页夹里。",
    1088
  ],
  [
    50,
    "binding",
    "The old book's leather binding had begun to crack.",
    "那本旧书的皮革封皮开始开裂。",
    1089
  ],
  [
    51,
    "binge",
    "After a weekend drinking binge, he decided to seek help.",
    "周末狂饮后，他决定寻求帮助。",
    1090
  ],
  [
    52,
    "bingo",
    "The community centre held a bingo game to raise money for repairs.",
    "社区中心举办了一场宾戈游戏，为维修筹款。",
    1091
  ],
  [
    53,
    "binoculars",
    "We used binoculars to watch birds across the lake.",
    "我们用双筒望远镜观察湖对岸的鸟。",
    1092
  ],
  [
    54,
    "biochemistry",
    "She studies biochemistry to understand how enzymes work.",
    "她学习生物化学，以了解酶的作用原理。",
    1093
  ],
  [
    56,
    "biological",
    "The researchers collected biological samples from the river.",
    "研究人员从河流中采集了生物样本。",
    1096
  ],
  [
    57,
    "biologist",
    "A marine biologist identified the unusual fish.",
    "一位海洋生物学家辨认出了这种罕见的鱼。",
    1097
  ],
  [
    58,
    "biotechnology",
    "The company uses biotechnology to develop drought-resistant crops.",
    "这家公司利用生物技术培育抗旱作物。",
    1099
  ],
  [
    59,
    "bipartisan",
    "The proposal received bipartisan support in parliament.",
    "这项提案在议会获得两党共同支持。",
    1100
  ],
  [
    60,
    "birch",
    "A tall birch stood beside the cottage.",
    "一棵高大的桦树立在小屋旁。",
    1101
  ],
  [
    61,
    "birthplace",
    "The village is known as the birthplace of the poet.",
    "这个村庄因是那位诗人的出生地而闻名。",
    1105
  ],
  [
    62,
    "birthrate",
    "The country's birthrate has fallen over the past decade.",
    "过去十年，这个国家的出生率下降了。",
    1106
  ],
  [
    63,
    "bisect",
    "The line bisects the circle into two equal halves.",
    "这条线将圆平分成两半。",
    1108
  ],
  [
    64,
    "bishop",
    "The bishop visited the small parish on Sunday.",
    "主教星期日走访了这个小教区。",
    1109
  ],
  [
    67,
    "bitch",
    "The breeder kept the bitch and her puppies in a warm room.",
    "饲养员把母狗和幼犬安置在温暖的房间里。",
    1112
  ],
  [
    70,
    "blacken",
    "Smoke from the fire blackened the kitchen ceiling.",
    "火灾产生的烟把厨房天花板熏黑了。",
    1119
  ],
  [
    71,
    "blackmail",
    "The journalist reported the blackmail attempt to the police.",
    "记者向警方报告了这起敲诈企图。",
    1120
  ],
  [
    72,
    "blackout",
    "The city imposed a blackout during the air-raid warning.",
    "空袭警报期间，全城实施灯火管制。",
    1121
  ],
  [
    73,
    "blacksmith",
    "The blacksmith heated the iron before shaping it.",
    "铁匠先把铁加热，再将它锻造成形。",
    1122
  ],
  [
    74,
    "bladder",
    "The scan showed that her bladder was full.",
    "扫描显示她的膀胱已充满尿液。",
    1123
  ],
  [
    76,
    "blanch",
    "She blanched when she heard the terrible news.",
    "听到那个可怕的消息，她的脸色变得苍白。",
    1126
  ],
  [
    77,
    "bland",
    "The soup tasted bland until she added some herbs.",
    "这汤味道清淡，直到她加了些香草才有了味道。",
    1127
  ],
  [
    78,
    "blare",
    "Car horns blared outside the station.",
    "车站外汽车喇叭刺耳地响个不停。",
    1130
  ],
  [
    79,
    "blast",
    "A sudden blast of cold wind blew the door open.",
    "一阵突如其来的冷风把门吹开了。",
    1131
  ],
  [
    80,
    "blatant",
    "The referee ignored a blatant foul.",
    "裁判无视了一次明目张胆的犯规。",
    1132
  ]
];
test('TEM-008: 60 bilingual rewrites retain source identity and draft-only review status', () => {
  assert.equal(result.task_id, 'tem-008');
  assert.equal(result.input_sha256, task.sha256);
  assert.equal(result.entries.length, input.entries.length);
  assert.equal(expected.length, 60);
  assert.equal(new Set(expected.map(x => x[0])).size, 60);
  for (const [i, word, en, cn, sourceLine] of expected) {
    const row = result.entries[i];
    assert.equal(row.identity.word, word);
    assert.equal(row.identity.source_line, sourceLine);
    assert.deepEqual(row.identity, input.entries[i].identity, word);
    assert.deepEqual(row.original, input.entries[i].current, word);
    assert.equal(row.proposed.example, en, word);
    assert.equal(row.proposed.example_translation, cn, word);
    assert.equal(row.draft_method, 'editorial-context-rewrite-needs-review', word);
    assert.equal(row.verification, 'needs-review');
    assert.equal(row.external_human_review, false);
    assert.equal(row.full_dictionary_senses_reviewed, false);
    assert.deepEqual(row.evidence, []);
    assert.ok(en.endsWith('.') && cn.endsWith('。'));
    const flags = rules.filter(rule => rule.pattern.test(
      rule.id === 'translation-metalinguistic' ? cn : en
    )).map(rule => rule.id);
    assert.deepEqual(flags, [], 'mechanical template remains: ' + word);
  }
});
