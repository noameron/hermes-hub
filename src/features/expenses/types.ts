export type ExpenseRecord = {
  id: number;
  externalId: string;
  source: string;
  accountName: string | null;
  amountAgorot: number;
  currency: string;
  description: string;
  occurredAt: string;
  categoryName: string;
  categorySlug: string;
  categoryColor: string;
  merchantName: string | null;
};

export type ExpenseFilterRange = "7d" | "30d" | "90d" | "all";

export type ExpenseFilters = {
  query: string;
  category: string;
  merchant: string;
  range: ExpenseFilterRange;
};

export type ExpenseDashboardData = {
  filters: ExpenseFilters;
  totals: {
    currentWeek: number;
    previousWeek: number;
    weekChange: number | null;
    averageTransaction: number;
    totalTransactions: number;
    topCategory: {
      name: string;
      amountAgorot: number;
      share: number;
    } | null;
  };
  weeklyTrend: Array<{ label: string; amountAgorot: number }>;
  categoryBreakdown: Array<{ name: string; amountAgorot: number; color: string; share: number }>;
  dailySpend: Array<{ label: string; amountAgorot: number }>;
  recentExpenses: ExpenseRecord[];
  allExpenses: ExpenseRecord[];
  categories: Array<{ value: string; label: string }>;
  merchants: Array<{ value: string; label: string }>;
  insights: string[];
};
