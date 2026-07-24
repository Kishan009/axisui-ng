import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, isOverBudget } from './bench.mjs';

test('formatBytes renders B / KB / MB', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(2 * 1024 * 1024), '2.00 MB');
});

test('isOverBudget respects tolerance', () => {
  // budget 1000, tolerance 5% => ceiling 1050
  assert.equal(isOverBudget(1040, 1000, 5), false);
  assert.equal(isOverBudget(1051, 1000, 5), true);
  assert.equal(isOverBudget(900, 1000, 5), false);
});

test('isOverBudget with no budget never fails', () => {
  assert.equal(isOverBudget(999999, 0, 5), false);
  assert.equal(isOverBudget(999999, undefined, 5), false);
});
