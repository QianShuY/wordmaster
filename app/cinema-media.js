'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {binary}=require('./cinema-engine');
function execute(name,args,{signal,onProgress}={}){return new Promise((resolve,reject)=>{
 const child=spawn(binary(name),args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let out='',err='',settled=false;
 const abort=()=>child.kill();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 child.stdout.on('data',b=>{const s=b.toString();if(onProgress)onProgress(s);else{out+=s;if(out.length>8*1024*1024)child.kill();}});child.stderr.on('data',b=>{err=(err+b.toString()).slice(-3000);});
 child.once('error',()=>{settled=true;signal?.removeEventListener('abort',abort);reject(Error('缺少影片处理组件，请安装完整桌面版本'));});
 child.once('close',code=>{if(settled)return;signal?.removeEventListener('abort',abort);if(signal?.aborted)return reject(new DOMException('已暂停','AbortError'));if(code!==0)return reject(Error('影片处理失败：'+err.slice(-400)));resolve(out);});
 });}
function cuesFromSrt(text){const cues=[];for(const block of text.replace(/^\ufeff/,'').replace(/\r/g,'').trim().split(/\n\s*\n/)){const lines=block.split('\n'),i=lines.findIndex(s=>s.includes('-->'));if(i<0)continue;const m=lines[i].match(/^(\d{2,}:\d{2}:\d{2}[,.]\d{3}) --> (\d{2,}:\d{2}:\d{2}[,.]\d{3})/);if(!m)throw Error('字幕时间格式无效');const sec=s=>{const [h,m,t]=s.replace(',','.').split(':').map(Number);return h*3600+m*60+t;};const start=sec(m[1]),end=sec(m[2]);if(end<=start||end>864000)throw Error('字幕时间无效');const clean=lines.slice(i+1).map(s=>s.replace(/<[^>]*>|\{\\[^}]*\}/g,'').trim()).filter(Boolean);const english=clean.filter(s=>!/[\u3400-\u9fff]/u.test(s)).join(' '),translation=clean.filter(s=>/[\u3400-\u9fff]/u.test(s)).join(' ');if(!english&&!translation)continue;if(english.length+translation.length>4000)throw Error('字幕单句过长');cues.push({id:String(cues.length),start,end,text:english,translation});if(cues.length>5000)throw Error('字幕条数过多');}if(!cues.length)throw Error('没有可读取的文字字幕');return cues.sort((a,b)=>a.start-b.start).map((c,i)=>({...c,id:String(i)}));}
function mergeCues(en,zh){const used=new Set();const cues=en.map(e=>({...e,translation:e.translation||[...new Set(zh.flatMap((c,i)=>{const overlap=Math.min(e.end,c.end)-Math.max(e.start,c.start);if(c.translation&&overlap>.1&&overlap/Math.min(e.end-e.start,c.end-c.start)>=.3){used.add(i);return [c.translation];}return [];}))].join(' ')}));zh.forEach((c,i)=>{if(!used.has(i))cues.push({...c,text:''});});return cues.sort((a,b)=>a.start-b.start).map((c,i)=>({...c,id:String(i)}));}
function chooseTracks(streams){
 const audio=streams.find(s=>s.codec_type==='audio'&&/^(eng|en)$/i.test(s.tags?.language||''));
 const subtitles=streams.filter(s=>s.codec_type==='subtitle'&&['subrip','ass','ssa','webvtt','mov_text','text'].includes(s.codec_name));
 const english=subtitles.find(s=>/^(eng|en)$/i.test(s.tags?.language||'')&&!/forced|sdh/i.test(s.tags?.title||''))||subtitles.find(s=>/^(eng|en)$/i.test(s.tags?.language||'')&&!/forced/i.test(s.tags?.title||''));
 const chinese=subtitles.find(s=>/^(chi|zho|zh|zh-cn|zh-hans)$/i.test(s.tags?.language||'')&&/simplified|简|hans/i.test(`${s.tags?.title||''} ${s.tags?.language||''}`));
 return {audio,english,chinese};
}
async function prepareMedia(source,dir,{signal,onProgress=()=>{}}={}){
 const metadata=JSON.parse(await execute('ffprobe',['-v','error','-show_streams','-show_format','-of','json',source],{signal}));
 const {audio,english,chinese}=chooseTracks(metadata.streams||[]);if(!audio)throw Error('没有明确标注的英语音轨。已保留下载文件，请换英语原声版本。');
 const video=metadata.streams.find(s=>s.codec_type==='video');if(!video)throw Error('资源中没有视频轨道');
 const final=path.join(dir,'playback.mp4'),temporary=path.join(dir,'playback.partial.mp4');
 const codec=video.codec_name,copy=['h264','hevc'].includes(codec),duration=Number(metadata.format?.duration)||0;
 onProgress({message:copy?'正在整理英语音轨':'正在转换为可播放的视频',progress:0});
 await execute('ffmpeg',['-v','error','-nostdin','-y','-i',source,'-map',`0:${video.index}`,'-map',`0:${audio.index}`,...(copy?['-c:v','copy']:['-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p']),'-c:a','aac','-b:a','160k',...(codec==='hevc'?['-tag:v','hvc1']:[]),'-movflags','+faststart','-progress','pipe:1','-nostats',temporary],{signal,onProgress:text=>{const m=[...text.matchAll(/out_time_us=(\d+)/g)].at(-1);if(m&&duration)onProgress({progress:Math.min(.95,Number(m[1])/1000000/duration)});}});
 signal?.throwIfAborted();fs.renameSync(temporary,final);
 let en=[],zh=[];
 for(const [track,file,lang] of [[english,'english.srt','en'],[chinese,'chinese.srt','zh']])if(track){const target=path.join(dir,file);await execute('ffmpeg',['-v','error','-nostdin','-y','-i',source,'-map',`0:${track.index}`,'-c:s','srt',target],{signal});if(fs.statSync(target).size>2*1024*1024)throw Error('字幕过大，已保留视频');const cues=cuesFromSrt(fs.readFileSync(target,'utf8'));if(lang==='en')en=cues;else zh=cues;}
 const cues=en.length?mergeCues(en,zh):zh;
 fs.writeFileSync(path.join(dir,'captions.json'),JSON.stringify(cues));
 return {duration,cues:!!cues.length,bilingual:!!en.length&&!!zh.length,message:!en.length?'没有找到英文文字字幕，请添加双语字幕后观看':!zh.length?'已提取英文字幕，未找到简中字幕；可添加双语字幕':'英语音轨与双语字幕已就绪'};
}
module.exports={execute,chooseTracks,cuesFromSrt,mergeCues,prepareMedia};
