# 六级词库质量专项 · 首轮验收

本轮针对用户截图中的多词性混排、搭配挤进释义和对应例句缺失。更新已应用于本机词库，未重置学习记录，未重打 EXE。

| 项目 | 本轮结果 |
| --- | --- |
| 内置六级词条 | 2,259，词条 ID 不变 |
| 双语例句覆盖 | 5 → 131；新增 126 条自编双语例句 |
| 当前已学词例句覆盖 | 32 / 32（验收时）；每个词示范一项常用义，非全义项覆盖 |
| 多词性展示 | 483 条按原有词性分组，保留原释义 |
| 搭配说明 | 106 条单列，多个搭配拆行并分隔英文与中文 |
| 有依据的音标修正 | abortion 与 aggregate 各一处 |
| 仍待核验 | 14 条原始问题行仍隔离；47 条可疑音标字符记录在报告；全量语言审校尚未完成 |

## 内容与来源

例句为墨词自编，未批量抓取第三方词典例句。原始词条、source_raw 和源文件 SHA-256 保留；本轮只修正有明确依据的字段。

- abortion 英式读音依据：[Cambridge pronunciation](https://dictionary.cambridge.org/pronunciation/english/abortion)，改为 əˈbɔːʃən。
- aggregate 名词读音依据：[Cambridge pronunciation](https://dictionary.cambridge.org/pronunciation/english/aggregate)，改为 ˈæɡrɪɡət，区别动词词尾 eɪt。
- abuse 名词/动词变读交叉检查：[Cambridge entry](https://dictionary.cambridge.org/us/dictionary/english/abuse)。原词条的第二组音标单独显示，未丢入释义段落。
- shuttle 词性交叉检查：[Cambridge entry](https://dictionary.cambridge.org/dictionary/english/shuttle)。保留名词和动词两组，词性栏的原始 n. 是主词性，不误改成形容词。

主要实现：shared/domain.js 的 structureMeaning；app/seed/reviewed-examples.json；app/seed/cet6-corrections.json；scripts/improve-cet6.js。完整结构审计为 [JSON 报告](vocabulary-audit/cet6-quality-2026-10-12.json)。

## 学习界面

学习与词库管理页按词性分组展示释义、搭配和变读音标；管理页显示双语例句。拼写时不显示英文搭配和变读音标，避免泄露答案。选择题按精简后的可见标签去重，原始释义仍用于判题。

恢复检查点时按原词条 ID 刷新内容与例句，保留词序、阶段、重测次数和完成数。界面的临时例句补充仅用于有来源标记且未编号的内置词，不自动套给自建词或同形异义词。

## 数据与验证

补丁校验内置词库身份、源文件指纹、原始词条和字段；跳过手动编辑内容；仅填补空例句，不覆盖已有例句。事务内对 progress、review_log、user_cards、card_draws、adventure_days、recall_cycles 及词条身份做摘要比对，学习与收藏数据不变。

全量 74 项测试通过；后续搭配分行与选项去重的相关测试再次通过。实际补丁新增 126 例句、修正 2 音标；再次预演新增与修正均为 0，确认幂等。浏览器核对 shuttle 的名词/动词分组、两项搭配与双语例句，截图 output/refinement/cet6-quality-round1-20261012.png。

后续依次核验隔离问题行、可疑音标、其他常用词义与例句；不能将结构检查通过或首批例句完成视为全词库已审校。
