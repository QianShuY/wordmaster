'use strict';
// Bundle the existing training app; no learner files or browser records are copied.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),parent=path.join(root,'static');
const source=path.resolve(process.argv[2]||process.env.WORDMASTER_TRAINING_SOURCE||path.join(root,'../../cet6-practice'));
const cli=path.join(source,'node_modules/vite/bin/vite.js');
if(!fs.existsSync(cli))throw Error('找不到训练项目的 Vite。请安装其依赖，或传入训练仓库路径。');
cp.execFileSync(process.execPath,[cli,'build','--base=/practice/'],{cwd:source,stdio:'inherit'});
const dist=path.join(source,'dist'),target=path.join(parent,'practice');
if(!fs.existsSync(path.join(dist,'index.html')))throw Error('训练构建缺少首页');
const stage=path.join(parent,'.practice-build-'+Date.now()),old=path.join(parent,'.practice-previous-'+Date.now());
function owned(location){const resolved=path.resolve(location);if(path.dirname(resolved)!==parent||!/^\.?practice(?:$|-)/.test(path.basename(resolved)))throw Error('训练资源路径超出静态目录');return resolved;}
for(const location of [target,stage,old])owned(location);
if(fs.existsSync(target)&&!fs.existsSync(path.join(target,'practice-manifest.json')))throw Error('现有 practice 目录未标记为生成物，保留原目录。');
fs.cpSync(dist,stage,{recursive:true});
let revision='local';try{revision=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim();}catch{}
fs.writeFileSync(path.join(stage,'practice-manifest.json'),JSON.stringify({format:'moci-english-training',version:1,builtAt:new Date().toISOString(),sourceRevision:revision,base:'/practice/',personalDataIncluded:false},null,2));
try{
 if(fs.existsSync(target))fs.renameSync(owned(target),owned(old));
 fs.renameSync(owned(stage),owned(target));
}catch(error){if(!fs.existsSync(target)&&fs.existsSync(old))fs.renameSync(owned(old),owned(target));throw error;}
if(fs.existsSync(old))fs.rmSync(owned(old),{recursive:true,force:true});
console.log('英语训练已接入：/practice/');
