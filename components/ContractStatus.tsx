"use client";

import { useContract } from "@/hooks/useConvex";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface ContractStatusProps {
  contractId: Id<"contracts">;
}

// Typ direkt aus dem Datenmodell ableiten
type ContractStatusType = Doc<"contracts">["status"];

// Helper-Funktion zur Typprüfung
function isValidStatus(status: any): status is ContractStatusType {
  const validStatuses: ReadonlyArray<ContractStatusType> = [
    "pending", "preprocessing_structure", 
    "stage1_chunking_inprogress", "stage1_chunking_completed", "stage1_chunking_failed",
    "stage2_structuring_inprogress", "stage2_structuring_completed", "stage2_structuring_failed",
    "stage3_analysis_inprogress", "completed", "failed_partial_analysis", "failed", "archived"
  ];
  return validStatuses.includes(status);
}

export function ContractStatus({ contractId }: ContractStatusProps) {
  const { contract, isLoading } = useContract(contractId);
  
  if (isLoading) {
    return <ContractStatusSkeleton />;
  }
  
  if (!contract) {
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">Vertrag nicht gefunden</p>
      </div>
    );
  }
  
  const currentStatus = contract.status;

  // Status-Badge entsprechend dem Vertragsstatus
  const getStatusBadge = () => {
    if (!currentStatus || !isValidStatus(currentStatus)) {
        return <Badge variant="outline">Unbekannt</Badge>;
    }

    switch (currentStatus) {
      case "pending":
        return <Badge variant="outline">Warten</Badge>;
      case "stage1_chunking_inprogress":
        return <Badge variant="secondary">Stufe 1: Aufteilung</Badge>;
      case "stage1_chunking_completed":
        return <Badge variant="secondary">Stufe 1 abgeschlossen</Badge>;
      case "stage1_chunking_failed":
        return <Badge variant="destructive">Stufe 1 fehlgeschlagen</Badge>;
      case "stage2_structuring_inprogress":
        return <Badge variant="secondary">Stufe 2: Strukturierung</Badge>;
      case "stage2_structuring_completed":
        return <Badge variant="secondary">Stufe 2 abgeschlossen</Badge>;
      case "stage2_structuring_failed":
        return <Badge variant="destructive">Stufe 2 fehlgeschlagen</Badge>;
      case "stage3_analysis_inprogress":
        return <Badge variant="secondary">Stufe 3: Analyse</Badge>;
      case "failed_partial_analysis":
        return <Badge variant="destructive">Teilweise fehlgeschlagen</Badge>;
      case "preprocessing_structure":
        return <Badge variant="secondary">Vorverarbeitung</Badge>;
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Abgeschlossen</Badge>;
      case "failed":
        return <Badge variant="destructive">Fehlgeschlagen</Badge>;
      case "archived":
        return <Badge variant="outline">Archiviert</Badge>;
      // Kein default mehr nötig dank isValidStatus Prüfung oben
      // default: 
      //   const _exhaustiveCheck: never = currentStatus;
      //   return <Badge variant="outline">Unbekannt ({currentStatus})</Badge>;
    }
  };
  
  // Fortschrittsbalken - angepasst an neue Felder
  const getProgressValue = () => {
    if (!currentStatus || !isValidStatus(currentStatus)) {
        return 0;
    }

    switch (currentStatus) {
      case "completed": return 100;
      case "failed":
      case "stage1_chunking_failed":
      case "stage2_structuring_failed":
      case "failed_partial_analysis":
        return 0; 
      case "preprocessing_structure":
        return 5; 
      case "stage1_chunking_inprogress":
        return 10; 
      case "stage2_structuring_inprogress":
        const totalLarge = contract.totalLargeChunks ?? 0;
        const structuredLarge = contract.structuredLargeChunks ?? 0;
        if (totalLarge === 0) return 20; 
        return 20 + Math.max(5, Math.min(30, (structuredLarge / totalLarge) * 30));
      case "stage3_analysis_inprogress":
        const totalElements = contract.totalElementsToAnalyze ?? 0;
        const analyzed = contract.analyzedElements ?? 0;
        if (totalElements === 0) return 50; 
        return 50 + Math.max(5, Math.min(45, (analyzed / totalElements) * 45));
      // pending und archived geben 0 zurück
      case "pending":
      case "archived":
          return 0;
    }
  };
  
  // Detaillierter Statustext - angepasst an neue Felder und Status
  const getStatusText = () => {
    const details = contract.currentProcessingStepDetail ?? "";
    if (!currentStatus || !isValidStatus(currentStatus)) {
        return details || `Unbekannter Status: ${currentStatus}`;
    }
    
    switch (currentStatus) {
      case "pending":
        return "Warte auf Start der Verarbeitung...";
      case "preprocessing_structure":
        return details || "Extrahiere Text...";
      case "stage1_chunking_inprogress":
        return details || "Stufe 1: Teile Vertrag in Hauptabschnitte auf...";
      case "stage1_chunking_completed":
        return "Stufe 1 abgeschlossen. Starte Stufe 2...";
      case "stage1_chunking_failed":
        return "Stufe 1 (Aufteilung) fehlgeschlagen.";
      case "stage2_structuring_inprogress":
        const totalLarge = contract.totalLargeChunks ?? 0;
        const structuredLarge = contract.structuredLargeChunks ?? 0;
        const progressChunk = totalLarge > 0 ? `(${structuredLarge}/${totalLarge} Chunks)` : "";
        return details || `Stufe 2: Strukturiere Hauptabschnitte ${progressChunk}...`;
      case "stage2_structuring_completed":
        return "Stufe 2 abgeschlossen. Starte Stufe 3...";
      case "stage2_structuring_failed":
        return "Stufe 2 (Strukturierung) fehlgeschlagen.";
      case "stage3_analysis_inprogress":
        const totalElements = contract.totalElementsToAnalyze ?? 0;
        const analyzed = contract.analyzedElements ?? 0;
        const progressElement = totalElements > 0 ? `(${analyzed}/${totalElements} Elemente)` : "";
        return details || `Stufe 3: Analysiere Vertragselemente ${progressElement}...`;
      case "completed":
        const analyzedCount = contract.analyzedElements ?? 0;
        return `Analyse abgeschlossen! ${analyzedCount} Elemente analysiert.`;
      case "failed":
        return "Verarbeitung fehlgeschlagen.";
      case "failed_partial_analysis":
        return "Stufe 3 (Analyse) teilweise fehlgeschlagen.";
      case "archived":
        return "Vertrag ist archiviert.";
      // Kein default mehr nötig dank isValidStatus Prüfung oben
      // default:
      //   const _exhaustiveCheck: never = currentStatus;
      //   return details || `Unbekannter Status: ${currentStatus}`;
    }
  };
  
  // Zeigt den Fortschrittsbalken für alle laufenden Zustände an
  const showProgressBar = currentStatus && isValidStatus(currentStatus) && ![
      "pending", 
      "completed", 
      "failed", 
      "stage1_chunking_failed", 
      "stage2_structuring_failed", 
      "failed_partial_analysis",
      "archived"
    ].includes(currentStatus);
    
  // Zeigt Fehlerdetails an, wenn ein Fehlerstatus vorliegt
  const showErrorDetails = contract.errorDetails && currentStatus && isValidStatus(currentStatus) && [
      "failed", 
      "stage1_chunking_failed", 
      "stage2_structuring_failed", 
      "failed_partial_analysis"
    ].includes(currentStatus);

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Vertragsstatus</h3>
        {getStatusBadge()}
      </div>
      
      <p className="text-sm text-muted-foreground">{getStatusText()}</p>
      
      {showProgressBar && (
        <Progress value={getProgressValue()} className="h-2 w-full" />
      )}
      
      {showErrorDetails && (
         <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
           <p>{contract.errorDetails}</p>
         </div>
      )}
      
      {currentStatus === "completed" && (
        <p className="text-sm text-green-600">
          Alle {contract.analyzedElements ?? 0} relevanten Elemente erfolgreich analysiert.
        </p>
      )}
      {currentStatus === "failed_partial_analysis" && (
        <p className="text-sm text-amber-600">
          {contract.analyzedElements ?? 0} von {contract.totalElementsToAnalyze ?? '?'} Elementen analysiert. Einige Analysen sind fehlgeschlagen (siehe Details oben oder in den Elementen).
        </p>
      )}
    </div>
  );
}

function ContractStatusSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
} 