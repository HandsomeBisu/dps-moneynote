export interface Transaction {
  id: string;
  userId: string; // ID of the user who owns this transaction
  amount: number;
  description: string;
  type: 'expense' | 'income';
  date: Date; // We will convert Firestore Timestamp to JS Date in service
  category?: string;
  balanceAfter?: number; // Calculated field: Balance after this transaction occurred
}

export type TransactionType = 'expense' | 'income';

export interface DailyGroup {
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. "10월 24일"
  transactions: Transaction[];
  dailyTotal: number;
}