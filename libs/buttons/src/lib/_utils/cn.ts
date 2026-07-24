/**
 * cn() — class composition helper.
 *
 * Canonical implementation, re-exported by every category lib.
 * Built on clsx (for conditional joining) + tailwind-merge (for
 * deduplicating conflicting Tailwind utility classes).
 *
 * Usage:
 *   cn(buttonVariants({ variant: 'primary' }), userClass)
 *
 * If user passes `bg-red-500` and the component has `bg-primary`,
 * tailwind-merge drops `bg-primary` so the user's class wins.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
