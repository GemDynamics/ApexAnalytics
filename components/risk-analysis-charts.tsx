"use client"

import { Card, CardContent } from "@/components/ui/card"
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
  Tooltip,
  Legend,
} from "recharts"
import { ChartAnimationWrapper } from "@/components/chart-animation-wrapper"
import type { EditorSection } from "./contract-editor-with-contract"
import { useMemo } from "react"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { useContract } from "@/hooks/useConvex"
import { ApiLoading } from "@/components/api-loading"
import { AlertTriangle } from "lucide-react"

interface RiskAnalysisChartsProps {
  contractId: Id<"contracts">;
}

export function RiskAnalysisCharts({ contractId }: RiskAnalysisChartsProps) {
  const { contract, isLoading } = useContract(contractId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <ApiLoading title="Risikoanalyse wird geladen" description="Diagramme werden vorbereitet..." />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-2"/>
        <p>Vertragsdaten konnten nicht geladen werden.</p>
      </div>
    );
  }

  // Transformieren der Vertragsdaten in EditorSection-Format für die Charts
  const analysisData: EditorSection[] = useMemo(() => {
    if (!contract?.structuredContractElements || contract.structuredContractElements.length === 0) {
      return [];
    }

    return contract.structuredContractElements.map((element, index) => {
      // Risiko-Mapping
      let riskLevel: "low" | "medium" | "high" | "error" = "low";
      const evaluation = element.evaluation || "grün"; // Fallback, falls keine Bewertung vorhanden ist
      
      switch (evaluation.toLowerCase()) {
        case "rot":
          riskLevel = "high";
          break;
        case "gelb":
          riskLevel = "medium";
          break;
        case "grün":
          riskLevel = "low";
          break;
        case "fehler":
          riskLevel = "error";
          break;
      }

      return {
        id: `chart-clause-${element.globalOriginalOrder || '0'}-${index}`,
        title: element.elementType === 'clauseH3' ? `Klausel ${index + 1}` : `Element ${element.globalOriginalOrder || index + 1}`,
        content: element.markdownContent || "",
        risk: riskLevel,
        evaluation: evaluation,
        reason: element.reason || "",
        recommendation: element.recommendation || "",
        needsRenegotiation: riskLevel === "high" || riskLevel === "medium",
        urgentAttention: riskLevel === "high",
        chunkNumber: element.globalOriginalOrder,
        elementType: element.elementType || 'clauseH3',
      };
    });
  }, [contract]);

  const { riskByCategory, riskDistribution, riskRadarData } = useMemo(() => {
    if (!analysisData || analysisData.length === 0) {
      return { riskByCategory: [], riskDistribution: [], riskRadarData: [] }
    }

    // 1. Risiko nach Kategorie (Beispiel: Aggregation nach Titel - vereinfacht)
    //    In einer echten Anwendung wäre eine bessere Kategorisierung nötig.
    const categoryCounts: { [key: string]: { high: number; medium: number; low: number; error: number; total: number } } = {}
    analysisData.forEach(section => {
      // Einfache Kategorisierung nach dem ersten Wort des Titels oder dem Chunk
      const categoryName = section.title.split(" ")[0] === "Klausel" ? `Chunk ${section.chunkNumber || 'Unbekannt'}` : section.title.split(" ")[0]
      if (!categoryCounts[categoryName]) {
        categoryCounts[categoryName] = { high: 0, medium: 0, low: 0, error: 0, total: 0 }
      }
      // Ensure section.risk is a valid key
      if (categoryCounts[categoryName].hasOwnProperty(section.risk)) {
        categoryCounts[categoryName][section.risk]++
      }
      categoryCounts[categoryName].total++
    })
    const calculatedRiskByCategory = Object.entries(categoryCounts).map(([name, counts]) => {
      // Einfache Risikoberechnung (gewichteter Durchschnitt - anpassbar)
      const score = ((counts.high * 100) + (counts.medium * 50) + (counts.error * 100)) / counts.total
      return { name, risk: Math.min(100, Math.round(score || 0)) } // Auf 100 begrenzen
    }).sort((a, b) => b.risk - a.risk) // Nach Risiko sortieren

    // 2. Risikoverteilung
    const calculatedRiskDistribution = [
      { name: "Hohes Risiko", value: analysisData.filter(s => s.risk === "high").length, color: "#ef4444" }, // Tailwind red-500
      { name: "Mittleres Risiko", value: analysisData.filter(s => s.risk === "medium").length, color: "#f59e0b" }, // Tailwind amber-500
      { name: "Niedriges Risiko", value: analysisData.filter(s => s.risk === "low").length, color: "#22c55e" }, // Tailwind green-500
      { name: "Analysefehler", value: analysisData.filter(s => s.risk === "error").length, color: "#71717a" }, // Tailwind zinc-500
    ].filter(item => item.value > 0) // Nur Kategorien mit Wert anzeigen

    // 3. Risiko-Radar-Analyse (Beispiel: Annahme fester Kategorien)
    const highRiskCount = analysisData.filter(s => s.risk === "high").length
    const mediumRiskCount = analysisData.filter(s => s.risk === "medium").length
    const totalRiskSections = analysisData.filter(s => s.risk === "high" || s.risk === "medium").length // Korrektur: Gesamtzahl der Risiko-Sektionen
    const calculatedRiskRadarData = [
      { subject: "Finanziell", A: Math.min(100, Math.round((highRiskCount * 0.7 + mediumRiskCount * 0.3) * (100 / (totalRiskSections || 1)))), fullMark: 100 },
      { subject: "Rechtlich", A: Math.min(100, Math.round((highRiskCount * 0.8 + mediumRiskCount * 0.2) * (100 / (totalRiskSections || 1)))), fullMark: 100 },
      { subject: "Zeitlich", A: Math.min(100, Math.round((highRiskCount * 0.4 + mediumRiskCount * 0.6) * (100 / (totalRiskSections || 1)))), fullMark: 100 },
      { subject: "Technisch", A: Math.min(100, Math.round((highRiskCount * 0.2 + mediumRiskCount * 0.3) * (100 / (totalRiskSections || 1)))), fullMark: 100 },
      { subject: "Operativ", A: Math.min(100, Math.round((highRiskCount * 0.5 + mediumRiskCount * 0.5) * (100 / (totalRiskSections || 1)))), fullMark: 100 },
    ]

    return { 
      riskByCategory: calculatedRiskByCategory, 
      riskDistribution: calculatedRiskDistribution, 
      riskRadarData: calculatedRiskRadarData 
    }
  }, [analysisData])

  if (!analysisData || analysisData.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground min-h-[300px] flex items-center justify-center">
        Keine Analysedaten für Diagramme verfügbar.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Risiko nach Kategorie</h3>
            <ChartAnimationWrapper className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid horizontal strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} stroke="#888888" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={90} stroke="#888888" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '0.5rem' }} itemStyle={{color: '#333'}}/>
                  <Bar dataKey="risk" radius={[0, 4, 4, 0]} barSize={20} label={{ position: "right", formatter: (value: number) => `${value}%`, fill: "#666", fontSize: 12 }} animationDuration={1500}>
                    {riskByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.risk >= 70 ? "#ef4444" : entry.risk >= 50 ? "#f59e0b" : "#22c55e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartAnimationWrapper>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Risikoverteilung</h3>
            <ChartAnimationWrapper className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}> {/* Adjusted margins */}
                  <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" labelLine={false} label={({ name, percent, value }) => value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}  animationDuration={1500}>
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '0.5rem' }}/>
                  <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}/>
                </PieChart>
              </ResponsiveContainer>
            </ChartAnimationWrapper>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Risiko-Radar-Analyse</h3>
          <ChartAnimationWrapper className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskRadarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" stroke="#888888" fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#e5e7eb" fontSize={10} />
                <Radar name="Risikolevel" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '0.5rem' }}/>
                <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}/>
              </RadarChart>
            </ResponsiveContainer>
          </ChartAnimationWrapper>
        </CardContent>
      </Card>
    </div>
  )
}