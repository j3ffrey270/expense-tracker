export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  userId?: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_salary', name: 'Salary', type: 'income', icon: 'cash-outline', color: '#2dd36f' },
  { id: 'cat_freelance', name: 'Freelance', type: 'income', icon: 'laptop-outline', color: '#3dc2ff' },
  { id: 'cat_investment', name: 'Investments', type: 'income', icon: 'trending-up-outline', color: '#7044ff' },
  { id: 'cat_food', name: 'Food & Dining', type: 'expense', icon: 'fast-food-outline', color: '#ff4961' },
  { id: 'cat_transport', name: 'Transportation', type: 'expense', icon: 'car-outline', color: '#ffc409' },
  { id: 'cat_utilities', name: 'Bills & Utilities', type: 'expense', icon: 'receipt-outline', color: '#92949c' },
  { id: 'cat_shopping', name: 'Shopping', type: 'expense', icon: 'bag-handle-outline', color: '#eb445a' },
  { id: 'cat_entertainment', name: 'Entertainment', type: 'expense', icon: 'film-outline', color: '#5260ff' }
];
