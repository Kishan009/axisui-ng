import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AxDataGridSortPanelComponent } from './sort-panel.component';
import { GridState } from './grid-state';
import { type GridColumnDef } from './grid-core';

interface Row extends Record<string, unknown> { name: string; age: number }
const COLS: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age' },
];

@Component({
  standalone: true,
  imports: [AxDataGridSortPanelComponent],
  template: `<ax-data-grid-sort-panel [state]="state" [columns]="cols" />`,
})
class Host {
  state = new GridState<Row>();
  cols = COLS;
  constructor() {
    this.state.toggleSort('name');
    this.state.toggleSort('age', true);
  }
}

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [Host] });
  const f = TestBed.createComponent(Host);
  f.detectChanges();
  return f;
}

describe('AxDataGridSortPanel', () => {
  it('lists active sorts in priority order using column headers', () => {
    const f = setup();
    const rows = Array.from(f.nativeElement.querySelectorAll('[data-sort-row]')) as HTMLElement[];
    expect(rows.map((r) => r.getAttribute('data-sort-row'))).toEqual(['name', 'age']);
    expect(rows[0].textContent).toContain('Name');
  });
  it('remove drops a sort', () => {
    const f = setup();
    (f.nativeElement.querySelector('[data-sort-row="name"] [data-remove]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.state.sort().map((s) => s.key)).toEqual(['age']);
  });
  it('move-down reorders', () => {
    const f = setup();
    (f.nativeElement.querySelector('[data-sort-row="name"] [data-down]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.state.sort().map((s) => s.key)).toEqual(['age', 'name']);
  });
  it('dir toggle flips direction', () => {
    const f = setup();
    (f.nativeElement.querySelector('[data-sort-row="name"] [data-dir]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.state.sort()[0]).toEqual({ key: 'name', dir: 'desc' });
  });
  it('shows empty state when no sorts', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Host] });
    const f = TestBed.createComponent(Host);
    f.componentInstance.state.sort.set([]);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No sorts');
  });
});
