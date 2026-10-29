import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),project=path.dirname(root),require=createRequire(import.meta.url);
const assets=path.join(root,'android/app/src/main/assets'),dist=path.join(root,'mobile-dist'),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'moci-mobile-seed-'));
const hash=s=>createHash('sha256').update(s).digest('hex');
const lock=JSON.parse(fs.readFileSync(path.join(root,'seed/word-key-lock.json'),'utf8'));
const previous=JSON.parse(fs.readFileSync(path.join(root,'seed/generated/wordmaster-seed.json'),'utf8'));
const baseline=new Map(previous.books.flatMap(b=>b.words.map(w=>[w.word_key,hash([w.word,w.phonetic,w.pos,w.meaning,w.example].join('\0'))])));
let source,output;
try{
 process.env.WORDMASTER_DB_PATH=path.join(scratch,'source.db');
 const {db,seed}=require(path.join(project,'app/db'));source=db;seed();
 const V=require(path.join(project,'app/vocabulary'));
 const codes=['gaokao','cet4','cet6','npee','tem'];
 output=new DatabaseSync(path.join(scratch,'mobile.db'));output.exec(fs.readFileSync(path.join(root,'mobile/schema.sql'),'utf8'));output.exec('BEGIN');
 const insBook=output.prepare('INSERT INTO wordbooks(book_key,name,description,is_builtin,sort_order) VALUES(?,?,?,1,?)');
 const insWord=output.prepare('INSERT INTO words(word_key,book_key,word,headword,homograph,phonetic,pos,meaning,example,example_translation,policy_json,source_file,source_line,source_raw,legacy_sha256) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
 const counts=[];
 for(const [i,spec] of V.DESKTOP_CATALOG.entries()){
  const book=db.prepare('SELECT * FROM wordbooks WHERE name=?').get(spec.name),key='builtin:'+codes[i];
  insBook.run(key,book.name,book.description,i);
  const words=db.prepare('SELECT * FROM words WHERE book_id=? ORDER BY id').all(book.id);
  for(const w of words){
   const wordKey=lock.books[key]?.[w.word]||key+':v2:'+hash(w.word).slice(0,24);
   const policy=db.prepare('SELECT policy_json FROM word_answer_policies WHERE word_id=?').get(w.id)?.policy_json||'';
   insWord.run(wordKey,key,w.word,w.headword,w.homograph,w.phonetic,w.pos,w.meaning,w.example,w.example_translation,policy,w.source_file,w.source_line,w.source_raw,baseline.get(wordKey)||null);
  }
  counts.push({key,name:book.name,words:words.length,examples:words.filter(w=>w.example&&w.example_translation).length});
 }
 const cardKeys=JSON.parse(fs.readFileSync(path.join(root,'seed/card-key-lock.json'),'utf8')).books.cards;
 const insCard=output.prepare('INSERT INTO cards VALUES(?,?,?,?,?,?,?,?,?)');
 const cards=db.prepare('SELECT * FROM cards ORDER BY id').all();
 for(const c of cards){const id=cardKeys[c.palette]?.id||c.id;insCard.run(id,c.title,c.category,c.rarity,c.palette,c.flavor,c.hidden,c.unlock_at,'cards/'+c.palette+'.webp');}
 output.exec('COMMIT; VACUUM');
 if(output.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||output.prepare('PRAGMA foreign_key_check').all().length)throw Error('Invalid mobile seed');
 const words=output.prepare('SELECT COUNT(*) n FROM words').get().n;if(words!==27666)throw Error('Incomplete mobile catalog');
 output.close();output=null;db.close();source=null;fs.mkdirSync(assets,{recursive:true});
 fs.copyFileSync(path.join(scratch,'mobile.db'),path.join(assets,'mobile-seed.db'));
 const manifest={format:'moci-mobile-seed',version:1,content_version:V.VERSION,sha256:hash(fs.readFileSync(path.join(assets,'mobile-seed.db'))),words,cards:cards.length,books:counts};
 fs.writeFileSync(path.join(assets,'mobile-seed-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 // Write into dedicated outputs; never clean the old Android bundle or seed.
 if(!process.argv.includes('--seed-only')){
 fs.mkdirSync(dist,{recursive:true});fs.cpSync(path.join(root,'mobile'),dist,{recursive:true});
 fs.copyFileSync(path.join(root,'node_modules/@capacitor/core/dist/capacitor.js'),path.join(dist,'capacitor.js'));
 fs.mkdirSync(path.join(dist,'shared'),{recursive:true});for(const f of ['answer-policy.js','domain.js','campaign-route.js','campaign-map.js','campaign-clues.js'])fs.copyFileSync(path.join(project,'shared',f),path.join(dist,'shared',f));
 fs.copyFileSync(path.join(project,'static/adventure/assets/mist-campaign-map-v4-dusk.webp'),path.join(dist,'journey-map.webp'));
 fs.mkdirSync(path.join(dist,'cards'),{recursive:true});for(const c of cards)fs.copyFileSync(path.join(project,'static/cards/original',c.palette+'.webp'),path.join(dist,'cards',c.palette+'.webp'));
 fs.writeFileSync(path.join(dist,'seed-info.json'),JSON.stringify(manifest));
 }
 console.log(JSON.stringify(manifest));
}finally{try{output?.close();}catch{}try{source?.close();}catch{}const absolute=path.resolve(scratch);if(!absolute.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(absolute).startsWith('moci-mobile-seed-'))throw Error('Unsafe scratch cleanup');fs.rmSync(absolute,{recursive:true,force:true,maxRetries:5,retryDelay:150});}
