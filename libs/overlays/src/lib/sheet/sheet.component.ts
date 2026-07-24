import { A11yModule } from '@angular/cdk/a11y';
import { Overlay, type OverlayRef, type GlobalPositionStrategy } from '@angular/cdk/overlay';
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

// Import the sibling `dialog` entry point by its package path, NOT a relative
// `../dialog/...` — a relative cross-entry-point import pulls dialog's sources
// into the sheet entry-point program and crashes ng-packagr's ngc (jest, on a
// single flat program, does not catch this).
import { AxDialogDescriptionDirective, AxDialogTitleDirective } from '@axisui-ng/overlays/dialog';

export type SheetSide = 'start' | 'end' | 'top' | 'bottom';

/** Pane width for start/end drawers — set on OverlayConfig so the CDK pane
 *  itself is edge-sized (panel `w-*` percentages alone left a visible end gap). */
const SHEET_EDGE_WIDTH = '24rem';
const SHEET_EDGE_MAX_WIDTH = '75vw';

/**
 * Sheet — modal drawer that slides in from an edge. Same content slots as Dialog.
 *
 * @example <ax-sheet [(open)]="open" side="end">…</ax-sheet>
 */
@Component({
  selector: 'ax-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [A11yModule],
  providers: [{ provide: OVERLAY_REF, useExisting: forwardRef(() => AxSheetComponent) }],
  template: `
    <ng-template>
      <div
        role="dialog"
        aria-modal="true"
        data-ax-overlay
        [attr.aria-labelledby]="labelId()"
        [attr.aria-describedby]="descId()"
        [attr.data-side]="side()"
        [attr.data-state]="open() ? 'open' : 'closed'"
        [class]="panelClasses()"
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
export class AxSheetComponent implements OverlayRefLike {
  readonly open = model<boolean>(false);
  /** Edge the sheet slides from. @default 'end' */
  readonly side = input<SheetSide>('end');
  readonly closeOnEscape = input<boolean>(true);
  readonly closeOnBackdrop = input<boolean>(true);

  // aria-labelledby / aria-describedby resolve only when a title / description is
  // projected (via the shared axDialogTitle / axDialogDescription markers).
  private readonly titleDir = contentChild(AxDialogTitleDirective);
  private readonly descDir = contentChild(AxDialogDescriptionDirective);
  protected readonly labelId = computed(() => this.titleDir()?.id ?? null);
  protected readonly descId = computed(() => this.descDir()?.id ?? null);

  private readonly content = viewChild.required(TemplateRef);
  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;
  /** Side used when the current overlay was attached — detect mid-open side swaps. */
  private attachedSide: SheetSide | null = null;

  protected readonly panelClasses = computed(() => {
    const edge = this.side();
    // Pane owns width/height via OverlayConfig; panel fills it so the drawer is
    // flush with the viewport edge (no leftover gap inside the overlay pane).
    const fill =
      edge === 'start' || edge === 'end'
        ? 'h-full w-full'
        : 'w-full max-h-[min(100%,24rem)]';
    // Square the docked edge; round only the inner corners so it reads as a
    // drawer, not a floating card.
    const radius =
      edge === 'end'
        ? 'rounded-s-[var(--radius-card)]'
        : edge === 'start'
          ? 'rounded-e-[var(--radius-card)]'
          : edge === 'top'
            ? 'rounded-b-[var(--radius-card)]'
            : 'rounded-t-[var(--radius-card)]';
    return cn(
      'border border-border bg-card p-6 text-card-foreground shadow-lg outline-none overflow-y-auto',
      // Drop the border on the docked edge so it sits flush against the viewport.
      edge === 'end' && 'border-e-0',
      edge === 'start' && 'border-s-0',
      edge === 'top' && 'border-t-0',
      edge === 'bottom' && 'border-b-0',
      radius,
      fill,
    );
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const side = this.side();
      if (!isOpen) {
        this.detach();
        return;
      }
      // Re-attach when `side` changes while open so position/size stay correct
      // (attach() otherwise no-ops while an OverlayRef exists).
      if (this.overlayRef && this.attachedSide !== side) {
        this.overlayRef.dispose();
        this.overlayRef = null;
        this.attachedSide = null;
      }
      this.attach();
    });
  }

  close(): void {
    this.open.set(false);
  }

  private position(): GlobalPositionStrategy {
    const pos = this.overlay.position().global();
    // Prefer CDK logical start/end so LTR/RTL stay correct without manual mapping.
    switch (this.side()) {
      case 'top':
        return pos.top('0').left('0');
      case 'bottom':
        return pos.bottom('0').left('0');
      case 'start':
        return pos.start('0').top('0');
      case 'end':
        return pos.end('0').top('0');
    }
  }

  private attach(): void {
    if (this.overlayRef) return;
    const edge = this.side();
    const vertical = edge === 'start' || edge === 'end';
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.position(),
      // Explicit pane size pinned with top+end/start. Avoid percentage width on
      // the panel alone — that sized against a shrink-wrapped pane and left a
      // visible gap on the end edge in Storybook. Vertical drawers pin an edge
      // width + full height; top/bottom leave height/maxWidth auto. Keys are
      // omitted (not set to `undefined`) — OverlayConfig is exactOptional.
      width: vertical ? SHEET_EDGE_WIDTH : '100%',
      ...(vertical ? { height: '100%', maxWidth: SHEET_EDGE_MAX_WIDTH } : {}),
    });
    this.attachedSide = edge;
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
    this.attachedSide = null;
  }
}
