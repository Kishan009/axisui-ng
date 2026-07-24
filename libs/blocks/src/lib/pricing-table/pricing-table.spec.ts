import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxPricingTableComponent } from './pricing-table.component';
import type { PricingTier } from '../blocks.types';

expect.extend(toHaveNoViolations);

const TIERS: PricingTier[] = [
  { name: 'Starter', price: '$0', period: '/mo', features: ['1 project', 'Community support'] },
  { name: 'Pro', price: '$29', period: '/mo', features: ['Unlimited projects', 'Email support'], highlighted: true, cta: 'Upgrade' },
];

function create(): ComponentFixture<AxPricingTableComponent> {
  const f = TestBed.createComponent(AxPricingTableComponent);
  f.componentRef.setInput('tiers', TIERS);
  f.componentRef.setInput('ariaLabel', 'Pricing');
  f.detectChanges();
  return f;
}

describe('AxPricingTableComponent', () => {
  it('renders a card per tier with name, price, and features', () => {
    const el = create().nativeElement as HTMLElement;
    expect(el.textContent).toContain('Starter');
    expect(el.textContent).toContain('$29');
    expect(el.textContent).toContain('Unlimited projects');
  });

  it('emphasizes the highlighted tier', () => {
    const cards = create().nativeElement.querySelectorAll('div.rounded-card') as NodeListOf<HTMLElement>;
    expect(cards[1].className).toContain('ring-2');
    expect(cards[0].className).not.toContain('ring-2');
  });

  it('marks the highlighted tier with a text badge (non-color-only emphasis)', () => {
    const cards = create().nativeElement.querySelectorAll('div.rounded-card') as NodeListOf<HTMLElement>;
    expect(cards[1].textContent).toContain('Popular');
    expect(cards[0].textContent).not.toContain('Popular');
  });

  it('emits the tier on CTA click', () => {
    const f = create();
    let picked: PricingTier | undefined;
    f.componentInstance.selectTier.subscribe((t) => (picked = t));
    const buttons = f.nativeElement.querySelectorAll('ax-button button') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    expect(picked?.name).toBe('Pro');
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
