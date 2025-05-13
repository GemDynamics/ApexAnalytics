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

type ContractStatusType = Doc<"contracts">["status"];

export function RecentAnalyses() {
  const { contracts, isLoading } = useContracts();

  const getStatusVariant = (status: ContractStatusType): "secondary" | "destructive" | "outline" | "default" => {
    switch (status) {
      case "completed":
        return "default";
      case "stage1_chunking_inprogress":
      case "stage2_structuring_inprogress":
      case "stage3_analysis_inprogress":
      case "preprocessing_structure":
        return "secondary";
      case "failed":
      case "stage1_chunking_failed":
      case "stage2_structuring_failed":
      case "failed_partial_analysis":
        return "destructive";
      case "pending":
      case "archived":
      default:
        const knownStatus: ContractStatusType | undefined = status;
        if (knownStatus === undefined) return "outline";
        return "outline";
    }
  };

  const getStatusText = (status: ContractStatusType) => {
    switch (status) {
      case "pending": return "Warten";
      case "preprocessing_structure": return "Verarbeite";
      case "stage1_chunking_inprogress": return "Stufe 1...";
      case "stage2_structuring_inprogress": return "Stufe 2...";
      case "stage3_analysis_inprogress": return "Stufe 3...";
      case "completed": return "Abgeschlossen";
      case "failed": return "Fehler";
      case "stage1_chunking_failed": return "Fehler Stufe 1";
      case "stage2_structuring_failed": return "Fehler Stufe 2";
      case "failed_partial_analysis": return "Fehler Stufe 3";
      case "archived": return "Archiviert";
      default: return "Unbekannt";
    }
  };
  
  const recentContracts = contracts
    ?.sort((a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0))
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Letzte Analysen</CardTitle>
          <CardDescription>Die 5 zuletzt hochgeladenen Verträge.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[60px] w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Letzte Analysen</CardTitle>
        <CardDescription>Die 5 zuletzt hochgeladenen Verträge.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {recentContracts && recentContracts.length > 0 ? (
            <div className="space-y-3 pr-4">
              {recentContracts.map((contract) => (
                <Link href={`/analytik/${contract._id}`} key={contract._id} className="block hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {contract.fileName || 'Unbenannter Vertrag'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hochgeladen: {contract.uploadedAt ? new Date(contract.uploadedAt).toLocaleDateString('de-DE') : '-'}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={getStatusVariant(contract.status)}
                      className={`${contract.status === 'completed' ? 'bg-green-500 text-white hover:bg-green-600' : ''} flex-shrink-0 ml-2`}
                    >
                      {(
                        contract.status === 'preprocessing_structure' ||
                        contract.status === 'stage1_chunking_inprogress' ||
                        contract.status === 'stage2_structuring_inprogress' ||
                        contract.status === 'stage3_analysis_inprogress'
                      ) ? (
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
