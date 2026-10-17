# 墨词 ABC：跨词书候选检索与去重结果（2026-10-17）

目标分支：`feat/moci-web-handoff-20261016`。基于交接源清单 **26,612 条**，保留各任务身份、SHA256 和原始内容，**本报告里的“匹配”不代表辞典语言审核通过。**

## 已经在 GitHub Actions 实际执行

[成功的 CI / Artifact](https://github.com/QianShuY/wordmaster/actions/runs/39024558502)，本轮 **202 项 Node 24 测试全部通过**，同时成功导出了合并工作包。

| 口径 | 实测条数 |
|---|---:|
| 原先完整保存的 worker 草稿行 | 14,739 |
| 剩余未在 worker `result.json` 起稿的行 | 11,873 |
| 可从旧 seed 找到原始来源匹配的句对 | 1,640 |
| 可以从其他词书草稿找到 **同词头同词性** 的例句备选 | 8,206 |
| **两种候选来源去重后的实际待稿行覆盖** | **8,353** |
| 其中两种来源都命中 | 1,493 |
| 只命中旧 seed 精确来源 | 147 |
| 只命中跨词书例句备选 | 6,713 |
| **仍完全没有候选的行** | **3,520** |
| 完整独立词典 accepted / installed | **0 / 0** |

校验：147 + 6,713 + 1,493 = 8,353；8,353 + 3,520 = 11,873。两个候选源不能直接相加为 9,846。

**质量门槛：** `1,640` 条旧 seed 来源匹配并不代表英式音标、释义、例句已被外部辞典全量独立审核。跨词书 `8,206` 条仅为相同拼写及大类词性的备选，如 bank（银行/河岸）甚至同词性也可能完全不同义，**必须复核所选义项，绝不能直接自动复制进正式词库**。与此不同，`3,520` 条从现存两个来源均找不到可复用例句，确实需要独立撰写。

## 新增工具与产物

- `scripts/transfer-abc-crossbook-examples.js`（`npm run abc:crossbook`）：从已有 A/B/C worker 结果中索引满足“原词性＝选定词性且完整双语例句”的样例，用原词头、词性和编号同形词条件检索未起稿行。结果是 **候选选项**，不自动挑选、审批和替换；无法确认含义时一律标记风险。
- `scripts/merge-abc-candidate-coverage.js`（`npm run abc:coverage`）：将先前 `abc:reuse` 的原出处匹配候选与 `abc:crossbook` 的备选做精确 `task_id + row_index` 去重、验证输入 SHA 并给出 P1/P2/P3 复核优先级。
- 相关测试：`test/abc-crossbook-options.test.js`、`test/abc-candidate-coverage.test.js`，同时验证数据原样保留、纯读取、无假审批。
- 生成路径：`output/refinement/abc-bulk/crossbook-options.json`、`crossbook-summary.json`、`coverage-review-queue.json`、`coverage-summary.json`，与原有工作包一起作为 GitHub Action Artifact 上传。

完整可下载 Artifact：[abc-bulk-work-packets](https://github.com/QianShuY/wordmaster/actions/runs/39024558502/artifacts/12098256389)。

## 实际下一步

1. 优先给 **3,520 条 P3 完全缺例句**撰写真正的新英中句对，核对词性、含义和安全语境；不要批量套一个“某人发现某物”的句型。
2. P1 原出处严格匹配的候选逐条确认是否表达目标义项；P2 跨词书备选只有通过独立语义匹配后，才可能作为新 `needs-review` 草稿使用。
3. 逐行独立词典审查**全部 26,612 条**的词义、词性、英式读音、例句和原中文，严格分开“有草稿”“有素材”和“审核通过”。历史 worker `source-checked` 不是最终验收。

工具本轮**没有写入 `result.json` 的剩余 11,873 行**，也**没有修改正式 seed、Windows 应用、SQLite 学习/收藏/计划历史**；工作包是提交真实候选与审核任务的可追溯基础，不能对用户宣称 ABC 全量完成。
