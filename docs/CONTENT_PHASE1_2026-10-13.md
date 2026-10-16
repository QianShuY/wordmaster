# 下一阶段优化 · 第一批实施验收

日期：2026-10-13。范围：全词库清单、跨词库首批例句、已核验音标、高考替换预演、性能基线。不是整个优化计划的完成报告。

## 本批实际结果

| 词库 | 有效词条 | 双语例句前→后 | 新增例句 | 修正音标 |
| --- | --- | --- | --- | --- |
| 中考 | 1713 | 18→18 | 0 | 0 |
| 四级 | 4460 | 28→46 | 18 | 0 |
| 六级 | 2259 | 131→133 | 2 | 8 |
| 考研 | 5384 | 27→43 | 16 | 0 |
| 专四专八 | 12439 | 28→166 | 138 | 1 |

合计新增 174 条正式词条的双语例句，修正 9 处音标。新增 34 组墨词自编例句，其余复用既有自编例句；复用时要求词头、词性和完整释义与已核对的六级词条一致。新例句涉及图书馆、旅行、河流、学习、记忆等，不只覆盖当前已学词。中考拟替换，本批不继续扩充。

词头、词性、原始来源、完整释义均绑定到具体源条目，避免同拼写不同义项套用例句。现有例句或只有一侧文本的手改内容均保留；词性、释义、音标或来源被改过的条目跳过。

数据补丁事务前后对所有非内容表、词条身份及词库计划做 SHA-256 比对；本次前后摘要一致。未重建词库，未重置数据，未提交真实答案或领取奖励。再次预演，所有库的新增与修正均为 0。

## 逐库、逐词跟踪

新增 [全词库清单](vocabulary-audit/ALL_BOOKS_2026-10-13.md)，逐词 JSON 包含身份、源行、内容指纹、例句存在状态、当前批次审核状态和问题标签。分母覆盖全部已安装有效条目。

“有双语文本”与“本批完成义项匹配审核”单列；旧批次例句不伪装成本批审核成果。所有条目的全量语言审校仍明确为 pending-full-review，不把结构化展示当成已完成审校。

可疑音标检测是针对特定字符的风险筛选，不表示未命中的词已核验。六级特定字符疑点从 47 降至 39；原来的 14 条隔离源行仍未恢复。

## 音标修正依据

以下逐词核对英式读音，不执行全库字符替换；原始 source_raw 保留。

- [authorize](https://www.oxfordlearnersdictionaries.com/us/definition/english/authorize)：ˈɔːθəraɪz
- [invariably](https://www.oxfordlearnersdictionaries.com/definition/english/invariably)：ɪnˈveəriəbli
- [virtual](https://dictionary.cambridge.org/pronunciation/english/virtual)：ˈvɜːtʃuəl
- [underlying](https://dictionary.cambridge.org/pronunciation/english/underlying)：ˌʌndəˈlaɪɪŋ
- [historian](https://www.oxfordlearnersdictionaries.com/us/definition/english/historian)：hɪˈstɔːriən
- [questionnaire](https://www.oxfordlearnersdictionaries.com/us/definition/english/questionnaire)：ˌkwestʃəˈneə（此处不显示非连读位置的可选 r）
- [vocational](https://www.oxfordlearnersdictionaries.com/us/definition/english/vocational)：vəʊˈkeɪʃənl
- [telecommunication](https://www.oxfordlearnersdictionaries.com/definition/english/telecommunication)：ˌtelikəˌmjuːnɪˈkeɪʃn

第九处是专四专八中与已确认修正条件完全相同的 authorize。没有搬运上述词典的释义段落或例句。

## 高考替换：已预演，尚未执行

当前中考库：1713 条；无学习记录、作答流水、未完成复习周期、活动计划；未发现词头/释义/音标/原始来源被修改。只读预演结果见 [JSON](vocabulary-audit/gaokao-replacement-preview-2026-10-13.json)。本轮未删除任何词条。

版本核验有一项重要发现：已有 2025 年修订版，不能仅拿旧的 2020 年版或网上通称的“3500词”宣布为当前高考词库。

- [教育部 2020 年印发通知](https://www.moe.gov.cn/srcsite/A26/s8001/202006/t20200603_462199.html)及[课程教材研究所原文](https://www.ictr.edu.cn/Uploads/File/2022/04/28/普通高中英语课程标准（2017年版2020年修订）.20220428173859.pdf)：旧版对照依据；附录未提供中文释义，不可把第三方配义冒称官方内容。
- [北京师范大学编辑部 2026 年修订解读](https://flts.bnu.edu.cn/node/17268)：确认 2025 年修订版及其变化，不能替代完整词表。
- [新乡工程学院发布页](https://www.xxgc.edu.cn/fll/info/1061/5288.htm)：提供 2025 年修订版附件入口，但下载需验证码，当前未获取完整附件，未绕过验证。

替换门槛仍有三项：获取并核对新版完整附录；逐条配义、音标及原创例句审核；记录内容使用条件。高考库未具备正式内容前保留中考，不能只改名称。后续替换仅失效旧中考检查点，不重置其他词库或全库数据库身份。

## 性能基线

新增只读本机 HTTP GET 测量脚本，覆盖词库目录、统计、旅程状态和五库分页/搜索，每个接口预热后测量 5 次。

本机本次热请求中位数约 10.6–29.8ms，单组最大值约 16.0–37.5ms。完整样本见 output/refinement/api-baseline-20261013.json。

这些只是 API 基线：不包含浏览器渲染、图片解码、帧率、真正冷启动或 Windows EXE，不能据此宣称页面卡顿已消失。下一步继续定位这些前端成本；本次未改变已认可的地图尺寸、色调、动画与音乐。

## 验证与实现

全量 85 项测试通过。新增测试验证：同词不同义不套例句、来源指纹不匹配跳过、手改/半条例句保留、自建词不修改、真实计划与复习状态保持、预演不写入、重复执行无新增、数据库完整性和外键完整性。

真实运行 API 只读核对四级/考研 library 的双语例句、六级 invariably 的新音标，确认更新已可读取。无需重打发行包才能读取本机内容更新；发行包仍未更新。

主要实现：scripts/content-quality.js、shared/content-batch.js、app/seed/content-batch-20261013.json、app/seed/examples-batch-20261013.tsv、app/seed/cet6-corrections.json、scripts/measure-readonly-api.js。新建词库使用同一批次绑定，避免仅更新本机、下次安装丢失。

运行（项目内置 runtime/node.exe 可替换 node）：

```powershell
node scripts/content-quality.js          # 只读预演并输出全库清单
node scripts/content-quality.js --apply  # 精确内容补丁，不重置记录
node scripts/measure-readonly-api.js     # 本机 GET-only API 基线
```

## 明确遗留与下一批

1. 继续取得并核对新版高考词表，完成正式替换；当前中考入口尚在。
2. 继续处理六级 14 条隔离源行和剩余 39 条字符疑点，逐库扩充例句；全量词库质量目标远未完成。
3. 跨日复习异常验收、Boss 正式通关与结局、全站渲染性能和 Windows 发行包仍按主计划推进，本批未冒充完成。

