# Web Worker query offload (Phase 6g-i)

The grid can run client-side filter/sort/paginate off the main thread. The MIT core ships **no Worker** (bundlers vary); you supply a ~3-line worker whose bundler you control.

## 1. Your worker (built by your bundler)

`grid.worker.ts`:
```ts
import { handleGridWorkerMessage } from '@axisui-ng/data';
self.onmessage = (e) => self.postMessage(handleGridWorkerMessage(e.data));
```

## 2. Wire it up (main thread)

```ts
import { createGridWorkerClient, WorkerClientDataSource } from '@axisui-ng/data';

const worker = new Worker(new URL('./grid.worker', import.meta.url), { type: 'module' });
const client = createGridWorkerClient(worker);
const source = new WorkerClientDataSource(rows, columns, client);
// pass `source` as the grid's [source]
```

## Parse offload (optional)

The same worker can also parse large CSV/pasted text off the main thread. Pass the client as the grid's `[gridWorker]`; parsing offloads only when the text is at least `[workerParseThreshold]` chars (default 100000), so small pastes stay synchronous.

```ts
<ax-data-grid [gridWorker]="client" [workerParseThreshold]="100000" (imported)="merge($event)" />
```

The worker shim is unchanged — `handleGridWorkerMessage` dispatches both query and parse tasks.

## Constraints

- **Serializable columns.** A column `valueGetter` is a function and cannot cross the worker boundary — `WorkerClientDataSource` throws at construction if one is present. Use `ClientDataSource` for such grids, or precompute the derived field into the row data.
- **Top-level columns only.** Filter/search/sort run on the top-level columns (same as `ClientDataSource` — the pipeline does not recurse into grouped-header `children`).
- **Worker errors.** If the worker throws or a response can't be deserialized, `createGridWorkerClient` rejects the in-flight query, so the grid surfaces it via its normal fetch-error path instead of hanging.
