import { orderByPriority } from './card-model';
import { type GridColumnDef } from './grid-core';

interface Row extends Record<string, unknown> { a: unknown; b: unknown; c: unknown }
const cols: GridColumnDef<Row>[] = [
  { key: 'a', header: 'A' },
  { key: 'b', header: 'B', priority: 10 },
  { key: 'c', header: 'C', priority: 5 },
];

describe('orderByPriority', () => {
  it('sorts by priority descending, missing = 0', () => {
    expect(orderByPriority(cols).map((c) => c.key)).toEqual(['b', 'c', 'a']);
  });
  it('is stable within equal priority (declaration order)', () => {
    const eq: GridColumnDef<Row>[] = [
      { key: 'a', header: 'A', priority: 1 },
      { key: 'b', header: 'B', priority: 1 },
      { key: 'c', header: 'C', priority: 1 },
    ];
    expect(orderByPriority(eq).map((c) => c.key)).toEqual(['a', 'b', 'c']);
  });
  it('does not mutate the input array', () => {
    const input = [...cols];
    orderByPriority(input);
    expect(input.map((c) => c.key)).toEqual(['a', 'b', 'c']);
  });
});
