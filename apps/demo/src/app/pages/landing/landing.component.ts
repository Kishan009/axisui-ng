import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AxFeatureGridComponent,
  type FeatureItem,
} from '@axisui-ng/blocks';
import { AxButtonComponent } from '@axisui-ng/buttons';
import { AxClusterDirective, AxStackDirective } from '@axisui-ng/primitives';

@Component({
  selector: 'demo-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AxFeatureGridComponent,
    AxButtonComponent,
    AxStackDirective,
    AxClusterDirective,
  ],
  template: `
    <div axStack gap="12">
      <!-- Hero-centric + Swiss asymmetric 12-col (ui-ux-pro-max) -->
      <section
        class="relative -mx-4 -mt-6 overflow-hidden border-b border-border bg-background px-4 py-14 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 lg:py-20"
      >
        <div
          class="pointer-events-none absolute inset-y-0 end-0 w-1/2 bg-primary/8 max-lg:hidden"
          aria-hidden="true"
        ></div>
        <div class="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div class="lg:col-span-7">
            <p class="text-sm font-semibold tracking-tight text-primary">AxisUI</p>
            <h2
              class="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              Angular components that re-theme from tokens
            </h2>
            <p class="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              OKLCH presets, dark mode, and density cascade through the shell — open Theme
              and watch this page restyle with the rest of the demo.
            </p>
            <div axCluster gap="3" class="mt-8">
              <a routerLink="/ui-kit" class="contents">
                <ax-button variant="primary" size="lg">Explore UI Kit</ax-button>
              </a>
              <a routerLink="/blocks" class="contents">
                <ax-button variant="outline" size="lg">View blocks</ax-button>
              </a>
            </div>
          </div>

          <div class="lg:col-span-5" aria-hidden="true">
            <div
              class="grid aspect-[5/4] grid-cols-12 grid-rows-6 gap-3 border border-border bg-card p-3 shadow-sm"
            >
              <div class="col-span-7 row-span-4 rounded-md bg-primary/15"></div>
              <div class="col-span-5 row-span-2 rounded-md bg-muted"></div>
              <div class="col-span-5 row-span-2 rounded-md bg-primary/25"></div>
              <div class="col-span-4 row-span-2 rounded-md bg-muted"></div>
              <div class="col-span-8 row-span-2 rounded-md border border-border bg-background"></div>
            </div>
          </div>
        </div>
      </section>

      <section axStack gap="4">
        <div class="max-w-xl">
          <h3 class="text-lg font-semibold tracking-tight text-foreground">
            Built for product shells
          </h3>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Compose shipped primitives and blocks — same patterns as Storybook and docs.
          </p>
        </div>
        <ax-feature-grid [features]="features" ariaLabel="Product features" />
      </section>

      <section
        class="flex flex-col items-start justify-between gap-6 border border-border bg-card px-6 py-8 shadow-sm sm:flex-row sm:items-center sm:px-8"
      >
        <div class="max-w-md">
          <h3 class="text-lg font-semibold tracking-tight text-foreground">
            Try the app shell next
          </h3>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Dashboards, auth, and the kit all share one configurator — no ThemeStudio
            required for this demo.
          </p>
        </div>
        <div axCluster gap="2">
          <a routerLink="/" class="contents">
            <ax-button variant="primary">Dashboard</ax-button>
          </a>
          <a routerLink="/auth" class="contents">
            <ax-button variant="outline">Auth sample</ax-button>
          </a>
        </div>
      </section>
    </div>
  `,
})
export class LandingPageComponent {
  readonly features: FeatureItem[] = [
    {
      icon: 'check-circle',
      title: 'Token-first',
      description: 'Presets and dark mode flow through CSS variables — no per-page recolors.',
    },
    {
      icon: 'settings',
      title: 'Composable',
      description: 'Feature grids and CTAs assemble core components into marketing layout.',
    },
    {
      icon: 'file-code',
      title: 'Packaging-ready',
      description: 'Layout stays required; pages like this landing stub stay optional.',
    },
  ];
}
