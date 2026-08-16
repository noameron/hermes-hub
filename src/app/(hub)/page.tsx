import { HubShell } from "@/components/hub/shell";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";
import { MetricCard } from "@/components/ui/metric-card";
import { formatCurrencyFromAgorot } from "@/lib/format/currency";
import { formatLongDate } from "@/lib/format/date";
import { getHomeOverviewData } from "@/features/expenses/server/repository";

export default function HomePage() {
  const data = getHomeOverviewData();

  return (
    <HubShell
      title="Personal command center"
      subtitle="Hermes collects information over time. This hub is the durable place to browse it."
    >
      <div className="page-grid">
        <section className="metrics-grid">
          <MetricCard
            label="Current week spending"
            value={formatCurrencyFromAgorot(data.currentWeekSpend)}
            detail="Live from the Expenses production module."
          />
          <MetricCard
            label="Week over week"
            value={
              data.weekChange == null
                ? "New"
                : `${data.weekChange >= 0 ? "+" : ""}${Math.round(data.weekChange * 100)}%`
            }
            detail={`Previous week ${formatCurrencyFromAgorot(data.previousWeekSpend)}`}
            tone={data.weekChange == null ? "default" : data.weekChange > 0 ? "bad" : "good"}
          />
          <MetricCard
            label="Largest category"
            value={data.topCategory?.name ?? "No data"}
            detail={
              data.topCategory
                ? `${formatCurrencyFromAgorot(data.topCategory.amountAgorot)} this week`
                : "Run seed data or ingest expenses."
            }
          />
          <MetricCard
            label="Latest Hermes activity"
            value={data.latestActivity?.title ?? "Placeholder"}
            detail={data.latestActivity ? formatLongDate(data.latestActivity.occurredAt) : "Events will land here next."}
          />
        </section>

        <div className="two-col-grid">
          <section className="panel">
            <div className="panel-header">
              <h2>Recent expenses</h2>
            </div>
            <div className="expense-list">
              {data.recentExpenses.length === 0 ? (
                <div className="empty-state">No expenses yet. Seed or ingest a Hermes batch to populate the hub.</div>
              ) : (
                data.recentExpenses.map((expense) => (
                  <div className="expense-row" key={expense.id}>
                    <div className="expense-row-copy">
                      <strong>{expense.description}</strong>
                      <span className="muted">
                        {expense.merchantName ?? "Unknown merchant"} · {expense.categoryName}
                      </span>
                    </div>
                    <div className="expense-row-copy" style={{ textAlign: "right" }}>
                      <strong>{formatCurrencyFromAgorot(expense.amountAgorot)}</strong>
                      <span className="muted">{formatLongDate(expense.occurredAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="stack">
            <PlaceholderPanel
              title="Reports"
              body="Daily briefings, weekly summaries, and Hermes-generated reports will appear here. Phase 1 keeps this as a lightweight architectural placeholder."
            />
            <PlaceholderPanel
              title="News"
              body="Curated daily news and topic-specific updates will land here once those Hermes feeds are connected."
            />
          </div>
        </div>
      </div>
    </HubShell>
  );
}
