'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const expected={
  "018": [
    [
      14,
      "cracker",
      "He spread cheese on a cracker before serving it.",
      "他上菜前在一片薄脆饼干上抹了奶酪。",
      2430,
      "cracker [ˈkrækə] n. 1. 爆竹(=firecracker) 2. (AmE)一种薄脆饼干",
      "n.",
      "1. 爆竹(=firecracker) 2. (AmE)一种薄脆饼干"
    ],
    [
      24,
      "crap",
      "I'm tired of hearing that crap about easy money.",
      "我听腻了那些轻松赚钱的鬼话。",
      2441,
      "*crap [kræp] n. 胡扯，废话",
      "n.",
      "胡扯，废话"
    ],
    [
      46,
      "cremate",
      "The family decided to cremate his remains in accordance with his wishes.",
      "家人按照他的遗愿决定将他的遗体火化。",
      2470,
      "*cremate [krɪˈmeɪt] v. 火化，火葬",
      "v.",
      "火化，火葬"
    ],
    [
      51,
      "crib",
      "The horses ate hay from a wooden crib in the stable.",
      "马儿在马厩里从木制饲料槽中吃干草。",
      2476,
      "crib [krɪb] n. 1. 饲料槽 2. 马厩图(如基督教会圣诞节所陈列的马厩模型，展示耶稣在伯利恒诞生之情景)",
      "n.",
      "1. 饲料槽 2. 马厩图(如基督教会圣诞节所陈列的马厩模型，展示耶稣在伯利恒诞生之情景)"
    ],
    [
      69,
      "crossbow",
      "The archer loaded a bolt into the crossbow.",
      "弓弩手把一支弩箭装进弩里。",
      2500,
      "*crossbow [ˈkrɒsbəʊ] n. 石弓，弩",
      "n.",
      "石弓，弩"
    ],
    [
      75,
      "crotch",
      "The trousers tore at the crotch while he was climbing.",
      "他攀爬时裤子的裆部裂开了。",
      2506,
      "*crotch [krɒtʃ] n. 胯(人体两腿分叉处)",
      "n.",
      "胯(人体两腿分叉处)"
    ],
    [
      83,
      "cruiser",
      "A navy cruiser entered the harbour at dawn.",
      "一艘海军巡洋舰黎明时驶入港口。",
      2517,
      "cruiser [ˈkruːzə] n. 1. 巡洋舰 2. 有船舱的游艇",
      "n.",
      "1. 巡洋舰 2. 有船舱的游艇"
    ],
    [
      84,
      "crumb",
      "A crumb of bread fell onto the tablecloth.",
      "一小块面包屑掉在桌布上。",
      2518,
      "crumb [krʌm] n. 面包屑",
      "n.",
      "面包屑"
    ],
    [
      85,
      "crumble",
      "The dry biscuit crumbled when she picked it up.",
      "她拿起干饼干时，饼干碎成了屑。",
      2519,
      "crumble [ˈkrʌmbl] v. 1. 弄碎，粉碎 2. 崩溃，瓦解",
      "v.",
      "1. 弄碎，粉碎 2. 崩溃，瓦解"
    ],
    [
      86,
      "crunch",
      "He crunched the crisp apple with a loud bite.",
      "他咬了一大口脆苹果，发出清脆的咔嚓声。",
      2520,
      "*crunch [krʌntʃ] v. 1. (嘎吱作响的)啃，咬，嚼 2. 在…上嘎吱作响地走  n. 嘎吱声",
      "v.",
      "1. (嘎吱作响的)啃，咬，嚼 2. 在…上嘎吱作响地走  n. 嘎吱声"
    ],
    [
      87,
      "crusade",
      "The journalist launched a crusade against corruption.",
      "那名记者发起了一场反腐败运动。",
      2521,
      "crusade [kruːˈseɪd] n. 1. (usu cap)十字军东征 2. 运动，斗争  v. 介入，参与(运动)",
      "n.",
      "1. (usu cap)十字军东征 2. 运动，斗争  v. 介入，参与(运动)"
    ],
    [
      89,
      "crutch",
      "She used a crutch while her ankle healed.",
      "脚踝恢复期间，她拄着一根拐杖。",
      2524,
      "crutch [krʌtʃ] n. 1. 拐杖，丁字形的拐杖 2. 支柱，支架",
      "n.",
      "1. 拐杖，丁字形的拐杖 2. 支柱，支架"
    ],
    [
      90,
      "crux",
      "The crux of the problem is a lack of reliable data.",
      "问题的症结在于缺乏可靠的数据。",
      2525,
      "*crux [krʌks] n. 关键，问题的症结",
      "n.",
      "关键，问题的症结"
    ],
    [
      91,
      "crypt",
      "The medieval church has a stone crypt beneath the altar.",
      "这座中世纪教堂的祭坛下有一间石砌地下室。",
      2527,
      "*crypt [krɪpt] n. 地窖，教堂的地下室",
      "n.",
      "地窖，教堂的地下室"
    ],
    [
      92,
      "cryptic",
      "He left a cryptic note that no one could understand.",
      "他留下一张含义隐晦、无人能懂的便条。",
      2528,
      "*cryptic [ˈkrɪptɪk] adj. 隐藏的， 隐义的，神秘的",
      "adj.",
      "隐藏的， 隐义的，神秘的"
    ],
    [
      94,
      "cub",
      "The bear cub stayed close to its mother.",
      "小熊紧紧跟在母熊身边。",
      2530,
      "*cub [kʌb] n. 幼兽",
      "n.",
      "幼兽"
    ],
    [
      97,
      "cuckoo",
      "A cuckoo called from the woods in early spring.",
      "初春时，树林里传来布谷鸟的叫声。",
      2533,
      "*cuckoo [ˈkʊkuː] n. 布谷鸟，杜鹃",
      "n.",
      "布谷鸟，杜鹃"
    ],
    [
      98,
      "cuddle",
      "The child cuddled up to her mother on the sofa.",
      "孩子在沙发上依偎着母亲。",
      2535,
      "*cuddle [ˈkʌdl] v. 1. 搂抱，拥抱 2. 依偎着睡，蜷着身体睡  n. 拥抱，紧抱",
      "v.",
      "1. 搂抱，拥抱 2. 依偎着睡，蜷着身体睡  n. 拥抱，紧抱"
    ],
    [
      99,
      "cudgel",
      "The guard carried a wooden cudgel at his side.",
      "守卫腰间带着一根木棍。",
      2536,
      "*cudgel [ˈkʌdʒəl] n. 棒，短棍",
      "n.",
      "棒，短棍"
    ]
  ],
  "019": [
    [
      0,
      "cue",
      "The actor waited for his cue before stepping onto the stage.",
      "演员等到上场提示后才走上舞台。",
      2537,
      "cue [kjuː] n. 1. (给演员等所作的)提示，提词 2. 暗示，指引",
      "n.",
      "1. (给演员等所作的)提示，提词 2. 暗示，指引"
    ],
    [
      1,
      "cuff",
      "She rolled up the cuffs of her shirt before washing the dishes.",
      "洗碗前她卷起了衬衫袖口。",
      2538,
      "cuff [kʌf] n. 袖口，袖头  v. 掌击，轻拍",
      "n.",
      "袖口，袖头  v. 掌击，轻拍"
    ],
    [
      2,
      "culminate",
      "Months of negotiations culminated in a peace agreement.",
      "数月谈判最终促成了一项和平协议。",
      2540,
      "*culminate [ˈkʌlmɪneɪt] v. 达到顶点(高潮)，以…告终 || culminate in达到…高峰，终于",
      "v.",
      "达到顶点(高潮)，以…告终 || culminate in达到…高峰，终于"
    ],
    [
      3,
      "culprit",
      "Police identified the culprit from the security footage.",
      "警方通过监控录像认出了作案者。",
      2541,
      "*culprit [ˈkʌlprɪt] n. 罪犯，犯法者",
      "n.",
      "罪犯，犯法者"
    ],
    [
      4,
      "cult",
      "The documentary investigated a cult that isolated its members from their families.",
      "纪录片调查了一个让成员与家人隔绝的邪教组织。",
      2542,
      "*cult [kʌlt] n. 1. 狂热崇拜，邪教 2. 时尚，风靡一时的喜好、事物",
      "n.",
      "1. 狂热崇拜，邪教 2. 时尚，风靡一时的喜好、事物"
    ],
    [
      6,
      "cultivated",
      "The professor was known for her cultivated manners and wide reading.",
      "那位教授以举止文雅、博览群书而闻名。",
      2544,
      "cultivated [ˈkʌltɪveɪtɪd] adj. 有教养的，有修养的，文雅的",
      "adj.",
      "有教养的，有修养的，文雅的"
    ],
    [
      7,
      "cultural",
      "The museum hosts cultural events throughout the year.",
      "博物馆全年举办各类文化活动。",
      2545,
      "cultural [ˈkʌltʃərəl] adj. 1. 文化上的，文化的，人文的 2. 有教养的",
      "adj.",
      "1. 文化上的，文化的，人文的 2. 有教养的"
    ],
    [
      8,
      "cumbersome",
      "The cumbersome suitcase barely fitted through the narrow doorway.",
      "这个笨重的行李箱勉强穿过狭窄的门口。",
      2547,
      "*cumbersome [ˈkʌmbəsəm] adj. 笨重的",
      "adj.",
      "笨重的"
    ],
    [
      9,
      "cumulative",
      "The cumulative effect of several small delays was a missed deadline.",
      "几次小延误累积起来，最终导致错过截止日期。",
      2548,
      "*cumulative [ˈkjuːmjʊlətɪv] adj. 累积的，渐增的",
      "adj.",
      "累积的，渐增的"
    ],
    [
      10,
      "cunning",
      "The cunning thief hid the jewels inside a loaf of bread.",
      "狡猾的小偷把珠宝藏进了一条面包里。",
      2549,
      "cunning [ˈkʌnɪŋ] adj. &n. 狡猾(的)，狡诈(的)",
      "adj.&n.",
      "狡猾(的)，狡诈(的)"
    ],
    [
      11,
      "curable",
      "With early treatment, the disease is often curable.",
      "及早治疗的话，这种疾病通常可以治愈。",
      2552,
      "curable [ˈkjʊərəbl] adj. 可医治的，医得好的",
      "adj.",
      "可医治的，医得好的"
    ],
    [
      12,
      "curator",
      "The museum curator arranged the paintings by period.",
      "博物馆馆长按年代陈列了画作。",
      2553,
      "*curator [kjʊəˈreɪtə] n. (博物馆等)馆长",
      "n.",
      "(博物馆等)馆长"
    ],
    [
      13,
      "curb",
      "The new rules placed a curb on excessive spending.",
      "新规定对过度开支加以限制。",
      2554,
      "curb [kɜːb] n. 1. 勒马的链条(皮带) 2. 控制，约束，抑制  v. 1. 给(马)装上勒马链，勒住(马) 2. 控制，约束，抑制",
      "n.",
      "1. 勒马的链条(皮带) 2. 控制，约束，抑制  v. 1. 给(马)装上勒马链，勒住(马) 2. 控制，约束，抑制"
    ],
    [
      14,
      "curd",
      "The cheesemaker separated the curds from the whey.",
      "奶酪师傅把凝乳块与乳清分离。",
      2555,
      "*curd [kɜːd] n. 凝乳，凝乳状物",
      "n.",
      "凝乳，凝乳状物"
    ],
    [
      15,
      "curfew",
      "Residents had to return home before the midnight curfew.",
      "居民必须在午夜宵禁开始前回家。",
      2557,
      "*curfew [ˈkɜːfjuː] n. 宵禁",
      "n.",
      "宵禁"
    ],
    [
      17,
      "curl",
      "A loose curl fell across her forehead.",
      "一缕卷发垂在她额前。",
      2560,
      "curl [kɜːl] n. 1. 卷毛，卷发 2. 卷曲物，螺旋状 v. 1. 蜷缩 2. (烟)缭绕",
      "n.",
      "1. 卷毛，卷发 2. 卷曲物，螺旋状 v. 1. 蜷缩 2. (烟)缭绕"
    ],
    [
      18,
      "currently",
      "The library is currently closed for repairs.",
      "图书馆目前因维修而关闭。",
      2563,
      "currently [ˈkʌrəntlɪ] adv. 现在，目前",
      "adv.",
      "现在，目前"
    ],
    [
      20,
      "curry",
      "She made a mild vegetable curry for dinner.",
      "她晚餐做了一道口味清淡的蔬菜咖喱。",
      2565,
      "curry [ˈkʌrɪ] n. 1. 咖喱粉 2. 用咖喱烹调的菜肴 v. 用咖喱调制",
      "n.",
      "1. 咖喱粉 2. 用咖喱烹调的菜肴 v. 用咖喱调制"
    ],
    [
      22,
      "cursed",
      "He threw the cursed device into a drawer after it failed again.",
      "那个讨厌的设备又坏了，他把它扔进抽屉。",
      2567,
      "cursed [ˈkəːsɪd] adj. 可憎的，可恶的，讨厌的",
      "adj.",
      "可憎的，可恶的，讨厌的"
    ],
    [
      23,
      "cursive",
      "The letter was written in neat cursive handwriting.",
      "这封信是用工整的草写体写成的。",
      2568,
      "*cursive [ˈkɜːsɪv] adj. (指书法)草书的，草体的",
      "adj.",
      "(指书法)草书的，草体的"
    ],
    [
      24,
      "cursor",
      "Move the cursor to the end of the sentence.",
      "把光标移到句末。",
      2569,
      "cursor [ˈkɜːsə] n. (电脑屏幕上可移动的)光标",
      "n.",
      "(电脑屏幕上可移动的)光标"
    ],
    [
      25,
      "cursory",
      "A cursory glance at the report missed several errors.",
      "匆匆扫了一眼报告，结果漏掉了几处错误。",
      2570,
      "*cursory [ˈkɜːsərɪ] adj. 粗略的，匆促的，草率的",
      "adj.",
      "粗略的，匆促的，草率的"
    ],
    [
      26,
      "curt",
      "His curt reply ended the conversation.",
      "他简短而无礼的回答结束了对话。",
      2571,
      "*curt [kɜːt] adj. (言词)简短的，草率无礼的",
      "adj.",
      "(言词)简短的，草率无礼的"
    ],
    [
      27,
      "curtail",
      "The school had to curtail outdoor activities because of the storm.",
      "学校因暴风雨不得不减少户外活动。",
      2572,
      "*curtail [kɜːˈteɪl] v. 缩短，减缩",
      "v.",
      "缩短，减缩"
    ],
    [
      29,
      "custard",
      "She poured warm custard over the apple pie.",
      "她在苹果派上浇了温热的蛋奶甜羹。",
      2576,
      "*custard [ˈkʌstəd] n. 1. (BrE)蛋奶甜羹 2. 乳蛋糕",
      "n.",
      "1. (BrE)蛋奶甜羹 2. 乳蛋糕"
    ],
    [
      30,
      "custody",
      "The court granted the father joint custody of the child.",
      "法院判给父亲对孩子的共同监护权。",
      2577,
      "custody [ˈkʌstədɪ] n. 1. 监护权，监管 2. 扣留，监禁",
      "n.",
      "1. 监护权，监管 2. 扣留，监禁"
    ],
    [
      32,
      "cutlery",
      "The waiter placed clean cutlery beside each plate.",
      "服务员在每个盘子旁摆上干净的餐具。",
      2583,
      "*cutlery [ˈkʌtlərɪ] n. 刀具，餐具",
      "n.",
      "刀具，餐具"
    ],
    [
      34,
      "cyclist",
      "A cyclist signalled before turning left.",
      "一名骑车人在左转前打了手势。",
      2587,
      "cyclist [ˈsaɪklɪst] n. 骑自行车(三轮脚踏车、机器脚踏车)的人",
      "n.",
      "骑自行车(三轮脚踏车、机器脚踏车)的人"
    ],
    [
      35,
      "cyclone",
      "The cyclone damaged houses along the coast.",
      "这场气旋损坏了沿海的房屋。",
      2588,
      "cyclone [ˈsaɪkləʊn] n. 旋风，飓风",
      "n.",
      "旋风，飓风"
    ],
    [
      37,
      "cynic",
      "Even the cynic admitted that the volunteers had made a difference.",
      "连那个愤世嫉俗的人也承认志愿者确实带来了改变。",
      2590,
      "*cynic [ˈsɪnɪk] n. 愤世嫉俗的人，好挖苦的人",
      "n.",
      "愤世嫉俗的人，好挖苦的人"
    ],
    [
      38,
      "cynical",
      "She was cynical about the company's promises to change.",
      "她对公司承诺作出改变持怀疑态度。",
      2591,
      "cynical [ˈsɪnɪkəl] adj. 愤世嫉俗的，(对人性或动机)怀疑的",
      "adj.",
      "愤世嫉俗的，(对人性或动机)怀疑的"
    ],
    [
      39,
      "cynicism",
      "Years of broken promises had deepened his cynicism.",
      "多年来一次次落空的承诺加深了他的愤世嫉俗。",
      2592,
      "*cynicism [ˈsɪnɪsɪzəm] n. 愤世嫉俗的态度",
      "n.",
      "愤世嫉俗的态度"
    ],
    [
      44,
      "dad",
      "Dad picked me up from the station after work.",
      "爸爸下班后到车站接我。",
      2597,
      "dad [dæd] n. 爸爸，爹爹",
      "n.",
      "爸爸，爹爹"
    ],
    [
      45,
      "daddy",
      "The little girl ran to her daddy when he came home.",
      "小女孩见爸爸回家便跑向他。",
      2598,
      "daddy [ˈdædɪ] n. 爸爸，爹爹",
      "n.",
      "爸爸，爹爹"
    ],
    [
      46,
      "daffodil",
      "Yellow daffodils bloomed beside the garden path.",
      "黄色的水仙花在花园小径旁盛开。",
      2599,
      "*daffodil [ˈdæfədɪl] n. 水仙花",
      "n.",
      "水仙花"
    ],
    [
      47,
      "daft",
      "It would be daft to leave without checking the weather.",
      "不看天气预报就出门实在有点傻。",
      2600,
      "*daft [dɑːft] adj. 傻的，愚蠢的",
      "adj.",
      "傻的，愚蠢的"
    ],
    [
      48,
      "dagger",
      "The museum displayed a ceremonial dagger in a glass case.",
      "博物馆把一把仪式用短剑陈列在玻璃柜里。",
      2601,
      "dagger [ˈdæɡə] n. 匕首，短剑 || at daggers drawn剑拔弩张，势不两立 v. 用匕首刺",
      "n.",
      "匕首，短剑 || at daggers drawn剑拔弩张，势不两立 v. 用匕首刺"
    ],
    [
      49,
      "dainty",
      "She placed a dainty porcelain cup on the table.",
      "她把一只精致的小瓷杯放在桌上。",
      2603,
      "*dainty [ˈdeɪntɪ] adj. 1. 娇美的，晴朗的 2. 秀丽的，精致的  n. 1. 美味的食物 2. 珍品",
      "adj.",
      "1. 娇美的，晴朗的 2. 秀丽的，精致的  n. 1. 美味的食物 2. 珍品"
    ],
    [
      51,
      "dais",
      "The award winners stood on the dais for a photograph.",
      "获奖者站在台上合影。",
      2605,
      "*dais [ˈdeɪɪs] n. 讲台",
      "n.",
      "讲台"
    ],
    [
      52,
      "daisy",
      "A single white daisy grew beside the fence.",
      "篱笆旁长着一朵白色雏菊。",
      2606,
      "*daisy [ˈdeɪzɪ] n. 雏菊花",
      "n.",
      "雏菊花"
    ]
  ]
};
test('TEM-018/019 59 new bilingual drafts remain source-locked and unapproved',()=>{
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
 assert.equal(total,59);
});
