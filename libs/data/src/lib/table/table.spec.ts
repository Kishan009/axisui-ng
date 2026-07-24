import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxTableComponent } from './table.component';
import type { ColDef } from './table.types';

expect.extend(toHaveNoViolations);

interface Row {
  name: string;
  age: number;
}

@Component({
  standalone: true,
  imports: [AxTableComponent],
  template: `
    <ax-table
      [columns]="columns"
      [data]="data"
      [pageSize]="2"
      [searchable]="true"
      (rowClick)="clicked = $event"
    />
  `,
})
class HostComponent {
  columns: ColDef<Row>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'age', header: 'Age', sortable: true, align: 'end' },
  ];
  data: Row[] = [
    { name: 'Charlie', age: 30 },
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 35 },
  ];
  clicked: Row | null = null;
}

function bodyRows(el: HTMLElement) {
  return Array.from(el.querySelectorAll('tbody tr')) as HTMLElement[];
}

describe('AxTableComponent', () => {
  it('paginates to pageSize rows', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(bodyRows(fixture.nativeElement).length).toBe(2);
  });

  it('sorts ascending then descending on header click', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const nameHeader = fixture.nativeElement.querySelector('th button') as HTMLButtonElement;
    nameHeader.click();
    fixture.detectChanges();
    let first = bodyRows(fixture.nativeElement)[0].textContent ?? '';
    expect(first).toContain('Alice');
    nameHeader.click();
    fixture.detectChanges();
    first = bodyRows(fixture.nativeElement)[0].textContent ?? '';
    expect(first).toContain('Charlie');
  });

  it('filters rows by search text', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'bob';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const rows = bodyRows(fixture.nativeElement);
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Bob');
  });

  it('emits rowClick with the row data', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    bodyRows(fixture.nativeElement)[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clicked).not.toBeNull();
  });

  it('reflects sort state on the header via aria-sort', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const nameTh = fixture.nativeElement.querySelector('th') as HTMLElement;
    expect(nameTh.getAttribute('scope')).toBe('col');
    expect(nameTh.getAttribute('aria-sort')).toBe('none');
    (nameTh.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(nameTh.getAttribute('aria-sort')).toBe('ascending');
    (nameTh.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(nameTh.getAttribute('aria-sort')).toBe('descending');
  });

  it('wraps the table in a horizontal-scroll container for narrow viewports', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('table')?.parentElement as HTMLElement;
    expect(wrapper.className).toContain('overflow-x-auto');
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
