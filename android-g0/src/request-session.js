'use strict';

(function exposeRequestSession(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WordmasterRequestSession = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function createRequestSession() {
  function normalizeAnswer(value) {
    return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function createPendingRequestTracker(makeRequestId) {
    if (typeof makeRequestId !== 'function') throw new TypeError('makeRequestId must be a function');
    let pending = null;

    return {
      forAnswer(value) {
        const answer = normalizeAnswer(value);
        if (!answer) return null;
        if (!pending || pending.answer !== answer) {
          pending = { answer, requestId: makeRequestId() };
        }
        return { ...pending };
      },
      complete(requestId) {
        if (!pending || pending.requestId !== requestId) return false;
        pending = null;
        return true;
      },
      current() {
        return pending ? { ...pending } : null;
      },
    };
  }

  return { createPendingRequestTracker, normalizeAnswer };
});
