'use strict';
// Original single-shot effects: air movement, contact, resonant body and debris.
// All samples are synthesized here, with no third-party sound recordings.
const fs=require('node:fs'),path=require('node:path');
const SR=22050,out=path.resolve(__dirname,'../static/adventure/assets');
const specs={ink:{duration:.72,contact:.2},break:{duration:1.25,contact:.28},defend:{duration:.86,contact:.18},wound:{duration:.54,contact:.025},slam:{duration:1.3,contact:.3},sweep:{duration:.85,contact:.3},storm:{duration:1.65,contact:.3}};
for(const [name,spec]of Object.entries(specs)){
 const length=Math.round(spec.duration*SR),left=new Float64Array(length),right=new Float64Array(length);let seed=7919+Object.keys(specs).indexOf(name)*273;
 const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)*2-1;
 function layer(at,seconds,level,pan,fn){const start=Math.round(at*SR),n=Math.round(seconds*SR);for(let i=0;i<n&&start+i<length;i++){const t=i/SR,y=fn(t,seconds)*level,p=typeof pan==='function'?pan(t/seconds):pan;left[start+i]+=y*Math.sqrt((1-p)/2);right[start+i]+=y*Math.sqrt((1+p)/2);}}
 function noise(at,seconds,level,pan,decay,cut=.32,rise=.003){let low=0;layer(at,seconds,level,pan,(t,d)=>{low+=(random()-low)*cut;return low*Math.min(1,t/rise,(d-t)/.025)*Math.exp(-t*decay);});}
 function body(at,frequency,level,seconds=.4){layer(at,seconds,level,0,(t,d)=>{const phase=2*Math.PI*(frequency*t+frequency*.32*(1-Math.exp(-t*24))/24);return (Math.sin(phase)+.32*Math.sin(phase*2.03)+.12*Math.sin(phase*3.27))*Math.exp(-t*9)*Math.min(t/.003,1,(d-t)/.05);});}
 function metal(at,level){[467,731,1139,1723,2461].forEach((f,i)=>layer(at,.56,level/(1+i*.7),i%2?.24:-.24,(t,d)=>Math.sin(2*Math.PI*f*t)*Math.exp(-t*(9+i*4))*Math.min(t/.002,1,(d-t)/.05)));}
 function whoosh(seconds,level){let low=0;layer(0,seconds,level,p=>-.75+1.35*p,(t,d)=>{low+=(random()-low)*(.08+.38*t/d);return low*Math.sin(Math.PI*t/d)**1.4;});}
 const contact=spec.contact;
 if(name==='ink'){
  whoosh(contact,.44);body(contact,87,.78,.44);noise(contact,.12,.75,.12,35,.6);noise(contact+.025,.32,.32,.28,13,.3);metal(contact+.008,.085);
 }else if(name==='break'){
  whoosh(contact,.37);body(contact,53,.9,.65);noise(contact,.25,.95,0,19,.48);metal(contact+.005,.12);
  for(const [i,delay]of [.025,.069,.118,.193,.287,.41,.57].entries()){noise(contact+delay,.07,.47*Math.exp(-i*.3),i%2?.65:-.65,38,.65);noise(contact+delay,.22,.12*Math.exp(-i*.25),i%2?.45:-.45,15,.18);}
 }else if(name==='defend'){
  whoosh(contact,.22);body(contact,138,.48,.3);noise(contact,.055,.68,0,55,.72);metal(contact,.29);noise(contact+.18,.16,.13,-.2,22,.3);
 }else if(name==='wound'){
  body(contact,79,.78,.4);noise(contact,.17,.7,-.35,22,.15);noise(contact+.035,.18,.17,-.35,15,.36);
 }else if(name==='slam'){
  whoosh(contact,.43);body(contact,46,1,.75);body(contact+.012,118,.3,.36);noise(contact,.3,.9,0,15,.32);
  for(let i=0;i<5;i++)noise(contact+.08+i*.105,.2,.24*Math.exp(-i*.35),i%2?.55:-.55,17,.28);
 }else if(name==='sweep'){
  whoosh(contact,.67);body(contact,95,.58,.4);noise(contact,.14,.47,-.45,25,.32);metal(contact,.095);
 }else if(name==='storm'){
  for(let i=0;i<11;i++)noise(i*.105,.31,.17+Math.sin(i/11*Math.PI)*.13,i%2?.65:-.65,8,.33,.035);
  body(contact,63,.49,.5);noise(contact,.2,.32,-.1,15,.22);
 }
 // Short early reflection glues contact and fragments together without a long wash.
 const dryL=left.slice(),dryR=right.slice();for(const [delay,gain]of [[.037,.11],[.081,.065]]){const offset=Math.round(delay*SR);for(let i=0;i+offset<length;i++){left[i+offset]+=dryR[i]*gain;right[i+offset]+=dryL[i]*gain;}}
 let rawPeak=0;for(let i=0;i<length;i++)rawPeak=Math.max(rawPeak,Math.abs(left[i]),Math.abs(right[i]));
 const buffer=Buffer.alloc(44+length*4),normal=.84/Math.tanh(1.4);buffer.write('RIFF');buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(2,22);buffer.writeUInt32LE(SR,24);buffer.writeUInt32LE(SR*4,28);buffer.writeUInt16LE(4,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(length*4,40);
 for(let i=0;i<length;i++){const tail=Math.min(1,(length-i)/(SR*.035)),l=Math.tanh(left[i]/rawPeak*1.4)*normal*tail,r=Math.tanh(right[i]/rawPeak*1.4)*normal*tail;buffer.writeInt16LE(Math.round(l*32767),44+i*4);buffer.writeInt16LE(Math.round(r*32767),46+i*4);}
 const file='impact-'+name+'-v1.wav';fs.writeFileSync(path.join(out,file),buffer);console.log(JSON.stringify({name,file,...spec,bytes:buffer.length}));
}
