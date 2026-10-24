# 墨词四、六级例句优先覆盖审计（2026-10-24）

## 本轮结论与证据级别

**目标是每个可学习词条在应用中有一对英文例句和中文译文，而不是继续优先润色已有草稿。** 本轮只读检查分支 `feat/moci-web-handoff-20261016` 的起始 HEAD `3249a0ee895e0c3d0e73a8bbe14ca82dd076868b`，并查看历史质量记录、已接入例句与现有回归测试。

| 词书 | 有效源词条 | 最新可用的历史本机已安装例句 | 2026-10-24 源码预期覆盖 | 本轮新增实际安装 |
| --- | ---: | --- | --- | ---: |
| 四级 CET-4 | 4,460 | 2026-10-15：762 对，缺 3,698 对（旧快照） | **2026-10-24 CI 实测源码可见 799 / 4,460，缺 3,661**；并非当前用户 SQLite 读数 | **0** |
| 六级 CET-6 | 2,272 | 2026-10-22 本地运行已实测 **2,272 / 2,272**（见发布记录） | **2026-10-24 CI 实测源码可见 2,272 / 2,272，缺 0** | **0** |

- 四级源表有 **157** 条隔离行（原文解析/冲突问题）；六级在 2026-10-15 的源表审计中隔离行数为 **0**。这是**源行问题**，不是 157 个有效词条缺例句。
- 六级先前 6 条 `constant`、`correlate`、`despite`、`elapse`、`recover`、`regulation` **不是仍待编写例句**：2026-10-22 的 `app/seed/lexical-cet6-reviewed-20261022.json` 已为它们分别绑定词性修订和双语例句，`test/cet6-lexical-closure.test.js` 有来源锁定、增量更新和学习状态保护测试。本轮不重复造句，也不将历史 99.7% 当作当前覆盖；2026-10-22 的本机实际安装收据见 `docs/MOCI_RELEASE_2026-10-22.md`。
- `docs/ABC_QUALITY_PROGRESS_2026-10-18.md` 中的 **26,612 / 26,612** 是待审双语草稿覆盖率，**不代表应用已安装**；即使静态源码预期 100%，也不能推断用户当前数据库、独立 Windows/Android 包已经同步。
- **运行时数据库当前覆盖：未知。** 本轮未连接或读取用户本机 SQLite、没有启动真实用户安装包。新测试只验证当前 GitHub 源码在**新建词库**时能找到的双语句对；最新源码检查在 Actions `40077698688`（`completed/success`）输出四级 799/4460、六级 2272/2272；旧库的来源哈希、个人修改和内容升级状态可能影响实际展示。

## 本轮具体产出：51 条四级空缺候选复核队列

从 `cet4-001` 和 `cet4-002` 中逐行核对任务输入 SHA、`identity.source_raw` 与 `cet4.txt` 原始行、`original` 空白例句、`selected_sense` 词性、英文例句及中文译文。下列条目在现有候选中**已经有**双语句对，本轮只建立下一阶段可追溯复核清单，**不是新创作 51 对、不是已通过外部审校，更不是已进入应用**。原 `source-checked` 仅指先前记录的来源检查，`external_human_review=false`、`full_dictionary_senses_reviewed=false` 保持不变。

| 候选来源（任务 / 0 基行号） | 词头 | 原始源行 | 待核对英文例句 | 中文译文 |
| --- | --- | ---: | --- | --- |
| `cet4-001#1` | `absolute` | 17 | We need absolute silence during the test. | 考试期间我们需要绝对安静。 |
| `cet4-001#6` | `acceleration` | 26 | The car has enough acceleration to join the highway safely. | 这辆车的加速性能足以让它安全地并入高速公路。 |
| `cet4-001#7` | `acceptable` | 29 | The final price is acceptable to both sides. | 最终价格为双方所接受。 |
| `cet4-001#17` | `accuracy` | 44 | Please check the accuracy of the figures before sending the report. | 发送报告前请核对这些数字的准确性。 |
| `cet4-001#18` | `accustom` | 47 | The teacher used simple games to accustom the children to speaking English. | 老师用简单的游戏让孩子们习惯说英语。 |
| `cet4-001#21` | `acre` | 55 | They bought an acre of land near the village. | 他们在村子附近买了一英亩土地。 |
| `cet4-001#22` | `actor` | 61 | The actor rehearsed his lines before the show. | 演出前，这位男演员排练了台词。 |
| `cet4-001#23` | `actress` | 62 | The actress thanked the audience after the show. | 演出结束后，这位女演员向观众致谢。 |
| `cet4-001#26` | `ad` | 66 | I saw an ad for a new phone online. | 我在网上看到一则新手机广告。 |
| `cet4-001#30` | `admission` | 77 | Her admission of the mistake surprised the team. | 她承认了错误，这让团队很意外。 |
| `cet4-001#31` | `advanced` | 82 | The students are taking an advanced course in biology. | 这些学生正在学习一门高级生物课程。 |
| `cet4-001#32` | `adverb` | 85 | In this sentence, “quietly” is an adverb. | 在这个句子中，quietly 是一个副词。 |
| `cet4-001#33` | `advertisement` | 86 | The company placed an advertisement for the new service online. | 这家公司在网上为新服务刊登了一则广告。 |
| `cet4-001#35` | `aeroplane` | 90 | The aeroplane landed safely before sunset. | 这架飞机在日落前安全着陆。 |
| `cet4-001#38` | `agent` | 105 | Our agent negotiated a better price for the company. | 我们的代理人为公司谈下了更好的价格。 |
| `cet4-001#41` | `aim` | 114 | We aim to finish the project by June. | 我们力争在六月前完成这个项目。 |
| `cet4-001#42` | `aircraft` | 116 | The aircraft carried emergency supplies to the island. | 这架飞行器向岛上运送了应急物资。 |
| `cet4-001#43` | `airplane` | 118 | The airplane took off shortly after noon. | 这架飞机在中午过后不久起飞。 |
| `cet4-001#44` | `alike` | 122 | The two paintings look alike, though their colours are different. | 这两幅画看起来相似，尽管颜色不同。 |
| `cet4-001#47` | `alphabet` | 131 | Children learn to write the alphabet at school. | 孩子们在学校学习书写字母表。 |
| `cet4-001#49` | `altitude` | 137 | The plane flew at an altitude of 8,000 metres. | 飞机在 8,000 米的高度飞行。 |
| `cet4-001#50` | `aluminium` | 139 | This pan is made of aluminium. | 这个平底锅是铝制的。 |
| `cet4-001#51` | `amaze` | 142 | The view from the mountain amazed us. | 山上的景色让我们惊叹不已。 |
| `cet4-001#53` | `ampere` | 150 | A current of one ampere passed through the wire. | 一安培的电流通过了这根导线。 |
| `cet4-001#58` | `angel` | 159 | The child drew an angel with large white wings. | 这个孩子画了一个长着大白翅膀的天使。 |
| `cet4-001#59` | `announcer` | 166 | The announcer gave the latest score after the break. | 休息后，播音员播报了最新比分。 |
| `cet4-001#63` | `anyone` | 178 | Anyone can join the club if they follow the rules. | 只要遵守规则，任何人都可以加入这个俱乐部。 |
| `cet4-001#64` | `apologize` | 184 | I should apologize for arriving late. | 我应该为迟到道歉。 |
| `cet4-001#66` | `apparatus` | 186 | The firefighters carried breathing apparatus into the building. | 消防员把呼吸器材带进了大楼。 |
| `cet4-001#67` | `apparent` | 187 | It soon became apparent that the door was locked. | 很快就明显看出门是锁着的。 |
| `cet4-001#69` | `appearance` | 190 | The sudden appearance of dark clouds worried the hikers. | 乌云突然出现，让徒步者们担心起来。 |
| `cet4-001#70` | `appliance` | 193 | The new appliance uses less electricity than the old one. | 这台新电器比旧的耗电更少。 |
| `cet4-001#71` | `applicable` | 194 | This rule is applicable to all applicants. | 这条规定适用于所有申请人。 |
| `cet4-001#72` | `appoint` | 197 | The board appointed a new director last week. | 董事会上周任命了一位新主管。 |
| `cet4-001#73` | `approval` | 202 | The committee gave its approval to the new plan. | 委员会批准了这项新计划。 |
| `cet4-001#75` | `approximately` | 205 | The journey takes approximately three hours. | 这段旅程大约需要三个小时。 |
| `cet4-001#78` | `arbitrary` | 208 | The rule seemed arbitrary because no reason was given. | 这条规则似乎很武断，因为没有给出任何理由。 |
| `cet4-001#79` | `architecture` | 209 | The architecture of the building reflects the local climate. | 这座建筑的设计风格体现了当地气候特点。 |
| `cet4-001#80` | `argument` | 212 | We had a brief argument about which route to take. | 我们就该走哪条路简短地争论了一下。 |
| `cet4-001#81` | `arithmetic` | 214 | She used mental arithmetic to check the total. | 她用心算核对总数。 |
| `cet4-001#85` | `artistic` | 229 | She showed artistic talent at a young age. | 她很小的时候就展现出艺术天赋。 |
| `cet4-001#87` | `ash` | 231 | Fine ash covered the windowsill after the fire. | 火灾后，窗台上覆盖了一层细灰。 |
| `cet4-001#90` | `assembly` | 240 | The students met in the assembly hall before class. | 上课前，学生们在礼堂集合。 |
| `cet4-001#91` | `assignment` | 243 | I finished my biology assignment before dinner. | 我在晚餐前完成了生物作业。 |
| `cet4-001#92` | `assist` | 244 | Could you assist me with this form before I send it? | 我寄出这张表格前，你能帮我看一下吗？ |
| `cet4-001#94` | `assure` | 249 | I assure you that the room will be ready by noon. | 我向你保证，房间中午前会准备好。 |
| `cet4-001#95` | `atmospheric` | 256 | Atmospheric pressure falls as a storm approaches. | 风暴临近时，大气压力会下降。 |
| `cet4-001#97` | `atomic` | 258 | Atomic energy is produced when atoms are split. | 原子能是在原子分裂时产生的。 |
| `cet4-002#0` | `attentive` | 265 | She remained attentive throughout the long lecture. | 整场长时间的讲座中，她始终专心聆听。 |
| `cet4-002#1` | `attraction` | 268 | The attraction between the two magnets pulled them together. | 两块磁铁之间的吸引力使它们彼此靠近。 |
| `cet4-002#2` | `attractive` | 269 | The apartment is attractive because it gets plenty of sunlight. | 这套公寓很有吸引力，因为阳光充足。 |

**队列门槛：** 正式接入前仍需核实每条是否已由旧版个性化例句、旧 seed 或词性修订填充；复核对应的源义项、英文搭配和译文，并重新读取分支 HEAD。不得以同词头直接跨书复用，不得覆盖已有非空句对或用户修改。

## 允许的下一步与当前阻断

1. 优先针对四级真实缺口，逐义核对候选并生成正式接入前的**只读预览**；六级源码已预期全覆盖，先验收而不是继续写重复句。
2. **尚未获得修改 `app/seed` 或用户 SQLite 的新授权。** 本轮严格只提交开发文档和针对性回归测试；51 条只是待审队列。要让四级新增例句真正显示在应用中，需要明确允许在来源锁定、备份和不覆盖用户数据的前提下增量修改正式例句内容链路。
3. CI 测试负责区分静态可见双语覆盖与待审草稿，不读取用户私有学习数据库。未完成的 CI 不能宣称通过。

## 可复核入口

- 旧安装快照：`docs/vocabulary-audit/content-current-20261015.json`。
- 六级 2026-10-21 实际安装记录：`docs/CET6_WHOLE_BOOK_EXAMPLES_2026-10-21.md`。
- 六级 2026-10-22 补齐六条来源修订：`app/seed/lexical-cet6-reviewed-20261022.json`、`test/cet6-lexical-closure.test.js`。
- 任务候选：`docs/model-task-results/worker-A/cet4-001/result.json` 与 `cet4-002/result.json`。
- 2026-10-22 本机实测六级全覆盖与 Windows 预览包：`docs/MOCI_RELEASE_2026-10-22.md`。
- 2026-10-24 源码覆盖检查：GitHub Actions `40077698688`，结果 `completed/success`；四级 799/4460，六级 2272/2272。
- 新源码覆盖与队列完整性回归：`test/cet4-cet6-example-coverage-guard.test.js`。
