'use strict';
/**
 * Lowest-priority OFFLINE bilingual first draft. It does not pretend to know
 * the full dictionary sense: these are context-shaped editable sentences.
 * Weak or ambiguous cases must be rewritten before they can be shipped.
 *
 * Zero API keys, zero external downloads, zero data modifications.
 */
const crypto=require('node:crypto');
const {posType}=require('./reuse-abc-local-examples');
const filled=x=>typeof x==='string'&&x.trim().length>0;
const hash=x=>parseInt(crypto.createHash('sha256').update(String(x)).digest('hex').slice(0,8),16);
const clean=x=>String(x??'').replace(/\s+/g,' ').trim();
function glossOf(src){
 const raw=clean(src?.current?.meaning||src?.candidates?.[0]?.meaning||'');
 let s=raw.replace(/^[a-z/.\s&]+(?=[\u3400-\u9fff])/i,'').replace(/\([^)]*\)|（[^）]*）/g,'');
 s=s.split(/[；;，,。|]/)[0].trim();
 s=s.replace(/\b(?:n|v|vi|vt|adj|adv|a|ad|prep)\.(?:.*)$/i,'').trim();
 if(!/[\u3400-\u9fff]/.test(s))s='该词条的具体含义';
 if(s.length>18)s=s.slice(0,18);
 return s;
}
function chosenType(src){
 const pos=clean(src?.current?.pos||src?.candidates?.[0]?.pos||'');
 const type=posType(pos);
 if(type)return type;
 if(/^(vt|vi|v)\./i.test(pos))return 'verb';
 if(/^(adj|a)\./i.test(pos))return 'adjective';
 if(/^(adv|ad)\./i.test(pos))return 'adverb';
 if(/^(n)\./i.test(pos))return 'noun';
 if(/^(num|numeral)\./i.test(pos))return 'numeral';
 return 'unknown';
}
function hasHeadword(example,word){
 if(!filled(example)||!filled(word))return false;
 const e=example.toLowerCase(),w=word.toLowerCase();
 // Word boundary check with inflection allowances; reject e.g. prior->priority.
 if(e.includes(w)){
  for(let i=e.indexOf(w);i>=0;i=e.indexOf(w,i+1)){
   const before=e[i-1]||'',after=e[i+w.length]||'';
   if(!/[a-z]/.test(before)&&(!/[a-z]/.test(after)||
     /^(?:s|es|ed|ing|er|est|ly)\b/.test(e.slice(i+w.length))))return true;
  }
 }
 return false;
}
function make(src,identity){
 const word=clean(identity?.word||src?.headword||src?.candidates?.[0]?.word||'');
 if(!word)throw Error('Cannot create a draft without a word identity');
 const meaning=glossOf(src),pos=clean(src?.current?.pos||src?.candidates?.[0]?.pos||'');
 const kind=chosenType(src);
 const key=word+'#'+(identity?.source_line??src?.pdf_page??'')+'#'+pos;
 const noun=[
  ['The report includes a discussion of '+word+'.','报告中包含对“'+meaning+'”的讨论。'],
  ['The students asked questions about '+word+' during the lesson.','学生们在课上询问了关于“'+meaning+'”的问题。'],
  ['The guide described '+word+' in detail.','讲解员详细介绍了“'+meaning+'”。'],
  ['The article examines the role of '+word+' in everyday life.','这篇文章探讨了“'+meaning+'”在日常生活中的作用。'],
  ['They collected information about '+word+' for the project.','他们为项目收集了有关“'+meaning+'”的资料。'],
  ['We learned about '+word+' in the afternoon lecture.','我们在下午的讲座中了解了“'+meaning+'”。'],
  ['The book offers a clear introduction to '+word+'.','这本书对“'+meaning+'”作了清楚的介绍。'],
 ];
 const vTrans=/^(?:vt\.|vtr\.|transitive)/i.test(pos);
 const verb=vTrans?[
  ['We need to '+word+' the materials carefully.','我们需要仔细进行“'+meaning+'”这项操作。'],
  ['The staff were asked to '+word+' the items before noon.','工作人员被要求在中午前完成“'+meaning+'”的操作。'],
  ['The team decided to '+word+' the equipment after the inspection.','团队决定检查后对设备进行“'+meaning+'”的处理。'],
  ['It may be necessary to '+word+' the documents again.','可能需要再次对文件进行“'+meaning+'”的处理。']
 ]:[
  ['The students were encouraged to '+word+' during the activity.','学生们被鼓励在活动中尝试“'+meaning+'”。'],
  ['They agreed to '+word+' after a short break.','他们同意短暂休息后进行“'+meaning+'”。'],
  ['We had to '+word+' before the meeting began.','我们不得不在会议开始前进行“'+meaning+'”。'],
  ['She hoped to '+word+' before the end of the day.','她希望当天结束前能够“'+meaning+'”。']
 ];
 const adj=[
  ['The situation seemed '+word+' to everyone involved.','在场的人都觉得这种情况“'+meaning+'”。'],
  ['The results were described as '+word+' in the report.','报告把结果描述为“'+meaning+'”。'],
  ['The group found the proposal '+word+'.','小组认为这份提案“'+meaning+'”。'],
  ['The final design looked '+word+' to the reviewers.','评审人员认为最终设计显得“'+meaning+'”。']
 ];
 const adv=[
  ['She explained the decision '+word+' during the meeting.','她在会议上以“'+meaning+'”的方式解释了决定。'],
  ['The group responded '+word+' to the announcement.','小组对公告作出了“'+meaning+'”的回应。'],
  ['The instructions were followed '+word+' by the staff.','工作人员“'+meaning+'”地遵循了说明。']
 ];
 const num=[
  ['We counted '+word+' items on the shelf.','我们数了架子上的'+meaning+'件物品。'],
  ['The class prepared '+word+' questions for the speaker.','全班为发言人准备了'+meaning+'个问题。']
 ];
 // Complex articles, prepositions, conjunctions and collocations cannot be
 // reliably placed by POS-only templates. Use an explicitly marked language
 // citation, NEVER a misleading fabricated semantic context.
 const meta=[
  ['The expression "'+word+'" appears in the passage.','短文中出现了“'+word+'”这一表达。'],
  ['The teacher wrote "'+word+'" on the board.','老师在黑板上写下了“'+word+'”。']
 ];
 const list=kind==='noun'?noun:kind==='verb'?verb:kind==='adjective'?adj:
  kind==='adverb'?adv:kind==='numeral'?num:meta;
 const [example,translation]=list[hash(key)%list.length];
 if(!filled(example)||!filled(translation)||!hasHeadword(example,word))
  throw Error('Invalid fallback draft for '+word);
 return {example,example_translation:translation,meaning_hint:meaning,
  pos_type:kind,origin:kind==='unknown'?'metalinguistic-placeholder':'offline-context-first-draft',
  issues:[
   '离线按词性和源释义生成的初稿，未独立核对单词搭配、可数性、语态、语义或英式读音。',
   kind==='unknown'?'仅为词语引用示例，不是该义项的真实语境例句，必须替换。':
    '该例句仅为第一轮语境候选，若语法或词义不匹配应在审校时重写。'
  ]};
}
module.exports={make,hasHeadword,glossOf,chosenType};
