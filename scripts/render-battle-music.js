'use strict';
// Original electronic-rock battle cue; original melody, not an M3 transcription.
// Guitar/bass samples: FluidR3 GM (CC BY 3.0), see assets/AUDIO_CREDITS.md.
// All other instruments are synthesized here. Rendering is entirely offline.
// Deterministic, circular synthesis keeps both the music and room tail seamless.
const fs=require('node:fs'),path=require('node:path');
const SR=22050, beat=60/140, bar=beat*4, bars=32, duration=bar*bars, length=Math.round(duration*SR);
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
  }else if(voice==='kick'){
   const phase=2*Math.PI*(47*t+92*(1-Math.exp(-t*38))/38);
   y=(Math.sin(phase)*Math.exp(-t*9)+(random()*2-1)*Math.exp(-t*100)*.22)*Math.min(t/.0015,1,tail/.03);
  }else if(voice==='snare'){
   const noise=random()*2-1;breath=breath*.78+noise*.22;
   y=((noise-breath)*.72*Math.exp(-t*17)+.4*Math.sin(2*Math.PI*185*t)*Math.exp(-t*27)+.17*Math.sin(2*Math.PI*317*t)*Math.exp(-t*32))*Math.min(t/.001,1,tail/.035);
  }else if(voice==='hat'||voice==='crash'){
   const noise=random()*2-1;breath=breath*.65+noise*.35;
   const metallic=Math.sin(2*Math.PI*4117*t)*Math.sin(2*Math.PI*5383*t)*.2;
   y=((noise-breath)*.72+metallic)*Math.exp(-t*(voice==='hat'?65:4.5))*Math.min(t/.001,1,tail/.045);
  }else if(voice==='synth'){
   const phase=2*Math.PI*frequency*t;
   y=(Math.sin(phase+.9*Math.sin(phase*2)*Math.exp(-t*3))+.25*Math.sin(phase*2))*.6;
   y*=Math.min(t/.015,1,tail/.08)*Math.exp(-t*1.9);
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
// One coherent 32-bar D-minor theme, with four-bar harmonic spans.
const roots=[38,34,41,36,38,34,36,33],thirds=[3,4,4,4,3,4,4,4];
const heroicTheme=[62,65,69,74,70,69,65,62,65,69,72,77,76,74,72,67,74,72,69,65,70,69,65,62,64,67,72,76,73,71,69,61];
const theme=heroicTheme.filter((_,i)=>i%2===0);
const sampleFolder=path.join(__dirname,'audio-samples/fluidr3'),sampleManifest=JSON.parse(fs.readFileSync(path.join(sampleFolder,'manifest.json'),'utf8'));
const packs={};
for(const [name,pack]of Object.entries(sampleManifest.packs))packs[name]=pack.notes.map(note=>{
 const b=fs.readFileSync(path.join(sampleFolder,note.file));let offset=12,dataOffset=0,bytes=0;
 while(offset+8<=b.length){const id=b.toString('ascii',offset,offset+4),size=b.readUInt32LE(offset+4);if(id==='data'){dataOffset=offset+8;bytes=size;break;}offset+=8+size+(size%2);}
 if(!dataOffset||bytes%2||dataOffset+bytes>b.length)throw Error('Invalid sample WAV: '+note.file);
 const data=new Float32Array(bytes/2);let peak=0;for(let i=0;i<data.length;i++){data[i]=b.readInt16LE(dataOffset+i*2)/32768;peak=Math.max(peak,Math.abs(data[i]));}
 for(let i=0;i<data.length;i++)data[i]*=.78/Math.max(peak,.01);
 return {midi:note.midi,data};
});
function sampled(instrument,midi,at,seconds,level,pan=0,muted=false,detune=0){
 const available=packs[instrument],source=available.reduce((a,b)=>Math.abs(b.midi-midi)<Math.abs(a.midi-midi)?b:a),ratio=2**((midi+detune-source.midi)/12);
 const start=Math.round(at*SR),n=Math.round(seconds*SR),l=Math.sqrt((1-pan)/2),r=Math.sqrt((1+pan)/2);
 for(let i=0;i<n;i++){
  const position=i*ratio,index=Math.floor(position);if(index+1>=source.data.length)break;
  const fraction=position-index,t=i/SR;
  const envelope=Math.min(t/.004,1,Math.max(0,seconds-t)/.035)*(muted?Math.exp(-t*9):1);
  const y=(source.data[index]*(1-fraction)+source.data[index+1]*fraction)*level*envelope,frame=((start+i)%length+length)%length;
  left[frame]+=y*l;right[frame]+=y*r;
 }
}
function powerChord(root,at,seconds,level,muted=true){
 for(const [pan,lag,detune]of [[-.68,-.006,-.035],[.68,.006,.035]])for(const [semitones,gain]of [[0,1],[7,.62],[12,.22]])sampled('overdriven_guitar',root+semitones,at+lag,seconds,level*gain,pan,muted,detune);
}
function legato(notes,beatsPerNote,level,pan,octave=0,voice='strings'){
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
  let y=0;for(let h=1;h<=6;h++){
   const color=voice==='brass'?Math.exp(-h/2.6)/Math.sqrt(h):Math.exp(-h/2.7)/h;
   y+=(Math.sin(phase*h+vibrato)+Math.sin(phase*h-vibrato+.4)*.27)*color;
  }
  const bow=.86+.09*Math.sin(2*Math.PI*time/(bar*2))+.05*Math.sin(2*Math.PI*time/(bar*4));
  left[i]+=y*bow*level*l;right[i]+=y*bow*level*r;
 }
}
legato(roots,16,.064,-.15);legato(theme,8,.025,.12,-12);
for(let b=0;b<bars;b++){
 const at=b*bar,block=Math.floor(b/4),root=roots[block],arpeggio=[root+12,root+19,root+24,root+12+thirds[block]];
 for(let step=0;step<8;step++)sampled('electric_guitar_clean',arpeggio[[0,1,2,1,0,3,2,1][step]],at+step*beat/2,beat*1.2,.062,step%2?.28:-.28);
 for(const step of [0,1.5,2.75])sampled('electric_bass_pick',root-12,at+step*beat,beat*.85,.13,0,true);
 add(38,at,.42,.23,'kick');add(38,at+beat*2.75,.4,.16,'kick');add(60,at+beat*2,.27,.1,'snare');
 for(const step of [0,1,2,3])add(60,at+step*beat,.085,.026,'hat',.25);
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
// Same bar count, tempo, harmony and loop length in every health arrangement.
// Middle health introduces hope without changing the original melodic contour.
left.fill(0);right.fill(0);
// This is now a complete middle-health cue. Bass, kick and a quiet harmonic bed
// replace the old dependency on playing the opening arrangement underneath it.
legato(roots,16,.036,-.15);
for(let b=0;b<bars;b++){
 const root=roots[Math.floor(b/4)],at=b*bar;
 for(const step of [0,1.5,2.75])sampled('electric_bass_pick',root-12,at+step*beat,beat*.85,.13,0,true);
 for(const step of [0,2.75])add(38,at+step*beat,.4,.2,'kick');
 for(const step of [0,.75,1.5,2.5,3])powerChord(root+12,at+step*beat,beat*.6,.085);
 for(const step of [.5,1.5,2.5,3.5])add(60,at+step*beat,.085,.028,'hat',.25);
 sampled('electric_guitar_clean',heroicTheme[b],at,beat*3.7,.1,.08);
 add(60,at+beat*1,.26,.1,'snare');add(60,at+beat*3,.26,.1,'snare');
}
writeTrack('mist-bridge-tension.wav',false,.64);
left.fill(0);right.fill(0);
// A single broad rising variation replaces the oppressive bed at low health.
// Four-bar harmonic spans remain identical so mid-phrase transitions still fit.
legato(roots,16,.024,-.2);
for(let b=0;b<bars;b++){
 const root=roots[Math.floor(b/4)],at=b*bar;
 // Rhythm guitar and bass share the same riff; the lead remains one clear line.
 for(const [step,lengthInBeats]of [[0,.6],[.75,.45],[1.5,.6],[2.5,.4],[3,.8]])powerChord(root+12,at+step*beat,beat*lengthInBeats,.115,b%4!==3);
 for(let step=0;step<8;step++)sampled('electric_bass_pick',root-12+(step===7?7:0),at+step*beat/2,beat*.43,.15,0,true);
 const note=heroicTheme[b],next=heroicTheme[(b+1)%heroicTheme.length],long=b%4===3;
 sampled('overdriven_guitar',note,at,beat*(long?3.75:2.7),.21,-.06);
 sampled('electric_guitar_clean',note,at+.012,beat*(long?3.75:2.7),.07,.2);
 if(!long)sampled('overdriven_guitar',next,at+beat*3.1,beat*.8,.16,-.06);
 // A restrained electronic echo reinforces the theme instead of a second solo.
 for(const step of [0,1.5,2.5])add(note,at+step*beat,beat*.55,.025,'synth',.34);
 for(const step of [0,1.5,2,2.75])add(38,at+step*beat,.4,.23,'kick');
 for(const step of [1,3])add(60,at+step*beat,.26,.19,'snare');
 for(let step=0;step<8;step++)add(60,at+step*beat/2,.08,.032*(step%2?.75:1),'hat',.25);
 if(b%8===0)add(60,at,1.3,.065,'crash',-.25);
}
writeTrack('mist-bridge-last-stand.wav',false,.78);
