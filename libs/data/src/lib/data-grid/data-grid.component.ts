import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  afterNextRender, afterRenderEffect, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject,
  Injector, input, model, output, Renderer2, RendererStyleFlags2, signal, TemplateRef, untracked, viewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { computeRange } from '@axisui-ng/cdk';
import { AxIconComponent } from '@axisui-ng/icons';

import { blocksForRange, missingBlocks, needsMore, windowRows } from './block-cache';

import { AxDataGridSortPanelComponent } from './sort-panel.component';
import { AxDataGridFilterBuilderComponent } from './filter-builder.component';
import { AxDataGridGroupPanelComponent } from './group-panel.component';
import { AxDataGridColumnPanelComponent } from './column-panel.component';
import { type FilterGroup, type FilterNode } from './filter-model';
import { flattenGroups, groupRows, type DisplayRow, type GroupNode } from './group-core';

import {
  applyRange, asText, cellValue, clampWidth, selectionState, toggleAll, toggleRow,
  type Density, type GridColumnDef, type RowId,
} from './grid-core';
import {
  ClientDataSource, type GridDataSource, type GridGroupQuery, type GridPage, type GridQuery, type GridTreeQuery,
} from './grid-data-source';
import { buildNodes, flattenServer, setNodeAt, type ServerNode } from './server-group-tree';
import { flattenTree } from './tree-core';
import { buildLazyNodes, findLazy, flattenLazy, setLazyAt, type LazyNode } from './lazy-tree';
import { flattenLeaves, headerRows, isGroupCol, treeDepth, type HeaderCell } from './header-model';
import { editedValue, validateCell, type CellEdit } from './edit-core';
import { validateRowDrafts, rowCommitEntries } from './row-edit-core';
import { nextEditableCell, prevEditableCell } from './cell-nav';
import { moveFocus, type FocusPos, type NavKey } from './grid-nav';
import { canUndo as historyCanUndo, canRedo as historyCanRedo, type EditDelta } from './history-core';
import {
  cumulativeOffsets, effectiveOrder, moveColumn, pinnedSideOf, pinnedSlots, resolveColumns,
  togglePin, toggleHidden, type ColumnState, type PinSide,
} from './column-model';
import { GridState } from './grid-state';
import { AxDataGridMenuComponent } from './menu.component';
import { columnMenuItems, cellText, rowTsv, type GridMenuItem } from './menu-core';
import { columnRange, type ColumnRange } from './column-range';
import { orderByPriority } from './card-model';
import { BOM, toDelimited } from './export-core';
import { autoGuessMapping, buildRowsFromMapping, coerceCsvValue, mapImportedRows, parseDelimited, sniffDelimiter } from './import-core';
import { type GridWorkerClient } from './grid-worker';
import { AxDataGridImportDialogComponent } from './import-dialog.component';
import { AxDataGridSheetPickerComponent } from './sheet-picker.component';
import { planFill, type FillTarget } from './paste-fill-core';
import { buildSheet, sheetToMatrix, type XlsxAdapter, type XlsxSheet } from './xlsx-core';
import { toPdfDocument, type PdfAdapter } from './pdf-core';
import { DENSITY_ORDER, densityRowHeight, resolveToolbar, type GridToolbarConfig, type GridToolbarPreset } from './toolbar-config';

const MAX_PIN = 6;
const PIN_START_CLASSES = [
  'sticky z-20 bg-background start-[var(--dg-pin-s-0)]',
  'sticky z-20 bg-background start-[var(--dg-pin-s-1)]',
  'sticky z-20 bg-background start-[var(--dg-pin-s-2)]',
  'sticky z-20 bg-background start-[var(--dg-pin-s-3)]',
  'sticky z-20 bg-background start-[var(--dg-pin-s-4)]',
  'sticky z-20 bg-background start-[var(--dg-pin-s-5)]',
];
const PIN_END_CLASSES = [
  'sticky z-20 bg-background end-[var(--dg-pin-e-0)]',
  'sticky z-20 bg-background end-[var(--dg-pin-e-1)]',
  'sticky z-20 bg-background end-[var(--dg-pin-e-2)]',
  'sticky z-20 bg-background end-[var(--dg-pin-e-3)]',
  'sticky z-20 bg-background end-[var(--dg-pin-e-4)]',
  'sticky z-20 bg-background end-[var(--dg-pin-e-5)]',
];

/** Context passed to a consumer's `contextMenuItems` builder for the right-clicked cell. */
export interface GridMenuContext<T> { row: T; col: GridColumnDef<T>; value: unknown; }
/** Emitted on every context-menu selection (built-in Copy items included). */
export interface GridMenuActionEvent<T> { id: string; row?: T; col?: GridColumnDef<T>; value?: unknown; }

/** Which rows an export covers. `auto` = selection if any, else all. */
export type ExportScope = 'auto' | 'all' | 'selected' | 'page';
export interface CsvExportOptions { scope?: ExportScope; filename?: string; bom?: boolean; }
export interface ClipboardExportOptions { scope?: ExportScope; delimiter?: string; }

/** One entry in the windowed column render layout: a real column or a horizontal spacer. */
type ColLayoutItem<T> = { kind: 'col'; col: GridColumnDef<T> } | { kind: 'spacer'; width: number };

/**
 * AxDataGrid — MIT enterprise data grid. Headless engine (grid-core + GridState)
 * with a client/server GridDataSource. Phase 0: sort, global search, per-column
 * filter, selection, resize, pagination. Bind selection two-way with [(selected)].
 *
 * @example
 * <ax-data-grid [columns]="cols" [data]="rows" selectable resizable [(selected)]="ids" />
 */
@Component({
  selector: 'ax-data-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, AxIconComponent, AxDataGridSortPanelComponent, AxDataGridFilterBuilderComponent, AxDataGridGroupPanelComponent, AxDataGridColumnPanelComponent, AxDataGridMenuComponent, AxDataGridImportDialogComponent, AxDataGridSheetPickerComponent],
  host: { class: 'block', '[attr.data-density]': 'density()', '(keydown)': 'onGridKeydown($event)', '(paste)': 'onPaste($event)' },
  template: `
    <div class="print:hidden">
    @if (showToolbarRow()) {
    <div data-grid-toolbar class="mb-3 flex items-center gap-2">
      @if (resolvedToolbar().sort) {
      <button type="button" data-toolbar-sort
        class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
        [attr.data-state]="sortPanelOpen() ? 'open' : 'closed'" (click)="sortPanelOpen.set(!sortPanelOpen())">
        Sort
        @if (state.sort().length) { <span class="rounded-[var(--radius-sm)] bg-muted px-1 text-xs">{{ state.sort().length }}</span> }
      </button>
      }
      @if (resolvedToolbar().filters) {
      <button type="button" data-toolbar-filters
        class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
        [attr.data-state]="filterPanelOpen() ? 'open' : 'closed'" (click)="filterPanelOpen.set(!filterPanelOpen())">
        Filters
        @if (activeFilterCount()) { <span class="rounded-[var(--radius-sm)] bg-muted px-1 text-xs">{{ activeFilterCount() }}</span> }
      </button>
      }
      @if (resolvedToolbar().group) {
      <ax-data-grid-group-panel [columns]="columns()" [(groupBy)]="groupBy" />
      }
      @if (resolvedToolbar().columns) {
      <button type="button" data-toolbar-columns
        class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
        [attr.data-state]="columnPanelOpen() ? 'open' : 'closed'" (click)="columnPanelOpen.set(!columnPanelOpen())">
        Columns
        @if (columnState().hidden.length) { <span class="rounded-[var(--radius-sm)] bg-muted px-1 text-xs">{{ columnState().hidden.length }}</span> }
      </button>
      }
      @if (resolvedToolbar().density) {
      <div data-density-toggle role="group" aria-label="Row density"
        class="inline-flex items-center gap-0.5 rounded-[var(--radius-field)] border border-border p-0.5">
        @for (opt of densityOptions; track opt) {
          <button type="button" data-density-option [attr.data-value]="opt"
            [attr.aria-pressed]="density() === opt"
            class="rounded-[var(--radius-sm)] px-2 py-0.5 text-xs capitalize outline-none transition-[color,background-color] duration-[var(--duration-fast)] ease-out-quart hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            [class.bg-muted]="density() === opt"
            [class.font-medium]="density() === opt"
            [class.text-foreground]="density() === opt"
            [class.text-muted-foreground]="density() !== opt"
            (click)="density.set(opt)">{{ opt }}</button>
        }
      </div>
      }
      @if (hasSelection()) {
        <button type="button" data-clear-selection
          class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
          (click)="clearSelection()">
          {{ selectedCount() }} selected · Clear selection
        </button>
      }
      @if (hasDirtyEdits()) {
        <div class="inline-flex items-center gap-2 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm">
          {{ dirtyCount() }} unsaved change{{ dirtyCount() === 1 ? '' : 's' }}
          <button type="button" data-save-all class="font-medium underline hover:no-underline" (click)="saveAll()">Save All</button>
          <button type="button" data-discard-all class="font-medium underline hover:no-underline" (click)="discardAll()">Discard All</button>
          <button type="button" data-undo class="font-medium underline hover:no-underline disabled:opacity-50 disabled:no-underline" [disabled]="!canUndo()" (click)="undoEdit()">Undo</button>
          <button type="button" data-redo class="font-medium underline hover:no-underline disabled:opacity-50 disabled:no-underline" [disabled]="!canRedo()" (click)="redoEdit()">Redo</button>
        </div>
      }
      @if (!resolvedToolbar().overflow) {
        @if (exportable() && resolvedToolbar().export) {
          <button type="button" data-export-csv aria-label="Export CSV"
            class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
            (click)="exportCsv()">Export CSV</button>
          <button type="button" data-export-copy aria-label="Copy to clipboard"
            class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
            (click)="copyToClipboard()">Copy</button>
        }
        @if (xlsxAdapter() && resolvedToolbar().export) {
          <button type="button" data-export-xlsx aria-label="Export Excel"
            class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
            (click)="exportXlsx()">Export Excel</button>
        }
        @if (xlsxAdapter() && resolvedToolbar().import) {
          <button type="button" data-import-xlsx aria-label="Import Excel"
            class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
            (click)="importXlsxInput.click()">Import Excel</button>
        }
        @if (pdfAdapter() && resolvedToolbar().export) {
          <button type="button" data-export-pdf aria-label="Export PDF"
            class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
            (click)="exportPdf()">Export PDF</button>
        }
        @if (printable() && resolvedToolbar().print) {
          <button type="button" data-print aria-label="Print"
            class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
            (click)="printGrid()">Print</button>
        }
        @if (importable() && resolvedToolbar().import) {
          <button type="button" data-import-csv aria-label="Import CSV"
            class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
            (click)="importFileInput.click()">Import CSV</button>
        }
        @if (pasteable() && resolvedToolbar().paste) {
          <button type="button" data-paste aria-label="Paste rows"
            class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
            (click)="pasteFromClipboard()">Paste</button>
        }
      } @else if (overflowItems().length) {
        <button type="button" data-toolbar-overflow aria-label="More actions" aria-haspopup="menu"
          [attr.data-state]="overflowMenu() ? 'open' : 'closed'"
          class="inline-flex items-center gap-1 rounded-[var(--radius-field)] border border-border px-2 py-1 text-sm hover:bg-muted"
          (click)="openOverflowMenu($event)">⋯</button>
      }
      <!-- Hidden file inputs stay mounted whenever their feature is on, so the
           overflow menu (and inline buttons) can trigger them regardless of layout. -->
      @if (xlsxAdapter() && resolvedToolbar().import) {
        <input #importXlsxInput data-import-xlsx-input type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          class="hidden" aria-hidden="true" tabindex="-1" (change)="onImportXlsxFileChange($event)" />
      }
      @if (importable() && resolvedToolbar().import) {
        <input #importFileInput data-import-input type="file" accept=".csv,text/csv" class="hidden"
          aria-hidden="true" tabindex="-1" (change)="onImportFileChange($event)" />
      }
    </div>
    }
    @if (overflowMenu(); as m) {
      <ax-data-grid-menu [items]="overflowItems()" [x]="m.x" [y]="m.y"
        (select)="onOverflowSelect($event)" (close)="overflowMenu.set(null)" />
    }
    @if (sortPanelOpen()) {
      <div class="mb-3" data-state="open"><ax-data-grid-sort-panel [state]="state" [columns]="columns()" /></div>
    }
    @if (filterPanelOpen()) {
      <div class="mb-3" data-state="open"><ax-data-grid-filter-builder [state]="state" [columns]="columns()" /></div>
    }
    @if (columnPanelOpen()) {
      <div class="mb-3" data-state="open"><ax-data-grid-column-panel [columns]="columns()" [(columnState)]="columnState" /></div>
    }

    @if (searchable() && resolvedToolbar().search) {
      <div class="mb-3">
        <input
          type="search"
          class="h-9 w-64 rounded-[var(--radius-field)] border border-input bg-background px-3 text-sm"
          placeholder="Search…"
          aria-label="Search grid"
          [value]="state.search()"
          (input)="onSearch($event)"
        />
      </div>
    }

    @if (showSelectAllBanner()) {
      <div class="mb-3 flex items-center gap-2 rounded-[var(--radius-field)] bg-muted px-3 py-2 text-sm">
        All rows on this page are selected.
        <button type="button" data-select-all class="font-medium underline hover:no-underline" (click)="selectAllMatching()">
          Select all {{ total() }} rows
        </button>
      </div>
    }
    <ng-template #leafHead let-col="col" let-hi="hi" let-rowspan="rowspan">
      <th
        data-col-header [attr.data-col-header]="colKey(col)"
        role="columnheader" [attr.aria-colindex]="hi + selBias() + 1"
        [attr.tabindex]="isFocused(-1, hi + selBias()) ? 0 : -1"
        [attr.data-focus-r]="-1" [attr.data-focus-c]="hi + selBias()"
        [attr.rowspan]="rowspan"
        [class]="headerClass(col)" [attr.data-pin]="pinSideOf(col)"
        [draggable]="!isGrouped()"
        (dragstart)="onColDragStart(col, $event)"
        (dragover)="onColDragOver($event)"
        (drop)="onColDrop(col)"
        (dragend)="onColDragEnd()"
        (contextmenu)="openColumnMenu(col, $event)"
        class="group/th relative h-[var(--height-row)] px-3 text-start font-medium text-muted-foreground"
        [class.text-end]="col.align === 'end'"
        [attr.aria-sort]="ariaSort(col)"
      >
        @if (col.sortable) {
          <button type="button" class="inline-flex items-center gap-1 hover:text-foreground" (click)="toggleSort(col, $event.shiftKey)">
            @if (col.headerTemplate) {
              <ng-container [ngTemplateOutlet]="col.headerTemplate" [ngTemplateOutletContext]="{ $implicit: col }" />
            } @else { {{ col.header }} }
            @if (sortDir(col); as dir) {
              <ax-icon [name]="dir === 'asc' ? 'chevron-up' : 'chevron-down'" [size]="14" />
            }
            @if (sortPriority(col); as p) {
              <span data-sort-priority class="ms-0.5 rounded-[var(--radius-sm)] bg-muted px-1 text-[10px] leading-none text-muted-foreground">{{ p }}</span>
            }
          </button>
        } @else {
          @if (col.headerTemplate) {
            <ng-container [ngTemplateOutlet]="col.headerTemplate" [ngTemplateOutletContext]="{ $implicit: col }" />
          } @else { {{ col.header }} }
        }
        @if (columnMenu()) {
          <button
            type="button"
            [attr.data-col-menu]="colKey(col)"
            class="ms-1 rounded-[var(--radius-sm)] px-1 text-muted-foreground opacity-0 focus:opacity-100 group-hover/th:opacity-100 hover:bg-muted"
            aria-haspopup="menu"
            [attr.aria-label]="'Column menu ' + col.header"
            (click)="openColumnMenu(col, $event)"
          >⋮</button>
        }
        @if (resizable()) {
          <span
            draggable="false"
            class="absolute inset-y-0 end-0 w-1 cursor-col-resize touch-none select-none"
            (dblclick)="onResizeReset(col)"
            (pointerdown)="onResizeStart(col, $event)"
            (pointermove)="onResizeMove($event)"
            (pointerup)="onResizeEnd()"
            (lostpointercapture)="onResizeEnd()"
          ></span>
        }
      </th>
    </ng-template>
    @if (isCardMode()) {
      @if (error()) {
        <div class="px-3 py-6 text-center text-destructive" data-card-error>{{ error() }}</div>
      } @else if (loading()) {
        <div class="px-3 py-6 text-center text-muted-foreground">Loading…</div>
      } @else if (renderCount() === 0) {
        <div class="px-3 py-6 text-center text-muted-foreground">No data</div>
      } @else {
        <ul role="list" class="flex flex-col gap-2">
          @for (row of cardRows(); track rowId()(row); let i = $index) {
            <li role="listitem" data-card [attr.data-card-i]="i"
                [attr.tabindex]="i === cardFocus() ? 0 : -1"
                class="rounded-[var(--radius-field)] border border-border bg-card p-3 transition-colors duration-[var(--duration-fast)] ease-out-quart hover:bg-muted/50"
                [class]="rowClassOf(row)"
                (click)="rowClick.emit(row)"
                (keydown)="onCardKeydown($event, i)">
              <div class="flex items-center gap-2">
                @if (selectable()) {
                  <input type="checkbox" aria-label="Select row" [checked]="isSelected(row)" (click)="onRowCheckboxClick(row, $event)" />
                }
                <span class="font-medium">{{ cardTitleValue(row) }}</span>
              </div>
              @for (col of cardBodyColumns(); track colKey(col)) {
                <div class="mt-1 flex justify-between gap-3 text-sm">
                  <span class="text-muted-foreground">{{ col.header }}</span>
                  <span class="text-end">{{ editedCellValue(row, col) }}</span>
                </div>
              }
            </li>
          }
        </ul>
      }
    } @else {
    <div #vp [class]="useVirtual() ? 'overflow-auto max-h-[400px]' : (useColVirtual() ? 'overflow-x-auto' : '')" (scroll)="onVpScroll()">
    <table class="border-collapse text-sm min-w-[var(--dg-table-w)]" [class.w-full]="!useColVirtual()" [class.table-fixed]="resizable()"
      role="grid" [attr.aria-rowcount]="ariaRowCount()" [attr.aria-colcount]="navColCount()">
      <colgroup>
        @if (selectable()) { <col [attr.width]="36" /> }
        @for (item of layoutColumns(); track $index) {
          @if (item.kind === 'spacer') { <col [attr.width]="item.width" /> }
          @else { <col [attr.width]="colWidthAttr(item.col)" /> }
        }
      </colgroup>
      <thead role="rowgroup">
        @for (hrow of headerMatrix(); track $index; let level = $index) {
          <tr class="border-b border-border" role="row" [attr.aria-rowindex]="level + 1">
            @if (selectable() && level === 0) {
              <th class="h-[var(--height-row)] w-9 px-2" [class]="selClass()"
                role="columnheader" [attr.aria-colindex]="1"
                [attr.tabindex]="isFocused(-1, 0) ? 0 : -1" [attr.data-focus-r]="-1" [attr.data-focus-c]="0"
                [class.sticky]="stickyHeader()" [class.top-0]="stickyHeader()" [class.z-20]="stickyHeader()" [class.bg-background]="stickyHeader()"
                [attr.rowspan]="headerDepth()">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  [checked]="headerState() === 'all'"
                  [indeterminate]="headerState() === 'some'"
                  (change)="toggleAllSelection()"
                />
              </th>
            }
            @if (useColVirtual()) {
              @for (item of layoutColumns(); track $index) {
                @if (item.kind === 'spacer') { <th aria-hidden="true" class="p-0"></th> }
                @else {
                  <ng-container [ngTemplateOutlet]="leafHead" [ngTemplateOutletContext]="{ col: item.col, hi: colLogicalIndex(item.col), rowspan: 1 }" />
                }
              }
            } @else {
              @for (cell of hrow; track headerCellKey(cell); let hi = $index) {
                @if (cell.isGroup) {
                  <th data-col-group role="columnheader" [attr.colspan]="cell.colspan" [class]="stickyHeaderClass()"
                    class="h-[var(--height-row)] px-3 text-center font-medium text-muted-foreground border-b border-border">
                    @if (cell.col.headerTemplate) {
                      <ng-container [ngTemplateOutlet]="cell.col.headerTemplate" [ngTemplateOutletContext]="{ $implicit: cell.col }" />
                    } @else { {{ cell.col.header }} }
                  </th>
                } @else {
                  <ng-container [ngTemplateOutlet]="leafHead" [ngTemplateOutletContext]="{ col: cell.col, hi: hi, rowspan: cell.rowspan }" />
                }
              }
            }
          </tr>
        }
        @if (hasColumnFilters()) {
          <tr role="row" [attr.aria-rowindex]="headerMatrix().length + 1" class="border-b border-border">
            @if (selectable()) { <td role="gridcell" [attr.aria-colindex]="1" class="px-2"></td> }
            @for (item of layoutColumns(); track $index) {
              @if (item.kind === 'spacer') {
                <td aria-hidden="true" class="p-0"></td>
              } @else {
                @let col = item.col;
                @let ci = colLogicalIndex(col);
              <td role="gridcell" [attr.aria-colindex]="ci + selBias() + 1" class="px-2 pb-2">
                @if (col.filterable) {
                  <input
                    type="text"
                    [attr.data-col-filter]="colKey(col)"
                    class="h-7 w-full rounded-[var(--radius-sm)] border border-input bg-background px-2 text-xs"
                    [attr.aria-label]="'Filter ' + col.header"
                    [attr.placeholder]="'Filter ' + col.header"
                    [value]="state.columnFilters()[colKey(col)] ?? ''"
                    (input)="onColumnFilter(col, $event)"
                  />
                }
              </td>
              }
            }
          </tr>
        }
      </thead>
      <tbody role="rowgroup">
        @if (error()) {
          <tr><td [attr.colspan]="colSpan()" class="px-3 py-6 text-center text-destructive">{{ error() }}</td></tr>
        } @else if (loading()) {
          <tr><td [attr.colspan]="colSpan()" class="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
        } @else if (renderCount() === 0) {
          <tr><td [attr.colspan]="colSpan()" class="px-3 py-6 text-center text-muted-foreground">No data</td></tr>
        } @else {
          @if (useVirtual()) {
            <tr aria-hidden="true"><td [attr.colspan]="colSpan()"><div class="h-[var(--grid-pad-top)]"></div></td></tr>
          }
          @for (entry of viewRows(); track $index) {
            @if (!entry) {
              <tr data-row-loading class="border-b border-border">
                @if (selectable()) { <td class="w-9 px-2" [class]="selClass()"></td> }
                @for (col of resolvedColumns(); track colKey(col)) {
                  <td class="h-[var(--height-row)] px-3"><span class="block h-3 w-2/3 animate-pulse rounded bg-muted"></span></td>
                }
              </tr>
            } @else if (entry.kind === 'group') {
              <tr data-group-row role="row" [attr.aria-expanded]="isGroupExpanded(entry.node.groupId)" class="border-b border-border bg-muted/30 font-medium">
                @if (selectable()) { <td class="w-9 px-2" [class]="selClass()"></td> }
                @for (col of resolvedColumns(); track colKey(col); let first = $first) {
                  <td class="h-[var(--height-row)] px-3" [class.text-end]="col.align === 'end'" [class]="pinClass(col)" [attr.data-pin]="pinSideOf(col)">
                    @if (first) {
                      @for (l of indentLevels(entry.node.level); track l) { <span class="ms-4"></span> }
                      <button type="button" data-group-toggle class="me-1 inline-flex items-center" [attr.aria-label]="'Toggle group ' + asText(entry.node.value)" (click)="onToggleGroup(entry.node)">
                        <ax-icon [name]="isGroupExpanded(entry.node.groupId) ? 'chevron-down' : 'chevron-right'" [size]="14" />
                      </button>
                      {{ asText(entry.node.value) }} <span class="text-muted-foreground">({{ entry.node.count }})</span>
                    } @else {
                      {{ aggLabel(entry.node, col) }}
                    }
                  </td>
                }
              </tr>
            } @else if (entry.kind === 'group-loading') {
              <tr data-group-loading class="border-b border-border">
                @if (selectable()) { <td class="w-9 px-2" [class]="selClass()"></td> }
                <td [attr.colspan]="resolvedColumns().length" class="h-[var(--height-row)] px-3 text-muted-foreground">Loading…</td>
              </tr>
            } @else if (entry.kind === 'tree') {
              <tr
                data-tree-row
                role="row"
                [attr.aria-rowindex]="ariaRowBodyIndex(entry.row)" [attr.aria-selected]="isSelected(entry.row)"
                [attr.aria-expanded]="entry.expandable ? isRowOpen(entry.row) : null"
                class="border-b border-border transition-colors duration-[var(--duration-fast)] ease-out-quart hover:bg-muted/50"
                [class]="rowClassOf(entry.row)"
                (click)="rowClick.emit(entry.row)"
              >
                @if (selectable()) {
                  <td class="w-9 px-2" [class]="selClass()"
                    role="gridcell" [attr.aria-colindex]="1"
                    [attr.tabindex]="isFocused(navRowIndexOf(entry.row), 0) ? 0 : -1"
                    [attr.data-focus-r]="navRowIndexOf(entry.row)" [attr.data-focus-c]="0"
                    (click)="$event.stopPropagation()">
                    <input type="checkbox" aria-label="Select row" [checked]="isSelected(entry.row)" (click)="onRowCheckboxClick(entry.row, $event)" />
                  </td>
                }
                @for (item of layoutColumns(); track $index) {
                  @if (item.kind === 'spacer') {
                    <td aria-hidden="true" class="p-0"></td>
                  } @else {
                    @let col = item.col;
                    @let ci = colLogicalIndex(col);
                    @let first = ci === 0;
                  <td class="h-[var(--height-row)] px-3" [class.text-end]="col.align === 'end'" [class]="bodyCellClass(col, entry.row)" [attr.data-pin]="pinSideOf(col)"
                    role="gridcell" [attr.aria-colindex]="ci + selBias() + 1"
                    [attr.tabindex]="isFocused(navRowIndexOf(entry.row), ci + selBias()) ? 0 : -1"
                    [attr.data-focus-r]="navRowIndexOf(entry.row)" [attr.data-focus-c]="ci + selBias()"
                    (dblclick)="startEdit(entry.row, col)"
                    (keydown.enter)="startEdit(entry.row, col)"
                    (keydown.f2)="startEdit(entry.row, col)"
                    (contextmenu)="openContextMenu(entry.row, col, $event)">
                    @if (first) {
                      @for (l of indentLevels(entry.level); track l) { <span class="ms-4"></span> }
                      @if (entry.expandable) {
                        <button type="button" data-tree-toggle class="me-1 inline-flex items-center" aria-label="Toggle row" (click)="$event.stopPropagation(); onToggleRow(entry.row)">
                          <ax-icon [name]="isRowOpen(entry.row) ? 'chevron-down' : 'chevron-right'" [size]="14" />
                        </button>
                      }
                      @if (editMode() === 'row' && activeEditRow() === rowId()(entry.row)) {
                        <span class="me-2 inline-flex gap-1">
                          <button type="button" data-row-save class="text-xs font-medium underline hover:no-underline" (click)="saveRow(entry.row)">Save</button>
                          <button type="button" data-row-cancel class="text-xs font-medium underline hover:no-underline" (click)="cancelRow()">Cancel</button>
                        </span>
                      }
                    }
                    @if (col.editable && isEditingCell(entry.row, col)) {
                      @if (col.cellEditorTemplate) {
                        <ng-container [ngTemplateOutlet]="col.cellEditorTemplate" [ngTemplateOutletContext]="{ $implicit: entry.row, value: editDraft(), col: col, onChange: onEditorChange }" />
                      } @else {
                        <input
                          data-cell-editor
                          [type]="editorInputType(col)"
                          class="h-7 w-full rounded-[var(--radius-sm)] border border-input bg-background px-1 text-sm"
                          [class.border-destructive]="cellEditError(col)"
                          [attr.aria-label]="'Edit ' + col.header"
                          [value]="asEditString(cellEditValue(col))"
                          (input)="onEditorInput(col, $event)"
                          (keydown.enter)="$event.stopPropagation(); editMode() === 'row' ? saveRow(entry.row) : commitEdit(entry.row, col)"
                          (keydown.escape)="$event.stopPropagation(); editMode() === 'row' ? cancelRow() : cancelEdit()"
                          (keydown.tab)="$event.preventDefault(); $event.stopPropagation(); editMode() === 'row' ? focusSiblingEditor(entry.row, col, 1) : moveEdit(entry.row, col, 1)"
                          (keydown.shift.tab)="$event.preventDefault(); $event.stopPropagation(); editMode() === 'row' ? focusSiblingEditor(entry.row, col, -1) : moveEdit(entry.row, col, -1)"
                          (blur)="editMode() === 'row' ? null : onEditorBlur(entry.row, col)"
                        />
                        @if (cellEditError(col); as err) { <span class="mt-1 block text-xs text-destructive">{{ err }}</span> }
                      }
                    } @else if (col.cellTemplate) {
                      <ng-container [ngTemplateOutlet]="col.cellTemplate" [ngTemplateOutletContext]="{ $implicit: entry.row, value: editedCellValue(entry.row, col) }" />
                    } @else {
                      {{ editedCellValue(entry.row, col) }}
                    }
                  </td>
                  }
                }
              </tr>
            } @else if (entry.kind === 'detail') {
              <tr data-detail-row class="border-b border-border bg-muted/20">
                <td [attr.colspan]="colSpan()" class="px-3 py-2">
                  @if (detailTemplate(); as tpl) {
                    <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: entry.row }" />
                  }
                </td>
              </tr>
            } @else {
              <tr
                data-row
                role="row"
                [attr.aria-rowindex]="ariaRowBodyIndex(entry.row)" [attr.aria-selected]="isSelected(entry.row)"
                class="border-b border-border transition-colors duration-[var(--duration-fast)] ease-out-quart hover:bg-muted/50"
                [class]="rowClassOf(entry.row)"
                (click)="rowClick.emit(entry.row)"
              >
                @if (selectable()) {
                  <td class="w-9 px-2" [class]="selClass()"
                    role="gridcell" [attr.aria-colindex]="1"
                    [attr.tabindex]="isFocused(navRowIndexOf(entry.row), 0) ? 0 : -1"
                    [attr.data-focus-r]="navRowIndexOf(entry.row)" [attr.data-focus-c]="0"
                    (click)="$event.stopPropagation()">
                    <input type="checkbox" aria-label="Select row" [checked]="isSelected(entry.row)" (click)="onRowCheckboxClick(entry.row, $event)" />
                  </td>
                }
                @for (item of layoutColumns(); track $index) {
                  @if (item.kind === 'spacer') {
                    <td aria-hidden="true" class="p-0"></td>
                  } @else {
                    @let col = item.col;
                    @let ci = colLogicalIndex(col);
                    @let first = ci === 0;
                  <td class="h-[var(--height-row)] px-3" [class.text-end]="col.align === 'end'" [class]="bodyCellClass(col, entry.row)" [attr.data-pin]="pinSideOf(col)"
                    role="gridcell" [attr.aria-colindex]="ci + selBias() + 1"
                    [attr.tabindex]="isFocused(navRowIndexOf(entry.row), ci + selBias()) ? 0 : -1"
                    [attr.data-focus-r]="navRowIndexOf(entry.row)" [attr.data-focus-c]="ci + selBias()"
                    (dblclick)="startEdit(entry.row, col)"
                    (keydown.enter)="startEdit(entry.row, col)"
                    (keydown.f2)="startEdit(entry.row, col)"
                    (contextmenu)="openContextMenu(entry.row, col, $event)">
                    @if (first && editMode() === 'row' && activeEditRow() === rowId()(entry.row)) {
                      <span class="me-2 inline-flex gap-1">
                        <button type="button" data-row-save class="text-xs font-medium underline hover:no-underline" (click)="saveRow(entry.row)">Save</button>
                        <button type="button" data-row-cancel class="text-xs font-medium underline hover:no-underline" (click)="cancelRow()">Cancel</button>
                      </span>
                    }
                    @if (col.editable && isEditingCell(entry.row, col)) {
                      @if (col.cellEditorTemplate) {
                        <ng-container [ngTemplateOutlet]="col.cellEditorTemplate" [ngTemplateOutletContext]="{ $implicit: entry.row, value: editDraft(), col: col, onChange: onEditorChange }" />
                      } @else {
                        <input
                          data-cell-editor
                          [type]="editorInputType(col)"
                          class="h-7 w-full rounded-[var(--radius-sm)] border border-input bg-background px-1 text-sm"
                          [class.border-destructive]="cellEditError(col)"
                          [attr.aria-label]="'Edit ' + col.header"
                          [value]="asEditString(cellEditValue(col))"
                          (input)="onEditorInput(col, $event)"
                          (keydown.enter)="$event.stopPropagation(); editMode() === 'row' ? saveRow(entry.row) : commitEdit(entry.row, col)"
                          (keydown.escape)="$event.stopPropagation(); editMode() === 'row' ? cancelRow() : cancelEdit()"
                          (keydown.tab)="$event.preventDefault(); $event.stopPropagation(); editMode() === 'row' ? focusSiblingEditor(entry.row, col, 1) : moveEdit(entry.row, col, 1)"
                          (keydown.shift.tab)="$event.preventDefault(); $event.stopPropagation(); editMode() === 'row' ? focusSiblingEditor(entry.row, col, -1) : moveEdit(entry.row, col, -1)"
                          (blur)="editMode() === 'row' ? null : onEditorBlur(entry.row, col)"
                        />
                        @if (cellEditError(col); as err) { <span class="mt-1 block text-xs text-destructive">{{ err }}</span> }
                      }
                    } @else if (col.cellTemplate) {
                      <ng-container [ngTemplateOutlet]="col.cellTemplate" [ngTemplateOutletContext]="{ $implicit: entry.row, value: editedCellValue(entry.row, col) }" />
                    } @else {
                      {{ editedCellValue(entry.row, col) }}
                    }
                  </td>
                  }
                }
              </tr>
            }
          }
          @if (useVirtual()) {
            <tr aria-hidden="true"><td [attr.colspan]="colSpan()"><div class="h-[var(--grid-pad-bottom)]"></div></td></tr>
          }
        }
      </tbody>
      @if (hasFooter()) {
        <tfoot>
          <tr class="border-t border-border bg-muted/30 font-medium [&>td]:sticky [&>td]:bottom-0">
            @if (selectable()) { <td class="w-9 px-2"></td> }
            @for (item of layoutColumns(); track $index) {
              @if (item.kind === 'spacer') {
                <td aria-hidden="true" class="p-0"></td>
              } @else {
                @let col = item.col;
              <td class="h-[var(--height-row)] px-3" [class.text-end]="col.align === 'end'" [class]="pinClass(col)" [attr.data-pin]="pinSideOf(col)">
                @if (col.footerTemplate) {
                  <ng-container [ngTemplateOutlet]="col.footerTemplate" [ngTemplateOutletContext]="{ $implicit: effectiveGrandTotals()[colKey(col)] }" />
                } @else { {{ grandTotalLabel(col) }} }
              </td>
              }
            }
          </tr>
        </tfoot>
      }
    </table>
    </div>
    }

    @if (openMenu(); as m) {
      <ax-data-grid-menu
        [items]="menuItems()"
        [x]="m.x"
        [y]="m.y"
        (select)="onMenuSelect($event)"
        (close)="openMenu.set(null)"
      />
    }

    @if (importDialogOpen()) {
      <ax-data-grid-import-dialog
        [headers]="importHeaders()"
        [preview]="importPreview()"
        [columns]="resolvedColumns()"
        [initialMapping]="importMapping()"
        (confirm)="onImportConfirm($event)"
        (cancel)="closeImportDialog()"
      />
    }

    @if (sheetPickerOpen()) {
      <ax-data-grid-sheet-picker [sheets]="sheetNames()" (pick)="onSheetPick($event)" (cancel)="closeSheetPicker()" />
    }

    @if (fetching()) {
      <div class="mt-2 text-xs text-muted-foreground" data-fetching>Loading…</div>
    }

    @if (pageSize() > 0 && pages() > 1 && groupBy().length === 0) {
      <div class="mt-3 flex items-center justify-end gap-1">
        <button type="button" class="rounded-[var(--radius-sm)] px-2 py-1 text-sm disabled:opacity-50" aria-label="First page" [disabled]="state.page() === 0" (click)="first()">«</button>
        <button type="button" class="rounded-[var(--radius-sm)] px-2 py-1 text-sm disabled:opacity-50" aria-label="Previous page" [disabled]="state.page() === 0" (click)="prev()">‹</button>
        <span class="px-2 text-sm text-muted-foreground">Page {{ state.page() + 1 }} / {{ pages() }}</span>
        <button type="button" class="rounded-[var(--radius-sm)] px-2 py-1 text-sm disabled:opacity-50" aria-label="Next page" [disabled]="state.page() >= pages() - 1" (click)="next()">›</button>
        <button type="button" class="rounded-[var(--radius-sm)] px-2 py-1 text-sm disabled:opacity-50" aria-label="Last page" [disabled]="state.page() >= pages() - 1" (click)="last()">»</button>
      </div>
    }
    <span aria-live="polite" role="status" class="sr-only">{{ announcement() }}</span>
    </div>
    @if (printing()) {
      <table data-print-table class="hidden print:table w-full border-collapse text-sm">
        @if (printTitle()) { <caption class="mb-2 text-start font-medium">{{ printTitle() }}</caption> }
        <thead>
          <tr>
            @for (col of resolvedColumns(); track colKey(col)) {
              <th class="border border-border px-2 py-1 text-start">{{ col.header }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of printRows(); track rowId()(row)) {
            <tr>
              @for (col of resolvedColumns(); track colKey(col)) {
                <td class="border border-border px-2 py-1">{{ editedCellValue(row, col) }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class AxDataGridComponent<T extends Record<string, unknown>> {
  readonly columns = input.required<GridColumnDef<T>[]>();
  /** Two-way column order + visibility for persistence. @default { order: [], hidden: [] } */
  readonly columnState = model<ColumnState>({ order: [], hidden: [] });
  /** Fallback width (px) for pinned-column sticky offset math. @default 150 */
  readonly defaultColWidth = input<number>(150);
  readonly data = input<T[] | null>(null);
  readonly dataSource = input<GridDataSource<T> | null>(null);
  readonly pageSize = input<number>(10);
  readonly searchable = input<boolean>(false);
  readonly selectable = input<boolean>(false);
  readonly resizable = input<boolean>(false);
  readonly minColumnWidth = input<number>(60);
  /** Commit strategy: 'manual' keeps edits dirty until Save All; 'auto' emits + clears per commit. @default 'manual' */
  readonly saveMode = input<'auto' | 'manual'>('manual');
  /** Editing granularity: 'cell' edits one cell at a time; 'row' opens all editable cells in the active row. @default 'cell' */
  readonly editMode = input<'cell' | 'row'>('cell');
  /** Pin the header row to the top of the scroll viewport. @default true */
  readonly stickyHeader = input<boolean>(true);
  /** Per-row class applied to body rows (leaf + tree). Return falsy for none. */
  readonly rowClass = input<((row: T) => string | undefined) | undefined>();
  /** Row density; two-way so the built-in density toggle can drive it. @default 'comfortable' */
  readonly density = model<Density>('comfortable');
  /**
   * Named baseline for toolbar affordance visibility:
   * `'full'` (default, all on), `'minimal'`, `'readonly'`, or `'none'`.
   * @default 'full'
   */
  readonly toolbarPreset = input<GridToolbarPreset>('full');
  /**
   * Per-affordance overrides on top of {@link toolbarPreset}. Each key is an
   * AND-gate with the matching feature input (e.g. `{ search: false }` hides the
   * search box even when `searchable` is true). Omit a key to inherit the preset.
   * @default {}
   */
  readonly toolbar = input<Partial<GridToolbarConfig>>({});
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  /** Window only the visible rows for large client sets. Requires `pageSize=0`. @default false */
  readonly virtualScroll = input<boolean>(false);
  /** Window only the horizontally-visible columns (off when grouped headers are present). @default false */
  readonly virtualColumns = input<boolean>(false);
  /** Center-column overscan (columns rendered each side of the viewport) when virtualizing columns. @default 2 */
  readonly colOverscan = input<number>(2);
  /** Switch to stacked card layout when the container is narrower than `mobileBreakpoint`. @default false */
  readonly responsive = input<boolean>(false);
  /** Container width (px) below which responsive card mode engages. @default 640 */
  readonly mobileBreakpoint = input<number>(640);
  /** Show the "Export CSV" / "Copy" toolbar buttons (the export methods are always callable). @default false */
  readonly exportable = input<boolean>(false);
  /** Default download filename for `exportCsv()`. @default 'export.csv' */
  readonly exportFilename = input<string>('export.csv');
  /** Consumer-supplied .xlsx engine adapter. When set, the "Export Excel" button appears. @default null */
  readonly xlsxAdapter = input<XlsxAdapter | null>(null);
  /** Default download filename for `exportXlsx()`. @default 'export.xlsx' */
  readonly xlsxFilename = input<string>('export.xlsx');
  /** Consumer-supplied PDF engine adapter. When set, the "Export PDF" button appears. @default null */
  readonly pdfAdapter = input<PdfAdapter | null>(null);
  /** Default download filename for `exportPdf()`. @default 'export.pdf' */
  readonly pdfFilename = input<string>('export.pdf');
  /** Show the "Print" toolbar button (the `printGrid()` method is always callable). @default false */
  readonly printable = input<boolean>(false);
  /** Optional heading rendered above the print-only table. @default '' */
  readonly printTitle = input<string>('');
  /** Show the "Import CSV" toolbar button + hidden file input. @default false */
  readonly importable = input<boolean>(false);
  /** Enable paste-as-new-rows: native Ctrl/Cmd+V on the grid + a "Paste" toolbar button. @default false */
  readonly pasteable = input<boolean>(false);
  /** 'auto' emits parsed rows immediately; 'mapped' opens a column-mapping dialog first. @default 'auto' */
  readonly importMode = input<'auto' | 'mapped'>('auto');
  /** Optional Web Worker client (from createGridWorkerClient). When set, large CSV/paste parses run off-thread. @default null */
  readonly gridWorker = input<GridWorkerClient | null>(null);
  /** Minimum text length (chars) to offload parsing to `gridWorker`; shorter text parses synchronously. @default 100000 */
  readonly workerParseThreshold = input<number>(100_000);
  /** Emits the parsed + coerced rows after a CSV import; the consumer merges them into `data`. */
  readonly imported = output<T[]>();
  protected readonly importDialogOpen = signal(false);
  private readonly importMatrix = signal<string[][]>([]);
  protected readonly importMapping = signal<(string | null)[]>([]);
  protected readonly importHeaders = computed(() => this.importMatrix()[0] ?? []);
  protected readonly importPreview = computed(() => this.importMatrix().slice(1, 6));
  /**
   * Fixed row height (px) used for virtual windowing math. When `null` (default),
   * it tracks the active `density` tier via {@link effectiveRowHeight} so the
   * windowing math matches the rendered CSS height. Set a number to pin it.
   * @default null (density-derived)
   */
  readonly rowHeight = input<number | null>(null);
  /** Data strategy. 'client' (default) | 'server' (paginated) | 'infinite' (streamed). */
  readonly rowModel = input<'client' | 'server' | 'infinite'>('client');
  /** Infinite strategy when rowModel='infinite'. @default 'blocks' */
  readonly infiniteMode = input<'blocks' | 'append'>('blocks');
  /** Fixed block size for server/infinite fetches. @default 100 */
  readonly blockSize = input<number>(100);
  /** Extra blocks fetched beyond the viewport on each side. @default 1 */
  readonly overscanBlocks = input<number>(1);
  /** Group rows by these column keys, in order (client mode). @default [] */
  readonly groupBy = model<(keyof T)[]>([]);
  /** Render hierarchical rows using `treeChildren`. @default false */
  readonly treeData = input<boolean>(false);
  /** Children accessor for tree-data; return null/undefined for a leaf. */
  readonly treeChildren = input<(row: T) => T[] | null | undefined>(() => null);
  /** Master-detail panel template, rendered full-width when a row is expanded. */
  readonly detailTemplate = input<TemplateRef<{ $implicit: T }> | null>(null);
  /** Max tree depth (0-based; 3 ⇒ 4 levels). @default 3 */
  readonly treeMaxLevel = input<number>(3);
  /** Whether a fetched row has children (shows a toggle) in server tree mode. @default ()=>false */
  readonly hasChildren = input<(row: T) => boolean>(() => false);
  readonly rowId = input<(row: T) => RowId>((row) => row['id'] as RowId);
  readonly selected = model<RowId[]>([]);
  /** When true, `selected` is the EXCLUDE list against every row matching the current filter/sort
   * (i.e. "all rows selected except these"), rather than the include list. @default false */
  readonly allSelected = model<boolean>(false);
  readonly rowClick = output<T>();
  readonly queryChange = output<GridQuery<T>>();
  readonly fetchError = output<unknown>();
  readonly cellEdit = output<{ row: T; col: GridColumnDef<T>; oldValue: unknown; newValue: unknown }>();
  readonly save = output<CellEdit[]>();

  protected readonly state = new GridState<T>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  /** Screen-reader announcement for sort/filter/selection/row-count (aria-live region). */
  protected readonly announcement = signal('');
  /** Skip initial-state announcements until after the first render settles. */
  private liveReady = false;
  private filterAnnounceTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly FILTER_ANNOUNCE_MS = 300;

  private announce(message: string): void {
    // Toggle a trailing space so an identical consecutive message still re-announces.
    this.announcement.set(this.announcement() === message ? `${message} ` : message);
  }

  protected readonly vp = viewChild<ElementRef<HTMLElement>>('vp');
  private readonly scrollTop = signal(0);
  private readonly viewportSize = signal(0);
  private readonly scrollLeft = signal(0);
  private readonly viewportWidthPx = signal(0);
  private readonly containerWidth = signal(0);

  private readonly result = signal<GridPage<T>>({ rows: [], total: 0 });

  // Infinite-mode state (block cache + append buffer).
  protected readonly blocks = signal<Map<number, T[]>>(new Map());
  private readonly serverTotal = signal(0);
  protected readonly loaded = signal<T[]>([]);
  protected readonly hasMore = signal(true);
  protected readonly fetching = signal(false);
  private readonly inflight = new Set<number>();

  // Server-grouping (lazy) state.
  protected readonly serverNodes = signal<ServerNode<T>[]>([]);
  private readonly serverGrandTotals = signal<Record<string, number> | null>(null);
  private readonly inflightGroups = new Set<string>();

  private readonly source = computed<GridDataSource<T>>(() => {
    const provided = this.dataSource();
    if (provided) return provided;
    return new ClientDataSource<T>(this.data() ?? [], this.columns());
  });

  protected readonly hasGroupSource = computed(() => typeof this.source().getGroupRows === 'function');
  protected readonly isServerGrouped = computed(
    () => this.rowModel() === 'server' && this.groupBy().length > 0 && this.hasGroupSource()
  );

  // Server-tree (lazy) state.
  protected readonly lazyTreeNodes = signal<LazyNode<T>[]>([]);
  private readonly inflightTree = new Set<string>();
  protected readonly isServerTree = computed(
    () => this.treeData() && this.rowModel() === 'server' && typeof this.source().getTreeChildren === 'function'
  );

  /** Query identity excluding the row window — drives invalidation and block fetches. */
  protected readonly dataQuery = computed(() => ({
    sort: this.state.sort(),
    search: this.state.search(),
    columnFilters: this.state.columnFilters(),
    filterModel: this.state.filterModel(),
  }));

  private readonly query = computed<GridQuery<T>>(() => {
    const ps = this.pageSize();
    const page = this.state.page();
    const start = ps > 0 ? page * ps : 0;
    const end = ps > 0 ? start + ps : Number.MAX_SAFE_INTEGER;
    return {
      startRow: start,
      endRow: end,
      sort: this.state.sort(),
      search: this.state.search(),
      columnFilters: this.state.columnFilters(),
      filterModel: this.state.filterModel(),
    };
  });

  private sub: Subscription | null = null;

  constructor() {
    effect(() => {
      const q = this.query();
      this.queryChange.emit(q);
      if (this.rowModel() === 'infinite') return; // infinite uses the block/append effects
      if (this.isServerGrouped()) return; // server grouping uses the group fetch effect
      if (this.isServerTree()) return; // server tree uses the tree fetch effect
      const src = this.source();
      this.sub?.unsubscribe();
      this.sub = src
        .getRows(q)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((page) => this.result.set(page));
    });

    // Polite live-region: sort / filter / selection. Skip the first pass so mount
    // does not spam; debounce text filters so keystrokes don't announce per char.
    afterNextRender(() => {
      queueMicrotask(() => { this.liveReady = true; });
    });
    this.destroyRef.onDestroy(() => {
      if (this.filterAnnounceTimer != null) clearTimeout(this.filterAnnounceTimer);
    });
    effect(() => {
      this.state.sort();
      untracked(() => {
        if (!this.liveReady) return;
        this.announce(this.sortAnnouncement());
      });
    });
    effect(() => {
      this.state.search();
      this.state.columnFilters();
      this.state.filterModel();
      untracked(() => {
        if (!this.liveReady) return;
        if (this.filterAnnounceTimer != null) clearTimeout(this.filterAnnounceTimer);
        this.filterAnnounceTimer = setTimeout(() => {
          this.filterAnnounceTimer = null;
          this.announce(this.filterAnnouncement());
        }, AxDataGridComponent.FILTER_ANNOUNCE_MS);
      });
    });
    effect(() => {
      const selectable = this.selectable();
      const count = this.selectedCount();
      untracked(() => {
        if (!this.liveReady || !selectable) return;
        this.announce(count === 0 ? 'Selection cleared' : `${count} row${count === 1 ? '' : 's'} selected`);
      });
    });

    // Size the top/bottom spacer rows via CSS custom properties (hook-safe; no [style.*]).
    effect(() => {
      if (!this.useVirtual()) return;
      const rh = this.effectiveRowHeight();
      const r = this.viewRange();
      const total = this.renderTotal();
      const host = this.hostEl.nativeElement;
      this.renderer.setStyle(host, '--grid-pad-top', `${r.start * rh}px`, RendererStyleFlags2.DashCase);
      this.renderer.setStyle(host, '--grid-pad-bottom', `${Math.max(0, (total - r.end) * rh)}px`, RendererStyleFlags2.DashCase);
    });

    // Expose the intrinsic table width so `min-w-[var(--dg-table-w)]` drives horizontal overflow
    // when column-virtualized (hook-safe; no [style.*]).
    effect(() => {
      const host = this.hostEl.nativeElement;
      if (this.useColVirtual()) {
        this.renderer.setStyle(host, '--dg-table-w', `${this.tableWidthPx()}px`, RendererStyleFlags2.DashCase);
      } else {
        this.renderer.removeStyle(host, '--dg-table-w', RendererStyleFlags2.DashCase);
      }
    });

    // Seed the horizontal viewport width once so the first render can window columns.
    afterNextRender(() => {
      const el = this.vp()?.nativeElement;
      if (el) this.viewportWidthPx.set(el.clientWidth);
    });

    // Track host width for responsive card mode (browser-only; no SSR guard needed).
    afterNextRender(() => {
      const host = this.hostEl.nativeElement;
      this.containerWidth.set(host.clientWidth);
      const ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width;
        if (w != null) this.containerWidth.set(w);
      });
      ro.observe(host);
      this.destroyRef.onDestroy(() => ro.disconnect());
    });

    // Keep the focused center column visible under column virtualization (composes with 5a nav).
    effect(() => {
      if (!this.useColVirtual()) return;
      const pos = this.focusedCell();
      if (!pos) return;
      const centerStart = this.pinnedStartCols().length + this.selBias();
      const centerIdx = pos.col - centerStart;
      const widths = this.centerWidths();
      if (centerIdx < 0 || centerIdx >= widths.length) return; // selection/pinned col: no scroll
      const el = this.vp()?.nativeElement;
      if (!el) return;
      let left = 0;
      for (let i = 0; i < centerIdx; i++) left += widths[i] ?? 0;
      const right = left + (widths[centerIdx] ?? 0);
      untracked(() => {
        if (left < el.scrollLeft) el.scrollLeft = left;
        else if (right > el.scrollLeft + el.clientWidth) el.scrollLeft = right - el.clientWidth;
      });
    });

    // Infinite invalidation: reset caches and cancel in-flight when the query (minus window) changes.
    effect(() => {
      this.dataQuery();
      if (this.rowModel() !== 'infinite') return;
      this.sub?.unsubscribe();
      untracked(() => this.resetInfinite());
    });

    // Infinite-blocks fetch: pull missing blocks for the visible range.
    effect(() => {
      if (this.rowModel() !== 'infinite' || this.infiniteMode() !== 'blocks') return;
      const r = this.viewRange();
      const size = this.blockSize();
      const over = this.overscanBlocks() * size;
      const needed = blocksForRange(Math.max(0, r.start - over), r.end + over, size);
      // Read cache + in-flight WITHOUT subscribing, so writing blocks() doesn't re-trigger us.
      untracked(() => {
        const have = new Set<number>([...this.blocks().keys(), ...this.inflight]);
        for (const b of missingBlocks(needed, have)) this.fetchBlock(b);
      });
    });

    // Infinite-append: initial load (and reload after invalidation reset).
    effect(() => {
      if (this.rowModel() !== 'infinite' || this.infiniteMode() !== 'append') return;
      this.dataQuery(); // re-run when the query changes (after the invalidation reset)
      untracked(() => {
        if (this.loaded().length === 0 && this.hasMore()) this.appendNext();
      });
    });

    // Server grouping: fetch the top level (and refetch on query/groupBy change).
    effect(() => {
      this.dataQuery();
      this.groupBy();
      if (!this.isServerGrouped()) return;
      const src = this.source();
      untracked(() => {
        this.inflightGroups.clear();
        this.serverNodes.set([]);
        this.serverGrandTotals.set(null);
        this.fetching.set(true);
        const q: GridGroupQuery<T> = {
          ...this.dataQuery(), startRow: 0, endRow: 0, groupBy: this.groupBy(), groupKeys: [],
        };
        src.getGroupRows?.(q).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (page) => {
            this.fetching.set(false);
            if (page.kind === 'groups') {
              this.serverNodes.set(buildNodes(page.groups, [], 0));
              this.serverGrandTotals.set(page.grandTotals ?? null);
            }
          },
          error: (err) => { this.fetching.set(false); this.fetchError.emit(err); },
        });
      });
    });

    // Server tree: fetch roots (and refetch on query/treeData change).
    effect(() => {
      this.dataQuery();
      this.treeData();
      if (!this.isServerTree()) return;
      const src = this.source();
      untracked(() => {
        this.inflightTree.clear();
        this.lazyTreeNodes.set([]);
        this.fetching.set(true);
        const q: GridTreeQuery<T> = { ...this.dataQuery(), startRow: 0, endRow: 0, parent: null };
        src.getTreeChildren?.(q).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (page) => { this.fetching.set(false); this.lazyTreeNodes.set(buildLazyNodes(page.rows, 0)); },
          error: (err) => { this.fetching.set(false); this.fetchError.emit(err); },
        });
      });
    });

    // Pinned-column sticky offsets → host CSS variables (hook-safe; no [style.*]).
    effect(() => {
      const cols = this.resolvedColumns();
      const state = this.columnState();
      const def = this.defaultColWidth();
      const w = (c: GridColumnDef<T>): number => this.widthOf(c) ?? def;
      const host = this.hostEl.nativeElement;
      const startCols = cols.filter((c) => pinnedSideOf(c, state) === 'start');
      const endCols = cols.filter((c) => pinnedSideOf(c, state) === 'end');
      const base = this.selectable() && startCols.length > 0 ? 36 : 0;
      const startOffsets = cumulativeOffsets(startCols.map(w)).map((o) => o + base);
      for (let i = 0; i < MAX_PIN; i++) {
        this.renderer.setStyle(host, `--dg-pin-s-${i}`, `${startOffsets[i] ?? 0}px`, RendererStyleFlags2.DashCase);
      }
      const endWidths = endCols.map(w);
      for (let i = 0; i < MAX_PIN; i++) {
        let off = 0;
        for (let j = i + 1; j < endWidths.length; j++) off += endWidths[j] ?? 0;
        this.renderer.setStyle(host, `--dg-pin-e-${i}`, `${off}px`, RendererStyleFlags2.DashCase);
      }
    });

    // Keep the focused cell within bounds when the grid shape changes.
    effect(() => {
      const p = this.focusedCell();
      if (!p) return;
      const maxRow = this.navBodyCount() - 1;
      const maxCol = this.navColCount() - 1;
      if (p.row > maxRow || p.col > maxCol) {
        untracked(() => this.focusedCell.set({ row: Math.min(p.row, Math.max(maxRow, -1)), col: Math.min(p.col, Math.max(maxCol, 0)) }));
      }
    });

    // Focus the active editor input, or the focused cell, after render.
    afterRenderEffect(() => {
      if (this.activeEditCell() || this.activeEditRow()) {
        const el = this.hostEl.nativeElement.querySelector('[data-cell-editor]') as HTMLElement | null;
        el?.focus();
        return;
      }
      const p = this.focusedCell();
      if (!p) return;
      const el = this.hostEl.nativeElement.querySelector(`[data-focus-r="${p.row}"][data-focus-c="${p.col}"]`) as HTMLElement | null;
      el?.focus();
    });

    // Card-mode roving focus: move DOM focus to the active card once the user has navigated.
    afterRenderEffect(() => {
      if (!this.isCardMode() || !this.cardFocusActive()) return;
      const el = this.hostEl.nativeElement.querySelector(`[data-card][data-card-i="${this.cardFocus()}"]`) as HTMLElement | null;
      el?.focus();
    });
  }

  protected onVpScroll(): void {
    const el = this.vp()?.nativeElement;
    if (!el) return;
    this.scrollTop.set(el.scrollTop);
    this.viewportSize.set(el.clientHeight);
    this.scrollLeft.set(el.scrollLeft);
    this.viewportWidthPx.set(el.clientWidth);
    if (this.rowModel() === 'infinite' && this.infiniteMode() === 'append') {
      if (needsMore(el.scrollTop, el.clientHeight, this.effectiveRowHeight(), this.loaded().length, this.overscanBlocks() * this.blockSize())) {
        this.appendNext();
      }
    }
  }

  private resetInfinite(): void {
    this.inflight.clear();
    this.blocks.set(new Map());
    this.loaded.set([]);
    this.hasMore.set(true);
    this.serverTotal.set(0);
  }

  private fetchBlock(blockStart: number): void {
    if (this.inflight.has(blockStart)) return;
    this.inflight.add(blockStart);
    this.fetching.set(true);
    const q: GridQuery<T> = {
      ...this.dataQuery(),
      startRow: blockStart,
      endRow: blockStart + this.blockSize(),
    };
    this.source()
      .getRows(q)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pageResult) => {
          this.inflight.delete(blockStart);
          this.fetching.set(this.inflight.size > 0);
          this.serverTotal.set(pageResult.total);
          this.blocks.update((m) => {
            const next = new Map(m);
            next.set(blockStart, pageResult.rows);
            return next;
          });
        },
        error: (err) => {
          this.inflight.delete(blockStart);
          this.fetching.set(this.inflight.size > 0);
          this.fetchError.emit(err);
        },
      });
  }

  private appendNext(): void {
    if (this.fetching() || !this.hasMore()) return;
    const start = this.loaded().length;
    this.fetching.set(true);
    const q: GridQuery<T> = { ...this.dataQuery(), startRow: start, endRow: start + this.blockSize() };
    this.source()
      .getRows(q)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pageResult) => {
          this.fetching.set(false);
          this.serverTotal.set(pageResult.total);
          this.loaded.update((rows) => [...rows, ...pageResult.rows]);
          const total = pageResult.total;
          this.hasMore.set(
            pageResult.rows.length === this.blockSize() && (total === 0 || this.loaded().length < total)
          );
        },
        error: (err) => {
          this.fetching.set(false);
          this.fetchError.emit(err);
        },
      });
  }

  protected readonly rows = computed(() => this.result().rows);
  protected readonly total = computed(() => {
    if (this.rowModel() === 'infinite') {
      return this.infiniteMode() === 'append' ? this.loaded().length : this.serverTotal();
    }
    return this.result().total;
  });

  /** Whether the body renders a virtual windowed view (client virtual OR any infinite mode). */
  protected readonly useVirtual = computed(() => this.virtualScroll() || this.rowModel() === 'infinite');

  /** Non-infinite display rows: grouped (group+leaf) when groupBy set, else leaf-wrapped. */
  protected readonly displayRows = computed<DisplayRow<T>[]>(() => {
    if (this.isServerGrouped()) return flattenServer(this.serverNodes());
    if (this.isServerTree()) {
      return flattenLazy(this.lazyTreeNodes(), this.hasChildren(), this.rowId(), this.treeMaxLevel());
    }
    const gb = this.groupBy();
    if (this.rowModel() === 'client' && gb.length > 0) {
      const { groups } = groupRows(this.rows(), gb, this.columns());
      return flattenGroups(groups, this.state.collapsedGroups());
    }
    if (this.rowModel() === 'client' && this.treeData()) {
      const getChildren = this.treeChildren();
      const id = this.rowId();
      return flattenTree(this.rows(), getChildren, (r) => this.state.isRowExpanded(id(r)), this.treeMaxLevel())
        .map((t) => ({ kind: 'tree' as const, row: t.row, level: t.level, expandable: t.expandable }));
    }
    const detailTpl = this.detailTemplate();
    if (this.rowModel() === 'client' && detailTpl) {
      const id = this.rowId();
      const out: DisplayRow<T>[] = [];
      for (const row of this.rows()) {
        out.push({ kind: 'tree', row, level: 0, expandable: true });
        if (this.state.isRowExpanded(id(row))) out.push({ kind: 'detail', row });
      }
      return out;
    }
    return this.rows().map((row) => ({ kind: 'leaf', row }));
  });

  /** Row count the virtual viewport is sized to. */
  protected readonly renderTotal = computed(() => {
    if (this.rowModel() === 'infinite') {
      return this.infiniteMode() === 'append' ? this.loaded().length : this.serverTotal();
    }
    return this.displayRows().length;
  });

  protected readonly viewRange = computed(() =>
    computeRange(this.scrollTop(), this.viewportSize() || 400, this.effectiveRowHeight(), this.renderTotal(), 6)
  );

  /** Visible windowed slice — infinite-blocks yields raw rows (`undefined` placeholders); other
   *  modes yield `DisplayRow` entries. Unified to `(DisplayRow<T> | undefined)[]` for the template. */
  protected readonly viewRows = computed<(DisplayRow<T> | undefined)[]>(() => {
    if (this.rowModel() === 'infinite' && this.infiniteMode() === 'blocks') {
      const r = this.viewRange();
      return windowRows(this.blocks(), r.start, r.end, this.blockSize())
        .map((row) => (row ? { kind: 'leaf' as const, row } : undefined));
    }
    if (!this.useVirtual()) return this.displayRows();
    const r = this.viewRange();
    if (this.rowModel() === 'infinite') {
      return this.loaded().slice(r.start, r.end).map((row) => ({ kind: 'leaf' as const, row }));
    }
    return this.displayRows().slice(r.start, r.end);
  });

  protected readonly navRows = computed<T[]>(() =>
    this.viewRows().flatMap((entry) =>
      entry && (entry.kind === 'leaf' || entry.kind === 'tree') ? [entry.row] : []
    )
  );
  protected readonly navRowIds = computed(() => this.navRows().map((r) => this.rowId()(r)));
  private readonly navRowIndexMap = computed(() => {
    const m = new Map<RowId, number>();
    this.navRowIds().forEach((id, i) => m.set(id, i));
    return m;
  });

  protected readonly focusedCell = signal<FocusPos | null>(null);

  readonly columnMenu = input<boolean>(true);
  readonly contextMenu = input<boolean>(true);
  readonly contextMenuItems = input<((ctx: GridMenuContext<T>) => GridMenuItem[]) | null>(null);
  readonly menuAction = output<GridMenuActionEvent<T>>();
  protected readonly openMenu = signal<
    | { kind: 'column'; x: number; y: number; col: GridColumnDef<T> }
    | { kind: 'context'; x: number; y: number; row: T; col: GridColumnDef<T>; value: unknown }
    | null
  >(null);

  protected readonly menuItems = computed<GridMenuItem[]>(() => {
    const m = this.openMenu();
    if (!m) return [];
    if (m.kind === 'column') {
      const sorted = this.state.sort().find((s) => s.key === m.col.key);
      return columnMenuItems({
        sortDir: sorted ? sorted.dir : null,
        pinned: this.pinSideOf(m.col),
        filterable: !!m.col.filterable,
        hidable: this.resolvedColumns().length > 1,
      });
    }
    return this.contextMenuItemsFor(m.row, m.col, m.value);
  });

  private contextMenuItemsFor(row: T, col: GridColumnDef<T>, value: unknown): GridMenuItem[] {
    const builtIn: GridMenuItem[] = [
      { id: 'copy-cell', label: 'Copy cell' },
      { id: 'copy-row', label: 'Copy row' },
    ];
    const custom = this.contextMenuItems()?.({ row, col, value }) ?? [];
    if (custom.length > 0) return [...builtIn, { ...custom[0]!, separatorBefore: true }, ...custom.slice(1)];
    return builtIn;
  }

  private onContextMenuSelect(id: string, row: T, col: GridColumnDef<T>, value: unknown): void {
    if (id === 'copy-cell') {
      this.copyText(cellText(asText(value)));
    } else if (id === 'copy-row') {
      const cells = this.resolvedColumns().map((c) => asText(this.editedCellValue(row, c)));
      this.copyText(rowTsv(cells));
    }
    this.menuAction.emit({ id, row, col, value });
  }

  private copyText(text: string): void {
    // Best-effort: the async Clipboard API is present in browsers, absent in SSR/jsdom.
    const clip = (this.doc.defaultView as { navigator?: { clipboard?: { writeText(t: string): Promise<void> } } } | null)?.navigator?.clipboard;
    void clip?.writeText(text);
  }

  protected readonly selBias = computed(() => (this.selectable() ? 1 : 0));
  protected readonly navColCount = computed(() => this.selBias() + this.resolvedColumns().length);
  protected readonly navBodyCount = computed(() => this.navRows().length);
  // Header-area grid rows preceding the body: the column-header matrix plus the optional
  // per-column filter row (which is itself a role=row grid row for a contiguous index model).
  protected readonly headerRowSpan = computed(() => this.headerMatrix().length + (this.hasColumnFilters() ? 1 : 0));
  // Under virtual scroll / infinite the rendered rows are only a slice; the ARIA row model must
  // describe the *whole* dataset, so count the total (`renderTotal`) not the slice. Non-virtual
  // grids keep scrollTop=0 (viewRange().start=0) so this collapses to the plain body count.
  protected readonly ariaRowCount = computed(() =>
    this.headerRowSpan() + (this.useVirtual() ? this.renderTotal() : this.navBodyCount())
  );

  protected navRowIndexOf(row: T): number { return this.navRowIndexMap().get(this.rowId()(row)) ?? -1; }
  protected resolvedColForNavCol(navCol: number): GridColumnDef<T> | null {
    const dataIndex = navCol - this.selBias();
    return dataIndex >= 0 ? (this.resolvedColumns()[dataIndex] ?? null) : null; // null = the selection column
  }
  private toggleRowSelectionByKeyboard(row: T): void {
    this.selected.set([...toggleRow(this.selectedSet(), this.rowId()(row))]);
  }
  // `navRowIndexOf` is slice-local; add the virtual slice offset so the ARIA index is absolute
  // within the full dataset (offset is 0 for non-virtual grids). Body rows follow the header rows
  // and the optional filter row (`headerRowSpan`).
  protected ariaRowBodyIndex(row: T): number {
    return this.headerRowSpan() + this.viewRange().start + this.navRowIndexOf(row) + 1;
  }
  private firstFocusRow(): number { return this.navBodyCount() > 0 ? 0 : -1; }
  /** The focused cell, or the default (first) roving stop when nothing has been focused yet. */
  private currentOrFirstFocus(): FocusPos { return this.focusedCell() ?? { row: this.firstFocusRow(), col: 0 }; }
  protected isFocused(row: number, col: number): boolean {
    const p = this.focusedCell();
    return p ? p.row === row && p.col === col : row === this.firstFocusRow() && col === 0;
  }
  protected readonly editableColKeys = computed(() =>
    this.resolvedColumns().filter((c) => c.editable).map((c) => this.colKey(c))
  );

  /** Total rows available to render (drives empty-state detection). */
  protected readonly renderCount = computed(() =>
    this.rowModel() === 'infinite' ? this.renderTotal() : this.displayRows().length
  );

  protected readonly grandTotals = computed(() =>
    groupRows(this.rows(), this.groupBy(), this.columns()).grandTotals
  );
  protected readonly effectiveGrandTotals = computed(() =>
    this.isServerGrouped() ? (this.serverGrandTotals() ?? {}) : this.grandTotals()
  );
  protected readonly hasAggregation = computed(
    () => this.columns().some((c) => c.aggregation) || this.serverGrandTotals() !== null
  );
  protected readonly hasFooter = computed(
    () => this.hasAggregation() || this.resolvedColumns().some((c) => !!c.footerTemplate)
  );

  protected readonly pages = computed(() => {
    const ps = this.pageSize();
    return ps > 0 ? Math.max(1, Math.ceil(this.total() / ps)) : 1;
  });
  protected readonly selectedSet = computed(() => new Set(this.selected()));
  protected readonly visibleIds = computed(() => this.rows().map((r) => this.rowId()(r)));
  protected readonly headerState = computed(() => {
    const raw = selectionState(this.selectedSet(), this.visibleIds());
    if (!this.allSelected()) return raw;
    return raw === 'all' ? 'none' : raw === 'none' ? 'all' : 'some';
  });
  protected readonly selectedCount = computed(() =>
    this.allSelected() ? Math.max(0, this.total() - this.selected().length) : this.selected().length
  );
  protected readonly hasSelection = computed(() => this.selectable() && (this.allSelected() || this.selected().length > 0));
  protected readonly showSelectAllBanner = computed(() =>
    this.selectable() && !this.allSelected() && this.total() > this.visibleIds().length && this.headerState() === 'all'
  );
  protected readonly leafColumns = computed(() => flattenLeaves(this.columns()));
  protected readonly isGrouped = computed(() => this.columns().some((c) => isGroupCol(c)));
  protected readonly headerDepth = computed(() => treeDepth(this.columns()));
  protected readonly headerMatrix = computed<HeaderCell<T>[][]>(() =>
    this.isGrouped()
      ? headerRows(this.columns(), (k) => this.columnState().hidden.includes(k))
      : [this.resolvedColumns().map((col) => ({ col, colspan: 1, rowspan: 1, isGroup: false }))]
  );
  protected readonly resolvedColumns = computed(() =>
    this.isGrouped()
      ? this.leafColumns().filter((c) => !this.columnState().hidden.includes(this.colKey(c)))
      : resolveColumns(this.columns(), this.columnState())
  );
  protected readonly isCardMode = computed(() =>
    this.responsive() && this.containerWidth() > 0 && this.containerWidth() < this.mobileBreakpoint()
    && !this.isGrouped() && !this.treeData() && !this.isServerTree() && this.detailTemplate() == null
  );
  protected readonly cardColumns = computed(() => orderByPriority(this.resolvedColumns()));
  protected readonly cardBodyColumns = computed(() => this.cardColumns().slice(1));
  protected readonly cardRows = computed(() => this.navRows());
  protected cardTitleValue(row: T): unknown {
    const title = this.cardColumns()[0];
    return title ? this.editedCellValue(row, title) : '';
  }
  // Roving focus for card mode (mirrors the grid's roving-tabindex pattern, scaled to a list).
  protected readonly cardFocus = signal(0);
  private readonly cardFocusActive = signal(false);
  private readonly clampCardFocus = effect(() => {
    const n = this.cardRows().length;
    if (this.cardFocus() > n - 1) untracked(() => this.cardFocus.set(Math.max(0, n - 1)));
  });
  // Clear the latched focus flag when leaving card mode so re-entry needs fresh interaction.
  private readonly resetCardFocusOnExit = effect(() => {
    if (!this.isCardMode()) untracked(() => this.cardFocusActive.set(false));
  });
  protected onCardKeydown(event: KeyboardEvent, index: number): void {
    event.stopPropagation();
    const rows = this.cardRows();
    const clamp = (n: number): number => Math.min(Math.max(n, 0), rows.length - 1);
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); this.cardFocusActive.set(true); this.cardFocus.set(clamp(index + 1)); break;
      case 'ArrowUp': event.preventDefault(); this.cardFocusActive.set(true); this.cardFocus.set(clamp(index - 1)); break;
      case 'Home': event.preventDefault(); this.cardFocusActive.set(true); this.cardFocus.set(0); break;
      case 'End': event.preventDefault(); this.cardFocusActive.set(true); this.cardFocus.set(clamp(rows.length - 1)); break;
      case ' ':
      case 'Spacebar': { event.preventDefault(); const r = rows[index]; if (r) this.toggleRowSelectionByKeyboard(r); break; }
      case 'Enter': { const r = rows[index]; if (r) this.rowClick.emit(r); break; }
      default: break;
    }
  }
  protected readonly hasColumnFilters = computed(() => this.resolvedColumns().some((c) => c.filterable));
  private readonly totalFlex = computed(() => this.resolvedColumns().reduce((n, c) => n + (c.flex ?? 0), 0));

  private readonly pinSlotMap = computed(() => {
    const m = new Map<string, { side: PinSide; slot: number }>();
    for (const p of pinnedSlots(this.resolvedColumns(), this.columnState())) m.set(p.key, { side: p.side, slot: p.slot });
    return m;
  });
  protected readonly hasStartPin = computed(() =>
    this.resolvedColumns().some((c) => pinnedSideOf(c, this.columnState()) === 'start')
  );

  protected pinSideOf(col: GridColumnDef<T>): PinSide | null {
    return pinnedSideOf(col, this.columnState()) ?? null;
  }

  // ── Virtual columns (5c) ─────────────────────────────────────────────────
  /** Column virtualization is off while grouped headers are present (their spans can't window). */
  protected readonly useColVirtual = computed(() => this.virtualColumns() && !this.isGrouped());

  private readonly pinnedStartCols = computed(() => this.resolvedColumns().filter((c) => this.pinSideOf(c) === 'start'));
  protected readonly centerCols = computed(() => this.resolvedColumns().filter((c) => this.pinSideOf(c) === null));
  private readonly pinnedEndCols = computed(() => this.resolvedColumns().filter((c) => this.pinSideOf(c) === 'end'));

  private colVirtWidth(col: GridColumnDef<T>): number {
    return this.widthOf(col) ?? col.width ?? this.defaultColWidth();
  }
  private readonly centerWidths = computed(() => this.centerCols().map((c) => this.colVirtWidth(c)));

  protected readonly colRange = computed<ColumnRange>(() =>
    this.useColVirtual()
      ? columnRange(this.scrollLeft(), this.viewportWidthPx() || 800, this.centerWidths(), this.colOverscan())
      : { start: 0, end: this.centerCols().length, leftPad: 0, rightPad: 0 }
  );
  protected readonly renderCenterCols = computed(() => {
    const r = this.colRange();
    return this.centerCols().slice(r.start, r.end);
  });

  /** Ordered render layout consumed by every row loop: pinned-start, left spacer, windowed
   *  center, right spacer, pinned-end. Non-virtual → all columns in order, no spacers. */
  protected readonly layoutColumns = computed<ColLayoutItem<T>[]>(() => {
    // Non-virtual: mirror the source of truth exactly (flat AND grouped, incl. pinned leaves under
    // a group) so header/body order and colindex are byte-identical.
    if (!this.useColVirtual()) return this.resolvedColumns().map((col) => ({ kind: 'col', col }));
    const items: ColLayoutItem<T>[] = this.pinnedStartCols().map((col) => ({ kind: 'col', col }));
    const r = this.colRange();
    if (r.leftPad > 0) items.push({ kind: 'spacer', width: r.leftPad });
    for (const col of this.renderCenterCols()) items.push({ kind: 'col', col });
    if (r.rightPad > 0) items.push({ kind: 'spacer', width: r.rightPad });
    for (const col of this.pinnedEndCols()) items.push({ kind: 'col', col });
    return items;
  });

  // Logical (all-columns) index — keeps aria-colindex / roving data-focus-c correct under windowing.
  private readonly colIndexMap = computed(() => {
    const m = new Map<string, number>();
    this.resolvedColumns().forEach((c, i) => m.set(this.colKey(c), i));
    return m;
  });
  protected colLogicalIndex(col: GridColumnDef<T>): number { return this.colIndexMap().get(this.colKey(col)) ?? 0; }

  /** Intrinsic table width (px) used for `--dg-table-w` when column-virtualized (selection col is 36px). */
  protected readonly tableWidthPx = computed(() =>
    (this.selectable() ? 36 : 0) + this.resolvedColumns().reduce((n, c) => n + this.colVirtWidth(c), 0)
  );
  protected pinClass(col: GridColumnDef<T>): string {
    const p = this.pinSlotMap().get(this.colKey(col));
    if (!p || p.slot >= MAX_PIN) return '';
    return (p.side === 'start' ? PIN_START_CLASSES[p.slot] : PIN_END_CLASSES[p.slot]) ?? '';
  }
  protected selClass(): string {
    return this.hasStartPin() ? 'sticky z-20 bg-background start-0' : '';
  }
  protected headerClass(col: GridColumnDef<T>): string {
    const base = this.pinClass(col);
    return this.stickyHeader() ? base + ' sticky top-0 z-20 bg-background' : base;
  }
  protected stickyHeaderClass(): string {
    return this.stickyHeader() ? 'sticky top-0 z-20 bg-background' : '';
  }
  protected bodyCellClass(col: GridColumnDef<T>, row: T): string {
    const base = this.pinClass(col);
    const extra = col.cellClass?.(row, this.editedCellValue(row, col)) ?? '';
    const dirty = editedValue(this.state.edits(), this.rowId()(row), this.colKey(col)) !== undefined
      ? ' border-s-2 border-warning'
      : '';
    return (extra ? base + ' ' + extra : base) + dirty;
  }
  protected editedCellValue(row: T, col: GridColumnDef<T>): unknown {
    const v = editedValue(this.state.edits(), this.rowId()(row), this.colKey(col));
    return v === undefined ? cellValue(row, col) : v;
  }
  protected rowClassOf(row: T): string { return this.rowClass()?.(row) ?? ''; }

  protected readonly activeEditCell = signal<{ rowId: RowId; colKey: string } | null>(null);
  protected readonly editDraft = signal<unknown>(null);
  protected readonly editError = signal<string | null>(null);

  protected readonly activeEditRow = signal<RowId | null>(null);
  protected readonly rowDrafts = signal<ReadonlyMap<string, unknown>>(new Map());
  protected readonly rowErrors = signal<ReadonlyMap<string, string>>(new Map());

  protected isEditingCell(row: T, col: GridColumnDef<T>): boolean {
    if (this.editMode() === 'row') {
      return !!col.editable && this.activeEditRow() === this.rowId()(row);
    }
    const cell = this.activeEditCell();
    return !!cell && cell.rowId === this.rowId()(row) && cell.colKey === this.colKey(col);
  }

  protected startEdit(row: T, col: GridColumnDef<T>): void {
    if (!col.editable) return;
    if (this.editMode() === 'row') {
      const drafts = new Map<string, unknown>();
      for (const c of this.resolvedColumns()) {
        if (c.editable) drafts.set(this.colKey(c), this.editedCellValue(row, c));
      }
      this.rowDrafts.set(drafts);
      this.rowErrors.set(new Map());
      this.activeEditRow.set(this.rowId()(row));
      return;
    }
    const rowId = this.rowId()(row);
    const colKey = this.colKey(col);
    const pending = editedValue(this.state.edits(), rowId, colKey);
    this.editDraft.set(pending === undefined ? cellValue(row, col) : pending);
    this.editError.set(null);
    this.activeEditCell.set({ rowId, colKey });
  }

  protected saveRow(row: T): void {
    const editable = this.resolvedColumns().filter((c) => c.editable);
    const errors = validateRowDrafts(editable, row, this.rowDrafts(), (c) => this.colKey(c));
    if (errors.size > 0) { this.rowErrors.set(errors); return; }
    for (const { colKey, value } of rowCommitEntries(editable, this.rowDrafts(), (c) => this.colKey(c))) {
      const col = this.colFromKey(colKey);
      if (col && value !== this.editedCellValue(row, col)) this.applyCommittedCell(row, col, value);
    }
    this.activeEditRow.set(null);
    this.rowDrafts.set(new Map());
    this.rowErrors.set(new Map());
  }
  protected cancelRow(): void {
    this.activeEditRow.set(null);
    this.rowDrafts.set(new Map());
    this.rowErrors.set(new Map());
  }
  protected focusSiblingEditor(_row: T, _col: GridColumnDef<T>, direction: 1 | -1): void {
    const inputs = Array.from(
      this.hostEl.nativeElement.querySelectorAll('[data-cell-editor]')
    ) as HTMLElement[];
    if (inputs.length === 0) return;
    const active = this.hostEl.nativeElement.ownerDocument.activeElement as HTMLElement | null;
    const idx = active ? inputs.indexOf(active) : -1;
    const nextIdx = idx === -1 ? 0 : (idx + direction + inputs.length) % inputs.length;
    inputs[nextIdx]?.focus();
  }

  protected commitEdit(row: T, col: GridColumnDef<T>): void { this.tryCommitEdit(row, col); }

  private rowFromNav(rowIndex: number): T | undefined { return this.navRows()[rowIndex]; }
  private colFromKey(colKey: string): GridColumnDef<T> | undefined {
    return this.resolvedColumns().find((c) => this.colKey(c) === colKey);
  }
  protected moveEdit(row: T, col: GridColumnDef<T>, direction: 1 | -1): void {
    if (!this.tryCommitEdit(row, col)) return;
    const rows = this.navRowIds();
    const rowIndex = rows.indexOf(this.rowId()(row));
    if (rowIndex === -1) { this.activeEditCell.set(null); return; }
    const current = { rowIndex, colKey: this.colKey(col) };
    const target = direction === 1
      ? nextEditableCell(rows, this.editableColKeys(), current)
      : prevEditableCell(rows, this.editableColKeys(), current);
    if (!target) { this.activeEditCell.set(null); return; }
    const targetRow = this.rowFromNav(target.rowIndex);
    const targetCol = this.colFromKey(target.colKey);
    if (targetRow && targetCol) this.startEdit(targetRow, targetCol);
    else this.activeEditCell.set(null);
  }

  private applyCommittedCell(row: T, col: GridColumnDef<T>, value: unknown): void {
    const rowId = this.rowId()(row);
    const colKey = this.colKey(col);
    const pending = editedValue(this.state.edits(), rowId, colKey);
    const oldValue = pending === undefined ? cellValue(row, col) : pending;
    this.state.setEdit(rowId, colKey, value);
    this.cellEdit.emit({ row, col, oldValue, newValue: value });
    if (this.saveMode() === 'auto') {
      this.save.emit([{ rowId, colKey, value }]);
      this.state.clearEdit(rowId, colKey);
    } else {
      this.state.pushHistory({ rowId, colKey, before: pending, after: value });
    }
  }

  private tryCommitEdit(row: T, col: GridColumnDef<T>): boolean {
    if (this.editMode() === 'row') return false;
    let value = this.editDraft();
    if (col.filterType === 'number' && typeof value === 'string') {
      value = this.coerceNumeric(value);
    }
    const err = validateCell(col, value, row);
    this.editError.set(err);
    if (err) return false;
    this.activeEditCell.set(null);
    this.applyCommittedCell(row, col, value);
    return true;
  }
  protected cancelEdit(): void {
    this.activeEditCell.set(null);
    this.editError.set(null);
  }

  protected onEditorBlur(row: T, col: GridColumnDef<T>): void {
    if (this.isEditingCell(row, col)) this.commitEdit(row, col);
  }

  protected readonly hasDirtyEdits = computed(() => this.state.edits().size > 0);
  protected readonly dirtyCount = computed(() => this.state.edits().size);

  protected readonly canUndo = computed(() => this.saveMode() === 'manual' && historyCanUndo(this.state.history()));
  protected readonly canRedo = computed(() => this.saveMode() === 'manual' && historyCanRedo(this.state.history()));

  protected undoEdit(): void { if (this.canUndo()) this.state.applyUndo(); }
  protected redoEdit(): void { if (this.canRedo()) this.state.applyRedo(); }

  protected saveAll(): void {
    const batch = [...this.state.edits().values()];
    if (batch.length > 0) this.save.emit(batch);
  }
  protected discardAll(): void {
    this.state.clearAllEdits();
    this.state.resetHistory();
  }

  clearSavedEdits(saved: CellEdit[]): void {
    this.state.clearSavedEdits(saved);
  }

  protected cellEditValue(col: GridColumnDef<T>): unknown {
    return this.editMode() === 'row' ? this.rowDrafts().get(this.colKey(col)) : this.editDraft();
  }
  protected cellEditError(col: GridColumnDef<T>): string | null {
    return this.editMode() === 'row' ? (this.rowErrors().get(this.colKey(col)) ?? null) : this.editError();
  }
  protected editorInputType(col: GridColumnDef<T>): 'text' | 'number' | 'date' {
    return col.filterType === 'number' ? 'number' : col.filterType === 'date' ? 'date' : 'text';
  }
  protected asEditString(value: unknown): string {
    return asText(value);
  }
  private coerceNumeric(raw: string): unknown {
    const n = Number(raw);
    return raw === '' || Number.isNaN(n) ? raw : n;
  }
  protected onEditorInput(col: GridColumnDef<T>, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = col.filterType === 'number' ? this.coerceNumeric(raw) : raw;
    if (this.editMode() === 'row') {
      const next = new Map(this.rowDrafts());
      next.set(this.colKey(col), value);
      this.rowDrafts.set(next);
    } else {
      this.editDraft.set(value);
    }
  }
  protected onEditorChange = (value: unknown): void => {
    this.editDraft.set(value);
  };

  protected readonly sortPanelOpen = signal(false);
  protected readonly filterPanelOpen = signal(false);
  protected readonly columnPanelOpen = signal(false);
  protected readonly activeFilterCount = computed(() => countConditions(this.state.filterModel()));

  /** Effective toolbar affordance visibility (preset + overrides). */
  protected readonly resolvedToolbar = computed(() => resolveToolbar(this.toolbarPreset(), this.toolbar()));
  /** Density tiers offered by the built-in density toggle (tightest → loosest). */
  protected readonly densityOptions = DENSITY_ORDER;
  /** Row height (px) for virtual windowing: explicit `rowHeight`, else the density tier. */
  protected readonly effectiveRowHeight = computed(() => this.rowHeight() ?? densityRowHeight(this.density()));
  /** Open position of the `⋯` overflow menu, or null when closed. */
  protected readonly overflowMenu = signal<{ x: number; y: number } | null>(null);
  /** Data I/O actions collapsed into the `⋯` menu when `toolbar.overflow` is on. */
  protected readonly overflowItems = computed<GridMenuItem[]>(() => {
    const t = this.resolvedToolbar();
    const items: GridMenuItem[] = [];
    if (this.exportable() && t.export) {
      items.push({ id: 'export-csv', label: 'Export CSV' });
      items.push({ id: 'export-copy', label: 'Copy' });
    }
    if (this.xlsxAdapter() && t.export) items.push({ id: 'export-xlsx', label: 'Export Excel' });
    if (this.xlsxAdapter() && t.import) items.push({ id: 'import-xlsx', label: 'Import Excel' });
    if (this.pdfAdapter() && t.export) items.push({ id: 'export-pdf', label: 'Export PDF' });
    if (this.printable() && t.print) items.push({ id: 'print', label: 'Print' });
    if (this.importable() && t.import) items.push({ id: 'import-csv', label: 'Import CSV' });
    if (this.pasteable() && t.paste) items.push({ id: 'paste', label: 'Paste' });
    return items;
  });
  private readonly csvImportInput = viewChild<ElementRef<HTMLInputElement>>('importFileInput');
  private readonly xlsxImportInput = viewChild<ElementRef<HTMLInputElement>>('importXlsxInput');
  /** Whether the top toolbar row should render at all (any visible action or banner). */
  protected readonly showToolbarRow = computed(() => {
    const t = this.resolvedToolbar();
    return (
      t.sort || t.filters || t.group || t.columns || t.density ||
      (this.exportable() && t.export) ||
      (!!this.xlsxAdapter() && (t.export || t.import)) ||
      (!!this.pdfAdapter() && t.export) ||
      (this.printable() && t.print) ||
      (this.importable() && t.import) ||
      (this.pasteable() && t.paste) ||
      this.hasSelection() || this.hasDirtyEdits()
    );
  });

  protected readonly cellValue = cellValue;
  protected readonly asText = asText;

  // ── Export (6a) ──────────────────────────────────────────────────────────
  private exportQuery(): GridQuery<T> {
    return { ...this.query(), startRow: 0, endRow: Number.MAX_SAFE_INTEGER };
  }
  /** All filtered+sorted rows (client: full query; server/infinite: currently loaded). */
  private allExportRows(): T[] {
    if (this.rowModel() === 'client') {
      let out: T[] = [];
      this.source().getRows(this.exportQuery()).subscribe((page) => (out = page.rows)); // ClientDataSource is synchronous
      return out;
    }
    const loaded = this.loaded();
    return loaded.length > this.rows().length ? loaded : this.rows();
  }
  private resolveExportRows(scope: ExportScope): T[] {
    switch (scope) {
      case 'page': return this.navRows();
      case 'selected': return this.allExportRows().filter((r) => this.isSelected(r));
      case 'all': return this.allExportRows();
      case 'auto': return this.hasSelection() ? this.allExportRows().filter((r) => this.isSelected(r)) : this.allExportRows();
    }
  }
  private buildExportMatrix(scope: ExportScope): string[][] {
    const cols = this.resolvedColumns();
    const header = cols.map((c) => c.header);
    const body = this.resolveExportRows(scope).map((row) => cols.map((c) => this.asText(this.editedCellValue(row, c))));
    return [header, ...body];
  }
  /** The grid's data serialized as CSV (header + rows for the given scope; default `auto`). */
  toCsv(opts?: { scope?: ExportScope }): string {
    return toDelimited(this.buildExportMatrix(opts?.scope ?? 'auto'), ',');
  }

  // ── Print (6b) ───────────────────────────────────────────────────────────
  protected readonly printing = signal(false);
  /** Full filtered+sorted dataset, materialized only while printing. */
  protected readonly printRows = computed(() => (this.printing() ? this.resolveExportRows('all') : []));
  /** Print all filtered+sorted rows via the print-only table + the browser print dialog. */
  printGrid(): void {
    const view = this.doc.defaultView;
    if (!view) return; // SSR / no browser
    this.printing.set(true);
    afterNextRender(() => {
      view.print();
      this.printing.set(false);
    }, { injector: this.injector });
  }

  // ── Import (6c) ──────────────────────────────────────────────────────────
  /** Parse CSV/TSV text, map+coerce it against the visible columns, and emit via (imported). */
  /** Shared ingest path: open the mapping dialog in 'mapped' mode, else emit rows immediately. */
  private ingestMatrix(matrix: string[][]): void {
    if (this.importMode() === 'mapped' && matrix.length > 0) {
      this.importMatrix.set(matrix);
      this.importMapping.set(autoGuessMapping(matrix[0] ?? [], this.resolvedColumns()));
      this.importDialogOpen.set(true);
      return;
    }
    this.imported.emit(mapImportedRows(matrix, this.resolvedColumns()));
  }
  /** Parse `text` then ingest: offload to the worker when set and text is large, else parse synchronously. */
  private parseThenIngest(text: string, delimiter: string): void {
    const worker = this.gridWorker();
    if (worker && text.length >= this.workerParseThreshold()) {
      void worker.parse(text, delimiter).then((matrix) => this.ingestMatrix(matrix)).catch(() => undefined);
    } else {
      this.ingestMatrix(parseDelimited(text, delimiter));
    }
  }
  importCsv(text: string): void { this.parseThenIngest(text, ','); }
  /** Parse pasted clipboard text (delimiter sniffed: TSV from Excel/Sheets, else CSV) as new rows. */
  pasteData(text: string): void { this.parseThenIngest(text, sniffDelimiter(text)); }
  /** The focused cell as a fill anchor, or null if it isn't a body cell in an editable column. */
  private fillAnchor(): { rowIndex: number; colIndex: number } | null {
    const pos = this.focusedCell();
    if (!pos || pos.row < 0) return null;
    const colIndex = pos.col - this.selBias();
    if (colIndex < 0) return null;
    const col = this.resolvedColumns()[colIndex];
    if (!col || !col.editable) return null;
    if (this.navRows()[pos.row] === undefined) return null;
    return { rowIndex: pos.row, colIndex };
  }

  /** Batched fill: coerce + validate each target, skip invalid, write the overlay, and push ONE
   *  history step (manual) or ONE save batch (auto) — mirrors applyCommittedCell, batched.
   *  Note: paste coerces via coerceCsvValue (number/date/boolean, per the CSV-import lineage), so a
   *  pasted value may coerce differently than the same text typed into the cell editor (number-only). */
  private applyFillCells(targets: FillTarget<T>[]): void {
    const rows = this.navRows();
    const deltas: EditDelta[] = [];
    const saved: { rowId: RowId; colKey: string; value: unknown }[] = [];
    for (const t of targets) {
      const row = rows[t.rowIndex];
      if (row === undefined) continue;
      const value = coerceCsvValue(t.raw, t.col);
      if (validateCell(t.col, value, row)) continue;
      const rowId = this.rowId()(row);
      const colKey = this.colKey(t.col);
      const pending = editedValue(this.state.edits(), rowId, colKey);
      const oldValue = pending === undefined ? cellValue(row, t.col) : pending;
      this.state.setEdit(rowId, colKey, value);
      this.cellEdit.emit({ row, col: t.col, oldValue, newValue: value });
      deltas.push({ rowId, colKey, before: pending, after: value });
      saved.push({ rowId, colKey, value });
    }
    if (deltas.length === 0) return;
    if (this.saveMode() === 'auto') {
      this.save.emit(saved);
      for (const s of saved) this.state.clearEdit(s.rowId, s.colKey);
    } else {
      this.state.pushHistoryBatch(deltas);
    }
  }

  /** Route a paste: fill the focused editable cell block, else paste as new rows (6d-i). */
  private dispatchPaste(text: string): void {
    const anchor = this.fillAnchor();
    if (anchor) {
      this.applyFillCells(planFill(parseDelimited(text, sniffDelimiter(text)), anchor, this.resolvedColumns(), this.navRows().length));
    } else {
      this.pasteData(text);
    }
  }
  /** Toolbar Paste: read the clipboard via the async API (permission-prompted), then ingest as rows. */
  protected pasteFromClipboard(): void {
    const clip = (this.doc.defaultView as
      { navigator?: { clipboard?: { readText?(): Promise<string> } } } | null)?.navigator?.clipboard;
    void clip?.readText?.().then((text) => { if (text) this.pasteData(text); }).catch(() => undefined);
  }
  /** Native paste on the grid host: ingest as new rows, unless the paste targets an editable
   *  field (cell editor, search box, column filter, …) — then let the native input paste win. */
  protected onPaste(event: ClipboardEvent): void {
    if (!this.pasteable()) return;
    if (this.activeEditCell() !== null || this.activeEditRow() !== null) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable]')) return;
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (!text) return;
    event.preventDefault();
    this.dispatchPaste(text);
  }
  protected onImportConfirm(mapping: (string | null)[]): void {
    this.imported.emit(buildRowsFromMapping(this.importMatrix(), mapping, this.resolvedColumns()));
    this.closeImportDialog();
  }
  protected closeImportDialog(): void {
    this.importDialogOpen.set(false);
    this.importMatrix.set([]);
    this.importMapping.set([]);
  }
  /** Read a file as text and import it. */
  importFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => { const t = reader.result; if (typeof t === 'string') this.importCsv(t); };
    reader.readAsText(file);
  }
  protected onImportFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.importFile(file);
    input.value = ''; // allow re-picking the same file
  }
  /** Download the grid data as a CSV file (BOM on by default for Excel). */
  exportCsv(opts?: CsvExportOptions): void {
    const view = this.doc.defaultView;
    if (!view) return; // SSR / no browser
    const csv = ((opts?.bom ?? true) ? BOM : '') + this.toCsv(opts);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = this.doc.createElement('a');
    a.href = url;
    a.download = opts?.filename ?? this.exportFilename();
    a.click();
    URL.revokeObjectURL(url);
  }
  /** Download the grid data as a real .xlsx workbook via the consumer-supplied adapter (no-op if none).
   *  The adapter may be sync (SheetJS) or async (ExcelJS) — the download runs once its bytes resolve. */
  exportXlsx(opts?: { scope?: ExportScope; filename?: string; sheetName?: string; adapter?: XlsxAdapter }): void {
    const adapter = opts?.adapter ?? this.xlsxAdapter();
    const view = this.doc.defaultView;
    if (!adapter || !view) return; // no engine, or SSR
    const cols = this.resolvedColumns();
    const rows = this.resolveExportRows(opts?.scope ?? 'auto');
    const sheet = buildSheet(rows, cols, opts?.sheetName ?? 'Sheet1', (row, col) => this.editedCellValue(row, col));
    const filename = opts?.filename ?? this.xlsxFilename();
    void Promise.resolve(adapter.toWorkbook([sheet])).then((bytes) => {
      const url = URL.createObjectURL(new Blob([bytes],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = this.doc.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  /** Download the grid data as a PDF via the consumer-supplied adapter (no-op if none).
   *  The adapter may be sync (jsPDF) or async (pdfmake) — the download runs once its bytes resolve. */
  exportPdf(opts?: { scope?: ExportScope; filename?: string; adapter?: PdfAdapter }): void {
    const adapter = opts?.adapter ?? this.pdfAdapter();
    const view = this.doc.defaultView;
    if (!adapter || !view) return; // no engine, or SSR
    const pdfDoc = toPdfDocument(this.buildExportMatrix(opts?.scope ?? 'auto'));
    const filename = opts?.filename ?? this.pdfFilename();
    void Promise.resolve(adapter.toPdf(pdfDoc)).then((bytes) => {
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = this.doc.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }).catch(() => undefined); // a failing PDF engine fails silently rather than throwing unhandled
  }
  private readonly xlsxSheets = signal<XlsxSheet[]>([]);
  protected readonly sheetPickerOpen = signal(false);
  protected readonly sheetNames = computed(() => this.xlsxSheets().map((s) => s.name));
  /** Import an .xlsx file via the adapter: one sheet ingests directly, multiple open the sheet picker. */
  importXlsx(file: File, opts?: { adapter?: XlsxAdapter }): void {
    const adapter = opts?.adapter ?? this.xlsxAdapter();
    if (!adapter) return;
    void Promise.resolve(file.arrayBuffer())
      .then((buf) => adapter.fromWorkbook(buf))
      .then((sheets) => {
        if (sheets.length === 0) return;
        if (sheets.length === 1) { this.ingestMatrix(sheetToMatrix(sheets[0]!)); return; }
        this.xlsxSheets.set(sheets);
        this.sheetPickerOpen.set(true);
      })
      .catch(() => undefined); // a corrupt/unreadable workbook fails silently rather than throwing unhandled
  }
  protected onSheetPick(index: number): void {
    const sheet = this.xlsxSheets()[index];
    if (sheet) this.ingestMatrix(sheetToMatrix(sheet));
    this.closeSheetPicker();
  }
  protected closeSheetPicker(): void {
    this.sheetPickerOpen.set(false);
    this.xlsxSheets.set([]);
  }
  protected onImportXlsxFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.importXlsx(file);
    input.value = ''; // allow re-picking the same file
  }
  /** Copy the grid data to the clipboard (TSV by default, so it pastes as columns). */
  copyToClipboard(opts?: ClipboardExportOptions): void {
    this.copyText(toDelimited(this.buildExportMatrix(opts?.scope ?? 'auto'), opts?.delimiter ?? '\t'));
  }

  protected indentLevels(level: number): number[] {
    return Array.from({ length: level }, (_, i) => i);
  }
  protected aggLabel(node: GroupNode<T>, col: GridColumnDef<T>): string {
    const v = node.aggregates[this.colKey(col)];
    return v === undefined ? '' : String(v);
  }
  protected grandTotalLabel(col: GridColumnDef<T>): string {
    const v = this.effectiveGrandTotals()[this.colKey(col)];
    return v === undefined ? '' : String(v);
  }
  protected isGroupExpanded(groupId: string): boolean {
    if (this.isServerGrouped()) return !!this.findServerNode(groupId)?.expanded;
    return !this.state.isCollapsed(groupId);
  }

  private findServerNode(groupId: string): ServerNode<T> | undefined {
    const search = (list: ServerNode<T>[]): ServerNode<T> | undefined => {
      for (const n of list) {
        if (n.groupId === groupId) return n;
        if (n.children) {
          const f = search(n.children);
          if (f) return f;
        }
      }
      return undefined;
    };
    return search(this.serverNodes());
  }

  protected isRowOpen(row: T): boolean {
    if (this.isServerTree()) return !!findLazy(this.lazyTreeNodes(), this.rowId()(row), this.rowId())?.expanded;
    return this.state.isRowExpanded(this.rowId()(row));
  }

  private dragKey: string | null = null;
  private selectionAnchor: RowId | null = null;

  protected onColDragStart(col: GridColumnDef<T>, event: DragEvent): void {
    this.dragKey = this.colKey(col);
    event.dataTransfer?.setData('text/plain', this.dragKey);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }
  protected onColDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }
  protected onColDrop(col: GridColumnDef<T>): void {
    if (this.dragKey === null) return;
    const order = moveColumn(effectiveOrder(this.columns(), this.columnState()), this.dragKey, this.colKey(col));
    this.columnState.set({ ...this.columnState(), order });
    this.dragKey = null;
  }
  protected onColDragEnd(): void {
    this.dragKey = null;
  }

  protected onToggleRow(row: T): void {
    if (!this.isServerTree()) {
      this.state.toggleRowExpand(this.rowId()(row));
      return;
    }
    const id = this.rowId();
    const node = findLazy(this.lazyTreeNodes(), id(row), id);
    if (!node) return;
    const willExpand = !node.expanded;
    this.lazyTreeNodes.update((nodes) => setLazyAt(nodes, id(row), id, { expanded: willExpand }));
    if (willExpand && !node.children && !this.inflightTree.has(String(id(row)))) {
      this.fetchTreeChildren(node);
    }
  }

  private fetchTreeChildren(node: LazyNode<T>): void {
    const id = this.rowId();
    const key = String(id(node.row));
    this.inflightTree.add(key);
    this.lazyTreeNodes.update((nodes) => setLazyAt(nodes, id(node.row), id, { loading: true }));
    const q: GridTreeQuery<T> = { ...this.dataQuery(), startRow: 0, endRow: 0, parent: node.row };
    this.source().getTreeChildren?.(q).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.inflightTree.delete(key);
        this.lazyTreeNodes.update((nodes) =>
          setLazyAt(nodes, id(node.row), id, { loading: false, children: buildLazyNodes(page.rows, node.level + 1) })
        );
      },
      error: (err) => {
        this.inflightTree.delete(key);
        this.lazyTreeNodes.update((nodes) => setLazyAt(nodes, id(node.row), id, { loading: false }));
        this.fetchError.emit(err);
      },
    });
  }

  protected onToggleGroup(node: GroupNode<T>): void {
    if (!this.isServerGrouped()) {
      this.state.toggleGroup(node.groupId);
      return;
    }
    const sn = this.findServerNode(node.groupId);
    if (!sn) return;
    const willExpand = !sn.expanded;
    this.serverNodes.update((nodes) => setNodeAt(nodes, sn.path, { expanded: willExpand }));
    if (willExpand && !sn.children && !sn.leaves && !this.inflightGroups.has(sn.groupId)) {
      this.fetchGroupChildren(sn);
    }
  }

  private fetchGroupChildren(node: ServerNode<T>): void {
    this.inflightGroups.add(node.groupId);
    this.serverNodes.update((nodes) => setNodeAt(nodes, node.path, { loading: true }));
    const q: GridGroupQuery<T> = {
      ...this.dataQuery(), startRow: 0, endRow: 0, groupBy: this.groupBy(), groupKeys: node.path,
    };
    this.source().getGroupRows?.(q).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.inflightGroups.delete(node.groupId);
        this.serverNodes.update((nodes) =>
          page.kind === 'groups'
            ? setNodeAt(nodes, node.path, { loading: false, children: buildNodes(page.groups, node.path, node.level + 1) })
            : setNodeAt(nodes, node.path, { loading: false, leaves: page.rows })
        );
      },
      error: (err) => {
        this.inflightGroups.delete(node.groupId);
        this.serverNodes.update((nodes) => setNodeAt(nodes, node.path, { loading: false }));
        this.fetchError.emit(err);
      },
    });
  }

  private resizeKey: string | null = null;
  private startX = 0;
  private startWidth = 0;

  protected colKey(col: GridColumnDef<T>): string { return String(col.key); }
  protected headerCellKey(cell: { col: GridColumnDef<T>; isGroup: boolean }): string {
    return (cell.isGroup ? 'g:' : 'l:') + this.colKey(cell.col);
  }
  protected colSpan(): number { return this.resolvedColumns().length + (this.selectable() ? 1 : 0); }
  protected widthOf(col: GridColumnDef<T>): number | null {
    const raw = this.state.widths()[this.colKey(col)] ?? col.width ?? null;
    return raw == null ? null : clampWidth(raw, col.minWidth ?? this.minColumnWidth(), col.maxWidth);
  }
  protected colWidthAttr(col: GridColumnDef<T>): string | number | null {
    // Column virtualization needs deterministic px widths so the rendered column matches the
    // spacer/pad math (flex percentages are inert in this mode).
    if (this.useColVirtual()) return this.colVirtWidth(col);
    const explicit = this.widthOf(col);
    if (explicit != null) return explicit;
    const flex = col.flex ?? 0;
    const total = this.totalFlex();
    if (flex > 0 && total > 0) return Math.round((flex / total) * 100) + '%';
    return null;
  }
  protected isSelected(row: T): boolean {
    const id = this.rowId()(row);
    return this.allSelected() ? !this.selectedSet().has(id) : this.selectedSet().has(id);
  }

  protected sortDir(col: GridColumnDef<T>): 'asc' | 'desc' | null {
    const s = this.state.sort();
    const first = s[0];
    return first && s.length === 1 && first.key === col.key ? first.dir : null;
  }
  protected ariaSort(col: GridColumnDef<T>): 'ascending' | 'descending' | 'none' {
    const dir = this.sortDir(col);
    return dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none';
  }

  protected onSearch(event: Event): void {
    this.state.setSearch((event.target as HTMLInputElement).value);
  }
  protected onColumnFilter(col: GridColumnDef<T>, event: Event): void {
    this.state.setColumnFilter(this.colKey(col), (event.target as HTMLInputElement).value);
  }
  protected toggleSort(col: GridColumnDef<T>, additive = false): void {
    if (col.sortable) this.state.toggleSort(col.key, additive);
  }

  /** Concise sort summary for the aria-live region. */
  private sortAnnouncement(): string {
    const sorts = this.state.sort();
    if (sorts.length === 0) return 'Sort cleared';
    const cols = this.columns();
    const parts = sorts.map((s) => {
      const col = cols.find((c) => c.key === s.key);
      const label = col?.header ?? String(s.key);
      return `${label} ${s.dir === 'asc' ? 'ascending' : 'descending'}`;
    });
    return `Sorted by ${parts.join(', ')}`;
  }

  /** Concise filter + visible row count for the aria-live region. */
  private filterAnnouncement(): string {
    const hasSearch = this.state.search().trim().length > 0;
    const hasColFilters = Object.values(this.state.columnFilters()).some((v) => String(v).trim().length > 0);
    const hasModel = this.activeFilterCount() > 0;
    const n = this.total();
    const rows = `${n} row${n === 1 ? '' : 's'}`;
    if (!hasSearch && !hasColFilters && !hasModel) return `Filters cleared. Showing ${rows}.`;
    return `Filter applied. Showing ${rows}.`;
  }

  protected openColumnMenu(col: GridColumnDef<T>, event: MouseEvent): void {
    if (!this.columnMenu()) return;
    event.preventDefault();
    event.stopPropagation();
    this.openMenu.set({ kind: 'column', x: event.clientX, y: event.clientY, col });
  }

  protected openContextMenu(row: T, col: GridColumnDef<T>, event: MouseEvent): void {
    if (!this.contextMenu()) return;
    event.preventDefault();
    event.stopPropagation();
    this.openMenu.set({ kind: 'context', x: event.clientX, y: event.clientY, row, col, value: this.editedCellValue(row, col) });
  }

  protected openOverflowMenu(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.overflowMenu.set({ x: rect.left, y: rect.bottom });
  }

  protected onOverflowSelect(id: string): void {
    this.overflowMenu.set(null);
    switch (id) {
      case 'export-csv': this.exportCsv(); break;
      case 'export-copy': this.copyToClipboard(); break;
      case 'export-xlsx': this.exportXlsx(); break;
      case 'import-xlsx': this.xlsxImportInput()?.nativeElement.click(); break;
      case 'export-pdf': this.exportPdf(); break;
      case 'print': this.printGrid(); break;
      case 'import-csv': this.csvImportInput()?.nativeElement.click(); break;
      case 'paste': this.pasteFromClipboard(); break;
      default: break;
    }
  }

  protected onMenuSelect(id: string): void {
    const m = this.openMenu();
    if (!m) return;
    if (m.kind === 'column') this.onColumnMenuSelect(id, m.col);
    else this.onContextMenuSelect(id, m.row, m.col, m.value);
    this.openMenu.set(null);
  }

  private onColumnMenuSelect(id: string, col: GridColumnDef<T>): void {
    switch (id) {
      case 'sort-asc': if (col.sortable) this.state.setColumnSort(col.key, 'asc'); break;
      case 'sort-desc': if (col.sortable) this.state.setColumnSort(col.key, 'desc'); break;
      case 'sort-clear': this.state.removeSort(col.key); break;
      case 'pin-start': this.setColumnPin(col, 'start'); break;
      case 'pin-end': this.setColumnPin(col, 'end'); break;
      case 'unpin': this.setColumnPin(col, this.pinSideOf(col)); break;
      case 'hide': this.columnState.set({ ...this.columnState(), hidden: toggleHidden(this.columnState().hidden, this.colKey(col)) }); break;
      case 'reset-width': this.state.clearWidth(this.colKey(col)); break;
      case 'filter': this.focusColumnFilter(col); break;
      default: break;
    }
  }

  private setColumnPin(col: GridColumnDef<T>, side: PinSide | null): void {
    if (!side) return;
    this.columnState.set({ ...this.columnState(), pinned: togglePin(this.columnState().pinned, this.colKey(col), side) });
  }

  private focusColumnFilter(col: GridColumnDef<T>): void {
    const host = this.hostEl.nativeElement as HTMLElement;
    const input = host.querySelector<HTMLInputElement>(`[data-col-filter="${this.colKey(col)}"]`);
    input?.focus();
  }

  protected sortPriority(col: GridColumnDef<T>): number | null {
    const s = this.state.sort();
    if (s.length < 2) return null;
    const i = s.findIndex((x) => x.key === col.key);
    return i === -1 ? null : i + 1;
  }

  protected onRowCheckboxClick(row: T, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation(); // don't let a card checkbox click bubble to the card's (click)=rowClick
    const id = this.rowId()(row);
    if (event.shiftKey && this.selectionAnchor !== null) {
      this.selected.set([...applyRange(this.selectedSet(), this.visibleIds(), this.selectionAnchor, id, !this.allSelected())]);
    } else {
      this.selected.set([...toggleRow(this.selectedSet(), id)]);
      this.selectionAnchor = id;
    }
  }
  protected toggleAllSelection(): void {
    if (this.allSelected()) {
      this.allSelected.set(false);
      this.selected.set([]);
      return;
    }
    this.selected.set([...toggleAll(this.selectedSet(), this.visibleIds())]);
  }
  protected selectAllMatching(): void {
    this.allSelected.set(true);
    this.selected.set([]);
    this.selectionAnchor = null;
  }
  protected clearSelection(): void {
    this.allSelected.set(false);
    this.selected.set([]);
  }
  private navKeyFor(event: KeyboardEvent): NavKey | null {
    const ctrl = event.ctrlKey || event.metaKey;
    switch (event.key) {
      case 'ArrowUp': return 'up';
      case 'ArrowDown': return 'down';
      case 'ArrowLeft': return 'left';
      case 'ArrowRight': return 'right';
      case 'Home': return ctrl ? 'ctrl-home' : 'home';
      case 'End': return ctrl ? 'ctrl-end' : 'end';
      case 'PageUp': return 'pageup';
      case 'PageDown': return 'pagedown';
      default: return null;
    }
  }
  protected onGridKeydown(event: KeyboardEvent): void {
    if (this.isCardMode()) return; // card mode has its own roving-list keyboard
    if (this.activeEditCell() === null && this.activeEditRow() === null) {
      const navKey = this.navKeyFor(event);
      if (navKey) {
        event.preventDefault();
        const current = this.currentOrFirstFocus();
        this.focusedCell.set(moveFocus(current, navKey, {
          bodyCount: this.navBodyCount(),
          colCount: this.navColCount(),
          pageRows: Math.max(1, this.viewRows().length - 1),
        }));
        return;
      }
    }
    if (this.activeEditCell() === null && this.activeEditRow() === null) {
      const pos = this.currentOrFirstFocus();
      const col = this.resolvedColForNavCol(pos.col);
      if (event.key === 'Enter' || event.key === 'F2') {
        if (pos.row === -1) {
          if (col?.sortable) { event.preventDefault(); this.toggleSort(col, event.shiftKey); return; }
        } else {
          const row = this.navRows()[pos.row];
          if (row && col?.editable) { event.preventDefault(); this.startEdit(row, col); return; }
        }
      }
      if (event.key === ' ' || event.key === 'Spacebar') {
        // Swallow Space's native page-scroll whenever a grid cell is focused; toggle selection
        // only on the selection column (row checkbox, or select-all on the header row).
        event.preventDefault();
        if (col === null) {
          if (pos.row === -1) this.toggleAllSelection();
          else { const row = this.navRows()[pos.row]; if (row) this.toggleRowSelectionByKeyboard(row); }
        }
        return;
      }
    }
    if (this.activeEditCell() === null && this.saveMode() === 'manual' && (event.ctrlKey || event.metaKey)) {
      const k = event.key.toLowerCase();
      if (k === 'z' && !event.shiftKey) { event.preventDefault(); this.undoEdit(); return; }
      if ((k === 'z' && event.shiftKey) || k === 'y') { event.preventDefault(); this.redoEdit(); return; }
    }
    if (!this.selectable()) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.selectAllMatching();
      return;
    }
    if (event.key === 'Escape' && this.hasSelection()) {
      this.clearSelection();
    }
  }

  protected first(): void { this.state.page.set(0); }
  protected prev(): void { this.state.page.update((p) => Math.max(0, p - 1)); }
  protected next(): void { this.state.page.update((p) => Math.min(this.pages() - 1, p + 1)); }
  protected last(): void { this.state.page.set(this.pages() - 1); }

  protected onResizeStart(col: GridColumnDef<T>, event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const handle = event.target as HTMLElement;
    this.resizeKey = this.colKey(col);
    this.startX = event.clientX;
    this.startWidth = this.widthOf(col) ?? handle.parentElement?.offsetWidth ?? this.minColumnWidth();
    handle.setPointerCapture?.(event.pointerId);
  }
  protected onResizeMove(event: PointerEvent): void {
    if (this.resizeKey === null) return;
    const col = this.resolvedColumns().find((c) => this.colKey(c) === this.resizeKey);
    const next = clampWidth(
      this.startWidth + (event.clientX - this.startX),
      col?.minWidth ?? this.minColumnWidth(),
      col?.maxWidth,
    );
    this.state.setWidth(this.resizeKey, next);
  }
  protected onResizeEnd(): void { this.resizeKey = null; }
  protected onResizeReset(col: GridColumnDef<T>): void { this.state.clearWidth(this.colKey(col)); }
}

function countConditions<T>(group: FilterGroup<T> | null): number {
  if (!group) return 0;
  let n = 0;
  const walk = (nodes: FilterNode<T>[]): void => {
    for (const node of nodes) {
      if (node.kind === 'group') walk(node.children);
      else n++;
    }
  };
  walk(group.children);
  return n;
}
