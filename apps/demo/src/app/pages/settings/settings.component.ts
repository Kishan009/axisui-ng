import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AxButtonComponent } from '@axisui-ng/buttons';
import { AxAlertComponent, ToastService } from '@axisui-ng/feedback';
import {
  AxInputComponent,
  AxSwitchComponent,
  AxTagInputComponent,
  AxTextareaComponent,
  AxUploadComponent,
  type UploadFn,
} from '@axisui-ng/forms';
import {
  AxBreadcrumbComponent,
  AxBreadcrumbItemComponent,
} from '@axisui-ng/navigation';
import { AxClusterDirective, AxStackDirective } from '@axisui-ng/primitives';
import type { DensityMode, PresetName, TrustTier } from '@axisui-ng/themes';

import { DemoLayoutService } from '../../layout/layout.service';

@Component({
  selector: 'demo-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AxButtonComponent,
    AxInputComponent,
    AxSwitchComponent,
    AxTextareaComponent,
    AxTagInputComponent,
    AxUploadComponent,
    AxAlertComponent,
    AxBreadcrumbComponent,
    AxBreadcrumbItemComponent,
    AxStackDirective,
    AxClusterDirective,
  ],
  template: `
    <div axStack gap="6" class="mx-auto max-w-4xl">
      <ax-breadcrumb>
        <ax-breadcrumb-item><span>Demo</span></ax-breadcrumb-item>
        <ax-breadcrumb-item [current]="true">Settings</ax-breadcrumb-item>
      </ax-breadcrumb>

      <div class="border-b border-border pb-5">
        <h2 class="text-2xl font-semibold tracking-tight text-foreground">Settings</h2>
        <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
          Profile is local mock state. Theme controls call the same
          <code class="text-xs">@axisui-ng/themes</code> helpers as the configurator.
        </p>
      </div>

      <ax-alert variant="info">
        Active preset: <strong>{{ layout.preset() }}</strong>
        · Density: <strong>{{ layout.density() }}</strong>
        · Trust: <strong>{{ layout.trust() }}</strong>
        · Scheme: <strong>{{ layout.dark() ? 'dark' : 'light' }}</strong>
      </ax-alert>

      <div class="demo-surface p-4" axStack gap="4">
        <h3 class="text-sm font-semibold tracking-tight">Profile</h3>
        <div axStack gap="2">
          <label class="text-sm font-medium" for="settings-name">Display name</label>
          <ax-input id="settings-name" [(value)]="displayName" placeholder="Your name" />
        </div>
        <div axStack gap="2">
          <label class="text-sm font-medium" for="settings-email">Email</label>
          <ax-input id="settings-email" type="email" [(value)]="email" placeholder="you@clinic.dev" />
        </div>
        <div axStack gap="2">
          <label class="text-sm font-medium" for="settings-bio">Bio</label>
          <ax-textarea
            id="settings-bio"
            [(value)]="bio"
            [rows]="3"
            placeholder="A short bio…"
            ariaLabel="Bio"
          />
        </div>
        <div axStack gap="2">
          <label class="text-sm font-medium">Skills</label>
          <ax-tag-input [(value)]="skills" placeholder="Add a skill…" [max]="10" ariaLabel="Skills" />
        </div>
        <div axStack gap="2">
          <label class="text-sm font-medium">Avatar</label>
          <ax-upload
            accept="image/*"
            [multiple]="false"
            [maxSize]="2_000_000"
            [uploadFn]="mockUpload"
            ariaLabel="Avatar upload"
          />
        </div>
        <div axCluster gap="3" class="items-center">
          <ax-switch ariaLabel="Product emails" [(checked)]="productEmails" />
          <span class="text-sm text-muted-foreground">Product emails</span>
        </div>
        <ax-button variant="primary" size="sm" (clickEvent)="saveProfile()">Save profile</ax-button>
      </div>

      <div class="demo-surface p-4" axStack gap="4">
        <h3 class="text-sm font-semibold tracking-tight">Appearance shortcuts</h3>
        <div axStack gap="2">
          <p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Density</p>
          <div axCluster gap="2">
            <ax-button
              size="sm"
              [variant]="layout.density() === 'comfortable' ? 'primary' : 'outline'"
              (clickEvent)="setDensity('comfortable')"
            >
              Comfortable
            </ax-button>
            <ax-button
              size="sm"
              [variant]="layout.density() === 'compact' ? 'primary' : 'outline'"
              (clickEvent)="setDensity('compact')"
            >
              Compact
            </ax-button>
          </div>
        </div>
        <div axStack gap="2">
          <p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Trust tier</p>
          <div axCluster gap="2" class="flex-wrap">
            @for (tier of trustTiers; track tier) {
              <ax-button
                size="sm"
                [variant]="layout.trust() === tier ? 'primary' : 'outline'"
                (clickEvent)="setTrust(tier)"
              >
                {{ tier }}
              </ax-button>
            }
          </div>
          <p class="text-xs text-muted-foreground">
            Regulated mode sets <code class="text-xs">data-trust</code> and limits decorative motion.
          </p>
        </div>
        <div axStack gap="2">
          <p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Quick presets</p>
          <div axCluster gap="2" class="flex-wrap">
            @for (p of quickPresets; track p) {
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
        <ax-button variant="outline" size="sm" (clickEvent)="layout.openConfigurator()">
          Open full theme panel
        </ax-button>
      </div>

    </div>
  `,
})
export class SettingsPageComponent {
  readonly layout = inject(DemoLayoutService);
  private readonly toast = inject(ToastService);

  readonly displayName = signal('Jordan Doe');
  readonly email = signal('jordan@example.com');
  readonly bio = signal('Product designer exploring token-first Angular shells.');
  readonly skills = signal<string[]>(['Design systems', 'Angular', 'OKLCH']);
  readonly productEmails = signal(true);

  readonly quickPresets: PresetName[] = ['blue', 'violet', 'banking', 'healthcare', 'zinc'];
  readonly trustTiers: TrustTier[] = ['minimal', 'standard', 'regulated'];

  /** Demo-only scoped tokens — violet accent isolated to the profile preview card. */
  readonly profileScopeTokens = signal<Record<string, string>>({
    '--primary': 'oklch(0.55 0.22 295)',
    '--primary-foreground': 'oklch(0.98 0.01 295)',
  });

  readonly mockUpload: UploadFn = (_file, onProgress, signal) =>
    new Promise((resolve, reject) => {
      let p = 0;
      const id = setInterval(() => {
        if (signal.aborted) {
          clearInterval(id);
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        p = Math.min(100, p + 25);
        onProgress(p);
        if (p >= 100) {
          clearInterval(id);
          resolve();
        }
      }, 100);
    });

  setDensity(density: DensityMode): void {
    this.layout.setDensity(density);
  }

  setTrust(tier: TrustTier): void {
    this.layout.setTrust(tier);
  }

  saveProfile(): void {
    this.toast.show({
      title: 'Profile saved',
      description: `${this.displayName()} · ${this.skills().length} skills`,
      variant: 'success',
    });
  }
}
