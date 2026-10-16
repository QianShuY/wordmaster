# 词库第二批：六级隔离恢复与高考范围草案

本批已应用六级内容恢复；高考范围只建立草案，没有删除中考库，也没有把候选释义直接投入正式学习。

## 一、六级原 14 条隔离源行处理完毕

| 项目 | 结果 |
| --- | --- |
| 六级有效词条 | 2259 → 2272 |
| 原隔离行 | 14 → 0 |
| 重复记录 | 两条 unity 经核验合并为一条 |
| 新增词条 | 13 条，均附对应双语例句 |
| 六级双语例句覆盖 | 133 → 146 条 |
| 现有词条与学习 | 全部旧词条内容/ID、学习、复习、收藏、旅行、计划保持不变 |

处理内容：arbitrary、arrogant、continual、courtesy、draft、humanity、intuition、plateau、rival 的字段与词性边界；boom 的损坏航海义项；resume 的两种词性与读音；unity 的重复记录和损坏文字。

resume 1（动词）和 resume 2（名词）使用独立词条身份；界面与拼写答案仍显示 resume，不要求输入内部编号。名词读音与动词区分，名词也可写作 résumé，本批保留原源词表的 ASCII 拼写，不把重音符号推广到其他题目。

原始文件与 SHA-256 不变。修复是“源文件＋行号＋完整原文”精确例外，保留 source_raw，不放宽导入解析器。同一异常原文出现在其他词库时不自动套用本批恢复。

依据与改写记录见 app/seed/cet6-recovered.json，逐条链接 Oxford/Merriam-Webster：例如 [resume 动词](https://www.oxfordlearnersdictionaries.com/definition/english/resume_1)、[resume 名词](https://www.oxfordlearnersdictionaries.com/us/definition/english/resume_2)、[unity](https://www.oxfordlearnersdictionaries.com/definition/english/unity)、[boom 航海义](https://www.merriam-webster.com/dictionary/boom)。保留或自编中文释义及句子，没有批量搬运第三方例句。

本批只解决已登记的隔离行，并不表示六级全部义项和音标已经审校。前批剩余 39 条可疑音标仍待核验，其他词库的隔离行也仍在清单中。

## 二、无重建的增量恢复

新增 scripts/recover-cet6.js，默认只读预演，--apply 才事务写入。

- 源文件指纹必须与已安装内置六级库一致。
- 仅插入缺失的核验条目；遇到同名手改内容，保留并记录冲突，不覆盖、不重新编号旧词。
- 事务内核对全部既有词条完整内容及非内容表，前后摘要一致。仅六级机器生成的内容摘要按实际词数更新，手改描述保留。
- 真实库本次恢复 13 条；再次预演新增 0 条。数据库完整性检查为 ok，外键检查无问题。

详细执行证据：[实际恢复](vocabulary-audit/cet6-recovery-2026-10-13.json)、[再次预演](vocabulary-audit/cet6-recovery-2026-10-13-preview.json)。真实运行 API 已能读到 resume 两条不同读音、释义与例句，未提交真实学习答案。

## 三、取得高考新版课标原文并提取范围

学校公开 PDF 链接实际获取时失效；改从[公开镜像](https://cdn.zizzs.com/zixunzhan/普通高中英语课程标准日常修订版（2017年版2025年修订）1762759636958.pdf)取得 178 页的课标 PDF。它是转存件，不宣称是教育部原站下载；2025 年版本通过[北师大编辑部修订解读](https://flts.bnu.edu.cn/node/17268)交叉确认。PDF SHA-256：4d2d0f33e511dc0d239d2cdc53fe16f38a107afde9bd1ae557cec9ce7bb1bba0。

已目视核对词汇附录首尾，提取 PDF 第 76–132 页（印刷页码 73–129），保留每个表项的原文、页码、主词头、括注及课程层级。

这里发现不能忽略的计数差异：附录说明写 3100 个单词，但当前 PDF 表项提取为 3098 个。使用 pypdf 与 pdfplumber 两套独立方法核对，忽略星号前空格后，3098 个表项逐项相同，无未解析行。**这证明提取结果相互吻合，不证明已解释课标的计数口径，也不能据此声称只缺两个具体单词。**

主词头完全匹配现有源词库的表项为 3047 个；51 个未直接匹配，包含英美拼写、缩写、词形及新词等。74 个表项含分组、括注或特殊写法，需要单独处理。括注可能是变体、补语、缩写释全或变形，例如 according (to)、be (am, are, is)；不能把所有括号内容都当作可互换拼写。

这些数值只代表范围草案与候选匹配。现有中文释义是候选内容，不冒称官方配义，不自动设为已审核。

交付文件：

- [词表范围与原页码](vocabulary-audit/gaokao-2025-scope.json)
- [独立提取对照](vocabulary-audit/gaokao-2025-extraction-check.json)
- [逐词候选内容草案](vocabulary-audit/gaokao-2025-content-draft.json)

提取脚本：scripts/extract-gaokao-scope.py、scripts/check-gaokao-extraction.py；候选比对：scripts/compare-gaokao-scope.js。原 PDF 和首尾渲染检查图在 output/refinement/gaokao-source/，不随前端页面加载。

## 四、验收与遗留

全量 88 项测试通过，包括源行数量守恒、同形词拼写、增量插入、手改冲突保留、学习数据摘要、幂等、源指纹不符回滚，以及高考草案保留变体和计数差异。

全词库清单已更新；旧第一批报告保留当时数字。最新六级总量为 2272，双语例句 146。

高考正式替换仍待：解释分组词和声明词数的计数口径；核对变体/缩写/词形；审核高考常用义和配套例句；记录来源使用条件。尚未满足时不删除中考，不伪装完整高考库。

下一步可并行推进独立的复习验收与第一章正式结局；内容草案不会占用真实学习或冒险存档。全量词库补全、Boss 正式结局、前端性能及发行包验收仍未完成。
