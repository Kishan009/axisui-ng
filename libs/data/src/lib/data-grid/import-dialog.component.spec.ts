import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AxDataGridImportDialogComponent } from './import-dialog.component';
import { type GridColumnDef } from './grid-core';

expect.extend(toHaveNoViolations);

interface Row extends Record<string, unknown> { name: string; age: number }
const cols: GridColumnDef<Row>[] = [{ key: 'name', header: 'Name' }, { key: 'age', header: 'Age', filterType: 'number' }];

function setup(mapping: (string | null)[] = ['name', 'age']) {
  const f = TestBed.configureTestingModule({ imports: [AxDataGridImportDialogComponent] })
    .createComponent(AxDataGridImportDialogComponent<Row>);
  f.componentRef.setInput('headers', ['Name', 'Age']);
  f.componentRef.setInput('preview', [['Ada', '36']]);
  f.componentRef.setInput('columns', cols);
  f.componentRef.setInput('initialMapping', mapping);
  f.detectChanges();
  return f;
}

describe('AxDataGridImportDialogComponent', () => {
  it('renders a role=dialog with one select per header (Ignore + a column each), preselected', () => {
    const f = setup();
    expect(f.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    const selects = f.nativeElement.querySelectorAll('select');
    expect(selects.length).toBe(2);
    expect((selects[0] as HTMLSelectElement).value).toBe('name');
    expect(selects[0].querySelectorAll('option').length).toBe(cols.length + 1);
  });

  it('Confirm emits the current mapping; changing a select is reflected', () => {
    const f = setup();
    let emitted: (string | null)[] | null = null;
    (f.componentInstance as unknown as { confirm: { subscribe(fn: (v: (string | null)[]) => void): void } })
      .confirm.subscribe((v) => (emitted = v));
    const second = f.nativeElement.querySelectorAll('select')[1] as HTMLSelectElement;
    second.value = '';
    second.dispatchEvent(new Event('change'));
    f.detectChanges();
    (f.nativeElement.querySelector('[data-import-confirm]') as HTMLElement).click();
    expect(emitted).toEqual(['name', null]);
  });

  it('Cancel and Escape both emit cancel; backdrop click cancels but card click does not', () => {
    const f = setup();
    let cancels = 0;
    (f.componentInstance as unknown as { cancel: { subscribe(fn: () => void): void } }).cancel.subscribe(() => (cancels += 1));
    (f.nativeElement.querySelector('[data-import-cancel]') as HTMLElement).click();
    (f.nativeElement.querySelector('[role="dialog"]') as HTMLElement)
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    (f.nativeElement.querySelector('[data-import-backdrop]') as HTMLElement).click();
    (f.nativeElement.querySelector('[role="dialog"]') as HTMLElement).click();
    f.detectChanges();
    expect(cancels).toBe(3);
  });

  it('traps Tab at the boundaries: Tab from last focusable wraps to first, Shift+Tab from first wraps to last', () => {
    const f = setup();
    const host = f.nativeElement as HTMLElement;
    const doc = host.ownerDocument; // jsdom only tracks activeElement for attached elements
    doc.body.appendChild(host);
    const focusables = Array.from(host.querySelectorAll<HTMLElement>('select, button'));
    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;
    const card = host.querySelector('[role="dialog"]') as HTMLElement;

    last.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(doc.activeElement).toBe(first);

    first.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    expect(doc.activeElement).toBe(last);
    host.remove();
  });

  it('restores focus to the previously focused element on destroy', () => {
    TestBed.configureTestingModule({ imports: [AxDataGridImportDialogComponent] });
    const doc = TestBed.inject(DOCUMENT);
    const trigger = doc.createElement('button');
    doc.body.appendChild(trigger);
    trigger.focus();
    const f = TestBed.createComponent(AxDataGridImportDialogComponent<Row>);
    f.componentRef.setInput('headers', ['Name', 'Age']);
    f.componentRef.setInput('columns', cols);
    f.componentRef.setInput('initialMapping', ['name', 'age']);
    f.detectChanges();
    f.destroy();
    expect(doc.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('has no a11y violations', async () => {
    expect(await axe(setup().nativeElement)).toHaveNoViolations();
  });
});
