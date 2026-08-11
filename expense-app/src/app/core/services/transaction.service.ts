import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Transaction, TransactionFilter, MonthlySummary } from '../models/transaction.model';
import { DEFAULT_CATEGORIES, Category } from '../models/category.model';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly TRANSACTIONS_KEY = 'user_transactions';
  private readonly CATEGORIES_KEY = 'user_categories';

  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$: Observable<Transaction[]> = this.transactionsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<Category[]>(DEFAULT_CATEGORIES);
  public categories$: Observable<Category[]> = this.categoriesSubject.asObservable();

  constructor(
    private storageService: StorageService,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe((user) => {
      this.loadUserData(user ? user.id : undefined);
    });
  }

  private async loadUserData(userId?: string): Promise<void> {
    if (!userId) {
      this.transactionsSubject.next([]);
      this.categoriesSubject.next(DEFAULT_CATEGORIES);
      return;
    }

    let allTx = (await this.storageService.get<Transaction[]>(this.TRANSACTIONS_KEY)) || [];
    let userTx = allTx.filter((t) => t.userId === userId);

    this.transactionsSubject.next(userTx);

    let allCats = (await this.storageService.get<Category[]>(this.CATEGORIES_KEY)) || DEFAULT_CATEGORIES;
    let userCats = allCats.filter((c) => !c.userId || c.userId === userId);
    this.categoriesSubject.next(userCats);
  }

  private getActiveUserId(): string {
    const user = this.authService.getCurrentUser();
    return user ? user.id : 'user_guest';
  }

  getCategories(): Category[] {
    return this.categoriesSubject.value;
  }

  async addCustomCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const userId = this.getActiveUserId();
    const newCat: Category = {
      ...category,
      id: `cat_custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: userId
    };

    let allCats = (await this.storageService.get<Category[]>(this.CATEGORIES_KEY)) || DEFAULT_CATEGORIES;
    allCats = [...allCats, newCat];
    await this.storageService.set(this.CATEGORIES_KEY, allCats);

    const userCats = allCats.filter((c) => !c.userId || c.userId === userId);
    this.categoriesSubject.next(userCats);
    return newCat;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const userId = this.getActiveUserId();
    let allCats = (await this.storageService.get<Category[]>(this.CATEGORIES_KEY)) || DEFAULT_CATEGORIES;
    allCats = allCats.filter((c) => c.id !== id);
    await this.storageService.set(this.CATEGORIES_KEY, allCats);

    const userCats = allCats.filter((c) => !c.userId || c.userId === userId);
    this.categoriesSubject.next(userCats);
    return true;
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.transactionsSubject.value;
  }

  getTransactionById(id: string): Transaction | undefined {
    return this.transactionsSubject.value.find((t) => t.id === id);
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const userId = this.getActiveUserId();
    const newTx: Transaction = {
      ...transaction,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: userId,
      createdAt: new Date().toISOString()
    };

    let allTx = (await this.storageService.get<Transaction[]>(this.TRANSACTIONS_KEY)) || [];
    allTx = [newTx, ...allTx];
    await this.storageService.set(this.TRANSACTIONS_KEY, allTx);

    const userTx = allTx.filter((t) => t.userId === userId);
    this.transactionsSubject.next(userTx);
    return newTx;
  }

  async updateTransaction(id: string, updatedData: Partial<Transaction>): Promise<boolean> {
    const userId = this.getActiveUserId();
    let allTx = (await this.storageService.get<Transaction[]>(this.TRANSACTIONS_KEY)) || [];
    const index = allTx.findIndex((t) => t.id === id);
    if (index === -1) return false;

    allTx[index] = { ...allTx[index], ...updatedData };
    await this.storageService.set(this.TRANSACTIONS_KEY, allTx);

    const userTx = allTx.filter((t) => t.userId === userId);
    this.transactionsSubject.next(userTx);
    return true;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const userId = this.getActiveUserId();
    let allTx = (await this.storageService.get<Transaction[]>(this.TRANSACTIONS_KEY)) || [];
    allTx = allTx.filter((t) => t.id !== id);

    await this.storageService.set(this.TRANSACTIONS_KEY, allTx);

    const userTx = allTx.filter((t) => t.userId === userId);
    this.transactionsSubject.next(userTx);
    return true;
  }

  filterTransactions(transactions: Transaction[], filter: TransactionFilter): Transaction[] {
    return transactions.filter((tx) => {
      if (filter.type && filter.type !== 'all' && tx.type !== filter.type) {
        return false;
      }
      if (filter.categoryId && filter.categoryId !== 'all' && tx.categoryId !== filter.categoryId) {
        return false;
      }
      if (filter.searchQuery && filter.searchQuery.trim() !== '') {
        const query = filter.searchQuery.toLowerCase().trim();
        const matchesTitle = tx.title.toLowerCase().includes(query);
        const matchesCategory = tx.categoryName.toLowerCase().includes(query);
        const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(query) : false;
        if (!matchesTitle && !matchesCategory && !matchesNotes) {
          return false;
        }
      }

      if (tx.date) {
        const txDate = new Date(tx.date);
        if (!isNaN(txDate.getTime())) {
          if (filter.year && filter.year !== 'all' && txDate.getFullYear().toString() !== filter.year) {
            return false;
          }
          if (filter.month && filter.month !== 'all' && txDate.getMonth().toString() !== filter.month) {
            return false;
          }
          if (filter.startDate && tx.date < filter.startDate) {
            return false;
          }
          if (filter.endDate && tx.date > filter.endDate) {
            return false;
          }
        }
      }
      return true;
    });
  }

  getTotalBalance(transactions: Transaction[]): number {
    const income = this.getTotalIncome(transactions);
    const expense = this.getTotalExpense(transactions);
    return income - expense;
  }

  getTotalIncome(transactions: Transaction[]): number {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  getTotalExpense(transactions: Transaction[]): number {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  getThisMonthTotal(transactions: Transaction[]): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter((t) => {
        const txDate = new Date(t.date);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear && t.type === 'expense';
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  getCategoryBreakdown(transactions: Transaction[]): { category: Category; amount: number; percentage: number }[] {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const totalExp = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    if (totalExp === 0) return [];

    const map = new Map<string, { category: Category; amount: number }>();

    expenses.forEach((tx) => {
      const cat = DEFAULT_CATEGORIES.find((c) => c.id === tx.categoryId) || {
        id: tx.categoryId,
        name: tx.categoryName,
        type: 'expense',
        icon: tx.categoryIcon,
        color: tx.categoryColor
      };

      const existing = map.get(tx.categoryId);
      if (existing) {
        existing.amount += Number(tx.amount);
      } else {
        map.set(tx.categoryId, { category: cat, amount: Number(tx.amount) });
      }
    });

    return Array.from(map.values()).map((item) => ({
      category: item.category,
      amount: item.amount,
      percentage: Math.round((item.amount / totalExp) * 100)
    }));
  }

  private generateInitialSeedData(userId: string): Transaction[] {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: `tx_seed_1_${Date.now()}`,
        userId: userId,
        title: 'Salary Deposit',
        amount: 4500.0,
        type: 'income',
        categoryId: 'cat_salary',
        categoryName: 'Salary',
        categoryIcon: 'cash-outline',
        categoryColor: '#2dd36f',
        paymentMethod: 'Bank Transfer',
        date: today,
        notes: 'Monthly tech company salary',
        createdAt: new Date().toISOString()
      },
      {
        id: `tx_seed_2_${Date.now()}`,
        userId: userId,
        title: 'Grocery Shopping',
        amount: 85.5,
        type: 'expense',
        categoryId: 'cat_food',
        categoryName: 'Food & Dining',
        categoryIcon: 'fast-food-outline',
        categoryColor: '#ff4961',
        paymentMethod: 'Credit Card',
        date: today,
        notes: 'Supermarket supplies',
        createdAt: new Date().toISOString()
      },
      {
        id: `tx_seed_3_${Date.now()}`,
        userId: userId,
        title: 'Electricity Bill',
        amount: 120.0,
        type: 'expense',
        categoryId: 'cat_utilities',
        categoryName: 'Bills & Utilities',
        categoryIcon: 'receipt-outline',
        categoryColor: '#92949c',
        paymentMethod: 'Debit Card',
        date: today,
        notes: 'Monthly electric utility',
        createdAt: new Date().toISOString()
      }
    ];
  }
}
