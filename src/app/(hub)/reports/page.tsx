import { HubShell } from "@/components/hub/shell";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";

export default function ReportsPage() {
  return (
    <HubShell
      title="Reports"
      subtitle="Placeholder route for Hermes-generated reports like daily briefings, technology briefs, and weekly summaries."
    >
      <PlaceholderPanel
        title="Reports module placeholder"
        body="Future reports will persist here with title, summary, body, metadata, and source links. Phase 1 only establishes the route and the generic data model."
      />
    </HubShell>
  );
}
