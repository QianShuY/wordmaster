'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{current}=require('../scripts/build-gaokao-current'),P=require('../shared/answer-policy');
test('current ledger preserves prior reviewed entries and keeps backward, back, bark, bacteria and comparison forms distinct',()=>{
 const {report,sections}=current(),get=h=>report.entries.find(e=>e.headword===h);
 assert.equal(report.selected_senses_reviewed,1054);assert.equal(report.pending_units,2057);assert.equal(report.learning_units,3111);assert.equal(report.installed_units,0);
 assert.equal(report.coverage.filter(e=>e.review_status==='selected-sense-reviewed-not-installed').length,1054);
 assert.equal(sections[0].entries.length,100);
 assert.equal(get('back').pos,'adv.');assert.equal(get('back').pronunciation_source.endsWith('/back_3'),true);
 assert.equal(get('backward').pos,'adj.');assert.equal(get('below').pos,'prep.');assert.equal(get('bark').pos,'v.');
 assert.equal(get('bacteria').phonetic,'bækˈtɪəriə');assert.equal(P.grade(get('bacteria').answer_policy,'bacterium'),false);
 assert.equal(get('bear').pos,'v.');assert.ok(get('bat').meaning.includes('球棒'));
 assert.equal(P.grade(get('best').answer_policy,'good'),false);assert.equal(P.grade(get('better').answer_policy,'best'),false);
 assert.equal(get('billion').pos,'num.');assert.equal(get('billion').meaning,'十亿');
 for(const e of sections[0].entries){assert.equal(e.external_human_review,false);assert.ok(P.grade(e.answer_policy,e.headword));}
 assert.equal(get('bow').pos,'v.');assert.equal(get('bow').phonetic,'baʊ');assert.ok(get('bow').pronunciation_source.endsWith('/bow1_1'));
 assert.equal(get('born').pos,'v.');assert.equal(get('both').pos,'det.');assert.equal(get('can').pos,'modal v.');assert.equal(get('can').phonetic,'kæn');
 assert.equal(get('blouse').phonetic,'blaʊz');assert.equal(get('buffet').phonetic,'ˈbʊfeɪ');
 assert.equal(get('breath').phonetic,'breθ');assert.equal(get('breathe').phonetic,'briːð');
 assert.equal(get('China').meaning,'中国');assert.equal(get('china').meaning,'瓷器');
 assert.ok(get('China').pronunciation_source.endsWith('/china_2'));assert.ok(get('china').pronunciation_source.endsWith('/china_1'));
 assert.notEqual(get('China').source_entry,get('china').source_entry);
 assert.equal(get('chemical').pos,'n.');assert.equal(get('characteristic').pos,'adj.');assert.equal(get('charge').pos,'v.');
 assert.equal(get('chopsticks').phonetic,'ˈtʃɒpstɪks');assert.equal(P.grade(get('cattle').answer_policy,'cow'),false);
 assert.equal(get('close').pos,'v.');assert.equal(get('close').phonetic,'kləʊz');assert.ok(get('close').pronunciation_source.endsWith('/close1_1'));
 assert.equal(get('conduct').pos,'v.');assert.equal(get('conduct').phonetic,'kənˈdʌkt');
 assert.equal(get('conflict').pos,'n.');assert.equal(get('conflict').phonetic,'ˈkɒnflɪkt');
 assert.equal(get('concrete').pos,'n.');assert.equal(get('complete').pos,'v.');assert.equal(get('communist').pos,'n.');
 assert.equal(get('cloth').phonetic,'klɒθ');assert.equal(get('clothes').phonetic,'kləʊðz');assert.equal(P.grade(get('clothes').answer_policy,'cloth'),false);
 for(const e of sections.find(s=>s.id==='f').entries){assert.equal(e.external_human_review,false);assert.equal(e.full_dictionary_senses_reviewed,false);assert.ok(P.grade(e.answer_policy,e.headword));}
 assert.equal(get('content').pos,'n.');assert.equal(get('content').phonetic,'ˈkɒntent');assert.ok(get('content').pronunciation_source.endsWith('/content1'));
 assert.equal(get('contract').phonetic,'ˈkɒntrækt');assert.equal(get('contest').phonetic,'ˈkɒntest');assert.equal(get('contrast').phonetic,'ˈkɒntrɑːst');
 assert.equal(get('contrary').phonetic,'ˈkɒntrəri');assert.ok(get('contrary').pronunciation_source.endsWith('/contrary1_1'));
 assert.equal(get('continent').pos,'n.');assert.ok(get('continent').pronunciation_source.endsWith('/continent_2'));
 assert.equal(get('crash').pos,'v.');assert.ok(get('crash').pronunciation_source.endsWith('/crash_2'));assert.equal(get('dance').pos,'v.');
 assert.equal(get('could').phonetic,'kʊd');assert.ok(get('could').pronunciation_note.includes('Strong form'));
 assert.equal(get('cookie').phonetic,'ˈkʊkɪ');assert.ok(get('cookie').pronunciation_source.includes('collinsdictionary.com'));
 assert.equal(get('criterion').headword,'criterion');assert.equal(P.grade(get('criterion').answer_policy,'criteria'),false);
 for(const e of sections.find(s=>s.id==='g').entries){assert.equal(e.external_human_review,false);assert.equal(e.full_dictionary_senses_reviewed,false);assert.ok(P.grade(e.answer_policy,e.headword));}
 assert.equal(get('desert').pos,'n.');assert.equal(get('desert').phonetic,'ˈdezət');assert.equal(get('dessert').phonetic,'dɪˈzɜːt');assert.equal(P.grade(get('desert').answer_policy,'dessert'),false);
 assert.equal(get('digest').pos,'v.');assert.equal(get('digest').phonetic,'daɪˈdʒest');assert.equal(get('decrease').pos,'v.');assert.equal(get('decrease').phonetic,'dɪˈkriːs');
 assert.equal(get('discount').pos,'n.');assert.equal(get('discount').phonetic,'ˈdɪskaʊnt');assert.equal(get('delay').pos,'v.');assert.ok(get('delay').pronunciation_source.endsWith('/delay_2'));
 assert.equal(get('definitely').pos,'adv.');assert.equal(get('despite').pos,'prep.');assert.equal(get('diagram').pos,'n.');assert.equal(get('direct').pos,'v.');
 assert.equal(get('deaf').phonetic,'def');assert.equal(get('death').phonetic,'deθ');assert.equal(get('debt').phonetic,'det');assert.equal(P.grade(get('deer').answer_policy,'deers'),false);
 for(const e of sections.find(s=>s.id==='h').entries){assert.equal(e.external_human_review,false);assert.equal(e.full_dictionary_senses_reviewed,false);assert.ok(P.grade(e.answer_policy,e.headword));}
 assert.equal(get('do').pos,'v.');assert.equal(get('do').phonetic,'duː');assert.ok(get('do').pronunciation_source.endsWith('/do1_1'));
 assert.equal(get('download').pos,'v.');assert.equal(get('download').phonetic,'ˌdaʊnˈləʊd');assert.ok(get('download').pronunciation_source.endsWith('/download_1'));
 assert.equal(get('drink').pos,'v.');assert.ok(get('drink').pronunciation_source.endsWith('/drink_2'));assert.equal(get('each').pos,'det.');assert.equal(get('either').pos,'det.');
 assert.equal(get('down').pos,'adv.');assert.equal(get('early').pos,'adv.');assert.equal(get('drill').pos,'v.');assert.equal(get('dress').pos,'n.');
 assert.equal(get('drone').meaning,'无人机');assert.ok(get('drone').pronunciation_source.includes('collinsdictionary.com'));assert.ok(get('dumpling').pronunciation_source.includes('collinsdictionary.com'));
 assert.equal(P.grade(get('elevator').answer_policy,'lift'),false);assert.equal(P.grade(get('elder').answer_policy,'older'),false);
 for(const e of sections.find(s=>s.id==='i').entries){assert.equal(e.external_human_review,false);assert.equal(e.full_dictionary_senses_reviewed,false);assert.ok(P.grade(e.answer_policy,e.headword));}
 assert.equal(get('English').pos,'n.');assert.ok(get('English').pronunciation_source.endsWith('/english_1'));
 assert.equal(get('entrance').pos,'n.');assert.equal(get('entrance').phonetic,'ˈentrəns');assert.ok(get('entrance').pronunciation_source.endsWith('/entrance1'));
 assert.equal(get('estimate').pos,'v.');assert.equal(get('estimate').phonetic,'ˈestɪmeɪt');assert.equal(get('export').phonetic,'ɪkˈspɔːt');assert.equal(get('excuse').phonetic,'ɪkˈskjuːz');
 assert.equal(get('enough').pos,'det.');assert.equal(get('every').pos,'det.');assert.equal(get('everything').pos,'pron.');assert.equal(get('everyday').pos,'adj.');
 assert.equal(P.grade(get('everyday').answer_policy,'every day'),false);assert.equal(get('exhaust').pos,'v.');assert.equal(get('expert').pos,'n.');
 for(const e of sections.find(s=>s.id==='j').entries){assert.equal(e.external_human_review,false);assert.equal(e.full_dictionary_senses_reviewed,false);assert.ok(P.grade(e.answer_policy,e.headword));}
});
