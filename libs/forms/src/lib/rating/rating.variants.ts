import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Rating variants. The `variant` controls the *filled* star colour (the
 * filled overlay inherits the host's `currentColor`); the empty base star is
 * always a muted outline. `size` controls the inter-star gap — the star pixel
 * size is resolved separately in the component (`px()`), since icon size is a
 * numeric input, not a class.
 *
 * Density / trust tier / industry cascade from the @theme tokens — NOT inputs.
 */
export const ratingVariants = cva('inline-flex items-center leading-none', {
  variants: {
    variant: {
      default: 'text-primary',
      warning: 'text-warning',
      muted: 'text-muted-foreground',
    },
    size: {
      sm: 'gap-0.5',
      md: 'gap-1',
      lg: 'gap-1.5',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export type RatingVariants = VariantProps<typeof ratingVariants>;
export type RatingVariant = NonNullable<RatingVariants['variant']>;
export type RatingSize = NonNullable<RatingVariants['size']>;
