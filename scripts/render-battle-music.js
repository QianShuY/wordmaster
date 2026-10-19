'use strict';
// Original continuous D-minor battle cue: one legato theme and one pulse grid.
// Health stems fill gaps in that same grid; they never introduce competing motifs.
// No external recordings or samples.
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
  }else{
   const phase=2*Math.PI*frequency*t,vibrato=.006*Math.sin(2*Math.PI*4.1*t+phaseOffset)*Math.min(t/.6,1);
   y=0;
   for(let h=1;h<=6;h++){
    const color=Math.exp(-h/2.7)/h;
    y+=color*(Math.sin(phase*h+vibrato*h+phaseOffset)+.27*Math.sin(phase*h*1.0023-vibrato*h*.8+phaseOffset*.6));
   }
   breath=breath*.8+(random()*2-1)*.2;y+=breath*.035;
   y*=Math.min(t/.035,1,tail/.085)*Math.exp(-t*2);
  }
  const index=(start+i)%length;left[index]+=y*level*l;right[index]+=y*level*r;
 }
}
// Four-bar harmonic spans, with a single 24-bar melodic arc. No per-bar fanfares.
const roots=[38,38,34,36,33,38],theme=[50,53,52,50,50,48,52,48,49,52,53,50];
function legato(notes,beatsPerNote,level,pan,octave=0){
 const l=Math.sqrt((1-pan)/2),r=Math.sqrt((1+pan)/2),span=beat*beatsPerNote;
 let phase=0,total=0;const steps=new Float64Array(length);
 for(let i=0;i<length;i++){
  const time=i/SR,segment=Math.floor(time/span)%notes.length,position=time%span;
  const previous=notes[(segment+notes.length-1)%notes.length]+octave,current=notes[segment]+octave;
  // Continuous phase and a short portamento connect each bow without a cut.
  const blend=Math.min(1,position/.11),midi=previous+(current-previous)*(blend*blend*(3-2*blend));
  steps[i]=2*Math.PI*(440*2**((midi-69)/12))/SR;total+=steps[i];
 }
 // Resolve the fractional oscillator cycle across the whole loop, not with a cut.
 const correction=(total-Math.round(total/(2*Math.PI))*2*Math.PI)/length,vibratoCycles=Math.round(duration*4.3);
 for(let i=0;i<length;i++){
  const time=i/SR;phase+=steps[i]-correction;
  const vibrato=.012*Math.sin(2*Math.PI*vibratoCycles*i/length);
  let y=0;for(let h=1;h<=6;h++)y+=(Math.sin(phase*h+vibrato)+Math.sin(phase*h-vibrato+.4)*.27)*Math.exp(-h/2.7)/h;
  const bow=.86+.09*Math.sin(2*Math.PI*time/(bar*2))+.05*Math.sin(2*Math.PI*time/(bar*4));
  left[i]+=y*bow*level*l;right[i]+=y*bow*level*r;
 }
}
legato(roots,16,.12,-.15);legato(roots.map(n=>n+7),16,.033,.26);
legato(theme,8,.086,.12);
for(let b=0;b<24;b++){
 const at=b*bar,root=roots[Math.floor(b/4)];
 for(const step of [0,2])add(root+12,at+step*beat,beat*.83,.036,'pulse',-.18);
 add(38,at,1.2,.19,'drum',-.06);add(38,at+beat*2,.9,.095,'drum',.06);
}
function writeTrack(filename,mono=false,ceiling=.78){
 // The same room on every stem helps new pulses blend into the existing cue.
 const dryL=left.slice(),dryR=right.slice();
 for(const [delay,gain]of [[.113,.13],[.241,.09],[.397,.06],[.631,.035]]){
  const offset=Math.round(delay*SR);for(let i=0;i<length;i++){const j=(i+offset)%length;left[j]+=dryR[i]*gain;right[j]+=dryL[i]*gain;}
 }
 let rawPeak=0;for(let i=0;i<length;i++)rawPeak=Math.max(rawPeak,Math.abs(left[i]),Math.abs(right[i]));
 // Gentle bus saturation keeps the bowed body audible under the drum transients.
 for(let i=0;i<length;i++){left[i]=Math.tanh(left[i]/rawPeak*1.15);right[i]=Math.tanh(right[i]/rawPeak*1.15);}
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
 const root=roots[Math.floor(b/4)],at=b*bar;
 for(const step of [1,3]){add(root+12,at+step*beat,beat*.83,.036,'pulse',-.18);add(38,at+step*beat,.75,.085,'drum',.06);}
}
writeTrack('mist-bridge-tension.wav',true,.43);
left.fill(0);right.fill(0);
for(let b=0;b<24;b++){
 const root=roots[Math.floor(b/4)],at=b*bar;
 for(const step of [.5,1.5,2.5,3.5])add(root+12,at+step*beat,beat*.52,.036,'pulse',-.18);
 // One quiet octave reinforcement of the SAME theme, not another tune.
}
legato(theme,8,.022,.12,12);
writeTrack('mist-bridge-last-stand.wav',true,.36);
