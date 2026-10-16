# 墨词内容协作任务 A：四级、六级及专四专八前段

请直接执行下面的任务，不只给计划。你是负责内容初审的协作模型，主代理负责代码、数据库更新、复核及发布。工作区：D:/工作区/wordmaster。

## 你的独占范围

输入根目录：D:/工作区/wordmaster/docs/model-tasks-20261015/。

只处理：cet4/cet4-001.json 至 cet4/cet4-045.json；cet6/cet6-001.json 至 cet6/cet6-023.json；tem/tem-001.json 至 tem/tem-022.json。

共 90 个任务文件、8932 条输入。不要处理范围外文件，不要改其他模型的成果。以根目录 manifest.json 为准核对 task_id、行数和 SHA256。每个 JSON 最多 100 条，逐份读取，不要一次把全词库放入上下文。

输出根目录：D:/工作区/wordmaster/docs/model-task-results/worker-A/。每份任务单独写入 <task_id>/result.json 和 <task_id>/summary.md；另写总 progress.json，记录每个 task_id 的 pending、in-progress 或 submitted 状态、已处理行数和疑点数量。

## 连续执行方式

按上述范围和编号依次处理，完成一份就保存并继续下一份，不要每份结束都要求用户说“继续”。开始前检查自己的输出目录，已有完整结果则核对输入哈希、身份及行数后续做未完成部分，不覆盖既有结果。修订自己的旧建议时保存版本副本。

可每 20 条保存一次进度。遇到个别疑难词先记录 needs-review 并继续，不让单词卡住整份任务。上下文或调用额度耗尽时，保存实际完成进度和下一条身份，诚实报告剩余量；不能把剩余条目用猜测批量填满，也不能声称全部完成。

## 每条具体工作

1. 保留词库：原样复制 identity 和 current（输出中名为 original）。逐条核对中文释义、词性、音标，以及已有英文例句和译文。没有例句则补写；已有例句不等于已审核。
2. 选定一个明确义项，写自然、简短、适合学习的原创英文例句和准确中文译文。避免空泛句、过难词和依赖外部上下文的句子，保留词库已有例句若正确可保持并注明核对结果。
3. 建议修订要明确原因。原词条有多个义项时不要只留下所选义项；未能核实的其他义项写入 issues，不擅自删减。不要为适配一句例句而把合法的主词性改掉。
4. 实际查看可访问的 Oxford Learner's Dictionaries、Cambridge Dictionary、Collins 等原始词典页面。记录具体 URL、所核对的词性、义项和英式 IPA。不得拼接 URL 冒充查证、复制词典例句、绕过验证码或伪造人工复核。
5. 无网络、页面不可访问或证据不足时，evidence 留空或只保留实际取得的证据，verification 标 needs-review；可写清楚标为草稿的原创例句，不能假装已核实。主代理会处理这些疑点。
6. 同形词编号保持独立：bank 银行与河岸、bat 球棒与蝙蝠、bow 鞠躬与弓不能共用错义例句。注意 export 等词的词性与重音。不能把同拼写的词条、英美变体、短语或斜杠词头自行合并。
7. 高考任务如果在你的范围内：输入 candidates 是旧词库参考，不能当标准答案。identity 复制 source_entry、headword、pdf_page、handling、accepted_spellings，original 填 null。编写该单元的教学稿；复杂变体、范围疑点、固定搭配或冠词读音等明确记录，不能自行改变范围、总词数、可接受拼写或判分政策。

## 写入边界

只能在你自己的输出根目录内创建和修改成果。应用代码、测试、输入快照、app/seed、词库原始文件、数据库、其他模型目录及发布文件均不可修改。不要运行 apply、迁移、更新、打包或启动会写入真实数据的应用命令；不代答、不抽卡、不重置记录。不需要提交 Git，也不创建其他聊天或发送消息。

这是审核建议，不是正式审核通过。所有结果 status 必须为 proposal；external_human_review=false；full_dictionary_senses_reviewed=false。最终复核与合并由主代理完成。

## result.json 格式

```json
{
  "task_id": "cet6-001",
  "input_sha256": "从 manifest.json 复制对应文件哈希",
  "status": "proposal",
  "entries": [
    {
      "identity": { "说明": "保留词库复制 identity 整个对象；高考复制 source_entry、headword、pdf_page、handling、accepted_spellings" },
      "original": { "说明": "保留词库复制 current；高考填 null" },
      "selected_sense": { "pos": "n.", "meaning": "所选义项" },
      "proposed": {
        "pos": "建议词性，未建议改则保持原值",
        "meaning": "建议完整释义，保留已核实的其他义项",
        "phonetic": "所核实词性的英式 IPA，不带外围斜杠",
        "example": "原创英文句子",
        "example_translation": "对应中文译文",
        "teaching_note": "可为空的简短用法提示"
      },
      "evidence": [
        { "url": "实际打开的具体词典页面", "checked_pos": "n.", "checked_sense": "本条义项", "checked_uk_ipa": "实际核对值", "accessed": true }
      ],
      "issues": [],
      "change_reason": "为什么建议改动；不改则说明已核对范围",
      "verification": "source-checked 或 needs-review",
      "external_human_review": false,
      "full_dictionary_senses_reviewed": false
    }
  ]
}
```


将模板的 task_id 和 input_sha256 替换为本任务实际值，entries 每条输入对应一条结果，顺序不变。identity 与 original 必须是复制的真实对象，不能保留“说明”占位符。proposed 里的字段必须填写实际建议值，不能保留模板文字；证据不足、无法给出建议时填 null 并写明 issues，不能编造。verification 只允许 source-checked 或 needs-review；前者至少要有一条真正访问并支持所选义项的来源。

每份 summary.md 写明：输入数量、结果数量、建议改动数量、证据已核对数量、needs-review 数量及具体疑点身份。全部范围完成后生成 REPORT.md，汇总提交的 task_id、实际行数、待主代理处理的疑点和结果目录。无需修改主项目任何文件。

如果你无法访问上述本地文件，先明确说明缺少文件访问，并请用户提供本范围的任务 JSON；不要虚构输入、处理结果或保存路径。现在从你范围里的第一份未完成任务开始。
