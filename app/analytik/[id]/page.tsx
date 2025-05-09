"use client";

import React, { useMemo } from "react";
// ContractStatus wird nicht mehr direkt hier verwendet, da der Editor/Simulator dies ggf. intern handhaben oder wir es anders einbinden.
// import { ContractStatus } from "@/components/ContractStatus"; 
import { Skeleton } from "@/components/ui/skeleton";
import { useContract } from "@/hooks/useConvex";
import { Id } from "@/convex/_generated/dataModel";
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

// Neue Komponente für die Vertragszusammenfassung
interface ContractSummaryProps {
  contract: Doc<"contracts"> | undefined;
}

function ContractSummary({ contract }: ContractSummaryProps) {
  if (!contract) {
    return <div>Keine Vertragsdaten verfügbar</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vertragszusammenfassung</CardTitle>
        <CardDescription>Übersicht der wichtigsten Vertragsdetails</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">Vertragsdokument</h3>
            <p>{contract.fileName}</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Status</h3>
            <p>{contract.status}</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Hochgeladen am</h3>
            <p>{new Date(contract.uploadedAt).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Analysierte Klauseln</h3>
            <p>{contract.analysisProtocol?.length || 0}</p>
          </div>
          {contract.lastEditedAt && (
            <div>
              <h3 className="font-medium mb-1">Zuletzt bearbeitet</h3>
              <p>{new Date(contract.lastEditedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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
      <div className="flex items-center justify-center h-[calc(100vh-14rem)]">
        <ApiLoading
          title="Vertragsanalyse wird geladen"
          description="Bitte warten Sie, während die Vertragsdaten geladen werden..."
        />
      </div>
    );
  }

  if (!contract) {
    return (
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
    );
  }

  if (contract.status !== "completed") {
    return (
      <div className="container max-w-screen-lg mx-auto py-8 px-4">
        <div className="mb-6">
          <Link 
            href="/" 
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Zurück zur Startseite
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-4">Analyse für: {contract.fileName}</h1>
        <div className="p-6 border rounded-lg bg-card mb-6">
          <p className="text-muted-foreground">
            Hochgeladen am: {new Date(contract.uploadedAt).toLocaleDateString('de-DE')}
          </p>
          <p className="text-muted-foreground mt-1">
            Status: <span className="font-semibold">{contract.status}</span>
          </p>
        </div>
        {/* ContractStatus kann hier optional wieder eingefügt werden, wenn gewünscht */}
        {/* <ContractStatus contractId={contractId} />  */}
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-lg text-blue-700 font-medium">
            Die Vertragsanalyse läuft noch. Bitte haben Sie etwas Geduld.
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Diese Seite wird automatisch aktualisiert, sobald die Analyse abgeschlossen ist. (Hinweis: Automatische Aktualisierung muss implementiert werden, oder der Benutzer muss manuell aktualisieren)
          </p>
          {/* Hier könnte ein Ladeindikator oder Fortschrittsbalken von ContractStatus platziert werden */}
        </div>
      </div>
    );
  }

  // Wenn die Analyse abgeschlossen ist, zeige Editor, Analyse-Charts und Simulator
  return (
    <div className="container py-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {contract.fileName}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {contract.status === "completed" ? "Analyse abgeschlossen" : contract.status === "failed" ? "Analyse fehlgeschlagen" : "In Bearbeitung"}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1" disabled>
            <HardDriveDownload className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="edit" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="edit" className="gap-1">
            <PenLine className="h-4 w-4" />
            <span>Vertragseditor</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1">
            <FileBarChart2 className="h-4 w-4" />
            <span>Risikoanalyse</span>
          </TabsTrigger>
          <TabsTrigger value="negotiation" className="gap-1">
            <Calendar className="h-4 w-4" />
            <span>Verhandlungssimulator</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-1">
            <FileBarChart2 className="h-4 w-4" />
            <span>Zusammenfassung</span>
          </TabsTrigger>
        </TabsList>
        
        <Separator />

        <TabsContent value="edit" className="pt-4">
          <ContractEditorWithContract contractId={contractId} />
        </TabsContent>
        
        <TabsContent value="analytics" className="pt-4">
          <RiskAnalysisCharts contract={contract} />
        </TabsContent>
        
        <TabsContent value="negotiation" className="pt-4">
          <NegotiationSimulator contractId={contractId} />
        </TabsContent>
        
        <TabsContent value="summary" className="pt-4">
          <ContractSummary contract={contract} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
