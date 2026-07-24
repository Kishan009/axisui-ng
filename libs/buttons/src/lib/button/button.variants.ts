/**
 * Button variants — the canonical cva pattern reference.
 * Copy this file when adding any variant-driven component.
 *
 * Variant inputs:
 *   - variant: visual style
 *   - size:    height + padding (icon size cascades from this)
 *
 * Density (compact / default / comfortable) and trust tier (regulated)
 * cascade from the @theme tokens — they are NOT inputs to the component.
 */

import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium whitespace-nowrap select-none',
    'cursor-pointer',
    // Motion: token-driven timing (not Tailwind's bare default) + subtle press
    // feedback. Duration uses an arbitrary value referencing the token — Tailwind
    // v4 generates `ease-*` from --ease-* but NOT `duration-*` from --duration-*.
    // The reduced-motion floor in tokens.css neutralizes the scale.
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
        link:
          'text-primary underline-offset-4 hover:underline',
      },
      size: {
        // Touch target (S3): sm is visually 28px; expand hit area vertically to ≥44px.
        sm: "relative h-7 px-2 text-xs before:absolute before:inset-y-[-8px] before:inset-x-0 before:content-['']",
        md: 'h-9 px-3 text-sm',
        lg: 'h-11 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type ButtonVariant = NonNullable<ButtonVariants['variant']>;
export type ButtonSize = NonNullable<ButtonVariants['size']>;
