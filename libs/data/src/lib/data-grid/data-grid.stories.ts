import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { of } from 'rxjs';

import { AxDataGridComponent } from './data-grid.component';
import { ServerDataSource, ServerGroupDataSource, ServerTreeDataSource } from './grid-data-source';
import type { GridColumnDef } from './grid-core';

interface Person extends Record<string, unknown> {
  id: number;
  name: string;
  role: string;
  age: number;
}

const columns: GridColumnDef<Person>[] = [
  { key: 'name', header: 'Name', sortable: true, filterable: true },
  { key: 'role', header: 'Role', sortable: true, filterable: true },
  { key: 'age', header: 'Age', sortable: true, align: 'end' },
];

const data: Person[] = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer', age: 36 },
  { id: 2, name: 'Alan Turing', role: 'Researcher', age: 41 },
  { id: 3, name: 'Grace Hopper', role: 'Admiral', age: 79 },
  { id: 4, name: 'Katherine Johnson', role: 'Mathematician', age: 60 },
];

const groupColumns: GridColumnDef<Person>[] = [
  { key: 'role', header: 'Role' },
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age', align: 'end', aggregation: 'sum' },
];

const meta: Meta = {
  title: 'Data/DataGrid',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxDataGridComponent] })],
};
export default meta;
type Story = StoryObj;

/**
 * Search, per-column filter, selection, and column resize on the headless engine.
 * Keyboard: Tab into the grid, then arrow keys / Home / End / PageUp / PageDown to move the focused cell,
 * Enter or F2 to edit, Space to select, Enter on a header to sort.
 */
export const Basic: Story = {
  render: () => ({
    props: { columns, data },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [searchable]="true" [selectable]="true" [resizable]="true" [pageSize]="10" />`,
  }),
};

/** Virtual scrolling over a large client set (windowed rows). */
export const Virtual: Story = {
  render: () => ({
    props: {
      columns,
      data: Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        name: `Person ${i + 1}`,
        role: i % 2 ? 'Engineer' : 'Researcher',
        age: 20 + (i % 50),
      })),
    },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pageSize]="0" [virtualScroll]="true" [rowHeight]="36" />`,
  }),
};

/** Multi-sort (Shift+click headers) plus the advanced filter builder and sort panels. */
export const SortAndFilter: Story = {
  render: () => ({
    props: { columns, data },
    template: `<ax-data-grid class="block w-[44rem]" [columns]="columns" [data]="data" [searchable]="true" [pageSize]="10" />`,
  }),
};

const serverRows: Person[] = Array.from({ length: 500 }, (_, i) => ({
  id: i,
  name: 'Person ' + (i + 1),
  role: i % 2 ? 'Engineer' : 'Researcher',
  age: 20 + (i % 50),
}));
const serverSource = new ServerDataSource<Person>((q) =>
  of({ rows: serverRows.slice(q.startRow, q.endRow), total: serverRows.length })
);

/** Server-side pagination: the data source returns one page per query. */
export const Server: Story = {
  render: () => ({
    props: { columns, ds: serverSource },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [dataSource]="ds" rowModel="server" [pageSize]="20" />`,
  }),
};

/** Infinite scroll (block cache): rows load on demand as you scroll a 500-row set. */
export const Infinite: Story = {
  render: () => ({
    props: { columns, ds: serverSource },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [dataSource]="ds" rowModel="infinite" infiniteMode="blocks" [blockSize]="50" [rowHeight]="36" />`,
  }),
};

/** Multi-level grouping with a grand-total footer (group by role, sum ages). */
export const Grouped: Story = {
  render: () => ({
    props: { columns: groupColumns, data },
    template: `<ax-data-grid class="block w-[44rem]" [columns]="columns" [data]="data" [pageSize]="0" [groupBy]="['role']" />`,
  }),
};

const serverGroupSource = new ServerGroupDataSource<Person>(
  (q) => of({ rows: serverRows.slice(q.startRow, q.endRow), total: serverRows.length }),
  (q) => {
    if (q.groupKeys.length === 0) {
      const roles = [...new Set(serverRows.map((r) => r.role))];
      return of({
        kind: 'groups' as const,
        groups: roles.map((role) => ({
          field: 'role',
          value: role,
          count: serverRows.filter((r) => r.role === role).length,
          aggregates: { age: serverRows.filter((r) => r.role === role).reduce((a, r) => a + r.age, 0) },
        })),
        total: roles.length,
        grandTotals: { age: serverRows.reduce((a, r) => a + r.age, 0) },
      });
    }
    const role = q.groupKeys[0];
    const rows = serverRows.filter((r) => r.role === role);
    return of({ kind: 'leaves' as const, rows, total: rows.length });
  }
);

/** Server-side grouping with lazy expansion (expand a role to fetch its people). */
export const ServerGrouped: Story = {
  render: () => ({
    props: { columns: groupColumns, ds: serverGroupSource },
    template: `<ax-data-grid class="block w-[44rem]" [columns]="columns" [dataSource]="ds" rowModel="server" [groupBy]="['role']" [pageSize]="0" />`,
  }),
};

interface TreePerson extends Record<string, unknown> { id: number; name: string; role: string; age: number; reports?: TreePerson[] }
const orgData: TreePerson[] = [
  { id: 1, name: 'Ada', role: 'Lead', age: 40, reports: [
    { id: 2, name: 'Bob', role: 'Engineer', age: 30 },
    { id: 3, name: 'Cy', role: 'Engineer', age: 28 },
  ] },
  { id: 4, name: 'Dee', role: 'Lead', age: 45 },
];
const orgCols: GridColumnDef<TreePerson>[] = [
  { key: 'name', header: 'Name' },
  { key: 'role', header: 'Role' },
  { key: 'age', header: 'Age', align: 'end' },
];

/** Tree-data: expand a manager to reveal direct reports. */
export const Tree: Story = {
  render: () => ({
    props: { columns: orgCols, data: orgData, kids: (r: TreePerson) => r.reports ?? null },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pageSize]="0" [treeData]="true" [treeChildren]="kids" />`,
  }),
};

/** Master-detail: expand a row to reveal a detail panel. */
export const MasterDetail: Story = {
  render: () => ({
    props: { columns, data },
    template: `
      <ng-template #detail let-row><div class="p-2 text-sm text-muted-foreground">More about {{ row.name }} ({{ row.role }})</div></ng-template>
      <ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pageSize]="0" [detailTemplate]="detail" />
    `,
  }),
};

interface OrgRow extends Record<string, unknown> { id: number; name: string; role: string; age: number; hasReports?: boolean }
const orgRoots: OrgRow[] = [
  { id: 1, name: 'Ada', role: 'Lead', age: 40, hasReports: true },
  { id: 2, name: 'Dee', role: 'Lead', age: 45, hasReports: true },
];
const orgChildren: Record<number, OrgRow[]> = {
  1: [{ id: 11, name: 'Bob', role: 'Engineer', age: 30 }, { id: 12, name: 'Cy', role: 'Engineer', age: 28 }],
  2: [{ id: 21, name: 'Eve', role: 'Engineer', age: 33 }],
};
const orgTreeCols: GridColumnDef<OrgRow>[] = [
  { key: 'name', header: 'Name' },
  { key: 'role', header: 'Role' },
  { key: 'age', header: 'Age', align: 'end' },
];
const serverTreeSource = new ServerTreeDataSource<OrgRow>(
  () => of({ rows: [], total: 0 }),
  (q) => {
    const parent = q.parent as OrgRow | null;
    const rows = parent === null ? orgRoots : (orgChildren[parent.id] ?? []);
    return of({ rows, total: rows.length });
  }
);

/** Lazy server tree: expand a manager to fetch direct reports on demand. */
export const ServerTree: Story = {
  render: () => ({
    props: { columns: orgTreeCols, ds: serverTreeSource, has: (r: OrgRow) => !!r.hasReports },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [dataSource]="ds" rowModel="server" [treeData]="true" [hasChildren]="has" [pageSize]="0" />`,
  }),
};

/** Column chooser + drag-to-reorder: open "Columns" to hide/show; drag headers to reorder. */
export const ColumnChooser: Story = {
  render: () => ({
    props: { columns, data },
    template: `<ax-data-grid class="block w-[44rem]" [columns]="columns" [data]="data" [pageSize]="10" />`,
  }),
};

const pinnedCols: GridColumnDef<Person>[] = [
  { key: 'name', header: 'Name', width: 160, pin: 'start' },
  { key: 'role', header: 'Role', width: 200 },
  { key: 'age', header: 'Age', width: 120, align: 'end' },
];

/** Pinned columns: Name is frozen to the left edge; open "Columns" to pin/unpin others. */
export const Pinned: Story = {
  render: () => ({
    props: { columns: pinnedCols, data },
    template: `<ax-data-grid class="block w-[32rem] overflow-x-auto" [columns]="columns" [data]="data" [pageSize]="0" />`,
  }),
};

const groupedHeaderCols: GridColumnDef<Person>[] = [
  { key: 'name', header: 'Name', sortable: true },
  {
    key: 'details',
    header: 'Details',
    children: [
      { key: 'role', header: 'Role', sortable: true, filterable: true },
      { key: 'age', header: 'Age', sortable: true, align: 'end' },
    ],
  },
];

/**
 * Multi-level headers via `GridColumnDef.children`: "Details" spans its leaf
 * columns (Role, Age) with colspan while the ungrouped "Name" spans both header
 * rows. Reorder/pin are disabled in grouped mode; leaf sort still works.
 */
export const GroupedHeaders: Story = {
  render: () => ({
    props: { columns: groupedHeaderCols, data },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pageSize]="0" />`,
  }),
};

const polishCols: GridColumnDef<Person>[] = [
  { key: 'name', header: 'Name', sortable: true, flex: 2 },
  { key: 'role', header: 'Role', flex: 1 },
  {
    key: 'age',
    header: 'Age',
    align: 'end',
    minWidth: 80,
    maxWidth: 140,
    cellClass: (_r, v) => ((v as number) >= 60 ? 'text-destructive font-medium' : ''),
  },
];

/**
 * Column polish: a flex Name/Role split, an Age column clamped to `minWidth`/`maxWidth`
 * with `cellClass` tinting high ages, `rowClass` banding senior rows, and the default
 * sticky header pinned inside a scroll box (double-click a resize handle to reset a width).
 */
export const ColumnPolish: Story = {
  render: () => ({
    props: {
      data,
      columns: polishCols,
      rowClass: (r: Person) => (r.age >= 60 ? 'bg-muted/40' : ''),
    },
    template: `
      <div class="h-[220px] overflow-auto rounded-[var(--radius-md)] border border-border">
        <ax-data-grid [columns]="columns" [data]="data" [rowClass]="rowClass" [resizable]="true" [pageSize]="0" [stickyHeader]="true" />
      </div>
    `,
  }),
};

/**
 * Selection: shift-click a checkbox to range-select, tick the header checkbox then "Select all N rows"
 * to enter include/exclude mode (selection persists across pages without fetching every id), and
 * Ctrl/Cmd+A / Escape for keyboard select-all / clear.
 */
export const SelectionPolish: Story = {
  render: () => ({
    props: { columns, data },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [selectable]="true" [pageSize]="2" />`,
  }),
};

const editableCols: GridColumnDef<Person>[] = [
  { key: 'name', header: 'Name', editable: true },
  { key: 'role', header: 'Role', editable: true },
  {
    key: 'age', header: 'Age', align: 'end', editable: true, filterType: 'number',
    validator: (value) => (typeof value === 'number' && value >= 0 && value <= 120 ? null : 'Age must be 0-120'),
  },
];

/**
 * Cell editing: double-click (or focus + Enter/F2) an editable cell to edit it. Enter/blur commits,
 * Escape cancels. The Age column has a validator (0-120) that blocks an invalid commit. Committed
 * cells keep a warning-colored left border until cleared - that's the dirty-tracking groundwork
 * for Phase 4b's batch save/cancel.
 * Tab / Shift+Tab commit the current cell and move to the next / previous editable cell.
 */
export const CellEditing: Story = {
  render: () => ({
    props: { columns: editableCols, data },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pageSize]="0" />`,
  }),
};

const rowEditCols: GridColumnDef<Person>[] = [
  { key: 'name', header: 'Name', editable: true },
  { key: 'role', header: 'Role', editable: true },
  {
    key: 'age', header: 'Age', align: 'end', editable: true, filterType: 'number',
    validator: (value) => (typeof value === 'number' && value >= 0 && value <= 120 ? null : 'Age must be 0-120'),
  },
];

/**
 * Full-row editing (`[editMode]="'row'"`): double-click any cell to open editors on every editable cell of
 * the row at once. Enter or the Save button commits the whole row (blocked if any cell is invalid); Escape
 * or Cancel discards the row's drafts. Tab cycles focus among the row's editors.
 */
export const RowEditing: Story = {
  render: () => ({
    props: { columns: rowEditCols, data },
    template: `<ax-data-grid class="block w-[44rem]" [columns]="columns" [data]="data" [pageSize]="0" [editMode]="'row'" />`,
  }),
};

const batchEditCols: GridColumnDef<Person>[] = [
  { key: 'name', header: 'Name', editable: true },
  { key: 'role', header: 'Role', editable: true },
];

/**
 * Batch save/cancel (manual mode, the default): edit several cells, then use the "N unsaved changes"
 * chip to Save All (emits a (save) batch - open the Actions panel to see it) or Discard All (clears
 * everything without emitting). Cells stay visibly dirty until the consumer calls clearSavedEdits(...)
 * after their own persistence succeeds.
 * Undo/redo the pending edits with Ctrl+Z / Ctrl+Shift+Z (or the Undo/Redo buttons in the chip).
 */
export const BatchSave: Story = {
  render: () => ({
    props: { columns: batchEditCols, data },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pageSize]="0" />`,
  }),
};

/**
 * Auto-save mode: every commit immediately fires a one-item (save) event and the cell stops showing as
 * dirty right away (no batch chip). Displaying the new value durably is the consumer's job once their
 * save updates the [data] input - the grid itself never mutates data.
 */
export const AutoSave: Story = {
  render: () => ({
    props: { columns: batchEditCols, data },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pageSize]="0" [saveMode]="'auto'" />`,
  }),
};

/**
 * Column header menu: each header has a ⋮ button (also opened by right-clicking the header) with
 * sort, pin left/right/unpin, hide, reset width, and (for filterable columns) a "Filter…" jump.
 */
export const ColumnMenus: Story = {
  render: () => ({
    props: { columns, data },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pageSize]="0" />`,
  }),
};

/**
 * Row/cell context menu: right-click any cell for Copy cell / Copy row plus consumer-supplied items.
 * Every selection (built-in copies included) emits (menuAction).
 */
export const ContextMenu: Story = {
  render: () => ({
    props: {
      columns,
      data,
      items: (ctx: { row: Person }) => [{ id: 'view', label: 'View ' + ctx.row.name }],
    },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pageSize]="0" [contextMenuItems]="items" />`,
  }),
};

interface WideRow extends Record<string, unknown> { id: number; name: string }
const wideCols: GridColumnDef<WideRow>[] = Array.from({ length: 40 }, (_, i) => ({
  key: (i === 0 ? 'name' : 'f' + i),
  header: i === 0 ? 'Name' : 'Field ' + i,
  width: 140,
}));
const wideRows: WideRow[] = Array.from({ length: 50 }, (_, r) => {
  const o: WideRow = { id: r, name: 'Row ' + (r + 1) };
  for (let i = 1; i < 40; i++) o['f' + i] = `r${r}·f${i}`;
  return o;
});

/**
 * Virtual columns: 40 fixed-width columns, only the horizontally-visible ones render.
 * Scroll sideways — aria-colindex stays logical; composes with vertical virtual rows.
 */
export const VirtualColumns: Story = {
  render: () => ({
    props: { columns: wideCols, data: wideRows },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pageSize]="0" [virtualColumns]="true" [virtualScroll]="true" [rowHeight]="36" />`,
  }),
};

/**
 * Responsive: in a narrow container the grid renders stacked cards instead of a table
 * (highest-priority column is the card title). Resize wider to see the table return.
 */
export const Responsive: Story = {
  render: () => ({
    props: {
      columns: [
        { key: 'name', header: 'Name', priority: 10 },
        { key: 'role', header: 'Role', priority: 5 },
        { key: 'age', header: 'Age' },
      ] as GridColumnDef<Person>[],
      data,
    },
    template: `<ax-data-grid class="block w-[22rem]" [columns]="columns" [data]="data" [responsive]="true" [selectable]="true" [pageSize]="0" />`,
  }),
};

/** Export: toolbar "Export CSV" (file download) and "Copy" (TSV to clipboard) of the filtered rows / selection. */
export const CsvExport: Story = {
  render: () => ({
    props: { columns, data },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [selectable]="true" [exportable]="true" [pageSize]="0" />`,
  }),
};

/** Excel export: pass an [xlsxAdapter] wrapping your own SheetJS/ExcelJS; the grid stays dep-free.
 *  This demo uses a stub adapter that encodes the sheet shape as JSON bytes. */
export const ExcelExport: Story = {
  render: () => ({
    props: {
      columns,
      data,
      xlsxAdapter: {
        toWorkbook: (sheets: { name: string; rows: unknown[][] }[]) =>
          new TextEncoder().encode(JSON.stringify(sheets)).buffer,
        fromWorkbook: () => [],
      },
    },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [xlsxAdapter]="xlsxAdapter" [pageSize]="0" />`,
  }),
};

/** PDF export: pass a [pdfAdapter] wrapping your own jsPDF-autotable / pdfmake; the grid stays dep-free.
 *  This demo uses a stub adapter that encodes the table as JSON bytes. */
export const PdfExport: Story = {
  render: () => ({
    props: {
      columns,
      data,
      pdfAdapter: {
        toPdf: (doc: { columns: string[]; rows: string[][] }) =>
          new TextEncoder().encode(JSON.stringify(doc)).buffer,
      },
    },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pdfAdapter]="pdfAdapter" [pageSize]="0" />`,
  }),
};

/** Excel import: with [xlsxAdapter] set, the Import Excel button parses a workbook. A multi-sheet
 *  workbook opens a sheet picker. This demo's stub adapter returns two canned sheets. */
export const ExcelImport: Story = {
  render: () => ({
    props: {
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'age', header: 'Age', filterType: 'number' },
      ] as GridColumnDef<Person>[],
      data,
      onImported: (rows: unknown) => rows,
      xlsxAdapter: {
        toWorkbook: () => new ArrayBuffer(0),
        fromWorkbook: () => [
          { name: 'People', rows: [['Name', 'Age'], ['Ada', 36], ['Bo', 40]] },
          { name: 'Extras', rows: [['Name', 'Age'], ['Cy', 9]] },
        ],
      },
    },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [xlsxAdapter]="xlsxAdapter" (imported)="onImported($event)" [pageSize]="0" />`,
  }),
};

/** Print: the "Print" button opens the browser print dialog with a clean full-dataset table (all filtered rows). */
export const Print: Story = {
  render: () => ({
    props: { columns, data },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [printable]="true" [pageSize]="10" printTitle="People" />`,
  }),
};

/** Import: "Import CSV" opens a file picker; parsed+coerced rows are emitted via (imported). */
export const CsvImport: Story = {
  render: () => ({
    props: {
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'age', header: 'Age', filterType: 'number' },
      ] as GridColumnDef<Person>[],
      data,
      onImported: (rows: unknown) => rows,
    },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [importable]="true" (imported)="onImported($event)" [pageSize]="0" />`,
  }),
};

/** Import (mapped): importMode="mapped" opens a column-mapping dialog after the file pick —
 *  auto-guessed targets are editable via dropdowns and rows emit only on Confirm. */
export const CsvImportMapping: Story = {
  render: () => ({
    props: {
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'age', header: 'Age', filterType: 'number' },
      ] as GridColumnDef<Person>[],
      data,
      onImported: (rows: unknown) => rows,
    },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [importable]="true" importMode="mapped" (imported)="onImported($event)" [pageSize]="0" />`,
  }),
};

/** Paste: with [pasteable]="true", Ctrl/Cmd+V (or the Paste button) parses clipboard TSV/CSV into new rows.
 *  Copy a range from Excel/Sheets, focus the grid, and paste. */
export const PasteRows: Story = {
  render: () => ({
    props: {
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'age', header: 'Age', filterType: 'number' },
      ] as GridColumnDef<Person>[],
      data,
      onImported: (rows: unknown) => rows,
    },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pasteable]="true" (imported)="onImported($event)" [pageSize]="0" />`,
  }),
};

/** Paste fill: with [pasteable]="true" and editable columns, focus a cell and Ctrl/Cmd+V pastes a
 *  clipboard block into cells in place (one undo step). Focus outside an editable cell → paste adds rows. */
export const PasteFill: Story = {
  render: () => ({
    props: {
      columns: [
        { key: 'name', header: 'Name', editable: true },
        { key: 'age', header: 'Age', editable: true, filterType: 'number' },
      ] as GridColumnDef<Person>[],
      data,
      onImported: (rows: unknown) => rows,
    },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [pasteable]="true" (imported)="onImported($event)" [pageSize]="0" />`,
  }),
};

/**
 * Compact, data-heavy layout. `density="dense"` packs rows to 28px, and the
 * built-in density toggle (Dense · Compact · Comfortable · Spacious) lets the
 * end user retune it live — two-way bound via `[(density)]`.
 */
export const Dense: Story = {
  render: () => ({
    props: { columns, data, density: 'dense', toolbar: { density: true } },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [searchable]="true" [(density)]="density" [toolbar]="toolbar" [pageSize]="10" />`,
  }),
};

/**
 * Trim the toolbar to just the features a consumer needs. `toolbarPreset` sets a
 * baseline (`full` · `minimal` · `readonly` · `none`); the `toolbar` object
 * overrides individual affordances on top. Here: minimal preset (sort + search +
 * density only), everything else hidden.
 */
export const MinimalToolbar: Story = {
  render: () => ({
    props: { columns, data },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [searchable]="true" toolbarPreset="minimal" [pageSize]="10" />`,
  }),
};

/**
 * Overflow menu: with `[toolbar]="{ overflow: true }"`, the data I/O actions
 * (Export, Copy, Excel, PDF, Print, Import, Paste) collapse behind a `⋯` button,
 * keeping the toolbar to a single tidy row. The view panels stay inline.
 */
export const OverflowToolbar: Story = {
  render: () => ({
    props: { columns, data, toolbar: { overflow: true } },
    template: `<ax-data-grid class="block w-[40rem]" [columns]="columns" [data]="data" [searchable]="true" [exportable]="true" [printable]="true" [pasteable]="true" [toolbar]="toolbar" [pageSize]="10" />`,
  }),
};
