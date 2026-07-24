import { Directive, effect, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AxPaginationComponent } from './pagination.component';

/**
 * Two-way binds <ax-pagination> page to a URL query param.
 *
 * @example <ax-pagination axRouterPagination="p" [total]="200" />
 */
@Directive({ selector: 'ax-pagination[axRouterPagination]', standalone: true })
export class AxRouterPaginationDirective {
  private readonly pagination = inject(AxPaginationComponent, { self: true });
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Query param name. @default 'page' */
  readonly queryParam = input<string>('page', { alias: 'axRouterPagination' });

  constructor() {
    const initial = this.route.snapshot.queryParamMap.get(this.queryParam());
    if (initial) {
      const n = Number(initial);
      if (Number.isFinite(n) && n > 0) this.pagination.page.set(n);
    }
    effect(() => {
      const page = this.pagination.page();
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { [this.queryParam()]: page },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }
}
