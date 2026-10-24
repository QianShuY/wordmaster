'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { rules } = require('../scripts/audit-abc-example-quality');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/model-tasks-20261015/manifest.json'), 'utf8'));
const expected = [
  {
    "task": "cet4-040",
    "index": 32,
    "word": "billion",
    "en": "The charity raised one billion yuan to rebuild the schools.",
    "cn": "这家慈善机构筹集了十亿元人民币，用于重建学校。",
    "sourceLine": 399,
    "sourceRaw": "billion [ˈbiljən] num.万亿(英)",
    "selectedSense": {
      "pos": "num.",
      "meaning": "十亿（现代通用）；万亿（历史英式用法）"
    }
  },
  {
    "task": "cet4-041",
    "index": 77,
    "word": "cheat",
    "en": "The scammer cheated several pensioners out of their savings.",
    "cn": "骗子骗走了几位养老金领取者的积蓄。",
    "sourceLine": 638,
    "sourceRaw": "cheat [t∫iːt] vt.骗取；哄 vi.行骗",
    "selectedSense": {
      "pos": "vt.",
      "meaning": "骗取；哄 vi. 行骗；作弊"
    }
  },
  {
    "task": "cet6-019",
    "index": 2,
    "word": "traverse",
    "en": "Hikers used a marked trail to traverse the rocky valley.",
    "cn": "徒步者沿着标记清晰的小径穿过岩石遍布的山谷。",
    "sourceLine": 2146,
    "sourceRaw": "traverse [trəˈvɜːs] v. 横越，穿过 n. 1. 横越，贯穿 2. 横断物，横杆，横线",
    "selectedSense": {
      "pos": "v.",
      "meaning": "横越，穿过 n. 1. 横越，贯穿 2. 横断物，横杆，横线"
    }
  },
  {
    "task": "cet6-019",
    "index": 12,
    "word": "triple",
    "en": "The hotel charged triple the usual rate during the festival.",
    "cn": "节日期间，这家酒店收取了平时三倍的房价。",
    "sourceLine": 2156,
    "sourceRaw": "triple [ˈtrɪpl] adj. 三倍的，三重的 v. 增至三倍",
    "selectedSense": {
      "pos": "adj.",
      "meaning": "三倍的，三重的 v. 增至三倍"
    }
  },
  {
    "task": "cet6-019",
    "index": 17,
    "word": "tug",
    "en": "The toddler tugged at his father's sleeve to get his attention.",
    "cn": "小孩拉了拉父亲的袖子，想引起他的注意。",
    "sourceLine": 2161,
    "sourceRaw": "tug [tʌɡ] v. 用力拖，使劲拉 n. 1. 猛拉，拖 2. 拖船(=tugboat)",
    "selectedSense": {
      "pos": "v.",
      "meaning": "用力拖，使劲拉 n. 1. 猛拉，拖 2. 拖船(=tugboat)"
    }
  },
  {
    "task": "cet6-019",
    "index": 19,
    "word": "tumble",
    "en": "He took a tumble on the wet steps but was not badly hurt.",
    "cn": "他在湿滑的台阶上摔了一跤，但伤得不重。",
    "sourceLine": 2163,
    "sourceRaw": "tumble [ˈtʌmbl] n. 1. 滚动，翻滚 2. 体操技巧动作表演 3. 跌倒，跌落，下台 v. 1. 跌倒，滚落 2. 忽然下台，垮台 3. 领会，顿悟",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. 滚动，翻滚 2. 体操技巧动作表演 3. 跌倒，跌落，下台 v. 1. 跌倒，滚落 2. 忽然下台，垮台 3. 领会，顿悟"
    }
  },
  {
    "task": "cet6-019",
    "index": 21,
    "word": "turbulent",
    "en": "The small plane shook as it crossed a turbulent patch of air.",
    "cn": "小型飞机穿过一片紊乱气流时剧烈颠簸。",
    "sourceLine": 2165,
    "sourceRaw": "turbulent [ˈtɜːbjʊlənt] adj. 1. (空气或水)流动猛烈而不稳定的 2. 混乱的，不安的",
    "selectedSense": {
      "pos": "adj.",
      "meaning": "1. (空气或水)流动猛烈而不稳定的 2. 混乱的，不安的"
    }
  },
  {
    "task": "cet6-019",
    "index": 31,
    "word": "undermine",
    "en": "Repeated delays undermined the team's confidence in the project.",
    "cn": "一再拖延削弱了团队对这个项目的信心。",
    "sourceLine": 2175,
    "sourceRaw": "undermine [ˌʌndəˈmaɪn] v. 1. 损毁…的地基 2. 削弱 3. 逐渐摧毁",
    "selectedSense": {
      "pos": "v.",
      "meaning": "1. 损毁…的地基 2. 削弱 3. 逐渐摧毁"
    }
  },
  {
    "task": "cet6-019",
    "index": 37,
    "word": "upgrade",
    "en": "The hotel upgraded our room at no extra charge.",
    "cn": "酒店免费为我们升级了房间。",
    "sourceLine": 2183,
    "sourceRaw": "upgrade [ˌʌpˈɡreɪd] v. 提高某人(某事物)的级别或等级，提高…档次 || upgrade sb (sth) to sb (sth)提升",
    "selectedSense": {
      "pos": "v.",
      "meaning": "提高某人(某事物)的级别或等级，提高…档次 || upgrade sb (sth) to sb (sth)提升"
    }
  },
  {
    "task": "cet6-019",
    "index": 38,
    "word": "uphold",
    "en": "The appeals court upheld the original ruling.",
    "cn": "上诉法院维持了原判。",
    "sourceLine": 2184,
    "sourceRaw": "uphold [ˌʌpˈhəʊd] v. 1. 举起 2. 支持",
    "selectedSense": {
      "pos": "v.",
      "meaning": "1. 举起 2. 支持"
    }
  },
  {
    "task": "cet6-019",
    "index": 41,
    "word": "urge",
    "en": "Her parents urged her to apply for the scholarship.",
    "cn": "父母力劝她申请这项奖学金。",
    "sourceLine": 2187,
    "sourceRaw": "urge [ɜːdʒ] v. 催促，力劝，激励 n. 1. 驱策力，推动力 2. 强烈的欲望，迫切的要求",
    "selectedSense": {
      "pos": "v.",
      "meaning": "催促，力劝，激励 n. 1. 驱策力，推动力 2. 强烈的欲望，迫切的要求"
    }
  },
  {
    "task": "cet6-019",
    "index": 75,
    "word": "violate",
    "en": "The company was fined for violating environmental regulations.",
    "cn": "这家公司因违反环境法规而被罚款。",
    "sourceLine": 2223,
    "sourceRaw": "violate [ˈvaɪəleɪt] v. 1. 违犯，违反 2. 侵犯，妨碍",
    "selectedSense": {
      "pos": "v.",
      "meaning": "1. 违犯，违反 2. 侵犯，妨碍"
    }
  },
  {
    "task": "cet6-019",
    "index": 78,
    "word": "virtual",
    "en": "Students joined the virtual classroom from home.",
    "cn": "学生们在家登录了虚拟课堂。",
    "sourceLine": 2226,
    "sourceRaw": "virtual [ˈvәːtʃuәl] a. 1. 实质上的；事实上的 2. (计算机)虚拟的",
    "selectedSense": {
      "pos": "a.",
      "meaning": "1. 实质上的；事实上的 2. (计算机)虚拟的"
    }
  },
  {
    "task": "cet6-019",
    "index": 85,
    "word": "vocational",
    "en": "She enrolled in a vocational program to train as an electrician.",
    "cn": "她报名参加职业培训项目，学习成为电工。",
    "sourceLine": 2234,
    "sourceRaw": "vocational [vәuˈkeiʃәnl] a. 职业的，行业的，业务的",
    "selectedSense": {
      "pos": "a.",
      "meaning": "职业的，行业的，业务的"
    }
  },
  {
    "task": "cet6-020",
    "index": 12,
    "word": "withhold",
    "en": "The bank withheld payment until the required documents were verified.",
    "cn": "银行在核验所需文件前暂缓了付款。",
    "sourceLine": 2261,
    "sourceRaw": "withhold [wɪðˈhəʊld] v. 不给，拒绝",
    "selectedSense": {
      "pos": "v.",
      "meaning": "不给，拒绝"
    }
  },
  {
    "task": "cet6-020",
    "index": 17,
    "word": "wrench",
    "en": "He wrenched the stuck gate open with both hands.",
    "cn": "他用双手猛地扳开了卡住的大门。",
    "sourceLine": 2266,
    "sourceRaw": "wrench [rentʃ] n. & v. 猛拧，一扭",
    "selectedSense": {
      "pos": "n.&v.",
      "meaning": "猛拧，一扭"
    }
  },
  {
    "task": "cet6-020",
    "index": 23,
    "word": "yoke",
    "en": "The farmer placed a wooden yoke across the oxen's necks before attaching the plough.",
    "cn": "农夫先把木轭架在两头牛的脖子上，再套上犁。",
    "sourceLine": 2272,
    "sourceRaw": "yoke [jәuk] n. 1. 轭，牛轭 2. 束缚 v. 1. 给……上轭 2. 连接，结合，使匹配",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. 轭，牛轭 2. 束缚 v. 1. 给……上轭 2. 连接，结合，使匹配"
    }
  },
  {
    "task": "cet6-020",
    "index": 28,
    "word": "abortion",
    "en": "The report examines how access to abortion services varies by region.",
    "cn": "这份报告考察了不同地区获得堕胎服务的情况。",
    "sourceLine": 4,
    "sourceRaw": "abortion [әˈbɒːʃәn] n. 1. 流产，小产，堕胎 2. (计划、工程等的)中途失败;中止，中辍的计划",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. 流产，小产，堕胎 2. (计划、工程等的)中途失败;中止，中辍的计划"
    }
  },
  {
    "task": "cet6-021",
    "index": 10,
    "word": "analyse",
    "en": "The researchers analysed the survey responses by age group before drawing conclusions.",
    "cn": "研究人员按年龄组分析了问卷答复，然后才得出结论。",
    "sourceLine": 88,
    "sourceRaw": "analyse [ˈænәlaiz] v. 分析，细察，分解",
    "selectedSense": {
      "pos": "v.",
      "meaning": "分析，细察，分解"
    }
  },
  {
    "task": "cet6-023",
    "index": 39,
    "word": "explore",
    "en": "The researchers explored several explanations for the unexpected result.",
    "cn": "研究人员探究了这一意外结果的几种解释。",
    "sourceLine": 855,
    "sourceRaw": "explore [ɪkˈsplɔː] v. 1. 探究，探索 2. 勘探，探险，探测",
    "selectedSense": {
      "pos": "v.",
      "meaning": "1. 探究，探索 2. 勘探，探险，探测"
    }
  },
  {
    "task": "cet6-023",
    "index": 41,
    "word": "glide",
    "en": "A swan glided across the lake without making a sound.",
    "cn": "一只天鹅悄无声息地滑过湖面。",
    "sourceLine": 987,
    "sourceRaw": "glide [ɡlaɪd] v. &n. 1. 滑动，滑行 2. 滑翔",
    "selectedSense": {
      "pos": "v.&n.",
      "meaning": "1. 滑动，滑行 2. 滑翔"
    }
  }
];
test('CET-4/CET-6: source-locked bilingual example repairs', () => {
  assert.equal(expected.length, 21);
  assert.equal(new Set(expected.map(x => x.task + ':' + x.index)).size, 21);
  for (const row of expected) {
    const task = manifest.files.find(x => x.task_id === row.task);
    assert.ok(task, 'manifest task: ' + row.task);
    const src = JSON.parse(fs.readFileSync(path.join(root, 'docs/model-tasks-20261015', task.file), 'utf8'));
    const result = JSON.parse(fs.readFileSync(path.join(root, 'docs/model-task-results/worker-A', row.task, 'result.json'), 'utf8'));
    assert.equal(result.task_id, row.task);
    assert.equal(result.status, 'proposal');
    assert.equal(result.input_sha256, task.sha256);
    assert.equal(result.entries.length, task.rows);
    assert.equal(src.entries.length, task.rows);
    const e = result.entries[row.index];
    const source = src.entries[row.index];
    assert.deepEqual(e.identity, source.identity);
    assert.deepEqual(e.original, source.current);
    assert.equal(e.identity.word, row.word);
    assert.equal(e.identity.source_line, row.sourceLine);
    assert.equal(e.identity.source_raw, row.sourceRaw);
    assert.deepEqual(e.selected_sense, row.selectedSense);
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
      'mechanical-template regression: ' + row.task + '/' + row.word
    );
  }
});
