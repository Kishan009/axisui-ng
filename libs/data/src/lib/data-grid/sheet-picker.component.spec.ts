import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AxDataGridSheetPickerComponent } from './sheet-picker.component';

expect.extend(toHaveNoViolations);

function setup(sheets: string[] = ['Sheet1', 'Data', 'Notes']) {
  const f = TestBed.configureTestingModule({ imports: [AxDataGridSheetPickerComponent] })
    .createComponent(AxDataGridSheetPickerComponent);
  f.componentRef.setInput('sheets', sheets);
  f.detectChanges();
  return f;
}

describe('AxDataGridSheetPickerComponent', () => {
  it('renders a role=dialog with one option per sheet name', () => {
    const f = setup();
    expect(f.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(f.nativeElement.querySelectorAll('[data-sheet-option]').length).toBe(3);
  });

  it('Import emits pick with the selected sheet index (default 0; changes on select)', () => {
    const f = setup();
    let picked: number | null = null;
    (f.componentInstance as unknown as { pick: { subscribe(fn: (v: number) => void): void } }).pick.subscribe((v) => (picked = v));
    const options = f.nativeElement.querySelectorAll('[data-sheet-option]');
    (options[1] as HTMLElement).click();
    f.detectChanges();
    (f.nativeElement.querySelector('[data-sheet-pick]') as HTMLElement).click();
    expect(picked).toBe(1);
  });

  it('Cancel, Escape, and backdrop click emit cancel; card click does not', () => {
    const f = setup();
    let cancels = 0;
    (f.componentInstance as unknown as { cancel: { subscribe(fn: () => void): void } }).cancel.subscribe(() => (cancels += 1));
    (f.nativeElement.querySelector('[data-sheet-cancel]') as HTMLElement).click();
    (f.nativeElement.querySelector('[role="dialog"]') as HTMLElement)
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    (f.nativeElement.querySelector('[data-sheet-backdrop]') as HTMLElement).click();
    (f.nativeElement.querySelector('[role="dialog"]') as HTMLElement).click();
    f.detectChanges();
    expect(cancels).toBe(3);
  });

  it('restores focus to the previously focused element on destroy', () => {
    TestBed.configureTestingModule({ imports: [AxDataGridSheetPickerComponent] });
    const doc = TestBed.inject(DOCUMENT);
    const trigger = doc.createElement('button');
    doc.body.appendChild(trigger);
    trigger.focus();
    const f = TestBed.createComponent(AxDataGridSheetPickerComponent);
    f.componentRef.setInput('sheets', ['A', 'B']);
    f.detectChanges();
    f.destroy();
    expect(doc.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('has no a11y violations', async () => {
    expect(await axe(setup().nativeElement)).toHaveNoViolations();
  });
});
