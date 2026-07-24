import { DOCUMENT } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';

/** Inline modal to choose which worksheet to import from a multi-sheet .xlsx (used by ax-data-grid). */
@Component({
  selector: 'ax-data-grid-sheet-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- backdrop is a decorative dismiss target; the real controls are the buttons + Escape on the card -->
    <div data-sheet-backdrop class="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" (click)="cancel.emit()">
      <div #card role="dialog" aria-modal="true" aria-label="Choose a sheet"
        class="max-h-[85vh] w-[24rem] max-w-full overflow-auto rounded-[var(--radius-field)] border border-border bg-popover p-4 text-sm shadow-md"
        (click)="$event.stopPropagation()" (keydown.escape)="cancel.emit()"
        (keydown.tab)="onTab($event, false)" (keydown.shift.tab)="onTab($event, true)">
        <h2 class="mb-3 font-medium">Choose a sheet</h2>
        <ul class="flex flex-col gap-1">
          @for (name of sheets(); track $index; let i = $index) {
            <li>
              <button type="button" data-sheet-option [attr.aria-pressed]="selected() === i" #firstOption
                class="w-full rounded-[var(--radius-sm)] border px-3 py-2 text-start hover:bg-muted"
                [class.border-primary]="selected() === i" [class.border-border]="selected() !== i"
                (click)="selected.set(i)">{{ name }}</button>
            </li>
          }
        </ul>
        <div class="mt-4 flex justify-end gap-2">
          <button type="button" data-sheet-cancel class="rounded-[var(--radius-field)] border border-border px-3 py-1 hover:bg-muted" (click)="cancel.emit()">Cancel</button>
          <button type="button" data-sheet-pick class="rounded-[var(--radius-field)] border border-border px-3 py-1 hover:bg-muted" (click)="pick.emit(selected())">Import</button>
        </div>
      </div>
    </div>
  `,
})
export class AxDataGridSheetPickerComponent {
  readonly sheets = input.required<string[]>();
  readonly pick = output<number>();
  // eslint-disable-next-line @angular-eslint/no-output-native -- public API name; this is a dialog dismissal, not the native form 'cancel' event
  readonly cancel = output<void>();

  protected readonly selected = signal(0);
  private readonly firstOption = viewChild<ElementRef<HTMLButtonElement>>('firstOption');
  private readonly card = viewChild<ElementRef<HTMLElement>>('card');
  private readonly doc = inject(DOCUMENT);

  constructor() {
    const previouslyFocused = this.doc.activeElement as HTMLElement | null;
    afterNextRender(() => this.firstOption()?.nativeElement.focus());
    inject(DestroyRef).onDestroy(() => previouslyFocused?.focus?.());
  }

  /** Minimal focus trap: wrap Tab / Shift+Tab at the dialog's focusable boundaries. */
  protected onTab(event: KeyboardEvent, backward: boolean): void {
    const root = this.card()?.nativeElement;
    if (!root) return;
    const focusable = Array.from(root.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])'))
      .filter((el) => !el.hasAttribute('disabled'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    const active = this.doc.activeElement;
    if (backward && active === first) { event.preventDefault(); last.focus(); }
    else if (!backward && active === last) { event.preventDefault(); first.focus(); }
  }
}
