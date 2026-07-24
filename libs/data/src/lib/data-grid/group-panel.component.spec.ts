import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AxDataGridGroupPanelComponent } from './group-panel.component';
import { type GridColumnDef } from './grid-core';

interface Row extends Record<string, unknown> { name: string; age: number; city: string }
const COLS: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age' },
  { key: 'city', header: 'City' },
];

@Component({
  standalone: true,
  imports: [AxDataGridGroupPanelComponent],
  template: `<ax-data-grid-group-panel [columns]="cols" [(groupBy)]="gb" />`,
})
class Host { cols = COLS; gb = signal<(keyof Row)[]>(['name']); }

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [Host] });
  const f = TestBed.createComponent(Host);
  f.detectChanges();
  return f;
}

describe('AxDataGridGroupPanel', () => {
  it('renders a chip per grouped column', () => {
    const f = setup();
    const chips = f.nativeElement.querySelectorAll('[data-group-chip]');
    expect(chips.length).toBe(1);
    expect(chips[0].textContent).toContain('Name');
  });
  it('removing a chip updates groupBy', () => {
    const f = setup();
    (f.nativeElement.querySelector('[data-group-chip] [data-remove]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.gb()).toEqual([]);
  });
  it('adding via the select appends a column', () => {
    const f = setup();
    const sel = f.nativeElement.querySelector('[data-add-group]') as HTMLSelectElement;
    sel.value = 'city'; sel.dispatchEvent(new Event('change'));
    f.detectChanges();
    expect(f.componentInstance.gb()).toEqual(['name', 'city']);
  });
});
