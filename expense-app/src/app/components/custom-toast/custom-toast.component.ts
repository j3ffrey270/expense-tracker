import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  closeCircle,
  warning,
  informationCircle,
  closeOutline
} from 'ionicons/icons';
import { ToastService } from '../../core/services/toast.service';
import { ToastConfig } from '../../core/models/toast.model';

@Component({
  selector: 'app-custom-toast',
  templateUrl: './custom-toast.component.html',
  styleUrls: ['./custom-toast.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon]
})
export class CustomToastComponent implements OnInit {
  toasts: ToastConfig[] = [];

  constructor(private toastService: ToastService) {
    addIcons({
      checkmarkCircle,
      closeCircle,
      warning,
      informationCircle,
      closeOutline
    });
  }

  ngOnInit(): void {
    this.toastService.toasts$.subscribe((toasts) => {
      this.toasts = toasts;
    });
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  handleAction(toast: ToastConfig): void {
    if (toast.onAction) {
      toast.onAction();
    }
    this.dismiss(toast.id);
  }

  getToastClass(type: string): string {
    if (type === 'danger') return 'error';
    if (type === 'primary') return 'info';
    return type;
  }

  getIconName(type: string): string {
    const normalized = this.getToastClass(type);
    switch (normalized) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  }
}
