import { Directive, effect, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AxTabsComponent } from './tabs.component';

/**
 * RouterTabs — optional directive that two-way binds a <ax-tabs> active value
 * to a URL query parameter. Import only when Router is present.
 *
 * @example <ax-tabs axRouterTabs queryParam="tab">…</ax-tabs>
 */
@Directive({
  selector: 'ax-tabs[axRouterTabs]',
  standalone: true,
})
export class AxRouterTabsDirective {
  private readonly tabs = inject(AxTabsComponent, { self: true });
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Name of the query param to bind. @default 'tab' */
  readonly queryParam = input<string>('tab', { alias: 'axRouterTabs' });

  constructor() {
    // URL → tabs: seed from the current snapshot.
    const initial = this.route.snapshot.queryParamMap.get(this.queryParam());
    if (initial) this.tabs.value.set(initial);

    // tabs → URL: write the active value back as a query param.
    effect(() => {
      const value = this.tabs.value();
      if (value == null) return;
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { [this.queryParam()]: value },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }
}
