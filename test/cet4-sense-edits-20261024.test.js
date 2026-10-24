'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../app/vocabulary');
const {reviewedExample}=require('../shared/content-batch');
const edits=require('../app/seed/examples-cet4-sense-edits-20261024.json').examples;
const audit=require('../docs/model-quality-patches/cet4-source-phonetic-audit-20261024.json');
const packs=[1,2,3,4,5].flatMap(n=>require('../app/seed/examples-cet4-coverage-part-'+String(n).padStart(2,'0')+'.json').examples);
const words=V.buildBook(V.CATALOG.find(x=>x.file==='cet4.txt')).words;
test('CET4 editorial sense edits are source locked and leave model-worker candidates untouched',()=>{
 assert.equal(edits.length,54);
 assert.deepEqual(edits.map(x=>x.word).sort(),["accordingly","approximate","arrival","atom","atomic","bloom","boast","bow","brass","brown","bulb","color","comparative","conquest","convenience","crust","dairy","dissolve","drain","drill","drum","effective","either","elementary","end","endure","engage","entry","establishment","everything","evolve","excess","excursion","exercise","faith","fast","fate","fear","feel","fellow","female","gas","gauge","general","giant","glare","glass","glide","glitter","goodness","graduate","grasp","grave","resume"]);
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
