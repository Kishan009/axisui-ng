import { flattenTree } from './tree-core';

interface Row { id: number; name: string; kids?: Row[] }
const TREE: Row[] = [
  { id: 1, name: 'A', kids: [{ id: 2, name: 'A1' }, { id: 3, name: 'A2', kids: [{ id: 4, name: 'A2a' }] }] },
  { id: 5, name: 'B' },
];
const kids = (r: Row) => r.kids ?? null;

describe('flattenTree', () => {
  it('all collapsed shows only roots with expandable flags', () => {
    const flat = flattenTree(TREE, kids, () => false);
    expect(flat.map((t) => t.row.id)).toEqual([1, 5]);
    expect(flat.map((t) => t.expandable)).toEqual([true, false]);
    expect(flat.map((t) => t.level)).toEqual([0, 0]);
  });
  it('expanding a node reveals its children (pre-order, indented)', () => {
    const expanded = new Set([1]);
    const flat = flattenTree(TREE, kids, (r) => expanded.has(r.id));
    expect(flat.map((t) => t.row.id)).toEqual([1, 2, 3, 5]);
    expect(flat.find((t) => t.row.id === 3)?.level).toBe(1);
    expect(flat.find((t) => t.row.id === 3)?.expandable).toBe(true);
  });
  it('respects the depth cap (maxLevel)', () => {
    const expanded = new Set([1, 3]);
    const flat = flattenTree(TREE, kids, (r) => expanded.has(r.id), 0);
    expect(flat.map((t) => t.row.id)).toEqual([1, 5]);
    expect(flat.map((t) => t.expandable)).toEqual([false, false]);
  });
  it('deep expand within cap', () => {
    const expanded = new Set([1, 3]);
    const flat = flattenTree(TREE, kids, (r) => expanded.has(r.id), 3);
    expect(flat.map((t) => t.row.id)).toEqual([1, 2, 3, 4, 5]);
    expect(flat.find((t) => t.row.id === 4)?.level).toBe(2);
  });
});
