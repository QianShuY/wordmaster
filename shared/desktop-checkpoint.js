'use strict';

// Browser storage is a resumable *view* of a desktop daily session. The SQLite
// DB remains the authority for saved answers, XP and due dates. Never copy
// passwords, API keys or tokens into a checkpoint.
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./domain') : root.WordMasterDomain);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WordMasterDesktopCheckpoint = api;
})(typeof window === 'undefined' ? null : window, function (Domain) {
  const VERSION = 2;
  const PREFIX = 'wordmaster_desktop_today_v14_';
  const STAGES = new Set(['review', 'review-spelling', 'learn', 'choice', 'spelling']);

  const key = bookId => PREFIX + String(bookId);
  const natural = value => Number.isSafeInteger(value) && value >= 0 && value <= 10000;
  const word = value => value && Number.isSafeInteger(value.id) && value.id > 0
    && typeof value.word === 'string';
  const words = values => Array.isArray(values) && values.length <= 200
    && values.every(word);
  const sane = value => value && value.version === VERSION
    && Number.isSafeInteger(value.bookId) && value.bookId > 0
    && typeof value.instanceId === 'string' && value.instanceId.length >= 12
    && /^\d{4}-\d{2}-\d{2}$/.test(value.day)
    && STAGES.has(value.stage)
    && typeof value.phaseDone === 'boolean'
    && value.flow && words(value.flow.review) && words(value.flow.learn)
    && natural(value.flow.reviewTotal) && natural(value.flow.learnTotal)
    && (value.flow.learnGroupSize === undefined || value.flow.learnGroupSize === 10)
    && (value.flow.learnGroupStart === undefined || (natural(value.flow.learnGroupStart) && value.flow.learnGroupStart <= value.flow.learn.length && value.flow.learnGroupStart % 10 === 0))
    && ['reviewMeaningSkipped','reviewSpellingSkipped'].every(k=>value.flow[k]===undefined||natural(value.flow[k]))
    && (value.flow.skippedSpellingIds===undefined||(Array.isArray(value.flow.skippedSpellingIds)&&value.flow.skippedSpellingIds.length<=200&&value.flow.skippedSpellingIds.every(id=>Number.isSafeInteger(id)&&id>0)))
    && typeof value.flow.reviewHasMore === 'boolean'
    && typeof value.flow.learnHasMore === 'boolean'
    && value.flow.completed && ['review', 'learn', 'spelling'].every(k => natural(value.flow.completed[k]))
    && (value.flow.completed['review-spelling'] === undefined || natural(value.flow.completed['review-spelling']))
    && (value.flow.reviewCycleId === undefined || (typeof value.flow.reviewCycleId === 'string' && value.flow.reviewCycleId.length>=8 && value.flow.reviewCycleId.length<=128))
    && (value.flow.completed.choice === undefined || natural(value.flow.completed.choice))
    && (value.flow.deferred === undefined || words(value.flow.deferred))
    && (value.deferredIds === undefined || (Array.isArray(value.deferredIds) && value.deferredIds.length <= 200 && value.deferredIds.every(id => /^\d+$/.test(id))))
    && (value.reinforcement === undefined || (value.reinforcement && typeof value.reinforcement === 'object' && !Array.isArray(value.reinforcement)
      && Object.entries(value.reinforcement).length <= 200
      && Object.entries(value.reinforcement).every(([id, state]) => /^\d+$/.test(id) && state
        && natural(state.errors) && natural(state.streak)
        && [1,2].includes(state.required) && typeof state.passed === 'boolean' && typeof state.canDefer === 'boolean')))
    && words(value.roundWords) && words(value.queue)
    && (value.roundXp === undefined || (Number.isSafeInteger(value.roundXp) && value.roundXp >= 0 && value.roundXp <= 1000000))
    && natural(value.total) && natural(value.done) && value.done <= value.total
    && value.counters && ['correctCount','firstCorrectCount','retryCorrectCount',
      'wrongCount','abandonedCount','retryCount'].every(k => natural(value.counters[k]))
    && typeof value.sessionId === 'string' && value.sessionId.length >= 8
    && ['attemptedWordIds', 'retryWordIds', 'learnAgainIds', 'learnCompletedIds']
      .every(k => Array.isArray(value[k]) && value[k].length <= 500);

  function read(storage, bookId, day, instanceId) {
    if (!storage || !Number.isSafeInteger(bookId) || bookId < 1) return null;
    try {
      const raw = storage.getItem(key(bookId));
      if (!raw) return null;
      const snapshot = JSON.parse(raw);
      if (!sane(snapshot) || snapshot.bookId !== bookId || snapshot.day !== day
        || snapshot.instanceId !== instanceId) {
        storage.removeItem(key(bookId));
        return null;
      }
      return snapshot;
    } catch {
      try { storage.removeItem(key(bookId)); } catch {}
      return null;
    }
  }

  function write(storage, snapshot) {
    if (!sane(snapshot) || !storage) return false;
    try {
      storage.setItem(key(snapshot.bookId), JSON.stringify(snapshot));
      return true;
    } catch {
      return false; // quota/storage disabled: never interrupt actual studying
    }
  }

  function clear(storage, bookId) {
    try { storage?.removeItem(key(bookId)); return true; }
    catch { return false; }
  }

  function progress(snapshot) {
    if (!sane(snapshot)) return null;
    const { flow } = snapshot;
    const completed = { ...flow.completed };
    if (!snapshot.phaseDone) completed[snapshot.stage] = stageOffset(flow,snapshot.stage) + Math.min(snapshot.total, snapshot.done);
    const expected = Math.max(0, flow.reviewTotal + flow.learnTotal);
    const spellable=Domain.spellingWords(flow.review).length;
    const reviewed=spellable?(completed['review-spelling']||0)+Math.min(flow.reviewTotal-spellable,completed.review||0):completed.review;
    const achieved = Math.min(expected, Math.min(flow.reviewTotal, reviewed)
      + Math.min(flow.learnTotal, completed.learn));
    return { achieved, expected, stage: snapshot.stage, phaseDone: snapshot.phaseDone,
      steps: completed };
  }

  // Earlier V1.4 versions accidentally shared flow.learn with a queue that
  // shift() consumed. roundWords retained the original complete list, so
  // recover that manifest without returning answered words to the queue.
  function repairLearnManifest(snapshot) {
    if (!sane(snapshot)) return snapshot;
    if (snapshot.stage !== 'learn' ||
        snapshot.flow.learn.length >= snapshot.flow.learnTotal ||
        snapshot.roundWords.length !== snapshot.flow.learnTotal) return snapshot;
    return {
      ...snapshot,
      flow: { ...snapshot.flow, learn: snapshot.roundWords.slice() },
    };
  }

  function learnGroup(flow) {
    return flow.learnGroupSize===10 ? flow.learn.slice(flow.learnGroupStart||0,(flow.learnGroupStart||0)+10) : flow.learn.slice();
  }
  function stageOffset(flow,stage) {
    if(stage==='review')return flow.reviewMeaningSkipped||0;
    if(stage==='review-spelling')return flow.reviewSpellingSkipped||0;
    if(flow.learnGroupSize!==10||!['learn','choice','spelling'].includes(stage))return 0;
    const prior=flow.learn.slice(0,flow.learnGroupStart||0);
    return stage==='spelling'?Domain.spellingWords(prior).filter(w=>!(flow.deferred||[]).some(x=>x.id===w.id)).length:prior.length;
  }
  function reviewPlan(words) {
    const passed=(word,mode)=>{const cycle=word.memory?.recall_cycle,step=cycle?.[mode];return cycle&&!cycle.complete&&step&&step.streak>=(step.errors?2:1);};
    const spellable=Domain.spellingWords(words);
    return {meaning:words.filter(w=>!passed(w,'meaning')),spelling:spellable.filter(w=>!passed(w,'spelling'))};
  }
  function resumePendingSpelling(snapshot) {
    if(!snapshot||snapshot.stage!=='review'||!snapshot.flow?.review?.length)return snapshot;
    const plan=reviewPlan(snapshot.flow.review);
    if(plan.meaning.length||!plan.spelling.length)return snapshot;
    return {...snapshot,stage:'review-spelling',phaseDone:false,queue:plan.spelling.slice(),roundWords:plan.spelling.slice(),total:plan.spelling.length,done:0,
      flow:{...snapshot.flow,resumingUnfinished:true,reviewMeaningSkipped:snapshot.flow.review.length,reviewSpellingSkipped:Domain.spellingWords(snapshot.flow.review).length-plan.spelling.length,completed:{...snapshot.flow.completed,review:snapshot.flow.review.length}},
      reinforcement:{},deferredIds:[],roundXp:0,counters:{correctCount:0,firstCorrectCount:0,retryCorrectCount:0,wrongCount:0,abandonedCount:0,retryCount:0},attemptedWordIds:[],retryWordIds:[],learnAgainIds:[],learnCompletedIds:[]};
  }
  function rebatchReview(snapshot,payload){
    if(!sane(snapshot)||!['review','review-spelling'].includes(snapshot.stage)||snapshot.flow.review.length<=10)return snapshot;
    const review=payload.review.slice(0,10),plan=reviewPlan(review),spellingOnly=!plan.meaning.length&&plan.spelling.length;
    const queue=spellingOnly?plan.spelling:plan.meaning;
    return {...snapshot,stage:spellingOnly?'review-spelling':'review',phaseDone:false,queue:queue.slice(),roundWords:queue.slice(),total:queue.length,done:0,
      flow:{...snapshot.flow,review,reviewTotal:review.length,learn:payload.learn.slice(),learnTotal:payload.learn.length,learnGroupSize:10,learnGroupStart:0,
        reviewMeaningSkipped:review.length-plan.meaning.length,reviewSpellingSkipped:Domain.spellingWords(review).length-plan.spelling.length,
        skippedSpellingIds:Domain.spellingWords(review).filter(w=>!plan.spelling.some(x=>x.id===w.id)).map(w=>w.id),
        completed:{review:review.length-plan.meaning.length,'review-spelling':0,learn:0,choice:0,spelling:0},deferred:[],reviewHasMore:payload.review_has_more,learnHasMore:payload.learn_has_more},
      reinforcement:{},deferredIds:[],roundXp:0,counters:{correctCount:0,firstCorrectCount:0,retryCorrectCount:0,wrongCount:0,abandonedCount:0,retryCount:0},attemptedWordIds:[],retryWordIds:[],learnAgainIds:[],learnCompletedIds:[]};
  }
  return Object.freeze({ VERSION, key, read, write, clear, progress, sane, repairLearnManifest, learnGroup, stageOffset,reviewPlan,resumePendingSpelling,rebatchReview });
});
