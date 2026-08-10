import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  receiptOutline,
  pricetagsOutline,
  addCircleOutline,
  walletOutline,
  chevronDownOutline,
  logOutOutline,
  sunnyOutline,
  moonOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { User } from '../../core/models/user.model';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonIcon
  ]
})
export class MainLayoutComponent implements OnInit {
  currentUser: User | null = null;
  activeRoute = 'dashboard';
  pageTitle = 'Dashboard';
  pageSubtitle = 'Welcome back!';
  isDarkMode = false;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private themeService: ThemeService,
    private router: Router
  ) {
    addIcons({
      gridOutline,
      receiptOutline,
      pricetagsOutline,
      addCircleOutline,
      walletOutline,
      chevronDownOutline,
      logOutOutline,
      sunnyOutline,
      moonOutline
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.updateHeaderTitles();
    });

    this.themeService.darkMode$.subscribe((dark) => {
      this.isDarkMode = dark;
    });

    this.updateActiveRouteFromUrl(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveRouteFromUrl(event.urlAfterRedirects || event.url);
      });
  }

  async toggleTheme(): Promise<void> {
    const isDark = await this.themeService.toggleDarkMode();
    const modeName = isDark ? 'Dark Mode' : 'Light Mode';
    await this.toastService.show(`${modeName} activated`, 'info');
  }

  private updateActiveRouteFromUrl(url: string): void {
    if (url.includes('/transactions')) {
      this.activeRoute = 'transactions';
      this.pageTitle = 'Transactions';
      this.pageSubtitle = 'Manage your all transactions';
    } else if (url.includes('/categories')) {
      this.activeRoute = 'categories';
      this.pageTitle = 'Manage Categories';
      this.pageSubtitle = 'Create, view and manage income & expense categories';
    } else if (url.includes('/add-transaction')) {
      this.activeRoute = 'add-transaction';
      this.pageTitle = 'Add Transaction';
      this.pageSubtitle = 'Add new Income or expense';
    } else if (url.includes('/edit-transaction')) {
      this.activeRoute = 'transactions';
      this.pageTitle = 'Edit Transaction';
      this.pageSubtitle = 'Update transaction details';
    } else {
      this.activeRoute = 'dashboard';
      this.pageTitle = 'Dashboard';
      this.updateHeaderTitles();
    }
  }

  private updateHeaderTitles(): void {
    if (this.activeRoute === 'dashboard') {
      const name = this.currentUser?.name || 'John';
      this.pageSubtitle = `Welcome back, ${name}! 👋`;
    }
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.toastService.show('Logged out successfully.', 'info');
    this.router.navigate(['/login']);
  }
}
