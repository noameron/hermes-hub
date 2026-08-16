import { HubShell } from "@/components/hub/shell";
import { PlaceholderPanel } from "@/components/ui/placeholder-panel";

export default function SearchPage() {
  return (
    <HubShell
      title="Search"
      subtitle="Placeholder route for future cross-domain search across finance, reports, news, and Hermes artifacts."
    >
      <PlaceholderPanel
        title="Search module placeholder"
        body="Phase 1 does not build unified search yet. The route exists now so later search can span expenses, reports, artifacts, and events without a navigation rewrite."
      />
    </HubShell>
  );
}
