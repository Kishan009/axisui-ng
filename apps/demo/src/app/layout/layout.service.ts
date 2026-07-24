import { Injectable, signal } from '@angular/core';
import {
  PRESET_NAMES,
  getStoredTheme,
  setDarkMode,
  setDensity,
  setIndustry,
  setTrustTier,
  type DensityMode,
  type PresetName,
  type TrustTier,
} from '@axisui-ng/themes';

const PRESET_KEY = 'ui-demo-preset';
const DENSITY_KEY = 'ui-demo-density';
const TRUST_KEY = 'ui-demo-trust';

function readStoredPreset(): PresetName {
  try {
    const v = localStorage.getItem(PRESET_KEY);
    if (v && (PRESET_NAMES as readonly string[]).includes(v)) return v as PresetName;
  } catch {
    /* ignore */
  }
  return 'blue';
}

function readStoredDensity(): DensityMode {
  try {
    const v = localStorage.getItem(DENSITY_KEY);
    if (v === 'compact' || v === 'comfortable' || v === 'default') return v;
  } catch {
    /* ignore */
  }
  return 'comfortable';
}

function readStoredTrust(): TrustTier {
  try {
    const v = localStorage.getItem(TRUST_KEY);
    if (v === 'minimal' || v === 'standard' || v === 'regulated') return v;
  } catch {
    /* ignore */
  }
  return 'standard';
}

@Injectable({ providedIn: 'root' })
export class DemoLayoutService {
  readonly dark = signal(false);
  readonly preset = signal<PresetName>('blue');
  readonly density = signal<DensityMode>('comfortable');
  readonly trust = signal<TrustTier>('standard');
  readonly configuratorOpen = signal(false);
  readonly commandOpen = signal(false);
  /** Whether the nav sidebar is visible. @default true */
  readonly sidebarOpen = signal(true);

  readonly presets = PRESET_NAMES;

  /** Call once from layout after browser render. */
  hydrateFromStorage(): void {
    const stored = getStoredTheme();
    const dark = stored === 'dark';
    this.dark.set(dark);
    setDarkMode(dark, false);

    const preset = readStoredPreset();
    this.preset.set(preset);
    setIndustry(preset);

    const density = readStoredDensity();
    this.density.set(density);
    setDensity(density);

    const trust = readStoredTrust();
    this.trust.set(trust);
    setTrustTier(trust);
  }

  setDark(enabled: boolean): void {
    this.dark.set(enabled);
    setDarkMode(enabled, true);
  }

  toggleDark(): void {
    this.setDark(!this.dark());
  }

  setPreset(preset: PresetName): void {
    this.preset.set(preset);
    setIndustry(preset);
    try {
      localStorage.setItem(PRESET_KEY, preset);
    } catch {
      /* ignore */
    }
  }

  setDensity(density: DensityMode): void {
    this.density.set(density);
    setDensity(density);
    try {
      localStorage.setItem(DENSITY_KEY, density);
    } catch {
      /* ignore */
    }
  }

  setTrust(tier: TrustTier): void {
    this.trust.set(tier);
    setTrustTier(tier);
    try {
      localStorage.setItem(TRUST_KEY, tier);
    } catch {
      /* ignore */
    }
  }

  openConfigurator(): void {
    this.configuratorOpen.set(true);
  }

  closeConfigurator(): void {
    this.configuratorOpen.set(false);
  }

  openCommand(): void {
    this.commandOpen.set(true);
  }

  closeCommand(): void {
    this.commandOpen.set(false);
  }

  toggleCommand(): void {
    this.commandOpen.update((v) => !v);
  }

  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
