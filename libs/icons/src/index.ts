/**
 * @axisui-ng/icons — Public API barrel.
 * First-party icon set (30 hand-designed icons in v0.1).
 *
 * Consumers:
 *   import { AxIconComponent, registerIcon, type AxIconName } from '@axisui-ng/icons';
 *   <ax-icon name="check" />
 */

export { AxIconComponent } from './lib/ax-icon.component';
export { registerIcon, isFirstPartyIcon, getUserIconLoader } from './lib/user-registry';
export { ICON_REGISTRY, FALLBACK_ICON_NAME, type AxIconName } from './lib/registry';
