'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),Base=require('./build-gaokao-reviewed');
const file=path.join(root,'app/seed/gaokao-common-g-20261015.tsv'),text=fs.readFileSync(file,'utf8'),rows=Base.tsv(text,'headword\tpos\tmeaning\texample\texample_translation\tnote');
const expected=JSON.parse(fs.readFileSync(path.join(root,'output/playwright/fullsite-20261014/gaokao-next100-g.json'),'utf8'));
if(rows.length!==100||expected.length!==100||rows.some((r,i)=>r.headword!==expected[i].headword))throw Error('Draft differs from prepared source order');
console.log(JSON.stringify({rows:rows.length,first:rows[0].headword,last:rows.at(-1).headword,source_order_matches:true,sha256:createHash('sha256').update(text).digest('hex')}));
