'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const expected=[
  {
    "task": "cet4-038",
    "index": 78,
    "word": "alternative",
    "en": "For short journeys, cycling offers a practical alternative to driving.",
    "cn": "短途出行时，骑自行车是开车之外的一种实用选择。",
    "sourceRaw": "alternative [ɔːlˈtəːnətiv] n.替换物；取舍，抉择",
    "selectedSense": {
      "pos": "n.",
      "meaning": "替换物；取舍，抉择"
    },
    "original": {
      "pos": "n.",
      "meaning": "替换物；取舍，抉择",
      "phonetic": "ɔːlˈtəːnətiv",
      "example": "Cycling is a useful alternative to driving for short journeys.",
      "example_translation": "短途出行时，骑自行车是一种实用的驾车替代方式。"
    }
  },
  {
    "task": "cet4-038",
    "index": 43,
    "word": "advantage",
    "en": "Living near the station gives commuters an advantage during rush hour.",
    "cn": "住在车站附近让通勤者在高峰时段出行更便利。",
    "sourceRaw": "advantage [ədˈvɑːntidʒ] n.优点，优势；好处",
    "selectedSense": {
      "pos": "n.",
      "meaning": "优点，优势；好处"
    },
    "original": {
      "pos": "n.",
      "meaning": "优点，优势；好处",
      "phonetic": "ədˈvɑːntidʒ",
      "example": "Living near the station gives us an advantage when travelling.",
      "example_translation": "住在车站附近让我们出行时占有优势。"
    }
  },
  {
    "task": "cet4-038",
    "index": 34,
    "word": "addition",
    "en": "The new reading room is a welcome addition to the school library.",
    "cn": "新阅览室为学校图书馆增添了一处受欢迎的学习空间。",
    "sourceRaw": "addition [əˈdi∫ən] n.加，加法；附加物",
    "selectedSense": {
      "pos": "n.",
      "meaning": "加，加法；附加物"
    },
    "original": {
      "pos": "n.",
      "meaning": "加，加法；附加物",
      "phonetic": "əˈdiʃən",
      "example": "The new reading room is a welcome addition to the school.",
      "example_translation": "新阅览室是学校一项受欢迎的新增设施。"
    }
  },
  {
    "task": "cet4-039",
    "index": 26,
    "word": "arrangement",
    "en": "The seating arrangement ensures that everyone can see the screen.",
    "cn": "这样的座位安排能确保每个人都看清屏幕。",
    "sourceRaw": "arrangement [əˈreindʒmənt] n.整理,排列;安排",
    "selectedSense": {
      "pos": "n.",
      "meaning": "整理,排列;安排"
    },
    "original": {
      "pos": "n.",
      "meaning": "整理,排列;安排",
      "phonetic": "əˈreindʒmənt",
      "example": "The seating arrangement allows everyone to see the screen.",
      "example_translation": "座位的安排让每个人都能看见屏幕。"
    }
  },
  {
    "task": "cet4-039",
    "index": 50,
    "word": "atmosphere",
    "en": "Warm lighting gave the café a welcoming atmosphere.",
    "cn": "暖色灯光让咖啡馆显得温馨宜人。",
    "sourceRaw": "atmosphere [ˈætməsfiə] n.大气；空气；气氛",
    "selectedSense": {
      "pos": "n.",
      "meaning": "大气；空气；气氛"
    },
    "original": {
      "pos": "n.",
      "meaning": "大气；空气；气氛",
      "phonetic": "ˈætməsfiə",
      "example": "Soft lighting created a welcoming atmosphere in the café.",
      "example_translation": "柔和的灯光让咖啡馆里有一种亲切的氛围。"
    }
  },
  {
    "task": "cet4-039",
    "index": 75,
    "word": "backward",
    "en": "He took a step backward to avoid the passing bicycle.",
    "cn": "他向后退了一步，躲开经过的自行车。",
    "sourceRaw": "backward [ˈbækwəd] a.向后的；倒的 ad.倒",
    "selectedSense": {
      "pos": "a.",
      "meaning": "向后的；倒的 ad.倒"
    },
    "original": {
      "pos": "a.",
      "meaning": "向后的；倒的 ad.倒",
      "phonetic": "ˈbækwəd",
      "example": "A backward step brought him closer to the wall.",
      "example_translation": "他向后退了一步，离墙更近了。"
    }
  },
  {
    "task": "cet4-039",
    "index": 67,
    "word": "award",
    "en": "The young designer won an award for her innovative chair.",
    "cn": "那位年轻设计师凭借创新设计的椅子获了奖。",
    "sourceRaw": "award [əˈwɔːd] n.奖，奖品；判定",
    "selectedSense": {
      "pos": "n.",
      "meaning": "奖，奖品；判定"
    },
    "original": {
      "pos": "n.",
      "meaning": "奖，奖品；判定",
      "phonetic": "əˈwɔːd",
      "example": "The young designer received an award for her work.",
      "example_translation": "那位年轻设计师因作品获得了一个奖项。"
    }
  },
  {
    "task": "cet4-040",
    "index": 24,
    "word": "benefit",
    "en": "One benefit of cycling to work is that it helps reduce traffic congestion.",
    "cn": "骑车通勤的一个好处是有助于缓解交通拥堵。",
    "sourceRaw": "benefit [ˈbenifit] n.利益；恩惠；津贴",
    "selectedSense": {
      "pos": "n.",
      "meaning": "利益；恩惠；津贴"
    },
    "original": {
      "pos": "n.",
      "meaning": "利益；恩惠；津贴",
      "phonetic": "ˈbenifit",
      "example": "One benefit of cycling is that it needs little space.",
      "example_translation": "骑自行车的一个好处是占用空间很少。"
    }
  },
  {
    "task": "cet4-040",
    "index": 35,
    "word": "birth",
    "en": "The family celebrated the birth of their daughter.",
    "cn": "这家人欢庆女儿的诞生。",
    "sourceRaw": "birth [bəːθ] n.分娩，出生；出身",
    "selectedSense": {
      "pos": "n.",
      "meaning": "分娩，出生；出身"
    },
    "original": {
      "pos": "n.",
      "meaning": "分娩，出生；出身",
      "phonetic": "bəːθ",
      "example": "The family celebrated the birth of a daughter.",
      "example_translation": "这家人庆祝一个女儿的出生。"
    }
  },
  {
    "task": "cet4-040",
    "index": 99,
    "word": "business",
    "en": "She started a small business selling handmade greeting cards.",
    "cn": "她开了一家售卖手工贺卡的小店。",
    "sourceRaw": "business [ˈbiznis] n.商业，生意；事务",
    "selectedSense": {
      "pos": "n.",
      "meaning": "商业，生意；事务"
    },
    "original": {
      "pos": "n.",
      "meaning": "商业，生意；事务",
      "phonetic": "ˈbiznis",
      "example": "She started a small business selling handmade cards.",
      "example_translation": "她开始经营出售手工卡片的小生意。"
    }
  },
  {
    "task": "cet4-041",
    "index": 72,
    "word": "characteristic",
    "en": "You can recognize the bird by its characteristic call.",
    "cn": "你可以凭这种鸟特有的叫声辨认出它。",
    "sourceRaw": "characteristic [ˌkæriktəˈristik] a.特有的 n.特性",
    "selectedSense": {
      "pos": "a.",
      "meaning": "特有的 n.特性"
    },
    "original": {
      "pos": "a.",
      "meaning": "特有的 n.特性",
      "phonetic": "ˌkæriktəˈristik",
      "example": "The bird has a characteristic call that is easy to recognise.",
      "example_translation": "这种鸟有一种很容易辨认的特有叫声。"
    }
  },
  {
    "task": "cet4-041",
    "index": 9,
    "word": "cafeteria",
    "en": "The campus cafeteria serves hot meals until two in the afternoon.",
    "cn": "校园食堂供应热饭菜至下午两点。",
    "sourceRaw": "cafeteria [ˈkæfiˈtiəriə] n.自助食堂",
    "selectedSense": {
      "pos": "n.",
      "meaning": "自助食堂"
    },
    "original": {
      "pos": "n.",
      "meaning": "自助食堂",
      "phonetic": "ˈkæfiˈtiəriə",
      "example": "The cafeteria serves hot meals until two.",
      "example_translation": "自助食堂供应热餐，直到两点。"
    }
  },
  {
    "task": "cet4-041",
    "index": 63,
    "word": "chain",
    "en": "A rusty chain kept the gate firmly shut.",
    "cn": "一条生锈的铁链把大门牢牢拴住了。",
    "sourceRaw": "chain [t∫ein] n.链，链条，项圈",
    "selectedSense": {
      "pos": "n.",
      "meaning": "链，链条，项圈"
    },
    "original": {
      "pos": "n.",
      "meaning": "链，链条，项圈",
      "phonetic": "tʃein",
      "example": "A rusty chain held the gate shut.",
      "example_translation": "一条生锈的链子把大门锁着。"
    }
  },
  {
    "task": "cet4-041",
    "index": 99,
    "word": "cigarette",
    "en": "An empty cigarette packet lay on the ground beside the bin.",
    "cn": "一个空烟盒落在垃圾桶旁的地上。",
    "sourceRaw": "cigarette [sigəˈret] n.香烟，纸烟，卷烟",
    "selectedSense": {
      "pos": "n.",
      "meaning": "香烟，纸烟，卷烟"
    },
    "original": {
      "pos": "n.",
      "meaning": "香烟，纸烟，卷烟",
      "phonetic": "sigəˈret",
      "example": "An empty cigarette packet lay beside the bin.",
      "example_translation": "一个空香烟盒躺在垃圾桶旁。"
    }
  },
  {
    "task": "cet4-042",
    "index": 3,
    "word": "circumstance",
    "en": "A sudden change in circumstances forced us to cancel the trip.",
    "cn": "情况突然发生变化，迫使我们取消了行程。",
    "sourceRaw": "circumstance [ˈsəːkəmstəns] n.情况，条件；境遇",
    "selectedSense": {
      "pos": "n.",
      "meaning": "情况，条件；境遇"
    },
    "original": {
      "pos": "n.",
      "meaning": "情况，条件；境遇",
      "phonetic": "ˈsəːkəmstəns",
      "example": "One unexpected circumstance forced us to change the route.",
      "example_translation": "一个意想不到的情况迫使我们改变路线。"
    }
  },
  {
    "task": "cet4-042",
    "index": 27,
    "word": "clue",
    "en": "A return address on the torn envelope gave the detective a clue to the sender's identity.",
    "cn": "破信封上的寄件地址为侦探查明寄信人身份提供了线索。",
    "sourceRaw": "clue [kluː] n.线索，暗示，提示",
    "selectedSense": {
      "pos": "n.",
      "meaning": "线索，暗示，提示"
    },
    "original": {
      "pos": "n.",
      "meaning": "线索，暗示，提示",
      "phonetic": "kluː",
      "example": "The torn envelope offered a clue to the sender's identity.",
      "example_translation": "那只撕破的信封提供了一条关于寄信人身份的线索。"
    }
  },
  {
    "task": "cet4-043",
    "index": 42,
    "word": "crime",
    "en": "The police are investigating a crime committed near the station.",
    "cn": "警方正在调查一起发生在车站附近的犯罪案件。",
    "sourceRaw": "crime [kraim] n.罪，罪行；犯罪",
    "selectedSense": {
      "pos": "n.",
      "meaning": "罪，罪行；犯罪"
    },
    "original": {
      "pos": "n.",
      "meaning": "罪，罪行；犯罪",
      "phonetic": "kraim",
      "example": "The report describes a crime that happened near the station.",
      "example_translation": "报告描述了一起发生在车站附近的犯罪行为。"
    }
  },
  {
    "task": "cet4-043",
    "index": 57,
    "word": "curtain",
    "en": "A sheer curtain let soft morning light into the room.",
    "cn": "一幅轻薄的窗帘让柔和的晨光透进房间。",
    "sourceRaw": "curtain [ˈkəːtən] n.帘，窗帘；幕(布)",
    "selectedSense": {
      "pos": "n.",
      "meaning": "帘，窗帘；幕(布)"
    },
    "original": {
      "pos": "n.",
      "meaning": "帘，窗帘；幕(布)",
      "phonetic": "ˈkəːtən",
      "example": "A thin curtain let soft light into the room.",
      "example_translation": "一幅薄窗帘让柔和的光线透进房间。"
    }
  },
  {
    "task": "cet4-043",
    "index": 62,
    "word": "daily",
    "en": "She takes a daily walk to clear her mind after studying.",
    "cn": "她每天学习后都会散步，让头脑放松一下。",
    "sourceRaw": "daily [ˈdeili] a.每日的 n.日报",
    "selectedSense": {
      "pos": "a.",
      "meaning": "每日的 n.日报"
    },
    "original": {
      "pos": "a.",
      "meaning": "每日的 n.日报",
      "phonetic": "ˈdeili",
      "example": "A daily walk helps her take a break from studying.",
      "example_translation": "每天散步让她能从学习中休息片刻。"
    }
  },
  {
    "task": "cet4-043",
    "index": 54,
    "word": "cure",
    "en": "The doctors hope to cure the disease with a new treatment.",
    "cn": "医生们希望用一种新疗法治愈这种疾病。",
    "sourceRaw": "cure [kjuə] vt.医治；消除 n.治愈",
    "selectedSense": {
      "pos": "vt.",
      "meaning": "医治；消除 n.治愈"
    },
    "original": {
      "pos": "vt.",
      "meaning": "医治；消除 n.治愈",
      "phonetic": "kjuə",
      "example": "The researchers hope to find a treatment that can cure the disease.",
      "example_translation": "研究人员希望找到一种能治愈这种疾病的治疗方法。"
    }
  },
  {
    "task": "cet4-044",
    "index": 23,
    "word": "devote",
    "en": "She devotes an hour to reading every evening.",
    "cn": "她每天晚上都会花一个小时读书。",
    "sourceRaw": "devote [diˈvəut] vt.将…奉献，致力于",
    "selectedSense": {
      "pos": "vt.",
      "meaning": "将…奉献，致力于"
    },
    "original": {
      "pos": "vt.",
      "meaning": "将…奉献，致力于",
      "phonetic": "diˈvəut",
      "example": "She plans to devote an hour to reading every evening.",
      "example_translation": "她计划每天晚上投入一个小时阅读。"
    }
  },
  {
    "task": "cet4-044",
    "index": 25,
    "word": "diamond",
    "en": "A small diamond was set in the silver ring.",
    "cn": "一颗小钻石镶嵌在银戒指上。",
    "sourceRaw": "diamond [ˈdaiəmənd] n.金钢石，钻石；菱形",
    "selectedSense": {
      "pos": "n.",
      "meaning": "金钢石，钻石；菱形"
    },
    "original": {
      "pos": "n.",
      "meaning": "金钢石，钻石；菱形",
      "phonetic": "ˈdaiəmənd",
      "example": "The ring contains a small diamond surrounded by silver.",
      "example_translation": "这枚戒指镶着一颗被银环绕的小钻石。"
    }
  },
  {
    "task": "cet4-044",
    "index": 51,
    "word": "dismiss",
    "en": "Don't dismiss her proposal without hearing her reasons.",
    "cn": "别还没听她解释理由就否定她的提议。",
    "sourceRaw": "dismiss [disˈmis] vt.不再考虑；解雇",
    "selectedSense": {
      "pos": "vt.",
      "meaning": "不再考虑；解雇"
    },
    "original": {
      "pos": "vt.",
      "meaning": "不再考虑；解雇",
      "phonetic": "disˈmis",
      "example": "We should not dismiss an idea before hearing the reasons behind it.",
      "example_translation": "在听到一个想法背后的理由之前，我们不应将其否定。"
    }
  },
  {
    "task": "cet4-044",
    "index": 57,
    "word": "distribution",
    "en": "Volunteers managed the distribution of food to families after the storm.",
    "cn": "暴风雨过后，志愿者负责向受灾家庭分发食物。",
    "sourceRaw": "distribution [ˌdistriˈbjuː∫ən] n.分发/配；分布",
    "selectedSense": {
      "pos": "n.",
      "meaning": "分发/配；分布"
    },
    "original": {
      "pos": "n.",
      "meaning": "分发/配；分布",
      "phonetic": "ˌdistriˈbjuːʃən",
      "example": "The volunteers organized the distribution of food after the storm.",
      "example_translation": "暴风雨过后，志愿者们组织了食物分发。"
    }
  },
  {
    "task": "cet4-044",
    "index": 90,
    "word": "drown",
    "en": "The lifeguard pulled the swimmer from the water before he drowned.",
    "cn": "救生员及时把那名游泳者救出水面，避免了溺亡。",
    "sourceRaw": "drown [draun] vi.淹死，溺死",
    "selectedSense": {
      "pos": "vi.",
      "meaning": "淹死，溺死"
    },
    "original": {
      "pos": "vi.",
      "meaning": "淹死，溺死",
      "phonetic": "draun",
      "example": "The rescue team reached the swimmer before he could drown.",
      "example_translation": "救援队在那位游泳者可能溺亡之前赶到了他身边。"
    }
  },
  {
    "task": "cet4-044",
    "index": 63,
    "word": "division",
    "en": "The division of the farmland into small plots caused disputes among the villagers.",
    "cn": "把农田分成小块地引发了村民之间的争执。",
    "sourceRaw": "division [diˈviʒən] n.分，分配；除法",
    "selectedSense": {
      "pos": "n.",
      "meaning": "分，分配；除法"
    },
    "original": {
      "pos": "n.",
      "meaning": "分，分配；除法",
      "phonetic": "diˈviʒən",
      "example": "The division of the land into smaller plots changed the village.",
      "example_translation": "土地被分成更小的地块，改变了这个村庄。"
    }
  },
  {
    "task": "cet4-045",
    "index": 15,
    "word": "education",
    "en": "The project aims to give children in remote villages better access to education.",
    "cn": "这个项目旨在让偏远村庄的孩子获得更多受教育的机会。",
    "sourceRaw": "education [ˌedju(ː)ˈkei∫ən] n.教育;训导;教育学",
    "selectedSense": {
      "pos": "n.",
      "meaning": "教育;训导;教育学"
    },
    "original": {
      "pos": "n.",
      "meaning": "教育;训导;教育学",
      "phonetic": "ˌedju(ː)ˈkeiʃən",
      "example": "The project aims to improve access to education in remote villages.",
      "example_translation": "这个项目旨在改善偏远村庄接受教育的机会。"
    }
  }
];
test('CET-4: 27 source-locked bilingual candidate repairs',()=>{
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
assert.equal(expected.length,27);
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
