import { addDays, startOfPreviousWeek, startOfWeek } from "@/lib/time";
import type { ExpenseRecord } from "@/features/expenses/types";

export function sumExpenses(rows: ExpenseRecord[]) {
  return rows.reduce((total, row) => total + row.amountAgorot, 0);
}

export function toCategoryBreakdown(rows: ExpenseRecord[]) {
  const total = Math.max(sumExpenses(rows), 1);
  const grouped = new Map<string, { name: string; amountAgorot: number; color: string }>();

  for (const row of rows) {
    const current = grouped.get(row.categorySlug) ?? {
      name: row.categoryName,
      amountAgorot: 0,
      color: row.categoryColor,
    };

    current.amountAgorot += row.amountAgorot;
    grouped.set(row.categorySlug, current);
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.amountAgorot - left.amountAgorot)
    .map((entry) => ({
      ...entry,
      share: entry.amountAgorot / total,
    }));
}

export function toDailySpend(rows: ExpenseRecord[], days = 14) {
  const now = new Date();
  const labels = new Map<string, number>();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = addDays(now, -offset);
    const label = day.toISOString().slice(0, 10);
    labels.set(label, 0);
  }

  for (const row of rows) {
    const label = row.occurredAt.slice(0, 10);

    if (labels.has(label)) {
      labels.set(label, (labels.get(label) ?? 0) + row.amountAgorot);
    }
  }

  return Array.from(labels.entries()).map(([label, amountAgorot]) => ({ label, amountAgorot }));
}

export function toWeeklyTrend(rows: ExpenseRecord[], weeks = 8) {
  const now = new Date();
  const currentWeekStart = startOfWeek(now);
  const buckets = new Map<string, number>();

  for (let offset = weeks - 1; offset >= 0; offset -= 1) {
    const start = addDays(currentWeekStart, -offset * 7);
    const label = start.toISOString().slice(5, 10);
    buckets.set(label, 0);
  }

  for (const row of rows) {
    const rowDate = new Date(row.occurredAt);
    const rowWeekStart = startOfWeek(rowDate);
    const diffWeeks = Math.floor((currentWeekStart.getTime() - rowWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

    if (diffWeeks >= 0 && diffWeeks < weeks) {
      const label = rowWeekStart.toISOString().slice(5, 10);
      buckets.set(label, (buckets.get(label) ?? 0) + row.amountAgorot);
    }
  }

  return Array.from(buckets.entries()).map(([label, amountAgorot]) => ({ label, amountAgorot }));
}

export function buildInsights(rows: ExpenseRecord[]) {
  if (rows.length === 0) {
    return ["No expense data yet. Seed or ingest Hermes expense records to unlock weekly insights."];
  }

  const sorted = [...rows].sort((left, right) => right.amountAgorot - left.amountAgorot);
  const categories = toCategoryBreakdown(rows);
  const largest = sorted[0];
  const topCategory = categories[0];
  const currentWeek = filterByWindow(rows, startOfWeek(new Date()), addDays(startOfWeek(new Date()), 7));
  const previousWeek = filterByWindow(
    rows,
    startOfPreviousWeek(new Date()),
    startOfWeek(new Date()),
  );
  const currentTotal = sumExpenses(currentWeek);
  const previousTotal = sumExpenses(previousWeek);

  const insights = [
    `Top category is ${topCategory.name}, ${Math.round(topCategory.share * 100)}% of visible spend.`,
    `Largest transaction is ${largest.description} at ${largest.merchantName ?? "Unknown merchant"}.`,
  ];

  if (previousTotal > 0) {
    const delta = ((currentTotal - previousTotal) / previousTotal) * 100;
    insights.push(
      delta >= 0
        ? `This week is up ${Math.round(delta)}% versus last week.`
        : `This week is down ${Math.abs(Math.round(delta))}% versus last week.`,
    );
  }

  return insights;
}

export function filterByWindow(rows: ExpenseRecord[], start: Date, end: Date) {
  return rows.filter((row) => {
    const occurredAt = new Date(row.occurredAt).getTime();
    return occurredAt >= start.getTime() && occurredAt < end.getTime();
  });
}
