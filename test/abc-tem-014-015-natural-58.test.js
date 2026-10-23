'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const expected=[
  [
    "tem-014",
    5,
    "clockwise",
    "Turn the dial clockwise until it clicks into place.",
    "顺时针转动旋钮，直到听见它咔嗒一声卡入到位。",
    1886,
    "clockwise [ˈklɒkwaɪz] adv. 顺时针方向地",
    "adv.",
    "顺时针方向地"
  ],
  [
    "tem-014",
    49,
    "coinage",
    "The word 'podcast' is a relatively recent coinage.",
    "podcast（播客）是一个相对较新的英语词。",
    1944,
    "coinage [ˈkɔɪnɪdʒ] n. 1. 造币，铸币 2. 创造新词 3. 新造的词语",
    "n.",
    "1. 造币，铸币 2. 创造新词 3. 新造的词语"
  ],
  [
    "tem-014",
    53,
    "cola",
    "He ordered a glass of cola with his lunch.",
    "他午餐时点了一杯可乐。",
    1948,
    "cola [ˈkəʊlə] n. 1. 可乐果树  2. 可乐饮料 || Coca Cola可口可乐",
    "n.",
    "1. 可乐果树  2. 可乐饮料 || Coca Cola可口可乐"
  ],
  [
    "tem-014",
    69,
    "colonialist",
    "The colonialist sought to extend foreign control over the island.",
    "这名殖民主义者企图扩大对该岛的外国控制。",
    1971,
    "colonialist [kəˈləʊnɪəlɪst] n. 殖民主义者 adj. 殖民主义的",
    "n.",
    "殖民主义者 adj. 殖民主义的"
  ],
  [
    "tem-014",
    70,
    "colonize",
    "European powers sought to colonize islands along the trade route.",
    "欧洲列强曾试图在贸易航线沿途的岛屿建立殖民地。",
    1972,
    "*colonize [ˈkɒlənaɪz] v. 在…开拓殖民地，殖民于",
    "v.",
    "在…开拓殖民地，殖民于"
  ],
  [
    "tem-014",
    72,
    "colossal",
    "A colossal wave crashed against the sea wall.",
    "一股巨浪猛烈拍打着海堤。",
    1974,
    "*colossal [kəˈlɒsəl] adj. 巨大的，庞大的",
    "adj.",
    "巨大的，庞大的"
  ],
  [
    "tem-014",
    73,
    "colossus",
    "The bronze colossus towered above the harbour entrance.",
    "巨大的青铜雕像高耸在港口入口处。",
    1975,
    "*colossus [kəˈlɒsəs] n. 巨人，巨物",
    "n.",
    "巨人，巨物"
  ],
  [
    "tem-014",
    74,
    "colourful",
    "The market stalls displayed colourful fabrics.",
    "市场摊位上陈列着色彩鲜艳的布料。",
    1977,
    "colourful [ˈkʌləfʊl] adj. 1. 颜色鲜艳的，富于色彩的 2. 丰富多彩的，富有趣味的",
    "adj.",
    "1. 颜色鲜艳的，富于色彩的 2. 丰富多彩的，富有趣味的"
  ],
  [
    "tem-014",
    75,
    "colourless",
    "The liquid remained colourless after heating.",
    "这种液体加热后仍然无色。",
    1978,
    "colourless [ˈkʌləlɪs] adj. 1. 无色的 2. 无血色的，苍白的 3. 无特色的，平淡无奇的，无趣味的 4. 无偏见的，不偏不倚的",
    "adj.",
    "1. 无色的 2. 无血色的，苍白的 3. 无特色的，平淡无奇的，无趣味的 4. 无偏见的，不偏不倚的"
  ],
  [
    "tem-014",
    76,
    "colt",
    "The young colt trotted beside its mother.",
    "小雄马在母马身旁小跑。",
    1979,
    "*colt [kəʊlt] n. 小雄马，驹",
    "n.",
    "小雄马，驹"
  ],
  [
    "tem-014",
    77,
    "columnist",
    "The columnist writes a weekly article about local politics.",
    "这位专栏作家每周写一篇有关地方政治的文章。",
    1981,
    "columnist [ˈkɒləmnɪst] n. 专栏作家",
    "n.",
    "专栏作家"
  ],
  [
    "tem-014",
    78,
    "coma",
    "The patient remained in a coma for several days.",
    "这名患者昏迷了好几天。",
    1982,
    "coma [ˈkəʊmə] n. 昏迷，昏厥",
    "n.",
    "昏迷，昏厥"
  ],
  [
    "tem-014",
    79,
    "comb",
    "She ran a wooden comb through her hair.",
    "她用一把木梳梳理头发。",
    1983,
    "comb [kəʊm] n. 1. 梳子 2. 鸡冠 v. 梳理(头发)",
    "n.",
    "1. 梳子 2. 鸡冠 v. 梳理(头发)"
  ],
  [
    "tem-014",
    80,
    "combat",
    "The soldiers trained for close combat before deployment.",
    "士兵们在部署前接受了近身格斗训练。",
    1984,
    "combat [ˈkɒmbæt] n. 1. 战斗，格斗，反对 2. 竞争 v. 跟…战斗，反对",
    "n.",
    "1. 战斗，格斗，反对 2. 竞争 v. 跟…战斗，反对"
  ],
  [
    "tem-014",
    81,
    "combatant",
    "The ceasefire allowed wounded combatants to receive medical care.",
    "停火使受伤的参战人员能够得到医疗救治。",
    1985,
    "combatant [ˈkɒmbətənt] n. 参加战斗者，战斗员",
    "n.",
    "参加战斗者，战斗员"
  ],
  [
    "tem-014",
    82,
    "combustible",
    "Keep combustible materials away from the heater.",
    "请将易燃材料远离取暖器。",
    1988,
    "*combustible [kəmˈbʌstəbl] adj. 易燃的，易着火的",
    "adj.",
    "易燃的，易着火的"
  ],
  [
    "tem-014",
    83,
    "combustion",
    "The engine produces power through the combustion of fuel.",
    "发动机通过燃料燃烧产生动力。",
    1989,
    "combustion [kəmˈbʌstʃən] n. 燃烧，点火",
    "n.",
    "燃烧，点火"
  ],
  [
    "tem-014",
    84,
    "comedian",
    "The comedian had the audience laughing throughout the show.",
    "这位喜剧演员让观众整场演出都笑个不停。",
    1991,
    "comedian [kəˈmiːdɪən] n. 1. 喜剧演员，喜剧作家 2. 丑角式人物",
    "n.",
    "1. 喜剧演员，喜剧作家 2. 丑角式人物"
  ],
  [
    "tem-014",
    85,
    "comet",
    "A bright comet appeared above the horizon just before dawn.",
    "黎明前，一颗明亮的彗星出现在地平线上方。",
    1993,
    "comet [ˈkɒmɪt] n. 彗星",
    "n.",
    "彗星"
  ],
  [
    "tem-014",
    86,
    "comma",
    "Put a comma after the introductory phrase.",
    "在开头的短语后加一个逗号。",
    1997,
    "comma [ˈkɒmə] n. 逗号",
    "n.",
    "逗号"
  ],
  [
    "tem-014",
    88,
    "commandant",
    "The commandant welcomed the new cadets to the academy.",
    "军校校长欢迎新学员入校。",
    1999,
    "commandant[ˌkɒmənˈdænt] n. 司令官，指挥官，军校校长",
    "n.",
    "司令官，指挥官，军校校长"
  ],
  [
    "tem-014",
    90,
    "commandment",
    "The ancient text contains a commandment against stealing.",
    "这部古代典籍载有一条禁止偷窃的戒律。",
    2001,
    "commandment [kəˈmɑːndmənt] n. 戒律，圣诫",
    "n.",
    "戒律，圣诫"
  ],
  [
    "tem-014",
    92,
    "commence",
    "The concert will commence at eight o'clock.",
    "音乐会将于八点开始。",
    2003,
    "commence [kəˈmens] v. 开始",
    "v.",
    "开始"
  ],
  [
    "tem-014",
    94,
    "commendation",
    "The firefighter received a commendation for her bravery.",
    "这名消防员因英勇表现获得了嘉奖。",
    2005,
    "commendation [ˌkɒmenˈdeɪʃən] n. 1. 赞扬，称颂 2. 奖状，荣誉",
    "n.",
    "1. 赞扬，称颂 2. 奖状，荣誉"
  ],
  [
    "tem-014",
    95,
    "commensurate",
    "Her salary is commensurate with her experience.",
    "她的薪水与她的经验相称。",
    2006,
    "*commensurate [kəˈmenʃərɪt] adj. 相称的，相等的，恰当的",
    "adj.",
    "相称的，相等的，恰当的"
  ],
  [
    "tem-014",
    96,
    "comment",
    "The editor left a comment beside the final paragraph.",
    "编辑在最后一段旁留下了一条评论。",
    2007,
    "comment [ˈkɒment] n. & v. 评价，评论",
    "n.&v.",
    "评价，评论"
  ],
  [
    "tem-014",
    97,
    "commentary",
    "The radio commentary helped listeners follow the match.",
    "电台的实况解说帮助听众了解比赛进程。",
    2008,
    "commentary [ˈkɒməntrɪ] n. 1. (对书籍等的)评语，评注，评论 2. 实况报道",
    "n.",
    "1. (对书籍等的)评语，评注，评论 2. 实况报道"
  ],
  [
    "tem-014",
    98,
    "commentate",
    "She was invited to commentate on the final for local radio.",
    "她受邀为当地电台解说决赛。",
    2009,
    "*commentate [ˈkɒmenteɪt] vi. 作实况报道，评述",
    "vi.",
    "作实况报道，评述"
  ],
  [
    "tem-014",
    99,
    "commentator",
    "The commentator described the final minutes of the match.",
    "解说员讲述了比赛最后几分钟的情况。",
    2010,
    "commentator [ˈkɒmənteɪtə] n. 1. 注释者，解说者 2. 实况转播评论员，新闻广播员",
    "n.",
    "1. 注释者，解说者 2. 实况转播评论员，新闻广播员"
  ],
  [
    "tem-015",
    2,
    "commissioner",
    "The election commissioner announced the final results.",
    "选举专员宣布了最终结果。",
    2014,
    "commissioner [kəˈmɪʃənə] n. 1. 专员，委员，政府特派员，高级代表 2. 地方长官，官员",
    "n.",
    "1. 专员，委员，政府特派员，高级代表 2. 地方长官，官员"
  ],
  [
    "tem-015",
    3,
    "committed",
    "She is a committed volunteer who visits the shelter every weekend.",
    "她是一名尽心尽力的志愿者，每个周末都去收容所帮忙。",
    2017,
    "committed [kəˈmɪtɪd] adj.  1. 献身的，忠诚的 2. 做出明确承诺的，表示出明确意图的",
    "adj.",
    "1. 献身的，忠诚的 2. 做出明确承诺的，表示出明确意图的"
  ],
  [
    "tem-015",
    5,
    "commonplace",
    "Video calls have become commonplace in many offices.",
    "视频通话在许多办公室已十分普遍。",
    2021,
    "commonplace [ˈkɒmənpleɪs] adj. 平凡的，常见的",
    "adj.",
    "平凡的，常见的"
  ],
  [
    "tem-015",
    7,
    "commune",
    "Several families shared a garden in the rural commune.",
    "几户人家在这个乡村公社里共用一座花园。",
    2023,
    "commune [kəˈmjuːn] n. 1. 公社 2. (法国等国家)最小的行政区 v. 交换思想、意见(感受)",
    "n.",
    "1. 公社 2. (法国等国家)最小的行政区 v. 交换思想、意见(感受)"
  ],
  [
    "tem-015",
    8,
    "communicable",
    "The nurse explained how communicable diseases can spread.",
    "护士解释了传染病的传播方式。",
    2024,
    "*communicable [kəˈmjuːnɪkəbl] adj. (思想、感觉等)易于传达的，(疾病)可传染的",
    "adj.",
    "(思想、感觉等)易于传达的，(疾病)可传染的"
  ],
  [
    "tem-015",
    9,
    "communicative",
    "The new student became more communicative as she made friends.",
    "这名新生交到朋友后变得更加健谈。",
    2027,
    "communicative [kəˈmjuːnɪkətɪv] adj. 1. 健谈的，爱说话的 2. 交际的",
    "adj.",
    "1. 健谈的，爱说话的 2. 交际的"
  ],
  [
    "tem-015",
    10,
    "communion",
    "She felt a deep communion with nature as she walked through the forest.",
    "她走过森林时感到自己与大自然心灵相通。",
    2028,
    "*communion [kəˈmjuːnɪən] n. 1. (信仰、思想、感情等的)交流，共享 2. 圣餐",
    "n.",
    "1. (信仰、思想、感情等的)交流，共享 2. 圣餐"
  ],
  [
    "tem-015",
    11,
    "communique",
    "The government issued a communique after the talks.",
    "会谈结束后，政府发布了一份公报。",
    2029,
    "*communique [kəˈmjuːnɪkeɪ] n. 公报",
    "n.",
    "公报"
  ],
  [
    "tem-015",
    13,
    "commute",
    "She commutes by train from the suburbs to the city every weekday.",
    "她每个工作日都乘火车从郊区往返市区。",
    2033,
    "commute [kəˈmjuːt] v. 1. 定时往返两地 2. 减轻(刑罚) 3. 用…交换，改变(付款)方式",
    "v.",
    "1. 定时往返两地 2. 减轻(刑罚) 3. 用…交换，改变(付款)方式"
  ],
  [
    "tem-015",
    14,
    "compact",
    "The compact camera fits easily into a coat pocket.",
    "这台小巧的相机可以轻松放进外套口袋。",
    2034,
    "compact [kəmˈpækt] adj. 1. 紧密的，结实的 2. (文体)简洁的，紧凑的",
    "adj.",
    "1. 紧密的，结实的 2. (文体)简洁的，紧凑的"
  ],
  [
    "tem-015",
    16,
    "companionship",
    "After moving away, he missed the companionship of his old friends.",
    "搬走以后，他怀念与老朋友相伴的日子。",
    2036,
    "companionship [kəmˈpænjənʃɪp] n. 友谊，交往，交情",
    "n.",
    "友谊，交往，交情"
  ],
  [
    "tem-015",
    19,
    "comparatively",
    "The second apartment was comparatively affordable.",
    "相比之下，第二套公寓的价格较为实惠。",
    2040,
    "comparatively [kəmˈpærətɪvlɪ] adv. 比较地",
    "adv.",
    "比较地"
  ],
  [
    "tem-015",
    21,
    "compassionate",
    "A compassionate neighbour brought food to the family after the flood.",
    "洪水过后，一位富有同情心的邻居给这家人送来了食物。",
    2046,
    "compassionate[kəmˈpæʃənɪt] adj. 有同情心的",
    "adj.",
    "有同情心的"
  ],
  [
    "tem-015",
    23,
    "compatriot",
    "She was delighted to meet a compatriot while studying abroad.",
    "她在国外留学时遇到一位同胞，感到十分高兴。",
    2048,
    "*compatriot [kəmˈpætrɪət] n. 同国人，同胞",
    "n.",
    "同国人，同胞"
  ],
  [
    "tem-015",
    24,
    "compel",
    "The storm compelled the hikers to turn back.",
    "暴风雨迫使徒步者折返。",
    2049,
    "compel [kəmˈpel] v. 强迫，强求",
    "v.",
    "强迫，强求"
  ],
  [
    "tem-015",
    25,
    "compensate",
    "The airline agreed to compensate passengers for the delay.",
    "航空公司同意赔偿乘客因延误遭受的损失。",
    2050,
    "compensate [ˈkɒmpenseɪt] v. 补偿，酬报",
    "v.",
    "补偿，酬报"
  ],
  [
    "tem-015",
    29,
    "competitor",
    "The young competitor reached the final in her first tournament.",
    "这名年轻选手第一次参加锦标赛就打进了决赛。",
    2057,
    "competitor [kəmˈpetɪtə] n. 竞争者，对手，敌手",
    "n.",
    "竞争者，对手，敌手"
  ],
  [
    "tem-015",
    30,
    "compile",
    "The librarian compiled a list of books for new students.",
    "图书管理员为新生编了一份书目。",
    2058,
    "compile [kəmˈpaɪl] v. 编辑，汇编，编纂",
    "v.",
    "编辑，汇编，编纂"
  ],
  [
    "tem-015",
    31,
    "complacency",
    "Early success led to complacency, and the team stopped practising.",
    "初期的成功让团队变得自满，停止了训练。",
    2059,
    "complacency [kəmˈpleɪsnsɪ] n. 自满，沾沾自喜，自得",
    "n.",
    "自满，沾沾自喜，自得"
  ],
  [
    "tem-015",
    32,
    "complacent",
    "The players grew complacent after winning three matches.",
    "连赢三场比赛后，队员们变得自满起来。",
    2060,
    "complacent [kəmˈpleɪsənt] adj. 自满，自得",
    "adj.",
    "自满，自得"
  ],
  [
    "tem-015",
    34,
    "complement",
    "The fresh herbs are a perfect complement to the soup.",
    "新鲜香草为这道汤增色不少。",
    2063,
    "complement [ˈkɒmplɪmənt] n. 1. 补充物，配给物 2. 足量，足额 3. 补助语 v. 补充，补足，使完备",
    "n.",
    "1. 补充物，配给物 2. 足量，足额 3. 补助语 v. 补充，补足，使完备"
  ],
  [
    "tem-015",
    35,
    "complementary",
    "The two researchers brought complementary skills to the project.",
    "两名研究人员为项目带来了互补的技能。",
    2064,
    "*complementary [ˌkɒmplɪˈmentərɪ] adj. 补充的，补足的",
    "adj.",
    "补充的，补足的"
  ],
  [
    "tem-015",
    38,
    "complexion",
    "His pale complexion worried his family.",
    "他苍白的脸色让家人担心。",
    2068,
    "*complexion [kəmˈplekʃən] n. 1. 肤色，气色，面色 2. 外观，形势",
    "n.",
    "1. 肤色，气色，面色 2. 外观，形势"
  ],
  [
    "tem-015",
    39,
    "complexity",
    "The complexity of the instructions confused new users.",
    "说明书过于复杂，让新用户感到困惑。",
    2069,
    "complexity [kəmˈpleksətɪ] n. 1. 复杂性 2. 错综复杂的事物",
    "n.",
    "1. 复杂性 2. 错综复杂的事物"
  ],
  [
    "tem-015",
    40,
    "compliance",
    "The audit found that the factory was not in compliance with safety rules.",
    "审计发现这家工厂没有遵守安全规定。",
    2070,
    "compliance [kəmˈplaɪəns] n. 遵从，依照",
    "n.",
    "遵从，依照"
  ],
  [
    "tem-015",
    42,
    "complicity",
    "The inquiry uncovered evidence of his complicity in the fraud.",
    "调查发现了他参与这起诈骗的证据。",
    2073,
    "complicity [kəmˈplɪsətɪ] n. 同谋，串通",
    "n.",
    "同谋，串通"
  ],
  [
    "tem-015",
    43,
    "compliment",
    "Her teacher paid her a compliment on the presentation.",
    "老师称赞了她的演讲表现。",
    2074,
    "compliment [ˈkɒmplɪmənt]  n. 恭维，称赞 v. 称赞",
    "n.",
    "恭维，称赞 v. 称赞"
  ],
  [
    "tem-015",
    44,
    "complimentary",
    "Guests received complimentary breakfast with their rooms.",
    "住客预订客房后可享用免费早餐。",
    2075,
    "complimentary [ˌkɒmplɪˈmentərɪ] adj. 1. 赞美的，恭维的 2. 赠送的，免费的",
    "adj.",
    "1. 赞美的，恭维的 2. 赠送的，免费的"
  ],
  [
    "tem-015",
    46,
    "component",
    "The machine's component parts arrived in separate boxes.",
    "这台机器的各个组成部件分别装箱运抵。",
    2077,
    "component [kəmˈpəʊnənt] adj. 组成的，合成的 n. 组成部分，成分，元件",
    "adj.",
    "组成的，合成的 n. 组成部分，成分，元件"
  ]
];
test('TEM-014/015: 58 source-locked natural bilingual draft examples',()=>{
 assert.equal(expected.length,58);
 assert.equal(new Set(expected.map(x=>x[0]+':'+x[1])).size,58);
 const grouped=expected.reduce((o,x)=>((o[x[0]]??=[]).push(x),o),{});
 for(const [taskId,rows] of Object.entries(grouped)){
  const task=manifest.files.find(x=>x.task_id===taskId);
  assert.ok(task);
  const input=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',task.file),'utf8'));
  const result=JSON.parse(fs.readFileSync(path.join(root,'docs/model-task-results/worker-A',taskId,'result.json'),'utf8'));
  assert.equal(result.task_id,taskId);
  assert.equal(result.status,'proposal');
  assert.equal(result.input_sha256,task.sha256);
  assert.equal(result.entries.length,input.entries.length);
  for(let i=0;i<result.entries.length;i++){
   const e=result.entries[i];
   assert.deepEqual(e.identity,input.entries[i].identity,'identity '+taskId+':'+i);
   assert.deepEqual(e.original,input.entries[i].current,'original '+taskId+':'+i);
   assert.equal(e.verification,'needs-review');
   assert.equal(e.external_human_review,false);
   assert.equal(e.full_dictionary_senses_reviewed,false);
   assert.deepEqual(e.evidence,[]);
  }
  for(const [_,i,word,en,cn,line,raw,pos,meaning] of rows){
   const e=result.entries[i];
   assert.equal(e.identity.word,word);
   assert.equal(e.identity.source_line,line);
   assert.equal(e.identity.source_raw,raw);
   assert.equal(e.selected_sense.pos,pos);
   assert.equal(e.selected_sense.meaning,meaning);
   assert.equal(e.proposed.example,en);
   assert.equal(e.proposed.example_translation,cn);
   assert.equal(e.draft_method,'editorial-context-rewrite-needs-review');
   assert.ok(en.endsWith('.')&&cn.endsWith('。'));
   const flags=rules.filter(rule=>rule.pattern.test(rule.id==='translation-metalinguistic'?cn:en)).map(rule=>rule.id);
   assert.deepEqual(flags,[],'mechanical template remains: '+word);
  }
 }
});
