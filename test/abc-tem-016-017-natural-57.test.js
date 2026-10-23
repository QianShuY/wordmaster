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
    "tem-016",
    27,
    "coniferous",
    "Many coniferous trees keep their needles through winter.",
    "许多针叶树在冬季仍保留针叶。",
    2178,
    "*coniferous [kəʊˈnɪfərəs] adj. 针叶树的",
    "adj.",
    "针叶树的"
  ],
  [
    "tem-016",
    28,
    "conjecture",
    "Without further evidence, we can only conjecture about the cause of the fire.",
    "没有更多证据，我们只能推测起火原因。",
    2179,
    "*conjecture [kənˈdʒektʃə] v. 推测，猜测",
    "v.",
    "推测，猜测"
  ],
  [
    "tem-016",
    30,
    "conjure",
    "The magician conjured a rabbit out of an empty hat.",
    "魔术师从一顶空帽子里变出了一只兔子。",
    2181,
    "*conjure [ˈkʌndʒə] v. 1. 变魔术，耍戏法 2. (用魔术般)变出，(变戏法般地)使…呈现",
    "v.",
    "1. 变魔术，耍戏法 2. (用魔术般)变出，(变戏法般地)使…呈现"
  ],
  [
    "tem-016",
    31,
    "connoisseur",
    "As a coffee connoisseur, she could identify the beans by their aroma.",
    "作为咖啡鉴赏家，她能凭香气辨认咖啡豆。",
    2184,
    "*connoisseur [ˌkɒnəˈsɜː] n. (艺术品、美酒等的)鉴赏家",
    "n.",
    "(艺术品、美酒等的)鉴赏家"
  ],
  [
    "tem-016",
    32,
    "connotation",
    "The word slim has a more positive connotation than skinny.",
    "slim 这个词比 skinny 带有更积极的含义。",
    2185,
    "*connotation [ˌkɒnəˈteɪʃən] n. 含蓄，涵义",
    "n.",
    "含蓄，涵义"
  ],
  [
    "tem-016",
    33,
    "connote",
    "For many people, the word home connotes warmth and safety.",
    "对许多人来说，home 这个词意味着温暖和安全。",
    2186,
    "*connote [kəˈnəʊt] v. 意味着，暗指，暗示",
    "v.",
    "意味着，暗指，暗示"
  ],
  [
    "tem-016",
    35,
    "conqueror",
    "The conqueror entered the city after the siege ended.",
    "围城结束后，征服者进入了这座城市。",
    2188,
    "conqueror [ˈkɒŋkərə] n. 征服者，胜利者",
    "n.",
    "征服者，胜利者"
  ],
  [
    "tem-016",
    39,
    "conscientiously",
    "She conscientiously checked every figure in the report.",
    "她认真核对了报告中的每一个数字。",
    2192,
    "conscientiously [ˌkɒnʃɪˈenʃəslɪ] adv. 认真地，诚心诚意地",
    "adv.",
    "认真地，诚心诚意地"
  ],
  [
    "tem-016",
    41,
    "conscript",
    "During the war, the government conscripted thousands of young men.",
    "战争期间，政府征召了数千名年轻男子入伍。",
    2195,
    "*conscript [kənˈskrɪpt] v. 征召服兵役 n. 应征入伍者",
    "v.",
    "征召服兵役 n. 应征入伍者"
  ],
  [
    "tem-016",
    42,
    "consecrate",
    "The bishop consecrated the new chapel in a short ceremony.",
    "主教在一场简短的仪式上为新礼拜堂举行祝圣礼。",
    2196,
    "*consecrate [ˈkɒnsɪkreɪt] v. 1. 使圣化，奉…为神圣 2. 奉献",
    "v.",
    "1. 使圣化，奉…为神圣 2. 奉献"
  ],
  [
    "tem-016",
    45,
    "consent",
    "She refused to consent to the use of her photograph.",
    "她拒绝同意别人使用她的照片。",
    2199,
    "consent  [kənˈsent] v. 同意，答应，承诺",
    "v.",
    "同意，答应，承诺"
  ],
  [
    "tem-016",
    46,
    "consequent",
    "The power cut and consequent delays disrupted the train service.",
    "停电及随之而来的延误打乱了列车运行。",
    2201,
    "consequent [ˈkɒnsɪkwənt] adj. 随之而来的，由…所导致的",
    "adj.",
    "随之而来的，由…所导致的"
  ],
  [
    "tem-016",
    48,
    "conservatism",
    "His conservatism made him reluctant to change the old procedures.",
    "他的守旧态度使他不愿改变旧流程。",
    2204,
    "conservatism [kənˈsɜːvətɪzəm] n. 1. 保守，守旧性 2. 保守主义",
    "n.",
    "1. 保守，守旧性 2. 保守主义"
  ],
  [
    "tem-016",
    49,
    "conservative",
    "We made a conservative estimate of the repair costs.",
    "我们对维修费用作了谨慎估算。",
    2205,
    "conservative [kənˈsɜːvətɪv] adj. 1. 保守的 2. 拘谨的，谨慎的 n. 1. 因循守旧者，保守者  2. 保守党党员",
    "adj.",
    "1. 保守的 2. 拘谨的，谨慎的 n. 1. 因循守旧者，保守者  2. 保守党党员"
  ],
  [
    "tem-016",
    50,
    "conserve",
    "Turn off unused lights to conserve electricity.",
    "关掉不用的灯以节约用电。",
    2206,
    "conserve [kənˈsɜːv] v. 节约使用，保存",
    "v.",
    "节约使用，保存"
  ],
  [
    "tem-016",
    54,
    "considering",
    "Considering the heavy rain, the turnout was surprisingly good.",
    "考虑到雨下得很大，到场人数已经相当可观。",
    2211,
    "considering [kənˈsɪdərɪŋ] prep. 就…而论，照…来说",
    "prep.",
    "就…而论，照…来说"
  ],
  [
    "tem-016",
    55,
    "consign",
    "She consigned the antique clock to a local auction house.",
    "她把那座古董钟委托给当地拍卖行寄售。",
    2212,
    "*consign [kənˈsaɪn] v. 1. 寄售(货品)，托运 2. 寄售，托付，委托",
    "v.",
    "1. 寄售(货品)，托运 2. 寄售，托付，委托"
  ],
  [
    "tem-016",
    56,
    "consignment",
    "The shop received a consignment of winter coats on Monday.",
    "商店星期一收到了一批寄售的冬季外套。",
    2213,
    "*consignment [kənˈsaɪnmənt] n. 1. 寄售的货物 2. 寄售，托付，委托",
    "n.",
    "1. 寄售的货物 2. 寄售，托付，委托"
  ],
  [
    "tem-016",
    57,
    "consistency",
    "The sauce should have a smooth, thick consistency.",
    "这种酱汁应该质地细腻而浓稠。",
    2215,
    "consistency [kənˈsɪstənsɪ] n. 1. 一贯，前后一致，稳定性  2. (液体的)浓度",
    "n.",
    "1. 一贯，前后一致，稳定性  2. (液体的)浓度"
  ],
  [
    "tem-016",
    58,
    "console",
    "Her friends tried to console her after the loss.",
    "遭受损失后，朋友们试着安慰她。",
    2217,
    "*console [kənˈsəʊl] v. 安慰，慰问 n. 仪表板，控制台，键盘之入口",
    "v.",
    "安慰，慰问 n. 仪表板，控制台，键盘之入口"
  ],
  [
    "tem-016",
    60,
    "consonant",
    "The word ship begins with the consonant sound /ʃ/.",
    "ship 这个词以辅音 /ʃ/ 开头。",
    2219,
    "consonant [ˈkɒnsənənt] n. 辅音，辅音字母 adj. 一致的，和谐的",
    "n.",
    "辅音，辅音字母 adj. 一致的，和谐的"
  ],
  [
    "tem-016",
    61,
    "consortium",
    "A consortium of universities funded the research project.",
    "几所大学组成的联合体资助了这个研究项目。",
    2220,
    "*consortium [kənˈsɔːtɪəm] n. 联合，合伙，国际财团",
    "n.",
    "联合，合伙，国际财团"
  ],
  [
    "tem-016",
    64,
    "conspire",
    "The officials conspired to conceal the missing funds.",
    "这些官员密谋掩盖资金失踪一事。",
    2223,
    "*conspire [kənˈspaɪə] v. 密谋，搞阴谋，图谋",
    "v.",
    "密谋，搞阴谋，图谋"
  ],
  [
    "tem-016",
    65,
    "constable",
    "The constable asked the driver to pull over.",
    "警察要求司机靠边停车。",
    2224,
    "constable [ˈkʌnstəbl] n. (BrE)警察，警官",
    "n.",
    "(BrE)警察，警官"
  ],
  [
    "tem-016",
    66,
    "constancy",
    "He admired her constancy in caring for her father.",
    "他钦佩她始终如一地照顾父亲。",
    2225,
    "*constancy [ˈkɒnstənsɪ] n. 1. 持久不变，始终如一 2. 忠实，忠诚",
    "n.",
    "1. 持久不变，始终如一 2. 忠实，忠诚"
  ],
  [
    "tem-016",
    68,
    "constantly",
    "He constantly checks his phone during meetings.",
    "他开会时总是不停地查看手机。",
    2227,
    "constantly [ˈkɒnstəntlɪ] adv. 1. 经久不变地，永恒地  2. 经常地，不断地",
    "adv.",
    "1. 经久不变地，永恒地  2. 经常地，不断地"
  ],
  [
    "tem-016",
    69,
    "constellation",
    "We spotted the constellation Orion in the winter sky.",
    "我们在冬夜的天空中看到了猎户座。",
    2228,
    "constellation [ˌkɒnstəˈleɪʃən] n. 星座，星群",
    "n.",
    "星座，星群"
  ],
  [
    "tem-016",
    70,
    "constituency",
    "She visited several schools in her constituency.",
    "她走访了自己选区内的几所学校。",
    2229,
    "constituency [kənˈstɪtjʊənsɪ] n. 1. 全体选民，选区的选民  2. 选区",
    "n.",
    "1. 全体选民，选区的选民  2. 选区"
  ],
  [
    "tem-016",
    71,
    "constituent",
    "A constituent wrote to the representative about road safety.",
    "一名选民就道路安全问题给民意代表写了信。",
    2230,
    "*constituent [kənˈstɪtjʊənt] n. 1. 选民，选举人 2. 成分，要素 adj. 组成的，形成的",
    "n.",
    "1. 选民，选举人 2. 成分，要素 adj. 组成的，形成的"
  ],
  [
    "tem-016",
    73,
    "constitutional",
    "The court ruled that the new law was constitutional.",
    "法院裁定这项新法律符合宪法。",
    2233,
    "constitutional [ˌkɒnstɪˈtjuːʃənəl] adj. 1. 体格的，体质上的 2. 构成的 3. 符合宪法的，宪法所规定的",
    "adj.",
    "1. 体格的，体质上的 2. 构成的 3. 符合宪法的，宪法所规定的"
  ],
  [
    "tem-016",
    75,
    "constraint",
    "Time was the biggest constraint on the project.",
    "时间是这个项目最大的限制。",
    2235,
    "*constraint [kənˈstreɪnt] n. 约束力，束缚，限制，克制",
    "n.",
    "约束力，束缚，限制，克制"
  ],
  [
    "tem-016",
    77,
    "constructive",
    "The teacher gave constructive feedback on my essay.",
    "老师对我的作文提出了建设性的反馈。",
    2238,
    "constructive [kənˈstrʌktɪv] adj. 建设性的，有益的",
    "adj.",
    "建设性的，有益的"
  ],
  [
    "tem-016",
    78,
    "consul",
    "The consul helped the stranded travellers contact their families.",
    "领事帮助滞留的旅客联系家人。",
    2239,
    "consul [ˈkɒnsəl] n. 领事",
    "n.",
    "领事"
  ],
  [
    "tem-016",
    79,
    "consulate",
    "She went to the consulate to apply for a visa.",
    "她前往领事馆申请签证。",
    2240,
    "consulate [ˈkɒnsjʊlɪt] n. 领事馆",
    "n.",
    "领事馆"
  ],
  [
    "tem-016",
    81,
    "consumer",
    "The law protects each consumer from misleading advertising.",
    "这项法律保护每位消费者免受误导性广告侵害。",
    2245,
    "consumer [kənˈsjuːmə] n. 消费者",
    "n.",
    "消费者"
  ],
  [
    "tem-016",
    82,
    "consummate",
    "The pianist gave a consummate performance.",
    "这位钢琴家献上了一场近乎完美的演出。",
    2246,
    "*consummate [kənˈsʌmət] adj. 完全无缺的，完美的",
    "adj.",
    "完全无缺的，完美的"
  ],
  [
    "tem-016",
    83,
    "contagious",
    "The virus is highly contagious, so patients are advised to stay home.",
    "这种病毒传染性很强，因此建议患者待在家中。",
    2249,
    "contagious [kənˈteɪdʒəs] adj. (接触)传染的",
    "adj.",
    "(接触)传染的"
  ],
  [
    "tem-016",
    85,
    "containerization",
    "Containerization made it easier to move goods between ships and trains.",
    "集装箱化让货物在轮船与火车之间转运更加方便。",
    2252,
    "*containerization [kənˌteɪnəraɪˈzeɪʃən] n. 集装箱化",
    "n.",
    "集装箱化"
  ],
  [
    "tem-016",
    87,
    "contemplate",
    "She contemplated moving to another city for work.",
    "她认真考虑过搬到另一座城市工作。",
    2254,
    "*contemplate [ˈkɒntempleɪt] v. 1. 沉思，仔细考虑，意欲 2. 注视，凝视",
    "v.",
    "1. 沉思，仔细考虑，意欲 2. 注视，凝视"
  ],
  [
    "tem-016",
    89,
    "contemptuous",
    "He gave a contemptuous laugh when he heard the suggestion.",
    "听到这个建议，他轻蔑地笑了一声。",
    2257,
    "contemptuous [kənˈtemptʃʊəs] adj. 表示轻蔑的，藐视的",
    "adj.",
    "表示轻蔑的，藐视的"
  ],
  [
    "tem-016",
    93,
    "contented",
    "The cat looked contented as it slept beside the fire.",
    "那只猫在炉火旁睡觉时显得十分满足。",
    2261,
    "contented [kənˈtentɪd] adj. 满意的，知足的",
    "adj.",
    "满意的，知足的"
  ],
  [
    "tem-016",
    94,
    "contention",
    "Her main contention was that the figures were inaccurate.",
    "她的主要论点是这些数字不准确。",
    2262,
    "contention [kənˈtenʃən] n. 1. 争论，争辩，论战 2. 论点，主张",
    "n.",
    "1. 争论，争辩，论战 2. 论点，主张"
  ],
  [
    "tem-016",
    96,
    "contestant",
    "Each contestant had two minutes to answer the question.",
    "每位参赛者都有两分钟回答问题。",
    2264,
    "contestant [kənˈtestənt] n. 竞争者，选手",
    "n.",
    "竞争者，选手"
  ],
  [
    "tem-016",
    97,
    "continental",
    "The train route crosses the continental United States.",
    "这条火车线路横贯美国本土大陆。",
    2267,
    "continental [ˌkɒntɪˈnentəl] adj. 1. 大陆上的，大陆性的 2. 欧洲大陆的",
    "adj.",
    "1. 大陆上的，大陆性的 2. 欧洲大陆的"
  ],
  [
    "tem-016",
    98,
    "contingency",
    "We set aside some money to cover any unexpected contingency.",
    "我们留出一些钱以应对可能发生的意外情况。",
    2268,
    "*contingency [kənˈtɪndʒənsɪ] n. 偶发事件，意料不到的事情",
    "n.",
    "偶发事件，意料不到的事情"
  ],
  [
    "tem-017",
    1,
    "continuity",
    "The new editor worked to maintain continuity between the chapters.",
    "新编辑努力保持各章节之间的连贯性。",
    2273,
    "continuity [kɒntɪˈnjuːətɪ] n. 连贯性，连续性，持续性",
    "n.",
    "连贯性，连续性，持续性"
  ],
  [
    "tem-017",
    3,
    "continuum",
    "The symptoms fall along a continuum from mild to severe.",
    "这些症状从轻微到严重呈连续变化。",
    2275,
    "*continuum [kənˈtɪnjʊəm] n. 连续统一体",
    "n.",
    "连续统一体"
  ],
  [
    "tem-017",
    4,
    "contort",
    "She contorted her face to make the baby laugh.",
    "她把脸扭成怪样子，逗宝宝发笑。",
    2276,
    "*contort  [kənˈtɔːt] v. 扭曲，歪曲",
    "v.",
    "扭曲，歪曲"
  ],
  [
    "tem-017",
    5,
    "contour",
    "The map shows the contours of the surrounding hills.",
    "地图标出了周围山丘的等高线。",
    2277,
    "*contour [ˈkɒntʊə] n. 1. 轮廓，外形，海岸线 2. 等高线，地形线",
    "n.",
    "1. 轮廓，外形，海岸线 2. 等高线，地形线"
  ],
  [
    "tem-017",
    8,
    "contraction",
    "The contraction of the metal left a small gap in the joint.",
    "金属收缩使接合处出现了一条小缝。",
    2281,
    "contraction [kənˈtrækʃən] n. 1. 收缩，缩小 2. 缩略字，缩写词",
    "n.",
    "1. 收缩，缩小 2. 缩略字，缩写词"
  ],
  [
    "tem-017",
    9,
    "contractor",
    "The contractor promised to finish the repairs by Friday.",
    "承包商答应在星期五之前完成维修。",
    2282,
    "contractor [kənˈtræktə] n. 承包商，承建商",
    "n.",
    "承包商，承建商"
  ],
  [
    "tem-017",
    12,
    "contribute",
    "Several neighbours contributed food to the community kitchen.",
    "几位邻居向社区厨房捐赠了食物。",
    2288,
    "contribute [kənˈtrɪbjuːt] v.  1. 捐助，捐赠 2. 投稿  3. 贡献，对…作出贡献",
    "v.",
    "1. 捐助，捐赠 2. 投稿  3. 贡献，对…作出贡献"
  ],
  [
    "tem-017",
    13,
    "contributor",
    "She is a regular contributor to the science magazine.",
    "她经常为这本科学杂志投稿。",
    2290,
    "contributor [kənˈtrɪbjʊtə] n. 投稿者，捐助者",
    "n.",
    "投稿者，捐助者"
  ],
  [
    "tem-017",
    14,
    "contrive",
    "They contrived a way to move the sofa through the narrow doorway.",
    "他们想出了一个办法，把沙发搬过狭窄的门口。",
    2291,
    "*contrive [kənˈtraɪv] v. 发明， 设计，设法做到",
    "v.",
    "发明， 设计，设法做到"
  ],
  [
    "tem-017",
    16,
    "conurbation",
    "The expanding conurbation now links several once-separate towns.",
    "不断扩张的城市群如今把几个原本独立的城镇连在了一起。",
    2295,
    "*conurbation [ˌkɒnɜːˈbeɪʃən] n. 连带卫星城镇和市郊的大都市",
    "n.",
    "连带卫星城镇和市郊的大都市"
  ],
  [
    "tem-017",
    17,
    "convene",
    "The chair will convene a meeting on Monday.",
    "主席将在星期一召集会议。",
    2296,
    "*convene [kənˈviːn] v. 召集会议",
    "v.",
    "召集会议"
  ],
  [
    "tem-017",
    20,
    "converge",
    "Three hiking trails converge near the lake.",
    "三条徒步小径在湖边汇合。",
    2301,
    "*converge [kənˈvɜːdʒ] v. 聚集， 集中一点，汇合",
    "v.",
    "聚集， 集中一点，汇合"
  ]
];
test('TEM-016/017: 57 natural bilingual drafts keep exact input identity and review state',()=>{
 assert.equal(expected.length,57);
 assert.equal(new Set(expected.map(x=>x[0]+'/'+x[1])).size,57);
 for(const taskId of ['tem-016','tem-017']){
  const result=JSON.parse(fs.readFileSync(path.join(root,'docs/model-task-results/worker-A',taskId,'result.json'),'utf8'));
  const task=manifest.files.find(t=>t.task_id===taskId);
  const input=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',task.file),'utf8'));
  assert.equal(result.task_id,taskId);
  assert.equal(result.status,'proposal');
  assert.equal(result.input_sha256,task.sha256);
  assert.equal(result.entries.length,input.entries.length);
  for(let i=0;i<result.entries.length;i++){
   const e=result.entries[i];
   assert.deepEqual(e.identity,input.entries[i].identity,taskId+'/'+i);
   assert.deepEqual(e.original,input.entries[i].current,taskId+'/'+i);
   assert.equal(e.verification,'needs-review',taskId+'/'+i);
   assert.equal(e.external_human_review,false,taskId+'/'+i);
   assert.equal(e.full_dictionary_senses_reviewed,false,taskId+'/'+i);
   assert.deepEqual(e.evidence,[],taskId+'/'+i);
  }
  for(const [id,i,word,en,cn,line,raw,pos,meaning] of expected.filter(x=>x[0]===taskId)){
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
 }
});
