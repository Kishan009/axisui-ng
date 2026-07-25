import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AxStatRowComponent, type StatItem } from '@axisui-ng/blocks';
import {
  AxButtonComponent,
  AxButtonLeadingDirective,
  AxSegmentedComponent,
  type SegmentedOption,
} from '@axisui-ng/buttons';
import {
  AxAvatarComponent,
  AxAvatarGroupComponent,
  AxBadgeComponent,
  AxCardComponent,
  AxStatisticComponent,
  AxTableComponent,
  type ColDef,
} from '@axisui-ng/data';
import { ToastService, AxAlertComponent } from '@axisui-ng/feedback';
import {
  AxInputComponent,
  AxDatePickerComponent,
  AxTimePickerComponent,
  type CalendarValue,
  type TimeValue,
} from '@axisui-ng/forms';
import { AxStepperComponent, AxStepComponent } from '@axisui-ng/flow';
import { AxIconComponent } from '@axisui-ng/icons';
import {
  AxBreadcrumbComponent,
  AxBreadcrumbItemComponent,
} from '@axisui-ng/navigation';
import {
  AxContextMenuTriggerDirective,
  AxDropdownMenuComponent,
  AxMenuItemComponent,
} from '@axisui-ng/overlays';
import { AxClusterDirective, AxStackDirective } from '@axisui-ng/primitives';
import {
  AxChartComponent,
  AxGaugeComponent,
  AxHeatmapComponent,
  AxSparklineComponent,
  type ChartSeries,
} from '@axisui-ng/charts';

import { DemoLayoutService } from '../../layout/layout.service';

interface AlertRow {
  vehicle: string;
  signal: string;
  severity: string;
  eta: string;
}

@Component({
  selector: 'demo-dashboard-automotive',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxStatRowComponent,
    AxSegmentedComponent,
    AxGaugeComponent,
    AxChartComponent,
    AxSparklineComponent,
    AxHeatmapComponent,
    AxCardComponent,
    AxStatisticComponent,
    AxTableComponent,
    AxBadgeComponent,
    AxAlertComponent,
    AxButtonComponent,
    AxButtonLeadingDirective,
    AxAvatarComponent,
    AxAvatarGroupComponent,
    AxInputComponent,
    AxStepperComponent,
    AxStepComponent,
    AxIconComponent,
    AxBreadcrumbComponent,
    AxBreadcrumbItemComponent,
    AxContextMenuTriggerDirective,
    AxDropdownMenuComponent,
    AxMenuItemComponent,
    AxDatePickerComponent,
    AxTimePickerComponent,
    AxStackDirective,
    AxClusterDirective,
  ],
  template: `
    <div axStack gap="6">
      <ax-breadcrumb>
        <ax-breadcrumb-item><span>Demo</span></ax-breadcrumb-item>
        <ax-breadcrumb-item [current]="true">Automotive</ax-breadcrumb-item>
      </ax-breadcrumb>

      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div class="max-w-2xl">
          <h2 class="text-2xl font-semibold tracking-tight text-foreground">Automotive</h2>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Fleet telemetry sample — apply the automotive preset for industry tokens.
          </p>
        </div>
        <div axCluster gap="2" class="items-center">
          <ax-segmented
            [options]="rangeOptions"
            [(value)]="range"
            size="sm"
            ariaLabel="Time range"
          />
          <ax-button variant="outline" size="sm" (clickEvent)="applyPreset()">
            Apply automotive preset
          </ax-button>
          <ax-button variant="primary" size="sm" (clickEvent)="serviceStep.set(0)">
            <ax-icon axButtonLeading name="clock" [size]="16" />
            Schedule service
          </ax-button>
        </div>
      </div>

      <ax-alert variant="info">
        Mock EV fleet data for {{ rangeLabel() }}. Gauges and charts use
        <code class="text-xs">--color-chart-*</code>.
      </ax-alert>

      <div class="demo-surface demo-tabular p-4">
        <ax-stat-row ariaLabel="Fleet metrics" [stats]="stats" [columns]="4" />
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface flex flex-wrap items-center justify-around gap-4 p-4 lg:col-span-5">
          <ax-gauge
            [value]="82"
            [startAngle]="135"
            [endAngle]="405"
            [colorIndex]="1"
            label="SOC"
            ariaLabel="Battery state of charge"
          />
          <ax-gauge
            [value]="96"
            [startAngle]="0"
            [endAngle]="180"
            [colorIndex]="2"
            label="Uptime"
            ariaLabel="Fleet uptime"
          />
        </div>

        <div class="demo-surface p-4 lg:col-span-7">
          <div class="mb-3 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Energy draw</h3>
            <div class="flex items-center gap-2">
              <ax-sparkline
                [data]="spark"
                type="area"
                [colorIndex]="3"
                [width]="88"
                [height]="28"
                ariaLabel="Energy trend"
              />
              <ax-badge appearance="soft" variant="info">Area</ax-badge>
            </div>
          </div>
          <ax-chart
            class="block w-full"
            type="area"
            [series]="energySeries"
            [labels]="energyLabels"
            [height]="220"
            ariaLabel="Daily energy draw"
          />
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface overflow-x-auto p-4 lg:col-span-5">
          <div class="mb-3 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Fault codes × region</h3>
            <ax-badge appearance="soft" variant="warning">Heatmap</ax-badge>
          </div>
          <ax-heatmap
            [matrix]="faultMatrix"
            [rows]="regions"
            [cols]="faultCodes"
            scale="bins"
            [cellSize]="28"
            ariaLabel="Fault codes by region"
          />
        </div>

        <div class="demo-surface p-4 lg:col-span-7" axStack gap="3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Service advisors</h3>
            <ax-badge appearance="soft" variant="info">On shift</ax-badge>
          </div>
          <ax-avatar-group [max]="4" size="md">
            <ax-avatar initials="MR" alt="Morgan Reyes" />
            <ax-avatar initials="SK" alt="Sam Kim" />
            <ax-avatar initials="AL" alt="Ava Lin" />
            <ax-avatar initials="JT" alt="Jordan Tate" />
            <ax-avatar initials="NP" alt="Nina Park" />
            <ax-avatar initials="DW" alt="Dev Walsh" />
          </ax-avatar-group>
          <p class="text-xs text-muted-foreground">
            {{ advisors.length }} advisors available · next slot {{ nextSlot() }}
          </p>
        </div>
      </div>

      <div class="demo-surface p-4" axStack gap="4">
        <h3 class="text-sm font-semibold tracking-tight">Service wizard</h3>
        <ax-stepper [(currentStep)]="serviceStep">
          <ax-step label="VIN" description="Identify vehicle" icon="search">
            <div class="mt-3 max-w-md" axStack gap="3">
              <label class="text-sm font-medium" for="service-vin">Vehicle VIN</label>
              <ax-input
                id="service-vin"
                [(value)]="serviceVin"
                placeholder="1HGCM82633A004352"
                ariaLabel="Vehicle VIN"
              />
              <ax-button size="sm" variant="primary" (clickEvent)="serviceStep.set(1)">
                Continue
              </ax-button>
            </div>
          </ax-step>
          <ax-step label="Slot" description="Pick time" icon="clock">
            <div class="mt-3 max-w-md" axStack gap="4">
              <div axStack gap="2">
                <label class="text-sm font-medium" for="service-date">Service date</label>
                <ax-date-picker
                  id="service-date"
                  [(value)]="serviceDate"
                  placeholder="Pick a date"
                  ariaLabel="Service date"
                />
              </div>
              <div axStack gap="2">
                <span class="text-sm font-medium">Service time</span>
                <ax-time-picker [(value)]="serviceTime" [use24]="false" />
              </div>
              <div axCluster gap="2">
                <ax-button size="sm" variant="outline" (clickEvent)="serviceStep.set(0)">
                  Back
                </ax-button>
                <ax-button size="sm" variant="primary" (clickEvent)="serviceStep.set(2)">
                  Continue
                </ax-button>
              </div>
            </div>
          </ax-step>
          <ax-step label="Confirm" description="Review" icon="check-circle">
            <div class="mt-3 max-w-md" axStack gap="3">
              <p class="text-sm text-muted-foreground">
                VIN {{ serviceVin() || '—' }} ·
                {{ serviceDate() ? 'Date selected' : 'No date' }} ·
                {{ formatTime(serviceTime()) }}
              </p>
              <div axCluster gap="2">
                <ax-button size="sm" variant="outline" (clickEvent)="serviceStep.set(1)">
                  Back
                </ax-button>
                <ax-button size="sm" variant="primary" (clickEvent)="confirmService()">
                  Book appointment
                </ax-button>
              </div>
            </div>
          </ax-step>
        </ax-stepper>
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="grid gap-3 sm:grid-cols-2 lg:col-span-4">
          <ax-card>
            <div axCardContent>
              <ax-statistic label="Active vehicles" [value]="128" [trend]="4" />
            </div>
          </ax-card>
          <ax-card>
            <div axCardContent>
              <ax-statistic label="Avg range" [value]="312" suffix=" mi" [trend]="1" />
            </div>
          </ax-card>
        </div>
        <div
          class="demo-surface p-4 lg:col-span-8"
          [axContextMenuTriggerFor]="alertMenu"
          tabindex="0"
          aria-label="Live alerts — right-click for actions"
        >
          <div class="mb-3 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Live alerts</h3>
            <ax-badge>Mock CAN</ax-badge>
          </div>
          <ax-table [columns]="columns" [data]="alerts" [pageSize]="5" />
        </div>
      </div>

      <ax-dropdown-menu #alertMenu>
        <ax-menu-item (select)="ackAlert()">
          <ax-icon name="check" [size]="16" />
          Acknowledge
        </ax-menu-item>
        <ax-menu-item (select)="dispatchAlert()">
          <ax-icon name="arrow-right" [size]="16" />
          Dispatch tech
        </ax-menu-item>
      </ax-dropdown-menu>
    </div>
  `,
})
export class DashboardAutomotiveComponent {
  private readonly layout = inject(DemoLayoutService);
  private readonly toast = inject(ToastService);

  readonly range = signal('d');
  readonly serviceStep = signal(0);
  readonly serviceVin = signal('');
  readonly serviceDate = signal<CalendarValue>(null);
  readonly serviceTime = signal<TimeValue>({ hours: 10, minutes: 30 });

  readonly rangeOptions: SegmentedOption[] = [
    { label: 'Shift', value: 'd' },
    { label: 'Week', value: 'w' },
    { label: 'Month', value: 'm' },
  ];

  readonly stats: StatItem[] = [
    { label: 'Fleet SOC', value: '82', suffix: '%', trend: 3 },
    { label: 'Charging', value: 14, trend: -2 },
    { label: 'Faults', value: 3, trend: -1 },
    { label: 'Miles today', value: '4.2k', trend: 6 },
  ];

  readonly regions = ['North', 'South', 'East', 'West'];
  readonly faultCodes = ['P0', 'P1', 'P2', 'U0', 'B1'];
  readonly faultMatrix: number[][] = [
    [12, 8, 5, 3, 2],
    [9, 11, 6, 4, 1],
    [7, 6, 14, 2, 3],
    [5, 4, 3, 10, 6],
  ];

  readonly advisors = ['MR', 'SK', 'AL', 'JT', 'NP', 'DW'];

  readonly energyLabels = ['06', '09', '12', '15', '18', '21'];
  readonly energySeries: ChartSeries[] = [
    { name: 'kWh', data: [12, 28, 34, 41, 38, 22], color: 1 },
  ];
  readonly spark = [12, 18, 22, 19, 28, 31, 26, 34];

  readonly columns: ColDef<AlertRow>[] = [
    { key: 'vehicle', header: 'Vehicle' },
    { key: 'signal', header: 'Signal' },
    { key: 'severity', header: 'Severity' },
    { key: 'eta', header: 'ETA' },
  ];

  readonly alerts: AlertRow[] = [
    { vehicle: 'EV-104', signal: 'Battery temp', severity: 'Warn', eta: '12m' },
    { vehicle: 'EV-088', signal: 'Tire pressure', severity: 'Info', eta: '—' },
    { vehicle: 'EV-221', signal: 'Charger handshake', severity: 'Critical', eta: '4m' },
    { vehicle: 'EV-056', signal: 'GPS drift', severity: 'Warn', eta: '28m' },
  ];

  rangeLabel(): string {
    const v = this.range();
    if (v === 'w') return 'this week';
    if (v === 'm') return 'this month';
    return 'this shift';
  }

  nextSlot(): string {
    const t = this.serviceTime();
    const h = t.hours % 12 || 12;
    const m = t.minutes.toString().padStart(2, '0');
    const ap = t.hours >= 12 ? 'PM' : 'AM';
    return `${h}:${m} ${ap}`;
  }

  formatTime(t: TimeValue): string {
    const h = t.hours % 12 || 12;
    const m = t.minutes.toString().padStart(2, '0');
    const ap = t.hours >= 12 ? 'PM' : 'AM';
    return `${h}:${m} ${ap}`;
  }

  applyPreset(): void {
    this.layout.setPreset('automotive');
  }

  confirmService(): void {
    this.toast.show({
      title: 'Service booked',
      description: `Appointment confirmed for ${this.serviceVin() || 'vehicle'}.`,
      variant: 'success',
    });
    this.serviceStep.set(0);
  }

  ackAlert(): void {
    this.toast.show({
      title: 'Alert acknowledged',
      description: `${this.alerts[0]?.vehicle ?? 'Vehicle'} marked as reviewed.`,
      variant: 'default',
    });
  }

  dispatchAlert(): void {
    this.toast.show({
      title: 'Tech dispatched',
      description: 'Field team notified for the highest-severity alert.',
      variant: 'success',
    });
  }
}
