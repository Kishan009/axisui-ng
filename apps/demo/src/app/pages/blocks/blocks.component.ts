import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AxAuthFormComponent,
  AxFeatureGridComponent,
  AxPricingTableComponent,
  AxStatRowComponent,
  type AuthSubmit,
  type FeatureItem,
  type PricingTier,
  type StatItem,
} from '@axisui-ng/blocks';
import { AxStackDirective } from '@axisui-ng/primitives';

@Component({
  selector: 'demo-blocks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxStatRowComponent,
    AxFeatureGridComponent,
    AxPricingTableComponent,
    AxAuthFormComponent,
    AxStackDirective,
  ],
  template: `
    <div axStack gap="10">
      <div class="border-b border-border pb-5">
        <h2 class="text-2xl font-semibold tracking-tight text-foreground">Blocks</h2>
        <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
          Preset-aware compositions — change Theme to see token-first restyling.
        </p>
      </div>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Stat row</h3>
        <ax-stat-row [stats]="stats" ariaLabel="Product metrics" />
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Feature grid</h3>
        <ax-feature-grid [features]="features" ariaLabel="Product features" />
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Pricing table</h3>
        <ax-pricing-table [tiers]="tiers" (selectTier)="onTier($event)" />
      </section>

      <section class="demo-surface max-w-md p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Auth form</h3>
        <ax-auth-form mode="login" (authSubmit)="onAuth($event)" [error]="authError()" />
        @if (lastAuth(); as a) {
          <p class="text-xs text-muted-foreground">Last submit: {{ a.email }}</p>
        }
      </section>
    </div>
  `,
})
export class BlocksPageComponent {
  readonly stats: StatItem[] = [
    { label: 'MRR', value: '42k', prefix: '$', trend: 8 },
    { label: 'Active', value: 1280, trend: 3 },
    { label: 'Churn', value: '1.4', suffix: '%', trend: -1 },
  ];

  readonly features: FeatureItem[] = [
    {
      icon: 'check-circle',
      title: 'Token-first',
      description: 'OKLCH presets cascade without per-component CSS.',
    },
    {
      icon: 'settings',
      title: 'Composable',
      description: 'Blocks assemble core components into product UI.',
    },
    {
      icon: 'lock',
      title: 'Accessible',
      description: 'WAI-ARIA patterns and jest-axe coverage in the libs.',
    },
  ];

  readonly tiers: PricingTier[] = [
    {
      name: 'Starter',
      price: '$29',
      period: '/mo',
      features: ['3 seats', 'Email support'],
      cta: 'Choose',
    },
    {
      name: 'Pro',
      price: '$79',
      period: '/mo',
      features: ['Unlimited seats', 'Priority support', 'Theme studio'],
      cta: 'Choose',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: ['SSO', 'SLA', 'On-prem options'],
      cta: 'Contact',
    },
  ];

  readonly lastAuth = signal<AuthSubmit | null>(null);
  readonly authError = signal<string | null>(null);
  readonly lastTier = signal<PricingTier | null>(null);

  onAuth(value: AuthSubmit): void {
    this.authError.set(null);
    this.lastAuth.set(value);
  }

  onTier(tier: PricingTier): void {
    this.lastTier.set(tier);
  }
}
