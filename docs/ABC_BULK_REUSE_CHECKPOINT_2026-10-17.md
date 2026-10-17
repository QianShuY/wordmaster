# ABC 全量批处理：原有双语例句回收结果（2026-10-17）

分支：`feat/moci-web-handoff-20261016`；GitHub Actions 成功运行：[39023845440](https://github.com/QianShuY/wordmaster/actions/runs/39023845440)。

## 实际执行成果

在任务清单 26,612 条中，已有 A/B/C worker 草稿 14,739 条；其余 11,873 条仍待处理。本轮新增可复用工具 `scripts/reuse-abc-local-examples.js`，直接从本仓库已有的 `app/seed/examples-*-reviewed-*.json` 与 `app/seed/gaokao-common-*.tsv` 读取已写过的双语句对，**不调用付费 API，不改原输入，不写用户 SQLite**。

Node 24 CI 最终实跑结果：

| 指标 | 数量 |
|---|---:|
| 总输入 | 26,612 |
| 已有草稿 | 14,739 |
| 新找回并按来源匹配的双语候选 | **1,640** |
| 其中 A | 912 |
| 其中 B | 728 |
| 其中 C | 0（C 已全部有草稿） |
| 仍没有例句候选的输入行 | **10,233** |
| 含冲突而跳过的行 | 0 |
| 独立 full dictionary accepted | 0 |
| 正式 installed | 0 |

**重要：1,640 是可复用的候选数量，不是新导入正式 `result.json` 的条目数量，也不是合格批准量。** 草稿行数仍是 14,739。新的 candidate 仅作为待审的可复制建议，通过 `task_id + input_sha256 + row_index + identity` 回写后仍需独立审核；不得直接替换 seed 或学习历史。

## 一次执行

```bash
npm run abc:bulk
npm run abc:reuse
```

`abc:bulk` 生成 A/B/C 所有未起稿词条及所有草稿独立复核的全量工作包；`abc:reuse` 在严格保留身份/行位置条件下，从已有审校资料识别双语句对，在 `output/refinement/abc-bulk/` 添加：

- `reuse-summary.json`：匹配数量、分组及来源。
- `reuse-candidates.json`：1,640 条包含英文、中文、来源文件、任务 ID、哈希、序号与风险标志的候选。
- `reuse-conflicts.json`：同一来源匹配到不同例句时不擅自选择；本轮实跑为 0 条。

GitHub CI 在每次推送上都会运行两步，附加完整的 `abc-bulk-work-packets` Artifact。最新一次执行已完成 **195 项测试，195 项通过**；其中包括严格身份和不覆盖既有 worker 结果的回归测试。下载路径：[GitHub Actions Artifact](https://github.com/QianShuY/wordmaster/actions/runs/39023845440/artifacts/12097702333)。

## 审核门槛

- 含原始词条行信息的例句，要求 source_file/source_line/source_raw/word 及已有 POS、释义信息一致。不能单纯以同一个英语词头判为同一义项。
- 高考任务的 `headword` 另用匹配的来源候选词性约束，并一律标记 `gaokao-headword-pos-match-only`、`cross-source-sense-unverified`；它只是一条候选线索，不能因为 POS 一样就审核通过。
- `sense-reviewed` 是历史模型的单义项审阅声明，不是人工审阅或独立原词典全义项证明。
- 不存在例句来源匹配的 10,233 行继续留在待起稿队列；即使使用其它开放语料，也不能跨词性/同形词/义项机械拼接。
- 未调用外部 AI、不改进正式词库、没有执行重置命令；真实学习和收藏数据保持不动。

下一步应由内容审校执行者在批量工作包基础上，**先使用这 1,640 条候选进行原义项和例句配对核对，再处理剩余 10,233 条无候选行，之后对全部候选进行全义项审校**。直到可追溯独立来源复核达标前，`accepted` 和 `installed` 必须为 0。
