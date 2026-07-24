import { cva, type VariantProps } from 'class-variance-authority';

export const alertVariants = cva(
  'relative flex gap-3 rounded-[var(--radius-card)] border p-4',
  {
    variants: {
      // Severity is carried by the full tinted border + soft fill + icon —
      // never a side-stripe accent border (a banned pattern). See docs/UI-UX-AUDIT.md.
      variant: {
        info: 'border-info/30 bg-info/10 text-foreground',
        success: 'border-success/30 bg-success/10 text-foreground',
        warning: 'border-warning/30 bg-warning/10 text-foreground',
        destructive: 'border-destructive/30 bg-destructive/10 text-foreground',
      },
    },
    defaultVariants: { variant: 'info' },
  }
);

export type AlertVariants = VariantProps<typeof alertVariants>;
export type AlertVariant = NonNullable<AlertVariants['variant']>;
