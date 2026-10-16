'use strict';
// Retain only the dictionary facts explicitly checked against the selected POS.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),facts=require('../docs/vocabulary-audit/gaokao-f-dictionary-facts-20261014.json');
const file=path.join(root,'app/seed/gaokao-common-f-20261014.tsv');
const teaching=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const labels={'n.':'noun','v.':'verb','adj.':'adjective'};
const rows=teaching.trim().split('\n').slice(1).map(line=>line.split('\t'));
if(rows.length!==100)throw new Error('Expected 100 source-ordered drafts');
const lines=rows.map(([word,pos])=>{
 const choices=facts.filter(f=>f.label.replace(' 1 ',' ')===word+' '+labels[pos]);
 const fact=choices.at(-1);if(!fact?.ipa)throw new Error('Missing selected POS evidence: '+word);
 return [word,labels[pos],fact.ipa,fact.url].join('\t');
});
const phonetics='headword\tpos_label\tphonetic\turl\n'+lines.join('\n')+'\n';
fs.writeFileSync(path.join(root,'app/seed/gaokao-common-f-phonetics-20261014.tsv'),phonetics);
const sha=t=>createHash('sha256').update(t).digest('hex');
console.log(JSON.stringify({teaching:sha(teaching),phonetics:sha(phonetics)}));
