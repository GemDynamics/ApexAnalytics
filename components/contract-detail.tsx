"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
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
  initialTab?: "analyse" | "verhandlung" | "editor";
}

// Erweitere den Typ für Klauseln, um alle fehlenden Eigenschaften hinzuzufügen
interface EnhancedClause {
  id?: number;
  chunkNumber?: number;
  clauseText: string;
  content?: string; // Fallback zu clauseText
  evaluation: string;
  risk?: "high" | "medium" | "low" | "error"; // Abgeleitet aus evaluation
  reason: string;
  recommendation: string;
  title?: string;
  section?: string;
}

export function ContractDetail({ contractId, initialTab = "analyse" }: ContractDetailProps) {
  const { contract, isLoading } = useContract(contractId);
  const [activeTab, setActiveTab] = useState<"analyse" | "verhandlung" | "editor" | "klauseln" | "risiko">(initialTab);
  const [openClause, setOpenClause] = useState<number | null>(null);
  const [optimizingClauseId, setOptimizingClauseId] = useState<number | null>(null);
  const [customFormulation, setCustomFormulation] = useState("");
  
  // KI-Optimierungsfunktion
  const optimizeClauseAction = useAction(api.contractActions.optimizeClauseWithAI);

  const handleOptimizeWithAI = async (clauseText: string) => {
    if (!clauseText.trim()) {
      toast.info("Bitte geben Sie eine Formulierung ein.");
      return;
    }
    
    const clauseId = openClause;
    if (clauseId === null) return;
    
    setOptimizingClauseId(clauseId);
    try {
      const alternatives = await optimizeClauseAction({ clauseText });
      
      if (alternatives && alternatives.length > 0) {
        // Setze die erste Alternative als benutzerdefinierte Formulierung
        setCustomFormulation(alternatives[0]);
        toast.success(`KI-Vorschlag generiert!`);
      } else {
        toast.info("KI konnte keine Alternativen für diesen Text finden.");
      }
    } catch (error) {
      console.error("Fehler bei der KI-Optimierung:", error);
      toast.error("Fehler bei der KI-Optimierung", { 
        description: error instanceof Error ? error.message : "Unbekannter Fehler" 
      });
    } finally {
      setOptimizingClauseId(null);
    }
  };

  // Typkonvertierungsfunktion für getEnhancedClauses
  const getEnhancedClauses = (): EnhancedClause[] => {
    if (!contract?.analysisProtocol) return [];
    
    return contract.analysisProtocol.map((clause, index) => {
      // Wandle die Evaluation in einen risk-Wert um
      let risk: "high" | "medium" | "low" | "error" = "low";
      switch (clause.evaluation.toLowerCase()) {
        case "rot":
          risk = "high";
          break;
        case "gelb":
          risk = "medium";
          break;
        case "grün":
          risk = "low";
          break;
        case "fehler":
          risk = "error";
          break;
      }
      
      // Generiere einen Titel, wenn keiner vorhanden ist
      const title = `Klausel ${index + 1}`;
      
      return {
        ...clause,
        id: index, // Verwende index als id
        content: clause.clauseText, // Map claustText zu content für die UI
        risk,
        title,
        section: `Abschnitt ${clause.chunkNumber || 'N/A'}`
      };
    });
  };

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

  const enhancedClauses = getEnhancedClauses();
  
  // Standardwerte für fehlende Eigenschaften
  const riskScore = 75; // Standardwert
  const negotiationProbability = 65; // Standardwert

  const riskDistributionData = [
    { name: "Hohes Risiko", value: 2, color: "#b91c1c" }, // Darker red
    { name: "Mittleres Risiko", value: 2, color: "#d97706" }, // Darker amber
    { name: "Niedriges Risiko", value: 1, color: "#15803d" }, // Darker green
  ]

  const riskCategoryData = [
    { category: "Vertragsstrafen", risk: 85, fill: "#b91c1c" },
    { category: "Haftung", risk: 80, fill: "#b91c1c" },
    { category: "Zahlungsbedingungen", risk: 55, fill: "#d97706" },
    { category: "Kündigung", risk: 50, fill: "#d97706" },
    { category: "Gewährleistung", risk: 25, fill: "#15803d" },
  ]

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "medium":
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case "low":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return null
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200"
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "low":
        return "bg-green-50 text-green-700 border-green-200"
      default:
        return ""
    }
  }

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "high":
        return "Hohes Risiko"
      case "medium":
        return "Mittleres Risiko"
      case "low":
        return "Niedriges Risiko"
      default:
        return ""
    }
  }

  const getProgressColor = (score: number) => {
    if (score > 66) return "bg-red-700"
    if (score > 33) return "bg-amber-600"
    return "bg-green-700"
  }

  const getNegotiationColor = (probability: number) => {
    if (probability < 50) return "bg-red-700"
    if (probability < 75) return "bg-amber-600"
    return "bg-green-700"
  }

  const addToContractEditor = (clause: any) => {
    // This would typically update the contract editor with the clause
    console.log("Adding to contract editor:", clause)

    // Show a notification to the user
    toast.success(`Klausel "${clause.title}" wurde zum Vertragseditor hinzugefügt.`)

    // Navigate to the editor tab
    // In a real implementation, this would use router.push or a similar navigation method
    const editorTab = document.querySelector('[value="editor"]') as HTMLElement
    if (editorTab) {
      editorTab.click()
    }
  }

  const handleTabValueChange = (value: string) => {
    // Type assertion, da wir wissen, dass der Tab-Wert einem gültigen Tab-Wert entspricht
    setActiveTab(value as typeof activeTab);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{contract.fileName}</CardTitle>
        <CardDescription>
          Hochgeladen am {new Date(contract.uploadedAt).toLocaleDateString('de-DE')} - Status: {contract.status}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        {enhancedClauses.length > 0 ? (
           <ContractClauses clauses={contract.analysisProtocol || []} />
        ) : (
          <p className="text-muted-foreground p-4 text-center">
            {contract.status === 'completed' ? 'Keine Klauseln zur Überprüfung gefunden.' : 'Analyse läuft oder ist fehlgeschlagen.'}
          </p>
        )}
        <Tabs defaultValue="klauseln" className="p-6" value={activeTab} onValueChange={handleTabValueChange}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="klauseln">Vertragsklauseln</TabsTrigger>
          <TabsTrigger value="risiko">Risikoanalyse</TabsTrigger>
          <TabsTrigger value="verhandlung">Verhandlungschancen</TabsTrigger>
        </TabsList>

        <TabsContent value="klauseln" className="space-y-6">
          <div className="rounded-lg border shadow-sm">
            <div className="divide-y">
                {enhancedClauses.map((clause) => (
                <Collapsible
                  key={clause.id}
                  open={openClause === clause.id}
                  onOpenChange={() => setOpenClause(openClause === clause.id ? null : (clause.id ?? null))}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50 w-full text-left">
                      <div className="flex items-center gap-3">
                        {getRiskIcon(clause.risk || "low")}
                        <div>
                          <p className="font-medium">{clause.title}</p>
                          <p className="text-sm text-muted-foreground">{clause.section}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${openClause === clause.id ? "rotate-180" : ""}`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-4 p-4 pt-0">
                      <div className="rounded-md border p-3">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Klauseltext:</h4>
                        <p className="text-sm">{clause.content || clause.clauseText}</p>
                      </div>
                      <div
                        className={`rounded-md border p-3 text-gray-900 dark:text-gray-900 ${getRiskColor(clause.risk || "low")}`}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-medium">{getRiskLabel(clause.risk || "low")}</span>
                        </div>
                        <h4 className="text-sm font-medium mb-1">Begründung:</h4>
                        <p className="text-sm">{clause.reason}</p>
                      </div>
                      <div className="rounded-md border p-3 bg-primary/5">
                        <h4 className="text-sm font-medium mb-1">Verhandlungsvorschlag:</h4>
                        <p className="text-sm">
                          {clause.risk === "high"
                            ? "Diese Klausel sollte neu verhandelt werden. Wir empfehlen eine deutliche Anpassung der Bedingungen."
                            : clause.risk === "medium"
                              ? "Diese Klausel sollte angepasst werden. Wir empfehlen moderate Änderungen zur Risikominimierung."
                              : "Diese Klausel ist akzeptabel, könnte aber bei Gelegenheit optimiert werden."}
                        </p>
                        {clause.risk === "high" && (
                          <div className="mt-2 p-2 bg-background rounded border border-primary/20">
                            <p className="text-sm font-medium text-primary">Alternativer Formulierungsvorschlag:</p>
                            <p className="text-sm mt-1">
                              {clause.title === "Vertragsstrafen"
                                ? "Bei Überschreitung der vereinbarten Fertigstellungstermine wird eine Vertragsstrafe in Höhe von 0,1% der Auftragssumme pro Werktag, maximal jedoch 5% der Auftragssumme, fällig."
                                : clause.title === "Haftungsbegrenzung"
                                  ? "Der Auftragnehmer haftet für Schäden, die durch seine Leistungen verursacht werden, bis zur Höhe der Auftragssumme. Für Folgeschäden und entgangenen Gewinn ist die Haftung ausgeschlossen, soweit gesetzlich zulässig."
                                  : "Alternativer Formulierungsvorschlag würde hier erscheinen."}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mt-3">
                        <h4 className="text-sm font-medium mb-1">Benutzerdefinierte Formulierung:</h4>
                        <div className="relative">
                          <textarea
                            placeholder="Geben Sie Ihre eigene Formulierung für diese Klausel ein..."
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px]"
                            value={clause.id === openClause ? customFormulation : ""}
                            onChange={(e) => setCustomFormulation(e.target.value)}
                          />
                          <div className="flex gap-2 mt-2 justify-end">
                            <Button size="sm" variant="outline" className="gap-1">
                              <Send className="h-4 w-4" />
                              <span>Einreichen</span>
                            </Button>
                            <Button 
                              size="sm" 
                              className="gap-1"
                              disabled={optimizingClauseId === clause.id}
                              onClick={() => handleOptimizeWithAI(clause.clauseText)}
                            >
                              {optimizingClauseId === clause.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <path d="M12 8V4H8" />
                                  <rect width="16" height="12" x="4" y="8" rx="2" />
                                  <path d="M2 14h2" />
                                  <path d="M20 14h2" />
                                  <path d="M15 13v2" />
                                  <path d="M9 13v2" />
                                </svg>
                              )}
                              <span>{optimizingClauseId === clause.id ? "Optimiere..." : "Mit KI optimieren"}</span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => addToContractEditor(clause)}>
                          Zum Vertragseditor hinzufügen
                        </Button>
                        <Button size="sm">Alternativen generieren</Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
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
                      <span className="font-medium">{riskScore}%</span>
                    </div>
                    <Progress value={riskScore} className="h-2">
                      <div
                        className={`h-full ${getProgressColor(riskScore)} rounded-full`}
                        style={{ width: `${riskScore}%` }}
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
                        data={riskDistributionData}
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
                        {riskDistributionData.map((entry, index) => (
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
                      data={riskCategoryData}
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
                        {riskCategoryData.map((entry, index) => (
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
                      className={`text-4xl font-bold ${negotiationProbability < 50 ? "text-red-500" : negotiationProbability < 75 ? "text-amber-500" : "text-green-500"}`}
                    >
                      {negotiationProbability}%
                    </div>
                    <Progress value={negotiationProbability} className="h-2 w-full">
                      <div
                        className={`h-full ${getNegotiationColor(negotiationProbability)} rounded-full`}
                        style={{ width: `${negotiationProbability}%` }}
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
