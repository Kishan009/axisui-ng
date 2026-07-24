/**
 * Toggle variants.
 *
 * Reuses Button's `variant` axis (visual style) and `size` axis
 * (bounding-box). The pressed/active visual state is the variant's
 * primary treatment (background fill), so no separate "pressed"
 * variant is needed.
 *
 * Toggle can be used standalone (a single pressed/unpressed button)
 * or as a child of ToggleGroup (single or multi-select). When nested
 * in a ToggleGroup, the group manages the pressed state and the
 * roving tabindex.
 */

import { cva, type VariantProps } from 'class-variance-authority';

export const toggleVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium whitespace-nowrap select-none',
    'cursor-pointer',
    // Motion: token-driven timing + subtle press feedback (see docs/conventions/motion.md).
    'transition-[color,background-color,border-color,transform] duration-[var(--duration-fast)] ease-out-quart',
    'active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    'rounded-[var(--radius-button)]',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-transparent hover:bg-muted active:bg-muted/80 data-[pressed=true]:bg-accent data-[pressed=true]:text-accent-foreground',
        outline:
          'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground data-[pressed=true]:bg-accent data-[pressed=true]:text-accent-foreground',
        ghost:
          'bg-transparent hover:bg-accent hover:text-accent-foreground data-[pressed=true]:bg-accent data-[pressed=true]:text-accent-foreground',
      },
      size: {
        // Touch target (S3): sm is visually 28px; expand hit area vertically to ≥44px.
        sm: "relative h-7 px-2 text-xs before:absolute before:inset-y-[-8px] before:inset-x-0 before:content-['']",
        md: 'h-9 px-3 text-sm',
        lg: 'h-11 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type ToggleVariants = VariantProps<typeof toggleVariants>;
export type ToggleVariant = NonNullable<ToggleVariants['variant']>;
export type ToggleSize = NonNullable<ToggleVariants['size']>;
