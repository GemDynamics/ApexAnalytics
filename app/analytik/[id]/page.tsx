"use client";

import React, { useMemo } from "react";
// ContractStatus wird nicht mehr direkt hier verwendet, da der Editor/Simulator dies ggf. intern handhaben oder wir es anders einbinden.
// import { ContractStatus } from "@/components/ContractStatus"; 
import { Skeleton } from "@/components/ui/skeleton";
import { useContract } from "@/hooks/useConvex";
import { Id, Doc } from "@/convex/_generated/dataModel";
// useRouter wird für die Weiterleitung nicht mehr benötigt
// import { useRouter } from "next/navigation"; 
import { ArrowLeft, AlertTriangle, PenLine, FileBarChart2, Calendar, HardDriveDownload } from "lucide-react";
import Link from "next/link";
import { ContractEditorWithContract } from "@/components/contract-editor-with-contract";
import { NegotiationSimulator } from "@/components/negotiation-simulator";
import { RiskAnalysisCharts } from "@/components/risk-analysis-charts"; // Annahme: Diese Komponente kann dynamische Daten verarbeiten
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// Importiere den EditorSection Typ, falls noch nicht geschehen
import type { EditorSection } from "@/components/contract-editor-with-contract";
import { Button } from "@/components/ui/button";
import { ApiLoading } from "@/components/api-loading";
import { AnalyticsLayout } from "@/components/analytics-layout";

interface ContractAnalysisPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ContractAnalysisPage({ params }: ContractAnalysisPageProps) {
  const resolvedParams = React.use(params); // React.use() für params
  const contractId = resolvedParams.id as Id<"contracts">;
  
  const { contract, isLoading } = useContract(contractId);
  // const router = useRouter(); // Nicht mehr benötigt für Weiterleitung
  // Hinzufügen eines State für den aktiven Tab
  const [activeTab, setActiveTab] = React.useState("edit");

  // Tab-Wechsel-Handler
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Hier könnte man weitere Aktionen beim Tab-Wechsel auslösen
  };

  // Transformation des analysisProtocol in das EditorSection[] Format für die Charts
  const chartAnalysisData: EditorSection[] = useMemo(() => {
    if (contract && contract.analysisProtocol) {
      return contract.analysisProtocol.map((clause, index) => {
        let riskLevel: EditorSection["risk"] = "low";
        switch (clause.evaluation.toLowerCase()) {
          case "rot": riskLevel = "high"; break;
          case "gelb": riskLevel = "medium"; break;
          case "grün": riskLevel = "low"; break;
          case "fehler": riskLevel = "error"; break;
        }
        return {
          id: `clause-${clause.chunkNumber || '0'}-${index}`,
          title: `Klausel (Chunk ${clause.chunkNumber || 'N/A'}, Index ${index + 1})`,
          content: clause.clauseText,
          risk: riskLevel,
          evaluation: clause.evaluation,
          reason: clause.reason,
          recommendation: clause.recommendation,
          needsRenegotiation: riskLevel === "high" || riskLevel === "medium",
          urgentAttention: riskLevel === "high",
          alternativeFormulations: [], // Werden von Charts nicht direkt verwendet
          chunkNumber: clause.chunkNumber,
        };
      });
    }
    return []; // Leeres Array, wenn keine Daten vorhanden sind
  }, [contract]);

  // Die Weiterleitung wird entfernt. Stattdessen zeigen wir die Komponenten an.
  // useEffect(() => {
  //   if (contract && contract.status === "completed") {
  //     const timer = setTimeout(() => {
  //       router.push(`/analyse-beispiel?contractId=${contractId}`);
  //     }, 2000);
      
  //     return () => clearTimeout(timer);
  //   }
  // }, [contract, contractId, router]);
  
  if (isLoading) {
    return (
      <AnalyticsLayout contractId={contractId}>
        <div className="flex items-center justify-center h-[calc(100vh-14rem)]">
          <ApiLoading
            title="Vertragsanalyse wird geladen"
            description="Bitte warten Sie, während die Vertragsdaten geladen werden..."
          />
        </div>
      </AnalyticsLayout>
    );
  }

  if (!contract) {
    return (
      <AnalyticsLayout contractId={contractId}>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Fehler: Vertrag nicht gefunden</CardTitle>
              <CardDescription>
                Der angeforderte Vertrag konnte nicht gefunden werden oder Sie haben keine Berechtigung, ihn einzusehen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="default" className="w-full">
                <Link href="/dashboard">Zurück zum Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AnalyticsLayout>
    );
  }

  if (contract.status !== "completed") {
    return (
      <AnalyticsLayout contractId={contractId}>
        <div className="container max-w-screen-lg mx-auto py-8 px-4">
          <div className="p-6 border rounded-lg bg-card mb-6">
            <p className="text-muted-foreground">
              Hochgeladen am: {new Date(contract.uploadedAt).toLocaleDateString('de-DE')}
            </p>
            <p className="text-muted-foreground mt-1">
              Status: <span className="font-semibold">{contract.status}</span>
            </p>
          </div>
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-lg text-blue-700 font-medium">
              Die Vertragsanalyse läuft noch. Bitte haben Sie etwas Geduld.
            </p>
            <p className="text-sm text-blue-600 mt-2">
              Diese Seite wird automatisch aktualisiert, sobald die Analyse abgeschlossen ist.
            </p>
          </div>
        </div>
      </AnalyticsLayout>
    );
  }

  // Wenn die Analyse abgeschlossen ist - zeige nur den Content (keine Tabs oder Header)
  return (
    <AnalyticsLayout contractId={contractId} initialTab="editor">
      <div className="space-y-6">
        {contract?.status === "completed" ? (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Status:</span> Analyse abgeschlossen
          </div>
        ) : contract?.status === "failed" ? (
          <div className="text-sm text-red-500">
            <span className="font-medium">Status:</span> Analyse fehlgeschlagen
          </div>
        ) : (
          <div className="text-sm text-amber-500">
            <span className="font-medium">Status:</span> In Bearbeitung
          </div>
        )}
      </div>
    </AnalyticsLayout>
  );
}
