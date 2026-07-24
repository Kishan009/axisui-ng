import { cva, type VariantProps } from 'class-variance-authority';

export const spinnerVariants = cva(
  // Under prefers-reduced-motion the global floor freezes the spin mid-rotation
  // (a broken arc); stop the animation and close the ring into a full static
  // circle so it still reads as a busy indicator.
  'inline-block animate-spin rounded-full border-current border-e-transparent align-[-0.125em] motion-reduce:animate-none motion-reduce:border-e-current',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-[3px]',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export type SpinnerVariants = VariantProps<typeof spinnerVariants>;
export type SpinnerSize = NonNullable<SpinnerVariants['size']>;
