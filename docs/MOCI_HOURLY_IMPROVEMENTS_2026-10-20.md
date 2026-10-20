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

## 第 2 轮：扩大到 55 对，覆盖四级与六级五个任务

- 实际编辑 `cet6-015`（20 对）、`cet4-045`（6 对）、`cet6-016`（12 对）、`cet6-017`（9 对）、`cet6-018`（8 对），合计 **55 对中英例句**。
- 重点修复 `regulation` 名词误作动词、`repay` 缺少宾语、`therefore` 位置不当，以及 `segregate`、`snatch` 等词被机械套入“鼓励学生练习”的不合适语境。
- 逐条匹配具体义项：如 `royalty`（版税）、`restraint`（克制）、`tack`（思路）、四级 `recover`（找回）。保留 `regulation` 源词性冲突的审校提示，不擅改源词表。
- 添加 `test/abc-expanded-natural-55.test.js` 对全部 55 对例句、原身份、审校状态、机械模板扫描做回归检测；结果以随后 GitHub Actions 的实际运行状态为准。
- 这 55 对仍为 **needs-review 候选**，未声称外部审校或权威词典逐义确认，未改动 `main`、`app/seed`、SQLite、发行包。

下一轮优先检查六级后续批次及 TEM 义项错误，继续以具体自然语境和双语准确性为标准，不把单纯扩量视为正式质量验收。

## 第 3 轮：TEM-004 50 对逐义自然语境改写（2026-10-20）

- 实际修改 `docs/model-task-results/worker-A/tem-004/result.json` 中 **50 对**原本机械、生硬或词性不合的中英例句，涵盖 `annex`、`annihilate`、`anode`、`antiquity`、`antiseptic`、`apace`、`append` 等。
- 重点处理及物动词缺宾语、名词被硬塞进元语言句、形容词搭配错误和中文引号式硬译。例：`antiseptic` 使用形容词搭配 `antiseptic solution`；`antiquity` 用古罗马文物表示古物义。
- 只改了候选的 `proposed.example`、`proposed.example_translation`、`draft_method`，保留原始来源身份、原义项、空证据和 `needs-review`，没有声称独立词典或人工审核。
- 新增 `test/abc-tem-004-natural-50.test.js` 检查全部 50 对的来源身份、例句内容、审校标记和机械模板；本轮 GitHub CI 结果应以对应提交运行记录为准。
- 未修改 `main`、`app/seed`、SQLite、学习进度或 Windows/Android 安装包；不自动合并或发布。

## 第 5 轮：TEM-006 56 对机械例句的逐义改写（2026-10-20）

- 本轮从 TEM-006 的 100 条候选中锁定 **56 对**明显机械、缺宾语或语境失真的例句，逐条核对 `identity.word`、`selected_sense` 和原始句，再改写中英文句对；不为凑数量修改未确认问题的条目。
- 代表性修复：`audible` 不再描述“看起来可听见的设计”；`authorise authorize` 采用真实的英式动词 `authorise` 而非将两个变体拼接为动词；`avail` 使用 `avail oneself of`；`backfire` 以计划适得其反为语境；`austerity` 体现生活简朴。
- 仅更改 `docs/model-task-results/worker-A/tem-006/result.json` 的 56 条 `proposed.example`、`proposed.example_translation`、`draft_method`，其余原始来源、义项、音标、证据与审核标记保持不变。
- 添加 `test/abc-tem-006-natural-56.test.js` 逐条锁定 56 个来源词形与完整中英例句，检查模板回归及 `needs-review`、无外部审核状态。该批仍是语言候选，**不等于权威词典逐义审校**。
- 未更改 `main`、`app/seed`、SQLite、学习进度、Windows/Android 正式包，未自动合并或发布。CI 状态需以本次提交对应的 GitHub Actions 为准。

下一轮优先处理 TEM-006 剩余已确认的机械句（如 `baggy`、`ballast`），以及 TEM-007 的高风险词性和语义错误。

## 第 6 轮：TEM-007 50 对候选已暂存，主结果尚未应用（2026-10-21）

- 复核了 TEM-007 的 100 条结果，逐项锁定其中 **50 对**明显机械、词性或搭配失真的例句，完成具体语境的中英改写草案，涵盖 `balmy`（天气）、`bankrupt`（及物动词）、`baptize`（宗教洗礼）、`barbaric`（残暴对待）、`barter`（以物易物）及 `bathe`（冲洗伤口）。
- **实际已提交的是未合并的候选包**：`docs/model-task-results/worker-A/tem-007/editorial-candidates-20261021.json`。每项记录原行号、原例句、原来源文本、原选定义项、修订句及译文，带有 `unmerged-review-candidates` 标记，明确不是正式结果。
- 已新增 `test/abc-tem-007-editorial-candidates-50.test.js`，校验候选来源身份、原始字段、义项、机械模板及 `needs-review` 状态；测试允许主结果在安全应用前后两种状态，但绝不把候选当作已发布内容。
- **未能应用到 `tem-007/result.json`**：完整 JSON 更新被 GitHub 写入安全检查拦截。因此本轮主结果成功改写数量是 **0**，50 对仅为可供安全应用的审校候选；未执行正式入库或发布。后续应用前必须重新比对最新分支及原始行，不能盲目覆盖其他 Agent 的修改。
- 只在开发分支提交候选和测试，保留 `needs-review`、空证据与未外部审核状态。未触碰 `main`、`app/seed`、SQLite、学习记录或 Windows/Android 安装包。

下一轮优先尝试将这 50 对候选逐条安全合入 `result.json`，核对 CI 后再开始 TEM-008，避免重复堆积未应用的草案。
