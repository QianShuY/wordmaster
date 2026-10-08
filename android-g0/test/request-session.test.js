'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createPendingRequestTracker, normalizeAnswer } = require('../src/request-session');

test('a retry of the same normalized answer reuses its request ID', () => {
  let generated = 0;
  const tracker = createPendingRequestTracker(() => `request-${++generated}`);

  const first = tracker.forAnswer('  Abandon  ');
  const retry = tracker.forAnswer('abandon');

  assert.equal(first.answer, 'abandon');
  assert.deepEqual(retry, first);
  assert.equal(generated, 1);
});

test('a changed answer gets a fresh request ID while the pending payload stays stable', () => {
  let generated = 0;
  const tracker = createPendingRequestTracker(() => `request-${++generated}`);

  const first = tracker.forAnswer('abandon');
  const changed = tracker.forAnswer('abandoned');
  const retryChanged = tracker.forAnswer('  ABANDONED  ');

  assert.notEqual(changed.requestId, first.requestId);
  assert.deepEqual(retryChanged, changed);
  assert.equal(generated, 2);
});

test('only explicit completion clears the matching pending request', () => {
  let generated = 0;
  const tracker = createPendingRequestTracker(() => `request-${++generated}`);
  const pending = tracker.forAnswer('abandon');

  assert.equal(tracker.complete('another-request'), false);
  assert.deepEqual(tracker.current(), pending);
  assert.equal(tracker.complete(pending.requestId), true);
  assert.equal(tracker.current(), null);
  assert.notEqual(tracker.forAnswer('abandon').requestId, pending.requestId);
});

test('blank input does not allocate a request ID', () => {
  let generated = 0;
  const tracker = createPendingRequestTracker(() => `request-${++generated}`);

  assert.equal(normalizeAnswer(' \n\t '), '');
  assert.equal(tracker.forAnswer(' \n\t '), null);
  assert.equal(generated, 0);
});

test('a committed submission whose bridge reply is lost retries with the same ID', async () => {
  let generated = 0;
  let loseFirstReply = true;
  let attempts = 0;
  const events = new Map();
  const tracker = createPendingRequestTracker(() => `request-${++generated}`);
  const mockNativeSubmit = async request => {
    const prior = events.get(request.requestId);
    if (prior) {
      assert.deepEqual(prior, request);
      return { duplicate: true, state: { attempts, correct: attempts } };
    }
    events.set(request.requestId, request);
    attempts += 1;
    if (loseFirstReply) {
      loseFirstReply = false;
      throw new Error('simulated lost bridge response after commit');
    }
    return { duplicate: false, state: { attempts, correct: attempts } };
  };

  const first = tracker.forAnswer('abandon');
  await assert.rejects(mockNativeSubmit(first));
  const retry = tracker.forAnswer(' ABANDON ');
  const result = await mockNativeSubmit(retry);
  tracker.complete(retry.requestId);

  assert.equal(retry.requestId, first.requestId);
  assert.equal(result.duplicate, true);
  assert.equal(result.state.attempts, 1);
  assert.equal(events.size, 1);
  assert.equal(attempts, 1);
});
