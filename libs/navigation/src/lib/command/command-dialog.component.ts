import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

import { AxDialogComponent } from '@axisui-ng/overlays';
import { AxCommandComponent } from './command.component';
import type { CommandItem } from './command.types';

/**
 * CommandDialog — the modal ⌘K variant: a <ax-command> inside a <ax-dialog>.
 *
 * @example <ax-command-dialog [(open)]="open" [items]="commands" (select)="run($event)" />
 */
@Component({
  selector: 'ax-command-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxDialogComponent, AxCommandComponent],
  template: `
    <ax-dialog [(open)]="open">
      <h2 axDialogTitle class="sr-only">Command palette</h2>
      <ax-command axDialogBody [items]="items()" [placeholder]="placeholder()" (select)="onSelect($event)" />
    </ax-dialog>
  `,
})
export class AxCommandDialogComponent {
  readonly open = model<boolean>(false);
  readonly items = input.required<CommandItem[]>();
  readonly placeholder = input<string>('Type a command…');
  // eslint-disable-next-line @angular-eslint/no-output-native -- `select` is the established public Command API
  readonly select = output<CommandItem>();

  protected onSelect(item: CommandItem): void {
    this.select.emit(item);
    this.open.set(false);
  }
}
