'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const task=manifest.files.find(t=>t.task_id==='tem-012');
const input=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',task.file),'utf8'));
const result=JSON.parse(fs.readFileSync(path.join(root,'docs/model-task-results/worker-A/tem-012/result.json'),'utf8'));
const expected=[
  [
    35,
    "cauliflower",
    "She roasted the cauliflower with olive oil and garlic.",
    "她用橄榄油和大蒜烤了花菜。",
    1620,
    "cauliflower [ˈkɒlɪflaʊə] n. 菜花，花菜",
    "n.",
    "菜花，花菜"
  ],
  [
    36,
    "causal",
    "Researchers found no causal link between the two events.",
    "研究人员没有发现这两件事之间存在因果关系。",
    1621,
    "*causal [kɔːzəl] adj. 1. 原因的，构成原因的，因果关系的  2. 表示原因的",
    "adj.",
    "1. 原因的，构成原因的，因果关系的  2. 表示原因的"
  ],
  [
    37,
    "cause",
    "Heavy rain caused flooding in several villages.",
    "暴雨导致几个村庄发生洪水。",
    1622,
    "cause [kɔːz] v. 1. 使产生，使发生，引起 2. 使得 n. 1. 原因，起因 2. 理由，缘故 3. 事业，(奋斗的)目标",
    "v.",
    "1. 使产生，使发生，引起 2. 使得 n. 1. 原因，起因 2. 理由，缘故 3. 事业，(奋斗的)目标"
  ],
  [
    38,
    "caution",
    "He approached the icy steps with caution.",
    "他小心翼翼地走近结冰的台阶。",
    1623,
    "caution [ˈkɔːʃən] n. 1. 当心，谨慎 2. 告诫，警告  v. 警告，告诫",
    "n.",
    "1. 当心，谨慎 2. 告诫，警告  v. 警告，告诫"
  ],
  [
    39,
    "cavalry",
    "The cavalry rode ahead to scout the valley.",
    "骑兵部队骑马前往前方侦察山谷。",
    1625,
    "cavalry [ˈkævlrɪ] n. 骑兵，骑兵部队",
    "n.",
    "骑兵，骑兵部队"
  ],
  [
    40,
    "cavern",
    "The explorers entered a vast cavern beneath the mountain.",
    "探险者进入了山下一个巨大的洞穴。",
    1627,
    "*cavern [ˈkævən] n. 大洞穴，大山洞",
    "n.",
    "大洞穴，大山洞"
  ],
  [
    41,
    "caviar",
    "The restaurant served a small spoonful of caviar on toast.",
    "餐厅在烤面包上放了一小勺鱼子酱。",
    1628,
    "*caviar [ˈkævɪɑː] n. 鱼子酱",
    "n.",
    "鱼子酱"
  ],
  [
    42,
    "cavity",
    "The dentist found a cavity in her back tooth.",
    "牙医发现她的一颗后槽牙有蛀洞。",
    1629,
    "*cavity [ˈkævətɪ] n. 洞，穴",
    "n.",
    "洞，穴"
  ],
  [
    43,
    "cedar",
    "A tall cedar shaded the entrance to the house.",
    "一棵高大的雪松为房屋入口遮阴。",
    1631,
    "*cedar [ˈsiːdə] n. 雪松，香柏(木)",
    "n.",
    "雪松，香柏(木)"
  ],
  [
    44,
    "cede",
    "After the war, the kingdom was forced to cede the island to its neighbour.",
    "战争结束后，王国被迫将这座岛屿割让给邻国。",
    1632,
    "*cede [siːd] v. (战败后)割让(土地等)",
    "v.",
    "(战败后)割让(土地等)"
  ],
  [
    45,
    "celebrated",
    "A celebrated pianist performed at the town hall.",
    "一位著名钢琴家在市政厅演出。",
    1635,
    "celebrated [ˈselɪbreɪtɪd] adj. 有名的，声誉卓著的",
    "adj.",
    "有名的，声誉卓著的"
  ],
  [
    46,
    "celebration",
    "The family held a celebration for her graduation.",
    "全家为她毕业举行了庆祝活动。",
    1636,
    "celebration [ˌselɪˈbreɪʃən] n. 庆祝，庆祝会，典礼",
    "n.",
    "庆祝，庆祝会，典礼"
  ],
  [
    47,
    "celery",
    "She chopped the celery and added it to the soup.",
    "她把芹菜切碎放进汤里。",
    1638,
    "celery [ˈselərɪ] n. 芹菜",
    "n.",
    "芹菜"
  ],
  [
    48,
    "celestial",
    "The telescope captured images of distant celestial bodies.",
    "望远镜拍摄到了遥远天体的图像。",
    1639,
    "*celestial [sɪˈlestɪəl] adj. 天上的，天空的，天国的",
    "adj.",
    "天上的，天空的，天国的"
  ],
  [
    50,
    "cello",
    "He practised the cello for an hour before the concert.",
    "音乐会前，他练了一个小时大提琴。",
    1642,
    "cello [ˈtʃeləʊ] n. 大提琴",
    "n.",
    "大提琴"
  ],
  [
    51,
    "cellular",
    "The microscope revealed the cellular structure of the leaf.",
    "显微镜显示了叶片的细胞结构。",
    1643,
    "cellular [ˈseljʊlə] adj. 1. 多孔的 2. 细胞的，有细胞的，细胞质的",
    "adj.",
    "1. 多孔的 2. 细胞的，有细胞的，细胞质的"
  ],
  [
    52,
    "celluloid",
    "Early film reels were made of highly flammable celluloid.",
    "早期电影胶片由极易燃烧的赛璐珞制成。",
    1644,
    "celluloid [ˈseljʊlɔɪd] n. 1. 赛璐珞(坚硬胶片) 2. 拍成的电影",
    "n.",
    "1. 赛璐珞(坚硬胶片) 2. 拍成的电影"
  ],
  [
    53,
    "Celsius",
    "The temperature dropped to five degrees Celsius overnight.",
    "夜间气温降到了五摄氏度。",
    1645,
    "Celsius [ˈselsɪəs] adj. &n. 摄氏(的)",
    "adj.&n.",
    "摄氏(的)"
  ],
  [
    54,
    "cement",
    "The workers mixed cement with sand and water.",
    "工人们把水泥与沙子和水混合。",
    1646,
    "cement [sɪˈment] n. 水泥",
    "n.",
    "水泥"
  ],
  [
    56,
    "censor",
    "The film censor ordered several scenes to be removed.",
    "电影审查员要求删去几个镜头。",
    1648,
    "*censor [ˈsensə] n. (书报、电影等的)审查员，检查员  v. 审查，检查",
    "n.",
    "(书报、电影等的)审查员，检查员  v. 审查，检查"
  ],
  [
    57,
    "censorious",
    "His censorious remarks discouraged the young writers.",
    "他那些吹毛求疵的评论打击了年轻作家们的积极性。",
    1649,
    "*censorious [senˈsɔːrɪəs] adj. 苛求的，吹毛求疵的，好挑剔的",
    "adj.",
    "苛求的，吹毛求疵的，好挑剔的"
  ],
  [
    58,
    "censorship",
    "The newspaper protested against government censorship.",
    "这家报纸抗议政府的审查制度。",
    1650,
    "*censorship [ˈsensəʃɪp] n. 审查，检查，检查制度",
    "n.",
    "审查，检查，检查制度"
  ],
  [
    59,
    "censure",
    "The committee voted to censure the official for misconduct.",
    "委员会投票决定正式谴责这名官员的不当行为。",
    1651,
    "*censure [ˈsenʃə] v. 严厉批评某人，正式责备某人",
    "v.",
    "严厉批评某人，正式责备某人"
  ],
  [
    61,
    "centenary",
    "The museum marked its centenary with a special exhibition.",
    "博物馆举办特别展览纪念成立一百周年。",
    1654,
    "*centenary [senˈtiːnərɪ] n. 一百周年纪念",
    "n.",
    "一百周年纪念"
  ],
  [
    63,
    "centrist",
    "The centrist called for compromise between the rival parties.",
    "这位中间派人士呼吁对立政党之间达成妥协。",
    1660,
    "*centrist [ˈsentrɪst] n. &adj. 支持中间派的(人)，执行中间路线者，温和派",
    "n.&adj.",
    "支持中间派的(人)，执行中间路线者，温和派"
  ],
  [
    64,
    "ceramic",
    "The museum displayed a ceramic from the Ming dynasty.",
    "博物馆展出了一件明代陶器。",
    1662,
    "ceramic [sɪˈræmɪk] n. 制陶业，陶器，陶瓷工艺",
    "n.",
    "制陶业，陶器，陶瓷工艺"
  ],
  [
    66,
    "cerebral",
    "The film's cerebral dialogue appealed to viewers who enjoy complex ideas.",
    "这部电影富于思辨的对白吸引了喜欢复杂思想的观众。",
    1664,
    "*cerebral [ˈserɪbrəl] adj. 1. 脑的，大脑的 2. 深思的，理智的",
    "adj.",
    "1. 脑的，大脑的 2. 深思的，理智的"
  ],
  [
    67,
    "ceremonial",
    "The mayor wore a ceremonial robe for the opening.",
    "市长在开幕仪式上穿着礼服。",
    1665,
    "ceremonial [ˌserɪˈməʊnjəl] adj. 仪式上的，礼仪上的 n. 礼仪，仪式，典礼",
    "adj.",
    "仪式上的，礼仪上的 n. 礼仪，仪式，典礼"
  ],
  [
    68,
    "ceremonious",
    "Their ceremonious greeting made the informal visit feel awkward.",
    "他们过于讲究礼节的问候让这次非正式拜访显得尴尬。",
    1666,
    "*ceremonious [ˌserɪˈməʊniəs] adj. 讲究礼节的，拘泥于形式的",
    "adj.",
    "讲究礼节的，拘泥于形式的"
  ],
  [
    70,
    "certify",
    "The laboratory must certify that the water is safe to drink.",
    "实验室必须证明这水可以安全饮用。",
    1672,
    "*certify [ˈsɜːtɪfaɪ] v. 证明，证实",
    "v.",
    "证明，证实"
  ],
  [
    71,
    "certitude",
    "She spoke with certitude despite the lack of evidence.",
    "尽管缺乏证据，她说话时却十分笃定。",
    1673,
    "*certitude [ˈsɜːtɪtjuːd] n. 确定，坚定不移",
    "n.",
    "确定，坚定不移"
  ],
  [
    72,
    "cesspit",
    "The workers emptied the cesspit behind the old farmhouse.",
    "工人们清理了旧农舍后面的污水坑。",
    1674,
    "*cesspit [ˈsespɪt] n. 粪坑，垃圾坑，污水坑",
    "n.",
    "粪坑，垃圾坑，污水坑"
  ],
  [
    74,
    "chalet",
    "They rented a wooden chalet in the Alps for the winter.",
    "他们在阿尔卑斯山租了一间木屋过冬。",
    1678,
    "*chalet [ˈʃæleɪ] n. (瑞士的)木屋",
    "n.",
    "(瑞士的)木屋"
  ],
  [
    75,
    "challenging",
    "Designing the bridge was a challenging task for the engineers.",
    "设计这座桥对工程师们来说是一项艰巨的任务。",
    1681,
    "challenging [ˈtʃælɪndʒɪŋ] adj. 1. 引起兴趣的，使人思考的，激发干劲的 2. 困难的",
    "adj.",
    "1. 引起兴趣的，使人思考的，激发干劲的 2. 困难的"
  ],
  [
    78,
    "championship",
    "Her team won the national championship after a close final.",
    "她的球队在一场势均力敌的决赛后赢得全国冠军。",
    1685,
    "championship [ˈtʃæmpiənʃɪp] n. 1. 锦标赛 2. 冠军身份(称号) 3. 捍卫，拥护",
    "n.",
    "1. 锦标赛 2. 冠军身份(称号) 3. 捍卫，拥护"
  ],
  [
    80,
    "changeable",
    "The weather in the mountains is changeable even in summer.",
    "即使在夏天，山里的天气也变化无常。",
    1689,
    "changeable [ˈtʃeɪndʒəbl] adj. 易变的，可换的",
    "adj.",
    "易变的，可换的"
  ],
  [
    81,
    "chant",
    "A rhythmic chant rose from the crowd as the team entered.",
    "球队入场时，人群中响起有节奏的呼喊声。",
    1691,
    "*chant [tʃɑːnt] n. 1. 吟唱 2. 反复的大声说 3. 吟唱的曲调 v. 吟唱，反复说",
    "n.",
    "1. 吟唱 2. 反复的大声说 3. 吟唱的曲调 v. 吟唱，反复说"
  ],
  [
    82,
    "chap",
    "He's a friendly chap who always helps his neighbours.",
    "他是个友善的小伙子，总乐于帮助邻居。",
    1694,
    "chap [tʃæp] n. 家伙，小伙子",
    "n.",
    "家伙，小伙子"
  ],
  [
    83,
    "chapel",
    "They held a quiet wedding in the village chapel.",
    "他们在村里的小教堂举行了一场安静的婚礼。",
    1695,
    "chapel [ˈtʃæpəl] n. (基督教)小教堂",
    "n.",
    "(基督教)小教堂"
  ],
  [
    84,
    "chaplain",
    "The hospital chaplain visited patients who wanted spiritual support.",
    "医院牧师探望了希望获得精神慰藉的病人。",
    1696,
    "*chaplain [ˈtʃæplɪn] n. (随军或驻医院、学校等的)牧师、 神父",
    "n.",
    "(随军或驻医院、学校等的)牧师、 神父"
  ],
  [
    85,
    "charcoal",
    "She sketched the portrait with a stick of charcoal.",
    "她用一根炭笔画了这幅肖像素描。",
    1701,
    "charcoal [ˈtʃɑːkəʊl] n. (木)炭，炭笔",
    "n.",
    "(木)炭，炭笔"
  ],
  [
    87,
    "chariot",
    "The museum displayed a bronze model of an ancient chariot.",
    "博物馆展出了一件古代战车的青铜模型。",
    1704,
    "chariot [ˈtʃærɪət] n. 古时的双轮马车(战车)",
    "n.",
    "古时的双轮马车(战车)"
  ],
  [
    88,
    "charisma",
    "Her charisma helped her inspire a room full of volunteers.",
    "她的个人魅力让满屋的志愿者备受鼓舞。",
    1705,
    "*charisma [kəˈrɪzmə] n. 1. 吸引人效忠的能力，号召力 2. 神授的力量(才能)",
    "n.",
    "1. 吸引人效忠的能力，号召力 2. 神授的力量(才能)"
  ],
  [
    89,
    "charismatic",
    "The charismatic speaker held the audience's attention for an hour.",
    "这位富有号召力的演讲者让观众全神贯注地听了一个小时。",
    1706,
    "*charismatic [ˌkærɪzˈmætɪk] adj. 1. 有号召力的，有神授能力的 2. (宗教组织)崇尚神赐天赋的",
    "adj.",
    "1. 有号召力的，有神授能力的 2. (宗教组织)崇尚神赐天赋的"
  ],
  [
    90,
    "charitable",
    "A charitable foundation paid for the children's school meals.",
    "一家慈善基金会支付了孩子们的学校餐费。",
    1707,
    "charitable [ˈtʃærətəbl] adj. 1. 慈善的 2. 宽厚的，慷慨的",
    "adj.",
    "1. 慈善的 2. 宽厚的，慷慨的"
  ],
  [
    93,
    "chartered",
    "They took a chartered flight to the island.",
    "他们乘包机前往那座岛屿。",
    1713,
    "chartered [ˈtʃɑːtəd] adj. 特许的，持有特许证的  || chartered flight包机航班",
    "adj.",
    "特许的，持有特许证的  || chartered flight包机航班"
  ],
  [
    94,
    "charwoman",
    "The charwoman arrived early to clean the offices.",
    "女清洁工一大早就来打扫办公室。",
    1714,
    "*charwoman [ˈtʃɑːwʊmən] (pl charwomen) n. 清洁女工",
    "n.",
    "清洁女工"
  ],
  [
    95,
    "chase",
    "The dog chased a squirrel across the garden.",
    "狗追着一只松鼠跑过花园。",
    1715,
    "chase [tʃeɪs] v. 追逐追赶，追击 n. 追逐，追赶，追击",
    "v.",
    "追逐追赶，追击 n. 追逐，追赶，追击"
  ],
  [
    96,
    "chasm",
    "A deep chasm opened in the ground after the earthquake.",
    "地震后，地面出现了一道深深的裂缝。",
    1716,
    "chasm [ˈkæzəm] n. 1. (地壳的)裂隙，断层 2. 分歧，隔阂",
    "n.",
    "1. (地壳的)裂隙，断层 2. 分歧，隔阂"
  ],
  [
    99,
    "chatter",
    "The children chattered excitedly about the school trip.",
    "孩子们兴奋地聊个不停，谈论着学校旅行。",
    1720,
    "chatter [ˈtʃætə] v. 1. 喋喋不休，饶舌 2. (鸟)啁啾，(松鼠等)吱吱叫，(溪流)潺潺作声，(机器)颤动 3. (牙齿)打战 n. 喋喋不休，啁啾，震颤声",
    "v.",
    "1. 喋喋不休，饶舌 2. (鸟)啁啾，(松鼠等)吱吱叫，(溪流)潺潺作声，(机器)颤动 3. (牙齿)打战 n. 喋喋不休，啁啾，震颤声"
  ]
];
test('TEM-012: 50 context-based bilingual pairs remain source-locked drafts',()=>{
 assert.equal(expected.length,50);
 assert.equal(new Set(expected.map(x=>x[0])).size,50);
 assert.equal(result.task_id,'tem-012');
 assert.equal(result.status,'proposal');
 assert.equal(result.input_sha256,task.sha256);
 assert.equal(result.entries.length,input.entries.length);
 for(const [i,word,en,cn,line,raw,pos,meaning] of expected){
  const row=result.entries[i],src=input.entries[i];
  assert.equal(row.identity.word,word);
  assert.equal(row.identity.source_line,line);
  assert.equal(row.identity.source_raw,raw);
  assert.deepEqual(row.identity,src.identity);
  assert.deepEqual(row.original,src.current);
  assert.equal(row.selected_sense.pos,pos);
  assert.equal(row.selected_sense.meaning,meaning);
  assert.equal(row.proposed.example,en);
  assert.equal(row.proposed.example_translation,cn);
  assert.equal(row.draft_method,'editorial-context-rewrite-needs-review');
  assert.equal(row.verification,'needs-review');
  assert.equal(row.external_human_review,false);
  assert.equal(row.full_dictionary_senses_reviewed,false);
  assert.deepEqual(row.evidence,[]);
  assert.ok(en.endsWith('.')&&cn.endsWith('。'));
  assert.deepEqual(rules.filter(r=>r.pattern.test(r.id==='translation-metalinguistic'?cn:en)).map(r=>r.id),[],'template '+word);
 }
});
