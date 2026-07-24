import { emptyGroup, newCondition, operatorsFor, matchesCondition, matchesGroup, applyFilterModel, type FilterGroup } from './filter-model';
import { type GridColumnDef } from './grid-core';

describe('filter-model constructors', () => {
  it('emptyGroup defaults to an and-group with no children', () => {
    expect(emptyGroup()).toEqual({ kind: 'group', combinator: 'and', children: [] });
    expect(emptyGroup('or').combinator).toBe('or');
  });
  it('newCondition defaults to a contains condition with blank value', () => {
    expect(newCondition<{ name: string }>('name')).toEqual({
      kind: 'condition', key: 'name', operator: 'contains', value: '',
    });
  });
});

describe('operatorsFor', () => {
  it('returns type-aware operator lists', () => {
    expect(operatorsFor('number')).toEqual(['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'between']);
    expect(operatorsFor('date')).toEqual(['equals', 'lt', 'gt', 'between']);
    expect(operatorsFor('set')).toEqual(['in', 'equals']);
    expect(operatorsFor()).toEqual(['contains', 'notContains', 'equals', 'notEquals', 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty']);
  });
});

interface Row extends Record<string, unknown> { id: number; name: string; age: number; tag: string | null }
const COLS: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name', filterType: 'text' },
  { key: 'age', header: 'Age', filterType: 'number' },
  { key: 'tag', header: 'Tag', filterType: 'text' },
];
const ROWS: Row[] = [
  { id: 1, name: 'Alice', age: 30, tag: 'x' },
  { id: 2, name: 'Bob', age: 25, tag: null },
  { id: 3, name: 'Charlie', age: 35, tag: 'y' },
];

describe('matchesCondition', () => {
  it('text contains (case-insensitive)', () => {
    expect(matchesCondition(ROWS[0], { kind: 'condition', key: 'name', operator: 'contains', value: 'ali' }, COLS)).toBe(true);
    expect(matchesCondition(ROWS[1], { kind: 'condition', key: 'name', operator: 'contains', value: 'ali' }, COLS)).toBe(false);
  });
  it('blank operand is inert (matches)', () => {
    expect(matchesCondition(ROWS[1], { kind: 'condition', key: 'name', operator: 'contains', value: '' }, COLS)).toBe(true);
  });
  it('isEmpty / isNotEmpty', () => {
    expect(matchesCondition(ROWS[1], { kind: 'condition', key: 'tag', operator: 'isEmpty' }, COLS)).toBe(true);
    expect(matchesCondition(ROWS[0], { kind: 'condition', key: 'tag', operator: 'isNotEmpty' }, COLS)).toBe(true);
  });
  it('numeric gt / between', () => {
    expect(matchesCondition(ROWS[2], { kind: 'condition', key: 'age', operator: 'gt', value: 30 }, COLS)).toBe(true);
    expect(matchesCondition(ROWS[0], { kind: 'condition', key: 'age', operator: 'between', value: 26, value2: 34 }, COLS)).toBe(true);
    expect(matchesCondition(ROWS[1], { kind: 'condition', key: 'age', operator: 'between', value: 26, value2: 34 }, COLS)).toBe(false);
  });
  it('in (array and CSV)', () => {
    expect(matchesCondition(ROWS[0], { kind: 'condition', key: 'tag', operator: 'in', value: ['x', 'y'] }, COLS)).toBe(true);
    expect(matchesCondition(ROWS[2], { kind: 'condition', key: 'tag', operator: 'in', value: 'x, y' }, COLS)).toBe(true);
  });
  it('in is case-insensitive', () => {
    expect(matchesCondition(ROWS[0], { kind: 'condition', key: 'tag', operator: 'in', value: 'X' }, COLS)).toBe(true);
  });
});

describe('matchesGroup / applyFilterModel', () => {
  const g: FilterGroup<Row> = {
    kind: 'group', combinator: 'and',
    children: [
      { kind: 'condition', key: 'age', operator: 'gt', value: 26 },
      { kind: 'group', combinator: 'or', children: [
        { kind: 'condition', key: 'name', operator: 'contains', value: 'ali' },
        { kind: 'condition', key: 'name', operator: 'contains', value: 'char' },
      ] },
    ],
  };
  it('evaluates nested and/or', () => {
    expect(applyFilterModel(ROWS, g, COLS).map((r) => r.id)).toEqual([1, 3]);
  });
  it('empty group matches all', () => {
    expect(applyFilterModel(ROWS, { kind: 'group', combinator: 'and', children: [] }, COLS)).toHaveLength(3);
  });
  it('null model is a no-op', () => {
    expect(applyFilterModel(ROWS, null, COLS)).toHaveLength(3);
  });
});
