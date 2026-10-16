'use strict';
const fs=require('node:fs'),path=require('node:path');
const V=require('../app/vocabulary'),D=require('../shared/domain');
const root=path.join(__dirname,'..');
const input=fs.readFileSync(path.join(root,'app/seed/phonetics-review-20261013.tsv'),'utf8').trim().split(/\r?\n/).slice(1).map(line=>{
 const [word,phonetic,slug]=line.split('\t');return {word,phonetic,source:slug.startsWith('https:')?slug:'https://www.oxfordlearnersdictionaries.com/definition/english/'+slug};
});
if(input.length!==39||new Set(input.map(x=>x.word)).size!==39)throw new Error('Reviewed pronunciation batch changed');
const cet6=V.buildBook(V.CATALOG.find(x=>x.file==='cet6.txt'));
const patches=[];
for(const item of input){
 const primary=cet6.words.find(x=>x.word===item.word);if(!primary)throw new Error('Missing reviewed headword');
 if(/[әє?]/.test(item.phonetic))throw new Error('Suspicious symbol in reviewed IPA');
 for(const spec of V.CATALOG.filter(x=>x.file!=='zhongkao.txt')){
  // Bind raw parsed rows rather than current built output, so regeneration is
  // deterministic after the patch is already enabled in buildBook.
  const lines=fs.readFileSync(path.join(root,'app/seed',spec.file),'utf8').split(/\r?\n/);
  for(const [i,raw] of lines.entries()){
   const parsed=V.parseSourceLine(raw);if(parsed.status!=='accepted')continue;
   const w=parsed.entry;
   if(w.word!==item.word||w.homograph||D.normalizePartOfSpeech(w.pos)!==D.normalizePartOfSpeech(primary.pos)||!/[әє?]/.test(w.phonetic))continue;
   patches.push({word:w.word,source_file:spec.file,source_line:i+1,source_raw:raw,
    from:{pos:w.pos,meaning:w.meaning,phonetic:w.phonetic},to:{phonetic:item.phonetic},source:item.source,
    review:'primary-pos-british-pronunciation-only',note:'Dictionary pronunciation checked for the primary POS; other senses and examples are not approved by this patch.'});
  }
 }
}
fs.writeFileSync(path.join(root,'app/seed/phonetics-batch-20261013.json'),JSON.stringify(patches,null,2)+'\n');
console.log(JSON.stringify({reviewed_headwords:input.length,source_bound_patches:patches.length,by_source:Object.fromEntries(V.CATALOG.map(s=>[s.file,patches.filter(p=>p.source_file===s.file).length]))},null,2));
