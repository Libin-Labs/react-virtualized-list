import test from 'node:test';
import assert from 'node:assert/strict';
import { alignOffset, getRange } from '../src/range.js';

test('bounds huge list windows and clamps offsets', () => {
  assert.deepEqual(getRange(100000, 20, 200, 20000, 2), { start: 998, end: 1012, total: 2000000, scrollOffset: 20000 });
  assert.equal(getRange(0, 20, 200).end, 0);
  assert.equal(getRange(2, 20, 200, 999).scrollOffset, 0);
  assert.throws(() => getRange(2, 0, 200), RangeError);
});
test('aligns valid indices and rejects missing targets', () => {
  assert.equal(alignOffset(50, 100, 20, 200, 0, 'start'), 1000);
  assert.equal(alignOffset(50, 100, 20, 200, 0, 'center'), 910);
  assert.equal(alignOffset(-1, 100, 20, 200, 0), null);
});