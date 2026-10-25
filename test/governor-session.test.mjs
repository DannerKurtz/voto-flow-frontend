import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as tick } from 'node:timers/promises';
import { startGovernorSession } from '../app/lib/realtime/governor-session.ts';

const governor = (votes, scope = 'ac') => ({
  scope: { code: scope, level: 'state' }, availability: 'ready',
  secondRound: {
    electionCode: 'runoff', totalizationPercentage: 50, blankVotes: 1, nullVotes: 2,
    candidates: [{ sqcand: 'a', name: 'A', ballotName: 'A', votes, percentage: 55 }],
  },
});
const pendingGovernor = (scope = 'ac') => ({
  scope: { code: scope, level: 'state' }, availability: 'pending', secondRound: null,
});
class Socket {
  onopen = null; onclose = null; onerror = null; onmessage = null;
  sent = []; closed = false;
  send(value) { this.sent.push(JSON.parse(value)); }
  close() { this.closed = true; this.onclose?.({}); }
  open() { this.onopen?.({}); }
  message(value) { this.onmessage?.({ data: JSON.stringify(value) }); }
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test('subscribes by configured state and prefers a live update over stale REST data', async () => {
  const stale = deferred(); const socket = new Socket(); let requests = 0; let state;
  const stop = startGovernorSession({
    load: () => ++requests === 1 ? Promise.resolve([governor(10)]) : stale.promise,
    createSocket: () => socket, onChange: (next) => { state = next; },
  });
  try {
    socket.open(); await tick();
    assert.deepEqual(socket.sent, [{ type: 'subscribe.second-round-governor', scopeCode: 'ac' }]);
    socket.message({ type: 'subscribed', data: { subscription: 'second-round-governor', scopeCode: 'ac' } });
    socket.message({ type: 'second-round.governor.updated', data: { scopeCode: 'ac', result: governor(30) } });
    stale.resolve([governor(20)]); await tick();
    assert.equal(state.results.ac.secondRound.candidates[0].votes, 30);
    assert.equal(state.status, 'connected');
  } finally { stop(); }
});

test('aborts the initial request and closes the socket on cleanup', async () => {
  const initial = deferred(); const socket = new Socket(); let signal;
  const stop = startGovernorSession({
    load: (received) => { signal = received; return initial.promise; },
    createSocket: () => socket, onChange: () => {},
  });
  socket.open(); stop(); initial.resolve([governor(10)]); await tick();
  assert.equal(signal.aborted, true);
  assert.equal(socket.closed, true);
});

test('keeps the last ready governor result when REST or WebSocket reports pending', async () => {
  const socket = new Socket(); let requests = 0; let state;
  const stop = startGovernorSession({
    load: async () => ++requests === 1 ? [governor(42)] : [pendingGovernor()],
    createSocket: () => socket, onChange: (next) => { state = next; },
  });
  try {
    await tick();
    socket.open(); await tick();
    socket.message({ type: 'subscribed', data: { subscription: 'second-round-governor', scopeCode: 'ac' } });
    await tick();
    assert.equal(state.results.ac.availability, 'ready');
    socket.message({ type: 'second-round.governor.updated', data: { scopeCode: 'ac', result: pendingGovernor() } });
    assert.equal(state.results.ac.availability, 'ready');
    assert.equal(state.results.ac.secondRound.candidates[0].votes, 42);
  } finally { stop(); }
});
