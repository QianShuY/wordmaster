'use strict';
// Original dark orchestral battle cue: D pedal, Phrygian friction and low brass.
// No external recordings or samples. Pressure comes from orchestration, not gain.
// Deterministic, circular synthesis keeps both the music and room tail seamless.
const fs=require('node:fs'),path=require('node:path');
const SR=22050, beat=60/108, bar=beat*4, duration=bar*24, length=Math.round(duration*SR);
const left=new Float64Array(length),right=new Float64Array(length);
let seed=4187;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function add(midi,at,seconds,level,voice,pan=0){
 const frequency=440*2**((midi-69)/12),start=Math.round(at*SR),n=Math.round(seconds*SR);
 const l=Math.sqrt((1-pan)/2),r=Math.sqrt((1+pan)/2),phaseOffset=random()*6.28;
 let breath=0;
 for(let i=0;i<n;i++){
  const t=i/SR,tail=Math.max(0,seconds-t);let y;
  if(voice==='drum'){
   // Large skin drum: inharmonic membrane modes plus a short mallet transient.
   const phase=2*Math.PI*(43*t+31*(1-Math.exp(-t*22))/22);
   y=(Math.sin(phase)*Math.exp(-t*3.7)+.46*Math.sin(phase*1.59+.3)*Math.exp(-t*5.8)+.21*Math.sin(phase*2.14)*Math.exp(-t*8.2));
   y+=(random()*2-1)*Math.exp(-t*44)*.3;y*=Math.min(t/.003,1,tail/.12);
  }else if(voice==='frame'){
   breath=breath*.65+(random()*2-1)*.35;
   y=(breath*.6+Math.sin(2*Math.PI*172*t)*.45+Math.sin(2*Math.PI*271*t)*.16)*Math.exp(-t*15)*Math.min(t/.002,1,tail/.035);
  }
  else if(voice==='lute'){
   y=0;for(let h=1;h<=6;h++)y+=Math.sin(2*Math.PI*frequency*h*t+h*.17)*Math.exp(-t*(2.5+h*.9))/h**1.65;
   y*=Math.min(t/.006,1,tail/.08);
  }else{
   const swell=voice==='horn'?.085:voice==='pulse'?.024:.42;
   const phase=2*Math.PI*frequency*t,vibrato=.006*Math.sin(2*Math.PI*4.1*t+phaseOffset)*Math.min(t/.6,1);
   y=0;
   for(let h=1;h<=9;h++){
    const color=voice==='horn'?Math.exp(-h/3.1)/Math.sqrt(h):Math.exp(-h/4.8)/h;
    const bow=voice==='horn'?1:.5;
    y+=color*(Math.sin(phase*h+vibrato*h+phaseOffset)+bow*Math.sin(phase*h*1.0023-vibrato*h*.8+phaseOffset*.6));
   }
   breath=breath*.8+(random()*2-1)*.2;y+=breath*(voice==='horn'?.04:.1);
   y*=Math.min(t/swell,1,tail/(voice==='pulse'?.06:.28))*(voice==='pulse'?Math.exp(-t*3):.84+.16*Math.sin(Math.PI*t/seconds));
  }
  const index=(start+i)%length;left[index]+=y*level*l;right[index]+=y*level*r;
 }
}
const chords=[[38,45,50,53],[38,46,51,56],[38,43,50,55],[38,44,51,56],
 [38,45,50,53],[38,46,51,55],[38,44,50,56],[37,45,49,55]];
const motif=[[50,51,45],[50,48,44],[46,45,38],[49,46,37]];
for(let b=0;b<24;b++){
 const at=b*bar,chord=chords[b%8];
 add(chord[0]-12,at-.03,bar+1,.075,'strings',-.12);
 for(const tone of [chord[0],chord[1]])add(tone,at,bar*.96,.035,'strings',.23);
 // A repeated 3+3+2 ostinato; the threat is already present at full health.
 for(const [step,tone]of [[0,50],[1.5,50],[3,51],[3.5,45]])add(tone+(b%8===7?-1:0),at+step*beat,beat*.65,.075,'pulse',-.3);
 add(38,at,1.35,.25,'drum',-.08);add(38,at+beat*2.5,.8,.15,'drum',.13);
 for(const step of [1,2.75,3.5])add(60,at+beat*step,.27,.035,'frame',.28);
 if(b%2===0){const notes=motif[(b/2)%4];for(let i=0;i<notes.length;i++)add(notes[i],at+i*beat*1.25,beat*(i===2?1.4:.85),.095,'horn',i%2?.2:-.2);}
 if(b%4===3)add(chord[3],at+beat*2,bar*.8,.038,'strings',.35);
}
// Circular early reflections, with stereo crossfeed; no abrupt end-of-file fade.
const dryL=left.slice(),dryR=right.slice();
for(const [delay,gain]of [[.079,.16],[.173,.13],[.307,.1],[.491,.07],[.739,.04]]){
 const offset=Math.round(delay*SR);for(let i=0;i<length;i++){const j=(i+offset)%length;left[j]+=dryR[i]*gain;right[j]+=dryL[i]*gain;}
}
function writeTrack(filename,mono=false,ceiling=.78){
 let rawPeak=0;for(let i=0;i<length;i++)rawPeak=Math.max(rawPeak,Math.abs(left[i]),Math.abs(right[i]));
 // Gentle bus saturation keeps the bowed body audible under the drum transients.
 for(let i=0;i<length;i++){left[i]=Math.tanh(left[i]/rawPeak*1.7);right[i]=Math.tanh(right[i]/rawPeak*1.7);}
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
 for(let step=0;step<8;step++){add([50,50,51,50,45,50,51,44][step],at+step*beat/2,beat*.38,.08,'pulse',step%2?.3:-.3);if(step%2===0)add(38,at+step*beat/2,.65,.2,'drum');else add(60,at+step*beat/2,.2,.065,'frame');}
 add(chord[1],at,bar*.8,.07,'horn');add(chord[3],at+beat*1.5,bar*.6,.045,'strings');
}
writeTrack('mist-bridge-tension.wav',true,.58);
left.fill(0);right.fill(0);
for(let b=0;b<24;b++){
 const chord=chords[b%8],at=b*bar;
 for(let step=0;step<16;step++){add([62,63,62,57,62,63,56,57][step%8],at+step*beat/4,beat*.31,.06,'pulse',step%2?.3:-.3);if(step%4>=2)add(60,at+step*beat/4,.14,.065,'frame');}
 for(const step of [0,.75,1.5,2,2.75,3.5])add(38,at+step*beat,.55,.16,'drum');
 add(chord[2],at,beat*1.4,.1,'horn');add(chord[3],at+beat*1.5,beat*1.35,.085,'horn');add(chord[2]-1,at+beat*3,beat*.8,.09,'horn');
}
writeTrack('mist-bridge-last-stand.wav',true,.54);
