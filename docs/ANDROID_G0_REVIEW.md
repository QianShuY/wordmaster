# 墨词 Android G0 复审（2026-09-29）

结论：**G0 暂不通过，不进入 G1。**本轮按用户要求只验收技术原型、数据可靠性和实际可运行性；不把发布签名或商店分发作为 G0 条件。复审仅检查与运行，未修改应用实现、未联系实现 agent。

## 已核实

- `android-g0/` 是独立 Capacitor 原型，使用应用私有 SQLite 存一条演示词和答题记录；源码未引用生产 `data/wordmaster.db`，也未配置远程 `server.url`。原型 Manifest 未声明网络权限。
- 根项目 `npm test`：12/12 通过；`android-g0` 的 `npm run android:sync` 成功。两项均不能证明 Android Java 工程已编译或手机运行。
- 本机执行 `android-g0/android/gradlew.bat :app:assembleDebug --no-daemon` 失败：Gradle wrapper 下载重定向至 `github.com` 后报 `java.net.UnknownHostException`。当前未发现 Android SDK、`adb` 或模拟器；仓库中也没有 APK、安装录屏、强停重开或飞行模式测试结果。

## 必须修改与补证

1. **[P1] 重试保留同一请求编号。**`android-g0/src/app.js:49-54` 每次点击都调用 `makeRequestId()`；若 SQLite 已提交，但桥接回复或后续 `Store.getState()` 失败，页面进入 catch；用户重试会用新的 ID 再记一条。为同一道题同一次答案持有 `pendingRequestId`，结果明确成功或答案改变前不要重建；再次提交相同 payload 必须复用该 ID。把“提交成功后刷新状态失败”单独显示为读取失败，先用提交返回的 `result.state` 更新界面，不能提示用户再作答。用可控故障注入验证：提交成功但回包丢失后重试，`review_log` 和 `progress.attempts` 只增加一次。
2. **[P1] 调整原生事务的成功/回包顺序。**`WordmasterStorePlugin.java:107-117` 在 `setTransactionSuccessful()` 后继续调用 `readState(database)`；若该读取抛错，catch 会报告“保存失败”，finally 的 `endTransaction()` 仍可能提交已标记成功的事务。先完成所有可能失败的事务内读取与返回数据组装，确认无错后才标记成功并结束事务；随后才向 JS 返回成功。对“提交已落盘但桥接返回失败”的剩余不确定窗口，靠第 1 项的稳定请求 ID 消除重复记账。添加原生侧幂等、ID 冲突、事务回滚的针对性验证。
3. **[P1] 给出真正的 Android 构建和运行证据。**在可用的 Android SDK/Gradle 环境执行 `assembleDebug`，安装到 API 24+ 模拟器或安卓真机。记录设备/系统版本、构建日志、首次建库、答题、强制停止重开后的计数、飞行模式再答题，以及重复请求/失败重试结果。没有这些证据只能称“源码原型”，不能称“G0 完成”。若构建环境仍不可用，提供确切错误和环境诊断，不用网页截图代替设备验证。

## 本轮边界

- 不要求购买开发者账号、创建发布密钥、生成发布包或研究商店规则。`assembleDebug` 足以完成 G0 技术验收。
- G0 通过后再进入五本词库、62 张卡牌和完整四模式的 G1/G2；目前 `android-g0/` 只有固定演示词 `abandon`，不能对外称为已完成的安卓版墨词。
- 继续使用隔离测试数据；`data/wordmaster.db` 不写入、不打包。

## 可直接转发的修改指令

> G0 暂未通过。先修复 `src/app.js` 的重试请求 ID：同一次答案失败重试必须复用 ID，提交成功但刷新状态失败不能误报“请重试作答”；再调整 Java 事务顺序，防止已标记成功的事务抛错后仍向用户报告保存失败。补充幂等/冲突/回滚测试。在可用 Android SDK 环境生成 debug APK，提供设备上首启、答题、强停重开、飞行模式及故障重试的证据。此轮无需处理发布签名，也不要开始 G1 或改生产数据库。

## 第二次复审：实现 agent 修订后

复审时间：2026-09-29。此前“必须修改”第 1、2 项的源码问题**已修复**：`src/request-session.js` 为相同规范化答案保留同一请求 ID；`src/app.js` 直接使用提交返回的状态；`WordmasterStoreRepository.java` 在读取并组装结果后标记事务成功，`endTransaction()` 返回后插件才向 JS 回报。已有 JS 故障模拟和原生 instrumentation 测试源码。

我重新执行根项目 `npm test`，**17/17 通过**；执行 `android-g0` 的 `npm test`，**5/5 通过**；`npm run android:sync` 通过。原生 instrumentation 测试尚未编译和运行，因此不能将其计作通过。生产数据库文件的修改时间仍是 2026-09-28 18:42:59，本轮检查未写生产库。

**G0 仍未通过，唯一剩余验收门槛是第 3 项。**我再次执行 `:app:assembleDebug`，Gradle wrapper 仍在下载时因 `java.net.UnknownHostException: github.com` 退出；当前没有 Android SDK/ADB/模拟器，也没有 APK 与实机或模拟器证据。须在能构建的环境完成 debug APK、运行原生测试，并提供首启、提交、强停重开、飞行模式的实际结果。本轮不处理发布签名。

后续 G1 设计还要处理一个边界：目前待确认请求 ID 只存在 JS 内存中；若提交结果不明时应用被杀，重开应先用本地已提交记录核对，再决定是否重试，以免用户误以为原答案未保存。该点不阻塞当前单词原型的 G0 源码复审，但完整学习流程需要验证。
