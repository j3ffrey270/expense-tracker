import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, personCircleOutline, walletOutline } from 'ionicons/icons';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { User } from '../core/models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent
  ]
})
export class HomePage implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {
    addIcons({ logOutOutline, personCircleOutline, walletOutline });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.toastService.show('Logged out successfully.', 'primary');
    this.router.navigate(['/login']);
  }
}
