import { CdkPortalOutlet, type ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  type ComponentRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';

import { cn } from '@axisui-ng/overlays-core';

import type { DialogSize } from './dialog.types';

/**
 * Internal host wrapper rendered inside the dialog overlay by
 * {@link AxDialogService}. It hosts the opened component via a
 * {@link CdkPortalOutlet}, applies the same panel chrome as `<ax-dialog>`,
 * and conditionally renders a dismiss ("X") button.
 *
 * Wrapping the content this way lets the close button live inside the overlay
 * (and inside the focus trap) alongside the projected component. Not part of
 * the public API.
 */
@Component({
  selector: 'ax-dialog-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkPortalOutlet],
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'data-ax-overlay': '',
    'data-state': 'open',
    '[attr.aria-label]': 'ariaLabel()',
    '[class]': 'panelClasses()',
  },
  template: `
    @if (closeButton()) {
      <button
        type="button"
        aria-label="Close"
        class="ax-dialog-close absolute end-3 top-3 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground outline-none transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-muted hover:text-foreground active:scale-[0.98] active:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        (click)="closeClick.emit()"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    }
    <ng-template cdkPortalOutlet />
  `,
})
export class AxDialogContainerComponent {
  /** Whether to render the dismiss button. @default true */
  readonly closeButton = input<boolean>(true);
  /** Panel max-width. @default 'md' */
  readonly size = input<DialogSize>('md');
  /** Optional accessible name when the opened content has no labelled title. */
  readonly ariaLabel = input<string | null>(null);
  /** Emits when the dismiss button is clicked. */
  readonly closeClick = output<void>();

  private readonly portalOutlet = viewChild.required(CdkPortalOutlet);

  /** Same surface as `<ax-dialog>` so programmatic opens are opaque and sized. */
  protected readonly panelClasses = computed(() =>
    cn(
      'relative block w-full rounded-[var(--radius-card)] border border-border bg-card p-6',
      'text-card-foreground shadow-lg outline-none',
      'max-h-[85vh] overflow-y-auto',
      this.size() === 'sm' && 'max-w-sm',
      this.size() === 'md' && 'max-w-lg',
      this.size() === 'lg' && 'max-w-2xl',
    ),
  );

  /**
   * Attach the opened component's portal into this container's outlet and
   * return its {@link ComponentRef}. Called once by {@link AxDialogService}
   * after the container itself is attached to the overlay.
   */
  attachContent<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    return this.portalOutlet().attachComponentPortal(portal);
  }
}
