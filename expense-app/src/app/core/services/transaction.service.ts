import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Transaction, TransactionFilter, MonthlySummary } from '../models/transaction.model';
import { DEFAULT_CATEGORIES, Category } from '../models/category.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly TRANSACTIONS_KEY = 'user_transactions';
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$: Observable<Transaction[]> = this.transactionsSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.initTransactions();
  }

  private async initTransactions(): Promise<void> {
    let list = await this.storageService.get<Transaction[]>(this.TRANSACTIONS_KEY);
    if (!list || list.length === 0) {
      list = this.generateInitialSeedData();
      await this.storageService.set(this.TRANSACTIONS_KEY, list);
    }
    this.transactionsSubject.next(list);
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.transactionsSubject.value;
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const newTx: Transaction = {
      ...transaction,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };

    const currentList = this.transactionsSubject.value;
    const updated = [newTx, ...currentList];
    await this.storageService.set(this.TRANSACTIONS_KEY, updated);
    this.transactionsSubject.next(updated);
    return newTx;
  }

  async updateTransaction(id: string, updatedData: Partial<Transaction>): Promise<boolean> {
    const currentList = this.transactionsSubject.value;
    const index = currentList.findIndex((t) => t.id === id);
    if (index === -1) return false;

    const updatedTx = { ...currentList[index], ...updatedData };
    const updatedList = [...currentList];
    updatedList[index] = updatedTx;

    await this.storageService.set(this.TRANSACTIONS_KEY, updatedList);
    this.transactionsSubject.next(updatedList);
    return true;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const currentList = this.transactionsSubject.value;
    const updatedList = currentList.filter((t) => t.id !== id);

    await this.storageService.set(this.TRANSACTIONS_KEY, updatedList);
    this.transactionsSubject.next(updatedList);
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
      if (filter.startDate && new Date(tx.date) < new Date(filter.startDate)) {
        return false;
      }
      if (filter.endDate && new Date(tx.date) > new Date(filter.endDate)) {
        return false;
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

  private generateInitialSeedData(): Transaction[] {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'tx_seed_1',
        userId: 'user_demo_1',
        title: 'Salary Deposit',
        amount: 4500.0,
        type: 'income',
        categoryId: 'cat_salary',
        categoryName: 'Salary',
        categoryIcon: 'cash-outline',
        categoryColor: '#2dd36f',
        date: today,
        notes: 'Monthly tech company salary',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_seed_2',
        userId: 'user_demo_1',
        title: 'Grocery Shopping',
        amount: 85.5,
        type: 'expense',
        categoryId: 'cat_food',
        categoryName: 'Food & Dining',
        categoryIcon: 'fast-food-outline',
        categoryColor: '#ff4961',
        date: today,
        notes: 'Supermarket supplies',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_seed_3',
        userId: 'user_demo_1',
        title: 'Electricity Bill',
        amount: 120.0,
        type: 'expense',
        categoryId: 'cat_utilities',
        categoryName: 'Bills & Utilities',
        categoryIcon: 'receipt-outline',
        categoryColor: '#92949c',
        date: today,
        notes: 'Monthly electric utility',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_seed_4',
        userId: 'user_demo_1',
        title: 'Netflix Subscription',
        amount: 15.99,
        type: 'expense',
        categoryId: 'cat_entertainment',
        categoryName: 'Entertainment',
        categoryIcon: 'film-outline',
        categoryColor: '#5260ff',
        date: today,
        notes: 'Premium streaming plan',
        createdAt: new Date().toISOString()
      },
      {
        id: 'tx_seed_5',
        userId: 'user_demo_1',
        title: 'Freelance Work',
        amount: 800.0,
        type: 'income',
        categoryId: 'cat_freelance',
        categoryName: 'Freelance',
        categoryIcon: 'laptop-outline',
        categoryColor: '#3dc2ff',
        date: today,
        notes: 'UI Design project payment',
        createdAt: new Date().toISOString()
      }
    ];
  }
}
