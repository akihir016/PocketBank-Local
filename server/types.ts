export type TransactionType = 'expense' | 'deposit';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO string
  type: TransactionType;
}

export interface BudgetState {
  initialBudget: number;
  currentBalance: number;
  currency: string;
  transactions: Transaction[];
}

export interface CategorySummary {
  category: string;
  amount: number;
  color: string;
}

export const EXPENSE_CATEGORIES = [
  'Food & Drink',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health',
  'Travel',
  'Other'
];