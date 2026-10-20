# 墨词每小时优化接力记录 · 2026-10-20

开发分支：`feat/moci-web-handoff-20261016`。本记录承接 10 月 18 日的草稿补齐与例句质量审核，不代表正式词库已发布。

## 第 1 轮：六级例句定向改写

- 已实际修改 `docs/model-task-results/worker-A/cet6-014/result.json` 的 **14** 对英文例句和中文译文；修复了机械模板、生硬直译、缺少宾语、词义与使用场景不符的问题。
- 对应词条：`prosecute`、`protest`、`provoke`、`prune`、`purchase`、`purify`、`quarterly`、`quiver`、`radiate`、`rape`、`reassure`、`recite`、`recognize`、`recover`。
- 特别修正：原 `rape` 模板把犯罪行为写成“鼓励学生进行的活动”，现改为明确的刑事指控语境，避免教学中正常化不当行为；`recover` 原始来源词性写作 `n.` 但义项是动词，**保留原始数据并显式加审核警告**，不擅改来源。
- 回归测试新增 `test/abc-cet6-014-natural-14.test.js`，检查 14 个词条的来源身份、审校状态、双语例句、机械模板清除，以及上述两处风险。
- 代码提交：`09d0ed303ac4c635010c4ac342094f62c5963503`；测试提交：`cbb05082cdf3f49561219695124e4f1fbd9a8d0c`。GitHub Actions 的 `WordMaster checks` 为自动触发，需以对应运行记录的最终状态为准。

## 质量边界

- 这 **14 条仍是 needs-review 的语言候选**，不是第三方词典逐义认证结果，也没有伪造审校来源或音标。
- 未修改 `main`、`app/seed`、学生本机 SQLite、学习进度、跨日复习计划或 Windows/Android 发行包。
- 10 月 18 日审计快照 `docs/model-quality-patches/example-quality-audit-20261018.json` 属于当时截面，不能直接作为 10 月 20 日剩余量；需重新扫描全量 268 个任务后再报告精确现状。

## 下一轮建议

优先按问题严重度检视 `cet6-015` 中 `regulation`（名词错误当动词）、`repay`（缺少宾语）、`reverse`、`retort` 等，和 `cet4-045` 中 `explore`、`prepare`、`recover` 的离线模板。每条严格核对 `source_raw`、`selected_sense` 与原例句；不能只换句式、不能自动升级为 `verified`，不能把草稿覆盖进用户使用中的词库。

`npm test` 和 `node scripts/audit-model-evidence.js --strict` 在提交后需以 CI 实际执行结果为准；不能把新增测试文件等同于测试已通过。
