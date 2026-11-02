'use strict';
const fs = require('node:fs');
const path = require('node:path');
function validateTheme(input) {
 if (input === null) return null;
 if (!input || typeof input !== 'object' || !/^[a-z0-9_-]{1,80}$/i.test(input.palette || '') || !input.values) return undefined;
 const values = {};
 for (const field of ['accent','deep','paper','ground','wash','line','ink','muted']) {
  const value=input.values[field];
  if(typeof value!=='string'||!/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return undefined;
  values[field]=value;
 }
 const theme={palette:input.palette,values};
 if(typeof input.position==='string'&&/^\d{1,3}%\s+\d{1,3}%$/.test(input.position))theme.position=input.position;
 return theme;
}
function install(app, options={}) {
 const file=options.file || path.join(path.dirname(path.resolve(process.env.WORDMASTER_DB_PATH || path.join(__dirname,'../data/wordmaster.db'))),'desktop-theme.json');
 let theme;
 try { theme=validateTheme(JSON.parse(fs.readFileSync(file,'utf8')).theme); } catch {}
 app.get('/api/desktop/theme',(_req,res)=>res.set('Cache-Control','no-store').json({available:theme!==undefined,theme:theme??null}));
 app.post('/api/desktop/theme',(req,res)=>{
  // The publisher is WordMaster itself, never a remote website.
  if(req.get('origin')!==`${req.protocol}://${req.get('host')}`) return res.sendStatus(403);
  const next=validateTheme(req.body?.theme);
  if(next===undefined)return res.status(400).json({error:'主题格式不正确'});
  try {
   fs.writeFileSync(file+'.tmp',JSON.stringify({theme:next}));
   fs.renameSync(file+'.tmp',file);
   theme=next;res.json({ok:true});
  }catch{res.status(503).json({error:'主题偏好保存失败'});}
 });
}
module.exports={validateTheme,install};
