import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';

import { SPLITTER_CONTEXT, type SplitterPanelRef } from './splitter.types';
import { AxSplitterHandleComponent } from './splitter-handle.component';

/**
 * A single pane in a ax-splitter. Holds projected content and, in auto-gutter
 * mode, renders its own trailing handle (except when it is the last panel).
 * Implements SplitterPanelRef so the root can size it and read its clamps.
 */
@Component({
  selector: 'ax-splitter-panel',
  standalone: true,
  imports: [AxSplitterHandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-0 min-w-0 grow overflow-auto"><ng-content /></div>
    @if (showHandle()) {
      <ax-splitter-handle [boundary]="boundaryIndex()" />
    }
  `,
  host: {
    class: 'relative flex min-h-0 min-w-0 basis-0 overflow-hidden',
    '[class.flex-row]': "ctx.orientation() === 'horizontal'",
    '[class.flex-col]': "ctx.orientation() === 'vertical'",
  },
})
export class AxSplitterPanelComponent implements SplitterPanelRef {
  readonly size = input<number | undefined>(undefined);
  readonly minSize = input(0);
  readonly maxSize = input(100);
  readonly collapsible = input(false, { transform: booleanAttribute });
  readonly collapsedSize = input(0);

  protected readonly ctx = inject(SPLITTER_CONTEXT);
  readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  protected readonly boundaryIndex = computed(() => this.ctx.indexOf(this));
  protected readonly showHandle = computed(() => this.ctx.autoGutters() && !this.ctx.isLast(this));
}
