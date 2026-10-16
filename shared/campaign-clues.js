(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MociCampaignClues=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const clues=[
  {at:2,title:'邮差留下的半句话',text:'旧邮亭的桌角刻着一行字：“桥那头的灯，已亮了许多年。”落款被雨水洗去了。'},
  {at:5,title:'河边拾得的铜片',text:'渡口的石缝里藏着一片旧铜，上面是一盏提灯的纹章。船夫见了，只说那不是寻常商旅的信物。'},
  {at:8,title:'营火旁的传闻',text:'有位旅人说，浓雾里曾传来翻书的声音；他喊了一声，那声音便停了。火光摇晃，再无人接话。'},
  {at:11,title:'山门上的旧誓',text:'风蚀的石壁尚存几字：“守此关者，须辨来客之言。”其余文字被藤蔓遮住，像在等人读懂。'},
  {at:13,title:'雾中递来的回信',text:'“若汝已行至此，便携所学之言前来。桥头一灯，为汝而候。”信纸尚温，却不见送信之人。'}
 ];
 const unlocked=completed=>clues.filter(c=>c.at<=Math.max(0,Number(completed)||0));
 function render(element,completed){
  const found=unlocked(completed),next=clues[found.length];
  element.replaceChildren();
  if(!found.length){const p=document.createElement('p');p.className='clue-empty';p.textContent='路上尚未拾得线索。先走过眼前的道路，有些故事只会向行路之人显露。';element.append(p);}
  for(const clue of found){const article=document.createElement('article'),tag=document.createElement('small'),h=document.createElement('h3'),p=document.createElement('p');tag.textContent=`第 ${clue.at} 关 · 拾得`;h.textContent=clue.title;p.textContent=clue.text;article.append(tag,h,p);element.append(article);}
  const sealed=document.createElement('p');sealed.className='clue-sealed';sealed.textContent=next?`下一封线索 · 走过第 ${next.at} 关后揭开`:'线索已齐。答案，留待亲自抵达雾桥。';element.append(sealed);
  return found.length;
 }
 return {clues,unlocked,render};
});
