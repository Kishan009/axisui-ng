/**
 * TypeScript mirror of the @theme block. Used in component code that needs
 * to read computed values without parsing CSS at runtime (e.g., chart color
 * resolution, programmatic theme application).
 *
 * A unit test asserts that every key here corresponds to a real --* variable
 * in tokens.css. Drift prevention.
 */

export const TOKEN_NAMES = [
  // Background + foreground
  '--color-background',
  '--color-foreground',
  '--color-primary',
  '--color-primary-foreground',
  '--color-primary-hover',
  '--color-secondary',
  '--color-secondary-foreground',
  '--color-muted',
  '--color-muted-foreground',
  '--color-accent',
  '--color-accent-foreground',
  '--color-destructive',
  '--color-destructive-foreground',
  '--color-success',
  '--color-warning',
  '--color-info',
  '--color-border',
  '--color-input',
  '--color-ring',
  '--color-card',
  '--color-card-foreground',
  '--color-popover',
  '--color-popover-foreground',

  // Chart palette
  '--color-chart-1',
  '--color-chart-2',
  '--color-chart-3',
  '--color-chart-4',
  '--color-chart-5',

  // Shape
  '--radius-default',
  '--radius-card',
  '--radius-button',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',

  // Spacing
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--space-8',
  '--space-padding',
  '--height-row',

  // Motion
  '--ease-out-expo',
  '--ease-out-quart',
  '--ease-in-quart',
  '--duration-fast',
  '--duration',
  '--duration-slow',
  '--motion-duration',

  // Type — families
  '--font-sans',
  '--font-mono',
  '--font-family',

  // Type — scale
  '--text-xs',
  '--text-sm',
  '--text-base',
  '--text-lg',
  '--text-xl',
  '--text-2xl',
  '--text-3xl',

  // Type — weights
  '--font-weight-normal',
  '--font-weight-medium',
  '--font-weight-semibold',
  '--font-weight-bold',

  // Type — tracking
  '--tracking-tight',
  '--tracking-normal',
  '--tracking-wide',
] as const;

export type TokenName = (typeof TOKEN_NAMES)[number];

export type PresetName =
  | 'neutral'
  | 'stone'
  | 'zinc'
  | 'blue'
  | 'violet'
  | 'rose'
  | 'banking'
  | 'healthcare'
  | 'automotive'
  | 'logistics'
  | 'government';

export const PRESET_NAMES: readonly PresetName[] = [
  'neutral',
  'stone',
  'zinc',
  'blue',
  'violet',
  'rose',
  'banking',
  'healthcare',
  'automotive',
  'logistics',
  'government',
] as const;

export type IndustryName = Extract<
  PresetName,
  'banking' | 'healthcare' | 'automotive' | 'logistics' | 'government'
>;

export const INDUSTRY_NAMES: readonly IndustryName[] = [
  'banking',
  'healthcare',
  'automotive',
  'logistics',
  'government',
] as const;

export type DensityMode = 'compact' | 'default' | 'comfortable';
export type TrustTier = 'minimal' | 'standard' | 'regulated';
