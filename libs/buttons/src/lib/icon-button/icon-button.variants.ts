/**
 * IconButton variants.
 *
 * Reuses the Button's `variant` axis (visual style) and adds a `shape`
 * axis (square vs. circle). Size is interpreted as the icon button's
 * bounding box — width === height === size height, padding is 0.
 *
 * Density / trust tier cascade from @theme tokens, not from inputs.
 */

import { cva, type VariantProps } from 'class-variance-authority';

export const iconButtonVariants = cva(
  [
    'inline-flex items-center justify-center shrink-0',
    'font-medium select-none',
    // Motion: token-driven timing + subtle press feedback (see docs/conventions/motion.md).
    'cursor-pointer',
    'transition-[color,background-color,border-color,transform] duration-[var(--duration-fast)] ease-out-quart',
    'active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    'rounded-[var(--radius-button)]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90',
        ghost:
          'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95',
      },
      size: {
        // Touch target (S3): expand pressable area to ≥44px via invisible hit-slop (visual size unchanged).
        sm: "relative h-7 w-7 before:absolute before:inset-[-8px] before:content-['']",
        md: "relative h-9 w-9 before:absolute before:inset-[-4px] before:content-['']",
        lg: 'h-11 w-11',
      },
      shape: {
        square: '',
        circle: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
      shape: 'square',
    },
  }
);

export type IconButtonVariants = VariantProps<typeof iconButtonVariants>;
export type IconButtonVariant = NonNullable<IconButtonVariants['variant']>;
export type IconButtonSize = NonNullable<IconButtonVariants['size']>;
export type IconButtonShape = NonNullable<IconButtonVariants['shape']>;
