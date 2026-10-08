'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..', '..', '..');
const database = new DatabaseSync(path.join(root, 'data', 'wordmaster.db'), { readOnly: true });
const cards = database.prepare('SELECT id, title, category, rarity, palette, hidden, unlock_at FROM cards ORDER BY id').all();
database.close();
const publicCopy = JSON.parse(fs.readFileSync(path.join(root, 'static', 'cards', 'card-copy.json'), 'utf8'));
const hiddenCopy = JSON.parse(fs.readFileSync(path.join(root, 'app', 'seed', 'card-copy.hidden.json'), 'utf8'));
const copy = { ...publicCopy, ...hiddenCopy };

const lines = [
  '# 墨藏集 · 62 张卡牌内容清单',
  '',
  '供本轮全量卡面与中英收藏寄语复审。科普正文、札记和外部来源链接已移除。',
  '',
  '隐藏卡在这份开发清单中保留完整文案；运行中的卡册只通过 `/api/cards/copy` 返回已解锁隐藏卡的内容。',
  '',
  `卡牌条目：${cards.length}；普通卡：${cards.filter(c => !c.hidden).length}；隐藏卡：${cards.filter(c => c.hidden).length}。`,
  '',
];

for (const card of cards) {
  const content = copy[card.palette];
  if (!content) throw new Error(`Missing copy for palette ${card.palette}`);
  lines.push(`## ${card.id}. ${card.title} · ${card.rarity} ${card.hidden ? '· 隐藏卡' : ''}`);
  lines.push('');
  lines.push(`- palette：\`${card.palette}\` · ${card.category}`);
  if (content.coverLine) lines.push(`- 封面短句：${content.coverLine}`);
  lines.push(`- 收藏寄语：${content.encouragement}`);
  lines.push(`- English：${content.englishEncouragement}`);
  lines.push('');
}

fs.writeFileSync(path.join(root, 'docs', 'PHASE_C_CONTENT_INVENTORY.md'), `${lines.join('\n')}\n`, 'utf8');
console.log(`Wrote ${cards.length} card entries to docs/PHASE_C_CONTENT_INVENTORY.md`);
