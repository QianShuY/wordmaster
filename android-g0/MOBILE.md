# 墨词 Android 随身手账 1.3.0

这是可脱离电脑使用的 Android 离线测试版。支持 Android 7.0 及以上，建议使用较新的 Android System WebView。首次安装已包含五本词库共 27,666 个词及对应双语例句；内容覆盖不代表逐条人工审校完成。

## 安装与已有记录

将 APK 发到手机后，允许文件应用安装此测试包。此包使用开发调试签名，不是应用商店正式发布包。旧版使用相同包名且签名一致时可覆盖安装；如果提示签名冲突，请先备份旧版，勿直接卸载丢失记录。

1. 电脑根目录运行 `Export-To-Mobile.cmd`，在 `output/mobile-transfer/` 得到迁移 JSON。导出以只读方式打开电脑数据库，不会修改学习记录。
2. 将 JSON 发到手机，在「我的 → 恢复或导入电脑记录」选择文件，核对后确认。
3. 导入会替换手机学习记录、学习断点及收藏；先导出手机备份。电脑自建词袋一并迁入，历史中考资料保留为归档，不跨词书合并熟练度。
4. 未完成巩固会拆成每组最多 10 词继续。电脑浏览器尚未提交的输入草稿不属于数据库记录，无法迁移。

电脑与手机当前通过文件迁移，**没有云端自动同步，也没有手机到电脑的反向导入**。卸载前务必在「我的 → 导出手机备份」保存文件到应用外。

## 本版功能

- 今日任务、五库切换、每组最多 10 词的认识／词义回忆／拼写；错词留在小组内继续巩固。
- 按到期量分批安排复习、积压时减少新词；同一天已完成任务不会自动再塞一整轮。
- 保存学习阶段、答题反馈及拼写草稿，返回后继续原题；交易失败不算完成，重复请求不重复计数。
- 已学词／错词搜索、学习足迹、收藏留影与抽取。
- SQLite 本地存储、带校验的备份恢复、电脑记录导入。旧 Android 数据库另存保留，一次性迁入新版数据库。
- 英语读音使用 Android 系统离线 TTS。若手机缺少英语离线语音包，需在系统语音设置安装；应用本身没有网络权限。

旅行地图、Boss 战与结局尚未移植到这一版。

## 构建

使用 Node.js 24、JDK 21、Android SDK 36。在仓库根目录先 `npm ci`；再进入 `android-g0` 执行 `npm ci` 和 `npm run android:sync`，它会从当前桌面源码生成独立的干净种子库，不读取个人学习库。

进入 `android-g0/android` 执行 `gradlew :app:assembleDebug :app:assembleDebugAndroidTest`。Windows 中文路径若导致 wrapper 脚本乱码，可用 PowerShell：

```powershell
& "$env:JAVA_HOME/bin/java.exe" -classpath ./gradle/wrapper/gradle-wrapper.jar org.gradle.wrapper.GradleWrapperMain :app:assembleDebug :app:assembleDebugAndroidTest
```

输出 `android-g0/android/app/build/outputs/apk/debug/app-debug.apk`。`npm test` 在仓库根目录执行，会先生成手机测试种子库，随后运行桌面与手机服务测试。旧 G0/G1/G2 源码与锁表保留作回归资料；旧 `build:web` 不会构建当前手机版，请使用 `android:sync`。

## 2026-10-29 验证边界

411 项 Node 单元／API 检查通过；手机学习服务测试覆盖分组、断点、跨日、错词补练、写入失败、响应丢失、备份恢复及电脑记录导入。APK 与 Android 测试 APK 构建成功，签名有效，无网络或存储读取权限；62 张收藏图已打包。浏览器窄屏预览验证了学习与草稿恢复。

当前未连接手机或模拟器，**Android 原生测试仅编译，未执行**。系统键盘顶起、文件选择器、离线发音、后台强杀后恢复以及旧版原生迁移仍需真机验收。安装后优先试：学一组、拼写输入一半退出重开、离线继续、导出并恢复备份。仅在独立测试设备运行 `MobileStoreInstallTest`：它会清空测试应用数据。
