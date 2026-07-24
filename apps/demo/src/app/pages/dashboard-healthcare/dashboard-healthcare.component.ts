import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AxStatRowComponent, type StatItem } from '@axisui-ng/blocks';
import { AxButtonComponent } from '@axisui-ng/buttons';
import {
  AxBadgeComponent,
  AxTableComponent,
  AxTimelineComponent,
  type ColDef,
  type TimelineItem,
} from '@axisui-ng/data';
import { AxAlertComponent, ToastService } from '@axisui-ng/feedback';
import {
  AxFormFieldComponent,
  AxInputNumberComponent,
  AxDatePickerComponent,
  AxTimePickerComponent,
  type TimeValue,
} from '@axisui-ng/forms';
import { AxIconComponent } from '@axisui-ng/icons';
import {
  AxBreadcrumbComponent,
  AxBreadcrumbItemComponent,
} from '@axisui-ng/navigation';
import {
  AxDialogDescriptionDirective,
  AxDialogTitleDirective,
  AxSheetComponent,
} from '@axisui-ng/overlays';
import {
  AxClusterDirective,
  AxHeadingDirective,
  AxStackDirective,
  AxTextDirective,
} from '@axisui-ng/primitives';
import {
  AxVirtualForDirective,
  AxVirtualViewportDirective,
} from '@axisui-ng/cdk';
import { AxChartComponent, AxGaugeComponent, type ChartSeries } from '@axisui-ng/charts';

import { DemoLayoutService } from '../../layout/layout.service';

interface ApptRow {
  time: string;
  patient: string;
  clinician: string;
  status: string;
}

interface CensusRow {
  name: string;
  unit: string;
  acuity: string;
}

const FIRST_NAMES = [
  'Alex', 'Sam', 'Jordan', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Blake', 'Drew', 'Harper', 'Logan', 'Parker', 'Reese', 'Skyler', 'Taylor',
];
const LAST_NAMES = [
  'Rivera', 'Okonkwo', 'Lee', 'Blake', 'Ng', 'Patel', 'Chen', 'Diaz',
  'Kim', 'Martinez', 'Johnson', 'Williams', 'Brown', 'Garcia', 'Wilson', 'Moore',
];
const UNITS = ['Med-Surg', 'ICU', 'ED', 'Ortho', 'Peds', 'Oncology'];
const ACUITIES = ['Stable', 'Monitor', 'Critical', 'Discharge ready'];

@Component({
  selector: 'demo-dashboard-healthcare',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxStatRowComponent,
    AxChartComponent,
    AxGaugeComponent,
    AxTableComponent,
    AxTimelineComponent,
    AxBadgeComponent,
    AxAlertComponent,
    AxButtonComponent,
    AxBreadcrumbComponent,
    AxBreadcrumbItemComponent,
    AxSheetComponent,
    AxDialogTitleDirective,
    AxDialogDescriptionDirective,
    AxFormFieldComponent,
    AxInputNumberComponent,
    AxDatePickerComponent,
    AxTimePickerComponent,
    AxVirtualViewportDirective,
    AxVirtualForDirective,
    AxIconComponent,
    AxStackDirective,
    AxClusterDirective,
    AxHeadingDirective,
    AxTextDirective,
  ],
  template: `
    <div axStack gap="6">
      <ax-breadcrumb>
        <ax-breadcrumb-item><span>Demo</span></ax-breadcrumb-item>
        <ax-breadcrumb-item [current]="true">Healthcare</ax-breadcrumb-item>
      </ax-breadcrumb>

      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div class="max-w-2xl">
          <h2 axHeading size="2xl" weight="semibold" tracking="tight">Healthcare</h2>
          <p axText size="sm" tone="muted" class="mt-1 leading-relaxed">
            Clinical ops workspace — capacity, pathways, and census at a glance.
            Apply the healthcare preset for industry tokens.
          </p>
        </div>
        <div axCluster gap="2">
          <ax-button variant="outline" size="sm" (clickEvent)="applyPreset()">
            Apply healthcare preset
          </ax-button>
          <ax-button variant="primary" size="sm" (clickEvent)="bookingOpen.set(true)">
            <ax-icon name="plus" [size]="16" class="me-1.5 inline-block align-middle" />
            New appointment
          </ax-button>
        </div>
      </div>

      <ax-alert variant="info">
        Mock clinic data. Theme → healthcare shifts accent via
        <code class="text-xs">data-industry</code>.
      </ax-alert>

      <div class="demo-surface demo-tabular p-4">
        <ax-stat-row ariaLabel="Clinic metrics" [stats]="stats" [columns]="4" />
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface flex flex-wrap items-center justify-around gap-4 p-4 lg:col-span-4">
          <ax-gauge
            [value]="12"
            [min]="0"
            [max]="30"
            [startAngle]="0"
            [endAngle]="180"
            [colorIndex]="2"
            label="Avg wait (min)"
            ariaLabel="Average wait time"
          />
          <ax-gauge
            [value]="81"
            [startAngle]="0"
            [endAngle]="180"
            [colorIndex]="3"
            label="Capacity"
            ariaLabel="Clinic capacity used"
          />
        </div>

        <div class="demo-surface p-4 lg:col-span-8">
          <div class="mb-3 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Weekly visits</h3>
            <ax-badge appearance="soft" variant="info">Bar</ax-badge>
          </div>
          <div class="w-full min-w-0">
            <ax-chart
              class="block w-full"
              type="bar"
              [series]="visitsSeries"
              [labels]="visitsLabels"
              [height]="220"
              ariaLabel="Weekly visits"
            />
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface p-4 lg:col-span-5" axStack gap="3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Care pathway</h3>
            <ax-badge appearance="soft" variant="success">Live</ax-badge>
          </div>
          <ax-timeline [items]="pathway" />
        </div>

        <div class="demo-surface p-4 lg:col-span-7">
          <div class="mb-3 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Today’s schedule</h3>
            <ax-badge>Mock EHR</ax-badge>
          </div>
          <ax-table [columns]="columns" [data]="appointments" [pageSize]="5" />
        </div>
      </div>

      <div class="demo-surface p-4" axStack gap="3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="text-sm font-semibold tracking-tight">Patient census</h3>
            <p axText size="xs" tone="muted">Virtualized list — 200 admitted patients</p>
          </div>
          <ax-badge appearance="soft" variant="info">{{ patients.length }} rows</ax-badge>
        </div>
        <div axVirtualViewport class="h-64 rounded-md border border-border text-sm">
          <div
            *axVirtualFor="let row of patients; itemSize: 36"
            class="flex h-9 items-center justify-between gap-3 border-b border-border px-3"
          >
            <span class="truncate">{{ row.name }}</span>
            <div axCluster gap="2" class="shrink-0">
              <ax-badge appearance="soft" variant="info">{{ row.unit }}</ax-badge>
              <ax-badge appearance="soft">{{ row.acuity }}</ax-badge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ax-sheet [(open)]="bookingOpen" side="end">
      <div class="w-[min(100vw,22rem)] p-4" axStack gap="4">
        <h4 axDialogTitle class="text-base font-semibold tracking-tight">Book appointment</h4>
        <p axDialogDescription class="text-sm text-muted-foreground">
          Pick a slot on today’s schedule. Mock booking only.
        </p>
        <ax-form-field label="Date" forId="hc-date">
          <ax-date-picker
            id="hc-date"
            [(value)]="bookingDate"
            placeholder="Select date"
            ariaLabel="Appointment date"
          />
        </ax-form-field>
        <ax-form-field label="Time" forId="hc-time">
          <ax-time-picker id="hc-time" [(value)]="bookingTime" />
        </ax-form-field>
        <ax-form-field label="Guests" forId="hc-guests" helper="Companions or interpreters">
          <ax-input-number
            id="hc-guests"
            [(value)]="guestCount"
            [min]="0"
            [max]="4"
            ariaLabel="Guest count"
          />
        </ax-form-field>
        <ax-button variant="primary" size="sm" (clickEvent)="applyBooking()">Apply</ax-button>
      </div>
    </ax-sheet>
  `,
})
export class DashboardHealthcareComponent {
  private readonly layout = inject(DemoLayoutService);
  private readonly toast = inject(ToastService);

  readonly bookingOpen = signal(false);
  readonly bookingDate = signal<Date | null>(new Date());
  readonly bookingTime = signal<TimeValue>({ hours: 10, minutes: 30 });
  readonly guestCount = signal<number | null>(1);

  readonly stats: StatItem[] = [
    { label: 'Patients today', value: 48, trend: 6 },
    { label: 'Avg wait', value: 12, suffix: 'm', trend: -8 },
    { label: 'No-shows', value: 3, trend: -1 },
    { label: 'Satisfaction', value: '4.7', suffix: '/5', trend: 2 },
  ];

  readonly visitsLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly visitsSeries: ChartSeries[] = [
    { name: 'Visits', data: [42, 38, 51, 47, 55, 22, 18], color: 2 },
  ];

  readonly pathway: TimelineItem[] = [
    {
      title: 'Triage complete',
      time: '08:42',
      description: 'Vitals captured · acuity 3 · assigned to Med-Surg.',
      icon: 'check-circle',
      color: 'success',
    },
    {
      title: 'Labs ordered',
      time: '09:05',
      description: 'CBC + metabolic panel · stat for bed 12.',
      icon: 'file-text',
      color: 'primary',
    },
    {
      title: 'Imaging scheduled',
      time: '09:48',
      description: 'Portable chest X-ray · ETA 25 min.',
      icon: 'clock',
      color: 'default',
    },
    {
      title: 'Consult pending',
      time: '10:15',
      description: 'Cardiology review requested · on-call notified.',
      icon: 'alert-triangle',
      color: 'warning',
    },
  ];

  readonly columns: ColDef<ApptRow>[] = [
    { key: 'time', header: 'Time' },
    { key: 'patient', header: 'Patient' },
    { key: 'clinician', header: 'Clinician' },
    { key: 'status', header: 'Status' },
  ];

  readonly appointments: ApptRow[] = [
    { time: '09:00', patient: 'Alex Rivera', clinician: 'Dr. Chen', status: 'Checked in' },
    { time: '09:30', patient: 'Sam Okonkwo', clinician: 'Dr. Patel', status: 'Waiting' },
    { time: '10:00', patient: 'Jordan Lee', clinician: 'Dr. Chen', status: 'Scheduled' },
    { time: '10:30', patient: 'Morgan Blake', clinician: 'NP Diaz', status: 'Scheduled' },
    { time: '11:00', patient: 'Casey Ng', clinician: 'Dr. Patel', status: 'Cancelled' },
  ];

  readonly patients: CensusRow[] = Array.from({ length: 200 }, (_, i) => ({
    name: `${FIRST_NAMES[i % FIRST_NAMES.length]!} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]!}`,
    unit: UNITS[i % UNITS.length]!,
    acuity: ACUITIES[i % ACUITIES.length]!,
  }));

  applyPreset(): void {
    this.layout.setPreset('healthcare');
  }

  applyBooking(): void {
    const guests = this.guestCount() ?? 0;
    this.toast.show({
      title: 'Appointment booked',
      description: `${guests} guest${guests === 1 ? '' : 's'} · mock slot reserved`,
      variant: 'success',
    });
    this.bookingOpen.set(false);
  }
}
