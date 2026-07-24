import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { AxButtonComponent } from '@axisui-ng/buttons';
import { AxIconComponent } from '@axisui-ng/icons';
import { AxKbdComponent } from '@axisui-ng/misc';
import { AxClusterDirective } from '@axisui-ng/primitives';
import { filter, map, startWith } from 'rxjs';

import { DemoLayoutService } from './layout.service';

const TITLES: Record<string, string> = {
  '/': 'E-commerce dashboard',
  '/banking': 'Banking dashboard',
  '/healthcare': 'Healthcare dashboard',
  '/analytics': 'Analytics dashboard',
  '/crm': 'CRM',
  '/logistics': 'Logistics dashboard',
  '/automotive': 'Automotive dashboard',
  '/government': 'Government dashboard',
  '/data-grid': 'Data grid',
  '/layout': 'Layout lab',
  '/ui-kit': 'UI Kit',
  '/blocks': 'Blocks',
  '/auth': 'Auth',
  '/landing': 'Landing',
  '/settings': 'Settings',
  '/error/404': 'Not found',
  '/error/500': 'Server error',
};

@Component({
  selector: 'demo-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxButtonComponent, AxClusterDirective, AxIconComponent, AxKbdComponent],
  template: `
    <header
      class="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6"
    >
      <div class="flex min-w-0 items-center gap-2">
        <ax-button
          variant="ghost"
          size="sm"
          [ariaLabel]="layout.sidebarOpen() ? 'Close sidebar' : 'Open sidebar'"
          (clickEvent)="layout.toggleSidebar()"
        >
          <ax-icon [name]="layout.sidebarOpen() ? 'sidebar' : 'menu'" [size]="16" />
        </ax-button>
        <div class="min-w-0">
          <p class="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
            @axisui-ng/angular
          </p>
          <h1 class="truncate text-base font-semibold tracking-tight text-foreground">
            {{ title() }}
          </h1>
        </div>
      </div>
      <div axCluster gap="2" class="shrink-0 items-center">
        <ax-button
          variant="outline"
          size="sm"
          ariaLabel="Open command palette"
          (clickEvent)="layout.openCommand()"
        >
          <ax-icon name="search" [size]="16" />
          <span class="hidden sm:inline">Search</span>
          <ax-kbd keys="mod+k" ariaLabel="modifier plus K" />
        </ax-button>
        <ax-button
          variant="ghost"
          size="sm"
          [ariaLabel]="layout.dark() ? 'Switch to light mode' : 'Switch to dark mode'"
          (clickEvent)="layout.toggleDark()"
        >
          <ax-icon [name]="layout.dark() ? 'eye' : 'eye-off'" [size]="16" />
          <span class="hidden md:inline">{{ layout.dark() ? 'Dark' : 'Light' }}</span>
        </ax-button>
        <ax-button
          variant="primary"
          size="sm"
          ariaLabel="Open theme configurator"
          (clickEvent)="layout.openConfigurator()"
        >
          <ax-icon name="settings" [size]="16" />
          Theme
        </ax-button>
      </div>
    </header>
  `,
})
export class DemoTopbarComponent {
  readonly layout = inject(DemoLayoutService);
  private readonly router = inject(Router);

  private readonly url$ = this.router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    map(() => this.router.url.split('?')[0] ?? '/'),
    startWith(this.router.url.split('?')[0] ?? '/'),
  );

  readonly title = toSignal(
    this.url$.pipe(map((url) => TITLES[url] ?? 'Apollo-style showcase')),
    { initialValue: 'E-commerce dashboard' },
  );
}
