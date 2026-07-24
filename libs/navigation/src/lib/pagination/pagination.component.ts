import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';
import { cn } from '../_utils/cn';
import { pageList, type PageToken } from './page-list';

/**
 * Pagination — first/prev, numbered pages with ellipsis, next/last.
 *
 * @example <ax-pagination [(page)]="page" [total]="200" [pageSize]="10" />
 */
@Component({
  selector: 'ax-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: { role: 'navigation', 'aria-label': 'Pagination' },
  template: `
    <ul class="flex items-center gap-1">
      <li>
        <button type="button" [class]="navClasses" aria-label="First page" [disabled]="page() === 1" (click)="go(1)">
          <ax-icon name="chevron-left" [size]="16" /><ax-icon name="chevron-left" [size]="16" class="-ms-3" />
        </button>
      </li>
      <li>
        <button type="button" [class]="navClasses" aria-label="Previous page" [disabled]="page() === 1" (click)="go(page() - 1)">
          <ax-icon name="chevron-left" [size]="16" />
        </button>
      </li>
      @for (token of tokens(); track $index) {
        <li>
          @if (token === 'ellipsis') {
            <span class="px-2 text-muted-foreground" aria-hidden="true">…</span>
          } @else {
            <button
              type="button"
              [class]="pageClasses(token === page())"
              [attr.aria-current]="token === page() ? 'page' : null"
              [attr.aria-label]="'Page ' + token"
              (click)="go(token)"
            >{{ token }}</button>
          }
        </li>
      }
      <li>
        <button type="button" [class]="navClasses" aria-label="Next page" [disabled]="page() === pageCount()" (click)="go(page() + 1)">
          <ax-icon name="chevron-right" [size]="16" />
        </button>
      </li>
      <li>
        <button type="button" [class]="navClasses" aria-label="Last page" [disabled]="page() === pageCount()" (click)="go(pageCount())">
          <ax-icon name="chevron-right" [size]="16" /><ax-icon name="chevron-right" [size]="16" class="-ms-3" />
        </button>
      </li>
    </ul>
  `,
})
export class AxPaginationComponent {
  /** Current 1-based page (two-way). @default 1 */
  readonly page = model<number>(1);
  /** Total item count. */
  readonly total = input.required<number>();
  /** Items per page. @default 10 */
  readonly pageSize = input<number>(10);
  /** Pages shown either side of the current page. @default 1 */
  readonly siblingCount = input<number>(1);
  /** Emitted when the user navigates to a different page. */
  readonly pageChange = output<number>();

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly tokens = computed<PageToken[]>(() => pageList(this.page(), this.pageCount(), this.siblingCount()));

  protected readonly navClasses = cn(
    'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--radius-button)]',
    'text-sm transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart active:scale-[0.98]',
    'hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  );

  protected pageClasses(active: boolean): string {
    return cn(
      'inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-[var(--radius-button)] px-3 text-sm',
      'transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart active:scale-[0.98]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground',
    );
  }

  protected go(target: number): void {
    const clamped = Math.max(1, Math.min(target, this.pageCount()));
    if (clamped === this.page()) return;
    this.page.set(clamped);
    this.pageChange.emit(clamped);
  }
}
