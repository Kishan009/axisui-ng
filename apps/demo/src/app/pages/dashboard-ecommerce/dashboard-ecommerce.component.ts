import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  AxButtonComponent,
  AxButtonLeadingDirective,
  AxSegmentedComponent,
  type SegmentedOption,
} from '@axisui-ng/buttons';
import { AxStatRowComponent, type StatItem } from '@axisui-ng/blocks';
import {
  AxBadgeComponent,
  AxCardComponent,
  AxTableComponent,
  AxTimelineComponent,
  type ColDef,
  type TimelineItem,
} from '@axisui-ng/data';
import { AxAlertComponent, AxProgressComponent } from '@axisui-ng/feedback';
import { AxStepComponent, AxStepperComponent } from '@axisui-ng/flow';
import { AxIconComponent } from '@axisui-ng/icons';
import {
  AxAspectRatioDirective,
  AxClusterDirective,
  AxHeadingDirective,
  AxStackDirective,
  AxTextDirective,
} from '@axisui-ng/primitives';
import { AxChartComponent, type ChartSeries } from '@axisui-ng/charts';

interface OrderRow {
  id: string;
  customer: string;
  total: string;
  status: string;
  channel: 'dtc' | 'marketplace';
}

interface ProductCard {
  name: string;
  sku: string;
  price: string;
  stock: string;
  variant: 'success' | 'warning' | 'info';
  channel: 'dtc' | 'marketplace' | 'both';
}

@Component({
  selector: 'demo-dashboard-ecommerce',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxStatRowComponent,
    AxSegmentedComponent,
    AxStepperComponent,
    AxStepComponent,
    AxCardComponent,
    AxChartComponent,
    AxTableComponent,
    AxTimelineComponent,
    AxBadgeComponent,
    AxAlertComponent,
    AxProgressComponent,
    AxButtonComponent,
    AxButtonLeadingDirective,
    AxIconComponent,
    AxAspectRatioDirective,
    AxStackDirective,
    AxClusterDirective,
    AxHeadingDirective,
    AxTextDirective,
  ],
  template: `
    <div axStack gap="6">
      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div class="max-w-2xl">
          <h2 axHeading size="2xl" weight="semibold" tracking="tight">E-commerce</h2>
          <p axText size="sm" tone="muted" class="mt-1">
            Storefront ops — preset, density, and dark mode restyle every surface below.
          </p>
        </div>
        <div axCluster gap="2" class="items-center">
          <ax-segmented
            [options]="channelOptions"
            [(value)]="channel"
            size="sm"
            ariaLabel="Sales channel filter"
          />
          <ax-button variant="outline" size="sm">Export</ax-button>
          <ax-button variant="primary" size="sm">
            <ax-icon axButtonLeading name="plus" [size]="16" />
            New order
          </ax-button>
        </div>
      </div>

      <ax-alert variant="info">
        Showing {{ channelLabel() }} revenue. Mock data — open Theme to prove the token cascade.
      </ax-alert>

      <div class="demo-surface demo-tabular p-4">
        <ax-stat-row ariaLabel="Key metrics" [stats]="stats()" [columns]="4" />
      </div>

      <div class="demo-surface p-4" axStack gap="3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 axHeading size="sm" weight="semibold">Top products</h3>
          <ax-badge appearance="soft" variant="info">{{ filteredProducts().length }} SKUs</ax-badge>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          @for (product of filteredProducts(); track product.sku) {
            <ax-card>
              <div axCardContent class="!p-0">
                <div class="rounded-t-[var(--radius-card)] bg-muted" [axAspectRatio]="1">
                  <div class="flex h-full w-full items-center justify-center">
                    <ax-icon name="image" [size]="28" class="text-muted-foreground/60" />
                  </div>
                </div>
                <div class="p-4" axStack gap="2">
                  <div class="flex items-start justify-between gap-2">
                    <span axText size="sm" weight="semibold">{{ product.name }}</span>
                    <ax-badge appearance="soft" [variant]="product.variant">{{ product.stock }}</ax-badge>
                  </div>
                  <p axText size="xs" tone="muted">{{ product.sku }}</p>
                  <span axText size="base" weight="semibold">{{ product.price }}</span>
                </div>
              </div>
            </ax-card>
          }
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface p-4 lg:col-span-7" axStack gap="4">
          <div class="flex items-center justify-between gap-2">
            <h3 axHeading size="sm" weight="semibold">Weekly sales</h3>
            <ax-badge appearance="soft" variant="info">Area</ax-badge>
          </div>
          <div class="w-full min-w-0">
            <ax-chart
              class="block w-full"
              type="area"
              [series]="salesSeries()"
              [labels]="salesLabels"
              [height]="240"
              ariaLabel="Weekly sales"
            />
          </div>
          <div class="demo-tabular" axStack gap="2">
            <div class="flex items-center justify-between">
              <span axText size="xs" tone="muted">Goal progress</span>
              <span axText size="xs" tone="muted">72%</span>
            </div>
            <ax-progress [value]="72" ariaLabel="Weekly sales goal" />
          </div>

          <div axStack gap="3">
            <div class="flex items-center justify-between gap-2">
              <h3 axHeading size="sm" weight="semibold">Order fulfillment</h3>
              <ax-badge>Stepper</ax-badge>
            </div>
            <ax-stepper #fulfillmentStepper [(currentStep)]="fulfillmentStep" [linear]="false">
              <ax-step label="Pack" icon="archive"><span></span></ax-step>
              <ax-step label="Ship" icon="upload"><span></span></ax-step>
              <ax-step label="Deliver" icon="check-circle"><span></span></ax-step>
            </ax-stepper>
            <p axText size="xs" tone="muted">
              Order #1042 — {{ fulfillmentLabels[fulfillmentStep()] }} stage selected.
            </p>
          </div>
        </div>

        <div class="lg:col-span-5" axStack gap="4">
          <div class="demo-surface p-4" axStack gap="3">
            <div class="flex items-center justify-between gap-2">
              <h3 axHeading size="sm" weight="semibold">Recent orders</h3>
              <ax-badge>Live mock</ax-badge>
            </div>
            <ax-table [columns]="columns" [data]="filteredOrders()" [pageSize]="4" />
          </div>

          <div class="demo-surface p-4" axStack gap="3">
            <div class="flex items-center justify-between gap-2">
              <h3 axHeading size="sm" weight="semibold">Returns</h3>
              <ax-badge appearance="soft" variant="warning">Timeline</ax-badge>
            </div>
            <ax-timeline [items]="returns" />
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardEcommerceComponent {
  readonly channel = signal<string | null>('all');
  readonly fulfillmentStep = signal(1);

  readonly channelOptions: SegmentedOption[] = [
    { label: 'All', value: 'all' },
    { label: 'DTC', value: 'dtc' },
    { label: 'Marketplace', value: 'marketplace' },
  ];

  readonly fulfillmentLabels = ['packing', 'in transit', 'delivered'] as const;

  readonly channelLabel = computed(() => {
    const map: Record<string, string> = {
      all: 'all channels',
      dtc: 'direct-to-consumer',
      marketplace: 'marketplace',
    };
    return map[this.channel() ?? 'all'] ?? 'all channels';
  });

  readonly stats = computed<StatItem[]>(() => {
    const mult = this.channel() === 'dtc' ? 0.62 : this.channel() === 'marketplace' ? 0.38 : 1;
    return [
      { label: 'Revenue', value: (128.4 * mult).toFixed(1) + 'k', prefix: '$', trend: 12 },
      { label: 'Orders', value: Math.round(1842 * mult), trend: 4 },
      { label: 'Customers', value: Math.round(963 * mult), trend: -2 },
      { label: 'Conversion', value: '3.2', suffix: '%', trend: 1 },
    ];
  });

  readonly salesLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  readonly salesSeries = computed<ChartSeries[]>(() => {
    const mult = this.channel() === 'dtc' ? 0.7 : this.channel() === 'marketplace' ? 0.55 : 1;
    return [{ name: 'Sales', data: [12, 18, 15, 22, 28, 25, 30].map((v) => Math.round(v * mult)), color: 1 }];
  });

  readonly products: ProductCard[] = [
    { name: 'Merino crew', sku: 'KNIT-001', price: '$68', stock: 'In stock', variant: 'success', channel: 'both' },
    { name: 'Canvas tote', sku: 'ACC-014', price: '$42', stock: 'Low', variant: 'warning', channel: 'dtc' },
    { name: 'Trail runner', sku: 'SHOE-088', price: '$129', stock: 'In stock', variant: 'success', channel: 'marketplace' },
    { name: 'Linen shirt', sku: 'APP-032', price: '$94', stock: 'In stock', variant: 'info', channel: 'both' },
  ];

  readonly filteredProducts = computed(() => {
    const ch = this.channel();
    if (ch === 'all') return this.products;
    return this.products.filter((p) => p.channel === ch || p.channel === 'both');
  });

  readonly columns: ColDef<OrderRow>[] = [
    { key: 'id', header: 'Order' },
    { key: 'customer', header: 'Customer' },
    { key: 'total', header: 'Total' },
    { key: 'status', header: 'Status' },
  ];

  readonly orders: OrderRow[] = [
    { id: '#1042', customer: 'Ada Lovelace', total: '$240', status: 'Paid', channel: 'dtc' },
    { id: '#1041', customer: 'Alan Turing', total: '$89', status: 'Shipped', channel: 'marketplace' },
    { id: '#1040', customer: 'Grace Hopper', total: '$420', status: 'Paid', channel: 'dtc' },
    { id: '#1039', customer: 'Katherine Johnson', total: '$156', status: 'Pending', channel: 'marketplace' },
    { id: '#1038', customer: 'Linus Torvalds', total: '$312', status: 'Paid', channel: 'dtc' },
  ];

  readonly filteredOrders = computed(() => {
    const ch = this.channel();
    if (ch === 'all') return this.orders;
    return this.orders.filter((o) => o.channel === ch);
  });

  readonly returns: TimelineItem[] = [
    {
      title: 'Return requested',
      time: 'Mon 09:14',
      description: 'Customer cited wrong size on order #1036.',
      icon: 'alert-circle',
      color: 'warning',
    },
    {
      title: 'Label issued',
      time: 'Mon 11:02',
      description: 'Prepaid return label emailed.',
      icon: 'file-text',
      color: 'default',
    },
    {
      title: 'Received at warehouse',
      time: 'Wed 16:40',
      description: 'QC passed — restock pending.',
      icon: 'check-circle',
      color: 'success',
    },
    {
      title: 'Refund processed',
      time: 'Thu 10:08',
      description: '$89 credited to original payment method.',
      icon: 'check',
      color: 'success',
    },
  ];
}
