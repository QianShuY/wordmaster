'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const task=manifest.files.find(x=>x.task_id==='tem-017');
const result=JSON.parse(fs.readFileSync(path.join(root,'docs/model-task-results/worker-A/tem-017/result.json'),'utf8'));
const input=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',task.file),'utf8'));
const expected=[
  [
    6,
    "contraception",
    "The clinic provides information about contraception to adults.",
    "这家诊所向成年人提供有关避孕方法的信息。",
    2278,
    "contraception [ˌkɒntrəˈsepʃən] n. 避孕(法)",
    "n.",
    "避孕(法)"
  ],
  [
    7,
    "contraceptive",
    "The pharmacist explained how to use the contraceptive correctly.",
    "药剂师解释了如何正确使用这种避孕用品。",
    2279,
    "*contraceptive [ˌkɒntrəˈseptɪv] n. &adj. 避孕药(的)，避孕用具(的)，避孕(的)",
    "n.&adj.",
    "避孕药(的)，避孕用具(的)，避孕(的)"
  ],
  [
    21,
    "conversant",
    "The technician is conversant with the new safety procedures.",
    "这名技术员熟悉新的安全规程。",
    2302,
    "*conversant [kənˈvɜːsənt] adj. 精通的，内行的，熟知",
    "adj.",
    "精通的，内行的，熟知"
  ],
  [
    27,
    "convertible",
    "These bonds are convertible into company shares.",
    "这些债券可以转换为公司股票。",
    2309,
    "*convertible [kənˈvɜːtəbl] adj. 可改变的，可转换的，可兑换的",
    "adj.",
    "可改变的，可转换的，可兑换的"
  ],
  [
    28,
    "convex",
    "The mirror has a convex surface that curves outward.",
    "这面镜子的表面向外凸起。",
    2310,
    "convex [kɒnˈveks] adj. 凸圆的，凸面的",
    "adj.",
    "凸圆的，凸面的"
  ],
  [
    29,
    "convict",
    "The jury found enough evidence to convict the suspect.",
    "陪审团认定证据足以将嫌疑人定罪。",
    2312,
    "convict [kənˈvɪkt] v. 证明、宣判…有罪，定罪 n. 被判入狱的罪犯",
    "v.",
    "证明、宣判…有罪，定罪 n. 被判入狱的罪犯"
  ],
  [
    31,
    "convincing",
    "Her explanation was convincing because it matched the data.",
    "她的解释与数据吻合，因此很有说服力。",
    2315,
    "convincing [kənˈvɪnsɪŋ] adj. 有说服力的，令人信服的",
    "adj.",
    "有说服力的，令人信服的"
  ],
  [
    32,
    "convoy",
    "Two patrol boats convoyed the supply ship through the strait.",
    "两艘巡逻艇护送补给船穿过海峡。",
    2316,
    "*convoy [ˈkɒnvɔɪ] v. 护送，护卫，护航 n. 1. 护送，护卫 2. 护送队",
    "v.",
    "护送，护卫，护航 n. 1. 护送，护卫 2. 护送队"
  ],
  [
    33,
    "convulse",
    "His body convulsed with uncontrollable laughter.",
    "他笑得浑身不停地抽动。",
    2317,
    "*convulse [kənˈvʌls] v. 1. 使震动，使震撼 2. 使抽筋",
    "v.",
    "1. 使震动，使震撼 2. 使抽筋"
  ],
  [
    34,
    "cooker",
    "The new cooker has an oven and four gas burners.",
    "新炉灶配有烤箱和四个燃气灶头。",
    2319,
    "cooker [ˈkʊkə] n. 炊事用具(炉、锅等)",
    "n.",
    "炊事用具(炉、锅等)"
  ],
  [
    35,
    "cookery",
    "She enrolled in a cookery course to learn basic techniques.",
    "她报名参加烹饪课程，学习基本技巧。",
    2320,
    "cookery [ˈkʊkərɪ] n. 烹调术，烹饪法",
    "n.",
    "烹调术，烹饪法"
  ],
  [
    36,
    "cooler",
    "We packed drinks in a cooler for the picnic.",
    "我们把饮料装进冷藏箱，准备野餐。",
    2323,
    "cooler [ˈkuːlə] n. 1. 冷却器，冷却剂 2. 冷饮品",
    "n.",
    "1. 冷却器，冷却剂 2. 冷饮品"
  ],
  [
    37,
    "coop",
    "The hens returned to the coop at sunset.",
    "日落时，母鸡们回到了鸡舍。",
    2324,
    "*coop [kuːp] n. (饲养小动物的)笼，栏  v. 将…禁锢在狭小空间，拘禁",
    "n.",
    "(饲养小动物的)笼，栏  v. 将…禁锢在狭小空间，拘禁"
  ],
  [
    38,
    "cooperation",
    "The project succeeded through close cooperation between the teams.",
    "这个项目依靠各团队的紧密合作取得了成功。",
    2326,
    "cooperation [kəʊˌɒpəˈreɪʃən] n. 合作，协力，合作的意愿",
    "n.",
    "合作，协力，合作的意愿"
  ],
  [
    39,
    "cooperative",
    "Local farmers formed a cooperative to sell their produce.",
    "当地农民成立了一家合作社来销售农产品。",
    2327,
    "cooperative [kəʊˈɒpərətɪv] n. 合作社，合作商店(企业等) adj. 1. 合作的，协作的 2. 有合作意向的，乐意合作的",
    "n.",
    "合作社，合作商店(企业等) adj. 1. 合作的，协作的 2. 有合作意向的，乐意合作的"
  ],
  [
    43,
    "copier",
    "The office copier jammed halfway through the report.",
    "办公室的复印机在复印报告到一半时卡纸了。",
    2331,
    "copier [kɒpiə] n. 复印机",
    "n.",
    "复印机"
  ],
  [
    45,
    "copy",
    "Please keep a copy of the receipt for your records.",
    "请保留一份收据副本以备查。",
    2333,
    "copy [ˈkɒpɪ] n. 1. 抄本，复制本，副本 2. (书的)一本，(报纸的)一份 3. 复制品 v. 1. 抄写，复写 2. 仿制，仿效",
    "n.",
    "1. 抄本，复制本，副本 2. (书的)一本，(报纸的)一份 3. 复制品 v. 1. 抄写，复写 2. 仿制，仿效"
  ],
  [
    46,
    "copyright",
    "The author retained the copyright to her photographs.",
    "作者保留了她所拍照片的著作权。",
    2334,
    "copyright [ˈkɒpɪraɪt] n. 版权，著作权",
    "n.",
    "版权，著作权"
  ],
  [
    47,
    "coral",
    "Rising sea temperatures threaten the coral on the reef.",
    "海水温度升高威胁着礁石上的珊瑚。",
    2335,
    "coral [ˈkɒrəl] n. 珊瑚",
    "n.",
    "珊瑚"
  ],
  [
    50,
    "corduroy",
    "He wore a brown corduroy jacket to the interview.",
    "他穿着一件棕色灯芯绒夹克去面试。",
    2338,
    "corduroy [ˈkɔːdərɔɪ] n. 1灯芯绒 2. (pl)灯芯绒裤子",
    "n.",
    "1灯芯绒 2. (pl)灯芯绒裤子"
  ],
  [
    51,
    "cork",
    "She pulled the cork from the bottle.",
    "她拔出了瓶塞。",
    2340,
    "cork [kɔːk] n. 软木，软木塞",
    "n.",
    "软木，软木塞"
  ],
  [
    52,
    "cornea",
    "The cornea helps focus light entering the eye.",
    "角膜有助于聚焦进入眼睛的光线。",
    2342,
    "cornea [ˈkɔːnɪə] n. 角膜",
    "n.",
    "角膜"
  ],
  [
    53,
    "cornerstone",
    "Trust is the cornerstone of a lasting friendship.",
    "信任是持久友谊的基石。",
    2344,
    "cornerstone [ˈkɔːnəstəʊn] n. 1. 基石，奠基石 2. 基础",
    "n.",
    "1. 基石，奠基石 2. 基础"
  ],
  [
    54,
    "cornet",
    "The musician played a solo on the cornet.",
    "音乐家用短号演奏了一段独奏。",
    2345,
    "*cornet [ˈkɔːnɪt] n. 1. 短号  2. (盛冰淇淋的)圆锥形蛋卷",
    "n.",
    "1. 短号  2. (盛冰淇淋的)圆锥形蛋卷"
  ],
  [
    55,
    "corollary",
    "A corollary of higher demand is the need for more staff.",
    "需求增加的必然结果是需要更多员工。",
    2346,
    "*corollary [kəˈrɒlərɪ] n. 必然结果，推论",
    "n.",
    "必然结果，推论"
  ],
  [
    56,
    "coronation",
    "Crowds gathered outside the cathedral for the coronation.",
    "人群聚集在大教堂外观看加冕典礼。",
    2347,
    "*coronation [ˌkɒrəˈneɪʃən] n. 加冕礼，即位典礼",
    "n.",
    "加冕礼，即位典礼"
  ],
  [
    57,
    "coroner",
    "The coroner ordered an investigation into the unexplained death.",
    "验尸官下令调查这起死因不明的死亡事件。",
    2348,
    "*coroner [ˈkɒrənə] n. 验尸官",
    "n.",
    "验尸官"
  ],
  [
    58,
    "corporal",
    "The school banned corporal punishment many years ago.",
    "这所学校多年前就禁止了体罚。",
    2349,
    "corporal [ˈkɔːpərəl] adj. 肉体的，身体的",
    "adj.",
    "肉体的，身体的"
  ],
  [
    60,
    "corps",
    "A volunteer corps helped distribute supplies after the flood.",
    "一支志愿队伍在洪灾后协助分发物资。",
    2352,
    "*corps [kɔː] n. 1. 特种部队，军团 2. 共同工作、活动的一群人",
    "n.",
    "1. 特种部队，军团 2. 共同工作、活动的一群人"
  ],
  [
    61,
    "corpse",
    "Investigators discovered a corpse near the abandoned building.",
    "调查人员在废弃建筑附近发现了一具尸体。",
    2353,
    "corpse [kɔːps] n. 尸体",
    "n.",
    "尸体"
  ],
  [
    62,
    "corpulent",
    "The corpulent gentleman struggled to squeeze into the narrow seat.",
    "那位身材臃肿的先生很难挤进狭窄的座位。",
    2354,
    "*corpulent [ˈkɔːpjʊlənt] adj. 肥胖的，臃肿的",
    "adj.",
    "肥胖的，臃肿的"
  ],
  [
    63,
    "corpus",
    "The researchers analysed a corpus of newspaper articles.",
    "研究人员分析了一批报纸文章语料。",
    2355,
    "*corpus [ˈkɔːpəs] n. 文集，资料，汇编",
    "n.",
    "文集，资料，汇编"
  ],
  [
    65,
    "correlate",
    "Regular exercise was identified as a correlate of better sleep.",
    "规律运动被确定为与较好睡眠相关的因素。",
    2358,
    "*correlate [ˈkɒrəleɪt] n. 有相互关系的东西，相关物 v. 使有相互关系，互相有关系",
    "n.",
    "有相互关系的东西，相关物 v. 使有相互关系，互相有关系"
  ],
  [
    68,
    "corroborate",
    "The security footage corroborated the witness's account.",
    "监控录像证实了目击者的说法。",
    2363,
    "*corroborate [kəˈrɒbəreɪt] v. 证实，支持(某种说法、信仰、理论等)",
    "v.",
    "证实，支持(某种说法、信仰、理论等)"
  ],
  [
    70,
    "corrosion",
    "The bridge showed signs of corrosion after years of exposure to salt.",
    "这座桥在多年盐分侵蚀后出现了腐蚀迹象。",
    2365,
    "*corrosion [kəˈrəʊʒən] n. 腐蚀",
    "n.",
    "腐蚀"
  ],
  [
    71,
    "corrugated",
    "The packages were protected by corrugated cardboard.",
    "这些包裹由瓦楞纸板保护。",
    2366,
    "*corrugated [ˈkɒrəɡeɪtɪd] adj. 起皱的，波纹的，有瓦楞的",
    "adj.",
    "起皱的，波纹的，有瓦楞的"
  ],
  [
    72,
    "corrupt",
    "The investigation exposed several corrupt officials.",
    "调查揭露了几名腐败官员。",
    2367,
    "corrupt [kəˈrʌpt] adj. 1. 腐败的，贪污的 2. 腐烂的，污浊的 v. 1. 使败坏，腐蚀，使腐坏  2. 贿赂",
    "adj.",
    "1. 腐败的，贪污的 2. 腐烂的，污浊的 v. 1. 使败坏，腐蚀，使腐坏  2. 贿赂"
  ],
  [
    73,
    "corruption",
    "The audit uncovered corruption in the purchasing department.",
    "审计发现采购部门存在腐败行为。",
    2368,
    "corruption [kəˈrʌpʃən] n. 1. 贪污，腐败 2. 讹误",
    "n.",
    "1. 贪污，腐败 2. 讹误"
  ],
  [
    74,
    "cosmetic",
    "This cosmetic contains no added fragrance.",
    "这款化妆品没有添加香精。",
    2369,
    "cosmetic [kɒzˈmetɪk] n. 化妆品 adj. 化妆用的，装点门面的",
    "n.",
    "化妆品 adj. 化妆用的，装点门面的"
  ],
  [
    76,
    "cosmopolitan",
    "The port has a cosmopolitan population from many countries.",
    "这座港口城市的人口来自许多国家，具有国际化特色。",
    2371,
    "cosmopolitan [ˌkɒzməˈpɒlɪtən] adj. 1. 世界主义的  2. 全世界的，全世界各地都有的",
    "adj.",
    "1. 世界主义的  2. 全世界的，全世界各地都有的"
  ],
  [
    77,
    "cosmos",
    "Astronomers use telescopes to explore the cosmos.",
    "天文学家用望远镜探索宇宙。",
    2372,
    "cosmos [ˈkɒzmɒs] n. 宇宙",
    "n.",
    "宇宙"
  ],
  [
    79,
    "cot",
    "The baby slept safely in her cot.",
    "婴儿在她的小床里安稳地睡着。",
    2377,
    "cot [kɒt] n. 1. 幼儿床(通常设有栏杆) 2. 简易床(如行军床)",
    "n.",
    "1. 幼儿床(通常设有栏杆) 2. 简易床(如行军床)"
  ],
  [
    80,
    "couch",
    "We sat on the couch and watched the rain outside.",
    "我们坐在沙发上看着窗外的雨。",
    2380,
    "couch [kaʊtʃ] n. 睡椅，长沙发椅",
    "n.",
    "睡椅，长沙发椅"
  ],
  [
    81,
    "cough",
    "He developed a persistent cough after the cold.",
    "感冒后，他一直咳嗽。",
    2381,
    "cough [kɒf] n. &v. 咳嗽",
    "n.&v.",
    "咳嗽"
  ],
  [
    83,
    "counsel",
    "She sought legal counsel before signing the agreement.",
    "签署协议前，她寻求了法律意见。",
    2385,
    "counsel [ˈkaʊnsəl] n. 1. 辩护律师 2. (专业)意见，忠告，劝告 v. 劝告，提供意见",
    "n.",
    "1. 辩护律师 2. (专业)意见，忠告，劝告 v. 劝告，提供意见"
  ],
  [
    84,
    "countable",
    "In English grammar, 'apple' is a countable noun.",
    "在英语语法中，apple 是可数名词。",
    2388,
    "countable [ˈkaʊntəbəl] adj. 可数的",
    "adj.",
    "可数的"
  ],
  [
    85,
    "countenance",
    "Her calm countenance reassured the frightened child.",
    "她平静的面容让受惊的孩子安心下来。",
    2389,
    "*countenance [ˈkaʊntənəns] n. 1. 面部表情，面容 2. 赞成，支持 v. 支持，鼓励",
    "n.",
    "1. 面部表情，面容 2. 赞成，支持 v. 支持，鼓励"
  ],
  [
    87,
    "counteract",
    "Opening the windows helped counteract the smell of paint.",
    "打开窗户有助于消除油漆味。",
    2391,
    "*counteract [ˌkaʊntəˈrækt] v. 抵消，中和，消解，抵制",
    "v.",
    "抵消，中和，消解，抵制"
  ],
  [
    88,
    "counterattack",
    "The team counterattacked immediately after regaining the ball.",
    "球队重新夺回球权后立即展开反击。",
    2392,
    "counterattack [ˈkaʊntərəˌtæk] v. 反攻，反击",
    "v.",
    "反攻，反击"
  ],
  [
    89,
    "counterbalance",
    "The heavy base counterbalances the tall lamp.",
    "沉重的底座使高高的灯保持平衡。",
    2393,
    "*counterbalance [ˌkaʊntəˈbæləns] v. 使平衡，弥补，抵消  [ˈkaʊntəbæləns] n. 平衡(力)，抗衡(力)",
    "v.",
    "使平衡，弥补，抵消  [ˈkaʊntəbæləns] n. 平衡(力)，抗衡(力)"
  ],
  [
    91,
    "counterfeit",
    "Inspectors found counterfeit tickets at the entrance.",
    "检查人员在入口处发现了假票。",
    2395,
    "*counterfeit [ˈkaʊntəfɪt] adj. 伪造的，仿造的 n. 伪造物，假冒物，仿制品  v. 伪造，仿制",
    "adj.",
    "伪造的，仿造的 n. 伪造物，假冒物，仿制品  v. 伪造，仿制"
  ],
  [
    93,
    "countess",
    "The countess hosted a dinner for local charities.",
    "女伯爵为当地慈善机构举办了一场晚宴。",
    2397,
    "countess [ˈkaʊntɪs] n. 1. 女伯爵 2. 伯爵夫人",
    "n.",
    "1. 女伯爵 2. 伯爵夫人"
  ],
  [
    94,
    "countless",
    "Countless stars filled the clear night sky.",
    "晴朗的夜空中布满了无数颗星星。",
    2398,
    "countless [ˈkaʊntlɪs] adj. 无数的",
    "adj.",
    "无数的"
  ],
  [
    97,
    "courageous",
    "The courageous firefighter entered the building to rescue a child.",
    "勇敢的消防员进入大楼营救一名孩子。",
    2407,
    "courageous [kəˈreɪdʒəs] adj. 勇敢的，有胆量的，无畏",
    "adj.",
    "勇敢的，有胆量的，无畏"
  ],
  [
    98,
    "courier",
    "A courier delivered the documents before noon.",
    "一名信使在中午前送达了文件。",
    2408,
    "*courier [ˈkʊrɪə] n. 1. 特别信使 2. 向导，旅游服务员",
    "n.",
    "1. 特别信使 2. 向导，旅游服务员"
  ],
  [
    99,
    "courteous",
    "The receptionist gave us a courteous welcome.",
    "接待员礼貌地欢迎了我们。",
    2411,
    "courteous [ˈkɜːtjəs] adj. 有礼貌的",
    "adj.",
    "有礼貌的"
  ]
];
test('TEM-017 56 bilingual contextual drafts are source-locked',()=>{
 assert.equal(result.task_id,'tem-017');
 assert.equal(result.status,'proposal');
 assert.equal(result.input_sha256,task.sha256);
 assert.equal(result.entries.length,input.entries.length);
 assert.equal(expected.length,56);
 assert.equal(new Set(expected.map(x=>x[0])).size,56);
 for(let i=0;i<result.entries.length;i++){
  const e=result.entries[i];
  assert.deepEqual(e.identity,input.entries[i].identity);
  assert.deepEqual(e.original,input.entries[i].current);
  assert.equal(e.verification,'needs-review');
  assert.equal(e.external_human_review,false);
  assert.equal(e.full_dictionary_senses_reviewed,false);
  assert.deepEqual(e.evidence,[]);
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
  assert.deepEqual(rules.filter(r=>r.pattern.test(r.id==='translation-metalinguistic'?cn:en)).map(r=>r.id),[],word);
 }
});
