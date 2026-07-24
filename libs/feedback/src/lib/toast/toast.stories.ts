/**
 * Toast stories.
 *
 * Toasts are pushed imperatively through `ToastService.show(config)` and rendered
 * by a single `<ax-toast-outlet>` placed in the app shell. The launcher below
 * injects the service and triggers one toast per variant.
 *
 * Per-component import (smallest bundle):
 * `import { ToastService } from '@axisui-ng/feedback/toast';`
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AxButtonComponent } from '@axisui-ng/buttons';
import { AxToastOutletComponent } from './toast-outlet.component';
import { ToastService } from './toast.service';
import type { ToastVariant } from './toast.types';

/** Buttons that push toasts via the service, plus the outlet that renders them. */
@Component({
  selector: 'demo-toast-launcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxButtonComponent, AxToastOutletComponent],
  template: `
    <div class="flex flex-wrap gap-2">
      <ax-button (clickEvent)="show('default')">Default</ax-button>
      <ax-button variant="ghost" (clickEvent)="show('success')">Success</ax-button>
      <ax-button variant="ghost" (clickEvent)="show('warning')">Warning</ax-button>
      <ax-button variant="destructive" (clickEvent)="show('destructive')">Destructive</ax-button>
    </div>
    <ax-toast-outlet position="bottom-end" />
  `,
})
class ToastLauncherComponent {
  private readonly toast = inject(ToastService);

  protected show(variant: ToastVariant): void {
    const label = variant.charAt(0).toUpperCase() + variant.slice(1);
    this.toast.show({
      title: `${label} toast`,
      description: `This is a ${variant} notification.`,
      variant,
    });
  }
}

const meta: Meta = {
  title: 'Feedback/Toast',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    moduleMetadata: { imports: [ToastLauncherComponent] },
    template: `<demo-toast-launcher />`,
  }),
};
