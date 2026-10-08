# C 阶段交付记录：卡牌美术与动效

日期：2026-09-27

> 历史阶段记录。全量卡牌的当前界面与文案范围以后续简化为准，见 [PHASE_C_FULL_REPORT.md](./PHASE_C_FULL_REPORT.md)。

## 范围与设计

- 保留原有 62 个卡牌 ID 和 62 张本地 WebP 插画；没有生成、替换或删除卡图。
- 卡面改为上方插画区、下方纸色信息区。名称、稀有度、文案和收集状态不再压在主体插画上；卡册列表使用固定比例和懒加载。
- 未获得卡牌显示线描锁卡轮廓与解锁条件，不加载卡面插画；隐藏卡不显示名称或完整卡面。获得后显示原图与内容。
- 稀有度以边框、纹理和文字标签区分：普通用石色细边，稀有用朱砂边，史诗用松绿双线，传说用旧金边和局部静态光泽。卡牌不再持续扫光。
- 卡册、锁定状态和抽卡操作统一使用 SVG 线条图标；卡牌按钮保留键盘焦点样式。
- 页面切换调整为 280ms。抽卡用约 440ms 墨迹汇聚、720ms 翻卡和短暂的稀有度揭晓；最终结果按钮立即可用。普通卡与隐藏卡同时解锁时并排展示，避免弹窗把操作按钮挤出视口。
- `prefers-reduced-motion` 下清零动画延迟并缩短动画，抽卡和收卡流程仍可完成。

## 改动文件

- `static/index.html`：卡册主操作增加同风格 SVG 图标，移除卡册标题内联字号。
- `static/app.js`：卡面信息区、SVG 锁卡轮廓、稀有度徽标、卡牌详情与抽卡揭晓复用同一结构；隐藏卡奖励并排展示。
- `static/style.css`：卡面结构、稀有度静态层次、响应式文字、键盘焦点与减少动态效果样式。
- `docs/PHASE_C_REPORT.md`：本阶段交付记录。
- `output/playwright/phase-c/`：验收截图。

## 验收记录

- `node --check static/app.js`、`node --check app/main.js`、`node --check shared/domain.js`：通过。
- `npm test`：8 项通过，0 项失败。
- Windows Microsoft Edge + Playwright CLI：在 360×800、390×844、430×932、844×390 横屏和 1024×768 检查卡册；各视口 `scrollWidth` 与 `clientWidth` 相同，无页面横向溢出。360px 卡片上的长名称会换行完整显示。
- 用临时 SQLite 测试库保留 9 张普通卡并准备 10 次当日答题，实走 `/api/cards/draw`：获得第 10 张普通卡后同时解锁「仰望星空」，卡册由 9 张普通卡变成 10 张普通卡并新增隐藏卡；收卡后可在卡册打开详情。
- 360×800 下两张奖励卡、解锁说明和 44px「收入卡册」按钮都完整可见。减少动态效果模式下重复完成抽卡，CSS 动画时长变为 `0.01ms`、延迟为 `0ms`，按钮仍可操作。
- 键盘打开卡牌详情后按 Escape 可关闭，焦点返回原卡。浏览器控制台 0 错误、0 警告；资源请求没有离开本机服务地址。
- 62 个数据库卡牌条目 ID 唯一，62 个插画文件均存在且没有缺图。
- 生产库只读核验：完整性为 `ok`；词库 6、单词 20,374、进度 94、答题日志 74、卡牌 62、已收藏 3，与 B 阶段基线一致。本轮抽卡只写入临时测试库。

### 截图

- [桌面卡册全页](../output/playwright/phase-c/cards-desktop.png)
- [普通卡](../output/playwright/phase-c/card-normal.png)、[SR 卡](../output/playwright/phase-c/card-sr.png)、[UR 卡](../output/playwright/phase-c/card-ur.png)
- [未获得卡牌](../output/playwright/phase-c/card-locked.png)、[未解锁隐藏卡](../output/playwright/phase-c/card-hidden-locked.png)
- [360px 手机卡册](../output/playwright/phase-c/cards-mobile-360.png)、[手机未获得卡牌](../output/playwright/phase-c/card-locked-mobile.png)
- [抽到隐藏卡弹窗](../output/playwright/phase-c/draw-hidden-modal.png)、[隐藏卡卡面](../output/playwright/phase-c/card-hidden-drawn.png)
- [减少动态效果下抽卡](../output/playwright/phase-c/draw-hidden-reduced-motion.png)

## 数据、依赖与限制

- 没有数据库结构或学习结算逻辑变更，没有新增依赖、外部字体或联网图片请求。
- 临时抽卡验证库位于 `C:\Users\MR\AppData\Local\Temp\wordmaster-phase-c-20260927-1042.sqlite`，含内置种子词库和本次模拟答题/收藏记录。Windows 命令策略拒绝了删除该临时文件的清理操作；生产库未被写入。
- 浏览器视口检查不是实体手机验收；iPhone/Android 的真实屏幕与系统设置仍需之后在设备上确认。
- 当前工作区没有 `.git` 目录，无法创建 C 阶段提交。

