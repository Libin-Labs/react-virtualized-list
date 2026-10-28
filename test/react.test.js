import { beforeEach, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { act, createElement as element, createRef } from 'react';
import { setupDOM } from './helpers/dom.js';
import List, { VirtualGrid, useInfiniteLoader } from '../src/index.js';
let ui;
beforeEach(async () => { ui = await setupDOM(); });
afterEach(async () => ui.cleanup());

test('list windows large data, scrolls imperatively and clamps after shrinking', async () => {
  const ref = createRef();
  await ui.render(element(List, { ref, itemCount: 100000, height: 200, itemSize: 20, overscan: 2 }));
  assert.equal(ui.container.querySelectorAll('[role="listitem"]').length, 12);
  await act(() => ref.current.scrollToIndex(500, { align: 'start' }));
  assert.equal(ref.current.getElement().scrollTop, 10000);
  assert.ok(ui.container.textContent.includes('500'));
  await ui.render(element(List, { ref, itemCount: 2, height: 200, itemSize: 20 }));
  assert.equal(ref.current.getElement().scrollTop, 0);
});
test('grid windows both axes and exposes valid cell metadata', async () => {
  const ref = createRef();
  await ui.render(element(VirtualGrid, { ref, rowCount: 10000, columnCount: 1000, height: 100, width: 200, rowHeight: 20, columnWidth: 50, overscan: 1 }));
  assert.ok(ui.container.querySelectorAll('[role="gridcell"]').length <= 30);
  await act(() => ref.current.scrollToCell(50, 40, { align: 'start' }));
  assert.equal(ref.current.getElement().scrollTop, 1000);
  assert.equal(ref.current.getElement().scrollLeft, 2000);
  assert.ok(ui.container.textContent.includes('50, 40'));
});
test('infinite loader deduplicates loads, reports failures and retries', async () => {
  let controls;
  let calls = 0;
  function Consumer() {
    controls = useInfiniteLoader({ itemCount: 0, hasMore: true, loadMore: async () => { calls += 1; throw new Error('offline'); } });
    return null;
  }
  await ui.render(element(Consumer));
  assert.equal(calls, 1);
  assert.equal(controls.error.message, 'offline');
  await act(() => controls.onRangeChange({ start: 0, end: 0 }));
  assert.equal(calls, 1);
  await act(() => controls.onRangeChange({ start: 0, end: 1 }));
  assert.equal(calls, 1);
  await act(() => controls.retry());
  assert.equal(calls, 2);
});