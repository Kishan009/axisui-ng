import { asText, cellValue, type GridColumnDef } from './grid-core';

export type FilterCombinator = 'and' | 'or';

export type FilterOperator =
  | 'contains' | 'notContains' | 'equals' | 'notEquals' | 'startsWith' | 'endsWith'
  | 'isEmpty' | 'isNotEmpty' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in';

export interface FilterCondition<T> {
  kind: 'condition';
  key: keyof T;
  operator: FilterOperator;
  value?: unknown;
  value2?: unknown;
}

export interface FilterGroup<T> {
  kind: 'group';
  combinator: FilterCombinator;
  children: FilterNode<T>[];
}

export type FilterNode<T> = FilterCondition<T> | FilterGroup<T>;

const TEXT_OPS: FilterOperator[] = [
  'contains', 'notContains', 'equals', 'notEquals', 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty',
];

export function operatorsFor(filterType?: 'text' | 'number' | 'date' | 'set'): FilterOperator[] {
  switch (filterType) {
    case 'number': return ['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'between'];
    case 'date': return ['equals', 'lt', 'gt', 'between'];
    case 'set': return ['in', 'equals'];
    default: return [...TEXT_OPS];
  }
}

export function emptyGroup<T>(combinator: FilterCombinator = 'and'): FilterGroup<T> {
  return { kind: 'group', combinator, children: [] };
}

export function newCondition<T>(key: keyof T, operator: FilterOperator = 'contains'): FilterCondition<T> {
  return { kind: 'condition', key, operator, value: '' };
}

// ---------------------------------------------------------------------------
// Evaluators
// ---------------------------------------------------------------------------

function isBlank(v: unknown): boolean {
  return v === undefined || v === null || v === '';
}

export function matchesCondition<T extends Record<string, unknown>>(
  row: T,
  condition: FilterCondition<T>,
  columns: GridColumnDef<T>[]
): boolean {
  const col = columns.find((c) => c.key === condition.key);
  const raw = col ? cellValue(row, col) : row[condition.key];

  if (condition.operator === 'isEmpty') return isBlank(raw);
  if (condition.operator === 'isNotEmpty') return !isBlank(raw);

  const text = asText(raw).toLowerCase();
  switch (condition.operator) {
    case 'contains':    return isBlank(condition.value) || text.includes(asText(condition.value).toLowerCase());
    case 'notContains': return isBlank(condition.value) || !text.includes(asText(condition.value).toLowerCase());
    case 'equals':      return isBlank(condition.value) || text === asText(condition.value).toLowerCase();
    case 'notEquals':   return isBlank(condition.value) || text !== asText(condition.value).toLowerCase();
    case 'startsWith':  return isBlank(condition.value) || text.startsWith(asText(condition.value).toLowerCase());
    case 'endsWith':    return isBlank(condition.value) || text.endsWith(asText(condition.value).toLowerCase());
    case 'gt': case 'gte': case 'lt': case 'lte': {
      if (isBlank(condition.value)) return true;
      const n = Number(raw);
      const m = Number(condition.value);
      if (Number.isNaN(n) || Number.isNaN(m)) return false;
      return condition.operator === 'gt' ? n > m
        : condition.operator === 'gte' ? n >= m
        : condition.operator === 'lt' ? n < m
        : n <= m;
    }
    case 'between': {
      const loBlank = isBlank(condition.value);
      const hiBlank = isBlank(condition.value2);
      if (loBlank && hiBlank) return true;
      const n = Number(raw);
      if (Number.isNaN(n)) return false;
      const lo = loBlank ? -Infinity : Number(condition.value);
      const hi = hiBlank ? Infinity : Number(condition.value2);
      if (Number.isNaN(lo) || Number.isNaN(hi)) return true;
      return n >= lo && n <= hi;
    }
    case 'in': {
      const list = Array.isArray(condition.value)
        ? condition.value
        : asText(condition.value).split(',').map((s) => s.trim()).filter(Boolean);
      if (list.length === 0) return true;
      const v = asText(raw).toLowerCase();
      return list.some((item) => asText(item).toLowerCase() === v);
    }
    default: return true;
  }
}

function matchesNode<T extends Record<string, unknown>>(
  row: T, node: FilterNode<T>, columns: GridColumnDef<T>[]
): boolean {
  return node.kind === 'group' ? matchesGroup(row, node, columns) : matchesCondition(row, node, columns);
}

export function matchesGroup<T extends Record<string, unknown>>(
  row: T, group: FilterGroup<T>, columns: GridColumnDef<T>[]
): boolean {
  if (group.children.length === 0) return true;
  return group.combinator === 'and'
    ? group.children.every((n) => matchesNode(row, n, columns))
    : group.children.some((n) => matchesNode(row, n, columns));
}

export function applyFilterModel<T extends Record<string, unknown>>(
  rows: T[], group: FilterGroup<T> | null | undefined, columns: GridColumnDef<T>[]
): T[] {
  if (!group || group.children.length === 0) return rows;
  return rows.filter((r) => matchesGroup(r, group, columns));
}
