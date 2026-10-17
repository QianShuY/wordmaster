# 墨词 ABC 例句续写进展（2026-10-17）

## 本轮实写内容

本轮继续 **A/B 已有任务断点**，不是重新拆分词库，也不改变高考词表版本。

| Worker | 已新增完整任务 | 新增英文例句 + 中文译文对 | 当前实际草稿条数 |
|---|---|---:|---:|
| A（四级当前阶段） | cet4-020、cet4-021 | 200 | 2,100 |
| B（考研当前阶段） | npee-041、npee-042 | 200 | 4,200 |
| C（专四专八尾段） | 不改动 | 0 | 8,839 |
| **总计** | **4 份 × 100** | **400** | **15,139 / 26,612** |

相较本轮开始时 14,739 条草稿，尚未写出的为 **11,473** 条。注意全部 **15,139 条均为模型草稿**，不能当作词典内容审校通过或正式发布完成。

每条新增记录保留原始 `identity` 和 `original`，填写 `selected_sense`、`proposed.example`、`proposed.example_translation`，未提供独立词典证据的 `evidence=[]`，`verification=needs-review`、`external_human_review=false`、`full_dictionary_senses_reviewed=false`。200 对四级、200 对考研全部为逐词撰写的语境例句；未批量拼接固定模板，也没有把未审查跨书同形词映射直接写回结果。

## 重点审阅风险

- `oriental`：涉及过时表达与适用语境，保留单独审核提示。
- `our`、`overall`、`outskirt`、`pant`：源词性和现代常见用法存在差异或拼写单复数问题；例句不意味着确认原词表词性准确。
- `thrift`：考研来源标 `a.`，但语境演示的是名词“节俭”；显式标记 `selected_sense.pos=n.` 并保留原始 `original.pos=a.`，**不得直接批准或据此覆盖**。
- 其余多义词（如 `tear`、`swallow`、`support`、`temple`）只展示单一义项，完整义项和英式 IPA 仍待审。

## 不触碰用户学习数据

结果写入 `docs/model-task-results/worker-A|B/<task>/result.json`，同步各 worker 的 `progress.json`，没有操作 `app/seed`、`data`、用户本地 SQLite 或 Android 数据，也没有运行重置命令。后续正式入库必须依据独立词典核查、来源绑定与已存在的备份事务流程执行。

回归 `test/abc-new-bilingual-batches.test.js` 确保四份 100 行任务完整、来源 SHA 一致、英文含目标词、中文不为空、风险标注存在且不冒认来源审核。旧 ABC coverage 测试改为依实际 manifest 和现有 result 长度动态计算，防止内容推进使历史快照值导致 CI 误报。

下一步仍是连续补齐 **11,473 条待写候选**，并且分开做 **15,139 条候选的独立质量审核**。不要把“草稿已补齐”宣传为“单词已通过审校”。高考来源和最终 Windows EXE 发布仍是后续独立关口。
