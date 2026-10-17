# 墨词 ABC 续作第 2 批：草稿与独立词典核验分离

2026-10-17，基于 `feat/moci-web-handoff-20261016` 最新交接进度。本报告接续 `ABC_WORKER_REVIEW_CHECKPOINT_2026-10-17.md`，**本节数字更新于首批，旧报告仍保留历史检查点，不应继续作为最新总量**。

## 增量成果（只含提交候选稿，不是入库许可）

| 模型 | 目前源任务总条数 | 现有草稿条数 | 未起稿条数 | 本批 |
|---|---:|---:|---:|---:|
| A | 8,932 | **1,800** | 7,132 | 新建 cet4-018 100/100 |
| B | 8,841 | **3,900** | 4,941 | 新建 npee-039 100/100 |
| C | 8,839 | **8,839** | 0 | 沿用既有 89 份，仅做语言复核 |
| **总计** | **26,612** | **14,539** | **12,073** | **新写 200 条** |

这 200 条由本轮人工构写原创双语句对，全部明确标为 `needs-review`，原任务 identity/original 和 manifest input SHA256 原样保留；没查到的词典资料绝不编造 `accessed=true`。没有修改内置正式词库、部署、数据库和用户学习记录。

A 的 `cet4-018` 因词 `Negro` 的历史冒犯性保留 1 个未补常规双语例句的审核阻断，其余 99 对候选已撰写。存在原词性待修订的 `naval`、`my`、`near` 等，例句已审查词性冲突，未偷偷覆盖原词条。

B 的 `npee-039` 撰写 100 对候选，复查了 `sponsor`、`spray` 的词性，标记了 `sprinkle`、`stale` 输入词性的疑点。当前两份文件的前 100 行即完整候选，而非独立 full-senses accepted。

## 原词典网页可直接访问的独立证据（四条）

与以前访问 Cambridge 直接返回 403 的情况不同，本次成功在浏览器检索工具**直接打开 Merriam-Webster 正文**并核对以下对应义项；因此仅对“所选义项”的来源记录 `accessed=true`，未填猜测的英式音标（`checked_uk_ipa=null`），所有条目仍为 `needs-review`：

1. `npee-018/initiative`：[Merriam-Webster](https://www.merriam-webster.com/dictionary/initiative) 同时收录常见**名词**（新计划、倡议、主动性）和较少见**形容词**（初步的）。本次例句采用常用名词义，原来源主词性 `a.` 暂不修改，正式导入前应保留/拆解多词性。
2. `npee-023/missionary`：[Merriam-Webster](https://www.merriam-webster.com/dictionary/missionary) 明确有形容词“有关宗教传教使命”和名词“传教士”，本次例句 `missionary work` 为形容词搭配，名词其他义项待审核。
3. `npee-029/pitch`：[Merriam-Webster](https://www.merriam-webster.com/dictionary/pitch) 分列黑色沥青/树脂名词义、涂抹沥青动词义及投掷等其他动词义，本句只体现**材料名词**，禁止串到投掷义。
4. `npee-034/resume`：[Merriam-Webster](https://www.merriam-webster.com/dictionary/r%C3%A9sum%C3%A9) 明列 `résumé` 的无重音拼写变体 `resume`，表示**简历**；`resume` 表示恢复/继续则是另一个动词条目和不同读音，不能混用音标。

先前 B 的 9 个未补例句：其中上述 4 个已经有可核的选定义项例句，**仍需要整个词条最终批准**。其余 5 个暂留空并阻断：`madame`、`Negro`、`oriental`、`queer`、`rape`。与 A 的 `Negro` 1 条合计为 **6 条仍缺常规双语例句**，都是显式待办而不是接受结果。

## 数据与审核约束

- 新续作前执行哈希、task_id、顺序、identity、original 验证；正在发生的其他 Agent 修改不能被盲目覆盖。
- 草稿数量、词典页面可访问性、单个选定义项证据、词条完整义项审核，**是四个不同指标**。未经全部复核不得标记 `accepted`。
- GitHub CI / Node 24 回归通过仅代表软件审计工具与文件结构可运行。未运行 EXE / Windows GUI 正式验收。
- 下一个 A 任务 `cet4-019`，B 任务 `npee-040`。其余任务可复用 `scripts/plan-next-model-review.js` 规划，不覆盖已完成草稿。
