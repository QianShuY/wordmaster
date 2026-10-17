# 墨词 ABC 批量审核任务包（2026-10-17）

分支：`feat/moci-web-handoff-20261016`。本文描述可执行的**离线候选素材分拣流程**，不等于独立词典审校或正式内容发布。

## 当前任务边界

- 源任务：268 份，26,612 行，A/B/C 分工和输入 SHA256 沿用原始交接清单。
- 2026-10-17 交接分支上已有草稿 14,739 行，未写入 worker 正式候选结果的行 11,873；这两类都尚未独立完成全义项审核。
- 先前保存的 **1,640 条同来源例句候选**以 `reused-candidates.json` 形式分布在 34 个任务旁，不属于已批准内容；跨词库示例只是词头/词性备选，**不得按词头自动回填释义**。
- **本批 accepted=0、installed=0**。用户真实学习、计划、复习、收藏、卡牌和旅行记录未动，未运行 reset。

## 使用方法

在完整仓库源码、Node 24 环境运行：

```bash
npm ci --no-audit --no-fund
npm test
npm run abc:bulk
```

输出位于 Git 忽略目录 `output/refinement/abc-bulk/`：

- `summary.json`：268 份任务的实际未起草行、待审核行和候选覆盖统计；`undrafted_candidate_coverage` 区分 exact、crossbook、有任意素材以及必须原创的行数。exact 与 crossbook 有重叠，不能相加当总覆盖。
- `A-draft-001.json` 等：未起草的逐行任务，内含 **review_material**（同来源旧例句、跨词库备选、风险标记、未批准状态）和 `hint_priority`。按 P1 同来源、P2 跨词库、P3 原创补写排序，**优先级不是可信度评分或审核通过**。
- `A-review-001.json` 等：已有 worker 草稿，需核对词典所有义项、词性、UK IPA、双语例句、翻译以及同形词，不能只信 `verification=source-checked`。

GitHub Actions `WordMaster checks` 完成后会上传 `abc-bulk-work-packets` 工件，有效期由工作流设为 14 天。CI 通过只表示执行脚本成功，不证明任何候选语言质量已通过。

## 审核与写回纪律

1. 在同一任务行中核对 `task_id`、`row_index`、`input_sha256`、`identity` 和 `original`；不能改变原输入及已存在的 worker result 前缀。
2. P1 旧例句只可作为独立审核起点；P2 跨库备选需要逐义项确认，严禁自动选首条；P3 必须原创自然双语例句。词典打不开或证据不充分时继续标 `needs-review`。
3. 通过原始可访问词典逐条核对后的决定，连同具体来源、原文风险和理由另存审计记录。**禁止**因为在任务包中有例句就改成 `accepted`、直接安装 seed 或重建真实用户数据库。
4. 对于与本地 agent 并行产生的成果，写入前重新获取远端 HEAD 和相应文件 blob SHA；有冲突时重新对账，不强推、不覆盖另一方改动。

## 效果与未完成工作

此改动解决的是“分开的候选素材和批量任务包无法直接对照”的工作流问题，减少重复翻文件并支持按已有材料连续审核。它**没有**增加独立审核通过词数，亦没有完成高考替换、Windows 正式包或跨设备同步。见 `docs/WEB_GPT_HANDOFF_PLAN_2026-10-16.md` 了解最终发布门槛。
