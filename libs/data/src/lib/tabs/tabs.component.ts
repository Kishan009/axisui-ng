import { ChangeDetectionStrategy, Component, forwardRef, model } from '@angular/core';

import { TABS_CONTEXT, type TabsContext } from './tabs.types';

let _tabsId = 0;

/**
 * Tabs — presentational tab container. Provides active value to children via DI.
 *
 * @example
 * <ax-tabs [(value)]="active">
 *   <ax-tabs-list>
 *     <ax-tab-trigger value="a">A</ax-tab-trigger>
 *   </ax-tabs-list>
 *   <ax-tab-panel value="a">…</ax-tab-panel>
 * </ax-tabs>
 */
@Component({
  selector: 'ax-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `<ng-content />`,
  providers: [{ provide: TABS_CONTEXT, useExisting: forwardRef(() => AxTabsComponent) }],
})
export class AxTabsComponent implements TabsContext {
  /** Active tab value. @default null */
  readonly value = model<string | null>(null);

  /** Per-instance prefix so ids stay unique across multiple tab sets on a page. */
  private readonly uid = `ax-tabs-${_tabsId++}`;

  select(next: string): void {
    this.value.set(next);
  }

  tabId(value: string): string {
    return `${this.uid}-tab-${value}`;
  }

  panelId(value: string): string {
    return `${this.uid}-panel-${value}`;
  }
}
