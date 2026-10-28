# @lp-labs/react-virtualized-list

Fixed-size virtual lists, two-axis grids, and an infinite-loading hook. React 18+ is the only runtime peer dependency. No CSS import is needed. Includes TypeScript, ESM, CommonJS, and a browser entry.

## Installation

```sh
npm install @lp-labs/react-virtualized-list
```

Requires React 18 or later in the host application. Use a modern browser for scrolling; server-side rendering is supported. Node.js consumers require Node.js 18 or later.

## Quick Start

```jsx
import VirtualList from '@lp-labs/react-virtualized-list';

const items = Array.from({ length: 10000 }, (_, index) => ({
  id: index,
  name: `Item ${index + 1}`,
}));

export default function Example() {
  return (
    <VirtualList
      items={items}
      height={400}
      itemSize={32}
      itemKey={(index, item) => item.id}
      aria-label="Items"
    >
      {({ item, index }) => <div>{index + 1}. {item.name}</div>}
    </VirtualList>
  );
}
```

## VirtualList API

| Prop | Default | Description |
| --- | --- | --- |
| `items` | none | Array of items; takes precedence over `itemCount` |
| `itemCount` | `0` | Number of rows for index-based data |
| `itemSize` | `32` | Fixed row height in pixels |
| `height` | `320` | Scroll viewport height in pixels |
| `width` | `'100%'` | CSS width |
| `overscan` | `3` | Extra rows before and after the viewport |
| `itemKey(index, item)` | row index | Stable React key for each item |
| `children({ index, item })` | string value | Row render function; `item` is undefined without `items` |
| `onRangeChange({ start, end })` | none | Mounted range; `end` is exclusive |

Standard div attributes, styles, and `onScroll` are supported. The ref exposes `scrollToIndex(index, { align })` and `getElement()`. Alignments are `auto` (default), `start`, `center`, and `end`. Missing indices return `false`. Use unique stable item keys when items can reorder.

## VirtualGrid

`VirtualGrid` accepts `rowCount`, `columnCount`, `rowHeight` (32), `columnWidth` (120), numeric `height` (320), numeric `width` (600), and `overscan` (2). Its children receive `{rowIndex,columnIndex}`. Its ref exposes `scrollToCell(row,column,{align})` and `getElement()`. Both axes are virtualized. `onRangeChange` reports `{rowStart,rowEnd,columnStart,columnEnd}`. ARIA row and column counts describe the full logical grid, while only the windowed rows and cells are mounted. Custom interactive cells need their own keyboard behavior.

```jsx
import { VirtualGrid } from '@lp-labs/react-virtualized-list';

export default function GridExample() {
  return (
    <VirtualGrid rowCount={1000} columnCount={100} height={400} width={600} aria-label="Cells">
      {({ rowIndex, columnIndex }) => <span>{rowIndex + 1}, {columnIndex + 1}</span>}
    </VirtualGrid>
  );
}
```

Grid ranges also use exclusive end indices. Row and column counts default to `0`.

## Infinite Loading

```jsx
import { useState } from 'react';
import VirtualList, { useInfiniteLoader } from '@lp-labs/react-virtualized-list';

export default function InfiniteExample() {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const loader = useInfiniteLoader({
    itemCount: items.length,
    hasMore,
    loadMore: async ({ startIndex, signal }) => {
      const response = await fetch(`/items?offset=${startIndex}`, { signal });
      if (!response.ok) throw new Error('Loading failed');
      const batch = await response.json();
      setItems((previous) => [...previous, ...batch.items]);
      setHasMore(batch.hasMore);
    },
  });

  return (
    <>
      <VirtualList items={items} onRangeChange={loader.onRangeChange} aria-label="Items">
        {({ item }) => <div>{item.name}</div>}
      </VirtualList>
      {loader.isLoading && <p role="status">Loading...</p>}
      {loader.error && <button onClick={loader.retry}>Retry loading</button>}
    </>
  );
}
```

The example endpoint must return `{ items: [{ id, name }], hasMore: boolean }`; replace the URL with your API. `useInfiniteLoader` returns `onRangeChange`, `isLoading`, `error`, and `retry()`. It starts near the end of loaded data (`threshold` defaults to `5` rows), deduplicates completed attempts for the same item count, and aborts active loads on unmount or changed loading conditions. Aborted attempts can run again. Successful loads that add no items require `retry()` or a count change. The application owns the data and end-of-results state.

## Compatibility And Limits

Sizes must be positive finite pixel values; counts and overscan must be nonnegative integers. Containers require finite heights. Rows and cells have fixed dimensions and clip overflowing content. Variable measured sizes, sticky rows, automatic API pagination, browser scroll-height segmentation, and built-in keyboard cell navigation are not included. Native browser scroll-height limits still apply. `getRange` is exported for custom fixed-size integrations. SSR renders the initial viewport, and client bundles retain the `use client` directive.

## Support

Support maintenance with a [PayPal donation](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/).