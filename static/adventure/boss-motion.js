(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MociBossMotion=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const states={
    idle:{label:'01 / 静候',intent:'静候 · 石印护盾',detail:'灯火平稳，石印未动。先看懂它的动作，再决定如何施法。',status:'守卫重新出现，石印护盾完整。',duration:0,next:null,seal:'雾桥'},
    charge:{label:'一式 / 举灯',intent:'即将横扫 · 提灯扫雾',detail:'守卫收灯蓄势，灯火照亮身前的薄雾。应对：词义辨识 → 格挡。',status:'提灯扫雾：举灯、收势，等待扫过桥面。',duration:3200,next:'attack',seal:'灯'},
    attack:{label:'一式 / 横扫',intent:'提灯扫雾 · 灯痕掠桥',detail:'暖色灯痕掠过石桥，薄雾被推向两侧。预览不扣除生命。',status:'提灯横扫，灯痕展开，雾气退开后慢慢回流。',duration:1000,next:'idle',seal:'扫'},
    sealCharge:{label:'二式 / 举盾',intent:'即将封路 · 石印封路',detail:'守卫沉下重心，石盾蓄势。应对：中文提示默写 → 击破封印。',status:'石印封路：沉肩、举盾蓄势，等待下砸。',duration:2200,next:'sealSlam',seal:'印'},
    sealSlam:{label:'二式 / 盾击',intent:'石印封路 · 墨裂蔓延',detail:'石盾砸向桥面，墨色裂痕沿石缝蔓延。',status:'石盾触地停顿，墨裂散开，石粉落下。',duration:1200,next:'sealed',seal:'封'},
    sealed:{label:'二式 / 封路',intent:'封印持续 · 等待默写破印',detail:'正式战斗中用英文默写破印。此处可点击「石印碎裂」预览破解。',status:'石印保持封路状态，可点击石印碎裂查看破解反馈。',duration:0,next:null,seal:'封'},
    stormCharge:{label:'三式 / 起势',intent:'第二阶段 · 残页风暴',detail:'残页渐渐浮起，向披风周围聚拢。应对：连续回忆两个不同单词 → 打断风暴。',status:'残页风暴：披风展开，破损纸页由慢至快聚拢。',duration:2600,next:'storm',seal:'风'},
    storm:{label:'三式 / 风暴',intent:'残页风暴 · 翻卷散落',detail:'带着字迹的残页翻卷袭来，风势过后，余页飘落桥面。',status:'残页翻卷爆发，近处纸片掠过，余页逐渐落下。',duration:3600,next:'idle',seal:'暴'},
    hit:{label:'04 / 受击',intent:'命中 · 石甲震颤',detail:'英文回忆命中时，墨光穿过雾气，守卫后退。',status:'墨光命中，石甲震颤。',duration:1100,next:'idle',seal:'应'},
    break:{label:'05 / 破盾',intent:'破盾 · 石印崩解',detail:'默写咒语击破石印。护盾消退，守卫露出破绽。',status:'石印碎裂，护盾消退，守卫进入破绽状态。',duration:1500,next:'exposed',seal:'破'},
    exposed:{label:'06 / 破绽',intent:'破绽 · 雾心显露',detail:'护盾已破，灯火暗下。这是继续进攻的时机。',status:'守卫维持破绽。可查看受击、退场，或重置演出。',duration:0,next:null,seal:'隙'},
    vanish:{label:'07 / 消散',intent:'道路重现 · 残页归风',detail:'石甲化为墨迹，残页归于风。桥的另一端，仍有下一封来信。',status:'守卫消散，道路显现。此处展示通关演出，不发放正式印章。',duration:2400,next:'cleared',seal:'通'},
    cleared:{label:'08 / 雾退',intent:'雾退 · 桥已显现',detail:'此场演出已结束。重置可再次查看守卫形象与动作。',status:'退场演出完成。可重置并再次预览。',duration:0,next:null,seal:'通'}
  };
  function create(){let state='idle',remaining=0,paused=false;return {
    get state(){return state;},get paused(){return paused;},get remaining(){return remaining;},
    trigger(name){if(!Object.hasOwn(states,name))return false;state=name;remaining=states[state].duration;return true;},
    pause(value){paused=Boolean(value);},
    advance(ms){if(paused||!Number.isFinite(ms)||ms<0)return false;let changed=false;let budget=ms;while(remaining>0&&budget>=remaining){budget-=remaining;const next=states[state].next;if(!next)break;state=next;remaining=states[state].duration;changed=true;}if(remaining>0)remaining-=budget;return changed;}
  };}
  return {states,create};
});
