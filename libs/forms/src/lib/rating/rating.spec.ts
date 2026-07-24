/**
 * AxRatingComponent — unit + a11y tests. a11y is asserted in three modes
 * (LTR / RTL / dark) by toggling the rendered host element (not the global
 * document, per the SSR-safety convention). CI runs this suite twice
 * (zoneless + Zone.js).
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxRatingComponent } from './rating.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxRatingComponent],
  template: '<ax-rating ariaLabel="Quality"></ax-rating>',
})
class TestHostComponent {}

function setup() {
  const fixture = TestBed.createComponent(TestHostComponent);
  fixture.detectChanges();
  return fixture;
}

/** Create the component directly so inputs/host attrs/behaviour are addressable. */
function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxRatingComponent> {
  const fixture = TestBed.createComponent(AxRatingComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('AxRatingComponent', () => {
  it('renders the host element', () => {
    expect(setup().nativeElement.querySelector('ax-rating')).toBeTruthy();
  });

  it('exposes a slider role with min/now/max', () => {
    const host = create({ value: 3, max: 5 }).nativeElement as HTMLElement;
    expect(host.getAttribute('role')).toBe('slider');
    expect(host.getAttribute('aria-valuemin')).toBe('0');
    expect(host.getAttribute('aria-valuemax')).toBe('5');
    expect(host.getAttribute('aria-valuenow')).toBe('3');
    expect(host.getAttribute('tabindex')).toBe('0');
  });

  it('renders one star pair per `max` (base + filled overlay)', () => {
    const host = create({ max: 4 }).nativeElement as HTMLElement;
    expect(host.children.length).toBe(4);
    expect(host.querySelectorAll('ax-icon[name="star"]').length).toBe(8);
  });

  it('sets the value when a star is clicked', () => {
    const fixture = create();
    const host = fixture.nativeElement as HTMLElement;
    host.children[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(3);
  });

  it('Arrow keys step the value', () => {
    const fixture = create({ value: 2 });
    const host = fixture.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(3);
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(1);
  });

  it('Home/End jump to the bounds', () => {
    const fixture = create({ value: 2, max: 5 });
    const host = fixture.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(5);
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(0);
  });

  it('clamps within [0, max]', () => {
    const fixture = create({ value: 5, max: 5 });
    const host = fixture.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(5);
  });

  it('steps by 0.5 when allowHalf', () => {
    const fixture = create({ allowHalf: true, value: 0 });
    const host = fixture.nativeElement as HTMLElement;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(0.5);
  });

  it('readonly exposes img role and ignores interaction', () => {
    const fixture = create({ readonly: true, value: 3 });
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('role')).toBe('img');
    expect(host.getAttribute('tabindex')).toBe('-1');
    host.children[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(3);
  });

  it('CVA: writeValue + setDisabledState drive state', () => {
    const fixture = create();
    const cmp = fixture.componentInstance;
    cmp.writeValue(4);
    cmp.setDisabledState(true);
    fixture.detectChanges();
    expect(cmp.value()).toBe(4);
    expect((fixture.nativeElement as HTMLElement).getAttribute('aria-disabled')).toBe('true');
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(setup().nativeElement)).toHaveNoViolations();
    });

    it('has no violations in RTL', async () => {
      const host = create({ value: 3 }).nativeElement as HTMLElement;
      host.setAttribute('dir', 'rtl');
      expect(await axe(host)).toHaveNoViolations();
    });

    it('has no violations in dark mode', async () => {
      const host = create({ value: 3 }).nativeElement as HTMLElement;
      host.classList.add('dark');
      expect(await axe(host)).toHaveNoViolations();
    });
  });
});
