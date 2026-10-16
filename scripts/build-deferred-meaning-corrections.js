'use strict';
// Original Chinese teaching glosses. Preserve raw source text and exact identities.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),V=require('../app/vocabulary');
const root=path.resolve(__dirname,'..');
const batches=['common-a','extended','common-d','common-e','common-f'].map(n=>require('../app/seed/examples-'+n+'-reviewed-20261014.json'));
const deferred=batches.flatMap(b=>b.deferred).filter(d=>!['billion','ankle'].includes(d.word));
const baseline=require('../docs/vocabulary-audit/deferred-meanings-original-20261014.json');
const originals=new Map(baseline.map(w=>[w.source_file+':'+w.word,w]));
for(const w of baseline){
 const raw=fs.readFileSync(path.join(root,'app/seed',w.source_file),'utf8').split(/\r?\n/)[w.source_line-1];
 assert.equal(raw,w.source_raw,'Original source changed; re-review required');
 const parsed=V.parseSourceLine(raw);assert.equal(parsed.status,'accepted');
 for(const field of ['word','headword','pos','meaning','phonetic'])assert.equal(parsed.entry[field],w[field],'Original field changed: '+field);
}
const teaching=new Map(require('../docs/vocabulary-audit/gaokao-reviewed-units-current.json').entries.map(e=>[e.headword,e]));
const meanings={
 accept:'接受；同意',access:'接近；通道，入口；使用或进入的机会、权利',accommodation:'住宿；住处；住宿设施',
 account:'账户；记述；解释；账目',adapt:'使适应；改编 vi. 适应（常与 to 连用）',against:'倚在；逆，对着；反对',
 altogether:'完全地；总而言之；总共，合计',addition:'加，加法；增加的事物 || in addition (to) 另外，除……之外',
 adjust:'调整，调节；整理，安排；使适应',airline:'航空公司',apply:'应用，实施，使用 vi. 申请（常与 for 连用）',
 arrow:'箭；箭状物；箭头（方向符号）',assess:'对财产等估价；评估（能力、表现等）',aunt:'姑母、姨母、伯母、婶母、舅母等',
 behalf:'利益；代表身份（用于固定搭配） || on behalf of 代表；为了……的利益',bitter:'痛苦的；严寒的；苦的（味道）',
 attach:'1. 系，贴，连接 2. 使依附；随同（attach oneself to） 3. 重视（attach importance to） 4. 附上（电子邮件的附件等）',
 at:'在（某时刻）；以，达（某价格、速度等）；在……方面',barbecue:'烤肉；烤肉用的台架；户外烧烤聚会 vt. 炙烤（肉等）',
 bin:'箱子，贮藏箱；垃圾桶（英式常用）',apparently:'据说；看来；表面上（信息或判断不一定属实）',
 brand:'品牌；烙印 vt. 打烙印；铭刻',by:'在……旁；被，由；通过，乘（交通工具）',call:'把……叫做；叫，喊；给……打电话',
 bug:'臭虫；小毛病；程序错误；窃听器 v. 窃听',boat:'船，小船 || be in the same boat 处境相同 v. 划船，乘船',
 bored:'感到无聊的，厌倦的',branch:'1. 树枝 2. 分部，分行，分店 3. 分科，部门 4. 支流，支脉，支线 v. 分支，分岔',
 button:'纽扣；按钮 v. 扣上纽扣',canteen:'食堂；小卖部；临时餐室',captain:'船长；队长；陆军上尉',
 cast:'投，扔，抛；浇铸；投射（光、影等）',charity:'施舍；慈善事业；慈善机构；仁慈，博爱',
 cheat:'骗取；哄 vi. 行骗；作弊',cheer:'使振作；为……欢呼 vi. 欢呼，喝彩',civil:'公民的；文职的；民用的，非军用的',
 class:'班，班级；阶级；课',coach:'长途公共汽车；教练',common:'普通的；共同的；常见的',
 communist:'共产主义者；（Communist）共产党员',concentrate:'集中；聚集；浓缩 vi. 专心，集中注意力',
 consistent:'一致的；一贯的，始终如一的 || be consistent with 与……一致；符合……',constitution:'宪法；章程；体质；构造',
 communicate:'1. 传达（意见、消息等），传播，传送 2. 传染（疾病） 3. （房间）相连，相通 4. 交流，沟通（常与 with 连用）',
};
const special={
 'cet6.txt:adapt':'1. 使适应，适合 2. 改编，改写 3. 适应（常与 to 连用）',
 'npee.txt:cast':'投，扔，掷，抛；铸造；投票；投射（光、影等） n. 演员表',
 'npee.txt:common':'普通的；共同的；一般的；常见的 n. 公共草地',
};
const patches=deferred.map(d=>{
 const key=d.source_file+':'+d.word,w=originals.get(key),e=teaching.get(d.word),meaning=special[key]||meanings[d.word];
 assert.ok(w&&e&&meaning,key);assert.equal(w.source_line,d.source_line);assert.ok(w.meaning!==meaning,key+' unchanged');
 const source=['altogether','by'].includes(d.word)?'https://www.collinsdictionary.com/dictionary/english/'+d.word:e.pronunciation_source;
 return {word:w.word,headword:w.headword,homograph:w.homograph,source_file:w.source_file,source_line:w.source_line,source_raw:w.source_raw,
  from:{pos:w.pos,meaning:w.meaning,phonetic:w.phonetic},to:{meaning},source,
  note:d.reason+' Resolved by selected-sense/valency review; original source row remains unchanged.',
  example:{text:e.example,translation:e.example_translation},review_method:'Codex source-bound selected-meaning and valency correction with primary dictionary evidence',
  external_human_review:false,full_dictionary_senses_reviewed:false};
});
assert.equal(patches.length,53);assert.equal(new Set(patches.map(p=>p.source_file+':'+p.word)).size,53);
fs.writeFileSync(path.join(root,'app/seed/meanings-deferred-reviewed-20261014.json'),JSON.stringify(patches,null,2)+'\n');
console.log(JSON.stringify({reviewed_meaning_fields:patches.length,paired_examples_available:patches.length,installed:false}));
