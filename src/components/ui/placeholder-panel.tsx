export function PlaceholderPanel({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="panel placeholder-panel">
      <div className="panel-header">
        <h2>{title}</h2>
        <span className="chip">Phase 2</span>
      </div>
      <p>{body}</p>
    </section>
  );
}
