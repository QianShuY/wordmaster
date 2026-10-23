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
    "tem-015",
    47,
    "composer",
    "The composer wrote the film's haunting piano theme.",
    "这位作曲家为电影创作了令人难忘的钢琴主题曲。",
    2079,
    "composer [kəmˈpəʊzə] n. 作曲家，创造者",
    "n.",
    "作曲家，创造者"
  ],
  [
    "tem-015",
    48,
    "composite",
    "The helmet is made from a lightweight composite material.",
    "这顶头盔由轻质复合材料制成。",
    2080,
    "*composite [ˈkɒmpəzɪt] adj. 混合成的，综合成的 n. 合成物，复合材料",
    "adj.",
    "混合成的，综合成的 n. 合成物，复合材料"
  ],
  [
    "tem-015",
    49,
    "composure",
    "Despite the emergency, the pilot maintained her composure.",
    "尽管发生了紧急情况，飞行员仍保持镇定。",
    2082,
    "*composure [kəmˈpəʊʒə] n. 镇静，沉着，泰然自若",
    "n.",
    "镇静，沉着，泰然自若"
  ],
  [
    "tem-015",
    52,
    "comprehensible",
    "The instructions were comprehensible even to beginners.",
    "即使是初学者也能看懂这些说明。",
    2085,
    "comprehensible [ˌkɒmprɪˈhensəbl] adj. 能理解的",
    "adj.",
    "能理解的"
  ],
  [
    "tem-015",
    54,
    "compressor",
    "The mechanic replaced the faulty air compressor.",
    "机械师更换了发生故障的空气压缩机。",
    2089,
    "compressor [kəmˈpresə] n. 压缩机，压气机",
    "n.",
    "压缩机，压气机"
  ],
  [
    "tem-015",
    56,
    "compulsion",
    "He felt a sudden compulsion to check the locked door again.",
    "他突然有种难以抑制的冲动，想再检查一遍门是否锁好。",
    2092,
    "*compulsion [kəmˈpʌlʃən] n. 1. 强制，强迫 2. 难以抗拒的冲动",
    "n.",
    "1. 强制，强迫 2. 难以抗拒的冲动"
  ],
  [
    "tem-015",
    58,
    "compunction",
    "She felt no compunction about refusing the unfair request.",
    "她拒绝这个不合理的请求时毫无愧疚之感。",
    2094,
    "*compunction [kəmˈpʌŋkʃən] n. 内疚，悔恨",
    "n.",
    "内疚，悔恨"
  ],
  [
    "tem-015",
    61,
    "con",
    "The fake dealer conned several buyers out of their savings.",
    "那个假冒经销商骗走了几名买家的积蓄。",
    2098,
    "*con [kɒn] v. 骗，哄骗，欺诈",
    "v.",
    "骗，哄骗，欺诈"
  ],
  [
    "tem-015",
    63,
    "concede",
    "After reviewing the figures, he conceded that his estimate was wrong.",
    "核对数据后，他承认自己的估算有误。",
    2100,
    "*concede [kənˈsiːd] v. 1. (常指勉强地)承认 2. 容许，让与",
    "v.",
    "1. (常指勉强地)承认 2. 容许，让与"
  ],
  [
    "tem-015",
    64,
    "conceit",
    "His conceit made him dismiss every suggestion from his colleagues.",
    "他的自负使他对同事的建议一概不予理会。",
    2101,
    "conceit  [kənˈsiːt] n. 自负，骄傲自满",
    "n.",
    "自负，骄傲自满"
  ],
  [
    "tem-015",
    65,
    "conceited",
    "He sounded conceited when he claimed he could never lose.",
    "他声称自己绝不会输，听起来十分自负。",
    2102,
    "conceited [kənˈsiːtɪd] adj. 自负的，自满的",
    "adj.",
    "自负的，自满的"
  ],
  [
    "tem-015",
    66,
    "conceivable",
    "It is conceivable that the train will be delayed by the storm.",
    "这场暴风雨可能会导致火车晚点。",
    2103,
    "conceivable [kənˈsiːvəbl] adj. 可想到的，可想象的，可能的",
    "adj.",
    "可想到的，可想象的，可能的"
  ],
  [
    "tem-015",
    67,
    "conceive",
    "The engineers conceived a plan to reduce energy use.",
    "工程师们构想了一项降低能耗的方案。",
    2104,
    "conceive [kənˈsiːv] v. 1. 设想，想出，想象 2. 怀(胎)，怀孕",
    "v.",
    "1. 设想，想出，想象 2. 怀(胎)，怀孕"
  ],
  [
    "tem-015",
    69,
    "concentric",
    "The children drew three concentric circles on the board.",
    "孩子们在黑板上画了三个同心圆。",
    2107,
    "*concentric [kənˈsentrɪ] adj. 同心的，同轴的",
    "adj.",
    "同心的，同轴的"
  ],
  [
    "tem-015",
    70,
    "conception",
    "Her conception of leadership changed after the project.",
    "完成这个项目后，她对领导力的理解发生了变化。",
    2109,
    "conception [kənˈsepʃən] n. 1. 概念，观念，理解 2. 构想，看法 3. 受孕，妊娠",
    "n.",
    "1. 概念，观念，理解 2. 构想，看法 3. 受孕，妊娠"
  ],
  [
    "tem-015",
    71,
    "conceptual",
    "The students built a conceptual model of the water cycle.",
    "学生们建立了一个水循环的概念模型。",
    2110,
    "conceptual [kənˈseptʃʊəl] adj. 概念的，观念的，抽象的",
    "adj.",
    "概念的，观念的，抽象的"
  ],
  [
    "tem-015",
    72,
    "concern",
    "The proposed closure concerns everyone who works at the factory.",
    "拟议中的工厂关闭计划关系到每一位厂内员工。",
    2111,
    "concern [kənˈsɜːn] v. 1. 涉及，影响 2. 使关心，使挂念，使担心 || as far as…be concerned关于…，至于…  n. 1. (利害)关系，所关切的事 2. 关心，担心，挂念 3. 商行，企业 || show concern for关心",
    "v.",
    "1. 涉及，影响 2. 使关心，使挂念，使担心 || as far as…be concerned关于…，至于…  n. 1. (利害)关系，所关切的事 2. 关心，担心，挂念 3. 商行，企业 || show concern for关心"
  ],
  [
    "tem-015",
    74,
    "concerto",
    "The orchestra performed a violin concerto by Mozart.",
    "乐团演奏了一首莫扎特的小提琴协奏曲。",
    2114,
    "*concerto [kənˈtʃeətəʊ] n. 协奏曲",
    "n.",
    "协奏曲"
  ],
  [
    "tem-015",
    76,
    "conciliate",
    "The mediator tried to conciliate the two sides after the dispute.",
    "争端发生后，调解员试图安抚双方、促成和解。",
    2116,
    "*conciliate [kənˈsɪlɪeɪt] v. 安抚，抚慰",
    "v.",
    "安抚，抚慰"
  ],
  [
    "tem-015",
    78,
    "conclusive",
    "The fingerprint evidence was conclusive.",
    "这些指纹证据足以作出定论。",
    2120,
    "conclusive [kənˈkluːsɪv] adj. 结论性的，确定的，决定性的",
    "adj.",
    "结论性的，确定的，决定性的"
  ],
  [
    "tem-015",
    79,
    "concord",
    "The peace agreement brought a period of concord between the neighbouring states.",
    "和平协议为邻国之间带来了一段和睦时期。",
    2121,
    "*concord [ˈkɒŋkɔːd] n. 一致，和睦",
    "n.",
    "一致，和睦"
  ],
  [
    "tem-015",
    80,
    "concrete",
    "The committee asked for concrete evidence before making a decision.",
    "委员会要求在作出决定前拿出具体证据。",
    2122,
    "concrete [ˈkɒŋkriːt] adj. 1. 具体的，有形的 2. 明确的 n. 1. 具体物 2. 混凝土，凝结物  v. 用混凝土修筑",
    "adj.",
    "1. 具体的，有形的 2. 明确的 n. 1. 具体物 2. 混凝土，凝结物  v. 用混凝土修筑"
  ],
  [
    "tem-015",
    81,
    "concubine",
    "The historical novel tells the story of a concubine in the imperial court.",
    "这部历史小说讲述了一位宫廷妾室的故事。",
    2123,
    "concubine [ˈkɒŋkjʊbaɪn] n. (一夫多妻制国家中的)妾，姨太太，小老婆",
    "n.",
    "(一夫多妻制国家中的)妾，姨太太，小老婆"
  ],
  [
    "tem-015",
    82,
    "concur",
    "The two doctors concurred that further tests were necessary.",
    "两位医生一致认为还需要进一步检查。",
    2124,
    "*concur [kənˈkɜː] v. 1. 同意  2. 同时发生",
    "v.",
    "1. 同意  2. 同时发生"
  ],
  [
    "tem-015",
    85,
    "condescend",
    "He refused to condescend to answer the junior reporter's question.",
    "他不屑于回答那位年轻记者的问题。",
    2127,
    "*condescend [ˌkɒndɪˈsend] v. 1. 俯就，屈尊 2. 自以为高人一等",
    "v.",
    "1. 俯就，屈尊 2. 自以为高人一等"
  ],
  [
    "tem-015",
    86,
    "conditional",
    "The offer of funding is conditional on a successful safety inspection.",
    "这笔资助以通过安全检查为条件。",
    2129,
    "conditional [kənˈdɪʃənəl] adj. 附有条件的",
    "adj.",
    "附有条件的"
  ],
  [
    "tem-015",
    87,
    "conditioner",
    "She used conditioner to soften her dry hair.",
    "她用护发素让干燥的头发变得柔顺。",
    2130,
    "conditioner [kənˈdɪʃənə] n. 1. 调理的物品(物质) 2. 护发剂，护发素",
    "n.",
    "1. 调理的物品(物质) 2. 护发剂，护发素"
  ],
  [
    "tem-015",
    88,
    "condolence",
    "We sent a letter of condolence to the bereaved family.",
    "我们给失去亲人的家属寄去一封慰问信。",
    2131,
    "condolence [kənˈdəʊləns] n. 吊唁，追悼，悼词",
    "n.",
    "吊唁，追悼，悼词"
  ],
  [
    "tem-015",
    89,
    "condom",
    "A condom can help reduce the risk of sexually transmitted infections.",
    "使用避孕套有助于降低性传播感染的风险。",
    2132,
    "*condom [ˈkɒndəm] n. (男用)避孕套",
    "n.",
    "(男用)避孕套"
  ],
  [
    "tem-015",
    90,
    "conducive",
    "A quiet room is conducive to focused study.",
    "安静的房间有助于专心学习。",
    2133,
    "conducive [kənˈdjuːsɪv] adj. 有助于…的，促成…的",
    "adj.",
    "有助于…的，促成…的"
  ],
  [
    "tem-015",
    93,
    "cone",
    "The traffic officer placed an orange cone beside the pothole.",
    "交通警员在路面坑洞旁放了一个橙色路锥。",
    2136,
    "cone [kəʊn] n. 1. 圆锥体  2. 球果",
    "n.",
    "1. 圆锥体  2. 球果"
  ],
  [
    "tem-015",
    94,
    "confection",
    "The bakery displayed a delicate chocolate confection in the window.",
    "面包店的橱窗里陈列着一款精致的巧克力甜点。",
    2137,
    "*confection [kənˈfekʃən] n. 甜食",
    "n.",
    "甜食"
  ],
  [
    "tem-015",
    95,
    "confederate",
    "The thief's confederate waited outside in a parked car.",
    "小偷的同伙坐在停在外面的车里等候。",
    2139,
    "*confederate [kənˈfedərɪt] n. 1. 共谋者，同党 2. 盟友，同盟者",
    "n.",
    "1. 共谋者，同党 2. 盟友，同盟者"
  ],
  [
    "tem-015",
    96,
    "confer",
    "The university will confer an honorary degree on the scientist.",
    "大学将授予这位科学家荣誉学位。",
    2140,
    "*confer [kənˈfɜː] v. 1. 商讨 2. 授予，颁赠(勋衔、学位等)",
    "v.",
    "1. 商讨 2. 授予，颁赠(勋衔、学位等)"
  ],
  [
    "tem-015",
    98,
    "confession",
    "The suspect signed a confession after speaking with a lawyer.",
    "嫌疑人在与律师交谈后签署了一份认罪供述。",
    2143,
    "confession [kənˈfeʃən] n. 忏悔，认错，招供",
    "n.",
    "忏悔，认错，招供"
  ],
  [
    "tem-015",
    99,
    "confetti",
    "Guests showered the newlyweds with confetti as they left the hall.",
    "新人走出礼堂时，宾客们向他们撒下五彩纸屑。",
    2144,
    "*confetti [kənˈfetɪ] n. (婚礼时投撒在新娘和新郎身上的)五彩纸屑",
    "n.",
    "(婚礼时投撒在新娘和新郎身上的)五彩纸屑"
  ],
  [
    "tem-016",
    0,
    "confidant",
    "She trusted her oldest friend as a confidant.",
    "她把相识最久的朋友当作知己。",
    2145,
    "*confidant [ˌkɒnfɪˈdænt] n. 知己，心腹",
    "n.",
    "知己，心腹"
  ],
  [
    "tem-016",
    1,
    "confide",
    "He confided his worries to his sister.",
    "他向姐姐吐露了自己的担忧。",
    2146,
    "*confide [kənˈfaɪd] v. 1. 吐露(秘密等) 2. 信托，委托",
    "v.",
    "1. 吐露(秘密等) 2. 信托，委托"
  ],
  [
    "tem-016",
    3,
    "configuration",
    "The technician changed the network configuration to improve stability.",
    "技术人员调整了网络配置以提高稳定性。",
    2150,
    "*configuration [kənˌfɪɡəˈreɪʃə] n. 构造，外形，布置，结构",
    "n.",
    "构造，外形，布置，结构"
  ],
  [
    "tem-016",
    4,
    "confine",
    "The storm confined the hikers to their tents all afternoon.",
    "暴风雨让徒步者整个下午都只能待在帐篷里。",
    2151,
    "confine [kənˈfaɪn] v. 1. 幽禁，监禁 2. 限制，把…局限于",
    "v.",
    "1. 幽禁，监禁 2. 限制，把…局限于"
  ],
  [
    "tem-016",
    5,
    "confinement",
    "After weeks of confinement, the prisoner was allowed into the yard.",
    "被关押数周后，这名囚犯终于获准到院子里活动。",
    2152,
    "*confinement [kənˈfaɪnmənt] n. 1. 幽禁，挽留，监禁 2. 分娩 3. 限制，局限",
    "n.",
    "1. 幽禁，挽留，监禁 2. 分娩 3. 限制，局限"
  ],
  [
    "tem-016",
    6,
    "confirmation",
    "We received written confirmation of the booking.",
    "我们收到了预订的书面确认。",
    2154,
    "confirmation [ˌkɒnfəˈmeɪʃən] n. 确认，认可，证实",
    "n.",
    "确认，认可，证实"
  ],
  [
    "tem-016",
    7,
    "confiscate",
    "Customs officers confiscated the undeclared goods.",
    "海关人员没收了未申报的货物。",
    2155,
    "confiscate [ˈkɒnfɪskeɪt] v. 没收(私人财产)，把…充公",
    "v.",
    "没收(私人财产)，把…充公"
  ],
  [
    "tem-016",
    8,
    "conflate",
    "The report wrongly conflates correlation with causation.",
    "这份报告错误地把相关性和因果关系混为一谈。",
    2156,
    "*conflate [kənˈfleɪt] v. 合并，合成",
    "v.",
    "合并，合成"
  ],
  [
    "tem-016",
    10,
    "conformity",
    "The equipment was inspected for conformity with safety standards.",
    "设备接受了是否符合安全标准的检查。",
    2159,
    "conformity [kənˈfɔːmətɪ] n. 1. 依照，遵从 2. 符合，一致 || in conformity with遵照",
    "n.",
    "1. 依照，遵从 2. 符合，一致 || in conformity with遵照"
  ],
  [
    "tem-016",
    12,
    "confrontation",
    "The argument escalated into a confrontation outside the office.",
    "争吵升级为办公室外的一场对峙。",
    2161,
    "confrontation [ˌkɒnfrʌnˈteɪʃən] n. 对抗，对峙，冲突",
    "n.",
    "对抗，对峙，冲突"
  ],
  [
    "tem-016",
    13,
    "confuse",
    "The similar labels confused the new employees.",
    "相似的标签让新员工感到困惑。",
    2162,
    "confuse [kənˈfjuːz] v. 1. 混淆，弄错 2. 把…弄糊涂，使…慌乱",
    "v.",
    "1. 混淆，弄错 2. 把…弄糊涂，使…慌乱"
  ],
  [
    "tem-016",
    15,
    "congenial",
    "She found the new workplace congenial and welcoming.",
    "她觉得新工作环境令人愉快，也很友善。",
    2164,
    "*congenial [kənˈdʒiːnɪəl] adj. 令人愉快的，适意的，意气相投的，情投意合的",
    "adj.",
    "令人愉快的，适意的，意气相投的，情投意合的"
  ],
  [
    "tem-016",
    16,
    "congenital",
    "The infant was born with a congenital heart defect.",
    "这名婴儿出生时就有先天性心脏缺陷。",
    2165,
    "*congenital [kənˈdʒenɪtəl] adj. (疾病)先天的",
    "adj.",
    "(疾病)先天的"
  ],
  [
    "tem-016",
    17,
    "congested",
    "The roads were congested after the concert.",
    "演唱会结束后，道路十分拥堵。",
    2166,
    "*congested [kənˈdʒestɪd] adj. 堵塞的，不畅通的",
    "adj.",
    "堵塞的，不畅通的"
  ],
  [
    "tem-016",
    18,
    "congestion",
    "The city introduced bus lanes to ease traffic congestion.",
    "这座城市增设公交专用道以缓解交通拥堵。",
    2167,
    "congestion [kənˈdʒestʃən] n. 1. 阻塞，拥挤 2. 充血",
    "n.",
    "1. 阻塞，拥挤 2. 充血"
  ],
  [
    "tem-016",
    19,
    "congratulate",
    "We congratulated Maya on winning the scholarship.",
    "我们祝贺玛雅获得奖学金。",
    2168,
    "congratulate [kənˈɡrætʃʊleɪt] v. .祝贺，向…致祝贺词",
    "v.",
    ".祝贺，向…致祝贺词"
  ],
  [
    "tem-016",
    20,
    "congregate",
    "Visitors began to congregate outside the museum before opening time.",
    "开馆前，游客开始聚集在博物馆外。",
    2170,
    "congregate [ˈkɒnɡrɪɡeɪt] v. 集合，聚集",
    "v.",
    "集合，聚集"
  ],
  [
    "tem-016",
    21,
    "congregation",
    "The congregation stood to sing the final hymn.",
    "会众起立唱最后一首赞美诗。",
    2171,
    "congregation [ˌkɒŋɡrɪˈɡeɪʃən] n. 1. 聚集，集会 2. 人群 3. (教堂中的)会众",
    "n.",
    "1. 聚集，集会 2. 人群 3. (教堂中的)会众"
  ],
  [
    "tem-016",
    23,
    "congressman",
    "The congressman met voters at a town hall meeting.",
    "这位国会议员在市民大会上与选民见面。",
    2173,
    "congressman [ˈkɒŋɡrɪsmən] n. (AmE)国会议员",
    "n.",
    "(AmE)国会议员"
  ],
  [
    "tem-016",
    24,
    "congruent",
    "The two triangles are congruent in shape and size.",
    "这两个三角形形状和大小完全相同，是全等三角形。",
    2175,
    "congruent [ˈkɒnɡrʊənt] adj. 1. 一致的，和谐的 2. 相合的，全等的",
    "adj.",
    "1. 一致的，和谐的 2. 相合的，全等的"
  ],
  [
    "tem-016",
    25,
    "conical",
    "The mountain has a distinctive conical peak.",
    "这座山有一个形状独特的圆锥形山峰。",
    2176,
    "conical [ˈkɒnɪkəl] adj. 圆锥的，圆锥形的",
    "adj.",
    "圆锥的，圆锥形的"
  ],
  [
    "tem-016",
    26,
    "conifer",
    "A tall conifer stood at the edge of the garden.",
    "花园边缘长着一棵高大的针叶树。",
    2177,
    "conifer [ˈkɒnɪfə] n. 针叶树(如松树等)",
    "n.",
    "针叶树(如松树等)"
  ]
];
test('TEM-015/016: 58 source-locked bilingual editorial candidates',()=>{
 assert.equal(expected.length,58);
 assert.equal(new Set(expected.map(e=>e[0]+'/'+e[1])).size,58);
 for(const taskId of ['tem-015','tem-016']){
  const result=JSON.parse(fs.readFileSync(path.join(root,'docs/model-task-results/worker-A',taskId,'result.json'),'utf8'));
  const task=manifest.files.find(t=>t.task_id===taskId);
  const input=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',task.file),'utf8'));
  assert.equal(result.task_id,taskId);
  assert.equal(result.status,'proposal');
  assert.equal(result.input_sha256,task.sha256);
  assert.equal(result.entries.length,input.entries.length);
  for(let i=0;i<result.entries.length;i++){
   const row=result.entries[i];
   assert.deepEqual(row.identity,input.entries[i].identity,taskId+'/'+i);
   assert.deepEqual(row.original,input.entries[i].current,taskId+'/'+i);
   assert.equal(row.verification,'needs-review',taskId+'/'+i);
   assert.equal(row.external_human_review,false,taskId+'/'+i);
   assert.equal(row.full_dictionary_senses_reviewed,false,taskId+'/'+i);
   assert.deepEqual(row.evidence,[],taskId+'/'+i);
  }
  for(const [t,i,w,en,cn,line,raw,pos,meaning] of expected.filter(e=>e[0]===taskId)){
   const row=result.entries[i];
   assert.equal(row.identity.word,w);
   assert.equal(row.identity.source_line,line);
   assert.equal(row.identity.source_raw,raw);
   assert.equal(row.selected_sense.pos,pos);
   assert.equal(row.selected_sense.meaning,meaning);
   assert.equal(row.proposed.example,en);
   assert.equal(row.proposed.example_translation,cn);
   assert.equal(row.draft_method,'editorial-context-rewrite-needs-review');
   assert.ok(en.endsWith('.')&&cn.endsWith('。'));
   const flagged=rules.filter(r=>r.pattern.test(r.id==='translation-metalinguistic'?cn:en)).map(r=>r.id);
   assert.deepEqual(flagged,[],t+'/'+w);
  }
 }
});
