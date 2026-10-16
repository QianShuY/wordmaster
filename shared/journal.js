(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WordMasterJournal = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Each ordinary illustration belongs to exactly one collection chapter.
  // These chapters organize the album; they do not represent adventure progress.
  const chapters = [
    { id: 'distance', title: '山川与远行', subtitle: '把远方，收进这一页', cover: 'liriver',
      palettes: 'silk pompeii voyage aurora sahara liriver andes zelda eldenring monument sekiro godofwar bloodborne journey deathstranding witcher greatwave'.split(' ') },
    { id: 'discovery', title: '星空与发现', subtitle: '向世界，多问一个为什么', cover: 'pillars',
      palettes: 'tardigrade jellyfish ant whalefall quantum gravity entropy lightspeed portal theseus brainvat mobius klein godel goldenratio turing fermi olbers butterflyfx dunhuang pillars paleblue moonillusion'.split(' ') },
    { id: 'lamplight', title: '灯下生活', subtitle: '平凡的日子，也值得珍藏', cover: 'coffee',
      palettes: 'movable pixel savepoint tlou tetris moss coffee diner library stardew hollowknight ittakestwo cyberpunk undertale sisyphus butterflydream feitian starrynight sunflower'.split(' ') },
  ];
  function chapterFor(card) { return card.hidden ? null : chapters.find(c => c.palettes.includes(card.palette)) || null; }
  function summarize(cards) {
    return chapters.map(chapter => {
      const members = cards.filter(c => !c.hidden && chapter.palettes.includes(c.palette));
      const owned = members.filter(c => c.owned).length;
      const total = members.length;
      const complete = total > 0 && owned === total;
      const milestones = [...new Set([1, Math.ceil(total / 2), total])].filter(n => n > 0);
      const nextMilestone = milestones.find(n => n > owned) || null;
      return { ...chapter, total, owned, complete, nextMilestone,
        stamp: complete ? '成章' : owned >= Math.ceil(total / 2) && owned > 0 ? '渐丰' : owned > 0 ? '初藏' : '待启',
        milestoneNote: complete ? '整章集齐 · 纪念印章已获得' : `再收集 ${nextMilestone - owned} 张，${nextMilestone === total ? '获得成章印章' : nextMilestone === 1 ? '留下初藏印记' : '留下渐丰印记'}` };
    });
  }
  function previews(cards) {
    return chapters.flatMap(chapter => cards.filter(c => !c.hidden && !c.owned && chapter.palettes.includes(c.palette))
      .sort((a,b) => Number(b.palette===chapter.cover)-Number(a.palette===chapter.cover))
      .slice(0,2).map(c => c.palette));
  }
  function themeCopy(card, copy = {}) {
    if (!card) return { kicker:'墨词 · 每日手账', title:'每学一词，远行一步。', subtitle:'先温习旧知，再为今天添上新的一页。',
      plan:'01 / 长期方向 · STUDY PLAN', planNote:'', action:"02 / 当下任务 · TODAY'S ROUTE", actionTitle:'今天先做什么？' };
    const chapter = chapterFor(card)?.id;
    const variants = {
      distance: ['远行路线','把远方分成每天能走的一小段。','今日驿站','今天，从哪一站出发？'],
      discovery: ['探索笔记','把长线目标，拆成一次次小小的发现。','今日命题','今天，解开哪一个问题？'],
      lamplight: ['生活手记','为学习留出一隅，让积累慢慢发生。','今日小记','今天，记下哪一点新意？'],
      library: ['藏书计划','一层层积累，让记忆长成自己的书架。','今日书签','今天，翻开哪一页？'],
      sahara: ['远行路线','把漫长的远方，分成每天能走的一段。','今日驿站','今天，向晨光走一程。'],
      godel: ['探索笔记','允许暂时未知，也为每一次理解留下位置。','今日命题','今天，让理解再近一步。'],
    };
    const chosen = variants[card.palette] || variants[chapter] || variants.discovery;
    const headlines = {library:'让新的词，住进你的书架。',sahara:'把每一个词，写进晨光里。',godel:'从一个词开始，靠近未知。'};
    return { kicker:`墨词 · ${card.title}手账`, title:headlines[card.palette] || copy.coverLine || `在${card.title}，写下新的一页。`,
      subtitle:copy.encouragement || '把今天记住的词，留给下一次相遇。',
      plan:`01 / ${chosen[0]} · 长期方向`, planNote:chosen[1], action:`02 / ${chosen[2]} · 当下任务`, actionTitle:chosen[3] };
  }
  return { chapters, chapterFor, summarize, previews, themeCopy };
});
