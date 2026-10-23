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
    "tem-010",
    68,
    "Buddha",
    "A statue of the Buddha stood at the temple entrance.",
    "一尊佛陀雕像立在寺庙入口处。",
    1378,
    "Buddha [ˈbʊdə] n. 佛，佛陀",
    "n.",
    "佛，佛陀"
  ],
  [
    "tem-010",
    69,
    "Buddhism",
    "She began studying Buddhism while researching Asian history.",
    "她在研究亚洲历史时开始学习佛教。",
    1379,
    "Buddhism [ˈbʊdɪzəm] n. 佛教",
    "n.",
    "佛教"
  ],
  [
    "tem-010",
    70,
    "Buddhist",
    "As a Buddhist, she meditates every morning.",
    "作为一名佛教徒，她每天早晨都会冥想。",
    1380,
    "Buddhist [ˈbʊdɪst] n. 佛教徒 adj. 佛教的，佛的",
    "n.",
    "佛教徒 adj. 佛教的，佛的"
  ],
  [
    "tem-010",
    71,
    "buddy",
    "My old school buddy helped me move into the flat.",
    "我的老同学兼好友帮我搬进了公寓。",
    1381,
    "*buddy [ˈbʌdɪ] n. 1. 同伴，伙伴，好朋友 2. 老兄，老弟(用作称呼)",
    "n.",
    "1. 同伴，伙伴，好朋友 2. 老兄，老弟(用作称呼)"
  ],
  [
    "tem-010",
    72,
    "budge",
    "The heavy cupboard would not budge, even when we pushed together.",
    "尽管我们一起推，那个沉重的橱柜还是纹丝不动。",
    1382,
    "*budge [bʌdʒ] v. (使)微微移动",
    "v.",
    "(使)微微移动"
  ],
  [
    "tem-010",
    73,
    "buff",
    "The walls were painted a warm buff colour.",
    "墙壁被刷成了温暖的浅黄褐色。",
    1384,
    "*buff [bʌf] n. &adj. 暗黄色(的)",
    "n.&adj.",
    "暗黄色(的)"
  ],
  [
    "tem-010",
    74,
    "buffalo",
    "A herd of buffalo crossed the grassland at dawn.",
    "黎明时，一群野牛穿过草原。",
    1385,
    "buffalo [ˈbʌfələʊ] n. 水牛，野牛",
    "n.",
    "水牛，野牛"
  ],
  [
    "tem-010",
    75,
    "buffer",
    "The trees form a buffer between the houses and the busy road.",
    "这些树木在住宅与繁忙的道路之间形成一道缓冲屏障。",
    1386,
    "*buffer [ˈbʌfə] n. 起缓冲作用的人(物)，缓冲器 v. 缓冲，减轻",
    "n.",
    "起缓冲作用的人(物)，缓冲器 v. 缓冲，减轻"
  ],
  [
    "tem-010",
    78,
    "buggy",
    "They rode through the village in a horse-drawn buggy.",
    "他们乘坐一辆马拉轻便车穿过村庄。",
    1390,
    "*buggy [ˈbʌɡɪ] n. 1. 轻型马车 2. 手推车，婴儿车",
    "n.",
    "1. 轻型马车 2. 手推车，婴儿车"
  ],
  [
    "tem-010",
    79,
    "bugle",
    "The soldier sounded the bugle at sunrise.",
    "士兵在日出时吹响了军号。",
    1391,
    "bugle [ˈbjuːɡl] n. 军号，喇叭",
    "n.",
    "军号，喇叭"
  ],
  [
    "tem-010",
    80,
    "builder",
    "The builder repaired the damaged wall before winter.",
    "建筑工人在入冬前修好了受损的墙。",
    1393,
    "builder [ˈbɪldə] n. 1. 建筑工人，施工人员 2. 建设者，建立者",
    "n.",
    "1. 建筑工人，施工人员 2. 建设者，建立者"
  ],
  [
    "tem-010",
    82,
    "bulge",
    "A bulge appeared in the wall after the heavy rain.",
    "暴雨过后，墙上鼓起了一块。",
    1396,
    "*bulge [bʌldʒ] n. 1. 突出，膨胀 2. 激增 v. 突出，膨胀",
    "n.",
    "1. 突出，膨胀 2. 激增 v. 突出，膨胀"
  ],
  [
    "tem-010",
    84,
    "bulky",
    "The bulky suitcase barely fitted into the overhead compartment.",
    "那个笨重的行李箱勉强塞进了头顶的行李架。",
    1398,
    "*bulky [ˈbʌlkɪ] adj. 庞大的，巨大的，笨重的",
    "adj.",
    "庞大的，巨大的，笨重的"
  ],
  [
    "tem-010",
    86,
    "bulldozer",
    "A bulldozer cleared the fallen trees from the road.",
    "推土机清除了挡在道路上的倒树。",
    1400,
    "bulldozer [ˈbʊldəʊzə] n. 推土机",
    "n.",
    "推土机"
  ],
  [
    "tem-010",
    89,
    "bullheaded",
    "His bullheaded refusal to listen delayed the project.",
    "他固执地拒绝听取意见，拖延了项目进度。",
    1403,
    "*bullheaded [ˈbʊlˌhedɪd] adj. (derog)愚笨固执的，顽固的",
    "adj.",
    "(derog)愚笨固执的，顽固的"
  ],
  [
    "tem-010",
    90,
    "bullish",
    "Investors grew bullish on the company's shares after its strong earnings report.",
    "这家公司发布强劲财报后，投资者开始看涨其股票。",
    1404,
    "bullish [ˈbʊlɪʃ] adj. (行情等)看涨的，上涨的",
    "adj.",
    "(行情等)看涨的，上涨的"
  ],
  [
    "tem-010",
    91,
    "bum",
    "He landed on his bum when he slipped on the wet grass.",
    "他在湿草地上滑倒，一屁股坐在了地上。",
    1406,
    "*bum [bʌm] n. 1. 屁股，臀部 2. 流浪汉，乞丐，懒汉",
    "n.",
    "1. 屁股，臀部 2. 流浪汉，乞丐，懒汉"
  ],
  [
    "tem-010",
    92,
    "bump",
    "I bumped my head on the low doorway.",
    "我在低矮的门框上撞到了头。",
    1407,
    "bump [bʌmp] v. 1. 碰撞 2. 撞击 3. 颠簸地行驶 n. 1. 碰撞 2. 肿块",
    "v.",
    "1. 碰撞 2. 撞击 3. 颠簸地行驶 n. 1. 碰撞 2. 肿块"
  ],
  [
    "tem-010",
    93,
    "bumper",
    "The car's rear bumper was dented in the collision.",
    "汽车的后保险杠在碰撞中凹陷了。",
    1408,
    "*bumper [ˈbʌmpə] n. 汽车前后的保险杠，减震物 adj. 特大的，丰盛的",
    "n.",
    "汽车前后的保险杠，减震物 adj. 特大的，丰盛的"
  ],
  [
    "tem-010",
    94,
    "bun",
    "She bought a warm cinnamon bun from the bakery.",
    "她从面包店买了一个热乎乎的肉桂甜面包。",
    1409,
    "bun [bʌn] n. 1. 小而圆的甜面包 2. (头发扎成的)髻",
    "n.",
    "1. 小而圆的甜面包 2. (头发扎成的)髻"
  ],
  [
    "tem-010",
    96,
    "bungalow",
    "They retired to a small bungalow near the coast.",
    "他们退休后搬进了海边的一栋小平房。",
    1412,
    "bungalow [ˈbʌŋɡələʊ] n. 平房",
    "n.",
    "平房"
  ],
  [
    "tem-010",
    97,
    "bunk",
    "The children slept in the top and bottom bunks of the cabin.",
    "孩子们睡在小木屋里双层床的上下铺。",
    1413,
    "*bunk [bʌŋk] n. 1. (架设于壁上的)狭窄铺位 2. 双层床的上铺或下铺",
    "n.",
    "1. (架设于壁上的)狭窄铺位 2. 双层床的上铺或下铺"
  ],
  [
    "tem-010",
    98,
    "bunker",
    "His golf ball landed in a bunker beside the green.",
    "他的高尔夫球落在果岭旁的沙坑里。",
    1414,
    "*bunker [ˈbʌŋkə] n. 1. (船上的)煤仓 2. (高尔夫的)沙坑",
    "n.",
    "1. (船上的)煤仓 2. (高尔夫的)沙坑"
  ],
  [
    "tem-010",
    99,
    "buoy",
    "A red buoy marked the entrance to the harbour.",
    "一只红色浮标标示着港口入口。",
    1415,
    "buoy [bɔɪ] n. 浮标，浮筒 v. 1. 使浮着 2. 鼓励，支持",
    "n.",
    "浮标，浮筒 v. 1. 使浮着 2. 鼓励，支持"
  ],
  [
    "tem-011",
    0,
    "buoyancy",
    "The life jacket's buoyancy kept her afloat in the water.",
    "救生衣的浮力让她能够漂浮在水面上。",
    1416,
    "*buoyancy [ˈbɔɪənsɪ] n. 1. 浮性，浮力 2. 轻松愉快的心情，乐观情绪 3. (物价、商业活动)回升，保持上涨走势",
    "n.",
    "1. 浮性，浮力 2. 轻松愉快的心情，乐观情绪 3. (物价、商业活动)回升，保持上涨走势"
  ],
  [
    "tem-011",
    2,
    "burdensome",
    "The new reporting requirements proved burdensome for small businesses.",
    "新的报告要求给小企业带来了沉重负担。",
    1418,
    "burdensome [ˈbɜːdnsəm] adj. 沉重的，麻烦的",
    "adj.",
    "沉重的，麻烦的"
  ],
  [
    "tem-011",
    5,
    "bureaucrat",
    "A senior bureaucrat approved the funding request.",
    "一名高级官员批准了拨款申请。",
    1421,
    "bureaucrat[ˈbjʊərəkræt] n. 1. 官员，官僚 2. 官僚作风的人",
    "n.",
    "1. 官员，官僚 2. 官僚作风的人"
  ],
  [
    "tem-011",
    7,
    "burglary",
    "Police investigated a burglary at the jewellery shop.",
    "警方调查了一起发生在珠宝店的入室盗窃案。",
    1423,
    "burglary [ˈbɜːɡlərɪ] n. 夜盗行为，盗窃",
    "n.",
    "夜盗行为，盗窃"
  ],
  [
    "tem-011",
    8,
    "burial",
    "The family arranged a quiet burial in the village cemetery.",
    "家人在村里的墓地安排了一场简单的葬礼。",
    1424,
    "burial [ˈberɪəl] n. 埋葬，葬礼",
    "n.",
    "埋葬，葬礼"
  ],
  [
    "tem-011",
    9,
    "burrow",
    "The rabbit disappeared into its burrow beneath the hedge.",
    "兔子钻进了树篱下的洞穴。",
    1426,
    "*burrow [ˈbʌrəʊ] n. 洞穴，藏身处  v. 1. 掘洞穴 2. 寻找，翻找",
    "n.",
    "洞穴，藏身处  v. 1. 掘洞穴 2. 寻找，翻找"
  ],
  [
    "tem-011",
    11,
    "bushel",
    "The farmer sold a bushel of apples at the market.",
    "农民在市场上卖出了一蒲式耳苹果。",
    1431,
    "bushel [ˈbʊʃəl] n. 蒲式耳 (计量谷物等的容量单位)",
    "n.",
    "蒲式耳 (计量谷物等的容量单位)"
  ],
  [
    "tem-011",
    13,
    "businessman",
    "The businessman invested in a new workshop outside the city.",
    "这位商人在城外投资建了一间新车间。",
    1434,
    "businessman [ˈbɪznɪsmən] (pl businessmen) n. 商人，实业家",
    "n.",
    "商人，实业家"
  ],
  [
    "tem-011",
    16,
    "bustle",
    "Shoppers bustled through the market before the holiday.",
    "节日前，购物者在市场里匆忙穿行。",
    1437,
    "*bustle [ˈbʌsl] v. 喧扰地忙乱，匆忙，奔忙 n. 热闹的活动",
    "v.",
    "喧扰地忙乱，匆忙，奔忙 n. 热闹的活动"
  ],
  [
    "tem-011",
    17,
    "butler",
    "The butler greeted guests at the front door.",
    "男管家在前门迎接客人。",
    1441,
    "butler [ˈbʌtlə] n. 男管家",
    "n.",
    "男管家"
  ],
  [
    "tem-011",
    20,
    "buttock",
    "He bruised his left buttock when he fell down the stairs.",
    "他从楼梯上摔下来，左侧臀部擦伤了。",
    1446,
    "*buttock [ˈbʌtək] n. (半边)屁股，臀部",
    "n.",
    "(半边)屁股，臀部"
  ],
  [
    "tem-011",
    21,
    "buzz",
    "A low buzz came from the faulty light fixture.",
    "坏掉的灯具发出低沉的嗡嗡声。",
    1449,
    "*buzz [bʌz] n. 1. 嗡嗡声 2. 嘈杂声 v. 1. 发出嗡嗡声 2. 发出嘈杂声",
    "n.",
    "1. 嗡嗡声 2. 嘈杂声 v. 1. 发出嗡嗡声 2. 发出嘈杂声"
  ],
  [
    "tem-011",
    22,
    "buzz word",
    "Sustainability has become a buzz word in the fashion industry.",
    "可持续发展已成为时尚行业的流行术语。",
    1450,
    "*buzz word [bʌz wɜːd] n. (流行而时髦的)专业词语，技术用语",
    "n.",
    "(流行而时髦的)专业词语，技术用语"
  ],
  [
    "tem-011",
    24,
    "bypass",
    "The new bypass keeps heavy traffic out of the town centre.",
    "新建的绕城公路让重型车辆不再穿过市中心。",
    1453,
    "*bypass [ˈbaɪpɑːs] n. (绕过市镇的)旁道，迂回道  v. 绕过，回避",
    "n.",
    "(绕过市镇的)旁道，迂回道  v. 绕过，回避"
  ],
  [
    "tem-011",
    25,
    "by-product",
    "Heat is a by-product of this chemical reaction.",
    "热量是这一化学反应的副产物。",
    1454,
    "by-product [ˈbaɪˌprɒdʌkt] n. 副产品",
    "n.",
    "副产品"
  ],
  [
    "tem-011",
    26,
    "byte",
    "A byte usually consists of eight bits.",
    "一个字节通常由八个二进制位组成。",
    1455,
    "byte [baɪt] n. (二进制)字节，(二进)位组",
    "n.",
    "(二进制)字节，(二进)位组"
  ],
  [
    "tem-011",
    28,
    "cabaret",
    "The hotel stages a cabaret every Saturday night.",
    "这家酒店每周六晚上都会举办歌舞表演。",
    1457,
    "*cabaret [ˈkæbəreɪ] n. (餐馆、夜总会等的)歌舞表演",
    "n.",
    "(餐馆、夜总会等的)歌舞表演"
  ],
  [
    "tem-011",
    32,
    "cache",
    "Police discovered a cache of stolen jewellery beneath the floorboards.",
    "警方在地板下发现了一批藏匿的失窃珠宝。",
    1462,
    "*cache [kæʃ] n. 密藏的物品",
    "n.",
    "密藏的物品"
  ],
  [
    "tem-011",
    33,
    "cackle",
    "The hens cackled loudly when the farmer entered the yard.",
    "农夫走进院子时，母鸡们大声咯咯叫起来。",
    1463,
    "*cackle [ˈkækl] v. 1. (母鸡)咯咯叫 2. (刺耳地)格格地笑",
    "v.",
    "1. (母鸡)咯咯叫 2. (刺耳地)格格地笑"
  ],
  [
    "tem-011",
    34,
    "cactus",
    "A cactus can store water in its thick stem.",
    "仙人掌能在粗壮的茎中储存水分。",
    1464,
    "cactus [ˈkæktəs] n. 仙人掌",
    "n.",
    "仙人掌"
  ],
  [
    "tem-011",
    35,
    "cadet",
    "The police cadet practised directing traffic.",
    "这名警校学员练习指挥交通。",
    1466,
    "cadet [kəˈdet] n. (军校或警官学校的)学生",
    "n.",
    "(军校或警官学校的)学生"
  ],
  [
    "tem-011",
    36,
    "cadre",
    "A local cadre coordinated relief supplies after the flood.",
    "一名当地干部在洪水过后协调救灾物资。",
    1467,
    "cadre [ˈkɑːdə] n. 干部",
    "n.",
    "干部"
  ],
  [
    "tem-011",
    37,
    "cajole",
    "She cajoled her brother into helping her move the sofa.",
    "她软磨硬泡，说服弟弟帮忙搬沙发。",
    1471,
    "*cajole [kəˈdʒəʊl] v. (以甜言蜜语)哄骗，诱骗",
    "v.",
    "(以甜言蜜语)哄骗，诱骗"
  ],
  [
    "tem-011",
    38,
    "calamity",
    "The drought was a calamity for farmers who depended on the river.",
    "这场干旱对依赖河水的农民来说是一场灾难。",
    1473,
    "*calamity [kəlˈæmətɪ] n. 大灾祸，灾难，极不幸的事件",
    "n.",
    "大灾祸，灾难，极不幸的事件"
  ],
  [
    "tem-011",
    40,
    "calculating",
    "His calculating smile made her question his motives.",
    "他那工于心计的笑容让她怀疑他的动机。",
    1476,
    "*calculating [ˈkælkjʊleɪtɪŋ] adj. (derog)工于心计的，用尽心机的",
    "adj.",
    "(derog)工于心计的，用尽心机的"
  ],
  [
    "tem-011",
    43,
    "calculus",
    "She struggled with calculus until her tutor explained derivatives.",
    "在辅导老师讲解导数之前，她一直学不好微积分。",
    1479,
    "calculus [ˈkælkjʊləs] n. 微积分(学)",
    "n.",
    "微积分(学)"
  ],
  [
    "tem-011",
    46,
    "callous",
    "His callous remarks upset the grieving family.",
    "他冷漠无情的话语伤害了悲痛中的家人。",
    1486,
    "*callous [ˈkæləs] adj. 无同情心的，硬心肠的，冷漠的",
    "adj.",
    "无同情心的，硬心肠的，冷漠的"
  ],
  [
    "tem-011",
    47,
    "callow",
    "The callow recruit underestimated how difficult the work would be.",
    "这名缺乏经验的新兵低估了工作的难度。",
    1487,
    "*callow [ˈkæləʊ] adj. 年幼的，未成熟的，无经验的",
    "adj.",
    "年幼的，未成熟的，无经验的"
  ],
  [
    "tem-011",
    48,
    "cameo",
    "The museum displayed a cameo carved with the profile of a Roman woman.",
    "博物馆展出了一枚刻有罗马女子侧面肖像的浮雕宝石。",
    1491,
    "*cameo [ˈkæmɪəʊ] n. 1. 刻有浮雕的宝石 2. (文艺或戏剧)小品",
    "n.",
    "1. 刻有浮雕的宝石 2. (文艺或戏剧)小品"
  ],
  [
    "tem-011",
    49,
    "camouflage",
    "The animal's mottled skin provided camouflage among the rocks.",
    "这种动物斑驳的皮肤使它在岩石间形成了保护色。",
    1493,
    "*camouflage [ˈkæməflɑːʒ] n. 伪装，保护色，掩饰 v. 用伪装遮掩(某人或某事物)",
    "n.",
    "伪装，保护色，掩饰 v. 用伪装遮掩(某人或某事物)"
  ],
  [
    "tem-011",
    52,
    "Canadian",
    "A Canadian tourist asked us for directions near the station.",
    "一位加拿大游客在车站附近向我们问路。",
    1499,
    "Canadian [kəˈneɪdɪən] n. 加拿大人 adj. 加拿大(人)的",
    "n.",
    "加拿大人 adj. 加拿大(人)的"
  ]
];
test('TEM-010/011: 55 natural bilingual drafts retain source identity and needs-review',()=>{
 assert.equal(expected.length,55);
 assert.equal(new Set(expected.map(x=>x[0]+':'+x[1])).size,55);
 const cache={};
 for(const [taskId,i,word,en,cn,line,raw,pos,meaning] of expected){
  if(!cache[taskId]){
   const m=manifest.files.find(x=>x.task_id===taskId);
   assert.ok(m,'manifest task missing: '+taskId);
   const input=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',m.file),'utf8'));
   const result=JSON.parse(fs.readFileSync(path.join(root,'docs/model-task-results/worker-A',taskId,'result.json'),'utf8'));
   assert.equal(result.task_id,taskId);
   assert.equal(result.input_sha256,m.sha256);
   assert.equal(result.entries.length,input.entries.length);
   cache[taskId]={input,result};
  }
  const {input,result}=cache[taskId],r=result.entries[i],src=input.entries[i];
  assert.equal(r.identity.word,word);
  assert.equal(r.identity.source_line,line);
  assert.equal(r.identity.source_raw,raw);
  assert.deepEqual(r.identity,src.identity);
  assert.deepEqual(r.original,src.current);
  assert.equal(r.selected_sense.pos,pos);
  assert.equal(r.selected_sense.meaning,meaning);
  assert.equal(r.proposed.example,en);
  assert.equal(r.proposed.example_translation,cn);
  assert.equal(r.draft_method,'editorial-context-rewrite-needs-review');
  assert.equal(r.verification,'needs-review');
  assert.equal(r.external_human_review,false);
  assert.equal(r.full_dictionary_senses_reviewed,false);
  assert.deepEqual(r.evidence,[]);
  assert.ok(en.endsWith('.')&&cn.endsWith('。'));
  const matched=rules.filter(rule=>rule.pattern.test(rule.id==='translation-metalinguistic'?cn:en)).map(rule=>rule.id);
  assert.deepEqual(matched,[],'mechanical template in '+taskId+': '+word);
 }
});
