import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AxStatRowComponent, type StatItem } from '@axisui-ng/blocks';
import { AxButtonComponent } from '@axisui-ng/buttons';
import {
  AxDataGridComponent,
  type GridColumnDef,
  type RowId,
} from '@axisui-ng/data';
import { AxAlertComponent } from '@axisui-ng/feedback';
import {
  AxBreadcrumbComponent,
  AxBreadcrumbItemComponent,
} from '@axisui-ng/navigation';
import { AxClusterDirective, AxStackDirective } from '@axisui-ng/primitives';

import { DemoLayoutService } from '../../layout/layout.service';

interface InventoryRow extends Record<string, unknown> {
  id: number;
  sku: string;
  product: string;
  category: string;
  warehouse: string;
  stock: number;
  reorder: number;
  unitCost: number;
  status: string;
}

const CATEGORIES = ['Electronics', 'Apparel', 'Home', 'Outdoor', 'Office'] as const;
const WAREHOUSES = ['NA-East', 'NA-West', 'EU-Central', 'APAC'] as const;

function buildInventoryRows(count: number): InventoryRow[] {
  return Array.from({ length: count }, (_, i) => {
    const stock = 5 + ((i * 17) % 120);
    const reorder = 10 + (i % 25);
    const category = CATEGORIES[i % CATEGORIES.length] ?? 'Electronics';
    const warehouse = WAREHOUSES[i % WAREHOUSES.length] ?? 'NA-East';
    return {
      id: i + 1,
      sku: `SKU-${String(1000 + i).padStart(4, '0')}`,
      product: `Product ${String.fromCharCode(65 + (i % 26))}-${i + 1}`,
      category,
      warehouse,
      stock,
      reorder,
      unitCost: 12 + (i % 40) * 2.5,
      status:
        i % 13 === 0
          ? 'Discontinued'
          : stock === 0
            ? 'Out'
            : stock <= reorder
              ? 'Low'
              : 'In stock',
    };
  });
}

const INVENTORY = buildInventoryRows(36);

const GRID_COLUMNS: GridColumnDef<InventoryRow>[] = [
  { key: 'sku', header: 'SKU', sortable: true, filterable: true, width: 120 },
  { key: 'product', header: 'Product', sortable: true, filterable: true, flex: 2 },
  { key: 'category', header: 'Category', sortable: true, filterable: true },
  { key: 'warehouse', header: 'Warehouse', sortable: true, filterable: true },
  { key: 'stock', header: 'Stock', sortable: true, align: 'end', filterable: true },
  { key: 'reorder', header: 'Reorder pt.', sortable: true, align: 'end' },
  {
    key: 'unitCost',
    header: 'Unit cost',
    sortable: true,
    align: 'end',
    valueGetter: (row) => `$${row.unitCost.toFixed(2)}`,
  },
  { key: 'status', header: 'Status', sortable: true, filterable: true, width: 130 },
];

@Component({
  selector: 'demo-data-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxDataGridComponent,
    AxStatRowComponent,
    AxAlertComponent,
    AxButtonComponent,
    AxBreadcrumbComponent,
    AxBreadcrumbItemComponent,
    AxStackDirective,
    AxClusterDirective,
  ],
  template: `
    <div axStack gap="6">
      <ax-breadcrumb>
        <ax-breadcrumb-item><span>Demo</span></ax-breadcrumb-item>
        <ax-breadcrumb-item [current]="true">Data grid</ax-breadcrumb-item>
      </ax-breadcrumb>

      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div class="max-w-2xl">
          <h2 class="text-2xl font-semibold tracking-tight text-foreground">Data grid</h2>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Enterprise <code class="text-xs">ax-data-grid</code> — sort, filter, select, resize, and
            export on mock inventory data.
          </p>
        </div>
        <div axCluster gap="2">
          <ax-button variant="outline" size="sm" (clickEvent)="loading.set(!loading())">
            {{ loading() ? 'Hide loading' : 'Show loading' }}
          </ax-button>
          <ax-button variant="outline" size="sm" (clickEvent)="toggleDensity()">
            Density: {{ gridDensity() }}
          </ax-button>
        </div>
      </div>

      <ax-alert variant="info">
        Use toolbar Sort / Filters / Columns. Shift-click checkboxes to range-select. Toggle density
        to reflow row chrome via Theme tokens.
      </ax-alert>

      <div class="demo-surface demo-tabular p-4">
        <ax-stat-row ariaLabel="Inventory metrics" [stats]="stats" [columns]="4" />
      </div>

      @if (selectionSummary(); as summary) {
        <div
          class="demo-surface flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 px-4 py-3"
          role="status"
          aria-live="polite"
        >
          <div axCluster gap="4" class="text-sm">
            <span class="font-medium text-foreground"
              >{{ summary.count }} row{{ summary.count === 1 ? '' : 's' }} selected</span
            >
            <span class="text-muted-foreground">
              Units: <strong class="text-foreground">{{ summary.units }}</strong>
            </span>
            <span class="text-muted-foreground">
              Value: <strong class="text-foreground">{{ summary.valueLabel }}</strong>
            </span>
          </div>
          <ax-button variant="outline" size="sm" (clickEvent)="selected.set([])">
            Clear selection
          </ax-button>
        </div>
      }

      <div class="demo-surface overflow-x-auto p-2 sm:p-4">
        <ax-data-grid
          class="block w-full min-w-[64rem]"
          [columns]="cols"
          [data]="rows"
          [searchable]="true"
          [selectable]="true"
          [exportable]="true"
          [pageSize]="10"
          [loading]="loading()"
          [stickyHeader]="true"
          [density]="gridDensity()"
          [(selected)]="selected"
        />
      </div>
    </div>
  `,
})
export class DataGridPageComponent {
  readonly layout = inject(DemoLayoutService);

  readonly loading = signal(false);
  /** Writable signal — two-way bind to grid selection (same pattern as unit-test host). */
  readonly selected = signal<RowId[]>([]);

  readonly cols = GRID_COLUMNS;
  readonly rows = INVENTORY;

  readonly gridDensity = computed(() =>
    this.layout.density() === 'compact' ? 'compact' : 'comfortable',
  );

  readonly selectionSummary = computed(() => {
    const ids = this.selected();
    if (!ids.length) return null;
    const idSet = new Set(ids);
    const picked = this.rows.filter((r) => idSet.has(r.id));
    const units = picked.reduce((sum, r) => sum + r.stock, 0);
    const value = picked.reduce((sum, r) => sum + r.stock * r.unitCost, 0);
    return {
      count: picked.length,
      units,
      valueLabel: `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    };
  });

  readonly stats: StatItem[] = [
    { label: 'SKUs', value: INVENTORY.length, trend: 4 },
    { label: 'Low stock', value: INVENTORY.filter((r) => r.status === 'Low').length, trend: -2 },
    { label: 'Units on hand', value: INVENTORY.reduce((s, r) => s + r.stock, 0), trend: 6 },
    {
      label: 'Inventory value',
      value: Math.round(INVENTORY.reduce((s, r) => s + r.stock * r.unitCost, 0) / 1000),
      suffix: 'k',
      prefix: '$',
      trend: 3,
    },
  ];

  toggleDensity(): void {
    this.layout.setDensity(this.layout.density() === 'compact' ? 'comfortable' : 'compact');
  }
}
