/**
 * AxColorPickerComponent — unit + a11y. jsdom does not paint oklch(), so we
 * assert on the model/attributes, not pixels. Token auto-read mocks
 * getComputedStyle. a11y asserted in 3 modes (LTR/RTL/dark). Dual zoneless + Zone.js.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxColorPickerComponent } from './color-picker.component';

expect.extend(toHaveNoViolations);

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxColorPickerComponent> {
  const fixture = TestBed.createComponent(AxColorPickerComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

const slider = (f: ComponentFixture<AxColorPickerComponent>, label: string) =>
  f.nativeElement.querySelector(`input[aria-label="${label}"]`) as HTMLInputElement;

describe('AxColorPickerComponent', () => {
  it('renders L/C/H sliders', () => {
    const f = create();
    expect(slider(f, 'Lightness')).toBeTruthy();
    expect(slider(f, 'Chroma')).toBeTruthy();
    expect(slider(f, 'Hue')).toBeTruthy();
  });

  it('moving the hue slider emits an oklch value by default', () => {
    const f = create();
    const h = slider(f, 'Hue');
    h.value = '120';
    h.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(f.componentInstance.value()).toMatch(/^oklch\(.* 120\)$/);
  });

  it('format="hex" emits a hex string', () => {
    const f = create({ format: 'hex' });
    const l = slider(f, 'Lightness');
    l.value = '50';
    l.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(f.componentInstance.value()).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('pasting a hex string into the text field updates the sliders', () => {
    const f = create();
    const text = f.nativeElement.querySelector('input[aria-label="Color value"]') as HTMLInputElement;
    text.value = '#ff0000';
    text.dispatchEvent(new Event('change'));
    f.detectChanges();
    expect(slider(f, 'Hue').value).not.toBe('250'); // moved off the default hue
  });

  it('clicking a token swatch sets the value; snap jumps to the nearest token', () => {
    const tokens = [
      { name: '--color-a', value: 'oklch(0.5 0.1 250)' },
      { name: '--color-b', value: 'oklch(0.9 0.05 100)' },
    ];
    const f = create({ tokens });
    const swatches = f.nativeElement.querySelectorAll('[aria-label^="--color-"]') as NodeListOf<HTMLButtonElement>;
    expect(swatches.length).toBe(2);
    swatches[0].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toContain('250');

    slider(f, 'Lightness').value = '88';
    slider(f, 'Lightness').dispatchEvent(new Event('input'));
    f.detectChanges();
    const snapBtn = Array.from(f.nativeElement.querySelectorAll('button')).find((b) =>
      (b as HTMLElement).textContent?.includes('Snap'),
    ) as HTMLButtonElement;
    snapBtn.click();
    f.detectChanges();
    expect(f.componentInstance.value()).toContain('100');
  });

  it('shows the out-of-gamut indicator for a high-chroma color', () => {
    const f = create();
    const c = slider(f, 'Chroma');
    c.value = '0.4';
    c.dispatchEvent(new Event('input'));
    slider(f, 'Lightness').value = '90';
    slider(f, 'Lightness').dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="status"]')?.textContent).toContain('out of gamut');
  });

  it('alpha slider appears only when alpha is enabled', () => {
    expect(slider(create(), 'Alpha')).toBeNull();
    expect(slider(create({ alpha: true }), 'Alpha')).toBeTruthy();
  });

  it('CVA: writeValue populates sliders; setDisabledState disables controls', () => {
    const f = create();
    f.componentInstance.writeValue('oklch(0.6 0.1 30)');
    f.componentInstance.setDisabledState(true);
    f.detectChanges();
    expect(slider(f, 'Hue').value).toBe('30');
    expect(slider(f, 'Lightness').disabled).toBe(true);
  });

  it('auto-reads theme tokens via getComputedStyle', () => {
    const spy = jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (n: string) => (n === '--color-primary' ? 'oklch(0.5 0.2 250)' : ''),
    } as unknown as CSSStyleDeclaration);
    const f = create();
    f.detectChanges();
    expect(f.nativeElement.querySelector('[aria-label="--color-primary"]')).toBeTruthy();
    spy.mockRestore();
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(create({ alpha: true }).nativeElement)).toHaveNoViolations();
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
