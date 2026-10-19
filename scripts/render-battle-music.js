'use strict';
// Original D-minor/Dorian battle miniature. No external recordings or samples.
// Deterministic, circular synthesis keeps both the music and room tail seamless.
const fs=require('node:fs'),path=require('node:path');
const SR=22050, beat=60/94, bar=beat*4, duration=bar*24, length=Math.round(duration*SR);
const left=new Float64Array(length),right=new Float64Array(length);
let seed=4187;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function add(midi,at,seconds,level,voice,pan=0){
 const frequency=440*2**((midi-69)/12),start=Math.round(at*SR),n=Math.round(seconds*SR);
 const l=Math.sqrt((1-pan)/2),r=Math.sqrt((1+pan)/2);
 for(let i=0;i<n;i++){
  const t=i/SR,tail=Math.max(0,seconds-t);let y;
  if(voice==='drum')y=Math.sin(2*Math.PI*(48*t+26*(1-Math.exp(-t*18))/18))*Math.exp(-t*9)+(random()*2-1)*Math.exp(-t*38)*.22;
  else if(voice==='frame')y=((random()*2-1)*.5+Math.sin(2*Math.PI*143*t)*.3)*Math.exp(-t*21);
  else if(voice==='lute'){
   y=0;for(let h=1;h<=6;h++)y+=Math.sin(2*Math.PI*frequency*h*t+h*.17)*Math.exp(-t*(2.5+h*.9))/h**1.65;
   y*=Math.min(t/.006,1,tail/.08);
  }else{
   const swell=voice==='horn'?.11:.22,phase=2*Math.PI*frequency*(t+.00012*Math.sin(2*Math.PI*4.2*t));
   y=Math.sin(phase)+.27*Math.sin(phase*2)+.14*Math.sin(phase*3)+.08*Math.sin(phase*5);
   if(voice==='strings')y+=.22*Math.sin(phase*1.002);
   y*=Math.min(t/swell,1,tail/.18)*(.87+.13*Math.sin(Math.PI*t/seconds));
  }
  const index=(start+i)%length;left[index]+=y*level*l;right[index]+=y*level*r;
 }
}
const chords=[[50,57,62,65],[46,53,58,62],[48,55,60,64],[45,52,57,61],
 [50,57,62,65],[43,50,58,62],[46,53,58,62],[45,52,57,61]];
const melody=[[[69,0,1.5],[74,2,1.5]],[[77,0,2],[74,2.5,1]],[[76,0,1],[72,1.5,1],[67,3,1]],[[69,0,3]],
 [[74,0,1],[76,1.5,.5],[77,2,1.5]],[[79,0,2],[77,2.5,1]],[[74,0,1.5],[70,2,1.5]],[[73,0,2],[69,2.5,1]]];
for(let b=0;b<24;b++){
 const at=b*bar,chord=chords[b%8],intensity=b>=8&&b<20?1:.76;
 for(let step=0;step<8;step++)add(chord[[0,2,1,2,0,3,1,2][step]],at+step*beat/2,beat*.9,.057*intensity,'lute',step%2?.32:-.32);
 add(chord[0]-12,at,bar*.92,.052,'strings',-.16);
 for(const tone of [chord[1],chord[3]])add(tone,at,bar*.88,.019*intensity,'strings',.26);
 add(38,at,.65,.14*intensity,'drum',-.07);add(38,at+beat*2,.55,.095*intensity,'drum',.07);
 for(const step of [1,3,3.5])add(60,at+beat*step,.18,.035*intensity,'frame',.2);
 if(b>=4&&b<22)for(const [tone,step,len]of melody[b%8])add(tone,at+step*beat,len*beat*.92,.053*intensity,'horn',-.12);
}
// Circular early reflections, with stereo crossfeed; no abrupt end-of-file fade.
const dryL=left.slice(),dryR=right.slice();
for(const [delay,gain]of [[.071,.17],[.143,.12],[.293,.08],[.461,.04]]){
 const offset=Math.round(delay*SR);for(let i=0;i<length;i++){const j=(i+offset)%length;left[j]+=dryR[i]*gain;right[j]+=dryL[i]*gain;}
}
function writeTrack(filename,mono=false,ceiling=.78){
 let peak=0,power=0;for(let i=0;i<length;i++){peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));power+=left[i]**2+right[i]**2;}
 const gain=ceiling/peak,channels=mono?1:2,align=channels*2,buffer=Buffer.alloc(44+length*align);
 buffer.write('RIFF');buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(channels,22);buffer.writeUInt32LE(SR,24);buffer.writeUInt32LE(SR*align,28);buffer.writeUInt16LE(align,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(length*align,40);
 for(let i=0;i<length;i++){if(mono)buffer.writeInt16LE(Math.round((left[i]+right[i])*.5*gain*32767),44+i*2);else{buffer.writeInt16LE(Math.round(left[i]*gain*32767),44+i*4);buffer.writeInt16LE(Math.round(right[i]*gain*32767),46+i*4);}}
 const target=path.resolve(__dirname,'../static/adventure/assets/'+filename);fs.writeFileSync(target,buffer);
 console.log(JSON.stringify({target,seconds:length/SR,bytes:buffer.length,peak:ceiling,rms:Math.sqrt(power/(length*2))*gain}));
}
writeTrack('letters-at-the-mist-bridge.wav');
// Synchronized additive stems: identical bar count, tempo, key and loop length.
// Silent until the corresponding health threshold; these are not faster replays.
left.fill(0);right.fill(0);
for(let b=0;b<24;b++){
 const chord=chords[b%8],at=b*bar;
 for(let step=0;step<8;step++){add(chord[step%2?2:0]-12,at+step*beat/2,beat*.42,.075,'strings');if(step%2===0)add(38,at+step*beat/2,.4,.14,'drum');else add(60,at+step*beat/2,.13,.045,'frame');}
 add(chord[1],at,bar*.8,.025,'horn');
}
writeTrack('mist-bridge-tension.wav',true,.53);
left.fill(0);right.fill(0);
for(let b=0;b<24;b++){
 const chord=chords[b%8],at=b*bar;
 for(let step=0;step<16;step++){add(chord[[2,3,2,1][step%4]]+12,at+step*beat/4,beat*.32,.04,'lute');if(step%4===3)add(60,at+step*beat/4,.11,.04,'frame');}
 for(const step of [0,1.5,2,3.5])add(38,at+step*beat,.35,.12,'drum');
 if(b%2===0){add(chord[2]+12,at,beat*1.3,.05,'horn');add(chord[3]+12,at+beat*2,beat*1.3,.045,'horn');}
}
writeTrack('mist-bridge-last-stand.wav',true,.47);
