"use client";

import { useContract } from "@/hooks/useConvex";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface ContractStatusProps {
  contractId: Id<"contracts">;
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
  
  // Status-Badge entsprechend dem Vertragsstatus
  const getStatusBadge = () => {
    switch (contract.status) {
      case "pending":
        return <Badge variant="outline">Warten</Badge>;
      case "processing":
        return <Badge variant="secondary">In Bearbeitung</Badge>;
      case "chunking":
        return <Badge variant="secondary">Wird vorbereitet</Badge>;
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Abgeschlossen</Badge>;
      case "failed":
        return <Badge variant="destructive">Fehlgeschlagen</Badge>;
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };
  
  // Fortschrittsbalken für Processing-Status
  const getProgressValue = () => {
    if (contract.status === "completed") return 100;
    if (contract.status === "failed") return 0;
    if (!contract.totalChunks || contract.totalChunks === 0) return 0;
    
    const processedPercentage = ((contract.processedChunks || 0) / contract.totalChunks) * 100;
    return Math.max(5, Math.min(95, processedPercentage)); // Mindestens 5%, maximal 95% während der Verarbeitung
  };
  
  // Detaillierter Statustext
  const getStatusText = () => {
    switch (contract.status) {
      case "pending":
        return "Warte auf Beginn der Analyse...";
      case "processing":
        return `Verarbeite Vertrag (${contract.processedChunks || 0}/${contract.totalChunks || "?"})...`;
      case "chunking":
        return `Bereite Text für Analyse vor (${contract.totalChunks || 0} Teile)...`;
      case "completed":
        return "Analyse abgeschlossen!";
      case "failed":
        return "Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.";
      default:
        return "Unbekannter Status";
    }
  };
  
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Vertragsstatus</h3>
        {getStatusBadge()}
      </div>
      
      <p className="text-sm text-muted-foreground">{getStatusText()}</p>
      
      {(contract.status === "processing" || contract.status === "chunking") && (
        <Progress value={getProgressValue()} className="h-2 w-full" />
      )}
      
      {contract.status === "completed" && (
        <p className="text-sm text-green-600">
          <span className="font-medium">{contract.analysisProtocol?.length || 0}</span> Klauseln analysiert
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