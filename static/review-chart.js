(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const chart={rows:[],days:30,metric:'total',selected:null,
    load(rows){
      this.rows=rows;this.selected=null;
      $('#timelineRange').value=String(this.days);$('#timelineMetric').value=this.metric;
      $('#timelineRange').onchange=e=>{this.days=Number(e.target.value);this.selected=null;this.render();};
      $('#timelineMetric').onchange=e=>{this.metric=e.target.value;this.render();};
      $('#timelineDay').oninput=e=>this.choose(Number(e.target.value));
      this.render();
    },
    render(){
      this.data=window.WordMasterLearningContext.series(this.rows,this.days);
      const names={total:'作答次数',new_words:'新学词数',accuracy:'作答正确率'};
      const total=this.data.reduce((n,d)=>n+d.total,0),fresh=this.data.reduce((n,d)=>n+d.new_words,0),correct=this.data.reduce((n,d)=>n+d.correct,0);
      $('#timelineSummary').textContent=`${this.days} 天 · 作答 ${total} 次 · 新学 ${fresh} 词 · ${total?`作答正确率 ${Math.round(correct/total*100)}%`:'尚无作答正确率'}`;
      const max=this.metric==='accuracy'?100:Math.max(5,...this.data.map(d=>d[this.metric]||0));
      this.plotWidth=matchMedia('(max-width:720px)').matches?420:900;this.area=this.plotWidth-90;
      const x=i=>48+(i+.5)*this.area/this.days,y=v=>220-v/max*175;
      let svg=`<svg viewBox="0 0 ${this.plotWidth} 270" role="img" aria-label="近 ${this.days} 天${names[this.metric]}。用下方日期滑块查看逐日数据。"><title>${names[this.metric]}</title>`;
      for(let i=0;i<5;i++){const value=max*i/4;svg+=`<line x1="48" y1="${y(value)}" x2="${this.plotWidth-42}" y2="${y(value)}" class="timeline-grid"/><text x="38" y="${y(value)+4}" text-anchor="end" class="timeline-axis">${Math.round(value)}${this.metric==='accuracy'?'%':''}</text>`;}
      let previous=null;
      this.data.forEach((d,i)=>{
        const value=d[this.metric];const bx=x(i),by=y(value||0);
        if(this.metric==='accuracy'){
          if(value!==null){
            if(previous!==null)svg+=`<path d="M ${x(previous)} ${y(this.data[previous].accuracy)} L ${bx} ${by}" class="timeline-line"/>`;
            svg+=`<circle cx="${bx}" cy="${by}" r="4" class="timeline-point"/>`;previous=i;
          }else previous=null;
        }else svg+=`<rect x="${bx-Math.max(1,this.area/this.days*.3)}" y="${by}" width="${Math.max(2,this.area/this.days*.6)}" height="${Math.max(1,220-by)}" rx="2" class="timeline-bar ${this.metric==='new_words'?'is-new':''}"/>`;
        svg+=`<rect x="${bx-this.area/2/this.days}" y="30" width="${this.area/this.days}" height="195" fill="transparent" data-timeline-index="${i}"><title>${escape(d.day)} · ${names[this.metric]} ${value===null?'暂无':value}</title></rect>`;
        if(i===0||i===this.days-1||i%Math.ceil(this.days/5)===0)svg+=`<text x="${bx}" y="248" text-anchor="middle" class="timeline-axis">${d.day.slice(5).replace('-','/')}</text>`;
      });
      svg+='<line id="timelineCursor" y1="30" y2="224" class="timeline-cursor"/></svg>';
      $('#timelinePlot').innerHTML=svg;
      if(this.metric==='accuracy'?!total:!this.data.some(d=>d[this.metric]>0))$('#timelinePlot').insertAdjacentHTML('beforeend',`<p class="timeline-empty">${this.metric==='accuracy'?'尚无作答记录，正确率暂不绘制。':'从今天的一次学习开始，轨迹会慢慢长出来。'}</p>`);
      $('#timelineDay').max=String(this.days-1);
      this.choose(this.selected===null?this.days-1:Math.min(this.selected,this.days-1));
      $('#timelinePlot').querySelectorAll('[data-timeline-index]').forEach(node=>{
        node.onpointermove=()=>this.choose(Number(node.dataset.timelineIndex));
        node.onclick=()=>this.choose(Number(node.dataset.timelineIndex));
      });
    },
    choose(index){
      this.selected=index;const d=this.data[index];if(!d)return;
      $('#timelineDay').value=String(index);$('#timelineDay').setAttribute('aria-valuetext',`${d.day}，作答 ${d.total} 次，新学 ${d.new_words} 词`);
      const cursor=$('#timelineCursor');cursor.setAttribute('x1',48+(index+.5)*this.area/this.days);cursor.setAttribute('x2',48+(index+.5)*this.area/this.days);
      $('#timelineDetail').innerHTML=`<strong>${d.day}</strong><span>作答 <b>${d.total}</b> 次</span><span>答对 <b>${d.correct}</b> 次</span><span>新学 <b>${d.new_words}</b> 词</span><span>正确率 <b>${d.accuracy===null?'—':d.accuracy+'%'}</b></span>`;
    },
  };
  window.WordMasterReviewChart=chart;
  let resizeFrame;
  window.addEventListener('resize',()=>{
    cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(()=>{if($('#learningTimeline')?.getClientRects().length&&chart.data)chart.render();});
  });
})();
