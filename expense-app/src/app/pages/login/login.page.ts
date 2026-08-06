import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  lockClosedOutline,
  personOutline,
  eyeOutline,
  eyeOffOutline,
  wallet
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonSpinner
  ]
})
export class LoginPage implements OnInit {
  isRegisterMode = false;
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    addIcons({
      mailOutline,
      lockClosedOutline,
      personOutline,
      eyeOutline,
      eyeOffOutline,
      wallet
    });
  }

  async ngOnInit(): Promise<void> {
    const isAuth = await this.authService.isAuthenticated();
    if (isAuth) {
      this.router.navigate(['/home']);
    }
  }

  setMode(registerMode: boolean): void {
    this.isRegisterMode = registerMode;
    this.clearErrors();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async submitForm(): Promise<void> {
    if (!this.email || !this.password) {
      await this.toastService.show('Please fill in all required fields.', 'warning');
      return;
    }

    if (this.isRegisterMode) {
      if (!this.name) {
        await this.toastService.show('Please enter your full name.', 'warning');
        return;
      }
      if (this.password !== this.confirmPassword) {
        await this.toastService.show('Passwords do not match.', 'danger');
        return;
      }
    }

    this.isLoading = true;

    try {
      if (!this.isRegisterMode) {
        const response = await this.authService.login(this.email, this.password);
        if (response.success) {
          await this.toastService.show('Login successful!', 'success');
          this.router.navigate(['/home']);
        } else {
          await this.toastService.show(response.message, 'danger');
        }
      } else {
        const response = await this.authService.register(this.name, this.email, this.password);
        if (response.success) {
          await this.toastService.show('Account created successfully!', 'success');
          this.router.navigate(['/home']);
        } else {
          await this.toastService.show(response.message, 'danger');
        }
      }
    } catch {
      await this.toastService.show('An unexpected error occurred. Please try again.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async onForgotPassword(): Promise<void> {
    await this.toastService.show('Password reset link has been sent to your email address.', 'primary');
  }

  private clearErrors(): void {
    this.name = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
  }
}
