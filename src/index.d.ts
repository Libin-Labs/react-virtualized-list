import type { HTMLAttributes, ReactElement, ReactNode, RefAttributes, CSSProperties } from 'react';
export interface Range { start: number; end: number }
export interface ScrollOptions { align?: 'auto' | 'start' | 'center' | 'end' }
export interface ListHandle { scrollToIndex(index: number, options?: ScrollOptions): boolean; getElement(): HTMLDivElement | null }
export interface ListProps<T = unknown> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  items?: readonly T[]; itemCount?: number; itemSize?: number; height?: number; width?: CSSProperties['width']; overscan?: number;
  itemKey?: (index: number, item: T | undefined) => string | number;
  children?: (props: { index: number; item: T | undefined }) => ReactNode;
  onRangeChange?: (range: Range) => void;
}
export function VirtualList<T = unknown>(props: ListProps<T> & RefAttributes<ListHandle>): ReactElement;
export default VirtualList;
export interface GridHandle { scrollToCell(row: number, column: number, options?: ScrollOptions): boolean; getElement(): HTMLDivElement | null }
export interface GridRange { rowStart: number; rowEnd: number; columnStart: number; columnEnd: number }
export interface GridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  rowCount?: number; columnCount?: number; rowHeight?: number; columnWidth?: number; height?: number; width?: number; overscan?: number;
  children?: (props: { rowIndex: number; columnIndex: number }) => ReactNode; onRangeChange?: (range: GridRange) => void;
}
export function VirtualGrid(props: GridProps & RefAttributes<GridHandle>): ReactElement;
export function getRange(count: number, size: number, viewport: number, offset?: number, overscan?: number): Range & { total: number; scrollOffset: number };
export function useInfiniteLoader(options: { itemCount: number; hasMore: boolean; threshold?: number; loadMore: (options: { startIndex: number; signal: AbortSignal }) => void | PromiseLike<unknown> }): {
  onRangeChange(range: Range): void; isLoading: boolean; error: unknown; retry(): void;
};