'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const expected={
  "020": [
    [
      34,
      "decompose",
      "Fallen leaves decompose slowly in cold weather.",
      "落叶在寒冷天气里分解得很慢。",
      2713,
      "*decompose [ˌdiːkəmˈpəʊz] v. 1. 使变坏，腐烂 2. 分解",
      "v.",
      "1. 使变坏，腐烂 2. 分解"
    ],
    [
      35,
      "decor",
      "The café's simple decor made the small room feel welcoming.",
      "咖啡馆简洁的装潢让狭小的空间显得温馨。",
      2714,
      "*decor [ˈdeɪkɔː] n. (房间、舞台等的)布置(装饰)，陈设",
      "n.",
      "(房间、舞台等的)布置(装饰)，陈设"
    ],
    [
      36,
      "decoration",
      "She hung a paper decoration above the doorway.",
      "她在门口上方挂了一件纸制装饰品。",
      2716,
      "decoration [ˌdekəˈreɪʃən] n. 装饰，装饰品，装潢",
      "n.",
      "装饰，装饰品，装潢"
    ],
    [
      37,
      "decorative",
      "Decorative tiles framed the old fireplace.",
      "装饰瓷砖镶在旧壁炉的四周。",
      2717,
      "decorative [ˈdekərətɪv] adj. 美观的，装饰的",
      "adj.",
      "美观的，装饰的"
    ],
    [
      38,
      "decorous",
      "The guests remained decorous throughout the solemn ceremony.",
      "在庄严的仪式中，宾客始终举止得体。",
      2718,
      "*decorous [ˈdekərəs] adj. 得体的，合宜的",
      "adj.",
      "得体的，合宜的"
    ],
    [
      39,
      "decorum",
      "The chair asked everyone to maintain decorum during the debate.",
      "主持人要求大家在辩论中保持礼仪。",
      2719,
      "*decorum [dɪˈkɔːrəm] n. 礼节，得体，稳重",
      "n.",
      "礼节，得体，稳重"
    ],
    [
      40,
      "decoy",
      "The police placed a decoy bag on the bench to catch the thief.",
      "警方在长椅上放了一个诱饵包，以抓获小偷。",
      2720,
      "*decoy [ˈdiːkɔɪ] n. 用作诱饵的人(物)  v. 用诱饵诱骗，使落入圈套",
      "n.",
      "用作诱饵的人(物)  v. 用诱饵诱骗，使落入圈套"
    ],
    [
      41,
      "decree",
      "The government issued a decree restricting fishing in the bay.",
      "政府颁布法令，限制在海湾捕鱼。",
      2722,
      "decree [dɪˈkriː] n. 命令，法令，判决 v. 命令，颁布命令，判定",
      "n.",
      "命令，法令，判决 v. 命令，颁布命令，判定"
    ],
    [
      43,
      "deduce",
      "From the muddy footprints, she deduced that someone had entered through the garden.",
      "她根据泥泞的脚印推断，有人从花园进来了。",
      2725,
      "deduce [dɪˈdjuːs] v. 推论，演绎",
      "v.",
      "推论，演绎"
    ],
    [
      45,
      "deductible",
      "Travel expenses may be deductible when they are directly related to work.",
      "与工作直接相关的差旅费用可能可以税前扣除。",
      2727,
      "*deductible [dɪˈdʌktəbl] adj. 可扣除的",
      "adj.",
      "可扣除的"
    ],
    [
      46,
      "deduction",
      "Her deduction followed logically from the evidence.",
      "她的推论是根据证据合乎逻辑地得出的。",
      2728,
      "deduction [dɪˈdʌkʃən] n. 1. 推论，演绎 2. 扣除(额)，减去",
      "n.",
      "1. 推论，演绎 2. 扣除(额)，减去"
    ],
    [
      50,
      "deeply",
      "The audience was deeply moved by her speech.",
      "观众被她的演讲深深打动。",
      2733,
      "deeply [ˈdiːplɪ] adv. 深深地",
      "adv.",
      "深深地"
    ],
    [
      51,
      "deface",
      "Someone had defaced the statue with spray paint.",
      "有人用喷漆污损了雕像。",
      2735,
      "*deface [dɪˈfeɪs] v. 损坏…的表面(外观)，磨损",
      "v.",
      "损坏…的表面(外观)，磨损"
    ],
    [
      52,
      "defame",
      "The false article sought to defame the scientist.",
      "那篇虚假文章企图诋毁这位科学家。",
      2736,
      "*defame [dɪˈfeɪm] v. 诽谤，中伤",
      "v.",
      "诽谤，中伤"
    ],
    [
      53,
      "default",
      "The borrower went into default after missing several loan payments.",
      "借款人连续几次未按时还款后陷入违约状态。",
      2737,
      "default [dɪˈfɔːlt] n. 1. 违约，缺席，拖欠 2. (电脑的)预设，预置(值) v. 不履行，不到场，未付(债等)",
      "n.",
      "1. 违约，缺席，拖欠 2. (电脑的)预设，预置(值) v. 不履行，不到场，未付(债等)"
    ],
    [
      56,
      "defendant",
      "The defendant pleaded not guilty at the hearing.",
      "被告在听证会上表示不认罪。",
      2743,
      "defendant [dɪˈfendənt] n. 被告",
      "n.",
      "被告"
    ],
    [
      57,
      "defender",
      "The defender blocked the shot just before it reached the goal.",
      "后卫在球射向球门前将其挡下。",
      2744,
      "defender [dɪˈfendə] n. 防御者，保卫者，辩护人",
      "n.",
      "防御者，保卫者，辩护人"
    ],
    [
      58,
      "defensible",
      "The committee reached a defensible decision based on the available evidence.",
      "委员会根据现有证据作出了有理有据的决定。",
      2745,
      "defensible [dɪˈfensəbl] adj. 可防御的，能辩护的",
      "adj.",
      "可防御的，能辩护的"
    ],
    [
      59,
      "defensive",
      "The soldiers took up defensive positions along the river.",
      "士兵们沿河布置了防御阵地。",
      2746,
      "defensive [dɪˈfensɪv] adj. 1. 防御性的 2. 自卫的，时刻防备的",
      "adj.",
      "1. 防御性的 2. 自卫的，时刻防备的"
    ],
    [
      60,
      "defer",
      "The council decided to defer the vote until next week.",
      "委员会决定将投票推迟到下周。",
      2747,
      "*defer [dɪˈfɜː] v. 延缓，拖延 || defer to遵从，听从",
      "v.",
      "延缓，拖延 || defer to遵从，听从"
    ],
    [
      61,
      "defiance",
      "In an act of defiance, she refused to obey the unjust order.",
      "她公然违抗，拒绝服从那道不公正的命令。",
      2748,
      "defiance [dɪˈfaɪəns] n. 违抗，蔑视，挑战",
      "n.",
      "违抗，蔑视，挑战"
    ],
    [
      62,
      "defiant",
      "The child gave a defiant look but said nothing.",
      "孩子投来倔强的目光，却一言不发。",
      2749,
      "defiant[dɪˈfaɪənt] adj. 违抗的，藐视的，蔑视的",
      "adj.",
      "违抗的，藐视的，蔑视的"
    ],
    [
      64,
      "deficient",
      "The report found the building's fire precautions deficient.",
      "报告指出，这栋建筑的消防预防措施存在不足。",
      2751,
      "deficient [dɪˈfɪʃənt] adj. 有缺陷的，缺乏的，不足的",
      "adj.",
      "有缺陷的，缺乏的，不足的"
    ],
    [
      69,
      "definitive",
      "The archive contains the definitive account of the expedition.",
      "档案馆收藏着关于那次探险的权威记述。",
      2759,
      "*definitive [dɪˈfɪnətɪv] adj. 1. 确定的，有权威的，不能(不必)改变的 2. 决定性的",
      "adj.",
      "1. 确定的，有权威的，不能(不必)改变的 2. 决定性的"
    ],
    [
      70,
      "deflate",
      "He pressed the valve to deflate the inflatable boat.",
      "他按下阀门，给充气船放气。",
      2760,
      "*deflate [dɪˈfleɪt] v. 1. 放掉(轮胎等)的气，缩小 2. 泄气  3. 紧缩(通货)",
      "v.",
      "1. 放掉(轮胎等)的气，缩小 2. 泄气  3. 紧缩(通货)"
    ],
    [
      71,
      "deflect",
      "The shield deflected the falling debris away from the workers.",
      "防护板使坠落的碎片偏离了工人所在的位置。",
      2761,
      "deflect [dɪˈflekt] v. (使)偏斜，转向",
      "v.",
      "(使)偏斜，转向"
    ],
    [
      72,
      "defoliate",
      "A severe pest outbreak can defoliate entire trees.",
      "严重的虫害可能使整棵树的叶子掉光。",
      2762,
      "*defoliate [ˌdiːˈfəʊlɪeɪt] v. 毁掉(树木、花草的)叶",
      "v.",
      "毁掉(树木、花草的)叶"
    ],
    [
      73,
      "deform",
      "Excessive heat can deform the plastic casing.",
      "过高的温度会使塑料外壳变形。",
      2763,
      "*deform [dɪˈfɔːm] v. 毁坏…的外形，使成畸形",
      "v.",
      "毁坏…的外形，使成畸形"
    ],
    [
      74,
      "defraud",
      "The accountant was accused of trying to defraud the charity.",
      "这名会计被指控企图诈骗该慈善机构。",
      2764,
      "*defraud [dɪˈfrɔːd] v. 诈取，诈骗",
      "v.",
      "诈取，诈骗"
    ],
    [
      75,
      "defrost",
      "Defrost the frozen fish in the refrigerator overnight.",
      "将冷冻鱼放在冰箱冷藏室里过夜解冻。",
      2765,
      "*defrost [ˌdiːˈfrɒst] v. 使解冻，给(冰箱等)除霜",
      "v.",
      "使解冻，给(冰箱等)除霜"
    ],
    [
      76,
      "deft",
      "With a deft movement, the tailor threaded the needle.",
      "裁缝动作灵巧，一下就把线穿进了针眼。",
      2766,
      "*deft [deft] adj. 灵巧的，熟练的，机敏的",
      "adj.",
      "灵巧的，熟练的，机敏的"
    ],
    [
      77,
      "defunct",
      "The factory has stood empty since the company became defunct.",
      "自公司停止运营以来，工厂一直空置。",
      2767,
      "*defunct [dɪˈfʌŋkt] adj. 死的，已废止的",
      "adj.",
      "死的，已废止的"
    ],
    [
      78,
      "defuse",
      "Her calm reply helped defuse the argument.",
      "她平静的回应帮助缓和了争执。",
      2768,
      "*defuse [ˌdiːˈfjuːz] v. 1. 拆除(炸弹等的)信管 2. 缓和，平息，消除危险",
      "v.",
      "1. 拆除(炸弹等的)信管 2. 缓和，平息，消除危险"
    ],
    [
      79,
      "defy",
      "The villagers defied the order to abandon their homes.",
      "村民们违抗了要求他们离开家园的命令。",
      2769,
      "defy [dɪˈfaɪ] v. 1. 违抗，蔑视 2. 激(某人)做",
      "v.",
      "1. 违抗，蔑视 2. 激(某人)做"
    ],
    [
      81,
      "degrade",
      "The insult was intended to degrade the workers.",
      "那句侮辱性的话意在贬低工人。",
      2771,
      "*degrade [dɪˈɡreɪd] v. 1. 使降级，降低，2. 有辱…的人格，使丢脸",
      "v.",
      "1. 使降级，降低，2. 有辱…的人格，使丢脸"
    ],
    [
      82,
      "dehydrate",
      "Long hours in the sun can dehydrate hikers quickly.",
      "长时间暴晒会使徒步者很快脱水。",
      2773,
      "*dehydrate [ˌdiːˈhaɪdreɪ] v. (使)脱水，除去…的水分",
      "v.",
      "(使)脱水，除去…的水分"
    ],
    [
      83,
      "deify",
      "Some followers began to deify the leader after his death.",
      "一些追随者在领袖去世后开始将他神化。",
      2774,
      "*deify [ˈdiːɪfaɪ] v. 把…神化，把…奉若神明",
      "v.",
      "把…神化，把…奉若神明"
    ],
    [
      84,
      "deity",
      "The temple was dedicated to a local deity.",
      "这座寺庙供奉着当地的一位神祇。",
      2775,
      "*deity [ˈdiːɪtɪ] n. 神，女神",
      "n.",
      "神，女神"
    ],
    [
      85,
      "delay",
      "Heavy snow delayed the morning train.",
      "大雪使早班列车晚点。",
      2776,
      "delay [dɪˈleɪ] v. &n. 耽搁，延迟，延期",
      "v.&n.",
      "耽搁，延迟，延期"
    ],
    [
      86,
      "delegate",
      "Each district sent a delegate to the annual meeting.",
      "每个区都派出一名代表参加年会。",
      2777,
      "delegate [ˈdelɪɡət] n. 代表，代表团团员 [ˈdelɪɡeɪt] v. 授权，委托，委派…为代表",
      "n.",
      "代表，代表团团员 [ˈdelɪɡeɪt] v. 授权，委托，委派…为代表"
    ],
    [
      88,
      "deli",
      "She bought a sandwich from the deli across the street.",
      "她在街对面的熟食店买了一个三明治。",
      2780,
      "deli [ˈdelɪ] n. (AmE)(infml)熟食(店)",
      "n.",
      "(AmE)(infml)熟食(店)"
    ],
    [
      91,
      "deliberately",
      "He deliberately left the door ajar so the cat could come in.",
      "他特意把门留了一条缝，好让猫进来。",
      2783,
      "deliberately [dɪˈlɪbəreɪtlɪ] adv. 故意地，蓄意地",
      "adv.",
      "故意地，蓄意地"
    ],
    [
      92,
      "deliberation",
      "After hours of deliberation, the jury reached a verdict.",
      "陪审团经过数小时商议后作出了裁决。",
      2784,
      "*deliberation [dɪˌlɪbəˈreɪʃən] n. 1. 考虑，研讨，商议 2. 审慎，从容，沉着",
      "n.",
      "1. 考虑，研讨，商议 2. 审慎，从容，沉着"
    ],
    [
      93,
      "delicacy",
      "The chef served a local delicacy made with fresh mushrooms.",
      "厨师端上一道用新鲜蘑菇制作的当地美食。",
      2785,
      "delicacy [ˈdelɪkəsɪ] n. 1. 精致，优美，细微 2. 美味，佳肴",
      "n.",
      "1. 精致，优美，细微 2. 美味，佳肴"
    ],
    [
      94,
      "delicatessen",
      "The delicatessen sells fresh bread, cheese and cured meats.",
      "这家熟食店出售新鲜面包、奶酪和腌制肉类。",
      2787,
      "delicatessen [ˌdelɪkəˈtesn] n. 熟食店，熟食",
      "n.",
      "熟食店，熟食"
    ],
    [
      95,
      "delightful",
      "We spent a delightful afternoon walking through the gardens.",
      "我们在花园里散步，度过了一个愉快的下午。",
      2790,
      "delightful [dɪˈlaɪtfʊl] adj. 令人愉快的",
      "adj.",
      "令人愉快的"
    ],
    [
      96,
      "delimit",
      "The survey will delimit the area affected by the flood.",
      "这项调查将确定受洪水影响区域的边界。",
      2791,
      "*delimit [diːˈlɪmɪt] v. 确定…的范围(界线)",
      "v.",
      "确定…的范围(界线)"
    ],
    [
      97,
      "delineate",
      "The map clearly delineates the boundary between the two parks.",
      "地图清楚地标出了两座公园之间的界线。",
      2792,
      "*delineate [dɪˈlɪnɪeɪt] v. 描绘，描述，勾画…的轮廓",
      "v.",
      "描绘，描述，勾画…的轮廓"
    ]
  ],
  "021": [
    [
      0,
      "delirious",
      "After two nights without sleep, he became delirious with fever.",
      "连续两夜未眠后，他因发烧而神志不清。",
      2795,
      "*delirious [dɪˈlɪrɪəs] adj. 精神错乱的，胡言乱语的，极度兴奋的",
      "adj.",
      "精神错乱的，胡言乱语的，极度兴奋的"
    ],
    [
      1,
      "deliverance",
      "The rescue boat brought deliverance to the stranded sailors.",
      "救援船让被困的水手得以获救。",
      2797,
      "*deliverance [dɪˈlɪvərəns] n. 解救，拯救",
      "n.",
      "解救，拯救"
    ],
    [
      4,
      "delta",
      "Thousands of birds nest in the river delta each spring.",
      "每年春天，成千上万只鸟在河口三角洲筑巢。",
      2800,
      "delta [ˈdeltə] n. (河口的)三角洲",
      "n.",
      "(河口的)三角洲"
    ],
    [
      5,
      "delude",
      "He deluded himself into believing the problem would disappear on its own.",
      "他自欺欺人地以为问题会自行消失。",
      2801,
      "*delude [dɪˈluːd] v. 误导，欺骗，哄骗",
      "v.",
      "误导，欺骗，哄骗"
    ],
    [
      6,
      "deluge",
      "A sudden deluge flooded the streets within minutes.",
      "一场突如其来的暴雨几分钟内就淹没了街道。",
      2802,
      "*deluge [ˈdeljuːdʒ] n. 大雨，暴雨，洪水 v. 淹没，涌现",
      "n.",
      "大雨，暴雨，洪水 v. 淹没，涌现"
    ],
    [
      7,
      "delusion",
      "He clung to the delusion that he could win without training.",
      "他执迷于不训练也能获胜的幻想。",
      2803,
      "delusion [dɪˈluːʒən] n. 欺骗，错觉，幻想",
      "n.",
      "欺骗，错觉，幻想"
    ],
    [
      9,
      "delve",
      "The journalist delved into the company's financial records.",
      "记者深入查阅了公司的财务记录。",
      2805,
      "*delve [delv] v. 1. 搜寻，翻查 2. 探索，钻研",
      "v.",
      "1. 搜寻，翻查 2. 探索，钻研"
    ],
    [
      10,
      "demand",
      "The workers demanded safer conditions at the factory.",
      "工人们要求工厂提供更安全的工作条件。",
      2808,
      "demand [dɪˈmɑːnd] v. &n. 要求，请求，需求",
      "v.&n.",
      "要求，请求，需求"
    ],
    [
      11,
      "demanding",
      "Caring for newborn twins can be physically demanding.",
      "照顾一对新生双胞胎可能非常耗费体力。",
      2809,
      "demanding [dɪˈmɑːndɪŋ] adj. 要求高的，费力(心)的",
      "adj.",
      "要求高的，费力(心)的"
    ],
    [
      16,
      "demobilize",
      "After the ceasefire, the army began to demobilize its reserve units.",
      "停火后，军队开始遣散预备役部队。",
      2815,
      "*demobilize [diːˈməʊbɪlaɪz] v. 使复员，退伍，遣散(军队)",
      "v.",
      "使复员，退伍，遣散(军队)"
    ]
  ]
};
test('TEM-020/021 58 bilingual drafts remain source-locked and unapproved',()=>{
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
 assert.equal(total,58);
});
