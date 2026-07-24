import type { AxIconName } from '@axisui-ng/icons';
import type { AlertVariant } from './alert.variants';

/** Default icon per variant. */
export const ALERT_ICON: Record<AlertVariant, AxIconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  destructive: 'x-circle',
};

export type { AlertVariant } from './alert.variants';
