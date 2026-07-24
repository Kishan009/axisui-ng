import { cva, type VariantProps } from 'class-variance-authority';

export const progressTrackVariants = cva(
  'relative w-full overflow-hidden rounded-full bg-muted',
  {
    variants: {
      size: { sm: 'h-1', md: 'h-2', lg: 'h-3' },
    },
    defaultVariants: { size: 'md' },
  }
);

export type ProgressVariants = VariantProps<typeof progressTrackVariants>;
export type ProgressSize = NonNullable<ProgressVariants['size']>;
