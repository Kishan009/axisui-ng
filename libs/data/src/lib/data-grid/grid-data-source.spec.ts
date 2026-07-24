import { firstValueFrom, of } from 'rxjs';
import {
  ClientDataSource, ServerDataSource, ServerGroupDataSource, ServerTreeDataSource, WorkerClientDataSource,
  type GridQuery, type GridGroupQuery, type GridGroupPage, type GridTreeQuery,
} from './grid-data-source';
import { createGridWorkerClient, handleGridWorkerMessage, type WorkerLike } from './grid-worker';
import { type GridColumnDef } from './grid-core';
import { type FilterGroup } from './filter-model';

interface Row extends Record<string, unknown> { id: number; name: string; age: number; }
const COLS: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name', filterable: true },
  { key: 'age', header: 'Age', sortable: true },
];
const ROWS: Row[] = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 },
];
const baseQuery: GridQuery<Row> = { startRow: 0, endRow: 100, sort: [], search: '', columnFilters: {} };

describe('ClientDataSource', () => {
  it('filters, sorts, and reports total over the full set', async () => {
    const ds = new ClientDataSource(ROWS, COLS);
    const page = await firstValueFrom(ds.getRows({ ...baseQuery, sort: [{ key: 'age', dir: 'asc' }] }));
    expect(page.total).toBe(3);
    expect(page.rows.map((r) => r.age)).toEqual([25, 30, 35]);
  });

  it('slices to the requested window after filtering', async () => {
    const ds = new ClientDataSource(ROWS, COLS);
    const page = await firstValueFrom(ds.getRows({ ...baseQuery, startRow: 0, endRow: 1, sort: [{ key: 'age', dir: 'asc' }] }));
    expect(page.total).toBe(3);
    expect(page.rows.map((r) => r.id)).toEqual([2]);
  });
});

describe('ClientDataSource advanced filterModel', () => {
  it('applies the filter tree and ANDs with quick filters + search', async () => {
    const ds = new ClientDataSource(ROWS, COLS);
    const filterModel: FilterGroup<Row> = {
      kind: 'group', combinator: 'or',
      children: [
        { kind: 'condition', key: 'name', operator: 'contains', value: 'ali' },
        { kind: 'condition', key: 'name', operator: 'contains', value: 'bob' },
      ],
    };
    const page = await firstValueFrom(ds.getRows({ ...baseQuery, filterModel }));
    expect(page.rows.map((r) => r.name).sort()).toEqual(['Alice', 'Bob']);

    const page2 = await firstValueFrom(ds.getRows({ ...baseQuery, filterModel, columnFilters: { name: 'ali' } }));
    expect(page2.rows.map((r) => r.name)).toEqual(['Alice']);
  });
  it('null filterModel is a no-op', async () => {
    const ds = new ClientDataSource(ROWS, COLS);
    const page = await firstValueFrom(ds.getRows({ ...baseQuery, filterModel: null }));
    expect(page.total).toBe(3);
  });
});

describe('ServerDataSource', () => {
  it('forwards the query to the fetcher and returns its page', async () => {
    const spy = jest.fn((_q: GridQuery<Row>) => of({ rows: [ROWS[0]], total: 99 }));
    const ds = new ServerDataSource(spy);
    const page = await firstValueFrom(ds.getRows({ ...baseQuery, search: 'x' }));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ search: 'x' }));
    expect(page).toEqual({ rows: [ROWS[0]], total: 99 });
  });
});

describe('ServerGroupDataSource', () => {
  const baseGroupQuery: GridGroupQuery<Row> = { ...baseQuery, groupBy: ['name'], groupKeys: [] };
  it('forwards group queries and returns the group page', async () => {
    const groupFetcher = jest.fn((_q: GridGroupQuery<Row>) =>
      of<GridGroupPage<Row>>({ kind: 'groups', groups: [{ field: 'name', value: 'Alice', count: 1, aggregates: {} }], total: 1 })
    );
    const ds = new ServerGroupDataSource<Row>(() => of({ rows: ROWS, total: ROWS.length }), groupFetcher);
    const page = await firstValueFrom(ds.getGroupRows(baseGroupQuery));
    expect(groupFetcher).toHaveBeenCalledWith(expect.objectContaining({ groupBy: ['name'], groupKeys: [] }));
    expect(page).toEqual({ kind: 'groups', groups: [{ field: 'name', value: 'Alice', count: 1, aggregates: {} }], total: 1 });
  });
  it('still serves leaf rows via getRows', async () => {
    const ds = new ServerGroupDataSource<Row>(() => of({ rows: ROWS, total: 3 }), () => of({ kind: 'leaves', rows: ROWS, total: 3 }));
    const page = await firstValueFrom(ds.getRows(baseQuery));
    expect(page.total).toBe(3);
  });
});

describe('ServerTreeDataSource', () => {
  const baseTreeQuery: GridTreeQuery<Row> = { ...baseQuery, parent: null };
  it('forwards tree-children queries (with parent) and returns the page', async () => {
    const childrenFetcher = jest.fn((_q: GridTreeQuery<Row>) => of({ rows: [ROWS[0]], total: 1 }));
    const ds = new ServerTreeDataSource<Row>(() => of({ rows: ROWS, total: ROWS.length }), childrenFetcher);
    const page = await firstValueFrom(ds.getTreeChildren({ ...baseTreeQuery, parent: ROWS[1] }));
    expect(childrenFetcher).toHaveBeenCalledWith(expect.objectContaining({ parent: ROWS[1] }));
    expect(page).toEqual({ rows: [ROWS[0]], total: 1 });
  });
  it('still serves leaf rows via getRows', async () => {
    const ds = new ServerTreeDataSource<Row>(() => of({ rows: ROWS, total: 3 }), () => of({ rows: [], total: 0 }));
    expect((await firstValueFrom(ds.getRows(baseQuery))).total).toBe(3);
  });
});

describe('WorkerClientDataSource', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; age: number }
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', filterType: 'number' },
  ];
  const rows: Row[] = [
    { id: 1, name: 'Ada', age: 36 },
    { id: 2, name: 'Bo', age: 40 },
  ];
  const query: GridQuery<Row> = { startRow: 0, endRow: 100, sort: [{ key: 'age', dir: 'desc' }], search: '', columnFilters: {}, filterModel: null };
  function immediateWorker(): WorkerLike {
    let onMessage: ((e: { data?: unknown }) => void) | null = null;
    return {
      postMessage: (msg: unknown) => onMessage?.({ data: handleGridWorkerMessage(msg as never) }),
      addEventListener: (type, cb) => { if (type === 'message') onMessage = cb; },
    };
  }

  it('getRows emits the worker-computed filtered/sorted page', async () => {
    const client = createGridWorkerClient(immediateWorker());
    const ds = new WorkerClientDataSource(rows, cols, client);
    const page = await firstValueFrom(ds.getRows(query));
    expect(page.total).toBe(2);
    expect(page.rows.map((r) => r.age)).toEqual([40, 36]);
  });

  it('throws at construction if a column has a valueGetter', () => {
    const client = createGridWorkerClient(immediateWorker());
    const withGetter: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', valueGetter: (r) => r.name }, cols[1]!];
    expect(() => new WorkerClientDataSource(rows, withGetter, client)).toThrow(/valueGetter/);
  });

  it('strips function-bearing (non-valueGetter) columns so the sent payload is clone-safe', () => {
    let sent: { columns: unknown[] } | null = null;
    const worker: WorkerLike = { postMessage: (msg: unknown) => { sent = msg as { columns: unknown[] }; }, addEventListener: () => undefined };
    const client = createGridWorkerClient(worker);
    // cellClass is a function but NOT a valueGetter, so construction is allowed; it must be stripped before send.
    const richCols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', cellClass: () => 'c' }, { key: 'age', header: 'Age', filterType: 'number' }];
    const ds = new WorkerClientDataSource(rows, richCols, client);
    ds.getRows(query).subscribe();
    expect(() => JSON.parse(JSON.stringify(sent))).not.toThrow(); // would throw if a function slipped through
    expect('cellClass' in (sent!.columns[0] as object)).toBe(false);
  });
});
