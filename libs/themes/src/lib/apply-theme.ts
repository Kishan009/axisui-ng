/**
 * Programmatic theme application — writes preset tokens to a scope.
 * Used by the marketing site customizer and for embedded widgets.
 *
 * Browser-only. Wrap calls in afterNextRender() if used in SSR contexts.
 */

import type { PresetName, DensityMode, TrustTier } from './tokens';

/**
 * Sets the industry attribute on the document root. Components in the
 * subtree automatically pick up industry-aware token values via the
 * 4-layer cascade.
 */
export function setIndustry(industry: PresetName | null): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (industry) {
    root.setAttribute('data-industry', industry);
  } else {
    root.removeAttribute('data-industry');
  }
}

/**
 * Sets the density mode on a scope (default = document root).
 */
export function setDensity(density: DensityMode, scope: HTMLElement | null = null): void {
  const target = scope ?? document?.documentElement;
  if (!target) return;
  target.setAttribute('data-density', density);
}

/**
 * Sets the trust tier on a scope. Regulated mode enforces motion limits
 * and hides decorative elements via the [data-decorative] selector.
 */
export function setTrustTier(tier: TrustTier, scope: HTMLElement | null = null): void {
  const target = scope ?? document?.documentElement;
  if (!target) return;
  target.setAttribute('data-trust', tier);
}

/**
 * Toggles dark mode by adding/removing the .dark class on the document root.
 * Persists to localStorage if available.
 */
export function setDarkMode(enabled: boolean, persist = true): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  if (persist && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('ax-theme', enabled ? 'dark' : 'light');
    } catch {
      // ignore quota errors
    }
  }
}

/**
 * Reads the persisted theme preference from localStorage.
 * Returns null if not set or if localStorage is unavailable.
 */
export function getStoredTheme(): 'light' | 'dark' | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const value = localStorage.getItem('ax-theme');
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}
