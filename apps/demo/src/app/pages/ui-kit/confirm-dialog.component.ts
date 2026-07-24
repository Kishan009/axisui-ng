import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AxButtonComponent } from '@axisui-ng/buttons';
import { DialogRef, DIALOG_DATA } from '@axisui-ng/overlays';

export interface ConfirmDialogData {
  message: string;
}

/** Content for AxDialogService.open — used by the UI Kit programmatic dialog demo. */
@Component({
  selector: 'demo-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxButtonComponent],
  template: `
    <div class="pe-8">
      <h2 class="text-lg font-semibold tracking-tight">Confirm action</h2>
      <p class="mt-1 text-sm text-muted-foreground">{{ data?.message }}</p>
    </div>
    <div class="my-4 h-px w-full bg-border" role="separator"></div>
    <div class="flex justify-end gap-2">
      <ax-button variant="ghost" size="sm" (clickEvent)="ref.close('cancelled')">Cancel</ax-button>
      <ax-button variant="destructive" size="sm" (clickEvent)="ref.close('confirmed')">
        Confirm
      </ax-button>
    </div>
  `,
})
export class DemoConfirmDialogComponent {
  readonly ref = inject<DialogRef<DemoConfirmDialogComponent, string>>(DialogRef);
  readonly data = inject(DIALOG_DATA, { optional: true }) as ConfirmDialogData | null;
}
