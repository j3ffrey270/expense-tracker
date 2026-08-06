import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Toast } from '@capacitor/toast';
import { ToastConfig, ToastType } from '../models/toast.model';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastConfig[]>([]);
  public toasts$: Observable<ToastConfig[]> = this.toastsSubject.asObservable();

  show(
    titleOrConfig: string | Partial<ToastConfig>,
    type: ToastType = 'info',
    message?: string,
    actionText?: string,
    onAction?: () => void
  ): void {
    let config: ToastConfig;

    if (typeof titleOrConfig === 'string') {
      let derivedTitle = 'Notification';
      if (type === 'success') derivedTitle = 'Success!';
      if (type === 'error') derivedTitle = 'Error!';
      if (type === 'warning') derivedTitle = 'Warning!';

      config = {
        id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: type === 'info' ? 'Notification' : derivedTitle,
        message: titleOrConfig,
        type: type,
        duration: 3500,
        actionText: actionText,
        onAction: onAction
      };
    } else {
      config = {
        id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: titleOrConfig.title || 'Notification',
        message: titleOrConfig.message || message,
        type: titleOrConfig.type || type,
        duration: titleOrConfig.duration || 3500,
        actionText: titleOrConfig.actionText || actionText,
        onAction: titleOrConfig.onAction || onAction
      };
    }

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, config]);

    this.triggerNativeToast(config.title, config.message);

    if (config.duration && config.duration > 0) {
      setTimeout(() => {
        this.dismiss(config.id);
      }, config.duration);
    }
  }

  dismiss(id: string): void {
    const updated = this.toastsSubject.value.filter((t) => t.id !== id);
    this.toastsSubject.next(updated);
  }

  private async triggerNativeToast(title: string, message?: string): Promise<void> {
    try {
      await Toast.show({
        text: message ? `${title}: ${message}` : title,
        duration: 'short',
        position: 'top'
      });
    } catch {

    }
  }
}
