import { HubShell } from "@/components/hub/shell";
import { BarList } from "@/components/ui/bar-list";
import { MetricCard } from "@/components/ui/metric-card";
import { formatCurrencyFromAgorot } from "@/lib/format/currency";
import { formatLongDate } from "@/lib/format/date";
import { getExpenseDashboardData } from "@/features/expenses/server/repository";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatPercent(value: number | null) {
  if (value == null) {
    return "New";
  }

  return `${value >= 0 ? "+" : ""}${Math.round(value * 100)}%`;
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : undefined;
  const data = getExpenseDashboardData(params);

  return (
    <HubShell
      title="Finance · Expenses"
      subtitle="Production module for ingestion, historical browsing, weekly deltas, category mix, and deterministic insights."
    >
      <div className="expenses-grid">
        <section className="metrics-grid">
          <MetricCard
            label="Current week"
            value={formatCurrencyFromAgorot(data.totals.currentWeek)}
            detail={`Previous week ${formatCurrencyFromAgorot(data.totals.previousWeek)}`}
          />
          <MetricCard
            label="Week over week"
            value={formatPercent(data.totals.weekChange)}
            detail="Compared against the previous full week in the filtered view."
            tone={data.totals.weekChange == null ? "default" : data.totals.weekChange > 0 ? "bad" : "good"}
          />
          <MetricCard
            label="Average transaction"
            value={formatCurrencyFromAgorot(data.totals.averageTransaction)}
            detail={`${data.totals.totalTransactions} visible transactions`}
          />
          <MetricCard
            label="Top category"
            value={data.totals.topCategory?.name ?? "No data"}
            detail={
              data.totals.topCategory
                ? `${Math.round(data.totals.topCategory.share * 100)}% of visible spend`
                : "No visible expenses"
            }
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Filters</h2>
          </div>
          <form className="filters-form" method="get">
            <div className="field">
              <label htmlFor="q">Search</label>
              <input
                id="q"
                name="q"
                defaultValue={data.filters.query}
                placeholder="Merchant, category, account, description"
              />
            </div>
            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" defaultValue={data.filters.category}>
                <option value="">All categories</option>
                {data.categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="merchant">Merchant</label>
              <select id="merchant" name="merchant" defaultValue={data.filters.merchant}>
                <option value="">All merchants</option>
                {data.merchants.map((merchant) => (
                  <option key={merchant.value} value={merchant.value}>
                    {merchant.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="range">Range</label>
              <select id="range" name="range" defaultValue={data.filters.range}>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
            <button className="button" type="submit">
              Apply
            </button>
          </form>
        </section>

        <div className="two-col-grid">
          <BarList
            title="Category breakdown"
            items={data.categoryBreakdown.map((item) => ({
              label: item.name,
              value: `${formatCurrencyFromAgorot(item.amountAgorot)} · ${Math.round(item.share * 100)}%`,
              amountAgorot: item.amountAgorot,
              color: item.color,
            }))}
          />
          <BarList
            title="Daily spending"
            items={data.dailySpend.map((item) => ({
              label: item.label,
              value: formatCurrencyFromAgorot(item.amountAgorot),
              amountAgorot: item.amountAgorot,
            }))}
          />
        </div>

        <div className="two-col-grid">
          <BarList
            title="Weekly trend"
            items={data.weeklyTrend.map((item) => ({
              label: item.label,
              value: formatCurrencyFromAgorot(item.amountAgorot),
              amountAgorot: item.amountAgorot,
            }))}
          />
          <section className="panel">
            <div className="panel-header">
              <h2>Deterministic insights</h2>
            </div>
            <div className="insight-list">
              {data.insights.map((insight) => (
                <div className="activity-row" key={insight}>
                  <div className="activity-copy">
                    <strong>{insight}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panel-header">
            <h2>Transactions</h2>
            <span className="panel-subtle">{data.allExpenses.length} results</span>
          </div>
          {data.allExpenses.length === 0 ? (
            <div className="empty-state">No transactions match this filter set.</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Merchant</th>
                    <th>Category</th>
                    <th>Account</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.allExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="table-muted">{formatLongDate(expense.occurredAt)}</td>
                      <td>{expense.description}</td>
                      <td>{expense.merchantName ?? "Unknown merchant"}</td>
                      <td>
                        <span className="category-dot" style={{ backgroundColor: expense.categoryColor }} />
                        {expense.categoryName}
                      </td>
                      <td>{expense.accountName ?? "Unassigned"}</td>
                      <td className="mono">{formatCurrencyFromAgorot(expense.amountAgorot)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </HubShell>
  );
}
