// lib/types.ts
export enum TransactionCategory {
  FOOD = "FOOD",
  TRANSPORT = "TRANSPORT",
  HOUSING = "HOUSING",
  INSURANCE = "INSURANCE",
  INVESTMENT = "INVESTMENT",
  OTHER = "OTHER",
}

export interface Transaction {
  id: string;
  timestamp: Date;
  merchant: string;
  amount: number;
  category: TransactionCategory;
  userId: number;
}

export interface MonthlyTrend {
  month: string;
  total: number;
  count: number;
}

export interface CategoryTrend {
  category: TransactionCategory;
  currentMonth: number;
  previousMonth: number;
  changePercent: number;
}
