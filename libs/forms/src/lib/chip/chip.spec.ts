/**
 * AxChipComponent — unit + a11y tests. a11y is asserted in three modes
 * (LTR / RTL / dark) by toggling the rendered host element (not the global
 * document, per the SSR-safety convention). CI runs this suite twice
 * (zoneless + Zone.js).
 */

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxChipComponent } from './chip.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxChipComponent],
  template: `
    <ax-chip [removable]="removable()" [disabled]="disabled()" removeAriaLabel="Remove Apple" (remove)="removed = removed + 1">
      Apple
    </ax-chip>
  `,
})
class HostComponent {
  removable = signal(true);
  disabled = signal(false);
  removed = 0;
}

function setup(configure?: (h: HostComponent) => void) {
  const fixture = TestBed.createComponent(HostComponent);
  if (configure) configure(fixture.componentInstance);
  fixture.detectChanges();
  const el = fixture.nativeElement.querySelector('ax-chip') as HTMLElement;
  return { fixture, host: fixture.componentInstance, el };
}

const removeBtn = (el: HTMLElement) => el.querySelector('button') as HTMLButtonElement | null;

describe('AxChipComponent', () => {
  it('projects its content', () => {
    expect(setup().el.textContent).toContain('Apple');
  });

  it('shows a remove button only when removable', () => {
    expect(removeBtn(setup().el)).toBeTruthy();
    expect(removeBtn(setup((h) => h.removable.set(false)).el)).toBeNull();
  });

  it('labels the remove button', () => {
    expect(removeBtn(setup().el)?.getAttribute('aria-label')).toBe('Remove Apple');
  });

  it('emits (remove) and stops propagation on click', () => {
    const { fixture, host, el } = setup();
    let bubbled = false;
    el.addEventListener('click', () => (bubbled = true));
    removeBtn(el)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(host.removed).toBe(1);
    expect(bubbled).toBe(false); // stopPropagation kept it from reaching the chip host
  });

  it('does not emit when disabled', () => {
    const { fixture, host, el } = setup((h) => h.disabled.set(true));
    const btn = removeBtn(el)!;
    expect(btn.disabled).toBe(true);
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(host.removed).toBe(0);
    expect(el.getAttribute('data-disabled')).toBe('true');
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(setup().fixture.nativeElement)).toHaveNoViolations();
    });

    it('has no violations in RTL', async () => {
      const { fixture, el } = setup();
      el.setAttribute('dir', 'rtl');
      expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    });

    it('has no violations in dark mode', async () => {
      const { fixture, el } = setup();
      el.classList.add('dark');
      expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    });
  });
});
