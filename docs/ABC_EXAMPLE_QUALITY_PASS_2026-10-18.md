# 墨词例句质量第一轮：自然语境专项检查

日期：2026-10-18  
工作分支：`feat/moci-web-handoff-20261016`

## 已执行成果

- 在 `cet4-024`、`cet4-025`、`gaokao-001` 三份任务中，逐词改写 **59 对**原本僵硬、错误搭配或仅引用单词的中英例句。
- 修改前例句/译文、来源绑定、原释义均锁定在 `docs/model-quality-patches/quality-targeted-examples-20261018.json`，实际提交代码由 `scripts/apply-abc-quality-patches.js` 严格逐行比对，支持重跑时幂等。
- 如 `reception` 和 `respective`，原词性标签疑似错位，**保留原始 source pos**，仅在选定义项和 issues 中做出可核查的说明；不擅自修改来源文件。
- 例句不再是 `quicken the items` / `reproduce the equipment` 之类无意义模板。
- 改写后仍全部 `needs-review`，未填写虚构 IPA、未声称查过权威词典，也未写入已安装词库。
- GitHub Actions `39096226441` 验证成功；完整 `npm test`、`audit-model-evidence.js --strict` 通过，并自动提交 `d0f592a6d50d16`。

## 最新自动化质量排查

`scripts/audit-abc-example-quality.js` 对 **26,612** 条草稿进行只读排查并在 `docs/model-quality-patches/example-quality-audit-20261018.json` 留有可复查快照。

| 指标 | 结果 |
|---|---:|
| 双语草稿总数 | 26,612 |
| 空例句对 | 0 |
| 逐词自然语境改写 | 59 |
| 被正则规则标记为疑似机械/词语引用 | **3,827** |
| 四级被标记 | 208 |
| 六级被标记 | 468 |
| 考研被标记 | 61 |
| TEM 被标记 | **2,832** |
| 高考被标记 | 258 |

注意规则可出现交叉计数，`flagged_unique` 是去重的疑点行数。数字是**初筛量，不等于已确认语法错误数**，规则也无法发现所有跨书借用导致的词义不匹配。

### 质量工作优先级

1. **优先改写 3,827 条疑似机械句**，特别是专四专八 TEM 的 2,832 条和六级的 468 条。对 numbered homograph（如 `attribute 1` / `attribute 2`）要按语义和词形分别造句，数字编号不得误入英语例句。
2. **复核 5,547 条跨词库引用候选**。相同拼写和词性并不保证义项相同；源释义的汉字重合度只是此前建立草稿时的简单启发式。
3. **修复旧数据的词性异常**，尤其 `reception`、`respective` 等原标签问题，须以词典依据和来源身份精确绑定。
4. 单独核实英式音标，并在 release gate 审核后才升级正式词库。

目前的完整率只能称为 **第一轮中英例句草稿覆盖 100%**，绝不能宣传成教学质量 100% 或词典已审校完成。

## 数据保护

此次质量改写仅限 `docs/model-task-results/worker-{A,B}/<task>/result.json` 和独立质量审计报告。没有更改任何学生用户的 SQLite、复习计划、背词记录、原始词表或 `main` 正式版。
