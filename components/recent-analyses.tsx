"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, AlertTriangle, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { useContracts } from "@/hooks/useConvex"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { Doc } from "@/convex/_generated/dataModel"

export function RecentAnalyses() {
  const { contracts, isLoading } = useContracts();

  const getStatusVariant = (status: Doc<"contracts">["status"]) => {
    switch (status) {
      case "completed":
        return "default";
      case "processing":
      case "chunking":
        return "secondary";
      case "failed":
        return "destructive";
      case "pending":
      default:
        return "outline";
    }
  };

  const getStatusText = (status: Doc<"contracts">["status"]) => {
    switch (status) {
      case "pending": return "Warten";
      case "processing": return "In Bearbeitung";
      case "chunking": return "Vorbereitung";
      case "completed": return "Abgeschlossen";
      case "failed": return "Fehlgeschlagen";
      default: return "Unbekannt";
    }
  };
  
  const recentContracts = contracts
    ?.sort((a, b) => b.uploadedAt - a.uploadedAt)
    .slice(0, 5);

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
    <Card>
      <CardHeader>
        <CardTitle>Letzte Analysen</CardTitle>
        <CardDescription>Ihre zuletzt hochgeladenen und analysierten Verträge.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : recentContracts && recentContracts.length > 0 ? (
            <div className="space-y-3">
              {recentContracts.map((contract) => (
                <Link href={`/analytik/${contract._id}`} key={contract._id} className="block hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
                          {contract.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hochgeladen: {new Date(contract.uploadedAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={getStatusVariant(contract.status)}
                      className={contract.status === 'completed' ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                    >
                      {contract.status === 'processing' || contract.status === 'chunking' ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : null}
                      {getStatusText(contract.status)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Noch keine Analysen vorhanden.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
