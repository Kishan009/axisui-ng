import { addChild, removeNode, updateCondition, setCombinator } from './tree-edit';
import { emptyGroup, newCondition, type FilterGroup } from './filter-model';

interface Row extends Record<string, unknown> { name: string; age: number }

function root(): FilterGroup<Row> {
  return { kind: 'group', combinator: 'and', children: [newCondition<Row>('name')] };
}

describe('tree-edit', () => {
  it('addChild appends to the group at path (root = [])', () => {
    const next = addChild(root(), [], newCondition<Row>('age'));
    expect(next.children).toHaveLength(2);
  });
  it('addChild into a nested group', () => {
    const r: FilterGroup<Row> = { kind: 'group', combinator: 'and', children: [emptyGroup<Row>('or')] };
    const next = addChild(r, [0], newCondition<Row>('name'));
    const child = next.children[0];
    expect(child.kind === 'group' && child.children).toHaveLength(1);
  });
  it('removeNode removes the node at path', () => {
    const next = removeNode(root(), [0]);
    expect(next.children).toHaveLength(0);
  });
  it('updateCondition merges a patch into the condition at path', () => {
    const next = updateCondition(root(), [0], { operator: 'equals', value: 'x' });
    const c = next.children[0];
    expect(c.kind === 'condition' && c.operator).toBe('equals');
    expect(c.kind === 'condition' && c.value).toBe('x');
  });
  it('setCombinator sets the group combinator at path', () => {
    expect(setCombinator(root(), [], 'or').combinator).toBe('or');
  });
  it('does not mutate the input', () => {
    const r = root();
    addChild(r, [], newCondition<Row>('age'));
    expect(r.children).toHaveLength(1);
  });
});
