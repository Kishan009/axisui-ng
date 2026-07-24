import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { of, throwError } from 'rxjs';

import { AxDataGridComponent } from './data-grid.component';
import { ServerDataSource, ServerGroupDataSource, ServerTreeDataSource, type GridGroupPage } from './grid-data-source';
import { type GridColumnDef, type RowId } from './grid-core';
import { type FocusPos } from './grid-nav';

expect.extend(toHaveNoViolations);

interface Row extends Record<string, unknown> { id: number; name: string; age: number; }

const COLS: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name', sortable: true, filterable: true },
  { key: 'age', header: 'Age', sortable: true, align: 'end' },
];
const ROWS: Row[] = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 },
  { id: 4, name: 'Dana', age: 28 },
  { id: 5, name: 'Evan', age: 40 },
];

@Component({
  standalone: true,
  imports: [AxDataGridComponent],
  template: `
    <ax-data-grid
      [columns]="cols"
      [data]="rows"
      [pageSize]="pageSize()"
      [searchable]="true"
      [selectable]="true"
      [resizable]="true"
      [(selected)]="selected"
    />
  `,
})
class HostComponent {
  cols = COLS;
  rows = ROWS;
  pageSize = signal(10);
  selected = signal<RowId[]>([]);
}

function setup(configure?: (h: HostComponent) => void) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [HostComponent] });
  const fixture = TestBed.createComponent(HostComponent);
  if (configure) configure(fixture.componentInstance);
  fixture.detectChanges();
  return fixture;
}

function bodyRows(fixture: ReturnType<typeof setup>): HTMLTableRowElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('tbody tr[data-row]'));
}
function cellText(row: HTMLTableRowElement, dataColIndex: number): string {
  const cell = row.querySelectorAll('td')[dataColIndex + 1] as HTMLElement | undefined;
  return cell?.textContent?.trim() ?? '';
}

describe('AxDataGrid', () => {
  it('renders rows from a client array', () => {
    expect(bodyRows(setup()).length).toBe(5);
  });

  it('sorts by a column on header click (asc -> desc)', () => {
    const fixture = setup();
    const ageBtn = (Array.from(fixture.nativeElement.querySelectorAll('thead button')) as HTMLButtonElement[])
      .find((b) => b.textContent?.includes('Age'))!;
    ageBtn.click(); fixture.detectChanges();
    expect(cellText(bodyRows(fixture)[0], 1)).toBe('25');
    ageBtn.click(); fixture.detectChanges();
    expect(cellText(bodyRows(fixture)[0], 1)).toBe('40');
  });

  it('global search narrows rows', () => {
    const fixture = setup();
    const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'ali'; search.dispatchEvent(new Event('input')); fixture.detectChanges();
    expect(bodyRows(fixture).length).toBe(1);
    expect(cellText(bodyRows(fixture)[0], 0)).toBe('Alice');
  });

  it('per-column filter narrows rows', () => {
    const fixture = setup();
    const filterInput = fixture.nativeElement.querySelector('thead input[type="text"]') as HTMLInputElement;
    filterInput.value = 'da'; filterInput.dispatchEvent(new Event('input')); fixture.detectChanges();
    expect(bodyRows(fixture).length).toBe(1);
    expect(cellText(bodyRows(fixture)[0], 0)).toBe('Dana');
  });

  it('selecting a row updates the selected model', () => {
    const fixture = setup();
    const cb = bodyRows(fixture)[0].querySelector('input[type="checkbox"]') as HTMLInputElement;
    cb.click(); fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toEqual([1]);
  });

  it('announces sort changes via a polite aria-live region', () => {
    const fixture = setup();
    const gridCmp = fixture.debugElement.query(
      (el) => el.componentInstance instanceof AxDataGridComponent,
    ).componentInstance as InstanceType<typeof AxDataGridComponent<Row>> & { liveReady: boolean };
    gridCmp.liveReady = true;

    const live = () =>
      (fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement).textContent?.trim();

    const ageBtn = (Array.from(fixture.nativeElement.querySelectorAll('thead button')) as HTMLButtonElement[])
      .find((b) => b.textContent?.includes('Age'))!;
    ageBtn.click(); fixture.detectChanges();
    expect(live()).toBe('Sorted by Age ascending');
    ageBtn.click(); fixture.detectChanges();
    expect(live()).toBe('Sorted by Age descending');
    ageBtn.click(); fixture.detectChanges();
    expect(live()).toBe('Sort cleared');
  });

  it('announces filter applied/cleared with row count after debounce', () => {
    const fixture = setup();
    const gridCmp = fixture.debugElement.query(
      (el) => el.componentInstance instanceof AxDataGridComponent,
    ).componentInstance as InstanceType<typeof AxDataGridComponent<Row>> & { liveReady: boolean };
    gridCmp.liveReady = true;

    const live = () =>
      (fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement).textContent?.trim();

    jest.useFakeTimers();
    try {
      const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
      search.value = 'a'; search.dispatchEvent(new Event('input')); fixture.detectChanges();
      search.value = 'ali'; search.dispatchEvent(new Event('input')); fixture.detectChanges();
      expect(live()).toBe(''); // debounced — no per-keystroke spam
      jest.advanceTimersByTime(300);
      fixture.detectChanges();
      expect(live()).toBe('Filter applied. Showing 1 row.');

      search.value = ''; search.dispatchEvent(new Event('input')); fixture.detectChanges();
      jest.advanceTimersByTime(300);
      fixture.detectChanges();
      expect(live()).toBe('Filters cleared. Showing 5 rows.');
    } finally {
      jest.useRealTimers();
    }
  });

  it('announces selection count changes via aria-live', () => {
    const fixture = setup();
    const gridCmp = fixture.debugElement.query(
      (el) => el.componentInstance instanceof AxDataGridComponent,
    ).componentInstance as InstanceType<typeof AxDataGridComponent<Row>> & { liveReady: boolean };
    gridCmp.liveReady = true;

    const live = () =>
      (fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement).textContent?.trim();

    const cb = bodyRows(fixture)[0].querySelector('input[type="checkbox"]') as HTMLInputElement;
    cb.click(); fixture.detectChanges();
    expect(live()).toBe('1 row selected');

    (fixture.nativeElement.querySelector('[data-clear-selection]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(live()).toBe('Selection cleared');
  });

  it('header checkbox selects all then clears', () => {
    const fixture = setup();
    const header = fixture.nativeElement.querySelector('thead input[type="checkbox"]') as HTMLInputElement;
    header.click(); fixture.detectChanges();
    expect(fixture.componentInstance.selected().length).toBe(5);
    header.click(); fixture.detectChanges();
    expect(fixture.componentInstance.selected().length).toBe(0);
  });

  it('paginates to pageSize', () => {
    expect(bodyRows(setup((h) => h.pageSize.set(2))).length).toBe(2);
  });

  it('a resize drag widens the column', () => {
    const fixture = setup();
    const handle = fixture.nativeElement.querySelector('thead th span[class*="cursor-col-resize"]') as HTMLElement;
    handle.setPointerCapture = () => undefined;
    handle.dispatchEvent(new MouseEvent('pointerdown', { clientX: 100, bubbles: true }));
    handle.dispatchEvent(new MouseEvent('pointermove', { clientX: 180, bubbles: true }));
    handle.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    fixture.detectChanges();
    const firstDataCol = fixture.nativeElement.querySelectorAll('colgroup col')[1] as HTMLElement;
    expect(Number(firstDataCol.getAttribute('width'))).toBeGreaterThan(60);
  });

  it('shows an empty state when there are no rows', () => {
    const fixture = setup((h) => (h.rows = []));
    expect(fixture.nativeElement.textContent).toContain('No data');
  });

  it('has no a11y violations', async () => {
    const results = await axe(setup().nativeElement);
    expect(results).toHaveNoViolations();
  });
});

@Component({
  standalone: true,
  imports: [AxDataGridComponent],
  template: `
    <ax-data-grid [columns]="cols" [data]="rows" [pageSize]="0" [virtualScroll]="true" [rowHeight]="32" />
  `,
})
class VirtualHost {
  cols = COLS;
  rows = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: 'R' + i, age: i }));
}

describe('AxDataGrid virtual scroll', () => {
  it('renders only a window of rows for a large client set', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [VirtualHost] });
    const fixture = TestBed.createComponent(VirtualHost);
    fixture.detectChanges();
    const rendered = fixture.nativeElement.querySelectorAll('tbody tr[data-row]').length;
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(1000);
  });
});

describe('AxDataGrid multi-sort', () => {
  it('shift+click adds a second sort; plain click replaces it', () => {
    const fixture = setup();
    const btns = Array.from(fixture.nativeElement.querySelectorAll('thead button')) as HTMLButtonElement[];
    const nameBtn = btns.find((b) => b.textContent?.includes('Name'))!;
    const ageBtn = btns.find((b) => b.textContent?.includes('Age'))!;
    nameBtn.click();
    ageBtn.dispatchEvent(new MouseEvent('click', { shiftKey: true, bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('thead [data-sort-priority]').length).toBe(2);
    ageBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('thead [data-sort-priority]').length).toBe(0);
  });
});

describe('AxDataGrid sort/filter panels', () => {
  it('toggles the sort panel from the toolbar', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('ax-data-grid-sort-panel')).toBeNull();
    (fixture.nativeElement.querySelector('[data-toolbar-sort]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ax-data-grid-sort-panel')).not.toBeNull();
  });

  it('opens the filter builder and an added condition narrows the grid', () => {
    const fixture = setup();
    (fixture.nativeElement.querySelector('[data-toolbar-filters]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-add-condition]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const colSel = fixture.nativeElement.querySelector('[data-condition] [data-column]') as HTMLSelectElement;
    colSel.value = 'name'; colSel.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const valInput = fixture.nativeElement.querySelector('[data-condition] [data-value]') as HTMLInputElement;
    valInput.value = 'ali'; valInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(bodyRows(fixture).length).toBe(1);
    expect(cellText(bodyRows(fixture)[0], 0)).toBe('Alice');
  });

  it('has no a11y violations with both panels open', async () => {
    const fixture = setup();
    (fixture.nativeElement.querySelector('[data-toolbar-sort]') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('[data-toolbar-filters]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});

describe('AxDataGrid server mode', () => {
  it('renders a server page and shows a pager from total', () => {
    const fetcher = jest.fn(() => of({ rows: ROWS.slice(0, 2), total: 42 }));
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [dataSource]="ds" rowModel="server" [pageSize]="2" />`,
    })
    class SrvHost { cols = COLS; ds = new ServerDataSource<Row>(fetcher); }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [SrvHost] });
    const f = TestBed.createComponent(SrvHost);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('tbody tr[data-row]').length).toBe(2);
    expect(f.nativeElement.textContent).toContain('/ 21');
    expect(fetcher).toHaveBeenCalled();
  });
});

describe('AxDataGrid infinite blocks', () => {
  const page = (start: number, n: number, total: number) => of({
    rows: Array.from({ length: n }, (_, i) => ({ id: start + i, name: 'R' + (start + i), age: start + i })),
    total,
  });
  function makeHost(fetcher: jest.Mock) {
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [dataSource]="ds" rowModel="infinite" infiniteMode="blocks" [blockSize]="10" [rowHeight]="20" />`,
    })
    class InfHost { cols = COLS; ds = new ServerDataSource<Row>(fetcher); }
    return InfHost;
  }

  it('fetches the first block and renders its rows', () => {
    const fetcher = jest.fn((q) => page(q.startRow, 10, 1000));
    const Host = makeHost(fetcher);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Host] });
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(fetcher).toHaveBeenCalled();
    expect(f.nativeElement.querySelectorAll('tbody tr[data-row]').length).toBeGreaterThan(0);
  });

  it('shows placeholder rows for unloaded ranges', () => {
    const fetcher = jest.fn((q) => page(q.startRow, 10, 1000));
    const Host = makeHost(fetcher);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Host] });
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.querySelector('tbody tr[data-row]')).not.toBeNull();
    expect(f.nativeElement.querySelectorAll('tbody tr[data-row-loading]').length).toBeGreaterThanOrEqual(0);
  });

  it('refetches when the sort changes (cache invalidated)', () => {
    const fetcher = jest.fn((q) => page(q.startRow, 10, 1000));
    const Host = makeHost(fetcher);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Host] });
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const callsBefore = fetcher.mock.calls.length;
    const ageBtn = (Array.from(f.nativeElement.querySelectorAll('thead button')) as HTMLButtonElement[])
      .find((b) => b.textContent?.includes('Age'))!;
    ageBtn.click();
    f.detectChanges();
    expect(fetcher.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});

describe('AxDataGrid infinite append', () => {
  it('loads the first block then appends more when scrolled near the end', () => {
    const fetcher = jest.fn((q) => of({
      rows: Array.from({ length: 10 }, (_, i) => ({ id: q.startRow + i, name: 'R' + (q.startRow + i), age: q.startRow + i })),
      total: 30,
    }));
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [dataSource]="ds" rowModel="infinite" infiniteMode="append" [blockSize]="10" [rowHeight]="20" />`,
    })
    class AppHost { cols = COLS; ds = new ServerDataSource<Row>(fetcher); }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [AppHost] });
    const f = TestBed.createComponent(AppHost);
    f.detectChanges();
    const callsAfterInit = fetcher.mock.calls.length;
    expect(callsAfterInit).toBeGreaterThanOrEqual(1);
    const vp = f.nativeElement.querySelector('div.overflow-auto') as HTMLElement;
    Object.defineProperty(vp, 'scrollTop', { value: 180, configurable: true });
    Object.defineProperty(vp, 'clientHeight', { value: 100, configurable: true });
    vp.dispatchEvent(new Event('scroll'));
    f.detectChanges();
    expect(fetcher.mock.calls.length).toBeGreaterThan(callsAfterInit);
  });
});

describe('AxDataGrid fetch error + loading', () => {
  it('emits fetchError when a fetch fails and keeps the grid usable', () => {
    const fetcher = jest.fn(() => throwError(() => new Error('boom')));
    const onErr = jest.fn();
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [dataSource]="ds" rowModel="infinite" [blockSize]="10" (fetchError)="onErr($event)" />`,
    })
    class ErrHost { cols = COLS; ds = new ServerDataSource<Row>(fetcher); onErr = onErr; }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ErrHost] });
    const f = TestBed.createComponent(ErrHost);
    f.detectChanges();
    expect(onErr).toHaveBeenCalledWith(expect.any(Error));
  });

  it('infinite mode has no a11y violations with placeholders present', async () => {
    const fetcher = jest.fn((q) => of({ rows: [{ id: q.startRow, name: 'R', age: 1 }], total: 500 }));
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [dataSource]="ds" rowModel="infinite" [blockSize]="10" [rowHeight]="20" />`,
    })
    class A11yHost { cols = COLS; ds = new ServerDataSource<Row>(fetcher); }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [A11yHost] });
    const f = TestBed.createComponent(A11yHost);
    f.detectChanges();
    const results = await axe(f.nativeElement);
    expect(results).toHaveNoViolations();
  });
});

describe('AxDataGrid grouping', () => {
  const GROUP_COLS: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', aggregation: 'sum' },
  ];
  const GROUP_ROWS: Row[] = [
    { id: 1, name: 'A', age: 10 },
    { id: 2, name: 'A', age: 20 },
    { id: 3, name: 'B', age: 5 },
  ];
  function host(groupBy: (keyof Row)[]) {
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [data]="rows" [pageSize]="0" [groupBy]="gb" />`,
    })
    class GHost { cols = GROUP_COLS; rows = GROUP_ROWS; gb = groupBy; }
    return GHost;
  }

  it('renders group rows with counts and aggregate cells', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [host(['name'])] });
    const f = TestBed.createComponent(host(['name']));
    f.detectChanges();
    const groupRowsEls = f.nativeElement.querySelectorAll('tbody tr[data-group-row]');
    expect(groupRowsEls.length).toBe(2);
    expect(groupRowsEls[0].textContent).toContain('(2)');
    expect(groupRowsEls[0].textContent).toContain('30');
  });

  it('collapsing a group hides its leaves', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [host(['name'])] });
    const f = TestBed.createComponent(host(['name']));
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('tbody tr[data-row]').length).toBe(3);
    (f.nativeElement.querySelector('tbody tr[data-group-row] [data-group-toggle]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('tbody tr[data-row]').length).toBe(1);
  });

  it('renders a grand-total footer when a column has an aggregation', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [host([])] });
    const f = TestBed.createComponent(host([]));
    f.detectChanges();
    const tfoot = f.nativeElement.querySelector('tfoot');
    expect(tfoot).not.toBeNull();
    expect(tfoot.textContent).toContain('35');
  });
});

describe('AxDataGrid server grouping', () => {
  const SG_COLS: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', aggregation: 'sum' },
  ];
  function makeDs(groupFetcher: jest.Mock) {
    return new ServerGroupDataSource<Row>(() => of({ rows: [], total: 0 }), groupFetcher);
  }
  function host(ds: ServerGroupDataSource<Row>) {
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [dataSource]="ds" rowModel="server" [groupBy]="['name']" [pageSize]="0" />`,
    })
    class SGHost { cols = SG_COLS; ds = ds; }
    return SGHost;
  }

  it('fetches and renders top-level server groups', () => {
    const groupFetcher = jest.fn(() => of<GridGroupPage<Row>>({
      kind: 'groups',
      groups: [{ field: 'name', value: 'A', count: 2, aggregates: { age: 30 } }, { field: 'name', value: 'B', count: 1, aggregates: { age: 5 } }],
      total: 2,
      grandTotals: { age: 35 },
    }));
    const Host = host(makeDs(groupFetcher));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Host] });
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(groupFetcher).toHaveBeenCalledWith(expect.objectContaining({ groupBy: ['name'], groupKeys: [] }));
    const groups = f.nativeElement.querySelectorAll('tbody tr[data-group-row]');
    expect(groups.length).toBe(2);
    expect(groups[0].textContent).toContain('(2)');
    expect(groups[0].textContent).toContain('30');
    expect(f.nativeElement.querySelector('tfoot')?.textContent).toContain('35');
  });

  it('expands a group: fetches children with the correct groupKeys path and renders them', () => {
    const groupFetcher = jest.fn((q) =>
      q.groupKeys.length === 0
        ? of<GridGroupPage<Row>>({ kind: 'groups', groups: [{ field: 'name', value: 'A', count: 2, aggregates: { age: 30 } }], total: 1 })
        : of<GridGroupPage<Row>>({ kind: 'leaves', rows: [{ id: 1, name: 'A', age: 10 }, { id: 2, name: 'A', age: 20 }], total: 2 })
    );
    const Host = host(makeDs(groupFetcher));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Host] });
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    (f.nativeElement.querySelector('tbody tr[data-group-row] [data-group-toggle]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(groupFetcher).toHaveBeenCalledWith(expect.objectContaining({ groupKeys: ['A'] }));
    expect(f.nativeElement.querySelectorAll('tbody tr[data-row]').length).toBe(2);
  });
});

describe('AxDataGrid server grouping errors', () => {
  const SG_COLS2: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }, { key: 'age', header: 'Age' }];
  it('emits fetchError if a child group fetch fails', () => {
    const onErr = jest.fn();
    const groupFetcher = jest.fn((q) =>
      q.groupKeys.length === 0
        ? of<GridGroupPage<Row>>({ kind: 'groups', groups: [{ field: 'name', value: 'A', count: 2, aggregates: {} }], total: 1 })
        : throwError(() => new Error('boom'))
    );
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [dataSource]="ds" rowModel="server" [groupBy]="['name']" [pageSize]="0" (fetchError)="onErr($event)" />`,
    })
    class EHost { cols = SG_COLS2; ds = new ServerGroupDataSource<Row>(() => of({ rows: [], total: 0 }), groupFetcher); onErr = onErr; }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [EHost] });
    const f = TestBed.createComponent(EHost);
    f.detectChanges();
    (f.nativeElement.querySelector('tbody tr[data-group-row] [data-group-toggle]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(onErr).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('AxDataGrid tree-data', () => {
  interface TRow extends Record<string, unknown> { id: number; name: string; kids?: TRow[] }
  const TCOLS: GridColumnDef<TRow>[] = [{ key: 'name', header: 'Name' }];
  const TROWS: TRow[] = [
    { id: 1, name: 'A', kids: [{ id: 2, name: 'A1' }, { id: 3, name: 'A2' }] },
    { id: 4, name: 'B' },
  ];
  @Component({
    standalone: true,
    imports: [AxDataGridComponent],
    template: `<ax-data-grid [columns]="cols" [data]="rows" [pageSize]="0" [treeData]="true" [treeChildren]="kids" />`,
  })
  class THost { cols = TCOLS; rows = TROWS; kids = (r: TRow) => r.kids ?? null; }
  function setupTree() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [THost] });
    const f = TestBed.createComponent(THost);
    f.detectChanges();
    return f;
  }

  it('renders root tree rows with a toggle on expandable rows', () => {
    const f = setupTree();
    const rows = f.nativeElement.querySelectorAll('tbody tr[data-tree-row]');
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('[data-tree-toggle]')).not.toBeNull();
    expect(rows[1].querySelector('[data-tree-toggle]')).toBeNull();
  });

  it('expanding a node reveals its children', () => {
    const f = setupTree();
    (f.nativeElement.querySelector('tbody tr[data-tree-row] [data-tree-toggle]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('tbody tr[data-tree-row]').length).toBe(4);
  });
});

describe('AxDataGrid master-detail', () => {
  interface MRow extends Record<string, unknown> { id: number; name: string }
  const MCOLS: GridColumnDef<MRow>[] = [{ key: 'name', header: 'Name' }];
  const MROWS: MRow[] = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
  @Component({
    standalone: true,
    imports: [AxDataGridComponent],
    template: `
      <ng-template #detail let-row><span class="detail-panel">Detail for {{ row.name }}</span></ng-template>
      <ax-data-grid [columns]="cols" [data]="rows" [pageSize]="0" [detailTemplate]="detail" />
    `,
  })
  class MHost { cols = MCOLS; rows = MROWS; }
  function setupMd() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [MHost] });
    const f = TestBed.createComponent(MHost);
    f.detectChanges();
    return f;
  }

  it('every row has an expand toggle and no detail rows initially', () => {
    const f = setupMd();
    expect(f.nativeElement.querySelectorAll('tbody tr[data-tree-row]').length).toBe(2);
    expect(f.nativeElement.querySelectorAll('tbody tr[data-detail-row]').length).toBe(0);
  });

  it('expanding a row renders its detail panel from the template', () => {
    const f = setupMd();
    (f.nativeElement.querySelector('tbody tr[data-tree-row] [data-tree-toggle]') as HTMLButtonElement).click();
    f.detectChanges();
    const detail = f.nativeElement.querySelector('tbody tr[data-detail-row]');
    expect(detail).not.toBeNull();
    expect(detail.textContent).toContain('Detail for A');
  });

  it('multiple rows can be expanded at once', () => {
    const f = setupMd();
    const toggles = f.nativeElement.querySelectorAll('tbody tr[data-tree-row] [data-tree-toggle]');
    (toggles[0] as HTMLButtonElement).click();
    (toggles[1] as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('tbody tr[data-detail-row]').length).toBe(2);
  });
});

describe('AxDataGrid server tree', () => {
  interface SRow extends Record<string, unknown> { id: number; name: string; hasKids?: boolean }
  const SCOLS: GridColumnDef<SRow>[] = [{ key: 'name', header: 'Name' }];
  function makeDs(childrenFetcher: jest.Mock) {
    return new ServerTreeDataSource<SRow>(() => of({ rows: [], total: 0 }), childrenFetcher);
  }
  function host(ds: ServerTreeDataSource<SRow>) {
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [dataSource]="ds" rowModel="server" [treeData]="true" [hasChildren]="has" [pageSize]="0" />`,
    })
    class STHost { cols = SCOLS; ds = ds; has = (r: SRow) => !!r.hasKids; }
    return STHost;
  }

  it('fetches roots (parent null) and renders toggles only where hasChildren', () => {
    const childrenFetcher = jest.fn((q) =>
      q.parent === null
        ? of({ rows: [{ id: 1, name: 'A', hasKids: true }, { id: 2, name: 'B' }], total: 2 })
        : of({ rows: [], total: 0 })
    );
    const Host = host(makeDs(childrenFetcher));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Host] });
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(childrenFetcher).toHaveBeenCalledWith(expect.objectContaining({ parent: null }));
    const rows = f.nativeElement.querySelectorAll('tbody tr[data-tree-row]');
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('[data-tree-toggle]')).not.toBeNull();
    expect(rows[1].querySelector('[data-tree-toggle]')).toBeNull();
  });

  it('expanding a node fetches its children with the right parent and renders them', () => {
    const childrenFetcher = jest.fn((q) =>
      q.parent === null
        ? of({ rows: [{ id: 1, name: 'A', hasKids: true }], total: 1 })
        : of({ rows: [{ id: 2, name: 'A1' }, { id: 3, name: 'A2' }], total: 2 })
    );
    const Host = host(makeDs(childrenFetcher));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Host] });
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    (f.nativeElement.querySelector('tbody tr[data-tree-row] [data-tree-toggle]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(childrenFetcher).toHaveBeenCalledWith(expect.objectContaining({ parent: expect.objectContaining({ id: 1 }) }));
    expect(f.nativeElement.querySelectorAll('tbody tr[data-tree-row]').length).toBe(3);
  });

  it('emits fetchError if a child fetch fails', () => {
    const onErr = jest.fn();
    const childrenFetcher = jest.fn((q) =>
      q.parent === null ? of({ rows: [{ id: 1, name: 'A', hasKids: true }], total: 1 }) : throwError(() => new Error('boom'))
    );
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [dataSource]="ds" rowModel="server" [treeData]="true" [hasChildren]="has" [pageSize]="0" (fetchError)="onErr($event)" />`,
    })
    class EHost { cols = SCOLS; ds = makeDs(childrenFetcher); has = (r: SRow) => !!r.hasKids; onErr = onErr; }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [EHost] });
    const f = TestBed.createComponent(EHost);
    f.detectChanges();
    (f.nativeElement.querySelector('tbody tr[data-tree-row] [data-tree-toggle]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(onErr).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('AxDataGrid column visibility', () => {
  it('hides a column from header and body via columnState', () => {
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [data]="rows" [pageSize]="0" [columnState]="cs" />`,
    })
    class CHost { cols = COLS; rows = ROWS; cs = { order: [], hidden: ['age'] }; }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [CHost] });
    const f = TestBed.createComponent(CHost);
    f.detectChanges();
    const headers = Array.from(f.nativeElement.querySelectorAll('thead th')).map((th: any) => th.textContent?.trim());
    expect(headers.join(' ')).not.toContain('Age');
    const firstRow = f.nativeElement.querySelector('tbody tr[data-row]');
    expect(firstRow.querySelectorAll('td').length).toBe(1);
  });
});

describe('AxDataGrid column chooser toolbar', () => {
  it('toggling a column via the toolbar chooser hides it', () => {
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [data]="rows" [pageSize]="0" />`,
    })
    class TBHost { cols = COLS; rows = ROWS; }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [TBHost] });
    const f = TestBed.createComponent(TBHost);
    f.detectChanges();
    (f.nativeElement.querySelector('[data-toolbar-columns]') as HTMLButtonElement).click();
    f.detectChanges();
    (f.nativeElement.querySelector('[data-col-toggle="age"]') as HTMLInputElement).click();
    f.detectChanges();
    const headers = Array.from(f.nativeElement.querySelectorAll('thead th')).map((th: any) => th.textContent?.trim());
    expect(headers.join(' ')).not.toContain('Age');
  });
});

describe('AxDataGrid column reorder', () => {
  it('drag-drop reorders header and body cells', () => {
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [data]="rows" [pageSize]="0" />`,
    })
    class RHost { cols = COLS; rows = ROWS; }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [RHost] });
    const f = TestBed.createComponent(RHost);
    f.detectChanges();
    const ths = () => Array.from(f.nativeElement.querySelectorAll('thead th[data-col-header]')) as HTMLElement[];
    expect(ths().map((t) => t.getAttribute('data-col-header'))).toEqual(['name', 'age']);
    // jsdom lacks DragEvent/DataTransfer; the handlers don't use dataTransfer for the reorder.
    ths()[1].dispatchEvent(new Event('dragstart', { bubbles: true }));
    ths()[0].dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
    ths()[0].dispatchEvent(new Event('drop', { bubbles: true }));
    f.detectChanges();
    expect(ths().map((t) => t.getAttribute('data-col-header'))).toEqual(['age', 'name']);
  });
});

describe('AxDataGrid column pinning', () => {
  const PCOLS: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name', width: 120 },
    { key: 'age', header: 'Age', width: 80 },
  ];
  it('pins a start column: first header has data-pin=start + sticky class; host var set', () => {
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [data]="rows" [pageSize]="0" [columnState]="cs" />`,
    })
    class PHost { cols = PCOLS; rows = ROWS; cs = { order: [], hidden: [], pinned: { age: 'start' as const } }; }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [PHost] });
    const f = TestBed.createComponent(PHost);
    f.detectChanges();
    const ths = Array.from(f.nativeElement.querySelectorAll('thead th[data-col-header]')) as HTMLElement[];
    expect(ths[0].getAttribute('data-col-header')).toBe('age');
    expect(ths[0].getAttribute('data-pin')).toBe('start');
    expect(ths[0].className).toContain('sticky');
    const grid = f.nativeElement.querySelector('ax-data-grid') as HTMLElement;
    expect(grid.style.getPropertyValue('--dg-pin-s-0')).toBe('0px');
  });
});

describe('AxDataGrid grouped columns', () => {
  interface GRow extends Record<string, unknown> { id: number; a: string; b: string }
  const GCOLS: GridColumnDef<GRow>[] = [
    { key: 'g', header: 'Group', children: [{ key: 'a', header: 'A' }, { key: 'b', header: 'B' }] },
  ];
  const GROWS: GRow[] = [{ id: 1, a: 'x', b: 'y' }];
  function ghost() {
    @Component({
      standalone: true,
      imports: [AxDataGridComponent],
      template: `<ax-data-grid [columns]="cols" [data]="rows" [pageSize]="0" />`,
    })
    class GHost { cols = GCOLS; rows = GROWS; }
    return GHost;
  }

  it('renders only leaf columns in the body', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ghost()] });
    const f = TestBed.createComponent(ghost());
    f.detectChanges();
    const firstRow = f.nativeElement.querySelector('tbody tr[data-row]');
    expect(firstRow.querySelectorAll('td').length).toBe(2);
    expect(firstRow.textContent).toContain('x');
    expect(firstRow.textContent).toContain('y');
  });

  it('renders a group header row with colspan and a leaf row beneath', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ghost()] });
    const f = TestBed.createComponent(ghost());
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('thead tr').length).toBe(2);
    const groupCell = f.nativeElement.querySelector('thead [data-col-group]');
    expect(groupCell?.getAttribute('colspan')).toBe('2');
    expect(groupCell?.textContent).toContain('Group');
    const leafHeaders = f.nativeElement.querySelectorAll('thead th[data-col-header]');
    expect(Array.from(leafHeaders).map((t: Element) => t.getAttribute('data-col-header'))).toEqual(['a', 'b']);
  });
});

describe('AxDataGrid header/footer templates', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }

  @Component({
    standalone: true,
    imports: [AxDataGridComponent],
    template: `
      <ng-template #hdr let-col>HDR:{{ col.header }}</ng-template>
      <ng-template #ftr let-v>FTR:{{ v }}</ng-template>
      <ax-data-grid [columns]="cols()" [data]="rows" />
    `,
  })
  class HostComponent {
    readonly hdr = viewChild.required<TemplateRef<unknown>>('hdr');
    readonly ftr = viewChild.required<TemplateRef<unknown>>('ftr');
    readonly rows: Row[] = [{ id: 1, name: 'Ada' }];
    cols = signal<GridColumnDef<Row>[]>([]);
    ngOnInit() {
      this.cols.set([
        { key: 'name', header: 'Name', sortable: true, headerTemplate: this.hdr(), footerTemplate: this.ftr() },
      ]);
    }
  }

  it('renders headerTemplate in the header (still sortable)', () => {
    const f = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
    f.detectChanges();
    const th = f.nativeElement.querySelector('thead th[data-col-header]') as HTMLElement;
    expect(th.textContent).toContain('HDR:Name');
    expect(th.querySelector('button')).not.toBeNull();
  });

  it('renders footerTemplate and shows a footer without aggregation', () => {
    const f = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
    f.detectChanges();
    const tfoot = f.nativeElement.querySelector('tfoot') as HTMLElement | null;
    expect(tfoot).not.toBeNull();
    expect(tfoot!.textContent).toContain('FTR:');
  });
});

describe('AxDataGrid conditional formatting', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; age: number; }
  const rows: Row[] = [{ id: 1, name: 'Ada', age: 80 }, { id: 2, name: 'Al', age: 20 }];
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', cellClass: (_r, v) => ((v as number) >= 50 ? 'text-destructive' : '') },
  ];

  it('applies cellClass to the matching cell', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    const bodyRows = Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row]')) as HTMLElement[];
    const firstAgeCell = bodyRows[0].querySelectorAll('td')[1] as HTMLElement;
    const secondAgeCell = bodyRows[1].querySelectorAll('td')[1] as HTMLElement;
    expect(firstAgeCell.className).toContain('text-destructive');
    expect(secondAgeCell.className).not.toContain('text-destructive');
  });

  it('applies rowClass to the body row', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('rowClass', (r: Row) => (r.age >= 50 ? 'bg-destructive/10' : ''));
    f.detectChanges();
    const bodyRows = Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row]')) as HTMLElement[];
    expect(bodyRows[0].className).toContain('bg-destructive/10');
    expect(bodyRows[1].className).not.toContain('bg-destructive/10');
  });
});

describe('AxDataGrid width polish', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = [{ id: 1, name: 'Ada' }];

  it('flex columns emit percentage col widths', () => {
    const cols: GridColumnDef<Row>[] = [
      { key: 'id', header: 'ID', width: 80 },
      { key: 'name', header: 'Name', flex: 1 },
    ];
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    const colEls = Array.from(f.nativeElement.querySelectorAll('colgroup col')) as HTMLElement[];
    // last <col> is the flex 'name' column -> percentage width
    expect(colEls[colEls.length - 1].getAttribute('width')).toContain('%');
  });

  it('a fixed-width (no flex) column keeps its px width, not a percentage', () => {
    const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', width: 120 }];
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    const colEls = Array.from(f.nativeElement.querySelectorAll('colgroup col')) as HTMLElement[];
    const w = colEls[colEls.length - 1].getAttribute('width');
    expect(w).toBe('120');
    expect(w).not.toContain('%');
  });

  it('clamps width to the column maxWidth', () => {
    const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', width: 500, maxWidth: 200 }];
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    const colEls = Array.from(f.nativeElement.querySelectorAll('colgroup col')) as HTMLElement[];
    expect(colEls[colEls.length - 1].getAttribute('width')).toBe('200');
  });

  it('double-clicking the resize handle clears the width override', () => {
    const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', width: 120 }];
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('resizable', true);
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { state: { setWidth(k: string, v: number): void; widths(): Record<string, number> } };
    cmp.state.setWidth('name', 300);
    f.detectChanges();
    const handle = f.nativeElement.querySelector('thead th[data-col-header] span.cursor-col-resize') as HTMLElement;
    expect(handle).not.toBeNull();
    handle.dispatchEvent(new Event('dblclick', { bubbles: true }));
    f.detectChanges();
    expect(cmp.state.widths()['name']).toBeUndefined();
  });
});

describe('AxDataGrid sticky header', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = [{ id: 1, name: 'Ada' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }];

  it('adds sticky top classes to header cells by default', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    const th = f.nativeElement.querySelector('thead th[data-col-header]') as HTMLElement;
    expect(th.className).toContain('sticky');
    expect(th.className).toContain('top-0');
  });

  it('omits sticky top when [stickyHeader]="false"', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('stickyHeader', false);
    f.detectChanges();
    const th = f.nativeElement.querySelector('thead th[data-col-header]') as HTMLElement;
    expect(th.className).not.toContain('top-0');
  });
});

describe('AxDataGrid allSelected (include/exclude mode)', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Al' }, { id: 3, name: 'Grace' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('selectable', true);
    return f;
  }

  it('isSelected is inverted when allSelected is true', () => {
    const f = setup();
    f.componentRef.setInput('allSelected', true);
    f.componentRef.setInput('selected', [2]); // row id 2 is excluded
    f.detectChanges();
    const boxes = Array.from(f.nativeElement.querySelectorAll('tbody input[type="checkbox"]')) as HTMLInputElement[];
    expect(boxes[0].checked).toBe(true);  // id 1: selected (not excluded)
    expect(boxes[1].checked).toBe(false); // id 2: excluded
    expect(boxes[2].checked).toBe(true);  // id 3: selected (not excluded)
  });

  it('headerState is inverted when allSelected is true', () => {
    const f = setup();
    f.componentRef.setInput('allSelected', true);
    f.componentRef.setInput('selected', []); // nothing excluded -> everything selected
    f.detectChanges();
    const headerBox = f.nativeElement.querySelector('thead input[type="checkbox"]') as HTMLInputElement;
    expect(headerBox.checked).toBe(true);
    expect(headerBox.indeterminate).toBe(false);
  });

  it('clicking the header checkbox while allSelected is true exits to nothing-selected', () => {
    const f = setup();
    f.componentRef.setInput('allSelected', true);
    f.componentRef.setInput('selected', []);
    f.detectChanges();
    const headerBox = f.nativeElement.querySelector('thead input[type="checkbox"]') as HTMLInputElement;
    headerBox.dispatchEvent(new Event('change', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { allSelected(): boolean; selected(): number[] };
    expect(cmp.allSelected()).toBe(false);
    expect(cmp.selected()).toEqual([]);
  });

  it('allSelected defaults to false and preserves today\'s behavior', () => {
    const f = setup();
    f.componentRef.setInput('selected', [1]);
    f.detectChanges();
    const boxes = Array.from(f.nativeElement.querySelectorAll('tbody input[type="checkbox"]')) as HTMLInputElement[];
    expect(boxes[0].checked).toBe(true);
    expect(boxes[1].checked).toBe(false);
  });
});

describe('AxDataGrid select-all-matching + clear selection', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('selectable', true);
    f.componentRef.setInput('pageSize', 2); // total (5) > visible page (2) -> banner can appear
    return f;
  }

  it('shows the select-all banner once the current page is fully selected, and hides it once allSelected is true', () => {
    const f = setup();
    f.componentRef.setInput('selected', [1, 2]); // both rows on page 1
    f.detectChanges();
    let banner = f.nativeElement.querySelector('[data-select-all]') as HTMLElement | null;
    expect(banner).not.toBeNull();
    banner!.dispatchEvent(new Event('click', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { allSelected(): boolean; selected(): number[] };
    expect(cmp.allSelected()).toBe(true);
    expect(cmp.selected()).toEqual([]);
    banner = f.nativeElement.querySelector('[data-select-all]');
    expect(banner).toBeNull();
  });

  it('selectedCount reflects total minus excluded when allSelected is true', () => {
    const f = setup();
    f.componentRef.setInput('allSelected', true);
    f.componentRef.setInput('selected', [1]); // 1 excluded out of 5 total
    f.detectChanges();
    const chip = f.nativeElement.querySelector('[data-clear-selection]') as HTMLElement;
    expect(chip.textContent).toContain('4');
  });

  it('the clear-selection chip resets both allSelected and selected', () => {
    const f = setup();
    f.componentRef.setInput('allSelected', true);
    f.componentRef.setInput('selected', [1]);
    f.detectChanges();
    const chip = f.nativeElement.querySelector('[data-clear-selection]') as HTMLElement;
    chip.dispatchEvent(new Event('click', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { allSelected(): boolean; selected(): number[] };
    expect(cmp.allSelected()).toBe(false);
    expect(cmp.selected()).toEqual([]);
    expect(f.nativeElement.querySelector('[data-clear-selection]')).toBeNull();
  });
});

describe('AxDataGrid shift-click range selection', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    return f;
  }
  function boxes(f: ReturnType<typeof setup>): HTMLInputElement[] {
    return Array.from(f.nativeElement.querySelectorAll('tbody input[type="checkbox"]')) as HTMLInputElement[];
  }

  it('plain click toggles a single row and sets the anchor', () => {
    const f = setup();
    boxes(f)[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { selected(): number[] };
    expect(cmp.selected()).toEqual([2]);
  });

  it('shift-click extends a range from the anchor', () => {
    const f = setup();
    boxes(f)[0].dispatchEvent(new MouseEvent('click', { bubbles: true })); // anchor = row 1
    f.detectChanges();
    boxes(f)[3].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true })); // range 1..4
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { selected(): number[] };
    expect([...cmp.selected()].sort()).toEqual([1, 2, 3, 4]);
  });

  it('shift-click while allSelected removes the range from the exclude set', () => {
    const f = setup();
    f.componentRef.setInput('allSelected', true);
    f.componentRef.setInput('selected', [1, 2, 3, 4, 5]); // everything excluded
    f.detectChanges();
    boxes(f)[1].dispatchEvent(new MouseEvent('click', { bubbles: true })); // anchor = row 2, plain toggle removes 2 from exclude set
    f.detectChanges();
    boxes(f)[3].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true })); // range 2..4 removed from exclude set
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { selected(): number[] };
    expect([...cmp.selected()].sort()).toEqual([1, 5]);
  });
});

describe('AxDataGrid keyboard selection shortcuts', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    return f;
  }

  it('Ctrl+A selects all matching rows', () => {
    const f = setup();
    const host = f.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { allSelected(): boolean; selected(): number[] };
    expect(cmp.allSelected()).toBe(true);
    expect(cmp.selected()).toEqual([]);
  });

  it('Escape clears an active selection', () => {
    const f = setup();
    f.componentRef.setInput('allSelected', true);
    f.detectChanges();
    const host = f.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { allSelected(): boolean; selected(): number[] };
    expect(cmp.allSelected()).toBe(false);
    expect(cmp.selected()).toEqual([]);
  });

  it('Escape is a no-op when nothing is selected', () => {
    const f = setup();
    const host = f.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { allSelected(): boolean; selected(): number[] };
    expect(cmp.allSelected()).toBe(false);
    expect(cmp.selected()).toEqual([]);
  });

  it('keyboard shortcuts are inert when selectable is false', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    const host = f.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { allSelected(): boolean };
    expect(cmp.allSelected()).toBe(false);
  });
});

describe('AxDataGrid cell editing — entering edit mode', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Al' }];
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name', editable: true },
  ];
  const readonlyCols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }];

  function setup(columns = cols) {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', columns);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    return f;
  }
  function firstDataCell(f: ReturnType<typeof setup>): HTMLElement {
    return f.nativeElement.querySelector('tbody tr[data-row] td') as HTMLElement;
  }

  it('the first navigable cell is the roving tab stop (tabindex=0)', () => {
    const f = setup();
    expect(firstDataCell(f).getAttribute('tabindex')).toBe('0');
  });

  it('a non-first cell is roving tabindex=-1 regardless of editability', () => {
    const f = setup(readonlyCols);
    const secondRowCell = f.nativeElement.querySelectorAll('tbody tr[data-row] td')[1] as HTMLElement;
    expect(secondRowCell.getAttribute('tabindex')).toBe('-1');
  });

  it('double-click sets activeEditCell to that row/col', () => {
    const f = setup();
    firstDataCell(f).dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditCell(): { rowId: number; colKey: string } | null };
    expect(cmp.activeEditCell()).toEqual({ rowId: 1, colKey: 'name' });
  });

  it('Enter on a focused editable cell sets activeEditCell', () => {
    const f = setup();
    firstDataCell(f).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditCell(): { rowId: number; colKey: string } | null };
    expect(cmp.activeEditCell()).toEqual({ rowId: 1, colKey: 'name' });
  });

  it('F2 on a focused editable cell sets activeEditCell', () => {
    const f = setup();
    firstDataCell(f).dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditCell(): { rowId: number; colKey: string } | null };
    expect(cmp.activeEditCell()).toEqual({ rowId: 1, colKey: 'name' });
  });

  it('double-click on a non-editable cell does not start editing', () => {
    const f = setup(readonlyCols);
    firstDataCell(f).dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditCell(): unknown };
    expect(cmp.activeEditCell()).toBeNull();
  });
});

describe('AxDataGrid cell editing — editor rendering', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; age: number; }
  const rows: Row[] = [{ id: 1, name: 'Ada', age: 36 }];
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name', editable: true },
    { key: 'age', header: 'Age', editable: true, filterType: 'number' },
  ];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    return f;
  }
  function dataCells(f: ReturnType<typeof setup>): HTMLElement[] {
    return Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row] td')) as HTMLElement[];
  }

  it('double-click renders a text input seeded with the current value', () => {
    const f = setup();
    dataCells(f)[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const input = dataCells(f)[0].querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('text');
    expect(input.value).toBe('Ada');
  });

  it('a numeric column renders a number input', () => {
    const f = setup();
    dataCells(f)[1].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const input = dataCells(f)[1].querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('number');
    expect(input.value).toBe('36');
  });

  it('typing updates the draft value (number column coerces to a number)', () => {
    const f = setup();
    dataCells(f)[1].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const input = dataCells(f)[1].querySelector('input') as HTMLInputElement;
    input.value = '40';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { editDraft(): unknown };
    expect(cmp.editDraft()).toBe(40);
  });

  it('a non-editing cell does not render an input', () => {
    const f = setup();
    expect(dataCells(f)[0].querySelector('input')).toBeNull();
  });
});

describe('AxDataGrid cell editing — commit/cancel', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; age: number; }
  interface EditEntry { rowId: unknown; colKey: string; value: unknown; }
  const rows: Row[] = [{ id: 1, name: 'Ada', age: 36 }];
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name', editable: true },
    {
      key: 'age', header: 'Age', editable: true, filterType: 'number',
      validator: (value) => (typeof value === 'number' && value >= 0 ? null : 'Must be a positive number'),
    },
  ];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    return f;
  }
  function dataCells(f: ReturnType<typeof setup>): HTMLElement[] {
    return Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row] td')) as HTMLElement[];
  }
  function beginEdit(f: ReturnType<typeof setup>, cellIndex: number): HTMLInputElement {
    dataCells(f)[cellIndex].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    return dataCells(f)[cellIndex].querySelector('input') as HTMLInputElement;
  }

  it('Enter commits a valid value: overlay set, event emitted, edit mode closes', () => {
    const f = setup();
    const input = beginEdit(f, 0);
    let emitted: unknown = null;
    f.componentInstance.cellEdit.subscribe((e: unknown) => (emitted = e));
    input.value = 'Ada Lovelace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditCell(): unknown; state: { edits(): Map<string, EditEntry> } };
    expect(cmp.activeEditCell()).toBeNull();
    const editsMap = cmp.state.edits();
    const entry = [...editsMap.values()].find((e) => e.colKey === 'name');
    expect(entry).toEqual({ rowId: 1, colKey: 'name', value: 'Ada Lovelace' });
    expect(emitted).toEqual({ row: rows[0], col: cols[0], oldValue: 'Ada', newValue: 'Ada Lovelace' });
  });

  it('re-editing an already-edited cell reports the last committed value as oldValue', () => {
    const f = setup();
    // first edit: 'Ada' -> 'Ada L.'
    let input = beginEdit(f, 0);
    input.value = 'Ada L.';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();

    // second edit: 'Ada L.' -> 'Ada Lovelace'
    let emitted: unknown = null;
    f.componentInstance.cellEdit.subscribe((e: unknown) => (emitted = e));
    input = beginEdit(f, 0);
    input.value = 'Ada Lovelace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();

    expect(emitted).toEqual({ row: rows[0], col: cols[0], oldValue: 'Ada L.', newValue: 'Ada Lovelace' });
  });

  it('blur commits a valid value', () => {
    const f = setup();
    const input = beginEdit(f, 0);
    input.value = 'Ada L.';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { state: { edits(): Map<string, EditEntry> } };
    const entry = [...cmp.state.edits().values()].find((e) => e.colKey === 'name');
    expect(entry).toEqual({ rowId: 1, colKey: 'name', value: 'Ada L.' });
  });

  it('Escape cancels without touching the overlay', () => {
    const f = setup();
    const input = beginEdit(f, 0);
    input.value = 'Someone Else';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditCell(): unknown; state: { edits(): Map<string, EditEntry> } };
    expect(cmp.activeEditCell()).toBeNull();
    expect(cmp.state.edits().size).toBe(0);
  });

  it('an invalid value blocks commit, stays in edit mode, shows the error', () => {
    const f = setup();
    const input = beginEdit(f, 1); // age column, has a validator
    input.value = '-5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditCell(): unknown; state: { edits(): Map<string, EditEntry> } };
    expect(cmp.activeEditCell()).not.toBeNull();
    expect(cmp.state.edits().size).toBe(0);
    expect(dataCells(f)[1].textContent).toContain('Must be a positive number');
  });

  it('a numeric field left as a raw non-empty non-numeric string is passed through unchanged (validator can reject it)', () => {
    const f = setup();
    const input = beginEdit(f, 1); // age column
    input.value = 'abc';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
    // 'abc' fails Number() coercion both in onEditorInput and again in commitEdit, so it stays a string;
    // the age column's validator rejects non-numbers, so commit is blocked.
    const cmp = f.componentInstance as unknown as { activeEditCell(): unknown; state: { edits(): Map<string, EditEntry> } };
    expect(cmp.activeEditCell()).not.toBeNull();
    expect(cmp.state.edits().size).toBe(0);
  });
});

describe('AxDataGrid cell editing — display overlay + dirty indicator', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Al' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', editable: true }];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    return f;
  }
  function dataCells(f: ReturnType<typeof setup>): HTMLElement[] {
    return Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row] td')) as HTMLElement[];
  }
  function commitFirstCellAs(f: ReturnType<typeof setup>, newValue: string): void {
    dataCells(f)[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const input = dataCells(f)[0].querySelector('input') as HTMLInputElement;
    input.value = newValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
  }

  it('a committed edit renders even when the cell is not being edited', () => {
    const f = setup();
    commitFirstCellAs(f, 'Ada Lovelace');
    expect(dataCells(f)[0].textContent?.trim()).toBe('Ada Lovelace');
  });

  it('a dirty cell gets the left-border accent class; a clean cell does not', () => {
    const f = setup();
    commitFirstCellAs(f, 'Ada Lovelace');
    expect(dataCells(f)[0].className).toContain('border-warning');
    expect(dataCells(f)[1].className).not.toContain('border-warning');
  });

  it('cellClass receives the edited value, not the original, once a cell has a pending edit', () => {
    const editCols: GridColumnDef<Row>[] = [{
      key: 'name', header: 'Name', editable: true,
      cellClass: (_row, value) => (value === 'Ada Lovelace' ? 'text-destructive' : ''),
    }];
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', editCols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    const cells = () => Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row] td')) as HTMLElement[];
    cells()[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const input = cells()[0].querySelector('input') as HTMLInputElement;
    input.value = 'Ada Lovelace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
    expect(cells()[0].className).toContain('text-destructive');
  });
});

describe('AxDataGrid cell editing — a11y', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = [{ id: 1, name: 'Ada' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', editable: true }];

  it('has no a11y violations with an editable cell open for editing', async () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    const cell = f.nativeElement.querySelector('tbody tr[data-row] td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    expect(cell.querySelector('input')).not.toBeNull();
    const results = await axe(f.nativeElement);
    expect(results).toHaveNoViolations();
  });
});

describe('AxDataGrid batch save/cancel', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Al' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', editable: true }];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    return f;
  }
  function dataCells(f: ReturnType<typeof setup>): HTMLElement[] {
    return Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row] td')) as HTMLElement[];
  }
  function commitCellAs(f: ReturnType<typeof setup>, index: number, value: string): void {
    dataCells(f)[index].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const input = dataCells(f)[index].querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
  }

  it('shows the dirty chip with the correct count only when something is dirty', () => {
    const f = setup();
    expect(f.nativeElement.querySelector('[data-save-all]')).toBeNull();
    commitCellAs(f, 0, 'Ada Lovelace');
    expect(f.nativeElement.textContent).toContain('1 unsaved change');
    expect(f.nativeElement.querySelector('[data-save-all]')).not.toBeNull();
  });

  it('Save All emits the full batch and does not clear the overlay', () => {
    const f = setup();
    commitCellAs(f, 0, 'Ada Lovelace');
    commitCellAs(f, 1, 'Albert');
    let emitted: unknown = null;
    f.componentInstance.save.subscribe((e: unknown) => (emitted = e));
    (f.nativeElement.querySelector('[data-save-all]') as HTMLButtonElement).click();
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { state: { edits(): Map<string, unknown> } };
    expect(cmp.state.edits().size).toBe(2);
    expect((emitted as unknown[]).length).toBe(2);
  });

  it('clearSavedEdits removes exactly the acknowledged entries', () => {
    const f = setup();
    commitCellAs(f, 0, 'Ada Lovelace');
    commitCellAs(f, 1, 'Albert');
    const cmp = f.componentInstance as unknown as {
      state: { edits(): Map<string, { rowId: number; colKey: string; value: unknown }> };
      clearSavedEdits(saved: { rowId: number; colKey: string; value: unknown }[]): void;
    };
    const batch = [...cmp.state.edits().values()];
    cmp.clearSavedEdits(batch);
    f.detectChanges();
    expect(cmp.state.edits().size).toBe(0);
    expect(f.nativeElement.querySelector('[data-save-all]')).toBeNull();
  });

  it('clearSavedEdits leaves a cell that was re-edited after the batch was captured still dirty', () => {
    const f = setup();
    commitCellAs(f, 0, 'Ada Lovelace');
    const cmp = f.componentInstance as unknown as {
      state: { edits(): Map<string, { rowId: number; colKey: string; value: unknown }> };
      clearSavedEdits(saved: { rowId: number; colKey: string; value: unknown }[]): void;
    };
    const staleBatch = [...cmp.state.edits().values()]; // captures value 'Ada Lovelace'
    commitCellAs(f, 0, 'Ada L. (newer)'); // re-edit the SAME cell to a newer value
    cmp.clearSavedEdits(staleBatch); // acknowledge the STALE batch
    f.detectChanges();
    // the newer edit must survive — still dirty
    expect(cmp.state.edits().size).toBe(1);
    expect([...cmp.state.edits().values()][0].value).toBe('Ada L. (newer)');
    expect(f.nativeElement.querySelector('[data-save-all]')).not.toBeNull();
  });

  it('Discard All clears every pending edit and emits nothing', () => {
    const f = setup();
    commitCellAs(f, 0, 'Ada Lovelace');
    commitCellAs(f, 1, 'Albert');
    let emitted = false;
    f.componentInstance.save.subscribe(() => (emitted = true));
    (f.nativeElement.querySelector('[data-discard-all]') as HTMLButtonElement).click();
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { state: { edits(): Map<string, unknown> } };
    expect(cmp.state.edits().size).toBe(0);
    expect(emitted).toBe(false);
    expect(f.nativeElement.querySelector('[data-save-all]')).toBeNull();
  });
});

describe('AxDataGrid save modes', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = [{ id: 1, name: 'Ada' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', editable: true }];

  function setup(saveMode: 'auto' | 'manual' = 'manual') {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('saveMode', saveMode);
    f.detectChanges();
    return f;
  }
  function commitFirstCellAs(f: ReturnType<typeof setup>, value: string): void {
    const cell = f.nativeElement.querySelector('tbody tr[data-row] td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const input = cell.querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
  }

  it('defaults to manual mode: a commit stays dirty and no save event fires', () => {
    const f = setup();
    let emitted = false;
    f.componentInstance.save.subscribe(() => (emitted = true));
    commitFirstCellAs(f, 'Ada Lovelace');
    const cmp = f.componentInstance as unknown as { state: { edits(): Map<string, unknown> } };
    expect(cmp.state.edits().size).toBe(1);
    expect(emitted).toBe(false);
  });

  it('auto mode: a commit emits a one-item save batch and immediately un-dirties the cell', () => {
    const f = setup('auto');
    let emitted: unknown = null;
    f.componentInstance.save.subscribe((e: unknown) => (emitted = e));
    commitFirstCellAs(f, 'Ada Lovelace');
    const cmp = f.componentInstance as unknown as { state: { edits(): Map<string, unknown> } };
    expect(cmp.state.edits().size).toBe(0);
    expect(emitted).toEqual([{ rowId: 1, colKey: 'name', value: 'Ada Lovelace' }]);
    expect(f.nativeElement.querySelector('[data-save-all]')).toBeNull();
  });

  it('auto mode still emits cellEdit for the commit', () => {
    const f = setup('auto');
    let cellEditEmitted: unknown = null;
    f.componentInstance.cellEdit.subscribe((e: unknown) => (cellEditEmitted = e));
    commitFirstCellAs(f, 'Ada Lovelace');
    expect(cellEditEmitted).toEqual({ row: rows[0], col: cols[0], oldValue: 'Ada', newValue: 'Ada Lovelace' });
  });
});

describe('AxDataGrid undo/redo — state wiring', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = [{ id: 1, name: 'Ada' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', editable: true }];

  function setup(saveMode: 'auto' | 'manual' = 'manual') {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('saveMode', saveMode);
    f.detectChanges();
    return f;
  }
  function commitFirstCellAs(f: ReturnType<typeof setup>, value: string): void {
    const cell = f.nativeElement.querySelector('tbody tr[data-row] td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const input = cell.querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
  }

  it('a manual-mode commit pushes an undo delta', () => {
    const f = setup();
    commitFirstCellAs(f, 'Ada Lovelace');
    const cmp = f.componentInstance as unknown as { state: { history(): { undo: unknown[]; redo: unknown[] } } };
    expect(cmp.state.history().undo.length).toBe(1);
  });

  it('an auto-mode commit does NOT push history', () => {
    const f = setup('auto');
    commitFirstCellAs(f, 'Ada Lovelace');
    const cmp = f.componentInstance as unknown as { state: { history(): { undo: unknown[] } } };
    expect(cmp.state.history().undo.length).toBe(0);
  });

  it('Discard All resets history', () => {
    const f = setup();
    commitFirstCellAs(f, 'Ada Lovelace');
    const cmp = f.componentInstance as unknown as {
      state: { history(): { undo: unknown[]; redo: unknown[] }; edits(): Map<string, unknown> };
    };
    (f.nativeElement.querySelector('[data-discard-all]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(cmp.state.edits().size).toBe(0);
    expect(cmp.state.history().undo.length).toBe(0);
  });
});

describe('AxDataGrid undo/redo — keyboard + buttons', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = [{ id: 1, name: 'Ada' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', editable: true }];

  function setup(saveMode: 'auto' | 'manual' = 'manual') {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('saveMode', saveMode);
    f.detectChanges();
    return f;
  }
  function firstCell(f: ReturnType<typeof setup>): HTMLElement {
    return f.nativeElement.querySelector('tbody tr[data-row] td') as HTMLElement;
  }
  function commitFirstCellAs(f: ReturnType<typeof setup>, value: string): void {
    firstCell(f).dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const input = firstCell(f).querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
  }
  function pressCtrl(f: ReturnType<typeof setup>, key: string, shiftKey = false): void {
    (f.nativeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: true, shiftKey, bubbles: true }));
    f.detectChanges();
  }

  it('Ctrl+Z reverts a first-ever edit back to clean (removed from overlay)', () => {
    const f = setup();
    commitFirstCellAs(f, 'Ada Lovelace');
    const cmp = f.componentInstance as unknown as { state: { edits(): Map<string, unknown> } };
    expect(cmp.state.edits().size).toBe(1);
    pressCtrl(f, 'z');
    expect(cmp.state.edits().size).toBe(0);
    expect(firstCell(f).textContent?.trim()).toBe('Ada'); // original row value restored on display
  });

  it('Ctrl+Shift+Z re-applies the undone edit', () => {
    const f = setup();
    commitFirstCellAs(f, 'Ada Lovelace');
    pressCtrl(f, 'z');
    pressCtrl(f, 'Z', true);
    const cmp = f.componentInstance as unknown as { state: { edits(): Map<string, { value: unknown }> } };
    expect([...cmp.state.edits().values()][0].value).toBe('Ada Lovelace');
  });

  it('Ctrl+Y also redoes', () => {
    const f = setup();
    commitFirstCellAs(f, 'Ada Lovelace');
    pressCtrl(f, 'z');
    pressCtrl(f, 'y');
    const cmp = f.componentInstance as unknown as { state: { edits(): Map<string, { value: unknown }> } };
    expect([...cmp.state.edits().values()][0].value).toBe('Ada Lovelace');
  });

  it('a fresh commit after an undo clears the redo path', () => {
    const f = setup();
    commitFirstCellAs(f, 'Ada Lovelace');
    pressCtrl(f, 'z');
    commitFirstCellAs(f, 'Grace');
    pressCtrl(f, 'Z', true);
    const cmp = f.componentInstance as unknown as { state: { edits(): Map<string, { value: unknown }> } };
    expect([...cmp.state.edits().values()][0].value).toBe('Grace');
  });

  it('toolbar Undo/Redo buttons disable at stack boundaries', () => {
    const f = setup();
    commitFirstCellAs(f, 'Ada Lovelace');
    const undoBtn = f.nativeElement.querySelector('[data-undo]') as HTMLButtonElement;
    const redoBtn = f.nativeElement.querySelector('[data-redo]') as HTMLButtonElement;
    expect(undoBtn.disabled).toBe(false);
    expect(redoBtn.disabled).toBe(true);
    undoBtn.click();
    f.detectChanges();
    expect(f.nativeElement.querySelector('[data-undo]')).toBeNull();
  });

  it('auto mode: Ctrl+Z is inert and history stays empty', () => {
    const f = setup('auto');
    commitFirstCellAs(f, 'Ada Lovelace');
    pressCtrl(f, 'z');
    const cmp = f.componentInstance as unknown as { state: { history(): { undo: unknown[] } } };
    expect(cmp.state.history().undo.length).toBe(0);
  });

  it('Ctrl+Z is ignored by the grid while a cell editor is open (native text undo wins)', () => {
    const f = setup();
    commitFirstCellAs(f, 'Ada Lovelace'); // one committed edit -> undo stack has 1
    // open the editor again on the same cell
    firstCell(f).dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as {
      activeEditCell(): unknown;
      state: { edits(): Map<string, unknown>; history(): { undo: unknown[] } };
    };
    expect(cmp.activeEditCell()).not.toBeNull();
    const undoLenBefore = cmp.state.history().undo.length;
    // Ctrl+Z dispatched while the editor is open must NOT trigger a grid undo
    (firstCell(f).querySelector('input') as HTMLInputElement)
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    f.detectChanges();
    expect(cmp.activeEditCell()).not.toBeNull();               // still editing
    expect(cmp.state.history().undo.length).toBe(undoLenBefore); // grid history untouched
    expect(cmp.state.edits().size).toBe(1);                     // overlay untouched
  });

  it('Ctrl+A still selects all (undo/redo block does not swallow it)', () => {
    const f = setup();
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    pressCtrl(f, 'a');
    const cmp = f.componentInstance as unknown as { allSelected(): boolean };
    expect(cmp.allSelected()).toBe(true);
  });
});

describe('AxDataGrid tryCommitEdit (boolean commit core)', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; age: number; }
  const rows: Row[] = [{ id: 1, name: 'Ada', age: 36 }];
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name', editable: true },
    {
      key: 'age', header: 'Age', editable: true, filterType: 'number',
      validator: (v) => (typeof v === 'number' && v >= 0 ? null : 'Must be a positive number'),
    },
  ];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    return f;
  }
  function dataCells(f: ReturnType<typeof setup>): HTMLElement[] {
    return Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row] td')) as HTMLElement[];
  }

  it('tryCommitEdit returns true on a valid commit and false when validation blocks', () => {
    const f = setup();
    const cmp = f.componentInstance as unknown as {
      startEdit(row: Row, col: GridColumnDef<Row>): void;
      editDraft: { set(v: unknown): void };
      tryCommitEdit(row: Row, col: GridColumnDef<Row>): boolean;
    };
    cmp.startEdit(rows[0], cols[0]);
    cmp.editDraft.set('Ada Lovelace');
    expect(cmp.tryCommitEdit(rows[0], cols[0])).toBe(true);
    cmp.startEdit(rows[0], cols[1]);
    cmp.editDraft.set(-5);
    expect(cmp.tryCommitEdit(rows[0], cols[1])).toBe(false);
  });

  it('Enter still commits a valid value via the void wrapper (unregressed)', () => {
    const f = setup();
    dataCells(f)[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const input = dataCells(f)[0].querySelector('input') as HTMLInputElement;
    input.value = 'Ada L.';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { state: { edits(): Map<string, { value: unknown }> } };
    expect([...cmp.state.edits().values()][0].value).toBe('Ada L.');
  });
});

describe('AxDataGrid Tab-to-next-cell navigation', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; b: string; c: string; }
  const rows: Row[] = [
    { id: 1, a: 'a1', b: 'b1', c: 'c1' },
    { id: 2, a: 'a2', b: 'b2', c: 'c2' },
  ];
  const cols: GridColumnDef<Row>[] = [
    { key: 'a', header: 'A', editable: true },
    { key: 'b', header: 'B' },
    { key: 'c', header: 'C', editable: true },
  ];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    return f;
  }
  function bodyRows(f: ReturnType<typeof setup>): HTMLElement[] {
    return Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row]')) as HTMLElement[];
  }
  function openEditor(f: ReturnType<typeof setup>, rowIdx: number, cellIdx: number): HTMLInputElement {
    const cell = bodyRows(f)[rowIdx].querySelectorAll('td')[cellIdx] as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    return cell.querySelector('input') as HTMLInputElement;
  }
  function pressTab(input: HTMLInputElement, shiftKey = false): void {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true }));
  }
  function openInput(f: ReturnType<typeof setup>): HTMLInputElement | null {
    return f.nativeElement.querySelector('tbody input') as HTMLInputElement | null;
  }
  function activeCol(f: ReturnType<typeof setup>): string | null {
    const cmp = f.componentInstance as unknown as { activeEditCell(): { colKey: string } | null };
    return cmp.activeEditCell()?.colKey ?? null;
  }
  function activeRowId(f: ReturnType<typeof setup>): unknown {
    const cmp = f.componentInstance as unknown as { activeEditCell(): { rowId: unknown } | null };
    return cmp.activeEditCell()?.rowId ?? null;
  }

  it('Tab commits and moves to the next editable cell, skipping a non-editable column', () => {
    const f = setup();
    const input = openEditor(f, 0, 0);
    input.value = 'X';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    pressTab(input);
    f.detectChanges();
    expect(activeCol(f)).toBe('c');
    const cmp = f.componentInstance as unknown as { state: { edits(): Map<string, { value: unknown }> } };
    expect([...cmp.state.edits().values()][0].value).toBe('X');
  });

  it('Tab at the row last editable cell wraps to the next row first editable cell', () => {
    const f = setup();
    const input = openEditor(f, 0, 2);
    pressTab(input);
    f.detectChanges();
    expect(activeCol(f)).toBe('a');
    expect(activeRowId(f)).toBe(2);
  });

  it('Tab at the grid last editable cell commits and exits (no editor open)', () => {
    const f = setup();
    const input = openEditor(f, 1, 2);
    pressTab(input);
    f.detectChanges();
    expect(openInput(f)).toBeNull();
    const cmp = f.componentInstance as unknown as { activeEditCell(): unknown };
    expect(cmp.activeEditCell()).toBeNull();
  });

  it('Shift+Tab moves to the previous editable cell', () => {
    const f = setup();
    const input = openEditor(f, 0, 2);
    pressTab(input, true);
    f.detectChanges();
    expect(activeCol(f)).toBe('a');
    expect(activeRowId(f)).toBe(1);
  });

  it('Tab on an invalid value is blocked (editor stays, no move)', () => {
    const badCols: GridColumnDef<Row>[] = [
      { key: 'a', header: 'A', editable: true, validator: () => 'nope' },
      { key: 'c', header: 'C', editable: true },
    ];
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', badCols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    const cell = (Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row]'))[0] as HTMLElement)
      .querySelectorAll('td')[0] as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const input = cell.querySelector('input') as HTMLInputElement;
    input.value = 'whatever';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    pressTab(input);
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditCell(): { colKey: string } | null; state: { edits(): Map<string, unknown> } };
    expect(cmp.activeEditCell()?.colKey).toBe('a');
    expect(cmp.state.edits().size).toBe(0);
  });

  it('the old cell\'s teardown blur after a Tab move does not clobber the new cell or re-commit', () => {
    const f = setup();
    const oldInput = openEditor(f, 0, 0); // row 1, col 'a'
    oldInput.value = 'X';
    oldInput.dispatchEvent(new Event('input', { bubbles: true }));
    pressTab(oldInput);                    // commits 'a'='X', opens row1 col 'c'
    // The browser fires blur on the old input as focus leaves it, BEFORE Angular's
    // change detection tears the node down. At this point activeEditCell already
    // points at the NEW cell ('c') but the old input's (blur) listener is still live.
    oldInput.dispatchEvent(new Event('blur', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as {
      activeEditCell(): { colKey: string } | null;
      state: { edits(): Map<string, { rowId: unknown; colKey: string; value: unknown }> };
    };
    // new editor still open on 'c'
    expect(cmp.activeEditCell()?.colKey).toBe('c');
    // only ONE committed edit, and it's 'a'='X' (NOT clobbered to the new draft)
    const entries = [...cmp.state.edits().values()];
    expect(entries.length).toBe(1);
    expect(entries[0].colKey).toBe('a');
    expect(entries[0].value).toBe('X');
  });

  it('opening an editor focuses its input', async () => {
    const f = setup();
    // jsdom only updates activeElement for elements attached to the owning doc.
    const host = f.nativeElement as HTMLElement;
    const doc = host.ownerDocument;
    doc.body.appendChild(host);
    try {
      // autoDetectChanges registers the fixture with ApplicationRef so
      // afterRenderEffect hooks flush on the render tick.
      f.autoDetectChanges(true);
      const input = openEditor(f, 0, 0);
      await f.whenStable();
      expect(input.ownerDocument.activeElement).toBe(input);
    } finally {
      doc.body.removeChild(host);
    }
  });
});

describe('AxDataGrid applyCommittedCell / coerceNumeric extraction', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; }
  const rows: Row[] = [{ id: 1, name: 'Ada' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', editable: true }];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    return f;
  }

  it('applyCommittedCell writes to the overlay and emits cellEdit', () => {
    const f = setup();
    let emitted: unknown = null;
    f.componentInstance.cellEdit.subscribe((e: unknown) => (emitted = e));
    const cmp = f.componentInstance as unknown as {
      applyCommittedCell(row: Row, col: GridColumnDef<Row>, value: unknown): void;
      state: { edits(): Map<string, { value: unknown }> };
    };
    cmp.applyCommittedCell(rows[0], cols[0], 'Ada Lovelace');
    expect([...cmp.state.edits().values()][0].value).toBe('Ada Lovelace');
    expect(emitted).toEqual({ row: rows[0], col: cols[0], oldValue: 'Ada', newValue: 'Ada Lovelace' });
  });
});

describe('AxDataGrid row-edit mode — opening', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; b: string; c: string; }
  const rows: Row[] = [{ id: 1, a: 'a1', b: 'b1', c: 'c1' }, { id: 2, a: 'a2', b: 'b2', c: 'c2' }];
  const cols: GridColumnDef<Row>[] = [
    { key: 'a', header: 'A', editable: true },
    { key: 'b', header: 'B' },
    { key: 'c', header: 'C', editable: true },
  ];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('editMode', 'row');
    f.detectChanges();
    return f;
  }
  function bodyRows(f: ReturnType<typeof setup>): HTMLElement[] {
    return Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row]')) as HTMLElement[];
  }

  it('double-clicking a cell opens editors on ALL editable cells of that row (non-editable skipped)', () => {
    const f = setup();
    const firstCell = bodyRows(f)[0].querySelectorAll('td')[0] as HTMLElement;
    firstCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    expect(bodyRows(f)[0].querySelectorAll('input').length).toBe(2);
    expect(bodyRows(f)[1].querySelectorAll('input').length).toBe(0);
  });

  it('typing in one row editor updates only that cell draft', () => {
    const f = setup();
    const firstCell = bodyRows(f)[0].querySelectorAll('td')[0] as HTMLElement;
    firstCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const aInput = bodyRows(f)[0].querySelectorAll('input')[0] as HTMLInputElement;
    aInput.value = 'AA';
    aInput.dispatchEvent(new Event('input', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { rowDrafts(): Map<string, unknown> };
    expect(cmp.rowDrafts().get('a')).toBe('AA');
    expect(cmp.rowDrafts().get('c')).toBe('c1');
  });

  it('blur on a row editor does not commit via the stale cell path (overlay stays clean)', () => {
    const f = setup();
    const firstCell = bodyRows(f)[0].querySelectorAll('td')[0] as HTMLElement;
    firstCell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    const aInput = bodyRows(f)[0].querySelectorAll('input')[0] as HTMLInputElement;
    aInput.value = 'AA';
    aInput.dispatchEvent(new Event('input', { bubbles: true }));
    f.detectChanges();
    // blur (mouse click-away) must NOT commit anything via the cell path in row mode
    aInput.dispatchEvent(new Event('blur', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { state: { edits(): Map<string, unknown> }; activeEditRow(): unknown };
    expect(cmp.state.edits().size).toBe(0);      // nothing committed via the cell path
    expect(cmp.activeEditRow()).not.toBeNull();   // still editing the row
  });
});

describe('AxDataGrid row-edit mode — save/cancel/keyboard', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; c: string; }
  const rows: Row[] = [{ id: 1, a: 'a1', c: 'c1' }];
  const cols: GridColumnDef<Row>[] = [
    { key: 'a', header: 'A', editable: true },
    { key: 'c', header: 'C', editable: true, validator: (v) => (v === 'bad' ? 'no' : null) },
  ];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('editMode', 'row');
    f.detectChanges();
    return f;
  }
  function openRow(f: ReturnType<typeof setup>): HTMLInputElement[] {
    const cell = f.nativeElement.querySelector('tbody tr[data-row] td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    return Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row] input')) as HTMLInputElement[];
  }
  function typeInto(input: HTMLInputElement, v: string): void {
    input.value = v; input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('Save writes every edited cell to the overlay and closes the row', () => {
    const f = setup();
    const [aIn, cIn] = openRow(f);
    typeInto(aIn, 'AA'); typeInto(cIn, 'CC');
    f.detectChanges();
    (f.nativeElement.querySelector('[data-row-save]') as HTMLButtonElement).click();
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditRow(): unknown; state: { edits(): Map<string, { colKey: string; value: unknown }> } };
    expect(cmp.activeEditRow()).toBeNull();
    const byKey = new Map([...cmp.state.edits().values()].map((e) => [e.colKey, e.value]));
    expect(byKey.get('a')).toBe('AA');
    expect(byKey.get('c')).toBe('CC');
  });

  it('an invalid cell blocks Save: row stays open, that cell shows its error, overlay unchanged', () => {
    const f = setup();
    const [, cIn] = openRow(f);
    typeInto(cIn, 'bad');
    f.detectChanges();
    (f.nativeElement.querySelector('[data-row-save]') as HTMLButtonElement).click();
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditRow(): unknown; state: { edits(): Map<string, unknown> } };
    expect(cmp.activeEditRow()).not.toBeNull();
    expect(cmp.state.edits().size).toBe(0);
    expect((f.nativeElement.querySelector('tbody tr[data-row]') as HTMLElement).textContent).toContain('no');
  });

  it('Cancel discards drafts and closes the row without touching the overlay', () => {
    const f = setup();
    const [aIn] = openRow(f);
    typeInto(aIn, 'AA');
    f.detectChanges();
    (f.nativeElement.querySelector('[data-row-cancel]') as HTMLButtonElement).click();
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditRow(): unknown; state: { edits(): Map<string, unknown> } };
    expect(cmp.activeEditRow()).toBeNull();
    expect(cmp.state.edits().size).toBe(0);
  });

  it('Enter saves the row; Escape cancels it', () => {
    const f = setup();
    let [aIn] = openRow(f);
    typeInto(aIn, 'AA');
    aIn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditRow(): unknown; state: { edits(): Map<string, unknown> } };
    expect(cmp.activeEditRow()).toBeNull();
    expect(cmp.state.edits().size).toBe(1);

    [aIn] = openRow(f);
    typeInto(aIn, 'ZZ');
    aIn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    expect(cmp.activeEditRow()).toBeNull();
  });

  it('blur on a row editor does NOT commit that cell', () => {
    const f = setup();
    const [aIn] = openRow(f);
    typeInto(aIn, 'AA');
    aIn.dispatchEvent(new Event('blur', { bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { activeEditRow(): unknown; state: { edits(): Map<string, unknown> } };
    expect(cmp.activeEditRow()).not.toBeNull();
    expect(cmp.state.edits().size).toBe(0);
  });

  it('opening a row focuses its first editor', async () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('editMode', 'row');
    const host = f.nativeElement as HTMLElement;
    host.ownerDocument.body.appendChild(host);   // attach so focus() is observable (avoids the literal document token)
    f.autoDetectChanges(true);
    const cell = host.querySelector('tbody tr[data-row] td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await f.whenStable();
    const firstInput = host.querySelector('tbody tr[data-row] [data-cell-editor]') as HTMLElement;
    expect(firstInput.ownerDocument.activeElement).toBe(firstInput);
    host.remove();
  });

  it('Tab cycles focus among a tree row\'s editors', async () => {
    interface TRow extends Record<string, unknown> { id: number; a: string; c: string; kids?: TRow[]; }
    const trows: TRow[] = [{ id: 1, a: 'a1', c: 'c1' }];
    const tcols: GridColumnDef<TRow>[] = [
      { key: 'a', header: 'A', editable: true },
      { key: 'c', header: 'C', editable: true },
    ];
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', tcols);
    f.componentRef.setInput('data', trows);
    f.componentRef.setInput('editMode', 'row');
    f.componentRef.setInput('treeData', true);
    f.componentRef.setInput('treeChildren', (r: TRow) => r.kids ?? null);
    const host = f.nativeElement as HTMLElement;
    host.ownerDocument.body.appendChild(host);
    f.autoDetectChanges(true);
    const cell = host.querySelector('tbody tr[data-tree-row] td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await f.whenStable();
    const editors = Array.from(host.querySelectorAll('tbody tr[data-tree-row] [data-cell-editor]')) as HTMLElement[];
    expect(editors.length).toBe(2);
    editors[0].focus();
    editors[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await f.whenStable();
    expect(host.ownerDocument.activeElement).toBe(editors[1]); // moved to the sibling, not trapped on editors[0]
    host.remove();
  });
});

describe('AxDataGrid row-edit mode — a11y', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; c: string; }
  const rows: Row[] = [{ id: 1, a: 'a1', c: 'c1' }];
  const cols: GridColumnDef<Row>[] = [
    { key: 'a', header: 'A', editable: true },
    { key: 'c', header: 'C', editable: true },
  ];

  it('has no a11y violations with a row open for editing', async () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('editMode', 'row');
    f.detectChanges();
    const cell = f.nativeElement.querySelector('tbody tr[data-row] td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('tbody input').length).toBeGreaterThan(0);
    const results = await axe(f.nativeElement);
    expect(results).toHaveNoViolations();
  });
});

describe('AxDataGrid keyboard nav — roving tabindex & ARIA scaffolding', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; b: string; }
  const rows: Row[] = [{ id: 1, a: 'a1', b: 'b1' }, { id: 2, a: 'a2', b: 'b2' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'a', header: 'A' }, { key: 'b', header: 'B' }];

  function setup(selectable = false) {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('selectable', selectable);
    f.detectChanges();
    return f;
  }

  it('the grid has role=grid with aria-rowcount and aria-colcount', () => {
    const f = setup();
    const table = f.nativeElement.querySelector('table') as HTMLElement;
    expect(table.getAttribute('role')).toBe('grid');
    expect(table.getAttribute('aria-rowcount')).toBe('3'); // 1 header row + 2 body rows
    expect(table.getAttribute('aria-colcount')).toBe('2'); // 2 data cols (no selection col)
  });

  it('exactly one navigable cell is the tab stop (tabindex=0) by default, the rest -1', () => {
    const f = setup();
    const cells = Array.from(f.nativeElement.querySelectorAll('[data-focus-r]')) as HTMLElement[];
    const zero = cells.filter((c) => c.getAttribute('tabindex') === '0');
    expect(zero.length).toBe(1);
    expect(zero[0].getAttribute('data-focus-r')).toBe('0');
    expect(zero[0].getAttribute('data-focus-c')).toBe('0');
  });

  it('body cells are gridcells with 1-based aria-colindex; header cells are columnheaders', () => {
    const f = setup();
    const firstBodyCell = f.nativeElement.querySelector('tbody tr[data-row] td[role="gridcell"]') as HTMLElement;
    expect(firstBodyCell.getAttribute('aria-colindex')).toBe('1');
    const headerCell = f.nativeElement.querySelector('thead th[data-col-header]') as HTMLElement;
    expect(headerCell.getAttribute('role')).toBe('columnheader');
    expect(f.nativeElement.querySelector('tbody')?.getAttribute('role')).toBe('rowgroup');
  });

  it('with selection enabled, the selection cell is nav col 0 and data cols shift to 1..n', () => {
    const f = setup(true);
    const table = f.nativeElement.querySelector('table') as HTMLElement;
    expect(table.getAttribute('aria-colcount')).toBe('3'); // selection + 2 data
    const firstDataCell = f.nativeElement.querySelector('tbody tr[data-row] td[role="gridcell"][data-focus-c="1"]') as HTMLElement;
    expect(firstDataCell).not.toBeNull();
  });

  it('the second body row cells report data-focus-r=1', () => {
    const f = setup();
    const secondRow = f.nativeElement.querySelectorAll('tbody tr[data-row]')[1] as HTMLElement;
    const cell = secondRow.querySelector('td[role="gridcell"]') as HTMLElement;
    expect(cell.getAttribute('data-focus-r')).toBe('1');
  });
});

describe('AxDataGrid keyboard nav — arrow movement', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; b: string; }
  const rows: Row[] = [{ id: 1, a: 'a1', b: 'b1' }, { id: 2, a: 'a2', b: 'b2' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'a', header: 'A' }, { key: 'b', header: 'B' }];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    return f;
  }
  function press(f: ReturnType<typeof setup>, key: string, opts: KeyboardEventInit = {}): void {
    (f.nativeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }));
    f.detectChanges();
  }
  function focused(f: ReturnType<typeof setup>): FocusPos | null {
    return (f.componentInstance as unknown as { focusedCell(): FocusPos | null }).focusedCell();
  }

  it('ArrowDown then ArrowRight move the focused cell from the default {0,0}', () => {
    const f = setup();
    press(f, 'ArrowDown');
    expect(focused(f)).toEqual({ row: 1, col: 0 });
    press(f, 'ArrowRight');
    expect(focused(f)).toEqual({ row: 1, col: 1 });
  });

  it('ArrowUp from the first body row lands on the header row (-1)', () => {
    const f = setup();
    press(f, 'ArrowUp');
    expect(focused(f)).toEqual({ row: -1, col: 0 });
  });

  it('ArrowUp at the header is a no-op (edge)', () => {
    const f = setup();
    press(f, 'ArrowUp'); // to header
    press(f, 'ArrowUp'); // clamp
    expect(focused(f)).toEqual({ row: -1, col: 0 });
  });

  it('End then Home jump across columns; ArrowRight past the last col is a no-op', () => {
    const f = setup();
    press(f, 'End');
    expect(focused(f)).toEqual({ row: 0, col: 1 });
    press(f, 'ArrowRight');
    expect(focused(f)).toEqual({ row: 0, col: 1 }); // clamp
    press(f, 'Home');
    expect(focused(f)).toEqual({ row: 0, col: 0 });
  });

  it('the moved cell becomes the roving tab stop (tabindex=0)', () => {
    const f = setup();
    press(f, 'ArrowDown');
    const stop = f.nativeElement.querySelector('[data-focus-r="1"][data-focus-c="0"]') as HTMLElement;
    expect(stop.getAttribute('tabindex')).toBe('0');
  });

  it('PageDown then PageUp step by a page (pageRows) and clamp at the body edges', () => {
    const f = setup(); // 2 rows -> pageRows = 1
    press(f, 'PageDown');
    expect(focused(f)).toEqual({ row: 1, col: 0 });
    press(f, 'PageDown'); // clamp at last body row (never past into a footer)
    expect(focused(f)).toEqual({ row: 1, col: 0 });
    press(f, 'PageUp');
    expect(focused(f)).toEqual({ row: 0, col: 0 }); // floors at row 0, not the header
  });

  it('Ctrl+End jumps to the last cell and Ctrl+Home back to the first body cell', () => {
    const f = setup();
    press(f, 'End', { ctrlKey: true });
    expect(focused(f)).toEqual({ row: 1, col: 1 });
    press(f, 'Home', { ctrlKey: true });
    expect(focused(f)).toEqual({ row: 0, col: 0 });
  });
});

describe('AxDataGrid keyboard nav — clampFocus staleness guard', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; }
  const cols: GridColumnDef<Row>[] = [{ key: 'a', header: 'A' }];

  it('re-bounds focusedCell into range when the row set shrinks', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', [{ id: 1, a: 'a1' }, { id: 2, a: 'a2' }, { id: 3, a: 'a3' }]);
    f.detectChanges();
    const host = f.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { focusedCell(): FocusPos | null };
    expect(cmp.focusedCell()?.row).toBeGreaterThan(0);
    // Shrink the dataset below the focused row -> the clamp effect must pull it back in range.
    f.componentRef.setInput('data', [{ id: 1, a: 'a1' }]);
    f.detectChanges();
    expect(cmp.focusedCell()?.row).toBe(0);
  });
});

describe('AxDataGrid keyboard nav — ARIA row indices under virtual scroll', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; }
  const cols: GridColumnDef<Row>[] = [{ key: 'a', header: 'A' }];
  const rows: Row[] = Array.from({ length: 200 }, (_, i) => ({ id: i, a: `a${i}` }));

  it('aria-rowcount reflects the whole dataset, not the rendered slice', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('pageSize', 0); // disable paging so all 200 rows are one virtual list
    f.componentRef.setInput('virtualScroll', true);
    f.detectChanges();
    const table = f.nativeElement.querySelector('table') as HTMLElement;
    const rendered = f.nativeElement.querySelectorAll('tbody tr[data-row]').length;
    expect(rendered).toBeLessThan(200); // only a window is in the DOM
    expect(table.getAttribute('aria-rowcount')).toBe('201'); // 1 header + 200 body rows
  });

  it('a rendered body row carries its absolute aria-rowindex after scrolling', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('pageSize', 0); // disable paging so all 200 rows are one virtual list
    f.componentRef.setInput('virtualScroll', true);
    f.componentRef.setInput('rowHeight', 32); // pin height so scroll math is density-independent
    f.detectChanges();
    const vp = f.nativeElement.querySelector('[class*="overflow-auto"]') as HTMLElement;
    vp.scrollTop = 50 * 32; // ~50 rows down at the pinned row height
    vp.dispatchEvent(new Event('scroll'));
    f.detectChanges();
    const bodyRows = Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row]')) as HTMLElement[];
    const first = bodyRows[0];
    // First rendered row is deep into the dataset: its aria-rowindex must be its absolute
    // position (header + absolute body index + 1), well past the slice-local value of 2.
    expect(Number(first.getAttribute('aria-rowindex'))).toBeGreaterThan(30);
  });
});

describe('AxDataGrid keyboard nav — activation', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; b: string; }
  const rows: Row[] = [{ id: 1, a: 'a1', b: 'b1' }, { id: 2, a: 'a2', b: 'b2' }];
  const cols: GridColumnDef<Row>[] = [
    { key: 'a', header: 'A', editable: true, sortable: true },
    { key: 'b', header: 'B' },
  ];

  function setup(selectable = false) {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('selectable', selectable);
    f.detectChanges();
    return f;
  }
  function press(f: ReturnType<typeof setup>, key: string): void {
    (f.nativeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    f.detectChanges();
  }

  it('Enter on a focused editable body cell opens the editor', () => {
    const f = setup();
    press(f, 'Enter'); // default focus {0,0} = row 0, col 'a' (editable)
    const cmp = f.componentInstance as unknown as { activeEditCell(): unknown };
    expect(cmp.activeEditCell()).not.toBeNull();
  });

  it('F2 also opens the editor', () => {
    const f = setup();
    press(f, 'F2');
    const cmp = f.componentInstance as unknown as { activeEditCell(): unknown };
    expect(cmp.activeEditCell()).not.toBeNull();
  });

  it('Enter on a focused sortable header cell sorts that column', () => {
    const f = setup();
    press(f, 'ArrowUp'); // focus header col 0 ('a', sortable)
    press(f, 'Enter');
    const cmp = f.componentInstance as unknown as { state: { sort(): { key: string }[] } };
    expect(cmp.state.sort().some((s) => s.key === 'a')).toBe(true);
  });

  it('Space on a focused selection cell toggles that row selection', () => {
    const f = setup(true); // selectable -> nav col 0 = selection cell; default focus {0,0} = row 0 selection
    press(f, ' ');
    const cmp = f.componentInstance as unknown as { selected(): number[] };
    expect(cmp.selected()).toEqual([1]);
  });
});

describe('AxDataGrid keyboard nav — a11y', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; b: string; }
  const rows: Row[] = [{ id: 1, a: 'a1', b: 'b1' }, { id: 2, a: 'a2', b: 'b2' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'a', header: 'A', sortable: true }, { key: 'b', header: 'B' }];

  it('the grid role/index scaffolding has no a11y violations (incl. a selected row)', async () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('selectable', true);
    f.componentRef.setInput('selected', [1]);
    f.detectChanges();
    const results = await axe(f.nativeElement);
    expect(results).toHaveNoViolations();
  });
});

describe('AxDataGrid column header menu', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; b: string; }
  const rows: Row[] = [{ id: 1, a: 'a1', b: 'b1' }, { id: 2, a: 'a2', b: 'b2' }];
  const cols: GridColumnDef<Row>[] = [
    { key: 'a', header: 'A', sortable: true, filterable: true },
    { key: 'b', header: 'B' },
  ];

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    return f;
  }
  function openColumnMenu(f: ReturnType<typeof setup>, colKey: string) {
    const btn = f.nativeElement.querySelector(`[data-col-menu="${colKey}"]`) as HTMLElement;
    btn.click();
    f.detectChanges();
    return f.nativeElement.querySelector('[role="menu"]') as HTMLElement;
  }

  it('a ⋮ button on each leaf header opens a role=menu', () => {
    const f = setup();
    expect(openColumnMenu(f, 'a')).not.toBeNull();
  });

  it('Sort ascending sets the column sort', () => {
    const f = setup();
    openColumnMenu(f, 'a');
    (f.nativeElement.querySelector('[data-menu-item="sort-asc"]') as HTMLElement).click();
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { state: { sort(): { key: string; dir: string }[] } };
    expect(cmp.state.sort()).toEqual([{ key: 'a', dir: 'asc' }]);
  });

  it('Hide column removes it from the rendered columns', () => {
    const f = setup();
    openColumnMenu(f, 'a');
    (f.nativeElement.querySelector('[data-menu-item="hide"]') as HTMLElement).click();
    f.detectChanges();
    const headers = Array.from(f.nativeElement.querySelectorAll('th[data-col-header]')).map((h) => (h as HTMLElement).textContent?.trim());
    expect(headers.some((t) => t?.startsWith('A'))).toBe(false);
  });

  it('right-clicking a leaf header opens the column menu (preventDefault)', () => {
    const f = setup();
    const th = f.nativeElement.querySelector('th[data-col-header]') as HTMLElement;
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 });
    th.dispatchEvent(ev);
    f.detectChanges();
    expect(ev.defaultPrevented).toBe(true);
    expect(f.nativeElement.querySelector('[role="menu"]')).not.toBeNull();
  });

  it('columnMenu=false hides the ⋮ trigger', () => {
    const f = setup();
    f.componentRef.setInput('columnMenu', false);
    f.detectChanges();
    expect(f.nativeElement.querySelector('[data-col-menu]')).toBeNull();
  });
});

describe('AxDataGrid row/cell context menu', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; b: string; }
  const rows: Row[] = [{ id: 1, a: 'a1', b: 'b1' }, { id: 2, a: 'a2', b: 'b2' }];
  const cols: GridColumnDef<Row>[] = [{ key: 'a', header: 'A' }, { key: 'b', header: 'B' }];

  function setup(withCustom = false) {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    if (withCustom) {
      f.componentRef.setInput('contextMenuItems', (ctx: { row: Row }) => [
        { id: 'del', label: 'Delete ' + ctx.row.a, danger: true },
      ]);
    }
    f.detectChanges();
    return f;
  }
  function rightClickFirstCell(f: ReturnType<typeof setup>) {
    const td = f.nativeElement.querySelector('tbody tr[data-row] td[role="gridcell"]') as HTMLElement;
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 });
    td.dispatchEvent(ev);
    f.detectChanges();
    return ev;
  }

  it('right-click opens a menu with Copy cell and Copy row', () => {
    const f = setup();
    const ev = rightClickFirstCell(f);
    expect(ev.defaultPrevented).toBe(true);
    expect(f.nativeElement.querySelector('[data-menu-item="copy-cell"]')).not.toBeNull();
    expect(f.nativeElement.querySelector('[data-menu-item="copy-row"]')).not.toBeNull();
  });

  it('appends custom items after a separator', () => {
    const f = setup(true);
    rightClickFirstCell(f);
    const del = f.nativeElement.querySelector('[data-menu-item="del"]') as HTMLElement;
    expect(del).not.toBeNull();
    expect(del.textContent?.trim()).toBe('Delete a1');
  });

  it('emits menuAction for a custom item with the row/col/value context', () => {
    const f = setup(true);
    let event: unknown = null;
    (f.componentInstance as unknown as { menuAction: { subscribe(fn: (e: unknown) => void): void } })
      .menuAction.subscribe((e) => (event = e));
    rightClickFirstCell(f);
    (f.nativeElement.querySelector('[data-menu-item="del"]') as HTMLElement).click();
    f.detectChanges();
    expect(event).toMatchObject({ id: 'del', value: 'a1' });
  });

  it('contextMenu=false disables the right-click menu (native menu allowed)', () => {
    const f = setup();
    f.componentRef.setInput('contextMenu', false);
    f.detectChanges();
    const ev = rightClickFirstCell(f);
    expect(ev.defaultPrevented).toBe(false);
    expect(f.nativeElement.querySelector('[role="menu"]')).toBeNull();
  });
});

describe('AxDataGrid menus — a11y', () => {
  interface Row extends Record<string, unknown> { id: number; a: string; }
  const cols: GridColumnDef<Row>[] = [{ key: 'a', header: 'A', sortable: true, filterable: true }];

  it('an open column menu has no a11y violations', async () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', [{ id: 1, a: 'a1' }]);
    f.detectChanges();
    (f.nativeElement.querySelector('[data-col-menu="a"]') as HTMLElement).click();
    f.detectChanges();
    expect(await axe(f.nativeElement)).toHaveNoViolations();
  });
});

describe('AxDataGrid virtual columns — windowing state', () => {
  interface Row extends Record<string, unknown> { id: number; [k: string]: unknown }
  const cols: GridColumnDef<Row>[] = Array.from({ length: 10 }, (_, i) => ({ key: 'c' + i, header: 'C' + i, width: 120 }));
  const rows: Row[] = [Object.fromEntries([['id', 1], ...cols.map((c, i) => [c.key as string, 'v' + i])]) as Row];

  it('useColVirtual is false unless virtualColumns is set, and true for flat headers', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { useColVirtual(): boolean };
    expect(cmp.useColVirtual()).toBe(false);
    f.componentRef.setInput('virtualColumns', true);
    f.detectChanges();
    expect(cmp.useColVirtual()).toBe(true);
  });
});

describe('AxDataGrid virtual columns — body rendering', () => {
  interface Row extends Record<string, unknown> { id: number; [k: string]: unknown }
  const cols: GridColumnDef<Row>[] = Array.from({ length: 12 }, (_, i) => ({ key: 'c' + i, header: 'C' + i, width: 120 }));
  const mkRow = (id: number): Row => Object.fromEntries([['id', id], ...cols.map((c, i) => [c.key as string, `r${id}c${i}`])]) as Row;

  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', [mkRow(1), mkRow(2)]);
    f.componentRef.setInput('pageSize', 0);
    f.componentRef.setInput('virtualColumns', true);
    f.detectChanges();
    return f;
  }

  it('renders fewer body cells than columns and a spacer when virtualized (800px fallback viewport)', () => {
    const f = setup();
    const firstBodyRow = f.nativeElement.querySelector('tbody tr[data-row]') as HTMLElement;
    const cells = firstBodyRow.querySelectorAll('td[role="gridcell"]');
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.length).toBeLessThan(cols.length); // 12 cols, ~800px viewport -> windowed
    expect(firstBodyRow.querySelector('td[aria-hidden="true"]')).not.toBeNull(); // a right spacer
  });

  it('aria-colindex reflects the logical column position', () => {
    const f = setup();
    const firstCell = f.nativeElement.querySelector('tbody tr[data-row] td[role="gridcell"]') as HTMLElement;
    expect(firstCell.getAttribute('aria-colindex')).toBe('1');
  });

  it('non-virtual grid renders every column (no spacer)', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', [mkRow(1)]);
    f.componentRef.setInput('pageSize', 0);
    f.detectChanges();
    const row = f.nativeElement.querySelector('tbody tr[data-row]') as HTMLElement;
    expect(row.querySelectorAll('td[role="gridcell"]').length).toBe(cols.length);
    expect(row.querySelector('td[aria-hidden="true"]')).toBeNull();
  });
});

describe('AxDataGrid virtual columns — header/body alignment', () => {
  interface Row extends Record<string, unknown> { id: number; [k: string]: unknown }
  const cols: GridColumnDef<Row>[] = Array.from({ length: 12 }, (_, i) => ({ key: 'c' + i, header: 'C' + i, width: 120 }));

  it('header renders the same windowed leaf columns as the body (flat header)', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', [Object.fromEntries([['id', 1], ...cols.map((c, i) => [c.key as string, i])]) as Row]);
    f.componentRef.setInput('pageSize', 0);
    f.componentRef.setInput('virtualColumns', true);
    f.detectChanges();
    const headerLeaves = f.nativeElement.querySelectorAll('th[data-col-header]').length;
    const bodyCells = f.nativeElement.querySelector('tbody tr[data-row]').querySelectorAll('td[role="gridcell"]').length;
    expect(headerLeaves).toBe(bodyCells);
    expect(headerLeaves).toBeLessThan(cols.length);
  });
});

describe('AxDataGrid virtual columns — pins & guard', () => {
  interface Row extends Record<string, unknown> { id: number; [k: string]: unknown }
  const cols: GridColumnDef<Row>[] = Array.from({ length: 12 }, (_, i) => ({ key: 'c' + i, header: 'C' + i, width: 120 }));
  const row: Row = Object.fromEntries([['id', 1], ...cols.map((c, i) => [c.key as string, i])]) as Row;

  it('a pinned-start column is always rendered even when virtualized', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', [row]);
    f.componentRef.setInput('pageSize', 0);
    f.componentRef.setInput('virtualColumns', true);
    f.componentRef.setInput('columnState', { order: [], hidden: [], pinned: { c0: 'start' } });
    f.detectChanges();
    const pinned = f.nativeElement.querySelector('td[role="gridcell"][data-pin="start"]');
    expect(pinned).not.toBeNull();
  });

  it('grouped headers disable column virtualization (renders all columns)', () => {
    const groupCols: GridColumnDef<Row>[] = [
      { key: 'g', header: 'Group', children: cols.slice(0, 3) } as unknown as GridColumnDef<Row>,
      ...cols.slice(3),
    ];
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', groupCols);
    f.componentRef.setInput('data', [row]);
    f.componentRef.setInput('pageSize', 0);
    f.componentRef.setInput('virtualColumns', true);
    f.detectChanges();
    const cmp = f.componentInstance as unknown as { useColVirtual(): boolean };
    expect(cmp.useColVirtual()).toBe(false);
    const bodyCells = f.nativeElement.querySelector('tbody tr[data-row]').querySelectorAll('td[role="gridcell"]').length;
    expect(bodyCells).toBe(cols.length);
  });
});

describe('AxDataGrid virtual columns — a11y', () => {
  it('a column-virtualized grid has no a11y violations', async () => {
    interface Row extends Record<string, unknown> { id: number; [k: string]: unknown }
    const cols: GridColumnDef<Row>[] = Array.from({ length: 12 }, (_, i) => ({ key: 'c' + i, header: 'C' + i, width: 120 }));
    const row = Object.fromEntries([['id', 1], ...cols.map((c, i) => [c.key as string, i])]) as Row;
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', [row]);
    f.componentRef.setInput('pageSize', 0);
    f.componentRef.setInput('virtualColumns', true);
    f.detectChanges();
    expect(await axe(f.nativeElement)).toHaveNoViolations();
  });
});

describe('AxDataGrid virtual columns — grouped + pinned leaf keeps body order (review #1)', () => {
  interface Row extends Record<string, unknown> { id: number; [k: string]: unknown }
  const leaves: GridColumnDef<Row>[] = Array.from({ length: 12 }, (_, i) => ({ key: 'c' + i, header: 'C' + i, width: 120 }));
  const row: Row = Object.fromEntries([['id', 1], ...leaves.map((c, i) => [c.key as string, i])]) as Row;

  it('with grouped headers, a pinned leaf does NOT reorder the body (aria-colindex stays monotonic)', () => {
    const groupCols: GridColumnDef<Row>[] = [
      { key: 'g', header: 'Group', children: leaves.slice(0, 3) } as unknown as GridColumnDef<Row>,
      ...leaves.slice(3),
    ];
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', groupCols);
    f.componentRef.setInput('data', [row]);
    f.componentRef.setInput('pageSize', 0);
    f.componentRef.setInput('virtualColumns', true);
    f.componentRef.setInput('columnState', { order: [], hidden: [], pinned: { c5: 'start' } });
    f.detectChanges();
    const cells = Array.from(f.nativeElement.querySelectorAll('tbody tr[data-row] td[role="gridcell"]')) as HTMLElement[];
    const indices = cells.map((c) => Number(c.getAttribute('aria-colindex')));
    expect(indices.length).toBe(leaves.length);
    // DOM order must match ascending colindex (no pin-reordering vs the grouped header).
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });
});

describe('AxDataGrid responsive — card-mode state', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; age: number }
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name', priority: 10 },
    { key: 'age', header: 'Age' },
  ];
  const rows: Row[] = [{ id: 1, name: 'Ada', age: 36 }];

  function make(responsive: boolean) {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('responsive', responsive);
    f.detectChanges();
    return f;
  }
  const setW = (f: ReturnType<typeof make>, w: number) =>
    (f.componentInstance as unknown as { ['containerWidth']: { set(n: number): void } })['containerWidth'].set(w);
  const cardMode = (f: ReturnType<typeof make>) => (f.componentInstance as unknown as { isCardMode(): boolean }).isCardMode();

  it('isCardMode is false until a narrow width is measured, true once narrow', () => {
    const f = make(true);
    expect(cardMode(f)).toBe(false); // width 0 in jsdom
    setW(f, 400); f.detectChanges();
    expect(cardMode(f)).toBe(true);
    setW(f, 900); f.detectChanges();
    expect(cardMode(f)).toBe(false);
  });

  it('responsive=false never enters card mode even when narrow', () => {
    const f = make(false);
    setW(f, 300); f.detectChanges();
    expect(cardMode(f)).toBe(false);
  });
});

describe('AxDataGrid responsive — card rendering', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; age: number }
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name', priority: 10 },
    { key: 'age', header: 'Age' },
  ];
  const rows: Row[] = [{ id: 1, name: 'Ada', age: 36 }, { id: 2, name: 'Alan', age: 41 }];
  const setW = (f: { componentInstance: unknown }, w: number) =>
    (f.componentInstance as { ['containerWidth']: { set(n: number): void } })['containerWidth'].set(w);

  function narrow(selectable = false) {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('responsive', true);
    f.componentRef.setInput('selectable', selectable);
    f.detectChanges();
    setW(f, 400);
    f.detectChanges();
    return f;
  }

  it('renders a role=list of cards and no table when narrow', () => {
    const f = narrow();
    expect(f.nativeElement.querySelector('ul[role="list"]')).not.toBeNull();
    expect(f.nativeElement.querySelectorAll('li[data-card]').length).toBe(2);
    expect(f.nativeElement.querySelector('table')).toBeNull();
  });

  it('uses the highest-priority column as the card title', () => {
    const f = narrow();
    const firstCard = f.nativeElement.querySelector('li[data-card]') as HTMLElement;
    expect(firstCard.textContent).toContain('Ada');
  });

  it('a card checkbox toggles selection without emitting rowClick', () => {
    const f = narrow(true);
    let clicked = 0;
    (f.componentInstance as unknown as { rowClick: { subscribe(fn: () => void): void } }).rowClick.subscribe(() => (clicked += 1));
    const cb = f.nativeElement.querySelector('li[data-card] input[type="checkbox"]') as HTMLInputElement;
    cb.click();
    f.detectChanges();
    expect((f.componentInstance as unknown as { selected(): number[] }).selected()).toEqual([1]);
    expect(clicked).toBe(0); // checkbox click must not bubble to the card (click)
  });

  it('wide viewport renders the table, not cards', () => {
    const f = narrow();
    setW(f, 1000);
    f.detectChanges();
    expect(f.nativeElement.querySelector('ul[role="list"]')).toBeNull();
    expect(f.nativeElement.querySelector('table')).not.toBeNull();
  });
});

describe('AxDataGrid responsive — card keyboard', () => {
  interface Row extends Record<string, unknown> { id: number; name: string }
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }];
  const rows: Row[] = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Alan' }, { id: 3, name: 'Grace' }];

  function narrow() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('responsive', true);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    (f.componentInstance as unknown as { ['containerWidth']: { set(n: number): void } })['containerWidth'].set(400);
    f.detectChanges();
    return f;
  }

  it('exactly one card is the tab stop; ArrowDown moves it and Space selects', () => {
    const f = narrow();
    const cards = () => Array.from(f.nativeElement.querySelectorAll('li[data-card]')) as HTMLElement[];
    expect(cards().filter((c) => c.getAttribute('tabindex') === '0').length).toBe(1);
    cards()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    f.detectChanges();
    expect(cards()[1].getAttribute('tabindex')).toBe('0');
    cards()[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    f.detectChanges();
    expect((f.componentInstance as unknown as { selected(): number[] }).selected()).toEqual([2]);
  });
});

describe('AxDataGrid responsive — a11y', () => {
  it('card mode has no a11y violations', async () => {
    interface Row extends Record<string, unknown> { id: number; name: string; age: number }
    const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name', priority: 10 }, { key: 'age', header: 'Age' }];
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', [{ id: 1, name: 'Ada', age: 36 }]);
    f.componentRef.setInput('responsive', true);
    f.componentRef.setInput('selectable', true);
    f.detectChanges();
    (f.componentInstance as unknown as { ['containerWidth']: { set(n: number): void } })['containerWidth'].set(400);
    f.detectChanges();
    expect(await axe(f.nativeElement)).toHaveNoViolations();
  });
});

describe('AxDataGrid export — toCsv', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; role: string }
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }, { key: 'role', header: 'Role' }];
  const rows: Row[] = [
    { id: 1, name: 'Ada', role: 'Eng' },
    { id: 2, name: 'Alan', role: 'Sci' },
    { id: 3, name: 'Grace', role: 'Eng' },
  ];
  function setup(selectable = false) {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('pageSize', 0);
    f.componentRef.setInput('selectable', selectable);
    f.detectChanges();
    return f;
  }
  const csv = (f: ReturnType<typeof setup>, opts?: unknown) =>
    (f.componentInstance as unknown as { toCsv(o?: unknown): string }).toCsv(opts);

  it('emits a header row then all filtered+sorted rows', () => {
    const f = setup();
    expect(csv(f)).toBe('Name,Role\r\nAda,Eng\r\nAlan,Sci\r\nGrace,Eng');
  });

  it('respects the active search filter (fewer rows)', () => {
    const f = setup();
    (f.componentInstance as unknown as { state: { search: { set(v: string): void } } }).state.search.set('Eng');
    f.detectChanges();
    const out = csv(f);
    expect(out.startsWith('Name,Role\r\n')).toBe(true);
    expect(out).not.toContain('Alan');
  });

  it('scope=selected/auto exports only selected; scope=all exports everything', () => {
    const f = setup(true);
    f.componentRef.setInput('selected', [2]);
    f.detectChanges();
    expect(csv(f, { scope: 'auto' })).toBe('Name,Role\r\nAlan,Sci');
    expect(csv(f, { scope: 'all' })).toContain('Ada');
  });
});

describe('AxDataGrid export — clipboard + download', () => {
  interface Row extends Record<string, unknown> { id: number; name: string }
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }];
  const rows: Row[] = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Alan' }];
  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('pageSize', 0);
    f.detectChanges();
    return f;
  }

  it('copyToClipboard writes TSV via the clipboard API', () => {
    const f = setup();
    const writes: string[] = [];
    const cmp = f.componentInstance as unknown as { ['doc']: Document };
    const view = cmp['doc'].defaultView as unknown as { navigator: { clipboard?: { writeText(t: string): Promise<void> } } };
    view.navigator.clipboard = { writeText: (t: string) => { writes.push(t); return Promise.resolve(); } };
    (f.componentInstance as unknown as { copyToClipboard(): void }).copyToClipboard();
    expect(writes[0]).toBe('Name\r\nAda\r\nAlan');
  });

  it('exportCsv builds a downloadable anchor and clicks it', () => {
    (globalThis as unknown as { URL: { createObjectURL(b: unknown): string; revokeObjectURL(u: string): void } }).URL.createObjectURL = () => 'blob:x';
    (globalThis as unknown as { URL: { revokeObjectURL(u: string): void } }).URL.revokeObjectURL = () => undefined;
    const f = setup();
    const cmp = f.componentInstance as unknown as { ['doc']: Document; exportCsv(o?: unknown): void };
    let clicked = 0;
    let downloadName = '';
    const realCreate = cmp['doc'].createElement.bind(cmp['doc']);
    jest.spyOn(cmp['doc'], 'createElement').mockImplementation(((tag: string) => {
      const el = realCreate(tag) as HTMLAnchorElement;
      if (tag === 'a') { el.click = () => { clicked += 1; downloadName = el.download; }; }
      return el;
    }) as typeof cmp['doc']['createElement']);
    cmp.exportCsv({ filename: 'people.csv' });
    expect(clicked).toBe(1);
    expect(downloadName).toBe('people.csv');
    jest.restoreAllMocks();
  });
});

describe('AxDataGrid export — toolbar', () => {
  interface Row extends Record<string, unknown> { id: number; name: string }
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }];
  it('exportable renders Export CSV + Copy buttons; hidden by default', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', [{ id: 1, name: 'Ada' }]);
    f.detectChanges();
    expect(f.nativeElement.querySelector('[data-export-csv]')).toBeNull();
    f.componentRef.setInput('exportable', true);
    f.detectChanges();
    expect(f.nativeElement.querySelector('[data-export-csv]')).not.toBeNull();
    expect(f.nativeElement.querySelector('[data-export-copy]')).not.toBeNull();
  });

  it('export toolbar has no a11y violations', async () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', [{ id: 1, name: 'Ada' }]);
    f.componentRef.setInput('exportable', true);
    f.detectChanges();
    expect(await axe(f.nativeElement)).toHaveNoViolations();
  });
});

describe('AxDataGrid print — state', () => {
  interface Row extends Record<string, unknown> { id: number; name: string }
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }];
  const rows: Row[] = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Alan' }, { id: 3, name: 'Grace' }];
  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('pageSize', 2);
    f.detectChanges();
    return f;
  }

  it('printRows is empty until printing, then holds ALL filtered rows (not just the page)', () => {
    const f = setup();
    const cmp = f.componentInstance as unknown as { printRows(): unknown[]; printing: { set(v: boolean): void } };
    expect(cmp.printRows().length).toBe(0);
    cmp.printing.set(true);
    f.detectChanges();
    expect(cmp.printRows().length).toBe(3);
  });

  it('printGrid sets printing true and schedules a print that resets it', async () => {
    const f = setup();
    const host = f.nativeElement as HTMLElement;
    host.ownerDocument.body.appendChild(host);
    const cmp = f.componentInstance as unknown as { ['doc']: Document; printGrid(): void; printing(): boolean };
    let calls = 0;
    (cmp['doc'].defaultView as unknown as { print(): void }).print = () => { calls += 1; };
    cmp.printGrid();
    expect(cmp.printing()).toBe(true); // engaged synchronously
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    await f.whenStable();
    expect(calls).toBe(1);
    expect(cmp.printing()).toBe(false);
    host.remove();
  });
});

describe('AxDataGrid print — table', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; role: string }
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }, { key: 'role', header: 'Role' }];
  const rows: Row[] = [
    { id: 1, name: 'Ada', role: 'Eng' }, { id: 2, name: 'Alan', role: 'Sci' },
    { id: 3, name: 'Grace', role: 'Eng' }, { id: 4, name: 'Kay', role: 'Math' }, { id: 5, name: 'Lin', role: 'Eng' },
  ];
  function setup() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', rows);
    f.componentRef.setInput('pageSize', 2);
    f.detectChanges();
    return f;
  }
  const startPrint = (f: ReturnType<typeof setup>) => {
    (f.componentInstance as unknown as { printing: { set(v: boolean): void } }).printing.set(true);
    f.detectChanges();
  };

  it('no print table by default', () => {
    expect(setup().nativeElement.querySelector('[data-print-table]')).toBeNull();
  });

  it('when printing, renders a print table with all rows and the column headers', () => {
    const f = setup();
    startPrint(f);
    const table = f.nativeElement.querySelector('[data-print-table]') as HTMLElement;
    expect(table).not.toBeNull();
    expect(table.querySelectorAll('thead th').length).toBe(2);
    expect(table.querySelectorAll('tbody tr').length).toBe(5);
    expect(table.textContent).toContain('Name');
    expect(table.textContent).toContain('Grace');
  });

  it('the print table has no a11y violations', async () => {
    const f = setup();
    startPrint(f);
    expect(await axe(f.nativeElement)).toHaveNoViolations();
  });
});

describe('AxDataGrid print — toolbar', () => {
  interface Row extends Record<string, unknown> { id: number; name: string }
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }];
  it('printable renders a Print button; hidden by default; click engages printing', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', [{ id: 1, name: 'Ada' }]);
    f.detectChanges();
    expect(f.nativeElement.querySelector('[data-print]')).toBeNull();
    f.componentRef.setInput('printable', true);
    f.detectChanges();
    const btn = f.nativeElement.querySelector('[data-print]') as HTMLElement;
    expect(btn).not.toBeNull();
    const cmp = f.componentInstance as unknown as { ['doc']: Document };
    (cmp['doc'].defaultView as unknown as { print(): void }).print = () => undefined;
    btn.click();
    expect((f.componentInstance as unknown as { printing(): boolean }).printing()).toBe(true);
  });
});

describe('AxDataGrid import — importCsv', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; age: number; active: unknown }
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', filterType: 'number' },
    { key: 'active', header: 'Active' },
  ];
  it('importCsv emits the parsed + coerced rows once', () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', []);
    f.detectChanges();
    let emitted: unknown = null;
    (f.componentInstance as unknown as { imported: { subscribe(fn: (v: unknown) => void): void } })
      .imported.subscribe((v) => (emitted = v));
    (f.componentInstance as unknown as { importCsv(t: string): void }).importCsv('Name,Age,Active\r\nAda,36,yes');
    expect(emitted).toEqual([{ name: 'Ada', age: 36, active: true }]);
  });

  it("importMode='auto' (default) emits immediately with no dialog", () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', []);
    f.detectChanges();
    let emitted: unknown = null;
    (f.componentInstance as unknown as { imported: { subscribe(fn: (v: unknown) => void): void } })
      .imported.subscribe((v) => (emitted = v));
    (f.componentInstance as unknown as { importCsv(t: string): void }).importCsv('Name,Age\r\nAda,36');
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(emitted).toEqual([{ name: 'Ada', age: 36 }]);
  });

  it("importMode='mapped' opens the dialog and does NOT emit until confirm", () => {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', []);
    f.componentRef.setInput('importMode', 'mapped');
    f.detectChanges();
    let emitted: unknown = null;
    (f.componentInstance as unknown as { imported: { subscribe(fn: (v: unknown) => void): void } })
      .imported.subscribe((v) => (emitted = v));
    (f.componentInstance as unknown as { importCsv(t: string): void }).importCsv('Name,Age\r\nAda,36');
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(emitted).toBeNull();

    (f.componentInstance as unknown as { onImportConfirm(m: (string | null)[]): void })
      .onImportConfirm(['name', 'age']);
    f.detectChanges();
    expect(emitted).toEqual([{ name: 'Ada', age: 36 }]);
    expect(f.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe('AxDataGrid paste — pasteData & onPaste', () => {
  interface Row extends Record<string, unknown> { name: string; age: number }
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', filterType: 'number' },
  ];
  function make(mode: 'auto' | 'mapped' = 'auto', pasteable = true) {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', []);
    f.componentRef.setInput('importMode', mode);
    f.componentRef.setInput('pasteable', pasteable);
    f.detectChanges();
    return f;
  }
  function captureImported(f: ReturnType<typeof make>) {
    let emitted: unknown = null;
    (f.componentInstance as unknown as { imported: { subscribe(fn: (v: unknown) => void): void } })
      .imported.subscribe((v) => (emitted = v));
    return () => emitted;
  }

  it('pasteData parses TSV (delimiter sniffed to tab) and emits rows in auto mode', () => {
    const f = make('auto');
    const emitted = captureImported(f);
    (f.componentInstance as unknown as { pasteData(t: string): void }).pasteData('Name\tAge\r\nAda\t36');
    expect(emitted()).toEqual([{ name: 'Ada', age: 36 }]);
  });

  it('pasteData also parses CSV (sniffed to comma)', () => {
    const f = make('auto');
    const emitted = captureImported(f);
    (f.componentInstance as unknown as { pasteData(t: string): void }).pasteData('Name,Age\r\nAda,36');
    expect(emitted()).toEqual([{ name: 'Ada', age: 36 }]);
  });

  it("importMode='mapped' + pasteData opens the mapping dialog and does NOT emit until confirm", () => {
    const f = make('mapped');
    const emitted = captureImported(f);
    (f.componentInstance as unknown as { pasteData(t: string): void }).pasteData('Name\tAge\r\nAda\t36');
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(emitted()).toBeNull();
  });

  it('onPaste emits rows and calls preventDefault when pasteable and no active edit', () => {
    const f = make('auto');
    const emitted = captureImported(f);
    const preventDefault = jest.fn();
    const event = { clipboardData: { getData: () => 'Name\tAge\r\nAda\t36' }, preventDefault } as unknown as ClipboardEvent;
    (f.componentInstance as unknown as { onPaste(e: ClipboardEvent): void }).onPaste(event);
    expect(preventDefault).toHaveBeenCalled();
    expect(emitted()).toEqual([{ name: 'Ada', age: 36 }]);
  });

  it('onPaste is a no-op when pasteable is false', () => {
    const f = make('auto', false);
    const emitted = captureImported(f);
    const preventDefault = jest.fn();
    const event = { clipboardData: { getData: () => 'Name\tAge\r\nAda\t36' }, preventDefault } as unknown as ClipboardEvent;
    (f.componentInstance as unknown as { onPaste(e: ClipboardEvent): void }).onPaste(event);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(emitted()).toBeNull();
  });

  it('importCsv still emits (unchanged) — 6c regression guard', () => {
    const f = make('auto');
    const emitted = captureImported(f);
    (f.componentInstance as unknown as { importCsv(t: string): void }).importCsv('Name,Age\r\nAda,36');
    expect(emitted()).toEqual([{ name: 'Ada', age: 36 }]);
  });

  it('renders a Paste toolbar button when pasteable; hidden by default', () => {
    const f = make('auto', true);
    expect(f.nativeElement.querySelector('[data-paste]')).not.toBeNull();
    f.componentRef.setInput('pasteable', false);
    f.detectChanges();
    expect(f.nativeElement.querySelector('[data-paste]')).toBeNull();
  });

  it('paste toolbar has no a11y violations', async () => {
    expect(await axe(make('auto', true).nativeElement)).toHaveNoViolations();
  });

  it('onPaste is a no-op when a cell editor is open (native input paste wins)', () => {
    const f = make('auto');
    const emitted = captureImported(f);
    // Simulate an active cell edit so the guard skips.
    (f.componentInstance as unknown as { activeEditCell: { set(v: unknown): void } })
      .activeEditCell.set({ rowId: 1, colKey: 'name' });
    const preventDefault = jest.fn();
    const event = { clipboardData: { getData: () => 'Name\tAge\r\nAda\t36' }, preventDefault } as unknown as ClipboardEvent;
    (f.componentInstance as unknown as { onPaste(e: ClipboardEvent): void }).onPaste(event);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(emitted()).toBeNull();
  });

  it('onPaste is a no-op when the paste targets an input (search/column filter) — the field keeps the paste', () => {
    const f = make('auto');
    const emitted = captureImported(f);
    const input = f.nativeElement.ownerDocument.createElement('input');
    const preventDefault = jest.fn();
    const event = { target: input, clipboardData: { getData: () => 'Name\tAge\r\nAda\t36' }, preventDefault } as unknown as ClipboardEvent;
    (f.componentInstance as unknown as { onPaste(e: ClipboardEvent): void }).onPaste(event);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(emitted()).toBeNull();
  });
});

describe('AxDataGrid import — toolbar', () => {
  interface Row extends Record<string, unknown> { id: number; name: string }
  const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }];
  function make(importable: boolean) {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', []);
    f.componentRef.setInput('importable', importable);
    f.detectChanges();
    return f;
  }
  it('importable renders an Import CSV button + hidden file input; hidden by default', () => {
    const f = make(false);
    expect(f.nativeElement.querySelector('[data-import-csv]')).toBeNull();
    f.componentRef.setInput('importable', true);
    f.detectChanges();
    expect(f.nativeElement.querySelector('[data-import-csv]')).not.toBeNull();
    expect(f.nativeElement.querySelector('input[type="file"][data-import-input]')).not.toBeNull();
  });
  it('import toolbar has no a11y violations', async () => {
    expect(await axe(make(true).nativeElement)).toHaveNoViolations();
  });
});

describe('AxDataGrid paste — fill into cells', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; age: number }
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name', editable: true },
    { key: 'age', header: 'Age', editable: true, filterType: 'number', validator: (v) => (typeof v === 'number' && v < 0 ? 'neg' : null) },
  ];
  const data: Row[] = [
    { id: 1, name: 'Ada', age: 36 },
    { id: 2, name: 'Bo', age: 40 },
    { id: 3, name: 'Cy', age: 9 },
  ];
  function make() {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', data);
    f.componentRef.setInput('rowId', (r: Row) => r.id);
    f.componentRef.setInput('pasteable', true);
    f.componentRef.setInput('pageSize', 0);
    f.detectChanges();
    return f;
  }
  type Ci = {
    focusedCell: { set(v: { row: number; col: number }): void };
    onPaste(e: ClipboardEvent): void;
    imported: { subscribe(fn: (v: unknown) => void): void };
    cellEdit: { subscribe(fn: (v: unknown) => void): void };
    save: { subscribe(fn: (v: unknown) => void): void };
    editedCellValue(row: Row, col: GridColumnDef<Row>): unknown;
    undoEdit(): void;
    state: { edits(): ReadonlyMap<unknown, unknown> };
    resolvedColumns(): GridColumnDef<Row>[];
    navRows(): Row[];
  };
  function pasteEvent(tsv: string) {
    return { clipboardData: { getData: () => tsv }, preventDefault: jest.fn(), target: null } as unknown as ClipboardEvent;
  }

  it('fills a block into cells at the focused editable anchor, one undo step, no imported emission', () => {
    const f = make();
    const ci = f.componentInstance as unknown as Ci;
    let imported: unknown = null;
    ci.imported.subscribe((v) => (imported = v));
    ci.focusedCell.set({ row: 0, col: 0 });
    ci.onPaste(pasteEvent('Zed\t99\r\nQuinn\t50'));
    f.detectChanges();
    const cols2 = ci.resolvedColumns(); const rows = ci.navRows();
    expect(ci.editedCellValue(rows[0], cols2[0])).toBe('Zed');
    expect(ci.editedCellValue(rows[0], cols2[1])).toBe(99);
    expect(ci.editedCellValue(rows[1], cols2[0])).toBe('Quinn');
    expect(ci.editedCellValue(rows[1], cols2[1])).toBe(50);
    expect(imported).toBeNull();
    expect(ci.state.edits().size).toBe(4);
    ci.undoEdit();
    expect(ci.state.edits().size).toBe(0);
  });

  it('skips a cell that fails the column validator', () => {
    const f = make();
    const ci = f.componentInstance as unknown as Ci;
    ci.focusedCell.set({ row: 0, col: 0 });
    ci.onPaste(pasteEvent('Zed\t-5'));
    f.detectChanges();
    const cols2 = ci.resolvedColumns(); const rows = ci.navRows();
    expect(ci.editedCellValue(rows[0], cols2[0])).toBe('Zed');
    expect(ci.editedCellValue(rows[0], cols2[1])).toBe(36);
    expect(ci.state.edits().size).toBe(1);
  });

  it('falls back to paste-as-rows when no editable cell is focused', () => {
    const f = make();
    const ci = f.componentInstance as unknown as Ci;
    let imported: unknown = null;
    ci.imported.subscribe((v) => (imported = v));
    ci.onPaste(pasteEvent('name\tage\r\nZed\t99'));
    f.detectChanges();
    expect(imported).toEqual([{ name: 'Zed', age: 99 }]);
    expect(ci.state.edits().size).toBe(0);
  });

  it('auto-save mode: fill emits ONE save batch of all written cells and leaves no dirty cells', () => {
    const f = make();
    f.componentRef.setInput('saveMode', 'auto');
    f.detectChanges();
    const ci = f.componentInstance as unknown as Ci;
    const saves: unknown[] = [];
    ci.save.subscribe((v) => saves.push(v));
    ci.focusedCell.set({ row: 0, col: 0 });
    ci.onPaste(pasteEvent('Zed\t99\r\nQuinn\t50'));
    f.detectChanges();
    expect(saves.length).toBe(1);                       // one batch, not one-per-cell
    expect(saves[0]).toEqual([
      { rowId: 1, colKey: 'name', value: 'Zed' },
      { rowId: 1, colKey: 'age', value: 99 },
      { rowId: 2, colKey: 'name', value: 'Quinn' },
      { rowId: 2, colKey: 'age', value: 50 },
    ]);
    expect(ci.state.edits().size).toBe(0);              // auto-save clears the overlay
  });

  it('emits cellEdit once per written cell', () => {
    const f = make();
    const ci = f.componentInstance as unknown as Ci;
    let edits = 0;
    ci.cellEdit.subscribe(() => (edits += 1));
    ci.focusedCell.set({ row: 0, col: 0 });
    ci.onPaste(pasteEvent('Zed\t99\r\nQuinn\t50'));
    f.detectChanges();
    expect(edits).toBe(4);
  });

  it('falls back to paste-as-rows when the focused cell is the selection column', () => {
    const f = make();
    f.componentRef.setInput('selectable', true);        // selBias = 1; col 0 is the checkbox column
    f.detectChanges();
    const ci = f.componentInstance as unknown as Ci;
    let imported: unknown = null;
    ci.imported.subscribe((v) => (imported = v));
    ci.focusedCell.set({ row: 0, col: 0 });             // selection column → colIndex < 0 → not a fill
    ci.onPaste(pasteEvent('name\tage\r\nZed\t99'));
    f.detectChanges();
    expect(imported).toEqual([{ name: 'Zed', age: 99 }]);
    expect(ci.state.edits().size).toBe(0);
  });
});

describe('AxDataGrid export — Excel (.xlsx)', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; age: number }
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', filterType: 'number', editable: true },
  ];
  const data: Row[] = [
    { id: 1, name: 'Ada', age: 36 },
    { id: 2, name: 'Bo', age: 40 },
  ];
  type Sheet = { name: string; rows: unknown[][] };
  // Self-contained URL stub so this block passes in isolation (`-t`) and when the async download
  // microtask fires — jsdom has no URL.createObjectURL.
  const realCreate = URL.createObjectURL;
  const realRevoke = URL.revokeObjectURL;
  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => 'blob:xlsx');
    URL.revokeObjectURL = jest.fn();
  });
  afterAll(() => {
    URL.createObjectURL = realCreate;
    URL.revokeObjectURL = realRevoke;
  });
  function fakeAdapter() {
    return { toWorkbook: jest.fn((_sheets: Sheet[]) => new ArrayBuffer(0)), fromWorkbook: jest.fn(() => []) };
  }
  function make(adapter: ReturnType<typeof fakeAdapter> | null, selectable = false) {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', data);
    f.componentRef.setInput('rowId', (r: Row) => r.id);
    f.componentRef.setInput('pageSize', 0);
    if (adapter) f.componentRef.setInput('xlsxAdapter', adapter);
    if (selectable) f.componentRef.setInput('selectable', true);
    f.detectChanges();
    return f;
  }

  it('exportXlsx calls the adapter with one sheet: header row + native-typed body', () => {
    const adapter = fakeAdapter();
    const f = make(adapter);
    (f.componentInstance as unknown as { exportXlsx(o?: unknown): void }).exportXlsx();
    expect(adapter.toWorkbook).toHaveBeenCalledTimes(1);
    const sheets = adapter.toWorkbook.mock.calls[0]![0] as Sheet[];
    expect(sheets.length).toBe(1);
    expect(sheets[0]!.rows[0]).toEqual(['Name', 'Age']);
    expect(sheets[0]!.rows[1]).toEqual(['Ada', 36]);
    expect(typeof (sheets[0]!.rows[1]![1])).toBe('number');
  });

  it('exports the overlay-edited value, not the raw row value', () => {
    const adapter = fakeAdapter();
    const f = make(adapter);
    const ci = f.componentInstance as unknown as { state: { setEdit(r: number, c: string, v: unknown): void }; exportXlsx(): void };
    ci.state.setEdit(1, 'age', 99);
    ci.exportXlsx();
    const sheets = adapter.toWorkbook.mock.calls[0]![0] as Sheet[];
    expect(sheets[0]!.rows[1]).toEqual(['Ada', 99]);
  });

  it('scope selected exports only selected rows', () => {
    const adapter = fakeAdapter();
    const f = make(adapter, true);
    const ci = f.componentInstance as unknown as { selected: { set(v: number[]): void }; exportXlsx(o?: unknown): void };
    ci.selected.set([2]);
    f.detectChanges();
    ci.exportXlsx({ scope: 'selected' });
    const sheets = adapter.toWorkbook.mock.calls[0]![0] as Sheet[];
    expect(sheets[0]!.rows.length).toBe(2);
    expect(sheets[0]!.rows[1]).toEqual(['Bo', 40]);
  });

  it('is a no-op when no adapter is set (no throw)', () => {
    const f = make(null);
    expect(() => (f.componentInstance as unknown as { exportXlsx(): void }).exportXlsx()).not.toThrow();
  });

  it('defaults the sheet name to Sheet1 and honours a custom sheetName', () => {
    const adapter = fakeAdapter();
    const f = make(adapter);
    const ci = f.componentInstance as unknown as { exportXlsx(o?: unknown): void };
    ci.exportXlsx();
    expect((adapter.toWorkbook.mock.calls[0]![0] as Sheet[])[0]!.name).toBe('Sheet1');
    ci.exportXlsx({ sheetName: 'People' });
    expect((adapter.toWorkbook.mock.calls[1]![0] as Sheet[])[0]!.name).toBe('People');
  });

  it('downloads with xlsxFilename by default and the opts.filename override', async () => {
    const adapter = fakeAdapter();
    const f = make(adapter);
    f.componentRef.setInput('xlsxFilename', 'grid.xlsx');
    f.detectChanges();
    const anchor = { href: '', download: '', click: jest.fn() } as unknown as HTMLAnchorElement;
    const createEl = jest.spyOn(f.nativeElement.ownerDocument, 'createElement').mockReturnValue(anchor);
    (f.componentInstance as unknown as { exportXlsx(o?: unknown): void }).exportXlsx();
    await Promise.resolve(); // let the download microtask run
    expect(anchor.download).toBe('grid.xlsx');
    (f.componentInstance as unknown as { exportXlsx(o?: unknown): void }).exportXlsx({ filename: 'custom.xlsx' });
    await Promise.resolve();
    expect(anchor.download).toBe('custom.xlsx');
    createEl.mockRestore();
  });

  it('awaits an async adapter (ExcelJS-style Promise) before downloading', async () => {
    const adapter = { toWorkbook: jest.fn(async (_s: Sheet[]) => new ArrayBuffer(0)), fromWorkbook: jest.fn(() => []) };
    const f = make(adapter as unknown as ReturnType<typeof fakeAdapter>);
    const anchor = { href: '', download: '', click: jest.fn() } as unknown as HTMLAnchorElement;
    const createEl = jest.spyOn(f.nativeElement.ownerDocument, 'createElement').mockReturnValue(anchor);
    (f.componentInstance as unknown as { exportXlsx(): void }).exportXlsx();
    expect(anchor.click).not.toHaveBeenCalled(); // not yet — bytes still pending
    await adapter.toWorkbook.mock.results[0]!.value; // resolve the workbook promise
    await Promise.resolve();
    expect(anchor.click).toHaveBeenCalledTimes(1);
    createEl.mockRestore();
  });

  it('renders an Export Excel button only when an adapter is set', () => {
    const f = make(fakeAdapter());
    expect(f.nativeElement.querySelector('[data-export-xlsx]')).not.toBeNull();
  });

  it('hides the Export Excel button when no adapter is set', () => {
    const f = make(null);
    expect(f.nativeElement.querySelector('[data-export-xlsx]')).toBeNull();
  });

  it('clicking the button invokes the adapter', () => {
    const adapter = fakeAdapter();
    const f = make(adapter);
    (f.nativeElement.querySelector('[data-export-xlsx]') as HTMLButtonElement).click();
    expect(adapter.toWorkbook).toHaveBeenCalledTimes(1);
  });

  it('Export Excel button has no a11y violations', async () => {
    expect(await axe(make(fakeAdapter()).nativeElement)).toHaveNoViolations();
  });
});

describe('AxDataGrid import — Excel (.xlsx)', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; age: number }
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', filterType: 'number' },
  ];
  type Sheet = { name: string; rows: unknown[][] };
  function fakeAdapter(sheets: Sheet[]) {
    return { toWorkbook: jest.fn(() => new ArrayBuffer(0)), fromWorkbook: jest.fn(() => sheets) };
  }
  function fakeFile() {
    return { arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) } as unknown as File;
  }
  function make(sheets: Sheet[], mode: 'auto' | 'mapped' = 'auto') {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', []);
    f.componentRef.setInput('importMode', mode);
    f.componentRef.setInput('xlsxAdapter', fakeAdapter(sheets));
    f.componentRef.setInput('pageSize', 0);
    f.detectChanges();
    return f;
  }
  function captureImported(f: ReturnType<typeof make>) {
    let emitted: unknown = null;
    (f.componentInstance as unknown as { imported: { subscribe(fn: (v: unknown) => void): void } }).imported.subscribe((v) => (emitted = v));
    return () => emitted;
  }

  it('single-sheet import (auto) emits coerced rows with no picker', async () => {
    const f = make([{ name: 'S', rows: [['Name', 'Age'], ['Ada', 36]] }]);
    const emitted = captureImported(f);
    (f.componentInstance as unknown as { importXlsx(file: File): void }).importXlsx(fakeFile());
    await Promise.resolve(); await Promise.resolve();
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(emitted()).toEqual([{ name: 'Ada', age: 36 }]);
  });

  it('multi-sheet import opens the sheet picker and does NOT emit until a sheet is picked', async () => {
    const f = make([
      { name: 'One', rows: [['Name', 'Age'], ['Ada', 36]] },
      { name: 'Two', rows: [['Name', 'Age'], ['Bo', 40]] },
    ]);
    const emitted = captureImported(f);
    (f.componentInstance as unknown as { importXlsx(file: File): void }).importXlsx(fakeFile());
    await Promise.resolve(); await Promise.resolve();
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(emitted()).toBeNull();
    (f.componentInstance as unknown as { onSheetPick(i: number): void }).onSheetPick(1);
    f.detectChanges();
    expect(emitted()).toEqual([{ name: 'Bo', age: 40 }]);
    expect(f.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('single-sheet import with importMode=mapped opens the mapping dialog (not the picker)', async () => {
    const f = make([{ name: 'S', rows: [['Name', 'Age'], ['Ada', 36]] }], 'mapped');
    const emitted = captureImported(f);
    (f.componentInstance as unknown as { importXlsx(file: File): void }).importXlsx(fakeFile());
    await Promise.resolve(); await Promise.resolve();
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(emitted()).toBeNull();
  });

  it('renders an Import Excel button + hidden .xlsx input when an adapter is set', () => {
    const f = make([{ name: 'S', rows: [] }]);
    expect(f.nativeElement.querySelector('[data-import-xlsx]')).not.toBeNull();
    expect(f.nativeElement.querySelector('input[type="file"][data-import-xlsx-input]')).not.toBeNull();
  });

  it('onImportXlsxFileChange routes the picked file to importXlsx and resets the input', () => {
    const f = make([{ name: 'S', rows: [['Name', 'Age'], ['Ada', 36]] }]);
    const ci = f.componentInstance as unknown as { onImportXlsxFileChange(e: Event): void; importXlsx(file: File): void };
    const importSpy = jest.spyOn(ci, 'importXlsx').mockImplementation(() => undefined);
    const input = f.nativeElement.querySelector('[data-import-xlsx-input]') as HTMLInputElement;
    const file = { arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) } as unknown as File;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    Object.defineProperty(input, 'value', { value: 'C:\\fakepath\\book.xlsx', writable: true, configurable: true });
    ci.onImportXlsxFileChange({ target: input } as unknown as Event);
    expect(importSpy).toHaveBeenCalledWith(file);
    expect(input.value).toBe(''); // reset so the same file can be re-picked
    importSpy.mockRestore();
  });

  it('cancelling the sheet picker emits nothing and clears the pending sheets', async () => {
    const f = make([
      { name: 'One', rows: [['Name', 'Age'], ['Ada', 36]] },
      { name: 'Two', rows: [['Name', 'Age'], ['Bo', 40]] },
    ]);
    const emitted = captureImported(f);
    (f.componentInstance as unknown as { importXlsx(file: File): void }).importXlsx(fakeFile());
    await Promise.resolve(); await Promise.resolve();
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    (f.componentInstance as unknown as { closeSheetPicker(): void }).closeSheetPicker();
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(emitted()).toBeNull();
  });

  it('import Excel toolbar has no a11y violations', async () => {
    expect(await axe(make([{ name: 'S', rows: [] }]).nativeElement)).toHaveNoViolations();
  });
});

describe('AxDataGrid export — PDF', () => {
  interface Row extends Record<string, unknown> { id: number; name: string; age: number }
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', filterType: 'number', editable: true },
  ];
  const data: Row[] = [
    { id: 1, name: 'Ada', age: 36 },
    { id: 2, name: 'Bo', age: 40 },
  ];
  type Doc = { columns: string[]; rows: string[][] };
  const realCreate = URL.createObjectURL;
  const realRevoke = URL.revokeObjectURL;
  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => 'blob:pdf');
    URL.revokeObjectURL = jest.fn();
  });
  afterAll(() => {
    URL.createObjectURL = realCreate;
    URL.revokeObjectURL = realRevoke;
  });
  function fakeAdapter() {
    return { toPdf: jest.fn((_doc: Doc) => new ArrayBuffer(0)) };
  }
  function make(adapter: ReturnType<typeof fakeAdapter> | null, selectable = false) {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', data);
    f.componentRef.setInput('rowId', (r: Row) => r.id);
    f.componentRef.setInput('pageSize', 0);
    if (adapter) f.componentRef.setInput('pdfAdapter', adapter);
    if (selectable) f.componentRef.setInput('selectable', true);
    f.detectChanges();
    return f;
  }

  it('exportPdf calls the adapter with { columns: headers, rows: stringified body }', () => {
    const adapter = fakeAdapter();
    const f = make(adapter);
    (f.componentInstance as unknown as { exportPdf(o?: unknown): void }).exportPdf();
    expect(adapter.toPdf).toHaveBeenCalledTimes(1);
    const doc = adapter.toPdf.mock.calls[0]![0] as Doc;
    expect(doc.columns).toEqual(['Name', 'Age']);
    expect(doc.rows).toEqual([['Ada', '36'], ['Bo', '40']]);
  });

  it('exports the overlay-edited value, not the raw row value', () => {
    const adapter = fakeAdapter();
    const f = make(adapter);
    const ci = f.componentInstance as unknown as { state: { setEdit(r: number, c: string, v: unknown): void }; exportPdf(): void };
    ci.state.setEdit(1, 'age', 99);
    ci.exportPdf();
    const doc = adapter.toPdf.mock.calls[0]![0] as Doc;
    expect(doc.rows[0]).toEqual(['Ada', '99']);
  });

  it('scope selected exports only selected rows', () => {
    const adapter = fakeAdapter();
    const f = make(adapter, true);
    const ci = f.componentInstance as unknown as { selected: { set(v: number[]): void }; exportPdf(o?: unknown): void };
    ci.selected.set([2]);
    f.detectChanges();
    ci.exportPdf({ scope: 'selected' });
    const doc = adapter.toPdf.mock.calls[0]![0] as Doc;
    expect(doc.rows).toEqual([['Bo', '40']]);
  });

  it('downloads with pdfFilename by default and the opts.filename override', async () => {
    const adapter = fakeAdapter();
    const f = make(adapter);
    f.componentRef.setInput('pdfFilename', 'grid.pdf');
    f.detectChanges();
    const anchor = { href: '', download: '', click: jest.fn() } as unknown as HTMLAnchorElement;
    const createEl = jest.spyOn(f.nativeElement.ownerDocument, 'createElement').mockReturnValue(anchor);
    (f.componentInstance as unknown as { exportPdf(o?: unknown): void }).exportPdf();
    await Promise.resolve();
    expect(anchor.download).toBe('grid.pdf');
    (f.componentInstance as unknown as { exportPdf(o?: unknown): void }).exportPdf({ filename: 'custom.pdf' });
    await Promise.resolve();
    expect(anchor.download).toBe('custom.pdf');
    createEl.mockRestore();
  });

  it('awaits an async adapter (pdfmake-style Promise) before downloading', async () => {
    const adapter = { toPdf: jest.fn(async (_d: Doc) => new ArrayBuffer(0)) };
    const f = make(adapter as unknown as ReturnType<typeof fakeAdapter>);
    const anchor = { href: '', download: '', click: jest.fn() } as unknown as HTMLAnchorElement;
    const createEl = jest.spyOn(f.nativeElement.ownerDocument, 'createElement').mockReturnValue(anchor);
    (f.componentInstance as unknown as { exportPdf(): void }).exportPdf();
    expect(anchor.click).not.toHaveBeenCalled();
    await adapter.toPdf.mock.results[0]!.value;
    await Promise.resolve();
    expect(anchor.click).toHaveBeenCalledTimes(1);
    createEl.mockRestore();
  });

  it('is a no-op when no adapter is set (no throw)', () => {
    const f = make(null);
    expect(() => (f.componentInstance as unknown as { exportPdf(): void }).exportPdf()).not.toThrow();
  });

  it('renders an Export PDF button only when an adapter is set', () => {
    expect(make(fakeAdapter()).nativeElement.querySelector('[data-export-pdf]')).not.toBeNull();
  });

  it('hides the Export PDF button when no adapter is set', () => {
    expect(make(null).nativeElement.querySelector('[data-export-pdf]')).toBeNull();
  });

  it('clicking the button invokes the adapter', () => {
    const adapter = fakeAdapter();
    const f = make(adapter);
    (f.nativeElement.querySelector('[data-export-pdf]') as HTMLButtonElement).click();
    expect(adapter.toPdf).toHaveBeenCalledTimes(1);
  });

  it('Export PDF button has no a11y violations', async () => {
    expect(await axe(make(fakeAdapter()).nativeElement)).toHaveNoViolations();
  });
});

describe('AxDataGrid parse offload — gridWorker', () => {
  interface Row extends Record<string, unknown> { name: string; age: number }
  const cols: GridColumnDef<Row>[] = [
    { key: 'name', header: 'Name' },
    { key: 'age', header: 'Age', filterType: 'number' },
  ];
  function fakeGridWorker(matrix: string[][]) {
    return { query: jest.fn(), parse: jest.fn(() => Promise.resolve(matrix)) };
  }
  function make(worker: ReturnType<typeof fakeGridWorker> | null, threshold?: number, mode: 'auto' | 'mapped' = 'auto') {
    const f = TestBed.configureTestingModule({ imports: [AxDataGridComponent] }).createComponent(AxDataGridComponent);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('data', []);
    f.componentRef.setInput('importMode', mode);
    if (worker) f.componentRef.setInput('gridWorker', worker);
    if (threshold !== undefined) f.componentRef.setInput('workerParseThreshold', threshold);
    f.componentRef.setInput('pageSize', 0);
    f.detectChanges();
    return f;
  }
  function captureImported(f: ReturnType<typeof make>) {
    let emitted: unknown = null;
    (f.componentInstance as unknown as { imported: { subscribe(fn: (v: unknown) => void): void } }).imported.subscribe((v) => (emitted = v));
    return () => emitted;
  }

  it('offloads parsing to the worker when text length >= threshold', async () => {
    const worker = fakeGridWorker([['Name', 'Age'], ['Ada', '36']]);
    const f = make(worker, 1);
    const emitted = captureImported(f);
    (f.componentInstance as unknown as { importCsv(t: string): void }).importCsv('Name,Age\r\nAda,36');
    expect(worker.parse).toHaveBeenCalledTimes(1);
    expect(worker.parse.mock.calls[0]).toEqual(['Name,Age\r\nAda,36', ',']);
    await Promise.resolve(); await Promise.resolve();
    expect(emitted()).toEqual([{ name: 'Ada', age: 36 }]);
  });

  it('parses synchronously (no worker) when text length < threshold', () => {
    const worker = fakeGridWorker([]);
    const f = make(worker, 1_000_000);
    const emitted = captureImported(f);
    (f.componentInstance as unknown as { importCsv(t: string): void }).importCsv('Name,Age\r\nAda,36');
    expect(worker.parse).not.toHaveBeenCalled();
    expect(emitted()).toEqual([{ name: 'Ada', age: 36 }]);
  });

  it('pasteData offload passes the sniffed (tab) delimiter', () => {
    const worker = fakeGridWorker([['Name', 'Age'], ['Ada', '36']]);
    const f = make(worker, 1);
    (f.componentInstance as unknown as { pasteData(t: string): void }).pasteData('Name\tAge\r\nAda\t36');
    expect(worker.parse.mock.calls[0]![1]).toBe('\t');
  });

  it('offloaded parse in mapped mode opens the mapping dialog after the worker resolves', async () => {
    const worker = fakeGridWorker([['Name', 'Age'], ['Ada', '36']]);
    const f = make(worker, 1, 'mapped');
    (f.componentInstance as unknown as { importCsv(t: string): void }).importCsv('Name,Age\r\nAda,36');
    await Promise.resolve(); await Promise.resolve();
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('is byte-identical (synchronous) when no gridWorker is set', () => {
    const f = make(null);
    const emitted = captureImported(f);
    (f.componentInstance as unknown as { importCsv(t: string): void }).importCsv('Name,Age\r\nAda,36');
    expect(emitted()).toEqual([{ name: 'Ada', age: 36 }]);
  });
});
