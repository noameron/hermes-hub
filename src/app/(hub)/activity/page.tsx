import { HubShell } from "@/components/hub/shell";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";

export default function ActivityPage() {
  return (
    <HubShell
      title="Activity"
      subtitle="Placeholder route for Hermes events, monitoring outputs, and a future historical activity timeline."
    >
      <PlaceholderPanel
        title="Activity module placeholder"
        body="Expense ingestion already writes Hermes events into the database. This route will become the cross-domain timeline view later."
      />
    </HubShell>
  );
}
