import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { AxToastOutletComponent } from '@axisui-ng/feedback';
import { AxCommandDialogComponent, type CommandItem } from '@axisui-ng/navigation';
import { fromEvent, filter } from 'rxjs';

import { DemoConfiguratorComponent } from './configurator.component';
import { DemoLayoutService } from './layout.service';
import { DemoSidebarComponent } from './sidebar.component';
import { DemoTopbarComponent } from './topbar.component';

const COMMANDS: CommandItem[] = [
  { id: 'home', label: 'E-commerce dashboard', group: 'Pages', icon: 'folder', keywords: ['home', 'shop'] },
  { id: 'banking', label: 'Banking dashboard', group: 'Pages', icon: 'lock', keywords: ['finance', 'bank'] },
  { id: 'healthcare', label: 'Healthcare dashboard', group: 'Pages', icon: 'check-circle', keywords: ['clinic', 'health'] },
  { id: 'analytics', label: 'Analytics dashboard', group: 'Pages', icon: 'signal', keywords: ['saas', 'metrics', 'mrr'] },
  { id: 'crm', label: 'CRM workspace', group: 'Pages', icon: 'user', keywords: ['accounts', 'deals', 'tree'] },
  { id: 'logistics', label: 'Logistics dashboard', group: 'Pages', icon: 'clock', keywords: ['ops', 'heatmap', 'gauge'] },
  { id: 'automotive', label: 'Automotive dashboard', group: 'Pages', icon: 'battery', keywords: ['fleet', 'ev'] },
  { id: 'government', label: 'Government dashboard', group: 'Pages', icon: 'lock', keywords: ['permits', 'civic'] },
  { id: 'data-grid', label: 'Data grid', group: 'Pages', icon: 'filter', keywords: ['table', 'enterprise'] },
  { id: 'layout', label: 'Layout lab', group: 'Pages', icon: 'menu', keywords: ['splitter', 'hierarchy', 'scroll'] },
  { id: 'ui-kit', label: 'UI Kit', group: 'Pages', icon: 'file-text', keywords: ['components'] },
  { id: 'blocks', label: 'Blocks', group: 'Pages', icon: 'image' },
  { id: 'auth', label: 'Auth', group: 'Pages', icon: 'user', keywords: ['login'] },
  { id: 'landing', label: 'Landing', group: 'Pages', icon: 'star', keywords: ['marketing'] },
  { id: 'settings', label: 'Settings', group: 'Pages', icon: 'settings', keywords: ['density', 'profile'] },
  { id: 'error-404', label: 'Error 404', group: 'Pages', icon: 'alert-triangle', keywords: ['not found'] },
  { id: 'error-500', label: 'Error 500', group: 'Pages', icon: 'x-circle', keywords: ['server'] },
  { id: 'theme', label: 'Open theme configurator', group: 'Actions', icon: 'settings', keywords: ['dark', 'preset'] },
  { id: 'toggle-dark', label: 'Toggle dark mode', group: 'Actions', icon: 'eye', keywords: ['light'] },
];

const ROUTES: Record<string, string> = {
  home: '/',
  banking: '/banking',
  healthcare: '/healthcare',
  analytics: '/analytics',
  crm: '/crm',
  logistics: '/logistics',
  automotive: '/automotive',
  government: '/government',
  'data-grid': '/data-grid',
  layout: '/layout',
  'ui-kit': '/ui-kit',
  blocks: '/blocks',
  auth: '/auth',
  landing: '/landing',
  settings: '/settings',
  'error-404': '/error/404',
  'error-500': '/error/500',
};

@Component({
  selector: 'demo-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    DemoSidebarComponent,
    DemoTopbarComponent,
    DemoConfiguratorComponent,
    AxToastOutletComponent,
    AxCommandDialogComponent,
  ],
  template: `
    <a class="demo-skip-link" href="#demo-main">Skip to main content</a>
    <div class="flex min-h-dvh bg-background text-foreground">
      @if (layout.sidebarOpen()) {
        <demo-sidebar class="sticky top-0 h-dvh shrink-0" />
      }
      <div class="flex min-w-0 flex-1 flex-col">
        <demo-topbar />
        <main
          id="demo-main"
          tabindex="-1"
          class="flex-1 overflow-auto px-4 py-6 outline-none sm:px-6 lg:px-8"
        >
          <div class="mx-auto w-full max-w-7xl">
            <router-outlet />
          </div>
        </main>
      </div>
      <demo-configurator />
      <ax-toast-outlet />
      <ax-command-dialog
        [(open)]="layout.commandOpen"
        [items]="commands"
        placeholder="Search pages and actions…"
        (select)="onCommand($event)"
      />
    </div>
  `,
})
export class DemoLayoutComponent {
  readonly layout = inject(DemoLayoutService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly commands = COMMANDS;

  constructor() {
    afterNextRender(() => {
      this.layout.hydrateFromStorage();
      if (!isPlatformBrowser(this.platformId)) return;
      fromEvent<KeyboardEvent>(document, 'keydown')
        .pipe(
          filter((e) => (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((e) => {
          e.preventDefault();
          this.layout.toggleCommand();
        });
    });
  }

  onCommand(item: CommandItem): void {
    if (item.id === 'theme') {
      this.layout.openConfigurator();
      return;
    }
    if (item.id === 'toggle-dark') {
      this.layout.toggleDark();
      return;
    }
    const path = ROUTES[item.id];
    if (path) void this.router.navigateByUrl(path);
  }
}
