'use strict';
// Exact source and sense bindings. A shared spelling alone never grants an example.
const batch = require('../app/seed/content-batch-20261013.json');
const common = require('../app/seed/examples-common-a-reviewed-20261014.json');
const extended = require('../app/seed/examples-extended-reviewed-20261014.json');
const commonD = require('../app/seed/examples-common-d-reviewed-20261014.json');
const commonE = require('../app/seed/examples-common-e-reviewed-20261014.json');
const commonF = require('../app/seed/examples-common-f-reviewed-20261014.json');
const commonG = require('../app/seed/examples-common-g-reviewed-20261015.json');
const commonH = require('../app/seed/examples-common-h-reviewed-20261015.json');
const commonI = require('../app/seed/examples-common-i-reviewed-20261015.json');
const numbered = require('../app/seed/examples-numbered-reviewed-20261015.json');
const {matchesSenseIdentity}=require('./source-sense-binding');
const bindings = new Map([...batch.examples,...common.examples,...extended.examples,...commonD.examples,...commonE.examples,...commonF.examples,...commonG.examples,...commonH.examples,...commonI.examples,...numbered.examples].map(item => [`${item.source_file}\0${item.word}`, item]));
function reviewedExample(word) {
  const corrected=require('./content-corrections').correctedExample(word);if(corrected)return corrected;
  const item = bindings.get(`${word.source_file}\0${word.word}`);
  return item && matchesSenseIdentity(item,word) && (item.source_line===undefined||item.source_line===word.source_line)
    && item.pos === word.pos && item.meaning === word.meaning && item.source_raw === word.source_raw
    ? { text: item.text, translation: item.translation } : null;
}
const phonetics=[...require('../app/seed/phonetics-batch-20261013.json'),...require('../app/seed/phonetics-missing-reviewed-20261014.json'),...require('../app/seed/phonetics-private-use-20261015.json')];
const pronunciations=new Map(phonetics.map(item=>[`${item.source_file}\0${item.source_line}\0${item.word}`,item]));
function reviewedPhonetic(word){
 const item=pronunciations.get(`${word.source_file}\0${word.source_line}\0${word.word}`);
 return item&&!word.homograph&&item.source_raw===word.source_raw&&item.from.pos===word.pos
  &&item.from.meaning===word.meaning&&item.from.phonetic===word.phonetic?item:null;
}
module.exports = { reviewedExample, reviewedPhonetic };
