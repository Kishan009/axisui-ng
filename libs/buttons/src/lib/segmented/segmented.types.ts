/**
 * Public types for Segmented.
 */
export type { SegmentedSize, SegmentedVariants } from './segmented.variants';

/** One option in a segmented control. */
export interface SegmentedOption {
  /** Visible label. */
  label: string;
  /** The value emitted when this segment is selected. */
  value: string;
  /** Disable just this segment. @default false */
  disabled?: boolean;
}
