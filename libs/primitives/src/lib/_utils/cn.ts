/**
 * cn() — class composition helper.
 *
 * Copy of libs/buttons/src/lib/_utils/cn.ts. Identical implementation.
 * Kept duplicated to avoid cross-category imports (which would couple
 * package boundaries). Consolidate into libs/ui/src/lib/utils/cn.ts
 * when an Nx generator exists.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
