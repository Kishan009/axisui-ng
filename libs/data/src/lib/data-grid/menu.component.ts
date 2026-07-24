import { DOCUMENT } from '@angular/common';
import {
  afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, input, OnDestroy, output,
  Renderer2, RendererStyleFlags2, viewChild,
} from '@angular/core';

import { clampMenuPosition, type GridMenuItem } from './menu-core';

/**
 * Inline floating menu used by both the column-header menu and the row/cell context menu.
 * Positions itself at (x,y) with viewport-edge clamping, roving keyboard focus, and
 * outside-click / scroll / resize dismissal. No overlay-library dependency.
 */
@Component({
  selector: 'ax-data-grid-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <ul
      #menu
      role="menu"
      tabindex="-1"
      class="fixed z-50 min-w-40 rounded-[var(--radius-field)] border border-border bg-popover p-1 text-sm shadow-md start-[var(--dg-menu-x)] top-[var(--dg-menu-y)]"
      (keydown)="onKeydown($event)"
    >
      @for (item of items(); track item.id) {
        @if (item.separatorBefore) { <li role="separator" class="my-1 border-t border-border"></li> }
        <li role="none">
          <button
            type="button"
            role="menuitem"
            [attr.data-menu-item]="item.id"
            [attr.aria-disabled]="item.disabled ? true : null"
            [disabled]="item.disabled"
            [attr.tabindex]="item.disabled ? null : -1"
            class="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1 text-start hover:bg-muted disabled:opacity-50"
            [class.text-destructive]="item.danger"
            (click)="pick(item)"
          >
            <span>{{ item.label }}</span>
          </button>
        </li>
      }
    </ul>
  `,
})
export class AxDataGridMenuComponent implements OnDestroy {
  readonly items = input.required<GridMenuItem[]>();
  readonly x = input.required<number>();
  readonly y = input.required<number>();
  // Public API named to mirror native menu semantics; DOM-event name collision is intentional.
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly select = output<string>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly close = output<void>();

  private readonly doc = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly menuRef = viewChild.required<ElementRef<HTMLUListElement>>('menu');
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;
  private teardown: Array<() => void> = [];

  constructor() {
    afterNextRender(() => {
      this.position();
      this.focusFirst();
      const dismiss = (): void => this.close.emit();
      // Defer document/scroll/resize listeners so the opening click itself doesn't close us.
      this.teardown.push(this.renderer.listen(this.doc, 'click', (e: Event) => this.onDocClick(e)));
      this.teardown.push(this.renderer.listen(this.doc.defaultView, 'resize', dismiss));
      this.teardown.push(this.renderer.listen(this.doc.defaultView, 'scroll', dismiss));
    });
  }

  ngOnDestroy(): void {
    for (const off of this.teardown) off();
    this.teardown = [];
  }

  private enabled(): HTMLButtonElement[] {
    return Array.from(this.menuRef().nativeElement.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])'));
  }

  private focusFirst(): void {
    this.enabled()[0]?.focus();
  }

  private position(): void {
    const el = this.menuRef().nativeElement;
    const rect = el.getBoundingClientRect();
    const root = this.doc.documentElement;
    const p = clampMenuPosition(
      { x: this.x(), y: this.y() },
      { width: rect.width, height: rect.height },
      { width: root.clientWidth, height: root.clientHeight },
    );
    this.renderer.setStyle(el, '--dg-menu-x', `${p.x}px`, RendererStyleFlags2.DashCase);
    this.renderer.setStyle(el, '--dg-menu-y', `${p.y}px`, RendererStyleFlags2.DashCase);
  }

  private onDocClick(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close.emit();
  }

  protected pick(item: GridMenuItem): void {
    if (item.disabled) return;
    this.select.emit(item.id);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.enabled();
    if (items.length === 0) return;
    const active = this.doc.activeElement as HTMLElement | null;
    const idx = items.findIndex((el) => el === active);
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); items[(idx + 1 + items.length) % items.length]?.focus(); break;
      case 'ArrowUp': event.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); break;
      case 'Home': event.preventDefault(); items[0]?.focus(); break;
      case 'End': event.preventDefault(); items[items.length - 1]?.focus(); break;
      case 'Enter':
      case ' ':
      case 'Spacebar': event.preventDefault(); items[idx === -1 ? 0 : idx]?.click(); break;
      case 'Escape': event.preventDefault(); this.close.emit(); break;
      default: break;
    }
  }
}
