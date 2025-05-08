import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { AnalyticsLayout } from "@/components/analytics-layout"
import { ContractDetail } from "@/components/contract-detail"

export default function ContractAnalyticsPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { tab?: string }
}) {
  // Convert the tab parameter to the expected initialTab type
  const activeTab =
    searchParams.tab === "verhandlung" ? "verhandlung" : searchParams.tab === "editor" ? "editor" : "analyse"

  return (
    <DashboardShell>
      <DashboardHeader heading="Vertragsanalyse" text="Detaillierte Analyse und Verhandlungsvorbereitung" />
      <AnalyticsLayout contractId={params.id} initialTab={activeTab}>
        <ContractDetail contractId={params.id} />
      </AnalyticsLayout>
    </DashboardShell>
  )
}
