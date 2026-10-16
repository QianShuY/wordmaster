'use strict';
// One-time extraction into the packaged runtime; refuse to overwrite either implementation.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),sourceFile=path.join(root,'scripts/content-quality.js'),targetFile=path.join(root,'app/content-maintenance.js');
if(fs.existsSync(targetFile))throw Error('Runtime implementation already exists; do not re-extract');
const source=fs.readFileSync(sourceFile,'utf8'),start=source.indexOf('// Include all non-content tables'),end=source.indexOf('function inventory(db) {');
if(start<0||end<=start||!source.includes('module.exports = { improve, inventory, protectedDigest, writeInventory };'))throw Error('Unexpected source layout; review instead of guessing');
const body=source.slice(start,end),header="'use strict';\nconst {createHash}=require('node:crypto');\nconst V=require('./vocabulary');\nconst {reviewedExample,reviewedPhonetic}=require('../shared/content-batch');\nconst {reviewedMeaning}=require('../shared/content-corrections');\nconst {reviewedSymbol}=require('../shared/phonetic-symbols');\nconst corrections=require('./seed/cet6-corrections.json');\nconst hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');\n";
let next=source.slice(0,start)+"const {improve,protectedDigest}=require('../app/content-maintenance');\n"+source.slice(end);
next=next.replace("const { reviewedExample, reviewedPhonetic } = require('../shared/content-batch');","const { reviewedExample } = require('../shared/content-batch');");
for(const line of ["const {reviewedMeaning}=require('../shared/content-corrections');","const {reviewedSymbol}=require('../shared/phonetic-symbols');","const corrections = require('../app/seed/cet6-corrections.json');"])next=next.replace(line+'\r\n','').replace(line+'\n','');
fs.writeFileSync(targetFile,header+body+'module.exports={improve,protectedDigest};\n');fs.writeFileSync(sourceFile,next);console.log(JSON.stringify({extracted:'app/content-maintenance.js',backward_compatible_exports:true}));
