import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AxVirtualForDirective,
  AxVirtualViewportDirective,
} from '@axisui-ng/cdk';
import { AxAlertComponent } from '@axisui-ng/feedback';
import {
  AxHierarchyComponent,
  type HierarchyNode,
} from '@axisui-ng/flow';
import {
  AxSplitterComponent,
  AxSplitterPanelComponent,
} from '@axisui-ng/layout';
import { AxScrollAreaComponent } from '@axisui-ng/misc';
import {
  AxBreadcrumbComponent,
  AxBreadcrumbItemComponent,
} from '@axisui-ng/navigation';
import { AxButtonComponent } from '@axisui-ng/buttons';
import { AxClusterDirective, AxStackDirective } from '@axisui-ng/primitives';

interface OrgPerson {
  name: string;
  role: string;
}

interface ActivityEntry {
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

@Component({
  selector: 'demo-layout-lab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxVirtualViewportDirective,
    AxVirtualForDirective,
    AxSplitterComponent,
    AxSplitterPanelComponent,
    AxScrollAreaComponent,
    AxHierarchyComponent,
    AxAlertComponent,
    AxBreadcrumbComponent,
    AxBreadcrumbItemComponent,
    AxButtonComponent,
    AxStackDirective,
    AxClusterDirective,
  ],
  template: `
    <div axStack gap="6">
      <ax-breadcrumb>
        <ax-breadcrumb-item><span>Demo</span></ax-breadcrumb-item>
        <ax-breadcrumb-item [current]="true">Layout</ax-breadcrumb-item>
      </ax-breadcrumb>

      <div class="border-b border-border pb-5">
        <h2 class="text-2xl font-semibold tracking-tight text-foreground">Layout lab</h2>
        <p class="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Splitter, scroll-area, virtual scroll, and hierarchy — structural primitives that inherit
          Theme borders and card surfaces.
        </p>
      </div>

      <ax-alert variant="info">
        Drag gutters to resize panels. Scroll areas use token-themed scrollbars. Virtual scroll keeps
        only visible rows in the DOM.
      </ax-alert>

      <section class="demo-surface overflow-hidden" axStack gap="0">
        <div class="border-b border-border px-4 py-3">
          <h3 class="text-sm font-semibold tracking-tight">Splitter + scroll</h3>
        </div>
        <div class="h-72">
          <ax-splitter ariaLabel="Layout lab splitter">
            <ax-splitter-panel [size]="32" [minSize]="18" [collapsible]="true">
              <ax-scroll-area
                class="h-full border-e border-border p-3"
                orientation="vertical"
                ariaLabel="File list"
              >
                <p class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Files
                </p>
                @for (f of files; track f) {
                  <div
                    class="rounded-md px-2 py-1.5 text-sm text-foreground transition-[background-color] duration-[var(--duration-fast)] ease-out-quart hover:bg-muted"
                  >
                    {{ f }}
                  </div>
                }
              </ax-scroll-area>
            </ax-splitter-panel>
            <ax-splitter-panel [size]="68">
              <div class="flex h-full flex-col gap-2 p-4">
                <p class="text-sm font-medium text-foreground">Editor</p>
                <p class="text-sm leading-relaxed text-muted-foreground">
                  Main pane chrome uses <code class="text-xs">bg-background</code> /
                  <code class="text-xs">border-border</code>. Collapse the file rail with a
                  double-click on the gutter.
                </p>
                <div class="mt-auto rounded-md border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
                  Preview slot — density changes padding via tokens.
                </div>
              </div>
            </ax-splitter-panel>
          </ax-splitter>
        </div>
      </section>

      <section class="demo-surface overflow-hidden" axStack gap="0">
        <div class="border-b border-border px-4 py-3">
          <h3 class="text-sm font-semibold tracking-tight">Virtual scroll — activity log</h3>
          <p class="mt-0.5 text-xs text-muted-foreground">
            <code class="text-xs">axVirtualViewport</code> +
            <code class="text-xs">*axVirtualFor</code> from
            <code class="text-xs">@axisui-ng/cdk</code> — 100 rows, fixed 40px height.
          </p>
        </div>
        <div class="p-4" axStack gap="3">
          <div
            axVirtualViewport
            #activityVp="axVirtualViewport"
            class="h-64 rounded-md border border-border text-sm"
            aria-label="Activity log"
          >
            <div
              *axVirtualFor="let entry of activityLog; itemSize: 40; overscan: 6"
              class="flex h-10 items-center gap-3 border-b border-border px-3"
            >
              <span class="w-12 shrink-0 font-mono text-xs text-muted-foreground">{{ entry.time }}</span>
              <span
                class="w-14 shrink-0 rounded-[var(--radius-sm)] px-1.5 py-0.5 text-center text-[10px] font-semibold tracking-wide uppercase"
                [class.bg-muted]="entry.level === 'info'"
                [class.text-muted-foreground]="entry.level === 'info'"
                [class.bg-warning/15]="entry.level === 'warn'"
                [class.text-warning]="entry.level === 'warn'"
                [class.bg-destructive/15]="entry.level === 'error'"
                [class.text-destructive]="entry.level === 'error'"
              >
                {{ entry.level }}
              </span>
              <span class="min-w-0 truncate text-foreground">{{ entry.message }}</span>
            </div>
          </div>
          <div axCluster gap="2">
            <ax-button size="sm" variant="outline" (clickEvent)="activityVp.scrollToIndex(0)">
              Top
            </ax-button>
            <ax-button size="sm" variant="outline" (clickEvent)="activityVp.scrollToIndex(49)">
              Mid (50)
            </ax-button>
            <ax-button size="sm" variant="outline" (clickEvent)="activityVp.scrollToIndex(99)">
              Bottom
            </ax-button>
          </div>
        </div>
      </section>

      <section class="demo-surface overflow-x-auto p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Hierarchy — org chart</h3>
        <ax-hierarchy
          class="max-w-full"
          [data]="org"
          preset="org"
          ariaLabel="Demo org chart"
          [nodeHeight]="56"
        >
          <ng-template let-n>
            <div class="flex flex-col justify-center py-1">
              <span class="text-sm font-medium">{{ n.data?.name }}</span>
              <span class="text-xs text-muted-foreground">{{ n.data?.role }}</span>
            </div>
          </ng-template>
        </ax-hierarchy>
      </section>
    </div>
  `,
})
export class LayoutLabPageComponent {
  readonly files = [
    'app.routes.ts',
    'layout.component.ts',
    'sidebar.component.ts',
    'topbar.component.ts',
    'configurator.component.ts',
    'dashboard-ecommerce.component.ts',
    'dashboard-banking.component.ts',
    'crm.component.ts',
    'data-grid.component.ts',
    'ui-kit.component.ts',
    'blocks.component.ts',
    'settings.component.ts',
    'tokens.css',
    'styles.css',
  ];

  readonly activityLog: ActivityEntry[] = Array.from({ length: 100 }, (_, i) => {
    const mins = Math.floor(i / 60);
    const secs = i % 60;
    const level: ActivityEntry['level'] =
      i % 17 === 0 ? 'error' : i % 7 === 0 ? 'warn' : 'info';
    const verbs = ['Sync', 'Deploy', 'Cache', 'Auth', 'Index', 'Export'];
    return {
      time: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      level,
      message: `${verbs[i % verbs.length]} pipeline · event #${100 - i}`,
    };
  });

  readonly org: HierarchyNode<OrgPerson>[] = [
    {
      id: 'ceo',
      data: { name: 'Ada Lovelace', role: 'CEO' },
      children: [
        {
          id: 'cto',
          data: { name: 'Alan Turing', role: 'CTO' },
          children: [
            { id: 'eng1', data: { name: 'Grace Hopper', role: 'Eng Lead' } },
            { id: 'eng2', data: { name: 'Ken Thompson', role: 'Eng Lead' } },
          ],
        },
        {
          id: 'cfo',
          data: { name: 'Katherine Johnson', role: 'CFO' },
          children: [{ id: 'fin1', data: { name: 'Dorothy Vaughan', role: 'Finance' } }],
        },
      ],
    },
  ];
}
