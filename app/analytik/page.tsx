import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { AnalyticsLayout } from "@/components/analytics-layout"

export default function AnalytikPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Analytik" text="Vertragsanalyse und Verhandlungsvorbereitung" />
      <AnalyticsLayout>
        <div className="text-center text-muted-foreground py-8">
          <p>Bitte wählen Sie einen Vertrag aus der Liste aus, um die Analyse zu starten.</p>
          <p className="text-sm mt-2">
            Klicken Sie auf einen Vertrag in der linken Seitenleiste, um dessen Details anzuzeigen.
          </p>
        </div>
      </AnalyticsLayout>
    </DashboardShell>
  )
}
