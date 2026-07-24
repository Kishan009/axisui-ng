import { handleGridWorkerMessage, serializableColumns, createGridWorkerClient, type WorkerLike } from './grid-worker';
import type { GridColumnDef } from './grid-core';
import type { GridQuery } from './grid-data-source';

interface Row extends Record<string, unknown> { id: number; name: string; age: number }
const cols: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name', valueGetter: (r) => r.name, cellClass: () => 'x' },
  { key: 'age', header: 'Age', filterType: 'number', filterable: true },
];
const rows: Row[] = [
  { id: 1, name: 'Ada', age: 36 },
  { id: 2, name: 'Bo', age: 40 },
];
const query: GridQuery<Row> = { startRow: 0, endRow: 100, sort: [{ key: 'age', dir: 'desc' }], search: '', columnFilters: {}, filterModel: null };

describe('handleGridWorkerMessage', () => {
  it('runs the query pipeline and echoes the request id', () => {
    const res = handleGridWorkerMessage({ id: 7, kind: 'query', rows, columns: cols, query });
    expect(res.id).toBe(7);
    expect(res.page.total).toBe(2);
    expect(res.page.rows.map((r) => r.age)).toEqual([40, 36]); // sorted desc
  });
});

describe('serializableColumns', () => {
  it('drops functions/templates and keeps the primitive query fields', () => {
    const [name, age] = serializableColumns(cols);
    expect(name).toEqual({ key: 'name', header: 'Name', sortable: undefined, filterable: undefined, filterType: undefined, searchable: undefined, align: undefined, priority: undefined });
    expect('valueGetter' in name!).toBe(false);
    expect('cellClass' in name!).toBe(false);
    expect(age!.filterType).toBe('number');
  });
  it('the projection is structured-clone-safe (no functions survive a JSON round-trip)', () => {
    const projected = serializableColumns(cols);
    expect(() => JSON.parse(JSON.stringify(projected))).not.toThrow();
    expect(JSON.parse(JSON.stringify(projected))[0].header).toBe('Name');
  });
  it('drops cellClass/validator/templateref/children (all non-cloneable fields)', () => {
    const rich: GridColumnDef<Row>[] = [{
      key: 'name', header: 'Name',
      cellClass: () => 'c', validator: () => null,
      cellTemplate: {} as never, children: [{ key: 'age', header: 'Age' }],
    }];
    const [projected] = serializableColumns(rich);
    for (const fn of ['cellClass', 'validator', 'cellTemplate', 'headerTemplate', 'footerTemplate', 'cellEditorTemplate', 'children', 'valueGetter']) {
      expect(fn in projected!).toBe(false);
    }
  });
});

/** A fake worker that runs the handler synchronously (immediate) or defers responses (for concurrency).
 *  Captures listeners per event type so 'message'/'error'/'messageerror' don't overwrite each other. */
function fakeWorker(mode: 'immediate' | 'deferred' = 'immediate') {
  const listeners = new Map<string, (e: { data?: unknown }) => void>();
  const queued: unknown[] = [];
  const worker: WorkerLike = {
    postMessage: (msg: unknown) => {
      const res = handleGridWorkerMessage(msg as never);
      if (mode === 'immediate') listeners.get('message')?.({ data: res });
      else queued.push(res);
    },
    addEventListener: (type, cb) => { listeners.set(type, cb); },
  };
  return {
    worker,
    flush: () => { queued.forEach((r) => listeners.get('message')?.({ data: r })); queued.length = 0; },
    fire: (type: 'error' | 'messageerror') => listeners.get(type)?.({}),
  };
}

describe('createGridWorkerClient', () => {
  it('resolves query() with the worker-computed page', async () => {
    const { worker } = fakeWorker();
    const client = createGridWorkerClient(worker);
    const page = await client.query(rows, cols, query);
    expect(page.total).toBe(2);
    expect(page.rows.map((r) => r.age)).toEqual([40, 36]);
  });

  it('correlates concurrent requests by id (two in flight, each gets its own page)', async () => {
    const { worker, flush } = fakeWorker('deferred');
    const client = createGridWorkerClient(worker);
    const pAll = client.query(rows, cols, query);
    const pOne = client.query(rows, cols, { ...query, columnFilters: { age: '4' } }); // only Bo
    flush();
    const [all, one] = await Promise.all([pAll, pOne]);
    expect(all.total).toBe(2);
    expect(one.rows.map((r) => r.name)).toEqual(['Bo']);
  });

  it('rejects every in-flight query when the worker errors (no silent hang)', async () => {
    const { worker, fire } = fakeWorker('deferred');
    const client = createGridWorkerClient(worker);
    const p1 = client.query(rows, cols, query);
    const p2 = client.query(rows, cols, query);
    fire('error');
    await expect(p1).rejects.toThrow(/grid worker failed/);
    await expect(p2).rejects.toThrow(/grid worker failed/);
  });

  it('rejects on messageerror (undeserializable response)', async () => {
    const { worker, fire } = fakeWorker('deferred');
    const client = createGridWorkerClient(worker);
    const p = client.query(rows, cols, query);
    fire('messageerror');
    await expect(p).rejects.toThrow(/deserialized/);
  });

  it('ignores a response for an unknown/stale id (no crash)', () => {
    const listeners = new Map<string, (e: { data?: unknown }) => void>();
    const worker: WorkerLike = { postMessage: () => undefined, addEventListener: (t, cb) => { listeners.set(t, cb); } };
    createGridWorkerClient(worker);
    expect(() => listeners.get('message')?.({ data: { id: 999, page: { rows: [], total: 0 } } })).not.toThrow();
  });
});

describe('parse task', () => {
  it('handleGridWorkerMessage parses a delimited block for a parse request', () => {
    const res = handleGridWorkerMessage({ id: 3, kind: 'parse', text: 'a,b\r\nc,d', delimiter: ',' }) as { id: number; matrix: string[][] };
    expect(res.id).toBe(3);
    expect(res.matrix).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('still handles query requests (regression)', () => {
    const res = handleGridWorkerMessage({ id: 4, kind: 'query', rows, columns: cols, query }) as { id: number; page: { total: number } };
    expect(res.id).toBe(4);
    expect(res.page.total).toBe(2);
  });

  it('client.parse resolves the parsed matrix', async () => {
    const { worker } = fakeWorker();
    const client = createGridWorkerClient(worker);
    const matrix = await client.parse('x\ty\r\n1\t2', '\t');
    expect(matrix).toEqual([['x', 'y'], ['1', '2']]);
  });

  it('a query and a parse in flight resolve to their own payloads (id correlation across kinds)', async () => {
    const { worker, flush } = fakeWorker('deferred');
    const client = createGridWorkerClient(worker);
    const pPage = client.query(rows, cols, query);
    const pMatrix = client.parse('a,b', ',');
    flush();
    const [page, matrix] = await Promise.all([pPage, pMatrix]);
    expect(page.total).toBe(2);
    expect(matrix).toEqual([['a', 'b']]);
  });

  it('worker error rejects a pending parse too', async () => {
    const { worker, fire } = fakeWorker('deferred');
    const client = createGridWorkerClient(worker);
    const p = client.parse('a,b', ',');
    fire('error');
    await expect(p).rejects.toThrow(/grid worker failed/);
  });
});
