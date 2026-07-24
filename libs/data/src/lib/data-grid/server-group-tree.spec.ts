import { groupIdOf, buildNodes, findNode, setNodeAt, flattenServer } from './server-group-tree';
import { type ServerGroupRow } from './grid-data-source';

interface Row extends Record<string, unknown> { id: number; name: string }
const g = (value: string, count: number): ServerGroupRow => ({ field: 'name', value, count, aggregates: {} });

describe('server-group-tree', () => {
  it('groupIdOf builds a stable level=value path', () => {
    expect(groupIdOf(['US', 'NYC'])).toBe('0=US|1=NYC');
    expect(groupIdOf([])).toBe('');
  });
  it('buildNodes creates collapsed nodes with path + groupId', () => {
    const nodes = buildNodes<Row>([g('US', 2)], [], 0);
    expect(nodes[0]).toMatchObject({ level: 0, path: ['US'], groupId: '0=US', expanded: false, loading: false });
  });
  it('findNode locates by value path', () => {
    const nodes = buildNodes<Row>([g('US', 2), g('CA', 1)], [], 0);
    expect(findNode(nodes, ['CA'])?.row.value).toBe('CA');
    expect(findNode(nodes, ['XX'])).toBeUndefined();
  });
  it('setNodeAt immutably patches one node', () => {
    const nodes = buildNodes<Row>([g('US', 2)], [], 0);
    const next = setNodeAt(nodes, ['US'], { expanded: true, loading: true });
    expect(next[0].expanded).toBe(true);
    expect(nodes[0].expanded).toBe(false);
  });
  it('flattenServer: collapsed shows group only; expanded+loading shows a group-loading row', () => {
    let nodes = buildNodes<Row>([g('US', 2)], [], 0);
    expect(flattenServer(nodes).length).toBe(1);
    nodes = setNodeAt(nodes, ['US'], { expanded: true, loading: true });
    expect(flattenServer(nodes).map((e) => e.kind)).toEqual(['group', 'group-loading']);
  });
  it('flattenServer: expanded with leaves emits leaf rows', () => {
    let nodes = buildNodes<Row>([g('US', 2)], [], 0);
    nodes = setNodeAt(nodes, ['US'], { expanded: true, loading: false, leaves: [{ id: 1, name: 'a' }] });
    expect(flattenServer(nodes).map((e) => e.kind)).toEqual(['group', 'leaf']);
  });
});
