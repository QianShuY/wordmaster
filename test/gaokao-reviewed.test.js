'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {build,load,checkedText,SHA}=require('../scripts/build-gaokao-reviewed'),Policy=require('../shared/answer-policy');
const input=load(),run=(x=input)=>build(x.scope,x.rows,x.phonetics,x.base);

test('100 new selected senses extend the ledger without installing or overstating review',()=>{
 const r=run(),byHead=new Map(r.new_batch.map(e=>[e.headword,e]));
 assert.equal(r.selected_senses_reviewed,153);assert.equal(r.learning_units,3111);assert.equal(r.pending_units,2958);assert.equal(r.installed_units,0);
 assert.equal(r.coverage.filter(e=>e.review_status==='selected-sense-reviewed-not-installed').length,153);
 assert.equal(new Set(r.coverage.map(e=>e.source_entry+'\0'+e.headword)).size,3111);
 assert.deepEqual(r.entries.slice(0,53),input.base.entries);
 for(const e of r.new_batch){assert.equal(e.external_human_review,false);assert.equal(e.full_dictionary_senses_reviewed,false);assert.ok(Policy.grade(e.answer_policy,e.headword));}
 for(const [word,pos,ipa] of [['abuse','n.','əˈbjuːs'],['advocate','v.','ˈædvəkeɪt'],['addict','n.','ˈædɪkt'],['afterward','adv.','ˈɑːf.tə.wəd'],['all','pron.','ɔːl']]){
  assert.equal(byHead.get(word).pos,pos);assert.equal(byHead.get(word).phonetic,ipa);
 }
 assert.ok(Policy.grade(byHead.get('afterward').answer_policy,'afterwards'));
 for(const [word,wrong] of [['advice','advise'],['advise','advice'],['adapt','adopt'],['adopt','adapt'],['affect','effect'],['amazing','amazed'],['ability','abilities']])assert.equal(Policy.grade(byHead.get(word).answer_policy,wrong),false);
});

test('review assembly rejects shifted identities, missing evidence and unrelated dictionary pages',()=>{
 const changed=()=>structuredClone(input);
 let x=changed();x.phonetics.pop();assert.throws(()=>run(x),/100 unique/);
 x=changed();x.phonetics[0]=x.phonetics[1];assert.throws(()=>run(x),/100 unique/);
 x=changed();[x.rows[0],x.rows[1]]=[x.rows[1],x.rows[0]];assert.throws(()=>run(x),/identity mismatch/);
 x=changed();x.phonetics[0].pos_label='verb';assert.throws(()=>run(x),/POS mismatch/);
 x=changed();x.phonetics[0].url='https://example.com/ability';assert.throws(()=>run(x),/Unverified/);
 x=changed();x.phonetics[0].url='https://www.oxfordlearnersdictionaries.com/definition/english/abuse_1';assert.throws(()=>run(x),/headword mismatch/);
 x=changed();x.rows.find(e=>e.headword==='air').example='The airport is busy.';assert.throws(()=>run(x),/Incomplete/);
 x=changed();x.base.entries[0]={...x.base.entries[0],source_entry:99999};assert.throws(()=>run(x),/out-of-scope/);
 x=changed();x.scope.pdf_sha256='changed';assert.throws(()=>run(x));
});

test('reviewed source bytes require renewed review when edited, but tolerate Windows line endings',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-review-hash-')),file=path.join(dir,'review.tsv');
 try{
  const source=fs.readFileSync(path.join(__dirname,'../app/seed/gaokao-common-a-20261013.tsv'),'utf8').replace(/\r\n/g,'\n');
  fs.writeFileSync(file,source.replace(/\n/g,'\r\n'));assert.equal(checkedText(file,SHA['gaokao-common-a-20261013.tsv']).replace(/\r\n/g,'\n'),source);
  fs.appendFileSync(file,'changed');assert.throws(()=>checkedText(file,SHA['gaokao-common-a-20261013.tsv']),/re-review required/);
 }finally{fs.rmSync(file,{force:true});fs.rmdirSync(dir);}
});
