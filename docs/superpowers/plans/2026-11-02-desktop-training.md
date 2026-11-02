# Desktop English Training Integration Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 从墨词直接练题，并主动把训练生词收进独立词袋。

**Architecture:** 挂载已构建的 CET React 页面于 /practice/。Node SQLite 模块负责生词接收和来源去重；React 只调用同来源本机 API。原试卷记录继续沿用独立的 cet6_ 存储命名空间。

**Tech Stack:** Express 5, node:sqlite, React 19, Vite 6, TypeScript。

**Spec:** ../specs/2026-11-02-desktop-training-design.md

## Global Constraints
- 仅电脑端；保留 Android 文件及 Bridge。
- 不修改已有词条和复习记录；不静默迁移或覆盖旧端口学习记录。
- 不依赖 5174 开发服务；主题随本机实际端口。
- 验证使用临时数据库与测试浏览器。

## Review Focus
- /practice 末尾斜杠与音频/图片相对路径。
- 重复收取、不同试卷同一词和中途失败的原子性。
- 用户删除/重命名训练词袋后再次收取。
- 服务失败或释义为空时保留原生词本，明确重试。
- 接入前的浏览器来源隔离，不能伪称记录丢失或已同步。

### Task 1: Host mount and vocabulary ownership
Files: app/english-training.js, app/main.js, test/english-training.test.js.
Interfaces: install(app, db, {directory}); GET /api/desktop/training; POST /api/desktop/training/vocabulary {entries:[{word,translation,phonetic,pos,source}]}.
- [x] 写接口回归并确认旧代码失败。
- [x] 实现构建挂载、失败提示、事务收词、来源记录与去重。
- [x] 验证批次无效无写入、重复无 progress、外站不可写。

### Task 2: Training navigation, theme and collection UI
Files: CET src/utils/wordmasterHost.ts, src/components/WordMasterNav.tsx, App.tsx, ExamShell.tsx, WordPopover.tsx, VocabNotebook.tsx, wordmasterTheme.ts, host CSS.
- [x] 写收词客户端/路径回归并确认失败。
- [x] 加入口、返回、同来源主题及单词/生词本主动收取。
- [x] 增加旧地址数据迁移说明，沿用既有导入确认。
- [x] TypeScript 检查、训练测试及子路径生产构建。

### Task 3: Delivery and interactive acceptance
Files: scripts/build-english-training.js, static/index.html, docs/desktop-training.md; generated static/practice/ ignored by git.
- [x] 构建脚本校验生成物，将生产包复制到本机静态目录。
- [x] 在隔离服务里验收进入、答题、音频、收词、去重与刷新。
- [x] 两仓库适用测试通过；保存截图并提供当前运行入口。
- [x] 提交本次源码变更，保留其他进行中工作。

验收记录：墨词 455/455，CET 52/52；独立复核修正批量体积、并发提示和正文上下文。
Ruling: create training metadata only inside the first explicit vocabulary-save transaction, preserving the startup content digest.
