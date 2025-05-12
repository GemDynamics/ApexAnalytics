"use client"

import { useState, useEffect } from "react"
import { useContract } from "@/hooks/useConvex"
import { Id } from "@/convex/_generated/dataModel"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContractClauses } from "./contract-clauses"
import { RiskAnalysisCharts } from "./risk-analysis-charts"
import { Download, Share, AlertTriangle, AlertCircle, CheckCircle, ChevronDown, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { ChartAnimationWrapper } from "@/components/chart-animation-wrapper"

interface ContractDetailProps {
  contractId: Id<"contracts">;
  initialTab?: "analyse" | "verhandlung" | "risiko";
}

// Typ für StructuredElement (ggf. auslagern)
type StructuredElement = {
    elementType: string;
    elementId: string;
    markdownContent: string;
    globalOriginalOrder: number;
    evaluation?: string;
    reason?: string;
    recommendation?: string;
};

export function ContractDetail({ contractId, initialTab = "analyse" }: ContractDetailProps) {
  const { contract, isLoading } = useContract(contractId);
  const [activeTab, setActiveTab] = useState<"analyse" | "verhandlung" | "risiko">(initialTab);
  
  // State für die aktuell angezeigten/bearbeitbaren Elemente
  const [displayedStructuredElements, setDisplayedStructuredElements] = useState<StructuredElement[]>([]);

  // State für die geöffnete Detailkarte (jetzt mit elementId als string)
  const [openElementId, setOpenElementId] = useState<string | null>(null);
  
  // Bestehende States für KI-Aktionen (Typ anpassen)
  const [optimizingElementId, setOptimizingElementId] = useState<string | null>(null);
  const [generatingAlternativesForElementId, setGeneratingAlternativesForElementId] = useState<string | null>(null);
  const [customFormulation, setCustomFormulation] = useState("");
  const [alternativeFormulations, setAlternativeFormulations] = useState<string[]>([]);
  
  // useAction Hooks bleiben gleich
  const optimizeClauseAction = useAction(api.contractActions.optimizeClauseWithAI);
  const generateAlternativesAction = useAction(api.contractActions.generateAlternativeFormulations);

  // Effekt zum Initialisieren/Aktualisieren des Frontend-States, wenn sich die Daten aus Convex ändern
  useEffect(() => {
    if (contract?.structuredContractElements) {
      // Stelle sicher, dass es ein Array ist und sortiere es
      const sortedElements = [...contract.structuredContractElements].sort(
          (a, b) => a.globalOriginalOrder - b.globalOriginalOrder
      );
      setDisplayedStructuredElements(sortedElements as StructuredElement[]); // Typzusicherung kann nötig sein
    } else {
      setDisplayedStructuredElements([]); // Leeren, wenn keine Daten vorhanden
    }
  }, [contract?.structuredContractElements]);

  // Callback zum Aktualisieren eines Elements im Frontend-State
  const handleUpdateElement = (updatedElement: StructuredElement) => {
    setDisplayedStructuredElements(prevElements => 
      prevElements.map(el => 
        el.elementId === updatedElement.elementId ? updatedElement : el
      )
    );
    // Optional: Hier könnte man auch eine 'dirty'-Flag setzen, um anzuzeigen, dass gespeichert werden muss
  };

  // --- Alte KI-Handler (müssen später angepasst werden) ---
  const handleOptimizeWithAI = async (clauseText: string, elementId: string | null) => {
    if (!clauseText.trim()) {
      toast.info("Bitte geben Sie eine Formulierung ein.");
      return;
    }
    if (elementId === null) return;
    setOptimizingElementId(elementId);
    try {
      const alternatives = await optimizeClauseAction({ clauseText });
      
      if (alternatives && alternatives.length > 0) {
        setCustomFormulation(alternatives[0]);
        toast.success(`KI-Vorschlag generiert!`);
        // TODO: Update displayedStructuredElements mit optimierter Formulierung
      } else {
        toast.info("KI konnte keine Alternativen für diesen Text finden.");
      }
    } catch (error) {
      console.error("Fehler bei der KI-Optimierung:", error);
      toast.error("Fehler bei der KI-Optimierung", { 
        description: error instanceof Error ? error.message : "Unbekannter Fehler" 
      });
    } finally {
      setOptimizingElementId(null);
    }
  };

  const handleGenerateAlternatives = async (markdownContent: string, elementId: string | null) => {
    if (!markdownContent.trim()) {
      toast.info("Keine Klausel zum Generieren von Alternativen vorhanden.");
      return;
    }
    if (elementId === null) return;
    setGeneratingAlternativesForElementId(elementId);
    try {
      const alternatives = await generateAlternativesAction({ clauseText: markdownContent });
      
      if (alternatives && alternatives.length > 0) {
        setAlternativeFormulations(alternatives);
        toast.success(`${alternatives.length} alternative Formulierungen generiert!`);
        // TODO: Update displayedStructuredElements wenn eine ausgewählt wird
      } else {
        toast.info("KI konnte keine Alternativen für diesen Text generieren.");
      }
    } catch (error) {
      console.error("Fehler bei der Generierung von Alternativen:", error);
      toast.error("Fehler bei der Generierung von Alternativen", { 
        description: error instanceof Error ? error.message : "Unbekannter Fehler" 
      });
    } finally {
      setGeneratingAlternativesForElementId(null);
      }
  };
  // --- Ende alte KI-Handler ---

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!contract) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fehler</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Vertrag nicht gefunden.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{contract.fileName}</CardTitle>
        <CardDescription>
          Hochgeladen am {contract.uploadedAt ? new Date(contract.uploadedAt).toLocaleDateString('de-DE') : ''} - Status: {contract.status}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
          <TabsList>
            <TabsTrigger value="analyse">Analyse & Bearbeitung</TabsTrigger>
            <TabsTrigger value="risiko">Risikoübersicht</TabsTrigger>
          <TabsTrigger value="verhandlung">Verhandlungschancen</TabsTrigger>
        </TabsList>

          <TabsContent value="analyse" className="space-y-6">
            {displayedStructuredElements.length > 0 ? (
              displayedStructuredElements.map((element) => (
                <div key={element.elementId} className="border p-4 rounded-md shadow-sm">
                  <p className="font-semibold">Platzhalter für StructuredElementTile</p>
                  <p>ID: {element.elementId}</p>
                  <p>Type: {element.elementType}</p>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-x-auto">{element.markdownContent.substring(0, 200)}...</pre>
                        </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                {contract.status === 'pending' || contract.status === 'preprocessing_structure' || contract.status === 'structure_generation_inprogress' ? 
                 'Vertrag wird strukturiert...' : 
                 'Keine strukturierten Elemente für diesen Vertrag gefunden oder die Analyse läuft noch.'}
              </p>
            )}
        </TabsContent>

        <TabsContent value="risiko" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Gesamtrisikobewertung</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Vertragsrisiko:</span>
                        <span className="font-medium">{75}%</span>
                    </div>
                      <Progress value={75} className="h-2">
                      <div
                          className="h-full bg-red-700 rounded-full"
                          style={{ width: "75%" }}
                      />
                    </Progress>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 text-gray-900 dark:text-gray-900 border border-red-200">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-medium text-red-700">Vertrag mit hohem Risiko</span>
                    </div>
                    <Badge variant="destructive">Handlungsbedarf</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Dieser Vertrag enthält erhebliche Risikofaktoren, die vor Vertragsabschluss adressiert werden
                    sollten. Besonderes Augenmerk sollte auf die Vertragsstrafen und Haftungsklauseln gelegt werden.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Risikoverteilung</h3>
                <ChartAnimationWrapper className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                          data={[
                            { name: "Hohes Risiko", value: 2, color: "#b91c1c" },
                            { name: "Mittleres Risiko", value: 2, color: "#d97706" },
                            { name: "Niedriges Risiko", value: 1, color: "#15803d" },
                          ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={true}
                        animationDuration={1500}
                      >
                          {[
                            { name: "Hohes Risiko", value: 2, color: "#b91c1c" },
                            { name: "Mittleres Risiko", value: 2, color: "#d97706" },
                            { name: "Niedriges Risiko", value: 1, color: "#15803d" },
                          ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartAnimationWrapper>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Risiko nach Kategorie</h3>
                <ChartAnimationWrapper className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={[
                          { category: "Vertragsstrafen", risk: 85, fill: "#b91c1c" },
                          { category: "Haftung", risk: 80, fill: "#b91c1c" },
                          { category: "Zahlungsbedingungen", risk: 55, fill: "#d97706" },
                          { category: "Kündigung", risk: 50, fill: "#d97706" },
                          { category: "Gewährleistung", risk: 25, fill: "#15803d" },
                        ]}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid horizontal strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="category" type="category" width={90} />
                      <Bar
                        dataKey="risk"
                        fill="var(--color-risk)"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                        animationDuration={1500}
                        label={{
                          position: "right",
                          formatter: (value: number) => `${value}%`,
                          fill: "#888",
                          fontSize: 12,
                        }}
                      >
                          {[
                            { category: "Vertragsstrafen", risk: 85, fill: "#b91c1c" },
                            { category: "Haftung", risk: 80, fill: "#b91c1c" },
                            { category: "Zahlungsbedingungen", risk: 55, fill: "#d97706" },
                            { category: "Kündigung", risk: 50, fill: "#d97706" },
                            { category: "Gewährleistung", risk: 25, fill: "#15803d" },
                          ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartAnimationWrapper>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Risiko-Radar-Analyse</h3>
                <ChartAnimationWrapper className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      data={[
                        { subject: "Finanziell", value: 80, fullMark: 100 },
                        { subject: "Rechtlich", value: 65, fullMark: 100 },
                        { subject: "Zeitlich", value: 45, fullMark: 100 },
                        { subject: "Technisch", value: 30, fullMark: 100 },
                        { subject: "Operativ", value: 55, fullMark: 100 },
                      ]}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Risikolevel"
                        dataKey="value"
                        stroke="#2563eb"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                        animationDuration={1500}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartAnimationWrapper>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="verhandlung" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Verhandlungswahrscheinlichkeit</h3>
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div
                        className={`text-4xl font-bold ${65 < 50 ? "text-red-500" : 65 < 75 ? "text-amber-500" : "text-green-500"}`}
                    >
                        {65}%
                    </div>
                      <Progress value={65} className="h-2 w-full">
                      <div
                          className={`h-full ${65 < 50 ? "bg-red-700" : 65 < 75 ? "bg-amber-600" : "bg-green-700"} rounded-full`}
                          style={{ width: `${65}%` }}
                      />
                    </Progress>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      Moderate Verhandlungsherausforderungen. Fokussieren Sie sich auf die Klauseln mit hohem Risiko, um
                      Ihre Position zu verbessern.
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    <h4 className="font-medium">Faktoren, die die Verhandlung beeinflussen:</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span>Auftragswert</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        Positiv
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Zeitliche Einschränkungen</span>
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                        Negativ
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Marktposition</span>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                        Neutral
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <CardTitle>Empfohlene Verhandlungspunkte</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="rounded-lg border p-3 bg-red-50 text-gray-900 dark:text-gray-900">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Vertragsstrafen</span>
                    </div>
                    <p className="text-sm whitespace-normal break-words">
                      Reduzierung der Vertragsstrafe auf 0,1% pro Werktag mit einer Obergrenze von 5% der Auftragssumme.
                    </p>
                  </div>

                  <div className="rounded-lg border p-3 bg-red-50 text-gray-900 dark:text-gray-900">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Haftungsbegrenzung</span>
                    </div>
                    <p className="text-sm whitespace-normal break-words">
                      Einführung einer Haftungsbegrenzung auf die Höhe der Auftragssumme für Folgeschäden und
                      entgangenen Gewinn.
                    </p>
                  </div>

                  <div className="rounded-lg border p-3 bg-amber-50 text-gray-900 dark:text-gray-900">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">Zahlungsbedingungen</span>
                    </div>
                    <p className="text-sm whitespace-normal break-words">
                      Verkürzung der Zahlungsfrist von 30 auf 14 Tage nach Rechnungseingang.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Verhandlungsstrategie</h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Basierend auf der Vertragsanalyse empfehlen wir folgende Verhandlungsstrategie:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                        <span className="text-primary font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Priorisierung der Hochrisikoklauseln</h4>
                        <p className="text-sm text-muted-foreground">
                          Konzentrieren Sie die Verhandlungsbemühungen zuerst auf die Vertragsstrafen und
                          Haftungsklauseln, da diese das höchste Risiko darstellen.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                        <span className="text-primary font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Alternative Formulierungen vorbereiten</h4>
                        <p className="text-sm text-muted-foreground">
                          Halten Sie vorab formulierte Alternativvorschläge für die problematischen Klauseln bereit, um
                          die Verhandlungen zu beschleunigen.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                        <span className="text-primary font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Projektwert als Hebel nutzen</h4>
                        <p className="text-sm text-muted-foreground">
                          Betonen Sie den hohen Auftragswert und Ihre Expertise als Hebel für günstigere
                          Vertragsbedingungen.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                        <span className="text-primary font-bold text-sm">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Rechtliche Beratung in Betracht ziehen</h4>
                        <p className="text-sm text-muted-foreground">
                          Angesichts des hohen Risikos dieses Vertrags sollten Sie eine rechtliche Beratung für den
                          Verhandlungsprozess in Betracht ziehen.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button>Verhandlungsleitfaden erstellen</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </CardContent>
    </Card>
  )
}
