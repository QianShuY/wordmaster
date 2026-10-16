'use strict';
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WordMasterReinforcement = api;
})(typeof window === 'undefined' ? null : window, function() {
  // State belongs to one assessment round; cross-day memory stays in SQLite.
  function answer(previous, correct) {
    const state = { errors: 0, streak: 0, ...previous };
    if (correct) state.streak++;
    else { state.errors++; state.streak = 0; }
    const required = state.errors >= 2 ? 2 : 1;
    return { ...state, required, passed: correct && state.streak >= required,
      canDefer: state.errors >= 4 };
  }
  function enqueue(queue, word) {
    const rest = queue.filter(item => String(item.id) !== String(word.id));
    // Up to three intervening words; never duplicate a retry in the queue.
    rest.splice(Math.min(3, rest.length), 0, word);
    return rest;
  }
  function shuffle(choices, random = Math.random) {
    const list = choices.slice();
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  return Object.freeze({ answer, enqueue, shuffle });
});
