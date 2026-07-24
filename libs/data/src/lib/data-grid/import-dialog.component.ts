import { DOCUMENT } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { type GridColumnDef } from './grid-core';

/** Inline modal to map CSV columns to grid columns before import (used by ax-data-grid). */
@Component({
  selector: 'ax-data-grid-import-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- backdrop is a decorative dismiss target; the real controls are the buttons + Escape on the card -->
    <div data-import-backdrop class="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" (click)="cancel.emit()">
      <div #card role="dialog" aria-modal="true" aria-label="Map CSV columns"
        class="max-h-[85vh] w-[32rem] max-w-full overflow-auto rounded-[var(--radius-field)] border border-border bg-popover p-4 text-sm shadow-md"
        (click)="$event.stopPropagation()" (keydown.escape)="cancel.emit()"
        (keydown.tab)="onTab($event, false)" (keydown.shift.tab)="onTab($event, true)">
        <h2 class="mb-3 font-medium">Map CSV columns</h2>
        <ul class="flex flex-col gap-2">
          @for (h of headers(); track $index; let i = $index) {
            <li class="flex items-center justify-between gap-3">
              <span class="text-muted-foreground">{{ h }}</span>
              <select #firstSelect [attr.aria-label]="'Map ' + h" [value]="mapping()[i] ?? ''"
                class="h-8 rounded-[var(--radius-sm)] border border-input bg-background px-2"
                (change)="onMapChange(i, $any($event.target).value)">
                <option value="">Ignore</option>
                @for (col of columns(); track colKey(col)) { <option [value]="colKey(col)">{{ col.header }}</option> }
              </select>
            </li>
          }
        </ul>
        @if (preview().length) {
          <div class="mt-3 overflow-auto">
            <table class="w-full border-collapse text-xs">
              <thead><tr>
                @for (t of mappedTargets(); track t.index) { <th class="border border-border px-2 py-1 text-start">{{ t.header }}</th> }
              </tr></thead>
              <tbody>
                @for (row of preview(); track $index) { <tr>
                  @for (t of mappedTargets(); track t.index) { <td class="border border-border px-2 py-1">{{ row[t.index] ?? '' }}</td> }
                </tr> }
              </tbody>
            </table>
          </div>
        }
        <div class="mt-4 flex justify-end gap-2">
          <button type="button" data-import-cancel class="rounded-[var(--radius-field)] border border-border px-3 py-1 hover:bg-muted" (click)="cancel.emit()">Cancel</button>
          <button type="button" data-import-confirm class="rounded-[var(--radius-field)] border border-border px-3 py-1 hover:bg-muted" (click)="confirm.emit(mapping())">Import</button>
        </div>
      </div>
    </div>
  `,
})
export class AxDataGridImportDialogComponent<T extends Record<string, unknown>> {
  readonly headers = input.required<string[]>();
  readonly preview = input<string[][]>([]);
  readonly columns = input.required<GridColumnDef<T>[]>();
  readonly initialMapping = input<(string | null)[]>([]);
  readonly confirm = output<(string | null)[]>();
  // eslint-disable-next-line @angular-eslint/no-output-native -- public API name; this is a dialog dismissal, not the native form 'cancel' event
  readonly cancel = output<void>();

  protected readonly mapping = signal<(string | null)[]>([]);
  private readonly firstSelect = viewChild<ElementRef<HTMLSelectElement>>('firstSelect');
  private readonly card = viewChild<ElementRef<HTMLElement>>('card');
  private readonly doc = inject(DOCUMENT);

  constructor() {
    // Capture the trigger before the dialog steals focus, so we can restore it on close.
    const previouslyFocused = this.doc.activeElement as HTMLElement | null;
    effect(() => this.mapping.set([...this.initialMapping()]));
    afterNextRender(() => this.firstSelect()?.nativeElement.focus());
    inject(DestroyRef).onDestroy(() => previouslyFocused?.focus?.());
  }

  protected colKey(col: GridColumnDef<T>): string { return String(col.key); }

  /** Minimal focus trap: wrap Tab / Shift+Tab at the dialog's focusable boundaries. */
  protected onTab(event: KeyboardEvent, backward: boolean): void {
    const root = this.card()?.nativeElement;
    if (!root) return;
    const focusable = Array.from(root.querySelectorAll<HTMLElement>('select, button, [href], input, [tabindex]:not([tabindex="-1"])'))
      .filter((el) => !el.hasAttribute('disabled'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    const active = this.doc.activeElement;
    if (backward && active === first) { event.preventDefault(); last.focus(); }
    else if (!backward && active === last) { event.preventDefault(); first.focus(); }
  }

  protected onMapChange(index: number, value: string): void {
    this.mapping.update((m) => { const next = [...m]; next[index] = value === '' ? null : value; return next; });
  }

  /** The mapped (non-ignored) targets, in CSV column order, for the preview table. */
  protected readonly mappedTargets = computed(() => {
    const out: { index: number; key: string; header: string }[] = [];
    this.mapping().forEach((key, index) => {
      if (key == null) return;
      const col = this.columns().find((c) => String(c.key) === key);
      if (col) out.push({ index, key, header: col.header });
    });
    return out;
  });
}
