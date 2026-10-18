# 墨词词库质量续接：机械例句 + 跨词库义项审核（2026-10-18）

## 本轮已落地

在开发分支 `feat/moci-web-handoff-20261016` 中：

- **全库双语例句草稿：26,612 / 26,612**；缺失例句：**0**。
- **人工定向语境改写的候选记录新增 208 条**，由 **191 条离线机械草稿**和 **17 条跨库例句纠错**组成。它们仍属未经独立词典审核的教学候选，不是正式发行内容。
- **当前使用离线通用模板的草稿：2,789 条**（上一检查点 2,980 条）。
- **跨词库复用、义项尚待独立核实：5,518 条**（上一检查点 5,535 条）。
- **质量正则初筛疑点：2,793 条**（上一检查点 2,979 条）。
- 纯引用占位句：0；词义数字编号漏入英文例句：0。

以上数字来源于全库重算的 `docs/model-quality-patches/example-quality-audit-20261018.json` 和 `docs/model-quality-patches/crossbook-semantic-review-queue.json`。当前自动化校验通过。各项计数口径不同，不能相加成不合格词条总数。

## 新增跨库语义排查器

`scripts/triage-abc-crossbook-senses.js` 逐条读取全部 268 个源身份绑定任务，根据中文源释义与例句翻译的汉字/双字组合重合度产生**待人工核查优先队列**。

- 待核查的跨库候选共 5,518 条。
- 其中 2,312 条因中文双字词汇未重叠而被放入优先队列，614 条连去除停用字后的单个汉字都无重叠。
- **零重合不表示句子一定错误**。翻译可以用同义表达和意译；双字重合也不等于语义匹配。工具绝不将分析结果自动升级成 `verified`、`accepted` 或安装到用户词库。

## 已纠正的典型教学偏差

| 单词 | 之前的问题 | 校改目标 |
|---|---|---|
| `rainbow` | 原例句在解释 `trainbow` 的拼写错误，根本不是使用彩虹一词 | `A rainbow appeared above the hills after the rain.` |
| `review` | 采用“戏剧评论”义，偏离来源“再检查、复习” | `Please review your notes before the examination.` |
| `right` | 用“向右”，来源选择“正确的” | `You were right about the answer to the question.` |
| `run` | 用“经营面包店”，而来源选择“跑、行驶、流” | `She can run five kilometres without stopping.` |
| `sense` | 用“词语含义”，而来源选择“感官、感觉” | `She has a keen sense of smell.` |
| `submit` | 用“提交报告”，而来源选择“服从” | `They refused to submit to the unfair order.` |
| `suit` | 用“西装”，而来源选择“诉讼” | `Her lawyer filed a suit against the company.` |
| `terminal` | 用“机场航站楼”，而来源选择“末端” | `The wire is connected to the positive terminal of the battery.` |
| `terrific` | 用“精彩”，而来源选择“可怕的、极大的” | `The storm caused terrific damage along the coast.` |
| `approximate` | 不自然的 `an approximate total` | `The approximate cost of repairing the roof is £500.` |
| `atom` | 原句“把样本分解成原子用于实验”不自然且缺乏依据 | `A single atom is far too small to see with the naked eye.` |

## 验收、安全和剩余工作

全量 `npm test`、`audit-model-evidence.js --strict`、跨书审核队列单测已在 GitHub Actions **39133927317** 成功。15 条四级跨书错义项另有独立回归测试，另外两条 TEM 校改也建立了源身份测试。

所有文件只改未批准的 `docs/model-task-results/worker-*/<task>/result.json`，原始词表、`app/seed`、用户学习 SQLite、`main` 与安装包都没有被修改。正式发布前仍需复核 **2,789 条机械例句**与 **5,518 条尚待独立义项验证的跨书候选**，以及其他早期未审核的原始提议。
