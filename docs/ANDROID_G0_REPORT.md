# 墨词 Android G0 技术验证报告

日期：2026-09-29  
状态：G0 阶段报告。服务契约、数据方案、隔离原型和复审修复已提交；Android SDK/Gradle 构建问题已解决，**G0 `app-debug.apk` 已生成并验签**。用户确认安卓手机上的重开与飞行模式检查正常；设备型号/系统版本未提供，G0 原生 instrumentation 测试未在设备运行。后续 G1 状态见 `docs/ANDROID_G1_REPORT.md`。

## 本轮范围

按 `docs/ANDROID_APP_PLAN.md` 只做 G0。没有移植全量 UI、导入生产数据库或创建发布签名密钥。修复 SDK/Gradle 后，按用户追加请求生成 G0 debug APK，详细构建结果见本报告后文。

隔离原型位于 `android-g0/`：一个本地 WebView 页面、一个应用内 Java bridge 和一个 Android 私有目录 SQLite 数据库。页面显示一道拼写题，提交后在一个 SQLite 事务内保存答题流水和进度；相同 `requestId` 且内容相同会幂等返回，复用 ID 提交不同答案会冲突。保存失败时页面保留答案，不前进。

清单文件中 `io.wordmaster.g0prototype` 仅为原型 ID，不是最终 application ID。原型题目 `abandon` 不从生产库读取。

当前 `wordmaster/` 目录没有 Git 元数据，无法提供 `git diff`。原型应用源码和依赖位于新建的 `android-g0/`；没有修改生产学习页面或写入生产数据库。

## 技术选择与依赖

| 项目 | 当前选择 | 许可证/边界 |
|---|---|---|
| Web 到 Android | Capacitor `@capacitor/core`、`@capacitor/cli`、`@capacitor/android` **8.5.2** | 三个直接 npm 依赖均标记 MIT；已锁定在独立 `android-g0/package-lock.json` |
| JavaScript 运行时 | 本机 Node **v24.19.0** | 满足 Capacitor v8 官方 Node 22+ 要求 |
| Java | Microsoft OpenJDK **21.0.9 LTS**（安装目录标记 21.0.9.10） | Capacitor Android 构建配置面向 Java 21 |
| Android 构建模板 | Gradle **8.14.3**、Android Gradle Plugin **8.13.0** | 来自本次锁定的 Capacitor Android 模板；Gradle 依赖解析未完成 |
| Android SDK 模板值 | minSdk **24**、compileSdk **36**、targetSdk **36** | minSdk 与 Capacitor v8 支持范围一致。36 是生成模板当前值；正式打包前仍须按当时 Android 发布要求复核 targetSdk |
| 本机存储 | Android Framework `SQLiteOpenHelper` / `SQLiteDatabase` | 不增加 SQLite 插件或其原生依赖；Android 私有数据库目录、外键、事务、回滚由原生 API 提供 |
| 离线限制 | 没有应用网络请求；CSP `connect-src 'none'`；原型 Manifest 未声明 `INTERNET`，`allowBackup=false` | 正式工程仍须在构建产物的合并 Manifest 与 WebView 导航上复查 |

Capacitor 官方资料：[Android 支持与运行方式](https://capacitorjs.com/docs/android)、[Node 与 Android 环境要求](https://capacitorjs.com/docs/getting-started/environment-setup)、[自定义原生插件](https://capacitorjs.com/docs/android/custom-code)。Android SDK 下载页说明 SDK 使用受许可协议约束；本轮没有替用户接受该协议或安装 SDK：[Android Studio 与命令行工具下载/许可](https://developer.android.com/studio)。

`android-g0/package-lock.json` 中 94 个顶层 npm 包声明的许可证标识包括 MIT、Apache-2.0、ISC、0BSD、BlueOak-1.0.0 和 Unlicense。原生 Gradle 依赖图未能下载解析，因此 AndroidX、Cordova 与 Gradle 传递依赖的最终许可证清单仍是 G0 构建前置项。

## 隔离原型结构

| 文件 | 职责 |
|---|---|
| `android-g0/src/index.html` | 本地题目页；CSP 禁止连接网络 |
| `android-g0/src/app.js` | 调用统一的原生 `WordmasterStore` bridge；提交成功后才清空答案 |
| `android-g0/android/app/src/main/java/io/wordmaster/g0prototype/WordmasterStorePlugin.java` | 本机 SQLite 的建库、题目读取、事务答题与 request ID 冲突检查 |
| `android-g0/android/app/src/main/java/io/wordmaster/g0prototype/MainActivity.java` | 注册原生插件 |
| `android-g0/android/app/src/main/AndroidManifest.xml` | 关闭系统 Auto Backup；不申请网络或存储权限 |
| `android-g0/scripts/build-web.mjs` | 把静态页和锁定的 Capacitor bridge runtime 收集到 `dist/`，供 `cap sync` 复制 |

数据库只含原型题目 `demo:abandon`、答题进度和流水表。生产库 `data/wordmaster.db` 没有被复制、迁移、覆盖或写入。

## `/api/*` 到服务接口矩阵

服务层只在应用组合入口选 Web/Android adapter；各页面调用相同服务方法，不自己判断平台。Web adapter 维持现有 JSON 契约，Android adapter 以本地 SQLite 实现相同业务语义。`BackupService` 是新增本地能力，没有对应的现有 `/api/*` 路由。

| 现有方法与路由 | 当前主要响应/语义 | 目标服务接口 |
|---|---|---|
| `GET /api/books` | 词库数组，含计数、今日进度与 `plan` | `BooksService.list()` |
| `POST /api/books` | `{id}`，创建自建词库 | `BooksService.create(input)` |
| `DELETE /api/books/:id` | `{ok:true}`；内置或不存在时为 400 | `BooksService.delete(bookKey)` |
| `PUT /api/books/:id/plan` | `{ok:true, plan}`；校验本地日期和目标日 | `BooksService.setPlan(bookKey, targetDate)` |
| `DELETE /api/books/:id/plan` | `{ok:true}` | `BooksService.clearPlan(bookKey)` |
| `GET /api/books/:id/words` | 词条数组；当前不存在的 book id 会得到空数组，服务层应规范为 `NOT_FOUND` | `BooksService.listWords(bookKey)` |
| `POST /api/words` | `{id}`；重复词头为 409 | `BooksService.addWord(bookKey, word)` |
| `POST /api/books/:id/import` | `{added, dup, bad, bad_total}`；逐行解析并跳过重复项 | `BooksService.importText(bookKey, text)` |
| `PUT /api/words/:id` | `{ok:true}`；必填校验/不存在错误 | `BooksService.updateWord(wordKey, patch)` |
| `DELETE /api/words/:id` | `{ok:true}`；当前删除不存在 ID 也不报告变化 | `BooksService.deleteWord(wordKey)` |
| `GET /api/books/:id/study?mode=&all=&limit=` | 词条数组；复习优先，新词按计划配额；meaning 模式加 `choices`；learn 仅返回新词 | `StudyService.getQueue(bookKey, options)` |
| `GET /api/mistakes` | 错题数组 | `StudyService.listMistakes()` |
| `GET /api/mistakes/study?mode=` | 最多 30 个错词，meaning 模式含选项 | `StudyService.getMistakeQueue(options)` |
| `DELETE /api/mistakes/:wordId` | 清零错题计数、保留复习进度，返回 `{ok:true}` | `StudyService.clearMistake(wordKey)` |
| `POST /api/progress` | `{ok, duplicate, streak, outcome}`；request ID 内容相同幂等，不同内容 409；事务同时写 progress 与 review_log | `StudyService.submitAnswer(event)` |
| `POST /api/learn` | `{ok:true}`；`ON CONFLICT DO NOTHING`，标记学词但不算对错 | `StudyService.markLearned(wordKey)` |
| `GET /api/stats` | 全局词数、今日作答、对错累计、掌握数 | `StatsService.getGlobal()` |
| `GET /api/stats/daily?days=` | 按本地日期聚合的作答、正确和新词数；默认 90、上限 365 天 | `StatsService.getDaily(days)` |
| `GET /api/stats/overview` | `{streak, today, total, accuracy}` | `StatsService.getOverview()` |
| `GET /api/cards/copy` | 普通卡文案与当前已解锁隐藏卡文案；`no-store` | `CardsService.getCopy()` |
| `GET /api/cards` | `{cards, owned, drawn_today, today_answered, draw_target}`；隐藏卡未解锁时遮盖内容 | `CardsService.getCatalog()` |
| `POST /api/cards/draw` | 事务校验今日资格/抽卡/解锁；重复抽卡 409、作答不足 400 | `CardsService.drawToday()` |

目标错误码集中映射为 `INVALID_ARGUMENT`、`NOT_FOUND`、`SAVE_FAILED`、`REQUEST_CONFLICT`、`ALREADY_DRAWN`、`NOT_ELIGIBLE`、`STORAGE_UNAVAILABLE`；UI 显示中文文案，不能显示 SQLite 原始异常。所有写操作等事务提交后才返回；失败保留当前题目和输入。

## 稳定标识、迁移与备份设计

### 稳定 key

- `wordbooks.book_key`：内置书使用固定 key（`builtin:zhongkao`、`builtin:cet4`、`builtin:cet6`、`builtin:npee`、`builtin:tem`）；用户词库使用一次生成且永久保存的 UUID key（`user:<uuid>`）。名称可改，不参与身份判断。
- `words.word_key`：内置词用固定词库 key + **入库清单中的不可变 seed entry key**，如 `builtin:cet6:<entry-uuid>`；用户词/导入词使用 `user:<uuid>`。不能仅按词头合并，同形词分别占一个 seed key。已发布 entry key 不因修正释义、音标或排序改变；删改词表时通过显式 alias/migration 清单迁移，不重用 key。
- `progress`、`review_log`、学习队列和导入映射都以 `word_key` 为身份，旧整数 `words.id` 仅保留在迁移审计映射中。
- 卡牌用锁定清单中的 `card_key`（建议 `builtin-card:<palette>`）；导入/更新同时保留旧 `cards.id` 到 `card_key` 映射。生产只读审计确认现有 62 个 palette 唯一，但仍须把既有 1–62 ID 固化进映射清单。
- 每个旧 Windows 数据库副本先生成 `legacy_id_map`（旧 book/word/card 整数 ID → stable key），再导入。自建书和词在隔离副本中一次性分配 UUID，导出包携带映射；不得按词头猜身份。

### SQLite 迁移与 seed

Android 数据库使用独立 `schema_version`，从当前 Web `schema_meta.schema_version=5` 的语义出发逐步迁移，但不直接假设 SQLite 主键 ID 相同。每个迁移在事务中完成，可重复检查，先迁移临时副本并核对后再触碰用户数据。

首次 seed 使用打包的词库清单与 62 张本地卡图。书、词、卡 key 在提交清单中锁定；批量导入分块事务写入 `seed_import_state`（bundle hash、已提交 key/进度）。只有全部词条与元数据写入且数量/外键校验通过后才标记 seed 完成。重启可续建；版本升级只插入新 key 或执行显式迁移，不重排 ID、不覆盖自建内容、不清进度。完整导入/中断回滚留到 G1 做隔离库验证。

### 日期与可重试写入

所有答题事件持久化 `request_id`、`session_id`、规范化请求内容、UTC instant 和写入时的本地 `local_day`/zone ID。重复 `request_id` 且 payload 相同返回之前结果；payload 不同报冲突。用固定随机源验证抽卡稀有度边界；线上抽卡仍使用系统随机源。

“今天”的学习配额、统计、抽卡都用 `ZoneId.systemDefault()` 计算同一个 `local_day`。事件保留写入时本地日期，时区变更不重标旧日志；当天资格与唯一抽卡日在同一事务校验。G1 需覆盖本地午夜、跨日、时区切换、手动调时、后台恢复。

### 备份格式

建议显式备份文件封装为 UTF-8 JSON：

```json
{
  "format": "wordmaster-backup",
  "format_version": 1,
  "exported_at": "UTC ISO-8601",
  "source": { "app_version": "...", "schema_version": 1 },
  "counts": { "wordbooks": 0, "words": 0, "progress": 0, "review_log": 0, "user_cards": 0, "card_draws": 0 },
  "sha256": "canonical-payload-sha256",
  "data": { "wordbooks": [], "words": [], "progress": [], "review_log": [], "user_cards": [], "card_draws": [], "settings": {} }
}
```

卡牌静态目录随 APK seed；备份只存拥有卡、抽卡日和 stable card key。导入先完整解析、校验版本/checksum/计数/引用关系，显示摘要和合并策略，然后单事务提交；损坏、未来版本、重复导入或中途异常均回滚。走 Android 系统文档选择器/分享 URI，不申请整盘权限。首版 Auto Backup 默认关闭，等显式备份可恢复验收后再另行启用并核对提取规则。

## 生产数据只读核对

通过 Python `sqlite3` `mode=ro` 只查计数、schema 和 ID 范围；没有导出任何用户词条、进度行或答题内容。

| 核对项 | 只读结果 |
|---|---:|
| schema version | 5 |
| wordbooks | 5 |
| words | 20,374 |
| progress | 106 |
| review_log | 86 |
| cards | 62 |
| user_cards | 3 |
| card_draws | 0 |
| SQLite `integrity_check` | `ok` |
| card ID | 连续 1–62 |
| card palette | 62 个唯一值，无重复 |

这些数量是本次只读快照，不是 APK seed 的预置数据库；APK 不得打包 `data/wordmaster.db`。

## 已执行检查与 G0 状态

- G0 复审修复后根项目 `npm test`：17/17 通过，其中 5 项覆盖 request ID 暂存、内容改变、明确成功后清除、空输入，以及提交落盘但桥接回包丢失后的同 ID 重试。
- 隔离原型 `node --check src/app.js`、`node --check src/request-session.js`、`node --check scripts/build-web.mjs`：通过。
- 隔离原型 `npm run android:sync`：Capacitor web asset copy 与 Android plugin sync 完成。
- 原生 `WordmasterStoreRepositoryTest` 的 3 项 instrumentation 测试已通过 `:app:compileDebugAndroidTestJavaWithJavac` 编译；因没有连接设备或模拟器，尚未运行。
- 静态检查：应用源中无 `fetch`、XHR 或 WebSocket；CSP 禁止网络连接；原型 Manifest 未声明 `INTERNET`，Auto Backup 关闭。
- 生产数据库审计通过只读 URI 完成，完整性为 `ok`。
- **Gradle 下载已修复**：原官方分发地址跳转 `github.com`，本机 DNS 无法解析。Wrapper 现使用可达镜像，并在 `gradle-wrapper.properties` 固定 SHA-256 `bd71102213493060956ec229d946beee57158dbd89d0e62b91bca0fa2c5f3531`；下载文件与 [Gradle 官方 8.14.3 校验值](https://gradle.org/release-checksums/)一致。
- **Windows 中文路径已修复**：AGP 原先因工作区 `D:\工作区` 非 ASCII 路径停止；`android/gradle.properties` 设置 `android.overridePathCheck=true` 后构建继续。该开关在当前 AGP 会显示 experimental warning。
- SDK 安装于 `D:\Android\Sdk`：Command-line Tools 22.0、Platform 36、Build Tools 36.0.0、Platform Tools 37.0.1；构建自动补装 Build Tools 35.0.0。本机 Java 为 Microsoft OpenJDK 21.0.9 LTS。
- **debug APK 构建成功**：`android/gradlew.bat :app:assembleDebug --no-daemon --console=plain` → `BUILD SUCCESSFUL`；71 个任务完成。原生 instrumentation 测试源码编译成功。
- APK 已复制到 `output/android-debug/app-debug.apk`，大小 4,130,496 bytes，SHA-256 `EE066287FCDE4CC5599E85222C3A939E3533362CBEB39BEA6998A62C9F9F468B`。`apksigner verify` 通过，签名为 Android 默认 debug 证书；包名 `io.wordmaster.g0prototype`，minSdk 24，targetSdk 36。APK 不含生产数据库、无 `INTERNET` 权限、无 `testOnly` 标记。
- **本机未连接手机**：`adb devices -l` 当前无已连接设备，因此我不能从电脑端独立安装或控制手机；用户提供的启动/提交截图及后续测试确认记在下一节。该 APK 只有 `abandon` 一道本地演示题，不是完整墨词。

## 用户提供的手机运行截图（2026-09-29）

用户随后提供了安装后页面截图：原型题目成功显示，错误作答后界面显示“已记录这次作答；可以再试一次”，本地状态为“1 次作答，0 次正确”。这支持“页面已启动、一次答题结果已保存”的初步设备证据；截图未标设备型号/Android 版本，也没有强制停止后重开的画面或飞行模式状态，因此不据此宣称 G0 手机验收完成。

用户之后回复“一切正常”，作为对前述强制停止重开及飞行模式检查的确认。该结果为用户报告，本机没有 ADB 连接可独立复现；设备型号和 Android 版本仍未知。

**G0 截止时验收结论：debug APK 已交付；用户确认 G0 演示切片在安卓手机上运行正常。**用户报告的重开与飞行模式检查均正常；设备型号/系统版本和现场 instrumentation 结果没有提供，因此这些细节未独立复核。G1 当时尚未开始，后续进展见 `docs/ANDROID_G1_REPORT.md`。

## 复审跟进（2026-09-29）

- P1-1 已修：`request-session.js` 为尚未确认的规范化答案保留同一个 request ID；只有答案内容改变或返回完整成功结果后才换 ID/清除 pending。提交成功状态直接使用原生返回的 `result.state`，不再追加一次可能失败的 `getState()`。桥接拒绝或状态缺失时保留输入和 ID，并提示“结果未确认”，允许安全重试。
- P1-2 已修：事务内先读完进度、写入、读取完整结果并组装响应对象，最后才调用 `setTransactionSuccessful()`；仓储方法返回前必经 `endTransaction()`，原生插件随后才 `call.resolve()`。提交落盘但桥接响应丢失的情形由 pending request ID 与唯一索引共同去重。
- JS 故障模拟通过：首次请求模拟“数据库已记账、桥接回复丢失”，第二次请求 ID 不变并得到 duplicate 结果，模拟流水与答题计数均为 1。
- 原生 instrumentation 测试已写入 `android/app/src/androidTest/java/io/wordmaster/g0prototype/WordmasterStoreRepositoryTest.java` 并成功编译；P1-3 的构建部分已完成，设备端强停重开/离线证据仍待手机，故 G0 仍未通过。

## Debug APK 安装文件

- APK：`output/android-debug/app-debug.apk`
- 简单安装说明：`output/android-debug/安装说明.md`
- 此 debug APK 由 Gradle 自动 debug 签名，只用于当前 G0 原型试装；没有研究商店或发布签名，也没有创建发布密钥。
