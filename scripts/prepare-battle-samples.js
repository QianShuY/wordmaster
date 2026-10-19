'use strict';
// Optional build-time import, never run by the app. Download the three FluidR3
// packs named in the credit file into output/audio-source-20261019 first.
// Strictly parse their data objects; never execute downloaded JavaScript.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),source=path.join(root,'output/audio-source-20261019'),target=path.join(__dirname,'audio-samples/fluidr3');
fs.mkdirSync(target,{recursive:true});
const packs={overdriven_guitar:[38,45,48,50,53,57,60,62,65,69,72,74,77],electric_bass_pick:[26,29,33,34,36,38,41,45],electric_guitar_clean:[50,53,57,60,62,65,69,72,74]};
const names=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const manifest={sample_rate:22050,channels:1,source:'https://github.com/gleitz/midi-js-soundfonts/tree/gh-pages/FluidR3_GM',license:'CC BY 3.0',packs:{}};
for(const [name,notes]of Object.entries(packs)){
 const file=path.join(source,name+'-mp3.js'),bytes=fs.readFileSync(file),text=bytes.toString('utf8'),assignment=text.indexOf('MIDI.Soundfont.'+name+' = ');
 if(assignment<0)throw Error('Missing expected instrument assignment: '+name);
 const start=text.indexOf('{',assignment),data=JSON.parse(text.slice(start,text.lastIndexOf('}')+1).replace(/,\s*}/g,'}'));
 const pack={source_url:'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/'+name+'-mp3.js',source_sha256:createHash('sha256').update(bytes).digest('hex'),notes:[]};
 for(const midi of notes){
  const key=names[midi%12]+(Math.floor(midi/12)-1),uri=data[key];
  if(typeof uri!=='string'||!/^data:audio\/mp3;base64,[A-Za-z0-9+/=\s]+$/.test(uri))throw Error('Invalid sample data: '+name+' '+key);
  const encoded=path.join(source,name+'-'+midi+'.mp3'),output=path.join(target,name+'-'+midi+'.wav');fs.writeFileSync(encoded,Buffer.from(uri.split(',')[1],'base64'));
  const conversion=spawnSync(process.env.FFMPEG_PATH||'ffmpeg',['-hide_banner','-loglevel','error','-y','-i',encoded,'-ar','22050','-ac','1','-c:a','pcm_s16le',output],{windowsHide:true,encoding:'utf8'});
  if(conversion.status!==0)throw Error(conversion.error?.message||conversion.stderr);
  pack.notes.push({midi,file:path.basename(output),sha256:createHash('sha256').update(fs.readFileSync(output)).digest('hex')});
 }
 manifest.packs[name]=pack;
}
fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({instruments:Object.keys(manifest.packs),samples:Object.values(packs).flat().length,target}));
