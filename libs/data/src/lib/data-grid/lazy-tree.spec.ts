import { buildLazyNodes, findLazy, setLazyAt, flattenLazy } from './lazy-tree';

interface Row extends Record<string, unknown> { id: number; name: string; hasKids?: boolean }
const id = (r: Row) => r.id;
const ROWS: Row[] = [{ id: 1, name: 'A', hasKids: true }, { id: 2, name: 'B' }];
const has = (r: Row) => !!r.hasKids;

describe('lazy-tree', () => {
  it('buildLazyNodes creates collapsed nodes at a level', () => {
    const nodes = buildLazyNodes<Row>(ROWS, 0);
    expect(nodes.map((n) => [n.row.id, n.level, n.expanded, n.loading])).toEqual([[1, 0, false, false], [2, 0, false, false]]);
  });
  it('findLazy locates by rowId (recursive)', () => {
    let nodes = buildLazyNodes<Row>(ROWS, 0);
    nodes = setLazyAt(nodes, 1, id, { expanded: true, children: buildLazyNodes<Row>([{ id: 3, name: 'A1' }], 1) });
    expect(findLazy(nodes, 3, id)?.row.name).toBe('A1');
    expect(findLazy(nodes, 99, id)).toBeUndefined();
  });
  it('setLazyAt immutably patches one node', () => {
    const nodes = buildLazyNodes<Row>(ROWS, 0);
    const next = setLazyAt(nodes, 1, id, { loading: true });
    expect(next[0].loading).toBe(true);
    expect(nodes[0].loading).toBe(false);
  });
  it('flattenLazy: collapsed shows roots; expandable from hasChildren + cap', () => {
    const nodes = buildLazyNodes<Row>(ROWS, 0);
    const flat = flattenLazy(nodes, has, id, 3);
    expect(flat.map((e) => e.kind)).toEqual(['tree', 'tree']);
    expect(flat.map((e) => e.kind === 'tree' && e.expandable)).toEqual([true, false]);
  });
  it('flattenLazy: expanded+loading emits a group-loading row; expanded+children nests', () => {
    let nodes = buildLazyNodes<Row>(ROWS, 0);
    nodes = setLazyAt(nodes, 1, id, { expanded: true, loading: true });
    expect(flattenLazy(nodes, has, id, 3).map((e) => e.kind)).toEqual(['tree', 'group-loading', 'tree']);
    nodes = setLazyAt(nodes, 1, id, { loading: false, children: buildLazyNodes<Row>([{ id: 3, name: 'A1' }], 1) });
    expect(flattenLazy(nodes, has, id, 3).map((e) => (e.kind === 'tree' ? e.row.id : e.kind))).toEqual([1, 3, 2]);
  });
});
