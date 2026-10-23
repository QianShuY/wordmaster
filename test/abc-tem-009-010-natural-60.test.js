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
    "tem-009",
    41,
    "booklet",
    "The booklet explains how to apply for a library card.",
    "这本小册子介绍了如何办理借书证。",
    1210,
    "booklet [ˈbʊklɪt] n. 小册子",
    "n.",
    "小册子"
  ],
  [
    "tem-009",
    42,
    "bookmark",
    "She slipped a bookmark between the pages before closing the novel.",
    "合上小说前，她在书页间夹了一张书签。",
    1211,
    "bookmark [ˈbʊkmɑːk] n. 书签",
    "n.",
    "书签"
  ],
  [
    "tem-009",
    43,
    "bookseller",
    "The bookseller recommended a novel by a local author.",
    "书商向她推荐了一本当地作家写的小说。",
    1212,
    "bookseller [bʊkˌselə] n. 书商",
    "n.",
    "书商"
  ],
  [
    "tem-009",
    44,
    "bookshelf",
    "He placed the dictionaries on the top bookshelf.",
    "他把词典放在最上层的书架上。",
    1213,
    "bookshelf [ˈbʊkʃelf] n. 书架",
    "n.",
    "书架"
  ],
  [
    "tem-009",
    45,
    "bookshop",
    "The bookshop on the corner sells second-hand novels.",
    "街角的书店出售二手小说。",
    1214,
    "bookshop [ˈbʊkʃɒp] n. 书店",
    "n.",
    "书店"
  ],
  [
    "tem-009",
    46,
    "bookstall",
    "He found an old atlas at a bookstall near the station.",
    "他在车站附近的书报摊找到一本旧地图册。",
    1215,
    "bookstall [ˈbʊkstɔːl] n. 书报摊",
    "n.",
    "书报摊"
  ],
  [
    "tem-009",
    47,
    "bookstore",
    "She bought a travel guide at a bookstore near the station.",
    "她在车站附近的一家书店买了本旅行指南。",
    1216,
    "bookstore [ˈbʊkstɔː] n. (AmE)书店",
    "n.",
    "(AmE)书店"
  ],
  [
    "tem-009",
    72,
    "bountiful",
    "The foundation's bountiful support helped the clinic stay open.",
    "基金会的慷慨资助使诊所得以继续运营。",
    1255,
    "*bountiful [ˈbaʊntɪfl] adj. 慷慨的，大方的",
    "adj.",
    "慷慨的，大方的"
  ],
  [
    "tem-009",
    75,
    "bourgeois",
    "The novel satirizes the narrow values of a bourgeois family.",
    "这部小说讽刺了一个中产阶级家庭狭隘的价值观。",
    1258,
    "bourgeois [ˈbʊəʒwɑː] adj. 1. 资产阶级的，中产阶级的 2. 平庸的",
    "adj.",
    "1. 资产阶级的，中产阶级的 2. 平庸的"
  ],
  [
    "tem-009",
    76,
    "bourgeoisie",
    "The novel portrays the rise of the urban bourgeoisie.",
    "这部小说描绘了城市资产阶级的崛起。",
    1259,
    "bourgeoisie [ˌbʊəʒwɑːˈziː] n. 资产阶级，中产阶级",
    "n.",
    "资产阶级，中产阶级"
  ],
  [
    "tem-009",
    78,
    "boutique",
    "She found a handmade dress in a small boutique downtown.",
    "她在市中心的一家小型时装店找到了一条手工连衣裙。",
    1261,
    "*boutique [bʊːˈtiːk] n. (女士)时装店",
    "n.",
    "(女士)时装店"
  ],
  [
    "tem-009",
    89,
    "boxer",
    "The boxer trained for months before the championship match.",
    "这名拳击手为冠军赛训练了好几个月。",
    1273,
    "boxer [ˈbɒksə] n. 拳击家，拳击员，拳术师",
    "n.",
    "拳击家，拳击员，拳术师"
  ],
  [
    "tem-009",
    91,
    "boyfriend",
    "Her boyfriend met her at the station after work.",
    "下班后，她的男朋友到车站接她。",
    1277,
    "boyfriend [ˈbɔɪfrend] n. 男朋友",
    "n.",
    "男朋友"
  ],
  [
    "tem-009",
    93,
    "bracelet",
    "She wore a silver bracelet that her grandmother had given her.",
    "她戴着祖母送给她的一只银手镯。",
    1280,
    "bracelet [ˈbreɪslɪt] n. 手镯，臂镯",
    "n.",
    "手镯，臂镯"
  ],
  [
    "tem-009",
    94,
    "bracket",
    "Put the additional information in brackets at the end of the sentence.",
    "把补充信息放在句末的括号里。",
    1281,
    "bracket [ˈbrækɪt] n. 1. 架子  2. (pl)括号",
    "n.",
    "1. 架子  2. (pl)括号"
  ],
  [
    "tem-009",
    96,
    "braid",
    "A gold braid decorated the edge of the uniform.",
    "制服边缘饰有一条金色穗带。",
    1283,
    "*braid [breɪd] n. &v. (丝线等编成的)穗带，辫带",
    "n.&v.",
    "(丝线等编成的)穗带，辫带"
  ],
  [
    "tem-010",
    0,
    "brainwash",
    "The cult tried to brainwash new members into obeying its leader.",
    "这个邪教组织试图给新成员洗脑，让他们服从首领。",
    1288,
    "*brainwash [ˈbreɪnwɒʃ] v. (derog)对…进行洗脑",
    "v.",
    "(derog)对…进行洗脑"
  ],
  [
    "tem-010",
    1,
    "brake",
    "The driver pressed the brake as the traffic lights turned red.",
    "交通灯变红时，司机踩下了刹车。",
    1289,
    "brake [breɪk] n. (机)闸，刹车 v. 刹(车)",
    "n.",
    "(机)闸，刹车 v. 刹(车)"
  ],
  [
    "tem-010",
    3,
    "brash",
    "His brash remarks offended several people at the meeting.",
    "他在会上鲁莽无礼的言论冒犯了好几个人。",
    1293,
    "*brash [bræʃ] adj. 粗鲁的，无礼的，莽撞的",
    "adj.",
    "粗鲁的，无礼的，莽撞的"
  ],
  [
    "tem-010",
    5,
    "bravado",
    "His confident speech was mostly bravado; he was terrified of the climb.",
    "他信心十足的讲话大多是在逞强，其实他非常害怕攀登。",
    1295,
    "*bravado [brəˈvɑːdəʊ] n. 虚张声势，故作勇敢，逞能",
    "n.",
    "虚张声势，故作勇敢，逞能"
  ],
  [
    "tem-010",
    6,
    "bravery",
    "The firefighter received an award for her bravery during the rescue.",
    "这名消防员因救援中的勇敢表现而获奖。",
    1297,
    "bravery [ˈbreɪvərɪ] n. 勇敢，无畏",
    "n.",
    "勇敢，无畏"
  ],
  [
    "tem-010",
    7,
    "Brazilian",
    "A Brazilian musician taught the children to play the drums.",
    "一位巴西音乐家教孩子们打鼓。",
    1298,
    "Brazilian [brəˈzɪliən] adj. 巴西的，巴西人的 n. 巴西人",
    "adj.",
    "巴西的，巴西人的 n. 巴西人"
  ],
  [
    "tem-010",
    8,
    "breach",
    "Sharing the client's records without permission was a serious breach of trust.",
    "未经允许分享客户档案是严重的背信行为。",
    1299,
    "breach [briːtʃ] n. 1. 违反， 不履行 2. 绝交， 不和 3. 破洞，裂缝 v. 冲破，攻破",
    "n.",
    "1. 违反， 不履行 2. 绝交， 不和 3. 破洞，裂缝 v. 冲破，攻破"
  ],
  [
    "tem-010",
    10,
    "breathless",
    "She reached the top of the stairs breathless from running.",
    "她跑到楼梯顶端时已气喘吁吁。",
    1308,
    "breathless [ˈbreθlɪs] adj. 气喘吁吁的",
    "adj.",
    "气喘吁吁的"
  ],
  [
    "tem-010",
    11,
    "breathtaking",
    "The view from the mountain summit was breathtaking.",
    "从山顶望去，景色美得令人惊叹。",
    1309,
    "breathtaking [ˈbreθteɪkɪŋ] adj. 激动人心的，惊人的，非凡的",
    "adj.",
    "激动人心的，惊人的，非凡的"
  ],
  [
    "tem-010",
    12,
    "breed",
    "The farmer breeds sheep that can survive harsh winters.",
    "这位农民培育能熬过严冬的绵羊。",
    1310,
    "breed [briːd] n. 品种，种类 v. 1. 繁殖， 育种 2. 饲养 3. 养育，培养，教养",
    "n.",
    "品种，种类 v. 1. 繁殖， 育种 2. 饲养 3. 养育，培养，教养"
  ],
  [
    "tem-010",
    14,
    "brevity",
    "The judge praised the witness for the brevity of her answers.",
    "法官称赞这名证人的回答简明扼要。",
    1312,
    "*brevity [ˈbrevətɪ] n. 简短，简洁，短暂",
    "n.",
    "简短，简洁，短暂"
  ],
  [
    "tem-010",
    15,
    "brew",
    "She brewed a pot of tea while the guests took off their coats.",
    "客人们脱外套时，她泡了一壶茶。",
    1313,
    "brew [bruː] v. 1. 酿造(啤酒) 2. 泡(茶)，煮(咖啡) 3. 酝酿 n. 1. 酿造物 2. (酿造饮料的)质量，品味",
    "v.",
    "1. 酿造(啤酒) 2. 泡(茶)，煮(咖啡) 3. 酝酿 n. 1. 酿造物 2. (酿造饮料的)质量，品味"
  ],
  [
    "tem-010",
    16,
    "brewery",
    "The brewery uses locally grown barley to make its beer.",
    "这家啤酒厂用本地种植的大麦酿造啤酒。",
    1314,
    "brewery [ˈbruːərɪ] n. 啤酒厂，酿造厂",
    "n.",
    "啤酒厂，酿造厂"
  ],
  [
    "tem-010",
    17,
    "bribe",
    "The official was arrested for accepting a bribe from a contractor.",
    "这名官员因收受承包商的贿赂而被捕。",
    1315,
    "bribe [braɪb] n. 贿赂 v. 贿赂，收买",
    "n.",
    "贿赂 v. 贿赂，收买"
  ],
  [
    "tem-010",
    18,
    "bribery",
    "The inquiry uncovered evidence of bribery in the bidding process.",
    "调查发现了招标过程中的行贿证据。",
    1316,
    "bribery [ˈbraɪbərɪ] n. 行贿，行贿的财物",
    "n.",
    "行贿，行贿的财物"
  ],
  [
    "tem-010",
    19,
    "bridal",
    "The bridal party gathered for photographs after the ceremony.",
    "婚礼仪式结束后，新娘一行人聚在一起拍照。",
    1318,
    "*bridal [ˈbraɪdl] adj. 新娘的，婚礼的",
    "adj.",
    "新娘的，婚礼的"
  ],
  [
    "tem-010",
    21,
    "bridegroom",
    "The bridegroom waited nervously at the altar.",
    "新郎紧张地站在圣坛前等候。",
    1320,
    "bridegroom [ˈbraɪdɡrʊm] n. 新郎",
    "n.",
    "新郎"
  ],
  [
    "tem-010",
    22,
    "bridle",
    "She adjusted the horse's bridle before the ride.",
    "骑马前，她调整了马的笼头。",
    1322,
    "*bridle [ˈbraɪdl] n. 笼头，马疆 v. 1. 给…套笼头 2. 约束，控制 3. 动怒，生气",
    "n.",
    "笼头，马疆 v. 1. 给…套笼头 2. 约束，控制 3. 动怒，生气"
  ],
  [
    "tem-010",
    24,
    "briefing",
    "The rescue team attended a safety briefing before entering the mine.",
    "救援队进入矿井前参加了安全情况说明会。",
    1325,
    "briefing [ˈbriːfɪŋ] n. 1. 情况的简要介绍，简报 2. 基本情况介绍会",
    "n.",
    "1. 情况的简要介绍，简报 2. 基本情况介绍会"
  ],
  [
    "tem-010",
    26,
    "brigade",
    "The fire brigade arrived within minutes of the alarm.",
    "火警响起后，消防队几分钟内就赶到了。",
    1327,
    "brigade [brɪˈɡeɪd] n. 1. (军队中的)旅 2. (担任特殊任务的)团、队",
    "n.",
    "1. (军队中的)旅 2. (担任特殊任务的)团、队"
  ],
  [
    "tem-010",
    28,
    "brilliance",
    "The brilliance of her solution surprised the judges.",
    "她的解决方案十分出色，令评委们惊讶。",
    1330,
    "brilliance [ˈbrɪljəns] n. 1. 光辉，辉煌 2. 聪颖，才华横溢，卓越",
    "n.",
    "1. 光辉，辉煌 2. 聪颖，才华横溢，卓越"
  ],
  [
    "tem-010",
    30,
    "brink",
    "The company was on the brink of bankruptcy after losing its largest client.",
    "失去最大客户后，这家公司濒临破产。",
    1334,
    "brink [brɪŋk] n. 1. (峭壁顶上的)边缘，(河流等的)边沿，边 2. 边缘 || on the brink of …濒临，正要…之际",
    "n.",
    "1. (峭壁顶上的)边缘，(河流等的)边沿，边 2. 边缘 || on the brink of …濒临，正要…之际"
  ],
  [
    "tem-010",
    34,
    "Briton",
    "The Briton won the race despite an injury to his ankle.",
    "这名英国人尽管脚踝受伤，仍赢得了比赛。",
    1338,
    "*Briton [ˈbrɪtən] n. (usu fml)英国人",
    "n.",
    "(usu fml)英国人"
  ],
  [
    "tem-010",
    36,
    "broaden",
    "Reading widely can broaden your understanding of other cultures.",
    "广泛阅读可以拓宽你对其他文化的了解。",
    1342,
    "broaden [ˈbrɔːdən] v. 放宽，加阔，(使)扩大",
    "v.",
    "放宽，加阔，(使)扩大"
  ],
  [
    "tem-010",
    37,
    "broccoli",
    "She steamed the broccoli until it was tender but still bright green.",
    "她把西兰花蒸到口感软嫩、颜色仍然翠绿。",
    1343,
    "*broccoli [ˈbrɒkəlɪ] n. 西兰花",
    "n.",
    "西兰花"
  ],
  [
    "tem-010",
    38,
    "broke",
    "After paying the rent, he was completely broke.",
    "付完房租后，他身无分文。",
    1345,
    "*broke [brəʊk] adj. 彻底破产的，身无分文的",
    "adj.",
    "彻底破产的，身无分文的"
  ],
  [
    "tem-010",
    40,
    "broker",
    "The broker helped the couple find a suitable mortgage.",
    "经纪人帮助这对夫妇找到合适的住房贷款。",
    1347,
    "*broker [ˈbrəʊkə] n. 1. 经纪人，掮客，中间人 2. 股票经纪人",
    "n.",
    "1. 经纪人，掮客，中间人 2. 股票经纪人"
  ],
  [
    "tem-010",
    41,
    "brokerage",
    "The brokerage fee was deducted from the proceeds of the sale.",
    "经纪佣金从出售所得中扣除了。",
    1348,
    "*brokerage [ˈbrəʊkərɪdʒ] n. 1. 经纪业，掮客业务 2. 经纪费用，佣金",
    "n.",
    "1. 经纪业，掮客业务 2. 经纪费用，佣金"
  ],
  [
    "tem-010",
    42,
    "bronchitis",
    "The doctor diagnosed bronchitis after examining his persistent cough.",
    "医生检查了他持续不断的咳嗽后，诊断为支气管炎。",
    1349,
    "*bronchitis [brɒŋˈkaɪtɪs] n. 支气管炎",
    "n.",
    "支气管炎"
  ],
  [
    "tem-010",
    44,
    "brooch",
    "She fastened a silver brooch to the lapel of her coat.",
    "她把一枚银胸针别在外套翻领上。",
    1351,
    "brooch [brəʊtʃ] n. 胸针，饰针",
    "n.",
    "胸针，饰针"
  ],
  [
    "tem-010",
    45,
    "brood",
    "The hen gathered her brood beneath her wings as rain began to fall.",
    "开始下雨时，母鸡把一窝小鸡护在翅膀下。",
    1352,
    "brood [bruːd] n. 1. (鸡等)一窝，同窝幼鸟 2. (同类或同种的)一伙，一组(事物) v. 1. 孵(蛋),孵出 2. 盘算，细想，沉思",
    "n.",
    "1. (鸡等)一窝，同窝幼鸟 2. (同类或同种的)一伙，一组(事物) v. 1. 孵(蛋),孵出 2. 盘算，细想，沉思"
  ],
  [
    "tem-010",
    48,
    "brothel",
    "The authorities closed the illegal brothel after an investigation.",
    "有关部门调查后关闭了这家非法妓院。",
    1355,
    "*brothel [ˈbrɒθəl] n. 妓院",
    "n.",
    "妓院"
  ],
  [
    "tem-010",
    49,
    "brotherhood",
    "Years of working together had created a strong sense of brotherhood among the crew.",
    "多年的共同工作使船员之间建立了深厚的兄弟情谊。",
    1357,
    "brotherhood [ˈbrʌðəhʊd] n. 1. 手足情谊，兄弟关系 2. 同业，同僚",
    "n.",
    "1. 手足情谊，兄弟关系 2. 同业，同僚"
  ],
  [
    "tem-010",
    50,
    "brother-in-law",
    "Her brother-in-law offered to repair the broken gate.",
    "她的姐夫主动提出修理坏掉的大门。",
    1358,
    "brother-in-law [ˈbrʌðəɪnlɔː] n. 姐夫，妹夫",
    "n.",
    "姐夫，妹夫"
  ],
  [
    "tem-010",
    51,
    "brotherly",
    "He gave his younger friend some brotherly advice before the interview.",
    "面试前，他像兄长一样给年轻的朋友提了些建议。",
    1359,
    "brotherly [ˈbrʌðəlɪ] adj. 兄弟的，兄弟般的，友爱的",
    "adj.",
    "兄弟的，兄弟般的，友爱的"
  ],
  [
    "tem-010",
    53,
    "browse",
    "She browsed the shelves until she found a book on astronomy.",
    "她浏览书架，直到找到一本天文学书籍。",
    1362,
    "browse [braʊz] v. 1. 浏览(书刊)  2. (牲畜)吃草",
    "v.",
    "1. 浏览(书刊)  2. (牲畜)吃草"
  ],
  [
    "tem-010",
    54,
    "browser",
    "Clear your browser's cache if the page fails to load correctly.",
    "如果页面无法正常加载，请清除浏览器缓存。",
    1363,
    "*browser [ˈbraʊzə] n. 浏览器",
    "n.",
    "浏览器"
  ],
  [
    "tem-010",
    56,
    "brunch",
    "We met for brunch at a café on Sunday morning.",
    "星期天上午，我们在一家咖啡馆吃了顿早午餐。",
    1365,
    "brunch [brʌntʃ] n. 晚吃的早餐，早吃的午餐，早午餐",
    "n.",
    "晚吃的早餐，早吃的午餐，早午餐"
  ],
  [
    "tem-010",
    57,
    "brunette",
    "The brunette at the reception desk greeted us warmly.",
    "接待台那位深褐色头发的女子热情地迎接了我们。",
    1366,
    "*brunette [bruːˈnet] n. 深褐色头发的白种女子",
    "n.",
    "深褐色头发的白种女子"
  ],
  [
    "tem-010",
    58,
    "brunt",
    "Coastal villages bore the brunt of the storm.",
    "沿海村庄首当其冲，遭受了这场风暴最猛烈的冲击。",
    1367,
    "*brunt [brʌnt] n. 首当其冲||bear the brunt of sth首当其冲",
    "n.",
    "首当其冲||bear the brunt of sth首当其冲"
  ],
  [
    "tem-010",
    62,
    "brutish",
    "The prisoners suffered brutish treatment at the hands of the guards.",
    "囚犯们遭到看守野蛮残忍的对待。",
    1372,
    "*brutish [ˈbruːtɪʃ] adj. 野兽般的，野蛮的，残忍的",
    "adj.",
    "野兽般的，野蛮的，残忍的"
  ],
  [
    "tem-010",
    63,
    "bubble",
    "Tiny bubbles rose to the surface as the water began to boil.",
    "水开始沸腾时，细小的气泡升到了水面。",
    1373,
    "bubble [ˈbʌbl] n. 泡，水泡，气泡  v. 吹泡，起泡",
    "n.",
    "泡，水泡，气泡  v. 吹泡，起泡"
  ],
  [
    "tem-010",
    64,
    "buck",
    "A young buck stepped out of the woods and crossed the path.",
    "一只年轻的雄鹿走出树林，穿过了小路。",
    1374,
    "buck [bʌk] n. 雄鹿，雄兔  adj. 雄的",
    "n.",
    "雄鹿，雄兔  adj. 雄的"
  ],
  [
    "tem-010",
    66,
    "buckle",
    "She fastened the buckle on her seat belt before the plane took off.",
    "飞机起飞前，她扣好了安全带的搭扣。",
    1376,
    "buckle [ˈbʌkl] n. 1. 皮带扣环，装饰用扣环 v. 用扣环扣住 2. (使)弯曲，扭曲 3. 挡不住，屈服",
    "n.",
    "1. 皮带扣环，装饰用扣环 v. 用扣环扣住 2. (使)弯曲，扭曲 3. 挡不住，屈服"
  ]
];
test('TEM-009 leftover and TEM-010: 60 source-locked bilingual rewrites stay unverified drafts',()=>{
 assert.equal(expected.length,60);
 assert.equal(new Set(expected.map(x=>x[0]+':'+x[1])).size,60);
 for(const taskId of ['tem-009','tem-010']){
  const file=path.join(root,'docs/model-task-results/worker-A',taskId,'result.json');
  const result=JSON.parse(fs.readFileSync(file,'utf8'));
  const task=manifest.files.find(t=>t.task_id===taskId);
  const input=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',task.file),'utf8'));
  assert.equal(result.task_id,taskId);
  assert.equal(result.status,'proposal');
  assert.equal(result.input_sha256,task.sha256);
  assert.equal(result.entries.length,input.entries.length);
  for(const [id,i,word,en,cn,line,raw,pos,meaning] of expected.filter(e=>e[0]===taskId)){
   const row=result.entries[i];
   assert.equal(row.identity.word,word);
   assert.equal(row.identity.source_line,line);
   assert.equal(row.identity.source_raw,raw);
   assert.deepEqual(row.identity,input.entries[i].identity);
   assert.deepEqual(row.original,input.entries[i].current);
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
   assert.deepEqual(rules.filter(rule=>rule.pattern.test(rule.id==='translation-metalinguistic'?cn:en)).map(rule=>rule.id),[],word);
  }
 }
});
