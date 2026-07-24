/**
 * AxSignaturePadComponent — unit + a11y. jsdom has no real PointerEvent/layout, so
 * pointer events are synthesized and getBoundingClientRect / pointer-capture are
 * stubbed. a11y asserted in 3 modes. Dual zoneless + Zone.js.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxSignaturePadComponent } from './signature-pad.component';

expect.extend(toHaveNoViolations);

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxSignaturePadComponent> {
  const f = TestBed.createComponent(AxSignaturePadComponent);
  f.componentRef.setInput('ariaLabel', 'Signature');
  for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
  f.detectChanges();
  const svg = f.nativeElement.querySelector('svg') as SVGSVGElement;
  svg.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 320, height: 160, right: 320, bottom: 160, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);
  svg.setPointerCapture = jest.fn();
  svg.hasPointerCapture = jest.fn(() => true);
  svg.releasePointerCapture = jest.fn();
  return f;
}

function ptr(type: string, x: number, y: number): PointerEvent {
  const e = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
  Object.defineProperty(e, 'pointerId', { value: 1 });
  return e as unknown as PointerEvent;
}

function draw(f: ComponentFixture<AxSignaturePadComponent>): void {
  const svg = f.nativeElement.querySelector('svg') as SVGSVGElement;
  svg.dispatchEvent(ptr('pointerdown', 10, 10));
  svg.dispatchEvent(ptr('pointermove', 20, 20));
  svg.dispatchEvent(ptr('pointermove', 30, 30));
  svg.dispatchEvent(ptr('pointerup', 30, 30));
  f.detectChanges();
}

describe('AxSignaturePadComponent', () => {
  it('drawing a stroke emits a non-empty SVG value with a path', () => {
    const f = create();
    let value = '';
    f.componentInstance.registerOnChange((v: string) => (value = v));
    draw(f);
    expect(value).toContain('<svg');
    expect(value).toContain('<path');
    expect(f.nativeElement.querySelectorAll('path').length).toBe(1);
  });

  it('Undo removes the last stroke; Clear empties the value', () => {
    const f = create();
    let value = 'x';
    f.componentInstance.registerOnChange((v: string) => (value = v));
    draw(f);
    const [undoBtn, clearBtn] = Array.from(f.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    undoBtn.click();
    f.detectChanges();
    expect(value).toBe('');
    draw(f);
    clearBtn.click();
    f.detectChanges();
    expect(value).toBe('');
    expect(f.nativeElement.querySelectorAll('path').length).toBe(0);
  });

  it('does not draw when disabled', () => {
    const f = create({ disabled: true });
    let value = 'untouched';
    f.componentInstance.registerOnChange((v: string) => (value = v));
    draw(f);
    expect(f.nativeElement.querySelectorAll('path').length).toBe(0);
    expect(value).toBe('untouched');
  });

  it('CVA: writeValue("") resets; setDisabledState disables the buttons', () => {
    const f = create();
    draw(f);
    f.componentInstance.writeValue('');
    f.componentInstance.setDisabledState(true);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('path').length).toBe(0);
    expect((f.nativeElement.querySelectorAll('button')[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it('format="png" yields "" gracefully when no canvas context', () => {
    const spy = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const f = create({ format: 'png' });
    let value = 'x';
    f.componentInstance.registerOnChange((v: string) => (value = v));
    draw(f);
    expect(value).toBe('');
    spy.mockRestore();
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(create().nativeElement)).toHaveNoViolations();
    });
    it('has no violations in RTL', async () => {
      const f = create();
      (f.nativeElement as HTMLElement).setAttribute('dir', 'rtl');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
    it('has no violations in dark mode', async () => {
      const f = create();
      (f.nativeElement as HTMLElement).classList.add('dark');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
  });
});
