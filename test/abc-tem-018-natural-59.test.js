'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const task=manifest.files.find(x=>x.task_id==='tem-018');
const result=JSON.parse(fs.readFileSync(path.join(root,'docs/model-task-results/worker-A/tem-018/result.json'),'utf8'));
const input=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',task.file),'utf8'));
const expected=[
  [
    0,
    "courtship",
    "Their courtship lasted two years before they decided to marry.",
    "两人交往了两年，之后决定结婚。",
    2413,
    "*courtship [ˈkɔːtʃɪp] n. 求爱，求婚",
    "n.",
    "求爱，求婚"
  ],
  [
    2,
    "covenant",
    "The two communities signed a covenant to protect the river.",
    "两个社区签署了一份保护河流的协议。",
    2416,
    "*covenant [ˈkʌvənənt] n. 契约，盟约",
    "n.",
    "契约，盟约"
  ],
  [
    3,
    "covert",
    "The journalists uncovered a covert operation to monitor the activists.",
    "记者揭露了一项秘密监视活动人士的行动。",
    2419,
    "*covert [ˈkʌvət] adj. 秘密的，隐秘的，暗地的",
    "adj.",
    "秘密的，隐秘的，暗地的"
  ],
  [
    4,
    "covet",
    "He secretly coveted his neighbour's antique watch.",
    "他暗中觊觎邻居的古董手表。",
    2420,
    "*covet [ˈkʌvɪt] v. 垂涎，觊觎，贪图",
    "v.",
    "垂涎，觊觎，贪图"
  ],
  [
    8,
    "cowardice",
    "She later regretted her cowardice in refusing to defend her friend.",
    "她后来后悔自己当时胆怯，没有为朋友挺身而出。",
    2424,
    "*cowardice [ˈkaʊədɪs] n. 胆小，怯懦",
    "n.",
    "胆小，怯懦"
  ],
  [
    9,
    "cowardly",
    "Leaving his teammates behind was a cowardly act.",
    "丢下队友不管是一种懦弱的行为。",
    2425,
    "cowardly [ˈkaʊədlɪ] adj. 怯懦的，胆小的",
    "adj.",
    "怯懦的，胆小的"
  ],
  [
    10,
    "cowboy",
    "The cowboy rode across the ranch to check on the cattle.",
    "牛仔骑马穿过牧场查看牛群。",
    2426,
    "cowboy [ˈkaʊbɔɪ] n. 牧童，牛仔",
    "n.",
    "牧童，牛仔"
  ],
  [
    11,
    "coy",
    "She gave a coy smile when asked about the surprise.",
    "被问到那个惊喜时，她露出了羞涩的微笑。",
    2427,
    "*coy [kɔɪ] adj. 害羞的，腼腆的，忸怩的",
    "adj.",
    "害羞的，腼腆的，忸怩的"
  ],
  [
    13,
    "crack",
    "A sudden frost caused the water pipe to crack.",
    "突如其来的霜冻使水管裂开了。",
    2429,
    "crack [kræk] v. 1. (使)裂开，(使)破裂 2. (使)发出噼啪声 3. 撬开，砸开 4. (嗓子)变粗 || crack down镇压，取缔，扫荡 5. 解开(密码)等 n. 1. 裂缝，裂口 2. 爆裂声，轰隆 3. 猛烈的一击 4. (嗓子)突然失声，变粗",
    "v.",
    "1. (使)裂开，(使)破裂 2. (使)发出噼啪声 3. 撬开，砸开 4. (嗓子)变粗 || crack down镇压，取缔，扫荡 5. 解开(密码)等 n. 1. 裂缝，裂口 2. 爆裂声，轰隆 3. 猛烈的一击 4. (嗓子)突然失声，变粗"
  ],
  [
    15,
    "crackle",
    "Dry logs crackled in the fireplace.",
    "干木柴在壁炉里噼啪作响。",
    2431,
    "*crackle [ˈkrækl] v. 发轻微的爆裂声(如干柴燃烧时的响声)，发噼啪声",
    "v.",
    "发轻微的爆裂声(如干柴燃烧时的响声)，发噼啪声"
  ],
  [
    16,
    "cradle",
    "The baby slept peacefully in a wooden cradle.",
    "婴儿安静地睡在木摇篮里。",
    2432,
    "cradle [ˈkreɪdl] n. 1. 摇篮  2. 策源地，发源地",
    "n.",
    "1. 摇篮  2. 策源地，发源地"
  ],
  [
    17,
    "craftsman",
    "The craftsman carved the chair by hand.",
    "工匠亲手雕刻了这把椅子。",
    2434,
    "craftsman [ˈkrɑːftsmən] (pl craftsmen) n. 工匠，手艺精巧的人",
    "n.",
    "工匠，手艺精巧的人"
  ],
  [
    18,
    "crafty",
    "The crafty fox slipped past the farm dogs.",
    "狡猾的狐狸悄悄绕过农场的狗。",
    2435,
    "crafty [ˈkrɑːftɪ] adj. 狡猾的，狡诈的",
    "adj.",
    "狡猾的，狡诈的"
  ],
  [
    19,
    "crag",
    "An eagle nested on a high crag above the valley.",
    "一只鹰在山谷上方的高耸峭壁上筑巢。",
    2436,
    "crag [kræɡ] n. 悬崖，峭壁",
    "n.",
    "悬崖，峭壁"
  ],
  [
    20,
    "cram",
    "She crammed all her clothes into a small suitcase.",
    "她把所有衣服硬塞进一个小行李箱。",
    2437,
    "*cram [kræm] v. 1. 把…塞进，把…塞满(装满)，挤满 2. 临时死记硬背记功课",
    "v.",
    "1. 把…塞进，把…塞满(装满)，挤满 2. 临时死记硬背记功课"
  ],
  [
    21,
    "cramp",
    "A sudden cramp in his calf forced him to stop running.",
    "小腿突然抽筋迫使他停下跑步。",
    2438,
    "*cramp [kræmp] n. 痉挛  v. 1. 使痉挛 2. 束缚，约束，妨碍发育、发展 3. 妨碍某人充分发挥才能",
    "n.",
    "痉挛  v. 1. 使痉挛 2. 束缚，约束，妨碍发育、发展 3. 妨碍某人充分发挥才能"
  ],
  [
    23,
    "cranky",
    "The old engine was cranky and often refused to start.",
    "这台老发动机不太可靠，经常发动不起来。",
    2440,
    "*cranky [ˈkræŋkɪ] adj. 1. 古怪的人、念头 2. (指机器等)靠不住的，摇晃的，不稳的 3. 脾气坏的",
    "adj.",
    "1. 古怪的人、念头 2. (指机器等)靠不住的，摇晃的，不稳的 3. 脾气坏的"
  ],
  [
    25,
    "crate",
    "Workers packed the glass bottles into a wooden crate.",
    "工人把玻璃瓶装进一个木板条箱。",
    2443,
    "crate [kreɪt] n. 柳条箱，木(板条)箱",
    "n.",
    "柳条箱，木(板条)箱"
  ],
  [
    26,
    "crater",
    "Steam rose from the crater of the volcano.",
    "蒸汽从火山口升起。",
    2444,
    "*crater [ˈkreɪtə] n. 1. 火山口 2. 弹坑",
    "n.",
    "1. 火山口 2. 弹坑"
  ],
  [
    27,
    "crave",
    "After the long hike, they craved a hot meal.",
    "长途徒步后，他们特别渴望吃上一顿热饭。",
    2445,
    "*crave [kreɪv] v. 热望，渴望",
    "v.",
    "热望，渴望"
  ],
  [
    28,
    "craven",
    "His craven retreat left the others to face the danger alone.",
    "他胆怯地退缩了，留下其他人独自面对危险。",
    2446,
    "*craven [ˈkreɪvən] adj. 怯懦的，胆小的",
    "adj.",
    "怯懦的，胆小的"
  ],
  [
    30,
    "crayon",
    "The child drew a rainbow with coloured crayons.",
    "孩子用彩色蜡笔画了一道彩虹。",
    2448,
    "crayon [ˈkreɪən] n. 彩色蜡笔(粉笔)",
    "n.",
    "彩色蜡笔(粉笔)"
  ],
  [
    31,
    "craze",
    "The dance craze spread quickly through the school.",
    "这股舞蹈热潮很快席卷了校园。",
    2449,
    "craze [kreɪz] n. 时尚，时髦的东西，狂热",
    "n.",
    "时尚，时髦的东西，狂热"
  ],
  [
    32,
    "creak",
    "The old wooden stairs creaked under his feet.",
    "老木楼梯在他脚下吱呀作响。",
    2451,
    "*creak [kriːk] v. &n. 吱吱作响，吱吱声",
    "v.&n.",
    "吱吱作响，吱吱声"
  ],
  [
    33,
    "creamy",
    "The soup had a rich, creamy texture.",
    "这汤口感浓郁绵滑，像奶油一样。",
    2453,
    "creamy [ˈkriːmɪ] adj. 1. 乳脂状的 2. 多乳脂的",
    "adj.",
    "1. 乳脂状的 2. 多乳脂的"
  ],
  [
    34,
    "crease",
    "A deep crease ran down the centre of his folded shirt.",
    "他折叠的衬衫中央有一道深深的折痕。",
    2454,
    "*crease [kriːs] n. 1. 折痕，皱褶，皱纹 2. (球赛场地上划的)界线 v. (使)起折痕，(使)起皱",
    "n.",
    "1. 折痕，皱褶，皱纹 2. (球赛场地上划的)界线 v. (使)起折痕，(使)起皱"
  ],
  [
    35,
    "creation",
    "The sculpture was her latest creation.",
    "这座雕塑是她最新的作品。",
    2456,
    "creation [kriːˈeɪʃən] n. 1. 创造，创作 2. 作品",
    "n.",
    "1. 创造，创作 2. 作品"
  ],
  [
    36,
    "creativity",
    "The workshop encouraged creativity through open-ended projects.",
    "工作坊通过开放式项目激发创造力。",
    2458,
    "creativity [ˌkriːeɪˈtɪvətɪ] n. 创造力，创造",
    "n.",
    "创造力，创造"
  ],
  [
    38,
    "credentials",
    "The guard checked her credentials before allowing her inside.",
    "保安核验了她的证件后才允许她进入。",
    2461,
    "*credentials [krɪˈdenʃəlz] n. 1. 资格证书，国书 2. (个人能力及信用的)证明书，证件",
    "n.",
    "1. 资格证书，国书 2. (个人能力及信用的)证明书，证件"
  ],
  [
    39,
    "credibility",
    "The false figures damaged the report's credibility.",
    "虚假的数据损害了这份报告的可信度。",
    2462,
    "*credibility [ˌkredɪˈbɪlɪtɪ] n. 可靠性，可信性",
    "n.",
    "可靠性，可信性"
  ],
  [
    40,
    "credible",
    "The witness gave a credible account of what happened.",
    "证人对事情经过作出了可信的陈述。",
    2463,
    "credible [ˈkredəbl] adj. 可信的，可靠的",
    "adj.",
    "可信的，可靠的"
  ],
  [
    41,
    "creditor",
    "The company negotiated a repayment plan with its largest creditor.",
    "公司与最大的债权人协商了还款计划。",
    2465,
    "creditor [ˈkredɪtə] n. 债权人，债主",
    "n.",
    "债权人，债主"
  ],
  [
    42,
    "credulous",
    "Credulous buyers believed the seller's impossible promises.",
    "轻信的买家相信了卖家那些不可能兑现的承诺。",
    2466,
    "credulous [ˈkredjʊləs] adj. 轻信的，易受骗的",
    "adj.",
    "轻信的，易受骗的"
  ],
  [
    43,
    "creed",
    "The church's creed emphasises compassion and service.",
    "教会的信条强调慈悲与服务。",
    2467,
    "creed [kriːd] n. (宗教)信条，教义",
    "n.",
    "(宗教)信条，教义"
  ],
  [
    44,
    "creek",
    "We followed the creek until it reached the lake.",
    "我们沿着小溪走，直到它汇入湖泊。",
    2468,
    "creek [kriːk] n. 小溪，小河",
    "n.",
    "小溪，小河"
  ],
  [
    45,
    "creep",
    "The cat crept silently towards the sleeping bird.",
    "猫悄无声息地向熟睡的鸟靠近。",
    2469,
    "creep [kriːp] v. 1. 爬行 2. 蹑手蹑脚地走，悄悄地走",
    "v.",
    "1. 爬行 2. 蹑手蹑脚地走，悄悄地走"
  ],
  [
    47,
    "crematorium",
    "The family gathered outside the crematorium after the service.",
    "告别仪式结束后，家人聚集在火葬场外。",
    2471,
    "*crematorium [ˌkreməˈtɔːrɪəm] n. 火葬场",
    "n.",
    "火葬场"
  ],
  [
    49,
    "crescent",
    "A thin crescent hung above the dark hills.",
    "一弯细细的新月挂在昏暗的群山上方。",
    2473,
    "*crescent [ˈkresnt] n. 1. 新月，弯月，上、下弦月 2. 新月形的物体(如新月形的街道)",
    "n.",
    "1. 新月，弯月，上、下弦月 2. 新月形的物体(如新月形的街道)"
  ],
  [
    50,
    "crest",
    "Snow covered the crest of the mountain.",
    "积雪覆盖着山顶。",
    2474,
    "crest [krest] n. 1. 鸟冠，鸡冠，冠毛 2. (头盔上的)羽饰，翎毛 3. 山顶，顶点，顶峰 4. (信纸等上面的)纹章，饰章",
    "n.",
    "1. 鸟冠，鸡冠，冠毛 2. (头盔上的)羽饰，翎毛 3. 山顶，顶点，顶峰 4. (信纸等上面的)纹章，饰章"
  ],
  [
    54,
    "criminal",
    "The police opened a criminal investigation into the fraud.",
    "警方对这起欺诈案展开了刑事调查。",
    2480,
    "criminal [ˈkrɪmɪnl] adj. 犯罪的，刑事的 n. 罪犯，犯人",
    "adj.",
    "犯罪的，刑事的 n. 罪犯，犯人"
  ],
  [
    55,
    "crimson",
    "The autumn leaves turned a deep crimson.",
    "秋叶变成了深红色。",
    2481,
    "crimson [ˈkrɪmzn] n. 深红，绯红 adj. 深红色的，绯红色的 v. (使)变绯红色",
    "n.",
    "深红，绯红 adj. 深红色的，绯红色的 v. (使)变绯红色"
  ],
  [
    56,
    "cringe",
    "He cringed when the door slammed behind him.",
    "身后的门砰地关上时，他吓得缩了一下。",
    2482,
    "*cringe [krɪndʒ] v. 1. 畏缩，退缩 2. 奉承，卑躬屈膝",
    "v.",
    "1. 畏缩，退缩 2. 奉承，卑躬屈膝"
  ],
  [
    57,
    "crinkle",
    "The thin paper crinkled when she squeezed it.",
    "她一捏，薄纸就皱了起来。",
    2483,
    "*crinkle [ˈkrɪŋkl] n. 皱纹 v. (使)起皱",
    "n.",
    "皱纹 v. (使)起皱"
  ],
  [
    62,
    "critique",
    "Her critique of the novel appeared in the literary journal.",
    "她对这部小说的评论文章发表在文学期刊上。",
    2492,
    "*critique [krɪˈtiːk] n. 评论性文章(书籍)，评论",
    "n.",
    "评论性文章(书籍)，评论"
  ],
  [
    63,
    "croak",
    "Frogs croaked beside the pond after sunset.",
    "日落后，青蛙在池塘边呱呱叫。",
    2493,
    "*croak [krəʊk] v. &n. 1. (作)蛙鸣声，(发出)哑声 2. 用低沉沙哑的声音说话",
    "v.&n.",
    "1. (作)蛙鸣声，(发出)哑声 2. 用低沉沙哑的声音说话"
  ],
  [
    64,
    "crockery",
    "The waiter carried the clean crockery back to the kitchen.",
    "服务员把洗净的碗碟端回厨房。",
    2494,
    "*crockery [ˈkrɒkərɪ] n. (杯、碟等)瓦器，陶器",
    "n.",
    "(杯、碟等)瓦器，陶器"
  ],
  [
    65,
    "crocodile",
    "A crocodile lay motionless on the riverbank.",
    "一条鳄鱼一动不动地趴在河岸上。",
    2495,
    "crocodile [ˈkrɒkədaɪl] n. 1. 鳄鱼，鳄鱼皮 2. 双列队行进的学童",
    "n.",
    "1. 鳄鱼，鳄鱼皮 2. 双列队行进的学童"
  ],
  [
    66,
    "crook",
    "The crook fled when he heard the alarm.",
    "那个贼听见警报后逃跑了。",
    2496,
    "*crook [krʊk] n. 1. 小偷，贼，坏蛋 2. 弯曲(处)",
    "n.",
    "1. 小偷，贼，坏蛋 2. 弯曲(处)"
  ],
  [
    67,
    "crooked",
    "The old picture hung crooked on the wall.",
    "旧画歪歪斜斜地挂在墙上。",
    2497,
    "*crooked [ˈkrʊkɪd] adj. 1. 弯曲的，扭曲的 2. 不诚实的，行为不端的",
    "adj.",
    "1. 弯曲的，扭曲的 2. 不诚实的，行为不端的"
  ],
  [
    68,
    "cross",
    "We crossed the river by a narrow wooden bridge.",
    "我们通过一座狭窄的木桥过了河。",
    2499,
    "cross [krɒs] n. 1. 十字形、叉形记号、十字架等 2. 杂交，杂种 v. 1. 越过，穿过，渡过  2. 交叉，相交 || cross out划掉",
    "n.",
    "1. 十字形、叉形记号、十字架等 2. 杂交，杂种 v. 1. 越过，穿过，渡过  2. 交叉，相交 || cross out划掉"
  ],
  [
    70,
    "crosscheck",
    "The accountant crosschecked the totals against the receipts.",
    "会计把总额与收据逐项核对。",
    2501,
    "crosscheck [ˈkrɒstʃek] v. 反复核对、查证",
    "v.",
    "反复核对、查证"
  ],
  [
    71,
    "cross-examine",
    "The defence lawyer cross-examined the witness about the timeline.",
    "辩护律师就时间线对证人进行了交叉询问。",
    2502,
    "*cross-examine [ˌkrɒs ɪɡˈzæmɪn] v. 1. (用于法律)严诘，盘问(某人) 2. 追问，详询(某人)",
    "v.",
    "1. (用于法律)严诘，盘问(某人) 2. 追问，详询(某人)"
  ],
  [
    72,
    "crossing",
    "The bridge provides a safe crossing over the stream.",
    "这座桥提供了一条安全跨越溪流的通道。",
    2503,
    "crossing [ˈkrɒsɪŋ] n. 1. 横渡，横穿 2. 交叉，交叉点，十字路口 3. 渡口",
    "n.",
    "1. 横渡，横穿 2. 交叉，交叉点，十字路口 3. 渡口"
  ],
  [
    73,
    "crossroads",
    "Turn left at the crossroads after the petrol station.",
    "经过加油站后的十字路口左转。",
    2504,
    "crossroads [ˈkrɒsrəʊdz] n. 十字路口",
    "n.",
    "十字路口"
  ],
  [
    74,
    "crossword",
    "She solves a crossword every morning with her coffee.",
    "她每天早上喝咖啡时都会做一道填字游戏。",
    2505,
    "crossword [ˈkrɒswɜːd] n. 纵横字谜，填字游戏",
    "n.",
    "纵横字谜，填字游戏"
  ],
  [
    76,
    "crouch",
    "He lowered himself into a crouch behind the wall.",
    "他蹲伏在墙后。",
    2507,
    "crouch [kraʊtʃ] n. 蹲伏，蜷缩，屈(膝)，(低)头",
    "n.",
    "蹲伏，蜷缩，屈(膝)，(低)头"
  ],
  [
    77,
    "crow",
    "A crow perched on the fence and called loudly.",
    "一只乌鸦停在篱笆上大声鸣叫。",
    2508,
    "crow [krəʊ] n. 1. 鸦，乌鸦 2. 鸡啼 v. 1. (雄鸡)啼 2. 吹嘘，得意洋洋",
    "n.",
    "1. 鸦，乌鸦 2. 鸡啼 v. 1. (雄鸡)啼 2. 吹嘘，得意洋洋"
  ],
  [
    81,
    "cruelty",
    "The shelter reported several cases of cruelty to animals.",
    "收容所报告了几起虐待动物事件。",
    2515,
    "cruelty [ˈkrʊəltɪ] n. 1. 残忍，残酷 2. (pl)残酷的行为",
    "n.",
    "1. 残忍，残酷 2. (pl)残酷的行为"
  ],
  [
    82,
    "cruise",
    "The ship cruised slowly along the coast.",
    "轮船沿着海岸缓缓巡航。",
    2516,
    "cruise [kruːz] v. 1. 巡航，游弋 2. 旅行，漫游",
    "v.",
    "1. 巡航，游弋 2. 旅行，漫游"
  ]
];
test('TEM-018 59 bilingual contextual drafts are source-locked',()=>{
 assert.equal(result.task_id,'tem-018');
 assert.equal(result.status,'proposal');
 assert.equal(result.input_sha256,'db5f0e0b3f043774b1eb930858d6e2522836db948291fc4ecf73101e7d0cd6e7');
 assert.equal(result.input_sha256,task.sha256);
 assert.equal(result.entries.length,input.entries.length);
 assert.equal(expected.length,59);
 assert.equal(new Set(expected.map(x=>x[0])).size,59);
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
