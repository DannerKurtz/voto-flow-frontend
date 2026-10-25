import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAvailabilityClockState } from '../app/lib/availability-clock-state.ts';

test('counts down until the configured target time', () => {
  assert.deepEqual(getAvailabilityClockState(9_000, 10_000, false), {
    status: 'countdown', milliseconds: 1_000,
  });
});

test('shows elapsed overtime after target while official results are unavailable', () => {
  assert.deepEqual(getAvailabilityClockState(12_500, 10_000, false), {
    status: 'waiting', milliseconds: 2_500,
  });
});

test('marks the consultation available only when official results are ready', () => {
  assert.deepEqual(getAvailabilityClockState(9_000, 10_000, true), {
    status: 'available', milliseconds: 0,
  });
});

test('keeps the server and first client render on the countdown placeholder', () => {
  assert.deepEqual(getAvailabilityClockState(null, 10_000, false), {
    status: 'countdown', milliseconds: 0,
  });
});
