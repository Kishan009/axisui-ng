import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AxStatRowComponent, type StatItem } from '@axisui-ng/blocks';
import { AxButtonComponent } from '@axisui-ng/buttons';
import {
  AxBadgeComponent,
  AxCollapsibleComponent,
  AxCollapsibleTriggerDirective,
  AxTableComponent,
  AxTimelineComponent,
  type ColDef,
  type TimelineItem,
} from '@axisui-ng/data';
import { AxAlertComponent } from '@axisui-ng/feedback';
import {
  AxFormFieldComponent,
  AxUploadComponent,
  AxCalendarComponent,
  type UploadFn,
  type CalendarValue,
} from '@axisui-ng/forms';
import { AxStepperComponent, AxStepComponent } from '@axisui-ng/flow';
import { AxIconComponent } from '@axisui-ng/icons';
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

import { DemoLayoutService } from '../../layout/layout.service';

interface CaseRow {
  id: string;
  citizen: string;
  type: string;
  status: string;
}

@Component({
  selector: 'demo-dashboard-government',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxStatRowComponent,
    AxTimelineComponent,
    AxTableComponent,
    AxBadgeComponent,
    AxAlertComponent,
    AxButtonComponent,
    AxCollapsibleComponent,
    AxCollapsibleTriggerDirective,
    AxFormFieldComponent,
    AxUploadComponent,
    AxStepperComponent,
    AxStepComponent,
    AxIconComponent,
    AxCalendarComponent,
    AxBreadcrumbComponent,
    AxBreadcrumbItemComponent,
    AxHeadingDirective,
    AxTextDirective,
    AxStackDirective,
    AxClusterDirective,
  ],
  template: `
    <div axStack gap="6">
      <ax-breadcrumb>
        <ax-breadcrumb-item><span>Demo</span></ax-breadcrumb-item>
        <ax-breadcrumb-item [current]="true">Government</ax-breadcrumb-item>
      </ax-breadcrumb>

      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div class="max-w-2xl">
          <h2 axHeading size="2xl">Government</h2>
          <p axText size="sm" tone="muted" class="mt-1 leading-relaxed">
            Permits &amp; case queue — apply the government preset for authoritative tokens.
          </p>
        </div>
        <div axCluster gap="2">
          <ax-button variant="outline" size="sm" (clickEvent)="applyPreset()">
            Apply government preset
          </ax-button>
          <ax-button variant="primary" size="sm">New case</ax-button>
        </div>
      </div>

      <ax-alert variant="info">
        Mock civic services data. Timeline markers use semantic color tokens.
      </ax-alert>

      <div class="demo-surface demo-tabular p-4">
        <ax-stat-row ariaLabel="Agency metrics" [stats]="stats" [columns]="4" />
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface p-4 lg:col-span-5" axStack gap="3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Audit trail</h3>
            <ax-badge>Timeline</ax-badge>
          </div>
          <ax-timeline [items]="audit" />
        </div>

        <div class="demo-surface p-4 lg:col-span-7">
          <div class="mb-3 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Open cases</h3>
            <ax-badge appearance="soft" variant="info">Queue</ax-badge>
          </div>
          <ax-table [columns]="columns" [data]="cases" [pageSize]="6" />
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface p-4 lg:col-span-7" axStack gap="4">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Permit review</h3>
            <ax-badge appearance="soft" variant="info">Stepper</ax-badge>
          </div>
          <ax-stepper [(currentStep)]="permitStep">
            <ax-step label="Submit" description="Application" icon="file-text">
              <p axText size="sm" tone="muted" class="mt-3">
                Applicant uploads plans and supporting documents for zoning review.
              </p>
              <ax-button class="mt-3" size="sm" variant="primary" (clickEvent)="permitStep.set(1)">
                Continue
              </ax-button>
            </ax-step>
            <ax-step label="Review" description="Staff check" icon="search">
              <p axText size="sm" tone="muted" class="mt-3">
                Planner verifies setbacks, occupancy, and fee payment before routing to committee.
              </p>
              <div axCluster gap="2" class="mt-3">
                <ax-button size="sm" variant="outline" (clickEvent)="permitStep.set(0)">Back</ax-button>
                <ax-button size="sm" variant="primary" (clickEvent)="permitStep.set(2)">
                  Continue
                </ax-button>
              </div>
            </ax-step>
            <ax-step label="Decision" description="Outcome" icon="check-circle">
              <p axText size="sm" tone="muted" class="mt-3">
                Approved permits are published; denials include appeal instructions and deadlines.
              </p>
              <div axCluster gap="2" class="mt-3">
                <ax-button size="sm" variant="outline" (clickEvent)="permitStep.set(1)">Back</ax-button>
                <ax-button size="sm" variant="primary" (clickEvent)="permitStep.set(0)">
                  Reset flow
                </ax-button>
              </div>
            </ax-step>
          </ax-stepper>
        </div>

        <div class="demo-surface p-4 lg:col-span-5" axStack gap="3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold tracking-tight">Hearings calendar</h3>
            <ax-badge appearance="soft" variant="warning">Embedded</ax-badge>
          </div>
          <ax-calendar [(value)]="hearingDate" />
          <p axText size="xs" tone="muted">
            Select a date to view scheduled public hearings and board sessions.
          </p>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-12">
        <div class="demo-surface p-4 lg:col-span-7">
          <ax-form-field
            label="Case documents"
            forId="case-docs"
            helper="PDF or image files up to 10 MB each."
          >
            <ax-upload
              id="case-docs"
              accept=".pdf,image/*"
              [multiple]="true"
              [maxSize]="10_000_000"
              [uploadFn]="mockUpload"
              ariaLabel="Case document upload"
            />
          </ax-form-field>
        </div>

        <div class="demo-surface p-4 lg:col-span-5">
          <ax-collapsible [(open)]="policyOpen">
            <button
              type="button"
              axCollapsibleTrigger
              class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-2 text-start outline-none transition-[background-color] duration-[var(--duration-fast)] ease-out-quart hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span axText size="sm" class="inline-flex items-center gap-2 font-semibold tracking-tight">
                <ax-icon name="info" [size]="16" class="text-primary" />
                Policy notice &amp; FAQ
              </span>
              <ax-icon [name]="policyOpen() ? 'chevron-up' : 'chevron-down'" [size]="16" />
            </button>
            <div class="px-1 pt-2" axStack gap="2">
              <p axText size="sm" tone="muted">
                All submitted records are retained per municipal code §12-4. Redact PII before upload.
              </p>
              <p axText size="xs" tone="muted">
                FAQ: Appeals must be filed within 30 calendar days of the decision letter.
              </p>
            </div>
          </ax-collapsible>
        </div>
      </div>
    </div>
  `,
})
export class DashboardGovernmentComponent {
  private readonly layout = inject(DemoLayoutService);

  readonly permitStep = signal(0);
  readonly policyOpen = signal(false);
  readonly hearingDate = signal<CalendarValue>(null);

  readonly stats: StatItem[] = [
    { label: 'Open cases', value: 248, trend: -4 },
    { label: 'Avg resolve', value: 6.2, suffix: 'd', trend: -8 },
    { label: 'SLA met', value: '91', suffix: '%', trend: 2 },
    { label: 'Appeals', value: 12, trend: 1 },
  ];

  readonly audit: TimelineItem[] = [
    {
      title: 'Permit approved',
      time: '08:40',
      description: 'BLD-2041 residential addition — Zone B.',
      icon: 'check-circle',
      color: 'success',
    },
    {
      title: 'Document requested',
      time: '10:15',
      description: 'Proof of residency for CASE-882.',
      icon: 'file-text',
      color: 'primary',
    },
    {
      title: 'Escalation',
      time: '13:02',
      description: 'SLA breach risk on LIC-440.',
      icon: 'alert-triangle',
      color: 'warning',
    },
    {
      title: 'Access locked',
      time: '15:20',
      description: 'Privileged action logged for auditor.',
      icon: 'lock',
      color: 'default',
    },
  ];

  readonly columns: ColDef<CaseRow>[] = [
    { key: 'id', header: 'Case' },
    { key: 'citizen', header: 'Citizen' },
    { key: 'type', header: 'Type' },
    { key: 'status', header: 'Status' },
  ];

  readonly cases: CaseRow[] = [
    { id: 'CASE-901', citizen: 'Rivera, A.', type: 'Permit', status: 'In review' },
    { id: 'CASE-898', citizen: 'Chen, M.', type: 'License', status: 'Awaiting docs' },
    { id: 'CASE-890', citizen: 'Okoye, S.', type: 'Appeal', status: 'Hearing set' },
    { id: 'CASE-884', citizen: 'Nguyen, T.', type: 'Permit', status: 'Approved' },
    { id: 'CASE-879', citizen: 'Patel, R.', type: 'Complaint', status: 'Assigned' },
    { id: 'CASE-871', citizen: 'García, L.', type: 'License', status: 'In review' },
  ];

  readonly mockUpload: UploadFn = (_file, onProgress, signal) =>
    new Promise((resolve, reject) => {
      let p = 0;
      const id = setInterval(() => {
        if (signal.aborted) {
          clearInterval(id);
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        p = Math.min(100, p + 25);
        onProgress(p);
        if (p >= 100) {
          clearInterval(id);
          resolve();
        }
      }, 100);
    });

  applyPreset(): void {
    this.layout.setPreset('government');
  }
}
