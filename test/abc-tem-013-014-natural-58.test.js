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
    "tem-013",
    11,
    "cherry",
    "She picked a ripe cherry from the tree.",
    "她从树上摘下一颗成熟的樱桃。",
    1741,
    "cherry [ˈtʃerɪ] n. 樱桃，樱桃树",
    "n.",
    "樱桃，樱桃树"
  ],
  [
    "tem-013",
    12,
    "chestnut",
    "We roasted chestnuts over a small fire.",
    "我们在小火上烤栗子。",
    1744,
    "chestnut [ˈtʃesnʌt] n. 1. 栗子 2. 栗树，栗木",
    "n.",
    "1. 栗子 2. 栗树，栗木"
  ],
  [
    "tem-013",
    14,
    "chick",
    "A yellow chick followed the hen across the yard.",
    "一只黄色的小鸡跟着母鸡穿过院子。",
    1747,
    "chick [tʃɪk] n. 雏鸡，小鸡",
    "n.",
    "雏鸡，小鸡"
  ],
  [
    "tem-013",
    19,
    "chilli",
    "She added a chopped chilli to the soup.",
    "她往汤里加了一根切碎的辣椒。",
    1756,
    "chilli [ˈtʃɪlɪ] n. 辣椒的一种，辣酱",
    "n.",
    "辣椒的一种，辣酱"
  ],
  [
    "tem-013",
    23,
    "chimpanzee",
    "A chimpanzee used a stick to pull insects from a hollow log.",
    "一只黑猩猩用树枝从空心木头里掏出昆虫。",
    1760,
    "*chimpanzee [ˌtʃɪmpənˈziː] n. (非洲的)黑猩猩",
    "n.",
    "(非洲的)黑猩猩"
  ],
  [
    "tem-013",
    45,
    "chronology",
    "The historian checked the chronology of events before writing the chapter.",
    "历史学家在撰写这一章之前核对了事件的时间顺序。",
    1794,
    "*chronology [krəˈnɒlədʒɪ] n. 1. 年代 2. 编年表",
    "n.",
    "1. 年代 2. 编年表"
  ],
  [
    "tem-013",
    46,
    "chrysanthemum",
    "A white chrysanthemum bloomed beside the garden wall.",
    "一朵白菊花在花园围墙旁绽放。",
    1795,
    "chrysanthemum [krɪˈsænθəməm] n. 菊(花)",
    "n.",
    "菊(花)"
  ],
  [
    "tem-013",
    47,
    "chubby",
    "The baby had chubby cheeks and a wide smile.",
    "婴儿脸颊圆嘟嘟的，笑容灿烂。",
    1796,
    "*chubby [ˈtʃʌbɪ] adj. 圆胖丰满的，稍胖的",
    "adj.",
    "圆胖丰满的，稍胖的"
  ],
  [
    "tem-013",
    50,
    "chum",
    "He ran into an old school chum at the station.",
    "他在车站偶遇一位学生时代的老友。",
    1799,
    "*chum [tʃʌm] n. 好友，密友",
    "n.",
    "好友，密友"
  ],
  [
    "tem-013",
    53,
    "churlish",
    "His churlish reply upset the volunteers who had offered to help.",
    "他粗鲁的回答让主动帮忙的志愿者很难过。",
    1803,
    "*churlish [ˈtʃəːlɪʃ] adj. 脾气坏的，粗暴的",
    "adj.",
    "脾气坏的，粗暴的"
  ],
  [
    "tem-013",
    55,
    "cider",
    "She ordered a glass of dry cider at the pub.",
    "她在酒馆点了一杯干型苹果酒。",
    1805,
    "cider [ˈsaɪdə] n. 苹果汁，苹果酒",
    "n.",
    "苹果汁，苹果酒"
  ],
  [
    "tem-013",
    57,
    "cinder",
    "Hot cinders glowed beneath the ashes.",
    "灰烬下的煤渣还在发红。",
    1808,
    "*cinder [ˈsɪndə] n. 煤渣，煤屑，矿渣，熔渣",
    "n.",
    "煤渣，煤屑，矿渣，熔渣"
  ],
  [
    "tem-013",
    69,
    "clam",
    "The chef steamed the clams with garlic.",
    "晚餐时，厨师用蒜蓉蒸蛤蜊。",
    1832,
    "clam [klæm] n. 蛤(肉)，蚌",
    "n.",
    "蛤(肉)，蚌"
  ],
  [
    "tem-013",
    85,
    "cleaner",
    "The cleaner mopped the floor after the shop closed.",
    "商店打烊后，清洁工拖了地。",
    1858,
    "cleaner [ˈkliːnə] n. 1. 做清扫工作的人(物) 2. (pl. )洗衣店",
    "n.",
    "1. 做清扫工作的人(物) 2. (pl. )洗衣店"
  ],
  [
    "tem-013",
    93,
    "clergyman",
    "A local clergyman visited the family after the funeral.",
    "葬礼结束后，一位当地牧师探望了这家人。",
    1867,
    "clergyman [ˈklɜːdʒɪmən] (pl clergymen) n. (基督教的)教士(牧师)",
    "n.",
    "(基督教的)教士(牧师)"
  ],
  [
    "tem-014",
    0,
    "cling",
    "The child clung to her father's hand as they crossed the road.",
    "过马路时，孩子紧紧抓着父亲的手。",
    1879,
    "cling [klɪŋ] v. 1. 粘住，缠住  2. 依附，依靠 3. 紧紧握住，紧紧抱住",
    "v.",
    "1. 粘住，缠住  2. 依附，依靠 3. 紧紧握住，紧紧抱住"
  ],
  [
    "tem-014",
    1,
    "clinical",
    "The hospital is recruiting volunteers for a clinical trial.",
    "医院正在为一项临床试验招募志愿者。",
    1881,
    "clinical [ˈklɪnɪkəl] adj. 1. 诊所的，医院的，临床的 2. (态度等)冷静的，客观的",
    "adj.",
    "1. 诊所的，医院的，临床的 2. (态度等)冷静的，客观的"
  ],
  [
    "tem-014",
    6,
    "clog",
    "The dancer wore traditional wooden clogs.",
    "舞者穿着传统的木底鞋。",
    1887,
    "*clog [klɒɡ] n. 木底鞋，木屐",
    "n.",
    "木底鞋，木屐"
  ],
  [
    "tem-014",
    8,
    "closet",
    "She put the winter coats in the closet.",
    "她把冬季大衣放进衣橱。",
    1891,
    "closet [ˈklɒzɪt] n. 1. 橱柜  2. 私室，小房间 3. 盥洗室，厕所",
    "n.",
    "1. 橱柜  2. 私室，小房间 3. 盥洗室，厕所"
  ],
  [
    "tem-014",
    9,
    "closure",
    "The sudden closure of the bridge delayed commuters.",
    "这座桥突然关闭，耽误了通勤者的行程。",
    1892,
    "closure [ˈkləʊʒə] n. 关闭，终止，结束",
    "n.",
    "关闭，终止，结束"
  ],
  [
    "tem-014",
    10,
    "clot",
    "Doctors found a blood clot in his leg.",
    "医生发现他的腿部有一个血凝块。",
    1893,
    "*clot [klɒt] n. 凝块",
    "n.",
    "凝块"
  ],
  [
    "tem-014",
    12,
    "clout",
    "The union has enough clout to influence the negotiations.",
    "工会有足够的影响力左右谈判。",
    1899,
    "clout [klaʊt] n. 1. 敲，打 2. 影响力，势力 v. 敲击，掌击",
    "n.",
    "1. 敲，打 2. 影响力，势力 v. 敲击，掌击"
  ],
  [
    "tem-014",
    13,
    "clown",
    "The clown made the children laugh with a silly dance.",
    "小丑跳了一段滑稽的舞，把孩子们逗笑了。",
    1900,
    "clown [klaʊn] n. 1. 小丑，丑角 2. 粗鲁、笨拙的人",
    "n.",
    "1. 小丑，丑角 2. 粗鲁、笨拙的人"
  ],
  [
    "tem-014",
    14,
    "clump",
    "A clump of trees sheltered the house from the wind.",
    "一丛树木为房子挡住了风。",
    1903,
    "*clump [klʌmp] n. 树丛，草丛 v. 用沉重的脚步行走",
    "n.",
    "树丛，草丛 v. 用沉重的脚步行走"
  ],
  [
    "tem-014",
    16,
    "cluster",
    "A cluster of stars appeared above the horizon.",
    "地平线上方出现了一簇星星。",
    1905,
    "cluster [ˈklʌstə] n. 一串，一束，一簇，一群，一组  v. 使成群，把…集成一束(一组)，群集，丛生",
    "n.",
    "一串，一束，一簇，一群，一组  v. 使成群，把…集成一束(一组)，群集，丛生"
  ],
  [
    "tem-014",
    17,
    "clutch",
    "She clutched her ticket as she hurried towards the train.",
    "她匆忙赶向火车时紧紧攥着车票。",
    1906,
    "clutch [klʌtʃ] v. 抓住，攫住  n. 1. (pl)爪子，毒手，控制 2. (一把)抓住，攫住",
    "v.",
    "抓住，攫住  n. 1. (pl)爪子，毒手，控制 2. (一把)抓住，攫住"
  ],
  [
    "tem-014",
    18,
    "clutter",
    "Empty cups cluttered the desk after the meeting.",
    "会议结束后，空杯子把桌面弄得乱糟糟的。",
    1907,
    "*clutter [ˈklʌtə] v. 弄乱，把…弄得杂乱 n. 零乱，杂乱",
    "v.",
    "弄乱，把…弄得杂乱 n. 零乱，杂乱"
  ],
  [
    "tem-014",
    21,
    "coastal",
    "Coastal villages were flooded during the storm.",
    "暴风雨期间，沿海村庄遭到洪水侵袭。",
    1913,
    "coastal [ˈkəʊstəl] adj. 海岸的，近海的",
    "adj.",
    "海岸的，近海的"
  ],
  [
    "tem-014",
    22,
    "coastline",
    "The storm reshaped parts of the coastline.",
    "风暴改变了部分海岸线的形状。",
    1914,
    "coastline [ˈkəʊstlaɪn] n. 海岸线",
    "n.",
    "海岸线"
  ],
  [
    "tem-014",
    23,
    "coax",
    "She coaxed the frightened cat out from under the bed.",
    "她轻声哄着受惊的猫从床底下出来。",
    1916,
    "*coax [ˈkəʊks] v. 1. 哄诱，劝诱 2. 用诱哄得到，诱取",
    "v.",
    "1. 哄诱，劝诱 2. 用诱哄得到，诱取"
  ],
  [
    "tem-014",
    24,
    "cobble",
    "The lane was paved with rough cobbles.",
    "这条小巷铺着粗糙的鹅卵石。",
    1917,
    "*cobble [ˈkɒbl] n. (铺路的)鹅卵石 v. 1. 修补(鞋)  2. 粗制滥造",
    "n.",
    "(铺路的)鹅卵石 v. 1. 修补(鞋)  2. 粗制滥造"
  ],
  [
    "tem-014",
    25,
    "cobbler",
    "The cobbler repaired my boots while I waited.",
    "我等候时，补鞋匠修好了我的靴子。",
    1918,
    "cobbler [ˈkɒblə] n. 补鞋匠",
    "n.",
    "补鞋匠"
  ],
  [
    "tem-014",
    26,
    "cobra",
    "A cobra raised its head beside the path.",
    "一条眼镜蛇在小路旁抬起了头。",
    1919,
    "*cobra [ˈkəʊbrə] n. 眼镜蛇",
    "n.",
    "眼镜蛇"
  ],
  [
    "tem-014",
    27,
    "cobweb",
    "A cobweb stretched across the attic window.",
    "阁楼窗户上挂着一张蜘蛛网。",
    1920,
    "cobweb [ˈkɒbweb] n. 蜘蛛网，蛛丝",
    "n.",
    "蜘蛛网，蛛丝"
  ],
  [
    "tem-014",
    30,
    "cockroach",
    "A cockroach scurried beneath the kitchen sink.",
    "一只蟑螂迅速钻进厨房水槽下方。",
    1923,
    "cockroach [ˈkɒkrəʊtʃ] n. 蟑螂，曱甴",
    "n.",
    "蟑螂，曱甴"
  ],
  [
    "tem-014",
    31,
    "cocktail",
    "He ordered a cocktail at the hotel bar.",
    "他在酒店酒吧点了一杯鸡尾酒。",
    1924,
    "cocktail [ˈkɒkteɪl] n. 1. 鸡尾酒 2. 开胃食品 adj. 鸡尾酒的 || cocktail party鸡尾酒会",
    "n.",
    "1. 鸡尾酒 2. 开胃食品 adj. 鸡尾酒的 || cocktail party鸡尾酒会"
  ],
  [
    "tem-014",
    32,
    "cocky",
    "His cocky grin vanished when he saw the exam results.",
    "看到考试成绩时，他那副自以为是的笑容消失了。",
    1925,
    "*cocky [ˈkɒkɪ] adj. 自以为是的，骄傲自大的",
    "adj.",
    "自以为是的，骄傲自大的"
  ],
  [
    "tem-014",
    33,
    "cocoa",
    "She stirred a spoonful of cocoa into the warm milk.",
    "她往温牛奶里搅入了一勺可可粉。",
    1926,
    "cocoa [ˈkəʊkəʊ] n. 可可，可可粉，可可饮料",
    "n.",
    "可可，可可粉，可可饮料"
  ],
  [
    "tem-014",
    34,
    "coconut",
    "He cracked open a coconut to drink its water.",
    "他敲开一个椰子，喝里面的椰汁。",
    1927,
    "coconut [ˈkəʊkənʌt] n. 椰子",
    "n.",
    "椰子"
  ],
  [
    "tem-014",
    35,
    "cod",
    "The restaurant served baked cod with potatoes.",
    "这家餐馆供应配土豆的烤鳕鱼。",
    1928,
    "cod [kɒd] n. 鳕鱼",
    "n.",
    "鳕鱼"
  ],
  [
    "tem-014",
    36,
    "coddle",
    "He worried that his parents would coddle his younger brother.",
    "他担心父母会溺爱弟弟。",
    1929,
    "*coddle [ˈkɒdl] v. 娇养，溺爱",
    "v.",
    "娇养，溺爱"
  ],
  [
    "tem-014",
    39,
    "coefficient",
    "In the equation y = 3x + 2, the coefficient of x is 3.",
    "在方程 y = 3x + 2 中，x 的系数是 3。",
    1932,
    "*coefficient [ˌkəʊɪˈfɪʃənt] n. 系数，率",
    "n.",
    "系数，率"
  ],
  [
    "tem-014",
    40,
    "coerce",
    "The manager tried to coerce employees into working unpaid overtime.",
    "经理试图胁迫员工无偿加班。",
    1933,
    "*coerce [kəʊˈɜːs] v. 强制(胁迫)某人做某事",
    "v.",
    "强制(胁迫)某人做某事"
  ],
  [
    "tem-014",
    41,
    "coercion",
    "The witness said the confession had been obtained through coercion.",
    "证人称，这份供词是通过胁迫取得的。",
    1934,
    "*coercion [kəʊˈɜːʃən] n. 强迫，胁迫，被迫",
    "n.",
    "强迫，胁迫，被迫"
  ],
  [
    "tem-014",
    42,
    "coexist",
    "The two species coexist in the same forest.",
    "这两个物种在同一片森林中共存。",
    1935,
    "*coexist [kəʊɪɡˈzɪst] v. 共存，并存",
    "v.",
    "共存，并存"
  ],
  [
    "tem-014",
    43,
    "coffin",
    "The family placed flowers beside the coffin.",
    "家人在棺木旁摆放了鲜花。",
    1937,
    "coffin [ˈkɒfɪn] n. 棺，枢",
    "n.",
    "棺，枢"
  ],
  [
    "tem-014",
    44,
    "cog",
    "A broken cog stopped the old clock from working.",
    "一枚损坏的轮齿使这座老钟无法运转。",
    1938,
    "*cog [kɒɡ] n. 1. (齿轮的)轮牙，轮齿 2. 不重要的但不可少的人",
    "n.",
    "1. (齿轮的)轮牙，轮齿 2. 不重要的但不可少的人"
  ],
  [
    "tem-014",
    48,
    "coil",
    "She coiled the rope neatly beside the boat.",
    "她把绳子整齐地盘在船旁。",
    1942,
    "coil [kɔɪl] v. 1. (使)盘绕; 卷起 2. 线圈",
    "v.",
    "1. (使)盘绕; 卷起 2. 线圈"
  ],
  [
    "tem-014",
    50,
    "coincide",
    "The festival will coincide with the start of the school holidays.",
    "节日恰好与学校假期开始的时间重合。",
    1945,
    "coincide [ˌkəʊɪnˈsaɪd] v. 1. 同时发生 2. 一致，不谋而合",
    "v.",
    "1. 同时发生 2. 一致，不谋而合"
  ],
  [
    "tem-014",
    54,
    "collaboration",
    "The research project depends on collaboration between two universities.",
    "这个研究项目需要两所大学合作。",
    1951,
    "collaboration [kəˌlæbəˈreɪʃən] n. 1. 合作，协作 2. 勾结",
    "n.",
    "1. 合作，协作 2. 勾结"
  ],
  [
    "tem-014",
    55,
    "collate",
    "The assistant collated the survey responses before the meeting.",
    "助理在会前汇总核对了调查答卷。",
    1954,
    "*collate [kəˈleɪt] v. 1. (仔细)核对，对照，校勘 2. (书籍装订前)整理",
    "v.",
    "1. (仔细)核对，对照，校勘 2. (书籍装订前)整理"
  ],
  [
    "tem-014",
    58,
    "collector",
    "The collector displayed rare coins in a glass cabinet.",
    "收藏家把稀有硬币陈列在玻璃柜里。",
    1959,
    "collector [kəˈlektə] n. 1. 收藏家，采集者，搜集者 2. 征收员",
    "n.",
    "1. 收藏家，采集者，搜集者 2. 征收员"
  ],
  [
    "tem-014",
    59,
    "collegiate",
    "The university expanded its collegiate sports programme.",
    "这所大学扩大了校际体育项目的规模。",
    1961,
    "collegiate [kəˈliːdʒɪət] adj. 学院的，大学的，高等学校(学生)的  n. 高等学校学生",
    "adj.",
    "学院的，大学的，高等学校(学生)的  n. 高等学校学生"
  ],
  [
    "tem-014",
    60,
    "collide",
    "Two bicycles collided at the narrow junction.",
    "两辆自行车在狭窄的路口相撞。",
    1962,
    "collide [kəˈlaɪd] v. 1. (车、船等)猛撞 2. 冲突",
    "v.",
    "1. (车、船等)猛撞 2. 冲突"
  ],
  [
    "tem-014",
    62,
    "colloquial",
    "The phrase is common in colloquial English but rare in formal writing.",
    "这个短语在英语口语中很常见，在正式写作中却很少出现。",
    1964,
    "colloquial [kəˈləʊkwɪəl] adj. 口语的，会话的，通俗的",
    "adj.",
    "口语的，会话的，通俗的"
  ],
  [
    "tem-014",
    63,
    "collude",
    "Investigators found that the firms had colluded to raise prices.",
    "调查人员发现，这些公司曾串通涨价。",
    1965,
    "*collude [kəˈluːd] v. 共谋，勾结，串通",
    "v.",
    "共谋，勾结，串通"
  ],
  [
    "tem-014",
    64,
    "collusion",
    "The inquiry uncovered collusion between two bidders.",
    "调查揭露了两名投标者之间的串通行为。",
    1966,
    "*collusion [kəˈluːʒən] n. 共谋，勾结",
    "n.",
    "共谋，勾结"
  ],
  [
    "tem-014",
    68,
    "colonial",
    "The museum displayed maps from the colonial period.",
    "博物馆展出了殖民时期的地图。",
    1970,
    "colonial [kəˈləʊnɪəl] adj. 1. 殖民地的，关于殖民地的 2. (cap)(美国独立前)十三州时代的，美国初期的 3. 拥有殖民地的",
    "adj.",
    "1. 殖民地的，关于殖民地的 2. (cap)(美国独立前)十三州时代的，美国初期的 3. 拥有殖民地的"
  ]
];
test('TEM-013/014: 58 source-locked natural bilingual draft examples',()=>{
 assert.equal(expected.length,58);
 assert.equal(new Set(expected.map(x=>x[0]+':'+x[1])).size,58);
 const grouped=expected.reduce((o,x)=>((o[x[0]]??=[]).push(x),o),{});
 for(const [taskId,rows] of Object.entries(grouped)){
  const task=manifest.files.find(x=>x.task_id===taskId);
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
