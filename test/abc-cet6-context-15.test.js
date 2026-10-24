'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const expected=[
  {
    "task": "cet6-021",
    "index": 30,
    "word": "arrangement",
    "en": "The seating arrangement ensures that everyone can see the screen.",
    "cn": "这样的座位安排能确保每个人都看清屏幕。",
    "sourceRaw": "arrangement [əˈreɪndʒmənt] n. 1. 整理，排列，布置 2. 安排，准备，筹备 3. 商定",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. 整理，排列，布置 2. 安排，准备，筹备 3. 商定"
    },
    "original": {
      "pos": "n.",
      "meaning": "1. 整理，排列，布置 2. 安排，准备，筹备 3. 商定",
      "phonetic": "əˈreɪndʒmənt",
      "example": "The seating arrangement allows everyone to see the screen.",
      "example_translation": "座位的安排让每个人都能看见屏幕。"
    }
  },
  {
    "task": "cet6-021",
    "index": 41,
    "word": "atmosphere",
    "en": "Warm lighting gave the café a welcoming atmosphere.",
    "cn": "暖色灯光让咖啡馆显得温馨宜人。",
    "sourceRaw": "atmosphere [ˈætməsfɪə] n. 1. 空气 2. 大气，大气层 3. 气氛，环境",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. 空气 2. 大气，大气层 3. 气氛，环境"
    },
    "original": {
      "pos": "n.",
      "meaning": "1. 空气 2. 大气，大气层 3. 气氛，环境",
      "phonetic": "ˈætməsfɪə",
      "example": "Soft lighting created a welcoming atmosphere in the café.",
      "example_translation": "柔和的灯光让咖啡馆里有一种亲切的氛围。"
    }
  },
  {
    "task": "cet6-021",
    "index": 95,
    "word": "characteristic",
    "en": "You can recognize the bird by its characteristic call.",
    "cn": "你可以凭这种鸟特有的叫声辨认出它。",
    "sourceRaw": "characteristic [ˌkærəktəˈrɪstɪk] adj. 特有的，独特的，表示特性的  n. (pl)特性， 特征，特色",
    "selectedSense": {
      "pos": "adj.",
      "meaning": "特有的，独特的，表示特性的  n. (pl)特性， 特征，特色"
    },
    "original": {
      "pos": "adj.",
      "meaning": "特有的，独特的，表示特性的  n. (pl)特性， 特征，特色",
      "phonetic": "ˌkærəktəˈrɪstɪk",
      "example": "The bird has a characteristic call that is easy to recognise.",
      "example_translation": "这种鸟有一种很容易辨认的特有叫声。"
    }
  },
  {
    "task": "cet6-021",
    "index": 65,
    "word": "benefit",
    "en": "One benefit of cycling to work is that it helps reduce traffic congestion.",
    "cn": "骑车通勤的一个好处是有助于缓解交通拥堵。",
    "sourceRaw": "benefit [ˈbenɪfɪt] n. 1. 利益，好处 2. 恩惠 3. 津贴，救济金，保险赔偿费 v. .有益于",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. 利益，好处 2. 恩惠 3. 津贴，救济金，保险赔偿费 v. .有益于"
    },
    "original": {
      "pos": "n.",
      "meaning": "1. 利益，好处 2. 恩惠 3. 津贴，救济金，保险赔偿费 v. .有益于",
      "phonetic": "ˈbenɪfɪt",
      "example": "One benefit of cycling is that it needs little space.",
      "example_translation": "骑自行车的一个好处是占用空间很少。"
    }
  },
  {
    "task": "cet6-021",
    "index": 80,
    "word": "cafeteria",
    "en": "The campus cafeteria serves hot meals until two in the afternoon.",
    "cn": "校园食堂供应热饭菜至下午两点。",
    "sourceRaw": "cafeteria [ˌkæfəˈtɪərɪə] n. 自助餐厅",
    "selectedSense": {
      "pos": "n.",
      "meaning": "自助餐厅"
    },
    "original": {
      "pos": "n.",
      "meaning": "自助餐厅",
      "phonetic": "ˌkæfəˈtɪərɪə",
      "example": "The cafeteria serves hot meals until two.",
      "example_translation": "自助食堂供应热餐，直到两点。"
    }
  },
  {
    "task": "cet6-022",
    "index": 1,
    "word": "circumstance",
    "en": "A sudden change in circumstances forced us to cancel the trip.",
    "cn": "情况突然发生变化，迫使我们取消了行程。",
    "sourceRaw": "circumstance [ˈsɜːkəmstəns] n. 1. (pl)情况，情形，环境  2. (pl)境况，境遇 || under the circumstances在那种情况下 / under no circumstance无论如何",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. (pl)情况，情形，环境  2. (pl)境况，境遇 || under the circumstances在那种情况下 / under no circumstance无论如何"
    },
    "original": {
      "pos": "n.",
      "meaning": "1. (pl)情况，情形，环境  2. (pl)境况，境遇 || under the circumstances在那种情况下 / under no circumstance无论如何",
      "phonetic": "ˈsɜːkəmstəns",
      "example": "One unexpected circumstance forced us to change the route.",
      "example_translation": "一个意想不到的情况迫使我们改变路线。"
    }
  },
  {
    "task": "cet6-022",
    "index": 11,
    "word": "clue",
    "en": "A return address on the torn envelope gave the detective a clue to the sender's identity.",
    "cn": "破信封上的寄件地址为侦探查明寄信人身份提供了线索。",
    "sourceRaw": "clue [kluː] n. 线索",
    "selectedSense": {
      "pos": "n.",
      "meaning": "线索"
    },
    "original": {
      "pos": "n.",
      "meaning": "线索",
      "phonetic": "kluː",
      "example": "The torn envelope offered a clue to the sender's identity.",
      "example_translation": "那只撕破的信封提供了一条关于寄信人身份的线索。"
    }
  },
  {
    "task": "cet6-022",
    "index": 69,
    "word": "crime",
    "en": "The police are investigating a crime committed near the station.",
    "cn": "警方正在调查一起发生在车站附近的犯罪案件。",
    "sourceRaw": "crime [kraɪm] n. 罪行，罪恶",
    "selectedSense": {
      "pos": "n.",
      "meaning": "罪行，罪恶"
    },
    "original": {
      "pos": "n.",
      "meaning": "罪行，罪恶",
      "phonetic": "kraɪm",
      "example": "The report describes a crime that happened near the station.",
      "example_translation": "报告描述了一起发生在车站附近的犯罪行为。"
    }
  },
  {
    "task": "cet6-022",
    "index": 81,
    "word": "database",
    "en": "The library maintains an online database of its books.",
    "cn": "图书馆维护着一个可在线查询馆藏图书的数据库。",
    "sourceRaw": "database [ˈdeɪtəˌbeɪs] n. 资料库，数据库",
    "selectedSense": {
      "pos": "n.",
      "meaning": "资料库，数据库"
    },
    "original": {
      "pos": "n.",
      "meaning": "资料库，数据库",
      "phonetic": "ˈdeɪtəˌbeɪs",
      "example": "The library keeps a database of books that readers can search online.",
      "example_translation": "图书馆保存了一个读者可以在线检索的图书数据库。"
    }
  },
  {
    "task": "cet6-022",
    "index": 55,
    "word": "contribution",
    "en": "Her contribution to the project was a new method that saved everyone time.",
    "cn": "她为项目贡献了一种新方法，帮大家节省了时间。",
    "sourceRaw": "contribution [ˌkɒntrɪˈbjuːʃən] n. 1. 捐款 2. 投稿 3. 贡献",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. 捐款 2. 投稿 3. 贡献"
    },
    "original": {
      "pos": "n.",
      "meaning": "1. 捐款 2. 投稿 3. 贡献",
      "phonetic": "ˌkɒntrɪˈbjuːʃən",
      "example": "Her contribution to the project helped everyone work more efficiently.",
      "example_translation": "她对这个项目的贡献帮助大家提高了工作效率。"
    }
  },
  {
    "task": "cet6-022",
    "index": 27,
    "word": "competence",
    "en": "This course helps students develop competence in reading technical documents.",
    "cn": "这门课程帮助学生提升阅读技术文档的能力。",
    "sourceRaw": "competence [ˈkɒmpɪtəns] n. 能力，胜任某种工作的资格",
    "selectedSense": {
      "pos": "n.",
      "meaning": "能力，胜任某种工作的资格"
    },
    "original": {
      "pos": "n.",
      "meaning": "能力，胜任某种工作的资格",
      "phonetic": "ˈkɒmpɪtəns",
      "example": "The course develops competence in reading technical texts.",
      "example_translation": "这门课培养阅读技术文本的能力。"
    }
  },
  {
    "task": "cet6-022",
    "index": 57,
    "word": "conventional",
    "en": "The new engine takes up less space than a conventional one.",
    "cn": "这种新型发动机比传统发动机占用的空间更小。",
    "sourceRaw": "conventional [kənˈvenʃənəl] adj. 习惯的，常规的",
    "selectedSense": {
      "pos": "adj.",
      "meaning": "习惯的，常规的"
    },
    "original": {
      "pos": "adj.",
      "meaning": "习惯的，常规的",
      "phonetic": "kənˈvenʃənəl",
      "example": "The new design uses less space than a conventional engine.",
      "example_translation": "这种新设计比常规发动机占用的空间更少。"
    }
  },
  {
    "task": "cet6-023",
    "index": 4,
    "word": "devote",
    "en": "She devotes an hour to reading every evening.",
    "cn": "她每天晚上都会花一个小时读书。",
    "sourceRaw": "devote [dɪˈvəʊt] v. 奉献，把…专用于  || devote oneself to 献身于，致力于， 沉溺于",
    "selectedSense": {
      "pos": "v.",
      "meaning": "奉献，把…专用于  || devote oneself to 献身于，致力于， 沉溺于"
    },
    "original": {
      "pos": "v.",
      "meaning": "奉献，把…专用于  || devote oneself to 献身于，致力于， 沉溺于",
      "phonetic": "dɪˈvəʊt",
      "example": "She plans to devote an hour to reading every evening.",
      "example_translation": "她计划每天晚上投入一个小时阅读。"
    }
  },
  {
    "task": "cet6-023",
    "index": 16,
    "word": "distribution",
    "en": "Volunteers managed the distribution of food to families after the storm.",
    "cn": "暴风雨过后，志愿者负责向受灾家庭分发食物。",
    "sourceRaw": "distribution [ˌdɪstrɪˈbjuːʃən] n. 1. 分发，分配，配给物 2. 散布，分布 3. 销售(量)",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. 分发，分配，配给物 2. 散布，分布 3. 销售(量)"
    },
    "original": {
      "pos": "n.",
      "meaning": "1. 分发，分配，配给物 2. 散布，分布 3. 销售(量)",
      "phonetic": "ˌdɪstrɪˈbjuːʃən",
      "example": "The volunteers organized the distribution of food after the storm.",
      "example_translation": "暴风雨过后，志愿者们组织了食物分发。"
    }
  },
  {
    "task": "cet6-023",
    "index": 12,
    "word": "dismiss",
    "en": "Don't dismiss her proposal without hearing her reasons.",
    "cn": "别还没听她解释理由就否定她的提议。",
    "sourceRaw": "dismiss [dɪsˈmɪs] v. 1. 免…之职，解雇 2. 让…离开，遣散 3. 不理会，抛弃，不认真考虑",
    "selectedSense": {
      "pos": "v.",
      "meaning": "1. 免…之职，解雇 2. 让…离开，遣散 3. 不理会，抛弃，不认真考虑"
    },
    "original": {
      "pos": "v.",
      "meaning": "1. 免…之职，解雇 2. 让…离开，遣散 3. 不理会，抛弃，不认真考虑",
      "phonetic": "dɪsˈmɪs",
      "example": "We should not dismiss an idea before hearing the reasons behind it.",
      "example_translation": "在听到一个想法背后的理由之前，我们不应将其否定。"
    }
  }
];
test('CET-6: 15 source-locked bilingual candidate repairs',()=>{
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
assert.equal(expected.length,15);
assert.equal(new Set(expected.map(x=>x.task+':'+x.index)).size,expected.length);
const loaded=new Map();
for(const row of expected){
if(!loaded.has(row.task)){
const meta=manifest.files.find(x=>x.task_id===row.task);assert.ok(meta);
const src=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',meta.file),'utf8'));
const result=JSON.parse(fs.readFileSync(path.join(root,'docs/model-task-results/worker-A',row.task,'result.json'),'utf8'));
assert.equal(result.input_sha256,meta.sha256);assert.equal(result.status,'proposal');
assert.equal(result.entries.length,meta.rows);assert.equal(src.entries.length,meta.rows);
for(let i=0;i<meta.rows;i++){assert.deepEqual(result.entries[i].identity,src.entries[i].identity);assert.deepEqual(result.entries[i].original,src.entries[i].current)}
loaded.set(row.task,result);
}
const e=loaded.get(row.task).entries[row.index];
assert.equal(e.identity.word,row.word);assert.equal(e.identity.source_raw,row.sourceRaw);
assert.deepEqual(e.selected_sense,row.selectedSense);assert.deepEqual(e.original,row.original);
assert.equal(e.proposed.example,row.en);assert.equal(e.proposed.example_translation,row.cn);
assert.equal(e.draft_method,'editorial-context-rewrite-needs-review');assert.equal(e.verification,'needs-review');
assert.equal(e.external_human_review,false);assert.equal(e.full_dictionary_senses_reviewed,false);assert.deepEqual(e.evidence,[]);
assert.deepEqual(rules.filter(r=>r.pattern.test(r.id==='translation-metalinguistic'?row.cn:row.en)).map(r=>r.id),[],'mechanical: '+row.task+'/'+row.word);
}
});
