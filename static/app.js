'use strict';
/* ============================================================
   墨词 WordMaster — 前端逻辑
   ============================================================ */

const $ = (sel) => document.querySelector(sel);
const Domain = window.WordMasterDomain;
const DesktopCheckpoint = window.WordMasterDesktopCheckpoint;
const makeRequestId = () => window.crypto?.randomUUID?.()
  || `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const GUIDED_SPELLING_KEY = 'wordmaster_guided_spelling';
const IS_ANDROID_APP = window.Capacitor?.getPlatform?.() === 'android';
if (IS_ANDROID_APP) document.documentElement.classList.add('is-android-app');

// WebView may consume the first synthesized click to dismiss its IME. Handle
// a real tap at touchend, then ignore the matching click so one tap is one action.
function bindTapAction(element, action) {
  let touchStart = null;
  let handledAt = -Infinity;
  element.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { touchStart = null; return; }
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  element.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
  element.addEventListener('touchend', event => {
    if (!touchStart || event.touches.length) { touchStart = null; return; }
    const touch = event.changedTouches[0];
    const distance = Math.hypot(touch.clientX - touchStart.x, touch.clientY - touchStart.y);
    touchStart = null;
    if (distance > 14) return;
    if (event.cancelable) event.preventDefault();
    handledAt = performance.now();
    action(event);
  }, { passive: false });
  element.addEventListener('click', event => {
    if (event.detail !== 0 && performance.now() - handledAt < 700) return;
    action(event);
  });
}

const api = async (url, opts) => {
  if (window.WordMasterNativeApi) return window.WordMasterNativeApi.request(url, opts);
  const res = await fetch(url, opts && {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`);
  return data;
};

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.add('hidden'), 2400);
}

function clearPageStatus() {
  const status = $('#pageStatus');
  if (!status) return;
  status.classList.add('hidden');
  status.replaceChildren();
}

function showPageLoading(message) {
  const status = $('#pageStatus');
  if (!status) return;
  status.classList.remove('hidden', 'is-error');
  status.setAttribute('role', 'status');
  status.replaceChildren(Object.assign(document.createElement('p'), { textContent: message }));
}

function showPageError(message, retry) {
  const status = $('#pageStatus');
  if (!status) return;
  status.classList.remove('hidden');
  status.classList.add('is-error');
  status.setAttribute('role', 'alert');
  const text = document.createElement('p');
  text.textContent = message;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-ghost';
  button.textContent = '重试';
  button.addEventListener('click', retry);
  status.replaceChildren(text, button);
}

function speak(text) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    toast('当前设备暂不支持发音，仍可继续学习');
    return;
  }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.9;
    u.onerror = () => toast('发音暂不可用，仍可继续学习');
    speechSynthesis.speak(u);
  } catch {
    toast('发音暂不可用，仍可继续学习');
  }
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wordHeadword = word => word.display_word || word.word;
const wordAnswer = word => word.answer_word || word.word;
const wordSpeech = word => word.answer_word || word.word;
const speakerIconMarkup = '<svg class="speaker-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>';

function wordPronunciationMarkup(word, classes = 'quiz-phonetic') {
  const label = word.phonetic_display || (word.phonetic ? `[${word.phonetic}]` : '');
  return `<p class="${classes}">${label ? `<span>${esc(label)}</span>` : ''}<button type="button" class="speak-btn" data-speak="${esc(wordSpeech(word))}" aria-label="播放 ${esc(wordHeadword(word))} 的发音">${speakerIconMarkup}</button></p>`;
}

function wordPosMarkup(word) {
  const label = [word.pos, word.sense_label].filter(Boolean).join(' · ');
  return label ? `<span class="quiz-pos">${esc(label)}</span>` : '';
}

function wordDictionaryMetaMarkup(word) {
  return `<div class="dictionary-head-meta">${word.pos ? `<span class="dictionary-pos">${esc(word.pos)}</span>` : ''}${word.sense_label ? `<span class="dictionary-homograph">${esc(word.sense_label)}</span>` : ''}</div>`;
}

function wordMeaningMarkup(word, classes = 'quiz-meaning', options = {}) {
  if (!Array.isArray(word.meaning_groups) || !word.meaning_groups.length) {
    return `<p class="${classes}">${esc(word.meaning)}</p>`;
  }
  const groups = word.meaning_groups.map(group => `
    <section class="meaning-group">
      ${options.hidePartOfSpeech ? '' : `<h3 class="meaning-group-title">${esc(group.heading)}</h3>`}
      <ol>${group.items.map(item => `<li>${esc(item)}</li>`).join('')}</ol>
    </section>`).join('');
  const notes = (word.meaning_notes || []).map(note => `
    <p class="meaning-note"><b>${esc(note.heading)}</b><span>${esc(note.text)}</span></p>`).join('');
  return `<div class="meaning-structured ${classes}">${groups}${notes}</div>`;
}

function wordMeaningSummary(word) {
  if (!Array.isArray(word.meaning_groups)) return word.meaning;
  const meanings = word.meaning_groups.map(group => `${group.heading} ${group.items.join('；')}`);
  for (const note of word.meaning_notes || []) meanings.push(`${note.heading} ${note.text}`);
  return meanings.join('；');
}

function choiceMeaningMarkup(choice, word) {
  if (choice !== word.meaning || !Array.isArray(word.meaning_groups)) return esc(choice);
  return `<span class="choice-meaning-structured">${word.meaning_groups.map(group =>
    `<span><b>${esc(group.heading)}</b> ${group.items.map(esc).join('；')}</span>`).join('')}${(word.meaning_notes || []).map(note =>
    `<span><b>${esc(note.heading)}</b> ${esc(note.text)}</span>`).join('')}</span>`;
}

/* ============================================================
   路由
   ============================================================ */
const views = { home: $('#view-home'), study: $('#view-study'), manage: $('#view-manage'), mistakes: $('#view-mistakes'), stats: $('#view-stats'), cards: $('#view-cards') };
const DESKTOP_FOCUS_KEY = 'wordmaster_desktop_focus';
function syncDesktopFocus(viewName) {
  const enabled = !IS_ANDROID_APP && viewName === 'study' && localStorage.getItem(DESKTOP_FOCUS_KEY) === '1';
  document.body.classList.toggle('desktop-focus-study', enabled);
  const toggle = $('#studyFocusToggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = enabled ? '◉ 退出专注' : '◉ 专注';
    toggle.title = enabled ? '退出专注模式（Esc）' : '隐藏导航与装饰，让注意力回到题目';
  }
}

$('#studyFocusToggle').addEventListener('click', () => {
  if (IS_ANDROID_APP) return;
  localStorage.setItem(DESKTOP_FOCUS_KEY, document.body.classList.contains('desktop-focus-study') ? '0' : '1');
  syncDesktopFocus('study');
});
document.addEventListener('keydown', event => {
  if (IS_ANDROID_APP || event.key !== 'Escape' || !document.body.classList.contains('desktop-focus-study')) return;
  if (document.querySelector('.modal-mask:not(.hidden)')) return;
  localStorage.setItem(DESKTOP_FOCUS_KEY, '0');
  syncDesktopFocus('study');
});

function show(name, navName = name) {
  clearPageStatus();
  syncDesktopFocus(name);
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[name].classList.remove('hidden');
  document.body.classList.toggle('is-studying', name === 'study');
  document.body.classList.toggle('is-stats', name === 'stats');
  document.querySelectorAll('[data-nav]').forEach(a => {
    const active = a.dataset.nav === navName;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function route() {
  const hash = location.hash || '#/';
  const studyM = hash.match(/^#\/study\/(\d+)\/(\w+)/);
  const todayStudyM = !IS_ANDROID_APP && hash.match(/^#\/today-study\/(\d+)$/);
  const guidedM = hash.match(/^#\/guided-spelling\/(\d+)/);
  const manageM = hash.match(/^#\/book\/(\d+)/);
  const mStudy = hash.match(/^#\/mistakes-study\/(\w+)/);
  Study.runToken++;
  Study.leave();
  if (todayStudyM) Study.startToday(Number(todayStudyM[1]));
  else if (guidedM) Study.startGuidedSpelling(Number(guidedM[1]));
  else if (studyM) {
    const query = new URLSearchParams(hash.split('?')[1] || '');
    Study.start(Number(studyM[1]), studyM[2], {
      limit: Number(query.get('limit')) || 0,
      guided: query.get('guided') === '1',
    });
  }
  else if (mStudy) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const scoped = !IS_ANDROID_APP ? Number(params.get('book_id')) : 0;
    Mistakes.study(mStudy[1], Number.isSafeInteger(scoped) && scoped > 0 ? scoped : null);
  }
  else if (manageM) Manage.open(Number(manageM[1]));
  else if (hash === '#/mistakes' || (!IS_ANDROID_APP && hash.startsWith('#/mistakes?'))) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const bookId = !IS_ANDROID_APP ? Number(params.get('book_id')) : 0;
    const wordId = !IS_ANDROID_APP ? Number(params.get('word_id')) : 0;
    Mistakes.render(Number.isSafeInteger(bookId) && bookId > 0 ? bookId : null,
      Number.isSafeInteger(wordId) && wordId > 0 ? wordId : null);
  }
  else if (hash === '#/stats') Stats.render();
  else if (hash === '#/cards') Cards.render();
  else if (hash === '#/cards-preview') Cards.render(true);
  else if (hash === '#/cards-samples') Cards.render(true, true);
  else if (hash === '#/books') Home.render('books');
  else Home.render('today');
}

window.addEventListener('hashchange', route);
window.addEventListener('androidback', () => {
  const activeElement = document.activeElement;
  if (activeElement?.matches?.('input, textarea, select, [contenteditable="true"]')) {
    activeElement.blur();
    return;
  }
  const cardModal = $('#cardModal');
  if (cardModal && !cardModal.classList.contains('hidden')) {
    Cards.closeModal();
    return;
  }
  const modal = document.querySelector('.modal-mask:not(.hidden)');
  if (modal) {
    modal.classList.add('hidden');
    return;
  }
  if ((location.hash || '#/') !== '#/') {
    location.hash = '#/';
    return;
  }
  window.WordMasterNativeApi?.exitApp?.();
});

/* ============================================================
   主页
   ============================================================ */
const MODES = [
  { key: 'learn', name: '学词' },
  { key: 'spelling', name: '拼写默写' },
  { key: 'meaning', name: '释义选择' },
  { key: 'pos', name: '词性判断' },
];

// Desktop-only journey panel, derived from saved work rather than fake rewards.
// Keep this module out of Android's Capacitor API until its native store is ready.
const DesktopJourney = {
  async render() {
    if (IS_ANDROID_APP) return;
    const host = $('#desktopJourney');
    if (!host) return;
    try {
      const journey = await api('/api/desktop/journey');
      if (Home.section !== 'today' || location.hash === '#/books') return;
      const level = journey.level;
      const progress = level.required ? Math.round(level.current / level.required * 100) : 0;
      const last7 = journey.last7 || [];
      const scale = Math.max(10, ...last7.map(day => day.count));
      const daysMarkup = last7.map(day => {
        const size = day.count ? Math.max(10, Math.round(day.count / scale * 100)) : 3;
        const date = day.day.slice(5);
        return `<li class="journey-day ${day.isToday ? 'today' : ''}" aria-label="${esc(day.day)}，作答 ${day.count} 次">
          <span class="journey-bar-frame"><span class="journey-bar" style="height:${size}%"></span></span>
          <span class="journey-day-label numeric">${esc(date)}</span>
        </li>`;
      }).join('');
      const stampsMarkup = (journey.stamps || []).map(stamp => `<li class="journey-stamp ${stamp.unlocked ? 'unlocked' : 'locked'}"
        aria-label="${esc(stamp.title)}：${stamp.unlocked ? '已获得' : '尚未获得'}">
          <span class="journey-stamp-seal" aria-hidden="true">${stamp.unlocked ? '印' : '·'}</span>
          <span class="journey-stamp-copy"><b>${esc(stamp.title)}</b><small>${esc(stamp.description)}</small></span>
          <span class="journey-stamp-count numeric">${stamp.unlocked ? '已获得' : `${stamp.progress}/${stamp.target}`}</span>
        </li>`).join('');
      const completed = Math.min(journey.answeredToday, journey.dailyTarget);
      const dailyPercent = Math.min(100, Math.round(completed / journey.dailyTarget * 100));
      host.innerHTML = `
        <div class="journey-section-head">
          <div><p class="hero-kicker">MAKE PROGRESS VISIBLE</p>
            <h2>学习旅程 <span class="journey-subtitle">一步一印，积少成多</span></h2>
          </div>
          <span class="journey-streak">✦ 连续学习 <b class="numeric">${journey.streak}</b> 天</span>
        </div>
        <div class="journey-grid">
          <article class="journey-card journey-level-card" aria-label="学习等级与经验值">
            <div class="journey-card-head"><span>墨阶 · LEVEL</span><span>累计作答 <b class="numeric">${journey.attempts}</b> 次</span></div>
            <div class="journey-level-main"><span class="journey-level-number numeric">${level.level}</span>
              <div><strong>继续积累</strong><p>答对就能获得墨点，回炉答对也算进步。</p></div></div>
            <div class="journey-track" role="progressbar" aria-label="当前等级墨点进度" aria-valuenow="${level.current}" aria-valuemin="0" aria-valuemax="${level.required}">
              <span style="width:${progress}%"></span></div>
            <div class="journey-track-caption"><span class="numeric">${level.xp} 墨点（XP）</span>
              <span class="numeric">距下一级 ${level.required - level.current} 点</span></div>
          </article>
          <article class="journey-card journey-week-card" aria-label="每日作答与最近七天学习记录">
            <div class="journey-card-head"><span>今日小目标</span><span>最近 7 天</span></div>
            <div class="journey-quest-main"><strong class="numeric">${completed}<small> / ${journey.dailyTarget}</small></strong>
              <span>${journey.drawnToday ? '今日卡牌已领取 ✓' : journey.answeredToday >= journey.dailyTarget ? '今日作答目标达成，可以去卡册抽卡' : '完成十次作答，解锁今日抽卡机会'}</span></div>
            <div class="journey-mini-track" role="progressbar" aria-label="每日作答目标进度" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="${journey.dailyTarget}">
              <span style="width:${dailyPercent}%"></span></div>
            <ol class="journey-week-chart" aria-label="七日作答柱状图">${daysMarkup}</ol>
          </article>
        </div>
        <div class="journey-collection-head"><h3>成长印记</h3><p>${journey.unlockedCount} / ${journey.stamps.length} 已获得 · 记录你的真实学习进步</p></div>
        <ul class="journey-stamps">${stampsMarkup}</ul>
        <p class="journey-disclaimer">墨点和印记仅记录学习过程，不改变单词复习间隔；复习安排仍以到期记录为准。</p>
      `;
      host.classList.remove('hidden');
    } catch (error) {
      // Learning should never become unusable because a secondary dashboard failed.
      console.warn('学习旅程暂不可用:', error.message);
      host.classList.add('hidden');
    }
  },
};

const DESKTOP_ROUND_KEY = 'wordmaster_desktop_round_size';
function desktopRoundSize() {
  const stored = Number(localStorage.getItem(DESKTOP_ROUND_KEY) || 20);
  return [10, 20, 40].includes(stored) ? stored : 20;
}
$('#desktopRoundSize').value = String(desktopRoundSize());
$('#desktopRoundSize').addEventListener('change', event => {
  if (IS_ANDROID_APP) return;
  const chosen = Number(event.target.value);
  if ([10, 20, 40].includes(chosen)) {
    localStorage.setItem(DESKTOP_ROUND_KEY, String(chosen));
    if (Home.section === 'today' && Home.stats) Home.renderToday(Home.books, Home.stats, Home.mistakeCount);
  }
});

/* ============================================================
   Desktop V1.2: the home is a learning command center, not a
   second plan menu. Android keeps the existing Today workflow.
   ============================================================ */
const DesktopHub = {
  render(books, chosenBook, mistakeCount) {
    if (IS_ANDROID_APP) return;
    const select = $('#desktopTodayBookSelect');
    select.innerHTML = books.length
      ? books.map(book => `<option value="${book.id}">${esc(book.name)}${book.word_count ? '' : ' · 空词库'}</option>`).join('')
      : '<option value="">请先创建词库</option>';
    select.value = chosenBook ? String(chosenBook.id) : '';
    select.disabled = books.length === 0;

    const d = new Date();
    $('#desktopHubDate').textContent = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
    $('#hubEditPlan').disabled = !chosenBook;

    if (!chosenBook) {
      $('#hubPlanStatus').textContent = '尚无可学习词库';
      $('#hubPlanTitle').textContent = '先为自己准备一本词库';
      $('#hubPlanSubtitle').textContent = '添加单词后就能制定长期计划，并开始当天的学习。';
      $('#hubRemaining').textContent = '0';
      $('#hubDays').textContent = '—';
      $('#hubQuota').textContent = '—';
      $('#hubPlanFootnote').textContent = '学习计划会跟随所选词库。';
      $('#hubActionSummary').textContent = '词库中有单词后，会显示到期复习和今日新词。';
      $('#hubDueCount').innerHTML = '0 <small>词</small>';
      $('#hubNewProgress').textContent = '0 / 0';
      $('#hubTotalNumber').innerHTML = '0 <small>词</small>';
      $('#hubRoutePreview').textContent = '先选择一本有单词的词库，便可开始今日任务。';
      $('#hubResumeNote').classList.add('hidden');
      $('#hubStart').disabled = false;
      $('#hubStart').innerHTML = '去管理词库 <span aria-hidden="true">→</span>';
      $('#hubMistakes').classList.toggle('hidden', mistakeCount === 0);
      $('#hubMistakes').textContent = `回炉 ${mistakeCount} 个错题 ↗`;
      this.progress(0);
      return;
    }

    const book = chosenBook;
    const plan = book.plan || {};
    const total = Math.max(0, Number(book.word_count) || 0);
    const remaining = Math.max(0, Number(plan.remaining_new) || 0);
    const started = Math.max(0, total - remaining);
    const pct = total ? Math.min(100, Math.round(started / total * 100)) : 0;
    const due = Math.max(0, Number(book.due_review) || 0);
    const quota = Math.max(0, Number(plan.daily_quota) || 0);
    const learned = Math.max(0, Number(book.new_today) || 0);
    const upcoming = Math.min(remaining, Math.max(0, quota - learned));
    const firstRun = !localStorage.getItem('wordmaster_onboarding_done')
      && !sessionStorage.getItem('wordmaster_onboarding_started')
      && Home.stats && !Home.stats.mastered && !Home.stats.total_correct && !Home.stats.total_wrong;

    $('#hubPlanStatus').textContent = plan.active ? '计划进行中' : '尚未设定目标';
    $('#hubPlanTitle').textContent = remaining === 0 && total
      ? '新词已全部开始学习'
      : plan.active ? `向 ${plan.target_date} 的目标稳步前进` : '给这本词库一个完成日期';
    $('#hubPlanSubtitle').textContent = remaining === 0 && total
      ? '词库已完成新词初学，继续通过到期复习巩固掌握。'
      : plan.active
        ? `目标日 ${plan.target_date} · 每日新词按剩余任务动态调整，不必一次学完。`
        : '设定一个目标日期，系统会根据剩余新词自动计算每日安排。';
    $('#hubRemaining').textContent = String(remaining);
    $('#hubDays').textContent = plan.active ? String(plan.days_left) : '—';
    $('#hubQuota').textContent = String(remaining ? quota : 0);
    $('#hubPlanFootnote').textContent = `共 ${total} 词 · 已开始学习 ${started} 词 · 已掌握 ${Number(book.mastered) || 0} 词`;
    $('#hubEditPlan').innerHTML = `${plan.active ? '调整学习计划' : '制定学习计划'} <span aria-hidden="true">↗</span>`;
    this.progress(pct);

    $('#hubDueCount').innerHTML = `${due} <small>词</small>`;
    const effectiveNewTarget = Math.max(learned, Math.min(quota, learned + remaining));
    $('#hubNewProgress').textContent = `${learned} / ${effectiveNewTarget}`;
    $('#hubTotalNumber').innerHTML = `${due + upcoming} <small>词</small>`;
    $('#hubRoutePreview').textContent = due && upcoming
      ? `复习 ${due} 词 → 学习 ${upcoming} 新词 → 巩固默写`
      : due ? `完成全部 ${due} 个到期复习词`
      : upcoming ? `学习 ${upcoming} 个新词 → 巩固默写`
      : '当前词库的今日任务已全部完成。';
    const hasTask = due > 0 || upcoming > 0;
    $('#hubActionSummary').textContent = due > 0
      ? `今天需要复习 ${due} 个到期词${upcoming ? `，并学习 ${upcoming} 个新词` : ''}。按顺序一次走完。`
      : upcoming > 0
        ? `今天还可开始学习 ${upcoming} 个新词，之后由复习系统接力。`
        : '这本词库的今日安排已完成，可以换一本词库或查看学习成果。';
    $('#hubStart').disabled = !hasTask;
    $('#hubStart').innerHTML = firstRun && hasTask
      ? '开始 3 词体验 <span aria-hidden="true">→</span>'
      : hasTask
        ? '开始今日学习 <span aria-hidden="true">→</span>'
        : '今日任务已完成 ✓';
    $('#hubActionHelp').textContent = due > 0 && upcoming > 0
      ? '从到期复习到新词巩固，按顺序完成一个完整的今日任务。'
      : due > 0 ? '今天到期的复习会全部优先安排。'
      : '先认识新词，再用默写确认是否真正记住。';
    const checkpoint = DesktopCheckpoint.read(localStorage, book.id, Domain.localDayKey(), Home.instanceId);
    const resume = $('#hubResumeNote');
    resume.classList.toggle('hidden', !checkpoint);
    if (checkpoint) {
      const progress = DesktopCheckpoint.progress(checkpoint);
      const stageNames = { review: '到期复习', learn: '新词学习', spelling: '巩固默写' };
      const completed = progress ? `${progress.achieved} / ${progress.expected}` : '已保存';
      const remainingDue = Math.max(0, checkpoint.flow.reviewTotal - (progress?.steps.review || 0));
      const remainingNew = Math.max(0, checkpoint.flow.learnTotal - (progress?.steps.learn || 0));
      // Live SQLite counts can include newly introduced (now instantly due)
      // words. While resuming, present the *same* original task manifest.
      $('#hubDueCount').innerHTML = `${remainingDue} <small>词</small>`;
      $('#hubNewProgress').textContent = `${checkpoint.flow.learnTotal - remainingNew} / ${checkpoint.flow.learnTotal}`;
      $('#hubTotalNumber').innerHTML = `${remainingDue + remainingNew} <small>词</small>`;
      $('#hubRoutePreview').textContent = remainingDue + remainingNew
        ? `本日任务共 ${progress.expected} 词，已有 ${progress.achieved} 词完成 · 继续 ${stageNames[checkpoint.stage]}`
        : '新词和复习已做完，继续完成最后的巩固。';
      // A word that failed and is waiting to be retried stays in the
      // checkpoint queue even if live "due" counts temporarily differ.
      $('#hubActionSummary').textContent =
        `接续上次的任务：还需完成 ${remainingDue} 个复习词（含待回炉词）和 ${remainingNew} 个新词。实时到期数可能与本次队列不同。`;
      resume.textContent = `✓ 学习断点已保存 · ${stageNames[checkpoint.stage]} · ${completed} 词`;
      $('#hubStart').disabled = false;
      $('#hubStart').innerHTML = `${checkpoint.phaseDone ? '继续下一阶段' : '继续上次学习'} <span aria-hidden="true">→</span>`;
      $('#hubActionHelp').textContent = '退出后仍然保留本次任务和未完成的题目，点击继续即可接上。';
    }
    $('#hubMistakes').classList.toggle('hidden', mistakeCount === 0);
    $('#hubMistakes').textContent = `回炉 ${mistakeCount} 个错题 ↗`;
  },

  progress(pct) {
    $('#hubPlanPercent').textContent = `${pct}%`;
    $('#hubPlanProgress').setAttribute('aria-valuenow', String(pct));
    $('#hubPlanProgressFill').style.width = `${pct}%`;
  },
};

const DesktopPlan = {
  book: null,
  opener: null,
  busy: false,

  open(book) {
    if (IS_ANDROID_APP) return;
    this.book = book;
    this.opener = document.activeElement;
    const plan = book.plan || {};
    $('#desktopPlanBookName').textContent = book.name;
    $('#desktopPlanTotal').textContent = String(book.word_count || 0);
    $('#desktopPlanUnseen').textContent = String(plan.remaining_new || 0);
    $('#desktopPlanMastered').textContent = String(book.mastered || 0);
    $('#desktopPlanDate').value = plan.active ? (plan.target_date || '') : '';
    $('#desktopPlanDate').min = Domain.localDayKey(new Date());
    $('#desktopPlanRemove').disabled = !plan.active;
    $('#desktopPlanModal').classList.remove('hidden');
    this.preview();
    $('#desktopPlanDate').focus();
  },

  close() {
    $('#desktopPlanModal').classList.add('hidden');
    const previous = this.opener;
    this.opener = null;
    this.book = null;
    previous?.focus?.();
  },

  preview() {
    if (!this.book) return;
    const date = $('#desktopPlanDate').value;
    const left = Math.max(0, Number(this.book.plan?.remaining_new) || 0);
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= Domain.localDayKey(new Date());
    const save = $('#desktopPlanSave');
    const advice = $('#desktopPlanAdvice');
    const presetButtons = document.querySelectorAll('#desktopPlanModal [data-plan-days]');
    presetButtons.forEach(button => button.setAttribute('aria-pressed', 'false'));
    if (!valid) {
      $('#desktopPlanDaily').textContent = '—';
      $('#desktopPlanDays').textContent = '—';
      $('#desktopPlanDeadline').textContent = date || '未设置';
      advice.textContent = date ? '请选择今天或之后的有效日期。' : '选择目标日期，即可预览每日新词安排。';
      advice.classList.toggle('is-warning', Boolean(date));
      save.disabled = true;
      return;
    }
    try {
      const plan = Domain.calculatePlan({ remainingNew: left, planActive: true, targetDate: date });
      const required = Math.ceil(left / plan.days_left);
      $('#desktopPlanDaily').textContent = String(plan.daily_quota);
      $('#desktopPlanDays').textContent = `${plan.days_left} 天`;
      $('#desktopPlanDeadline').textContent = date;
      const overload = required > 200;
      advice.classList.toggle('is-warning', overload);
      advice.textContent = overload
        ? `目标过紧：每日需 ${required} 词，超过系统每日 200 词的上限。请延后日期。`
        : left === 0 ? '新词已完成初学。保留目标也不会影响复习，建议以巩固掌握为主。'
        : required > 60 ? '挑战强度较高，建议留出额外时间做复习，可考虑延后目标日期。'
        : required > 25 ? '节奏偏紧凑，建议每天预留时间完成到期复习。'
        : '学习节奏比较从容，系统仍会优先安排到期复习。';
      save.disabled = overload || this.busy;
    } catch (error) {
      save.disabled = true;
      advice.classList.add('is-warning');
      advice.textContent = '日期无效，请重新选择。';
    }
  },

  async save() {
    if (!this.book || this.busy || $('#desktopPlanSave').disabled) return;
    this.busy = true;
    $('#desktopPlanSave').disabled = true;
    try {
      const res = await api(`/api/books/${this.book.id}/plan`, {
        method: 'PUT', body: { target_date: $('#desktopPlanDate').value },
      });
      this.close();
      toast(`计划已保存：每天约 ${res.plan.daily_quota} 个新词`);
      await Home.render(Home.section);
    } catch (error) {
      toast(`保存计划失败：${error.message}`);
    } finally {
      this.busy = false;
      if (this.book) this.preview();
    }
  },

  async remove() {
    if (!this.book || this.busy || !this.book.plan?.active) return;
    if (!confirm('移除这本词库的完成日期？学习记录和复习进度会保留。')) return;
    this.busy = true;
    try {
      await api(`/api/books/${this.book.id}/plan`, { method: 'DELETE' });
      this.close();
      toast('已移除目标日期，学习记录仍然保留');
      await Home.render(Home.section);
    } catch (error) {
      toast(`调整学习计划失败：${error.message}`);
    } finally { this.busy = false; }
  },
};

$('#desktopTodayBookSelect').addEventListener('change', event => {
  if (IS_ANDROID_APP) return;
  $('#todayBookSelect').value = event.target.value;
  $('#todayBookSelect').dispatchEvent(new Event('change'));
});
$('#hubStart').addEventListener('click', () => {
  if (IS_ANDROID_APP) return;
  const book = Home.books.find(item => item.id === Home.selectedBookId);
  if (!book || !book.word_count) { location.hash = '#/books'; return; }
  location.hash = `#/today-study/${book.id}`;
});
$('#hubEditPlan').addEventListener('click', () => {
  if (IS_ANDROID_APP) return;
  const book = Home.books.find(item => item.id === Home.selectedBookId);
  if (book) DesktopPlan.open(book);
});
$('#hubMistakes').addEventListener('click', () => {
  if (!IS_ANDROID_APP) location.hash = '#/mistakes-study/spelling';
});
$('#desktopPlanDate').addEventListener('input', () => DesktopPlan.preview());
document.querySelectorAll('#desktopPlanModal [data-plan-days]').forEach(button => {
  button.addEventListener('click', () => {
    const days = Number(button.dataset.planDays);
    const d = new Date();
    d.setDate(d.getDate() + days - 1);
    $('#desktopPlanDate').value = Domain.localDayKey(d);
    document.querySelectorAll('#desktopPlanModal [data-plan-days]').forEach(other =>
      other.setAttribute('aria-pressed', String(other === button)));
    DesktopPlan.preview();
    button.setAttribute('aria-pressed', 'true');
  });
});
$('#desktopPlanForm').addEventListener('submit', event => {
  event.preventDefault();
  void DesktopPlan.save();
});
$('#desktopPlanRemove').addEventListener('click', () => void DesktopPlan.remove());
$('#desktopPlanClose').addEventListener('click', () => DesktopPlan.close());
$('#desktopPlanCancel').addEventListener('click', () => DesktopPlan.close());
$('#desktopPlanModal').addEventListener('click', event => {
  if (event.target.id === 'desktopPlanModal') DesktopPlan.close();
});
document.addEventListener('keydown', event => {
  if (IS_ANDROID_APP || $('#desktopPlanModal').classList.contains('hidden')) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    DesktopPlan.close();
  } else if (event.key === 'Tab') {
    const items = [...$('#desktopPlanModal').querySelectorAll('button:not(:disabled), input:not(:disabled)')];
    if (!items.length) return;
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }
});

const Home = {
  section: 'today',
  books: [],
  selectedBookId: 0,
  stats: null, mistakeCount: 0, instanceId: null,

  async render(section = 'today') {
    this.section = section;
    $('#todaySection').setAttribute('aria-labelledby', IS_ANDROID_APP ? 'todayTitle' : 'hubHeadingTitle');
    show('home', section === 'books' ? 'books' : 'today');
    $('#todaySection').classList.toggle('hidden', section === 'books');
    $('#booksSection').classList.toggle('hidden', section !== 'books');
    showPageLoading('正在准备今日学习…');
    try {
      const [books, stats, mistakes, identity] = await Promise.all([
        api('/api/books'), api('/api/stats'), api('/api/mistakes'),
        IS_ANDROID_APP ? Promise.resolve(null) : api('/api/desktop/identity')]);
      clearPageStatus();
      this.books = books;
      this.instanceId = identity?.instance_id || null;
      this.stats = stats;
      this.mistakeCount = mistakes.length;
      this.renderStats(stats);
      this.renderToday(books, stats, mistakes.length);
      this.renderBooks(books, mistakes.length);
      if (section === 'today') void DesktopJourney.render();
    } catch (error) {
      showPageError(`今日内容暂时无法加载：${error.message}`, () => this.render(this.section));
    }
  },

  renderToday(books, stats, mistakeCount = 0) {
    const select = $('#todayBookSelect');
    if (!IS_ANDROID_APP) $('#desktopRoundSize').value = String(desktopRoundSize());
    const usable = books.filter(book => book.word_count > 0);
    const stored = Number(localStorage.getItem('wordmaster_selected_book') || 0);
    const preferred = usable.find(book => book.id === (this.selectedBookId || stored));
    const nextTask = usable.find(book => book.due_review > 0 || (book.plan.daily_quota - book.new_today) > 0);
    this.selectedBookId = (preferred || nextTask || usable[0])?.id || 0;
    select.innerHTML = books.length
      ? books.map(book => `<option value="${book.id}">${esc(book.name)}${book.word_count ? '' : ' · 暂无单词'}</option>`).join('')
      : '<option value="">还没有词库</option>';
    select.value = String(this.selectedBookId || '');
    select.disabled = books.length === 0;

    const due = books.reduce((sum, book) => sum + Number(book.due_review || 0), 0);
    const newDone = books.reduce((sum, book) => sum + Number(book.new_today || 0), 0);
    const newQuota = books.reduce((sum, book) => sum + Number(book.plan?.daily_quota || 0), 0);
    $('#todayTaskSummary').innerHTML = `
      <div class="today-task"><span class="today-task-label">待复习</span><span class="today-task-value"><span class="numeric">${due}</span><small>词</small></span></div>
      <div class="today-task"><span class="today-task-label">今日新词</span><span class="today-task-value"><span class="numeric">${newDone}</span><small class="numeric task-target">/ ${newQuota}</small></span></div>`;

    const quickMistakes = $('#todayQuickMistakes');
    const showMistakes = !IS_ANDROID_APP && mistakeCount > 0;
    quickMistakes.classList.toggle('hidden', !showMistakes);
    if (showMistakes) {
      quickMistakes.textContent = `↗ 回炉 ${mistakeCount} 个错题`;
      quickMistakes.onclick = () => { location.hash = '#/mistakes-study/spelling'; };
    }

    const firstRun = !localStorage.getItem('wordmaster_onboarding_done')
      && !sessionStorage.getItem('wordmaster_onboarding_started')
      && !stats.mastered && !stats.total_correct && !stats.total_wrong;
    $('#firstRunGuide').classList.toggle('hidden', !firstRun);
    const updateAction = () => {
      const book = books.find(item => item.id === Number(select.value));
      if (!book) {
        this.selectedBookId = 0;
        $('#todayNextAction').textContent = '先到词库页添加或选择学习内容。';
        $('#todayContinue').textContent = books.length ? '管理词库' : '创建第一本词库';
        $('#todayContinue').disabled = false;
        $('#todayContinue').onclick = () => { location.hash = '#/books'; };
        $('#todayEmptyMessage').textContent = books.length ? '词库中还没有可学习的单词。' : '创建词库并添加单词后，就可以开始学习。';
        $('#todayEmptyMessage').classList.remove('hidden');
        DesktopHub.render(books, null, mistakeCount);
        return;
      }
      this.selectedBookId = book.id;
      localStorage.setItem('wordmaster_selected_book', String(book.id));
      const dailyRemaining = Math.max(0, Number(book.plan?.daily_quota || 0) - Number(book.new_today || 0));
      // Desktop: a plan can have a default daily quota even after all words
      // have been introduced. Do not advertise a task with an empty queue.
      const remaining = IS_ANDROID_APP ? dailyRemaining
        : Math.min(dailyRemaining, Math.max(0, Number(book.plan?.remaining_new) || 0));
      const mode = book.due_review > 0 ? 'meaning' : 'learn';
      const hasTask = book.due_review > 0 || remaining > 0;
      const button = $('#todayContinue');
      button.disabled = !hasTask;
      button.textContent = firstRun && hasTask ? '开始 3 词体验' : hasTask ? '继续学习' : '今日任务已完成';
      $('#todayEmptyMessage').classList.toggle('hidden', hasTask);
      $('#todayEmptyMessage').textContent = hasTask ? '' : '这本词库今天的待复习和新词配额都已完成。';
      if (book.due_review > 0) {
        $('#todayNextAction').textContent = IS_ANDROID_APP
          ? `先完成 ${book.due_review} 个到期复习；答完会自动接上今日新词。`
          : `有 ${book.due_review} 个到期复习，本轮先做最多 ${desktopRoundSize()} 词，完成后可继续下一轮。`;
      } else if (remaining > 0) {
        $('#todayNextAction').textContent = firstRun
          ? '轻量起步：先学 3 个新词，再默写其中 1 个。'
          : `今天还能学 ${remaining} 个新词，这轮会先带你看词卡。`;
      } else {
        $('#todayNextAction').textContent = '今天已完成这本词库的学习安排，可以切换词库或明天再来。';
      }
      button.onclick = () => {
        const query = firstRun && mode === 'learn' ? '?limit=3&guided=1' : '';
        if (query) sessionStorage.setItem('wordmaster_onboarding_started', '1');
        location.hash = `#/study/${book.id}/${mode}${query}`;
      };
      DesktopHub.render(books, book, mistakeCount);
    };
    select.onchange = updateAction;
    updateAction();
  },

  renderStats(s) {
    const attempted = Number(s.total_correct || 0) + Number(s.total_wrong || 0);
    const acc = attempted > 0 ? Math.round(s.total_correct / attempted * 100)
      : IS_ANDROID_APP ? 0 : '—';
    $('#topStats').innerHTML = `
      <div class="stat"><b class="numeric">${s.today_reviewed}</b>今日已学</div>
      <div class="stat"><b class="numeric">${s.mastered}</b>已掌握</div>
      <div class="stat"><b class="numeric"><span>${acc}</span><small class="metric-percent">${acc === '—' ? '' : '%'}</small></b>${IS_ANDROID_APP ? '总正确率' : '全库累计正确率'}</div>`;
  },

  renderBooks(books, mistakeCount) {
    const C = 2 * Math.PI * 26;
    const cards = books.map((b, i) => {
      const pct = b.word_count ? Math.round(b.mastered / b.word_count * 100) : 0;
      const planLine = b.plan.active
        ? `剩 <b>${b.plan.days_left}</b> 天 · 今日新词 <b>${b.new_today}/${b.plan.daily_quota}</b>`
        : `今日还可学新词 <b>${Math.max(0, b.plan.daily_quota - b.new_today)}</b>（未设目标）`;
      return `
      <article class="book-card" style="animation-delay:${i * 70}ms">
        <span class="book-badge ${b.is_builtin ? 'builtin' : ''}">${b.is_builtin ? '内置' : '自建'}</span>
        <h3 class="book-name">${esc(b.name)}</h3>
        <p class="book-desc">${esc(b.description) || ' '}</p>
        <div class="book-meta">
          <div class="ring">
            <svg width="64" height="64">
              <circle class="ring-bg" cx="32" cy="32" r="26" fill="none" stroke-width="6"/>
              <circle class="ring-fg" cx="32" cy="32" r="26" fill="none" stroke-width="6"
                stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct / 100)}"/>
            </svg>
            <span class="ring-text numeric"><span>${pct}</span><small class="metric-percent">%</small></span>
          </div>
          <div class="book-nums">
            <div>共 <b>${b.word_count}</b> 词 · 已掌握 <b>${b.mastered}</b>${b.mistakes ? ` · <span class="has-mistake">${b.mistakes} 错题</span>` : ''}</div>
            <div class="due">待复习 <b>${b.due_review}</b> · ${planLine}</div>
            ${b.plan.active ? `<div class="plan-tag">目标 ${esc(b.plan.target_date)} 学完 · 剩 ${b.plan.remaining_new} 新词</div>` : ''}
          </div>
        </div>
        <div class="book-actions">
          ${MODES.map(m => `
            <button class="btn study-btn ${m.key === 'learn' ? 'btn-primary' : ''}"
              ${b.word_count === 0 ? 'disabled' : ''}
              onclick="location.hash='#/study/${b.id}/${m.key}'">${m.name}</button>`).join('')}
        </div>
        <div class="book-manage-row">
          <span>
            <button class="link-btn" onclick="location.hash='#/book/${b.id}'">管理单词 →</button>
            <button type="button" class="link-btn" data-home-action="plan" data-book-id="${b.id}">学习计划</button>
          </span>
          ${b.is_builtin ? '' : `<button type="button" class="link-btn danger" data-home-action="delete" data-book-id="${b.id}">删除词库</button>`}
        </div>
      </article>`;
    });

    // 错题本卡片
    cards.push(`
      <article class="book-card mistake-card" style="animation-delay:${books.length * 70}ms">
        <span class="book-badge mistake-badge">错题本</span>
        <h3 class="book-name">回炉重造</h3>
        <p class="book-desc">答错的单词自动收进这里，连续答对 3 次后移除</p>
        <div class="book-meta">
          <div class="mistake-count numeric">${mistakeCount}</div>
          <div class="book-nums">
            <div>${mistakeCount ? '有单词等你回炉，趁热打铁' : '空空如也，保持住'}</div>
          </div>
        </div>
        <div class="book-actions">
          ${MODES.filter(m => m.key !== 'learn').map(m => `
            <button class="btn study-btn ${m.key === 'spelling' ? 'btn-vermilion' : ''}"
              ${mistakeCount === 0 ? 'disabled' : ''}
              onclick="location.hash='#/mistakes-study/${m.key}'">${m.name}</button>`).join('')}
        </div>
        <div class="book-manage-row">
          <button class="link-btn" onclick="location.hash='#/mistakes'">查看错题 →</button>
        </div>
      </article>`);

    $('#booksGrid').innerHTML = cards.join('');
  },

  async openPlan(id, name) {
    $('#planBookId').value = id;
    $('#planName').textContent = name;
    $('#planDate').value = '';
    $('#planPreview').innerHTML = '';
    // 取该词库当前计划
    const books = await api('/api/books');
    const book = books.find(b => b.id === id);
    const p = book && book.plan;
    if (p && p.active) {
      $('#planDate').value = p.target_date;
      $('#planCurrent').innerHTML =
        `当前计划：<b>${esc(p.target_date)}</b> 学完 · 剩 <b>${p.remaining_new}</b> 新词 · 每天约 <b>${p.daily_quota}</b> 新词（剩 ${p.days_left} 天）`;
    } else {
      $('#planCurrent').innerHTML = `尚未设定目标 · 词库剩余 <b>${p ? p.remaining_new : 0}</b> 个新词`;
    }
    $('#planModal').classList.remove('hidden');
  },

  async deleteBook(id, name) {
    if (!confirm(`确定删除词库「${name}」？其中的单词将一并删除。`)) return;
    try {
      await api(`/api/books/${id}`, { method: 'DELETE' });
      toast('词库已删除');
      this.render(this.section);
    } catch (e) { toast(e.message); }
  },
};

// Avoid embedding user-defined book names inside executable inline handlers.
$('#booksGrid').addEventListener('click', event => {
  const button = event.target.closest('[data-home-action]');
  if (!button) return;
  const book = Home.books.find(item => item.id === Number(button.dataset.bookId));
  if (!book) return;
  if (button.dataset.homeAction === 'plan') void Home.openPlan(book.id, book.name);
  if (button.dataset.homeAction === 'delete') void Home.deleteBook(book.id, book.name);
});

/* 学习计划表单 */
$('#planDate').addEventListener('change', () => {
  const v = $('#planDate').value;
  if (!v) { $('#planPreview').innerHTML = ''; return; }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.max(1, Math.round((new Date(v + 'T00:00:00') - today) / 86400000) + 1);
  const m = $('#planCurrent').innerHTML.match(/剩余 <b>(\d+)<\/b> 个新词/) || $('#planCurrent').innerHTML.match(/剩 <b>(\d+)<\/b> 新词/);
  const remaining = m ? Number(m[1]) : 0;
  const perDay = Math.min(Math.ceil(remaining / days), 200);
  $('#planPreview').innerHTML = `共 <b>${days}</b> 天 · 每天需新学约 <b>${perDay}</b> 词，复习量由遗忘曲线自动安排`;
});
$('#planForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#planBookId').value;
  try {
    const r = await api(`/api/books/${id}/plan`, { method: 'PUT', body: { target_date: $('#planDate').value } });
    $('#planModal').classList.add('hidden');
    toast(`计划已设定：${r.plan.target_date} 前学完，每天约 ${r.plan.daily_quota} 新词`);
    Home.render(Home.section);
  } catch (err) { toast(err.message); }
});
$('#planClear').addEventListener('click', async () => {
  const id = $('#planBookId').value;
  await api(`/api/books/${id}/plan`, { method: 'DELETE' });
  $('#planModal').classList.add('hidden');
  toast('已取消学习计划，恢复默认每天 15 新词');
  Home.render(Home.section);
});
$('#planCancel').addEventListener('click', () => $('#planModal').classList.add('hidden'));
$('#planModal').addEventListener('click', (e) => { if (e.target.id === 'planModal') $('#planModal').classList.add('hidden'); });

/* 新建词库 */
$('#newBookToggle').addEventListener('click', () => {
  $('#newBookToggle').classList.add('hidden');
  $('#newBookForm').classList.remove('hidden');
  $('#newBookName').focus();
});
$('#newBookCancel').addEventListener('click', () => {
  $('#newBookForm').classList.add('hidden');
  $('#newBookToggle').classList.remove('hidden');
});
$('#newBookForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/books', { method: 'POST', body: { name: $('#newBookName').value, description: $('#newBookDesc').value } });
    $('#newBookName').value = ''; $('#newBookDesc').value = '';
    $('#newBookForm').classList.add('hidden');
    $('#newBookToggle').classList.remove('hidden');
    toast('词库已创建，去添加单词吧');
    Home.render(Home.section);
  } catch (err) { toast(err.message); }
});

/* ============================================================
   学习页
   ============================================================ */
const POS_OPTIONS = ['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'art.'];
// 归一化词性用于判断：vt./vi.→v.  a.→adj.  ad.→adv.
function normalizePos(pos) {
  return Domain.normalizePartOfSpeech(pos);
}

const Study = {
  bookId: null, mode: null, queue: [], total: 0, done: 0,
  correctCount: 0, firstCorrectCount: 0, retryCorrectCount: 0,
  wrongCount: 0, abandonedCount: 0, retryCount: 0,
  sessionId: null,
  todayFlow: null,
  mistakeDrill: null,
  instanceId: null,
  attemptedWordIds: new Set(), retryWordIds: new Set(), learnAgainIds: new Set(), learnCompletedIds: new Set(),
  current: null, locked: false, roundWords: [], guidedRun: false, guidedSpellWords: null,
  keyHandler: null,
  runToken: 0,

  async start(bookId, mode, options = {}) {
    this.todayFlow = null;
    this.mistakeDrill = null;
    $('#desktopStudyJourney').classList.add('hidden');
    $('#studyExit').textContent = '← 退出';
    this.bookId = bookId; this.mode = mode;
    this.guidedRun = Boolean(options.guided && mode === 'learn');
    if (!this.guidedRun) this.guidedSpellWords = null;
    show('study');
    $('#studyDone').classList.add('hidden');
    $('#studyStage').classList.remove('hidden');
    $('#studyModeTag').textContent = `${this.guidedRun ? '初次体验 · ' : ''}${MODES.find(m => m.key === mode)?.name || mode}`;
    $('#studyStage').innerHTML = '<div class="quiz-card"><p class="quiz-kicker">LOADING …</p></div>';
    const params = new URLSearchParams({ mode });
    if (!IS_ANDROID_APP && mode !== 'learn') params.set('session_limit', String(desktopRoundSize()));
    if (!IS_ANDROID_APP && mode === 'learn' && !options.limit) params.set('limit', String(desktopRoundSize()));
    if (options.limit > 0) params.set('limit', String(Math.min(Math.floor(options.limit), 50)));
    showPageLoading('正在准备这一轮的单词…');
    try {
      const words = await api(`/api/books/${bookId}/study?${params}`);
      clearPageStatus();
      this.begin(words);
      $('#studyExit').onclick = () => { location.hash = '#/'; };
    } catch (error) {
      showPageError(`单词暂时无法加载：${error.message}`, () => this.start(bookId, mode, options));
    }
  },

  async startToday(bookId) {
    if (IS_ANDROID_APP) return;
    this.todayFlow = null;
    this.mistakeDrill = null;
    this.bookId = bookId;
    this.mode = 'meaning';
    this.guidedRun = false;
    show('study');
    $('#studyDone').classList.add('hidden');
    $('#studyStage').classList.remove('hidden');
    $('#studyStage').innerHTML = '<div class="quiz-card"><p class="quiz-kicker">LOADING TODAY…</p></div>';
    $('#studyExit').textContent = '← 保存进度并退出';
    $('#studyExit').onclick = () => { location.hash = '#/'; };
    // An independent temporary test database can share the same localhost
    // origin as the user's real installation. Never restore its checkpoints.
    try {
      const identity = await api('/api/desktop/identity');
      if (location.hash !== `#/today-study/${bookId}`) return;
      this.instanceId = identity.instance_id;
    } catch (error) {
      showPageError(`无法验证当前词库的数据身份：${error.message}`, () => this.startToday(bookId));
      return;
    }
    const cached = DesktopCheckpoint.read(localStorage, bookId, Domain.localDayKey(), this.instanceId);
    if (cached) {
      this.restoreToday(cached);
      return;
    }
    showPageLoading('正在准备完整的今日任务…');
    try {
      const payload = await api(`/api/desktop/books/${bookId}/today`);
      if (location.hash !== `#/today-study/${bookId}`) return;
      clearPageStatus();
      this.todayFlow = {
        bookId, day: Domain.localDayKey(),
        stage: payload.review.length ? 'review' : 'learn',
        review: payload.review,
        learn: payload.learn,
        reviewTotal: payload.review.length,
        learnTotal: payload.learn.length,
        completed: { review: 0, learn: 0, spelling: 0 },
        reviewHasMore: payload.review_has_more,
        learnHasMore: payload.learn_has_more,
      };
      this.mode = payload.review.length ? 'meaning' : 'learn';
      $('#studyModeTag').textContent = payload.review.length ? '今日任务 · 第一步：到期复习' : '今日任务 · 新词学习';
      if (!payload.review.length && !payload.learn.length) {
        $('#studyStage').innerHTML = `<div class="quiz-card">
          <p class="quiz-kicker">TODAY COMPLETE</p>
          <h2 class="quiz-word" style="font-size:30px">今天的任务已完成</h2>
          <p class="quiz-meaning">已经没有待复习和计划内的新词了，可以查看学习数据，或明天继续。</p>
          <div class="quiz-actions"><button class="btn btn-primary" id="todayNoTasksBack">返回今日</button></div>
        </div>`;
        $('#todayNoTasksBack').onclick = () => { location.hash = '#/'; };
        this.renderTodayJourney();
        return;
      }
      this.begin(payload.review.length ? payload.review : payload.learn);
    } catch (error) {
      showPageError(`今日任务加载失败：${error.message}`, () => this.startToday(bookId));
    }
  },

  saveTodayCheckpoint(includeCurrent = true, phaseDone = false) {
    if (IS_ANDROID_APP || !this.todayFlow) return;
    const day = Domain.localDayKey();
    const snapshot = {
      version: DesktopCheckpoint.VERSION, day: this.todayFlow.day || day,
      bookId: this.bookId, instanceId: this.instanceId,
      stage: this.todayFlow.stage, phaseDone,
      flow: {
        review: this.todayFlow.review, learn: this.todayFlow.learn,
        reviewTotal: this.todayFlow.reviewTotal,
        learnTotal: this.todayFlow.learnTotal,
        completed: { ...this.todayFlow.completed },
        reviewHasMore: this.todayFlow.reviewHasMore,
        learnHasMore: this.todayFlow.learnHasMore,
      },
      queue: [...(includeCurrent && this.current ? [this.current] : []), ...this.queue],
      roundWords: this.roundWords,
      total: this.total, done: this.done, sessionId: this.sessionId,
      counters: {
        correctCount: this.correctCount, firstCorrectCount: this.firstCorrectCount,
        retryCorrectCount: this.retryCorrectCount, wrongCount: this.wrongCount,
        abandonedCount: this.abandonedCount, retryCount: this.retryCount,
      },
      attemptedWordIds: [...this.attemptedWordIds],
      retryWordIds: [...this.retryWordIds],
      learnAgainIds: [...this.learnAgainIds],
      learnCompletedIds: [...this.learnCompletedIds],
    };
    if (!DesktopCheckpoint.write(localStorage, snapshot)) {
      console.warn('本地学习断点暂时不可保存。请检查浏览器存储空间。');
      $('#studyExit').textContent = '← 退出（断点未保存）';
      if (!this.checkpointWarned) {
        this.checkpointWarned = true;
        toast('本地空间不足或禁用了存储，当前断点未保存；建议完成这一轮后再退出');
      }
    } else {
      this.checkpointWarned = false;
      $('#studyExit').textContent = '← 保存进度并退出';
    }
  },

  restoreToday(snapshot) {
    this.runToken++;
    // Reconstitute the original spelling manifest from older valid snapshots.
    // Only the pending queue remains shortened: answered words stay answered.
    snapshot = DesktopCheckpoint.repairLearnManifest(snapshot);
    this.todayFlow = { bookId: snapshot.bookId, day: snapshot.day, stage: snapshot.stage, ...snapshot.flow };
    this.mode = snapshot.stage === 'review' ? 'meaning' : snapshot.stage === 'learn' ? 'learn' : 'spelling';
    this.guidedRun = false;
    this.queue = snapshot.queue.slice();
    this.roundWords = snapshot.roundWords.slice();
    this.total = snapshot.total;
    this.done = snapshot.done;
    this.current = null;
    this.locked = false;
    this.sessionId = snapshot.sessionId; // Required to classify retries reliably.
    Object.assign(this, snapshot.counters);
    for (const field of ['attemptedWordIds', 'retryWordIds', 'learnAgainIds', 'learnCompletedIds']) {
      this[field] = new Set(snapshot[field].map(String));
    }
    $('#studyModeTag').textContent = this.mode === 'meaning'
      ? '接着学 · 到期复习' : this.mode === 'learn'
        ? '接着学 · 新词学习' : '接着学 · 巩固默写';
    $('#studyStage').classList.toggle('dictionary-stage', this.mode === 'learn');
    this.updateProgress();
    if (snapshot.phaseDone) {
      void this.finish();
    } else if (this.queue.length) {
      this.next();
    } else {
      void this.finish();
    }
  },

  renderTodayJourney() {
    const host = $('#desktopStudyJourney');
    if (IS_ANDROID_APP || !this.todayFlow) { host.classList.add('hidden'); return; }
    host.classList.remove('hidden');
    const flow = this.todayFlow;
    const completed = { ...flow.completed };
    if (flow.stage && this.total) completed[flow.stage] = Math.max(completed[flow.stage], this.done);
    const steps = [
      { id: 'review', title: '到期复习', target: flow.reviewTotal },
      { id: 'learn', title: '学习新词', target: flow.learnTotal },
      { id: 'spelling', title: '巩固默写', target: Domain.spellingWords(flow.learn).length },
    ];
    $('#desktopStudySteps').innerHTML = steps.map((step, i) => {
      const done = Math.min(completed[step.id] || 0, step.target);
      const active = step.id === flow.stage;
      const finished = done === step.target && step.target > 0;
      const status = step.target === 0 ? '本日无需' : finished ? '已完成'
        : active ? `${done} / ${step.target}` : `共 ${step.target} 词`;
      return `<div class="desktop-journey-step ${active ? 'active' : ''} ${finished ? 'finished' : ''}"
        role="listitem" ${active ? 'aria-current="step"' : ''}>
        <span class="desktop-journey-step-number">${finished ? '✓' : String(i + 1).padStart(2, '0')}</span>
        <span class="desktop-journey-step-text"><strong>${step.title}</strong><small>${status}</small></span>
      </div>`;
    }).join('');
    const total = flow.reviewTotal + flow.learnTotal;
    const achieved = Math.min(total, Math.min(flow.reviewTotal, completed.review)
      + Math.min(flow.learnTotal, completed.learn));
    const pct = total ? Math.round(achieved * 100 / total) : 100;
    $('#desktopStudyOverallText').textContent = `今日任务 ${achieved} / ${total} 词 · 巩固默写另计`;
    $('#desktopStudyOverallFill').style.width = `${pct}%`;
  },

  continueToday(stage) {
    if (!this.todayFlow) return;
    this.todayFlow.stage = stage;
    if (stage === 'learn') {
      this.mode = 'learn';
      $('#studyModeTag').textContent = '今日任务 · 第二步：学习新词';
      this.begin(this.todayFlow.learn);
    } else if (stage === 'spelling') {
      this.mode = 'spelling';
      $('#studyModeTag').textContent = '今日任务 · 第三步：巩固默写';
      this.begin(Domain.spellingWords(this.todayFlow.learn).map(word => ({ ...word, is_new: 0 })));
    }
    $('#studyDone').classList.add('hidden');
    $('#studyStage').classList.remove('hidden');
    $('#studyStage').classList.toggle('dictionary-stage', stage === 'learn');
  },

  startGuidedSpelling(bookId) {
    this.todayFlow = null;
    this.mistakeDrill = null;
    $('#desktopStudyJourney').classList.add('hidden');
    $('#studyExit').textContent = '← 退出';
    let words = this.guidedSpellWords || [];
    if (!words.length) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(GUIDED_SPELLING_KEY) || 'null');
        if (cached?.bookId === bookId && Array.isArray(cached.words)) words = cached.words;
      } catch {}
    }
    if (!words.length) return this.start(bookId, 'spelling');
    this.guidedSpellWords = words;
    this.bookId = bookId;
    this.mode = 'spelling';
    this.guidedRun = true;
    show('study');
    $('#studyDone').classList.add('hidden');
    $('#studyStage').classList.remove('hidden');
    $('#studyModeTag').textContent = '初次体验 · 拼写默写';
    $('#studyExit').onclick = () => { location.hash = '#/'; };
    this.begin(words);
  },

  begin(words) {
    this.runToken++;
    this.clearSaveFailure();
    $('#studyStage').classList.toggle('dictionary-stage', this.mode === 'learn');
    if (!words.length) {
      $('#studyStage').innerHTML = `
        <div class="quiz-card">
          <p class="quiz-kicker">ALL CLEAR</p>
          <h2 class="quiz-word" style="font-size:30px">今日计划已完成</h2>
          <p class="quiz-meaning">到期复习和今日新词配额都已学完，明天再来，或调整学习计划。</p>
        </div>`;
      return;
    }
    let queue = words;
    if (this.mode === 'spelling') queue = Domain.spellingWords(words);
    if (this.mode === 'spelling' && words.length && !queue.length) {
      this.roundWords = [];
      this.queue = [];
      this.total = 0;
      this.done = 0;
      this.current = null;
      this.updateProgress();
      $('#studyStage').innerHTML = `
        <div class="quiz-card">
          <p class="quiz-kicker">SPELLING · 暂无可用题目</p>
          <h2 class="quiz-word" style="font-size:30px">这批词暂时无法默写</h2>
          <p class="quiz-meaning">单词或词组只支持英文字母、空格、连字符和撇号。你可以切换到释义选择，或返回今日页。</p>
          <div class="quiz-actions">
            <button type="button" class="btn btn-primary" id="spellingFallbackMeaning">改用释义选择</button>
            <button type="button" class="btn btn-ghost" id="spellingFallbackHome">返回今日</button>
          </div>
        </div>`;
      $('#spellingFallbackMeaning').onclick = () => { location.hash = `#/study/${this.bookId}/meaning`; };
      $('#spellingFallbackHome').onclick = () => { location.hash = '#/'; };
      return;
    }
    // Keep the complete study manifest immutable. next() consumes its own
    // working queue via shift(); otherwise saving halfway loses already learned
    // words from today's spelling phase after a restart.
    this.roundWords = queue.slice();
    this.queue = queue.slice();
    this.total = queue.length;
    this.done = 0;
    this.correctCount = 0; this.firstCorrectCount = 0; this.retryCorrectCount = 0;
    this.wrongCount = 0; this.abandonedCount = 0; this.retryCount = 0;
    this.sessionId = makeRequestId();
    this.attemptedWordIds = new Set(); this.retryWordIds = new Set(); this.learnAgainIds = new Set(); this.learnCompletedIds = new Set();
    this.current = null;
    this.renderTodayJourney();
    this.next();
  },

  leave() {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler, true);
      this.keyHandler = null;
    }
  },

  scheduleNext(delay) {
    const token = this.runToken;
    setTimeout(() => {
      if (this.runToken !== token || $('#view-study').classList.contains('hidden')) return;
      this.next();
    }, delay);
  },

  next() {
    this.leave();
    this.clearSaveFailure();
    if (!this.queue.length) return this.finish();
    this.current = this.queue.shift();
    this.locked = false;
    this.saveTodayCheckpoint(true, false);
    this.updateProgress();
    if (this.mode === 'learn') this.renderLearn(this.current);
    else if (this.mode === 'spelling') this.renderSpelling(this.current);
    else if (this.mode === 'pos') this.renderPos(this.current);
    else this.renderMeaning(this.current);
  },

  updateProgress() {
    const pct = Domain.progressPercent(this.done, this.total);
    $('#studyProgressFill').style.width = pct + '%';
    $('#studyProgressText').textContent = `${Math.min(this.done, this.total)} / ${this.total}` +
      (this.retryCount ? ` · 回炉 ${this.retryCount}` : '');
    this.renderTodayJourney();
  },

  createProgressAttempt(correct, failedOutcome, answerValue) {
    const wordId = String(this.current.id);
    const outcome = Domain.classifyOutcome(correct, this.retryWordIds.has(wordId), failedOutcome);
    return {
      word_id: this.current.id,
      correct,
      is_new: Boolean(this.current.is_new) && !this.attemptedWordIds.has(wordId),
      request_id: makeRequestId(),
      session_id: this.sessionId,
      outcome,
      judgement_mode: this.mode,
      answer_value: String(answerValue ?? ''),
    };
  },

  async report(payload) {
    const result = await api('/api/progress', { method: 'POST', body: payload });
    const outcome = result.outcome || payload.outcome;
    const wordId = String(payload.word_id);
    this.attemptedWordIds.add(wordId);

    if (outcome === 'first_correct') {
      this.queue = this.queue.filter(word => String(word.id) !== wordId);
      this.firstCorrectCount++;
      this.correctCount++;
      this.done++;
    } else if (outcome === 'retry_correct') {
      this.queue = this.queue.filter(word => String(word.id) !== wordId);
      this.retryCorrectCount++;
      this.correctCount++;
      this.done++;
    } else {
      if (outcome === 'abandoned') this.abandonedCount++;
      else this.wrongCount++;
      this.retryWordIds.add(wordId);
      this.retryCount = this.retryWordIds.size;
      if (!this.queue.some(word => String(word.id) === wordId)) this.queue.push(this.current);
    }
    this.updateProgress();
    this.saveTodayCheckpoint(false, false);
  },

  clearSaveFailure() {
    $('#saveFailure')?.remove();
  },

  showSaveFailure(retry) {
    this.clearSaveFailure();
    const card = $('#quizCard') || $('#studyStage');
    if (!card) return;
    const panel = document.createElement('div');
    panel.id = 'saveFailure';
    panel.className = 'save-failure';
    const message = document.createElement('p');
    message.textContent = '保存失败，当前题目和判定已保留。请重试保存后继续。';
    const button = document.createElement('button');
    button.className = 'btn btn-primary';
    button.textContent = '重试保存';
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = '正在保存…';
      await retry();
    });
    panel.append(message, button);
    card.append(panel);
  },

  async saveProgressAttempt(payload, afterSaved) {
    this.clearSaveFailure();
    try {
      await this.report(payload);
    } catch (error) {
      this.showSaveFailure(() => this.saveProgressAttempt(payload, afterSaved));
      return;
    }
    this.clearSaveFailure();
    afterSaved();
  },

  /* ---------- 学词模式：翻卡浏览，不计对错 ---------- */
  renderLearn(w) {
    const stage = $('#studyStage');
    stage.innerHTML = `
    <article class="quiz-card dictionary-entry" id="quizCard">
      <p class="quiz-kicker dictionary-kicker">LEARN · 新词学习</p>
      <header class="dictionary-wordhead">
        <h2 class="dictionary-headword">${esc(wordHeadword(w))}</h2>
        ${wordPronunciationMarkup(w, 'dictionary-pronunciation')}
        ${wordDictionaryMetaMarkup(w)}
      </header>
      <p class="dictionary-hint" id="dictionaryHint">
        <span class="dictionary-hint-desktop">先读词头与发音，再查看释义 <kbd>空格</kbd></span>
        <span class="dictionary-hint-touch">点按查看释义，也可上滑</span>
      </p>
      <button type="button" class="btn btn-primary dictionary-reveal" id="flipToggle" aria-controls="learnMeaning" aria-expanded="false">查看释义</button>
      <section class="dictionary-meaning hidden" id="learnMeaning" aria-labelledby="dictionaryMeaningTitle">
        <h3 class="dictionary-meaning-title" id="dictionaryMeaningTitle">释义</h3>
        ${wordMeaningMarkup(w, 'meaning-structured')}
        ${w.example ? `<p class="learn-example">${esc(w.example)}</p>` : ''}
      </section>
      <div class="quiz-actions dictionary-actions hidden" id="learnActions">
        <span class="dictionary-swipe-note">左滑还不太熟 · 右滑学会了</span>
        <button class="btn btn-ghost" id="learnAgain">还不太熟 <kbd>←</kbd></button>
        <button class="btn btn-primary" id="learnKnow">学会了 <kbd>Enter</kbd></button>
      </div>
    </article>`;
    speak(wordSpeech(w));

    const setMeaningOpen = open => {
      const panel = $('#learnMeaning');
      const actions = $('#learnActions');
      const reveal = $('#flipToggle');
      panel.classList.toggle('hidden', !open);
      actions.classList.toggle('hidden', !open);
      $('#dictionaryHint').classList.toggle('hidden', open);
      reveal.setAttribute('aria-expanded', String(open));
      reveal.textContent = open ? '收起释义' : '查看释义';
      reveal.classList.toggle('btn-primary', !open);
      reveal.classList.toggle('btn-ghost', open);
    };
    const toggleMeaning = () => setMeaningOpen($('#flipToggle').getAttribute('aria-expanded') !== 'true');
    bindTapAction($('#flipToggle'), toggleMeaning);

    const saveLearnChoice = async (needsReview) => {
      if (this.locked) return;
      this.locked = true;
      $('#learnKnow').disabled = true;
      $('#learnAgain').disabled = true;
      const save = async () => {
        try {
          await api('/api/learn', { method: 'POST', body: { word_id: w.id } });
        } catch (error) {
          this.showSaveFailure(save);
          return;
        }
        this.clearSaveFailure();
        const choice = Domain.recordLearnChoice(this.learnCompletedIds, w.id, needsReview);
        this.done = choice.completedCount;
        if (choice.requeue) {
          this.learnAgainIds.add(String(w.id));
          this.queue.push(w); // 没记住的本轮再看一次
        } else {
          this.correctCount++;
        }
        this.retryCount = this.learnAgainIds.size;
        this.updateProgress();
        this.saveTodayCheckpoint(false, false);
        this.next();
      };
      await save();
    };

    bindTapAction($('#learnKnow'), () => saveLearnChoice(false));
    bindTapAction($('#learnAgain'), () => saveLearnChoice(true));

    const card = $('#quizCard');
    let swipeStart = null;
    card.addEventListener('touchstart', event => {
      if (event.touches.length !== 1 || event.target.closest('button, a, input, textarea, select')) {
        swipeStart = null;
        return;
      }
      const touch = event.touches[0];
      swipeStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    card.addEventListener('touchend', event => {
      if (!swipeStart || event.touches.length) { swipeStart = null; return; }
      const touch = event.changedTouches[0];
      const dx = touch.clientX - swipeStart.x;
      const dy = touch.clientY - swipeStart.y;
      swipeStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 58) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.25 && dy < 0
          && $('#flipToggle').getAttribute('aria-expanded') !== 'true') {
        if (event.cancelable) event.preventDefault();
        toggleMeaning();
      } else if (Math.abs(dx) > Math.abs(dy) * 1.25
          && $('#flipToggle').getAttribute('aria-expanded') === 'true') {
        if (event.cancelable) event.preventDefault();
        saveLearnChoice(dx < 0);
      }
    }, { passive: false });

    // 快捷键：空格翻面（可翻回）· Enter 学会了 · ← 还不太熟 · R 重听发音
    this.keyHandler = (e) => {
      if (e.target.closest('button, input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === ' ') {
        e.preventDefault();
        toggleMeaning();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if ($('#flipToggle').getAttribute('aria-expanded') !== 'true') toggleMeaning();
        else $('#learnKnow')?.click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if ($('#flipToggle').getAttribute('aria-expanded') === 'true') $('#learnAgain')?.click();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        speak(wordSpeech(w));
      }
    };
    document.addEventListener('keydown', this.keyHandler, true);
  },

  /* ---------- 拼写默写：光标可自由移动 ---------- */
  renderSpelling(w) {
    const target = Domain.normalizeSpelling(wordAnswer(w));
    const answerLabel = wordHeadword(w);
    const letterCount = (target.match(/[a-z]/g) || []).length;
    const stage = $('#studyStage');
    stage.innerHTML = `
    <div class="quiz-card spell-card" id="quizCard">
      <p class="quiz-kicker">SPELLING · 根据释义默写单词</p>
      ${wordPosMarkup(w) || `<span class="quiz-pos">词性未知</span>`}
      <div id="spellPrompt">${wordMeaningMarkup(w)}</div>
      <p class="spell-hint" id="spellHint">共 ${letterCount} 个字母${target.includes(' ') ? ' · 按词组保留空格' : ''} · 首字母 <b>${esc(target[0])}</b> · 点击字母区输入、粘贴或定位光标</p>
      <div class="spell-input-area" id="spellInputArea">
        <div class="spell-slots" id="slots" aria-hidden="true"></div>
      <input type="text" class="spell-input" id="spellInput" lang="en" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" inputmode="text" enterkeyhint="done" aria-label="单词或词组拼写" aria-describedby="spellHint spellFeedback">
      </div>
      <p class="spell-feedback" id="spellFeedback" aria-live="polite"></p>
      <div class="quiz-actions">
        <button type="button" class="btn btn-primary" id="spellSubmit">确认拼写 <kbd>Enter</kbd></button>
        <button type="button" class="btn btn-ghost" id="spellGiveUp">不会，看答案 <kbd>↓</kbd></button>
        <button type="button" class="btn btn-ghost" id="spellSpeak">${speakerIconMarkup} 听发音 <kbd>↑</kbd></button>
      </div>
    </div>`;
    speak(wordSpeech(w));

    // One real text input covers the visible slots for mobile keyboards, paste and screen readers.
    // The slots mirror its value and provide a larger, single visible input surface.
    const state = { chars: [], cursor: 0, done: false, judged: false, composing: false, wrongSaved: false };
    const slotsEl = $('#slots');
    const feedback = $('#spellFeedback');
    const spellInput = $('#spellInput');
    const dismissKeyboard = () => {
      if (document.activeElement === spellInput) spellInput.blur();
    };

    const render = (judged = state.judged) => {
      slotsEl.innerHTML = target.split('').map((c, i) => {
        if (c === ' ') return '<span class="slot space" aria-hidden="true"></span>';
        const typed = state.chars[i];
        let cls = 'slot';
        if (typed) cls += ' filled';
        if (i === state.cursor && !state.done) cls += ' current';
        if (judged && typed) cls += typed === c ? ' ok' : ' bad';
        return `<span class="${cls}" data-i="${i}">${typed ? esc(typed) : ''}</span>`;
      }).join('');
    };
    render(false);

    const syncFromInput = () => {
      if (state.composing) return;
      const raw = spellInput.value;
      const cursor = spellInput.selectionStart ?? raw.length;
      const filtered = Domain.filterSpellingInput(raw, target.length);
      state.chars = [...filtered];
      state.cursor = Math.min(cursor, filtered.length);
      if (filtered !== raw) {
        spellInput.value = filtered;
        spellInput.setSelectionRange(state.cursor, state.cursor);
      }
      state.judged = false;
      feedback.className = 'spell-feedback';
      feedback.textContent = '';
      render(false);
    };
    spellInput.addEventListener('input', syncFromInput);
    spellInput.addEventListener('compositionstart', () => { state.composing = true; });
    spellInput.addEventListener('compositionend', () => {
      state.composing = false;
      syncFromInput();
    });
    spellInput.addEventListener('keyup', () => {
      state.cursor = spellInput.selectionStart ?? state.chars.length;
      render();
    });

    if (IS_ANDROID_APP) {
      requestAnimationFrame(() => {
        if (!spellInput.isConnected || spellInput.disabled || state.done) return;
        spellInput.focus({ preventScroll: true });
        const end = spellInput.value.length;
        spellInput.setSelectionRange(end, end);
      });
    }

    const submit = async () => {
      if (this.locked || state.done) return;
      const val = Domain.normalizeSpellingAnswer(state.chars.join(''));
      if (!val) { spellInput.focus(); return; }
      dismissKeyboard();
      if (val === target) {
        state.done = true;
        this.locked = true;
        spellInput.disabled = true;
        render(true);
        feedback.className = 'spell-feedback ok';
        feedback.textContent = `拼写正确：${answerLabel}。正在保存答案。`;
        const payload = this.createProgressAttempt(true, undefined, spellInput.value);
        this.saveProgressAttempt(payload, () => {
          feedback.textContent = `拼写正确：${answerLabel}。已保存，下一题即将开始。`;
          this.scheduleNext(800);
        });
      } else {
        $('#quizCard').classList.remove('shake');
        void $('#quizCard').offsetWidth;
        $('#quizCard').classList.add('shake');
        state.judged = true;
        this.locked = true;
        spellInput.disabled = true;
        render(true);
        feedback.className = 'spell-feedback bad';
        feedback.textContent = `答案不正确。正在保存这次错误；正确拼写：${answerLabel}。`;
        const payload = this.createProgressAttempt(false, 'wrong', spellInput.value);
        this.saveProgressAttempt(payload, () => {
          state.wrongSaved = true;
          this.locked = false;
          spellInput.disabled = false;
          $('#spellGiveUp').textContent = '跳过，稍后回炉 →';
          feedback.textContent = `这次错误已保存。正确拼写：${answerLabel}。改正后再次确认会记为回炉答对，也可跳过稍后回炉。`;
          spellInput.focus();
        });
      }
    };

    this.keyHandler = (e) => {
      if (e.target === spellInput || e.target.closest('button, input, textarea, select, [contenteditable="true"]')) return;
      if (this.locked || state.done) return;
      const k = e.key;
      if (k === 'Enter') { e.preventDefault(); submit(); return; }
      if (k === 'ArrowDown') { e.preventDefault(); $('#spellGiveUp')?.click(); return; }
      if (k === 'ArrowUp') { e.preventDefault(); speak(wordSpeech(w)); return; }
      if (k === 'ArrowLeft') { e.preventDefault(); state.cursor = Math.max(0, state.cursor - 1); spellInput.focus(); spellInput.setSelectionRange(state.cursor, state.cursor); render(false); return; }
      if (k === 'ArrowRight') { e.preventDefault(); state.cursor = Math.min(state.chars.length, state.cursor + 1); spellInput.focus(); spellInput.setSelectionRange(state.cursor, state.cursor); render(false); return; }
      if (k === 'Backspace') {
        e.preventDefault();
        if (state.cursor > 0) { state.chars.splice(state.cursor - 1, 1); state.cursor--; }
        spellInput.value = state.chars.join(''); spellInput.focus(); spellInput.setSelectionRange(state.cursor, state.cursor); render(false); return;
      }
      if (k === 'Delete') {
        e.preventDefault();
        if (state.cursor < state.chars.length) state.chars.splice(state.cursor, 1);
        spellInput.value = state.chars.join(''); spellInput.focus(); spellInput.setSelectionRange(state.cursor, state.cursor); render(false); return;
      }
      if (k === 'Home') { e.preventDefault(); state.cursor = 0; spellInput.focus(); spellInput.setSelectionRange(0, 0); render(false); return; }
      if (k === 'End') { e.preventDefault(); state.cursor = state.chars.length; spellInput.focus(); spellInput.setSelectionRange(state.cursor, state.cursor); render(false); return; }
      if (/^[a-z\-']$/i.test(k) && state.chars.length < target.length) {
        e.preventDefault();
        state.chars.splice(state.cursor, 0, k.toLowerCase());
        state.cursor++;
        spellInput.value = state.chars.join('');
        spellInput.focus(); spellInput.setSelectionRange(state.cursor, state.cursor);
        render(false);
      }
    };
    document.addEventListener('keydown', this.keyHandler, true);

    // 输入控件覆盖整个字母区；点击任意位置都能唤起软键盘，并把光标放到最近的字母格。
    spellInput.addEventListener('click', (e) => {
      if (state.done) return;
      let nearest = null;
      let nearestDistance = Infinity;
      slotsEl.querySelectorAll('.slot[data-i]').forEach(slot => {
        const rect = slot.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const distance = dx * dx + dy * dy;
        if (distance < nearestDistance) {
          nearest = slot;
          nearestDistance = distance;
        }
      });
      state.cursor = Math.min(nearest ? Number(nearest.dataset.i) : state.chars.length, state.chars.length);
      spellInput.setSelectionRange(state.cursor, state.cursor);
      render(false);
    });

    bindTapAction($('#spellSubmit'), submit);
    spellInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
    bindTapAction($('#spellSpeak'), () => speak(wordSpeech(w)));

    // 未作答时看答案会记录放弃；错答已保存后，跳过会沿着回炉队列继续。
    bindTapAction($('#spellGiveUp'), async () => {
      if (this.locked || state.done) return;
      dismissKeyboard();
      if (state.wrongSaved) {
        state.done = true;
        this.next();
        return;
      }
      state.done = true;
      this.locked = true;
      this.leave();
      spellInput.disabled = true;
      slotsEl.innerHTML = target.split('').map(c => `<span class="slot bad">${esc(c)}</span>`).join('');
      feedback.className = 'spell-feedback bad';
      feedback.textContent = `正确拼写：${answerLabel}${w.phonetic_display ? ` · ${w.phonetic_display}` : w.phonetic ? ` · /${w.phonetic}/` : ''}。这道题已加入回炉，确认后继续。`;
      const actions = $('#quizCard .quiz-actions');
      actions.innerHTML = `
        <button type="button" class="btn btn-vermilion" id="spellGotIt">记住了，继续 →</button>
        <button type="button" class="btn btn-ghost" id="spellSpeak2">${speakerIconMarkup} 再听一遍</button>`;
      $('#spellGotIt').disabled = true;
      bindTapAction($('#spellSpeak2'), () => speak(wordSpeech(w)));
      bindTapAction($('#spellGotIt'), () => this.next());
      this.keyHandler = (e) => {
        if (e.key === 'Enter' && !$('#spellGotIt')?.disabled) {
          e.preventDefault(); this.leave(); this.next();
        }
      };
      document.addEventListener('keydown', this.keyHandler, true);
      const payload = this.createProgressAttempt(false, 'abandoned', target);
      this.saveProgressAttempt(payload, () => { $('#spellGotIt').disabled = false; });
    });
  },

  /* ---------- 释义选择 ---------- */
  renderMeaning(w) {
    const stage = $('#studyStage');
    const keys = ['A', 'B', 'C', 'D'];
    stage.innerHTML = `
    <div class="quiz-card" id="quizCard">
      <p class="quiz-kicker">MEANING · 选出正确释义</p>
      <h2 class="quiz-word">${esc(wordHeadword(w))}</h2>
      ${wordPronunciationMarkup(w)}
      ${wordPosMarkup(w)}
      <div class="choices" id="choices">
        ${(w.choices || [w.meaning]).map((c, i) => `
          <button type="button" class="choice" data-meaning="${esc(c)}" aria-label="选项 ${keys[i]}：${esc(c === w.meaning ? wordMeaningSummary(w) : c)}"><span class="key">${keys[i]}</span><span>${choiceMeaningMarkup(c, w)}</span></button>`).join('')}
      </div>
      <p class="answer-result" id="answerResult" aria-live="polite"></p>
    </div>`;
    speak(wordSpeech(w));

    const answer = async (el) => {
      if (!el || this.locked) return;
      this.locked = true;
      const ok = el.dataset.meaning === w.meaning;
      [...$('#choices').children].forEach(c => {
        c.classList.add('locked');
        c.disabled = true;
        if (c.dataset.meaning === w.meaning) c.classList.add('ok');
      });
      if (!ok) { el.classList.add('bad'); $('#quizCard').classList.add('shake'); }
      $('#answerResult').className = `answer-result ${ok ? 'ok' : 'bad'}`;
      $('#answerResult').textContent = ok ? '选好了，正在保存答案。' : '答案不对，正在保存并安排回炉。';
      const payload = this.createProgressAttempt(ok, ok ? undefined : 'wrong', el.dataset.meaning);
      this.saveProgressAttempt(payload, () => {
        if (ok) {
          $('#answerResult').textContent = `回答正确：${wordMeaningSummary(w)}。下一题即将开始。`;
          this.scheduleNext(900);
        } else {
          $('#answerResult').textContent = `正确释义：${wordMeaningSummary(w)}。已加入回炉，点继续开始下一题。`;
          this.waitContinue();
        }
      });
    };

    $('#choices').addEventListener('click', (e) => {
      const el = e.target.closest('.choice');
      if (el) answer(el);
    });

    // 键盘：A-D 或 1-4 选择
    const keyMap = ['a', 'b', 'c', 'd'];
    this.keyHandler = (e) => {
      if (this.locked || e.target.closest('button, input, textarea, select, [contenteditable="true"]')) return;
      let idx = keyMap.indexOf(e.key.toLowerCase());
      if (idx < 0 && e.key >= '1' && e.key <= '4') idx = Number(e.key) - 1;
      const el = $('#choices')?.children[idx];
      if (el) { e.preventDefault(); answer(el); }
    };
    document.addEventListener('keydown', this.keyHandler, true);
  },

  // 答错后停留在卡片上，按 Enter/空格/点击按钮继续
  waitContinue() {
    const card = $('#quizCard');
    if (!card || $('#continueBtn')) return;
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.id = 'continueBtn';
    btn.textContent = '继续 →';
    btn.setAttribute('aria-label', '显示下一道题');
    btn.style.marginTop = '22px';
    btn.onclick = () => this.next();
    card.appendChild(btn);
    btn.focus();
    this.leave();
    this.keyHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.next(); }
    };
    document.addEventListener('keydown', this.keyHandler, true);
  },

  /* ---------- 词性判断 ---------- */
  renderPos(w) {
    const target = normalizePos(w.pos);
    if (!target) { // 词性无法归一化则跳过此题（计入完成，不计对错）
      this.done++; return this.next();
    }
    const stage = $('#studyStage');
    stage.innerHTML = `
    <div class="quiz-card" id="quizCard">
      <p class="quiz-kicker">PART OF SPEECH · 选出词性</p>
      <h2 class="quiz-word">${esc(wordHeadword(w))}</h2>
      ${wordPronunciationMarkup(w)}
      ${wordMeaningMarkup(w, 'quiz-meaning', { hidePartOfSpeech: true })}
      <div class="choices pos-choices" id="choices">
        ${POS_OPTIONS.map((p, i) => `<button type="button" class="choice" data-pos="${p}" aria-label="选项 ${i + 1}：${p}">${p}</button>`).join('')}
      </div>
      <p class="answer-result" id="answerResult" aria-live="polite"></p>
    </div>`;
    speak(wordSpeech(w));

    const answer = async (el) => {
      if (!el || this.locked) return;
      this.locked = true;
      const ok = el.dataset.pos === target;
      [...$('#choices').children].forEach(c => {
        c.classList.add('locked');
        c.disabled = true;
        if (c.dataset.pos === target) c.classList.add('ok');
      });
      if (!ok) { el.classList.add('bad'); $('#quizCard').classList.add('shake'); }
      $('#answerResult').className = `answer-result ${ok ? 'ok' : 'bad'}`;
      $('#answerResult').textContent = ok ? '选好了，正在保存答案。' : '答案不对，正在保存并安排回炉。';
      const payload = this.createProgressAttempt(ok, ok ? undefined : 'wrong', el.dataset.pos);
      this.saveProgressAttempt(payload, () => {
        if (ok) {
          $('#answerResult').textContent = `回答正确：${target}。下一题即将开始。`;
          this.scheduleNext(900);
        } else {
          $('#answerResult').textContent = `正确词性：${target}。已加入回炉，点继续开始下一题。`;
          this.waitContinue();
        }
      });
    };

    $('#choices').addEventListener('click', (e) => {
      const el = e.target.closest('.choice');
      if (el) answer(el);
    });

    // 键盘：1-8 选择词性
    this.keyHandler = (e) => {
      if (this.locked || e.target.closest('button, input, textarea, select, [contenteditable="true"]')) return;
      if (e.key >= '1' && e.key <= '8') {
        const el = $('#choices')?.children[Number(e.key) - 1];
        if (el) { e.preventDefault(); answer(el); }
      }
    };
    document.addEventListener('keydown', this.keyHandler, true);
  },

  /* ---------- 完成 ---------- */
  async finish() {
    this.leave();
    $('#doneBack').textContent = '返回今日';
    $('#studyStage').classList.add('hidden');
    $('#studyDone').classList.remove('hidden');
    $('#studyProgressFill').style.width = '100%';
    $('#studyProgressText').textContent = `${this.total} / ${this.total}`;
    $('#doneSummary').textContent = this.guidedRun && this.mode === 'spelling'
      ? '第一轮完成。每天从 3 个新词开始，熟悉后再慢慢增加。'
      : this.mode === 'learn'
        ? `共完成 ${this.total} 个新词 · 回看 ${this.learnAgainIds.size} 个`
        : `共 ${this.total} 个词 · 首次答对 ${this.firstCorrectCount} · 回炉答对 ${this.retryCorrectCount} · 答错 ${this.wrongCount} 次 · 放弃 ${this.abandonedCount} 次`;
    const xpEarned = this.firstCorrectCount * 12 + this.retryCorrectCount * 6;
    const doneXp = $('#doneXp');
    if (IS_ANDROID_APP || !xpEarned) {
      doneXp.classList.add('hidden');
      doneXp.textContent = '';
    } else {
      doneXp.textContent = `✦ 本轮获得 ${xpEarned} 墨点 · 首次答对 +12，回炉答对 +6`;
      doneXp.classList.remove('hidden');
    }
    if (this.todayFlow) {
      const flow = this.todayFlow;
      flow.completed[flow.stage] = this.total;
      const needsMore = flow.reviewHasMore || flow.learnHasMore;
      $('#desktopDoneEyebrow').classList.remove('hidden');
      const titles = { review: '复习这一程，已完成', learn: '今日新词，已认识', spelling: '巩固默写，已完成' };
      $('#studyDoneTitle').textContent = titles[flow.stage];
      const stepCopy = flow.stage === 'review' ? '第一步 · 到期复习'
        : flow.stage === 'learn' ? '第二步 · 新词认识' : '第三步 · 巩固默写';
      const resultColumns = flow.stage === 'learn'
        ? `<div><strong>${this.total}</strong><small>认识新词</small></div>
          <div><strong>${this.learnAgainIds.size}</strong><small>本轮回看</small></div>
          <div><strong>${Domain.spellingWords(flow.learn).length}</strong><small>可巩固默写</small></div>`
        : `<div><strong>${this.firstCorrectCount}</strong><small>首次答对</small></div>
          <div><strong>${this.retryCorrectCount}</strong><small>回炉答对</small></div>
          <div><strong>${this.wrongCount + this.abandonedCount}</strong><small>错误或跳过次数</small></div>`;
      $('#desktopDoneJourney').innerHTML = `<div class="desktop-done-head"><span>${stepCopy}</span><strong>${this.total} / ${this.total} 词</strong></div>
        <div class="desktop-done-numbers">${resultColumns}</div>
        <p>${flow.stage === 'learn' ? '认识新词不代表完全掌握，接下来通过默写巩固。'
          : '已完成的答题会真实记录到学习数据，复习日期仍遵循现有规则。'}</p>`;
      $('#desktopDoneJourney').classList.remove('hidden');
      this.renderTodayJourney();
      // A saved milestone is as resumable as a saved individual question.
      this.saveTodayCheckpoint(false, true);
      const continueBatch = () => {
        DesktopCheckpoint.clear(localStorage, this.bookId);
        void this.startToday(this.bookId);
      };
      if (flow.stage === 'review' && flow.reviewHasMore) {
        $('#doneSummary').textContent = `已完成这一批 ${this.total} 个到期复习词，先继续剩余的到期复习，再学习今天的新词。`;
        $('#doneAgain').textContent = '继续剩余到期复习 →';
        $('#doneAgain').onclick = continueBatch;
      } else if (flow.stage === 'review' && flow.learn.length) {
        $('#doneSummary').textContent = `到期复习完成 ${this.total} 词。接下来认识 ${flow.learn.length} 个今日新词。`;
        $('#doneAgain').textContent = `继续学习新词 · ${flow.learn.length} 个 →`;
        $('#doneAgain').onclick = () => this.continueToday('learn');
      } else if (flow.stage === 'learn' && Domain.spellingWords(flow.learn).length) {
        $('#doneSummary').textContent = `今天认识了 ${this.total} 个新词。接下来通过默写巩固这一批新词。`;
        $('#doneAgain').textContent = '继续巩固默写 →';
        $('#doneAgain').onclick = () => this.continueToday('spelling');
      } else if (needsMore) {
        $('#doneAgain').textContent = '继续剩余今日任务 →';
        $('#doneAgain').onclick = continueBatch;
      } else {
        $('#doneAgain').textContent = '返回今日学习中枢';
        $('#doneAgain').onclick = () => { location.hash = '#/'; };
        DesktopCheckpoint.clear(localStorage, this.bookId);
      }
    } else {
      $('#desktopDoneEyebrow').classList.add('hidden');
      $('#desktopDoneJourney').classList.add('hidden');
      $('#studyDoneTitle').textContent = '本轮完成';
    }
    $('#desktopMistakeOutcome').classList.add('hidden');
    if (!IS_ANDROID_APP && this.mistakeDrill) {
      const drill = { ...this.mistakeDrill };
      const run = this.runToken;
      void Mistakes.renderRoundOutcome(drill, run);
    }
    if (!this.todayFlow && this.guidedRun && this.mode === 'learn' && this.bookId) {
      const spellingWords = Domain.spellingWords(this.roundWords);
      this.guidedSpellWords = spellingWords.slice(0, 1);
      sessionStorage.setItem(GUIDED_SPELLING_KEY, JSON.stringify({ bookId: this.bookId, words: this.guidedSpellWords }));
      $('#doneAgain').textContent = '默写 1 个词 →';
      $('#doneAgain').onclick = () => { location.hash = `#/guided-spelling/${this.bookId}`; };
    } else if (!this.todayFlow && this.guidedRun && this.mode === 'spelling') {
      localStorage.setItem('wordmaster_onboarding_done', '1');
      sessionStorage.removeItem(GUIDED_SPELLING_KEY);
      $('#doneAgain').textContent = '回到今日';
      $('#doneAgain').onclick = () => { location.hash = '#/'; };
    } else if (!this.todayFlow && this.mode === 'learn' && this.bookId) {
      // 学完引导去默写，学过的词已进入复习队列。
      $('#doneAgain').textContent = '去默写这些词 →';
      $('#doneAgain').onclick = () => { location.hash = `#/study/${this.bookId}/spelling`; };
    } else if (!this.todayFlow) {
      $('#doneAgain').textContent = '再来一轮';
      $('#doneAgain').onclick = () => location.hash === `#/study/${this.bookId}/${this.mode}`
        ? this.start(this.bookId, this.mode)
        : Mistakes.study(this.mode, Mistakes.studyScopeBookId);
    }
    $('#doneBack').onclick = () => {
      const scope = !this.todayFlow && this.bookId === null && Mistakes.studyScopeBookId;
      location.hash = scope ? `#/mistakes?book_id=${scope}` : '#/';
    };
    // An old reward request must not repaint the next study round.
    const finishToken = this.runToken;
    // 完成一轮学习后引导抽卡
    const btn = $('#doneDraw');
    if (this.guidedRun) {
      btn.classList.add('hidden');
      return;
    }
    showPageLoading('正在确认今日卡牌奖励状态…');
    try {
      const cd = await api('/api/cards');
      if (this.runToken !== finishToken || $('#studyDone').classList.contains('hidden')) return;
      clearPageStatus();
      if (cd.drawn_today || cd.today_answered < cd.draw_target) {
        btn.classList.add('hidden');
      } else {
        btn.classList.remove('hidden');
        btn.onclick = () => { Cards._preview = false; Cards.draw(); };
      }
    } catch (error) {
      if (this.runToken !== finishToken || $('#studyDone').classList.contains('hidden')) return;
      btn.classList.add('hidden');
      showPageError(`本轮已完成，但卡牌状态暂时无法读取：${error.message}`, () => this.finish());
    }
  },
};

// 全局：发音按钮（事件委托，避免内联 onclick 的转义问题）
document.addEventListener('click', (e) => {
  const b = e.target.closest('.speak-btn');
  if (b) speak(b.dataset.speak);
});

/* ============================================================
   错题本
   ============================================================ */
const Mistakes = {
  rows: [],
  scopeBookId: null,
  focusWordId: null,
  requestToken: 0,
  studyScopeBookId: null,

  async render(bookId = null, focusWordId = null) {
    this.scopeBookId = !IS_ANDROID_APP && Number.isSafeInteger(bookId) && bookId > 0 ? bookId : null;
    this.focusWordId = !IS_ANDROID_APP && Number.isSafeInteger(focusWordId) && focusWordId > 0 ? focusWordId : null;
    const token = ++this.requestToken;
    show('mistakes', 'books');
    showPageLoading('正在加载错题本…');
    const scopedQuery = this.scopeBookId ? `?book_id=${this.scopeBookId}` : '';
    let list, books;
    try {
      [list, books] = await Promise.all([
        api(`/api/mistakes${scopedQuery}`),
        IS_ANDROID_APP ? Promise.resolve(null) : api('/api/books'),
      ]);
      if (token !== this.requestToken || !(location.hash === '#/mistakes' || location.hash.startsWith('#/mistakes?'))) return;
      clearPageStatus();
    } catch (error) {
      if (token === this.requestToken) {
        showPageError(`错题本暂时无法加载：${error.message}`,
          () => this.render(this.scopeBookId, this.focusWordId));
      }
      return;
    }
    this.rows = list;
    if (!IS_ANDROID_APP) {
      const select = $('#desktopMistakesBook');
      select.innerHTML = '<option value="all">全部词库</option>' +
        books.map(book => `<option value="${book.id}">${esc(book.name)}</option>`).join('');
      select.value = this.scopeBookId ? String(this.scopeBookId) : 'all';
      $('#desktopMistakesHint').textContent = this.scopeBookId
        ? `当前仅显示所选词库的 ${list.length} 个错题，点击「开始回炉」也只练这本词库。`
        : `当前显示全部词库的 ${list.length} 个错题。可按词库筛选，再开始回炉。`;
      select.onchange = () => {
        const selected = Number(select.value);
        location.hash = Number.isSafeInteger(selected) && selected > 0
          ? `#/mistakes?book_id=${selected}` : '#/mistakes';
      };
    }
    $('#mistakeCount').textContent = list.length;
    $('#mistakeBody').innerHTML = list.map(w => `
      <tr data-mistake-word="${w.id}" class="${this.focusWordId === w.id ? 'is-highlighted' : ''}">
        <td class="w">${esc(wordHeadword(w))}<button class="speak-btn" data-speak="${esc(wordSpeech(w))}" aria-label="播放 ${esc(wordHeadword(w))} 的发音">${speakerIconMarkup}</button></td>
        <td class="pos">${esc([w.pos, w.sense_label].filter(Boolean).join(' · '))}</td>
        <td>${wordMeaningMarkup(w, 'table-word-meaning')}</td>
        <td class="ex">${esc(w.book_name)}</td>
        <td><span class="wrong-tag">错 ${w.wrong} 次</span></td>
        <td class="ops">
          <button type="button" class="link-btn danger" data-mistake-remove="${w.id}">移出</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--ink-faint);padding:40px">此范围暂时没有错题</td></tr>';
    $('#mistakesBack').onclick = () => { location.hash = '#/'; };
    const urlSuffix = this.scopeBookId ? `?book_id=${this.scopeBookId}` : '';
    $('#mistakeStudyBtn').onclick = () => { location.hash = `#/mistakes-study/spelling${urlSuffix}`; };
    $('#mistakeStudyBtn').disabled = list.length === 0;

    if (this.focusWordId && list.some(w => w.id === this.focusWordId)) {
      requestAnimationFrame(() => {
        if (token !== this.requestToken || !(location.hash === '#/mistakes' || location.hash.startsWith('#/mistakes?'))) return;
        const row = $('#mistakeBody').querySelector(`[data-mistake-word="${this.focusWordId}"]`);
        row?.scrollIntoView({ block: 'center', behavior: 'auto' });
        row?.querySelector('.speak-btn')?.focus({ preventScroll: true });
      });
    }
  },

  async study(mode, bookId = null) {
    // A same-hash "continue" button also starts a brand-new round. Invalidate
    // delayed callbacks and old completion-summary responses before fetching.
    Study.runToken++;
    this.studyScopeBookId = !IS_ANDROID_APP && Number.isSafeInteger(bookId) && bookId > 0 ? bookId : null;
    // Mistake drills are separate from Today's SQLite-owned daily route.
    Study.todayFlow = null;
    Study.mistakeDrill = IS_ANDROID_APP ? null : {
      bookId: this.studyScopeBookId, mode,
    };
    Study.guidedRun = false;
    Study.guidedSpellWords = null;
    Study.mode = mode;
    Study.bookId = null;
    show('study');
    $('#desktopStudyJourney').classList.add('hidden');
    $('#studyDone').classList.add('hidden');
    $('#studyStage').classList.remove('hidden');
    const scoped = !IS_ANDROID_APP && Number.isSafeInteger(bookId) && bookId > 0;
    const suffix = scoped ? `&book_id=${bookId}` : '';
    const returnHash = scoped ? `#/mistakes?book_id=${bookId}` : '#/mistakes';
    const expectedHash = scoped ? `#/mistakes-study/${mode}?book_id=${bookId}`
      : `#/mistakes-study/${mode}`;
    $('#studyExit').textContent = '← 退出';
    $('#studyExit').onclick = () => { location.hash = returnHash; };
    $('#studyModeTag').textContent = `错题回炉 · ${scoped ? '当前词库' : '全部词库'} · ${MODES.find(m => m.key === mode)?.name || mode}`;
    $('#studyStage').innerHTML = '<div class="quiz-card"><p class="quiz-kicker">LOADING …</p></div>';
    try {
      const words = await api(`/api/mistakes/study?mode=${encodeURIComponent(mode)}${suffix}`);
      if (location.hash !== expectedHash) return;
      if (!words.length) {
        $('#studyStage').innerHTML = '<div class="quiz-card"><p class="quiz-meaning">当前范围没有需要回炉的错题。</p></div>';
      } else {
        Study.begin(words);
      }
    } catch (error) {
      showPageError(`错题练习加载失败：${error.message}`, () => this.study(mode, bookId));
    }
  },

  async renderRoundOutcome(drill, run) {
    if (IS_ANDROID_APP || !drill) return;
    const host = $('#desktopMistakeOutcome');
    const scoped = Number.isSafeInteger(drill.bookId) && drill.bookId > 0;
    const url = scoped ? `/api/mistakes?book_id=${drill.bookId}` : '/api/mistakes';
    const expectedHash = scoped
      ? `#/mistakes-study/${drill.mode}?book_id=${drill.bookId}`
      : `#/mistakes-study/${drill.mode}`;
    host.classList.remove('hidden');
    host.innerHTML = '<p>正在核对仍需回炉的单词…</p>';
    try {
      const remaining = await api(url);
      if (Study.runToken !== run || location.hash !== expectedHash || $('#studyDone').classList.contains('hidden')) return;
      const n = remaining.length;
      const scope = scoped ? '这本词库' : '全部词库';
      host.innerHTML = `<p class="mistake-outcome-eyebrow">REVIEW STATUS · 错题状态</p>
        <div class="mistake-outcome-line">
          <strong class="numeric">${n}</strong>
          <span>${scope}仍需回炉的单词</span>
        </div>
        <p>${n === 0
          ? '当前范围已经没有需要回炉的错题了，之后仍需按到期日继续复习。'
          : '这里是完成本轮后仍在错题本中的实际数量。答对一次不等于完全掌握；需要按原有规则继续巩固。'}</p>`;
      if (n === 0) {
        $('#doneAgain').textContent = '返回错题本查看成果';
        $('#doneAgain').onclick = () => {
          location.hash = scoped ? `#/mistakes?book_id=${drill.bookId}` : '#/mistakes';
        };
      } else {
        $('#doneAgain').textContent = `继续回炉剩余 ${n} 个错词 →`;
        $('#doneAgain').onclick = () => this.study(drill.mode, drill.bookId);
      }
      $('#doneBack').textContent = scoped ? '返回当前词库错题' : '返回全部错题';
      $('#doneBack').onclick = () => {
        location.hash = scoped ? `#/mistakes?book_id=${drill.bookId}` : '#/mistakes';
      };
    } catch (error) {
      if (Study.runToken !== run || location.hash !== expectedHash) return;
      host.textContent = `本轮答题已保存，但暂时无法读取剩余错题数量：${error.message}。仍可返回错题本核对。`;
    }
  },

  async remove(wordId, word) {
    try {
      await api(`/api/mistakes/${wordId}`, { method: 'DELETE' });
      toast(`「${word}」已移出错题本`);
      await this.render(this.scopeBookId);
    } catch (error) { toast(`移出错题失败：${error.message}`); }
  },
};

// A priority word links to its actual book. A due word enters the real
// scheduled queue; a non-due error focuses its row in the same-book mistake list.
$('#difficultWords').addEventListener('click', event => {
  if (IS_ANDROID_APP) return;
  const button = event.target.closest('[data-insight-word]');
  if (!button) return;
  const bookId = Number(button.dataset.insightBook);
  const wordId = Number(button.dataset.insightWord);
  if (!Number.isSafeInteger(bookId) || bookId < 1 ||
      !Number.isSafeInteger(wordId) || wordId < 1) return;
  if (button.dataset.insightDue === '1') {
    // Keep Today focused on the book that owns this due word.
    Home.selectedBookId = bookId;
    localStorage.setItem('wordmaster_selected_book', String(bookId));
    location.hash = `#/today-study/${bookId}`;
  } else {
    location.hash = `#/mistakes?book_id=${bookId}&word_id=${wordId}`;
  }
});

$('#mistakeBody').addEventListener('click', event => {
  const button = event.target.closest('[data-mistake-remove]');
  if (!button) return;
  const word = Mistakes.rows.find(row => row.id === Number(button.dataset.mistakeRemove));
  if (word) void Mistakes.remove(word.id, wordHeadword(word));
});

/* ============================================================
   词库管理页
   ============================================================ */
const Manage = {
  bookId: null, words: [], editingId: null,
  page: 1, pages: 1, total: 0, pageSize: 40,
  query: '', status: 'all', requestToken: 0, searchTimer: null,

  async open(bookId) {
    this.bookId = bookId;
    this.page = 1; this.pages = 1; this.query = ''; this.status = 'all';
    this.requestToken++;
    clearTimeout(this.searchTimer);
    show('manage', 'books');
    $('#desktopManageToolbar').classList.toggle('hidden', IS_ANDROID_APP);
    $('#desktopManageResult').classList.toggle('hidden', IS_ANDROID_APP);
    $('#desktopManagePages').classList.toggle('hidden', IS_ANDROID_APP);
    $('#manageSearch').value = '';
    $('#manageStatus').value = 'all';
    showPageLoading('正在打开词库…');
    try {
      const books = await api('/api/books');
      if (this.bookId !== bookId || (location.hash || '').split('?')[0] !== `#/book/${bookId}`) return;
      const book = books.find(b => b.id === bookId);
      if (!book) throw new Error('词库不存在');
      $('#manageTitle').textContent = book.name;
      if (IS_ANDROID_APP) {
        this.words = await api(`/api/books/${bookId}/words`);
        clearPageStatus();
        this.renderTable();
      } else {
        await this.loadPage(1);
      }
    } catch (error) {
      if (this.bookId === bookId) showPageError(`词库暂时无法加载：${error.message}`, () => this.open(bookId));
    }
    $('#manageBack').onclick = () => { location.hash = '#/books'; };
    $('#addWordBtn').onclick = () => this.openModal(null);
    $('#importBtn').onclick = () => {
      $('#importText').value = '';
      $('#importResult').textContent = '';
      $('#importModal').classList.remove('hidden');
      $('#importText').focus();
    };
  },

  async loadPage(page = 1) {
    if (IS_ANDROID_APP) return;
    const token = ++this.requestToken;
    const id = this.bookId;
    const params = new URLSearchParams({
      page: String(page), page_size: String(this.pageSize),
      search: this.query, status: this.status,
    });
    $('#wordTableBody').setAttribute('aria-busy', 'true');
    try {
      const data = await api(`/api/desktop/books/${id}/words?${params}`);
      if (token !== this.requestToken || this.bookId !== id || location.hash.split('?')[0] !== `#/book/${id}`) return;
      this.words = data.items;
      this.page = data.page;
      this.pages = data.pages;
      this.total = data.total;
      this.renderTable();
      this.renderPager();
      clearPageStatus();
    } catch (error) {
      if (token === this.requestToken && this.bookId === id && location.hash.split('?')[0] === `#/book/${id}`) {
        showPageError(`查询词库失败：${error.message}`, () => this.loadPage(page));
      }
    } finally {
      if (token === this.requestToken) $('#wordTableBody').removeAttribute('aria-busy');
    }
  },

  renderPager() {
    if (IS_ANDROID_APP) return;
    const first = this.total ? (this.page - 1) * this.pageSize + 1 : 0;
    const last = Math.min(this.page * this.pageSize, this.total);
    $('#desktopManageResult').textContent =
      `共匹配 ${this.total} 词 · 当前显示 ${first}–${last} · 每页 ${this.pageSize} 词`;
    $('#managePageInfo').textContent = `第 ${this.page} / ${this.pages} 页`;
    $('#managePrev').disabled = this.page <= 1;
    $('#manageNext').disabled = this.page >= this.pages;
  },

  renderTable() {
    const empty = IS_ANDROID_APP
      ? '词库为空，用右上角「批量导入」或「添加单词」开始录入'
      : this.query || this.status !== 'all'
        ? '没有符合条件的单词，可以尝试其他关键词或清除筛选'
        : '词库为空，点击「添加单词」或「批量导入」开始';
    $('#wordTableBody').innerHTML = this.words.map(w => `
      <tr>
        <td class="w">${esc(wordHeadword(w))}<button class="speak-btn" data-speak="${esc(wordSpeech(w))}" aria-label="播放 ${esc(wordHeadword(w))} 的发音">${speakerIconMarkup}</button>${w.sense_label ? `<small class="word-sense-label">${esc(w.sense_label)}</small>` : ''}</td>
        <td class="ph">${esc(w.phonetic_display || (w.phonetic ? `[${w.phonetic}]` : ''))}</td>
        <td class="pos">${esc(w.pos)}</td>
        <td>${wordMeaningMarkup(w, 'table-word-meaning')}</td>
        <td class="ex">${esc(w.example)}</td>
        <td class="ops">
          <button class="link-btn" data-manage-action="edit" data-word-id="${w.id}">编辑</button>
          <button class="link-btn danger" data-manage-action="delete" data-word-id="${w.id}">删除</button>
        </td>
      </tr>`).join('') || `<tr><td colspan="6" class="manage-empty">${esc(empty)}</td></tr>`;
  },

  openModal(id) {
    const word = id ? this.words.find(x => x.id === id) : null;
    if (id && !word) { toast('未找到当前单词，请刷新列表'); return; }
    this.editingId = id;
    const w = word || {};
    $('#wordModalTitle').textContent = id ? '编辑单词' : '添加单词';
    $('#wfWord').value = w.word || '';
    $('#wfPhonetic').value = w.phonetic || '';
    $('#wfPos').value = w.pos || '';
    $('#wfMeaning').value = w.meaning || '';
    $('#wfExample').value = w.example || '';
    $('#wordModal').classList.remove('hidden');
    $('#wfWord').focus();
  },

  async remove(id, word) {
    if (!confirm(`确定删除单词「${word}」？这会同时删除它的复习进度。`)) return;
    try {
      await api(`/api/words/${id}`, { method: 'DELETE' });
      toast('已删除单词');
      if (IS_ANDROID_APP) {
        this.words = this.words.filter(w => w.id !== id);
        this.renderTable();
      } else {
        await this.loadPage(this.page);
      }
    } catch (error) { toast(`删除失败：${error.message}`); }
  },
};

$('#wordTableBody').addEventListener('click', event => {
  const button = event.target.closest('[data-manage-action]');
  if (!button) return;
  const id = Number(button.dataset.wordId);
  const word = Manage.words.find(item => item.id === id);
  if (!word) return;
  if (button.dataset.manageAction === 'edit') Manage.openModal(id);
  if (button.dataset.manageAction === 'delete') void Manage.remove(id, wordHeadword(word));
});

$('#manageSearch').addEventListener('input', event => {
  if (IS_ANDROID_APP) return;
  clearTimeout(Manage.searchTimer);
  Manage.query = event.target.value.trim();
  Manage.requestToken++; // Cancel the logical lifetime of any earlier response.
  Manage.searchTimer = setTimeout(() => void Manage.loadPage(1), 260);
});
$('#manageStatus').addEventListener('change', event => {
  if (IS_ANDROID_APP) return;
  Manage.status = event.target.value;
  clearTimeout(Manage.searchTimer);
  void Manage.loadPage(1);
});
$('#manageReset').addEventListener('click', () => {
  if (IS_ANDROID_APP) return;
  $('#manageSearch').value = '';
  $('#manageStatus').value = 'all';
  Manage.query = ''; Manage.status = 'all';
  clearTimeout(Manage.searchTimer);
  void Manage.loadPage(1);
});
$('#managePrev').addEventListener('click', () => {
  if (!IS_ANDROID_APP && Manage.page > 1) void Manage.loadPage(Manage.page - 1);
});
$('#manageNext').addEventListener('click', () => {
  if (!IS_ANDROID_APP && Manage.page < Manage.pages) void Manage.loadPage(Manage.page + 1);
});

$('#wordModalCancel').addEventListener('click', () => $('#wordModal').classList.add('hidden'));
$('#wordModal').addEventListener('click', (e) => { if (e.target.id === 'wordModal') $('#wordModal').classList.add('hidden'); });
$('#wordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    word: $('#wfWord').value, phonetic: $('#wfPhonetic').value, pos: $('#wfPos').value,
    meaning: $('#wfMeaning').value, example: $('#wfExample').value,
  };
  try {
    if (Manage.editingId) {
      await api(`/api/words/${Manage.editingId}`, { method: 'PUT', body });
      if (IS_ANDROID_APP) Object.assign(Manage.words.find(w => w.id === Manage.editingId), body);
    } else {
      const result = await api('/api/words', { method: 'POST', body: { ...body, book_id: Manage.bookId } });
      if (IS_ANDROID_APP) {
        Manage.words.push({ id: result.id, ...body });
        Manage.words.sort((a, b) => a.word.localeCompare(b.word));
      }
    }
    $('#wordModal').classList.add('hidden');
    toast('已保存');
    if (IS_ANDROID_APP) Manage.renderTable();
    else await Manage.loadPage(Manage.page);
  } catch (err) { toast(err.message); }
});

/* 批量导入 */
$('#importCancel').addEventListener('click', () => $('#importModal').classList.add('hidden'));
$('#importModal').addEventListener('click', (e) => { if (e.target.id === 'importModal') $('#importModal').classList.add('hidden'); });
$('#importForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = $('#importText').value;
  if (!text.trim()) return;
  try {
    const r = await api(`/api/books/${Manage.bookId}/import`, { method: 'POST', body: { text } });
    let msg = `成功导入 ${r.added} 词`;
    if (r.dup) msg += ` · ${r.dup} 个重复跳过`;
    if (r.bad_total) msg += ` · ${r.bad_total} 行无法识别${r.bad.length ? '：' + r.bad.join('；') : ''}`;
    $('#importResult').textContent = msg;
    toast(`导入完成：${r.added} 词`);
    if (r.added) {
      if (IS_ANDROID_APP) {
        Manage.words = await api(`/api/books/${Manage.bookId}/words`);
        Manage.renderTable();
      } else {
        await Manage.loadPage(1);
      }
    }
  } catch (err) { toast(err.message); }
});

/* ============================================================
   学习数据页
   ============================================================ */
const Stats = {
  requestToken: 0,
  scope: 'all',

  async render() {
    show('stats');
    if (!IS_ANDROID_APP) {
      showPageLoading('正在加载学习统计范围…');
      try {
        const books = await api('/api/books');
        if (location.hash !== '#/stats') return;
        const select = $('#desktopStatsBookSelect');
        const preferred = Home.selectedBookId || Number(localStorage.getItem('wordmaster_selected_book') || 0);
        select.innerHTML = '<option value="all">全部词库</option>' + books.map(book =>
          `<option value="${book.id}">${esc(book.name)}</option>`).join('');
        select.value = books.some(book => book.id === preferred) ? String(preferred) : 'all';
        this.scope = select.value;
        select.onchange = () => {
          this.scope = select.value;
          void this.loadScoped(books);
        };
        await this.loadScoped(books);
      } catch (error) {
        showPageError(`学习数据加载失败：${error.message}`, () => this.render());
      }
      return;
    }
    await this.loadScoped();
  },

  async loadScoped(books = []) {
    const token = ++this.requestToken;
    const chosen = !IS_ANDROID_APP && this.scope !== 'all'
      ? books.find(book => String(book.id) === this.scope) : null;
    const query = IS_ANDROID_APP ? '' : chosen ? `book_id=${chosen.id}` : 'scope=all';
    showPageLoading('正在汇总学习数据…');
    try {
      const [ov, daily, mistakes, insights] = await Promise.all([
        api(`/api/stats/overview${query ? '?' + query : ''}`),
        api(`/api/stats/daily?days=90${query ? '&' + query : ''}`),
        api('/api/mistakes'),
        IS_ANDROID_APP ? Promise.resolve(null)
          : api(`/api/desktop/insights${query ? '?' + query : ''}`)
              .catch(error => ({ error: error.message })),
      ]);
      if (token !== this.requestToken || location.hash !== '#/stats') return;
      clearPageStatus();
      if (!IS_ANDROID_APP) {
        $('#desktopStatsScopeNote').textContent = chosen
          ? `当前范围：${chosen.name}。这里的待复习、新词、正确率和图表都来自这一本词库。`
          : '当前范围：全部词库。待复习为所有词库总计；不同词库的每日新词目标不直接相加。';
      }
      this.renderToday(ov);
      this.renderBars(daily);
      this.renderHeatmap(daily);
      this.renderLine(daily);
      this.renderDifficult(chosen ? mistakes.filter(word => word.book_name === chosen.name) : mistakes);
      if (!IS_ANDROID_APP) this.renderInsights(insights, chosen);
    } catch (error) {
      if (token === this.requestToken) showPageError(`学习数据暂时无法加载：${error.message}`, () => this.loadScoped(books));
    }
  },

  renderToday(ov) {
    const t = ov.today;
    const allBooks = !IS_ANDROID_APP && this.scope === 'all';
    const answerCount = Number(ov.total.total_correct || 0) + Number(ov.total.total_wrong || 0);
    // A missing history is unknown, never a real zero-percent result.
    const allTimeAccuracy = !IS_ANDROID_APP && answerCount === 0 ? '—' : ov.accuracy;
    const newText = allBooks
      ? `<b class="numeric">${t.new_today}</b><span>今日新学词数</span>`
      : `<b class="metric-fraction numeric"><span class="metric-current">${t.new_today}</span><span class="metric-divider">/</span><span class="metric-target">${t.daily_new_quota}</span></b><span>今日新词进度</span>`;
    $('#statsToday').innerHTML = `
      <div class="today-cell"><b class="numeric">${ov.streak}</b><span>连续学习（天）</span></div>
      <div class="today-cell"><b class="numeric">${t.due_review}</b><span>待复习单词</span></div>
      <div class="today-cell">${newText}</div>
      <div class="today-cell"><b class="numeric">${ov.total.today_reviewed}</b><span>今日已作答</span></div>
      <div class="today-cell"><b class="metric-percent-value numeric"><span>${allTimeAccuracy}</span><i>${allTimeAccuracy === '—' ? '' : '%'}</i></b><span>${allTimeAccuracy === '—' ? '累计作答正确率 · 暂无记录' : '累计作答正确率'}</span></div>
      <div class="today-cell"><b class="numeric">${ov.total.mastered}</b><span>已掌握单词</span></div>`;
  },

  renderInsights(insights, chosen) {
    const panel = $('#desktopInsights');
    if (!insights || insights.error) {
      panel.classList.add('insights-unavailable');
      $('#difficultTitle').textContent = '困难词优先';
      $('#difficultSubtitle').textContent = '先回看答错较多的词';
      $('#difficultMore').textContent = '查看错题本 →';
      $('#difficultMore').setAttribute('href', '#/mistakes');
      $('#difficultWords').removeAttribute('role');
      $('#insightsRecentAccuracy').textContent = '—';
      $('#insightsAccuracyChange').textContent = '暂不可用';
      $('#insightsRecentSample').textContent = insights?.error
        ? `诊断暂不可用：${insights.error}，其他统计仍可使用。`
        : '诊断暂不可用，其他统计仍可使用。';
      $('#insightsNextTitle').textContent = '先查看当前学习任务';
      $('#insightsNextReason').textContent = '学习计划和复习仍会照常运行。';
      $('#insightsCoverageValue').textContent = '—';
      $('#insightsCoverageFill').style.width = '0%';
      $('#insightsCoverageNote').textContent = '学习数据诊断暂未加载。';
      $('#insightsNextAction').textContent = '返回今日 ↗';
      $('#insightsNextAction').onclick = () => { location.hash = '#/'; };
      return;
    }
    panel.classList.remove('insights-unavailable');
    const now = insights.last7;
    const before = insights.previous7;
    $('#insightsRecentAccuracy').textContent =
      now.percentage === null ? '—' : `${now.percentage}%`;
    $('#insightsAccuracyChange').textContent = insights.change_points === null
      ? '暂无上期对照'
      : `${insights.change_points > 0 ? '+' : ''}${insights.change_points} 个百分点`;
    $('#insightsAccuracyChange').dataset.direction = insights.change_points === null
      ? 'unknown' : insights.change_points > 0 ? 'up' : insights.change_points < 0 ? 'down' : 'steady';
    $('#insightsRecentSample').textContent = now.attempts
      ? `近 7 天作答 ${now.attempts} 次，其中答对 ${now.correct} 次。上一个 7 天${before.attempts ? `作答 ${before.attempts} 次` : '没有作答记录'}。`
      : '最近 7 天还没有作答记录，不会把未学习当作 0% 正确率。';
    $('#insightsCoverageValue').textContent = `${insights.coverage.started_percent}%`;
    $('#insightsCoverageFill').style.width = `${insights.coverage.started_percent}%`;
    $('#insightsCoverageNote').textContent =
      `已开始 ${insights.coverage.started_words} / ${insights.coverage.total_words} 词 · 已掌握 ${insights.coverage.mastered_words} 词（不等于开始学习）。`;
    $('#insightsNextTitle').textContent = insights.recommendation.title;
    $('#insightsNextReason').textContent = insights.recommendation.explanation;
    $('#insightsNextAction').innerHTML =
      `${esc(insights.recommendation.button.replace(/\s*→$/, ''))} <span aria-hidden="true">↗</span>`;
    $('#insightsNextAction').onclick = () => {
      const action = insights.recommendation.action;
      if (action === 'today' && chosen) location.hash = `#/today-study/${chosen.id}`;
      else if (action === 'mistakes') location.hash = chosen
        ? `#/mistakes?book_id=${chosen.id}` : '#/mistakes';
      else if (action === 'books') location.hash = '#/books';
      else location.hash = '#/';
    };
    $('#insightsFootnote').textContent = insights.disclaimer;

    // Keep one priority-word list. The old list sorted solely by wrong counts
    // and linked even non-mistake "due" words to the mistakes-only page.
    $('#difficultTitle').textContent = '建议关注的单词';
    $('#difficultSubtitle').textContent = '优先到期，再看曾经答错的词';
    $('#difficultMore').textContent = chosen ? '查看当前词库的错题 →' : '打开全部词库错题本 →';
    $('#difficultMore').setAttribute('href', chosen ? `#/mistakes?book_id=${chosen.id}` : '#/mistakes');
    const target = $('#difficultWords');
    if (!insights.focus_words.length) {
      target.innerHTML = '<p class="difficult-empty">当前没有到期或需要回炉的单词，先按学习计划继续即可。</p>';
    } else {
      target.innerHTML = insights.focus_words.map(word => `
        <div class="difficult-word insight-word" role="listitem">
          <span class="difficult-word-main">
            <b>${esc(word.word)}</b>
            <small>${esc([word.reason, word.book_name].filter(Boolean).join(' · '))}</small>
          </span>
          <span class="insight-word-actions">
            <span class="difficult-count numeric">${word.wrong ? `错 ${word.wrong} 次` : '待复习'}</span>
            <button type="button" class="insight-word-link"
              data-insight-book="${word.book_id}" data-insight-word="${word.id}"
              data-insight-due="${word.due_now ? '1' : '0'}"
              aria-label="${word.due_now ? '开始' : '定位'} ${esc(word.word)} 所在词库${word.due_now ? '的今日复习' : '的错题'}">
              ${word.due_now ? '去今日复习 ↗' : '定位错题 ↗'}
            </button>
          </span>
        </div>`).join('');
    }
    target.setAttribute('role', 'list');
  },

  renderDifficult(mistakes) {
    const target = $('#difficultWords');
    const top = mistakes.slice(0, 5);
    if (!top.length) {
      target.innerHTML = '<p class="difficult-empty">暂时没有待回炉词。答错的单词会自动出现在这里。</p>';
      return;
    }
    target.innerHTML = top.map(word => `
      <button type="button" class="difficult-word" onclick="location.hash='#/mistakes'">
        <span class="difficult-word-main"><b>${esc(wordHeadword(word))}</b><small>${esc([word.pos || '词性未知', word.sense_label, word.book_name].filter(Boolean).join(' · '))}</small></span>
        <span class="difficult-count numeric">错 ${word.wrong} 次</span>
      </button>`).join('');
  },

  // 近 30 天柱状图：总作答 + 新词部分
  renderBars(daily) {
    const range = this.chartRangeDays || 7;
    const days = this.lastNDays(range);
    const map = Object.fromEntries(daily.map(d => [d.day, d]));
    const max = Math.max(1, ...days.map(d => map[d]?.total || 0));
    const totals = days.reduce((acc, day) => {
      const value = map[day] || {};
      acc.total += Number(value.total || 0);
      acc.correct += Number(value.correct || 0);
      acc.newWords += Number(value.new_words || 0);
      return acc;
    }, { total: 0, correct: 0, newWords: 0 });
    const accuracy = totals.total ? Math.round(totals.correct / totals.total * 100) : 0;
    $('#chartRangeSummary').textContent = `${range} 天 · 作答 ${totals.total} 次 · 正确率 ${accuracy}% · 新词 ${totals.newWords} 个`;
    $('#chartBars').dataset.range = String(range);
    $('#chartBars').classList.toggle('is-empty', totals.total === 0);
    $('#chartBars').closest('.chart-scroll')?.setAttribute(
      'aria-label',
      `近 ${range} 天学习量图表${range > 7 ? '，可横向滚动' : ''}`,
    );
    document.querySelectorAll('.range-btn').forEach(button => {
      const selected = Number(button.dataset.days) === range;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('active', selected);
    });
    $('#chartBars').innerHTML = days.map((d, i) => {
      const v = map[d] || { total: 0, new_words: 0 };
      const h = Math.round(v.total / max * 100);
      const nh = v.total ? Math.round(v.new_words / v.total * h) : 0;
      const label = d.slice(5).replace('-', '/');
      const showLabel = range === 7 || i % 5 === 0 || i === days.length - 1;
      return `<button type="button" class="bar-col" title="${label}：作答 ${v.total} · 新词 ${v.new_words}"
          aria-label="${label}：作答 ${v.total} 次，其中新词 ${v.new_words} 个" data-label="${label}" data-total="${v.total}" data-new="${v.new_words}">
        <div class="bar-stack">
          <div class="bar bar-total ${v.total ? '' : 'empty'}" style="--h:${h}%;transition-delay:${i * 25}ms">
            ${v.total ? `<div class="bar bar-new" style="height:${nh / h * 100}%"></div>` : ''}
          </div>
          ${v.total ? '' : '<span class="bar-empty-mark" aria-hidden="true"></span>'}
        </div>
        <span class="bar-label">${showLabel ? label : ''}</span>
      </button>`;
    }).join('');
    $('#chartBarsLive').textContent = totals.total === 0
      ? `近 ${range} 天尚无学习作答，开始学习后就会看到你的记录。`
      : range === 7
        ? '近 7 天按日期顺序排列；点按柱形可读出当天作答与新词数量。'
        : '近 30 天按日期顺序排列；点按柱形可读出当天作答与新词数量，可横向滑动。';
    const announceBar = button => {
      $('#chartBarsLive').textContent = `${button.dataset.label}：共作答 ${button.dataset.total} 次，其中新词 ${button.dataset.new} 个。`;
    };
    document.querySelectorAll('#chartBars .bar-col').forEach(button => {
      button.addEventListener('focus', () => announceBar(button));
      button.addEventListener('click', () => announceBar(button));
    });
    document.querySelectorAll('.range-btn').forEach(button => {
      button.onclick = () => {
        this.chartRangeDays = Number(button.dataset.days);
        this.renderBars(daily);
      };
    });
    // 触发动画
    requestAnimationFrame(() => requestAnimationFrame(() =>
      document.querySelectorAll('#chartBars .bar-total').forEach(b => b.classList.add('grow'))));
  },

  // 近 12 周热力图
  renderHeatmap(daily) {
    const map = Object.fromEntries(daily.map(d => [d.day, d.total]));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    // 对齐到本周一
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(start.getDate() - (start.getDay() + 6) % 7 - 11 * 7);
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let cells = '';
    const cur = new Date(start);
    let week = 0;
    while (cur <= end) {
      let col = '<div class="hm-col">';
      for (let r = 0; r < 7; r++) {
        const key = fmt(cur);
        const v = map[key] || 0;
        const lv = v === 0 ? 0 : v < 10 ? 1 : v < 20 ? 2 : v < 35 ? 3 : 4;
        const future = cur > today;
        const description = future ? `${key}，尚未到来` : `${key}：${v} 次作答`;
        col += `<button type="button" class="hm hm${future ? 'x' : lv}" title="${description}" aria-label="${description}" data-day="${key}" data-total="${v}"></button>`;
        cur.setDate(cur.getDate() + 1);
      }
      cells += col + '</div>';
      week++;
    }
    const heatmap = $('#heatmap');
    heatmap.innerHTML = cells;
    if (window.matchMedia('(max-width: 720px)').matches) {
      requestAnimationFrame(() => { heatmap.scrollLeft = heatmap.scrollWidth; });
    }
    $('#heatmapLive').textContent = '点按日期格可读出当天作答量；近 12 周可左右滑动。';
    const announceDay = button => {
      $('#heatmapLive').textContent = `${button.dataset.day}：作答 ${button.dataset.total} 次。`;
    };
    document.querySelectorAll('#heatmap .hm').forEach(button => {
      button.addEventListener('focus', () => announceDay(button));
      button.addEventListener('click', () => announceDay(button));
    });
  },

  // 少量记录用紧凑记录列表；作答天数与密度足够后再显示日历趋势图。
  renderLine(daily) {
    const timeline = Domain.buildAccuracyTimeline(daily, 30);
    const { calendarDays, points, segments } = timeline;
    const svg = $('#chartLine');
    const content = $('#chartLineContent');
    const dataList = $('#chartLineData');
    const summary = $('#chartLineSummary');
    const compact = $('#chartLineCompact');
    const details = $('#chartLineDataDetails');
    const heading = $('#chartLineHeading');
    const rangeLabel = $('#chartLineRange');
    const mode = Domain.accuracyDisplayMode(timeline);
    const dateLabel = day => {
      const [, month, date] = day.split('-');
      return `${month}/${date}`;
    };

    svg.classList.toggle('hidden', mode !== 'trend');
    details.classList.toggle('hidden', mode !== 'trend');
    compact.classList.toggle('hidden', mode === 'trend');

    if (mode !== 'trend') {
      heading.textContent = '学习记录';
      rangeLabel.textContent = mode === 'empty' ? '近 30 天' : `近 30 天 · ${points.length} 个学习日`;
      content.replaceChildren();
      if (mode === 'empty') {
        summary.textContent = '最近 30 天还没有学习记录。完成一次作答后，这里会按日显示。';
        compact.innerHTML = '<p class="accuracy-empty">开始学习后，逐日正确率会出现在这里。</p>';
      } else {
        summary.textContent = '每行对应一个作答日，列出正确率与正确 / 作答次数。';
        compact.innerHTML = `
          <div class="accuracy-record-head" aria-hidden="true"><span>日期</span><span></span><span>正确率</span><span>正确 / 作答</span></div>
          <ul class="accuracy-record-list">${points.map(point => {
            const label = `${point.day}：正确 ${point.correct} 次，共作答 ${point.total} 次，正确率 ${point.accuracy}%`;
            return `<li class="accuracy-record" aria-label="${esc(label)}">
              <time datetime="${point.day}">${dateLabel(point.day)}</time>
              <span class="accuracy-record-meter" aria-hidden="true"><i style="width:${point.accuracy}%"></i></span>
              <b class="numeric">${point.accuracy}%</b>
              <span class="accuracy-record-ratio">${point.correct}/${point.total}</span>
            </li>`;
          }).join('')}</ul>`;
      }
      svg.setAttribute('aria-label', summary.textContent);
      $('#chartLineDesc').textContent = summary.textContent;
      return;
    }

    heading.textContent = '正确率走势';
    rangeLabel.textContent = '近 30 天';
    compact.innerHTML = '';
    summary.textContent = `最近 30 天有 ${points.length} 个学习日；空白日期保留间隔，连线只连接相邻作答日。`;
    const left = 92, right = 680, top = 34, bottom = 228;
    const xFor = point => left + point.index * (right - left) / Math.max(1, calendarDays.length - 1);
    const yFor = accuracy => bottom - accuracy / 100 * (bottom - top);
    const ticks = [...new Set([0, Math.floor((calendarDays.length - 1) / 2), calendarDays.length - 1])];
    const axes = [100, 50, 0].map(value => {
      const y = yFor(value);
      return `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" class="grid-line"/>
        <text x="78" y="${y + 6}" text-anchor="end" class="chart-axis-label">${value}%</text>`;
    }).join('') + ticks.map(index => {
      const x = left + index * (right - left) / Math.max(1, calendarDays.length - 1);
      return `<line x1="${x}" y1="${bottom}" x2="${x}" y2="${bottom + 8}" class="axis-tick"/>
        <text x="${x}" y="276" text-anchor="middle" class="chart-axis-label">${dateLabel(calendarDays[index])}</text>`;
    }).join('');
    const lineSegments = segments.map(segment => {
      const d = segment.map((point, index) => `${index ? 'L' : 'M'}${xFor(point).toFixed(1)},${yFor(point.accuracy).toFixed(1)}`).join(' ');
      return `<path d="${d}" class="line-path" aria-hidden="true"/>`;
    }).join('');
    const pointMarkup = points.map(point => {
      const x = xFor(point), y = yFor(point.accuracy);
      const label = `${point.day}：正确率 ${point.accuracy}%，正确 ${point.correct} 次，共作答 ${point.total} 次`;
      return `<g class="chart-point" tabindex="0" role="img" aria-label="${esc(label)}">
        <circle class="point-hit" cx="${x}" cy="${y}" r="14"/><circle class="line-dot" cx="${x}" cy="${y}" r="5"/>
        <title>${esc(label)}</title></g>`;
    }).join('');
    content.innerHTML = `${axes}${lineSegments}${pointMarkup}`;
    svg.setAttribute('aria-label', `最近 30 天每日正确率日历图，共 ${points.length} 个学习日`);
    dataList.innerHTML = points.map(point => `<li><time datetime="${point.day}">${dateLabel(point.day)}</time><b class="numeric">${point.accuracy}%</b><span>${point.correct}/${point.total} 次正确</span></li>`).join('');
    $('#chartLineDesc').textContent = summary.textContent;
  },

  lastNDays(n) {
    const out = [];
    const d = new Date(); d.setHours(0, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) {
      const t = new Date(d); t.setDate(t.getDate() - i);
      out.push(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`);
    }
    return out;
  },
};

/* ============================================================
   卡牌插画：按分类/卡面生成扁平 SVG 场景
   所有形状用米白/白色剪影 + 金/高光，适配任何渐变底
   ============================================================ */
const CardArt = {
  CREAM: 'rgba(246,241,231,.92)',   // 主形
  SOFT: 'rgba(246,241,231,.55)',    // 次形
  FAINT: 'rgba(246,241,231,.28)',   // 远景
  GLOW: 'rgba(255,214,140,.95)',    // 高光
  DARK: 'rgba(20,14,8,.35)',        // 阴影

  render(c) {
    const scene = this.scenes[c.palette] || this.byCategory[c.category] || this.scenes.silk;
    return `<svg viewBox="0 0 200 170" class="card-art" aria-hidden="true">${scene(this)}</svg>`;
  },

  // 按具体卡面（palette）定制的场景
  scenes: {
    // 丝绸之路：驼队沙丘落日
    silk: (t) => `
      <circle cx="150" cy="42" r="20" fill="${t.GLOW}"/>
      <path d="M0,120 Q50,85 100,115 T200,105 V170 H0 Z" fill="${t.FAINT}"/>
      <path d="M0,140 Q60,110 120,135 T200,130 V170 H0 Z" fill="${t.SOFT}"/>
      <g fill="${t.DARK}">
        <ellipse cx="60" cy="112" rx="14" ry="9"/><rect x="52" y="100" width="5" height="14" rx="2"/>
        <circle cx="52" cy="98" r="4"/>
        <ellipse cx="92" cy="118" rx="12" ry="8"/><rect x="85" y="107" width="4" height="12" rx="2"/>
        <circle cx="85" cy="105" r="3.5"/>
      </g>`,
    // 庞贝：火山烟柱与廊柱
    pompeii: (t) => `
      <path d="M110,150 L135,55 L165,150 Z" fill="${t.DARK}"/>
      <path d="M126,60 Q120,35 138,30 Q132,15 152,14 Q150,30 160,34 Q150,44 148,58 Z" fill="${t.FAINT}"/>
      <g fill="${t.CREAM}">
        <rect x="20" y="80" width="10" height="60"/><rect x="40" y="80" width="10" height="60"/>
        <rect x="60" y="80" width="10" height="60"/>
        <rect x="12" y="72" width="66" height="8"/><rect x="16" y="140" width="58" height="8"/>
      </g>
      <circle cx="168" cy="30" r="9" fill="${t.GLOW}"/>`,
    // 大航海：帆船
    voyage: (t) => `
      <path d="M0,130 Q30,120 55,130 T110,130 T165,130 T220,128 V170 H0 Z" fill="${t.FAINT}"/>
      <path d="M0,145 Q40,136 80,145 T160,143 T220,144 V170 H0 Z" fill="${t.SOFT}"/>
      <g>
        <path d="M100,118 L100,40 L140,110 Z" fill="${t.CREAM}"/>
        <path d="M94,118 L94,55 L58,112 Z" fill="${t.SOFT}"/>
        <rect x="97" y="36" width="4" height="86" fill="${t.CREAM}"/>
        <path d="M60,118 Q97,132 134,118 L126,132 L70,132 Z" fill="${t.DARK}"/>
        <path d="M101,40 L118,46 L101,52 Z" fill="${t.GLOW}"/>
      </g>`,
    // 活字印刷
    movable: (t) => `
      <g fill="${t.CREAM}">
        <rect x="40" y="40" width="34" height="34" rx="4"/><rect x="84" y="40" width="34" height="34" rx="4"/>
        <rect x="128" y="40" width="34" height="34" rx="4" fill="${t.SOFT}"/>
        <rect x="40" y="84" width="34" height="34" rx="4" fill="${t.SOFT}"/><rect x="84" y="84" width="34" height="34" rx="4"/>
        <rect x="128" y="84" width="34" height="34" rx="4"/><rect x="62" y="128" width="78" height="10" rx="4" fill="${t.GLOW}"/>
      </g>
      <text x="57" y="64" font-size="20" fill="${t.DARK}" font-family="serif" text-anchor="middle">印</text>
      <text x="101" y="108" font-size="20" fill="${t.DARK}" font-family="serif" text-anchor="middle">字</text>`,
    // 极光：夜空光带 + 雪山
    aurora: (t) => `
      <path d="M-10,10 Q60,50 120,20 T210,40 L210,-10 L-10,-10 Z" fill="rgba(120,255,190,.35)"/>
      <path d="M-10,30 Q70,70 130,35 T210,60 L210,15 Q140,45 70,25 T-10,10 Z" fill="rgba(140,220,255,.25)"/>
      <circle cx="170" cy="28" r="3" fill="#fff"/><circle cx="140" cy="48" r="2" fill="#fff"/><circle cx="40" cy="22" r="2" fill="#fff"/>
      <path d="M0,170 L55,90 L90,140 L120,85 L200,170 Z" fill="${t.FAINT}"/>
      <path d="M40,170 L90,105 L135,170 Z" fill="${t.SOFT}"/>
      <path d="M55,90 L68,110 L55,118 L45,105 Z" fill="${t.CREAM}"/>`,
    // 撒哈拉：沙丘与太阳
    sahara: (t) => `
      <circle cx="100" cy="58" r="26" fill="${t.GLOW}"/>
      <path d="M0,110 Q70,70 140,100 T220,95 V170 H0 Z" fill="${t.FAINT}"/>
      <path d="M-20,150 Q60,100 130,135 T220,130 V170 H-20 Z" fill="${t.SOFT}"/>
      <path d="M-20,170 Q80,125 160,155 T220,150 V170 Z" fill="${t.DARK}"/>`,
    // 漓江：山影与竹筏
    liriver: (t) => `
      <path d="M20,170 L45,60 Q50,45 58,60 L80,170 Z" fill="${t.FAINT}"/>
      <path d="M120,170 L150,40 Q157,25 165,42 L195,170 Z" fill="${t.SOFT}"/>
      <path d="M0,140 Q60,132 120,140 T220,138 V170 H0 Z" fill="rgba(246,241,231,.35)"/>
      <rect x="88" y="138" width="34" height="4" rx="2" fill="${t.DARK}"/>
      <rect x="102" y="120" width="3" height="20" fill="${t.DARK}"/>
      <circle cx="103" cy="117" r="4" fill="${t.DARK}"/>
      <circle cx="170" cy="30" r="10" fill="${t.GLOW}"/>`,
    // 安第斯云海
    andes: (t) => `
      <path d="M0,95 L45,45 L75,80 L105,35 L150,85 L175,55 L220,100 V0 H0 Z" fill="${t.FAINT}" transform="translate(0,30)"/>
      <ellipse cx="50" cy="130" rx="45" ry="16" fill="${t.CREAM}"/>
      <ellipse cx="130" cy="145" rx="55" ry="18" fill="${t.SOFT}"/>
      <ellipse cx="100" cy="115" rx="35" ry="12" fill="${t.CREAM}"/>
      <path d="M85,170 L115,95 L145,170 Z" fill="${t.DARK}"/>
      <path d="M105,105 L115,95 L126,106 L115,114 Z" fill="${t.CREAM}"/>`,
    // 像素勇者
    pixel: (t) => `
      <g fill="${t.CREAM}">
        <rect x="76" y="36" width="48" height="12"/><rect x="76" y="48" width="60" height="24"/>
        <rect x="88" y="72" width="36" height="24"/><rect x="88" y="96" width="12" height="36"/>
        <rect x="112" y="96" width="12" height="36"/><rect x="64" y="72" width="12" height="24"/>
        <rect x="136" y="72" width="12" height="24"/>
      </g>
      <rect x="92" y="52" width="10" height="12" fill="${t.DARK}"/><rect x="116" y="52" width="10" height="12" fill="${t.DARK}"/>
      <rect x="140" y="36" width="6" height="60" fill="${t.GLOW}"/>
      <rect x="146" y="36" width="18" height="12" fill="${t.GLOW}"/>
      <g fill="${t.SOFT}"><rect x="30" y="120" width="12" height="12"/><rect x="160" y="110" width="12" height="12"/><rect x="45" y="45" width="10" height="10"/></g>`,
    // 存档点：水晶
    savepoint: (t) => `
      <path d="M100,30 L132,80 L100,145 L68,80 Z" fill="${t.CREAM}"/>
      <path d="M100,30 L116,80 L100,145 L84,80 Z" fill="${t.SOFT}"/>
      <path d="M100,30 L132,80 L116,80 Z" fill="${t.GLOW}" opacity=".7"/>
      <ellipse cx="100" cy="152" rx="34" ry="6" fill="${t.FAINT}"/>
      <circle cx="52" cy="60" r="3" fill="${t.CREAM}"/><circle cx="152" cy="100" r="2.5" fill="${t.CREAM}"/><circle cx="140" cy="40" r="2" fill="${t.GLOW}"/>`,
    // 荒城同行：蕨叶
    tlou: (t) => `
      <g stroke="${t.CREAM}" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M100,155 Q95,100 100,45"/>
        <path d="M100,130 Q75,118 60,95"/><path d="M100,130 Q125,118 140,95"/>
        <path d="M100,105 Q80,95 70,75"/><path d="M100,105 Q120,95 130,75"/>
        <path d="M100,80 Q86,72 80,58"/><path d="M100,80 Q114,72 120,58"/>
      </g>
      <circle cx="100" cy="40" r="6" fill="${t.GLOW}"/>
      <path d="M0,160 Q100,150 200,160 V170 H0 Z" fill="${t.DARK}"/>`,
    // 方格重组
    tetris: (t) => `
      <g>
        <rect x="60" y="120" width="22" height="22" fill="${t.CREAM}"/><rect x="84" y="120" width="22" height="22" fill="${t.CREAM}"/>
        <rect x="108" y="120" width="22" height="22" fill="${t.SOFT}"/><rect x="60" y="96" width="22" height="22" fill="${t.SOFT}"/>
        <rect x="132" y="120" width="22" height="22" fill="${t.GLOW}"/><rect x="132" y="96" width="22" height="22" fill="${t.GLOW}"/>
        <rect x="132" y="72" width="22" height="22" fill="${t.GLOW}"/><rect x="132" y="48" width="22" height="22" fill="${t.GLOW}"/>
        <rect x="84" y="30" width="22" height="22" fill="${t.SOFT}" transform="rotate(12 95 41)"/>
        <rect x="60" y="52" width="22" height="22" fill="${t.FAINT}" transform="rotate(-8 71 63)"/>
      </g>`,
    // 苔寺：圆苔与石灯
    moss: (t) => `
      <ellipse cx="60" cy="140" rx="38" ry="18" fill="${t.CREAM}"/>
      <ellipse cx="130" cy="150" rx="46" ry="16" fill="${t.SOFT}"/>
      <ellipse cx="105" cy="128" rx="26" ry="12" fill="${t.CREAM}"/>
      <g fill="${t.DARK}">
        <rect x="146" y="85" width="8" height="34"/><path d="M138,85 L158,85 L153,72 L143,72 Z"/>
        <path d="M136,72 L160,72 L148,58 Z"/>
      </g>
      <circle cx="148" cy="80" r="3" fill="${t.GLOW}"/>
      <circle cx="50" cy="60" r="16" fill="${t.FAINT}"/>`,
    // 手冲咖啡
    coffee: (t) => `
      <path d="M70,80 L130,80 L118,130 L82,130 Z" fill="${t.CREAM}"/>
      <path d="M76,90 L124,90 L118,112 L82,112 Z" fill="${t.DARK}"/>
      <path d="M130,84 Q152,84 150,100 Q148,114 124,110" fill="none" stroke="${t.CREAM}" stroke-width="6"/>
      <path d="M88,66 Q84,56 90,48 Q94,42 90,34" stroke="${t.SOFT}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M108,66 Q104,56 110,48 Q114,42 110,34" stroke="${t.SOFT}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="66" y="134" width="68" height="6" rx="3" fill="${t.GLOW}"/>`,
    // 深夜食堂：灯笼
    diner: (t) => `
      <rect x="97" y="20" width="6" height="14" fill="${t.DARK}"/>
      <ellipse cx="100" cy="75" rx="34" ry="42" fill="${t.GLOW}"/>
      <ellipse cx="100" cy="75" rx="34" ry="42" fill="none" stroke="${t.DARK}" stroke-width="2"/>
      <path d="M70,55 Q100,48 130,55 M66,75 Q100,68 134,75 M70,95 Q100,88 130,95" stroke="${t.DARK}" stroke-width="2" fill="none"/>
      <rect x="90" y="112" width="20" height="8" fill="${t.DARK}"/>
      <rect x="96" y="120" width="8" height="18" fill="${t.SOFT}"/>
      <text x="100" y="84" font-size="22" fill="${t.DARK}" font-family="serif" text-anchor="middle">食</text>
      <path d="M0,150 Q100,140 200,150 V170 H0 Z" fill="${t.DARK}"/>`,
    // 图书馆：书架与拱窗
    library: (t) => `
      <path d="M55,150 V70 Q55,40 100,40 Q145,40 145,70 V150 Z" fill="none" stroke="${t.CREAM}" stroke-width="5"/>
      <g fill="${t.CREAM}">
        <rect x="66" y="80" width="8" height="34"/><rect x="78" y="76" width="8" height="38"/>
        <rect x="90" y="82" width="8" height="32"/><rect x="102" y="74" width="8" height="40"/>
        <rect x="114" y="80" width="8" height="34"/><rect x="126" y="78" width="8" height="36"/>
      </g>
      <rect x="62" y="118" width="76" height="5" fill="${t.GLOW}"/>
      <rect x="70" y="126" width="8" height="24" fill="${t.SOFT}"/><rect x="82" y="124" width="8" height="26" fill="${t.CREAM}"/>
      <rect x="94" y="128" width="8" height="22" fill="${t.SOFT}"/><rect x="106" y="124" width="8" height="26" fill="${t.CREAM}"/>
      <rect x="118" y="127" width="8" height="23" fill="${t.SOFT}"/>`,
    // 水熊虫
    tardigrade: (t) => `
      <ellipse cx="100" cy="90" rx="46" ry="30" fill="${t.CREAM}"/>
      <circle cx="62" cy="84" r="18" fill="${t.CREAM}"/>
      <g fill="${t.CREAM}">
        <rect x="70" y="112" width="12" height="18" rx="6"/><rect x="92" y="116" width="12" height="18" rx="6"/>
        <rect x="114" y="114" width="12" height="18" rx="6"/><rect x="132" y="108" width="12" height="18" rx="6"/>
      </g>
      <circle cx="56" cy="80" r="3" fill="${t.DARK}"/>
      <g fill="${t.SOFT}"><ellipse cx="100" cy="72" rx="10" ry="6"/><ellipse cx="120" cy="80" rx="8" ry="5"/><ellipse cx="86" cy="84" rx="7" ry="4"/></g>
      <circle cx="160" cy="40" r="3" fill="${t.GLOW}"/><circle cx="40" cy="40" r="2" fill="${t.CREAM}"/>`,
    // 灯塔水母
    jellyfish: (t) => `
      <path d="M100,30 Q140,30 140,70 Q140,84 128,84 L72,84 Q60,84 60,70 Q60,30 100,30 Z" fill="${t.CREAM}"/>
      <path d="M100,42 Q124,42 124,68 Q124,74 118,74 L82,74 Q76,74 76,68 Q76,42 100,42 Z" fill="${t.SOFT}"/>
      <g stroke="${t.CREAM}" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M75,86 Q72,110 80,128 Q84,138 78,150"/>
        <path d="M92,88 Q90,115 96,135"/>
        <path d="M108,88 Q110,112 104,132 Q100,142 106,152"/>
        <path d="M125,86 Q128,108 120,126"/>
      </g>
      <circle cx="150" cy="40" r="4" fill="${t.GLOW}"/><circle cx="45" cy="110" r="3" fill="${t.SOFT}"/>`,
    // 蚁群：蚂蚁与路径
    ant: (t) => `
      <path d="M20,150 Q70,110 100,120 T180,60" stroke="${t.FAINT}" stroke-width="3" fill="none" stroke-dasharray="6 6"/>
      <g fill="${t.CREAM}">
        <circle cx="70" cy="112" r="8"/><circle cx="82" cy="114" r="10"/><circle cx="96" cy="112" r="9"/>
        <path d="M62,106 L52,98 M62,118 L52,124 M102,106 L110,98 M104,118 L112,124" stroke="${t.CREAM}" stroke-width="3"/>
      </g>
      <g fill="${t.SOFT}">
        <circle cx="140" cy="80" r="6"/><circle cx="149" cy="81" r="7"/><circle cx="159" cy="79" r="6"/>
      </g>
      <circle cx="180" cy="55" r="5" fill="${t.GLOW}"/>`,
    // 鲸落
    whalefall: (t) => `
      <path d="M30,70 Q70,40 130,55 Q160,62 172,80 L155,84 Q160,100 140,100 Q90,112 55,95 Q35,85 30,70 Z" fill="${t.CREAM}"/>
      <path d="M168,80 L190,66 L186,88 Z" fill="${t.CREAM}"/>
      <path d="M90,96 L84,112 L100,100 Z" fill="${t.SOFT}"/>
      <circle cx="52" cy="68" r="3" fill="${t.DARK}"/>
      <g stroke="${t.FAINT}" stroke-width="3" stroke-linecap="round">
        <path d="M60,130 Q65,120 60,112"/><path d="M100,140 Q106,128 100,118"/><path d="M140,132 Q146,122 140,112"/>
      </g>
      <path d="M0,160 Q100,150 200,160 V170 H0 Z" fill="${t.DARK}"/>`,
    // 薛定谔：盒子与猫剪影
    quantum: (t) => `
      <rect x="60" y="70" width="80" height="70" rx="6" fill="none" stroke="${t.CREAM}" stroke-width="5"/>
      <rect x="56" y="62" width="88" height="10" rx="4" fill="${t.CREAM}"/>
      <path d="M92,110 Q88,95 100,92 Q112,95 108,110 Z" fill="${t.SOFT}"/>
      <circle cx="100" cy="86" r="9" fill="${t.SOFT}"/>
      <path d="M93,80 L90,70 L98,76 M107,80 L110,70 L102,76" fill="${t.SOFT}"/>
      <text x="150" y="55" font-size="26" fill="${t.GLOW}" font-family="serif">?</text>
      <text x="42" y="60" font-size="20" fill="${t.SOFT}" font-family="serif">?</text>
      <path d="M40,150 Q100,142 160,150" stroke="${t.FAINT}" stroke-width="4" fill="none"/>`,
    // 引力波：黑洞与涟漪
    gravity: (t) => `
      <circle cx="100" cy="80" r="22" fill="${t.DARK}"/>
      <circle cx="100" cy="80" r="26" fill="none" stroke="${t.GLOW}" stroke-width="3"/>
      <ellipse cx="100" cy="80" rx="48" ry="16" fill="none" stroke="${t.SOFT}" stroke-width="2.5" transform="rotate(-18 100 80)"/>
      <ellipse cx="100" cy="80" rx="70" ry="24" fill="none" stroke="${t.FAINT}" stroke-width="2" transform="rotate(-18 100 80)"/>
      <circle cx="155" cy="45" r="3" fill="${t.CREAM}"/><circle cx="45" cy="120" r="2.5" fill="${t.CREAM}"/><circle cx="160" cy="120" r="2" fill="${t.SOFT}"/>`,
    // 熵：骰子与粒子
    entropy: (t) => `
      <rect x="70" y="60" width="60" height="60" rx="10" fill="${t.CREAM}" transform="rotate(10 100 90)"/>
      <g fill="${t.DARK}">
        <circle cx="88" cy="80" r="5"/><circle cx="112" cy="90" r="5"/><circle cx="94" cy="106" r="5"/>
      </g>
      <g fill="${t.SOFT}">
        <circle cx="40" cy="50" r="4"/><circle cx="160" cy="45" r="3"/><circle cx="150" cy="130" r="5"/>
        <circle cx="45" cy="125" r="3"/><circle cx="170" cy="90" r="2.5"/><circle cx="30" cy="90" r="2.5"/>
      </g>
      <path d="M140,35 L160,25 M35,140 L50,150 M165,145 L150,158" stroke="${t.GLOW}" stroke-width="3" stroke-linecap="round"/>`,
    // 光速：光束
    lightspeed: (t) => `
      <circle cx="55" cy="85" r="18" fill="${t.GLOW}"/>
      <g stroke="${t.CREAM}" stroke-width="4" stroke-linecap="round">
        <path d="M85,60 L165,45"/><path d="M85,85 L180,85"/><path d="M85,110 L165,125"/>
      </g>
      <g stroke="${t.SOFT}" stroke-width="3" stroke-linecap="round">
        <path d="M85,72 L140,63"/><path d="M85,98 L140,107"/>
      </g>
      <circle cx="180" cy="45" r="3" fill="${t.CREAM}"/><circle cx="185" cy="125" r="3" fill="${t.CREAM}"/>`,
    // 霍金：星空与望远镜
    hawking: (t) => `
      <g fill="${t.CREAM}"><circle cx="40" cy="30" r="2"/><circle cx="170" cy="35" r="2"/><circle cx="150" cy="20" r="1.5"/><circle cx="70" cy="18" r="1.5"/><circle cx="190" cy="70" r="1.5"/></g>
      <circle cx="140" cy="60" r="14" fill="none" stroke="${t.GLOW}" stroke-width="2.5"/>
      <circle cx="140" cy="60" r="6" fill="${t.GLOW}"/>
      <g transform="rotate(-25 80 110)">
        <rect x="55" y="95" width="60" height="16" rx="8" fill="${t.CREAM}"/>
        <rect x="45" y="97" width="14" height="12" rx="5" fill="${t.SOFT}"/>
      </g>
      <path d="M85,120 L70,155 M85,120 L100,155 M85,120 L85,155" stroke="${t.SOFT}" stroke-width="4" stroke-linecap="round"/>
      <path d="M0,158 Q100,150 200,158 V170 H0 Z" fill="${t.DARK}"/>`,
    // 清明上河图：拱桥
    qingming: (t) => `
      <path d="M30,120 Q100,55 170,120" fill="none" stroke="${t.CREAM}" stroke-width="8"/>
      <path d="M30,120 Q100,68 170,120" fill="none" stroke="${t.DARK}" stroke-width="3"/>
      <path d="M45,120 V135 M70,100 V135 M100,90 V135 M130,100 V135 M155,120 V135" stroke="${t.CREAM}" stroke-width="4"/>
      <path d="M0,135 Q100,128 200,135 V170 H0 Z" fill="${t.FAINT}"/>
      <path d="M0,148 Q100,142 200,148 V170 H0 Z" fill="${t.SOFT}"/>
      <g fill="${t.DARK}"><circle cx="70" cy="82" r="4"/><circle cx="100" cy="72" r="4"/><circle cx="130" cy="82" r="4"/></g>
      <circle cx="170" cy="40" r="12" fill="${t.GLOW}"/>`,
    // 旅行者：卫星与地球
    voyager: (t) => `
      <circle cx="55" cy="120" r="26" fill="${t.SOFT}"/>
      <path d="M38,110 Q55,100 72,112 M40,128 Q58,120 70,128" stroke="${t.FAINT}" stroke-width="3" fill="none"/>
      <g transform="rotate(-20 135 70)">
        <circle cx="135" cy="70" r="16" fill="none" stroke="${t.CREAM}" stroke-width="4"/>
        <circle cx="135" cy="70" r="6" fill="${t.CREAM}"/>
        <rect x="100" y="64" width="22" height="12" fill="${t.GLOW}"/>
        <rect x="150" y="64" width="22" height="12" fill="${t.GLOW}"/>
        <path d="M135,54 L135,30" stroke="${t.CREAM}" stroke-width="3"/>
        <circle cx="135" cy="28" r="3" fill="${t.GLOW}"/>
      </g>
      <path d="M70,105 Q105,75 122,68" stroke="${t.FAINT}" stroke-width="2" fill="none" stroke-dasharray="4 5"/>
      <g fill="${t.CREAM}"><circle cx="180" cy="30" r="2"/><circle cx="100" cy="25" r="1.5"/><circle cx="30" cy="50" r="1.5"/></g>`,
  },

  // 分类兜底场景
  byCategory: {
    历史: null, // 由各 palette 场景覆盖；此处仅兜底
  },
};
// 分类兜底指向通用场景
CardArt.byCategory = {
  '历史': CardArt.scenes.movable,
  '风景': CardArt.scenes.sahara,
  '游戏': CardArt.scenes.pixel,
  '人文': CardArt.scenes.library,
  '生物': CardArt.scenes.tlou,
  '物理': CardArt.scenes.gravity,
  '哲学': CardArt.scenes.library,
  '数学': CardArt.scenes.mobius || CardArt.scenes.gravity,
  '科学': CardArt.scenes.turing || CardArt.scenes.quantum,
  '天文': CardArt.scenes.pillars || CardArt.scenes.hawking,
  '艺术': CardArt.scenes.greatwave || CardArt.scenes.moss,
};

/* ============================================================
   卡牌收藏
   ============================================================ */
const RARITY_NAME = { N: '普通', R: '稀有', SR: '史诗', UR: '传说' };
const CARD_SAMPLE_PALETTES = ['pompeii', 'silk', 'aurora', 'jellyfish'];
const DRAW_CARD_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m10 2 1.8 5.1L17 9l-5.2 1.9L10 16l-1.8-5.1L3 9l5.2-1.9zM16 13l.8 2.2L19 16l-2.2.8L16 19l-.8-2.2L13 16l2.2-.8z"/></svg>';
const Cards = {
  lastTrigger: null,
  cardCopyByPalette: null,
  async render(preview = false, sampleOnly = false) {
    show('cards');
    this._preview = preview;
    $('#cardsNormalHero').classList.toggle('hidden', sampleOnly);
    $('#cardsSampleHero').classList.toggle('hidden', !sampleOnly);
    $('#cardsGrid').classList.toggle('cards-grid--samples', sampleOnly);
    showPageLoading('正在加载卡册…');
    let data;
    try {
      data = await api('/api/cards');
      clearPageStatus();
    } catch (error) {
      showPageError(`卡册暂时无法加载：${error.message}`, () => this.render(preview, sampleOnly));
      return;
    }
    if (preview) data.cards.filter(c => !c.hidden).forEach(c => { c.owned = true; }); // 普通卡前端预览；隐藏卡仍遵守服务端解锁状态
    await this.loadCardCopy();
    if (sampleOnly) {
      const byPalette = new Map(data.cards.map(c => [c.palette, c]));
      const samples = CARD_SAMPLE_PALETTES.map(palette => byPalette.get(palette)).filter(Boolean);
      samples.forEach(c => { c.owned = true; c.earned_at = '样卡预览'; });
      $('#cardsGrid').innerHTML = samples.map((c, i) => this.prototypeCardHtml(c, i)).join('');
      this.bindFoil($('#cardsGrid'));
      return;
    }
    const totalNormal = data.cards.filter(c => !c.hidden).length;
    const ownedNormal = data.cards.filter(c => !c.hidden && c.owned).length;
    const next = data.cards.filter(c => c.hidden && !c.owned).sort((a, b) => a.unlock_at - b.unlock_at)[0];
    const drawsRemaining = Math.max(0, data.draw_target - data.today_answered);
    $('#cardsProgress').textContent =
      `已收集 ${ownedNormal} / ${totalNormal} 张` +
      (next ? ` · 集满 ${next.unlock_at} 张可解锁隐藏卡（还差 ${Math.max(0, next.unlock_at - ownedNormal)} 张）` : ' · 隐藏卡已全部解锁') +
      ` · 今日作答 ${data.today_answered}/${data.draw_target}${drawsRemaining ? `，还差 ${drawsRemaining} 次可抽` : '，今日可抽'}`;
    const canDraw = !preview && !data.drawn_today && data.today_answered >= data.draw_target;
    $('#drawCardBtn').disabled = !canDraw;
    const drawLabel = preview
      ? '内容预览 · 抽卡已停用'
      : data.drawn_today
      ? '今日已抽，明天再来'
      : canDraw ? '抽取今日卡牌' : `今日作答 ${data.today_answered}/${data.draw_target} 次可抽卡`;
    $('#drawCardBtn').innerHTML = `${canDraw ? DRAW_CARD_ICON : ''}${esc(drawLabel)}`;
    $('#cardDot').classList.toggle('hidden', !canDraw);
    $('#bottomCardDot').classList.toggle('hidden', !canDraw);

    $('#cardsGrid').innerHTML = data.cards.map((c, i) => this.cardHtml(c, i)).join('');
    this.bindFoil($('#cardsGrid'));
  },

  async loadCardCopy({ refresh = false } = {}) {
    if (this.cardCopyByPalette && !refresh) return this.cardCopyByPalette;
    try {
      this.cardCopyByPalette = await api('/api/cards/copy');
    } catch (error) {
      this.cardCopyByPalette ||= {};
      console.error('[cards] 卡牌内容加载失败:', error);
    }
    return this.cardCopyByPalette;
  },

  cardCopy(c) {
    return this.cardCopyByPalette?.[c.palette] || {};
  },

  cardFocus(c) {
    const focus = this.cardCopy(c).focus;
    return typeof focus === 'string' && /^\d{1,3}%\s+\d{1,3}%$/.test(focus) ? focus : '50% 50%';
  },

  cardFoilFocus(c) {
    const focus = this.cardCopy(c).foilFocus;
    return typeof focus === 'string' && /^\d{1,3}%\s+\d{1,3}%$/.test(focus) ? focus : '65% 34%';
  },

  prototypeFaceHtml(c, { locked = false, concealed = false } = {}) {
    const category = concealed ? '隐藏' : c.category;
    const title = locked ? (concealed ? '待发现' : '尚未收藏') : c.title;
    return `
      <span class="prototype-card__art${locked ? ' prototype-card__art--locked' : ''}">
        ${locked ? this.lockedArtHtml(concealed ? '待发现' : '未收藏') : this.artHtml(c)}
      </span>
      ${locked ? '' : '<span class="prototype-card__foil" aria-hidden="true"></span>'}
      <span class="prototype-card__category">${esc(category)}</span>
      <span class="prototype-card__rarity" ${concealed ? '' : `data-rarity="${esc(c.rarity)}"`}><b>${concealed ? '…' : esc(c.rarity)}</b><i>${concealed ? '待发现' : esc(RARITY_NAME[c.rarity] || c.rarity)}</i></span>
      ${!locked && c.hidden ? '<span class="prototype-card__hidden-tag">隐藏</span>' : ''}
      <span class="prototype-card__title">${esc(title)}</span>`;
  },

  prototypeCardHtml(c, i = 0) {
    const label = `${c.title}，${RARITY_NAME[c.rarity] || c.rarity}，查看详情`;
    return `
      <button type="button" class="prototype-card" data-rarity="${esc(c.rarity)}" data-palette="${esc(c.palette)}"
        style="--art-focus:${esc(this.cardFocus(c))};--foil-x:${esc(this.cardFoilFocus(c).split(/\s+/)[0])};--foil-y:${esc(this.cardFoilFocus(c).split(/\s+/)[1])};animation-delay:${i * 28}ms"
        aria-label="${esc(label)}" onclick="Cards.zoom(${c.id})">
        ${this.prototypeFaceHtml(c)}
      </button>`;
  },

  lockedCardHtml(c, i = 0) {
    const concealed = !!c.hidden;
    const aria = concealed
      ? `隐藏卡牌，集齐 ${Number(c.unlock_at) || 0} 张普通卡后解锁`
      : `${c.category}卡牌尚未获得，完成今日学习后可抽取`;
    const style = concealed
      ? `animation-delay:${i * 28}ms`
      : `--sample-edge:${this.rarityEdge(c.rarity)};animation-delay:${i * 28}ms`;
    return `
      <div role="img" aria-label="${esc(aria)}"
        class="prototype-card prototype-card--locked${concealed ? ' prototype-card--concealed' : ''}"
        ${concealed ? '' : `data-rarity="${esc(c.rarity)}"`} style="${style}">
        ${this.prototypeFaceHtml(c, { locked: true, concealed })}
      </div>`;
  },

  rarityEdge(rarity) {
    return ({ N: '#888374', R: '#bd955d', SR: '#59929a', UR: '#c79e49' })[rarity] || '#888374';
  },

  cardHtml(c, i = 0) {
    return c.owned ? this.prototypeCardHtml(c, i) : this.lockedCardHtml(c, i);
  },

  cardStoryHtml(c) {
    const content = this.cardCopy(c);
    const earnedAt = c.earned_at ? `收入卡册 · ${String(c.earned_at).slice(0, 10)}` : '';
    return `
      <div class="prototype-detail__story">
        <p class="prototype-detail__eyebrow">${esc(c.rarity)} <span>·</span> ${esc(RARITY_NAME[c.rarity] || c.rarity)} <span>／</span> ${esc(c.category)}</p>
        <h2>${esc(c.title)}</h2>
        <p class="prototype-detail__cover-line">${esc(content.coverLine || '')}</p>
        <blockquote class="prototype-detail__encouragement">
          <span>收藏寄语</span>
          <p>${esc(content.encouragement || '')}</p>
          ${content.englishEncouragement ? `<p class="prototype-detail__encouragement-en" lang="en">${esc(content.englishEncouragement)}</p>` : ''}
        </blockquote>
        ${earnedAt ? `<p class="prototype-detail__note">${esc(earnedAt)}</p>` : ''}
      </div>`;
  },

  cardDetailHtml(c, { backToDraw = false } = {}) {
    const content = this.cardCopy(c);
    return `
      <article class="prototype-detail" data-rarity="${esc(c.rarity)}" data-palette="${esc(c.palette)}" style="--art-focus:${esc(this.cardFocus(c))};--foil-x:${esc(this.cardFoilFocus(c).split(/\s+/)[0])};--foil-y:${esc(this.cardFoilFocus(c).split(/\s+/)[1])}">
        <div class="prototype-detail__toolbar">
          <span>墨藏集 <i>／</i> ${esc(c.category)} <i>／</i> ${backToDraw ? '抽卡详情' : '卡牌详情'}</span>
          ${backToDraw
            ? '<button type="button" class="prototype-detail__close" id="drawDetailBack">← 返回抽卡结果</button>'
            : '<button type="button" class="prototype-detail__close" id="cardZoomClose" aria-label="关闭卡牌详情">关闭 <b aria-hidden="true">×</b></button>'}
        </div>
        <div class="prototype-detail__layout">
          <figure class="prototype-detail__figure">
            <div class="prototype-detail__art">
              ${this.artHtml(c)}
              <span class="prototype-card__foil" aria-hidden="true"></span>
              <span class="prototype-card__category">${esc(c.category)}</span>
              <span class="prototype-card__rarity" data-rarity="${esc(c.rarity)}"><b>${esc(c.rarity)}</b><i>${esc(RARITY_NAME[c.rarity] || c.rarity)}</i></span>
            </div>
            <figcaption>${esc(content.coverLine || c.title)}</figcaption>
          </figure>
          ${this.cardStoryHtml(c)}
        </div>
      </article>`;
  },

  drawResultHtml(c, { index = 0, secondary = false } = {}) {
    return `
      <section class="draw-result">
        <div class="prototype-card${secondary ? ' hidden-reveal' : ''} rarity-${esc(c.rarity)} draw-card" data-rarity="${esc(c.rarity)}" data-palette="${esc(c.palette)}"
          style="--art-focus:${esc(this.cardFocus(c))};--foil-x:${esc(this.cardFoilFocus(c).split(/\s+/)[0])};--foil-y:${esc(this.cardFoilFocus(c).split(/\s+/)[1])}">
          ${this.prototypeFaceHtml(c)}
        </div>
        <button type="button" class="btn btn-ghost draw-card-detail" data-draw-detail="${index}">查看收藏寄语</button>
      </section>`;
  },

  bindDrawControls() {
    document.querySelectorAll('[data-draw-detail]').forEach(button => {
      button.onclick = () => this.openDrawDetail(Number(button.dataset.drawDetail));
    });
    const collect = $('#drawClose');
    if (collect) collect.onclick = () => this.finishDraw();
  },

  openDrawDetail(index) {
    const card = this._drawRevealCards?.[index];
    if (!card) return;
    this._drawRevealMarkup = $('#cardReveal').innerHTML;
    this._drawDetailIndex = index;
    $('#cardReveal').innerHTML = this.cardDetailHtml(card, { backToDraw: true });
    $('#drawDetailBack').onclick = () => this.restoreDrawReveal();
    $('#drawDetailBack').focus();
    this.bindFoil($('#cardReveal'));
  },

  restoreDrawReveal() {
    if (!this._drawRevealMarkup) return;
    $('#cardReveal').innerHTML = this._drawRevealMarkup;
    this.bindDrawControls();
    this.bindFoil($('#cardReveal'));
    document.querySelector(`[data-draw-detail="${this._drawDetailIndex}"]`)?.focus();
  },

  finishDraw() {
    $('#cardModal').classList.add('hidden');
    this._drawRevealMarkup = null;
    this._drawRevealCards = null;
    if ((location.hash || '#/') === '#/cards') this.render();
    else location.hash = '#/cards';
  },

  bindFoil(root) {
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.querySelectorAll('.prototype-card[data-rarity="SR"], .prototype-card[data-rarity="UR"], .prototype-detail[data-rarity="SR"], .prototype-detail[data-rarity="UR"]')
      .forEach(target => {
        const surface = target.matches('.prototype-detail') ? target.querySelector('.prototype-detail__art') : target;
        if (!surface) return;
        const foil = surface.querySelector('.prototype-card__foil');
        if (!foil) return;
        let frame = 0;
        let point = null;
        surface.addEventListener('pointermove', event => {
          if (event.pointerType === 'touch') return;
          const rect = surface.getBoundingClientRect();
          point = {
            x: Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)),
            y: Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100)),
          };
          if (frame) return;
          frame = requestAnimationFrame(() => {
            frame = 0;
            if (!point) return;
            foil.style.setProperty('--foil-x', `${point.x}%`);
            foil.style.setProperty('--foil-y', `${point.y}%`);
          });
        }, { passive: true });
        surface.addEventListener('pointerleave', () => {
          point = null;
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
          foil.style.removeProperty('--foil-x');
          foil.style.removeProperty('--foil-y');
        }, { passive: true });
      });
  },

  // 卡面主体：使用生成的原创插画，加载失败回退到项目内 SVG
  artHtml(c) {
    return `
      <img class="gc-photo" src="cards/original/${esc(c.palette)}.webp" alt="" loading="lazy"
           onerror="this.classList.add('gone')">
      <div class="gc-art-fallback">${CardArt.render(c)}</div>`;
  },

  lockedArtHtml(label = '待发现') {
    return `<div class="gc-locked-art" aria-hidden="true">
      <svg viewBox="0 0 64 64" class="gc-lock-icon" focusable="false">
        <rect x="13" y="8" width="38" height="48" rx="5" />
        <path d="M23 8V5.5A9 9 0 0 1 41 5.5V8M25 30v-3a7 7 0 0 1 14 0v3M21 30h22v15H21z" />
        <path d="M32 36v4" />
      </svg>
      <span>${esc(label)}</span>
    </div>`;
  },

  zoom(id) {
    this.lastTrigger = document.activeElement;
    api('/api/cards').then(data => {
      if (this._preview) data.cards.filter(c => !c.hidden).forEach(c => { c.owned = true; c.earned_at = c.earned_at || '预览'; });
      const c = data.cards.find(x => x.id === id);
      if (!c || !c.owned) return;
      $('#cardReveal').innerHTML = this.cardDetailHtml(c);
      $('#cardReveal').classList.add('prototype-reveal');
      $('#cardModal').classList.add('prototype-modal');
      document.documentElement.classList.add('has-card-modal');
      document.body.classList.add('has-card-modal');
      $('#cardModal').setAttribute('aria-label', `${c.title}卡牌详情`);
      $('#cardModal').classList.remove('hidden');
      $('#cardZoomClose').onclick = () => this.closeModal();
      $('#cardZoomClose').focus();
      this.bindFoil($('#cardReveal'));
    }).catch(error => toast(`卡牌详情暂时无法加载：${error.message}`));
  },

  closeModal() {
    $('#cardModal').classList.add('hidden');
    $('#cardModal').classList.remove('prototype-modal');
    document.documentElement.classList.remove('has-card-modal');
    document.body.classList.remove('has-card-modal');
    $('#cardModal').setAttribute('aria-label', '卡牌详情');
    $('#cardReveal').classList.remove('prototype-reveal');
    this._drawRevealMarkup = null;
    this._drawRevealCards = null;
    this.lastTrigger?.focus({ preventScroll: true });
  },

  async draw() {
    if (this._preview) {
      toast('内容预览模式不会修改卡牌收藏');
      return;
    }
    const drawButton = $('#drawCardBtn');
    const buttonText = drawButton.textContent;
    drawButton.disabled = true;
    drawButton.textContent = '正在领取卡牌…';
    showPageLoading('正在记录今日卡牌奖励…');
    try {
      const r = await api('/api/cards/draw', { method: 'POST' });
      clearPageStatus();
      const c = r.card || r.sample;
      const isDup = !!r.duplicate;
      const hasUnlock = Array.isArray(r.unlocked) && r.unlocked.length > 0;
      $('#cardReveal').classList.remove('prototype-reveal');
      $('#cardModal').classList.remove('prototype-modal');
      document.documentElement.classList.remove('has-card-modal');
      document.body.classList.remove('has-card-modal');
      $('#cardModal').setAttribute('aria-label', '卡牌详情');
      await this.loadCardCopy({ refresh: true });
      this._drawRevealCards = [c, ...(r.unlocked || [])];
      $('#cardReveal').innerHTML = `
        <div class="draw-stage${hasUnlock ? ' has-unlock' : ''}">
          <div class="ink-converge" aria-hidden="true"></div>
          <p class="draw-kicker">${isDup ? '普通卡已全部集齐' : '墨迹汇聚 · 卡牌揭晓'}</p>
          ${this.drawResultHtml(c, { index: 0 })}
          ${hasUnlock ? `
            ${r.unlocked.map((h, i) => this.drawResultHtml(h, { index: i + 1, secondary: true })).join('')}` : ''}
          <button class="btn btn-primary" id="drawClose"><svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m3 10 4.3 4.3L17 4.8"/></svg>收入卡册</button>
        </div>`;
      $('#cardModal').classList.remove('hidden');
      this.bindFoil($('#cardReveal'));
      this._drawRevealMarkup = $('#cardReveal').innerHTML;
      this.bindDrawControls();
      $('#drawClose').focus();
      $('#cardDot').classList.add('hidden');
      $('#bottomCardDot').classList.add('hidden');
      $('#drawCardBtn').disabled = true;
      $('#drawCardBtn').textContent = '今日已抽，明天再来';
    } catch (e) {
      drawButton.disabled = false;
      drawButton.innerHTML = `${DRAW_CARD_ICON}${esc(buttonText)}`;
      showPageError(`抽卡没有完成：${e.message}`, () => this.draw());
    }
  },
};

$('#drawCardBtn').addEventListener('click', () => Cards.draw());
$('#cardModal').addEventListener('click', (e) => { if (e.target.id === 'cardModal') Cards.closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#cardModal').classList.contains('hidden')) Cards.closeModal();
});

/* ============================================================ */
route();
