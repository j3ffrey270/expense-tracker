import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
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
  chevronDownOutline,
  arrowDownCircleOutline,
  arrowUpCircleOutline,
  closeCircleOutline
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

  selectedLineTimeRange = 'this_year';
  selectedBarTimeRange = 'this_year';

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
      chevronDownOutline,
      arrowDownCircleOutline,
      arrowUpCircleOutline,
      closeCircleOutline
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
      this.updateAllCharts();
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

  onLineTimeRangeChange(): void {
    this.updateLineChart();
  }

  onBarTimeRangeChange(): void {
    this.updateBarChart();
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.toastService.show('Logged out successfully.', 'info');
    this.router.navigate(['/login']);
  }

  private calculateChartData(range: string): { labels: string[]; income: number[]; expense: number[] } {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (range === 'this_month') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const income = [0, 0, 0, 0];
      const expense = [0, 0, 0, 0];

      this.transactions.forEach((tx) => {
        if (!tx.date) return;
        const d = new Date(tx.date);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          const day = d.getDate();
          let weekIdx = 0;
          if (day > 21) weekIdx = 3;
          else if (day > 14) weekIdx = 2;
          else if (day > 7) weekIdx = 1;

          const amt = Number(tx.amount);
          if (tx.type === 'income') income[weekIdx] += amt;
          else expense[weekIdx] += amt;
        }
      });

      return { labels: weeks, income, expense };
    } else if (range === 'last_6_months') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const labels: string[] = [];
      const income: number[] = [];
      const expense: number[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        labels.push(monthNames[m]);

        let incSum = 0;
        let expSum = 0;
        this.transactions.forEach((tx) => {
          if (!tx.date) return;
          const txD = new Date(tx.date);
          if (txD.getFullYear() === y && txD.getMonth() === m) {
            const amt = Number(tx.amount);
            if (tx.type === 'income') incSum += amt;
            else expSum += amt;
          }
        });
        income.push(incSum);
        expense.push(expSum);
      }

      return { labels, income, expense };
    } else {
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const income = new Array(12).fill(0);
      const expense = new Array(12).fill(0);

      this.transactions.forEach((tx) => {
        if (!tx.date) return;
        const d = new Date(tx.date);
        if (d.getFullYear() === currentYear) {
          const m = d.getMonth();
          const amt = Number(tx.amount);
          if (tx.type === 'income') income[m] += amt;
          else expense[m] += amt;
        }
      });

      return { labels, income, expense };
    }
  }

  private renderCharts(): void {
    this.renderLineChart();
    this.renderDoughnutChart();
    this.renderBarChart();
  }

  private updateAllCharts(): void {
    this.updateDoughnutChart();
    this.updateLineChart();
    this.updateBarChart();
  }

  private updateDoughnutChart(): void {
    if (!this.doughnutChart) return;
    const catLabels = this.categoryBreakdown.map((b) => b.category.name);
    const catData = this.categoryBreakdown.map((b) => b.amount);
    const catColors = this.categoryBreakdown.map((b) => b.category.color);

    this.doughnutChart.data.labels = catLabels.length ? catLabels : ['No Expenses'];
    this.doughnutChart.data.datasets[0].data = catData.length ? catData : [1];
    this.doughnutChart.data.datasets[0].backgroundColor = catColors.length ? catColors : ['#cbd5e1'];
    this.doughnutChart.update();
  }

  private updateLineChart(): void {
    if (!this.lineChart) return;
    const chartData = this.calculateChartData(this.selectedLineTimeRange);
    this.lineChart.data.labels = chartData.labels;
    this.lineChart.data.datasets[0].data = chartData.income;
    this.lineChart.data.datasets[1].data = chartData.expense;
    this.lineChart.update();
  }

  private updateBarChart(): void {
    if (!this.barChart) return;
    const chartData = this.calculateChartData(this.selectedBarTimeRange);
    this.barChart.data.labels = chartData.labels;
    this.barChart.data.datasets[0].data = chartData.income;
    this.barChart.data.datasets[1].data = chartData.expense;
    this.barChart.update();
  }

  private renderLineChart(): void {
    if (!this.lineCanvas) return;
    const ctx = this.lineCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const chartData = this.calculateChartData(this.selectedLineTimeRange);

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Income',
            data: chartData.income,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Expenses',
            data: chartData.expense,
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

    const chartData = this.calculateChartData(this.selectedBarTimeRange);

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Income',
            data: chartData.income,
            backgroundColor: '#10b981',
            borderRadius: 4
          },
          {
            label: 'Expenses',
            data: chartData.expense,
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
