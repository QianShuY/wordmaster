'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root,p), 'utf8'));
const manifest = read('docs/model-tasks-20261015/manifest.json');
const safe = (w,id) => read('docs/model-task-results/worker-' + w + '/' + id + '/result.json');

for (const [worker, task] of [['A','cet4-019'],['B','npee-040']]) {
  test(worker + ' ' + task + ' has 100 identity-preserving draft rows, not 100 accepted senses', () => {
    const item = manifest.files.find(f => f.task_id === task);
    assert.ok(item);
    const inputFile = path.join(root,'docs/model-tasks-20261015',item.file);
    const bytes = fs.readFileSync(inputFile);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256);
    const input = JSON.parse(bytes.toString('utf8'));
    const proposal = safe(worker,task);
    assert.equal(proposal.input_sha256,item.sha256);
    assert.equal(proposal.task_id,task);
    assert.equal(proposal.status,'proposal');
    assert.equal(proposal.entries.length,100);
    for (let i=0;i<100;i++) {
      const row = proposal.entries[i], initial = input.entries[i];
      assert.deepEqual(row.identity,initial.identity,'identity '+task+':'+i);
      assert.deepEqual(row.original,initial.current,'original '+task+':'+i);
      assert.ok(row.proposed.example && row.proposed.example_translation,
        'pair missing '+task+':'+i);
      assert.deepEqual(row.evidence,[],'do not invent dictionary access');
      assert.equal(row.proposed.phonetic,null,'do not invent validated IPA');
      assert.equal(row.verification,'needs-review');
      assert.equal(row.full_dictionary_senses_reviewed,false);
      assert.equal(row.external_human_review,false);
    }
    const progress = read('docs/model-task-results/worker-'+worker+'/progress.json');
    assert.equal(progress.tasks.find(x=>x.task_id===task)?.processed_rows,100);
  });
}

test('known A/B POS and sense exceptions remain visible instead of silently approved', () => {
  const a = safe('A','cet4-019').entries;
  const b = safe('B','npee-040').entries;
  const find = (set,word) => set.find(x=>x.identity.word===word);
  assert.match(find(a,'north').proposed.example,/to the north of/);
  assert.equal(find(a,'nothing').original.pos,'n.');
  assert.equal(find(a,'nothing').selected_sense.pos,'pron.');
  assert.match(find(a,'orange').proposed.example,/orange tree/);
  assert.equal(find(b,'streamline').original.pos,'a.');
  assert.equal(find(b,'streamline').selected_sense.pos,'vt.');
  for (const x of [find(a,'nothing'),find(a,'orange'),find(b,'streamline')]) {
    assert.equal(x.verification,'needs-review');
    assert.ok(x.issues.length>1);
  }
});

test('round three is a draft increase, not approval or database installation', () => {
  const { plan } = require('../scripts/plan-next-model-review');
  const p = plan(root,{save:false});
  assert.ok(p.all.result_rows >= 14739);
  assert.equal(p.all.result_rows + p.all.rows_not_yet_drafted,26612);
  assert.equal(p.acceptance.accepted,0);
  assert.equal(p.acceptance.installed,0);
});

test('C tem-125 repaired selected meanings match four actual example senses', () => {
  const rows = read('docs/model-task-results/worker-C/tem-125/result.json').entries;
  const checks = [
    ['quiet', /安静/, /room became quiet/, 'oxfordlearnersdictionaries.com'],
    ['refreshment', /茶点|点心和饮料/, /refreshments were served/, 'merriam-webster.com'],
    ['relish', /乐趣/, /with great relish/, 'merriam-webster.com'],
    ['multiply', /相乘/, /by three/, 'merriam-webster.com'],
  ];
  for (const [word, meaning, example, domain] of checks) {
    const row = rows.find(e => e.identity.word === word);
    assert.ok(row, word);
    assert.match(row.selected_sense.meaning, meaning);
    assert.match(row.proposed.example, example);
    assert.equal(row.verification,'needs-review');
    assert.notEqual(row.full_dictionary_senses_reviewed,true);
    assert.notEqual(row.external_human_review,true);
    assert.ok(row.evidence.some(e => e.independent_primary_page_review===true
      && e.accessed===true && e.url.includes(domain)));
    assert.ok(row.issues.some(x => x?.code==='independent-partial-sense-repair'));
  }
});
