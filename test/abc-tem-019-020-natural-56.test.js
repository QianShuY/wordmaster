'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const expected={
  "019": [
    [
      40,
      "Czar",
      "The Czar issued a decree that changed the empire's tax laws.",
      "沙皇颁布了一道改变帝国税法的法令。",
      2593,
      "Czar  [zɑː] n. 俄国沙皇(= Tsar)",
      "n.",
      "俄国沙皇(= Tsar)"
    ],
    [
      43,
      "Dacron",
      "The yacht's sails were made from strong Dacron fabric.",
      "游艇的帆由结实的涤纶布制成。",
      2596,
      "*Dacron [ˈdækrɒn] n. 涤纶，的确良",
      "n.",
      "涤纶，的确良"
    ],
    [
      54,
      "damned",
      "That damned printer jammed again just before the deadline.",
      "那台该死的打印机偏偏在截止时间前又卡纸了。",
      2610,
      "damned [dæmd] adj. 打入地狱的，该死的，糟糕的，讨厌的 adv. (infml)非常",
      "adj.",
      "打入地狱的，该死的，糟糕的，讨厌的 adv. (infml)非常"
    ],
    [
      57,
      "dampen",
      "The sudden rain dampened the crowd's enthusiasm.",
      "突如其来的雨浇灭了人群的热情。",
      2613,
      "*dampen [ˈdæmpən] v. 1. 使潮湿 2. 使减弱，抑制",
      "v.",
      "1. 使潮湿 2. 使减弱，抑制"
    ],
    [
      58,
      "damper",
      "The technician adjusted the damper to reduce airflow through the vent.",
      "技术员调节了风门，以减少通风口的气流。",
      2614,
      "*damper [ˈdæmpə] n. 气门，气闸",
      "n.",
      "气门，气闸"
    ],
    [
      59,
      "damsel",
      "In the old tale, a young damsel finds her way out of the forest.",
      "在这个古老故事里，一位年轻少女找到了走出森林的路。",
      2615,
      "*damsel [ˈdæmzl] n. 未婚少女",
      "n.",
      "未婚少女"
    ],
    [
      60,
      "dancer",
      "The dancer practised her steps before the performance.",
      "舞蹈演员在演出前练习舞步。",
      2617,
      "dancer [ˈdɑːnsə] n. 跳舞者，舞蹈演员，舞女",
      "n.",
      "跳舞者，舞蹈演员，舞女"
    ],
    [
      61,
      "dandelion",
      "A yellow dandelion grew between the pavement stones.",
      "一朵黄色的蒲公英从人行道的石缝里长出来。",
      2618,
      "*dandelion [ˈdændɪlaɪən] n. 蒲公英",
      "n.",
      "蒲公英"
    ],
    [
      64,
      "dangle",
      "A small bell dangled from the dog's collar.",
      "狗的项圈上垂挂着一只小铃铛。",
      2623,
      "*dangle [ˈdæŋɡl] v. (使)悬荡，(使)悬垂",
      "v.",
      "(使)悬荡，(使)悬垂"
    ],
    [
      65,
      "dank",
      "The cellar was dank and smelled of mould.",
      "地窖阴冷潮湿，散发着霉味。",
      2624,
      "*dank [dæŋk] adj. 阴湿的，湿冷的",
      "adj.",
      "阴湿的，湿冷的"
    ],
    [
      66,
      "Danish",
      "She studied Danish before moving to Copenhagen.",
      "搬去哥本哈根前，她学习了丹麦语。",
      2625,
      "Danish [ˈdeɪnɪʃ] adj. 丹麦的，丹麦人的，丹麦语的 n. 丹麦人，丹麦语",
      "adj.",
      "丹麦的，丹麦人的，丹麦语的 n. 丹麦人，丹麦语"
    ],
    [
      67,
      "dapper",
      "He arrived at the wedding in a dapper grey suit.",
      "他穿着一套整洁笔挺的灰色西装出席婚礼。",
      2626,
      "*dapper [ˈdæpə] adj. 衣着整洁的",
      "adj.",
      "衣着整洁的"
    ],
    [
      68,
      "dappled",
      "Sunlight fell through the leaves onto the dappled path.",
      "阳光穿过树叶，洒在斑驳的小路上。",
      2627,
      "*dappled [ˈdæpld] adj. 有斑点的，斑驳的",
      "adj.",
      "有斑点的，斑驳的"
    ],
    [
      70,
      "daredevil",
      "The daredevil jumped his motorcycle over a row of parked cars.",
      "那个胆大妄为的人骑摩托车飞跃一排停放的汽车。",
      2629,
      "daredevil[ˈdeədevəl] n. 鲁莽大胆的人，冒失鬼",
      "n.",
      "鲁莽大胆的人，冒失鬼"
    ],
    [
      71,
      "daring",
      "Her daring rescue of the trapped climber saved his life.",
      "她大胆救出了受困的登山者，挽救了他的生命。",
      2630,
      "daring [ˈdeərɪŋ] n. 大胆，勇敢 adj. 大胆的，勇敢的，震惊的",
      "n.",
      "大胆，勇敢 adj. 大胆的，勇敢的，震惊的"
    ],
    [
      72,
      "darken",
      "Storm clouds began to darken the afternoon sky.",
      "乌云开始让午后的天空暗下来。",
      2632,
      "darken [ˈdɑːkən] v. 使变暗，使变黑，使变深",
      "v.",
      "使变暗，使变黑，使变深"
    ],
    [
      73,
      "darkness",
      "The hikers waited in darkness until the sun rose.",
      "徒步者在黑暗中等待日出。",
      2633,
      "darkness [ˈdɑːknəs] n. 1. 黑暗，阴暗 2. 无知，愚昧 3. 邪恶",
      "n.",
      "1. 黑暗，阴暗 2. 无知，愚昧 3. 邪恶"
    ],
    [
      75,
      "darn",
      "She darned a hole in her woollen sock.",
      "她织补了羊毛袜上的一个破洞。",
      2635,
      "*darn [dɑːn] v. .织补 n. 织补处",
      "v.",
      ".织补 n. 织补处"
    ],
    [
      76,
      "dart",
      "A dart struck the board just below the bullseye.",
      "一支飞镖扎在靶心正下方。",
      2636,
      "dart [dɑːt] n. 飞镖 v. 猛冲，投掷，发射",
      "n.",
      "飞镖 v. 猛冲，投掷，发射"
    ],
    [
      77,
      "dash",
      "He dashed across the street to catch the last bus.",
      "他飞奔穿过马路，赶最后一班公交车。",
      2637,
      "dash [dæʃ] v. 1. 猛冲，猛掷 2. 砸碎 n. 1. 飞奔，短跑 2. 少许 3. 破折号",
      "v.",
      "1. 猛冲，猛掷 2. 砸碎 n. 1. 飞奔，短跑 2. 少许 3. 破折号"
    ],
    [
      80,
      "dated",
      "The hotel's dated furniture had not been replaced for decades.",
      "酒店那些过时的家具几十年都没有更换过。",
      2642,
      "*dated [ˈdeɪtɪd] adj. 旧式的，过时的",
      "adj.",
      "旧式的，过时的"
    ],
    [
      81,
      "daughter-in-law",
      "Her daughter-in-law brought flowers to the family dinner.",
      "她的儿媳妇带着鲜花来参加家庭晚餐。",
      2644,
      "daughter-in-law [ˈdɔːtər ɪn lɔː] n. 儿媳妇",
      "n.",
      "儿媳妇"
    ],
    [
      82,
      "daunt",
      "The steep climb did not daunt the experienced hikers.",
      "陡峭的山路没有吓退经验丰富的徒步者。",
      2645,
      "*daunt [dɔːnt] v. 使胆怯，使畏缩",
      "v.",
      "使胆怯，使畏缩"
    ],
    [
      83,
      "dauntless",
      "The dauntless firefighters entered the burning building.",
      "勇敢无畏的消防员进入了着火的大楼。",
      2646,
      "*dauntless [ˈdɔːntlɪs] adj. 无所畏惧的，勇敢的",
      "adj.",
      "无所畏惧的，勇敢的"
    ],
    [
      84,
      "dawdle",
      "Stop dawdling, or we'll miss the train.",
      "别磨蹭了，不然我们会赶不上火车。",
      2647,
      "*dawdle [ˈdɔːdl] v. 闲荡，耽误，偷懒",
      "v.",
      "闲荡，耽误，偷懒"
    ],
    [
      85,
      "daybreak",
      "The fishing boats left the harbour at daybreak.",
      "渔船在黎明时分驶离港口。",
      2650,
      "daybreak [ˈdeɪbreɪk] n. 黎明，破晓",
      "n.",
      "黎明，破晓"
    ],
    [
      86,
      "daydream",
      "He often daydreamed about travelling around the world.",
      "他经常幻想着环游世界。",
      2651,
      "daydream [ˈdeɪdriːm] v. & n. (做)白日梦，幻想，空想",
      "v.&n.",
      "(做)白日梦，幻想，空想"
    ],
    [
      89,
      "daze",
      "The sudden blow dazed the boxer for a few seconds.",
      "突如其来的一击让拳击手晕眩了几秒钟。",
      2654,
      "daze [deɪz] v. 1. 使发昏，使茫然 2. 使眼花缭乱，使惊奇  n. 迷乱，恍惚",
      "v.",
      "1. 使发昏，使茫然 2. 使眼花缭乱，使惊奇  n. 迷乱，恍惚"
    ],
    [
      90,
      "dazzle",
      "The stage lights dazzled the audience as the curtain rose.",
      "幕布升起时，舞台灯光晃得观众睁不开眼。",
      2655,
      "dazzle [ˈdæzl] v. 1. 使眼花，耀眼 2. 使惊奇，使倾倒 n. 闪耀，耀眼",
      "v.",
      "1. 使眼花，耀眼 2. 使惊奇，使倾倒 n. 闪耀，耀眼"
    ],
    [
      91,
      "deacon",
      "The deacon helped organise meals for families in need.",
      "教会执事帮忙为有需要的家庭安排餐食。",
      2656,
      "*deacon [ˈdiːkən] n. 教会中的执事",
      "n.",
      "教会中的执事"
    ],
    [
      92,
      "deaden",
      "Thick carpets helped deaden the sound of footsteps.",
      "厚地毯有助于减轻脚步声。",
      2658,
      "*deaden [ˈdedən] v. 减轻力量(强度),减缓…的感觉，使钝",
      "v.",
      "减轻力量(强度),减缓…的感觉，使钝"
    ],
    [
      98,
      "dealing",
      "The company promised fair dealing with all its suppliers.",
      "公司承诺公平对待所有供应商。",
      2668,
      "dealing [ˈdiːlɪŋ] n. 1. 分发  2. 对待 3. 交易，来往",
      "n.",
      "1. 分发  2. 对待 3. 交易，来往"
    ]
  ],
  "020": [
    [
      0,
      "deathly",
      "A deathly silence fell over the room after the announcement.",
      "消息宣布后，房间里陷入死一般的寂静。",
      2672,
      "deathly [ˈdeθlɪ] adj. 致死的，致命的，死一般的 adv. 死一般地，极其，非常",
      "adj.",
      "致死的，致命的，死一般的 adv. 死一般地，极其，非常"
    ],
    [
      1,
      "debacle",
      "The team's defeat in the final was a complete debacle.",
      "球队在决赛中的失利堪称一场惨败。",
      2673,
      "*debacle [deɪˈbɑːkl] n. 崩溃，大败",
      "n.",
      "崩溃，大败"
    ],
    [
      2,
      "debase",
      "The ruler debased the coinage by mixing cheaper metals into the silver.",
      "统治者在银币中掺入廉价金属，使币值下降。",
      2674,
      "*debase [dɪˈbeɪs] v. 使贬值，降低…的身份，贬低",
      "v.",
      "使贬值，降低…的身份，贬低"
    ],
    [
      3,
      "debate",
      "The candidates debated the new housing policy on television.",
      "候选人在电视上就新的住房政策展开辩论。",
      2675,
      "debate [dɪˈbeɪt] v. 1. 辩论，讨论 2. 考虑，盘算 n. 辩论，争论，辩论比赛",
      "v.",
      "1. 辩论，讨论 2. 考虑，盘算 n. 辩论，争论，辩论比赛"
    ],
    [
      4,
      "debilitate",
      "The long illness debilitated him for several months.",
      "长期患病使他虚弱了好几个月。",
      2676,
      "*debilitate [dɪˈbɪlɪteɪt] v. 使衰弱(虚弱)",
      "v.",
      "使衰弱(虚弱)"
    ],
    [
      5,
      "debit",
      "The accountant recorded the payment as a debit.",
      "会计把这笔付款记在借方。",
      2677,
      "*debit [ˈdebɪt] n. (账簿中的)收方，借方  v. 把…记入借方",
      "n.",
      "(账簿中的)收方，借方  v. 把…记入借方"
    ],
    [
      6,
      "debris",
      "Rescue workers cleared debris from the damaged road.",
      "救援人员清除了受损道路上的碎石瓦砾。",
      2678,
      "*debris [ˈdeɪbriː] n. 残骸，废墟，破瓦残砾",
      "n.",
      "残骸，废墟，破瓦残砾"
    ],
    [
      7,
      "debtor",
      "The debtor agreed to repay the loan in monthly instalments.",
      "债务人同意按月分期偿还贷款。",
      2680,
      "debtor [ˈdetə] n. 债务人",
      "n.",
      "债务人"
    ],
    [
      8,
      "debug",
      "The programmer spent the afternoon debugging the software.",
      "程序员花了一下午时间调试软件，排除错误。",
      2681,
      "*debug [ˌdiːˈbʌɡ] v. 1. 拆除窃听器 2. 消除(电脑程序中的)错误",
      "v.",
      "1. 拆除窃听器 2. 消除(电脑程序中的)错误"
    ],
    [
      9,
      "debut",
      "The singer made her debut at a small theatre in London.",
      "这名歌手在伦敦一家小剧院首次登台演出。",
      2682,
      "debut [ˈdeɪbjuː] n. 初次登台，初次公开露面",
      "n.",
      "初次登台，初次公开露面"
    ],
    [
      10,
      "decadent",
      "The novel portrays the decadent lifestyle of the wealthy elite.",
      "小说描绘了富裕精英阶层奢靡颓废的生活方式。",
      2684,
      "*decadent [ˈdekədənt] adj. 颓废的，衰落的，堕落的",
      "adj.",
      "颓废的，衰落的，堕落的"
    ],
    [
      11,
      "decay",
      "The wooden beams began to decay in the damp cellar.",
      "木梁在潮湿的地窖里开始腐烂。",
      2685,
      "decay [dɪˈkeɪ] v. 1. 使腐败，使腐烂 2. 使衰弱，使衰退  n. 1. 腐烂，腐朽 2. 衰退，衰败",
      "v.",
      "1. 使腐败，使腐烂 2. 使衰弱，使衰退  n. 1. 腐烂，腐朽 2. 衰退，衰败"
    ],
    [
      13,
      "deceased",
      "The lawyer contacted the deceased man's family.",
      "律师联系了那位已故男子的家人。",
      2687,
      "deceased [dɪˈsiːst] adj. 去世的 n. 死者",
      "adj.",
      "去世的 n. 死者"
    ],
    [
      15,
      "deceitful",
      "The deceitful salesman hid the car's accident history.",
      "那名不诚实的销售员隐瞒了汽车的事故记录。",
      2689,
      "deceitful [dɪˈsiːtfəl] adj. 欺诈的，不诚实的",
      "adj.",
      "欺诈的，不诚实的"
    ],
    [
      17,
      "decelerate",
      "The train began to decelerate as it approached the station.",
      "火车接近车站时开始减速。",
      2691,
      "*decelerate [ˌdiːˈseləreɪt] v. (使)减速，减缓",
      "v.",
      "(使)减速，减缓"
    ],
    [
      20,
      "deception",
      "The fraud relied on deception to obtain customers' passwords.",
      "这起诈骗靠欺骗手段获取客户的密码。",
      2695,
      "deception [dɪˈsepʃən] n. 欺骗，诡计，骗局",
      "n.",
      "欺骗，诡计，骗局"
    ],
    [
      21,
      "deceptive",
      "The advertisement's simple wording was deceptive.",
      "广告看似简单的措辞具有误导性。",
      2696,
      "deceptive [dɪˈseptɪv] adj. 欺骗的，虚假的，容易使人上当的",
      "adj.",
      "欺骗的，虚假的，容易使人上当的"
    ],
    [
      22,
      "decibel",
      "The noise level reached ninety decibels near the machinery.",
      "机器附近的噪声达到了九十分贝。",
      2697,
      "decibel [ˈdesɪbel] n. 分贝",
      "n.",
      "分贝"
    ],
    [
      24,
      "decimal",
      "Write the answer as a decimal rather than a fraction.",
      "请把答案写成小数，而不是分数。",
      2700,
      "decimal [ˈdesɪml] n. 小数，十进小数 adj. 小数的，十进位的",
      "n.",
      "小数，十进小数 adj. 小数的，十进位的"
    ],
    [
      25,
      "decimate",
      "The disease decimated the village's livestock.",
      "这场疾病使村里的牲畜大批死亡。",
      2701,
      "*decimate [ˈdesɪmeɪt] v. 大批杀死，毁掉…的大部分",
      "v.",
      "大批杀死，毁掉…的大部分"
    ],
    [
      26,
      "decipher",
      "The analyst deciphered the coded message before dawn.",
      "分析员在天亮前破译了加密信息。",
      2702,
      "*decipher [dɪˈsaɪfə] v. 译解(密码)，解开(疑团)",
      "v.",
      "译解(密码)，解开(疑团)"
    ],
    [
      30,
      "deckhand",
      "A deckhand secured the ropes before the boat left the dock.",
      "一名甲板水手在船离开码头前系牢了缆绳。",
      2707,
      "*deckhand [ˈdekhænd] n. 在甲板上工作的海员，水手",
      "n.",
      "在甲板上工作的海员，水手"
    ],
    [
      31,
      "declaim",
      "The actor stood on stage and declaimed a passage from the play.",
      "演员站在舞台上高声朗诵了剧中的一段台词。",
      2708,
      "*declaim [dɪˈkleɪm] v. 高声朗诵，慷慨陈词，大声辩说",
      "v.",
      "高声朗诵，慷慨陈词，大声辩说"
    ],
    [
      33,
      "decode",
      "The receiver decoded the radio signal into readable text.",
      "接收器将无线电信号解码成可读的文字。",
      2712,
      "decode [ˌdiːˈkəʊd] v. 译解(密码)",
      "v.",
      "译解(密码)"
    ]
  ]
};
test('TEM-019/020 56 new bilingual drafts remain source-locked and unapproved',()=>{
 let total=0;
 for(const [batch,rows] of Object.entries(expected)){
  const taskId='tem-'+batch;
  const task=manifest.files.find(x=>x.task_id===taskId);
  assert.ok(task,taskId);
  const result=JSON.parse(fs.readFileSync(path.join(root,'docs/model-task-results/worker-A',taskId,'result.json'),'utf8'));
  const input=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',task.file),'utf8'));
  assert.equal(result.task_id,taskId);
  assert.equal(result.status,'proposal');
  assert.equal(result.input_sha256,task.sha256);
  assert.equal(result.entries.length,input.entries.length);
  assert.equal(new Set(rows.map(r=>r[0])).size,rows.length);
  for(let i=0;i<result.entries.length;i++){
   const e=result.entries[i];
   assert.deepEqual(e.identity,input.entries[i].identity);
   assert.deepEqual(e.original,input.entries[i].current);
   assert.equal(e.verification,'needs-review');
   assert.equal(e.external_human_review,false);
   assert.equal(e.full_dictionary_senses_reviewed,false);
   assert.deepEqual(e.evidence,[]);
  }
  for(const [i,word,en,cn,line,raw,pos,meaning] of rows){
   const e=result.entries[i];
   assert.equal(e.identity.word,word);
   assert.equal(e.identity.source_line,line);
   assert.equal(e.identity.source_raw,raw);
   assert.equal(e.selected_sense.pos,pos);
   assert.equal(e.selected_sense.meaning,meaning);
   assert.equal(e.proposed.example,en);
   assert.equal(e.proposed.example_translation,cn);
   assert.equal(e.draft_method,'editorial-context-rewrite-needs-review');
   assert.ok(en.endsWith('.')&&cn.endsWith('。'),word);
   assert.deepEqual(rules.filter(r=>r.pattern.test(r.id==='translation-metalinguistic'?cn:en)).map(r=>r.id),[],word);
   total++;
  }
 }
 assert.equal(total,56);
});
