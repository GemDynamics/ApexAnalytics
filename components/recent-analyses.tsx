"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"

export function RecentAnalyses() {
  // Sample data for recent analyses
  const [analyses] = useState([
    {
      id: "1",
      name: "Wohngebäude München-Schwabing",
      client: "Stadt München",
      date: "2 Stunden",
      riskScore: 75,
      riskLevel: "high",
      negotiationProbability: 65,
      highRiskClauses: 3,
      mediumRiskClauses: 5,
      lowRiskClauses: 4,
      riskDistribution: [
        { name: "Hoch", value: 3, color: "#ef4444" },
        { name: "Mittel", value: 5, color: "#f59e0b" },
        { name: "Niedrig", value: 4, color: "#22c55e" },
      ],
      riskRadar: [
        { subject: "Finanziell", value: 80, fullMark: 100 },
        { subject: "Rechtlich", value: 65, fullMark: 100 },
        { subject: "Zeitlich", value: 45, fullMark: 100 },
        { subject: "Technisch", value: 30, fullMark: 100 },
        { subject: "Operativ", value: 55, fullMark: 100 },
      ],
      topRisks: [
        { name: "Vertragsstrafen", risk: 85 },
        { name: "Haftung", risk: 80 },
        { name: "Zahlungsbedingungen", risk: 55 },
      ],
    },
    {
      id: "2",
      name: "Bürogebäude Frankfurt",
      client: "Immobilien GmbH",
      date: "Gestern",
      riskScore: 45,
      riskLevel: "medium",
      negotiationProbability: 82,
      highRiskClauses: 1,
      mediumRiskClauses: 6,
      lowRiskClauses: 8,
      riskDistribution: [
        { name: "Hoch", value: 1, color: "#ef4444" },
        { name: "Mittel", value: 6, color: "#f59e0b" },
        { name: "Niedrig", value: 8, color: "#22c55e" },
      ],
      riskRadar: [
        { subject: "Finanziell", value: 50, fullMark: 100 },
        { subject: "Rechtlich", value: 45, fullMark: 100 },
        { subject: "Zeitlich", value: 35, fullMark: 100 },
        { subject: "Technisch", value: 40, fullMark: 100 },
        { subject: "Operativ", value: 35, fullMark: 100 },
      ],
      topRisks: [
        { name: "Haftung", risk: 70 },
        { name: "Zahlungsbedingungen", risk: 45 },
        { name: "Kündigung", risk: 40 },
      ],
    },
    {
      id: "3",
      name: "Schulgebäude Berlin",
      client: "Berliner Schulbau",
      date: "2 Tage",
      riskScore: 30,
      riskLevel: "low",
      negotiationProbability: 90,
      highRiskClauses: 0,
      mediumRiskClauses: 4,
      lowRiskClauses: 10,
      riskDistribution: [
        { name: "Hoch", value: 0, color: "#ef4444" },
        { name: "Mittel", value: 4, color: "#f59e0b" },
        { name: "Niedrig", value: 10, color: "#22c55e" },
      ],
      riskRadar: [
        { subject: "Finanziell", value: 30, fullMark: 100 },
        { subject: "Rechtlich", value: 25, fullMark: 100 },
        { subject: "Zeitlich", value: 35, fullMark: 100 },
        { subject: "Technisch", value: 20, fullMark: 100 },
        { subject: "Operativ", value: 25, fullMark: 100 },
      ],
      topRisks: [
        { name: "Zahlungsbedingungen", risk: 35 },
        { name: "Kündigung", risk: 30 },
        { name: "Gewährleistung", risk: 25 },
      ],
    },
    {
      id: "4",
      name: "Brückensanierung Hamburg",
      client: "Hansestadt Hamburg",
      date: "3 Tage",
      riskScore: 60,
      riskLevel: "medium",
      negotiationProbability: 75,
      highRiskClauses: 2,
      mediumRiskClauses: 5,
      lowRiskClauses: 7,
      riskDistribution: [
        { name: "Hoch", value: 2, color: "#ef4444" },
        { name: "Mittel", value: 5, color: "#f59e0b" },
        { name: "Niedrig", value: 7, color: "#22c55e" },
      ],
      riskRadar: [
        { subject: "Finanziell", value: 60, fullMark: 100 },
        { subject: "Rechtlich", value: 55, fullMark: 100 },
        { subject: "Zeitlich", value: 65, fullMark: 100 },
        { subject: "Technisch", value: 50, fullMark: 100 },
        { subject: "Operativ", value: 45, fullMark: 100 },
      ],
      topRisks: [
        { name: "Vertragsstrafen", risk: 75 },
        { name: "Haftung", risk: 65 },
        { name: "Zahlungsbedingungen", risk: 50 },
      ],
    },
    {
      id: "5",
      name: "Einkaufszentrum Köln",
      client: "Retail Invest AG",
      date: "5 Tage",
      riskScore: 55,
      riskLevel: "medium",
      negotiationProbability: 78,
      highRiskClauses: 1,
      mediumRiskClauses: 7,
      lowRiskClauses: 6,
      riskDistribution: [
        { name: "Hoch", value: 1, color: "#ef4444" },
        { name: "Mittel", value: 7, color: "#f59e0b" },
        { name: "Niedrig", value: 6, color: "#22c55e" },
      ],
      riskRadar: [
        { subject: "Finanziell", value: 55, fullMark: 100 },
        { subject: "Rechtlich", value: 50, fullMark: 100 },
        { subject: "Zeitlich", value: 60, fullMark: 100 },
        { subject: "Technisch", value: 45, fullMark: 100 },
        { subject: "Operativ", value: 50, fullMark: 100 },
      ],
      topRisks: [
        { name: "Vertragsstrafen", risk: 70 },
        { name: "Zahlungsbedingungen", risk: 55 },
        { name: "Kündigung", risk: 50 },
      ],
    },
    {
      id: "6",
      name: "Krankenhaus Erweiterung Stuttgart",
      client: "Klinikum Stuttgart",
      date: "1 Woche",
      riskScore: 25,
      riskLevel: "low",
      negotiationProbability: 95,
      highRiskClauses: 0,
      mediumRiskClauses: 3,
      lowRiskClauses: 12,
      riskDistribution: [
        { name: "Hoch", value: 0, color: "#ef4444" },
        { name: "Mittel", value: 3, color: "#f59e0b" },
        { name: "Niedrig", value: 12, color: "#22c55e" },
      ],
      riskRadar: [
        { subject: "Finanziell", value: 25, fullMark: 100 },
        { subject: "Rechtlich", value: 20, fullMark: 100 },
        { subject: "Zeitlich", value: 30, fullMark: 100 },
        { subject: "Technisch", value: 15, fullMark: 100 },
        { subject: "Operativ", value: 20, fullMark: 100 },
      ],
      topRisks: [
        { name: "Zahlungsbedingungen", risk: 30 },
        { name: "Gewährleistung", risk: 25 },
        { name: "Kündigung", risk: 20 },
      ],
    },
  ])

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
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

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-amber-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getNegotiationColor = (probability: number) => {
    if (probability < 50) return "bg-red-500"
    if (probability < 75) return "bg-amber-500"
    return "bg-green-500"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {analyses.map((analysis) => (
        <Card key={analysis.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{analysis.name}</CardTitle>
              </div>
              {getRiskIcon(analysis.riskLevel)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              <div className="flex justify-between">
                <span>Kunde: {analysis.client}</span>
                <span>Vor: {analysis.date}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="klauseln" className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
                <TabsTrigger value="klauseln" className="text-xs">
                  Klauseln
                </TabsTrigger>
                <TabsTrigger value="risiko" className="text-xs">
                  Risiko
                </TabsTrigger>
                <TabsTrigger value="radar" className="text-xs">
                  Radar
                </TabsTrigger>
                <TabsTrigger value="verhandlung" className="text-xs">
                  Verhandlung
                </TabsTrigger>
              </TabsList>

              <TabsContent value="klauseln" className="p-4 pt-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Risikobewertung:</span>
                    <span className="font-medium">{analysis.riskScore}%</span>
                  </div>
                  <Progress value={analysis.riskScore} className="h-2">
                    <div
                      className={`h-full ${getRiskColor(analysis.riskLevel)} rounded-full`}
                      style={{ width: `${analysis.riskScore}%` }}
                    />
                  </Progress>

                  <div className="flex gap-2 mt-3">
                    <Badge variant="destructive" className="rounded-sm">
                      {analysis.highRiskClauses} Hoch
                    </Badge>
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 rounded-sm">
                      {analysis.mediumRiskClauses} Mittel
                    </Badge>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 rounded-sm">
                      {analysis.lowRiskClauses} Niedrig
                    </Badge>
                  </div>

                  <div className="space-y-1 mt-3">
                    {analysis.topRisks.map((risk, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>{risk.name}</span>
                        <span
                          className={`font-medium ${
                            risk.risk > 70 ? "text-red-500" : risk.risk > 50 ? "text-amber-500" : "text-green-500"
                          }`}
                        >
                          {risk.risk}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="risiko" className="p-4 pt-3">
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analysis.riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {analysis.riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[100px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analysis.topRisks}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                    >
                      <Bar dataKey="risk" radius={[0, 4, 4, 0]} barSize={10}>
                        {analysis.topRisks.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.risk > 70 ? "#ef4444" : entry.risk > 50 ? "#f59e0b" : "#22c55e"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="radar" className="p-4 pt-3">
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analysis.riskRadar}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <Radar name="Risiko" dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="verhandlung" className="p-4 pt-3">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Verhandlungschance:</span>
                      <span className="font-medium">{analysis.negotiationProbability}%</span>
                    </div>
                    <Progress value={analysis.negotiationProbability} className="h-2">
                      <div
                        className={`h-full ${getNegotiationColor(analysis.negotiationProbability)} rounded-full`}
                        style={{ width: `${analysis.negotiationProbability}%` }}
                      />
                    </Progress>
                  </div>

                  <div className="text-sm mt-2">
                    <p className="font-medium mb-1">Empfohlene Verhandlungspunkte:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {analysis.topRisks.map((risk, idx) => (
                        <li key={idx}>{risk.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex border-t p-3 gap-2">
              <Link href={`/analytik/${analysis.id}?tab=analyse`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Zur Analyse
                </Button>
              </Link>
              <Link href={`/analytik/${analysis.id}?tab=verhandlung`} className="flex-1">
                <Button size="sm" className="w-full">
                  Zur Verhandlung
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
