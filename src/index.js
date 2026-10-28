'use client';
import { createElement, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { alignOffset, getRange } from './range.js';
export { getRange } from './range.js';

export const VirtualList = forwardRef(function VirtualList({ items, itemCount = 0, itemSize = 32, height = 320, width = '100%', overscan = 3, itemKey, children = ({ item, index }) => String(item ?? index), onRangeChange, onScroll, style, ...props }, ref) {
  const count = items?.length ?? itemCount;
  const viewport = useRef(null);
  const [offset, setOffset] = useState(0);
  const range = getRange(count, itemSize, height, offset, overscan);
  useEffect(() => {
    if (offset !== range.scrollOffset) { setOffset(range.scrollOffset); if (viewport.current) viewport.current.scrollTop = range.scrollOffset; }
  }, [offset, range.scrollOffset]);
  useEffect(() => { onRangeChange?.({ start: range.start, end: range.end }); }, [range.start, range.end, onRangeChange]);
  useImperativeHandle(ref, () => ({
    scrollToIndex(index, options = {}) {
      const next = alignOffset(index, count, itemSize, height, range.scrollOffset, options.align);
      if (next === null) return false;
      viewport.current.scrollTop = next;
      setOffset(next);
      return true;
    },
    getElement: () => viewport.current,
  }));
  const rows = [];
  for (let index = range.start; index < range.end; index += 1) rows.push(createElement('div', {
    key: itemKey ? itemKey(index, items?.[index]) : index, role: 'listitem', 'aria-posinset': index + 1, 'aria-setsize': count,
    style: { position: 'absolute', top: index * itemSize, left: 0, right: 0, height: itemSize, overflow: 'hidden', boxSizing: 'border-box' },
  }, children({ index, item: items?.[index] })));
  return createElement('div', { ...props, ref: viewport, role: 'list', tabIndex: props.tabIndex ?? 0,
    onScroll: (event) => { setOffset(event.currentTarget.scrollTop); onScroll?.(event); },
    style: { ...style, height, width, position: 'relative', overflow: 'auto', letterSpacing: 0 },
  }, createElement('div', { role: 'none', style: { height: range.total, position: 'relative' } }, rows));
});

export const VirtualGrid = forwardRef(function VirtualGrid({ rowCount = 0, columnCount = 0, rowHeight = 32, columnWidth = 120, height = 320, width = 600, overscan = 2, children = ({ rowIndex, columnIndex }) => `${rowIndex}, ${columnIndex}`, onRangeChange, onScroll, style, ...props }, ref) {
  const viewport = useRef(null);
  const [offset, setOffset] = useState({ top: 0, left: 0 });
  const rows = getRange(rowCount, rowHeight, height, offset.top, overscan);
  const columns = getRange(columnCount, columnWidth, width, offset.left, overscan);
  useEffect(() => {
    if (offset.top === rows.scrollOffset && offset.left === columns.scrollOffset) return;
    setOffset({ top: rows.scrollOffset, left: columns.scrollOffset });
    if (viewport.current) { viewport.current.scrollTop = rows.scrollOffset; viewport.current.scrollLeft = columns.scrollOffset; }
  }, [offset.top, offset.left, rows.scrollOffset, columns.scrollOffset]);
  useEffect(() => { onRangeChange?.({ rowStart: rows.start, rowEnd: rows.end, columnStart: columns.start, columnEnd: columns.end }); }, [rows.start, rows.end, columns.start, columns.end, onRangeChange]);
  useImperativeHandle(ref, () => ({
    scrollToCell(rowIndex, columnIndex, options = {}) {
      const top = alignOffset(rowIndex, rowCount, rowHeight, height, rows.scrollOffset, options.align);
      const left = alignOffset(columnIndex, columnCount, columnWidth, width, columns.scrollOffset, options.align);
      if (top === null || left === null) return false;
      viewport.current.scrollTop = top; viewport.current.scrollLeft = left; setOffset({ top, left });
      return true;
    },
    getElement: () => viewport.current,
  }));
  const rendered = [];
  for (let rowIndex = rows.start; rowIndex < rows.end; rowIndex += 1) {
    const cells = [];
    for (let columnIndex = columns.start; columnIndex < columns.end; columnIndex += 1) cells.push(createElement('div', {
      key: columnIndex, role: 'gridcell', 'aria-colindex': columnIndex + 1,
      style: { position: 'absolute', left: columnIndex * columnWidth, top: 0, width: columnWidth, height: rowHeight, overflow: 'hidden', boxSizing: 'border-box' },
    }, children({ rowIndex, columnIndex })));
    rendered.push(createElement('div', { key: rowIndex, role: 'row', 'aria-rowindex': rowIndex + 1, style: { position: 'absolute', top: rowIndex * rowHeight, height: rowHeight, width: columns.total } }, cells));
  }
  return createElement('div', { ...props, ref: viewport, role: 'grid', tabIndex: props.tabIndex ?? 0, 'aria-rowcount': rowCount, 'aria-colcount': columnCount,
    onScroll: (event) => { setOffset({ top: event.currentTarget.scrollTop, left: event.currentTarget.scrollLeft }); onScroll?.(event); },
    style: { ...style, height, width, position: 'relative', overflow: 'auto', letterSpacing: 0 },
  }, createElement('div', { role: 'none', style: { height: rows.total, width: columns.total, position: 'relative' } }, rendered));
});

export function useInfiniteLoader({ itemCount, hasMore, loadMore, threshold = 5 }) {
  if (!Number.isSafeInteger(itemCount) || itemCount < 0 || !Number.isSafeInteger(threshold) || threshold < 0) throw new RangeError('itemCount and threshold must be nonnegative integers.');
  const [range, setRange] = useState({ start: 0, end: 0 });
  const [attempt, setAttempt] = useState(0);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const attempted = useRef(null);
  const callback = useRef(loadMore);
  callback.current = loadMore;
  const reachedEnd = range.end >= itemCount - threshold;
  useEffect(() => {
    if (!hasMore || !reachedEnd) { setLoading(false); return; }
    const key = `${itemCount}:${attempt}`;
    if (attempted.current === key) return;
    attempted.current = key;
    const controller = new AbortController();
    let active = true;
    let settled = false;
    setLoading(true); setError(null);
    Promise.resolve().then(() => { if (!controller.signal.aborted) return callback.current({ startIndex: itemCount, signal: controller.signal }); }).catch((failure) => {
      if (active) setError(failure);
    }).finally(() => { settled = true; if (active) setLoading(false); });
    return () => { active = false; controller.abort(); if (!settled) attempted.current = null; };
  }, [itemCount, hasMore, reachedEnd, attempt]);
  const onRangeChange = useCallback((next) => setRange((previous) => previous.start === next.start && previous.end === next.end ? previous : next), []);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { onRangeChange, isLoading, error, retry };
}
export default VirtualList;