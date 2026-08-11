import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  receiptOutline,
  addCircleOutline,
  pricetagsOutline,
  calculatorOutline,
  pieChartOutline,
  ribbonOutline,
  personOutline,
  settingsOutline,
  logOutOutline,
  searchOutline,
  notificationsOutline,
  calendarOutline,
  filterOutline,
  createOutline,
  trashOutline,
  chevronBackOutline,
  chevronForwardOutline,
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
  addOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { TransactionService } from '../../core/services/transaction.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Transaction } from '../../core/models/transaction.model';
import { DEFAULT_CATEGORIES, Category } from '../../core/models/category.model';
import { User } from '../../core/models/user.model';

export interface CalendarDay {
  dayNumber: number;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
}

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonIcon
  ]
})
export class TransactionsPage implements OnInit {
  currentUser: User | null = null;
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  paginatedTransactions: Transaction[] = [];
  categories: Category[] = DEFAULT_CATEGORIES;

  selectedTypeTab: 'all' | 'income' | 'expense' = 'all';
  searchQuery = '';
  selectedCategory = 'all';
  selectedYear = 'all';
  selectedMonth = 'all';
  startDate = '';
  endDate = '';
  showCategoryDropdown = false;

  currentViewDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  quickPreset: string = 'all';
  todayString: string = new Date().toISOString().split('T')[0];
  weekdays: string[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  yearsList: string[] = ['2026', '2025', '2024', '2023'];
  monthsList = [
    { value: 'all', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' }
  ];

  currentPage = 1;
  pageSize = 8;
  totalPages = 1;
  totalPagesArray: number[] = [];

  transactionToDelete: Transaction | null = null;
  showDeleteModal = false;

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {
    addIcons({
      gridOutline,
      receiptOutline,
      addCircleOutline,
      pricetagsOutline,
      calculatorOutline,
      pieChartOutline,
      ribbonOutline,
      personOutline,
      settingsOutline,
      logOutOutline,
      searchOutline,
      notificationsOutline,
      calendarOutline,
      filterOutline,
      createOutline,
      trashOutline,
      chevronBackOutline,
      chevronForwardOutline,
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
      addOutline,
      closeCircleOutline
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.generateCalendarGrid();

    this.transactionService.transactions$.subscribe((txs) => {
      this.transactions = txs;
      this.applyFilters();
    });
  }

  formatDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get currentViewMonthYearLabel(): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[this.currentViewDate.getMonth()]} ${this.currentViewDate.getFullYear()}`;
  }

  generateCalendarGrid(): void {
    const year = this.currentViewDate.getFullYear();
    const month = this.currentViewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: CalendarDay[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, pDay);
      const ds = this.formatDateString(prevDate);
      days.push({
        dayNumber: pDay,
        dateString: ds,
        isCurrentMonth: false,
        isToday: ds === this.todayString,
        isSelected: this.startDate === ds || this.endDate === ds,
        isInRange: this.isDateInRange(ds)
      });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const currDate = new Date(year, month, d);
      const ds = this.formatDateString(currDate);
      days.push({
        dayNumber: d,
        dateString: ds,
        isCurrentMonth: true,
        isToday: ds === this.todayString,
        isSelected: this.startDate === ds || this.endDate === ds,
        isInRange: this.isDateInRange(ds)
      });
    }

    const remainingSlots = 42 - days.length;
    for (let n = 1; n <= remainingSlots; n++) {
      const nextDate = new Date(year, month + 1, n);
      const ds = this.formatDateString(nextDate);
      days.push({
        dayNumber: n,
        dateString: ds,
        isCurrentMonth: false,
        isToday: ds === this.todayString,
        isSelected: this.startDate === ds || this.endDate === ds,
        isInRange: this.isDateInRange(ds)
      });
    }

    this.calendarDays = days;
  }

  isDateInRange(ds: string): boolean {
    if (!this.startDate || !this.endDate) return false;
    return ds >= this.startDate && ds <= this.endDate;
  }

  applyQuickPreset(preset: string): void {
    this.quickPreset = preset;
    const now = new Date();
    const todayStr = this.formatDateString(now);

    if (preset === 'today') {
      this.startDate = todayStr;
      this.endDate = todayStr;
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = this.formatDateString(y);
      this.startDate = yStr;
      this.endDate = yStr;
    } else if (preset === 'last_week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      this.startDate = this.formatDateString(w);
      this.endDate = todayStr;
    } else if (preset === 'this_month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      this.startDate = this.formatDateString(first);
      this.endDate = this.formatDateString(last);
    } else if (preset === 'last_month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      this.startDate = this.formatDateString(first);
      this.endDate = this.formatDateString(last);
    } else if (preset === 'last_3_months') {
      const m3 = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      this.startDate = this.formatDateString(m3);
      this.endDate = todayStr;
    } else if (preset === 'all') {
      this.startDate = '';
      this.endDate = '';
    }

    this.generateCalendarGrid();
    this.currentPage = 1;
    this.applyFilters();
  }

  prevMonth(): void {
    this.currentViewDate = new Date(
      this.currentViewDate.getFullYear(),
      this.currentViewDate.getMonth() - 1,
      1
    );
    this.generateCalendarGrid();
  }

  nextMonth(): void {
    this.currentViewDate = new Date(
      this.currentViewDate.getFullYear(),
      this.currentViewDate.getMonth() + 1,
      1
    );
    this.generateCalendarGrid();
  }

  onCalendarDayClick(day: CalendarDay): void {
    if (!this.startDate || (this.startDate && this.endDate)) {
      this.startDate = day.dateString;
      this.endDate = '';
    } else if (this.startDate && !this.endDate) {
      if (day.dateString < this.startDate) {
        this.endDate = this.startDate;
        this.startDate = day.dateString;
      } else {
        this.endDate = day.dateString;
      }
    }
    this.quickPreset = 'custom';
    this.generateCalendarGrid();
    this.currentPage = 1;
    this.applyFilters();
  }


  selectTypeTab(type: 'all' | 'income' | 'expense'): void {
    this.selectedTypeTab = type;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleFilterDropdown(): void {
    this.showCategoryDropdown = !this.showCategoryDropdown;
  }

  selectCategoryFilter(catId: string): void {
    this.selectedCategory = catId;
    this.showCategoryDropdown = false;
    this.currentPage = 1;
    this.applyFilters();
  }

  onDateFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedCategory = 'all';
    this.selectedYear = 'all';
    this.selectedMonth = 'all';
    this.startDate = '';
    this.endDate = '';
    this.searchQuery = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    const list = this.transactionService.filterTransactions(this.transactions, {
      type: this.selectedTypeTab,
      searchQuery: this.searchQuery,
      categoryId: this.selectedCategory,
      year: this.selectedYear,
      month: this.selectedMonth,
      startDate: this.startDate,
      endDate: this.endDate
    });

    this.filteredTransactions = list;
    this.totalPages = Math.ceil(list.length / this.pageSize) || 1;
    this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedTransactions = list.slice(startIndex, endIndex);
  }


  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  navigateToAdd(): void {
    this.router.navigate(['/add-transaction']);
  }

  navigateToEdit(id: string): void {
    this.router.navigate(['/edit-transaction', id]);
  }

  promptDelete(tx: Transaction): void {
    this.transactionToDelete = tx;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.transactionToDelete = null;
    this.showDeleteModal = false;
  }

  async confirmDelete(): Promise<void> {
    if (!this.transactionToDelete) return;

    const id = this.transactionToDelete.id;
    const title = this.transactionToDelete.title;
    const success = await this.transactionService.deleteTransaction(id);

    this.showDeleteModal = false;
    this.transactionToDelete = null;

    if (success) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {

      }
      this.toastService.show(`Transaction "${title}" deleted successfully.`, 'success');
    } else {
      this.toastService.show('Failed to delete transaction.', 'error');
    }
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.toastService.show('Logged out successfully.', 'info');
    this.router.navigate(['/login']);
  }
}
