'use strict';

const Store = window.Capacitor.registerPlugin('WordmasterStore');
const answerInput = document.querySelector('#answer');
const submitButton = document.querySelector('#submit');
const question = document.querySelector('#question-title');
const feedback = document.querySelector('#feedback');
const savedState = document.querySelector('#saved-state');
const requestTracker = WordmasterRequestSession.createPendingRequestTracker(makeRequestId);
const sessionId = makeRequestId();
let currentState = null;

function makeRequestId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function showError(message) {
  savedState.textContent = message;
  feedback.classList.add('error');
}

function showState(state) {
  currentState = state;
  question.textContent = state.prompt;
  savedState.textContent = `已保存在本机：${state.attempts} 次作答，${state.correct} 次正确`;
}

async function load() {
  try {
    const state = await Store.getState();
    showState(state);
    answerInput.disabled = false;
    submitButton.disabled = false;
    if (state.attempts > 0) feedback.textContent = '已恢复本地学习记录。';
  } catch {
    showError('本地数据库读取失败，请重新打开应用。');
  }
}

submitButton.addEventListener('click', async () => {
  const pending = requestTracker.forAnswer(answerInput.value);
  if (!pending) {
    feedback.textContent = '先输入答案。';
    feedback.classList.add('error');
    answerInput.focus();
    return;
  }

  submitButton.disabled = true;
  answerInput.disabled = true;
  feedback.classList.remove('error');
  feedback.textContent = '正在保存…';
  try {
    const result = await Store.submitAnswer({
      wordKey: currentState?.wordKey,
      requestId: pending.requestId,
      answer: pending.answer,
      mode: 'spelling',
      sessionId,
      isNew: currentState?.isNew ?? true,
    });
    if (!result?.state || typeof result.correct !== 'boolean') {
      feedback.classList.add('error');
      feedback.textContent = '提交结果未确认；保留同一答案后重试会复用本次请求编号。';
      return;
    }
    showState(result.state);
    requestTracker.complete(pending.requestId);
    feedback.textContent = result.correct ? '正确，记录已保存。' : '已记录这次作答；可以再试一次。';
    answerInput.value = '';
    if (!result.correct) answerInput.focus();
  } catch {
    feedback.classList.add('error');
    feedback.textContent = '提交结果未确认；保留同一答案后重试会复用本次请求编号。';
  } finally {
    submitButton.disabled = false;
    answerInput.disabled = false;
  }
});

load();
