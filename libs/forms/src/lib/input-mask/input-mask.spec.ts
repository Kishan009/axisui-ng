/**
 * AxInputMaskComponent + applyMask — unit + a11y tests. a11y is asserted in
 * three modes (LTR / RTL / dark) on the rendered host. Run twice (zoneless + Zone.js).
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxInputMaskComponent } from './input-mask.component';
import { applyMask, isMaskToken } from './input-mask.core';

expect.extend(toHaveNoViolations);

describe('applyMask (pure)', () => {
  it('formats digits with literals', () => {
    expect(applyMask('1234567890', '(999) 999-9999')).toBe('(123) 456-7890');
  });
  it('formats partial input', () => {
    expect(applyMask('123', '(999) 999-9999')).toBe('(123');
  });
  it('skips characters that do not match the token', () => {
    expect(applyMask('12ab34', '9999')).toBe('1234');
  });
  it('handles letters (A) and alphanumeric (*)', () => {
    expect(applyMask('ab12', 'AA99')).toBe('ab12');
    expect(applyMask('a1b2', '****')).toBe('a1b2');
    expect(applyMask('a1!2', 'AA99')).toBe('a'); // second A finds no letter
  });
  it('consumes a typed literal that matches the mask literal', () => {
    expect(applyMask('(123) 456-7890', '(999) 999-9999')).toBe('(123) 456-7890');
  });
  it('stops at the end of the mask (overflow ignored)', () => {
    expect(applyMask('123456', '999')).toBe('123');
  });
  it('returns raw when there is no mask', () => {
    expect(applyMask('abc', '')).toBe('abc');
  });
  it('isMaskToken recognises tokens', () => {
    expect(isMaskToken('9')).toBe(true);
    expect(isMaskToken('A')).toBe(true);
    expect(isMaskToken('*')).toBe(true);
    expect(isMaskToken('-')).toBe(false);
  });
});

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxInputMaskComponent> {
  const fixture = TestBed.createComponent(AxInputMaskComponent);
  fixture.componentRef.setInput('mask', '(999) 999-9999');
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}
const inputEl = (f: ComponentFixture<AxInputMaskComponent>) =>
  f.nativeElement.querySelector('input') as HTMLInputElement;

describe('AxInputMaskComponent', () => {
  it('masks typed input and stores the masked value', () => {
    const f = create();
    const el = inputEl(f);
    el.value = '1234567890';
    el.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(el.value).toBe('(123) 456-7890');
    expect(f.componentInstance.value()).toBe('(123) 456-7890');
  });

  it('keeps the caret in place on a mid-string edit instead of jumping to the end', () => {
    const f = create();
    const el = inputEl(f);
    // Simulate inserting "2" into "(135)" → "(1235)", caret right after the "2".
    el.value = '(1235)';
    el.setSelectionRange(3, 3); // "(12|35)"
    el.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(el.value).toBe('(123) 5');
    expect(el.selectionStart).toBe(3); // stayed after "2", not at the end
  });

  it('CVA: writeValue normalises through the mask, setDisabledState disables', () => {
    const f = create();
    f.componentInstance.writeValue('5551234567');
    f.componentInstance.setDisabledState(true);
    f.detectChanges();
    expect(inputEl(f).value).toBe('(555) 123-4567');
    expect(inputEl(f).disabled).toBe(true);
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(create({ ariaLabel: 'Phone' }).nativeElement)).toHaveNoViolations();
    });
    it('has no violations in RTL', async () => {
      const f = create({ ariaLabel: 'Phone' });
      (f.nativeElement as HTMLElement).setAttribute('dir', 'rtl');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
    it('has no violations in dark mode', async () => {
      const f = create({ ariaLabel: 'Phone' });
      (f.nativeElement as HTMLElement).classList.add('dark');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
  });
});
