# 电影院片库与观影包接入

实现位于英语训练仓库的独立 CinemaApp，沿用 `/#/cinema` 主导航与主题。入口为片库 / 我的下载 / 本地工具；放映时台词栏默认折叠，暂停展示当前句学习卡。

通过 `runtime/node.exe scripts/build-english-training.js D:/cet6-practice` 更新静态资源。公开目录在 `static/practice/cinema/catalog.json`，目前只有原创约 135 KB 体验包；未把用户的视频、字幕、观影包、浏览器记录放进源码或公开目录。

用户下载流写入浏览器 OPFS；同一浏览器重开后能直接观看，换设备或清除网站数据需要重新下载。公共目录可独立替换，HTTPS CDN 需允许 CORS，续传需支持 Range。来源字段如实显示，与授权声明分开；第三方标题不会自动导入公共片库。

本机批量工具可由以下脚本组装（独立于主安装包）：

```powershell
./scripts/build-cinema-tools.ps1 -TrainingSource D:/cet6-practice -Destination D:/Tools/MociCinema
```

工具复制本机 Node、FFmpeg/FFprobe、相关 DLL 与现有许可文件，生成拖放入口。仅在本机测试，未创建公开发行的工具 ZIP；公开分发前仍须核对依赖许可与发行材料。工具不包含用户媒体。详见训练仓库 `docs/CINEMA_PACKS.md`。

验证：训练仓库 88 测试、墨词 456 测试通过；类型检查和生产构建通过。浏览器已验证体验片下载、刷新后打开、双语播放、本地双字幕合包、真实 546 MB 单包导入。独立代码检查发现的缓存归属、跨标签记录覆盖和临时文件归属问题均已修复并回归。现有 2026-11-06 Windows RC 安装包未重打。
