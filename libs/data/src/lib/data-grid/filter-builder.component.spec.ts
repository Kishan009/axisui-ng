import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AxDataGridFilterBuilderComponent } from './filter-builder.component';
import { GridState } from './grid-state';
import { emptyGroup, newCondition } from './filter-model';
import { type GridColumnDef } from './grid-core';

interface Row extends Record<string, unknown> { name: string; age: number }
const COLS: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name', filterType: 'text' },
  { key: 'age', header: 'Age', filterType: 'number' },
];

@Component({
  standalone: true,
  imports: [AxDataGridFilterBuilderComponent],
  template: `<ax-data-grid-filter-builder [state]="state" [columns]="cols" />`,
})
class Host {
  state = new GridState<Row>();
  cols = COLS;
}

function setup(seed?: (h: Host) => void) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [Host] });
  const f = TestBed.createComponent(Host);
  if (seed) seed(f.componentInstance);
  f.detectChanges();
  return f;
}

describe('AxDataGridFilterBuilder', () => {
  it('seeds an empty root group when none exists and "Add condition" adds a row', () => {
    const f = setup();
    (f.nativeElement.querySelector('[data-add-condition]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('[data-condition]').length).toBe(1);
    const model = f.componentInstance.state.filterModel();
    expect(model?.children.length).toBe(1);
  });

  it('editing a condition value writes through to the model', () => {
    const f = setup((h) => h.state.setFilterModel({ ...emptyGroup<Row>(), children: [newCondition<Row>('name')] }));
    const input = f.nativeElement.querySelector('[data-condition] [data-value]') as HTMLInputElement;
    input.value = 'ali';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    const c = f.componentInstance.state.filterModel()!.children[0];
    expect(c.kind === 'condition' && c.value).toBe('ali');
  });

  it('toggling the group combinator to OR updates the model', () => {
    const f = setup((h) => h.state.setFilterModel({ ...emptyGroup<Row>(), children: [newCondition<Row>('name')] }));
    (f.nativeElement.querySelector('[data-combinator="or"]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.state.filterModel()!.combinator).toBe('or');
  });

  it('"Clear all" removes the model', () => {
    const f = setup((h) => h.state.setFilterModel({ ...emptyGroup<Row>(), children: [newCondition<Row>('name')] }));
    (f.nativeElement.querySelector('[data-clear-all]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.state.filterModel()).toBeNull();
  });

  it('adding a nested group then a condition inside it nests correctly', () => {
    const f = setup((h) => h.state.setFilterModel(emptyGroup<Row>()));
    (f.nativeElement.querySelector('[data-add-group]') as HTMLButtonElement).click();
    f.detectChanges();
    // the nested group renders its own add-condition button (2 total now)
    const addButtons = f.nativeElement.querySelectorAll('[data-add-condition]');
    expect(addButtons.length).toBe(2);
    // addButtons[0] is the nested group's (it renders before the root group's own buttons)
    (addButtons[0] as HTMLButtonElement).click();
    f.detectChanges();
    const root = f.componentInstance.state.filterModel()!;
    const nested = root.children[0];
    expect(nested.kind === 'group' && nested.children.length).toBe(1);
  });
});
