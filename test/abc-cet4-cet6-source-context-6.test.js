'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { rules } = require('../scripts/audit-abc-example-quality');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/model-tasks-20261015/manifest.json'), 'utf8'));
const expected = [
  {
    "task": "cet4-042",
    "index": 47,
    "word": "commit",
    "en": "The witness saw the man commit the crime.",
    "cn": "目击者看到那名男子实施了犯罪行为。",
    "sourceLine": 752,
    "sourceRaw": "commit [kəˈmit] vt.犯(错误);干(坏事) ",
    "selectedSense": {
      "pos": "vt.",
      "meaning": "犯(错误);干(坏事)"
    },
    "originalEn": "The evidence does not show who might commit the crime.",
    "originalCn": "这些证据没有表明谁可能犯下这起罪行。"
  },
  {
    "task": "cet4-044",
    "index": 36,
    "word": "dimension",
    "en": "The engineers checked the dimensions of the doorway before ordering a new frame.",
    "cn": "工程师在订购新门框前核对了门洞的尺寸。",
    "sourceLine": 1094,
    "sourceRaw": "dimension [diˈmen∫ən] n.尺寸，尺度；面积",
    "selectedSense": {
      "pos": "n.",
      "meaning": "尺寸，尺度；面积"
    },
    "originalEn": "The diagram gives the dimension of each side of the frame.",
    "originalCn": "示意图给出了框架每条边的尺寸。"
  },
  {
    "task": "cet4-044",
    "index": 49,
    "word": "disease",
    "en": "A fungal disease spread rapidly through the orchard after weeks of rain.",
    "cn": "连续下了几周雨后，一种真菌病害迅速蔓延至整个果园。",
    "sourceLine": 1119,
    "sourceRaw": "disease [diˈziːz] n.病，疾病；病害",
    "selectedSense": {
      "pos": "n.",
      "meaning": "病，疾病；病害"
    },
    "originalEn": "The researchers collected information about a disease affecting local trees.",
    "originalCn": "研究人员收集了一种影响当地树木的疾病的信息。"
  },
  {
    "task": "cet6-023",
    "index": 6,
    "word": "dignity",
    "en": "The nurses protected each patient's dignity during medical examinations.",
    "cn": "护士们在体检过程中维护每位患者的尊严。",
    "sourceLine": 640,
    "sourceRaw": "dignity [ˈdɪɡnətɪ] n. 1. 尊严，高贵，体面 2. 庄严，端庄 3. 官阶，职位 || beneath one's dignity有失某人身份(体面) /stand on one's dignity坚持受到应有的礼遇，保持尊严",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. 尊严，高贵，体面 2. 庄严，端庄 3. 官阶，职位 || beneath one's dignity有失某人身份(体面) /stand on one's dignity坚持受到应有的礼遇，保持尊严"
    },
    "originalEn": "Every visitor should be treated with dignity and respect.",
    "originalCn": "每位访客都应得到有尊严且受尊重的对待。"
  },
  {
    "task": "cet6-023",
    "index": 7,
    "word": "dimension",
    "en": "The engineers checked the dimensions of the doorway before ordering a new frame.",
    "cn": "工程师在订购新门框前核对了门洞的尺寸。",
    "sourceLine": 645,
    "sourceRaw": "dimension [daiˈmenʃәn] n. 维数，尺寸，面积 v. 标出尺寸",
    "selectedSense": {
      "pos": "n.",
      "meaning": "维数，尺寸，面积 v. 标出尺寸"
    },
    "originalEn": "The diagram gives the dimension of each side of the frame.",
    "originalCn": "示意图给出了框架每条边的尺寸。"
  },
  {
    "task": "cet6-023",
    "index": 11,
    "word": "disease",
    "en": "A fungal disease spread rapidly through the orchard after weeks of rain.",
    "cn": "连续下了几周雨后，一种真菌病害迅速蔓延至整个果园。",
    "sourceLine": 664,
    "sourceRaw": "disease [dɪˈziːz] n. 疾病，弊病，病害  v. 使有病，使不健全",
    "selectedSense": {
      "pos": "n.",
      "meaning": "疾病，弊病，病害  v. 使有病，使不健全"
    },
    "originalEn": "The researchers collected information about a disease affecting local trees.",
    "originalCn": "研究人员收集了一种影响当地树木的疾病的信息。"
  }
];
test('CET-4/CET-6: six source-bound context and translation edits remain unpublished candidates', () => {
  assert.equal(expected.length, 6);
  assert.equal(new Set(expected.map(x => x.task + ':' + x.index)).size, 6);
  const byTask = new Map();
  for (const row of expected) {
    if (!byTask.has(row.task)) {
      const meta = manifest.files.find(x => x.task_id === row.task);
      assert.ok(meta, 'missing manifest ' + row.task);
      const src = JSON.parse(fs.readFileSync(path.join(root, 'docs/model-tasks-20261015', meta.file), 'utf8'));
      const result = JSON.parse(fs.readFileSync(path.join(root, 'docs/model-task-results/worker-A', row.task, 'result.json'), 'utf8'));
      assert.equal(result.input_sha256, meta.sha256);
      assert.equal(result.status, 'proposal');
      assert.equal(result.entries.length, meta.rows);
      assert.equal(src.entries.length, meta.rows);
      for (let i = 0; i < meta.rows; i++) {
        assert.deepEqual(result.entries[i].identity, src.entries[i].identity);
        assert.deepEqual(result.entries[i].original, src.entries[i].current);
      }
      byTask.set(row.task, result);
    }
    const e = byTask.get(row.task).entries[row.index];
    assert.equal(e.identity.word, row.word);
    assert.equal(e.identity.source_line, row.sourceLine);
    assert.equal(e.identity.source_raw, row.sourceRaw);
    assert.deepEqual(e.selected_sense, row.selectedSense);
    assert.equal(e.original.example, row.originalEn);
    assert.equal(e.original.example_translation, row.originalCn);
    assert.equal(e.proposed.example, row.en);
    assert.equal(e.proposed.example_translation, row.cn);
    assert.equal(e.draft_method, 'editorial-context-rewrite-needs-review');
    assert.equal(e.verification, 'needs-review');
    assert.equal(e.external_human_review, false);
    assert.equal(e.full_dictionary_senses_reviewed, false);
    assert.deepEqual(e.evidence, []);
    assert.ok(row.en.endsWith('.') && row.cn.endsWith('。'));
    assert.deepEqual(
      rules.filter(r => r.pattern.test(r.id === 'translation-metalinguistic' ? row.cn : row.en)).map(r => r.id),
      [],
      'mechanical template regression: ' + row.task + '/' + row.word
    );
  }
});
