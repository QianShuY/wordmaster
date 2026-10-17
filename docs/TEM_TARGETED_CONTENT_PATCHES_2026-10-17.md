# 墨词 TEM 词库：三个可追溯的教学释义修订

日期：2026-10-17。目标分支：`feat/moci-web-handoff-20261016`。本轮只修正三个**精确来源绑定**的源词条，不声称全库或全部义项审校完成。

## 修订清单

| 单词 / 来源行 | 先前显示问题 | 修订后的教学内容 | 语言证据 |
|---|---|---|---|
| subjective / tem.txt:11114 | 第二义项缺闭合括号，文本不完整 | 区分主观意识与依据个人观点进行判断的用法 | Cambridge https://dictionary.cambridge.org/dictionary/english/subjective |
| tuck / tem.txt:11953 | 第三义项出现『打褶桐』损坏文本 | 塞入、掖入；折起/卷起衣物；给衣料打褶 | Oxford https://www.oxfordlearnersdictionaries.com/definition/english/tuck_1 ，另据 Dictionary.com 的针线活动词义核对『打褶』 |
| unawares / tem.txt:12036 | 『吃惊地』容易误当作独立义项 | 出乎意料地；正式语体下未察觉地、不知不觉地 | Oxford https://www.oxfordlearnersdictionaries.com/definition/english/unawares ，Cambridge https://dictionary.cambridge.org/dictionary/english/unawares |

三条均配置原创中英双语例句，保存在 `app/seed/meanings-targeted-20261017.json`。来源页面展示的示例句不复制到项目内。针对的是所选教学义项，不是完整词典所有词性、短语和搭配的全量终审；因此仍保留 `external_human_review=false`、`full_dictionary_senses_reviewed=false`。原始词表 `app/seed/tem.txt` 不改动，审计可追溯。

## 旧数据库升级条件

- 新内容版本：`2026-10-17.1`。
- 接入既有 `shared/content-corrections.js` → `app/vocabulary.js` / `app/content-maintenance.js` / `app/content-upgrade.js`；不修改源词头、来源行、原始内容、词库 ID 或单词 ID。
- 升级前生成一致性备份；只处理来源哈希匹配、未标历史/只读且身份唯一的内置词库。
- 精确匹配来源文件、行号、原始文本、词头、词性、原释义、音标才允许修订。用户自己修改的字段不被覆盖；已手填例句不会被自动替换。
- 事务失败回滚；用户答题日志、复习日、计划、卡牌收藏和章节进度受到原有 `protectedDigest` 约束。
- Android 使用独立数据和版本，不受本轮源码升级自动影响。

## 自动回归检查

新增 `test/tem-targeted-content.test.js`，校验所有来源身份、错误匹配拒绝、产物释义及原创例句，并在隔离 SQLite 数据库上模拟旧版本升级、用户手改释义、单边手填例句、已保存进度、一致性备份及重试幂等。**该测试和 Linux CI 的成功不能替代 Windows EXE 的真实操作验收**；最终交付仍需重新打包测试，不可将源码版本当成已分发发行包。
