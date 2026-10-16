'use strict';
const path=require('node:path'),{createHash}=require('node:crypto');
function installationKey(root,database){
 const normalize=p=>path.resolve(p).replaceAll('\\','/').toLowerCase();
 return createHash('sha256').update(normalize(root)+'\n'+normalize(database)).digest('hex');
}
function runtimeInfo(db){
 const root=path.resolve(__dirname,'..'),database=path.resolve(process.env.WORDMASTER_DB_PATH||path.join(root,'data/wordmaster.db'));
 const available=require('./vocabulary').VERSION;
 const books=db?db.prepare('SELECT v.content_version FROM wordbooks b LEFT JOIN vocabulary_builds v ON v.book_id=b.id WHERE b.is_builtin=1 AND NOT EXISTS(SELECT 1 FROM book_history h WHERE h.book_id=b.id) ORDER BY b.id').all():null;
 const versions=books?[...new Set(books.map(b=>b.content_version).filter(Boolean))].sort():[],untracked=books?books.filter(b=>!b.content_version).length:null;
 return {application:'wordmaster',installationKey:installationKey(root,database),
  version:require('../package.json').version,availableContentVersion:available,
  contentVersion:books?.length&&!untracked&&versions.length===1?versions[0]:null,installedContentVersions:versions,
  contentCurrent:books?Boolean(books.length&&!untracked&&versions.length===1&&versions[0]===available):null,untrackedBuiltInBooks:untracked};
}
module.exports={installationKey,runtimeInfo};
