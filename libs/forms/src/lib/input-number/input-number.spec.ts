/**
 * AxInputNumberComponent — unit + a11y tests. a11y is asserted in three modes
 * (LTR / RTL / dark) on the rendered host. Run twice (zoneless + Zone.js).
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxInputNumberComponent } from './input-number.component';

expect.extend(toHaveNoViolations);

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxInputNumberComponent> {
  const fixture = TestBed.createComponent(AxInputNumberComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

const inputEl = (f: ComponentFixture<AxInputNumberComponent>) =>
  f.nativeElement.querySelector('input') as HTMLInputElement;
const buttons = (f: ComponentFixture<AxInputNumberComponent>) =>
  Array.from(f.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]; // [minus, plus]

function type(f: ComponentFixture<AxInputNumberComponent>, text: string) {
  const el = inputEl(f);
  el.value = text;
  el.dispatchEvent(new Event('input'));
  f.detectChanges();
}
function press(btn: HTMLButtonElement, f: ComponentFixture<AxInputNumberComponent>) {
  btn.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  btn.dispatchEvent(new Event('pointerup', { bubbles: true }));
  f.detectChanges();
}

describe('AxInputNumberComponent', () => {
  it('parses typed input into the value', () => {
    const f = create();
    type(f, '42');
    expect(f.componentInstance.value()).toBe(42);
  });

  it('+/- buttons step the value', () => {
    const f = create({ value: 5 });
    const [minus, plus] = buttons(f);
    press(plus, f);
    expect(f.componentInstance.value()).toBe(6);
    press(minus, f);
    press(minus, f);
    expect(f.componentInstance.value()).toBe(4);
  });

  it('arrow keys step the value', () => {
    const f = create({ value: 2 });
    inputEl(f).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(3);
    inputEl(f).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(2);
  });

  it('respects step size', () => {
    const f = create({ value: 0, step: 0.5 });
    press(buttons(f)[1], f);
    expect(f.componentInstance.value()).toBe(0.5);
  });

  it('clamps to min/max and disables the bound button', () => {
    const f = create({ value: 10, max: 10 });
    expect(buttons(f)[1].disabled).toBe(true); // plus disabled at max
    press(buttons(f)[1], f);
    expect(f.componentInstance.value()).toBe(10);
    f.componentRef.setInput('value', 0);
    f.componentRef.setInput('min', 0);
    f.detectChanges();
    expect(buttons(f)[0].disabled).toBe(true); // minus disabled at min
  });

  it('rounds to precision on blur', () => {
    const f = create({ precision: 2 });
    type(f, '3.14159');
    inputEl(f).dispatchEvent(new Event('blur'));
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(3.14);
    expect(inputEl(f).value).toBe('3.14');
  });

  it('renders prefix and suffix', () => {
    const f = create({ prefix: '$', suffix: '%' });
    expect(f.nativeElement.textContent).toContain('$');
    expect(f.nativeElement.textContent).toContain('%');
  });

  it('exposes spinbutton semantics', () => {
    const el = inputEl(create({ value: 4, min: 0, max: 10 }));
    expect(el.getAttribute('role')).toBe('spinbutton');
    expect(el.getAttribute('aria-valuenow')).toBe('4');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('10');
  });

  it('CVA: writeValue reflects in the field, setDisabledState disables', () => {
    const f = create();
    f.componentInstance.writeValue(7);
    f.componentInstance.setDisabledState(true);
    f.detectChanges();
    expect(inputEl(f).value).toBe('7');
    expect(inputEl(f).disabled).toBe(true);
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(create({ ariaLabel: 'Quantity', value: 3 }).nativeElement)).toHaveNoViolations();
    });
    it('has no violations in RTL', async () => {
      const f = create({ ariaLabel: 'Quantity' });
      (f.nativeElement as HTMLElement).setAttribute('dir', 'rtl');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
    it('has no violations in dark mode', async () => {
      const f = create({ ariaLabel: 'Quantity' });
      (f.nativeElement as HTMLElement).classList.add('dark');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
  });
});
