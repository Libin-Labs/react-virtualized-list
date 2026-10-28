import { createRef } from 'react';
import List, { VirtualGrid, type ListHandle } from '../src/index.js';
export const sample = <List items={[{ name: 'One' }]} ref={createRef<ListHandle>()}>{({ item }) => item?.name}</List>;
export const grid = <VirtualGrid rowCount={100} columnCount={20}>{({ rowIndex, columnIndex }) => `${rowIndex}:${columnIndex}`}</VirtualGrid>;