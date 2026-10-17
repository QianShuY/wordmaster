# A/B/C 一次性全量工作包方案

## 为什么不再每次做 100 词

目前 A/B/C 共 **26,612** 条任务输入，已有 **14,739** 条候选结果，还有 **11,873** 条尚未形成草稿，完整独立语言审核通过的条目数仍为 **0**。以每次 100 条的新稿方式继续，需要 119 次以上重复交互，不能满足集中完成的工作方式。已经产生草稿的 14,739 条也不是已验证词典内容。

这份方案将所有工作一次性拆包，**不使用外部付费 API Key**，不重置真实学习数据，也不伪造审核状态。批量分工不等于批量审核通过。

## 一条命令导出全部 ABC 工作包

在仓库根目录执行：

```sh
npm run abc:bulk
```

该命令先调用已有的任务哈希、身份、原始内容检查，然后读取实际 `result.json`，一次导出所有待起稿词条、所有待独立审核的已提交词条。默认每包最多 500 条，输出到（Git 忽略、不会提交）：

```text
output/refinement/abc-bulk/
  summary.json
  A-draft-001.json
  A-review-001.json
  B-draft-001.json
  B-review-001.json
  C-review-001.json
  ...
```

包数量和编号由实际数据生成，请以 `summary.json` 的 `packet_files` 为准；重跑会删除自动生成的过期同名格式工作包，保留当前清单。没有 A/B/C 以外的任务，也不会重新导出已完成的草稿作为“待起稿”。

CI 在每次提交后自动运行本命令，产物以 GitHub Actions 的 **abc-bulk-work-packets** Artifact 上传（14 天保留期）。生成 Artifact 并不意味着已经完成内容修订；它是让有权限的本地/云端审校 Agent 分工的素材。

## 对工作的两个独立阶段

**起稿阶段：** A、B 补齐剩余全部未起稿词。每条保留原 `identity`、`original`、来源输入 SHA256；原创英文例句及中文翻译必须适配实际义项。未经权威词典直接核对时，保留 `needs-review`，不填写虚假的 `accessed: true`、`checked_uk_ipa` 或 `accepted`。

**独立语言审查：** A/B/C 的全部 26,612 条都需要复核：原词典真实来源、所有原义项及同形词、词性、英式 IPA、中文语义、英文例句句法和译文，以及历史/冒犯性旧用法。工作包里的 `worker-source-claim-not-independent-proof` 仍仅是工作者声称；`possible-pos-mismatch` 是启发式风险信号，不是已确认错误。只有经过完整审核、明确的可追溯批准记录，才允许后续白名单入库。

## 验收不允许混淆的数字

- `rows_needing_draft`：还需要撰写候选的条数。
- `rows_needing_independent_review`：已经有候选、但仍需逐条核验的条数。
- `claimed_source_checked_not_independently_accepted`：模型历史声称看过来源，不算独立核验。
- `accepted` / `installed`：本脚本均为 0，绝不根据草稿或 URL 格式自动增加。

生成、测试和上传全量包这一步可以一次完成。**逐条创造和审校 26,612 个词条的语言内容，仍需实际执行并取得依据**；这个仓库没有无需 API 的权威词典全文审核引擎，脚本不能替代真正的语言审校。若其他 Agent 同步提交，需要重新读远程 HEAD，原文件版本校验不通过即停止，不强推。

禁止运行 `scripts/rebuild-vocabulary.js --apply-reset`，也不修改真实 SQLite、收藏和学习记录。
