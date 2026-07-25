import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AxButtonComponent, AxSegmentedComponent, type SegmentedOption } from '@axisui-ng/buttons';
import {
  AxBadgeComponent,
  AxCardComponent,
  AxCollapsibleComponent,
  AxCollapsibleTriggerDirective,
  AxStatisticComponent,
  AxTableComponent,
  type ColDef,
} from '@axisui-ng/data';
import { ToastService, AxAlertComponent } from '@axisui-ng/feedback';
import {
  AxComboboxComponent,
  AxDatePickerComponent,
  AxTimePickerComponent,
  type ComboboxOption,
  type CalendarValue,
  type TimeValue,
} from '@axisui-ng/forms';
import { AxIconComponent } from '@axisui-ng/icons';
import {
  AxBreadcrumbComponent,
  AxBreadcrumbItemComponent,
} from '@axisui-ng/navigation';
import {
  AxContextMenuTriggerDirective,
  AxDialogComponent,
  AxDialogDescriptionDirective,
  AxDialogTitleDirective,
  AxDropdownMenuComponent,
  AxMenuItemComponent,
  AxOverlayCloseDirective,
} from '@axisui-ng/overlays';
import { AxClusterDirective, AxStackDirective } from '@axisui-ng/primitives';
import { AxGaugeComponent, AxHeatmapComponent } from '@axisui-ng/charts';

import { DemoLayoutService } from '../../layout/layout.service';

interface DelayRow {
  shipment: string;
  hub: string;
  delay: string;
  reason: string;
}

@Component({
  selector: 'demo-dashboard-logistics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxGaugeComponent,
    AxHeatmapComponent,
    AxSegmentedComponent,
    AxCardComponent,
    AxStatisticComponent,
    AxCollapsibleComponent,
    AxCollapsibleTriggerDirective,
    AxTableComponent,
    AxBadgeComponent,
    AxAlertComponent,
    AxButtonComponent,
    AxIconComponent,
    AxComboboxComponent,
    AxBreadcrumbComponent,
    AxBreadcrumbItemComponent,
    AxContextMenuTriggerDirective,
    AxDropdownMenuComponent,
    AxMenuItemComponent,
    AxDialogComponent,
    AxDialogTitleDirective,
    AxDialogDescriptionDirective,
    AxOverlayCloseDirective,
    AxDatePickerComponent,
    AxTimePickerComponent,
    AxStackDirective,
    AxClusterDirective,
  ],
  template: `
    <div axStack gap="6">
      <ax-breadcrumb>
        <ax-breadcrumb-item><span>Demo</span></ax-breadcrumb-item>
        <ax-breadcrumb-item [current]="true">Logistics</ax-breadcrumb-item>
      </ax-breadcrumb>

      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div class="max-w-2xl">
          <h2 class="text-2xl font-semibold tracking-tight text-foreground">Logistics</h2>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Ops sample — gauges and heatmap inherit chart tokens; apply the logistics preset.
          </p>
        </div>
        <div axCluster gap="2" class="items-center">
          <ax-segmented
            [options]="rangeOptions"
            [(value)]="range"
            size="sm"
            ariaLabel="Time range"
          />
          <ax-button variant="outline" size="sm" (clickEvent)="applyLogistics()">
            Apply logistics preset
          </ax-button>
        </div>
      </div>

      <ax-alert variant="info">
        Mock hub throughput for {{ rangeLabel() }}. Theme → logistics shifts industry tokens.
      </ax-alert>

      <div class="grid gap-3 sm:grid-cols-3">
        <ax-card>
          <div axCardContent>
            <ax-statistic label="Shipments" [value]="18420" [trend]="6" />
          </div>
        </ax-card>
        <ax-card>
          <div axCardContent>
            <ax-statistic label="Avg transit" [value]="2.4" suffix="d" [trend]="-4" />
          </div>
        </ax-card>
        <ax-card>
          <div axCardContent>
            <ax-statistic label="Exceptions" [value]="38" [trend]="2" />
          </div>
        </ax-card>
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface flex flex-wrap items-center justify-around gap-4 p-4 lg:col-span-5">
          <ax-gauge
            [value]="94"
            [startAngle]="0"
            [endAngle]="180"
            [colorIndex]="1"
            label="On-time"
            ariaLabel="On-time delivery"
          />
          <ax-gauge
            [value]="71"
            [startAngle]="135"
            [endAngle]="405"
            [colorIndex]="2"
            label="Fleet"
            ariaLabel="Fleet utilization"
          />
          <ax-gauge
            [value]="88"
            [startAngle]="0"
            [endAngle]="180"
            [colorIndex]="3"
            label="SLA"
            ariaLabel="SLA met"
          />
          <ax-gauge
            [value]="63"
            [startAngle]="135"
            [endAngle]="405"
            [colorIndex]="4"
            label="Dock"
            ariaLabel="Dock utilization"
          />
        </div>

        <div class="demo-surface overflow-x-auto p-4 lg:col-span-7">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Hub × weekday volume</h3>
            <ax-badge appearance="soft" variant="info">Heatmap</ax-badge>
          </div>
          <ax-heatmap
            [matrix]="matrix"
            [rows]="hubs"
            [cols]="days"
            scale="bins"
            [cellSize]="32"
            ariaLabel="Shipment volume by hub and weekday"
          />
        </div>
      </div>

      <div
        class="demo-surface p-4"
        [axContextMenuTriggerFor]="delayMenu"
        tabindex="0"
        aria-label="Delayed shipments — right-click for actions"
      >
        <ax-collapsible [(open)]="delaysOpen">
          <button
            type="button"
            axCollapsibleTrigger
            class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-2 text-start text-sm font-semibold tracking-tight outline-none transition-[background-color] duration-[var(--duration-fast)] ease-out-quart hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span class="inline-flex items-center gap-2">
              <ax-icon name="alert-triangle" [size]="16" class="text-warning" />
              Delayed shipments
              <ax-badge appearance="soft" variant="warning">{{ filteredDelays().length }}</ax-badge>
            </span>
            <ax-icon [name]="delaysOpen() ? 'chevron-up' : 'chevron-down'" [size]="16" />
          </button>
          <div class="pt-3" axStack gap="3">
            <div class="flex flex-wrap items-end justify-between gap-3">
              <div class="min-w-[12rem] flex-1">
                <label class="mb-1 block text-xs font-medium text-muted-foreground" for="hub-filter">
                  Filter by hub
                </label>
                <ax-combobox
                  id="hub-filter"
                  [options]="hubOptions"
                  [(value)]="hubFilter"
                  placeholder="All hubs"
                  ariaLabel="Filter by hub"
                />
              </div>
              <p class="text-xs text-muted-foreground">Right-click table area for row actions</p>
            </div>
            <ax-table [columns]="columns" [data]="filteredDelays()" [pageSize]="5" />
          </div>
        </ax-collapsible>
      </div>

      <ax-dropdown-menu #delayMenu>
        <ax-menu-item (select)="openReschedule()">
          <ax-icon name="clock" [size]="16" />
          Reschedule
        </ax-menu-item>
        <ax-menu-item (select)="escalateDelay()">
          <ax-icon name="alert-circle" [size]="16" />
          Escalate
        </ax-menu-item>
      </ax-dropdown-menu>

      <ax-dialog [(open)]="rescheduleOpen">
        <h2 axDialogTitle class="text-lg font-semibold">Reschedule shipment</h2>
        <p axDialogDescription class="text-sm text-muted-foreground">
          Pick a new delivery window for {{ activeShipment() || 'selected shipment' }}.
        </p>
        <div axStack gap="4" class="pt-2">
          <div axStack gap="2">
            <label class="text-sm font-medium" for="reschedule-date">Date</label>
            <ax-date-picker
              id="reschedule-date"
              [(value)]="rescheduleDate"
              placeholder="Pick a date"
              ariaLabel="Reschedule date"
            />
          </div>
          <div axStack gap="2">
            <span class="text-sm font-medium">Time</span>
            <ax-time-picker [(value)]="rescheduleTime" [use24]="true" />
          </div>
        </div>
        <div axDialogFooter>
          <ax-button variant="ghost" size="sm" axOverlayClose>Cancel</ax-button>
          <ax-button variant="primary" size="sm" (clickEvent)="confirmReschedule()">
            Confirm
          </ax-button>
        </div>
      </ax-dialog>
    </div>
  `,
})
export class DashboardLogisticsComponent {
  private readonly layout = inject(DemoLayoutService);
  private readonly toast = inject(ToastService);

  readonly range = signal('w');
  readonly delaysOpen = signal(true);
  readonly hubFilter = signal<string | string[] | null>(null);
  readonly rescheduleOpen = signal(false);
  readonly activeShipment = signal<string | null>(null);
  readonly rescheduleDate = signal<CalendarValue>(null);
  readonly rescheduleTime = signal<TimeValue>({ hours: 14, minutes: 0 });

  readonly rangeOptions: SegmentedOption[] = [
    { label: 'Day', value: 'd' },
    { label: 'Week', value: 'w' },
    { label: 'Month', value: 'm' },
  ];

  readonly hubs = ['SEA', 'ORD', 'DFW', 'ATL', 'EWR'];
  readonly days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly matrix: number[][] = [
    [42, 38, 51, 47, 55, 22, 18],
    [61, 58, 64, 70, 68, 30, 24],
    [35, 41, 39, 44, 48, 20, 16],
    [52, 49, 55, 60, 58, 28, 21],
    [48, 45, 50, 53, 57, 26, 19],
  ];

  readonly hubOptions: ComboboxOption[] = [
    { value: 'all', label: 'All hubs' },
    ...this.hubs.map((h) => ({ value: h, label: h })),
  ];

  readonly columns: ColDef<DelayRow>[] = [
    { key: 'shipment', header: 'Shipment' },
    { key: 'hub', header: 'Hub' },
    { key: 'delay', header: 'Delay' },
    { key: 'reason', header: 'Reason' },
  ];

  readonly delays: DelayRow[] = [
    { shipment: 'SHP-1042', hub: 'ORD', delay: '6h', reason: 'Weather' },
    { shipment: 'SHP-1038', hub: 'EWR', delay: '3h', reason: 'Customs' },
    { shipment: 'SHP-1031', hub: 'DFW', delay: '9h', reason: 'Capacity' },
    { shipment: 'SHP-1024', hub: 'SEA', delay: '2h', reason: 'Missort' },
  ];

  readonly filteredDelays = computed(() => {
    const filter = this.hubFilter();
    if (!filter || filter === 'all') return this.delays;
    return this.delays.filter((d) => d.hub === filter);
  });

  rangeLabel(): string {
    const v = this.range();
    if (v === 'd') return 'today';
    if (v === 'm') return 'this month';
    return 'this week';
  }

  applyLogistics(): void {
    this.layout.setPreset('logistics');
  }

  openReschedule(): void {
    this.activeShipment.set(this.filteredDelays()[0]?.shipment ?? 'SHP-1042');
    this.rescheduleOpen.set(true);
  }

  escalateDelay(): void {
    const shipment = this.filteredDelays()[0]?.shipment ?? 'SHP-1042';
    this.toast.show({
      title: 'Escalation queued',
      description: `${shipment} routed to hub supervisor.`,
      variant: 'default',
    });
  }

  confirmReschedule(): void {
    this.rescheduleOpen.set(false);
    this.toast.show({
      title: 'Shipment rescheduled',
      description: `${this.activeShipment() ?? 'Shipment'} updated to the new window.`,
      variant: 'success',
    });
  }
}
