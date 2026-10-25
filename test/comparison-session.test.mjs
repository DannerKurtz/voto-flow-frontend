import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as tick, setTimeout as delay } from 'node:timers/promises';
import { startComparisonSession } from '../app/lib/realtime/comparison-session.ts';
import { parseComparisonList, parseComparisonUpdate } from '../app/lib/realtime/comparison-parser.ts';

function comparison(votes = 10, scope = 'sp') {
  const candidates = ['flavio', 'lula'].map((key) => ({ key, sqcand: key, name: key, ballotName: key, votes, percentage: 50 }));
  return {
    scope: { code: scope, level: scope === 'br' ? 'national' : 'state' }, availability: 'ready',
    firstRound: { electionCode: 'first', totalizationPercentage: 100, candidates },
    secondRound: { electionCode: 'second', totalizationPercentage: 10, blankVotes: 1, nullVotes: 2, candidates },
    estimatedSurplus: { estimated: true, eligible: false, label: 'estimativa', candidates: [] },
  };
}
function pendingComparison(scope = 'sp') {
  return {
    scope: { code: scope, level: scope === 'br' ? 'national' : 'state' }, availability: 'pending',
    firstRound: null, secondRound: null,
    estimatedSurplus: { estimated: true, eligible: false, label: 'estimativa', candidates: [] },
  };
}
test('preserves optional official presidential parties without accepting invalid types', () => {
  const result = comparison();
  assert.doesNotThrow(() => parseComparisonList({ results: [result] }));
  result.secondRound.candidates[0].party = 'PL';
  result.secondRound.candidates[1].party = 'PT';
  assert.equal(parseComparisonList({ results: [result] })[0].secondRound.candidates[1].party, 'PT');
  result.secondRound.candidates[1].party = 13;
  assert.throws(() => parseComparisonList({ results: [result] }));
});
class Socket {
  onopen = null; onclose = null; onerror = null; onmessage = null;
  sent = []; closed = false;
  send(value) { this.sent.push(JSON.parse(value)); }
  close() { this.closed = true; this.onclose?.({}); }
  open() { this.onopen?.({}); }
  message(value) { this.onmessage?.({ data: JSON.stringify(value) }); }
  acknowledge() { this.message({ type: 'subscribed', data: { subscription: 'second-round-comparison', scopeCode: 'sp' } }); }
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test('shares initial HTTP loading with socket startup and aborts on cleanup', async () => {
  const initial = deferred();
  const socket = new Socket();
  let requests = 0; let signal; const changes = [];
  const stop = startComparisonSession({
    load: (receivedSignal) => { signal = receivedSignal; requests++; return initial.promise; },
    createSocket: () => socket, onChange: (state) => changes.push(state),
  });
  socket.open();
  assert.equal(requests, 1);
  stop();
  initial.resolve([comparison()]);
  await tick();
  assert.equal(signal.aborted, true);
  assert.equal(socket.closed, true);
  assert.equal(changes.length, 0);
});

test('subscribes before backfill and prevents stale REST from overwriting live updates', async () => {
  const backfill = deferred();
  const socket = new Socket();
  let requests = 0; let state;
  const stop = startComparisonSession({
    load: () => ++requests === 1 ? Promise.resolve([comparison(10)]) : backfill.promise,
    createSocket: () => socket, onChange: (next) => { state = next; },
  });
  try {
    socket.open();
    await tick();
    assert.equal(requests, 1);
    assert.deepEqual(socket.sent, [{ type: 'subscribe.second-round-comparison', scopeCode: 'sp' }]);
    socket.acknowledge();
    assert.equal(requests, 2);
    socket.message({ type: 'second-round.comparison.updated', data: { scopeCode: 'sp', comparison: comparison(30) } });
    backfill.resolve([comparison(20)]);
    await tick();
    assert.equal(state.comparisons.sp.secondRound.candidates[0].votes, 30);
    assert.equal(state.status, 'connected');
    socket.message({ type: 'second-round.comparison.updated', data: { scopeCode: 'sp', comparison: { broken: true } } });
    assert.equal(state.comparisons.sp.secondRound.candidates[0].votes, 30);
  } finally { stop(); }
});

test('reloads the current state after reconnection and keeps one active subscription per scope', async () => {
  const sockets = []; let requests = 0; let state;
  const stop = startComparisonSession({
    load: async () => [comparison(++requests)], reconnectDelayMs: 0,
    createSocket: () => { const socket = new Socket(); sockets.push(socket); return socket; },
    onChange: (next) => { state = next; },
  });
  try {
    sockets[0].open(); await tick(); sockets[0].acknowledge(); await tick();
    sockets[0].close(); await delay(10);
    assert.equal(sockets.length, 2);
    sockets[1].open(); await tick(); sockets[1].acknowledge(); await tick();
    assert.equal(requests, 3);
    assert.equal(sockets[1].sent.length, 1);
    assert.equal(state.comparisons.sp.secondRound.candidates[0].votes, 3);
    assert.equal(state.status, 'connected');
  } finally { stop(); }
});

test('keeps the last ready result when REST or WebSocket reports a pending result', async () => {
  const socket = new Socket(); let requests = 0; let state;
  const stop = startComparisonSession({
    load: async () => ++requests === 1 ? [comparison(42)] : [pendingComparison()],
    createSocket: () => socket, onChange: (next) => { state = next; },
  });
  try {
    await tick();
    socket.open(); await tick();
    socket.acknowledge(); await tick();
    assert.equal(state.comparisons.sp.availability, 'ready');
    socket.message({ type: 'second-round.comparison.updated', data: { scopeCode: 'sp', comparison: pendingComparison() } });
    assert.equal(state.comparisons.sp.availability, 'ready');
    assert.equal(state.comparisons.sp.secondRound.candidates[0].votes, 42);
  } finally { stop(); }
});

test('rejects malformed payloads and mismatched WebSocket scopes', () => {
  assert.throws(() => parseComparisonList({ results: [{ scope: { code: 'sp' } }] }));
  assert.equal(parseComparisonUpdate('{invalid'), null);
  assert.equal(parseComparisonUpdate(JSON.stringify({
    type: 'second-round.comparison.updated', data: { scopeCode: 'br', comparison: comparison() },
  })), null);
  assert.deepEqual(parseComparisonList({ results: [comparison()] }), [comparison()]);
});
