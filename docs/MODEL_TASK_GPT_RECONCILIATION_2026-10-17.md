# GPT 接手三模型结果审计与续作记录

日期：2026-10-17  
分支：`feat/moci-web-handoff-20261016`  
状态：**初步全量结构盘点完成；语言审校远未完成；正式内容导入禁止**。

## 接手口径

按 `WEB_GPT_HANDOFF_PLAN_2026-10-16.md` 原样保留模型 A/B/C 的结果、身份、历史版本和用户学习数据。只修改审核工具、工作者进度及明确确认可以接续的草稿。没有运行 reset、apply-reset、数据库恢复、替换词库或覆写学习记录。原先 worker 自称 `source-checked` 并不能替代主代理实际打开和逐项检查词典。

## 实际 result.json 核查

已通过 GitHub 上的 **144 个现存 result.json**（A 17、B 38、C 89）读取实际长度和每条 `verification`，未以 summary 或 progress 当真值；抽查并对齐 A、B 断点和 C 问题条目与对应任务输入。

| Worker | 任务分配 | 完整长度结果 | 进行中结果 | 当前有草稿行 | 自报 source-checked | 标 needs-review |
|---|---:|---:|---:|---:|---:|---:|
| A（四级/六级/tem 前段） | 90 | 16 | 1 | **1,682** | 1,506 | 176 |
| B（考研/高考/tem 中段） | 89 | 37 | 1 | **3,743** | 2,698 | 1,045 |
| C（tem 后段） | 89 | 89 | 0 | **8,839** | 1,335 | 7,504 |
| 总计 | **268** | **142** | **2** | **14,264 / 26,612** | **5,539** | **8,725** |

**特别注意**：以上 5,539 条只是工作者的来源核对声称，并非主代理的逐条独立词典审核或 `accepted` 数。已独立批准并写入正式词库的数量：**0**。C 的 8,839 份草稿内有 7,502 条未见可访问来源记录（按旧条目计算）；其标为 needs-review 的数量为 7,504。批量产出例句并不代表释义、词性、IPA、原创例句语境和完整多义项都可靠。

附加风险：A 约 170 条、B 约 800 条**旧的 needs-review** 草稿中已经提出候选音标，即便未完整核对来源；新接续的 5 条也明确保留为 needs-review。不能因为候选 IPA 有值便应用。B `npee-001` 还含有若干非数组 `evidence` 字段；这一类数据格式不满足审核门槛。新审计脚本会逐条标出。

## 已实际完成的接续工作

- **A**：保持 `cet4-017` 原先 80 条不变，在对应输入原索引 80、81 接续 moisture、molecule 两条原创例句候选，当前 82/100。下一条 `moment`。原文中的“温度”与 `moisture` 常用名词义不符，“克分子”属于 `molecule` 其他历史术语疑点，未擅自删改输入。
- **B**：`npee-038` 的旧 `progress.json` 只登记 20 条，而 `result.json` 原已保存 40 条。先核验前 40 条的 identity/original 与输入顺序一致，修复登记数字；接着添加 solemn、solid、solidarity 的三条候选，当前 43/100，下一条 `solitary`。
- **C**：保持 tem-037～tem-125 的原始 8,839 行不被覆盖，检查 `tem-099` 和 `tem-108` 的具体疑点。**拒绝** `strike` 的原 proposal 义项搭配：标为名词义项，例句却使用动词 `to strike`。同时留下 `subjective` 释义括号缺失、`tuck` 原文异常“打褶桐”、`unawares` 原词义/例句歧义。详情见 `docs/model-task-results/primary-review/WEB_REVIEW_2026-10-17.json`。
- 上述查询到的 Cambridge 词典文字均来自**原词典搜索索引结果**；直接访问页面受限，无法核验完整原文，因此新增 5 条采用 `verification=needs-review`、证据 `accessed=false`，**没有**虚报 source-checked/accepted。原始 worker 的来源声称也尚待独立核验。

## 新增质量门禁

`scripts/audit-model-evidence.js`：
- 读全量 manifest、每份输入的 SHA256 和 worker 结果；核验 task_id、行数、结果顺序、identity 与 original；不会修改输入、结果、数据库。
- 对账 progress 与真实行数，校验词典 URL 格式、来源是否自称访问、证据类型、双语例句、候选 IPA 与 needs-review 之间的风险。
- 结果仅输出到 Git 忽略的 `output/refinement/model-evidence-audit.json`，永远不生成 accepted、不会触发 seed 更新或用户数据重置。
- `--strict` 在存在数据质量问题时返回失败，不能绕过该门槛把草稿导入正式词库。
- `test/model-evidence-audit.test.js` 验证分工不重叠、来源 URL 格式、全量报告只读、任务身份/哈希不被篡改，以及未审计的数千草稿必须继续显式存在。

建议在**有 Node 24 的完整仓库检出**执行：

```sh
npm ci --no-audit --no-fund
npm test
node --check static/app.js
node scripts/audit-model-task-progress.js
node scripts/audit-model-evidence.js
```

`--strict` 在本轮仍应失败，因为保留的原始产稿存在无证据、类型错误等结构与审核风险；这不意味着源码测试失败。**不要**运行 `scripts/rebuild-vocabulary.js --apply-reset`。

## 明确未完成

- A 还欠 73 份全文件及当前 18 条；B 还欠 51 份全文件及当前 57 条；C 虽有 89 份等长草稿，绝大多数义项与例句未独立核实。
- 词典页面逐条核实、长词多义、词性与英式 IPA 独立校验、原句语法和翻译复核、正式内容白名单仍未完成。**0 条获得本轮独立 full-senses accepted**。
- 高考资料真实性/授权与 3,099 源词、3,111 教学单元口径待验证；本轮没有替换中考或安装高考词库。
- 还没有完成真实 Windows EXE 打包和长期 GUI 验收。云端 CI 不能作为 Windows 完整交付证据。
- 原来和本机其他 Agent 同时工作时，必须重新核对远端 HEAD 并只针对最新 blob SHA 增量写入；禁止强推、重置或改写其他人的提交。

**下一阶段原则**：优先完成正在进行的 A/B 断点，但每条必须保留身份、证据来源与 `needs-review`，并且严格区分“候选已写入”和“完整语言审核通过”。C 优先处理已列出错词和全义项审查，主代理复核后才允许应用正式内容。
