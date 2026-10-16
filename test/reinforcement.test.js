'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const Reinforcement = require('../shared/reinforcement');
const Checkpoint = require('../shared/desktop-checkpoint');

test('repeated failures require two independent correct recalls; a new error resets the streak', () => {
  let state = Reinforcement.answer(undefined, false);
  assert.equal(state.required, 1);
  state = Reinforcement.answer(state, false);
  assert.equal(state.required, 2);
  state = Reinforcement.answer(state, true);
  assert.equal(state.passed, false);
  state = Reinforcement.answer(JSON.parse(JSON.stringify(state)), false);
  assert.equal(state.streak, 0);
  state = Reinforcement.answer(state, true);
  assert.equal(state.passed, false);
  state = Reinforcement.answer(state, true);
  assert.equal(state.passed, true);
  state = Reinforcement.answer(state, false);
  assert.equal(state.canDefer, true);
  assert.equal(state.passed, false);
});

test('actual Study reports only complete a repeated-error word after its second correct recall', async () => {
  const source = fs.readFileSync(require.resolve('../static/app.js'), 'utf8');
  const start = source.indexOf('const Study = {');
  const end = source.indexOf('\n};', start) + 3;
  const context = vm.createContext({ Set, console, IS_ANDROID_APP: false,
    window: {WordMasterReinforcement: Reinforcement},
    api: async (_url, options) => ({outcome: options.body.outcome}) });
  vm.runInContext(source.slice(start, end) + '\nglobalThis.study = Study;', context);
  const study = context.study;
  const words = [1,2,3,4,5].map(id => ({id,word:'word'+id}));
  Object.assign(study, {current: words[0], queue: words.slice(1), total:5, done:0,
    mode:'meaning', reinforcement:{}, updateProgress(){}, saveTodayCheckpoint(){}});
  const report = async (correct, outcome) => study.report({word_id:1,correct,outcome});
  await report(false, 'wrong');
  assert.deepEqual(Array.from(study.queue, word => word.id), [2,3,4,1,5]);
  await report(false, 'wrong');
  assert.equal(study.queue.filter(word => word.id === 1).length, 1);
  await report(true, 'retry_correct');
  assert.equal(study.done, 0, 'one correct after repeated failures cannot finish the word');
  study.reinforcement = JSON.parse(JSON.stringify(study.reinforcement));
  await report(true, 'retry_correct');
  assert.equal(study.done, 1);
  assert.equal(study.correctCount, 1, 'completion counters must not inflate for intermediate recalls');
  assert.equal(study.retryCorrectCount, 1);
  assert.equal(study.queue.some(word => word.id === 1), false);
});

test('choice checkpoint preserves its manifest, error streak and pending retry across reload', () => {
  const state = Reinforcement.answer(Reinforcement.answer(undefined, false), false);
  const word = {id:1,word:'forest',meaning:'森林',choices:['森林','河流','山峰','努力']};
  const snapshot = {version: Checkpoint.VERSION,day:'2026-10-11',bookId:1,instanceId:'instance-1234567',
    stage:'choice',phaseDone:false, flow:{review:[],learn:[word],reviewTotal:0,learnTotal:1,
      completed:{review:0,learn:1,choice:0,spelling:0},reviewHasMore:false,learnHasMore:false,deferred:[]},
    roundWords:[word],queue:[word],total:1,done:0,sessionId:'session-12345',
    counters:{correctCount:0,firstCorrectCount:0,retryCorrectCount:0,wrongCount:2,abandonedCount:0,retryCount:1},
    attemptedWordIds:['1'],retryWordIds:['1'],learnAgainIds:[],learnCompletedIds:[],
    reinforcement:{1:state},deferredIds:[]};
  const data = new Map();
  const storage = {getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
  assert.equal(Checkpoint.write(storage,snapshot),true);
  const copy = Checkpoint.read(storage,1,'2026-10-11','instance-1234567');
  assert.equal(copy.reinforcement[1].required,2);
  assert.equal(copy.flow.learn.length,1);
  assert.equal(copy.queue.length,1);
  assert.equal(Checkpoint.sane({...snapshot, reinforcement:{1:{...state,errors:-1}}}),false);
});
