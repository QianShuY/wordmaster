'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {rules} = require('../scripts/audit-abc-example-quality');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const expected = [
  [
    "tem-011",
    53,
    "canary",
    "A yellow canary sang from its cage by the window.",
    "一只黄色的金丝雀在窗边的笼子里鸣唱。",
    1501,
    "canary [kəˈneərɪ] n. 1. 金丝雀 2. 淡黄色(=canary yellow)",
    "n.",
    "1. 金丝雀 2. 淡黄色(=canary yellow)"
  ],
  [
    "tem-011",
    54,
    "candid",
    "She gave a candid account of why the project had failed.",
    "她坦诚地讲述了项目失败的原因。",
    1504,
    "*candid [ˈkændɪd] adj. 忠实的，率直的，坦诚的",
    "adj.",
    "忠实的，率直的，坦诚的"
  ],
  [
    "tem-011",
    55,
    "cane",
    "He leaned on a wooden cane as he walked up the steps.",
    "他拄着一根木手杖走上台阶。",
    1508,
    "cane [keɪn] n. 1. 细长而有节的茎 2. 手杖",
    "n.",
    "1. 细长而有节的茎 2. 手杖"
  ],
  [
    "tem-011",
    56,
    "canine",
    "The clinic specialises in canine health and nutrition.",
    "这家诊所专门研究犬类健康与营养。",
    1509,
    "canine [ˈkeɪnaɪn] adj. 犬的，犬属的 n. 犬，犬属动物",
    "adj.",
    "犬的，犬属的 n. 犬，犬属动物"
  ],
  [
    "tem-011",
    57,
    "cannery",
    "The fish cannery hired extra workers during the summer season.",
    "这家鱼类罐头厂在夏季旺季增聘了工人。",
    1510,
    "cannery [ˈkænərɪ] n. 罐头食品厂",
    "n.",
    "罐头食品厂"
  ],
  [
    "tem-011",
    58,
    "cannibal",
    "The biologist called the spider a cannibal after it ate another of its own species.",
    "这只蜘蛛吃掉同类后，生物学家称它为同类相食的动物。",
    1511,
    "*cannibal [ˈkænɪbəl] n. 1. 食人肉者 2. 同类相食的动物",
    "n.",
    "1. 食人肉者 2. 同类相食的动物"
  ],
  [
    "tem-011",
    60,
    "canny",
    "The canny buyer compared prices at three shops before making an offer.",
    "精明的买家先比较了三家商店的价格才出价。",
    1513,
    "*canny [ˈkænɪ] adj. 精明的，机警的，不易受骗的",
    "adj.",
    "精明的，机警的，不易受骗的"
  ],
  [
    "tem-011",
    62,
    "canon",
    "The historian studied how the church's canon changed over the centuries.",
    "历史学家研究了教会法规在几个世纪中的变化。",
    1515,
    "*canon [ˈkænən] n. 1. 教会法规 2. (行为或思想的)规范; 准则 3. (任职大教堂的)教士",
    "n.",
    "1. 教会法规 2. (行为或思想的)规范; 准则 3. (任职大教堂的)教士"
  ],
  [
    "tem-011",
    63,
    "canopy",
    "The pilot closed the cockpit canopy before takeoff.",
    "飞行员在起飞前关上了驾驶舱盖。",
    1516,
    "*canopy [ˈkænəpɪ] n. 1. (床等物上面的)篷盖 2. (飞机的)驾驶舱盖",
    "n.",
    "1. (床等物上面的)篷盖 2. (飞机的)驾驶舱盖"
  ],
  [
    "tem-011",
    64,
    "canter",
    "The horse broke into a gentle canter along the forest path.",
    "马沿着林间小路开始轻快地小跑。",
    1518,
    "*canter [ˈkæntə] n. 慢跑，小跑",
    "n.",
    "慢跑，小跑"
  ],
  [
    "tem-011",
    65,
    "Cantonese",
    "Her grandparents speak Cantonese at home.",
    "她的祖父母在家说粤语。",
    1519,
    "Cantonese [ˌkæntəˈniːz] n. & adj. 1. 粤语(的)，广州话(的) 2. 广州人(的)，广东人(的)",
    "n.&adj.",
    "1. 粤语(的)，广州话(的) 2. 广州人(的)，广东人(的)"
  ],
  [
    "tem-011",
    67,
    "canvass",
    "Volunteers canvassed residents for their views on the new bus route.",
    "志愿者向居民征询对新公交线路的意见。",
    1521,
    "*canvass [ˈkænvəs] v. 1. 在或向…游说(以争取选票或调查意见) 2. 详细检查，讨论",
    "v.",
    "1. 在或向…游说(以争取选票或调查意见) 2. 详细检查，讨论"
  ],
  [
    "tem-011",
    68,
    "canyon",
    "The river has carved a deep canyon through the red rock.",
    "河流在红色岩层中冲刷出一道深峡谷。",
    1522,
    "canyon [ˈkænjən] n. (AmE)(深的)峡谷",
    "n.",
    "(AmE)(深的)峡谷"
  ],
  [
    "tem-011",
    69,
    "capability",
    "The new sensor has the capability to detect tiny cracks in metal.",
    "这种新传感器能够检测金属中的细小裂纹。",
    1524,
    "capability [ˌkeɪpəˈbɪlətɪ] n. 1. 能力，才能 2. 素质，潜能",
    "n.",
    "1. 能力，才能 2. 素质，潜能"
  ],
  [
    "tem-011",
    72,
    "capillary",
    "Oxygen passes from each capillary into the surrounding tissue.",
    "氧气从每根毛细血管进入周围组织。",
    1529,
    "*capillary [kəˈpɪlərɪ] n. 毛细管，毛细血管",
    "n.",
    "毛细管，毛细血管"
  ],
  [
    "tem-011",
    74,
    "capitalist",
    "The novel portrays a wealthy capitalist who owns several factories.",
    "小说描写了一位拥有数家工厂的富有资本家。",
    1532,
    "capitalist [ˈkæpɪtlɪst] n. 1. 资本家，富豪 2. 资本主义者  adj. 资本主义的",
    "n.",
    "1. 资本家，富豪 2. 资本主义者  adj. 资本主义的"
  ],
  [
    "tem-011",
    75,
    "capitalize",
    "Remember to capitalize the first word of every sentence.",
    "记得把每个句子的第一个单词首字母大写。",
    1533,
    "capitalize [ˈkæpɪtəlaɪz] v. 1. 用大写字母写 2. 为…提供资金，投资于 ||capitalize on利用",
    "v.",
    "1. 用大写字母写 2. 为…提供资金，投资于 ||capitalize on利用"
  ],
  [
    "tem-011",
    76,
    "capitulate",
    "With supplies exhausted, the defenders agreed to capitulate.",
    "补给耗尽后，守军同意投降。",
    1534,
    "*capitulate [kəˈpɪtʃʊleɪt] v. (向某人)投降(指根据商定的条件)",
    "v.",
    "(向某人)投降(指根据商定的条件)"
  ],
  [
    "tem-011",
    77,
    "caprice",
    "The workers' schedules were subject to the manager's every caprice.",
    "员工的排班完全受经理反复无常的决定摆布。",
    1535,
    "*caprice [kəˈpriːs] n. 反复无常，善变",
    "n.",
    "反复无常，善变"
  ],
  [
    "tem-011",
    78,
    "capricious",
    "The capricious weather changed from sunshine to hail within minutes.",
    "天气变化无常，几分钟内就从晴天变成了冰雹天。",
    1536,
    "*capricious [kəˈprɪʃəs] adj. 反复无常的，善变的，任性的",
    "adj.",
    "反复无常的，善变的，任性的"
  ],
  [
    "tem-011",
    79,
    "capsize",
    "A sudden wave caused the small boat to capsize.",
    "一个突如其来的浪头使小船倾覆。",
    1537,
    "*capsize [kæpˈsaɪz] v. 使(船)倾覆，(船)倾覆",
    "v.",
    "使(船)倾覆，(船)倾覆"
  ],
  [
    "tem-011",
    80,
    "caption",
    "The caption beneath the photograph identifies the two scientists.",
    "照片下方的说明文字标出了两位科学家的身份。",
    1540,
    "caption [ˈkæpʃən] n. 图片上的说明文字，(报刊文章的)标题",
    "n.",
    "图片上的说明文字，(报刊文章的)标题"
  ],
  [
    "tem-011",
    81,
    "captivate",
    "The storyteller captivated the children with tales of the sea.",
    "讲故事的人用海上的故事深深吸引了孩子们。",
    1541,
    "*captivate [ˈkæptɪveɪt] v. 迷惑，吸引，使着迷",
    "v.",
    "迷惑，吸引，使着迷"
  ],
  [
    "tem-011",
    83,
    "captivity",
    "The rescued birds had spent years in captivity.",
    "这些获救的鸟此前被关养了多年。",
    1543,
    "*captivity [kæpˈtɪvətɪ] n. 被俘，被监禁",
    "n.",
    "被俘，被监禁"
  ],
  [
    "tem-011",
    84,
    "carat",
    "The ring contains a diamond weighing one carat.",
    "这枚戒指镶着一颗重一克拉的钻石。",
    1546,
    "*carat [ˈkærət] n. 开(黄金成色的单位，表示所含纯金量)，克拉(珠宝的重量单位)",
    "n.",
    "开(黄金成色的单位，表示所含纯金量)，克拉(珠宝的重量单位)"
  ],
  [
    "tem-011",
    85,
    "caravan",
    "A caravan of traders crossed the desert before sunrise.",
    "一支商队在日出前穿越了沙漠。",
    1547,
    "caravan [ˈkærəvæn] n. 1. (往返于沙漠等地带的)商队，旅行队  2. 结队成列的车马  3. 有篷的车辆，马戏团(吉普赛人)旅行用的大篷车",
    "n.",
    "1. (往返于沙漠等地带的)商队，旅行队  2. 结队成列的车马  3. 有篷的车辆，马戏团(吉普赛人)旅行用的大篷车"
  ],
  [
    "tem-011",
    87,
    "cardboard",
    "She cut a piece of cardboard to make a roof for the model house.",
    "她剪下一块厚纸板，给房屋模型做屋顶。",
    1552,
    "cardboard [ˈkɑːdbɔːd] n. 厚纸板",
    "n.",
    "厚纸板"
  ],
  [
    "tem-011",
    88,
    "cardiac",
    "The hospital opened a new cardiac care unit last month.",
    "这家医院上个月新开设了一个心脏护理病区。",
    1553,
    "*cardiac [ˈkɑːdɪæk] adj. 心脏(病)的",
    "adj.",
    "心脏(病)的"
  ],
  [
    "tem-011",
    89,
    "cardigan",
    "He put on a woollen cardigan when the room grew cold.",
    "屋里变冷时，他穿上了一件羊毛开衫。",
    1554,
    "cardigan [ˈkɑːdɪɡən] n. 开襟羊毛衫",
    "n.",
    "开襟羊毛衫"
  ],
  [
    "tem-011",
    92,
    "carefree",
    "The children enjoyed a carefree afternoon by the lake.",
    "孩子们在湖边度过了一个无忧无虑的下午。",
    1559,
    "carefree [ˈkeəfriː] adj. 无忧无虑的，无牵无挂的",
    "adj.",
    "无忧无虑的，无牵无挂的"
  ],
  [
    "tem-011",
    94,
    "caress",
    "She gave the sleeping child's cheek a gentle caress.",
    "她轻轻抚摸了熟睡孩子的脸颊。",
    1563,
    "*caress [kəˈres] n. 抚爱，轻吻  v. 抚爱，轻轻拥抱",
    "n.",
    "抚爱，轻吻  v. 抚爱，轻轻拥抱"
  ],
  [
    "tem-011",
    95,
    "caretaker",
    "The school caretaker unlocked the doors before classes began.",
    "学校管理员在上课前打开了各个门锁。",
    1564,
    "caretaker [ˈkeəteɪkə] n. (建筑物的)管理员 || caretaker government看守政府",
    "n.",
    "(建筑物的)管理员 || caretaker government看守政府"
  ],
  [
    "tem-011",
    97,
    "caricature",
    "The newspaper printed a caricature of the mayor with an enormous hat.",
    "报纸刊登了一幅讽刺画，把市长画成戴着一顶巨大的帽子。",
    1566,
    "*caricature [ˈkærɪkətjʊə] n. 漫画，讽刺画，讽刺文章 v. 将…画成漫画，讽刺地描述，使滑稽化",
    "n.",
    "漫画，讽刺画，讽刺文章 v. 将…画成漫画，讽刺地描述，使滑稽化"
  ],
  [
    "tem-011",
    98,
    "carnage",
    "Rescue workers were shocked by the carnage after the train crash.",
    "救援人员被列车事故后惨烈的伤亡景象震惊了。",
    1567,
    "*carnage [ˈkɑːnɪdʒ] n. 大屠杀，杀戮",
    "n.",
    "大屠杀，杀戮"
  ],
  [
    "tem-011",
    99,
    "carnal",
    "The poem contrasts carnal desire with spiritual devotion.",
    "这首诗将肉体欲望与精神上的虔诚作了对比。",
    1568,
    "*carnal [ˈkɑːnəl] adj. 肉体的，感官的",
    "adj.",
    "肉体的，感官的"
  ],
  [
    "tem-012",
    0,
    "carnation",
    "She pinned a white carnation to her jacket for the ceremony.",
    "她为参加典礼在外套上别了一朵白色康乃馨。",
    1569,
    "*carnation [kɑːˈneɪʃn] n. 康乃馨，麝香石竹",
    "n.",
    "康乃馨，麝香石竹"
  ],
  [
    "tem-012",
    1,
    "carnival",
    "Music and bright costumes filled the streets during the carnival.",
    "狂欢节期间，街上充满音乐和色彩鲜艳的服装。",
    1570,
    "carnival [ˈkɑːnɪvəl] n. 狂欢节",
    "n.",
    "狂欢节"
  ],
  [
    "tem-012",
    2,
    "carnivore",
    "Unlike deer, the wolf is a carnivore that hunts other animals.",
    "狼与鹿不同，是捕猎其他动物的食肉动物。",
    1571,
    "*carnivore [ˈkɑːnɪvɔː] n. 食肉动物",
    "n.",
    "食肉动物"
  ],
  [
    "tem-012",
    3,
    "carol",
    "The choir sang a Christmas carol outside the church.",
    "唱诗班在教堂外唱了一首圣诞颂歌。",
    1572,
    "carol [ˈkærəl] n. (圣诞)颂歌",
    "n.",
    "(圣诞)颂歌"
  ],
  [
    "tem-012",
    4,
    "carp",
    "A large carp swam slowly beneath the wooden bridge.",
    "一条大鲤鱼在木桥下缓缓游过。",
    1573,
    "*carp [kɑːp] n. 鲤鱼",
    "n.",
    "鲤鱼"
  ],
  [
    "tem-012",
    9,
    "carton",
    "He poured milk from a carton into his cereal bowl.",
    "他从纸盒里把牛奶倒进装有麦片的碗中。",
    1581,
    "carton [ˈkɑːtən] n. 纸板盒，纸板箱",
    "n.",
    "纸板盒，纸板箱"
  ],
  [
    "tem-012",
    10,
    "cartridge",
    "The record player needed a new cartridge to play the records properly.",
    "这台唱机需要更换唱头才能正常播放唱片。",
    1583,
    "*cartridge [ˈkɑːtrɪdʒ] n. 1. 弹药筒，子弹，枪弹 2. (电唱机)唱头 3. 录音带盒",
    "n.",
    "1. 弹药筒，子弹，枪弹 2. (电唱机)唱头 3. 录音带盒"
  ],
  [
    "tem-012",
    11,
    "cascade",
    "A cascade of water fell over the rocks into a clear pool.",
    "一道瀑布从岩石上倾泻而下，落入清澈的水潭。",
    1585,
    "*cascade [kæˈskeɪd] n. 瀑布 v. 像瀑布般冲下或倾泻",
    "n.",
    "瀑布 v. 像瀑布般冲下或倾泻"
  ],
  [
    "tem-012",
    16,
    "cashmere",
    "The scarf was made from fine cashmere and felt soft against her skin.",
    "这条围巾由优质羊绒制成，贴着皮肤十分柔软。",
    1591,
    "*cashmere [kæʃˈmɪə] n. 开司米(一种优质细软羊毛)",
    "n.",
    "开司米(一种优质细软羊毛)"
  ],
  [
    "tem-012",
    17,
    "cask",
    "The wine aged in an oak cask for several years.",
    "这款葡萄酒在橡木桶里陈酿了数年。",
    1593,
    "cask [kɑːsk] n. 木桶",
    "n.",
    "木桶"
  ],
  [
    "tem-012",
    19,
    "caste",
    "The reformers challenged the caste system that limited people's opportunities.",
    "改革者反对限制人们发展机会的种姓制度。",
    1596,
    "*caste [kɑːst] n. 1. 印度的世袭阶级 2. 任何排他的社会阶层",
    "n.",
    "1. 印度的世袭阶级 2. 任何排他的社会阶层"
  ],
  [
    "tem-012",
    20,
    "casualty",
    "The hospital received its first casualty shortly after the explosion.",
    "爆炸发生后不久，医院就接收了第一名伤者。",
    1599,
    "casualty [ˈkæʒjʊəltɪ] n. 意外或战争中的伤亡者",
    "n.",
    "意外或战争中的伤亡者"
  ],
  [
    "tem-012",
    21,
    "catalyst",
    "The scholarship became a catalyst for her interest in scientific research.",
    "这笔奖学金成为激发她对科学研究兴趣的契机。",
    1602,
    "*catalyst [ˈkætəlɪst] n. 催化剂，刺激(促进)因素",
    "n.",
    "催化剂，刺激(促进)因素"
  ],
  [
    "tem-012",
    22,
    "cataract",
    "The surgeon removed a cataract from the patient's left eye.",
    "外科医生为患者的左眼摘除了白内障。",
    1603,
    "cataract [ˈkætərækt] n. 1. 大瀑布 2. 白内障",
    "n.",
    "1. 大瀑布 2. 白内障"
  ],
  [
    "tem-012",
    24,
    "catcall",
    "Some spectators began to catcall when the referee ignored their complaints.",
    "裁判无视观众的抱怨时，一些观众开始喝倒彩。",
    1605,
    "*catcall [ˈkætkɔːl] v. &n. (吹)哨，(发)嘘声(表示不满)，喝倒彩",
    "v.&n.",
    "(吹)哨，(发)嘘声(表示不满)，喝倒彩"
  ],
  [
    "tem-012",
    25,
    "catchword",
    "Sustainability became the company's catchword during the campaign.",
    "可持续发展成了这家公司在宣传活动中的口号。",
    1607,
    "*catchword [ˈkætʃwɜːd] n. 代表性口号，标语",
    "n.",
    "代表性口号，标语"
  ],
  [
    "tem-012",
    26,
    "catchy",
    "The advert used a catchy tune that listeners hummed all day.",
    "广告用了一段朗朗上口的曲调，让听众整天都忍不住哼唱。",
    1608,
    "*catchy [ˈkætʃɪ] adj. (指曲调等)易记的，口头禅的",
    "adj.",
    "(指曲调等)易记的，口头禅的"
  ],
  [
    "tem-012",
    27,
    "categorical",
    "The spokesperson issued a categorical denial of the allegations.",
    "发言人对这些指控作出了断然否认。",
    1609,
    "*categorical [ˌkætəˈɡɒrɪkl] adj. (言辞)无附带条件的，绝对的，直截了当的",
    "adj.",
    "(言辞)无附带条件的，绝对的，直截了当的"
  ],
  [
    "tem-012",
    29,
    "caterpillar",
    "A green caterpillar crawled across the cabbage leaf.",
    "一条绿色毛毛虫爬过卷心菜叶。",
    1613,
    "caterpillar [ˈkætəpɪlə] n. 1. (蝴蝶等的)幼虫 2. 拖拉机、坦克车等的履带",
    "n.",
    "1. (蝴蝶等的)幼虫 2. 拖拉机、坦克车等的履带"
  ],
  [
    "tem-012",
    31,
    "cathode",
    "The cathode of the diode was marked with a silver band.",
    "这个二极管的阴极用一条银色环带标示。",
    1615,
    "*cathode [ˈkæθəʊd] n. 阴极",
    "n.",
    "阴极"
  ],
  [
    "tem-012",
    32,
    "Catholic",
    "The village has a Catholic church beside the river.",
    "村里河边有一座天主教堂。",
    1616,
    "Catholic [ˈkæθəlɪk] adj. 天主教的 n. 天主教徒",
    "adj.",
    "天主教的 n. 天主教徒"
  ],
  [
    "tem-012",
    33,
    "Catholicism",
    "The exhibition traces the history of Catholicism in the region.",
    "展览梳理了天主教信仰在该地区的发展历史。",
    1617,
    "*Catholicism [kəˈθɒləsɪzəm] n. 天主教教义(信仰)",
    "n.",
    "天主教教义(信仰)"
  ],
  [
    "tem-012",
    34,
    "catwalk",
    "The engineer inspected the pipes from a narrow catwalk above the factory floor.",
    "工程师站在厂房上方的狭窄检修走道上检查管道。",
    1619,
    "*catwalk [ˈkætwɔːk] n. (桥面、大型机器等旁边的)狭窄过道",
    "n.",
    "(桥面、大型机器等旁边的)狭窄过道"
  ]
];
test('TEM-011/012: 58 editorial pairs retain original source and needs-review',()=>{
 assert.equal(expected.length,58);
 assert.equal(new Set(expected.map(x=>x[0]+':'+x[1])).size,58);
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
  const flags=rules.filter(rule=>rule.pattern.test(rule.id==='translation-metalinguistic'?cn:en)).map(rule=>rule.id);
  assert.deepEqual(flags,[],'mechanical template: '+taskId+'/'+word);
 }
});
