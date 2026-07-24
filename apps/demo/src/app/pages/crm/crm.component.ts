import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AxButtonComponent } from '@axisui-ng/buttons';
import {
  AxAvatarComponent,
  AxAvatarGroupComponent,
  AxBadgeComponent,
  AxCardComponent,
  AxStatisticComponent,
  AxTabPanelComponent,
  AxTabTriggerComponent,
  AxTableComponent,
  AxTabsComponent,
  AxTabsListComponent,
  AxTimelineComponent,
  type ColDef,
  type TimelineItem,
} from '@axisui-ng/data';
import { AxAlertComponent, ToastService } from '@axisui-ng/feedback';
import { AxComboboxComponent, type ComboboxOption } from '@axisui-ng/forms';
import {
  AxBreadcrumbComponent,
  AxBreadcrumbItemComponent,
} from '@axisui-ng/navigation';
import {
  AxContextMenuTriggerDirective,
  AxDropdownMenuComponent,
  AxMenuCheckboxItemComponent,
  AxMenuItemComponent,
  AxMenuLabelComponent,
  AxMenuRadioGroupComponent,
  AxMenuRadioItemComponent,
  AxMenuSeparatorComponent,
  AxMenuTriggerDirective,
} from '@axisui-ng/overlays';
import {
  AxClusterDirective,
  AxHeadingDirective,
  AxStackDirective,
  AxTextDirective,
} from '@axisui-ng/primitives';
import { AxTreeComponent, type TreeNode } from '@axisui-ng/tree';

import { DemoLayoutService } from '../../layout/layout.service';

interface DealRow {
  name: string;
  stage: string;
  value: string;
  owner: string;
}

@Component({
  selector: 'demo-crm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxTreeComponent,
    AxComboboxComponent,
    AxTabsComponent,
    AxTabsListComponent,
    AxTabTriggerComponent,
    AxTabPanelComponent,
    AxAvatarComponent,
    AxAvatarGroupComponent,
    AxCardComponent,
    AxStatisticComponent,
    AxTableComponent,
    AxTimelineComponent,
    AxBadgeComponent,
    AxAlertComponent,
    AxButtonComponent,
    AxBreadcrumbComponent,
    AxBreadcrumbItemComponent,
    AxDropdownMenuComponent,
    AxMenuItemComponent,
    AxMenuCheckboxItemComponent,
    AxMenuLabelComponent,
    AxMenuRadioGroupComponent,
    AxMenuRadioItemComponent,
    AxMenuSeparatorComponent,
    AxMenuTriggerDirective,
    AxContextMenuTriggerDirective,
    AxStackDirective,
    AxClusterDirective,
    AxHeadingDirective,
    AxTextDirective,
  ],
  template: `
    <div axStack gap="6">
      <ax-breadcrumb>
        <ax-breadcrumb-item><span>Demo</span></ax-breadcrumb-item>
        <ax-breadcrumb-item [current]="true">CRM</ax-breadcrumb-item>
      </ax-breadcrumb>

      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div class="max-w-2xl">
          <h2 axHeading size="2xl" weight="semibold" tracking="tight">CRM</h2>
          <p axText size="sm" tone="muted" class="mt-1">
            Account tree + deals — apply violet for a CRM-flavored accent cascade.
          </p>
        </div>
        <div axCluster gap="2">
          <ax-button variant="outline" size="sm" [axMenuTriggerFor]="viewMenu">View</ax-button>
          <ax-dropdown-menu #viewMenu>
            <ax-menu-label>Display</ax-menu-label>
            <ax-menu-radio-group [(value)]="viewDensity">
              <ax-menu-radio-item value="comfortable">Comfortable</ax-menu-radio-item>
              <ax-menu-radio-item value="compact">Compact</ax-menu-radio-item>
              <ax-menu-radio-item value="spacious">Spacious</ax-menu-radio-item>
            </ax-menu-radio-group>
          </ax-dropdown-menu>
          <ax-button variant="outline" size="sm" (clickEvent)="applyViolet()">
            Apply violet preset
          </ax-button>
          <ax-button variant="primary" size="sm">New deal</ax-button>
        </div>
      </div>

      <ax-alert variant="info">
        Right-click a deal row for context actions. Tree selection drives the detail pane
        ({{ viewDensity() }} density).
      </ax-alert>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface p-4 lg:col-span-4" axStack gap="3">
          <div class="flex items-center justify-between gap-2">
            <h3 axHeading size="sm" weight="semibold">Accounts</h3>
            <ax-badge>Tree</ax-badge>
          </div>
          <ax-tree
            class="max-h-[22rem] overflow-auto"
            [nodes]="accounts"
            selection="single"
            [(selectedId)]="selectedAccountId"
            [(expandedIds)]="expandedIds"
            ariaLabel="Accounts"
          />
        </div>

        <div class="lg:col-span-8" axStack gap="4">
          <div class="grid gap-3 sm:grid-cols-3">
            <ax-card>
              <div axCardContent>
                <ax-statistic label="Pipeline" [value]="248000" prefix="$" [trend]="8" />
              </div>
            </ax-card>
            <ax-card>
              <div axCardContent>
                <ax-statistic label="Open deals" [value]="dealCount()" [trend]="3" />
              </div>
            </ax-card>
            <ax-card>
              <div axCardContent>
                <ax-statistic label="Win rate" [value]="34" suffix="%" [trend]="-2" />
              </div>
            </ax-card>
          </div>

          <div class="demo-surface p-4" axStack gap="4">
            <ax-tabs [(value)]="accountTab">
              <ax-tabs-list>
                <ax-tab-trigger value="overview">Overview</ax-tab-trigger>
                <ax-tab-trigger value="activity">Activity</ax-tab-trigger>
                <ax-tab-trigger value="notes">Notes</ax-tab-trigger>
              </ax-tabs-list>
              <ax-tab-panel value="overview">
                <div axStack gap="3" class="pt-2">
                  <p axText size="sm" tone="muted">
                    {{ selectedLabel() }} — enterprise segment, renewal Q3.
                  </p>
                  <div axCluster gap="4" class="items-center">
                    <span axText size="xs" tone="muted">Deal team</span>
                    <ax-avatar-group [max]="4" size="sm">
                      <ax-avatar initials="AD" size="sm" />
                      <ax-avatar initials="LN" size="sm" />
                      <ax-avatar initials="SM" size="sm" />
                      <ax-avatar initials="JD" size="sm" />
                      <ax-avatar initials="MK" size="sm" />
                    </ax-avatar-group>
                  </div>
                </div>
              </ax-tab-panel>
              <ax-tab-panel value="activity">
                <p axText size="sm" tone="muted" class="pt-2">
                  Recent touchpoints for {{ selectedLabel() }}.
                </p>
              </ax-tab-panel>
              <ax-tab-panel value="notes">
                <p axText size="sm" tone="muted" class="pt-2">
                  Internal notes and next steps for {{ selectedLabel() }}.
                </p>
              </ax-tab-panel>
            </ax-tabs>

            <div class="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
              <div axCluster gap="3" class="items-center">
                <div>
                  <h3 axHeading size="sm" weight="semibold">
                    Deals — {{ selectedLabel() }}
                  </h3>
                  <p axText size="xs" tone="muted">Filter by owner · right-click a row</p>
                </div>
                <ax-avatar-group [max]="3" size="sm">
                  <ax-avatar initials="AD" size="sm" />
                  <ax-avatar initials="LN" size="sm" />
                  <ax-avatar initials="SM" size="sm" />
                  <ax-avatar initials="JD" size="sm" />
                </ax-avatar-group>
              </div>
              <div class="w-48">
                <ax-combobox
                  [options]="ownerOptions"
                  [(value)]="ownerFilter"
                  placeholder="All owners"
                  ariaLabel="Filter by owner"
                />
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-12">
              <div
                class="lg:col-span-7 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                tabindex="0"
                [axContextMenuTriggerFor]="dealMenu"
              >
                <ax-table [columns]="columns" [data]="filteredDeals()" [pageSize]="5" />
              </div>
              <div class="demo-surface p-3 lg:col-span-5" axStack gap="2">
                <div class="flex items-center justify-between gap-2">
                  <h4 axHeading size="sm" weight="semibold">Deal activity</h4>
                  <ax-badge appearance="soft" variant="info">Timeline</ax-badge>
                </div>
                <ax-timeline [items]="dealActivity()" />
              </div>
            </div>

            <ax-dropdown-menu #dealMenu>
              <ax-menu-label>Deal actions</ax-menu-label>
              <ax-menu-item (click)="toastAction('Opened deal')">Open</ax-menu-item>
              <ax-menu-item (click)="toastAction('Assigned owner')">Assign owner</ax-menu-item>
              <ax-menu-separator />
              <ax-menu-checkbox-item [(checked)]="watchDeal">Watch deal</ax-menu-checkbox-item>
              <ax-menu-separator />
              <ax-menu-item (click)="toastAction('Archived deal')">Archive</ax-menu-item>
            </ax-dropdown-menu>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CrmPageComponent {
  private readonly layout = inject(DemoLayoutService);
  private readonly toast = inject(ToastService);

  readonly selectedAccountId = signal<string | number | null>('acme');
  readonly expandedIds = signal<Array<string | number>>(['enterprise', 'mid-market']);
  readonly ownerFilter = signal<string | string[] | null>(null);
  readonly accountTab = signal<string | null>('overview');
  readonly watchDeal = signal(true);
  readonly viewDensity = signal<string | null>('comfortable');

  readonly accounts: TreeNode[] = [
    {
      id: 'enterprise',
      label: 'Enterprise',
      icon: 'folder',
      children: [
        { id: 'acme', label: 'Acme Corp', icon: 'user' },
        { id: 'globex', label: 'Globex', icon: 'user' },
      ],
    },
    {
      id: 'mid-market',
      label: 'Mid-market',
      icon: 'folder',
      children: [
        { id: 'initech', label: 'Initech', icon: 'user' },
        { id: 'umbrella', label: 'Umbrella', icon: 'user' },
      ],
    },
    {
      id: 'smb',
      label: 'SMB',
      icon: 'folder',
      children: [{ id: 'stark', label: 'Stark Industries', icon: 'user' }],
    },
  ];

  readonly ownerOptions: ComboboxOption[] = [
    { value: 'Ada', label: 'Ada' },
    { value: 'Lin', label: 'Lin' },
    { value: 'Sam', label: 'Sam' },
    { value: 'Jordan', label: 'Jordan' },
  ];

  readonly columns: ColDef<DealRow>[] = [
    { key: 'name', header: 'Deal' },
    { key: 'stage', header: 'Stage' },
    { key: 'value', header: 'Value' },
    { key: 'owner', header: 'Owner' },
  ];

  private readonly allDeals: Record<string, DealRow[]> = {
    acme: [
      { name: 'Platform renewal', stage: 'Negotiation', value: '$48k', owner: 'Ada' },
      { name: 'Add-on seats', stage: 'Proposal', value: '$12k', owner: 'Lin' },
    ],
    globex: [
      { name: 'Analytics suite', stage: 'Qualified', value: '$62k', owner: 'Sam' },
      { name: 'Support uplift', stage: 'Trial', value: '$9k', owner: 'Jordan' },
    ],
    initech: [{ name: 'Migration', stage: 'Proposal', value: '$28k', owner: 'Ada' }],
    umbrella: [{ name: 'Security pack', stage: 'Qualified', value: '$19k', owner: 'Lin' }],
    stark: [{ name: 'Starter plan', stage: 'Trial', value: '$4k', owner: 'Sam' }],
  };

  private readonly activityByAccount: Record<string, TimelineItem[]> = {
    acme: [
      {
        title: 'Discovery call',
        time: 'Mon 10:00',
        description: 'Reviewed renewal scope with Ada.',
        icon: 'user',
        color: 'primary',
      },
      {
        title: 'Proposal sent',
        time: 'Wed 14:30',
        description: 'Platform renewal deck shared.',
        icon: 'file-text',
        color: 'default',
      },
      {
        title: 'Legal review',
        time: 'Fri 09:15',
        description: 'MSA redlines returned.',
        icon: 'clock',
        color: 'warning',
      },
    ],
    globex: [
      {
        title: 'Demo scheduled',
        time: 'Tue 11:00',
        description: 'Analytics suite walkthrough.',
        icon: 'signal',
        color: 'primary',
      },
      {
        title: 'Trial started',
        time: 'Thu 08:00',
        description: '14-day sandbox provisioned.',
        icon: 'check-circle',
        color: 'success',
      },
    ],
    initech: [
      {
        title: 'Migration scoping',
        time: 'Mon 15:00',
        description: 'Data volume estimate received.',
        icon: 'folder',
        color: 'default',
      },
    ],
    umbrella: [
      {
        title: 'Security questionnaire',
        time: 'Wed 13:00',
        description: 'SOC 2 attestation requested.',
        icon: 'lock',
        color: 'warning',
      },
    ],
    stark: [
      {
        title: 'Trial check-in',
        time: 'Fri 16:00',
        description: 'Usage below threshold — nurture.',
        icon: 'alert-circle',
        color: 'warning',
      },
    ],
  };

  readonly selectedLabel = computed(() => {
    const id = this.selectedAccountId();
    if (id == null) return 'Select an account';
    const find = (nodes: TreeNode[]): string | null => {
      for (const n of nodes) {
        if (n.id === id) return n.label ?? String(id);
        if (n.children) {
          const hit = find(n.children);
          if (hit) return hit;
        }
      }
      return null;
    };
    return find(this.accounts) ?? String(id);
  });

  readonly filteredDeals = computed(() => {
    const id = String(this.selectedAccountId() ?? '');
    const rows = this.allDeals[id] ?? [];
    const owner = this.ownerFilter();
    const filter = typeof owner === 'string' ? owner : null;
    if (!filter) return rows;
    return rows.filter((r) => r.owner === filter);
  });

  readonly dealCount = computed(() => this.filteredDeals().length);

  readonly dealActivity = computed(() => {
    const id = String(this.selectedAccountId() ?? '');
    return this.activityByAccount[id] ?? [
      {
        title: 'No activity',
        time: '—',
        description: 'Select an account with deals.',
        icon: 'help-circle',
        color: 'default' as const,
      },
    ];
  });

  applyViolet(): void {
    this.layout.setPreset('violet');
  }

  toastAction(title: string): void {
    this.toast.show({
      title,
      description: this.selectedLabel(),
      variant: 'default',
    });
  }
}
