"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { AnalyticsLayout } from "@/components/analytics-layout"
import { useContracts } from "@/hooks/useConvex"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ApiLoading } from "@/components/api-loading"

export default function AnalytikPage() {
  const { contracts, isLoading } = useContracts();
  const router = useRouter();

  // Automatisch zum ersten Vertrag navigieren, wenn Verträge geladen sind
  useEffect(() => {
    if (contracts && contracts.length > 0) {
      // Zum ersten (neuesten) Vertrag navigieren
      router.push(`/analytik/${contracts[0]._id}`);
    }
  }, [contracts, router]);

  if (isLoading) {
    return (
      <>
        <DashboardHeader heading="Analytik" text="Vertragsanalyse und Verhandlungsvorbereitung" />
        <div className="flex items-center justify-center h-64">
          <ApiLoading title="Lade Verträge..." description="Bitte warten Sie, während Ihre Verträge geladen werden." />
        </div>
      </>
    );
  }

  if (contracts && contracts.length === 0) {
    // Wenn keine Verträge vorhanden sind, zeige eine Nachricht an
    return (
      <>
        <DashboardHeader heading="Analytik" text="Vertragsanalyse und Verhandlungsvorbereitung" />
        <div className="text-center text-muted-foreground py-8">
          <p>Sie haben noch keine Verträge hochgeladen.</p>
          <p className="text-sm mt-2">
            Klicken Sie auf "Neue Analyse", um einen Vertrag hochzuladen und zu analysieren.
          </p>
        </div>
      </>
    );
  }

  // Diese Render-Ausgabe sollte eigentlich nie erreicht werden, da useEffect
  // die Weiterleitung übernimmt, aber wir stellen sie als Fallback bereit
  return (
    <>
      <DashboardHeader heading="Analytik" text="Vertragsanalyse und Verhandlungsvorbereitung" />
      <div className="text-center text-muted-foreground py-8">
        <p>Weiterleitung zum ersten Vertrag...</p>
      </div>
    </>
  );
}
