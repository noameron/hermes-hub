type BarItem = {
  label: string;
  value: string;
  amountAgorot: number;
  color?: string;
};

export function BarList({
  title,
  items,
}: {
  title: string;
  items: BarItem[];
}) {
  const maxAmount = Math.max(...items.map((item) => item.amountAgorot), 1);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <div className="bar-list">
        {items.map((item) => (
          <div key={item.label} className="bar-row">
            <div className="bar-row-copy">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="bar-track" aria-hidden="true">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.max((item.amountAgorot / maxAmount) * 100, item.amountAgorot > 0 ? 6 : 0)}%`,
                  background: item.color ?? "linear-gradient(90deg, #7c3aed, #4f46e5)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
