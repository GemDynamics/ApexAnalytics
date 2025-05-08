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
} from "recharts"
import { ChartAnimationWrapper } from "@/components/chart-animation-wrapper"

export function RiskAnalysisCharts() {
  // Beispieldaten für die Risikoanalyse
  const riskByCategory = [
    { name: "Vertragsstrafen", risk: 85 },
    { name: "Haftung", risk: 80 },
    { name: "Zahlungsbedingungen", risk: 55 },
    { name: "Kündigung", risk: 50 },
    { name: "Gewährleistung", risk: 25 },
    { name: "Abnahme", risk: 20 },
  ]

  const riskDistribution = [
    { name: "Hohes Risiko", value: 2, color: "#b91c1c" }, // Darker red
    { name: "Mittleres Risiko", value: 2, color: "#d97706" }, // Darker amber
    { name: "Niedriges Risiko", value: 2, color: "#15803d" }, // Darker green
  ]

  const riskRadarData = [
    { subject: "Finanziell", A: 80, fullMark: 100 },
    { subject: "Rechtlich", A: 65, fullMark: 100 },
    { subject: "Zeitlich", A: 45, fullMark: 100 },
    { subject: "Technisch", A: 30, fullMark: 100 },
    { subject: "Operativ", A: 55, fullMark: 100 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Risiko nach Kategorie</h3>
            <ChartAnimationWrapper className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid horizontal strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={90} />
                  <Bar
                    dataKey="risk"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                    label={{ position: "right", formatter: (value: number) => `${value}%`, fill: "#888", fontSize: 12 }}
                    animationDuration={1500}
                  >
                    {riskByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.risk >= 70 ? "#b91c1c" : entry.risk >= 50 ? "#d97706" : "#15803d"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartAnimationWrapper>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Risikoverteilung</h3>
            <ChartAnimationWrapper className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                    labelStyle={{ fontSize: "12px" }}
                    animationDuration={1500}
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartAnimationWrapper>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Risiko-Radar-Analyse</h3>
          <ChartAnimationWrapper className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskRadarData} animationDuration={1500}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Risikolevel" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartAnimationWrapper>
        </CardContent>
      </Card>
    </div>
  )
}
