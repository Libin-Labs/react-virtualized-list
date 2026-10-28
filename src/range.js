export function getRange(count, size, viewport, offset = 0, overscan = 3) {
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('Count must be a nonnegative integer.');
  if (!Number.isFinite(size) || size <= 0 || !Number.isFinite(viewport) || viewport <= 0) throw new RangeError('Size and viewport must be positive finite numbers.');
  if (!Number.isSafeInteger(overscan) || overscan < 0 || !Number.isFinite(offset)) throw new RangeError('Invalid overscan or scroll offset.');
  const total = count * size;
  if (!Number.isSafeInteger(Math.ceil(total))) throw new RangeError('Total size exceeds numeric limits.');
  const scrollOffset = Math.max(0, Math.min(offset, Math.max(0, total - viewport)));
  return { start: Math.max(0, Math.floor(scrollOffset / size) - overscan), end: Math.min(count, Math.ceil((scrollOffset + viewport) / size) + overscan), total, scrollOffset };
}

export function alignOffset(index, count, size, viewport, current, align = 'auto') {
  if (!Number.isSafeInteger(index) || index < 0 || index >= count) return null;
  if (!['auto', 'start', 'center', 'end'].includes(align)) throw new TypeError('Unknown alignment.');
  let offset = index * size;
  if (align === 'auto' && offset >= current && offset + size <= current + viewport) return current;
  if (align === 'center') offset -= (viewport - size) / 2;
  if (align === 'end' || (align === 'auto' && offset > current)) offset -= viewport - size;
  return Math.max(0, Math.min(offset, Math.max(0, count * size - viewport)));
}