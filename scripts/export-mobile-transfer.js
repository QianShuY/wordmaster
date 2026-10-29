'use strict';
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite'),{mobileExport}=require('../app/mobile-transfer');
const root=path.resolve(__dirname,'..'),source=path.resolve(process.env.WORDMASTER_DB_PATH||path.join(root,'data/wordmaster.db'));
const stamp=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'medium'}).format(new Date()).replace(/[: ]/g,'-');
const target=path.resolve(process.argv[2]||path.join(root,'output/mobile-transfer','墨词-手机迁移-'+stamp+'.json'));
const db=new DatabaseSync(source,{readOnly:true,timeout:5000});try{const text=mobileExport(db);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text,{flag:'wx'});console.log('迁移文件已导出（原学习数据库只读）：\n'+target);}finally{db.close();}
