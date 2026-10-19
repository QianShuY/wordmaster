'use strict';
// Original ending cue: the battle's D-F-A motif opens into a warmer F-major horizon.
// Clean guitar and bass: FluidR3 GM (CC BY 3.0), see AUDIO_CREDITS.md.
const fs=require('node:fs'),path=require('node:path');
const SR=22050,beat=.75,bar=beat*4,duration=53,length=Math.round(duration*SR);
const left=new Float64Array(length),right=new Float64Array(length);
const folder=path.join(__dirname,'audio-samples/fluidr3');
const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));
const packs={};
for(const name of ['electric_guitar_clean','electric_bass_pick'])packs[name]=manifest.packs[name].notes.map(note=>{
 const b=fs.readFileSync(path.join(folder,note.file));let offset=12;
 while(offset+8<=b.length){const id=b.toString('ascii',offset,offset+4),size=b.readUInt32LE(offset+4);if(id==='data'){
  const data=new Float32Array(size/2);let peak=0;
  for(let i=0;i<data.length;i++){data[i]=b.readInt16LE(offset+8+i*2)/32768;peak=Math.max(peak,Math.abs(data[i]));}
  for(let i=0;i<data.length;i++)data[i]*=.75/Math.max(peak,.01);
  return{midi:note.midi,data};
 }offset+=8+size+(size%2);}throw Error('Invalid sample '+note.file);
});
function mix(i,y,pan){if(i<0||i>=length)return;left[i]+=y*Math.sqrt((1-pan)/2);right[i]+=y*Math.sqrt((1+pan)/2);}
function sample(name,midi,at,seconds,level,pan=0){
 const source=packs[name].reduce((a,b)=>Math.abs(b.midi-midi)<Math.abs(a.midi-midi)?b:a),ratio=2**((midi-source.midi)/12),start=Math.round(at*SR);
 for(let i=0,n=Math.round(seconds*SR);i<n;i++){
  const index=i*ratio,k=Math.floor(index);if(k+1>=source.data.length)break;
  const t=i/SR,env=Math.min(1,t/.01,(seconds-t)/.18),y=(source.data[k]*(1-index+k)+source.data[k+1]*(index-k))*env*level;
  mix(start+i,y,pan);
 }
}
function pad(midi,at,seconds,level,pan){
 const f=440*2**((midi-69)/12),start=Math.round(at*SR);
 for(let i=0;i<seconds*SR;i++){
  const t=i/SR,env=Math.sin(Math.min(1,t/1.3)*Math.PI/2)**2*Math.min(1,(seconds-t)/1.8),phase=2*Math.PI*f*t;
  const y=(Math.sin(phase+.004*Math.sin(2*Math.PI*4.1*t))+.24*Math.sin(phase*2+.12)+.1*Math.sin(phase*3))*.62;
  mix(start+i,y*env*level,pan);
 }
}
function bell(midi,at,seconds,level,pan){
 const f=440*2**((midi-69)/12),start=Math.round(at*SR);
 for(let i=0;i<seconds*SR;i++){
  const t=i/SR,phase=2*Math.PI*f*t,env=Math.min(t/.012,1,(seconds-t)/.4);
  mix(start+i,(Math.sin(phase)*Math.exp(-t*1.7)+.17*Math.sin(phase*2.004)*Math.exp(-t*3.5))*env*level,pan);
 }
}
// Sixteen spacious bars, with the first clear sky at 9 seconds (the title reveal).
const chords=[[50,53,57,64],[46,53,57,60],[48,55,60,64],[41,53,57,60],[46,53,57,60],[48,55,60,64],[50,53,57,64],[41,53,57,60],[46,53,57,60],[48,55,60,64],[41,53,57,64],[45,52,57,60],[46,53,57,60],[48,55,60,64],[41,53,57,60],[41,53,57,64]];
const melody=[[62,65],[69,65],[64,67],[69,72],[70,69],[67,64],[65,69],[72,69],[70,74],[72,67],[69,65],[64,69],[70,69],[67,64],[65,69],[72,69]];
for(let b=0;b<16;b++){
 const at=b*bar,chord=chords[b],warm=b<3?.65:1,ending=b>13?.8:1;
 for(let j=0;j<chord.length;j++)pad(chord[j],Math.max(0,at-.25),bar+2,.041*warm*ending,[-.55,-.18,.2,.52][j]);
 sample('electric_bass_pick',chord[0]-12,at,2.9,.1*warm);
 // A soft, spread guitar figure; no drums or competing lead lines.
 const arp=[chord[1],chord[2],chord[3],chord[2]];
 for(let j=0;j<4;j++)sample('electric_guitar_clean',arp[j],at+j*beat+.02,2.7,.075*warm*ending,j%2?.32:-.32);
 const [a,c]=melody[b];sample('electric_guitar_clean',a,at+.12,2.1,.115*ending,-.08);
 if(b%4!==3)sample('electric_guitar_clean',c,at+beat*2.35,2,.087*ending,.1);
 if(b>=3&&b%2===1)bell(a+12,at+.14,3.2,.018,.42);
}
// A held final chord and natural hall decay; the cue does not loop its opening.
for(const [i,note]of [41,53,57,60,64].entries())pad(note,46.7,5.8,.032,(-2+i)*.22);
const dryL=left.slice(),dryR=right.slice();
for(const [delay,gain]of [[.071,.14],[.139,.12],[.229,.1],[.367,.085],[.541,.064],[.773,.045],[1.071,.027]]){
 const offset=Math.round(delay*SR);for(let i=offset;i<length;i++){left[i]+=dryR[i-offset]*gain;right[i]+=dryL[i-offset]*gain;}
}
let peak=0;for(let i=0;i<length;i++){
 const fade=Math.min(1,i/(SR*1.6),(length-1-i)/(SR*2.5));left[i]*=fade;right[i]*=fade;peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));
}
const gain=.74/peak,buffer=Buffer.alloc(44+length*4);buffer.write('RIFF');buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(2,22);buffer.writeUInt32LE(SR,24);buffer.writeUInt32LE(SR*4,28);buffer.writeUInt16LE(4,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(length*4,40);
let power=0;for(let i=0;i<length;i++){const l=left[i]*gain,r=right[i]*gain;buffer.writeInt16LE(Math.round(l*32767),44+i*4);buffer.writeInt16LE(Math.round(r*32767),46+i*4);power+=l*l+r*r;}
const file=path.resolve(__dirname,'../static/adventure/assets/beyond-the-mist-v1.wav');fs.writeFileSync(file,buffer);console.log(JSON.stringify({file,seconds:duration,bytes:buffer.length,peak:.74,rms:Math.sqrt(power/(length*2))}));
