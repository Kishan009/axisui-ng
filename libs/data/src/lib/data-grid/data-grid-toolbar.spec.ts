import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AxDataGridComponent } from './data-grid.component';
import { type Density, type GridColumnDef } from './grid-core';
import { type GridToolbarConfig, type GridToolbarPreset } from './toolbar-config';

interface Row extends Record<string, unknown> { id: number; name: string; age: number; }
const COLS: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name', sortable: true, filterable: true },
  { key: 'age', header: 'Age', sortable: true, align: 'end' },
];
const ROWS: Row[] = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
];

@Component({
  standalone: true,
  imports: [AxDataGridComponent],
  template: `
    <ax-data-grid
      [columns]="cols"
      [data]="rows"
      [searchable]="searchable()"
      [exportable]="exportable()"
      [toolbarPreset]="preset()"
      [toolbar]="overrides()"
      [(density)]="density"
      [rowHeight]="rowHeight()"
    />
  `,
})
class ToolbarHost {
  cols = COLS;
  rows = ROWS;
  searchable = signal(true);
  exportable = signal(true);
  preset = signal<GridToolbarPreset>('full');
  overrides = signal<Partial<GridToolbarConfig>>({});
  density = signal<Density>('comfortable');
  rowHeight = signal<number | null>(null);
}

function setup(configure?: (h: ToolbarHost) => void) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [ToolbarHost] });
  const fixture = TestBed.createComponent(ToolbarHost);
  if (configure) configure(fixture.componentInstance);
  fixture.detectChanges();
  return fixture;
}

const q = (fx: ReturnType<typeof setup>, sel: string) => fx.nativeElement.querySelector(sel);
const has = (fx: ReturnType<typeof setup>, sel: string) => q(fx, sel) !== null;

describe('AxDataGrid toolbar config', () => {
  it('full preset (default) renders every core panel — back-compat', () => {
    const fx = setup();
    expect(has(fx, '[data-toolbar-sort]')).toBe(true);
    expect(has(fx, '[data-toolbar-filters]')).toBe(true);
    expect(has(fx, '[data-toolbar-columns]')).toBe(true);
    expect(has(fx, 'ax-data-grid-group-panel')).toBe(true);
    expect(has(fx, 'input[type="search"]')).toBe(true);
  });

  it('none preset hides the whole toolbar row', () => {
    const fx = setup((h) => h.preset.set('none'));
    expect(has(fx, '[data-toolbar-sort]')).toBe(false);
    expect(has(fx, '[data-toolbar-filters]')).toBe(false);
    expect(has(fx, '[data-toolbar-columns]')).toBe(false);
    expect(has(fx, 'ax-data-grid-group-panel')).toBe(false);
    expect(has(fx, 'input[type="search"]')).toBe(false);
    expect(has(fx, '[data-grid-toolbar]')).toBe(false);
  });

  it('minimal preset keeps sort + search, drops filters/group/columns', () => {
    const fx = setup((h) => h.preset.set('minimal'));
    expect(has(fx, '[data-toolbar-sort]')).toBe(true);
    expect(has(fx, 'input[type="search"]')).toBe(true);
    expect(has(fx, '[data-toolbar-filters]')).toBe(false);
    expect(has(fx, '[data-toolbar-columns]')).toBe(false);
    expect(has(fx, 'ax-data-grid-group-panel')).toBe(false);
  });

  it('overrides win over the preset', () => {
    const fx = setup((h) => { h.preset.set('none'); h.overrides.set({ columns: true }); });
    expect(has(fx, '[data-toolbar-columns]')).toBe(true);
    expect(has(fx, '[data-toolbar-sort]')).toBe(false);
  });

  it('toolbar config ANDs with the feature input: search off in config hides it even when searchable', () => {
    const fx = setup((h) => { h.searchable.set(true); h.overrides.set({ search: false }); });
    expect(has(fx, 'input[type="search"]')).toBe(false);
  });

  it('export button requires both exportable() and toolbar.export', () => {
    const shown = setup((h) => { h.exportable.set(true); });
    expect(has(shown, '[data-export-csv]')).toBe(true);
    const hidden = setup((h) => { h.exportable.set(true); h.overrides.set({ export: false }); });
    expect(has(hidden, '[data-export-csv]')).toBe(false);
  });
});

describe('AxDataGrid density toggle', () => {
  const options = (fx: ReturnType<typeof setup>) =>
    Array.from(fx.nativeElement.querySelectorAll('[data-density-option]')) as HTMLButtonElement[];
  const withToggle = (h: ToolbarHost) => h.overrides.set({ density: true });

  it('is hidden by default (opt-in) even under the full preset', () => {
    expect(options(setup()).length).toBe(0);
  });

  it('renders one control per density tier when enabled', () => {
    const opts = options(setup(withToggle));
    expect(opts.map((b) => b.getAttribute('data-value'))).toEqual(['dense', 'compact', 'comfortable', 'spacious']);
  });

  it('marks the active tier via aria-pressed', () => {
    const fx = setup((h) => { withToggle(h); h.density.set('compact'); });
    const active = options(fx).filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(active.map((b) => b.getAttribute('data-value'))).toEqual(['compact']);
  });

  it('clicking a tier updates the density model and reflects data-density on the grid', () => {
    const fx = setup(withToggle);
    options(fx).find((b) => b.getAttribute('data-value') === 'dense')!.click();
    fx.detectChanges();
    expect(fx.componentInstance.density()).toBe('dense');
    expect(fx.nativeElement.querySelector('ax-data-grid').getAttribute('data-density')).toBe('dense');
  });

  it('minimal preset opts the density toggle in', () => {
    expect(options(setup((h) => h.preset.set('minimal'))).length).toBe(4);
  });
});

describe('AxDataGrid density → virtual-scroll row height', () => {
  const grid = (fx: ReturnType<typeof setup>) =>
    fx.debugElement.query((el) => el.componentInstance instanceof AxDataGridComponent)
      .componentInstance as InstanceType<typeof AxDataGridComponent<Row>> & { effectiveRowHeight: () => number };

  it('derives the row height from the active density when rowHeight is unset', () => {
    const fx = setup((h) => h.density.set('dense'));
    expect(grid(fx).effectiveRowHeight()).toBe(28);
    fx.componentInstance.density.set('spacious');
    fx.detectChanges();
    expect(grid(fx).effectiveRowHeight()).toBe(64);
  });

  it('an explicit rowHeight overrides the density-derived height', () => {
    const fx = setup((h) => { h.density.set('dense'); h.rowHeight.set(50); });
    expect(grid(fx).effectiveRowHeight()).toBe(50);
  });
});

describe('AxDataGrid overflow menu', () => {
  it('inline layout (overflow off) keeps export inline and shows no kebab', () => {
    const fx = setup((h) => h.exportable.set(true)); // full preset → overflow false
    expect(has(fx, '[data-export-csv]')).toBe(true);
    expect(has(fx, '[data-toolbar-overflow]')).toBe(false);
  });

  it('overflow on moves export out of the inline row and into the ⋯ menu', () => {
    const fx = setup((h) => { h.exportable.set(true); h.overrides.set({ overflow: true }); });
    expect(has(fx, '[data-export-csv]')).toBe(false);
    const kebab = q(fx, '[data-toolbar-overflow]') as HTMLButtonElement;
    expect(kebab).not.toBeNull();
    kebab.click(); fx.detectChanges();
    expect(has(fx, '[data-menu-item="export-csv"]')).toBe(true);
  });

  it('kebab is absent when no secondary actions are enabled', () => {
    const fx = setup((h) => { h.exportable.set(false); h.overrides.set({ overflow: true }); });
    expect(has(fx, '[data-toolbar-overflow]')).toBe(false);
  });

  it('overflow does not swallow the primary view panels', () => {
    const fx = setup((h) => h.overrides.set({ overflow: true }));
    expect(has(fx, '[data-toolbar-sort]')).toBe(true);
    expect(has(fx, '[data-toolbar-filters]')).toBe(true);
    expect(has(fx, '[data-toolbar-columns]')).toBe(true);
  });
});
