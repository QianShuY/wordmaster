# 墨词 Android G2 页面与本地服务报告

日期：2026-09-29  
状态：G2 页面已接到 Android 本地 SQLite bridge。根据用户提供的真机截图完成了一轮移动端交互与布局修正，并重新构建、验签 Debug APK。当前没有 ADB 设备或模拟器，修正后的键盘、滑动、返回键、动画和屏宽验收仍待进行。

## 本轮移动端修正

- 学词卡片在手机可用高度内垂直居中；内容较长时保留卡片区域内滚动。手机可上滑查看释义，释义展开后左滑标记“还不太熟”、右滑标记“学会了”；手机不再显示桌面键盘提示。
- Android 拼写题进入后自动聚焦唯一的真实输入框，并提示英文输入；拼写按钮通过触屏抬手单次触发，明确收起软键盘，降低“第一次只关键盘、第二次才操作”的情况。
- 卡册首页新增轻量卡面叠影与醒目的抽卡按钮；学习完成页将“领取今日卡牌”移到主操作之前并放大。
- 统计热力图在手机打开时自动定位到最近日期，避免初始只显示 12 周范围较早一侧、看不到本周作答量。
- 从学习完成页领取卡牌时清除之前的预览状态，避免先看样卡再学习导致领取流程仍被预览模式拦截。

## 改动

- Android WebView 现加载项目已有 `static/` 完整页面：今日、词库、学习、词库管理、错题本、学习统计、卡册和抽卡。视觉沿用现有墨词界面和手机断点，保留“单一区域、真实 input”的拼写输入修正；没有另做一套风格。
- 新增 `android-g0/src/native-api.js`，把原 `/api/*` 页面契约映射到 Capacitor `WordmasterStore` bridge。桌面网页仍使用原 Express API；Android 页面通过本地 bridge 操作应用私有 SQLite。
- Bridge 补齐自建词库创建/删除，单词添加/编辑/删除、批量导入，学习队列、三种判题模式及学词标记、错题回炉、计划、统计、卡册和抽卡。旧整数 ID 在 Web 页面和稳定 key 之间做本地映射。
- 判题请求包含实际拼写/释义/词性输入，原生端重新判定；卡牌寄语通过本地 SQLite 文案返回。Android 系统返回键先收起输入焦点或弹层，再回到上一级，首页时退出。
- G2 SQLite v3 移除答题历史对单词行的级联外键，删除词条后不再级联抹去历史答题流水；G1 v2→v3 迁移保留现有字段和流水。
- Android bundle 现在从本地 seed 和静态页面打包，不启用服务端或远程 URL。CSP 关闭连接请求，Manifest 无 `INTERNET` 或存储权限。

## 检查

- 本轮 `npm run android:sync`：成功；隔离种子为 20,374 个词、62 张卡。
- 本轮 `:app:assembleDebug`：`BUILD SUCCESSFUL`（71 tasks，13 秒）。`node --check static/app.js`：通过。
- 本轮 APK `aapt` 信息为 `1.2.1-g2` / versionCode 4、minSdk 24、targetSdk 36；`apksigner verify --print-certs`：通过。
- 本轮 `adb devices -l` 没有连接的设备；自动聚焦和单击行为尚不能声称已在手机复验。
- 本轮未重跑自动化测试套件；下列 24/24 与 9/9 是 G2 数据层此前的基线结果，不覆盖这次新增的手机手势与触屏操作。
- 根项目 `npm test`：**24/24 通过**。
- `android-g0` 的 `npm test`：**9/9 通过**，包含 native API 映射、稳定 ID、拼写输入、词库响应、批量导入解析和 G1 seed 检查。
- G2 数据层已有 `:app:assembleDebugAndroidTest` 和 `:app:compileDebugUnitTestJavaWithJavac` 编译记录；Android 仓储 instrumentation 未在设备上运行。
- APK `apksigner verify` 通过。`aapt` 确认 package/version/SDK；权限中未出现 `INTERNET` 或存储读写，仅有 AndroidX 动态 receiver 非导出权限。APK 包含 62 张卡图和本地词库 seed。

## G2 测试 APK

- APK：[app-debug.apk](../output/android-debug/app-debug.apk)
- 安装说明：[安装说明.md](../output/android-debug/安装说明.md)
- 版本：`1.2.1-g2`，versionCode 4
- 包名：`io.wordmaster.g0prototype`（保持不变，可覆盖 G1）
- 最低 Android：API 24 / Android 7.0；target SDK 36
- 大小：25,564,863 字节
- SHA-256：`70050D1F8FBC346F6986D4EE1842286C6C3A097286D37904207B18FA37806B5E`

APK 已包含完整页面和本地数据操作，但还没有通过 G2 真机验收。计划要求的 360/390/430dp 页面截图、软键盘前后、系统返回键、外接键盘、语音及卡牌减少动态效果，需在 Android 手机上实际检查后才能写成通过。Windows 数据迁移和备份恢复留在 G3。
