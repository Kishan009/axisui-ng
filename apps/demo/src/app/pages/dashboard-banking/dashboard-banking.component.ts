import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  AxDataGridComponent,
  type GridColumnDef,
} from '@axisui-ng/data';
import { AxAlertComponent, ToastService } from '@axisui-ng/feedback';
import {
  AxFormFieldComponent,
  AxInputComponent,
  AxInputMaskComponent,
} from '@axisui-ng/forms';
import { AxIconComponent } from '@axisui-ng/icons';
import {
  AxBreadcrumbComponent,
  AxBreadcrumbItemComponent,
} from '@axisui-ng/navigation';
import {
  AxDialogComponent,
  AxDialogDescriptionDirective,
  AxDialogTitleDirective,
  AxOverlayCloseDirective,
} from '@axisui-ng/overlays';
import {
  AxClusterDirective,
  AxHeadingDirective,
  AxStackDirective,
  AxTextDirective,
} from '@axisui-ng/primitives';
import { AxChartComponent, AxGaugeComponent, type ChartSeries } from '@axisui-ng/charts';

import { DemoLayoutService } from '../../layout/layout.service';

interface TxRow extends Record<string, unknown> {
  id: number;
  date: string;
  description: string;
  amount: string;
  status: string;
}

@Component({
  selector: 'demo-dashboard-banking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxStatRowComponent,
    AxChartComponent,
    AxDataGridComponent,
    AxGaugeComponent,
    AxSegmentedComponent,
    AxBadgeComponent,
    AxAlertComponent,
    AxAvatarComponent,
    AxAvatarGroupComponent,
    AxButtonComponent,
    AxButtonLeadingDirective,
    AxBreadcrumbComponent,
    AxBreadcrumbItemComponent,
    AxDialogComponent,
    AxDialogTitleDirective,
    AxDialogDescriptionDirective,
    AxOverlayCloseDirective,
    AxFormFieldComponent,
    AxInputComponent,
    AxInputMaskComponent,
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
        <ax-breadcrumb-item [current]="true">Banking</ax-breadcrumb-item>
      </ax-breadcrumb>

      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div class="max-w-2xl">
          <h2 axHeading size="2xl" weight="semibold" tracking="tight">Banking</h2>
          <p axText size="sm" tone="muted" class="mt-1 leading-relaxed">
            Trust-oriented workspace — joint accounts, utilization, and ledger in one view.
            Apply the banking preset to see industry tokens.
          </p>
        </div>
        <div axCluster gap="2" class="items-center">
          <ax-segmented
            [options]="periodOptions"
            [(value)]="period"
            size="sm"
            ariaLabel="Statement period"
          />
          <ax-button variant="outline" size="sm" (clickEvent)="applyBankingPreset()">
            Apply banking preset
          </ax-button>
          <ax-button variant="primary" size="sm" (clickEvent)="transferOpen.set(true)">
            <ax-icon axButtonLeading name="arrow-up-right" [size]="16" />
            Transfer
          </ax-button>
        </div>
      </div>

      <ax-alert variant="info">
        Mock balances for {{ periodLabel() }}. Theme → banking changes accent / radius via
        <code class="text-xs">data-industry</code>.
      </ax-alert>

      <div class="demo-surface flex flex-wrap items-center gap-4 p-4">
        <ax-avatar-group [max]="3" size="lg">
          <ax-avatar initials="JD" alt="Jordan Doe" size="lg" />
          <ax-avatar initials="AD" alt="Alex Doe" size="lg" />
          <ax-avatar initials="MK" alt="Morgan Kim" size="lg" />
        </ax-avatar-group>
        <div class="min-w-0 flex-1">
          <p axText size="sm" weight="medium">Jordan &amp; Alex Doe</p>
          <p axText size="xs" tone="muted">Joint checking · ••4821 · Primary</p>
        </div>
        <ax-badge appearance="soft" variant="success" class="ms-auto shrink-0">Verified</ax-badge>
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface demo-tabular p-4 lg:col-span-8">
          <ax-stat-row ariaLabel="Account metrics" [stats]="stats" [columns]="4" />
        </div>
        <div class="demo-surface flex flex-col items-center justify-center gap-2 p-4 lg:col-span-4">
          <h3 class="w-full text-sm font-semibold tracking-tight">Credit utilization</h3>
          <ax-gauge
            [value]="creditUtilization()"
            [startAngle]="0"
            [endAngle]="180"
            [colorIndex]="4"
            label="of limit"
            ariaLabel="Credit utilization"
          />
          <p axText size="xs" tone="muted" class="text-center">
            {{ creditUtilization() }}% used · {{ periodLabel() }} statement
          </p>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface p-4 lg:col-span-7">
          <div class="mb-3 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Balance trend</h3>
            <ax-badge appearance="soft" variant="info">Line · {{ periodLabel() }}</ax-badge>
          </div>
          <div class="w-full min-w-0">
            <ax-chart
              class="block w-full"
              type="line"
              [series]="balanceSeries()"
              [labels]="balanceLabels()"
              [height]="240"
              ariaLabel="Balance trend"
            />
          </div>
        </div>

        <div class="demo-surface p-4 lg:col-span-5">
          <div class="mb-3 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Recent transactions</h3>
            <ax-badge>Sortable ledger</ax-badge>
          </div>
          <ax-data-grid
            [columns]="txColumns"
            [data]="transactions"
            [pageSize]="6"
            searchable
          />
        </div>
      </div>
    </div>

    <ax-dialog [(open)]="transferOpen">
      <h2 axDialogTitle class="text-lg font-semibold tracking-tight">Transfer funds</h2>
      <p axDialogDescription class="text-sm text-muted-foreground">
        Move money between linked accounts. Mock confirmation only.
      </p>
      <div axStack gap="4" class="py-2">
        <ax-form-field label="Amount" forId="xfer-amount" helper="USD · available $61,500">
          <ax-input
            id="xfer-amount"
            type="text"
            [(value)]="transferAmount"
            placeholder="0.00"
          />
        </ax-form-field>
        <ax-form-field label="To account" forId="xfer-account" helper="Routing on file">
          <ax-input-mask
            id="xfer-account"
            mask="9999-9999-9999-9999"
            placeholder="____-____-____-____"
            [(value)]="transferAccount"
            ariaLabel="Destination account"
          />
        </ax-form-field>
      </div>
      <div axDialogFooter>
        <ax-button variant="ghost" size="sm" axOverlayClose>Cancel</ax-button>
        <ax-button variant="primary" size="sm" (clickEvent)="confirmTransfer()">
          <ax-icon axButtonLeading name="check" [size]="16" />
          Confirm transfer
        </ax-button>
      </div>
    </ax-dialog>
  `,
})
export class DashboardBankingComponent {
  private readonly layout = inject(DemoLayoutService);
  private readonly toast = inject(ToastService);

  readonly period = signal('30d');
  readonly transferOpen = signal(false);
  readonly transferAmount = signal<string | null>(null);
  readonly transferAccount = signal<string | null>(null);

  readonly periodOptions: SegmentedOption[] = [
    { label: '7d', value: '7d' },
    { label: '30d', value: '30d' },
    { label: '90d', value: '90d' },
  ];

  readonly stats: StatItem[] = [
    { label: 'Total balance', value: '84.2k', prefix: '$', trend: 3 },
    { label: 'Available', value: '61.5k', prefix: '$', trend: 1 },
    { label: 'Pending', value: '1.2k', prefix: '$', trend: -4 },
    { label: 'APY', value: '4.25', suffix: '%', trend: 0 },
  ];

  readonly txColumns: GridColumnDef<TxRow>[] = [
    { key: 'date', header: 'Date', sortable: true },
    { key: 'description', header: 'Description', sortable: true, searchable: true },
    { key: 'amount', header: 'Amount', sortable: true, align: 'end' },
    { key: 'status', header: 'Status', sortable: true, filterable: true },
  ];

  readonly transactions: TxRow[] = [
    { id: 1, date: 'Jul 18', description: 'Payroll deposit', amount: '+$4,200', status: 'Posted' },
    { id: 2, date: 'Jul 17', description: 'Rent — Oak St', amount: '-$2,100', status: 'Posted' },
    { id: 3, date: 'Jul 16', description: 'Whole Foods Market', amount: '-$86.40', status: 'Posted' },
    { id: 4, date: 'Jul 15', description: 'Transfer in', amount: '+$500', status: 'Pending' },
    { id: 5, date: 'Jul 14', description: 'Utilities — electric', amount: '-$142', status: 'Posted' },
    { id: 6, date: 'Jul 13', description: 'ATM withdrawal', amount: '-$200', status: 'Posted' },
    { id: 7, date: 'Jul 12', description: 'Interest credit', amount: '+$18.42', status: 'Posted' },
    { id: 8, date: 'Jul 11', description: 'Card payment', amount: '-$1,240', status: 'Posted' },
  ];

  readonly balanceLabels = computed(() => {
    const p = this.period();
    if (p === '7d') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (p === '90d') return ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    return ['Jun 1', 'Jun 8', 'Jun 15', 'Jun 22', 'Jun 29', 'Jul 6', 'Jul 13'];
  });

  readonly balanceSeries = computed<ChartSeries[]>(() => {
    const p = this.period();
    const data =
      p === '7d'
        ? [79, 80, 81, 82, 83, 83.5, 84.2]
        : p === '90d'
          ? [62, 65, 68, 71, 78, 84]
          : [78, 79.5, 80, 81.5, 82, 83, 84.2];
    return [{ name: 'Balance', data, color: 1 }];
  });

  readonly creditUtilization = computed(() => {
    const p = this.period();
    if (p === '7d') return 28;
    if (p === '90d') return 41;
    return 34;
  });

  periodLabel(): string {
    const p = this.period();
    if (p === '7d') return 'the last 7 days';
    if (p === '90d') return 'the last 90 days';
    return 'the last 30 days';
  }

  applyBankingPreset(): void {
    this.layout.setPreset('banking');
  }

  confirmTransfer(): void {
    const amount = this.transferAmount()?.trim() || '0';
    const account = this.transferAccount()?.replace(/\D/g, '').slice(-4) ?? '****';
    this.toast.show({
      title: 'Transfer submitted',
      description: `$${amount} queued to account ending ${account}`,
      variant: 'success',
    });
    this.transferOpen.set(false);
    this.transferAmount.set(null);
    this.transferAccount.set(null);
  }
}
