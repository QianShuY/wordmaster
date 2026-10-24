'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../app/vocabulary');
const {reviewedExample}=require('../shared/content-batch');
const edits=require('../app/seed/examples-cet4-sense-edits-20261024.json').examples;
const audit=require('../docs/model-quality-patches/cet4-source-phonetic-audit-20261024.json');
const packs=[1,2,3,4,5].flatMap(n=>require('../app/seed/examples-cet4-coverage-part-'+String(n).padStart(2,'0')+'.json').examples);
const words=V.buildBook(V.CATALOG.find(x=>x.file==='cet4.txt')).words;
test('CET4 editorial sense edits are source locked and leave model-worker candidates untouched',()=>{
 assert.equal(edits.length,109);
 assert.deepEqual(edits.map(x=>x.word).sort(),["accordingly","approximate","arrival","atom","atomic","bloom","boast","bow","brass","brown","bulb","color","comparative","conquest","convenience","crust","dairy","dissolve","drain","drill","drum","effective","either","elementary","end","endure","engage","entry","establishment","everything","evolve","excess","excursion","exercise","faith","fast","fate","fear","feel","fellow","female","gas","gauge","general","giant","glare","glass","glide","glitter","goodness","graduate","grasp","grave","halt","hammer","hand","handle","harbour","hard","harsh","hear","heat","herd","hire","honey","hook","horizon","ice","image","imaginary","imagination","implication","import","in","incline","increase","influence","instant","institution","insult","intellectual","intelligent","interest","inward","issue","junior","keep","kilometer","lazy","librarian","license","lighten","likewise","limb","link","lively","loosen","lower","lumber","lump","magic","maintenance","manly","marine","marriage","marvelous","mate","melt","resume"]);
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
