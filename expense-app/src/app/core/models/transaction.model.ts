import { TransactionType } from './category.model';

export interface Transaction {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  paymentMethod?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface TransactionFilter {
  type?: TransactionType | 'all';
  categoryId?: string;
  searchQuery?: string;
  year?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}
