import type { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContractClauses } from "@/components/contract-clauses"
import { RiskAnalysisCharts } from "@/components/risk-analysis-charts"
import { NegotiationProbability } from "@/components/negotiation-probability"
import type { Doc } from "@/convex/_generated/dataModel";

// Typdefinition für eine einzelne Klausel (ggf. anpassen, falls global vorhanden)
type AnalysisClause = NonNullable<Doc<"contracts">["analysisProtocol"]>[number];

export const metadata: Metadata = {
  title: "Vertragsanalyse - Beispiel",
  description: "Beispiel einer Vertragsanalyse mit Risikobewertung",
}

export default function AnalyseBeispielPage() {
  // Beispieldaten für Vertragsklauseln
  const beispielKlauseln: AnalysisClause[] = [
    {
      chunkNumber: 1,
      clauseText: "Der Auftragnehmer haftet für jegliche Mängel, die innerhalb von 5 Jahren nach Abnahme auftreten.",
      evaluation: "Gelb",
      reason: "Die Haftungsdauer von 5 Jahren ist marktüblich, sollte aber geprüft werden.",
      recommendation: "Prüfen, ob eine Verkürzung auf 4 Jahre (VOB/B) möglich ist."
    },
    {
      chunkNumber: 1,
      clauseText: "Die Zahlung erfolgt 60 Tage nach Rechnungseingang.",
      evaluation: "Rot",
      reason: "Eine Zahlungsfrist von 60 Tagen ist zu lang und nicht akzeptabel (Standard BGB: 30 Tage).",
      recommendation: "Zahlungsfrist auf maximal 30 Tage reduzieren."
    },
    {
      chunkNumber: 2,
      clauseText: "Der Auftraggeber stellt dem Auftragnehmer alle notwendigen Unterlagen kostenfrei zur Verfügung.",
      evaluation: "Grün",
      reason: "Diese Klausel ist Standard und für den Auftragnehmer vorteilhaft.",
      recommendation: "Keine Änderung notwendig."
    },
     {
      chunkNumber: 2,
      clauseText: "Eine Vertragsstrafe bei Terminüberschreitung ist mit 0.5% pro Werktag, maximal 10% der Auftragssumme festgelegt.",
      evaluation: "Gelb",
      reason: "Vertragsstrafe ist hoch, aber der Maximalbetrag ist üblich. Tagessatz könnte verhandelt werden.",
      recommendation: "Versuchen, den Tagessatz auf 0.2% oder 0.3% zu reduzieren."
    }
  ];

  // Beispieldaten für Risikoanalyse (vereinfacht)
  // Diese Struktur hängt von der Implementierung von RiskAnalysisCharts ab
  const risikoDaten = {
    rot: 1,
    gelb: 2,
    grün: 1,
  };

  // Beispieldaten für Verhandlungschancen (vereinfacht)
  // Diese Struktur hängt von der Implementierung von NegotiationProbability ab
  const verhandlungschancenDaten = {
    wahrscheinlichkeit: 75, // in Prozent
    empfehlung: "Gute Chancen, die meisten kritischen Punkte erfolgreich zu verhandeln."
  };

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
                  <ContractClauses clauses={beispielKlauseln} />
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
                  <RiskAnalysisCharts data={risikoDaten} />
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
                  <NegotiationProbability data={verhandlungschancenDaten} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardShell>
    </>
  )
}
