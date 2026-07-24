import { A11yModule } from '@angular/cdk/a11y';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewContainerRef,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';

import { animateOverlayClose, cn, OVERLAY_REF, type OverlayRefLike } from '@axisui-ng/overlays-core';

import { AxDialogDescriptionDirective, AxDialogTitleDirective } from './dialog-parts';

/**
 * Dialog — modal overlay with backdrop, scroll-lock, and focus trap.
 * Content slots: [axDialogTitle], [axDialogDescription], [axDialogBody] (default), [axDialogFooter].
 *
 * @example
 * <ax-dialog [(open)]="isOpen">
 *   <h2 axDialogTitle>Title</h2>
 *   <p axDialogBody>…</p>
 *   <div axDialogFooter><button axOverlayClose>Close</button></div>
 * </ax-dialog>
 */
@Component({
  selector: 'ax-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A11yModule],
  providers: [{ provide: OVERLAY_REF, useExisting: forwardRef(() => AxDialogComponent) }],
  template: `
    <ng-template>
      <div
        role="dialog"
        aria-modal="true"
        data-ax-overlay
        [attr.aria-labelledby]="labelId()"
        [attr.aria-describedby]="descId()"
        [attr.data-state]="open() ? 'open' : 'closed'"
        [class]="panelClasses"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
      >
        <div class="mb-2 [&:empty]:hidden">
          <ng-content select="[axDialogTitle]" />
          <ng-content select="[axDialogDescription]" />
        </div>
        <div><ng-content select="[axDialogBody]" /><ng-content /></div>
        <div class="mt-4 flex items-center justify-end gap-2 [&:empty]:hidden">
          <ng-content select="[axDialogFooter]" />
        </div>
      </div>
    </ng-template>
  `,
})
export class AxDialogComponent implements OverlayRefLike {
  /** Open state (two-way). @default false */
  readonly open = model<boolean>(false);
  /** Close on Escape. @default true */
  readonly closeOnEscape = input<boolean>(true);
  /** Close on backdrop click. @default true */
  readonly closeOnBackdrop = input<boolean>(true);

  // Wire aria-labelledby / aria-describedby only when a title / description is
  // actually projected, so the attributes never dangle at a hidden/empty node.
  private readonly titleDir = contentChild(AxDialogTitleDirective);
  private readonly descDir = contentChild(AxDialogDescriptionDirective);
  protected readonly labelId = computed(() => this.titleDir()?.id ?? null);
  protected readonly descId = computed(() => this.descDir()?.id ?? null);

  private readonly content = viewChild.required(TemplateRef);

  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  protected readonly panelClasses = cn(
    'relative w-full max-w-lg rounded-[var(--radius-card)] border border-border bg-card p-6',
    'text-card-foreground shadow-lg outline-none',
    // Cap height and scroll internally so long content never overflows the viewport.
    'max-h-[85vh] overflow-y-auto',
  );

  constructor() {
    effect(() => {
      if (this.open()) {
        this.attach();
      } else {
        this.detach();
      }
    });
  }

  close(): void {
    this.open.set(false);
  }

  private attach(): void {
    if (this.overlayRef) return;
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    });
    this.overlayRef.attach(new TemplatePortal(this.content(), this.vcr));
    this.overlayRef.backdropClick().subscribe(() => {
      if (this.closeOnBackdrop()) this.open.set(false);
    });
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape' && this.closeOnEscape()) this.open.set(false);
    });
  }

  private detach(): void {
    if (this.overlayRef) animateOverlayClose(this.overlayRef);
    this.overlayRef = null;
  }
}
