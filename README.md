# 墨词 WordMaster

英语默写背单词应用（网页版），带有学习计划、复习与卡牌收藏。

## 功能

- **四种学习模式**（先学后测：学词→默写闭环）
  - 学词：翻卡浏览新词（单词/音标/发音 → 点卡翻面看释义例句），"还不太熟"的本轮重看；学过的词立即进入默写队列
  - 拼写默写：看释义+词性，逐字母默写单词，即时对错反馈；光标可用 ← → 自由移动、点击格子定位
  - 释义选择：看单词，四选一中文释义
  - 词性判断：看单词和释义，选出正确词性
- **学习计划**：为词库设定目标学完日期，系统按「剩余新词 ÷ 剩余天数」自动分配每日新词量；复习按艾宾浩斯遗忘曲线（1→2→4→7→15→30 天）自动安排，答错 10 分钟后立即重学并加入本轮回炉
- **学习数据**：独立统计页——连续学习天数、今日待复习/新词进度、近 30 天学习量柱状图、12 周热力图、正确率走势折线
- **卡牌收集**：每天完成学习（≥10 次作答）可抽一张卡牌；59 张普通卡与 3 张隐藏卡均使用项目内生成的原创插画，分 N/R/SR/UR 稀有度；集满 10/20/30 张依次解锁隐藏卡
- **错题本**：答错的单词自动收集，连续答对 3 次自动移出；可单独回炉练习或手动移除
- **词库管理**：内置中考/四级/六级核心词库（约 3000 词，含音标、词性、释义）；可新建词库，单个添加或批量导入单词
- **学习统计**：今日已学、已掌握数、总正确率，各词库掌握进度环
- 单词发音（浏览器 TTS）

## 学习数据备份（桌面版）

学习记录保存在本机 SQLite 数据库中，并不会自动同步到其他设备。建议定期备份，尤其是在升级或更换电脑之前。

1. 打开「学习数据」页面，点击「↓ 备份学习数据」，保存下载的 `WordMaster-backup-YYYY-MM-DD.db`。
2. 备份使用 SQLite 一致性快照（`VACUUM INTO`），不用停止学习服务器，也不会清空原始数据。
3. **恢复前先完全退出墨词**，并额外复制一份当前的 `data/wordmaster.db` 备用；把下载的备份文件改名为 `wordmaster.db`，替换原数据库，再启动软件即可。恢复会**覆盖**当前的学习记录、词库和卡牌，无法自动合并。
4. 若使用 `WORDMASTER_DB_PATH` 自定义数据库位置，备份和恢复都应针对该文件；不要在程序运行时直接复制正在使用的 `.db` 文件。

这个入口仅供**桌面/本机网页版**使用，Android 独立版使用另一套本地存储，**不包含在此备份内**。为保护学习记录，桌面服务器默认只监听 `127.0.0.1`，如确需局域网访问，可自行设置 `WORDMASTER_HOST`；备份接口仍只接受本机请求。数据库文件可能包含个人学习记录，不要把实际使用的数据库提交到公开仓库。

## 启动

**免安装版（推荐发给别人）**：解压后双击 `start.bat`，无需安装任何环境（内置 Node 运行时和依赖）。

**开发版**：需要 Node.js ≥ 22.5（使用内置 `node:sqlite`）。

```bash
npm install   # 首次
npm start     # 或双击 start.bat
```

打开 http://localhost:3456

## 结构

```
app/main.js       Express 服务，REST API + 静态文件
app/db.js         SQLite 建表 + 内置词库种子
app/seed/         词表原始数据（来源：github.com/mahavivo/english-wordlists）
static/           前端单页应用（原生 HTML/CSS/JS）
static/cards/original/  62 张生成的原创卡牌插画（WebP）
data/             wordmaster.db（首次启动自动生成）
```

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/books | 词库列表（含进度统计） |
| POST | /api/books | 新建词库 `{name, description}` |
| DELETE | /api/books/:id | 删除词库（内置不可删） |
| PUT | /api/books/:id/plan | 设定学习计划 `{target_date}`，自动分配每日新词量 |
| DELETE | /api/books/:id/plan | 取消学习计划 |
| GET | /api/books/:id/words | 词库单词列表 |
| POST | /api/books/:id/import | 批量导入 `{text}`，每行一词 |
| POST | /api/words | 添加单词 `{book_id, word, phonetic?, pos?, meaning, example?}` |
| PUT | /api/words/:id | 编辑单词 |
| DELETE | /api/words/:id | 删除单词 |
| GET | /api/books/:id/study?mode= | 取学习词（复习优先 + 今日新词配额） |
| GET | /api/mistakes | 错题本列表 |
| GET | /api/mistakes/study?mode= | 错题回炉取词 |
| DELETE | /api/mistakes/:wordId | 手动移出错题本 |
| POST | /api/progress | 提交结果 `{word_id, correct, is_new?}` |
| GET | /api/stats | 全局统计 |
| GET | /api/stats/daily?days= | 近 N 天每日学习量 |
| GET | /api/stats/overview | 连续天数 + 今日任务 + 总览 |
| GET | /api/cards | 卡牌图鉴与收集状态 |
| POST | /api/cards/draw | 抽今日卡牌（需当日 ≥10 次作答，每天一张） |
