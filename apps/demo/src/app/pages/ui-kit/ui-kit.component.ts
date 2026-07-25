import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AxButtonComponent,
  AxButtonGroupComponent,
  AxButtonLeadingDirective,
  AxButtonTrailingDirective,
  AxIconButtonComponent,
  AxSegmentedComponent,
  AxToggleComponent,
  AxToggleGroupComponent,
  type ButtonSize,
  type ButtonVariant,
  type SegmentedOption,
} from '@axisui-ng/buttons';
import {
  AxAccordionComponent,
  AxAccordionItemComponent,
  AxAvatarComponent,
  AxBadgeComponent,
  AxCardComponent,
  AxCarouselComponent,
  AxCarouselSlideComponent,
  AxCollapsibleComponent,
  AxCollapsibleTriggerDirective,
  AxStatisticComponent,
  AxTabsComponent,
  AxTabsListComponent,
  AxTabTriggerComponent,
  AxTabPanelComponent,
  AxTimelineComponent,
  AxRouterTabsDirective,
  type TimelineItem,
} from '@axisui-ng/data';
import {
  AxAlertComponent,
  AxEmptyComponent,
  AxProgressComponent,
  AxResultComponent,
  AxSkeletonComponent,
  AxSpinnerComponent,
  ToastService,
} from '@axisui-ng/feedback';
import { AxStepperComponent, AxStepComponent } from '@axisui-ng/flow';
import {
  AxCheckboxComponent,
  AxChipComponent,
  AxColorPickerComponent,
  AxComboboxComponent,
  AxSwatchDirective,
  AxFormFieldComponent,
  AxInputComponent,
  AxInputMaskComponent,
  AxInputNumberComponent,
  AxInputOtpComponent,
  AxRadioComponent,
  AxRadioGroupComponent,
  AxRatingComponent,
  AxSelectComponent,
  AxSignaturePadComponent,
  AxSliderComponent,
  AxSwitchComponent,
  AxTagInputComponent,
  AxTextareaComponent,
  AxTreeSelectComponent,
  AxUploadComponent,
  AxCalendarComponent,
  AxDatePickerComponent,
  AxTimePickerComponent,
  type ComboboxOption,
  type InputSize,
  type AxSelectOption,
  type UploadFn,
  type CalendarValue,
  type TimeValue,
} from '@axisui-ng/forms';
import { AxIconComponent } from '@axisui-ng/icons';
import { AxKbdComponent, AxSeparatorComponent } from '@axisui-ng/misc';
import {
  AxBreadcrumbComponent,
  AxBreadcrumbItemComponent,
  AxMenubarComponent,
  AxMenubarMenuComponent,
  AxNavigationMenuComponent,
  AxNavigationMenuContentComponent,
  AxNavigationMenuItemComponent,
  AxPaginationComponent,
  AxRouterPaginationDirective,
} from '@axisui-ng/navigation';
import {
  AxDialogComponent,
  AxDialogDescriptionDirective,
  AxDialogService,
  AxDialogTitleDirective,
  AxDropdownMenuComponent,
  AxHoverCardComponent,
  AxHoverCardTriggerDirective,
  AxMenuCheckboxItemComponent,
  AxMenuItemComponent,
  AxMenuLabelComponent,
  AxMenuRadioGroupComponent,
  AxMenuRadioItemComponent,
  AxMenuSeparatorComponent,
  AxMenuTriggerDirective,
  AxOverlayCloseDirective,
  AxPopoverComponent,
  AxPopoverTriggerDirective,
  AxSheetComponent,
  AxTooltipDirective,
} from '@axisui-ng/overlays';
import {
  AxAspectRatioDirective,
  AxBoxDirective,
  AxClusterDirective,
  AxGridDirective,
  AxHeadingDirective,
  AxStackDirective,
  AxTextDirective,
} from '@axisui-ng/primitives';
import type { TreeNode } from '@axisui-ng/tree';

import { DemoConfirmDialogComponent } from './confirm-dialog.component';

@Component({
  selector: 'demo-ui-kit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AxButtonComponent,
    AxButtonLeadingDirective,
    AxButtonTrailingDirective,
    AxInputComponent,
    AxSelectComponent,
    AxSwitchComponent,
    AxCheckboxComponent,
    AxSliderComponent,
    AxKbdComponent,
    AxSeparatorComponent,
    AxBadgeComponent,
    AxAlertComponent,
    AxEmptyComponent,
    AxResultComponent,
    AxSpinnerComponent,
    AxProgressComponent,
    AxSkeletonComponent,
    AxRatingComponent,
    AxTabsComponent,
    AxTabsListComponent,
    AxTabTriggerComponent,
    AxTabPanelComponent,
    AxRouterTabsDirective,
    AxAccordionComponent,
    AxAccordionItemComponent,
    AxAvatarComponent,
    AxBreadcrumbComponent,
    AxBreadcrumbItemComponent,
    AxPaginationComponent,
    AxRouterPaginationDirective,
    AxDialogComponent,
    AxDialogTitleDirective,
    AxDialogDescriptionDirective,
    AxOverlayCloseDirective,
    AxTooltipDirective,
    AxPopoverComponent,
    AxPopoverTriggerDirective,
    AxDropdownMenuComponent,
    AxMenuTriggerDirective,
    AxMenuItemComponent,
    AxMenuCheckboxItemComponent,
    AxMenuLabelComponent,
    AxMenuRadioGroupComponent,
    AxMenuRadioItemComponent,
    AxMenuSeparatorComponent,
    AxHoverCardComponent,
    AxHoverCardTriggerDirective,
    AxSheetComponent,
    AxTextareaComponent,
    AxTagInputComponent,
    AxChipComponent,
    AxUploadComponent,
    AxStepperComponent,
    AxStepComponent,
    AxTimelineComponent,
    AxCarouselComponent,
    AxCarouselSlideComponent,
    AxIconComponent,
    AxComboboxComponent,
    AxInputOtpComponent,
    AxColorPickerComponent,
    AxSwatchDirective,
    AxToggleGroupComponent,
    AxToggleComponent,
    AxSegmentedComponent,
    AxCardComponent,
    AxStatisticComponent,
    AxCollapsibleComponent,
    AxCollapsibleTriggerDirective,
    AxMenubarComponent,
    AxMenubarMenuComponent,
    AxNavigationMenuComponent,
    AxNavigationMenuItemComponent,
    AxNavigationMenuContentComponent,
    AxIconButtonComponent,
    AxButtonGroupComponent,
    AxRadioGroupComponent,
    AxRadioComponent,
    AxInputNumberComponent,
    AxSignaturePadComponent,
    AxFormFieldComponent,
    AxInputMaskComponent,
    AxTreeSelectComponent,
    AxTimePickerComponent,
    AxCalendarComponent,
    AxDatePickerComponent,
    AxBoxDirective,
    AxStackDirective,
    AxClusterDirective,
    AxGridDirective,
    AxAspectRatioDirective,
    AxTextDirective,
    AxHeadingDirective,
  ],
  template: `
    <div axStack gap="8">
      <div class="border-b border-border pb-5">
        <h2 class="text-2xl font-semibold tracking-tight text-foreground">UI Kit</h2>
        <p class="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Section controls change component inputs only. Use Theme for tokens (preset / dark / density).
        </p>
      </div>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Navigation</h3>
        <ax-breadcrumb>
          <ax-breadcrumb-item><a routerLink="/" class="text-primary hover:underline">Home</a></ax-breadcrumb-item>
          <ax-breadcrumb-item><span>UI Kit</span></ax-breadcrumb-item>
          <ax-breadcrumb-item [current]="true">Categories</ax-breadcrumb-item>
        </ax-breadcrumb>
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-medium">Buttons</h3>
          <div axCluster gap="2" class="flex-wrap">
            @for (s of sizes; track s) {
              <ax-button
                size="sm"
                [variant]="btnSize() === s ? 'primary' : 'outline'"
                (clickEvent)="btnSize.set(s)"
              >
                {{ s }}
              </ax-button>
            }
            @for (v of variants; track v) {
              <ax-button
                size="sm"
                [variant]="btnVariant() === v ? 'primary' : 'outline'"
                (clickEvent)="btnVariant.set(v)"
              >
                {{ v }}
              </ax-button>
            }
          </div>
        </div>
        <div axCluster gap="2" class="flex-wrap">
          <ax-button [size]="btnSize()" [variant]="btnVariant()">Action</ax-button>
          <ax-button [size]="btnSize()" [variant]="btnVariant()" [disabled]="true">Disabled</ax-button>
          <ax-button [size]="btnSize()" [variant]="btnVariant()" [loading]="true">Loading</ax-button>
          <ax-button [size]="btnSize()" variant="outline">
            <ax-icon axButtonLeading name="plus" [size]="16" />
            Leading
          </ax-button>
          <ax-button [size]="btnSize()" variant="outline">
            Trailing
            <ax-icon axButtonTrailing name="chevron-down" [size]="16" />
          </ax-button>
        </div>
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-medium">Input</h3>
          <div axCluster gap="2">
            @for (s of inputSizes; track s) {
              <ax-button
                size="sm"
                [variant]="inputSize() === s ? 'primary' : 'outline'"
                (clickEvent)="inputSize.set(s)"
              >
                {{ s }}
              </ax-button>
            }
          </div>
        </div>
        <label class="text-sm font-medium" for="kit-email">Email</label>
        <ax-input
          id="kit-email"
          placeholder="you@example.com"
          [size]="inputSize()"
          [(value)]="email"
        />
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-medium">Select</h3>
          <div axCluster gap="2">
            @for (s of inputSizes; track s) {
              <ax-button
                size="sm"
                [variant]="selectSize() === s ? 'primary' : 'outline'"
                (clickEvent)="selectSize.set(s)"
              >
                {{ s }}
              </ax-button>
            }
          </div>
        </div>
        <label class="text-sm font-medium" for="kit-region">Region</label>
        <ax-select
          id="kit-region"
          placeholder="Choose a region"
          [options]="regionOptions"
          [size]="selectSize()"
          [(value)]="region"
          ariaLabel="Region"
        />
        @if (region(); as r) {
          <p class="text-xs text-muted-foreground">Selected: {{ r }}</p>
        }
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <h3 class="text-sm font-medium">Switch, checkbox &amp; slider</h3>
        <div axCluster gap="4" class="flex-wrap items-center">
          <ax-switch ariaLabel="Notifications" [(checked)]="notifyOn" />
          <span class="text-sm text-muted-foreground">
            Notifications {{ notifyOn() ? 'on' : 'off' }}
          </span>
          <ax-checkbox [(checked)]="termsAccepted" ariaLabel="Accept terms" />
          <span class="text-sm text-muted-foreground">Accept terms</span>
        </div>
        <div axStack gap="2">
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>Volume</span>
            <span>{{ volume() }}</span>
          </div>
          <ax-slider [(value)]="volume" [min]="0" [max]="100" ariaLabel="Volume" />
        </div>
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <h3 class="text-sm font-medium">Data — avatars &amp; accordion</h3>
        <div axCluster gap="2" class="items-center">
          <ax-avatar initials="AL" alt="Ada" />
          <ax-avatar initials="AT" alt="Alan" />
          <ax-avatar initials="GH" alt="Grace" size="lg" />
        </div>
        <ax-accordion type="single" [collapsible]="true">
          <ax-accordion-item value="tokens">
            <span axAccordionTrigger>Why tokens first?</span>
            <div axAccordionContent class="text-muted-foreground">
              Presets and dark mode cascade through CSS variables — no per-component recolors.
            </div>
          </ax-accordion-item>
          <ax-accordion-item value="density">
            <span axAccordionTrigger>Density</span>
            <div axAccordionContent class="text-muted-foreground">
              Compact vs comfortable is a document attribute, not a size input on every control.
            </div>
          </ax-accordion-item>
        </ax-accordion>
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <h3 class="text-sm font-medium">Feedback</h3>
        <ax-alert variant="success">Saved — still using the active preset tokens.</ax-alert>
        <div axCluster gap="2" class="items-center">
          <ax-badge>Default</ax-badge>
          <ax-badge appearance="soft">Soft</ax-badge>
          <ax-spinner />
        </div>
        <div axStack gap="2">
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>Upload</span>
            <span>{{ uploadProgress() }}%</span>
          </div>
          <ax-progress [value]="uploadProgress()" ariaLabel="Upload progress" />
        </div>
        <div axStack gap="2">
          <p class="text-xs text-muted-foreground">Skeleton placeholders</p>
          <ax-skeleton variant="text" width="60%" />
          <ax-skeleton variant="text" width="40%" />
          <ax-skeleton width="100%" height="72px" />
        </div>
        <div axCluster gap="2">
          <ax-button variant="outline" size="sm" (clickEvent)="showToast('default')">Toast</ax-button>
          <ax-button variant="outline" size="sm" (clickEvent)="showToast('success')">Success toast</ax-button>
          <ax-button variant="outline" size="sm" (clickEvent)="showToast('destructive')">Error toast</ax-button>
        </div>
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <h3 class="text-sm font-medium">Empty &amp; result</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <ax-empty
            icon="search"
            title="No results"
            description="Try another filter — empty states stay token-aware."
          >
            <ax-button size="sm" variant="outline">Clear filters</ax-button>
          </ax-empty>
          <ax-result
            status="success"
            title="Payment received"
            description="Result blocks work for success and error pages alike."
          >
            <ax-button size="sm" variant="primary">Continue</ax-button>
          </ax-result>
        </div>
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <h3 class="text-sm font-medium">Rating</h3>
        <ax-rating [(value)]="rating" ariaLabel="Product rating" />
        <p class="text-xs text-muted-foreground">Value: {{ rating() }} / 5</p>
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <h3 class="text-sm font-medium">Tabs</h3>
        <ax-tabs [(value)]="tab">
          <ax-tabs-list>
            <ax-tab-trigger value="overview">Overview</ax-tab-trigger>
            <ax-tab-trigger value="billing">Billing</ax-tab-trigger>
            <ax-tab-trigger value="team">Team</ax-tab-trigger>
          </ax-tabs-list>
          <ax-tab-panel value="overview">
            <p class="mt-3 text-sm text-muted-foreground">
              Overview content inherits the active industry preset.
            </p>
          </ax-tab-panel>
          <ax-tab-panel value="billing">
            <p class="mt-3 text-sm text-muted-foreground">Billing panel — switch Theme to restyle chrome.</p>
          </ax-tab-panel>
          <ax-tab-panel value="team">
            <p class="mt-3 text-sm text-muted-foreground">Team panel — density changes control spacing.</p>
          </ax-tab-panel>
        </ax-tabs>
        <ax-separator />
        <p axText size="xs" tone="muted">
          Router sync — bind the active tab to a query param with
          <span axText size="xs" mono>axRouterTabs</span>.
        </p>
        <ax-tabs axRouterTabs="kitTab" [(value)]="routerTab">
          <ax-tabs-list>
            <ax-tab-trigger value="design">Design</ax-tab-trigger>
            <ax-tab-trigger value="api">API</ax-tab-trigger>
            <ax-tab-trigger value="a11y">A11y</ax-tab-trigger>
          </ax-tabs-list>
          <ax-tab-panel value="design">
            <p class="mt-3 text-sm text-muted-foreground">Design notes stay in sync with ?kitTab=design.</p>
          </ax-tab-panel>
          <ax-tab-panel value="api">
            <p class="mt-3 text-sm text-muted-foreground">API notes stay in sync with ?kitTab=api.</p>
          </ax-tab-panel>
          <ax-tab-panel value="a11y">
            <p class="mt-3 text-sm text-muted-foreground">A11y checklist stays in sync with ?kitTab=a11y.</p>
          </ax-tab-panel>
        </ax-tabs>
        <p axText size="xs" tone="muted">Query param kitTab: {{ routerTab() }}</p>
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <h3 class="text-sm font-medium">Overlays — dialog &amp; tooltip</h3>
        <div axCluster gap="2" class="flex-wrap items-center">
          <ax-button variant="outline" (clickEvent)="dialogOpen.set(true)">Open dialog</ax-button>
          <ax-button variant="outline" (clickEvent)="openProgrammaticDialog()">
            Open via AxDialogService
          </ax-button>
          <button
            type="button"
            class="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm font-medium text-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
            [axTooltip]="'Saves with the active preset tokens'"
            axTooltipPlacement="top"
            [showDelay]="0"
          >
            Hover for tooltip
          </button>
          <ax-button variant="outline" [axPopoverTriggerFor]="kitPopover">Open popover</ax-button>
          <ax-popover #kitPopover placement="bottom-start">
            <p class="text-sm font-medium">Popover</p>
            <p class="mt-1 text-sm text-muted-foreground">
              Light-dismiss panel — same tokens as dialogs and the theme sheet.
            </p>
          </ax-popover>
        </div>
        @if (dialogResult()) {
          <p axText size="xs" tone="muted">
            Last service result: <span axText size="xs" mono>{{ dialogResult() }}</span>
          </p>
        }
        <ax-dialog [(open)]="dialogOpen">
          <h2 axDialogTitle class="text-lg font-semibold">Confirm transfer</h2>
          <p axDialogDescription class="text-sm text-muted-foreground">
            Dialog chrome uses the same tokens as the rest of the shell.
          </p>
          <p class="text-sm">Mock confirmation body for the UI Kit.</p>
          <div axDialogFooter>
            <ax-button variant="ghost" size="sm" axOverlayClose>Cancel</ax-button>
            <ax-button variant="primary" size="sm" axOverlayClose>Confirm</ax-button>
          </div>
        </ax-dialog>
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <h3 class="text-sm font-medium">Date picker</h3>
        <label class="text-sm font-medium" for="kit-date">Appointment date</label>
        <ax-date-picker
          id="kit-date"
          [(value)]="appointmentDate"
          placeholder="Pick a date"
          ariaLabel="Appointment date"
        />
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <h3 class="text-sm font-medium">Navigation — pagination</h3>
        <ax-pagination [(page)]="page" [total]="120" [pageSize]="10" />
        <p class="text-xs text-muted-foreground">Page {{ page() }} of 12</p>
        <ax-separator />
        <p axText size="xs" tone="muted">
          Router sync — bind page to a query param with
          <span axText size="xs" mono>axRouterPagination</span>.
        </p>
        <ax-pagination axRouterPagination="kitPage" [(page)]="routerPage" [total]="48" [pageSize]="8" />
        <p axText size="xs" tone="muted">Query param kitPage: {{ routerPage() }}</p>
      </section>

      <section axBox p="4" rounded="lg" border axStack gap="3">
        <h3 class="text-sm font-medium">Misc — separator &amp; kbd</h3>
        <p class="text-sm text-muted-foreground">
          Section above
        </p>
        <ax-separator />
        <p class="text-sm text-muted-foreground">
          Section below — shortcuts use platform-aware keycaps.
        </p>
        <div axCluster gap="3" class="flex-wrap items-center">
          <span class="text-sm text-foreground">Command palette</span>
          <ax-kbd keys="mod+k" ariaLabel="Modifier plus K" />
          <span class="inline-flex h-5 items-stretch self-center">
            <ax-separator orientation="vertical" />
          </span>
          <span class="text-sm text-foreground">Escape</span>
          <ax-kbd>Esc</ax-kbd>
        </div>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Forms — textarea, tags &amp; upload</h3>
        <div axStack gap="2">
          <label class="text-sm font-medium" for="kit-bio">Bio</label>
          <ax-textarea
            id="kit-bio"
            [(value)]="bio"
            placeholder="Short product bio…"
            [rows]="3"
            ariaLabel="Bio"
          />
        </div>
        <div axStack gap="2">
          <span class="text-sm font-medium">Skills</span>
          <ax-tag-input [(value)]="skills" placeholder="Add a skill…" [max]="8" ariaLabel="Skills" />
          <div axCluster gap="2" class="flex-wrap">
            <ax-chip>Angular</ax-chip>
            <ax-chip removable (remove)="noop()">Standalone</ax-chip>
          </div>
        </div>
        <div axStack gap="2">
          <span class="text-sm font-medium">Avatar upload</span>
          <ax-upload
            accept="image/*"
            [multiple]="false"
            [maxSize]="2_000_000"
            [uploadFn]="mockUpload"
            ariaLabel="Avatar upload"
          />
        </div>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Overlays — menu, hover card &amp; sheet</h3>
        <div axCluster gap="3" class="flex-wrap items-center">
          <ax-button variant="outline" size="sm" [axMenuTriggerFor]="rowMenu">
            <ax-icon name="more-horizontal" [size]="16" />
            Row actions
          </ax-button>
          <ax-dropdown-menu #rowMenu>
            <ax-menu-item (click)="showToast('default')">Edit</ax-menu-item>
            <ax-menu-item (click)="showToast('success')">Duplicate</ax-menu-item>
            <ax-menu-separator />
            <ax-menu-item (click)="showToast('destructive')">Delete</ax-menu-item>
          </ax-dropdown-menu>

          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-[background-color] duration-[var(--duration-fast)] ease-out-quart hover:bg-muted"
            [axHoverCardFor]="userCard"
          >
            <ax-avatar initials="AL" size="sm" alt="Ada Lovelace" />
            Ada Lovelace
          </button>
          <ax-hover-card #userCard>
            <div axStack gap="2">
              <div class="flex items-center gap-2">
                <ax-avatar initials="AL" alt="Ada Lovelace" />
                <div>
                  <p class="text-sm font-semibold">Ada Lovelace</p>
                  <p class="text-xs text-muted-foreground">Product · London</p>
                </div>
              </div>
              <p class="text-xs text-muted-foreground">
                Hover cards use popover tokens — switch Theme to restyle.
              </p>
            </div>
          </ax-hover-card>

          <ax-button variant="outline" size="sm" (clickEvent)="filterOpen.set(true)">
            <ax-icon name="filter" [size]="16" />
            Filters
          </ax-button>
        </div>
        <ax-sheet [(open)]="filterOpen" side="end">
          <div class="w-[min(100vw,20rem)] p-4" axStack gap="4">
            <h4 axDialogTitle class="text-base font-semibold">Filters</h4>
            <p axDialogDescription class="text-sm text-muted-foreground">
              Demo sheet separate from the theme configurator.
            </p>
            <div axCluster gap="3" class="items-center">
              <ax-switch ariaLabel="Active only" [(checked)]="filterActiveOnly" />
              <span class="text-sm text-muted-foreground">Active leads only</span>
            </div>
            <ax-button variant="primary" size="sm" axOverlayClose>Apply</ax-button>
          </div>
        </ax-sheet>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Overlays — checkbox &amp; radio menu</h3>
        <div axCluster gap="3" class="flex-wrap items-center">
          <ax-button variant="outline" size="sm" [axMenuTriggerFor]="columnsMenu">Columns</ax-button>
          <ax-dropdown-menu #columnsMenu>
            <ax-menu-label>Visible columns</ax-menu-label>
            <ax-menu-checkbox-item [(checked)]="colName">Name</ax-menu-checkbox-item>
            <ax-menu-checkbox-item [(checked)]="colStatus">Status</ax-menu-checkbox-item>
            <ax-menu-checkbox-item [(checked)]="colOwner">Owner</ax-menu-checkbox-item>
            <ax-menu-separator />
            <ax-menu-label>Sort by</ax-menu-label>
            <ax-menu-radio-group [(value)]="sortBy">
              <ax-menu-radio-item value="name">Name</ax-menu-radio-item>
              <ax-menu-radio-item value="date">Date</ax-menu-radio-item>
              <ax-menu-radio-item value="value">Value</ax-menu-radio-item>
            </ax-menu-radio-group>
          </ax-dropdown-menu>
          <p axText size="xs" tone="muted">
            Sort: {{ sortBy() || '—' }} · Name {{ colName() ? 'on' : 'off' }}
          </p>
        </div>
      </section>

      <section class="demo-surface p-4" axStack gap="4">
        <h3 class="text-sm font-semibold tracking-tight">Flow — stepper</h3>
        <ax-stepper [(currentStep)]="wizardStep">
          <ax-step label="Account" description="Identity" icon="user">
            <p class="mt-3 text-sm text-muted-foreground">
              Step content inherits density and surface tokens from Theme.
            </p>
            <ax-button class="mt-3" size="sm" variant="primary" (clickEvent)="wizardStep.set(1)">
              Continue
            </ax-button>
          </ax-step>
          <ax-step label="Workspace" description="Prefs" icon="settings">
            <p class="mt-3 text-sm text-muted-foreground">Choose a default preset for new workspaces.</p>
            <div axCluster gap="2" class="mt-3">
              <ax-button size="sm" variant="outline" (clickEvent)="wizardStep.set(0)">Back</ax-button>
              <ax-button size="sm" variant="primary" (clickEvent)="wizardStep.set(2)">Continue</ax-button>
            </div>
          </ax-step>
          <ax-step label="Done" description="Review" icon="check-circle">
            <p class="mt-3 text-sm text-muted-foreground">Mock onboarding complete.</p>
            <ax-button class="mt-3" size="sm" variant="outline" (clickEvent)="wizardStep.set(0)">
              Restart
            </ax-button>
          </ax-step>
        </ax-stepper>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Data — timeline &amp; carousel</h3>
        <ax-timeline [items]="kitTimeline" />
        <ax-carousel [autoplay]="false" ariaLabel="Product highlights">
          <ax-carousel-slide>
            <div class="flex h-36 flex-col justify-center gap-2 rounded-md border border-border bg-muted/40 px-6">
              <ax-icon name="star" [size]="20" class="text-primary" />
              <p class="text-sm font-semibold">Token cascade</p>
              <p class="text-xs text-muted-foreground">Presets restyle every slide surface.</p>
            </div>
          </ax-carousel-slide>
          <ax-carousel-slide>
            <div class="flex h-36 flex-col justify-center gap-2 rounded-md border border-border bg-muted/40 px-6">
              <ax-icon name="check-circle" [size]="20" class="text-primary" />
              <p class="text-sm font-semibold">Accessible by default</p>
              <p class="text-xs text-muted-foreground">Keyboard arrows and live regions included.</p>
            </div>
          </ax-carousel-slide>
          <ax-carousel-slide>
            <div class="flex h-36 flex-col justify-center gap-2 rounded-md border border-border bg-muted/40 px-6">
              <ax-icon name="settings" [size]="20" class="text-primary" />
              <p class="text-sm font-semibold">Packaging-ready shell</p>
              <p class="text-xs text-muted-foreground">Layout required; pages optional.</p>
            </div>
          </ax-carousel-slide>
        </ax-carousel>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Forms — combobox, OTP &amp; color</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <div axStack gap="2">
            <span class="text-sm font-medium">Assignee</span>
            <ax-combobox
              [options]="assigneeOptions"
              [(value)]="assignee"
              placeholder="Pick a person"
              ariaLabel="Assignee"
            />
          </div>
          <div axStack gap="2">
            <span class="text-sm font-medium">Verification code</span>
            <ax-input-otp [length]="6" [(value)]="otp" (complete)="onOtp($event)" />
            @if (otpComplete()) {
              <p class="text-xs text-muted-foreground">Complete: {{ otpComplete() }}</p>
            }
          </div>
        </div>
        <div axStack gap="2">
          <span class="text-sm font-medium">Brand accent (OKLCH)</span>
          <div axCluster gap="3" class="items-center">
            <div class="h-10 w-10 shrink-0 rounded-md border border-border" [axSwatch]="brandColor()"></div>
            <p axText size="xs" tone="muted">AxSwatchDirective preview mirrors the picker value.</p>
          </div>
          <ax-color-picker [(value)]="brandColor" format="oklch" ariaLabel="Brand color" />
        </div>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Buttons — toggle group &amp; segmented</h3>
        <ax-toggle-group type="single" [(value)]="align" ariaLabel="Alignment">
          <ax-toggle value="start">Start</ax-toggle>
          <ax-toggle value="center">Center</ax-toggle>
          <ax-toggle value="end">End</ax-toggle>
        </ax-toggle-group>
        <ax-segmented
          [options]="viewOptions"
          [(value)]="viewMode"
          ariaLabel="View mode"
        />
        <p class="text-xs text-muted-foreground">
          Align: {{ align() || '—' }} · View: {{ viewMode() }}
        </p>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Data — card, statistic &amp; collapsible</h3>
        <div class="grid gap-3 sm:grid-cols-2">
          <ax-card>
            <div axCardHeader class="text-sm font-semibold">MRR</div>
            <div axCardContent>
              <ax-statistic [value]="86400" prefix="$" [trend]="11" />
            </div>
          </ax-card>
          <ax-card>
            <div axCardHeader class="text-sm font-semibold">Activation</div>
            <div axCardContent>
              <ax-statistic [value]="61" suffix="%" [trend]="4" />
            </div>
          </ax-card>
        </div>
        <ax-collapsible [(open)]="detailsOpen">
          <button
            type="button"
            axCollapsibleTrigger
            class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-2 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            More metrics
            <ax-icon [name]="detailsOpen() ? 'chevron-up' : 'chevron-down'" [size]="16" />
          </button>
          <p class="px-1 pb-2 text-sm text-muted-foreground">
            Collapsible content inherits border and muted tokens from Theme.
          </p>
        </ax-collapsible>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Navigation — menubar</h3>
        <ax-menubar>
          <ax-menubar-menu label="File">
            <ax-dropdown-menu>
              <ax-menu-item (click)="showToast('default')">New report</ax-menu-item>
              <ax-menu-item (click)="showToast('success')">Export CSV</ax-menu-item>
              <ax-menu-separator />
              <ax-menu-item (click)="showToast('destructive')">Close</ax-menu-item>
            </ax-dropdown-menu>
          </ax-menubar-menu>
          <ax-menubar-menu label="Edit">
            <ax-dropdown-menu>
              <ax-menu-item (click)="showToast('default')">Duplicate</ax-menu-item>
              <ax-menu-item (click)="showToast('default')">Rename</ax-menu-item>
            </ax-dropdown-menu>
          </ax-menubar-menu>
          <ax-menubar-menu label="View">
            <ax-dropdown-menu>
              <ax-menu-item (click)="showToast('success')">Toggle density</ax-menu-item>
            </ax-dropdown-menu>
          </ax-menubar-menu>
        </ax-menubar>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Navigation — mega menu</h3>
        <ax-navigation-menu>
          <ax-navigation-menu-item value="products" label="Products">
            <ax-navigation-menu-content>
              <div class="grid w-64 gap-1 p-1">
                <a routerLink="/analytics" class="rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">Analytics</a>
                <a routerLink="/crm" class="rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">CRM</a>
                <a routerLink="/data-grid" class="rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">Data grid</a>
              </div>
            </ax-navigation-menu-content>
          </ax-navigation-menu-item>
          <ax-navigation-menu-item value="industries" label="Industries">
            <ax-navigation-menu-content>
              <div class="grid w-64 gap-1 p-1">
                <a routerLink="/banking" class="rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">Banking</a>
                <a routerLink="/healthcare" class="rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">Healthcare</a>
                <a routerLink="/automotive" class="rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">Automotive</a>
                <a routerLink="/government" class="rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">Government</a>
              </div>
            </ax-navigation-menu-content>
          </ax-navigation-menu-item>
          <ax-navigation-menu-item value="resources" label="Resources">
            <ax-navigation-menu-content>
              <div class="grid w-64 gap-1 p-1">
                <a routerLink="/blocks" class="rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">Blocks</a>
                <a routerLink="/landing" class="rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">Landing</a>
              </div>
            </ax-navigation-menu-content>
          </ax-navigation-menu-item>
        </ax-navigation-menu>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Buttons — icon &amp; group</h3>
        <div axButtonGroup ariaLabel="Toolbar">
          <ax-icon-button ariaLabel="Add" variant="outline" (clickEvent)="showToast('success')">
            <ax-icon name="plus" [size]="16" />
          </ax-icon-button>
          <ax-icon-button ariaLabel="Edit" variant="outline" (clickEvent)="showToast('default')">
            <ax-icon name="edit" [size]="16" />
          </ax-icon-button>
          <ax-icon-button ariaLabel="Filter" variant="outline" (clickEvent)="showToast('default')">
            <ax-icon name="filter" [size]="16" />
          </ax-icon-button>
          <ax-icon-button ariaLabel="Download" variant="outline" (clickEvent)="showToast('success')">
            <ax-icon name="download" [size]="16" />
          </ax-icon-button>
        </div>
      </section>

      <section class="demo-surface p-4" axStack gap="4">
        <h3 class="text-sm font-semibold tracking-tight">Forms — radio, number, time &amp; signature</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <div axStack gap="2">
            <p class="text-sm font-medium">Plan</p>
            <ax-radio-group [(value)]="plan" ariaLabel="Plan">
              <ax-radio value="free">Free</ax-radio>
              <ax-radio value="pro">Pro</ax-radio>
              <ax-radio value="enterprise">Enterprise</ax-radio>
            </ax-radio-group>
          </div>
          <div axStack gap="2">
            <span class="text-sm font-medium">Guests</span>
            <ax-input-number [(value)]="guests" [min]="1" [max]="20" ariaLabel="Guests" />
            <span class="text-sm font-medium">Appointment time</span>
            <ax-time-picker [(value)]="appointmentTime" [use24]="false" />
          </div>
        </div>
        <div axStack gap="2">
          <p class="text-sm font-medium">Consent signature</p>
          <ax-signature-pad class="max-w-md" />
          <p class="text-xs text-muted-foreground">Draw above — ink uses currentColor from Theme.</p>
        </div>
      </section>

      <section class="demo-surface p-4" axStack gap="4">
        <h3 class="text-sm font-semibold tracking-tight">Forms — field, mask &amp; tree-select</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <ax-form-field
            label="Work email"
            forId="kit-work-email"
            helper="Used for invites and billing."
            [error]="emailError()"
          >
            <ax-input
              id="kit-work-email"
              type="email"
              [(value)]="workEmail"
              placeholder="you@company.com"
            />
          </ax-form-field>
          <ax-form-field label="Phone" forId="kit-phone" helper="US format">
            <ax-input-mask
              id="kit-phone"
              mask="(999) 999-9999"
              placeholder="(___) ___-____"
              [(value)]="phone"
              ariaLabel="Phone"
            />
          </ax-form-field>
        </div>
        <ax-form-field label="Folder" forId="kit-folder" helper="Pick from the tree">
          <ax-tree-select
            id="kit-folder"
            [nodes]="folderNodes"
            [(value)]="folderId"
            placeholder="Choose a folder"
            [searchable]="true"
            ariaLabel="Folder"
          />
        </ax-form-field>
        <div axCluster gap="2">
          <ax-button size="sm" variant="outline" (clickEvent)="emailError.set('Enter a valid work email')">
            Simulate error
          </ax-button>
          <ax-button size="sm" variant="ghost" (clickEvent)="emailError.set(null)">Clear error</ax-button>
        </div>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Pro — calendar</h3>
        <div class="flex flex-wrap gap-6">
          <div axStack gap="2">
            <p class="text-sm font-medium">Single</p>
            <ax-calendar [(value)]="calendarDay" />
          </div>
          <div axStack gap="2">
            <p class="text-sm font-medium">Range</p>
            <ax-calendar mode="range" [(value)]="calendarRange" />
          </div>
        </div>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Primitives — typography</h3>
        <h4 axHeading size="lg" weight="semibold">Section title (axHeading)</h4>
        <p axText size="sm" tone="muted">
          Body copy uses the type scale — switch Theme to restyle every step.
        </p>
        <span axText size="xs" tone="muted" transform="upper" tracking="wide">Overline label</span>
      </section>

      <section class="demo-surface p-4" axStack gap="3">
        <h3 class="text-sm font-semibold tracking-tight">Primitives — grid &amp; aspect ratio</h3>
        <div axGrid cols="3" gap="3">
          <div class="rounded-md border border-border bg-muted/40" [axAspectRatio]="16 / 9">
            <div class="flex h-full items-center justify-center">
              <span axText size="xs" tone="muted">16:9</span>
            </div>
          </div>
          <div class="rounded-md border border-border bg-muted/40" [axAspectRatio]="4 / 3">
            <div class="flex h-full items-center justify-center">
              <span axText size="xs" tone="muted">4:3</span>
            </div>
          </div>
          <div class="rounded-md border border-border bg-muted/40" [axAspectRatio]="1">
            <div class="flex h-full items-center justify-center">
              <span axText size="xs" tone="muted">1:1</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
})
export class AxKitPageComponent {
  readonly sizes: ButtonSize[] = ['sm', 'md', 'lg'];
  readonly inputSizes: InputSize[] = ['sm', 'md', 'lg'];
  readonly variants: ButtonVariant[] = [
    'primary',
    'secondary',
    'outline',
    'ghost',
    'destructive',
  ];

  readonly regionOptions: AxSelectOption[] = [
    { value: 'na', label: 'North America' },
    { value: 'eu', label: 'Europe' },
    { value: 'apac', label: 'Asia Pacific' },
  ];

  readonly assigneeOptions: ComboboxOption[] = [
    { value: 'ada', label: 'Ada Lovelace' },
    { value: 'alan', label: 'Alan Turing' },
    { value: 'grace', label: 'Grace Hopper' },
  ];

  readonly viewOptions: SegmentedOption[] = [
    { label: 'List', value: 'list' },
    { label: 'Board', value: 'board' },
    { label: 'Calendar', value: 'cal' },
  ];

  readonly kitTimeline: TimelineItem[] = [
    {
      title: 'Invite sent',
      time: 'Mon',
      description: 'jordan@example.com',
      icon: 'user',
      color: 'primary',
    },
    {
      title: 'Accepted',
      time: 'Tue',
      description: 'Joined Acme Analytics',
      icon: 'check-circle',
      color: 'success',
    },
    {
      title: 'First report',
      time: 'Wed',
      description: 'Weekly signups exported',
      icon: 'file-text',
      color: 'default',
    },
  ];

  readonly btnSize = signal<ButtonSize>('md');
  readonly btnVariant = signal<ButtonVariant>('primary');
  readonly inputSize = signal<InputSize>('md');
  readonly selectSize = signal<InputSize>('md');
  readonly email = signal('');
  readonly region = signal<string | null>(null);
  readonly notifyOn = signal(true);
  readonly termsAccepted = signal(false);
  readonly volume = signal(42);
  readonly uploadProgress = signal(64);
  readonly tab = signal('overview');
  readonly routerTab = signal('design');
  readonly dialogOpen = signal(false);
  readonly dialogResult = signal<string | null>(null);
  readonly rating = signal(4);
  readonly page = signal(1);
  readonly routerPage = signal(1);
  readonly appointmentDate = signal<CalendarValue>(null);
  readonly bio = signal('Building token-first Angular products.');
  readonly skills = signal<string[]>(['TypeScript', 'Design systems']);
  readonly filterOpen = signal(false);
  readonly filterActiveOnly = signal(true);
  readonly colName = signal(true);
  readonly colStatus = signal(true);
  readonly colOwner = signal(false);
  readonly sortBy = signal<string | null>('name');
  readonly wizardStep = signal(0);
  readonly assignee = signal<string | string[] | null>(null);
  readonly otp = signal('');
  readonly otpComplete = signal('');
  readonly brandColor = signal('oklch(0.55 0.18 255)');
  readonly align = signal<string | string[] | null>('start');
  readonly viewMode = signal('list');
  readonly detailsOpen = signal(false);
  readonly plan = signal<string | null>('pro');
  readonly guests = signal<number | null>(2);
  readonly appointmentTime = signal<TimeValue>({ hours: 9, minutes: 30 });
  readonly workEmail = signal('');
  readonly emailError = signal<string | null>(null);
  readonly phone = signal<string | null>(null);
  readonly folderId = signal<string | number | null>(null);
  readonly calendarDay = signal<CalendarValue>(null);
  readonly calendarRange = signal<CalendarValue>(null);

  readonly folderNodes: TreeNode[] = [
    {
      id: 'docs',
      label: 'Documents',
      icon: 'folder',
      children: [
        { id: 'specs', label: 'Specs', icon: 'file-text' },
        { id: 'design', label: 'Design', icon: 'image' },
      ],
    },
    {
      id: 'code',
      label: 'Code',
      icon: 'folder',
      children: [
        { id: 'apps', label: 'apps' },
        { id: 'libs', label: 'libs' },
      ],
    },
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
        p = Math.min(100, p + 20);
        onProgress(p);
        if (p >= 100) {
          clearInterval(id);
          resolve();
        }
      }, 120);
    });

  private readonly toast = inject(ToastService);
  private readonly dialog = inject(AxDialogService);

  noop(): void {
    /* chip remove demo */
  }

  openProgrammaticDialog(): void {
    const ref = this.dialog.open<DemoConfirmDialogComponent, string>(DemoConfirmDialogComponent, {
      size: 'sm',
      closeButton: true,
      ariaLabel: 'Confirm action',
      data: {
        message: 'Opened with AxDialogService — inject DialogRef + DIALOG_DATA in the content component.',
      },
    });
    ref.result$.subscribe((result) => {
      this.dialogResult.set(result ?? 'dismissed');
      if (result === 'confirmed') {
        this.showToast('success');
      }
    });
  }

  onOtp(code: string): void {
    this.otpComplete.set(code);
    this.showToast('success');
  }

  showToast(variant: 'default' | 'success' | 'destructive'): void {
    this.toast.show({
      title: variant === 'destructive' ? 'Something failed' : 'Toast fired',
      description: 'Rendered by ax-toast-outlet in the app shell.',
      variant,
    });
  }
}
