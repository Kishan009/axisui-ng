import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AxButtonComponent, AxSegmentedComponent, type SegmentedOption } from '@axisui-ng/buttons';
import {
  AxBadgeComponent,
  AxCardComponent,
  AxStatisticComponent,
  AxTableComponent,
  AxTimelineComponent,
  type ColDef,
  type TimelineItem,
} from '@axisui-ng/data';
import { AxAlertComponent } from '@axisui-ng/feedback';
import { AxStepComponent, AxStepperComponent } from '@axisui-ng/flow';
import {
  AxBreadcrumbComponent,
  AxBreadcrumbItemComponent,
} from '@axisui-ng/navigation';
import {
  AxClusterDirective,
  AxHeadingDirective,
  AxStackDirective,
  AxTextDirective,
} from '@axisui-ng/primitives';
import {
  AxChartComponent,
  AxHeatmapComponent,
  AxSparklineComponent,
  type ChartSeries,
  type ChartSeriesInput,
} from '@axisui-ng/charts';

import { DemoLayoutService } from '../../layout/layout.service';

interface LeadRow {
  company: string;
  stage: string;
  mrr: string;
  owner: string;
}

@Component({
  selector: 'demo-dashboard-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxSegmentedComponent,
    AxStepperComponent,
    AxStepComponent,
    AxCardComponent,
    AxStatisticComponent,
    AxChartComponent,
    AxHeatmapComponent,
    AxSparklineComponent,
    AxTableComponent,
    AxTimelineComponent,
    AxBadgeComponent,
    AxAlertComponent,
    AxButtonComponent,
    AxBreadcrumbComponent,
    AxBreadcrumbItemComponent,
    AxStackDirective,
    AxClusterDirective,
    AxHeadingDirective,
    AxTextDirective,
  ],
  template: `
    <div axStack gap="6">
      <ax-breadcrumb>
        <ax-breadcrumb-item><span>Demo</span></ax-breadcrumb-item>
        <ax-breadcrumb-item [current]="true">Analytics</ax-breadcrumb-item>
      </ax-breadcrumb>

      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div class="max-w-2xl">
          <h2 axHeading size="2xl" weight="semibold" tracking="tight">Analytics</h2>
          <p axText size="sm" tone="muted" class="mt-1">
            SaaS product metrics — apply the blue preset to restyle charts and surfaces.
          </p>
        </div>
        <div axCluster gap="2" class="items-center">
          <ax-segmented
            [options]="periodOptions"
            [(value)]="period"
            size="sm"
            ariaLabel="Reporting period"
          />
          <ax-button variant="outline" size="sm" (clickEvent)="applyBluePreset()">
            Apply blue preset
          </ax-button>
          <ax-button variant="primary" size="sm">Create report</ax-button>
        </div>
      </div>

      <ax-alert variant="info">
        Mock analytics for {{ periodLabel() }}. Donut, bar, and heatmap inherit
        <code class="text-xs">--color-chart-*</code> tokens from Theme.
      </ax-alert>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        @for (kpi of kpis(); track kpi.label) {
          <ax-card>
            <div axCardContent class="!p-4">
              <ax-statistic
                [label]="kpi.label"
                [value]="kpi.value"
                [prefix]="kpi.prefix ?? ''"
                [suffix]="kpi.suffix ?? ''"
                [trend]="kpi.trend"
              />
            </div>
          </ax-card>
        }
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface p-4 lg:col-span-5">
          <div class="mb-3 flex items-center justify-between gap-2">
            <h3 axHeading size="sm" weight="semibold">Traffic mix</h3>
            <ax-badge appearance="soft" variant="info">Donut</ax-badge>
          </div>
          <div class="w-full min-w-0">
            <ax-chart
              class="block w-full"
              type="donut"
              [series]="trafficSeries"
              [height]="260"
              [donutRatio]="0.58"
              ariaLabel="Traffic by channel"
            />
          </div>
        </div>

        <div class="demo-surface p-4 lg:col-span-7">
          <div class="mb-3 flex items-center justify-between gap-2">
            <h3 axHeading size="sm" weight="semibold">Weekly signups</h3>
            <ax-badge appearance="soft" variant="info">Bar</ax-badge>
          </div>
          <div class="w-full min-w-0">
            <ax-chart
              class="block w-full"
              type="bar"
              [series]="signupSeries()"
              [labels]="signupLabels"
              [height]="260"
              ariaLabel="Weekly signups"
            />
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface p-4 lg:col-span-5" axStack gap="3">
          <div class="flex items-center justify-between gap-2">
            <h3 axHeading size="sm" weight="semibold">Engagement matrix</h3>
            <ax-badge appearance="soft" variant="info">Heatmap</ax-badge>
          </div>
          <p axText size="xs" tone="muted">Session intensity by day and time block.</p>
          <ax-heatmap
            [matrix]="heatmapMatrix"
            [rows]="heatmapRows"
            [cols]="heatmapCols"
            [colorIndex]="2"
            scale="sequential"
            ariaLabel="Weekly engagement heatmap"
          />
        </div>

        <div class="demo-surface p-4 lg:col-span-7" axStack gap="4">
          <div class="flex items-center justify-between gap-2">
            <h3 axHeading size="sm" weight="semibold">Report builder</h3>
            <ax-badge>Stepper</ax-badge>
          </div>
          <ax-stepper #reportStepper [(currentStep)]="reportStep">
            <ax-step label="Metrics" description="Choose KPIs" icon="signal">
              <div axStack gap="2" class="pt-2">
                <p axText size="sm" tone="muted">
                  Select MRR, activation, and NPS for the {{ periodLabel() }} export.
                </p>
                <div axCluster gap="2">
                  <ax-badge appearance="soft" variant="info">MRR</ax-badge>
                  <ax-badge appearance="soft" variant="info">Activation</ax-badge>
                  <ax-badge appearance="soft" variant="info">NPS</ax-badge>
                </div>
              </div>
            </ax-step>
            <ax-step label="Filters" description="Segment audience" icon="filter">
              <div axStack gap="2" class="pt-2">
                <p axText size="sm" tone="muted">
                  Workspace, plan tier, and cohort filters for the selected period.
                </p>
                <ax-segmented
                  [options]="periodOptions"
                  [(value)]="period"
                  size="sm"
                  ariaLabel="Export period"
                />
              </div>
            </ax-step>
            <ax-step label="Export" description="Schedule delivery" icon="download">
              <div axStack gap="2" class="pt-2">
                <p axText size="sm" tone="muted">
                  CSV to email every Monday, or push to your data warehouse.
                </p>
                <ax-button variant="primary" size="sm">Schedule export</ax-button>
              </div>
            </ax-step>
          </ax-stepper>
          <div axCluster gap="2">
            <ax-button
              variant="outline"
              size="sm"
              [disabled]="reportStep() === 0"
              (clickEvent)="reportStepper.previous()"
            >
              Back
            </ax-button>
            <ax-button
              variant="primary"
              size="sm"
              [disabled]="reportStep() === 2"
              (clickEvent)="reportStepper.next()"
            >
              Next
            </ax-button>
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface p-4 lg:col-span-5" axStack gap="4">
          <div class="flex items-center justify-between gap-2">
            <h3 axHeading size="sm" weight="semibold">Activity</h3>
            <ax-badge>Timeline</ax-badge>
          </div>
          <ax-timeline [items]="activity" />
        </div>

        <div class="demo-surface p-4 lg:col-span-7" axStack gap="4">
          <div class="flex items-center justify-between gap-2">
            <h3 axHeading size="sm" weight="semibold">Pipeline leads</h3>
            <div axCluster gap="2" class="items-center">
              <ax-sparkline
                [data]="sparkData"
                type="area"
                [colorIndex]="1"
                [width]="96"
                [height]="28"
                ariaLabel="Lead volume trend"
              />
              <ax-badge>Mock CRM</ax-badge>
            </div>
          </div>
          <ax-table [columns]="columns" [data]="leads" [pageSize]="5" />
        </div>
      </div>
    </div>
  `,
})
export class DashboardAnalyticsComponent {
  private readonly layout = inject(DemoLayoutService);

  readonly period = signal<string | null>('week');
  readonly reportStep = signal(0);

  readonly periodOptions: SegmentedOption[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];

  readonly periodLabel = computed(() => {
    const map: Record<string, string> = { day: 'today', week: 'this week', month: 'this month' };
    return map[this.period() ?? 'week'] ?? 'this week';
  });

  readonly kpis = computed(() => {
    const scale = this.period() === 'day' ? 0.14 : this.period() === 'month' ? 4.2 : 1;
    return [
      { label: 'MRR', value: Math.round(86200 * scale), prefix: '$', suffix: undefined, trend: 9 },
      { label: 'Active seats', value: Math.round(4120 * scale), prefix: undefined, suffix: undefined, trend: 5 },
      { label: 'Activation', value: 61, prefix: undefined, suffix: '%', trend: 2 },
      { label: 'NPS', value: 48, prefix: undefined, suffix: undefined, trend: 1 },
    ];
  });

  readonly trafficSeries: ChartSeriesInput[] = [
    {
      kind: 'radial',
      name: 'Traffic by channel',
      data: [
        { label: 'Organic', value: 42 },
        { label: 'Paid', value: 28 },
        { label: 'Email', value: 18 },
        { label: 'Direct', value: 12 },
      ],
    },
  ];

  readonly signupLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  readonly signupSeries = computed<ChartSeries[]>(() => {
    const mult = this.period() === 'day' ? 0.3 : this.period() === 'month' ? 3.8 : 1;
    return [{ name: 'Signups', data: [38, 44, 41, 52, 61, 29, 24].map((v) => Math.round(v * mult)), color: 2 }];
  });

  readonly heatmapRows = ['Morning', 'Midday', 'Afternoon', 'Evening', 'Night'];
  readonly heatmapCols = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly heatmapMatrix = [
    [12, 18, 22, 15, 28, 8, 6],
    [24, 31, 29, 35, 42, 14, 11],
    [38, 44, 41, 48, 52, 22, 18],
    [29, 33, 36, 31, 38, 19, 15],
    [14, 16, 18, 12, 20, 9, 7],
  ];

  readonly sparkData = [12, 18, 15, 22, 28, 26, 34, 31, 38, 42];

  readonly activity: TimelineItem[] = [
    {
      title: 'Workspace created',
      time: '09:12',
      description: 'Acme Analytics provisioned on blue preset.',
      icon: 'check-circle',
      color: 'success',
    },
    {
      title: 'Invite accepted',
      time: '10:04',
      description: 'morgan@acme.dev joined as Admin.',
      icon: 'user',
      color: 'primary',
    },
    {
      title: 'Report scheduled',
      time: '11:30',
      description: 'Weekly signups CSV every Monday 08:00.',
      icon: 'clock',
      color: 'default',
    },
    {
      title: 'Spike detected',
      time: '14:18',
      description: 'Paid channel +22% vs trailing 7 days.',
      icon: 'signal',
      color: 'warning',
    },
  ];

  readonly columns: ColDef<LeadRow>[] = [
    { key: 'company', header: 'Company' },
    { key: 'stage', header: 'Stage' },
    { key: 'mrr', header: 'MRR' },
    { key: 'owner', header: 'Owner' },
  ];

  readonly leads: LeadRow[] = [
    { company: 'Northwind', stage: 'Qualified', mrr: '$1.2k', owner: 'Ada' },
    { company: 'Contoso', stage: 'Proposal', mrr: '$4.8k', owner: 'Lin' },
    { company: 'Fabrikam', stage: 'Trial', mrr: '$890', owner: 'Sam' },
    { company: 'AdventureWorks', stage: 'Negotiation', mrr: '$6.1k', owner: 'Ada' },
    { company: 'Tailspin', stage: 'Qualified', mrr: '$2.4k', owner: 'Jordan' },
  ];

  applyBluePreset(): void {
    this.layout.setPreset('blue');
  }
}
