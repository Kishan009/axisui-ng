import { type Observable, of, from, defer } from 'rxjs';
import { type GridColumnDef, type SortState } from './grid-core';
import { type FilterGroup } from './filter-model';
import { computeClientPage } from './client-query';
import { serializableColumns, type GridWorkerClient } from './grid-worker';

export interface GridQuery<T> {
  /** First row index of the requested window (inclusive). */
  startRow: number;
  /** Row index just past the requested window (exclusive). */
  endRow: number;
  /** Active sorts in priority order. */
  sort: SortState<T>[];
  /** Global search term. */
  search: string;
  /** Per-column filter terms keyed by `String(col.key)`. */
  columnFilters: Record<string, string>;
  /** Advanced AND/OR filter tree. */
  filterModel?: FilterGroup<T> | null;
}

export interface GridPage<T> {
  rows: T[];
  total: number;
}

export interface ServerGroupRow {
  /** String(grouped column key) at this level. */
  field: string;
  value: unknown;
  /** Leaf count under the group (server-computed). */
  count: number;
  aggregates: Record<string, number>;
}

export interface GridGroupQuery<T> extends GridQuery<T> {
  groupBy: (keyof T)[];
  /** Parent value path; [] = top level. */
  groupKeys: unknown[];
}

export type GridGroupPage<T> =
  | { kind: 'groups'; groups: ServerGroupRow[]; total: number; grandTotals?: Record<string, number> }
  | { kind: 'leaves'; rows: T[]; total: number };

export interface GridTreeQuery<T> extends GridQuery<T> {
  /** The parent row whose children to fetch; null = root level. */
  parent: T | null;
}

export interface GridDataSource<T> {
  getRows(query: GridQuery<T>): Observable<GridPage<T>>;
  getGroupRows?(query: GridGroupQuery<T>): Observable<GridGroupPage<T>>;
  getTreeChildren?(query: GridTreeQuery<T>): Observable<GridPage<T>>;
}

/** In-memory source — runs filter/sort/slice in `grid-core` synchronously. */
export class ClientDataSource<T extends Record<string, unknown>> implements GridDataSource<T> {
  constructor(private readonly rows: T[], private readonly columns: GridColumnDef<T>[]) {}

  getRows(query: GridQuery<T>): Observable<GridPage<T>> {
    return of(computeClientPage(this.rows, this.columns, query));
  }
}

/** Callback-backed source for server-side mode / infinite scroll / lazy loading. */
export class ServerDataSource<T> implements GridDataSource<T> {
  constructor(private readonly fetcher: (query: GridQuery<T>) => Observable<GridPage<T>>) {}

  getRows(query: GridQuery<T>): Observable<GridPage<T>> {
    return this.fetcher(query);
  }
}

/** Callback-backed source supporting lazy server-side grouping. */
export class ServerGroupDataSource<T> implements GridDataSource<T> {
  constructor(
    private readonly leafFetcher: (query: GridQuery<T>) => Observable<GridPage<T>>,
    private readonly groupFetcher: (query: GridGroupQuery<T>) => Observable<GridGroupPage<T>>
  ) {}

  getRows(query: GridQuery<T>): Observable<GridPage<T>> {
    return this.leafFetcher(query);
  }

  getGroupRows(query: GridGroupQuery<T>): Observable<GridGroupPage<T>> {
    return this.groupFetcher(query);
  }
}

/** Callback-backed source supporting lazy server-side tree children. */
export class ServerTreeDataSource<T> implements GridDataSource<T> {
  constructor(
    private readonly leafFetcher: (query: GridQuery<T>) => Observable<GridPage<T>>,
    private readonly childrenFetcher: (query: GridTreeQuery<T>) => Observable<GridPage<T>>
  ) {}

  getRows(query: GridQuery<T>): Observable<GridPage<T>> {
    return this.leafFetcher(query);
  }

  getTreeChildren(query: GridTreeQuery<T>): Observable<GridPage<T>> {
    return this.childrenFetcher(query);
  }
}

/** A client-side data source that offloads filter/sort/paginate to a consumer-supplied Web Worker.
 *  Requires serializable columns — a `valueGetter` (a function) cannot cross the worker boundary. */
export class WorkerClientDataSource<T extends Record<string, unknown>> implements GridDataSource<T> {
  private readonly columns: GridColumnDef<T>[];
  constructor(private readonly rows: T[], columns: GridColumnDef<T>[], private readonly client: GridWorkerClient) {
    if (columns.some((c) => c.valueGetter)) {
      throw new Error('WorkerClientDataSource: columns with a valueGetter cannot be offloaded to a worker (functions are not cloneable). Use ClientDataSource, or plain key-based columns.');
    }
    this.columns = serializableColumns(columns);
  }
  getRows(query: GridQuery<T>): Observable<GridPage<T>> {
    // defer so each subscription issues a fresh worker query (cold Observable), not a replayed promise.
    return defer(() => from(this.client.query(this.rows, this.columns, query)));
  }
}
