# C 阶段简化版交付记录

日期：2026-09-27  
状态：已按最新反馈移除卡牌科普与来源展示，62 张卡的中英收藏寄语和简化抽卡揭晓待复审。

## 本轮改动

- 卡牌详情只呈现完整插画、标题、稀有度、封面短句（有内容时）和“收藏寄语”。每张卡的中文寄语下方显示对应英文。
- 抽卡结果卡面只保留插画、标题和稀有度；每张卡提供“查看收藏寄语”入口，寄语在单卡详情中阅读。
- 移除了科普正文、观察/灵感札记、来源按钮与外部链接。删除了旧文案数据字段，而非仅在页面中隐藏。
- 保留 62 个 palette 与数据库卡牌 ID、62 张本地 WebP、既有 3 张收藏、隐藏卡解锁接口及抽卡事务。
- 卡牌 JSON 现在只存可选 `coverLine`、插画焦点 `focus` / `foilFocus` 和中英文寄语。59 张普通卡保存在公开内容文件；3 张隐藏卡内容继续留在服务端，解锁前接口不返回，收藏后才返回。

## 文件

- `static/cards/card-copy.json`：59 张普通卡的精简文案。
- `app/seed/card-copy.hidden.json`：3 张隐藏卡的精简文案。
- `static/app.js`、`static/style.css`：详情与双卡揭晓显示规则。
- `test/cards-copy.test.js`、`test/progress.test.js`：寄语字段、去除旧字段与隐藏卡内容门控检查。
- [62 张卡牌内容清单](./PHASE_C_CONTENT_INVENTORY.md)。

## 验证结果

- `npm test`：10 项通过，0 项失败。
- `node --check static/app.js` 和 `node --check app/main.js` 通过。
- 62 张卡的中文与英文寄语均完整、逐卡独立；文案 JSON 不含知识点、类型、来源字段或 URL。
- 浏览器预览显示 62 张卡；`1440×1024` 桌面与 `360×800` 手机无横向溢出。卡牌详情不包含科普节点或外链。
- 独立临时 SQLite 测试库从 9 张收藏卡与 10 次当日作答开始：接口先只返回 59 条普通文案；抽卡后获得普通卡并解锁「仰望星空」，收藏总数变为 11，文案接口增至 60 条并仅此时返回隐藏卡寄语。重复抽卡返回 `409`。
- `360×800` 隐藏卡揭晓同时展示两张完整卡面、标题和稀有度，单卡详情可读中英寄语；“收入卡册”按钮高 44px，位于视口 `y=735–779`，无需滚动即可点击。揭晓 DOM 没有科普区或链接。
- 生产数据库以只读方式核验：`integrity_check=ok`；词库 6、单词 20,374、进度 94、答题日志 74、卡牌 62 个唯一 ID、已收藏 3 张。本轮浏览器抽卡使用 `output/playwright/phase-c-simplified/phase-c.sqlite` 临时库。
- 运行截图来自 Edge 浏览器视口模拟，不代表 iPhone 或 Android 实机验收。

## 桌面与手机截图

- [桌面卡册全页](../output/playwright/phase-c-simplified/cards-62-desktop-full-simplified.png)
- [桌面卡册首屏](../output/playwright/phase-c-simplified/cards-62-desktop-simplified.png)
- [360px 手机卡册](../output/playwright/phase-c-simplified/cards-62-mobile-360-simplified.png)
- [桌面双语详情](../output/playwright/phase-c-simplified/detail-bilingual-desktop.png)
- [手机双语详情首屏](../output/playwright/phase-c-simplified/detail-bilingual-mobile-first-360.png)
- [手机滚动至中英寄语](../output/playwright/phase-c-simplified/detail-bilingual-mobile-360.png)
- [360px 双卡隐藏卡揭晓](../output/playwright/phase-c-simplified/draw-hidden-mobile-360-simplified.png)
- [隐藏卡单卡详情与双语寄语](../output/playwright/phase-c-simplified/draw-hidden-detail-bilingual-mobile-360-simplified.png)
- [揭晓页收入卡册按钮](../output/playwright/phase-c-simplified/draw-hidden-mobile-collect-360-simplified.png)
