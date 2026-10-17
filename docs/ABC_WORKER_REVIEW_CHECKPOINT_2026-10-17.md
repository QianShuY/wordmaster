# 墨词 A/B/C 工作成果续作检查点（2026-10-17）

工作分支：`feat/moci-web-handoff-20261016`。**本文件不是词库全量审校证明，不允许自动导入正式 seed。**

## 本轮做了什么

本轮以 GitHub 交接分支已有的 144 份 `result.json` 为起点；保留每条 `identity`、`original`、`task_id` 和 `input_sha256`，不重写原输入。补充的是原有结果文件和独立审核线索，不是安装补丁、重置数据或更新本机 SQLite。

| 模型 | 分配任务 | 原草稿行 | 本轮新续作 | 现在草稿行 | 仍未形成草稿 | 正式独立 accepted |
|---|---:|---:|---:|---:|---:|---:|
| A（四级、六级、tem-001～022） | 90 | 1,682 | 18 | **1,700** | 7,232 | 0 |
| B（考研、高考剩余、tem-023～036） | 89 | 3,743 | 57 | **3,800** | 5,041 | 0 |
| C（tem-037～125） | 89 | 8,839 | 0（原有行内修正） | **8,839** | 0 | 0 |
| 合计 | **268** | **14,264** | **75** | **14,339 / 26,612** | **12,273** | **0** |

A 的 `cet4-017` 和 B 的 `npee-038` 原前缀均保留，分别由 82/100 和 43/100 补到 100/100，进度文件已对应更新。新增 75 条双语例句是 **needs-review 的原创候选稿**，没有独立核验的原词典证据，不得标注 `source-checked` 或 `accepted`。下一任务分别为 `cet4-018`、`npee-039`。C 的 89 份结果虽全部等长提交，但多数仍需要正式语言复核，**不能把 C 视为审核完成**。

## 已直接打开原词典页面并做局部独立复核

本轮独立检查了对应原词典页面（下列链接为已打开的来源，区别于 worker 的口头自报）；每条结果仍保持 `verification=needs-review`，因为没有完成所有义项/原中文/原 IPA/例句/同形词的全面验收：

- **A:** `cet4-003/canvas`：[Oxford canvas](https://www.oxfordlearnersdictionaries.com/definition/english/canvas)，新增经过独立打开的官方 .com 来源条目；旧 .co.uk 证据保留。
- **B:** `npee-022/maiden`（文学化旧称，核对名词）[Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/maiden_1)，`npee-022/mainland`（核对 **the mainland** 名词）[Oxford](https://www.oxfordlearnersdictionaries.com/us/definition/english/the-mainland)。
- **B:** `npee-023/meantime`（核对 **in the meantime**）[Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/meantime_1)，`npee-023/medical`（形容词、医疗领域）[Oxford](https://www.oxfordlearnersdictionaries.com/us/definition/english/medical_1)。
- **B:** `npee-035/sanction`（仅核对名词处罚义，并明确保留“批准”反向义项）[Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/sanction_1)，`npee-035/savage`（凶猛形容词例句，不把旧式辱称当作示范）[Oxford](https://www.oxfordlearnersdictionaries.com/us/definition/english/savage_1)。
- **C:** `tem-099/strike`（修复名词罢工与动词 to strike 的错配）[Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/strike_2)，`tem-099/subjective`（双重主观义、源释义右括号缺失）[Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/subjective)。
- **C:** `tem-108/tuck`（塞入 vs. 折边，源“打褶桐”待核）[Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/tuck_1)，`tem-108/unawares`（改为自然的 caught ... unawares）[Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/unawares)。
- **C:** 填补此前空例句的 `tem-049/image` [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/image)、`tem-086/ruffle` [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/ruffle_1)、`tem-087/ruthless` [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/ruthless)。

以上 14 条是**局部有据复核**，不是 14 条完整 accepted；引用事实仍须针对其他义项、中文、例句翻译、音标以及词性联合检查。

## 审计格式修复

- B 的 `npee-001` 原 9 条 `evidence` 使用单对象而非数组，已逐条**保留原对象**并转换为单元素数组，不凭此提高审核级别。涉及 academy、accelerate、acceptable、acceptance、accessory、accidental、acclaim、accommodate、accomplish。
- A 的 canvas 先前自报引用 Oxford .co.uk 域名（旧审计工具不识别）；已独立核对其官方 .com 词典来源，并把新条目追加到 evidence，保留旧证据。
- A 的 `cet4-014`、`015`、`016`、`017` 合计 **299 个 issues: [null] 占位符**已移除：分别 74、76、79、70 个，不触碰实际有内容的 issue，且同步调整 `progress.json` 真实问题行数（15、24、21、30）。历史原稿仍可追溯于 Git 提交记录；移除空占位不代表条目语言审核通过。
- C 逐文件扫描全部 89 份，发现此前 `image`、`ruffle`、`ruthless` 3 个缺双语例句的条目，已经补齐并保留 needs-review。

## B 仍有 9 条主动阻断的空例句

**不要自动拼凑、统一替换或移除词库原文**。这些行保留在原 `result.json` 中，需先明确义项、词头、语域与授权词典依据：

| 文件 | 词 | 当前阻断原因 |
|---|---|---|
| npee-018 | initiative | 源主词性为形容词，而已查来源常见名词义；需决定词性修订范围 |
| npee-022 | madame | 与 madam 混淆风险，英文词头/语域尚缺独立证据 |
| npee-023 | missionary | 源主词性是形容词，现有证据只明确名词；需分词性 |
| npee-025 | Negro | 英语过时且有冒犯性，须审慎制定仅识别旧文本的教学习惯用法 |
| npee-026 | oriental | 人称名词可能冒犯；旧式地理/物件修饰语需要限定义项 |
| npee-029 | pitch | 沥青义与投掷义混合，同形词/词头与来源需隔离 |
| npee-032 | queer | 历史“古怪”义与现代 LGBTQ 身份义的时代/语境区分 |
| npee-032 | rape | 涉及严重性暴力，避免无语境演示；需恰当语域和准确词性 |
| npee-034 | resume | résumé（简历）与 resume（继续）的读音/同形词问题，不能串义项 |

这些缺口是**显式的审校待办，不是已审核且遗漏的正常英语样例**。后续确认确切义项后再按原词典来源、示例翻译和全部词性进行修订。

## 回归与数据保护

代码和词库审核工作沿用 GitHub Actions Node 24 自动检查；**CI 通过证明结构/测试可运行，不证明词典全量核验通过**。未触及种子/数据库、未运行 `rebuild-vocabulary.js --apply-reset`、未更动学习计划、收藏或旅程数据；也没有进行 Windows EXE 实机验收。

下阶段只聚焦 A/B/C：按原任务 manifest 逐文件续作未完成的 124 个任务，同时用已直接可访问的原词典逐条审查 C 的 8,839 行，建立独立的 `accepted/rejected/needs-review` 证据明细。既有 worker `source-checked` 一律为**待独立复核的声称**。在全量审核门槛达到前不导入正式词库、不推进高考正式替换、不声称 ABC 已全部完成。
