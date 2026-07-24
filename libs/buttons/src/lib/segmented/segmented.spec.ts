/**
 * AxSegmentedComponent — unit + a11y tests. a11y is asserted in three modes
 * (LTR / RTL / dark) by toggling the rendered host element (not the global
 * document, per the SSR-safety convention). CI runs this suite twice
 * (zoneless + Zone.js).
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxSegmentedComponent } from './segmented.component';
import type { SegmentedOption } from './segmented.types';

expect.extend(toHaveNoViolations);

const OPTIONS: SegmentedOption[] = [
  { label: 'Day', value: 'd' },
  { label: 'Week', value: 'w' },
  { label: 'Month', value: 'm' },
];

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxSegmentedComponent> {
  const fixture = TestBed.createComponent(AxSegmentedComponent);
  fixture.componentRef.setInput('options', OPTIONS);
  fixture.componentRef.setInput('ariaLabel', 'Range');
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

function radios(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(host.querySelectorAll<HTMLButtonElement>('button[role="radio"]'));
}

describe('AxSegmentedComponent', () => {
  it('renders one radio per option inside a radiogroup', () => {
    const host = create().nativeElement as HTMLElement;
    expect(host.getAttribute('role')).toBe('radiogroup');
    expect(host.getAttribute('aria-label')).toBe('Range');
    expect(radios(host).length).toBe(3);
  });

  it('reflects the selected value via aria-checked', () => {
    const host = create({ value: 'w' }).nativeElement as HTMLElement;
    const [day, week] = radios(host);
    expect(week.getAttribute('aria-checked')).toBe('true');
    expect(day.getAttribute('aria-checked')).toBe('false');
  });

  it('selects on click', () => {
    const fixture = create();
    const host = fixture.nativeElement as HTMLElement;
    radios(host)[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('m');
  });

  it('roving tabindex: selected is 0, else first enabled is 0', () => {
    const unselected = radios(create().nativeElement as HTMLElement);
    expect(unselected.map((b) => b.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

    const selected = radios(create({ value: 'm' }).nativeElement as HTMLElement);
    expect(selected.map((b) => b.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
  });

  it('Arrow keys move selection (wrapping)', () => {
    const fixture = create({ value: 'd' });
    const host = fixture.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('w');
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('m'); // wrapped past 'd'
  });

  it('Home/End jump to the ends', () => {
    const fixture = create({ value: 'w' });
    const host = fixture.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('m');
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('d');
  });

  it('keyboard skips a disabled segment', () => {
    const opts: SegmentedOption[] = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b', disabled: true },
      { label: 'C', value: 'c' },
    ];
    const fixture = create({ options: opts, value: 'a' });
    const host = fixture.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('c');
  });

  it('disabled control ignores interaction', () => {
    const fixture = create({ value: 'd', disabled: true });
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('aria-disabled')).toBe('true');
    expect(radios(host).every((b) => b.disabled)).toBe(true);
    radios(host)[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('d');
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(create({ value: 'w' }).nativeElement)).toHaveNoViolations();
    });

    it('has no violations in RTL', async () => {
      const host = create({ value: 'w' }).nativeElement as HTMLElement;
      host.setAttribute('dir', 'rtl');
      expect(await axe(host)).toHaveNoViolations();
    });

    it('has no violations in dark mode', async () => {
      const host = create({ value: 'w' }).nativeElement as HTMLElement;
      host.classList.add('dark');
      expect(await axe(host)).toHaveNoViolations();
    });
  });
});
