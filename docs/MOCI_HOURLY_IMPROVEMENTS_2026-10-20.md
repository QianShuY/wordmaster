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

## 第 7 轮：TEM-008 60 对机械例句逐义改写（2026-10-21）

- 依据当前开发分支逐条检查 `tem-008` 的 100 行候选，选出 **60 对**存在明显机械模板、错误搭配或译文硬套的中英句对。每条先确认 `identity.word`、`source_file`、`selected_sense` 与原例句仍为待审草稿，再改写为具体语境。
- 示例：`belie` 用声音掩饰焦虑，`bequeath` 用遗嘱遗赠房产，`bilateral` 用双边贸易协定，`blare` 用汽车喇叭刺耳作响；`behead`、`blackmail` 等词使用中立、非鼓励的叙述。
- 只更改 `docs/model-task-results/worker-A/tem-008/result.json` 中 60 条的 `proposed.example`、`proposed.example_translation`、`draft_method`；新增 `test/abc-tem-008-natural-60.test.js`，校验全部 60 条完整句对、源任务身份与原始字段、模板清除、空证据和 `needs-review`。
- 该批是编辑候选而非独立词典审校结果。未触碰 `main`、`app/seed`、SQLite、学习记录、Windows/Android 发行包，也未自动合并或发布。
- 验收：GitHub Actions 的完整 CI 需以本轮提交实际结果为准，不将新增测试等同于已通过。

## 第 8 轮：TEM-009 自然语境定向复核（2026-10-23）

- 从开发分支 `972f16d86fd0733bda4cb5dc0ead569bf77be3c4` 读取 `tem-009` 100 条候选，逐条核对来源，改写其中 **57 对**确有明显机械模板/生硬语境的英语例句及中文译文。
- 代表词条：`blurt`（脱口而出）、`blotter`（吸墨纸）、`bonnet`（英式发动机罩）、`boycott`（抵制）及 `braille`（盲文）。违法/暴力有关词仅用于中立语境，不能作为模仿式教学。
- 只变更 `docs/model-task-results/worker-A/tem-009/result.json` 中 57 行的 `proposed.example`、`proposed.example_translation`、`draft_method`；保留来源身份、原始字段、义项、任务输入 SHA、空证据、`needs-review` 状态。加入 `test/abc-tem-009-natural-57.test.js` 锁定逐句内容及来源。
- 这些仍是未独立词典核查的草稿候选，测试结果以提交对应 CI 为准。不修改 `main`、`app/seed`、SQLite、学习进度或发行安装包。

## 第 9 轮：TEM-009 遗留 + TEM-010 逐义例句修复（2026-10-23）

- 已核对上轮 `efc88f30c60d3e883904d0dea1111df9507e3fd5` 的 GitHub Actions **success**，并在新一轮写入前确认开发分支 HEAD 为 `efc88f30c60d3e883904d0dea1111df9507e3fd5`。
- 从 TEM-009 剩余 22 条未编辑候选中，挑选 **16 对**仍属机械套话/中文硬译的词条；TEM-010 从 100 条中挑选 **44 对**，本轮共 **60 对**。未为了凑数修改原本自然的句子，也未覆盖其他 Agent 处理的词条。
- 重点示例：`bracket` 选括号义，`braid` 选制服穗带义，`brainwash` 采用不鼓励行为的邪教洗脑语境，`breach` 用背信行为，`brood` 用一窝幼鸡，`buckle` 用安全带搭扣。对源词性/义项不清的条目继续保留原始文本和待审状态。
- 仅修改 `docs/model-task-results/worker-A/tem-009/result.json` 的 16 行及 `tem-010/result.json` 的 44 行的 `proposed.example`、`proposed.example_translation`、`draft_method`。源 `identity`、`original`、`selected_sense`、`input_sha256`、空 `evidence`、`needs-review` 和未外部审核标记均锁定不变。
- 新增 `test/abc-tem-009-010-natural-60.test.js` 逐条锁定 60 对英中句、来源行号/原文、原始义项和输入任务 SHA；这些只是语言编辑候选，不冒称人工词典审校，不覆盖正式词库。CI 需在提交后查对应运行结果。
- 未修改 `main`、`app/seed`、SQLite、学习进度或 Windows/Android 安装包，也不合并或发布。

## 第 10 轮：TEM-010 后半批 + TEM-011 逐义自然例句（2026-10-23）

- 先确认上一轮 `3977a53ce7c07cf19c54162922f211d885f4b2d7` 的 GitHub Actions `39967723199` 为 **success**，更早 `efc88f30c60d3e883904d0dea1111df9507e3fd5` 的 Actions `39959184869` 也为 **success**。本轮写入基线 HEAD：`3977a53ce7c07cf19c54162922f211d885f4b2d7`。
- TEM-009 余下 6 条已有具体语境，故不为凑数修改。改写 TEM-010 **24 对**、TEM-011 **31 对**，共 **55 对**明确机械套话或生硬译文的草稿例句。
- 代表修订：`budge` 用橱柜纹丝不动，`buffer` 用树木作隔离缓冲，`bullish` 用投资者看涨股票，`buoyancy` 用救生衣浮力，`cajole` 用劝说弟弟搬沙发，`cameo` 用浮雕宝石。原稿把词作为“课上讨论的话题”而非真实用法。
- 源词条 `tem-010/brusque` 的英文词义通常偏“唐突、生硬”，但 `selected_sense` 写“轻率、鲁莽”，暂不改写，留待独立来源核对；`tem-011/bushy` 源词性为名词而释义为形容词，也不擅自覆盖。这些未计入本轮修订数。
- 仅改 `docs/model-task-results/worker-A/tem-010/result.json` 的 24 条和 `tem-011/result.json` 的 31 条 `proposed.example`、`proposed.example_translation`、`draft_method`。原始来源身份、`original`、`selected_sense`、`input_sha256`、空证据、`needs-review` 与未人工外部审校标记保持原状。
- 新增 `test/abc-tem-010-011-natural-55.test.js` 锁定来源、完整句对、选定义项及机械模板检查。CI 状态须以本轮 commit 对应 Actions 的最终结论为准。
- 所有改写仅为待审候选，不代表逐义词典认证或用户词库安装；未修改 `main`、`app/seed`、SQLite、学习进度、Windows/Android 发布包，也不自动合并/发布。

## 第 11 轮：TEM-011 遗留 + TEM-012 逐义改写（2026-10-24）

- 已复核上一轮 `75c9709c243ebcfd02e9398d9f79f0325fedf381` 对应 GitHub Actions `39976771033` 为 **success**，前两轮 `39967723199` 与 `39959184869` 也均为 **success**。本轮写入前的 HEAD：`75c9709c243ebcfd02e9398d9f79f0325fedf381`。
- 逐项检查 TEM-011 剩余机械模板，实际改写 **35 对**；TEM-012 优先处理 **23 对**明显错用词性、无宾语或中文硬译的草稿，总计 **58 对**。原稿多为讨论单词本身的元语言模板，改为具体使用语境。
- 代表修复：`canvass` 用向居民征询意见，`canopy` 用飞机驾驶舱盖，`capitulate` 用守军在补给耗尽后投降，`carnal` 用肉体欲望，`cartridge` 用电唱机唱头，`catwalk` 用工厂检修走道而非时装秀台。
- `tem-011/bushy` 原始词性为 `n.` 而义项为形容词，暂不修改，留待独立来源核对。 `tem-010/brusque` 仍存在来源释义疑点。单个例句只展示当前义项的一种自然用法，**不代表全部词义核查完毕**。
- 仅变更 `docs/model-task-results/worker-A/tem-011/result.json` 与 `tem-012/result.json` 中 58 行的 `proposed.example`、`proposed.example_translation` 和 `draft_method`；`identity`、`original`、`selected_sense`、任务输入 SHA、`evidence=[]`、`needs-review`、未外部审校标记全部保留。
- 新增 `test/abc-tem-011-012-natural-58.test.js`，锁定所有改写句对、来源行号/原文、原始义项、任务输入 SHA 与审核状态。测试最终状态以本次提交对应的 GitHub Actions 为准，不提前宣称通过。
- 未修改 `main`、`app/seed`、SQLite、学习进度或 Windows/Android 发布包，不合并或发布。

## 第 12 轮：TEM-012 后半批 50 对具体语境改写（2026-10-24）

- 本轮先确认 `efc88f30c60d3e883904d0dea1111df9507e3fd5` 对应 Actions `39959184869` 及上一轮 `caebaea816a69df5c3070187feeb62b5b920f128` 对应 Actions `39984622709` 均为 **success**。提交前开发分支 HEAD：`caebaea816a69df5c3070187feeb62b5b920f128`。
- 从 `tem-012` 尚未改写的机械模板中逐条比对源任务的 `identity`、`original`、`selected_sense`、输入 SHA 和审核状态，仅修改 **50 对**确有明显模板问题的英文例句与中文译文。示例：`causal` 使用 `causal link`，`cede` 使用割让岛屿的及物结构，`censor` 使用电影审查员的语境，`certify` 使用证明饮用水安全，`chatter` 使用儿童兴奋交谈。
- `tem-012/charter` 源义项存在可疑“航海图/制图”混入，`chargeable` 多义容易混淆，`chaste` 与 `chastity` 容易触发不准确的历史/价值语境，本轮保留原样供进一步审核，不为凑数修改。
- 只更改 `docs/model-task-results/worker-A/tem-012/result.json` 中 50 行的 `proposed.example`、`proposed.example_translation`、`draft_method`；新增 `test/abc-tem-012-natural-50.test.js` 锁定来源、输入 SHA、选定义项、中英句对和审核状态。其余行与所有来源、证据、审核标记均未变。
- 改写只是 `needs-review` 的编辑草稿，不是独立词典逐义审校或已安装到用户词库。未触碰 `main`、`app/seed`、SQLite、学习进度、Windows/Android 发行包；不自动合并/发布。新提交 CI 需查 Actions 最终状态。

## 第 13 轮：TEM-013 60 对机械模板定向改写（2026-10-24）

- 写入前核实开发分支 HEAD 为 `bfc8b97d2ee4150482a66d580243d822becb04a5`，其 GitHub Actions `39993178013` 为 **success**；TEM-009 首批 `efc88f30c60d3e883904d0dea1111df9507e3fd5` 对应 CI `39959184869` 同样为 **success**。已查质量记录，旧审计快照不视为当前剩余量。
- 从 `tem-013` 的 100 条候选逐项核对原句、`source_raw`、`selected_sense`、词性及审核状态，选取 **60 对**确实存在机械模板/语境错误的例句重写；未动已经自然的 `crossbook-sense-unverified` 例句。示例：`chime` 用钟声、`checkmate` 用棋局将死、`choppy` 用波涛、`circumstantial` 用间接证据、`clearance` 用起飞许可、`clinch` 用锁定胜局。
- 只修改 `docs/model-task-results/worker-A/tem-013/result.json` 的 60 条 `proposed.example`、`proposed.example_translation` 和 `draft_method`，源 `identity`、`original`、`selected_sense`、任务输入 SHA、`evidence=[]`、`needs-review`、未人工外部审核标记不变。
- 新增 `test/abc-tem-013-natural-60.test.js` 锁定 60 对完整中英例句及来源，并对全部 100 条原始身份和审核状态回归检查。CI 最终状态须在新 commit 对应 GitHub Actions 完成后再判定。
- 这些仍为语言编辑草稿，未进行独立词典审校，也没有覆盖正式词库、`main`、`app/seed`、SQLite、学习进度或 Windows/Android 安装包；不自动合并/发布。

## 第 15 轮：TEM-013 遗留 + TEM-014 定向改写（2026-10-24）

- 写入前 HEAD `9a64eeb7b0bb0e1ba368fd1ec29ffb435f6762e3`。核实 TEM-009 的 `efc88f30c60d3e883904d0dea1111df9507e3fd5` 对应 Actions `39959184869` 和 TEM-013 上轮 `9a64eeb7b0bb0e1ba368fd1ec29ffb435f6762e3` 对应 Actions `40001648204` 均为 `success`。
- 仅挑选来源身份、词性、义项及草稿状态可锁定的机械例句，改写 `tem-013` **15 对**、`tem-014` **43 对**，共 **58 对**英文例句与中文译文。针对缺宾语、反常语境、词性搭配和中文生硬直译逐句修订。原例句模板命中数（这两个任务合计）由 90 降至 32，此数字只代表规则命中，不等于全量质量认证。
- 代表修复：`churlish` 用粗鲁回答冒犯志愿者，`cider` 用酒馆里的干型苹果酒，`cling` 用过马路时抓紧父亲的手，`coerce` 用经理胁迫员工无偿加班，`collude` 用公司串通涨价，`colloquial` 用英语口语与正式写作对照。
- 仅更改两份 `docs/model-task-results/worker-A/tem-01{3,4}/result.json` 中 58 行的 `proposed.example`、`proposed.example_translation`、`draft_method`，并新增 `test/abc-tem-013-014-natural-58.test.js`。保留所有 `identity`、`original`、`selected_sense`、`input_sha256`、`evidence=[]`、`needs-review`、未外部审校状态；对全部行的源身份及原字段增加回归检查。
- `tem-013/chlorophyll` 的源释义混入 `chloroplast`，`clamber` 源词性与动词义冲突，`clearway` 释义不确定，均未改写；`tem-014` 中其余跨书义项未核实的条目保留待审，避免数量驱动的误改。
- 这 58 对仅为 **needs-review 草稿**，没有独立词典核验，也没有进入正式词库；未修改 `main`、`app/seed`、SQLite、学习记录或安装包，未合并/发布。提交后的完整测试结论以对应 GitHub Actions 最终状态为准。

## 第 16 轮：TEM-014 遗留 + TEM-015 逐义例句改写（2026-10-24）

- 开始时核对开发分支 HEAD `b3ca500092f9a6cd8a336b9d2168eeaff4880b74`、接力文档、2026-10-18 质量报告以及 Actions：TEM-009 首批 `efc88f30c60d3e883904d0dea1111df9507e3fd5` 的 CI `39959184869` 为 **success**；上一轮 `b3ca500092f9a6cd8a336b9d2168eeaff4880b74` 的 CI `40009540728` 也为 **success**。历史质量快照不冒充当前实时剩余量。
- 本轮挑选 TEM-014 中 **29 对**、TEM-015 中 **29 对**，合计 **58 对**仍明显属于机械模板、缺少真实搭配或中文硬译的草稿，按 `identity.source_raw` 与 `selected_sense` 逐项确认后改写。已由其他 Agent 或前几轮改写的条目全部跳过。
- 示例：`clockwise` 用顺时针转动旋钮；`commensurate` 用薪酬与经验相称；`commentate` 用为电台解说决赛；`communicable` 用传染病传播；`compel` 用暴风雨迫使徒步者折返；`complement` 用香草给汤增色而非 `compliment` 的赞美义。
- 仅修改 `docs/model-task-results/worker-A/tem-014/result.json` 与 `tem-015/result.json` 中对应行的 `proposed.example`、`proposed.example_translation` 和 `draft_method`；全部 `identity`、`original`、`selected_sense`、`input_sha256`、`evidence=[]`、`needs-review` 与未外部审核标记保持不变。
- 新增 `test/abc-tem-014-015-natural-58.test.js`，逐行锁定 58 对中英句、原来源行号/文本、选定义项、任务输入 SHA、全部任务源身份和审校状态。提交后须以 Actions 对应运行的最终结果判定测试，不提前宣称通过。
- TEM-014 `co-ed` 原义项含过时的女性学生称谓，本轮保留待审；TEM-013 `chlorophyll` 源释义混入 `chloroplast` 等风险仍未擅改。所有修订只是 **needs-review** 编辑草稿，非独立词典审核或已覆盖正式词库；未修改 `main`、`app/seed`、SQLite、学习进度及 Windows/Android 发布包，也不自动合并/发布。

## 第 17 轮：TEM-015 遗留 + TEM-016 自然例句定向改写（2026-10-24）

- 先确认上轮 `a1fd6de6c476486114bda161ab480bf5a14c3f6d` 的 GitHub Actions `40018054141` 已完成且 `success`，并核实早期 TEM-009 的 `efc88f30c60d3e883904d0dea1111df9507e3fd5` 对应 Actions `39959184869` 同样 `success`。本轮提交前基线 HEAD：`a1fd6de6c476486114bda161ab480bf5a14c3f6d`，最近一批提交均为 ABC 编辑改写，未覆盖其他 Agent 的内容。
- 本轮逐项核对 TEM-015 **36 对**与 TEM-016 **22 对**原始词形、词性、义项、`identity.source_raw`、`original` 和草稿状态，实际改写合计 **58 对**机械模板/不自然语境的中英例句，其他已经编辑过或自然的候选未改。示例：`compunction`（毫无愧疚）、`concentric`（同心圆）、`conducive`（有助于）、`conflate`（混淆相关与因果）、`confiscate`（没收）及 `congruent`（全等）。
- 只更改 `docs/model-task-results/worker-A/tem-015/result.json` 和 `tem-016/result.json` 里 58 行的 `proposed.example`、`proposed.example_translation` 与 `draft_method`。逐行检查所有其他字段未变，`input_sha256`、`identity`、`original`、`selected_sense`、`evidence=[]`、`needs-review` 和未外部审校状态保留。
- 新增 `test/abc-tem-015-016-natural-58.test.js` 锁定所有改写句对、原来源行号/原文、选定义项、输入任务 SHA 以及两批共 200 行的来源身份和审校状态。此为语言编辑草稿，未做外部词典逐义核验，不能视为正式发布或完全审校。
- 未修改 `main`、`app/seed`、SQLite、学习进度、Windows/Android 安装包，不自动合并/发布。提交后 CI 状态以对应 Actions 最终结果为准。

## 第 18 轮：TEM-016 遗留 + TEM-017 机械例句定向改写（2026-10-24）

- 写入前核对指定开发分支 HEAD `43b0cb2ed2336c7c7a3f0afd0b7dfd6401ed2dd9`、接力记录、2026-10-18 历史质量报告及最近 Actions。TEM-009 的 `efc88f30c60d3e883904d0dea1111df9507e3fd5` 对应 `39959184869` 已 `success`；上一轮 `43b0cb2ed2336c7c7a3f0afd0b7dfd6401ed2dd9` 对应 `40025576973` 已 `success`。历史质量报告的 2793 个模板标记并非当前实时未处理数。
- 逐条审阅 TEM-016 与 TEM-017，分别改写 **45 对**和 **12 对**，合计 **57 对**原本明显套话、语法搭配不完整或中文硬译的中英例句。代表词条：`conjure`（变出兔子）、`consent`（拒绝同意使用照片）、`consonant`（辅音）、`contemplate`（认真考虑搬家）、`conurbation`（城市群）和 `converge`（小径汇合）。
- 仅修改两份 `docs/model-task-results/worker-A/tem-01{6,7}/result.json` 内被选中行的 `proposed.example`、`proposed.example_translation`、`draft_method`；未改变其他行或字段。新增 `test/abc-tem-016-017-natural-57.test.js`，锁定全部 57 对句子、源行号/源文本、词性义项、任务输入 SHA，并检查两批共 200 行的原始身份与审核状态。
- `tem-016/constant` 的原始词性标成 `n.` 而义项为形容词，故不强行改写；已经自然的 `crossbook-sense-unverified` 行不重复处理。所有改写仍是 `needs-review` 编辑候选，`evidence=[]`、未外部人工审核，不能视为独立词典审校、正式词库安装或全义项认证。
- 未修改 `main`、`app/seed`、SQLite、学习进度或 Windows/Android 正式包，不自动合并或发布。新 commit 的 CI 以 GitHub Actions 最终状态为准。

## 第 19 轮：TEM-017 56 对语境化例句修订（2026-10-24）

- 写入前核对开发分支 HEAD `239ef2bbe70bd05c6d9bb6ec699ae89c6ceff22e`，早期 TEM-009 的 Actions `39959184869` 和上一轮 TEM-016/017 的 Actions `40031836748` 均已完成且 **success**；历史 `docs/ABC_QUALITY_PROGRESS_2026-10-18.md` 是快照，不作为实时剩余数。
- 本轮从 TEM-017 的 100 行中选取 **56 对**仍为 `offline-context-first-draft` 且存在明确机械模板/错误搭配的例句，逐条对照 `identity.source_raw`、`selected_sense.pos` 与 `selected_sense.meaning` 后改写。未重写已编辑或 `crossbook-sense-unverified` 行。
- 代表性例句：`conversant` 使用 `conversant with`、`convict` 使用 `convict the suspect`、`cooperative` 用合作社名词义、`correlate` 使用相关因素的名词义、`counterbalance` 用底座平衡台灯、`counterattack` 用球赛反击。
- 只改 `docs/model-task-results/worker-A/tem-017/result.json` 56 行的 `proposed.example`、`proposed.example_translation`、`draft_method`；新增 `test/abc-tem-017-natural-56.test.js` 锁定完整中英句对、100 行原始身份、源义项、输入 SHA、证据和审核状态。保留 `identity`、`original`、`selected_sense`、`input_sha256`、`evidence=[]`、`needs-review`、`external_human_review=false` 不变。
- `counterdrug` 的原始释义与 `coup` 的多义语境需要进一步独立核查，故没有为凑数修改。所有改写只是 **needs-review** 候选，不代表独立词典逐义审校或已进入正式词库；未修改 `main`、`app/seed`、SQLite、学习进度、Windows/Android 发布包，也不自动合并/发布。CI 最终状态必须查新提交对应 Actions。

## 第 20 轮：TEM-018 59 对机械例句语境化改写（2026-10-24）

- 开始时指定分支 HEAD 为 `85fa5a8016e998591c5ed58400370d219ccb85d3`；早期 TEM-009 的 commit `efc88f30c60d3e883904d0dea1111df9507e3fd5` 对应 Actions `39959184869`、上一轮 TEM-017 commit `85fa5a8016e998591c5ed58400370d219ccb85d3` 对应 Actions `40038807190` 均核验为 completed/success。核对 `docs/ABC_QUALITY_PROGRESS_2026-10-18.md` 历史质量快照，不把旧模板计数当作当前剩余量。写入前再次比对 HEAD，发现其他 Agent 新提交则停止。
- 本轮对 `docs/model-task-results/worker-A/tem-018/result.json` 的 100 行逐条筛选，实际改写 **59 对**仍属 `offline-context-first-draft` 且有明确机械套话、错误搭配或中文硬译问题的英中例句。逐条检查 `identity.source_raw`、`selected_sense.pos`、`selected_sense.meaning`，未修改已编辑或 `crossbook-sense-unverified` 的条目。
- 示例：`covet` 用觊觎古董手表；`crackle` 用壁炉木柴噼啪作响；`cram` 用把衣服塞入行李箱；`cranky` 用不可靠的旧发动机；`credentials` 用核验证件；`cross-examine` 用律师盘问证人。
- 只更改 59 行的 `proposed.example`、`proposed.example_translation` 和 `draft_method`，新增 `test/abc-tem-018-natural-59.test.js` 锁定完整句对、源行号/源原文、义项、输入 SHA 及 100 行的身份与审核状态。所有 `input_sha256`、`identity`、`original`、`selected_sense`、`evidence=[]`、`needs-review`、`external_human_review=false` 均不变。
- `tem-018/creator` 源释义疑似与 headword 不符，`cripple` 含过时伤残称谓，`creole` 含身份/语言双义，`crucify` 含敏感历史语境，均保留待独立核查，不为凑数修改。其他剩余条目继续逐义筛选。
- 本轮所有例句仍是 **needs-review** 候选，不代表独立词典审核或已进入正式词库；未修改 `main`、`app/seed`、SQLite、学习进度、Windows/Android 正式包，未自动合并/发布。新提交 CI 以对应 Actions 最终结果为准。

## 第 21 轮：TEM-018 遗留 + TEM-019 逐义例句改写（2026-10-24）

- 开始时开发分支 HEAD 为 `1dbaa4178db30bed42b157eebbd039bd17df0a09`，先读本接力文档及 `docs/ABC_QUALITY_PROGRESS_2026-10-18.md` 历史质量快照；TEM-009 首批 `efc88f30c60d3e883904d0dea1111df9507e3fd5` 对应 Actions `39959184869`、上一轮 TEM-018 的 `1dbaa4178db30bed42b157eebbd039bd17df0a09` 对应 Actions `40043797101` 均已核实为 **completed/success**。该质量快照不是当前全量未改写数量。
- 逐项核对 `identity.source_raw`、`selected_sense.pos/meaning`，仅从 `offline-context-first-draft` 中选取 TEM-018 **19 对**和 TEM-019 **40 对**，共 **59 对**明显机械或中文硬译的句子。例：`cremate` 使用按遗愿火化遗体的适当语境；`crux` 使用问题症结；`culminate` 用 `culminate in`；`curtail` 明确缩减户外活动；`cynical` 表示对承诺持怀疑态度。未重复改写已经编辑过的词条。
- 仅更改两份 `docs/model-task-results/worker-A/tem-01{8,9}/result.json` 中 59 行的 `proposed.example`、`proposed.example_translation`、`draft_method`，新增 `test/abc-tem-018-019-natural-59.test.js` 锁定中英句对、源行号、原文、词性义项、任务输入 SHA、全部行身份/原字段及审核状态。所有 `input_sha256`、`identity`、`original`、`selected_sense`、`evidence=[]`、`needs-review`、`external_human_review=false` 保持不变。
- `tem-018/creator` 的源释义疑似错误、`creole` 身份与语言多义、`cripple` 过时称谓、`crucify` 历史语境，仍保留待审；TEM-019 其余草稿待逐义挑选。此次仅是 **needs-review** 候选，不是独立词典审校或正式词库发布；未改动 `main`、`app/seed`、SQLite、学习进度或 Windows/Android 安装包，也不合并发布。新提交 CI 以对应 Actions 最终状态为准。

## 第 22 轮：TEM-019 遗留 + TEM-020 定向改写（2026-10-24）

- 本轮写入基线 HEAD：`64e82b6591c85607f69e7c2b9b6ef21fdd3ab65b`；核实 TEM-009 57 对改写 commit `efc88f30c60d3e883904d0dea1111df9507e3fd5` 的 GitHub Actions `39959184869` 和上轮 `64e82b6591c85607f69e7c2b9b6ef21fdd3ab65b` 的 Actions `40048835924` 均已 `completed/success`。读取本接力文档和 `docs/ABC_QUALITY_PROGRESS_2026-10-18.md` 历史快照，不将旧快照计数视为实时剩余量。
- 逐项对照 `identity.source_raw`、`selected_sense.pos/meaning`，仅选择尚未改写的 `offline-context-first-draft`：TEM-019 **32 对**，TEM-020 **24 对**，共 **56 对**。TEM-009 的 6 条未改写余项已在前轮判断具有具体语境，本轮不重复或为凑数强改。代表改写：`dampen` 用骤雨打击热情；`dapper` 用整洁西装；`daunt` 用陡坡未吓退徒步者；`debit` 用会计借方记录；`decelerate` 用火车进站减速；`decipher` 用破译加密信息。
- 仅更改 `docs/model-task-results/worker-A/tem-019/result.json` 的 32 行和 `tem-020/result.json` 的 24 行中 `proposed.example`、`proposed.example_translation`、`draft_method`；新增 `test/abc-tem-019-020-natural-56.test.js` 锁定 56 对完整句对、源行号、源原文、选定义项、任务 SHA，以及两批 200 行的源身份、原字段和审核状态。保持 `input_sha256`、`identity`、`original`、`selected_sense`、`evidence=[]`、`needs-review`、`external_human_review=false` 不变。
- `tem-019/deadweight` 涉及航运载重术语与原释义“静止重量，净重”的歧义；`tem-020/decease` 属少见/古旧用法，`decency` 原释义含疑似错字“合家”，`decidedly` 的原义项与现代常见副词义存在疑点，均保留待独立来源审查，不为凑数改写。
- 以上均为 **needs-review** 编辑候选，不是独立词典审核或正式词库更新；未改动 `main`、`app/seed`、SQLite、学习进度、Windows/Android 安装包，不自动合并/发布。本轮新提交的 CI 以对应 GitHub Actions 最终结论为准。

## 第 23 轮：TEM-020 遗留 + TEM-021 逐义自然例句（2026-10-24）

- 写入基线 HEAD：`665f49ce230c27f698e4904db13ac3292b49a917`。先读取本接力文档与 `docs/ABC_QUALITY_PROGRESS_2026-10-18.md` 历史快照；已通过 Actions API 核实 TEM-009 首批 57 对 commit `efc88f30c60d3e883904d0dea1111df9507e3fd5` 对应运行 `39959184869`、上轮 `665f49ce230c27f698e4904db13ac3292b49a917` 对应运行 `40053675787` 均为 `completed/success`。历史快照计数不当作实时剩余量。当前分支 HEAD 与上轮提交一致，未发现其他 Agent 新提交。
- 仅挑选未改写的 `offline-context-first-draft`，逐条核对 `identity.source_raw`、`selected_sense.pos/meaning` 和原中英句：TEM-020 **48 对**、TEM-021 **10 对**，合计 **58 对**。TEM-009 尚余的 6 条已由前轮确认具有具体语境，不重复改写。代表修复：`decompose`（落叶分解）、`decorum`（辩论中的礼节）、`deduce`（由脚印推断）、`defuse`（缓和争执）、`delude`（自欺欺人）、`delve`（深入查阅财务记录）。
- 仅更改 `docs/model-task-results/worker-A/tem-020/result.json`、`docs/model-task-results/worker-A/tem-021/result.json` 中选定行的 `proposed.example`、`proposed.example_translation`、`draft_method`；新增 `test/abc-tem-020-021-natural-58.test.js` 锁定完整英中句、源行号/原文、选定义项、输入任务 SHA，以及两批全部行的原始身份、原字段、证据和审核状态。程序化回滚三类允许字段后与原 JSON 全量比较一致，确认 `input_sha256`、`identity`、`original`、`selected_sense`、`evidence=[]`、`needs-review`、`external_human_review=false` 未变。
- `tem-020/decease` 属古旧用法，`decency` 源释义疑似错字，`decidedly` 原义项有偏差，`decry` 词性可能错误，`degenerate` 有多词性歧义，暂不强行改写；其余未处理候选继续逐义筛选。以上仍为 **needs-review** 编辑候选，不是外部词典独立审校或正式词库发布；未动 `main`、`app/seed`、SQLite、学习进度、Windows/Android 安装包，不自动合并或发布。新提交 CI 必须以 GitHub Actions 完成状态为准。

## 第 24 轮：CET-4/CET-6 优先，修复 21 对确定性机械例句（2026-10-24）

- 根据用户新优先级，暂停 TEM 专四专八批量扩展，优先检查四级/六级待审候选。开始时分支 HEAD 为 `00cd655602b4ccd1600743cbff97c2c6a6dce9c1`；已核实 TEM-009 commit `efc88f30c60d3e883904d0dea1111df9507e3fd5` 的 Actions `39959184869` 为 `completed/success`，最新 TEM-020/021 commit `00cd655602b4ccd1600743cbff97c2c6a6dce9c1` 对应 Actions `40057372781` 也为 `completed/success`。
- 本轮扫描 CET-4/CET-6 现有候选任务后，仅对 **21 对**有明确模板、语法/义项错配的行做改写，不为凑 40–60 的数字扩大范围：CET-4 `billion`（缺少数量限定且数量语境荒谬）、`cheat`（及物义项搭配错误）；CET-6 `traverse`、`triple`、`tug`、`tumble`、`turbulent`、`undermine`、`upgrade`、`uphold`、`urge`、`violate`、`virtual`、`vocational`、`withhold`、`wrench`、`yoke`、`abortion`、`analyse`、`explore`、`glide` 等均改成能展示当前词性/义项的具体语境。
- 只修改 `docs/model-task-results/worker-A/cet4-040/result.json`、`cet4-041/result.json`、`cet6-019/result.json`、`cet6-020/result.json`、`cet6-021/result.json`、`cet6-023/result.json` 中 21 行的 `proposed.example`、`proposed.example_translation`、`draft_method`。逐行对照任务输入和原结果，确认未变更 `input_sha256`、`identity`、`original`、`selected_sense`、`evidence=[]`、`needs-review`、`external_human_review=false`、`full_dictionary_senses_reviewed=false`；其余行和所有其他字段保持字节语义一致。
- 新增 `test/abc-cet4-cet6-natural-21.test.js`，逐项锁定 21 对英中句、原来源行号/文本、选定义项、任务 SHA、原始字段和审核状态，并检查通用机械模板回归。历史质量报告 `docs/ABC_QUALITY_PROGRESS_2026-10-18.md` 是旧快照，不作为实时剩余量。
- 本轮仅为 **needs-review** 编辑候选，未进行独立词典/外部人工审核，不能视为正式词库发布。未修改 `main`、`app/seed`、SQLite、学习进度、Windows/Android 安装包，不自动合并或发布。提交后的 CI 状态以新 commit 对应 GitHub Actions 最终结果为准。

## 第 25 轮：CET-4/CET-6 优先，修复上一轮 CI 的候选/正式快照隔离回归（2026-10-24）

- 写入前 HEAD：`f6cede10ceb4d5bac54445fa5d86c5485b838de5`；先核对本接力文档、2026-10-18 历史质量快照、TEM-009 commit `efc88f30c60d3e883904d0dea1111df9507e3fd5` 的 Actions `39959184869` 为 `completed/success`。
- 上轮 CET-4/CET-6 21 对改写 commit `f6cede10ceb4d5bac54445fa5d86c5485b838de5` 的 Actions `40060612460` 已 `completed/failure`，307 项测试中 306 通过、1 失败：`test/cet6-complete-examples.test.js` 将更新后的 **needs-review 候选** 错误地要求与 2026-10-21 已冻结的 CET-6 正式例句快照相同；首个冲突词为 `traverse`。候选例句并未自动发布到正式词库，这正是应保留的隔离边界。
- 本轮只定向修复 `test/cet6-complete-examples.test.js` 的旧假设：对 `editorial-context-rewrite-needs-review` 行，仍验证源身份、待审状态、冻结批次的原有独立编辑修订及 `reviewedExample` 安装内容，但不把新的待审候选当作已安装例句；对其他行仍保持原有候选/快照一致性检查。没有改动 `app/seed` 或任何正式包。
- 复查四级/六级候选：较早源核查行、既有定向编辑行和 `crossbook-sense-unverified` 行不可为了凑 40–60 对强行重写；本轮 **新增中英例句 0 对**，优先恢复 CI 可靠性。原 21 对候选仍 `needs-review`，未经外部人工审核。
- 本轮仅涉及针对性回归测试与本开发接力文档，不触及 `main`、`app/seed`、SQLite、学习进度、Windows/Android 安装包，不合并、不发布。CI 结果以本次新 commit 对应 Actions 最终状态为准。

## 第 26 轮：CET-4/CET-6 原来源候选的语境与中译定向修复（2026-10-24）

- 开始时指定开发分支 HEAD 为 `dc8330d1615bd4c2b86aabaa378fa9277e80ae85`；读取本接力记录、2026-10-18 历史质量快照及最近 Actions。TEM-009 的 `efc88f30c60d3e883904d0dea1111df9507e3fd5` 对应 Actions `39959184869` 为 `completed/success`；上轮 CI 修复 `dc8330d1615bd4c2b86aabaa378fa9277e80ae85` 对应 Actions `40061585519` 为 `completed/success`，而上一轮 21 对改写的原始提交 `f6cede10ceb4d5bac54445fa5d86c5485b838de5` 对应 `40060612460` 为 `completed/failure`（已由后续测试修复）。历史质量快照不等于实时未改写数量。
- 本轮优先审阅 CET-4 与 CET-6，发现现有机械模板正则在已检查批次中没有未改写的明确模板句。严格跳过 `crossbook-sense-unverified` 和此前 `editorial-context-rewrite-needs-review` 行；只对 6 对仍为 `existing-exact-source-candidate` 且有具体语言问题的句对做改写：CET-4 `commit` 纠正不自然的犯罪时态语境；CET-4/CET-6 的 `dimension` 改为核对门洞尺寸，避免不自然的 `the dimension of each side`；CET-4/CET-6 的 `disease` 从空泛的“收集某疾病信息”改为真菌病害在果园蔓延的实际场景；CET-6 的 `dignity` 消除中文“有尊严且受尊重的对待”的生硬硬译。合计 CET-4 **3 对**、CET-6 **3 对**，不为凑 40–60 对强改其他自然例句。
- 仅更改 `docs/model-task-results/worker-A/cet4-042/result.json`、`cet4-044/result.json`、`cet6-023/result.json` 中选中行的 `proposed.example`、`proposed.example_translation` 和 `draft_method`。逐行核对任务源 `identity`、`original` 与 manifest 输入 SHA，程序化回滚三类允许字段后与原结果对象一致，确认所有来源、`selected_sense`、`evidence=[]`、`needs-review`、`external_human_review=false`、`full_dictionary_senses_reviewed=false` 未变。
- 新增 `test/abc-cet4-cet6-source-context-6.test.js` 锁定 6 对英中句、源行号/原文、义项、原例句、任务输入 SHA、全部被修改任务行的源身份与审核状态。独立审校仍未完成，修改仍是 **needs-review** 候选，不代表已进入正式词库；未改动 `main`、`app/seed`、SQLite、学习进度、Windows/Android 安装包，不自动合并或发布。CI 最终结果以本轮新提交对应 Actions 为准。

## 第 27 轮：四级优先 + 六级同步语境/中译定向修订（2026-10-24）

- 本轮写入基线 HEAD：`53901ddafb4077328c2cc98131bed26990ef649a`。先检查本接力文档、`docs/ABC_QUALITY_PROGRESS_2026-10-18.md` 历史快照、最新 Actions；TEM-009 首批 57 对 commit `efc88f30c60d3e883904d0dea1111df9507e3fd5` 对应 Actions `39959184869` 为 `completed/success`；上轮 CET-4/CET-6 6 对 commit `53901ddafb4077328c2cc98131bed26990ef649a` 对应 Actions `40065433056` 为 `completed/success`。旧质量报告不作为实时剩余数。
- 用户明确要求四级、六级优先，故本轮未继续 TEM。复查现有 CET-4/6 候选，跳过已经定向编辑的 `editorial-context-rewrite-needs-review`、未经独立义项核验的 `crossbook-sense-unverified`，仅从 `existing-exact-source-candidate` 中挑选存在不自然中译、搭配含糊或空泛场景的条目。**实际改写 CET-4 27 对、CET-6 15 对，合计 42 对**。共享词头按各自独立任务源核对后分别修订；没有把旧模板扫描数量当作质量结论。
- 代表性修复：`benefit` 改为骑车通勤缓解拥堵；`characteristic` 通过特有鸟鸣辨认鸟类；`circumstance` 改为情况突变导致取消行程；`clue` 用寄件地址识别寄信人；`distribution` 用灾后志愿者分发物资；`devote` 用每晚花一小时读书；`drown` 用救生员及时施救；六级 `conventional` 修正“新设计”与“传统发动机”的不平行比较；`database` 改善馆藏数据库中译。
- 仅更改 11 份 `docs/model-task-results/worker-A/cet4-038..045` 与 `cet6-021..023` 的 `result.json` 中所选行的 `proposed.example`、`proposed.example_translation`、`draft_method`；新增 `test/abc-cet4-context-27.test.js` 和 `test/abc-cet6-context-15.test.js`，逐行锁定改写后的英中句、`identity.source_raw`、`selected_sense`、`original`、任务 SHA 和审核状态，并对涉及任务的全部源身份/原字段做校验。写入前回滚允许修改的三字段后逐行与旧 JSON 比对一致，确认 `input_sha256`、`identity`、`original`、`selected_sense`、`evidence=[]`、`needs-review`、`external_human_review=false`、`full_dictionary_senses_reviewed=false` 不变。
- 所有修订仍是 **needs-review** 编辑候选，未经独立词典或外部人工审核，不代表正式安装词库更新；未改动 `main`、`app/seed`、SQLite、学习进度、Windows/Android 安装包，不自动合并或发布。提交后 CI 以新 commit 对应 Actions 最终结论为准，未完成不得声称通过。

## 第 28 轮：CET-4/CET-6 30 对语境、搭配与译文定向修订（2026-10-24）

- 写入基线 HEAD：`2ad79f7fbb266b3f3bed3dc6d8dd6803e3c73d3e`。开始前读取本接力文档、`docs/ABC_QUALITY_PROGRESS_2026-10-18.md` 历史快照、最近 Actions；TEM-009 57 对 commit `efc88f30c60d3e883904d0dea1111df9507e3fd5` 的 Actions `39959184869` 为 `completed/success`，上轮 CET-4/6 42 对 commit `2ad79f7fbb266b3f3bed3dc6d8dd6803e3c73d3e` 的 Actions `40069395739` 为 `completed/success`。该质量快照不是实时剩余量；开始时未发现其他 Agent 新提交。
- 严格按四级/六级优先审阅，只从未改写的 `existing-exact-source-candidate` 中逐条对照 `identity.source_raw`、`selected_sense.pos/meaning` 及原中英句，挑选存在生硬译法、语境不充分或搭配不自然的 **30 对**（CET-4 **21 对**，CET-6 **9 对**）；没有为凑 40–60 对重写自然句。跳过 `crossbook-sense-unverified` 和先前已编辑行，TEM 本轮未处理。
- 代表修订：四级 `accent` 从陌生口音与认出声音的冲突语境改为地方口音影响听懂录音；`airline` 用取消航班后的改签；`bleed` 修正“伤口继续流血一会儿”的生硬表达；`bone` 用恐龙骨骼化石；`eastern` 去除“湖东侧最先见阳光”的不可靠表述。六级 `commit` 改为 `committed the theft`；`corporate` 避免 `company's corporate` 冗余；`convey` 用便条表达谢意；`domain` 用计算机科学领域；两库各自锁定 `comparison`、`crash`、`dramatic` 的语境。
- 仅修改 `docs/model-task-results/worker-A/cet4-038..045/result.json` 与 `cet6-022..023/result.json` 中选定行的 `proposed.example`、`proposed.example_translation` 和 `draft_method`；新增 4 个针对性回归测试（`test/abc-cet4-context-round28-a-11.test.js`、`test/abc-cet4-context-round28-b-6.test.js`、`test/abc-cet4-context-round28-c-4.test.js`、`test/abc-cet6-context-round28-9.test.js`），逐行锁定 30 对英中句、原来源行号/原文、选定义项、任务 SHA、原始字段、全部任务行的来源身份及审核状态。修改后程序化回滚允许的三字段并与旧 JSON 完整比较一致，确认 `input_sha256`、`identity`、`original`、`selected_sense`、`evidence=[]`、`needs-review`、`external_human_review=false`、`full_dictionary_senses_reviewed=false` 未变。
- 所有改写仍是 **needs-review** 候选，未经独立词典/外部人工审核，未进入正式词库；不修改 `main`、`app/seed`、SQLite、学习进度、Windows/Android 安装包，不自动合并/发布。本轮 CI 需在提交后核实对应 Actions 的最终结论，未完成不得声称通过。

- CI 复核（Actions `40073265868`）：首次运行 `completed/failure`，314 项测试中 313 项通过、1 项失败。失败仅来自本轮新增 `test/abc-cet4-context-round28-a-11.test.js` 的标点断言错误：`anything` 的合法英文疑问句以 `?` 结尾，而测试只允许句号；例句及中文译文本身无需改动。已定向调整测试为允许 `. ! ?` 结尾，同时仍要求中文句号，未改动任何候选词条、来源或正式词库。修复提交的 CI 必须另行确认最终状态。
- CI 第二次复核（Actions `40073486390`）：仍为 `completed/failure`，314 项中 313 项通过。进一步定位为同一测试只接受中文句号，但 `anything` 的自然中文疑问句以全角问号 `？` 结尾。已将标点守卫修正为英文允许 `. ! ?`、中文允许 `。！？`，不修改任何候选内容；再次提交后须检查新 CI 最终状态。

## 第 29 轮：优先补全实际可见例句的覆盖审计与四级空缺队列（2026-10-24）

- 起始 HEAD：`3249a0ee895e0c3d0e73a8bbe14ca82dd076868b`；上一轮最新 Actions `40073700870` 为 `completed/success`，TEM-009 `efc88f30c60d3e883904d0dea1111df9507e3fd5` 的 check-run 为 `completed/success`。检查历史质量快照，区分 26,612 待审草稿和正式词库内容。
- 本轮根据用户“先给每个词都加例句”的优先级，暂停 TEM 和已有例句润色，**实际新增到应用 0 对**。六级 2026-10-21 记录为 2266/2272，但发现 2026-10-22 已有 6 条精确来源的词性修订及双语例句，故源码应达到 2272/2272，等待新覆盖测试确认；四级历史本机快照 762/4460，当前用户运行时覆盖未知。
- 新增 `docs/MOCI_CET_EXAMPLE_COVERAGE_2026-10-24.md`：按 `source_raw`、任务 SHA、源词性和草稿内容筛出 **51 条四级仍缺正式例句的待审队列**，未重复生成已存在的候选句。新增 `test/cet4-cet6-example-coverage-guard.test.js`：只读检查新建词库的四级/六级实际来源匹配双语覆盖，并防止这 51 条被误认作已安装。
- 本轮不修改 `app/seed`、用户 SQLite、`main`、学习记录、Windows/Android 包，也不合并发布；此前禁止正式接入的约束仍有效。候选队列不是已安装例句。新 CI 必须在提交后查询最终状态。
- CI 后续核实：本轮 51 条队列与覆盖回归的修正提交 `8a2699676eb0f41985d314e1377baaee83609129` 对应 Actions `40077698688` 已 `completed/success`。实际 CI 日志输出：**四级源码新建词库 799 / 4,460 对，缺 3,661 对；六级 2,272 / 2,272 对，缺 0 对**。这与 2026-10-15 四级本机旧快照 762 对不是同一统计时点/口径；六级 2026-10-22 本机全覆盖另有 `docs/MOCI_RELEASE_2026-10-22.md` 记录。用户当前 SQLite 未读取，不能宣称已同步。第一份队列提交 `9126a09f` 的 CI 因 50/51 断言不一致失败，已由 `8a269967` 修复并通过；所有候选仍未正式接入。

## 第 30 轮：四级全量例句覆盖接入（2026-10-24）

- 用户把目标改为四级一口气补全。开始前 HEAD `679e9c1553ef292b52d02b1996bf4ed2b8ca5347`，此前 CI `40077925818` 及 TEM-009 `39959184869` 均 completed/success。
- 从全部 45 个 CET4 模型任务提取 4,460 对英文例句及中文译文，打包成 5 个仅包含四级内容的 source-locked JSON 文件；候选身份与任务 SHA 保留，标签标示未经独立词典审校。
- 先保留之前已存在的四级正式例句，填补此前缺失的空白，版本升级沿用备份/不覆写用户非空例句与学习状态的机制。新增完整覆盖回归测试、更新之前“51 条尚未接入”的检查，以源码 CI 为准。
- **质量风险：** 这些模型候选的部分来自跨词库相同拼写/词性匹配，未逐条独立审核；4,460 全量覆盖不能等同于 4,460 条词典级准确性认证。用户本机与安装包仍未被远程改动，不自动合并/发布。

- 首轮 CI `40079683820` completed/failure：新增 fallback 键曾使用字面上的反斜杠零，未匹配既有 `source_file + NUL + word` 键，影响既有正式例句。现统一使用 `String.fromCharCode(0)`，原中英句、身份与用户数据未变，需重新测试。

- 修复分隔键后的第二轮 CI `40079931116`：313+ 测试中仅新增的 CET4 全量测试失败，原因是 CET6 词 `abolish` 的源词性通过既有解析器修正后，应用从旧版 `reviewed-examples` 回退取得例句，而新测试只调用 `reviewedExample`。已让新增测试依据应用实际三层来源（源自带例句、精确来源匹配、旧库存词性回退）核验六级，不改任何源数据。须以最新 Actions 最终状态判断。

## 第 31 轮：考研与专四专八整库双语例句覆盖（2026-10-28）

- 用户优先级：先加完尚缺词库的英中例句，质量逐义审校随后进行；初始开发分支 HEAD `2b0ec763c236e7c9c9d75a8ea0b1a1704e37d7ef`，对应 CI `40313248298` completed/success。
- 为 NPEE 的 5384 条、TEM 的 12439 条全量候选生成原始来源绑定内容包，既有正式例句优先、仅填空白，升级使用备份事务及身份检查；新增测试确认源身份、双语完整性和静态覆盖率。
- 不能把高考 PDF 的 2057 条候选硬套到不同的中考源表；中考另作独立补句。所有新句标记未独立审校，尚存在机械句/义项风险。用户本机 SQLite、main 和发布包未触碰，CI 以最新完成状态为准。
