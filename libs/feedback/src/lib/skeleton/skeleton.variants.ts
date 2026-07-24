import { cva, type VariantProps } from 'class-variance-authority';

export const skeletonVariants = cva('block animate-pulse bg-muted motion-reduce:animate-none', {
  variants: {
    variant: {
      text: 'h-4 w-full rounded-[var(--radius-sm)]',
      circle: 'rounded-full',
      rect: 'rounded-[var(--radius-md)]',
    },
  },
  defaultVariants: { variant: 'rect' },
});

export type SkeletonVariants = VariantProps<typeof skeletonVariants>;
export type SkeletonVariant = NonNullable<SkeletonVariants['variant']>;
