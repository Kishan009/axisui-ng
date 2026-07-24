/**
 * cn() — class composition helper.
 *
 * Copy of libs/buttons/src/lib/_utils/cn.ts. See the notes there.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
