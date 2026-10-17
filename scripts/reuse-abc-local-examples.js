'use strict';
/*
 * Recover previously drafted bilingual examples for unstarted A/B/C tasks.
 * Only exact source identities or explicitly isolated gaokao word+POS matches.
 * No dictionary validation, API keys, seed changes, or SQLite access.
 *
 * npm run abc:reuse
 */
const fs = require('node:fs');
const path = require('node:path');
const { plan } = require('./plan-next-model-review');
const { ownerOf } = require('./audit-model-evidence');
const ROOT = path.resolve(__dirname, '..');
const normalize = s => String(s ?? '').trim();
const has = s => normalize(s).length > 0;
function posType(pos) {
  const s = normalize(pos).toLowerCase();
  if (/^(n\.|noun)$/.test(s)) return 'noun';
  if (/^(vt\.|vi\.|v\.|v\/n\.|verb)$/.test(s)) return 'verb';
  if (/^(a\.|adj\.|adjective)$/.test(s)) return 'adjective';
  if (/^(ad\.|adv\.|adverb)$/.test(s)) return 'adverb';
  if (/^(pron\.|pronoun)$/.test(s)) return 'pronoun';
  if (/^(prep\.|preposition)$/.test(s)) return 'preposition';
  if (/^(art\.|article|det\.|determiner)$/.test(s)) return 'determiner';
  if (/^(conj\.|conjunction)$/.test(s)) return 'conjunction';
  return null;
}
const key = (file, line, word) => [
  normalize(file), String(line), normalize(word),
].join('\u0000');

function readIndex(root) {
  const dir = path.join(root,'app/seed');
  const source = new Map();
  const gaokao = new Map();
  if (!fs.existsSync(dir)) return { source, gaokao, sources: [] };
  const usedSources = [];
  const files = fs.readdirSync(dir).sort();
  const jsonFiles = files.filter(f =>
    /^examples-(?:common-[a-z]|extended|numbered)-reviewed-\d+\.json$/.test(f)
    || /^content-batch-\d+\.json$/.test(f));
  for (const file of jsonFiles) {
    const document = JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
    if (!Array.isArray(document.examples)) continue;
    let count=0;
    for (const x of document.examples) {
      if (x.review_status !== 'sense-reviewed'
        || x.authorship !== 'moci-original'
        || !has(x.source_file) || !Number.isInteger(x.source_line)
        || !has(x.word) || !has(x.source_raw)
        || !has(x.text) || !has(x.translation)) continue;
      const id = key(x.source_file,x.source_line,x.word);
      const item = {
        source_file: x.source_file, source_line: x.source_line,
        word: x.word, source_raw: x.source_raw, pos: x.pos,
        meaning: x.meaning, text: x.text, translation: x.translation,
        selected_meaning: x.reviewed_selected_meaning ?? null,
        provenance: 'app/seed/' + file,
        previous_review_status: x.review_status,
        external_human_review: false,
        full_dictionary_senses_reviewed: false,
      };
      const list=source.get(id)||[];
      list.push(item);source.set(id,list);count++;
    }
    usedSources.push({file:'app/seed/'+file,rows:count});
  }
  const tsvFiles=files.filter(f=>/^gaokao-common-[a-j]-\d+\.tsv$/.test(f));
  for (const file of tsvFiles) {
    const text=fs.readFileSync(path.join(dir,file),'utf8');
    const lines=text.replace(/^\uFEFF/,'').trimEnd().split(/\r?\n/);
    const keys=lines.shift().split('\t');
    if (!['headword','pos','meaning','example','example_translation'].every(k=>keys.includes(k)))
      throw Error('Unexpected gaokao TSV columns: '+file);
    let count=0;
    for(const line of lines){
      const fields=line.split('\t');
      const x=Object.fromEntries(keys.map((k,i)=>[k, fields[i]||'']));
      if (!has(x.headword) || !posType(x.pos)
        || !has(x.example) || !has(x.example_translation)) continue;
      const id=normalize(x.headword);
      const list=gaokao.get(id)||[];
      list.push({word:x.headword,pos:x.pos,meaning:x.meaning,
        text:x.example,translation:x.example_translation,note:x.note||'',
        provenance:'app/seed/'+file,external_human_review:false,
        full_dictionary_senses_reviewed:false});
      gaokao.set(id,list);count++;
    }
    usedSources.push({file:'app/seed/'+file,rows:count});
  }
  return {source,gaokao,sources:usedSources};
}

function generate(root=ROOT,{save=true,outputDir=path.join(root,'output/refinement/abc-bulk')}={}) {
  // Checks every manifest file and existing prefix. Refuse to reuse into a
  // workspace whose task identity, original or SHA has drifted.
  const verified=plan(root,{save:false});
  const files=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8')).files;
  const index=readIndex(root);
  const candidates=[],conflicts=[];
  let unmatched=0,alreadyDrafted=0;
  const perWorker={A:0,B:0,C:0};
  for (const task of files) {
    const worker=ownerOf(task.task_id);
    const input=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',task.file),'utf8'));
    const filename=path.join(root,'docs/model-task-results','worker-'+worker,task.task_id,'result.json');
    const drafted=fs.existsSync(filename)
      ? JSON.parse(fs.readFileSync(filename,'utf8')).entries.length : 0;
    alreadyDrafted+=drafted;
    for(let i=drafted;i<input.entries.length;i++){
      const row=input.entries[i];
      let available=[],flags=[];
      if (row.identity && row.current) {
        const old=index.source.get(key(row.identity.source_file,row.identity.source_line,row.identity.word))||[];
        available=old.filter(x=>x.source_raw===row.identity.source_raw
          && (!has(x.pos)||x.pos===row.current.pos)
          && (!has(x.meaning)||x.meaning===row.current.meaning));
        flags=['same-original-identity','prior-model-sense-review-only'];
      } else if (task.task_id.startsWith('gaokao-') && has(row.headword)) {
        const old=index.gaokao.get(normalize(row.headword))||[];
        available=old.filter(x=>(row.candidates||[]).some(c =>
          normalize(c.word)===normalize(row.headword)
          && posType(c.pos)===posType(x.pos)));
        flags=['gaokao-headword-pos-match-only','cross-source-sense-unverified'];
        if(row.handling==='split-headwords' || normalize(row.source_entry)!==normalize(row.headword))
          flags.push('pdf-entry-split-or-alias');
      }
      if (!available.length) {unmatched++;continue;}
      // Don't silently choose between different sentence pairs, even if one
      // file is newer. Identical pairs with multiple source files are okay,
      // with all provenance retained.
      const unique=[...new Set(available.map(x=>JSON.stringify([x.text,x.translation])))];
      if(unique.length>1){
        conflicts.push({worker,task_id:task.task_id,index:i,
          headword:row.identity?.word||row.headword,
          provenance:available.map(x=>x.provenance),reason:'multiple-different-examples'});
        unmatched++;continue;
      }
      const chosen=available[0];
      if(chosen.selected_meaning&&row.current)flags.push('selected-sense-recheck');
      candidates.push({
        worker,task_id:task.task_id,input_sha256:task.sha256,row_index:i,
        identity:row.identity??{headword:row.headword,source_entry:row.source_entry,
          pdf_page:row.pdf_page,handling:row.handling,accepted_spellings:row.accepted_spellings},
        original:row.current??null,
        suggested:{example:chosen.text,example_translation:chosen.translation,
          selected_meaning:chosen.selected_meaning??null},
        provenance:[...new Set(available.map(x=>x.provenance))],
        risk_flags:flags,
        verification:'needs-review',external_human_review:false,
        full_dictionary_senses_reviewed:false,
        instruction:'Verify all original dictionary senses and POS before adding to actual result.json; preserve every existing prefix, never mark accepted automatically.',
      });
      perWorker[worker]++;
    }
  }
  if (alreadyDrafted!==verified.all.result_rows
    || unmatched+candidates.length!==verified.all.rows_not_yet_drafted)
    throw Error('Reuse counts differ from verified full task plan');
  const summary={
    operation:'reuse-verified-identity-local-examples-as-unapproved-candidates',
    input_rows:verified.all.result_rows+verified.all.rows_not_yet_drafted,
    previously_drafted_rows:alreadyDrafted,
    candidates_available:candidates.length,
    still_missing_candidate:unmatched,
    ambiguous_rows_skipped:conflicts.length,
    per_worker:perWorker,
    indexed_sources:index.sources,
    accepted:0,installed:0,
    warning:'These are pre-existing examples from the repository, not independently verified full dictionary entries. Nothing is installed or auto-accepted.',
  };
  if(save){
    fs.mkdirSync(outputDir,{recursive:true});
    // Explicit file names are safe; do not clear other users' outputs.
    fs.writeFileSync(path.join(outputDir,'reuse-summary.json'),JSON.stringify(summary,null,2)+'\n');
    fs.writeFileSync(path.join(outputDir,'reuse-candidates.json'),JSON.stringify(candidates,null,2)+'\n');
    fs.writeFileSync(path.join(outputDir,'reuse-conflicts.json'),JSON.stringify(conflicts,null,2)+'\n');
  }
  return {summary,candidates,conflicts};
}
if(require.main===module)console.log(JSON.stringify(generate().summary,null,2));
module.exports={generate,readIndex,posType};
