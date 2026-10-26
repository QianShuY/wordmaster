'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../app/vocabulary');
const {reviewedExample}=require('../shared/content-batch');
const edits=require('../app/seed/examples-cet4-sense-edits-20261024.json').examples;
const audit=require('../docs/model-quality-patches/cet4-source-phonetic-audit-20261024.json');
const packs=[1,2,3,4,5].flatMap(n=>require('../app/seed/examples-cet4-coverage-part-'+String(n).padStart(2,'0')+'.json').examples);
const words=V.buildBook(V.CATALOG.find(x=>x.file==='cet4.txt')).words;
test('CET4 editorial sense edits are source locked and leave model-worker candidates untouched',()=>{
 assert.equal(edits.length,417);
 assert.deepEqual(edits.map(x=>x.word).sort(),["French","German","Greek","Mister","Roman","Russian","accordingly","approximate","arrival","atom","atomic","balance","bargain","bark","beloved","besides","bike","blast","blaze","bloom","blossom","boast","bolt","bore","bow","brake","brass","breed","brim","bronze","brood","brown","bubble","bulb","carrier","cathedral","cement","centre","circulate","coil","collision","color","comparative","compel","competent","conquest","consent","convenience","crack","cripple","crow","crust","dairy","damage","darling","dash","deal","debate","deposit","derive","descend","despair","dial","dialog","discharge","dissolve","divorce","do","dot","downward","drain","dread","drill","drum","dye","each","echo","effective","either","elementary","end","endure","engage","entry","escape","establishment","everything","evolve","excess","excursion","exercise","explosive","expression","extra","faculty","failure","faith","fall","fare","fast","fate","fear","feel","fellow","female","field","file","filter","fish","fit","flare","flash","flock","fly","follow","fool","form","formation","fourth","free","front","further","garage","garbage","gas","gasp","gate","gauge","general","giant","give","glare","glass","glide","glitter","glory","glow","gold","goodness","governor","grade","graduate","grasp","grave","green","groan","group","grow","guard","guess","guide","halt","hammer","hand","handle","harbour","hard","harden","hardware","harm","harness","harsh","harvest","hasten","hatch","have","head","headline","hear","heat","heavily","help","her","herd","heroic","herself","hide","high","himself","hire","his","hit","hold","home","honey","hook","hope","horizon","horn","hostess","hot","hour","house","household","housewife","how","human","hurry","ice","image","imaginary","imagination","implication","import","in","incline","increase","influence","inquire","instant","institution","insult","intellectual","intelligent","interest","interior","invade","invest","inward","issue","junior","keep","kilometer","lazy","liberty","librarian","license","lighten","likewise","limb","link","liter","lively","loosen","lower","lumber","lump","magic","mail","maintain","maintenance","major","manly","manner","march","marine","marriage","marry","marvelous","mate","maximum","mechanically","medium","meeting","melt","merchant","mercury","molecule","mount","mutter","naturally","neat","necessity","noble","nod","none","operate","oral","orderly","organic","organize","pacific","pack","painful","pant","pardon","peculiar","pen","perform","physical","piano","plain","potential","pour","powerful","practise","president","pretty","prime","privilege","prospect","psychological","publication","punishment","pursue","pursuit","qualify","quicken","quote","range","rapid","reading","reality","receiver","refer","refusal","register","relax","release","reliance","render","representative","resident","resign","resistant","restraint","resume","reverse","reward","rider","ripen","rot","rotate","ruler","sadly","satisfaction","say","scare","score","search","separate","service","setting","shady","shave","shift","shoot","shriek","singular","skim","slow","smile","solid","south","spare","split","sprinkle","square","still","stress","strike","strip","stuff","submerge","succeed","suck","suffer","surprise","sustain","tailor","taste","terror","text","thirst","thrill","tiny","tire","toe","tongue","tough","trace","treat","trial","trifle","troublesome","trust","tube","tune","twin","ugly","uncover","universal","upon","upset","utility","vacuum","value","vanity","vary","vehicle","version","very","veteran","virtually","vital","vote","waken","waste","water","way","weaken","welfare","westward","whirl","win","winter","withdraw","within","wood","wool","work","worry","worth","worthless","wreck","yes","zealous"]);
 for(const item of edits){
  assert.equal(item.source_file,'cet4.txt');
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  const word=words.find(x=>x.word===item.word);
  assert.ok(word,item.word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],word[field],item.word+' '+field);
  const draft=packs.find(x=>x.word===item.word);
  assert.ok(draft,item.word);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.equal(draft.text,item.before_text);
  assert.equal(draft.translation,item.before_translation);
  assert.deepEqual(reviewedExample(word),{text:item.text,translation:item.translation});
  for(const altered of [{source_file:'custom.txt'},{source_line:word.source_line+1},{source_raw:'changed'},{meaning:'different sense'},{pos:word.pos==='vi.'?'n.':'vi.'},{headword:'different'},{homograph:1}]){
   assert.equal(reviewedExample({...word,...altered}),null,item.word+' '+JSON.stringify(altered));
  }
 }
});
test('phonetic conflicts are flagged without changing older checked CET4 bindings',()=>{
 assert.deepEqual(audit.fixed_by_editorial_overlay,['bow']);
 assert.deepEqual(audit.unresolved.map(x=>x.word).sort(),['desert','entrance','sow']);
 const desert=words.find(x=>x.word==='desert');
 assert.deepEqual(reviewedExample(desert),{text:'The travellers crossed the desert with an experienced guide.',translation:'旅人们在一位经验丰富的向导带领下穿过沙漠。'});
});

test('CET4 noun examples, comparative collocation and nuclear science wording stay corrected',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 assert.match(byWord.get('bloom').text,/in full bloom/);
 assert.match(byWord.get('brown').text,/chose brown/);
 assert.match(byWord.get('bulb').text,/light bulb/);
 assert.match(byWord.get('atomic').text,/nuclei/);
 assert.match(byWord.get('color').text,/color of the walls/);
 assert.match(byWord.get('comparative').text,/comparative study/);
});

test('CET4 next batch keeps noun senses, transitive verbs, natural collocations and accurate translations',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 assert.match(byWord.get('conquest').text,/conquest of the city/);
 assert.match(byWord.get('convenience').text,/For convenience/);
 assert.equal(byWord.get('crust').text,byWord.get('crust').before_text);
 assert.match(byWord.get('crust').translation,/为孩子们把三明治的面包边切掉/);
 assert.match(byWord.get('dairy').text,/runs a small dairy/);
 assert.match(byWord.get('dissolve').text,/dissolve the sugar/);
 assert.match(byWord.get('drain').text,/drained the water/);
 assert.match(byWord.get('drum').text,/played the drum/);
});

test('CET4 source-specific D/E corrections retain natural bilingual examples and explicit senses',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 assert.deepEqual([byWord.get("drill").text,byWord.get("drill").translation,byWord.get("drill").selected_sense],["The school held a fire drill on Friday.","学校周五举行了一次消防演习。","操练（名词）"]);
 assert.deepEqual([byWord.get("effective").text,byWord.get("effective").translation,byWord.get("effective").selected_sense],["The new training method proved effective for beginners.","这种新训练方法对初学者很有效。","有效的（形容词）"]);
 assert.deepEqual([byWord.get("either").text,byWord.get("either").translation,byWord.get("either").selected_sense],["Either of the two answers is acceptable.","两个答案中的任何一个都可以。","两者中的任何一个（代词）"]);
 assert.deepEqual([byWord.get("elementary").text,byWord.get("elementary").translation,byWord.get("elementary").selected_sense],["The course covers elementary mathematics.","这门课程教授初等数学。","初级的（形容词）"]);
 assert.deepEqual([byWord.get("end").text,byWord.get("end").translation,byWord.get("end").selected_sense],["We reached the end of the road before sunset.","我们在日落前走到了路的尽头。","末端（名词）"]);
 assert.deepEqual([byWord.get("endure").text,byWord.get("endure").translation,byWord.get("endure").selected_sense],["The hikers endured hours of heavy rain.","徒步者们忍受了数小时的大雨。","忍受（及物动词）"]);
 assert.deepEqual([byWord.get("engage").text,byWord.get("engage").translation,byWord.get("engage").selected_sense],["The company engaged a local engineer to inspect the bridge.","这家公司聘请了一名当地工程师检查桥梁。","聘用（及物动词）"]);
 assert.deepEqual([byWord.get("entry").text,byWord.get("entry").translation,byWord.get("entry").selected_sense],["Entry to the museum is free on Sundays.","每逢周日，进入博物馆无需购票。","进入（名词）"]);
 assert.deepEqual([byWord.get("establishment").text,byWord.get("establishment").translation,byWord.get("establishment").selected_sense],["The establishment of the new research center required government approval.","设立新的研究中心需要政府批准。","设立（名词）"]);
 assert.deepEqual([byWord.get("everything").text,byWord.get("everything").translation,byWord.get("everything").selected_sense],["Everything on the desk belongs to the teacher.","桌上的所有东西都属于老师。","所有东西（代词）"]);
 assert.deepEqual([byWord.get("evolve").text,byWord.get("evolve").translation,byWord.get("evolve").selected_sense],["The company evolved its business model to meet changing customer needs.","该公司逐步调整业务模式，以适应不断变化的客户需求。","使发展（及物动词）"]);
 assert.deepEqual([byWord.get("excess").text,byWord.get("excess").translation,byWord.get("excess").selected_sense],["An excess of salt can spoil the soup.","盐放得太多会破坏汤的味道。","过量（名词）"]);
 assert.equal(byWord.get('effective').before_text,byWord.get('effective').text);
 assert.notEqual(byWord.get('everything').text,byWord.get('everything').before_text);
});


test('CET4 F-word editorial fixes respect source parts of speech and natural bilingual wording',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
   "exercise": [
     "Regular exercise helps me sleep better.",
     "规律锻炼有助于我睡得更好。",
     "锻炼（名词）"
   ],
   "excursion": [
     "We went on an excursion to the coast.",
     "我们去海边进行了一次短途旅行。",
     "短途旅行（名词）"
   ],
   "faith": [
     "She has faith in her team's ability.",
     "她相信自己团队的能力。",
     "信任、信心（名词）"
   ],
   "fast": [
     "The fast train reached the station before noon.",
     "快车在中午前到达了车站。",
     "快的（形容词）"
   ],
   "fate": [
     "No one knew the fate of the missing crew.",
     "没有人知道失踪船员的命运。",
     "命运、结局（名词）"
   ],
   "fear": [
     "Fear of failure kept him from applying.",
     "对失败的恐惧让他不敢申请。",
     "害怕、恐惧（名词）"
   ],
   "feel": [
     "She felt the fabric to check its texture.",
     "她摸了摸布料，感受它的质地。",
     "触摸（及物动词）"
   ],
   "fellow": [
     "He is a kind fellow who always helps his neighbours.",
     "他是个善良的人，总是帮助邻居。",
     "人、家伙（名词）"
   ],
   "female": [
     "In this species, the female lays her eggs in the sand.",
     "在这个物种中，雌性在沙中产卵。",
     "雌性动物（名词）"
   ]
 };
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
 }
 assert.equal(byWord.get('faith').text.includes("team's"),true);
 assert.equal(byWord.get('exercise').text.startsWith('Regular exercise'),true);
 assert.equal(byWord.get('female').text.includes('the female lays'),true);
});


test('CET4 G-word editorial examples stay aligned to source POS and bilingual senses',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "gas": [
    "The stove runs on natural gas.",
    "这台炉灶使用天然气。",
    "煤气、天然气（名词）"
  ],
  "gauge": [
    "The mechanic gauged the tyre pressure before the trip.",
    "出发前，机械师测量了轮胎气压。",
    "测量（及物动词）"
  ],
  "general": [
    "The teacher gave a general introduction to the topic.",
    "老师对这个主题作了概括介绍。",
    "总的、概括的（形容词）"
  ],
  "giant": [
    "In the fairy tale, a giant lived in a castle.",
    "在这则童话中，一个巨人住在城堡里。",
    "巨人（名词）"
  ],
  "glare": [
    "The driver glared at the cyclist after the argument.",
    "争执过后，司机怒视着那名骑车人。",
    "怒视（不及物动词）"
  ],
  "glass": [
    "The window is made of thick glass.",
    "这扇窗户是用厚玻璃制成的。",
    "玻璃（名词）"
  ],
  "glide": [
    "The skater glided smoothly across the ice.",
    "滑冰者平稳地滑过冰面。",
    "滑行（不及物动词）"
  ],
  "glitter": [
    "The snow glittered in the morning sunlight.",
    "积雪在清晨的阳光下闪闪发光。",
    "闪闪发光（不及物动词）"
  ],
  "goodness": [
    "The story reminds us of the goodness in ordinary people.",
    "这个故事让我们想起普通人身上的善良。",
    "善良、仁慈（名词）"
  ],
  "graduate": [
    "The new graduate applied for her first job.",
    "这名刚毕业的学生申请了她的第一份工作。",
    "毕业生（名词）"
  ],
  "grave": [
    "They placed fresh flowers on her grave.",
    "他们在她的墓前放上了鲜花。",
    "坟墓（名词）"
  ],
  "grasp": [
    "She grasped the handle firmly before opening the door.",
    "开门前，她牢牢握住门把手。",
    "抓紧、握牢（及物动词）"
  ]
};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
 }
 assert.equal(byWord.get('giant').pos,'n.');
 assert.equal(byWord.get('gauge').pos,'vt.');
 assert.equal(byWord.get('goodness').meaning.includes('仁慈'),true);
});


test('CET4 H-word edits use natural single-sense sentences and matching translations',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
   "halt": [
     "The train halted at a red signal.",
     "火车在红色信号灯前停了下来。",
     "停止（不及物动词）"
   ],
   "hammer": [
     "She used a hammer to drive a nail into the board.",
     "她用锤子把一颗钉子钉进木板。",
     "锤子（名词）"
   ],
   "hand": [
     "She raised her hand to ask a question.",
     "她举起手来提问。",
     "手（名词）"
   ],
   "handle": [
     "The door handle was loose, so he tightened the screws.",
     "门把手松了，于是他拧紧了螺丝。",
     "把手（名词）"
   ],
   "harbour": [
     "The fishing boats returned to the harbour before sunset.",
     "渔船在日落前返回了港口。",
     "港口（名词）"
   ],
   "hard": [
     "The ground was too hard to dig.",
     "地面太硬，挖不动。",
     "坚硬的（形容词）"
   ],
   "harsh": [
     "The teacher's harsh criticism upset the student.",
     "老师严厉的批评让那名学生很难过。",
     "严厉的（形容词）"
   ],
   "hear": [
     "I could hear footsteps outside the door.",
     "我能听见门外的脚步声。",
     "听见（及物动词）"
   ],
   "heat": [
     "The heat from the fire kept us warm.",
     "火堆散发的热量让我们感到暖和。",
     "热量（名词）"
   ],
   "herd": [
     "A herd of cattle crossed the road.",
     "一群牛穿过了公路。",
     "兽群、牧群（名词）"
   ],
   "hire": [
     "We hired bicycles to explore the town.",
     "我们租了自行车游览小镇。",
     "租借（及物动词）"
   ],
   "honey": [
     "She added a spoonful of honey to her tea.",
     "她往茶里加了一勺蜂蜜。",
     "蜂蜜（名词）"
   ],
   "hook": [
     "He hung his coat on a hook by the door.",
     "他把外套挂在门边的挂钩上。",
     "挂钩（名词）"
   ],
   "horizon": [
     "The sun disappeared below the horizon.",
     "太阳落到了地平线以下。",
     "地平线（名词）"
   ]
 };
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  assert.notEqual(item.text,item.before_text,word+' should replace the mechanical draft');
 }
});


test('CET4 I-word editorial fixes preserve source identities, meanings and translations',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={"ice":["She dropped two ice cubes into the glass.","她往玻璃杯里放了两块冰。","冰、冰块（名词）"],
"image":["The camera captured a clear image of the moon.","相机拍下了一张清晰的月球图像。","图像（名词）"],
"imaginary":["The child drew an imaginary island on the map.","孩子在地图上画了一座想象中的岛屿。","想象中的（形容词）"],
"imagination":["Reading stories can stimulate a child's imagination.","阅读故事可以激发孩子的想象力。","想象力（名词）"],
"import":["The company imports coffee beans from Brazil.","这家公司从巴西进口咖啡豆。","进口（及物动词）"],
"in":["The keys are in the top drawer.","钥匙在最上面的抽屉里。","在……里面（介词）"],
"incline":["The cyclists struggled up the steep incline.","骑行者们艰难地骑上陡坡。","斜坡（名词）"],
"increase":["The school plans to increase library opening hours.","学校计划延长图书馆的开放时间。","增加（及物动词）"],
"influence":["Her advice had a strong influence on my decision.","她的建议对我的决定产生了很大影响。","影响（名词）"],
"insult":["His rude remark was an insult to the volunteers.","他无礼的话是对志愿者的侮辱。","侮辱（名词）"],
"interest":["She developed an interest in astronomy.","她渐渐对天文学产生了兴趣。","兴趣（名词）"],
"inward":["The door swung inward when she pushed it.","她一推，门就向内打开了。","向内（副词）"],
"issue":["The report raises an important issue.","这份报告提出了一个重要问题。","问题、议题（名词）"],
"intelligent":["The intelligent student solved the puzzle quickly.","这名聪明的学生很快解开了谜题。","聪明的（形容词）"],
"institution":["Marriage is a social institution in many cultures.","在许多文化中，婚姻是一种社会制度。","制度（名词）"],
"implication":["His reply carried the implication that he would refuse the offer.","他的回答暗示他会拒绝这项提议。","暗示、言外之意（名词）"],
"instant":["For an instant, everyone in the room fell silent.","有那么一瞬间，房间里所有人都安静了下来。","瞬间（名词）"],
"intellectual":["Solving the puzzle required considerable intellectual effort.","解开这道谜题需要付出相当多的脑力。","智力的（形容词）"]};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  assert.notEqual(item.text,item.before_text,word);
 }
});


test('CET4 J/K/L targeted sense corrections match source meanings and preserve source-locked drafts',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "keep": [
    "He kept going despite the heavy rain.",
    "尽管下着大雨，他还是坚持走了下去。",
    "坚持（keep going，持续行动）"
  ],
  "junior": [
    "The junior pupils studied in a separate classroom.",
    "年纪较小的学生在另一间教室上课。",
    "年少的（形容词）"
  ],
  "lazy": [
    "He was too lazy to wash the dishes.",
    "他懒得洗碗。",
    "懒惰的（形容词）"
  ],
  "librarian": [
    "The head librarian announced the library's new opening hours.",
    "图书馆馆长公布了新的开放时间。",
    "图书馆馆长（名词，head librarian）"
  ],
  "lighten": [
    "The morning sunlight lightened the dark room.",
    "清晨的阳光使昏暗的房间亮了起来。",
    "照亮、使明亮（及物动词）"
  ],
  "lively": [
    "The lively puppy chased a ball across the yard.",
    "那只活泼的小狗追着球跑过院子。",
    "活泼的（形容词）"
  ],
  "link": [
    "The blacksmith replaced a broken link in the chain.",
    "铁匠更换了链条上一个断裂的链环。",
    "链环（名词）"
  ],
  "limb": [
    "The doctor examined the injured limb carefully.",
    "医生仔细检查了受伤的肢体。",
    "肢体（名词）"
  ],
  "kilometer": [
    "The village is about five kilometers from the station.",
    "这个村庄离车站大约五公里。",
    "公里（名词，美式拼写）"
  ],
  "license": [
    "You need a license to fish in this river.",
    "在这条河里钓鱼需要许可证。",
    "许可证（名词，美式拼写）"
  ],
  "likewise": [
    "She signed the form, and her colleague did likewise.",
    "她在表格上签了字，同事也照做了。",
    "同样地、也（副词）"
  ]
};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
 }
 assert.equal(byWord.get('kilometer').before_translation,byWord.get('kilometer').translation);
 assert.equal(byWord.get('license').before_translation,byWord.get('license').translation);
});


test('CET4 L/M source-locked corrections retain natural bilingual senses and target words',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "maintenance": [
    "The machine needs regular maintenance to run safely.",
    "机器需要定期维护才能安全运行。",
    "维修、保养（名词）"
  ],
  "magic": [
    "The children were amazed by the magic on stage.",
    "孩子们对舞台上的魔术表演感到惊叹。",
    "魔术、戏法（名词）"
  ],
  "loosen": [
    "He loosened the knot so the rope could be untied.",
    "他把绳结弄松，以便解开绳子。",
    "使松开（及物动词）"
  ],
  "lumber": [
    "The carpenter selected dry lumber for the new shelves.",
    "木匠挑选了干燥的木料来制作新架子。",
    "木材（名词）"
  ],
  "lump": [
    "She dropped a lump of sugar into her tea.",
    "她往茶里放了一块方糖。",
    "块（名词）"
  ],
  "manly": [
    "He spoke in a calm, manly voice.",
    "他说话时声音沉稳，带着男子气概。",
    "有男子气概的（形容词）"
  ],
  "marvelous": [
    "We had a marvelous view of the mountains from the window.",
    "从窗户望出去，群山景色美极了。",
    "极好的、了不起的（形容词）"
  ],
  "marine": [
    "Marine animals are affected by plastic pollution.",
    "海洋动物受到塑料污染的影响。",
    "海洋的（形容词）"
  ],
  "marriage": [
    "Their marriage has lasted more than twenty years.",
    "他们的婚姻已经持续了二十多年。",
    "婚姻（名词）"
  ],
  "melt": [
    "The snow began to melt when the sun came out.",
    "太阳出来后，积雪开始融化。",
    "融化（不及物动词）"
  ],
  "mate": [
    "My mate helped me carry the heavy boxes.",
    "我的伙伴帮我搬那些沉重的箱子。",
    "伙伴（名词，英式口语）"
  ],
  "lower": [
    "She lowered the blinds to block the afternoon sun.",
    "她放下百叶窗，挡住午后的阳光。",
    "放下、降低（及物动词）"
  ]
};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
 }
 assert.doesNotMatch(byWord.get('maintenance').before_text,/maintenance/i);
 assert.doesNotMatch(byWord.get('magic').before_text,/\bmagic\b/i);
});


test('CET4 M/N source-locked examples preserve spelling, noun senses and natural bilingual usage',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "liter": [
    "The bottle holds one liter of water.",
    "这个瓶子能装一升水。",
    "升（名词，美式拼写）"
  ],
  "mail": [
    "Your letter arrived in this morning's mail.",
    "今天早上的邮件中有你的来信。",
    "邮件（名词）"
  ],
  "maintain": [
    "Technicians maintain the machines to prevent breakdowns.",
    "技术人员维护机器，以防发生故障。",
    "维修、维护（及物动词）"
  ],
  "manner": [
    "His rude manner upset the guests.",
    "他粗鲁的态度让客人们感到不快。",
    "态度（名词）"
  ],
  "march": [
    "The soldiers marched through the town at dawn.",
    "士兵们黎明时分列队穿过城镇。",
    "行军（不及物动词）"
  ],
  "maximum": [
    "The lift can carry a maximum of eight passengers.",
    "这部电梯最多可搭载八名乘客。",
    "最大量（名词）"
  ],
  "medium": [
    "Radio became an important medium for sharing news.",
    "广播成为传播新闻的重要媒介。",
    "媒介（名词）"
  ],
  "merchant": [
    "The merchant sold spices to sailors from distant ports.",
    "这位商人向来自远方港口的水手出售香料。",
    "商人（名词）"
  ],
  "mercury": [
    "The old thermometer used mercury to measure temperature.",
    "旧式温度计使用水银测量温度。",
    "水银（名词）"
  ],
  "molecule": [
    "A water molecule consists of two hydrogen atoms and one oxygen atom.",
    "一个水分子由两个氢原子和一个氧原子组成。",
    "分子（名词）"
  ],
  "Mister": [
    "Excuse me, mister, is this your umbrella?",
    "打扰一下，先生，这是您的雨伞吗？",
    "先生（名词，称呼语）"
  ],
  "mount": [
    "She mounted the horse and rode toward the gate.",
    "她骑上马，朝大门方向走去。",
    "登上（及物动词）"
  ],
  "mutter": [
    "She muttered to herself as she searched for her keys.",
    "她一边找钥匙，一边低声自言自语。",
    "低声嘟囔（不及物动词）"
  ],
  "neat": [
    "Her notes were neat and easy to read.",
    "她的笔记工整清晰，容易阅读。",
    "整洁、工整（形容词）"
  ],
  "mechanically": [
    "He repeated the answer mechanically without understanding it.",
    "他不理解答案的意思，只是机械地重复了一遍。",
    "机械地（副词）"
  ]
};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
 }
 assert.equal(byWord.get('liter').source_raw.startsWith('liter ['),true);
 assert.equal(byWord.get('maximum').pos,'n.');
 assert.equal(byWord.get('medium').pos,'n.');
});


test('CET4 N/O source-locked corrections match original senses and natural bilingual usage',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "naturally": [
    "Her hair curls naturally.",
    "她的头发天生卷曲。",
    "天然地（副词）"
  ],
  "necessity": [
    "The accident showed the necessity of regular safety checks.",
    "这次事故说明了定期安全检查的必要性。",
    "必要性（名词）"
  ],
  "none": [
    "None of the students knew the answer.",
    "没有一个学生知道答案。",
    "没有人（代词）"
  ],
  "nod": [
    "She nodded her approval of the plan.",
    "她点头表示赞同这项计划。",
    "点头表示（及物动词）"
  ],
  "noble": [
    "His noble actions earned the respect of the villagers.",
    "他的高尚行为赢得了村民们的尊敬。",
    "高尚的（形容词）"
  ],
  "operate": [
    "The surgeon operated for three hours.",
    "外科医生做了三个小时的手术。",
    "施行手术（不及物动词）"
  ],
  "oral": [
    "The students took an oral exam in English.",
    "学生们参加了英语口试。",
    "口头的（形容词）"
  ],
  "orderly": [
    "The students left the classroom in an orderly manner.",
    "学生们有秩序地离开了教室。",
    "有秩序的（形容词）"
  ],
  "organize": [
    "The volunteers organized a charity concert.",
    "志愿者组织了一场慈善音乐会。",
    "组织（及物动词）"
  ]
};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
 }
 assert.equal(byWord.get('none').pos,'pron.');
 assert.equal(byWord.get('nod').pos,'vt.');
 assert.equal(byWord.get('operate').pos,'vi.');
 assert.equal(byWord.get('organize').pos,'vt.');
});


test('CET4 O/P edits match source-locked senses, translations and POS',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "organic": [
    "Organic matter from fallen leaves enriches the soil.",
    "落叶形成的有机物质能使土壤更加肥沃。",
    "生物来源的有机物质（形容词）"
  ],
  "pacific": [
    "The Pacific is the largest ocean on Earth.",
    "太平洋是地球上最大的海洋。",
    "太平洋（专有名词）"
  ],
  "pack": [
    "Fans packed the stadium for the final.",
    "决赛时，球迷们挤满了体育场。",
    "挤满（及物动词）"
  ],
  "pardon": [
    "The governor granted the prisoner a pardon.",
    "州长赦免了这名囚犯。",
    "赦免（名词）"
  ],
  "pant": [
    "With a tired pant, she sat down after the race.",
    "比赛结束后，她喘着气坐了下来。",
    "喘息（名词）"
  ],
  "perform": [
    "The choir will perform a new song at the festival.",
    "合唱团将在节庆活动上演唱一首新歌。",
    "演出、表演（及物动词）"
  ],
  "physical": [
    "The students measured the physical properties of the metal.",
    "学生们测量了这种金属的物理性质。",
    "物理的（形容词）"
  ],
  "piano": [
    "He plays the piano every evening.",
    "他每天晚上都弹钢琴。",
    "钢琴（名词）"
  ],
  "powerful": [
    "The powerful engine pulled the train up the hill.",
    "强劲的发动机把火车牵引上了山坡。",
    "强有力的（形容词）"
  ],
  "practise": [
    "She practises scales on the piano every morning.",
    "她每天早上都在钢琴上练习音阶。",
    "练习（及物动词，英式拼写）"
  ]
};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
 }
 assert.equal(byWord.get('pant').pos,'n.');
 assert.equal(byWord.get('perform').pos,'vt.');
 assert.equal(byWord.get('pack').pos,'vt.');
 assert.equal(byWord.get('physical').pos,'a.');
});


test('CET4 P/Q editorial corrections retain exact source senses, POS and bilingual meanings',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "pretty": [
    "The actress wore a pretty blue dress to the ceremony.",
    "这位女演员穿着一条漂亮的蓝色连衣裙参加典礼。",
    "漂亮的（形容词）"
  ],
  "quicken": [
    "The sound of thunder quickened their pace.",
    "雷声使他们加快了脚步。",
    "加快（及物动词）"
  ],
  "quote": [
    "She quoted a line from the poem in her speech.",
    "她在演讲中引用了这首诗中的一句话。",
    "引用（及物动词）"
  ],
  "punishment": [
    "The punishment for cheating was a one-week suspension.",
    "作弊的处罚是停学一周。",
    "处罚（名词）"
  ],
  "psychological": [
    "The accident had a lasting psychological effect on the driver.",
    "那次事故给司机造成了持久的心理影响。",
    "心理的（形容词）"
  ],
  "publication": [
    "The publication of the report was delayed until Monday.",
    "报告的公布被推迟到了星期一。",
    "公布（名词）"
  ],
  "pursuit": [
    "The pursuit of knowledge requires patience and curiosity.",
    "追求知识需要耐心和好奇心。",
    "追求（名词）"
  ],
  "pursue": [
    "The detective pursued the suspect through the narrow streets.",
    "侦探沿着狭窄的街道追赶嫌疑人。",
    "追赶（及物动词）"
  ],
  "potential": [
    "The engineer identified a potential problem with the bridge.",
    "工程师发现了这座桥可能存在的一个问题。",
    "潜在的（形容词）"
  ],
  "pen": [
    "She filled her fountain pen with blue ink.",
    "她给钢笔灌了蓝墨水。",
    "钢笔（名词）"
  ]
};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
 }
 assert.equal(byWord.get('pretty').pos,'a.');
 assert.equal(byWord.get('quicken').pos,'vt.');
 assert.equal(byWord.get('quote').pos,'vt.');
 assert.equal(byWord.get('publication').pos,'n.');
});


test('CET4 R/S editorial fixes keep exact source POS, single senses and bilingual alignment',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "rapid": [
    "The city experienced rapid growth over the past decade.",
    "过去十年，这座城市发展迅速。",
    "快速的（形容词）"
  ],
  "reading": [
    "She enjoys reading before going to bed.",
    "她喜欢睡前阅读。",
    "阅读（名词）"
  ],
  "receiver": [
    "The receiver signed for the parcel at the door.",
    "收件人在门口签收了包裹。",
    "收件人（名词）"
  ],
  "refusal": [
    "Her refusal to sign the contract surprised everyone.",
    "她拒绝签署合同让所有人感到意外。",
    "拒绝（名词）"
  ],
  "reliance": [
    "She placed great reliance on her team's judgment.",
    "她非常信赖团队的判断。",
    "信赖（名词）"
  ],
  "relax": [
    "The warm bath relaxed his tense muscles.",
    "热水澡使他紧绷的肌肉放松下来。",
    "使松弛（及物动词）"
  ],
  "render": [
    "The power failure rendered the lift unusable.",
    "停电使电梯无法使用。",
    "使得（及物动词）"
  ],
  "representative": [
    "The survey used a representative sample of local households.",
    "这项调查使用了当地家庭的代表性样本。",
    "代表性的（形容词）"
  ],
  "resident": [
    "The resident population has grown steadily over the past decade.",
    "过去十年，这里的常住人口稳步增长。",
    "常住的（形容词）"
  ],
  "resign": [
    "She resigned her position to care for her family.",
    "她辞去职务，以便照顾家人。",
    "放弃职位（及物动词）"
  ],
  "rotate": [
    "The wheels rotate slowly when the machine starts.",
    "机器启动时，轮子缓慢旋转。",
    "旋转（不及物动词）"
  ],
  "rot": [
    "Constant moisture can rot the wooden beams.",
    "持续受潮会使木梁腐烂。",
    "使腐烂（及物动词）"
  ],
  "reward": [
    "She received a reward for returning the lost wallet.",
    "她因归还丢失的钱包而获得了一笔酬谢。",
    "报酬、酬谢（名词）"
  ],
  "sadly": [
    "She spoke sadly about losing her childhood home.",
    "她悲伤地谈起失去童年故居的事。",
    "悲伤地（副词）"
  ],
  "ruler": [
    "She used a ruler to measure the width of the page.",
    "她用直尺测量纸张的宽度。",
    "直尺（名词）"
  ]
};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
 }
 for(const word of ['rapid','representative','resident'])assert.equal(byWord.get(word).pos,'a.');
 for(const word of ['relax','render','resign','rot'])assert.equal(byWord.get(word).pos,'vt.');
 assert.equal(byWord.get('rotate').pos,'vi.');
 assert.equal(byWord.get('sadly').pos,'ad.');
});


test('CET4 S/T editorial fixes preserve source identity, POS and bilingual target senses',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "scare": [
    "The sudden noise scared the children.",
    "突然的响声吓到了孩子们。",
    "惊吓（及物动词）"
  ],
  "score": [
    "Her score on the quiz was the highest in the class.",
    "她在这次小测中的成绩是全班最高的。",
    "成绩（名词）"
  ],
  "search": [
    "The rescue team searched the forest for the missing hikers.",
    "救援队在森林里搜寻失踪的徒步者。",
    "搜寻（及物动词）"
  ],
  "shave": [
    "He shaved his beard before the interview.",
    "他在面试前刮了胡子。",
    "刮胡子（及物动词）"
  ],
  "shoot": [
    "The archer shot an arrow at the target.",
    "弓箭手朝靶子射出了一支箭。",
    "发射（及物动词）"
  ],
  "taste": [
    "She tasted the soup before adding salt.",
    "她加盐前尝了尝汤。",
    "尝（及物动词）"
  ],
  "terror": [
    "The sudden explosion filled the crowd with terror.",
    "突如其来的爆炸让人群陷入恐惧。",
    "惊恐（名词）"
  ],
  "text": [
    "The students read the text aloud in class.",
    "学生们在课堂上大声朗读课文。",
    "课文（名词）"
  ],
  "thrill": [
    "A thrill ran through her when she heard the good news.",
    "听到好消息时，她感到一阵激动。",
    "一阵激动（名词）"
  ],
  "tire": [
    "The hikers began to tire after several hours on the trail.",
    "走了几个小时的山路后，徒步者们开始感到疲倦。",
    "疲劳（不及物动词）"
  ],
  "trial": [
    "The clinical trial involved 200 volunteers.",
    "这项临床试验有200名志愿者参加。",
    "试验（名词）"
  ],
  "treat": [
    "The staff treated every visitor with respect.",
    "工作人员以尊重的态度对待每位来访者。",
    "对待（及物动词）"
  ],
  "tube": [
    "The scientist poured the liquid into a glass tube.",
    "科学家把液体倒进一根玻璃管。",
    "管（名词）"
  ],
  "tune": [
    "She hummed a familiar tune while cooking.",
    "她做饭时哼着一支熟悉的曲子。",
    "曲调（名词）"
  ],
  "twin": [
    "Her twin brother studies at the same university.",
    "她的孪生兄弟也在同一所大学读书。",
    "孪生的（形容词）"
  ]
};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
 }
 for(const word of ['scare','search','shave','shoot','taste','treat'])assert.equal(byWord.get(word).pos,'vt.');
 assert.equal(byWord.get('tire').pos,'vi.');
 for(const word of ['score','terror','text','thrill','trial','tube','tune'])assert.equal(byWord.get(word).pos,'n.');
 assert.equal(byWord.get('twin').pos,'a.');
});


test('CET4 S/T/U candidate sense fixes preserve source binding and natural bilingual wording',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "spare": [
    "She keeps a spare key in her bag.",
    "她在包里放着一把备用钥匙。",
    "备用的（形容词）"
  ],
  "still": [
    "The water in the pond was perfectly still.",
    "池塘里的水一动不动。",
    "静止的（形容词）"
  ],
  "suffer": [
    "The village suffered severe damage during the storm.",
    "暴风雨期间，这个村庄遭受了严重损失。",
    "遭受损失（及物动词）"
  ],
  "tough": [
    "The tough climber continued despite the freezing wind.",
    "这位坚韧的登山者顶着刺骨寒风继续前进。",
    "坚韧的（形容词）"
  ],
  "tiny": [
    "A tiny spider crawled across the window.",
    "一只极小的蜘蛛爬过窗户。",
    "极小的（形容词）"
  ],
  "tongue": [
    "She burned her tongue on the hot soup.",
    "她喝热汤时烫伤了舌头。",
    "舌头（名词）"
  ],
  "uncover": [
    "She uncovered the pot to check the soup.",
    "她揭开锅盖查看汤煮得怎么样。",
    "揭开盖子（及物动词）"
  ],
  "universal": [
    "The desire for safety is universal.",
    "对安全的渴望是普遍存在的。",
    "普遍的（形容词）"
  ],
  "upset": [
    "The dog upset a bowl of water on the floor.",
    "狗打翻了地板上的一碗水。",
    "打翻（及物动词）"
  ],
  "utility": [
    "The utility of the new tool became clear during the repair.",
    "维修过程中，这件新工具的实用价值显现了出来。",
    "实用价值（名词）"
  ]
};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
 }
 for(const word of ['spare','still','tough','tiny','universal'])assert.match(byWord.get(word).pos,/^(a\.|vt\.)/);
 for(const word of ['suffer','uncover','upset'])assert.equal(byWord.get(word).pos,'vt.');
 for(const word of ['tongue','utility'])assert.equal(byWord.get(word).pos,'n.');
});

test('CET4 U/V/W editorial fixes match source primary POS and preserve bilingual candidate provenance',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
   "upon": [
     "A small bird landed upon the fence.",
     "一只小鸟落在篱笆上。",
     "在……上（介词）"
   ],
   "vacuum": [
     "The scientists created a vacuum inside the chamber.",
     "科学家们在密闭容器内制造了真空。",
     "真空（名词）"
   ],
   "value": [
     "The painting has great historical value.",
     "这幅画具有很高的历史价值。",
     "价值（名词）"
   ],
   "vary": [
     "The chef varies the menu according to the season.",
     "厨师根据季节调整菜单。",
     "改变（及物动词）"
   ],
   "vehicle": [
     "The electric vehicle can travel 300 kilometers on one charge.",
     "这辆电动车充一次电可以行驶三百公里。",
     "机动车辆（名词）"
   ],
   "version": [
     "The witness gave a different version of the accident.",
     "证人对这起事故给出了不同的说法。",
     "说法（名词）"
   ],
   "veteran": [
     "The veteran shared stories from his years in the army.",
     "那位退伍军人讲述了自己在军队服役时的经历。",
     "老兵（名词）"
   ],
   "virtually": [
     "The town was virtually deserted after the evacuation.",
     "疏散之后，这座小镇实际上已近乎空无一人。",
     "实际上（副词）"
   ],
   "vital": [
     "The nurse checked the patient's vital signs.",
     "护士检查了病人的生命体征。",
     "生命的（形容词，生命体征）"
   ],
   "waste": [
     "The factory reduced its waste by recycling materials.",
     "工厂通过回收材料减少了废弃物。",
     "废物（名词）"
   ]
 };
 const pos={"upon":"prep.","vacuum":"n.","value":"n.","vary":"vt.","vehicle":"n.","version":"n.","veteran":"n.","virtually":"ad.","vital":"a.","waste":"n."};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  assert.equal(item.pos,pos[word],word);
  assert.notEqual(item.text,item.before_text,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
 }
});


test('CET4 W/X/Y/Z editorial corrections retain source-locked primary senses and bilingual meaning',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
   "waken": [
     "She wakened to the sound of birds singing.",
     "她在鸟儿的歌声中醒来。",
     "醒来（不及物动词）",
     "vi."
   ],
   "weaken": [
     "The long drought weakened the trees.",
     "长期干旱使树木变得衰弱。",
     "削弱（及物动词）",
     "vt."
   ],
   "water": [
     "The water in the glass was still cold.",
     "杯子里的水仍然很凉。",
     "水（名词）",
     "n."
   ],
   "whirl": [
     "The wind whirled the dry leaves across the yard.",
     "风把枯叶吹得在院子里打转。",
     "使回旋（及物动词）",
     "vt."
   ],
   "win": [
     "Our team won despite the heavy rain.",
     "尽管下着大雨，我们队还是赢了。",
     "获胜（不及物动词）",
     "vi."
   ],
   "winter": [
     "The lake freezes over every winter.",
     "每年冬天湖面都会结冰。",
     "冬天（名词）",
     "n."
   ],
   "work": [
     "Her work requires careful attention to detail.",
     "她的工作需要十分注重细节。",
     "工作（名词）",
     "n."
   ],
   "worry": [
     "The sudden silence worried the parents.",
     "突然的寂静让父母感到担忧。",
     "使烦恼（及物动词）",
     "vt."
   ],
   "wreck": [
     "Divers explored the wreck of the old ship.",
     "潜水员探查了那艘旧船的残骸。",
     "残骸（名词）",
     "n."
   ],
   "westward": [
     "The westward route crosses the mountains.",
     "向西的路线穿过群山。",
     "向西的（形容词）",
     "a."
   ],
   "worthless": [
     "The expired tickets were worthless at the gate.",
     "这些过期门票在入口处已经毫无用处。",
     "无价值的、无用的（形容词）",
     "a."
   ],
   "welfare": [
     "The new policy aims to improve children's welfare.",
     "新政策旨在改善儿童的福祉。",
     "幸福、福利（名词）",
     "n."
   ],
   "way": [
     "Can you show me the way to the station?",
     "你能告诉我去车站的路吗？",
     "路、路线（名词）",
     "n."
   ]
 };
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense,item.pos],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.notEqual(item.translation,item.before_translation,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
 }
});

test('CET4 W/Y/Z second pass keeps literal source senses and idiomatic bilingual examples',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
   "withdraw": [
     "The company withdrew its offer after the talks failed.",
     "谈判失败后，公司撤回了报价。",
     "撤回（及物动词）",
     "vt."
   ],
   "within": [
     "The children stayed within the school grounds.",
     "孩子们待在校园范围内。",
     "在……里面（介词，空间范围）",
     "prep."
   ],
   "worth": [
     "The old painting is worth several thousand dollars.",
     "这幅旧画价值数千美元。",
     "值……的（形容词，价值）",
     "a."
   ],
   "wool": [
     "She bought some wool to knit a scarf.",
     "她买了一些毛线来织围巾。",
     "毛线（名词）",
     "n."
   ],
   "wood": [
     "The carpenter stacked the wood in a dry shed.",
     "木匠把木材堆放在干燥的棚屋里。",
     "木头、木材（名词）",
     "n."
   ],
   "zealous": [
     "She was a zealous supporter of the local library.",
     "她是当地这家图书馆的热心支持者。",
     "热心的（形容词）",
     "a."
   ],
   "yes": [
     "\"Yes, I can help,\" she replied.",
     "她回答说：“是的，我可以帮忙。”",
     "是的（应答词）",
     "ad."
   ]
 };
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense,item.pos],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.notEqual(item.translation,item.before_translation,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
 }
});



test('CET4 cross-sense pass aligns eight new words and preserves pre-existing reviewed class/drive corrections',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "free": [
    "I am free to help you this afternoon.",
    "我今天下午有空帮你。",
    "空闲的（形容词）",
    "a.",
    1607,
    "free [friː] a.自由的；空闲的"
  ],
  "form": [
    "The vase has a graceful form.",
    "这只花瓶的造型很优美。",
    "形状（名词）",
    "n.",
    1582,
    "form [fɔːm] n.形式；形状 vt.形成"
  ],
  "register": [
    "The clerk registered the new students on Monday.",
    "职员周一为新生办理了登记。",
    "登记（及物动词）",
    "n.&vt.",
    3310,
    "register [ˈredʒistə] n.&vt.登记，注册"
  ],
  "shift": [
    "The workers shifted the heavy boxes into the storage room.",
    "工人们把沉重的箱子搬进了储藏室。",
    "转移（及物动词）",
    "vt.",
    3656,
    "shift [∫ift] vt.替换，转移 n.转换"
  ],
  "stress": [
    "The stress of the exam kept her awake at night.",
    "考试的压力让她夜里难以入睡。",
    "压力（名词）",
    "n.",
    3960,
    "stress [stres] n.压力；重音 vt.着重"
  ],
  "sustain": [
    "The small farm sustained the family for generations.",
    "这个小农场供养了这家人好几代。",
    "供养（及物动词）",
    "vt.",
    4049,
    "sustain [səsˈtein] vt.支撑；供养；忍受"
  ],
  "solid": [
    "The sample remained solid at room temperature.",
    "样品在室温下保持固态。",
    "固体的、固态的（形容词）",
    "a.",
    3790,
    "solid [ˈsɔlid] a.固体的 n.固体"
  ],
  "strip": [
    "The workers stripped the old paint from the door.",
    "工人们剥掉了门上的旧漆。",
    "剥去（及物动词）",
    "vt.",
    3966,
    "strip [strip] vt.剥；夺去 n.条带"
  ]
};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense,item.pos,item.source_line,item.source_raw],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.notEqual(item.translation,item.before_translation,word);
  assert.deepEqual(reviewedExample(words.find(x=>x.word===word)),{text:item.text,translation:item.translation},word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
 }
 assert.equal(byWord.has('class'),false);
 assert.equal(byWord.has('drive'),false);
 assert.deepEqual(reviewedExample(words.find(x=>x.word==='class')),{text:'Our English class starts at nine tomorrow.',translation:'我们明天的英语课九点开始。'});
 assert.deepEqual(reviewedExample(words.find(x=>x.word==='drive')),{text:'She learned to drive on the quiet roads near her home.',translation:'她在家附近安静的道路上学会了开车。'});
});


test('CET4 E-H mechanical dual-sense sentences are replaced by source-matched natural examples',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "each": [
    "各个（限定词）",
    "Each student received a card at the entrance.",
    "每位学生都在入口处领到了一张卡片。"
  ],
  "extra": [
    "额外的（形容词）",
    "We stayed an extra night because of the storm.",
    "由于暴风雨，我们多住了一晚。"
  ],
  "fourth": [
    "第四（序数词）",
    "She finished fourth in the race.",
    "她在比赛中获得了第四名。"
  ],
  "front": [
    "前面的（形容词）",
    "The front door of the house was painted blue.",
    "房子的前门被漆成了蓝色。"
  ],
  "further": [
    "更远地（副词）",
    "We walked further along the river before stopping.",
    "我们沿着河岸又向前走了一段才停下。"
  ],
  "gold": [
    "金制的（形容词）",
    "The museum displayed a gold coin from ancient Rome.",
    "博物馆展出了一枚古罗马金币。"
  ],
  "green": [
    "绿色的（形容词）",
    "She wore a green scarf on the cold morning.",
    "那个寒冷的早晨，她戴着一条绿色围巾。"
  ],
  "guard": [
    "卫兵、警卫（名词）",
    "A guard stood at the museum entrance all night.",
    "一名警卫整夜守在博物馆入口处。"
  ],
  "guess": [
    "猜测（及物动词）",
    "Can you guess which box contains the prize?",
    "你能猜出哪个盒子里装着奖品吗？"
  ],
  "harm": [
    "伤害（名词）",
    "Smoking can cause serious harm to the lungs.",
    "吸烟会对肺部造成严重伤害。"
  ],
  "have": [
    "有（及物动词）",
    "They have a small garden behind their house.",
    "他们的房子后面有一个小花园。"
  ],
  "head": [
    "率领（及物动词）",
    "She agreed to head the research team next year.",
    "她同意明年领导这个研究团队。"
  ],
  "high": [
    "高的（形容词）",
    "The climbers rested on a high ridge.",
    "登山者们在一处高高的山脊上休息。"
  ],
  "hit": [
    "碰撞（及物动词）",
    "The ball hit the wall and bounced back.",
    "球撞上墙后弹了回来。"
  ],
  "home": [
    "家（名词）",
    "Their new home is near the river.",
    "他们的新家在河边。"
  ],
  "hope": [
    "希望（及物动词）",
    "We hope the rain stops before the match.",
    "我们希望比赛开始前雨能停。"
  ],
  "hostess": [
    "女主人（名词）",
    "The hostess welcomed her guests with tea and biscuits.",
    "女主人用茶和饼干招待客人。"
  ],
  "hour": [
    "小时（名词）",
    "The train journey takes about an hour.",
    "这趟火车行程大约需要一个小时。"
  ],
  "house": [
    "房屋（名词）",
    "They bought a small house near the station.",
    "他们在车站附近买了一栋小房子。"
  ],
  "household": [
    "家庭（名词）",
    "There are four people in her household.",
    "她家一共有四口人。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  assert.notEqual(item.text,item.before_text,word);
  assert.notEqual(item.translation,item.before_translation,word);
  assert.equal(item.review_scope,'single-source-sense-only');
 }
});


test('CET4 repeated-lemma candidate repairs use one source-matched sense and retain immutable draft provenance',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
   "crack": [
     "裂纹（名词）",
     "A thin crack appeared in the glass near the rim.",
     "玻璃杯杯口附近出现了一道细小的裂纹。",
     "n."
   ],
   "crow": [
     "乌鸦（名词）",
     "A black crow perched on the garden fence.",
     "一只黑色的乌鸦停在花园的篱笆上。",
     "n."
   ],
   "echo": [
     "回声（名词）",
     "We heard an echo in the empty tunnel.",
     "我们在空荡荡的隧道里听到了回声。",
     "n."
   ],
   "fish": [
     "鱼肉（名词）",
     "They grilled fresh fish for dinner.",
     "他们晚餐烤了新鲜的鱼肉。",
     "n."
   ],
   "glow": [
     "白热光（名词）",
     "A white-hot glow came from the metal in the furnace.",
     "炉中的金属发出了白热的光。",
     "n."
   ],
   "groan": [
     "呻吟（不及物动词）",
     "He groaned as he tried to stand up.",
     "他试图站起来时呻吟了一声。",
     "vi."
   ],
   "group": [
     "小组、群（名词）",
     "A small group of students waited outside the library.",
     "一小群学生在图书馆外等候。",
     "n."
   ],
   "harvest": [
     "收成（名词）",
     "Heavy rain damaged the wheat harvest.",
     "大雨使小麦收成受损。",
     "n."
   ],
   "help": [
     "帮助（及物动词）",
     "Her advice helped me solve the problem.",
     "她的建议帮助我解决了问题。",
     "vt."
   ],
   "horn": [
     "角（名词）",
     "The goat caught one horn in the fence.",
     "山羊的一只角卡在了篱笆上。",
     "n."
   ],
   "human": [
     "人类的（形容词）",
     "The museum explores the history of human migration.",
     "这家博物馆展示人类迁徙的历史。",
     "a."
   ],
   "herself": [
     "她亲自（反身代词）",
     "She fixed the broken lamp herself.",
     "她亲自修好了坏掉的台灯。",
     "pron."
   ]
 };
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.selected_sense,item.text,item.translation,item.pos],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.notEqual(item.translation,item.before_translation,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  const originalCandidate=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.equal(originalCandidate.review_status,'unverified-candidate');
  assert.equal(originalCandidate.text,item.before_text);
  assert.equal(originalCandidate.translation,item.before_translation);
  assert.deepEqual(reviewedExample(words.find(x=>x.word===word)),{text:item.text,translation:item.translation},word);
 }
});


test('CET4 high-risk candidate sentences keep one source-locked POS and immutable originals',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "fly": [
    "苍蝇（名词）",
    "A fly landed on the window.",
    "一只苍蝇落在了窗户上。"
  ],
  "grow": [
    "生长（不及物动词）",
    "The seedlings grew quickly in the greenhouse.",
    "幼苗在温室里长得很快。"
  ],
  "hatch": [
    "孵出（及物动词）",
    "The farmer hatched the eggs in an incubator.",
    "农夫用孵化器孵化了这些蛋。"
  ],
  "himself": [
    "他亲自（反身代词）",
    "He repaired the bicycle himself.",
    "他亲自修好了自行车。"
  ],
  "his": [
    "他的东西（代词）",
    "The blue coat is his.",
    "那件蓝色外套是他的。"
  ],
  "hot": [
    "热的（形容词）",
    "The metal handle was too hot to touch.",
    "金属把手太烫，无法触摸。"
  ],
  "hurry": [
    "赶紧（不及物动词）",
    "We hurried to the station before the last train left.",
    "我们赶在末班火车开走前匆忙赶到了车站。"
  ],
  "interior": [
    "内部的（形容词）",
    "The interior walls were painted white.",
    "内墙被漆成了白色。"
  ]
};
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.selected_sense,item.text,item.translation],values,word);
  assert.notEqual(item.text,item.before_text,word);
  assert.notEqual(item.translation,item.before_translation,word);
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.review_scope,'single-source-sense-only');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  const candidate=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.equal(candidate.review_status,'unverified-candidate');
  assert.equal(candidate.text,item.before_text);
  assert.equal(candidate.translation,item.before_translation);
  assert.deepEqual(reviewedExample(words.find(x=>x.word===word)),{text:item.text,translation:item.translation},word);
 }
});


test('CET4 language labels and polysemy repairs match source senses without changing immutable drafts',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
   "French": [
     "法国的（形容词）",
     "The French chef prepared dinner for the guests.",
     "那位法国厨师为客人准备了晚餐。"
   ],
   "German": [
     "德国的（形容词）",
     "A German engineer designed the bridge.",
     "一位德国工程师设计了这座桥。"
   ],
   "Greek": [
     "希腊的（形容词）",
     "The Greek museum displayed ancient pottery.",
     "这家希腊博物馆展出了古代陶器。"
   ],
   "Russian": [
     "俄罗斯的（形容词）",
     "A Russian scientist presented her research at the conference.",
     "一位俄罗斯科学家在会议上介绍了她的研究。"
   ],
   "skim": [
     "略读（及物动词）",
     "She skimmed the report before the meeting.",
     "她在会议前略读了报告。"
   ],
   "split": [
     "劈开（及物动词）",
     "The carpenter split the log with an axe.",
     "木匠用斧头劈开了原木。"
   ],
   "stuff": [
     "填、塞（及物动词）",
     "She stuffed the cushions with cotton.",
     "她把棉花塞进了靠垫里。"
   ],
   "range": [
     "山脉（名词）",
     "The mountain range was covered in snow.",
     "这条山脉被积雪覆盖。"
   ],
   "service": [
     "服务（名词）",
     "The hotel provides excellent service to its guests.",
     "这家酒店为客人提供优质服务。"
   ]
 };
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=byWord.get(word);
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const source=words.find(x=>x.word===word);
  assert.ok(item&&draft&&source,word);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(item.review_scope,'single-source-sense-only');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
 }
});


test('CET4 literal senses and simplified Chinese revisions preserve source-locked original drafts',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
   "centre": [
     "中心（名词）",
     "The town centre is crowded on Saturday mornings.",
     "周六上午，镇中心十分热闹。"
   ],
   "dialog": [
     "对话（名词，源词拼写 dialog）",
     "The play begins with a short dialog between two neighbours.",
     "这出戏以两位邻居之间的一小段对话开场。"
   ],
   "flare": [
     "闪耀（不及物动词）",
     "A bright light flared in the dark sky.",
     "一道亮光在漆黑的天空中突然闪耀。"
   ],
   "escape": [
     "逃跑（不及物动词）",
     "The prisoners escaped through a narrow tunnel.",
     "囚犯们通过一条狭窄的地道逃走了。"
   ],
   "descend": [
     "下来、下降（不及物动词）",
     "The hikers descended slowly into the valley.",
     "徒步者们缓缓下到山谷里。"
   ],
   "gasp": [
     "气喘（不及物动词）",
     "After running up the stairs, she gasped for breath.",
     "跑上楼梯后，她喘着气。"
   ],
   "compel": [
     "迫使（及物动词）",
     "The storm compelled the organizers to cancel the outdoor concert.",
     "暴风雨迫使组织者取消了露天音乐会。"
   ]
 };
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=byWord.get(word),source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&source&&draft,word);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(item.review_scope,'single-source-sense-only');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
 }
});


test('CET4 mixed-POS and mechanical candidate repairs preserve immutable originals and selected source senses',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "damage": [
    "损害（及物动词）",
    "The flood damaged several bridges.",
    "洪水损坏了几座桥梁。"
  ],
  "grade": [
    "评分（及物动词）",
    "The teacher graded the essays over the weekend.",
    "老师在周末给作文评分。"
  ],
  "guide": [
    "导游（名词）",
    "Our guide showed us the oldest part of the city.",
    "导游带我们参观了城里最古老的街区。"
  ],
  "hardware": [
    "计算机硬件（名词）",
    "The technician replaced the damaged computer hardware.",
    "技术人员更换了损坏的计算机硬件。"
  ],
  "harness": [
    "马具、挽具（名词）",
    "The rider checked the horse's harness before setting off.",
    "骑手出发前检查了马的挽具。"
  ],
  "hide": [
    "藏起来（及物动词）",
    "She hid the spare key under a flowerpot.",
    "她把备用钥匙藏在花盆下面。"
  ],
  "housewife": [
    "家庭主妇（名词）",
    "Her mother was a housewife for many years.",
    "她的母亲曾多年担任家庭主妇。"
  ],
  "how": [
    "怎样、怎么（疑问副词）",
    "How did you solve the problem?",
    "你是怎么解决这个问题的？"
  ],
  "her": [
    "她（宾格代词）",
    "I handed her the notebook after class.",
    "下课后我把笔记本交给了她。"
  ],
  "do": [
    "做（及物动词）",
    "She did her homework before dinner.",
    "她在晚饭前完成了家庭作业。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=byWord.get(word),draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&draft&&source,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.review_scope,'single-source-sense-only');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
 }
});


test('CET4 mixed noun and verb candidates use the primary source part of speech without overwriting drafts',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "bargain": [
    "交易（名词）",
    "They struck a bargain over the price of the bicycle.",
    "他们就这辆自行车的价格达成了一笔交易。"
  ],
  "bark": [
    "吠叫声（名词）",
    "A loud bark came from behind the gate.",
    "大门后传来一声响亮的狗叫。"
  ],
  "blast": [
    "爆炸（名词）",
    "The blast shattered the windows of the empty building.",
    "爆炸震碎了那栋空置建筑的窗户。"
  ],
  "bolt": [
    "螺栓（名词）",
    "He tightened the loose bolt with a wrench.",
    "他用扳手拧紧了松动的螺栓。"
  ],
  "brood": [
    "同窝幼鸟（名词）",
    "The mother duck led her brood to the pond.",
    "鸭妈妈领着一窝小鸭走向池塘。"
  ],
  "coil": [
    "一卷（名词）",
    "A coil of rope lay beside the boat.",
    "船旁放着一卷绳子。"
  ],
  "consent": [
    "同意（名词）",
    "The school needs parental consent for the trip.",
    "学校组织这次旅行需要家长同意。"
  ],
  "dread": [
    "畏惧、恐惧（名词）",
    "He felt a sense of dread as the lights went out.",
    "灯熄灭时，他感到一阵恐惧。"
  ],
  "flash": [
    "闪光（名词）",
    "A sudden flash lit up the night sky.",
    "一道突如其来的闪光照亮了夜空。"
  ],
  "tailor": [
    "裁缝（名词）",
    "The tailor measured the customer's waist.",
    "裁缝量了顾客的腰围。"
  ],
  "shriek": [
    "尖声喊叫（不及物动词）",
    "She shrieked when the spider appeared.",
    "蜘蛛出现时，她尖叫起来。"
  ],
  "dash": [
    "使猛撞（及物动词）",
    "The waves dashed the boat against the rocks.",
    "海浪把小船猛地撞向礁石。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=byWord.get(word),source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.review_scope,'single-source-sense-only');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
 }
});


test('CET4 21:12 editorial review fixes primary POS, keeps offensive historic label contextualized, and preserves frozen drafts',()=>{
 const expected={
  "balance": [
    "使平衡（及物动词）",
    "The waiter balanced a tray of drinks on one hand.",
    "服务员用一只手稳稳托住一托盘饮料。"
  ],
  "blaze": [
    "火焰（名词）",
    "A bright blaze lit up the campsite.",
    "一团明亮的火焰照亮了营地。"
  ],
  "brake": [
    "刹车（名词）",
    "The mechanic checked the brakes before the trip.",
    "出发前，机械师检查了刹车。"
  ],
  "cripple": [
    "旧称残障者的名词（现带冒犯性）",
    "The historical document uses the word 'cripple' for a person with a disability.",
    "这份历史文献用“cripple”一词称呼残障人士，但该称呼如今被视为冒犯性用语。"
  ],
  "dial": [
    "钟面（名词）",
    "The clock's dial was marked with Roman numerals.",
    "钟面上标着罗马数字。"
  ],
  "divorce": [
    "离婚（名词）",
    "Their divorce was finalized last month.",
    "他们的离婚手续上个月办妥了。"
  ],
  "dot": [
    "圆点（名词）",
    "She placed a red dot beside the correct answer.",
    "她在正确答案旁边画了一个红点。"
  ],
  "hold": [
    "拿住（及物动词）",
    "She held the folder firmly against her chest.",
    "她把文件夹紧紧抱在胸前。"
  ]
};
 const byWord=new Map(edits.map(x=>[x.word,x]));
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=byWord.get(word),source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&source&&draft,word);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
 }
 assert.match(byWord.get('cripple').translation,/冒犯性/);
});

test('CET4 slow/separate source POS and lemma checks keep frozen candidate drafts',()=>{
 const expected={
  slow:['慢的（形容词）','The slow train took three hours to reach the coast.','这趟慢车花了三个小时才到达海边。'],
  separate:['单独的（形容词）','Keep the clean clothes in a separate bag.','把干净的衣服放在单独的袋子里。']
 };
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&source&&draft,word);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.equal(source.pos,'a.');
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
 }
 assert.doesNotMatch(packs.find(x=>x.word==='slow').text,/\bslow\b/i);
 assert.match(edits.find(x=>x.word==='slow').text,/\bslow\b/i);
});


test('CET4 vote/refer/cement/darling/competent source-sense repairs retain immutable drafts and safe precedence',()=>{
 const expected={
  "vote": [
    "投票（名词）",
    "The final vote will take place on Friday.",
    "最终投票将于星期五举行。"
  ],
  "refer": [
    "谈到（不及物动词）",
    "During the interview, she referred to her first job.",
    "采访中，她谈到了自己的第一份工作。"
  ],
  "cement": [
    "水泥（名词）",
    "The workers used cement to repair the garden wall.",
    "工人们用水泥修补花园的围墙。"
  ],
  "darling": [
    "宠儿（名词）",
    "The youngest child was the darling of the family.",
    "最小的孩子是全家的宠儿。"
  ],
  "competent": [
    "有能力的（形容词）",
    "She is competent to manage the new project.",
    "她有能力管理这个新项目。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&source&&draft,word);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.review_scope,'single-source-sense-only');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
 }
 assert.equal(edits.some(x=>x.word==='apply'),false,'existing corrected meaning and reviewed example must keep priority');
 const applied=words.find(x=>x.word==='apply'&&x.source_file==='cet4.txt');
 assert.deepEqual(reviewedExample(applied),{text:'She plans to apply for a place on the course.',translation:'她打算申请一个课程名额。'});
 assert.equal(edits.find(x=>x.word==='vote').pos,'n.');
 assert.equal(edits.find(x=>x.word==='darling').pos,'n.');
 assert.doesNotMatch(edits.find(x=>x.word==='competent').translation,/[負項]/);
});

test('CET4 discharge/hasten/reverse repairs use explicitly listed source senses and preserve frozen candidates',()=>{
 const expected={
  discharge:['排出（及物动词）','The factory discharged wastewater into the river.','工厂向河里排放了废水。'],
  hasten:['赶紧（不及物动词）','He hastened to answer the phone.','他赶紧去接电话。'],
  reverse:['颠倒（及物动词）','Please reverse the order of the two paragraphs.','请把这两段的顺序颠倒过来。']
 };
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.review_scope,'single-source-sense-only');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
 }
});

test('CET4 setting/shady/trifle/ugly use natural source-matched examples and preserve frozen candidates',()=>{
 const expected={
   "setting": [
     "环境（小说的故事背景，名词）",
     "The novel's setting is a small coastal village.",
     "这部小说的故事背景是一个海滨小村庄。"
   ],
   "shady": [
     "阴凉的（形容词）",
     "We rested in a shady corner of the garden.",
     "我们在花园里一处阴凉的角落休息。"
   ],
   "trifle": [
     "小事，琐事（名词）",
     "She refused to argue over such a trifle.",
     "她不愿为这样一件小事争吵。"
   ],
   "ugly": [
     "丑陋的，难看的（形容词）",
     "An ugly scar ran across his cheek.",
     "一道难看的伤疤横贯他的脸颊。"
   ]
 };
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.review_scope,'single-source-sense-only');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
 }
});


test('CET4 high-risk source-sense audit corrects six misleading examples without changing source or user data',()=>{
 const expected={
  "fall": [
    "落下（不及物动词）",
    "Leaves fall from the trees in autumn.",
    "秋天，树叶从树上落下。"
  ],
  "follow": [
    "跟随（及物动词）",
    "The children followed their teacher into the museum.",
    "孩子们跟着老师走进博物馆。"
  ],
  "give": [
    "送给（及物动词）",
    "She gave her friend a warm scarf.",
    "她送给朋友一条暖和的围巾。"
  ],
  "resistant": [
    "抵抗的，反抗的（形容词）",
    "The workers were resistant to the new rules.",
    "工人们对新规定持抵制态度。"
  ],
  "strike": [
    "击中（及物动词）",
    "Lightning struck the old tree during the storm.",
    "暴风雨中，闪电击中了那棵老树。"
  ],
  "very": [
    "很（副词）",
    "The water was very cold when we arrived.",
    "我们到达时，水很冷。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.review_scope,'single-source-sense-only');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
 }
 assert.equal(edits.find(x=>x.word==='strike').pos,'vt.&vi.');
 assert.equal(edits.find(x=>x.word==='very').pos,'ad.');
});


test('CET4 next source-sense pass fixes four high-risk candidates without modifying frozen drafts',()=>{
 const expected={
  "peculiar": [
    "特有的（形容词）",
    "This bird has a call peculiar to its species.",
    "这种鸟的叫声是该物种特有的。"
  ],
  "privilege": [
    "特权（名词）",
    "Only senior members had the privilege of entering the archive.",
    "只有资深会员才享有进入档案室的特权。"
  ],
  "south": [
    "南部（名词）",
    "The south of the island is warmer in winter.",
    "这个岛的南部冬天更暖和。"
  ],
  "suck": [
    "吸（及物动词）",
    "She sucked juice through a straw.",
    "她用吸管吸果汁。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.review_scope,'single-source-sense-only');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'changed source'}),null,word+' rejects wrong source');
 }
 assert.equal(edits.find(x=>x.word==='south').pos,'n.');
 assert.equal(edits.find(x=>x.word==='suck').pos,'vt.');
});


test('CET4 source-sense and idiomatic collocation pass corrects six frozen candidates',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
  "singular": [
    "非凡的（形容词）",
    "She showed singular courage during the rescue.",
    "她在救援过程中表现出了非凡的勇气。"
  ],
  "restraint": [
    "克制（名词）",
    "She showed restraint and did not respond to the rude comment.",
    "她表现出克制，没有回应那句无礼的话。"
  ],
  "sprinkle": [
    "少量撒入（名词）",
    "A sprinkle of salt brought out the flavour of the tomatoes.",
    "撒上一点盐，让西红柿的味道更加鲜明。"
  ],
  "satisfaction": [
    "满意（名词）",
    "She felt a sense of satisfaction after completing the project.",
    "完成项目后，她感到很有成就感。"
  ],
  "thirst": [
    "口渴（名词）",
    "He drank a glass of water to quench his thirst.",
    "他喝了一杯水解渴。"
  ],
  "troublesome": [
    "令人烦恼的（形容词）",
    "The troublesome leak kept the kitchen floor wet.",
    "恼人的漏水问题让厨房地板一直湿着。"
  ]
};
 for(const [word,fields] of Object.entries(expected)){
  const entry=byWord.get(word);
  assert.ok(entry,word);
  assert.deepEqual([entry.selected_sense,entry.text,entry.translation],fields,word);
  assert.equal(entry.review_status,'editorial-source-sense-checked');
  const draft=packs.find(x=>x.word===word);
  assert.equal(entry.before_text,draft.text,word);
  assert.equal(entry.before_translation,draft.translation,word);
  const source=words.find(x=>x.word===word);
  assert.deepEqual(reviewedExample(source),{text:entry.text,translation:entry.translation});
 }
});


test('CET4 source-primary noun pass corrects six verb/adjective candidates while retaining frozen drafts',()=>{
 const expected={
   "bike": [
     "自行车（名词）",
     "She parked her bike outside the library.",
     "她把自行车停在图书馆外。"
   ],
   "blossom": [
     "花（名词）",
     "Pink blossom covered the cherry trees in spring.",
     "春天，樱桃树开满了粉色的花。"
   ],
   "breed": [
     "品种（名词）",
     "This breed of sheep produces fine wool.",
     "这种绵羊品种产出的羊毛很细。"
   ],
   "bubble": [
     "气泡（名词）",
     "A bubble rose to the surface of the water.",
     "一个气泡升到了水面。"
   ],
   "despair": [
     "绝望（名词）",
     "He fell into despair after losing his job.",
     "失业后，他陷入了绝望。"
   ],
   "explosive": [
     "炸药（名词）",
     "The miners used explosives to break the rock.",
     "矿工使用炸药炸开岩石。"
   ]
 };
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&source&&draft,word);
  assert.equal(item.pos,'n.',word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate');
  assert.equal(item.review_status,'editorial-source-sense-checked');
  assert.equal(item.review_scope,'single-source-sense-only');
  assert.equal(item.external_human_review,false);
  assert.equal(item.full_dictionary_senses_reviewed,false);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'changed source'}),null,word+' rejects changed source');
 }
});


test('CET4 file/smile/surprise/trust examples use source-primary POS and keep frozen drafts',()=>{
 const expected=[
  [
    "file",
    "档案（名词）",
    "The clerk put the signed contract in the customer's file.",
    "职员把签好的合同放进客户档案里。"
  ],
  [
    "smile",
    "微笑（不及物动词）",
    "She smiled when she saw her friends waiting outside.",
    "看到朋友们在外面等她，她笑了。"
  ],
  [
    "surprise",
    "使惊奇（及物动词）",
    "Her unexpected visit surprised everyone at the office.",
    "她的突然来访让办公室里的每个人都感到惊讶。"
  ],
  [
    "trust",
    "信任（名词）",
    "Mutual trust is essential in a strong friendship.",
    "相互信任是牢固友谊的重要基础。"
  ]
];
 for(const [word,sense,en,zh] of expected){
  const entry=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(entry&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(entry[field],source[field],word+' '+field);
  assert.deepEqual([entry.selected_sense,entry.text,entry.translation],[sense,en,zh],word);
  assert.deepEqual([entry.before_text,entry.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate',word);
  assert.equal(entry.review_status,'editorial-source-sense-checked',word);
  assert.equal(entry.review_scope,'single-source-sense-only',word);
  assert.equal(entry.external_human_review,false,word);
  assert.equal(entry.full_dictionary_senses_reviewed,false,word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'altered source'}),null,word+' source-lock');
 }
});


test('CET4 beloved/field/garage/heroic/president source senses preserve original drafts and precedence',()=>{
 const expected={
  "beloved": [
    "深爱的，深受爱戴的（形容词）",
    "Her beloved grandmother taught her to bake bread.",
    "她深爱的祖母教她烤面包。"
  ],
  "field": [
    "田地（名词）",
    "The farmer planted wheat in the field.",
    "农民在田里种下了小麦。"
  ],
  "garage": [
    "车库（名词）",
    "She parked her car in the garage before the storm.",
    "暴风雨来临前，她把车停进了车库。"
  ],
  "heroic": [
    "英勇的（形容词）",
    "The firefighter's heroic actions saved two children.",
    "这名消防员的英勇行动救了两个孩子。"
  ],
  "president": [
    "大学校长（名词）",
    "The university president welcomed the new students.",
    "大学校长欢迎了新生。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const entry=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(entry&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(entry[field],source[field],word+' '+field);
  assert.deepEqual([entry.selected_sense,entry.text,entry.translation],[sense,en,zh],word);
  assert.deepEqual([entry.before_text,entry.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate',word);
  assert.equal(entry.review_status,'editorial-source-sense-checked',word);
  assert.equal(entry.review_scope,'single-source-sense-only',word);
  assert.equal(entry.external_human_review,false,word);
  assert.equal(entry.full_dictionary_senses_reviewed,false,word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'changed source'}),null,word+' source lock');
 }
});


test('CET4 seven new editorial POS repairs preserve source identity, frozen drafts and effective precedence',()=>{
 const expected={
  "downward": [
    "向下的（形容词）",
    "The chart showed a downward trend in prices.",
    "图表显示价格呈下降趋势。"
  ],
  "dye": [
    "染色（及物动词）",
    "She dyed the wool blue before knitting the scarf.",
    "她在织围巾之前把羊毛染成了蓝色。"
  ],
  "fool": [
    "傻瓜（名词）",
    "Only a fool would ignore the warning signs.",
    "只有傻瓜才会无视那些警示标志。"
  ],
  "marry": [
    "娶，嫁（及物动词）",
    "She married her childhood friend last spring.",
    "她去年春天与儿时的朋友结婚了。"
  ],
  "pour": [
    "倒（及物动词）",
    "She poured tea into the two cups.",
    "她把茶倒进了两个杯子里。"
  ],
  "succeed": [
    "接替，继……之后（及物动词）",
    "Her daughter succeeded her as head of the company.",
    "她的女儿接替她成为公司负责人。"
  ],
  "submerge": [
    "浸没（及物动词）",
    "The scientist submerged the sample in water.",
    "科学家把样品浸没在水中。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const entry=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(entry&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(entry[field],source[field],word+' '+field);
  assert.deepEqual([entry.selected_sense,entry.text,entry.translation],[sense,en,zh],word);
  assert.deepEqual([entry.before_text,entry.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate',word);
  assert.equal(entry.review_status,'editorial-source-sense-checked',word);
  assert.equal(entry.review_scope,'single-source-sense-only',word);
  assert.equal(entry.external_human_review,false,word);
  assert.equal(entry.full_dictionary_senses_reviewed,false,word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'changed source'}),null,word+' source lock');
 }
});


test('CET4 editorial batch ten fixes source POS and translation without touching candidate drafts',()=>{
 const expected={
  "bronze": [
    "青铜（名词）",
    "The statue was made of bronze.",
    "这座雕像由青铜制成。"
  ],
  "cathedral": [
    "大教堂（名词）",
    "The cathedral dominates the old city centre.",
    "这座大教堂高耸于老城区，格外醒目。"
  ],
  "debate": [
    "辩论（名词）",
    "The students held a debate about whether classes should start later.",
    "学生们就是否应该推迟上课时间展开了一场辩论。"
  ],
  "derive": [
    "取得（及物动词）",
    "Researchers derived useful information from the survey.",
    "研究人员从调查中获得了有用的信息。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const entry=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(entry&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(entry[field],source[field],word+' '+field);
  assert.deepEqual([entry.selected_sense,entry.text,entry.translation],[sense,en,zh],word);
  assert.deepEqual([entry.before_text,entry.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate',word);
  assert.equal(entry.review_status,'editorial-source-sense-checked',word);
  assert.equal(entry.review_scope,'single-source-sense-only',word);
  assert.equal(entry.external_human_review,false,word);
  assert.equal(entry.full_dictionary_senses_reviewed,false,word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'changed source'}),null,word+' source lock');
 }
});


test('CET4 batch eleven repairs primary POS, source senses and literal Chinese without altering frozen drafts',()=>{
 const expected={
  "besides": [
    "而且（副词）",
    "The journey is too long; besides, the tickets are expensive.",
    "路程太远了，而且车票也很贵。"
  ],
  "garbage": [
    "垃圾（名词）",
    "Workers collected garbage from the park after the festival.",
    "节日结束后，工人们清理了公园里的垃圾。"
  ],
  "gate": [
    "篱笆门（名词）",
    "She opened the garden gate to let the dog in.",
    "她打开花园的篱笆门，让狗进来。"
  ],
  "glory": [
    "荣誉（名词）",
    "She accepted the prize and shared the glory with her teammates.",
    "她接受了奖项，并与队友分享了这份荣誉。"
  ],
  "harden": [
    "使变硬（及物动词）",
    "The heat hardened the clay.",
    "高温使黏土变硬。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const entry=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(entry&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(entry[field],source[field],word+' '+field);
  assert.deepEqual([entry.selected_sense,entry.text,entry.translation],[sense,en,zh],word);
  assert.deepEqual([entry.before_text,entry.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate',word);
  assert.equal(entry.review_status,'editorial-source-sense-checked',word);
  assert.equal(entry.review_scope,'single-source-sense-only',word);
  assert.equal(entry.external_human_review,false,word);
  assert.equal(entry.full_dictionary_senses_reviewed,false,word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'changed source'}),null,word+' source lock');
 }
});


test('CET4 batch twelve repairs source POS, semantic scope and publisher collocation without replacing frozen drafts',()=>{
 const expected={
  "fit": [
    "安装（及物动词）",
    "The carpenter fitted new shelves into the alcove.",
    "木匠在壁龛里安装了新搁板。"
  ],
  "plain": [
    "平原（名词）",
    "The travellers crossed a wide plain before sunset.",
    "旅行者们在日落前穿过了一片广阔的平原。"
  ],
  "prospect": [
    "前景（名词）",
    "The new railway improved the town's economic prospects.",
    "新铁路改善了小镇的经济前景。"
  ],
  "release": [
    "发表（及物动词）",
    "The research team released its findings in a report.",
    "研究团队在一份报告中公布了研究结果。"
  ],
  "deal": [
    "买卖（名词）",
    "The used bike was a good deal at fifty dollars.",
    "那辆二手自行车只卖五十美元，是笔划算的买卖。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const entry=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(entry&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(entry[field],source[field],word+' '+field);
  assert.deepEqual([entry.selected_sense,entry.text,entry.translation],[sense,en,zh],word);
  assert.deepEqual([entry.before_text,entry.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate',word);
  assert.equal(entry.review_status,'editorial-source-sense-checked',word);
  assert.equal(entry.review_scope,'single-source-sense-only',word);
  assert.equal(entry.external_human_review,false,word);
  assert.equal(entry.full_dictionary_senses_reviewed,false,word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'changed source'}),null,word+' source lock');
 }
});


test('CET4 batch thirteen repairs transport, government, meeting and Roman senses without altering original candidates',()=>{
 const expected={
  "carrier": [
    "运载工具（名词，货运船）",
    "The cargo carrier sailed into the harbour at dawn.",
    "黎明时，那艘货运船驶入了港口。"
  ],
  "governor": [
    "州长（名词）",
    "The state governor announced a new transport plan.",
    "州长宣布了一项新的交通规划。"
  ],
  "meeting": [
    "会见，会面（名词）",
    "Their first meeting took place at the railway station.",
    "他们第一次见面是在火车站。"
  ],
  "Roman": [
    "古罗马人（名词复数）",
    "The Romans built roads throughout the empire.",
    "古罗马人在帝国各地修建道路。"
  ],
  "rider": [
    "骑马的人（名词）",
    "The rider put on a helmet before mounting the horse.",
    "骑手上马前戴上了头盔。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const entry=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(entry&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(entry[field],source[field],word+' '+field);
  assert.deepEqual([entry.selected_sense,entry.text,entry.translation],[sense,en,zh],word);
  assert.deepEqual([entry.before_text,entry.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate',word);
  assert.equal(entry.review_status,'editorial-source-sense-checked',word);
  assert.equal(entry.review_scope,'single-source-sense-only',word);
  assert.equal(entry.external_human_review,false,word);
  assert.equal(entry.full_dictionary_senses_reviewed,false,word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'changed source'}),null,word+' source lock');
 }
});

test('CET4 batch fourteen aligns five candidate examples with literal source senses and translations',()=>{
 const expected={
  "deposit": [
    "使沉淀（及物动词）",
    "The river deposited a layer of silt along its banks.",
    "河水在两岸沉积了一层淤泥。"
  ],
  "expression": [
    "表情（名词）",
    "Her expression changed when she heard the news.",
    "听到这个消息时，她的表情变了。"
  ],
  "flock": [
    "（鹅）群（名词）",
    "A flock of geese flew over the field.",
    "一群鹅飞过田野。"
  ],
  "formation": [
    "形成，组建（名词）",
    "The formation of the new committee took three weeks.",
    "新委员会的组建花了三个星期。"
  ],
  "headline": [
    "大字标题（名词）",
    "The headline on the front page caught her attention.",
    "头版标题引起了她的注意。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const entry=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(entry&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(entry[field],source[field],word+' '+field);
  assert.deepEqual([entry.selected_sense,entry.text,entry.translation],[sense,en,zh],word);
  assert.deepEqual([entry.before_text,entry.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate',word);
  assert.equal(entry.review_status,'editorial-source-sense-checked',word);
  assert.equal(entry.review_scope,'single-source-sense-only',word);
  assert.equal(entry.external_human_review,false,word);
  assert.equal(entry.full_dictionary_senses_reviewed,false,word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'changed source'}),null,word+' source lock');
 }
});


test('CET4 batch fifteen resolves literal senses and ambiguous bilingual candidate examples',()=>{
 const expected={
  "failure": [
    "失败（名词）",
    "The failure of the plan disappointed the volunteers.",
    "计划的失败让志愿者们很失望。"
  ],
  "major": [
    "较大的、重大的（形容词）",
    "A major storm damaged several houses.",
    "一场大风暴损坏了几栋房屋。"
  ],
  "prime": [
    "首要的（形容词）",
    "Safety is our prime concern during the trip.",
    "旅途中，安全是我们最关心的事。"
  ],
  "square": [
    "广场（名词）",
    "The children played in the town square after school.",
    "放学后，孩子们在镇中心的广场上玩耍。"
  ],
  "fare": [
    "车费、票价（名词）",
    "The bus fare increased by two pounds.",
    "公交车票价上涨了两英镑。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const entry=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(entry&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(entry[field],source[field],word+' '+field);
  assert.deepEqual([entry.selected_sense,entry.text,entry.translation],[sense,en,zh],word);
  assert.deepEqual([entry.before_text,entry.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate',word);
  assert.equal(entry.review_status,'editorial-source-sense-checked',word);
  assert.equal(entry.review_scope,'single-source-sense-only',word);
  assert.equal(entry.external_human_review,false,word);
  assert.equal(entry.full_dictionary_senses_reviewed,false,word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'changed source'}),null,word+' source lock');
 }
});


test('CET4 batch sixteen repairs brim, qualify, toe, heavily and invade candidate pedagogy without changing frozen drafts',()=>{
 const expected={
  "brim": [
    "帽檐（名词）",
    "The wide brim of her hat kept the sun off her face.",
    "她帽子宽大的帽檐为她遮住了阳光。"
  ],
  "qualify": [
    "使具有资格（及物动词）",
    "Two years of experience will qualify her for the position.",
    "两年的工作经验将使她具备担任该职位的资格。"
  ],
  "toe": [
    "脚趾（名词）",
    "He stubbed his toe on the step.",
    "他的脚趾撞到了台阶。"
  ],
  "heavily": [
    "大量地，猛烈地（副词）",
    "It rained heavily throughout the night.",
    "整夜都下着大雨。"
  ],
  "invade": [
    "入侵，侵略（及物动词）",
    "The army invaded the neighbouring country at dawn.",
    "军队在黎明时入侵了邻国。"
  ]
};
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const entry=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(entry&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(entry[field],source[field],word+' '+field);
  assert.deepEqual([entry.selected_sense,entry.text,entry.translation],[sense,en,zh],word);
  assert.deepEqual([entry.before_text,entry.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate',word);
  assert.equal(entry.review_status,'editorial-source-sense-checked',word);
  assert.equal(entry.review_scope,'single-source-sense-only',word);
  assert.equal(entry.external_human_review,false,word);
  assert.equal(entry.full_dictionary_senses_reviewed,false,word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'changed source'}),null,word+' source lock');
 }
});


test('CET4 transitive-sense corrections retain natural bilingual sentences and source identities',()=>{
 const byWord=new Map(edits.map(x=>[x.word,x]));
 const expected={
   "circulate": [
     "The pump circulates warm water through the pipes.",
     "水泵使温水在管道中循环。",
     "使循环（及物动词）"
   ],
   "invest": [
     "The company invested five million dollars in solar energy.",
     "这家公司向太阳能项目投入了五百万美元。",
     "投入资金（及物动词）"
   ],
   "ripen": [
     "The summer sun ripened the peaches.",
     "夏日的阳光使桃子成熟了。",
     "使成熟（及物动词）"
   ],
   "bore": [
     "The long lecture bored the students.",
     "冗长的讲座让学生们感到厌烦。",
     "使厌烦（及物动词）"
   ],
   "say": [
     "She said a few words before the meeting.",
     "会议开始前，她说了几句话。",
     "说（及物动词）"
   ]
 };
 for(const [word,values] of Object.entries(expected)){
  const item=byWord.get(word);
  assert.ok(item,word);
  assert.deepEqual([item.text,item.translation,item.selected_sense],values,word);
  const source=words.find(x=>x.word===word);
  assert.ok(source,word);
  assert.equal(item.source_raw,source.source_raw);
  assert.equal(item.source_line,source.source_line);
  assert.deepEqual(reviewedExample(source),{text:item.text,translation:item.translation});
  assert.notEqual(item.text,item.before_text);
 }
});


test('CET4 next source-locked sense pass corrects four draft mismatches without altering frozen candidates',()=>{
 const expected={
   "liberty": [
     "自由（名词）",
     "After years in prison, he finally regained his liberty.",
     "多年监禁后，他终于重获自由。"
   ],
   "painful": [
     "使痛的、疼痛的（形容词）",
     "The burn on her hand was painful.",
     "她手上的烫伤很疼。"
   ],
   "trace": [
     "痕迹（名词）",
     "The detective found a trace of mud on the carpet.",
     "侦探在地毯上发现了一点泥迹。"
   ],
   "inquire": [
     "询问（及物动词，接 whether 从句）",
     "The officer inquired whether anyone had seen the missing child.",
     "警官询问是否有人见过失踪的孩子。"
   ]
 };
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate',word);
  assert.equal(item.review_status,'editorial-source-sense-checked',word);
  assert.equal(item.review_scope,'single-source-sense-only',word);
  assert.equal(item.external_human_review,false,word);
  assert.equal(item.full_dictionary_senses_reviewed,false,word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'altered source'}),null,word+' source lock');
 }
});


test('CET4 editorial pass improves five source-bound senses and Chinese wording without altering worker drafts',()=>{
 const expected={
   "collision": [
     "碰撞（名词）",
     "Two cars were damaged in the collision at the crossroads.",
     "十字路口发生的那次碰撞使两辆汽车受损。"
   ],
   "faculty": [
     "才能、天赋（名词）",
     "She has a remarkable faculty for learning languages.",
     "她有出色的语言学习天赋。"
   ],
   "filter": [
     "过滤（及物动词）",
     "The machine filters impurities from drinking water.",
     "这台机器能过滤饮用水中的杂质。"
   ],
   "reality": [
     "现实（名词）",
     "He struggled to accept the reality of losing his home.",
     "他难以接受失去家园的现实。"
   ],
   "vanity": [
     "虚荣心（名词）",
     "Her vanity made her check her appearance in every mirror.",
     "她爱慕虚荣，每见到镜子都要照一照。"
   ]
 };
 for(const [word,[sense,en,zh]] of Object.entries(expected)){
  const item=edits.find(x=>x.word===word);
  const source=words.find(x=>x.word===word&&x.source_file==='cet4.txt');
  const draft=packs.find(x=>x.word===word&&x.source_file==='cet4.txt');
  assert.ok(item&&source&&draft,word);
  for(const field of ['source_file','source_line','source_raw','word','headword','homograph','pos','meaning'])assert.deepEqual(item[field],source[field],word+' '+field);
  assert.deepEqual([item.selected_sense,item.text,item.translation],[sense,en,zh],word);
  assert.deepEqual([item.before_text,item.before_translation],[draft.text,draft.translation],word);
  assert.equal(draft.review_status,'unverified-candidate',word);
  assert.equal(item.review_status,'editorial-source-sense-checked',word);
  assert.equal(item.review_scope,'single-source-sense-only',word);
  assert.equal(item.external_human_review,false,word);
  assert.equal(item.full_dictionary_senses_reviewed,false,word);
  assert.deepEqual(reviewedExample(source),{text:en,translation:zh},word);
  assert.equal(reviewedExample({...source,source_raw:'altered source'}),null,word+' source lock');
 }
});
