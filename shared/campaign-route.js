(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MociCampaignRoute=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const stages=[
  ['旧邮亭','落笔启程',10,81,'信上的文字已经褪去。先完成今天的学习，把第一句话带上路。'],
  ['落叶小径','低地与果园',23,85,'风把落叶送上小路。记起的词，够你稳稳走过今天这一程。'],
  ['旧风车','低地与果园',37,79,'风车已经停转，叶片仍指着河的方向。'],
  ['芦苇河湾','渡过水流',53,80,'沿着河湾往上游走，先找一处可以落脚的浅水。'],
  ['石阶渡口','渡过水流',69,70,'一块一块踩稳石头，不必急着走到对岸。'],
  ['听水山径','向林地前行',70,61,'身后的水声渐远，林地已经近在眼前。'],
  ['残塔林口','林地深处',54,56,'残塔的影子指向森林。别忘了回头温习走过的词。'],
  ['渡火小路','林地深处',37,57,'营火就在路边。合上手账，再试一次回忆。'],
  ['林中遗祠','林地深处',22,40,'遗祠没有碑文。你已经能替它记住一些失落的字。'],
  ['回折山道','登上高地',37,29,'小路转了几道弯，来时的河湾终于留在脚下。'],
  ['古门山口','登上高地',54,21,'穿过这道古门，路的另一端开始有了形状。'],
  ['断渠长廊','最后的旅程',67,28,'沿着断裂的水渠前行。这里曾经有人，把远方写成故事。'],
  ['临雾崖道','最后的旅程',78,39,'桥在雾里，灯火还在。到营地歇一歇，准备最后的咒语。'],
  ['雾桥守卫','章节 Boss',89,15,'让你一路记住的英语，替你打开道路。']
 ].map((a,i)=>({id:i+1,name:a[0],region:a[1],x:a[2],y:a[3],story:a[4],boss:i===13}));
 function status(id,completed,todayCleared=false,bossAvailable=false){if(id<=completed)return 'passed';if(id===completed+1)return todayCleared||id===14&&!bossAvailable?'waiting':'current';return 'locked';}
 return {stages,status};
});
