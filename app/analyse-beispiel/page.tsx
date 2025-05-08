import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContractClauses } from "@/components/contract-clauses"
import { RiskAnalysisCharts } from "@/components/risk-analysis-charts"
import { NegotiationProbability } from "@/components/negotiation-probability"

export const metadata: Metadata = {
  title: "Vertragsanalyse - Beispiel",
  description: "Beispiel einer Vertragsanalyse mit Risikobewertung",
}

export default function AnalyseBeispielPage() {
  return (
    <>
      <DashboardShell>
        <DashboardHeader
          heading="Vertragsanalyse: Beispielvertrag"
          text="Detaillierte Analyse des Bauvertrags mit Risikobewertung."
        />
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Vertragsinformationen</CardTitle>
              <CardDescription>Grundlegende Informationen zum analysierten Vertrag.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Vertragstyp</div>
                  <div>Bauvertrag (VOB/B)</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Auftraggeber</div>
                  <div>Stadt München</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Projektwert</div>
                  <div>2.450.000 €</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Laufzeit</div>
                  <div>18 Monate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="klauseln">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="klauseln">Vertragsklauseln</TabsTrigger>
              <TabsTrigger value="risiko">Risikoanalyse</TabsTrigger>
              <TabsTrigger value="verhandlung">Verhandlungschancen</TabsTrigger>
            </TabsList>
            <TabsContent value="klauseln">
              <Card>
                <CardHeader>
                  <CardTitle>Vertragsklauseln mit Risikobewertung</CardTitle>
                  <CardDescription>
                    Farbliche Kodierung: Rot = nicht akzeptabel, Gelb = verhandelbar, Grün = in Ordnung
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContractClauses />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="risiko">
              <Card>
                <CardHeader>
                  <CardTitle>Gesamtrisikoanalyse</CardTitle>
                  <CardDescription>Grafische Darstellung der Risikoverteilung im Vertrag</CardDescription>
                </CardHeader>
                <CardContent>
                  <RiskAnalysisCharts />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="verhandlung">
              <Card>
                <CardHeader>
                  <CardTitle>Verhandlungschancen</CardTitle>
                  <CardDescription>Wahrscheinlichkeit erfolgreicher Vertragsverhandlungen</CardDescription>
                </CardHeader>
                <CardContent>
                  <NegotiationProbability />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardShell>
    </>
  )
}
