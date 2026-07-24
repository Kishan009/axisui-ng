/**
 * Dialog stories.
 *
 * `<ax-dialog>` is the template-driven modal (the `Default` story). For dynamic
 * content there is `AxDialogService.open(Component, options)`: it renders any
 * component inside a modal overlay and returns a `DialogRef` with a reactive
 * `result$`. The `Programmatic` story shows `size`, `closeButton`, and the
 * close/result flow.
 *
 * Per-component import (smallest bundle):
 * `import { AxDialogService } from '@axisui-ng/overlays/dialog';`
 */

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxButtonComponent } from '@axisui-ng/buttons';
import { AxDialogComponent } from './dialog.component';
import { DialogRef } from './dialog-ref';
import { AxDialogService } from './dialog.service';
import { DIALOG_DATA } from './dialog.types';

interface ConfirmData {
  message: string;
}

/** Content rendered inside a programmatically-opened dialog. */
@Component({
  selector: 'demo-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxButtonComponent],
  template: `
    <div class="pe-8">
      <h2 class="text-lg font-semibold tracking-tight">Delete project?</h2>
      <p class="mt-1 text-sm text-muted-foreground">{{ data?.message }}</p>
    </div>
    <div class="my-4 h-px w-full bg-border" role="separator"></div>
    <div class="flex justify-end gap-2">
      <ax-button variant="ghost" (clickEvent)="ref.close('cancelled')">Cancel</ax-button>
      <ax-button variant="destructive" (clickEvent)="ref.close('confirmed')">Delete</ax-button>
    </div>
  `,
})
class ConfirmDialogComponent {
  /** Injected by AxDialogService so the content can dismiss itself with a result. */
  readonly ref = inject<DialogRef<ConfirmDialogComponent, string>>(DialogRef);
  /** Optional data passed through `open(..., { data })`. */
  readonly data = inject(DIALOG_DATA, { optional: true }) as ConfirmData | null;
}

/** Launcher button that opens the dialog via the service and reports its result. */
@Component({
  selector: 'demo-dialog-launcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxButtonComponent],
  template: `
    <div class="flex flex-col items-start gap-3">
      <ax-button (clickEvent)="open()">Delete project…</ax-button>
      @if (result()) {
        <p class="text-sm text-muted-foreground">
          Dialog closed with: <code class="font-mono">{{ result() }}</code>
        </p>
      }
    </div>
  `,
})
class DialogLauncherComponent {
  private readonly dialog = inject(AxDialogService);
  protected readonly result = signal<string | null>(null);

  protected open(): void {
    const ref = this.dialog.open<ConfirmDialogComponent, string>(ConfirmDialogComponent, {
      size: 'sm',
      closeButton: true,
      ariaLabel: 'Delete project?',
      data: { message: 'The Marketing project and all of its data will be permanently removed.' },
    });
    ref.result$.subscribe((result) => this.result.set(result ?? 'dismissed'));
  }
}

const meta: Meta = {
  title: 'Overlays/Dialog',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxDialogComponent, AxButtonComponent] })],
};
export default meta;
type Story = StoryObj;

/** Template-driven modal toggled by a bound `open` signal. */
export const Default: Story = {
  render: () => ({
    props: { open: signal(false) },
    template: `
      <ax-button (clickEvent)="open.set(true)">Open dialog</ax-button>
      <ax-dialog [(open)]="open">
        <h2 axDialogTitle class="text-lg font-semibold">Confirm action</h2>
        <p axDialogBody class="mt-1 text-sm text-muted-foreground">This action cannot be undone.</p>
      </ax-dialog>
    `,
  }),
};

/**
 * Programmatic open via `AxDialogService`. The button calls
 * `dialog.open(ConfirmDialogComponent, { size: 'sm', closeButton: true, data })`.
 * The dialog dismisses itself through the injected `DialogRef` (Cancel / Delete,
 * the close "X", Escape, or backdrop click), and the launcher reacts to the close
 * value via `ref.result$`.
 */
export const Programmatic: Story = {
  name: 'Programmatic (AxDialogService)',
  render: () => ({
    moduleMetadata: { imports: [DialogLauncherComponent] },
    template: `<demo-dialog-launcher />`,
  }),
};
