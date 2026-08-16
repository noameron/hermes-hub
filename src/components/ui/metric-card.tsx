import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: ReactNode;
  tone?: "default" | "good" | "bad";
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <p className="metric-label">{label}</p>
      <strong className="metric-value">{value}</strong>
      <div className="metric-detail">{detail}</div>
    </article>
  );
}
