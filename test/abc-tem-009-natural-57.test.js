'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const result=JSON.parse(fs.readFileSync(path.join(root,'docs/model-task-results/worker-A/tem-009/result.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const task=manifest.files.find(t=>t.task_id==='tem-009');
const input=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',task.file),'utf8'));
const expected=[
  [
    0,
    "bloom",
    "The garden was in full bloom by late April.",
    "到了四月底，花园里的花已经盛开。",
    1157,
    "bloom [bluːm] n. 1. 花，开花 2. 青春 3. 香味 v. 1. 开花 2. 繁盛，茂盛",
    "n.",
    "1. 花，开花 2. 青春 3. 香味 v. 1. 开花 2. 繁盛，茂盛"
  ],
  [
    1,
    "blossom",
    "The apple trees were covered in pink blossom.",
    "苹果树开满了粉红色的花。",
    1158,
    "blossom [ˈblɒsəm] n. 花，开花的状态 v. 1. 开花 2. 发展，繁荣，成长",
    "n.",
    "花，开花的状态 v. 1. 开花 2. 发展，繁荣，成长"
  ],
  [
    2,
    "blot",
    "A dark blot of ink spoiled the last page.",
    "一大块墨渍弄脏了最后一页。",
    1159,
    "blot [blɒt] n. 1. 墨渍，污渍  2. 瑕疵，(品格、名誉等上的)污点  v. 1. 弄上墨渍，弄上污渍 2. (用吸墨水纸等)吸干 3. 玷辱(名誉等)",
    "n.",
    "1. 墨渍，污渍  2. 瑕疵，(品格、名誉等上的)污点  v. 1. 弄上墨渍，弄上污渍 2. (用吸墨水纸等)吸干 3. 玷辱(名誉等)"
  ],
  [
    3,
    "blotter",
    "She pressed the blotter onto the wet ink.",
    "她用吸墨纸吸干未干的墨水。",
    1160,
    "*blotter [ˈblɒtə] n. 吸墨纸簿，(大张)吸墨纸",
    "n.",
    "吸墨纸簿，(大张)吸墨纸"
  ],
  [
    6,
    "blueprint",
    "The architect unrolled the blueprint on the table.",
    "建筑师把蓝图铺开在桌上。",
    1165,
    "blueprint [ˈbluːprɪnt] n. 蓝图",
    "n.",
    "蓝图"
  ],
  [
    7,
    "blues",
    "She learned to play the blues on an old guitar.",
    "她学会了用一把旧吉他弹布鲁斯音乐。",
    1166,
    "*blues [bluːz] n. 布鲁斯音乐(歌曲)",
    "n.",
    "布鲁斯音乐(歌曲)"
  ],
  [
    10,
    "blunder",
    "Leaving the gate open was a costly blunder.",
    "忘记关大门是个代价高昂的错误。",
    1169,
    "*blunder [ˈblʌndə] n. 错误 v. 弄错，犯大错",
    "n.",
    "错误 v. 弄错，犯大错"
  ],
  [
    11,
    "blunt",
    "The blunt knife could not cut the tomatoes cleanly.",
    "这把钝刀没法利落地切开西红柿。",
    1170,
    "blunt [blʌnt] adj. 1. 钝的，不锋利的 2. (举止言谈等)生硬的，直率的，不拐弯抹角的 3. (感觉、理解方面)迟钝的 v. 把…弄钝，把…弄迟钝",
    "adj.",
    "1. 钝的，不锋利的 2. (举止言谈等)生硬的，直率的，不拐弯抹角的 3. (感觉、理解方面)迟钝的 v. 把…弄钝，把…弄迟钝"
  ],
  [
    12,
    "blur",
    "The passing cars became a blur in the rain.",
    "雨中驶过的汽车变成了一片模糊的影子。",
    1171,
    "*blur [blɜː] n. 模糊不清的事物 v. 使模糊，使看不清楚",
    "n.",
    "模糊不清的事物 v. 使模糊，使看不清楚"
  ],
  [
    13,
    "blurb",
    "The blurb on the back cover made me want to read the novel.",
    "封底的内容简介让我想读这本小说。",
    1172,
    "*blurb [blɜːb] n. (介绍书籍内容的)简要说明",
    "n.",
    "(介绍书籍内容的)简要说明"
  ],
  [
    14,
    "blurt",
    "He blurted out the answer before anyone else could speak.",
    "还没等别人开口，他就脱口说出了答案。",
    1173,
    "*blurt [blɜːt] v. 不假思索地脱口说出",
    "v.",
    "不假思索地脱口说出"
  ],
  [
    15,
    "blush",
    "A sudden blush spread across her cheeks when he praised her.",
    "受到他的夸奖时，她的双颊突然泛起红晕。",
    1174,
    "blush [blʌʃ] n. 脸红 v. 感到羞愧",
    "n.",
    "脸红 v. 感到羞愧"
  ],
  [
    16,
    "boardroom",
    "The directors gathered in the boardroom to review the budget.",
    "董事们在董事会会议室开会审议预算。",
    1176,
    "boardroom [ˈbɔːdruːm] n. (公司董事会的)会议室",
    "n.",
    "(公司董事会的)会议室"
  ],
  [
    18,
    "bodily",
    "The helmet helps protect riders from bodily injury.",
    "头盔有助于保护骑行者免受身体伤害。",
    1180,
    "bodily [ˈbɒdɪlɪ] adj. 1. 身体的，肉体的 2. 有实体的 adv. 整个儿地，全部地，全体地",
    "adj.",
    "1. 身体的，肉体的 2. 有实体的 adv. 整个儿地，全部地，全体地"
  ],
  [
    19,
    "bodyguard",
    "The singer's bodyguard kept the crowd at a safe distance.",
    "歌手的保镖让人群保持安全距离。",
    1182,
    "bodyguard [ˈbɒdɪɡɑːd] n. 卫士，卫队",
    "n.",
    "卫士，卫队"
  ],
  [
    20,
    "bog",
    "The hikers carefully crossed the narrow path through the bog.",
    "徒步者小心地沿着穿过沼泽的狭窄小路行走。",
    1183,
    "*bog [bɒɡ] n. 沼泽，泥塘，沼泽地区 v. (使)陷入泥沼",
    "n.",
    "沼泽，泥塘，沼泽地区 v. (使)陷入泥沼"
  ],
  [
    21,
    "boggle",
    "He boggled at the thought of crossing the icy river alone.",
    "一想到要独自穿过结冰的河流，他就犹豫不前。",
    1184,
    "*boggle [ˈbɒɡl] v. 畏缩不前，犹豫",
    "v.",
    "畏缩不前，犹豫"
  ],
  [
    22,
    "bogus",
    "The email demanded payment through a bogus website.",
    "这封邮件要求收件人通过一个假冒网站付款。",
    1185,
    "*bogus [ˈbəʊɡəs] adj. 假的，假冒的，伪造的",
    "adj.",
    "假的，假冒的，伪造的"
  ],
  [
    23,
    "boiler",
    "The old boiler stopped heating the water.",
    "旧锅炉不再加热水了。",
    1187,
    "boiler [ˈbɔɪlə] n. 锅炉，煮水器",
    "n.",
    "锅炉，煮水器"
  ],
  [
    24,
    "boisterous",
    "The boisterous children raced through the playground.",
    "喧闹的孩子们在操场上跑来跑去。",
    1188,
    "*boisterous [ˈbɔɪstərəs] adj. 喧闹的，狂暴的",
    "adj.",
    "喧闹的，狂暴的"
  ],
  [
    26,
    "boldness",
    "Her boldness in speaking up changed the team's decision.",
    "她敢于直言，改变了团队的决定。",
    1190,
    "boldness [ˈbəʊldnəs] n. 1. 大胆，勇敢 2. 冒失",
    "n.",
    "1. 大胆，勇敢 2. 冒失"
  ],
  [
    27,
    "bolt",
    "He tightened the loose bolt on the bicycle frame.",
    "他拧紧了自行车车架上松动的螺栓。",
    1191,
    "bolt [bəʊlt] n. 1. 门栓 2. 螺栓 3. 电光，闪电",
    "n.",
    "1. 门栓 2. 螺栓 3. 电光，闪电"
  ],
  [
    28,
    "bombard",
    "During the siege, enemy forces bombarded the city.",
    "围城期间，敌军炮轰了这座城市。",
    1193,
    "*bombard [bɒmˈbɑːd] v. 炮轰，轰击",
    "v.",
    "炮轰，轰击"
  ],
  [
    29,
    "bomber",
    "The museum displays a restored bomber from the Second World War.",
    "博物馆展出了一架修复后的二战轰炸机。",
    1194,
    "bomber [ˈbɒmə] n. 轰炸机",
    "n.",
    "轰炸机"
  ],
  [
    30,
    "bombshell",
    "The announcement that the factory would close came as a bombshell.",
    "工厂即将关闭的消息令人震惊。",
    1195,
    "*bombshell [ˈbɒmʃel] n. 1. 炸弹 2. 引起震惊的人(事)",
    "n.",
    "1. 炸弹 2. 引起震惊的人(事)"
  ],
  [
    31,
    "bona fide",
    "The inspector confirmed that the certificate was bona fide.",
    "检查员确认这份证书是真实有效的。",
    1196,
    "*bona fide [ˌbəʊnə ˈfaɪdɪ] adj. 真正的，真实的，真诚的",
    "adj.",
    "真正的，真实的，真诚的"
  ],
  [
    32,
    "bondage",
    "The novel describes people struggling to escape bondage.",
    "这部小说描写了人们为摆脱奴役而进行的斗争。",
    1198,
    "bondage [ˈbɒndɪdʒ] n. 奴役，束缚",
    "n.",
    "奴役，束缚"
  ],
  [
    33,
    "bonfire",
    "We warmed our hands beside the bonfire on the beach.",
    "我们在海滩上的篝火旁暖手。",
    1200,
    "*bonfire [ˈbɒnfaɪə] n. 野火，营火",
    "n.",
    "野火，营火"
  ],
  [
    34,
    "bonnet",
    "She opened the car's bonnet to check the engine.",
    "她打开汽车的发动机舱盖检查发动机。",
    1201,
    "*bonnet [ˈbɒnɪt] n. 1. 女帽，童帽 2. (机动车辆的)发动机器罩盖  v. 给…戴帽子",
    "n.",
    "1. 女帽，童帽 2. (机动车辆的)发动机器罩盖  v. 给…戴帽子"
  ],
  [
    35,
    "bony",
    "The stray dog's bony ribs showed beneath its thin coat.",
    "这只流浪狗皮毛稀薄，瘦得肋骨清晰可见。",
    1203,
    "bony [ˈbəʊnɪ] adj. 1. 骨的 2. 多骨的 3. 瘦的，憔悴的",
    "adj.",
    "1. 骨的 2. 多骨的 3. 瘦的，憔悴的"
  ],
  [
    36,
    "boo",
    "A loud boo rose from the crowd after the unfair call.",
    "裁判作出不公正的判罚后，人群中响起一阵响亮的嘘声。",
    1204,
    "*boo [buː] n. 喝倒彩，嘘声  v. 发出嘘声，向…喝倒彩",
    "n.",
    "喝倒彩，嘘声  v. 发出嘘声，向…喝倒彩"
  ],
  [
    37,
    "booby trap",
    "The soldiers found a booby trap hidden near the doorway.",
    "士兵们在门口附近发现了一个隐蔽的陷阱。",
    1205,
    "*booby trap [ˈbuːbɪ træp] n. 1. (为吓唬某人而设的)陷阱，恶作剧的把戏 2. 伪装地雷，饵雷",
    "n.",
    "1. (为吓唬某人而设的)陷阱，恶作剧的把戏 2. 伪装地雷，饵雷"
  ],
  [
    38,
    "bookcase",
    "The old bookcase was full of travel guides.",
    "旧书柜里摆满了旅行指南。",
    1207,
    "bookcase [ˈbʊk-keɪs] n. 书橱，书柜",
    "n.",
    "书橱，书柜"
  ],
  [
    39,
    "bookish",
    "His bookish daughter preferred libraries to noisy parties.",
    "他爱读书的女儿更喜欢图书馆，而不是喧闹的聚会。",
    1208,
    "bookish [ˈbʊkɪʃ] adj. 1. 爱读书的，好学的 2. 书生气的",
    "adj.",
    "1. 爱读书的，好学的 2. 书生气的"
  ],
  [
    40,
    "bookkeeping",
    "Accurate bookkeeping helps the shop track its expenses.",
    "准确记账有助于商店掌握各项开支。",
    1209,
    "bookkeeping [ˈbʊkˌkiːpɪŋ] n. 簿记",
    "n.",
    "簿记"
  ],
  [
    49,
    "boon",
    "The new bridge has been a boon to local farmers.",
    "这座新桥给当地农民带来了很大便利。",
    1219,
    "*boon [buːn] n. 恩赐，恩惠",
    "n.",
    "恩赐，恩惠"
  ],
  [
    51,
    "bootleg",
    "For years, the gang bootlegged whisky across the border.",
    "多年来，这个团伙一直非法跨境贩运威士忌。",
    1223,
    "*bootleg [ˈbuːtleɡ] v. 非法制造、运送、销售(酒类)",
    "v.",
    "非法制造、运送、销售(酒类)"
  ],
  [
    52,
    "booze",
    "He used to booze every night before he sought help.",
    "寻求帮助之前，他过去每晚都酗酒。",
    1224,
    "*booze [buːz] v. 痛饮，狂饮酒 n. 酒，酒宴",
    "v.",
    "痛饮，狂饮酒 n. 酒，酒宴"
  ],
  [
    53,
    "borderline",
    "The test result was borderline, so the doctor recommended another test.",
    "检测结果处于临界状态，因此医生建议再检查一次。",
    1226,
    "borderline[ˈbɔːdəlaɪn] adj. 两可的，不确定 n. 界线，国界",
    "adj.",
    "两可的，不确定 n. 界线，国界"
  ],
  [
    56,
    "boredom",
    "She took up painting to relieve the boredom of her long commute.",
    "她开始画画，以缓解漫长通勤带来的无聊感。",
    1230,
    "boredom [ˈbɔːdəm] n. 厌烦，厌倦，无趣味",
    "n.",
    "厌烦，厌倦，无趣味"
  ],
  [
    60,
    "borough",
    "The council oversees services across the borough.",
    "市镇议会负责管理整个自治市镇的公共服务。",
    1234,
    "borough [ˈbʌrə] n. 1. 享有自治权的市镇 2. (BrE)自治市镇",
    "n.",
    "1. 享有自治权的市镇 2. (BrE)自治市镇"
  ],
  [
    62,
    "bossy",
    "His bossy manner made it hard for others to contribute.",
    "他总爱对人发号施令，让其他人很难发表意见。",
    1238,
    "bossy [ˈbɒsɪ] adj. 爱发号施令的，作威作福的",
    "adj.",
    "爱发号施令的，作威作福的"
  ],
  [
    63,
    "botanist",
    "The botanist identified the plant by examining its leaves.",
    "植物学家通过观察叶片辨认出了这种植物。",
    1240,
    "botanist [ˈbɒtənɪst] n. 植物学家",
    "n.",
    "植物学家"
  ],
  [
    64,
    "botany",
    "She chose to study botany after volunteering in the garden.",
    "在花园做过志愿者后，她决定学习植物学。",
    1241,
    "botany [ˈbɒtənɪ] n. 植物学",
    "n.",
    "植物学"
  ],
  [
    65,
    "bottleneck",
    "A narrow bridge created a bottleneck during rush hour.",
    "一座狭窄的桥在高峰时段造成了交通瓶颈。",
    1245,
    "bottleneck [ˈbɒtlnek] n. 1. 瓶颈 2. 阻碍进展的事物(状况) 3. 窄路段，交通阻塞点",
    "n.",
    "1. 瓶颈 2. 阻碍进展的事物(状况) 3. 窄路段，交通阻塞点"
  ],
  [
    67,
    "boulevard",
    "Tall trees lined the boulevard through the city centre.",
    "高大的树木排列在穿过市中心的林荫大道两旁。",
    1248,
    "boulevard [ˈbuːləvɑːd] n. 1. 大街，林阴大道 2. 主干道路，大道",
    "n.",
    "1. 大街，林阴大道 2. 主干道路，大道"
  ],
  [
    71,
    "boundless",
    "The children showed boundless curiosity about the stars.",
    "孩子们对星星表现出无穷的好奇心。",
    1254,
    "boundless [ˈbaʊndlɪs] adj. 无边际的， 无限的",
    "adj.",
    "无边际的， 无限的"
  ],
  [
    73,
    "bounty",
    "The town offered a bounty for information about the missing painting.",
    "镇上悬赏征集失踪画作的线索。",
    1256,
    "*bounty [ˈbaʊntɪ] n. 1. 慷慨的赠与物，奖金，赏金 2. 慷慨，大方",
    "n.",
    "1. 慷慨的赠与物，奖金，赏金 2. 慷慨，大方"
  ],
  [
    74,
    "bouquet",
    "He brought a bouquet of flowers to the hospital.",
    "他带了一束花到医院。",
    1257,
    "bouquet [bəʊkeɪ] n. 花束",
    "n.",
    "花束"
  ],
  [
    77,
    "bout",
    "She suffered a brief bout of fever after the trip.",
    "旅行结束后，她短暂地发了一阵烧。",
    1260,
    "*bout [baʊt] n. 1. 一回，一次，一阵 2. 拳击 3. 摔跤比赛",
    "n.",
    "1. 一回，一次，一阵 2. 拳击 3. 摔跤比赛"
  ],
  [
    82,
    "bowels",
    "The miners worked deep in the bowels of the mountain.",
    "矿工们在大山深处作业。",
    1265,
    "bowels [ˈbaʊəlz] n. 1. 肠，肠道 2. 内部，深处",
    "n.",
    "1. 肠，肠道 2. 内部，深处"
  ],
  [
    90,
    "boycott",
    "Several students called for a boycott of the company's products.",
    "几名学生呼吁抵制这家公司的产品。",
    1276,
    "boycott [ˈbɔɪkɒt] v. &n. (联合)抵制",
    "v.&n.",
    "(联合)抵制"
  ],
  [
    92,
    "brace",
    "A metal brace supports the damaged shelf.",
    "一个金属支架支撑着受损的搁板。",
    1279,
    "*brace [breɪs] n. 1. 支柱，支架 2. 一双，一对 3. 大括号{}的前半或后 4. (pl BrE)(裤子)背带=(AmE) suspenders v. 1. 拉紧，系紧 2. 支住，撑牢  3. 激励，振奋  4. 打起精神，下定决心",
    "n.",
    "1. 支柱，支架 2. 一双，一对 3. 大括号{}的前半或后 4. (pl BrE)(裤子)背带=(AmE) suspenders v. 1. 拉紧，系紧 2. 支住，撑牢  3. 激励，振奋  4. 打起精神，下定决心"
  ],
  [
    95,
    "brag",
    "He likes to brag about his exam results.",
    "他喜欢吹嘘自己的考试成绩。",
    1282,
    "brag [bræɡ] v. &n. 夸张，吹牛",
    "v.&n.",
    "夸张，吹牛"
  ],
  [
    97,
    "braille",
    "The lift buttons are labelled in braille.",
    "电梯按钮上标有盲文。",
    1284,
    "*braille [breɪl] n. 盲文",
    "n.",
    "盲文"
  ],
  [
    98,
    "brainless",
    "Leaving the door unlocked all night was a brainless mistake.",
    "整晚不锁门是个愚蠢的错误。",
    1286,
    "brainless [ˈbreɪnləs] adj. 笨的，没头脑的",
    "adj.",
    "笨的，没头脑的"
  ],
  [
    99,
    "brainstorming",
    "The team used brainstorming to generate ideas for the new app.",
    "团队通过头脑风暴为新应用集思广益。",
    1287,
    "brainstorming [ˈbreɪnstɔːmɪŋ] n. 献计献策，合力攻关",
    "n.",
    "献计献策，合力攻关"
  ]
];
test('TEM-009 57 source-locked bilingual editorial drafts',()=>{
 assert.equal(result.task_id,'tem-009');
 assert.equal(result.status,'proposal');
 assert.equal(result.input_sha256,task.sha256);
 assert.equal(result.entries.length,input.entries.length);
 assert.equal(expected.length,57);
 assert.equal(new Set(expected.map(x=>x[0])).size,57);
 for(const [i,word,en,cn,line,raw,pos,meaning] of expected){
  const e=result.entries[i];
  assert.equal(e.identity.word,word);
  assert.equal(e.identity.source_line,line);
  assert.equal(e.identity.source_raw,raw);
  assert.deepEqual(e.identity,input.entries[i].identity);
  assert.deepEqual(e.original,input.entries[i].current);
  assert.equal(e.selected_sense.pos,pos);
  assert.equal(e.selected_sense.meaning,meaning);
  assert.equal(e.proposed.example,en);
  assert.equal(e.proposed.example_translation,cn);
  assert.equal(e.draft_method,'editorial-context-rewrite-needs-review');
  assert.equal(e.verification,'needs-review');
  assert.equal(e.external_human_review,false);
  assert.equal(e.full_dictionary_senses_reviewed,false);
  assert.deepEqual(e.evidence,[]);
  assert.ok(en.endsWith('.')&&cn.endsWith('。'));
  assert.deepEqual(rules.filter(r=>r.pattern.test(r.id==='translation-metalinguistic'?cn:en)).map(r=>r.id),[],word);
 }
});
