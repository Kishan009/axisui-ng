import type { GridColumnDef } from './grid-core';
import type { GridPage, GridQuery } from './grid-data-source';
import { computeClientPage } from './client-query';
import { parseDelimited } from './import-core';

export interface WorkerQueryRequest<T> { id: number; kind: 'query'; rows: T[]; columns: GridColumnDef<T>[]; query: GridQuery<T>; }
export interface WorkerParseRequest { id: number; kind: 'parse'; text: string; delimiter: string; }
export type WorkerRequest<T> = WorkerQueryRequest<T> | WorkerParseRequest;

export interface WorkerQueryResponse<T> { id: number; page: GridPage<T>; }
export interface WorkerParseResponse { id: number; matrix: string[][]; }
export type WorkerResponse<T> = WorkerQueryResponse<T> | WorkerParseResponse;

/** Pure dispatch run INSIDE the consumer's worker. The consumer's 3-line shim is:
 *    import { handleGridWorkerMessage } from '@axisui-ng/data';
 *    self.onmessage = (e) => self.postMessage(handleGridWorkerMessage(e.data)); */
export function handleGridWorkerMessage<T extends Record<string, unknown>>(req: WorkerRequest<T>): WorkerResponse<T> {
  if (req.kind === 'parse') return { id: req.id, matrix: parseDelimited(req.text, req.delimiter) };
  return { id: req.id, page: computeClientPage(req.rows, req.columns, req.query) };
}

/** Keep only the postMessage-cloneable column fields the query pipeline reads (drops functions/templates). */
export function serializableColumns<T>(columns: GridColumnDef<T>[]): GridColumnDef<T>[] {
  return columns.map((c) => ({
    key: c.key,
    header: c.header,
    sortable: c.sortable,
    filterable: c.filterable,
    filterType: c.filterType,
    searchable: c.searchable,
    align: c.align,
    priority: c.priority,
  })) as GridColumnDef<T>[];
}

/** Minimal structural view of a Worker (a real Worker or a test double). `error`/`messageerror`
 *  let the client reject outstanding queries instead of hanging the grid's loading state. */
export interface WorkerLike {
  postMessage(message: unknown): void;
  addEventListener(type: 'message' | 'messageerror' | 'error', listener: (event: { data?: unknown }) => void): void;
}

/** What the grid's data source calls; resolves a page once the worker responds. */
export interface GridWorkerClient {
  query<T extends Record<string, unknown>>(rows: T[], columns: GridColumnDef<T>[], query: GridQuery<T>): Promise<GridPage<T>>;
  parse(text: string, delimiter: string): Promise<string[][]>;
}

/** Main-thread plumbing (no bundler concern): wraps postMessage/message with request-id correlation.
 *  A worker `error`/`messageerror` rejects every in-flight query so subscribers fail fast rather than
 *  waiting forever. */
export function createGridWorkerClient(worker: WorkerLike): GridWorkerClient {
  let nextId = 0;
  const pending = new Map<number, { resolve: (res: WorkerResponse<never>) => void; reject: (err: unknown) => void }>();
  worker.addEventListener('message', (event) => {
    const res = event.data as WorkerResponse<never>;
    const entry = pending.get(res.id);
    if (entry) { pending.delete(res.id); entry.resolve(res); }
  });
  const rejectAll = (reason: string) => (): void => {
    const err = new Error(`grid worker ${reason}`);
    for (const entry of pending.values()) entry.reject(err);
    pending.clear();
  };
  worker.addEventListener('error', rejectAll('failed'));
  worker.addEventListener('messageerror', rejectAll('response could not be deserialized'));
  return {
    query(rows, columns, query) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve: (res) => resolve((res as WorkerQueryResponse<never>).page), reject });
        worker.postMessage({ id, kind: 'query', rows, columns, query });
      });
    },
    parse(text, delimiter) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve: (res) => resolve((res as WorkerParseResponse).matrix), reject });
        worker.postMessage({ id, kind: 'parse', text, delimiter });
      });
    },
  };
}
