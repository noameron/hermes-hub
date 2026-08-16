import { HubShell } from "@/components/hub/shell";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";

export default function NewsPage() {
  return (
    <HubShell
      title="News"
      subtitle="Placeholder route for curated daily news, technology updates, and future Hermes news feeds."
    >
      <PlaceholderPanel
        title="News module placeholder"
        body="The route exists now so the app shell and future ingestion paths do not need restructuring later. Phase 1 keeps implementation time on Expenses."
      />
    </HubShell>
  );
}
