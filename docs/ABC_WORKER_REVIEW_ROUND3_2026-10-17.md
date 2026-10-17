# 墨词 A/B/C 第三轮接续与局部词典复核

日期：2026-10-17
分支：`feat/moci-web-handoff-20261016`

## 本轮提交与独立口径

| 模型 | 现有候选结果行 | 任务总行 | 未产出 | 本轮变化 | 独立完整审核通过 |
|---|---:|---:|---:|---|---:|
| A | 1,900 | 8,932 | 7,032 | `cet4-019` 新增 100 条候选（双语句对） | 0 |
| B | 4,000 | 8,841 | 4,841 | `npee-040` 新增 100 条候选（双语句对） | 0 |
| C | 8,839 | 8,839 | 0 | `tem-125` 原 39 条中修正 4 个选定义项/例句不匹配问题 | 0 |
| **合计** | **14,739** | **26,612** | **11,873** | **200 条新候选、4 条局部词典复核** | **0** |

数字来自本轮结果文件与同步后的 worker A/B `progress.json`，审计以 result.json 实际值为准。所有新增行均为 `verification: needs-review`、`external_human_review: false` 和 `full_dictionary_senses_reviewed: false`，无臆造的 UK IPA 和词典访问。C 原结果仅作局部词义修复，仍不代表 C 已经全量语言审核通过。

## A/B 新批次

- A：`docs/model-task-results/worker-A/cet4-019/result.json`（100/100），有原始 `task_id`、`input_sha256`、`identity` 和 `original`，仅新增供复核的原创双语例句。留意 `nothing` 的源词性 n. 与不定代词用法不一致、`orange` 的原释义只列橙树/柑树义，以及复合词和多词性源条目。第二轮复查把 `north` 例句改为名词义，`orange` 例句改为橙树义，候选 `nothing` 明示代词词性。
- B：`docs/model-task-results/worker-B/npee-040/result.json`（100/100）。风险项包括 `streamline` 在源词库有形容词和及物动词用法，候选例句选择动词义并显式写 `selected_sense.pos=vt.`；`strike` 等多义项只提供指定语境，仍待全量复核。
- 不以一个句子冒充整个词条的完整词性、同形词和多义项审校。前一批的六条空例句风险仍然保留，不能因本批全是成对例句而被掩盖。

## C：直接词典页面复核的四处修订

在 `tem-125` 39 行中，确认至少四处**选定释义与例句的语义不匹配**，不靠是否存在 example 字段判断质量。原 `identity` 和 `original` 不变。

1. `quiet`：原 `selected_sense.meaning` 错写成“短暂的一段时间”；例句中的 quiet 是“安静的”。打开 [Oxford Learner's quiet adjective](https://www.oxfordlearnersdictionaries.com/us/definition/english/quiet_1)，修正选义项并保留其它原义。
2. `refreshment`：原选义为简餐、茶点，例句却是水使人“精神为之一振”。打开 [Merriam-Webster refreshment](https://www.merriam-webster.com/dictionary/refreshment)，改为复数 `refreshments` 在会议后提供茶点，对应茶点义。原词还有恢复精神义。
3. `relish`：原源词性为名词，但所选英文释义为“to enjoy ...”的动词表达。打开 [Merriam-Webster relish](https://www.merriam-webster.com/dictionary/relish)，修正为名词“乐趣、兴致”，匹配原有 `with great relish` 例句。
4. `multiply`：原草稿不正确地定义为一个数乘以它自身若干次；实际原例句是“乘以三”。打开 [Merriam-Webster multiply](https://www.merriam-webster.com/dictionary/multiply)，改为“两个数相乘／计算乘积”，保留增多、繁殖等未完成审核的义项。

这四条均追加 `independent_primary_page_review:true` 的原始词典地址与所核对义项；只有有据核验到英式 IPA 的 `quiet` 填相应字段。Merriam-Webster 页面提供的美式读音不伪称已核实英国音标。**四条仍保持 needs-review**，不可作为全义项 accepted，也不触发任何正式词库更新。

## 数据保护、质量门槛

- 以任务 manifest SHA、原位置与原字段为判断依据，不覆盖先前完整或进行中的结果。
- 每次提交后运行 Node 24 GitHub Actions 的回归与模型结构审计。只有完成的检查才可在用户汇报为通过。
- 不运行 `rebuild-vocabulary.js --apply-reset`，不访问或修改真实学习 SQLite、不覆盖用户收藏和计划，不执行正式内容安装或 Windows EXE 打包。
- 下一批 A `cet4-020`、B `npee-041`；C 优先找“例句存在但是 selected_sense 错误”的深层质量问题，而不只是自动统计空例句。

**正式审核 accepted/installed 仍是 0，不要把 14,739 条草稿写成已完成学习内容。**
