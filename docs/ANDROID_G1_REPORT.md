# 墨词 Android G1 本地数据与规则报告

日期：2026-09-29  
状态：G1 数据和规则层已实现；Web/Node 测试、Java 规则测试、APK 构建与签名检查通过。Android 原生 instrumentation 尚未在模拟器或真机运行，G1 设备复核待用户审阅。

## 本阶段交付

- 从项目当前 seed 逻辑生成 Android 专用只读种子库：5 本内置词库、20,374 个词条、62 张卡牌和 62 张 WebP 图片。各书数量为中考 1,597、四级 796、六级 599、考研 5,388、专四专八 11,994。
- Android 私有数据库使用稳定 `book_key` / `word_key` 和固定卡牌 ID。`seed/word-key-lock.json` 锁住 20,374 个词条 key，`seed/card-key-lock.json` 锁住 62 个卡牌 ID/key。词库 ID 不按词头临时猜测。
- 数据库首次安装先复制到同目录临时文件，校验 SHA-256、表数量、完整性与个人记录表为空，再原子改名。复制被中断时，下次启动会丢弃临时文件并重试。
- 当前 schema 为 v2。v1→v2 迁移补入 `local_day` 和 `timezone_id`，保留旧答题和进度行；旧时区未知时明确标记 `legacy-unknown`。
- 种子更新用独立 SQLite 附件库和单事务同步：插入新稳定 key、更新卡牌文案和本地文案，不清理既有进度、计划、收藏或抽卡记录。旧种子里已存在但新种子移除的词条会保留，以免静默丢记录。
- 原生仓储/bridge 覆盖词库摘要、学习队列、学习标记、拼写/释义/词性判定、答题去重和事务、错题、全局/每日统计、学习计划、卡册、隐藏寄语、抽卡资格与权重。G0 演示数据仍在独立的 `wordmaster-g0-demo.db`；完整 seed 使用 `wordmaster.db`。
- Web 与 Android 使用同一份 `shared/domain.js` 规则定义和 `test/fixtures/android-g1-rules.json` 固定样例。Web 队列限额、判题和抽卡权重通过共享纯规则函数计算；Android Java 对应规则由固定样例核对。

种子清单：`android-g0/seed/generated/seed-manifest.json`。清单记录的 seed bundle SHA-256 为 `E17766BEE7A1194FD55C8A9752D32396F02335826AF99704716327A23AC56CD4`。SQLite 种子文件只由隔离临时 Web 数据库生成；`data/wordmaster.db` 未被用于生成、测试或打包。种子库个人数据表计数均为 0：`progress`、`review_log`、`user_cards`、`card_draws`。

## Web/Android 规则样例

固定 fixture 覆盖：拼写归一化（大小写、空格和非法字符）、释义精确比较、词性别名、learn 模式不记对错、`first_correct` / `retry_correct` / `wrong` / `abandoned`、1/2/4/7/15/30 天间隔、计划日配额、到期词优先和新词配额、10 次抽卡门槛及 N/R/SR/UR 权重边界。

Node 另用隔离 Web seed 与 Android seed SQLite 逐条核对全部词条字段、书数量、卡牌元数据、稳定 ID、图片存在性与 `integrity_check`。首启中断通过截断临时副本再恢复的隔离测试验证；v1→v2 测试确认历史进度/流水保持不变。

## 检查结果

- 根项目 `npm test`：**22/22 通过**。
- `android-g0` 的 `npm test`：**7/7 通过**。
- 通过 Gradle 编译后的 Java 规则类直接运行 JUnit：**3/3 通过**。
- `:app:assembleDebug` 与 `:app:assembleDebugAndroidTest`：`BUILD SUCCESSFUL`。原生仓储 instrumentation 覆盖 seed 导入、队列、四类结果、同请求去重、冲突、写入回滚重试、统计、回炉、抽卡/隐藏卡解锁和 v1→v2；测试 APK 已构建。
- `adb devices -l` 没有列出设备，当前也没有模拟器；因此这些原生 instrumentation 测试**只编译，未在 Android SQLite 运行**。
- 额外尝试 `:app:testDebugUnitTest` 时，Gradle test worker 对工程里已有的 `ExampleUnitTest` 和本阶段纯 Java test class 都报 `ClassNotFoundException`。纯规则测试改用 Gradle 编译输出通过 JUnit runner 直接执行；此环境问题不影响 APK 或 instrumentation APK 构建。
- 已用 `apksigner verify` 验证 debug 签名；`aapt` 确认 package、版本、最低 SDK 与权限。APK 清单中无 `INTERNET`、外部存储读写权限；只看到 AndroidX 自动加入的动态 receiver 非导出权限。包内对应资源项为种子 SQLite、seed manifest 和 62 张图片。

## G1 APK

- APK：[app-debug.apk](../output/android-debug/app-debug.apk)
- 安装说明：[安装说明.md](../output/android-debug/安装说明.md)
- 版本：`1.1.0-g1`，versionCode 2
- 包名：`io.wordmaster.g0prototype`（保留原 G0 包名，方便覆盖安装）
- 最低 Android：API 24 / Android 7.0；target SDK 36
- 大小：25,230,063 字节
- SHA-256：`F7A309645BC98F3507E9F945A096B5A6548AB43D31BC1C8FD700371091165808`
- Gradle 构建命令：`android-g0/android/gradlew.bat :app:assembleDebug :app:assembleDebugAndroidTest --no-daemon --console=plain`

这是 debug 测试包，页面仍只有一道本地拼写验证题；完整学习体验、词库管理和统计/卡册页面属于 G2。种子数据与本地规则已经进入 APK，但本阶段新 APK 尚未在用户手机上复测。设备复核时可覆盖安装 G0 包，检查首次本地数据打开、错答后再答、强制关闭重开和飞行模式下状态保持；本报告不把未运行的 instrumentation 或未复测的 APK 写成真机验收通过。
