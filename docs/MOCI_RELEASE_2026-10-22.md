# 墨词 · 六级收尾与 Windows 预览包 · 2026-10-22

本次范围：六级剩余 6 条词性冲突、学习流程实际验收、生成并检查 Windows 整包。未扩展到其他词库的全量审校。

## 六级内容

内容版本 `2026-10-22.1`。实际本地六级词库 2272 条，双语例句 2272 条。

| 词 | 本次处理 |
| --- | --- |
| constant | 现有中文释义是形容词义，改正原来的名词标签 |
| correlate | 保留动词和名词义，分开标注；例句采用已核对的动词用法和读音 |
| despite | 常用介词义放在前，原有名词义保留并标注古义 |
| elapse | 保留动词和名词义，分别标注，避免把名词用法误判为不存在 |
| recover | 现有释义是动词义，改正原来的名词标签 |
| regulation | 改正原来的动词标签，并校正英式音标中的非重读元音 |

共改正 6 条词性、3 条混合释义、1 条音标，补充 6 对原创双语例句。修订独立记录在 `app/seed/lexical-cet6-reviewed-20261022.json`，原始词表和先前的候选审核记录保持不变。

核验依据（2026-10-22 检索或打开的词典正文；未复制词典例句）：

- [Cambridge · constant](https://dictionary.cambridge.org/us/dictionary/english/constant)
- [Cambridge · correlate](https://dictionary.cambridge.org/us/dictionary/english/correlate)、[Collins · correlate](https://www.collinsdictionary.com/dictionary/english/correlate)
- [Cambridge · despite](https://dictionary.cambridge.org/us/dictionary/english/despite)、[Dictionary.com · despite](https://www.dictionary.com/browse/despite)
- [Collins · elapse](https://www.collinsdictionary.com/dictionary/english/elapse)
- [Collins · recover](https://www.collinsdictionary.com/dictionary/english/recover)
- [Cambridge · regulation](https://dictionary.cambridge.org/us/dictionary/english/regulation)

六级整库结构筛查：缺音标 0、可疑损坏音标符号 0、空释义结构 0。这是结构筛查和本次六词核验，不能据此声称全库所有义项、音标都完成了独立人工语言审校。

更新通过原有备份、事务和增量校验流程。要求词库源哈希、文件、行号、原始行、词头、同形词编号及原字段完全吻合；自定义内容跳过。只增补空白例句，不覆盖已有例句。真实数据库的 721 条作答、计划、收藏和旅行状态更新前后摘要相同；没有重置学习记录。

## 学习流程实际验收

所有作答均在独立测试数据库中执行，未替用户背词或生成真实奖励：

- 78 个积压词先安排今日 26 个，另外 52 个分散安排，新词从原定 20 个暂调为 10 个。
- 第一组实际完成 10 个词的词义回忆，再完成同一组 10 个词的拼写。
- 拼写已输入 `ap` 时，向上键读音仍可触发并保留输入，向下键可展示答案。
- `apple` 看过答案后穿插到其他词之间，连续独立答对两次才完成；服务端保存的状态为 `errors:1, streak:2, complete:true`。
- 拼写完成 4/10 时退出并完整刷新，仍从原来的拼写位置接续，不重做已完成的词义。
- 完成一组后出现休息和“继续下一组复习 · 最多 10 个”入口；实际进入下一组，词表没有重复前一组已完成的词。

实测发现并修正首页文案：原来会把未开始的后续组也说成“待完成拼写、词义已通过”。现在区分“本组剩余 6 个词拼写”和“其余 16 个复习词另分组”。总待办数量没有被隐藏或削减。

## Windows 交付与验证

- 预览包：`output/releases/WordMaster-2026-10-22.1-preview.zip`，约 127.4 MiB。
- 解压完整目录后运行其中的 `WordMaster.exe`；它是便携预览包，不是安装向导。
- 真实 Windows EXE 已验收：首次建库、两个启动器同时启动、重复启动复用服务、已有数据库副本升级和重开、7 条指定旧内容自动备份并更新、重开不重复更新。
- 空白安装得到 26268 个内置词条、0 条学习进度、schema 13。个人数据不随包分发。
- ZIP 内 844 个清单文件逐一核对长度和 SHA-256，未发现个人数据库。
- 最新包包含复习均衡与十词分组、Boss 配乐与打击音效、结局演出、全部已入库六级例句以及本次修订。
- 项目根目录旧的单文件 EXE 已先保留到本地忽略的 `output/refinement/WordMaster-before-20261022.exe`，再替换为与预览包 SHA-256 相同的新启动器。新入口读取当前源码和现有 `data/`，不再加载旧的内嵌程序。
- 新根目录启动器已针对实际数据库执行无浏览器启动与 API 核验：内容版本 `2026-10-22.1`、2272 对六级例句，全部数据库行启动前后完全相同。没有重置或替换数据库。
- 最终完整回归 **287 项通过、0 失败**，包括新增的六词增量更新保护和首页接续文案检查。

EXE 检查详情见 `WINDOWS_RELEASE_CHECK_2026-10-22.1-preview.json`。源码浏览器流程和 EXE 启动分别验证；尚未完成系统默认浏览器的完整交互验收、长时间稳定性和动画帧率测量。

现有项目目录的学习数据已经保留并完成本次内容更新。若使用全新解压目录，它默认建立空白数据；升级已有安装需保留原来的 `data/`。不要用空白数据库覆盖自己的学习记录。

## 后续范围

高考替换中考、其他词库逐条语言复核、全站长期体验与性能优化仍在待办中。本次预览包不代表这些事项已经全部完成。
