# 第四轮视觉修订：最新真实页面样例

日期：2026-09-28  
状态：按《VOCAB_STATS_VISUAL_CORRECTION.md》完成第四轮样例，待用户复审；没有扩展到全词库。下方保留第三轮记录供对照。

## 本轮调整

- 学词继续使用居中、限宽的卡片，桌面宽 680px；收轻阴影和内边距，释义展开后仍显示词头、音标、词性与同形词标签。
- 拼写改为**一个可见输入区**：删除独立文本框，把放大的字母格放进单一区域；原生文本输入覆盖整个字母区，点按任意位置会聚焦它，支持手机输入、粘贴、退格、光标定位和输入法组合。屏幕阅读器只接触真实输入控件，装饰字母格不重复朗读。
- 拼写格桌面为 32×44px，手机随宽度缩放至约 29×38px；长单词会换行。确认、跳过和听发音按钮保留，焦点状态下都能看到。
- 正确率记录与困难词模块组成受限宽度的双列卡片，并各按内容自然定高，避免少量记录被拉成空卡。近 7 天继续显示 7 个日期槽和空日基线；热力图单元格略微放大。

## 本轮真实页面截图

截图来自本地应用路由，桌面与手机分别使用 1366×768、360×800 视口。正确率样例使用未写入的生产库快照；拼写图展示输入 `aes`，没有提交答案。

| 样例 | 状态 | 1366×768 桌面 | 360×800 手机 |
|---|---|---|---|
| 普通词 `abandon` | 查看释义前 | [桌面全页](../output/playwright/vocab-stats-sample/round-4/ordinary-front-desktop-1366x768.png) | [手机全页](../output/playwright/vocab-stats-sample/round-4/ordinary-front-mobile-360x800.png) |
| 普通词 `abandon` | 展开释义 | [桌面全页](../output/playwright/vocab-stats-sample/round-4/ordinary-open-desktop-1366x768.png) | [手机全页](../output/playwright/vocab-stats-sample/round-4/ordinary-open-mobile-360x800.png) |
| 多词性 `cardinal 1` | 展开释义 | [桌面全页](../output/playwright/vocab-stats-sample/round-4/cardinal-1-open-desktop-1366x768.png) | [手机全页](../output/playwright/vocab-stats-sample/round-4/cardinal-1-open-mobile-360x800.png) |
| 拼写题 `abandon` | 输入 `aes` | [桌面全页](../output/playwright/vocab-stats-sample/round-4/spelling-aes-desktop-1366x768.png) | [手机全页](../output/playwright/vocab-stats-sample/round-4/spelling-aes-mobile-360x800.png) |
| 学习数据页 | 首屏 | [桌面首屏](../output/playwright/vocab-stats-sample/round-4/stats-desktop-firstscreen-1366x768.png) | [手机首屏](../output/playwright/vocab-stats-sample/round-4/stats-mobile-firstscreen-360x800.png) |
| 学习数据页 | 完整页面 | [桌面全页](../output/playwright/vocab-stats-sample/round-4/stats-desktop-full-1366x768.png) | [手机全页](../output/playwright/vocab-stats-sample/round-4/stats-mobile-full-360x800.png) |

手机拼写聚焦状态另有一张 360×420 模拟图：[输入 `aes`，操作按钮仍在视口内](../output/playwright/vocab-stats-sample/round-4/spelling-aes-focus-360x420.png)。真实 iPhone / Android 软键盘不在本次桌面浏览器环境中，不能据此宣称完成真机键盘验收。该模拟视口下“确认拼写”按钮底边 298px，“跳过”和“听发音”按钮底边 358px。

## 本轮交互与安全核对

- 可见页面中 `aes` 只出现一次；可访问名称为“单词或词组拼写”的原生文本框只有一个。桌面点第二格后光标位于第 1 位；退格、短语粘贴 `take it easy`、连字符与撇号 `mother-in-law's` 均同步显示。输入法组合事件会等组合结束后再更新字母格。
- 45 字母样例在 360px 视口内换行，页面 `scrollWidth = 360`；统计页手机视口也为 `clientWidth = scrollWidth = 360`。热力图仅在日期区域内横向滚动。
- 用隔离 QA 副本完成一次错答与回炉答对，服务端结果为 `wrong → retry_correct`，仍归原词条 ID 1602。测试数据保留在 `output/playwright/vocab-stats-sample/round-4/qa-retry.db`；截图使用的干净副本 `sample.db` 没有这两条测试作答。
- 12 项自动化测试全部通过；`static/app.js`、`shared/domain.js`、`app/main.js` 语法检查通过；学习、拼写和统计路由的浏览器控制台错误数为 0。
- 生产库以只读方式检查：词库 5、单词 20,374、进度 106、答题日志 86、卡牌 62、收藏 3；`PRAGMA integrity_check` 为 `ok`。生产库 SHA-256 前后均为 `AB92E75E6FFCB198EFA726105F6992D10917D79E51BFFC57C7728CE34AA89EE9`，文件修改时间未变。干净样例副本的表计数、ID 范围和完整性与生产快照相同。

这仍是供用户复审的视觉样例；复审通过前不扩展到全部编号词条或整套词库。

---

# 学词、拼写与学习数据页：第三轮真实页面样例

日期：2026-09-28  
状态：按《VOCAB_STATS_VISUAL_CORRECTION.md》完成样例，待用户复审；未扩展到全词库。

## 本轮纠偏

- 学词页恢复受限宽度的学习卡，桌面卡片宽 680px；词头、发音、词性、释义入口和判定按钮收在同一张卡中。释义展开时保留词头与音标，普通词与拼写题共用卡片边距和按钮规格。
- 拼写页继续以真实文本输入框为主，支持输入、粘贴和光标定位；字母格缩为辅助提示。输入框聚焦时收起提示和字母格，给手机键盘留出空间。“不会，看答案”和“听发音”仍在。
- 数据页回到受宽度约束的统计卡片网格。近 7 天按 7 个日期槽显示，空日保留细基线和日期；热力图在桌面使用 16px 日期格，在手机保留可触摸的日期区域。
- 稀疏正确率继续放在原“学习记录”模块里。当前只读库有 5 个作答日，列表显示日期、正确率和正确 / 作答次数；没有另开全宽长表，也没有用稀疏折线填空。
- 保留既有安全展示映射：`cardinal 1/2` 的主词仍显示 `cardinal`，同形词标签与词性区分两行；原始 ID、词形、音标、释义和判题路径不变。

## 真实页面截图

截图由本地应用路由生成，测试服务连接的是生产数据库副本。桌面与手机尺寸指浏览器视口；完整页面截图会延伸到首屏以下。正确率数据页另附未滚动的真实首屏图。

| 样例 | 状态 | 1366×768 桌面 | 360×800 手机 |
|---|---|---|---|
| 普通学词卡 `abandon` | 查看释义前 | [截图](../output/playwright/vocab-stats-sample/round-3/ordinary-front-desktop-1366x768.png) | [截图](../output/playwright/vocab-stats-sample/round-3/ordinary-front-mobile-360x800.png) |
| 普通学词卡 `abandon` | 展开释义 | [截图](../output/playwright/vocab-stats-sample/round-3/ordinary-open-desktop-1366x768.png) | [截图](../output/playwright/vocab-stats-sample/round-3/ordinary-open-mobile-360x800.png) |
| 多词性 `cardinal 1` | 展开释义 | [截图](../output/playwright/vocab-stats-sample/round-3/cardinal-1-open-desktop-1366x768.png) | [截图](../output/playwright/vocab-stats-sample/round-3/cardinal-1-open-mobile-360x800.png) |
| 拼写题 `abandon` | 初始状态 | [截图](../output/playwright/vocab-stats-sample/round-3/spelling-desktop-1366x768.png) | [截图](../output/playwright/vocab-stats-sample/round-3/spelling-mobile-360x800.png) |
| 学习数据页 | 首屏 | [截图](../output/playwright/vocab-stats-sample/round-3/stats-desktop-firstscreen-1366x768.png) | [截图](../output/playwright/vocab-stats-sample/round-3/stats-mobile-firstscreen-360x800.png) |
| 学习数据页 | 完整页面 | [截图](../output/playwright/vocab-stats-sample/round-3/stats-desktop-1366x768.png) | [截图](../output/playwright/vocab-stats-sample/round-3/stats-mobile-360x800.png) |

手机拼写页另有输入框聚焦、压缩到 360×420 可见高度的截图：[键盘空间模拟](../output/playwright/vocab-stats-sample/round-3/spelling-mobile-focus-360x420.png)。真实 iPhone / Android 系统软键盘未连接到本次 Edge 桌面浏览器，不能据此宣称完成真机键盘验收。聚焦状态下输入框、确认、跳过和发音按钮都保留；在 360×420 模拟视口中，主要操作按钮仍在可见区域。

完整手机数据页截图中，为避免固定底栏重复压在长图中，截取时临时把底栏放回文档流；上表的手机首屏截图保留应用真实固定底栏状态。

## 操作、布局与功能核对

- 学词卡前后状态和 `cardinal 1` 多义项截图中，主要按钮无需横向滚动；手机词头、音标、释义与两个判定按钮均可见。学习页、展开释义和拼写题在 360px 下均没有整页横向溢出。
- 数据页手机视口测得 `clientWidth = 360`、`scrollWidth = 360`。近 30 天柱图为 30 个日期槽，只在图表容器内横向滚动；手机图表容器约 294px 宽、内容约 1316px，整页仍为 360px。热力图同样在自己的日期区域内滚动。
- 默认近 7 天图表显示 7 个槽及 `09/22` 至 `09/28` 日期；本机最近两天有柱，其余五天有基线占位。近 30 天正确率列表显示 5 行，均来自实际只读库数据。
- 拼写题使用真实 `<input>`。在隔离副本里输入 `acquire` 后先记错并显示正确答案，再输入 `abandon`，服务端记录为 `wrong → retry_correct`，且都归到原词条 ID 2401。该试验日志只写入副本，核对后已从副本清理。
- `cardinal 1` 页面仍分开展示 `adj.` 和 `n.` 两组释义；`cardinal 2` 页面检查显示标题 `cardinal`、正确音标、`n.`、`同形词 II`，朗读控件的无障碍名称指向 `cardinal`。没有改写源词表。
- 浏览器控制台错误数：0。桌面与 360px 手机均未发现页面横向溢出。

## 生产数据只读核对

生产库以 `readOnly: true` 打开。当前计数为：词库 5、单词 20,374、进度 104、答题日志 84、卡牌 62、收藏 3；`PRAGMA integrity_check` 返回 `ok`。近 30 天有 5 个作答日：9/12（12/22）、9/14（13/22）、9/16（13/30）、9/27（4/6）、9/28（2/4）。数据库修改时间为 2026-09-28 16:06:07（本地时间），本轮前后未变化。

## 检查结果

- `npm test`：12 项通过，0 项失败。
- `node --check static/app.js`、`node --check shared/domain.js`、`node --check app/main.js`：通过。
- 0、1、3、4、7、30 天正确率分支及稀疏数据判断由现有测试覆盖；30 天手机横向滚动已在浏览器核对为容器内滚动。

本轮是视觉样例审阅稿。用户确认前，不批量清理词库、不改生产数据，也不扩展到全部编号词条或释义。
