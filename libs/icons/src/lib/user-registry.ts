/**
 * User-extensible icon registry.
 *
 * Consumers can register third-party icon components under a local
 * alias, and they become usable as if they were first-party:
 *
 *   registerIcon('my-sparkle', () => import('third-party/sparkle').then(m => m.SparkleIcon));
 *   // <ax-icon name="my-sparkle" />
 *
 * The registry holds lazy loaders so the third-party component code
 * is only fetched on first use.
 */

import { FALLBACK_ICON_NAME, type AxIconName } from './registry';

type IconLoader = () => Promise<unknown>;

const userRegistry = new Map<string, IconLoader>();

/** Register a third-party icon component under a local name. */
export function registerIcon(name: string, loader: IconLoader): void {
  userRegistry.set(name, loader);
}

/** Check whether a name is a registered first-party icon. */
export function isFirstPartyIcon(name: string): name is AxIconName {
  // The const-asserted registry's keys are the canonical names.
  // We avoid importing the registry keys directly to keep the user
  // registry decoupled from the first-party list (so re-exports of
  // subsets of icons work).
  return /^[a-z][a-z0-9-]*$/.test(name);
}

/** Get a loader for a user-registered icon (or null). */
export function getUserIconLoader(name: string): IconLoader | null {
  return userRegistry.get(name) ?? null;
}

/** Reset the user registry (for tests). */
export function _resetUserRegistry(): void {
  userRegistry.clear();
}

/** Number of registered first-party + user icons. */
export function iconRegistrySize(): number {
  return userRegistry.size;
}

/** Re-export the default name for ergonomics. */
export { FALLBACK_ICON_NAME };
export type { AxIconName };
