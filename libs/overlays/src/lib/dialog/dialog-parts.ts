import { Directive } from '@angular/core';

let _uid = 0;

/**
 * Marks the dialog/sheet title element and gives it a stable id so the container
 * can point `aria-labelledby` at it — but only when a title is actually projected.
 *
 * @example <h2 axDialogTitle>Delete item?</h2>
 */
@Directive({
  selector: '[axDialogTitle]',
  host: { '[id]': 'id' },
})
export class AxDialogTitleDirective {
  readonly id = `ax-dialog-title-${_uid++}`;
}

/**
 * Marks the dialog/sheet description element and gives it a stable id so the
 * container can wire `aria-describedby` to it when present.
 *
 * @example <p axDialogDescription>This can't be undone.</p>
 */
@Directive({
  selector: '[axDialogDescription]',
  host: { '[id]': 'id' },
})
export class AxDialogDescriptionDirective {
  readonly id = `ax-dialog-description-${_uid++}`;
}
