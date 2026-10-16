'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),facts=require('../docs/vocabulary-audit/gaokao-h-dictionary-facts-20261015.json');
const file=path.join(root,'app/seed/gaokao-common-h-20261015.tsv'),teaching=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const labels={'n.':'noun','v.':'verb','adj.':'adjective','adv.':'adverb','prep.':'preposition'};
const rows=teaching.trim().split('\n').slice(1).map(line=>line.split('\t'));if(rows.length!==100)throw Error('Expected 100 source-ordered drafts');
const missing=rows.filter(([word,pos])=>!facts.some(f=>f.label.replace(' 1 ',' ')===word+' '+labels[pos]));if(missing.length)throw Error('Missing selected POS: '+missing.map(r=>r[0]).join(', '));
const lines=rows.map(([word,pos])=>{const fact=facts.filter(f=>f.label.replace(' 1 ',' ')===word+' '+labels[pos]).at(-1);return [word,labels[pos],fact.ipa,fact.url].join('\t');});
const phonetics='headword\tpos_label\tphonetic\turl\n'+lines.join('\n')+'\n';fs.writeFileSync(path.join(root,'app/seed/gaokao-common-h-phonetics-20261015.tsv'),phonetics);const sha=t=>createHash('sha256').update(t).digest('hex');console.log(JSON.stringify({teaching:sha(teaching),phonetics:sha(phonetics)}));
