import { columnFilter, globalFilter, sortRows, type GridColumnDef } from './grid-core';
import { applyFilterModel } from './filter-model';
import type { GridPage, GridQuery } from './grid-data-source';

/** The client filter → sort → paginate pipeline, shared by ClientDataSource (main thread) and the worker. */
export function computeClientPage<T extends Record<string, unknown>>(
  rows: T[], columns: GridColumnDef<T>[], query: GridQuery<T>,
): GridPage<T> {
  const filtered = applyFilterModel(
    columnFilter(globalFilter(rows, query.search, columns), query.columnFilters, columns),
    query.filterModel,
    columns,
  );
  const sorted = sortRows(filtered, query.sort);
  return { rows: sorted.slice(query.startRow, query.endRow), total: sorted.length };
}
