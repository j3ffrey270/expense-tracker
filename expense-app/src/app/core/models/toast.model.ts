export type ToastType = 'success' | 'error' | 'danger' | 'warning' | 'info' | 'primary';

export interface ToastConfig {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}
