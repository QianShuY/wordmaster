'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { VERSION, CATALOG, buildBook } = require('../app/vocabulary');
const reports = CATALOG.map(spec => buildBook(spec).report);
for (const r of reports) {
  if (r.nonempty !== r.accepted + r.duplicates + r.excluded + r.headings) throw new Error(`审计数量不一致: ${r.file}`);
}
const dest = path.join(__dirname, '../docs/vocabulary-audit');
fs.mkdirSync(dest, { recursive: true });
fs.writeFileSync(path.join(dest, 'report.json'), JSON.stringify({ version: VERSION, reports }, null, 2) + '\n');
fs.writeFileSync(path.join(dest, 'README.md'), `# 内置词库构建审计 ${VERSION}\n\n本报告自动生成，只表示结构检查与收录情况，不代表所有释义均已人工审校，也不代表官方完整考纲。存疑行保存在 report.json，不进入新构建词库。\n\n| 词库 | 非空源行 | 收录词条 | 不同词头 | 标题 | 相同重复 | 待核验 | 字母覆盖 |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n` + reports.map(r => `| ${r.name} | ${r.nonempty} | ${r.accepted} | ${r.unique_headwords} | ${r.headings} | ${r.duplicates} | ${r.excluded} | ${r.letters} |`).join('\n') + '\n\n运行：`node scripts/audit-vocabulary.js`。原始文件 SHA-256、行号、异常原文和已确认修正数量见 report.json。\n');
console.log(reports.map(({ issues, ...r }) => r));
