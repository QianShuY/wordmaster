'use strict';
const fs=require('node:fs'),path=require('node:path'),B=require('./extend-gaokao-reviewed'),Base=require('./build-gaokao-reviewed');
const root=path.resolve(__dirname,'..'),seed=path.join(root,'app/seed'),audit=path.join(root,'docs/vocabulary-audit');
const additions=[
 {id:'c',count:100,date:'20261014',title:'award 至 blind',teaching:'b59acf504493aa0297976e59fa9f53e8f2e0325bfd929e3fe823713ed458cbc7',phonetics:'ba8909264207b5f8d271854991c3a7f1940d104931d9e291fca031f8db7d5cf5'},
 {id:'d',count:100,date:'20261014',title:'block 至 candy',teaching:'f8672b38594ad7432d6b5c37daa6b03d264024e14bfff4a181982bdf7d5a8555',phonetics:'ba4263433c69dd1e00d03ba8c1ce38c32824d4cb1930bf70b1f6f3ca8a558b74'},
 {id:'e',count:100,date:'20261014',title:'canteen 至 civil',teaching:'918373a55d0f9ef9adeea4a0f180e8b909437f674e5c3bbe38f5aaee857b022f',phonetics:'3af761e26dfa3dd29144afd8e4e43b14a1e747ae2b0032d8ca7f9416b871f848'},
 {id:'f',count:100,date:'20261014',title:'civilian 至 constitution',teaching:'ce9fdfdee5367a6c1c8c3cd3eebcceffaf8e0ff9316fccf84abf35e3b49586ba',phonetics:'be81a86a40dff6d9e3cd23c10b1c4ae4c4a53409f8ee821155138b26ecc5b3dc'},
 {id:'g',count:100,date:'20261015',title:'construction 至 data',teaching:'d7a9407af08c326d12839c02dbfbe2b0becf0d87c13c305c3d510338d43a6205',phonetics:'1f0d73d53ff9a575adbe0bff32f646bed372454f5ed76c33077e34bc7de8f776'},
 {id:'h',count:100,date:'20261015',title:'database 至 discussion',teaching:'85c425fae1a0b62c3c8239eea12b7ae5db6a3fac2f01fa25135c313d6c4169a1',phonetics:'f203caee69364f701941aec896beef6736c9a79330653b6ce6d395c976643cc0'},
 {id:'i',count:100,date:'20261015',title:'disease 至 else',teaching:'b94af154a21b993a8a38f8db6e85732f02cb8118b1fd8d96fdf67e3e723a5187',phonetics:'55fc1ed5d9ff767426be1567f02d879973974a87099b0debabd9c84236659db2'},
 {id:'j',count:100,date:'20261015',title:'elsewhere 至 extension',teaching:'daeffb34095e4cd7c04f6be16e5874a3dbf956137af68ec98b990a2f8650ad8a',phonetics:'9b500dfe4b74ddbcd0d736b9134ca8aa76e0401456b09255a6e8268c084eae52'}
];
function current(){
 const x=B.load();let report=B.extend(x.scope,x.previous,x.rows,x.phonetics);const sections=[];
 for(const a of additions){
  const rows=Base.tsv(Base.checkedText(path.join(seed,`gaokao-common-${a.id}-${a.date}.tsv`),a.teaching),'headword\tpos\tmeaning\texample\texample_translation\tnote');
  const phonetics=Base.tsv(Base.checkedText(path.join(seed,`gaokao-common-${a.id}-phonetics-${a.date}.tsv`),a.phonetics),'headword\tpos_label\tphonetic\turl');
  report=B.extend(x.scope,report,rows,phonetics,{baseCount:report.entries.length,count:a.count,includeI:false});
  sections.push({id:a.id,date:a.date.slice(0,4)+'-'+a.date.slice(4,6)+'-'+a.date.slice(6),title:a.title,entries:report.new_batch});
 }
 return {report,sections};
}
if(require.main===module){
 const {report,sections}=current(),escape=s=>s.replaceAll('|','\\|');
 fs.writeFileSync(path.join(audit,'gaokao-reviewed-units-current.json'),JSON.stringify({...report,new_batch:undefined},null,2)+'\n');
 for(const section of sections)fs.writeFileSync(path.join(audit,`GAOKAO_COMMON_${section.id.toUpperCase()}_${section.date}.md`),[
  '# 高考连续教学稿：'+section.title,'','原创选定义项与双语例句；音标逐词核对所选词性。离线审稿，尚未安装；不表示外部人工复核或完整多义词审校。','',
  '| 单词 | 所选义项与音标 | 原创双语例句 | 用法提示 | 依据 |','| --- | --- | --- | --- | --- |',
  ...section.entries.map(e=>`| ${e.headword} | ${escape(e.pos+' '+e.meaning)}<br>/${e.phonetic}/ | ${escape(e.example)}<br>${escape(e.example_translation)} | ${escape(e.teaching_note)} | [词典](${e.pronunciation_source})；PDF ${e.pdf_page} |`),'',
  `累计 ${report.selected_senses_reviewed}/${report.learning_units} 个教学单元完成选定义项审稿；待审 ${report.pending_units} 个，正式安装 0。`,''].join('\n'));
 console.log(JSON.stringify({reviewed:report.selected_senses_reviewed,pending:report.pending_units,total:report.learning_units,installed:0}));
}
module.exports={current,additions};
