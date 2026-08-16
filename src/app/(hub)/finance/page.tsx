import Link from "next/link";

import { HubShell } from "@/components/hub/shell";
import { MetricCard } from "@/components/ui/metric-card";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";
import { formatCurrencyFromAgorot } from "@/lib/format/currency";
import { getHomeOverviewData } from "@/features/expenses/server/repository";

export default function FinancePage() {
  const data = getHomeOverviewData();

  return (
    <HubShell
      title="Finance"
      subtitle="Finance is the first domain inside Hermes Hub. Expenses is the first production module."
    >
      <div className="page-grid">
        <section className="metrics-grid">
          <MetricCard
            label="Current week spend"
            value={formatCurrencyFromAgorot(data.currentWeekSpend)}
            detail={`Previous week ${formatCurrencyFromAgorot(data.previousWeekSpend)}`}
          />
          <MetricCard
            label="Week over week"
            value={
              data.weekChange == null
                ? "New"
                : `${data.weekChange >= 0 ? "+" : ""}${Math.round(data.weekChange * 100)}%`
            }
            detail="Live summary from the Expenses module."
            tone={data.weekChange == null ? "default" : data.weekChange > 0 ? "bad" : "good"}
          />
          <MetricCard
            label="Top category"
            value={data.topCategory?.name ?? "No data"}
            detail={
              data.topCategory
                ? `${formatCurrencyFromAgorot(data.topCategory.amountAgorot)} in the visible current week`
                : "Seed or ingest expenses to populate Finance."
            }
          />
          <MetricCard
            label="Current module"
            value="Expenses"
            detail="More finance modules can be added here later without changing the app shell."
          />
        </section>

        <div className="two-col-grid">
          <section className="panel">
            <div className="panel-header">
              <h2>Expenses</h2>
              <span className="chip">Production</span>
            </div>
            <p className="panel-subtle">
              Expenses is the first fully implemented Hermes Hub module. It covers ingestion, analytics,
              filters, trends, and historical browsing.
            </p>
            <p>
              <Link className="button" href="/finance/expenses">
                Open Expenses
              </Link>
            </p>
          </section>

          <PlaceholderPanel
            title="Future finance modules"
            body="Accounts, assets, recurring bills, or budget views can be added under Finance later. Phase 1 keeps the implementation focused on Expenses."
          />
        </div>
      </div>
    </HubShell>
  );
}
