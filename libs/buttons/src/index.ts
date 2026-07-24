/**
 * @axisui-ng/buttons — Public API barrel.
 * Re-exports the Button component + utils (cn) used across the library.
 *
 * Consumers:
 *   import { AxButtonComponent } from '@axisui-ng/buttons';
 *   import { cn } from '@axisui-ng/buttons';
 */

export * from './lib/button';
export * from './lib/icon-button';
export * from './lib/button-group';
export * from './lib/toggle';
export * from './lib/toggle-group';
export * from './lib/segmented';
export { cn } from './lib/_utils/cn';
export { AxButtonLeadingDirective, AxButtonTrailingDirective } from './lib/_utils/icon-slot.directive';
