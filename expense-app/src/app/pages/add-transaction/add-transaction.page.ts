import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
  walletOutline,
  cashOutline,
  trendingUpOutline,
  trendingDownOutline,
  chevronDownOutline,
  checkmarkCircleOutline,
  closeOutline
} from 'ionicons/icons';
import { TransactionService } from '../../core/services/transaction.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Transaction } from '../../core/models/transaction.model';
import { DEFAULT_CATEGORIES, Category, TransactionType } from '../../core/models/category.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-add-transaction',
  templateUrl: './add-transaction.page.html',
  styleUrls: ['./add-transaction.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonIcon
  ]
})
export class AddTransactionPage implements OnInit {
  currentUser: User | null = null;
  isEditMode = false;
  editingId: string | null = null;

  transactionType: TransactionType = 'income';
  amount: number | null = null;
  selectedCategoryId = '';
  dateString = '';
  paymentMethod = 'Credit Card';
  title = '';
  notes = '';

  allCategories: Category[] = [];
  availableCategories: Category[] = [];

  paymentMethods: string[] = [
    'Cash',
    'Credit Card',
    'Debit Card',
    'Bank Transfer',
    'PayPal'
  ];

  isSubmitting = false;

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute,
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
      walletOutline,
      cashOutline,
      trendingUpOutline,
      trendingDownOutline,
      chevronDownOutline,
      checkmarkCircleOutline,
      closeOutline
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    const today = new Date().toISOString().split('T')[0];
    this.dateString = today;

    this.transactionService.categories$.subscribe((cats) => {
      this.allCategories = cats;
      this.updateAvailableCategories();
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.editingId = id;
        this.loadTransactionData(id);
      }
    });
  }

  setTransactionType(type: TransactionType): void {
    this.transactionType = type;
    this.updateAvailableCategories();
  }

  updateAvailableCategories(): void {
    const list = this.allCategories.length ? this.allCategories : DEFAULT_CATEGORIES;
    this.availableCategories = list.filter(
      (cat) => cat.type === this.transactionType
    );

    const matchesCurrent = this.availableCategories.some(
      (cat) => cat.id === this.selectedCategoryId
    );

    if (!matchesCurrent && this.availableCategories.length > 0) {
      this.selectedCategoryId = this.availableCategories[0].id;
    }
  }


  loadTransactionData(id: string): void {
    const tx = this.transactionService.getTransactionById(id);
    if (!tx) {
      this.toastService.show('Transaction not found.', 'error');
      this.router.navigate(['/transactions']);
      return;
    }

    this.transactionType = tx.type;
    this.amount = tx.amount;
    this.selectedCategoryId = tx.categoryId;
    this.dateString = tx.date;
    this.paymentMethod = tx.paymentMethod || 'Credit Card';
    this.title = tx.title;
    this.notes = tx.notes || '';

    this.updateAvailableCategories();
    this.selectedCategoryId = tx.categoryId;
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting) return;

    if (!this.title || this.title.trim() === '') {
      this.toastService.show('Please enter a description or title.', 'warning');
      return;
    }

    if (!this.amount || this.amount <= 0) {
      this.toastService.show('Please enter a valid amount greater than 0.', 'warning');
      return;
    }

    if (!this.selectedCategoryId) {
      this.toastService.show('Please select a category.', 'warning');
      return;
    }

    const list = this.allCategories.length ? this.allCategories : DEFAULT_CATEGORIES;
    const category = list.find((cat) => cat.id === this.selectedCategoryId);
    if (!category) {
      this.toastService.show('Invalid category selected.', 'error');
      return;
    }


    this.isSubmitting = true;

    try {
      if (this.isEditMode && this.editingId) {
        await this.transactionService.updateTransaction(this.editingId, {
          title: this.title.trim(),
          amount: Number(this.amount),
          type: this.transactionType,
          categoryId: category.id,
          categoryName: category.name,
          categoryIcon: category.icon,
          categoryColor: category.color,
          paymentMethod: this.paymentMethod,
          date: this.dateString,
          notes: this.notes.trim()
        });

        try {
          await Haptics.impact({ style: ImpactStyle.Light });
        } catch {

        }

        this.toastService.show('Transaction updated successfully!', 'success');
      } else {
        await this.transactionService.addTransaction({
          userId: this.currentUser?.id || 'user_demo_1',
          title: this.title.trim(),
          amount: Number(this.amount),
          type: this.transactionType,
          categoryId: category.id,
          categoryName: category.name,
          categoryIcon: category.icon,
          categoryColor: category.color,
          paymentMethod: this.paymentMethod,
          date: this.dateString,
          notes: this.notes.trim()
        });

        try {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch {

        }

        this.toastService.show('Transaction added successfully!', 'success');
      }

      this.router.navigate(['/transactions']);
    } catch {
      this.toastService.show('An error occurred while saving transaction.', 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/transactions']);
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.toastService.show('Logged out successfully.', 'info');
    this.router.navigate(['/login']);
  }
}
