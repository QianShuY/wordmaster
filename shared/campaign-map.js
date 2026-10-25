(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./campaign-route'):root.MociCampaignRoute);if(typeof module==='object'&&module.exports)module.exports=api;else root.MociCampaignMap=api;})(typeof globalThis!=='undefined'?globalThis:this,function(R){
 'use strict';
 // Intermediate landmarks follow the painted road rather than joining flags with straight lines.
 const bends=[[[15,84],[19,86]],[[28,85],[32,82]],[[43,80],[48,81]],[[60,78],[64,74]],[[72,67],[71,64]],[[64,59],[59,57]],[[48,56],[43,56]],[[30,53],[25,47]],[[29,39],[33,34]],[[43,26],[48,23]],[[58,24],[63,26]],[[74,29],[77,34]],[[82,34],[83,24],[86,19]]];
 const point=p=>`${+(p[0]*10).toFixed(1)} ${+(p[1]*6.67).toFixed(1)}`;
 function curve(points){let d='M'+point(points[0]);for(let i=1;i<points.length-1;i++){const a=points[i],b=points[i+1];d+=` Q${point(a)} ${point([(a[0]+b[0])/2,(a[1]+b[1])/2])}`;}return d+' L'+point(points.at(-1));}
 const legs=bends.map((middle,i)=>curve([[R.stages[i].x,R.stages[i].y],...middle,[R.stages[i+1].x,R.stages[i+1].y]]));
 const regions=[{from:1,to:3,name:'低地邮路',subtitle:'灯火之后，是尚未写下的远方。',trial:'辨认旧信',mode:'meaning',words:3},{from:4,to:6,name:'河湾与渡口',subtitle:'让记起的言语，成为脚下的渡石。',trial:'渡石咒文',mode:'spelling',words:3},{from:7,to:10,name:'暮色古林',subtitle:'林中有回声，也有遗落的句子。',trial:'回声试炼',mode:'mixed',words:3},{from:11,to:14,name:'迷雾高地',subtitle:'风开始收紧，灯火仍在前方。',trial:'山门铭文',mode:'spelling',words:4}];
 const region=id=>regions.find(r=>id>=r.from&&id<=r.to)||regions[0];
 function view(completed,todayCleared=false,bossAvailable=false,preview=false){
  const done=Math.max(0,Math.min(14,Math.floor(Number(completed)||0))),current=Math.min(14,done+1);
  return {done,current,traveler:Math.max(1,Math.min(14,done)),region:region(current),
   visible:R.stages.filter(s=>preview||s.id<=Math.min(13,done+2)||s.id===14&&done>=13),
   walked:legs.slice(0,Math.max(0,done-1)).join(' '),next:done>0&&done<14?legs[done-1]:'',
   // The final leg itself stays concealed until the traveler reaches the last ordinary stage.
   hinted:preview?legs.join(' '):legs.slice(Math.max(0,done),Math.min(12,done+1)).join(' '),
   holes:R.stages.slice(0,Math.min(14,done+1)).map(s=>({x:s.x*10,y:s.y*6.67,r:s.id<=done?110:96})),
   waiting:R.status(current,done,todayCleared,bossAvailable)==='waiting'};
 }
 return {legs,regions,region,view};
});
