'use strict';
// Candidate preparation only. No approval, database access or installation.
const fs=require('node:fs'),path=require('node:path'),{current}=require('./build-gaokao-current'),{prepare,readGap}=require('./prepare-gaokao-review');
const root=path.resolve(__dirname,'..'),arg=process.argv.find(a=>a.startsWith('--label=')),label=arg?.slice(8);
if(!label||!/^[a-z][a-z0-9-]{0,30}$/.test(label))throw Error('Use --label=<new evidence label>');
const audit=path.join(root,'docs/vocabulary-audit'),file=path.join(audit,'gaokao-next100-'+label+'.json');if(fs.existsSync(file))throw Error('Preserve existing candidate evidence; choose a new label');
const scope=JSON.parse(fs.readFileSync(path.join(audit,'gaokao-2025-scope.json'),'utf8')),draft=prepare(scope,readGap(path.join(root,'app/seed/gaokao-gap-examples-20261013.tsv'))),previous=current().report;
const identity=e=>e.source_entry+'\0'+e.headword,done=new Set(previous.entries.map(identity));
const entries=draft.items.flatMap(item=>item.learning_units.map(unit=>({...unit,source_entry:item.source_entry,pdf_page:item.pdf_page,course_level:item.course_level,handling:item.handling.type}))).filter(e=>e.handling==='single-headword'&&!done.has(identity(e))).slice(0,100);
const report={operation:'candidate-preparation-not-language-approval',reviewed_before:previous.entries.length,still_pending_before:previous.pending_units,entries};fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({candidates:entries.length,first:entries[0]?.headword,last:entries.at(-1)?.headword,file}));
