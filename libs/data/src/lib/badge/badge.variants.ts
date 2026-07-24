import { cva, type VariantProps } from 'class-variance-authority';

const VARIANT_KEYS = ['default', 'success', 'warning', 'destructive', 'info', 'outline'] as const;
type VariantKey = (typeof VARIANT_KEYS)[number];

/**
 * Solid fill for each semantic variant (the original badge look).
 */
const SOLID: Record<VariantKey, string> = {
  default: 'border-transparent bg-primary text-primary-foreground',
  success: 'border-transparent bg-success text-primary-foreground',
  warning: 'border-transparent bg-warning text-warning-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground',
  info: 'border-transparent bg-info text-primary-foreground',
  outline: 'border-border text-foreground',
};

/**
 * Soft-tint fill, built from the badge-mix tokens
 * (`--badge-bg-mix` / `--badge-bd-mix` / `--badge-fg-shift`). Light mode darkens
 * the foreground toward the hue for contrast; dark mode keeps it on the hue's
 * light end (the tokens flip under `:root.dark`).
 *
 * These MUST be written as complete literal class strings — Tailwind's scanner
 * only detects classes it can see verbatim in source, so no interpolation.
 * The shared recipe is: bg = mix(color, --badge-bg-mix, card), border =
 * mix(color, --badge-bd-mix, transparent), text = mix(color, foreground @ --badge-fg-shift).
 */
const SOFT: Record<VariantKey, string> = {
  default:
    'bg-[color:color-mix(in_oklch,var(--color-primary)_var(--badge-bg-mix),var(--color-card))] border-[color:color-mix(in_oklch,var(--color-primary)_var(--badge-bd-mix),transparent)] text-[color:color-mix(in_oklch,var(--color-primary),var(--color-foreground)_var(--badge-fg-shift))]',
  success:
    'bg-[color:color-mix(in_oklch,var(--color-success)_var(--badge-bg-mix),var(--color-card))] border-[color:color-mix(in_oklch,var(--color-success)_var(--badge-bd-mix),transparent)] text-[color:color-mix(in_oklch,var(--color-success),var(--color-foreground)_var(--badge-fg-shift))]',
  warning:
    'bg-[color:color-mix(in_oklch,var(--color-warning)_var(--badge-bg-mix),var(--color-card))] border-[color:color-mix(in_oklch,var(--color-warning)_var(--badge-bd-mix),transparent)] text-[color:color-mix(in_oklch,var(--color-warning),var(--color-foreground)_var(--badge-fg-shift))]',
  destructive:
    'bg-[color:color-mix(in_oklch,var(--color-destructive)_var(--badge-bg-mix),var(--color-card))] border-[color:color-mix(in_oklch,var(--color-destructive)_var(--badge-bd-mix),transparent)] text-[color:color-mix(in_oklch,var(--color-destructive),var(--color-foreground)_var(--badge-fg-shift))]',
  info:
    'bg-[color:color-mix(in_oklch,var(--color-info)_var(--badge-bg-mix),var(--color-card))] border-[color:color-mix(in_oklch,var(--color-info)_var(--badge-bd-mix),transparent)] text-[color:color-mix(in_oklch,var(--color-info),var(--color-foreground)_var(--badge-fg-shift))]',
  // `outline` is already a subtle treatment; soft reuses the base outline.
  outline: SOLID['outline'],
};

/**
 * Color styling lives entirely in compound variants (variant × appearance) so a
 * badge only ever emits one fill treatment — no reliance on class-merge order to
 * override a base color.
 */
const colorCompounds = VARIANT_KEYS.flatMap((variant) => [
  { variant, appearance: 'solid' as const, class: SOLID[variant] },
  { variant, appearance: 'soft' as const, class: SOFT[variant] },
]);

export const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 font-medium whitespace-nowrap',
    'rounded-[var(--radius-button)] border',
  ].join(' '),
  {
    variants: {
      variant: {
        default: '',
        success: '',
        warning: '',
        destructive: '',
        info: '',
        outline: '',
      },
      /** Fill style: `solid` is the original look; `soft` is a tinted pill. */
      appearance: {
        solid: '',
        soft: '',
      },
      size: {
        sm: 'h-5 px-2 text-xs',
        md: 'h-6 px-2.5 text-xs',
      },
    },
    compoundVariants: colorCompounds,
    defaultVariants: { variant: 'default', appearance: 'solid', size: 'md' },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
export type BadgeVariant = NonNullable<BadgeVariants['variant']>;
export type BadgeAppearance = NonNullable<BadgeVariants['appearance']>;
export type BadgeSize = NonNullable<BadgeVariants['size']>;
