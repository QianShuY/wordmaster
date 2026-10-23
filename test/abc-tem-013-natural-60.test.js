'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const task=manifest.files.find(x=>x.task_id==='tem-013');
const input=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',task.file),'utf8'));
const result=JSON.parse(fs.readFileSync(path.join(root,'docs/model-task-results/worker-A/tem-013/result.json'),'utf8'));
const expected=[
  [
    0,
    "chatterbox",
    "Even at breakfast, our little brother was a chatterbox.",
    "连吃早饭时，我们的小弟弟也说个不停，简直是个话匣子。",
    1721,
    "chatterbox [ˈtʃætəbɒks] n. 喋喋不休的人，话匣子",
    "n.",
    "喋喋不休的人，话匣子"
  ],
  [
    1,
    "chauffeur",
    "The hotel arranged a chauffeur to collect the guests at the airport.",
    "酒店安排了一名专职司机去机场接客人。",
    1722,
    "chauffeur [ˈʃəʊfə] n. 私家雇用的司机",
    "n.",
    "私家雇用的司机"
  ],
  [
    2,
    "chauvinism",
    "The article criticised the government's chauvinism toward smaller neighbouring nations.",
    "文章批评了该政府对周边较小国家表现出的大国沙文主义。",
    1723,
    "*chauvinism [ˈʃəʊvɪnɪzəm] n. 大国沙文主义，大民族主义",
    "n.",
    "大国沙文主义，大民族主义"
  ],
  [
    3,
    "cheat",
    "The referee caught a cheat trying to change the score.",
    "裁判发现一个作弊者正试图篡改比分。",
    1725,
    "cheat [tʃiːt] n. 1. 欺诈，骗取 2. 骗子 v. 欺诈，骗取",
    "n.",
    "1. 欺诈，骗取 2. 骗子 v. 欺诈，骗取"
  ],
  [
    4,
    "checklist",
    "Before takeoff, the pilot went through the safety checklist.",
    "起飞前，飞行员逐项核对安全检查清单。",
    1727,
    "checklist [ˈtʃekˌlɪst] n. 名单，清单",
    "n.",
    "名单，清单"
  ],
  [
    5,
    "checkmate",
    "The chess game ended in checkmate after twenty moves.",
    "下了二十步后，这盘棋以将死结束。",
    1728,
    "*checkmate [ˈtʃekmeɪt] n. 1. (象棋)被将死时王棋的位置，将杀 2. 彻底失败 v. 1. (象棋)将死(对方的王棋) 2. 制止，使彻底失败",
    "n.",
    "1. (象棋)被将死时王棋的位置，将杀 2. 彻底失败 v. 1. (象棋)将死(对方的王棋) 2. 制止，使彻底失败"
  ],
  [
    6,
    "checkout",
    "Only one checkout was open, so the queue stretched down the aisle.",
    "只有一个收银台开放，队伍一直排到过道里。",
    1729,
    "checkout [ˈtʃekaʊt] n. (自助商店等的)付款台，结账处",
    "n.",
    "(自助商店等的)付款台，结账处"
  ],
  [
    7,
    "checkpoint",
    "Soldiers checked vehicles at the checkpoint outside the city.",
    "士兵在城外的检查站检查车辆。",
    1730,
    "checkpoint [ˈtʃekpɔɪnt] n. 检查哨，关卡",
    "n.",
    "检查哨，关卡"
  ],
  [
    13,
    "chic",
    "Her simple black coat looked effortlessly chic.",
    "她那件简洁的黑色大衣显得十分时髦。",
    1746,
    "*chic [ʃiːk] n. &adj. 别致(的)，时髦(的)，讲究(的)",
    "n.&adj.",
    "别致(的)，时髦(的)，讲究(的)"
  ],
  [
    15,
    "chiefly",
    "The village relies chiefly on fishing for its income.",
    "这个村庄主要靠捕鱼维持收入。",
    1750,
    "chiefly [ˈtʃiːflɪ] adv. 主要地，首要地，尤其",
    "adv.",
    "主要地，首要地，尤其"
  ],
  [
    16,
    "chieftain",
    "The tribal chieftain welcomed the visitors to the village.",
    "部落首领欢迎来访者来到村庄。",
    1751,
    "*chieftain [ˈtʃiːftən] n. 酋长，首领",
    "n.",
    "酋长，首领"
  ],
  [
    18,
    "chill",
    "A sudden chill swept through the room when the window blew open.",
    "窗户被风吹开时，一股寒意突然袭来。",
    1755,
    "chill [tʃɪl] n. 1. 寒冷，寒气 2. 寒战，寒意 v. 1. 使变冷， 使感到寒冷 2. 使寒心，使扫兴",
    "n.",
    "1. 寒冷，寒气 2. 寒战，寒意 v. 1. 使变冷， 使感到寒冷 2. 使寒心，使扫兴"
  ],
  [
    20,
    "chilly",
    "We pulled on our jackets in the chilly morning air.",
    "清晨的空气凉飕飕的，我们穿上了外套。",
    1757,
    "chilly [ˈtʃɪlɪ] adj. 凉飕飕的",
    "adj.",
    "凉飕飕的"
  ],
  [
    21,
    "chime",
    "A soft chime sounded as the clock struck six.",
    "时钟敲响六点时，传来一声柔和的钟声。",
    1758,
    "*chime [tʃaɪm] n. 钟声 v. 1. 发出钟声，奏出和谐的音调 2. 符合，协调，一致 || chime in with sth符合某事",
    "n.",
    "钟声 v. 1. 发出钟声，奏出和谐的音调 2. 符合，协调，一致 || chime in with sth符合某事"
  ],
  [
    25,
    "Chinese",
    "She has studied Chinese for three years and can now read short stories.",
    "她学了三年汉语，现在能读简短的故事了。",
    1763,
    "Chinese [ˌtʃaɪˈniːz] n. 1. 中国人 2. 汉语 adj. 1. 中国的  2. 中国人的 3. 汉语的",
    "n.",
    "1. 中国人 2. 汉语 adj. 1. 中国的  2. 中国人的 3. 汉语的"
  ],
  [
    26,
    "chirp",
    "Sparrows chirped in the hedge just before sunrise.",
    "日出前，麻雀在树篱中啁啾鸣叫。",
    1765,
    "*chirp [tʃɜːp] v. (小鸟等)唧唧叫，啁啾",
    "v.",
    "(小鸟等)唧唧叫，啁啾"
  ],
  [
    27,
    "chisel",
    "The sculptor used a sharp chisel to shape the stone.",
    "雕刻家用一把锋利的凿子雕琢石头。",
    1766,
    "*chisel [ˈtʃɪzl] n. 凿子 v. 用凿子刻、雕、凿",
    "n.",
    "凿子 v. 用凿子刻、雕、凿"
  ],
  [
    28,
    "chivalry",
    "The old tale celebrates the knight's courage and chivalry.",
    "这个古老的故事赞颂了骑士的勇气与骑士精神。",
    1767,
    "*chivalry [ˈʃɪvəlrɪ] n. 1. (中世纪)骑士制度，骑士精神 2. 骑士风度 3. (男士对女性)彬彬有礼，男士风度",
    "n.",
    "1. (中世纪)骑士制度，骑士精神 2. 骑士风度 3. (男士对女性)彬彬有礼，男士风度"
  ],
  [
    30,
    "choir",
    "The church choir rehearsed for the Christmas service.",
    "教堂唱诗班为圣诞礼拜排练。",
    1771,
    "choir [ˈkwaɪə] n. 1. (教堂里的)唱诗班 2. 唱诗班的席位",
    "n.",
    "1. (教堂里的)唱诗班 2. 唱诗班的席位"
  ],
  [
    31,
    "cholera",
    "The village faced a cholera outbreak after its water supply was contaminated.",
    "村里的水源受到污染后，暴发了霍乱。",
    1773,
    "*cholera [ˈkɒlərə] n. 霍乱(病)",
    "n.",
    "霍乱(病)"
  ],
  [
    33,
    "choppy",
    "The ferry rocked on the choppy sea.",
    "渡轮在波涛起伏的海面上摇晃。",
    1777,
    "*choppy [ˈtʃɒpɪ] adj. 波涛汹涌的",
    "adj.",
    "波涛汹涌的"
  ],
  [
    34,
    "choral",
    "The school performed a choral piece at the spring concert.",
    "学校在春季音乐会上表演了一首合唱曲。",
    1779,
    "*choral [ˈkɔːrəl] adj. 唱诗班的，合唱团的",
    "adj.",
    "唱诗班的，合唱团的"
  ],
  [
    35,
    "chord",
    "She played the final chord softly on the piano.",
    "她在钢琴上轻轻弹出最后一个和弦。",
    1780,
    "chord [kɔːd] n. 1. 和弦，和音 2. (几何的)弦",
    "n.",
    "1. 和弦，和音 2. (几何的)弦"
  ],
  [
    36,
    "choreography",
    "The dancers practised the new choreography until every movement was in time.",
    "舞者反复练习新的舞蹈编排，直到每个动作都合上节拍。",
    1782,
    "*choreography [ˌkɒrɪˈɒɡrəfɪ] n. 舞蹈编排，舞蹈艺术",
    "n.",
    "舞蹈编排，舞蹈艺术"
  ],
  [
    38,
    "christen",
    "The family gathered at the church to christen their baby.",
    "一家人聚在教堂为婴儿举行洗礼。",
    1785,
    "*christen [ˈkrɪsən] v. 1. 为…施洗礼，(洗礼时)给…命名  2. 为(船只等)举行仪式命名  3. 首次使用",
    "v.",
    "1. 为…施洗礼，(洗礼时)给…命名  2. 为(船只等)举行仪式命名  3. 首次使用"
  ],
  [
    39,
    "Christianity",
    "The museum exhibition traces the spread of Christianity across Europe.",
    "博物馆的展览介绍了基督教在欧洲的传播历程。",
    1787,
    "Christianity [ˌkrɪstɪˈænətɪ] n. 基督教",
    "n.",
    "基督教"
  ],
  [
    40,
    "chrome",
    "The taps were coated with chrome to give them a bright finish.",
    "这些水龙头镀了铬，表面因此光亮。",
    1789,
    "*chrome [krəʊm] n. 铬，铬钢",
    "n.",
    "铬，铬钢"
  ],
  [
    41,
    "chromosome",
    "The scientist examined the chromosome under a microscope.",
    "科学家在显微镜下观察这条染色体。",
    1790,
    "*chromosome [ˈkrəʊməsəʊm] n. 染色体",
    "n.",
    "染色体"
  ],
  [
    43,
    "chronicle",
    "The archive holds a chronicle of the town's early history.",
    "档案馆保存着一部记载该镇早期历史的编年史。",
    1792,
    "chronicle [krɒnɪkl] n. 编年史，年代记 v. 把…载入编年史，记载",
    "n.",
    "编年史，年代记 v. 把…载入编年史，记载"
  ],
  [
    44,
    "chronological",
    "Please arrange the photographs in chronological order.",
    "请按时间先后顺序排列这些照片。",
    1793,
    "chronological [ˌkrɒnəˈlɒdʒɪkəl] adj. 按年月顺序排列的",
    "adj.",
    "按年月顺序排列的"
  ],
  [
    48,
    "chuck",
    "He chucked the empty bottle into the recycling bin.",
    "他把空瓶子扔进了回收箱。",
    1797,
    "*chuck [tʃʌk] v. . 1. 抛掷，投掷 2. 放弃，抛弃",
    "v.",
    ". 1. 抛掷，投掷 2. 放弃，抛弃"
  ],
  [
    49,
    "chuckle",
    "She chuckled at the joke but tried not to wake the baby.",
    "她听到笑话轻声笑了起来，却尽量不吵醒宝宝。",
    1798,
    "chuckle [ˈtʃʌkl] v. 轻声地笑，窃笑",
    "v.",
    "轻声地笑，窃笑"
  ],
  [
    51,
    "chunk",
    "She cut a large chunk of bread for the hungry child.",
    "她给饥饿的孩子切了一大块面包。",
    1800,
    "chunk [tʃʌŋk] n. 厚厚一片，大块",
    "n.",
    "厚厚一片，大块"
  ],
  [
    52,
    "churchyard",
    "Old gravestones stood beneath the trees in the churchyard.",
    "教堂墓地里，古老的墓碑立在树下。",
    1802,
    "churchyard [ˈtʃəːtʃjɑːd] n. 教堂墓地",
    "n.",
    "教堂墓地"
  ],
  [
    54,
    "churn",
    "The farmer poured cream into the wooden churn to make butter.",
    "农夫把奶油倒进木制搅乳器里制作黄油。",
    1804,
    "*churn [tʃɜːn] n. 搅乳器 v. 剧烈搅动，(波浪)翻腾",
    "n.",
    "搅乳器 v. 剧烈搅动，(波浪)翻腾"
  ],
  [
    60,
    "circulation",
    "Daily walks can help improve blood circulation.",
    "每天散步有助于改善血液循环。",
    1814,
    "circulation [ˌsɜːkjʊˈleɪʃən] n. 1. 循环 2. 流通，流传 3. (报纸、书刊的)销售量",
    "n.",
    "1. 循环 2. 流通，流传 3. (报纸、书刊的)销售量"
  ],
  [
    62,
    "circumstantial",
    "The police had circumstantial evidence but no eyewitness account.",
    "警方掌握了间接证据，却没有目击证词。",
    1817,
    "*circumstantial [ˌsɜːkəmˈstænʃəl] adj. 1. (指描述)详细的 2. (指证据)有充分细节却无法证实的",
    "adj.",
    "1. (指描述)详细的 2. (指证据)有充分细节却无法证实的"
  ],
  [
    63,
    "circumvent",
    "The team found a legal way to circumvent the outdated restriction.",
    "团队找到了合法绕过这项过时限制的办法。",
    1818,
    "*circumvent [ˌsɜːkəmˈvent] v. 绕过，巧妙地回避，设法回避",
    "v.",
    "绕过，巧妙地回避，设法回避"
  ],
  [
    64,
    "citizenship",
    "After living there for ten years, she applied for citizenship.",
    "在当地生活十年后，她申请了公民身份。",
    1822,
    "citizenship [ˈsɪtɪzənʃɪp] n. 公民资格，公民身份",
    "n.",
    "公民资格，公民身份"
  ],
  [
    65,
    "civic",
    "Students joined a civic project to clean up the town square.",
    "学生们参加了一项清理城镇广场的市民公益项目。",
    1824,
    "civic [ˈsɪvɪk] adj. 城市的，都市的，市民的，公民的",
    "adj.",
    "城市的，都市的，市民的，公民的"
  ],
  [
    66,
    "civilian",
    "The rescue team helped civilians leave the damaged buildings.",
    "救援队帮助平民撤离受损建筑。",
    1826,
    "civilian [sɪˈvɪlɪən] n. &adj. 平民，平民的",
    "n.&adj.",
    "平民，平民的"
  ],
  [
    67,
    "clad",
    "The climbers were clad in thick waterproof jackets.",
    "登山者身穿厚实的防水夹克。",
    1829,
    "*clad [klæd] adj. 穿着衣服的，被覆盖的",
    "adj.",
    "穿着衣服的，被覆盖的"
  ],
  [
    68,
    "claimant",
    "The claimant submitted receipts to support her insurance claim.",
    "索赔人提交了收据，以支持她的保险索赔。",
    1831,
    "*claimant [ˈkleɪmənt] n. 申请者，要求者，索赔人",
    "n.",
    "申请者，要求者，索赔人"
  ],
  [
    71,
    "clamp",
    "He held the wooden boards together with a metal clamp.",
    "他用一个金属夹具把木板固定在一起。",
    1835,
    "clamp [klæmp] n. 钳，夹子 v. 钳紧，夹住",
    "n.",
    "钳，夹子 v. 钳紧，夹住"
  ],
  [
    72,
    "clan",
    "The entire clan gathered for a reunion in the ancestral village.",
    "整个家族回到祖居的村庄团聚。",
    1836,
    "clan [klæn] n. 氏族，家族，宗派",
    "n.",
    "氏族，家族，宗派"
  ],
  [
    73,
    "clandestine",
    "They held a clandestine meeting to avoid attracting attention.",
    "他们秘密开会，以免引起注意。",
    1837,
    "*clandestine [klænˈdestɪn] adj. 秘密的，保密的，暗中的",
    "adj.",
    "秘密的，保密的，暗中的"
  ],
  [
    74,
    "clang",
    "The iron gate clanged shut behind the visitors.",
    "铁门在来访者身后哐当一声关上了。",
    1838,
    "clang [klæŋ] v. 发出叮当声",
    "v.",
    "发出叮当声"
  ],
  [
    76,
    "clash",
    "The two groups clashed over plans to close the library.",
    "两个团体因关闭图书馆的计划发生冲突。",
    1842,
    "clash [klæʃ] v. 1. 冲突，交锋，产生矛盾 2. 发出金属的撞击声  n. 冲突，不一致",
    "v.",
    "1. 冲突，交锋，产生矛盾 2. 发出金属的撞击声  n. 冲突，不一致"
  ],
  [
    79,
    "classified",
    "The officer kept the classified documents in a locked cabinet.",
    "这名军官把机密文件存放在上锁的柜子里。",
    1848,
    "classified [ˈklæsɪfaɪd] adj. 1. 分类的，被归入类别的 2. (政府情报等)机密的，保密的",
    "adj.",
    "1. 分类的，被归入类别的 2. (政府情报等)机密的，保密的"
  ],
  [
    81,
    "clatter",
    "Pots and pans clattered as the cook searched the cupboard.",
    "厨师翻找橱柜时，锅碗瓢盆哗啦作响。",
    1852,
    "*clatter [ˈklætə] v. 发出哗啦声，发出碰撞声",
    "v.",
    "发出哗啦声，发出碰撞声"
  ],
  [
    83,
    "claustrophobia",
    "Her claustrophobia made the crowded lift difficult to endure.",
    "她有幽闭恐惧症，拥挤的电梯让她难以忍受。",
    1854,
    "*claustrophobia [ˌklɔːstrəˈfəʊbɪə] n. 幽闭恐怖(症)",
    "n.",
    "幽闭恐怖(症)"
  ],
  [
    86,
    "cleanse",
    "The nurse used sterile water to cleanse the wound.",
    "护士用无菌水清洗伤口。",
    1859,
    "*cleanse [ˈklenz] v. 使清洁，净化，使纯洁",
    "v.",
    "使清洁，净化，使纯洁"
  ],
  [
    87,
    "clearance",
    "The aircraft waited for clearance to take off.",
    "飞机等待起飞许可。",
    1861,
    "clearance [ˈklɪərəns] n. 1. 清除，清理 2. 许可(证)，批准 || a clearance sale (商店)清仓大贱卖",
    "n.",
    "1. 清除，清理 2. 许可(证)，批准 || a clearance sale (商店)清仓大贱卖"
  ],
  [
    89,
    "cleavage",
    "The election revealed a deep cleavage between urban and rural voters.",
    "这次选举暴露了城乡选民之间的深刻分歧。",
    1863,
    "*cleavage [ˈkliːvɪdʒ] n. 裂缝，分裂",
    "n.",
    "裂缝，分裂"
  ],
  [
    90,
    "cleave",
    "The woodcutter used an axe to cleave the log in two.",
    "伐木工用斧头把木头劈成两半。",
    1864,
    "*cleave [kliːv] v. 劈开，砍开",
    "v.",
    "劈开，砍开"
  ],
  [
    91,
    "clench",
    "She clenched her fists as she listened to the accusation.",
    "听着指控，她握紧了拳头。",
    1865,
    "clench [klentʃ] v. 1. 握紧(拳头等)，咬紧(牙关)  2. 捏紧，抓牢",
    "v.",
    "1. 握紧(拳头等)，咬紧(牙关)  2. 捏紧，抓牢"
  ],
  [
    94,
    "cliche",
    "The speech ended with a tired cliche about chasing your dreams.",
    "演讲以一句关于追逐梦想的陈词滥调收尾。",
    1870,
    "*cliche [ˈkliːʃeɪ] n. 陈词滥调",
    "n.",
    "陈词滥调"
  ],
  [
    95,
    "click",
    "The camera made a sharp click when she pressed the shutter.",
    "她按下快门时，相机发出清脆的咔嗒声。",
    1871,
    "click [klɪk] n. (摄影机等的)卡嗒声  v. 1. 发出卡嗒声  2. 露出端倪，顿悟 3. 成功",
    "n.",
    "(摄影机等的)卡嗒声  v. 1. 发出卡嗒声  2. 露出端倪，顿悟 3. 成功"
  ],
  [
    97,
    "climactic",
    "The film's climactic battle brought the story to a close.",
    "电影高潮部分的决战为故事画上了句号。",
    1874,
    "*climactic [klaɪˈmæktɪk] adj. 高潮的，巅峰的，顶点的",
    "adj.",
    "高潮的，巅峰的，顶点的"
  ],
  [
    99,
    "clinch",
    "The final goal clinched the championship for the home team.",
    "最后一粒进球帮助主队锁定冠军。",
    1878,
    "*clinch [klɪntʃ] v. 1. 钉牢 2. 解决，确定，决定 3. (拳击)扭住(对方)，互相扭住",
    "v.",
    "1. 钉牢 2. 解决，确定，决定 3. (拳击)扭住(对方)，互相扭住"
  ]
];
test('TEM-013 60 natural bilingual draft rewrites preserve original source and review flags',()=>{
 assert.equal(result.task_id,'tem-013');
 assert.equal(result.status,'proposal');
 assert.equal(result.input_sha256,task.sha256);
 assert.equal(result.entries.length,input.entries.length);
 assert.equal(expected.length,60);
 assert.equal(new Set(expected.map(x=>x[0])).size,60);
 for(let i=0;i<result.entries.length;i++){
  assert.deepEqual(result.entries[i].identity,input.entries[i].identity,'source identity row '+i);
  assert.deepEqual(result.entries[i].original,input.entries[i].current,'source original row '+i);
  assert.equal(result.entries[i].verification,'needs-review');
  assert.equal(result.entries[i].external_human_review,false);
  assert.equal(result.entries[i].full_dictionary_senses_reviewed,false);
  assert.deepEqual(result.entries[i].evidence,[]);
 }
 for(const [i,word,en,cn,line,raw,pos,meaning] of expected){
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
});
