'use strict';
const fs=require('node:fs'),path=require('node:path');
const V=require('../app/vocabulary');
function compare(scope) {
  const sources=V.CATALOG.map(spec=>({spec,...V.buildBook(spec)}));
  const index=new Map(),exact=new Map(),cases=new Map();
  for(const item of scope.items)for(const head of item.headword.split('/')){const lower=head.toLowerCase();if(!cases.has(lower))cases.set(lower,new Set());cases.get(lower).add(head);}
  for(const {spec,words} of sources)for(const word of words){
    const key=word.headword.toLowerCase();
    if(!index.has(key))index.set(key,[]);
    const candidate={source_file:spec.file,source_line:word.source_line,word:word.word,pos:word.pos,meaning:word.meaning,phonetic:word.phonetic};
    index.get(key).push(candidate);if(!exact.has(word.headword))exact.set(word.headword,[]);exact.get(word.headword).push(candidate);
  }
  const items=scope.items.map(item=>{
    // Parentheses can mean a complement, inflection, abbreviation, or spelling variant.
    // Do not treat all of them as interchangeable spellings automatically.
    const heads=item.headword.split('/');
    const candidates=heads.flatMap(head=>cases.get(head.toLowerCase())?.size>1?exact.get(head)||[]:index.get(head.toLowerCase())||[]);
    return {...item,review_status:'pending-language-review',requires_special_handling:/[/.é]/.test(item.headword)||item.variants.length>0,
      candidate_count:candidates.length,candidates};
  });
  return {edition:scope.edition,pdf_sha256:scope.pdf_sha256,declared_words:scope.declared_words,
    source_entries:items.length,count_difference:scope.declared_words-items.length,
    unparsed_lines:scope.unparsed_lines,status:'draft-only-not-installed',
    with_existing_candidates:items.filter(x=>x.candidates.length).length,
    without_existing_candidates:items.filter(x=>!x.candidates.length).map(({candidates,...x})=>x),
    special_entries:items.filter(x=>x.requires_special_handling).length,
    blockers:['Source-entry count differs from declared word count: do not pad or silently omit.',
      'Existing definitions are candidates, not approved Gaokao senses.',
      'Paired examples, spelling variants, source usage and language review must pass before replacing the old book.'],items};
}
if(require.main===module){
 const root=path.join(__dirname,'../docs/vocabulary-audit');
 const scope=JSON.parse(fs.readFileSync(path.join(root,'gaokao-2025-scope.json'),'utf8'));
 const result=compare(scope);
 fs.writeFileSync(path.join(root,'gaokao-2025-content-draft.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(Object.fromEntries(Object.entries(result).filter(([k])=>!['items','without_existing_candidates'].includes(k))),null,2));
 console.log('missing',result.without_existing_candidates.map(x=>x.headword).join(', '));
}
module.exports={compare};
