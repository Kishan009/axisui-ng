import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AxButtonComponent } from '@axisui-ng/buttons';
import { AxIconComponent } from '@axisui-ng/icons';
import { AxSidebarComponent, AxSidebarItemComponent } from '@axisui-ng/navigation';
import { filter, map, startWith } from 'rxjs';

import { DemoLayoutService } from './layout.service';

@Component({
  selector: 'demo-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxSidebarComponent,
    AxSidebarItemComponent,
    AxIconComponent,
    AxButtonComponent,
    RouterLink,
  ],
  template: `
    <ax-sidebar [(collapsed)]="collapsed" class="h-full border-e border-border">
      <div
        axSidebarHeader
        class="flex items-center gap-2 px-2 py-3 text-sm font-semibold tracking-tight text-foreground"
      >
        <span
          class="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
          aria-hidden="true"
        >
          UI
        </span>
        @if (!collapsed()) {
          <span class="min-w-0 flex-1 leading-tight">
            <span class="block truncate">AxisUI</span>
            <span class="block text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Demo
            </span>
          </span>
        }
        <ax-button
          variant="ghost"
          size="sm"
          class="ms-auto shrink-0"
          ariaLabel="Close sidebar"
          (clickEvent)="layout.closeSidebar()"
        >
          <ax-icon name="x" [size]="16" />
        </ax-button>
      </div>

      @if (!collapsed()) {
        <p
          class="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
        >
          Apps
        </p>
      }
      <a routerLink="/" class="contents">
        <ax-sidebar-item [active]="url() === '/'">
          <ax-icon name="folder" [size]="18" />
          <span>Dashboard</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/banking" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/banking')">
          <ax-icon name="lock" [size]="18" />
          <span>Banking</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/healthcare" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/healthcare')">
          <ax-icon name="check-circle" [size]="18" />
          <span>Healthcare</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/analytics" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/analytics')">
          <ax-icon name="signal" [size]="18" />
          <span>Analytics</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/crm" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/crm')">
          <ax-icon name="user" [size]="18" />
          <span>CRM</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/logistics" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/logistics')">
          <ax-icon name="clock" [size]="18" />
          <span>Logistics</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/automotive" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/automotive')">
          <ax-icon name="battery" [size]="18" />
          <span>Automotive</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/government" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/government')">
          <ax-icon name="lock" [size]="18" />
          <span>Government</span>
        </ax-sidebar-item>
      </a>

      @if (!collapsed()) {
        <p
          class="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
        >
          Library
        </p>
      }
      <a routerLink="/ui-kit" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/ui-kit')">
          <ax-icon name="file-text" [size]="18" />
          <span>UI Kit</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/data-grid" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/data-grid')">
          <ax-icon name="filter" [size]="18" />
          <span>Data grid</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/layout" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/layout')">
          <ax-icon name="menu" [size]="18" />
          <span>Layout</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/blocks" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/blocks')">
          <ax-icon name="image" [size]="18" />
          <span>Blocks</span>
        </ax-sidebar-item>
      </a>

      @if (!collapsed()) {
        <p
          class="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
        >
          Pages
        </p>
      }
      <a routerLink="/auth" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/auth')">
          <ax-icon name="user" [size]="18" />
          <span>Auth</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/landing" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/landing')">
          <ax-icon name="star" [size]="18" />
          <span>Landing</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/settings" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/settings')">
          <ax-icon name="settings" [size]="18" />
          <span>Settings</span>
        </ax-sidebar-item>
      </a>
      <a routerLink="/error/404" class="contents">
        <ax-sidebar-item [active]="url().startsWith('/error')">
          <ax-icon name="alert-triangle" [size]="18" />
          <span>Errors</span>
        </ax-sidebar-item>
      </a>
    </ax-sidebar>
  `,
})
export class DemoSidebarComponent {
  readonly layout = inject(DemoLayoutService);
  private readonly router = inject(Router);

  readonly collapsed = signal(false);

  private readonly url$ = this.router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    map(() => this.router.url.split('?')[0] ?? '/'),
    startWith(this.router.url.split('?')[0] ?? '/'),
  );
  readonly url = toSignal(this.url$, { initialValue: '/' });
}
