/**
 * Input variants — the canonical cva pattern for form fields.
 * Reused by Textarea and Select with size-only differences.
 */

import { cva, type VariantProps } from 'class-variance-authority';

export const inputVariants = cva(
  [
    'block w-full',
    'bg-background text-foreground',
    'border border-input rounded-[var(--radius-field)]',
    'placeholder:text-muted-foreground',
    // Motion: smooth the focus ring + error border (token-driven).
    'transition-[color,border-color,box-shadow] duration-[var(--duration-fast)] ease-out-quart',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-9 px-3 text-sm',
        lg: 'h-11 px-4 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export type InputVariants = VariantProps<typeof inputVariants>;
export type InputSize = NonNullable<InputVariants['size']>;
