# 全词库连续修订核验 · 2026-10-15

此次继续原定完整目标，尚未完成高考替换、所有保留词库语言审核与例句覆盖及最终正式发布。

此前 55 个暂缓对应关系中，billion 和 ankle 已在前次修订解决。本次为另外 53 个来源条目修订释义，补齐 49 对空白例句；其余四条已有配对内容，未覆盖。包括 bored 与 boring 混淆、airline 遗漏航空公司义、branch 字误、adapt/apply/concentrate/cheer 的及物和不及物用法、civil 的民用义及 common 中的字体损坏。原始来源行、词条身份和手改保护保留。连续累计新增双语例句 1,585 对、修正释义字段 67 个；逐字段变更见 `vocabulary-audit/deferred-meanings-applied-20261014.json`（保留此前审核材料的日期命名）。

全库字符盘点发现四级 488 条音标使用 U+222B 数学积分号。按来源行、词头、同形编号、词性、释义和原音标逐一绑定，将其规范为 U+0283 ʃ；这仅为字符规范，不表示这些词的重音、音素和变体已全部核对。IPA 字符依据见 [国际语音协会图表](https://www.internationalphoneticassociation.org/IPAcharts/IPA_charts_EI/IPA_charts_EI.html)。原始字符清单独立保留，未覆盖原始证据。

另外两处字体专用字符没有靠字体映射猜测：按 [playground 名词](https://www.oxfordlearnersdictionaries.com/definition/english/playground)及 [synthetic 形容词](https://www.oxfordlearnersdictionaries.com/definition/english/synthetic_1)核对为 /ˈpleɪɡraʊnd/、/sɪnˈθetɪk/，只改这两个来源条目的音标字段。

每次真实内容更新前使用 SQLite 在线备份，事务内检查逐字段白名单、受保护状态指纹、完整性及外键。当前真实库与上述三次更新前备份的受保护指纹一致：26,268 词、32 条学习进度、84 条作答流水。未重置、代答、领取卡牌或旅程奖励。详细证据见 `vocabulary-audit/content-current-20261015.json`。

| 保留词库 | 有效词条 | 当前双语例句 | 仍缺例句 |
| --- | --- | --- | --- |
| 四级 | 4,460 | 762 | 3,698 |
| 六级 | 2,272 | 347 | 1,925 |
| 考研 | 5,384 | 778 | 4,606 |
| 专四专八 | 12,439 | 907 | 11,532 |

已有配对数不是全量语言审核通过数。后续 construction 至 data 的 100 条稿件逐词核对所选词性读音，现为 754 / 3,111 个选定义项审稿，待审 2,357 个，正式安装为 0；中考未删除或换名。content、contract、contest、contrast 为名词，contrary 为相反义形容词，continent 为洲的名词；could 选重读式，cookie 采用 Collins 英式饼干义，未拿计算机 cookie 的提取结果当食物义依据。单复数 criterion / criteria 没有作为相同拼写答案放宽。

新增教学内容与保留词库的 277 个对应关系逐条对比，268 个通过、9 个因常用义或及物用法缺失暂缓。实际补入 262 对空白例句，另外六条已有内容不覆盖；连续累计新增例句由 1,585 增至 **1,847 对**。报告为 `vocabulary-audit/common-g-examples-applied-20261015.json`，真实库与四次更新前备份的受保护指纹一致。

754 条教学内容在真实库的一次性副本中进行替换事务预演，独立创建新库、拼写策略、零学习进度及未激活计划；事务始终回滚，所有原有行恢复。真实中考无记录、编辑或引用的只读盘点结果保留，未据此直接删除；完整内容和来源条件仍未满足安装门槛。见 `vocabulary-audit/gaokao-replacement-preview-2026-10-15.json`。

随后解决上述 9 处暂缓条目：四级 conventional、convey、corn、count、credit、crew，六级 credit，专八 credit、cuisine。按词典所选用法自编中文修订，原有其他义项保留，corn 明确英美谷物用法，crew 增加机组人员，credit 增加因贡献获得赞扬认可的意思。实际补入 9 对例句，累计新增 **1,856 对**，释义修订累计 **76 个字段**；见 `vocabulary-audit/g-meanings-applied-20261015.json`。受保护指纹与五次更新前备份一致。

源构建和增量更新都验证“先规范音标字符，再应用精确绑定该读音的后续释义补丁”这条路径，修复旧安装因补丁前置关系而漏改条目的问题。没有把自建内容当成源词表，也未放宽手改保护。

完整自动回归 **145 项通过、0 失败**，最新日志 `output/refinement/tests-20261015-content4.txt`，此前日志保留。针对性检查覆盖：原文修改拒绝、用户音标/释义保留、单边自建例句不补写另一边、更新失败回滚、重复应用幂等，以及修订后的来源构建和教学例句仍一致。当前内容版本为 `2026-10-15.4`；现有 Windows 验证候选仍为此前内容版本，不能冒充包含此次修订的最终发行包。

## 后续连续内容与来源核验

database 至 discussion 的 100 条原创教学稿完成所选词性读音核对，累计 **854 / 3,111** 个选定义项，待审 **2,257** 个，正式安装仍为 0。desert 为沙漠名词 /ˈdezət/，dessert 为甜点 /dɪˈzɜːt/；digest、decrease 为末音节重读的动词，discount 为首音节重读的名词。delay、diagram、direct 明确所选词性，避免拿同页另一词性作依据。

272 个跨库候选逐一比对，257 个通过并实际补入例句。另 15 个先单列，再按词典的常用义和用法修订：decent 的像样义、demonstrate 的演示义、depend on 的取决于、desperate for 的急切需要、develop 的培养技能、discipline 的自律、deny 的否认、delicate 的易损、dignity 的尊严，以及 disappoint 的使人失望。实际再补入 15 对例句，连续累计新增 **2,128 对**、释义修订 **91 个字段**。报告为 `common-h-examples-applied-20261015.json`、`h-meanings-applied-20261015.json`，历史候选中的暂缓理由保留，但当前条目已经显式修订。

最新完整自动回归 **148 项通过、0 失败**，日志 `output/refinement/tests-20261015-content6.txt`，内容版本 **2026-10-15.6**。真实库仍为 26,268 词、32 条进度、84 条作答流水，与七次更新前备份的受保护指纹一致；事务回滚、手改音标跳过和单边例句不覆盖测试通过。disease 至 else 的下一段候选尚未审核，未计入 854 条完成数。

来源另取得课程教材研究所的版本名称依据，并复查源 PDF 的被排除行。56 条页眉页脚和 25 条字母标题中未发现额外漏词；页面声明量及级别计数与提取的来源组仍存在差异，没有为了对齐数字补删词条。详见 [来源补充核验](vocabulary-audit/GAOKAO_SOURCE_EVIDENCE_2026-10-15.md)。该研究不解除正式安装门槛。

## disease 至 else 与发布路径补齐

这 100 条原创教学稿完成所选词性读音核对，累计 **954 / 3,111** 个选定义项，待审 **2,157** 个，正式安装仍为 0。do 使用实义动词，download 使用动词读音，each、either 使用限定词；drone 的民用无人机语境及 dumpling 的饺子义补查 Collins，没有把军用专义或面团团子义冒充对应依据。

269 个跨库候选中，257 个通过；实际新增 253 对空白例句，四条已有内容保留。随后修订其余 12 个条目并补齐 12 对例句，包括 donate 字误、dress 缺义、drive 及物与不及物展示、duration 的时间长度、electric 的用电义，以及 efficient/effective 和 elderly/中年范围的混淆。累计新增 **2,393 对例句**、修订 **103 个释义字段**，版本 `2026-10-15.8`。报告见 `common-i-examples-applied-20261015.json`、`i-meanings-applied-20261015.json`；真实记录与九次更新前备份的受保护指纹一致。

维护脚本现在拒绝未知参数或同时选择多个白名单；零变化重跑不覆盖已有应用报告。实际 CLI 检查确认内容、受保护数据和原应用报告哈希都没有变化，证据为 `maintenance-noop-20261015.json`。

另补齐旧安装不会自动取得新内容的问题：运行时增量更新、先备份、回滚、用户修改保护、失败提示和直接重试均已实施。完整回归 **152 项通过**；新的 **815 文件 Windows EXE 候选**通过全新安装、结构升级及单条旧内容升级的独立验收。详见 [Windows 内容升级验收](WINDOWS_CONTENT_UPGRADE_2026-10-15.md)。这些结果不代替高考剩余内容、全保留词库覆盖及最终发布验收。
