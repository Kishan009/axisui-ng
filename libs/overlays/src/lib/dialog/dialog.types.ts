import { InjectionToken } from '@angular/core';

/** Size of a programmatically-opened dialog. Maps to a max-width on the overlay pane. */
export type DialogSize = 'sm' | 'md' | 'lg';

/**
 * Options for {@link AxDialogService.open}.
 *
 * Naming aligns with the template-driven `<ax-dialog>` component
 * (`closeOnEscape` / `closeOnBackdrop`) so both APIs read the same.
 */
export interface DialogOptions {
  /** Render a modal backdrop. @default true */
  backdrop?: boolean;
  /** Close when Escape is pressed. @default true */
  closeOnEscape?: boolean;
  /** Close when the backdrop is clicked (only when {@link backdrop} is true). @default true */
  closeOnBackdrop?: boolean;
  /** Render a dismiss ("X") button inside the dialog that closes it. @default true */
  closeButton?: boolean;
  /** Panel size, mapped to a max-width. @default 'md' */
  size?: DialogSize;
  /** Accessible name for the dialog panel when content has no labelled title. */
  ariaLabel?: string | null;
  /** Extra class(es) applied to the overlay pane. */
  customClass?: string;
  /** Arbitrary data injected into the opened component via {@link DIALOG_DATA}. */
  data?: unknown;
}

/**
 * Injection token for the data passed to a programmatically-opened dialog.
 *
 * @example
 * const data = inject(DIALOG_DATA, { optional: true });
 */
export const DIALOG_DATA = new InjectionToken<unknown>('AX_DIALOG_DATA');
