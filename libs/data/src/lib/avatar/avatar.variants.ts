import { cva, type VariantProps } from 'class-variance-authority';

export const avatarVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
    'rounded-full bg-muted text-muted-foreground select-none',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

export type AvatarVariants = VariantProps<typeof avatarVariants>;
export type AvatarSize = NonNullable<AvatarVariants['size']>;
