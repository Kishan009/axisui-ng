import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AxDataGridColumnPanelComponent } from './column-panel.component';
import { type ColumnState } from './column-model';
import { type GridColumnDef } from './grid-core';

interface Row extends Record<string, unknown> { a: string; b: string }
const COLS: GridColumnDef<Row>[] = [{ key: 'a', header: 'Alpha' }, { key: 'b', header: 'Beta' }];

@Component({
  standalone: true,
  imports: [AxDataGridColumnPanelComponent],
  template: `<ax-data-grid-column-panel [columns]="cols" [(columnState)]="cs" />`,
})
class Host { cols = COLS; cs = signal<ColumnState>({ order: [], hidden: [] }); }

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [Host] });
  const f = TestBed.createComponent(Host);
  f.detectChanges();
  return f;
}

describe('AxDataGridColumnPanel', () => {
  it('renders a checkbox per column, checked when visible', () => {
    const f = setup();
    const boxes = f.nativeElement.querySelectorAll('[data-col-toggle]');
    expect(boxes.length).toBe(2);
    expect(boxes[0].checked).toBe(true);
  });
  it('unchecking hides the column', () => {
    const f = setup();
    (f.nativeElement.querySelector('[data-col-toggle="a"]') as HTMLInputElement).click();
    f.detectChanges();
    expect(f.componentInstance.cs().hidden).toEqual(['a']);
  });
  it('disables the last visible checkbox', () => {
    const f = setup();
    f.componentInstance.cs.set({ order: [], hidden: ['a'] });
    f.detectChanges();
    const last = f.nativeElement.querySelector('[data-col-toggle="b"]') as HTMLInputElement;
    expect(last.disabled).toBe(true);
  });
});

describe('AxDataGridColumnPanel pinning', () => {
  it('pin-start button pins the column start; clicking again unpins', () => {
    const f = setup();
    (f.nativeElement.querySelector('[data-pin-start="a"]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.cs().pinned).toEqual({ a: 'start' });
    (f.nativeElement.querySelector('[data-pin-start="a"]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.cs().pinned).toEqual({});
  });
  it('pin-end button pins the column end', () => {
    const f = setup();
    (f.nativeElement.querySelector('[data-pin-end="b"]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.cs().pinned).toEqual({ b: 'end' });
  });
});
