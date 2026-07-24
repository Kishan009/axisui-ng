export type ToastVariant = 'default' | 'success' | 'warning' | 'destructive';

export type ToastPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

export interface ToastConfig {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss after this many ms. 0 = sticky. @default 5000 */
  duration?: number;
  dismissible?: boolean;
}

export interface Toast {
  readonly id: number;
  readonly title: string;
  readonly description?: string;
  readonly variant: ToastVariant;
  readonly dismissible: boolean;
}

export interface ToastRef {
  dismiss(): void;
}
