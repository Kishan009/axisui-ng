import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AxButtonComponent } from '@axisui-ng/buttons';
import { AxSeparatorComponent } from '@axisui-ng/misc';
import { AxSheetComponent } from '@axisui-ng/overlays';
import { AxClusterDirective, AxStackDirective } from '@axisui-ng/primitives';

import { DemoLayoutService } from './layout.service';

@Component({
  selector: 'demo-configurator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxSheetComponent,
    AxButtonComponent,
    AxClusterDirective,
    AxStackDirective,
    AxSeparatorComponent,
  ],
  template: `
    <ax-sheet
      [open]="layout.configuratorOpen()"
      (openChange)="onOpenChange($event)"
      side="end"
    >
      <div axStack gap="4" class="w-[min(100vw,22rem)] p-4">
        <div>
          <h2 class="text-base font-semibold">Theme</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            These controls call <code class="text-xs">@axisui-ng/themes</code> helpers.
            Components re-theme through tokens — not per-component CSS.
          </p>
        </div>

        <ax-separator />

        <div axStack gap="2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Color scheme
          </h3>
          <div axCluster gap="2">
            <ax-button
              size="sm"
              [variant]="layout.dark() ? 'outline' : 'primary'"
              (clickEvent)="layout.setDark(false)"
            >
              Light
            </ax-button>
            <ax-button
              size="sm"
              [variant]="layout.dark() ? 'primary' : 'outline'"
              (clickEvent)="layout.setDark(true)"
            >
              Dark
            </ax-button>
          </div>
        </div>

        <div axStack gap="2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Density
          </h3>
          <div axCluster gap="2">
            <ax-button
              size="sm"
              [variant]="layout.density() === 'comfortable' ? 'primary' : 'outline'"
              (clickEvent)="layout.setDensity('comfortable')"
            >
              Comfortable
            </ax-button>
            <ax-button
              size="sm"
              [variant]="layout.density() === 'compact' ? 'primary' : 'outline'"
              (clickEvent)="layout.setDensity('compact')"
            >
              Compact
            </ax-button>
          </div>
        </div>

        <div axStack gap="2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Preset
          </h3>
          <div axCluster gap="2" class="flex-wrap">
            @for (p of layout.presets; track p) {
              <ax-button
                size="sm"
                [variant]="layout.preset() === p ? 'primary' : 'outline'"
                (clickEvent)="layout.setPreset(p)"
              >
                {{ p }}
              </ax-button>
            }
          </div>
        </div>
      </div>
    </ax-sheet>
  `,
})
export class DemoConfiguratorComponent {
  readonly layout = inject(DemoLayoutService);

  onOpenChange(open: boolean): void {
    if (open) this.layout.openConfigurator();
    else this.layout.closeConfigurator();
  }
}
