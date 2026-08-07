import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  receiptOutline,
  addCircleOutline,
  logOutOutline,
  searchOutline,
  notificationsOutline,
  calendarOutline,
  walletOutline,
  cashOutline,
  trendingUpOutline,
  trendingDownOutline,
  fastFoodOutline,
  laptopOutline,
  carOutline,
  bagHandleOutline,
  filmOutline,
  chevronDownOutline
} from 'ionicons/icons';
import { Chart, registerables } from 'chart.js';
import { TransactionService } from '../../core/services/transaction.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CurrencyService } from '../../core/services/currency.service';
import { Transaction } from '../../core/models/transaction.model';
import { DEFAULT_CATEGORIES, Category } from '../../core/models/category.model';
import { User } from '../../core/models/user.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonIcon
  ]
})

export class DashboardPage implements OnInit, AfterViewInit {
  @ViewChild('lineCanvas') lineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutCanvas') doughnutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;

  currentUser: User | null = null;
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  categories: Category[] = DEFAULT_CATEGORIES;

  searchQuery = '';
  selectedCategoryFilter = 'all';
  selectedTypeFilter: 'all' | 'income' | 'expense' = 'all';

  totalBalance = 0;
  totalIncome = 0;
  totalExpense = 0;
  thisMonthTotal = 0;
  categoryBreakdown: { category: Category; amount: number; percentage: number }[] = [];

  lineChart: Chart | null = null;
  doughnutChart: Chart | null = null;
  barChart: Chart | null = null;

  activeNav = 'dashboard';

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService,
    private toastService: ToastService,
    private currencyService: CurrencyService,
    private router: Router
  ) {
    addIcons({
      gridOutline,
      receiptOutline,
      addCircleOutline,
      logOutOutline,
      searchOutline,
      notificationsOutline,
      calendarOutline,
      walletOutline,
      cashOutline,
      trendingUpOutline,
      trendingDownOutline,
      fastFoodOutline,
      laptopOutline,
      carOutline,
      bagHandleOutline,
      filmOutline,
      chevronDownOutline
    });

  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.transactionService.transactions$.subscribe((txs) => {
      this.transactions = txs;
      this.applyFilters();
      this.recalculateStats();
      this.updateCharts();
    });

    this.currencyService.getExchangeRates().subscribe();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.renderCharts();
    }, 200);
  }

  setActiveNav(nav: string): void {
    this.activeNav = nav;
  }

  recalculateStats(): void {
    this.totalBalance = this.transactionService.getTotalBalance(this.transactions);
    this.totalIncome = this.transactionService.getTotalIncome(this.transactions);
    this.totalExpense = this.transactionService.getTotalExpense(this.transactions);
    this.thisMonthTotal = this.transactionService.getThisMonthTotal(this.transactions);
    this.categoryBreakdown = this.transactionService.getCategoryBreakdown(this.transactions);
  }

  applyFilters(): void {
    this.filteredTransactions = this.transactionService.filterTransactions(this.transactions, {
      searchQuery: this.searchQuery,
      type: this.selectedTypeFilter,
      categoryId: this.selectedCategoryFilter
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.toastService.show('Logged out successfully.', 'info');
    this.router.navigate(['/login']);
  }

  private renderCharts(): void {
    this.renderLineChart();
    this.renderDoughnutChart();
    this.renderBarChart();
  }

  private updateCharts(): void {
    if (!this.lineChart || !this.doughnutChart || !this.barChart) return;

    const labels = this.categoryBreakdown.map((b) => b.category.name);
    const data = this.categoryBreakdown.map((b) => b.amount);
    const colors = this.categoryBreakdown.map((b) => b.category.color);

    this.doughnutChart.data.labels = labels.length ? labels : ['No Expenses'];
    this.doughnutChart.data.datasets[0].data = data.length ? data : [1];
    this.doughnutChart.data.datasets[0].backgroundColor = colors.length ? colors : ['#cbd5e1'];
    this.doughnutChart.update();
  }

  private renderLineChart(): void {
    if (!this.lineCanvas) return;
    const ctx = this.lineCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Income',
            data: [3200, 3500, 4100, 3800, 4500, 4200, 4800, 5100, 4900, 5300, 5200, 5600],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Expenses',
            data: [2100, 2300, 1900, 2500, 2200, 2700, 2400, 2900, 2600, 2800, 3100, 2950],
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f1f5f9' } }
        }
      }
    });
  }

  private renderDoughnutChart(): void {
    if (!this.doughnutCanvas) return;
    const ctx = this.doughnutCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.categoryBreakdown.map((b) => b.category.name);
    const data = this.categoryBreakdown.map((b) => b.amount);
    const colors = this.categoryBreakdown.map((b) => b.category.color);

    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [
          {
            data: data.length ? data : [1],
            backgroundColor: colors.length ? colors : ['#cbd5e1'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  private renderBarChart(): void {
    if (!this.barCanvas) return;
    const ctx = this.barCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Income',
            data: [3200, 3500, 4100, 3800, 4500, 4200, 4800, 5100, 4900, 5300, 5200, 5600],
            backgroundColor: '#10b981',
            borderRadius: 4
          },
          {
            label: 'Expenses',
            data: [2100, 2300, 1900, 2500, 2200, 2700, 2400, 2900, 2600, 2800, 3100, 2950],
            backgroundColor: '#4f46e5',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f1f5f9' } }
        }
      }
    });
  }
}
