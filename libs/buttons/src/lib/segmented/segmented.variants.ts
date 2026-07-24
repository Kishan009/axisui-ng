import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Segmented control variants.
 *
 * `segmentedVariants` styles the **track** (the rounded, muted container);
 * `segmentItemVariants` styles each **segment** button, with a `state`
 * (selected vs idle) and matching `size`. Density / trust tier / industry
 * cascade from the @theme tokens — NOT inputs.
 */
export const segmentedVariants = cva(
  'relative inline-flex items-center gap-1 rounded-lg bg-muted p-1 text-foreground/80',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export const segmentItemVariants = cva(
  [
    'relative z-10 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium',
    'cursor-pointer select-none',
    // Motion: property-listed transition + tokens (canonical button pattern); no bare transition-colors.
    'transition-[color,background-color,border-color,transform] duration-[var(--duration-fast)] ease-out-quart',
    'active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'px-2 py-1',
        md: 'px-3 py-1.5',
        lg: 'px-4 py-2',
      },
      state: {
        on: 'text-foreground',
        off: 'text-foreground/80 hover:text-foreground hover:bg-background/50',
      },
    },
    defaultVariants: { size: 'md', state: 'off' },
  }
);

export type SegmentedVariants = VariantProps<typeof segmentedVariants>;
export type SegmentedSize = NonNullable<SegmentedVariants['size']>;
