"use client"

import Link from "next/link"
import { FileText, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Doc } from "@/convex/_generated/dataModel"

export interface ContractListProps {
  contracts: Doc<"contracts">[] | null | undefined;
  isLoading: boolean;
  selectedContractId?: string;
  isMobile?: boolean;
  isCollapsed?: boolean;
  setIsCollapsed?: (isCollapsed: boolean) => void;
}

export function ContractsList(props: ContractListProps) {
  const { contracts, isLoading, selectedContractId, isCollapsed, isMobile } = props;

  type ContractStatusType = Doc<"contracts">["status"];

  const getStatusVariant = (status: ContractStatusType): "secondary" | "destructive" | "outline" => {
    switch (status) {
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
      case "failed": return "Fehler";
      case "stage1_chunking_failed": return "Fehler Stufe 1";
      case "stage2_structuring_failed": return "Fehler Stufe 2";
      case "failed_partial_analysis": return "Fehler Stufe 3";
      case "archived": return "Archiviert";
      default: return "Unbekannt";
    }
  };

  const stripFileExtension = (filename: string) => {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) return filename;
    return filename.substring(0, lastDot);
  };

  if (isCollapsed && !isMobile) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meine Verträge</CardTitle>
          <CardDescription>Aktuelle Analysen und Vertragsentwürfe.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[70px] w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Meine Verträge</CardTitle>
        <CardDescription>Aktuelle Analysen und Vertragsentwürfe.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {contracts && contracts.length > 0 ? (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <Link 
                href={`/analytik/${contract._id}`} 
                key={contract._id} 
                className={`block hover:bg-muted/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${selectedContractId === contract._id ? 'bg-muted' : ''}`}
                aria-current={selectedContractId === contract._id ? "page" : undefined}
              >
                <div className="flex items-center justify-between p-3 border rounded-lg w-full min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-sm truncate whitespace-nowrap overflow-hidden text-ellipsis">
                        {stripFileExtension(contract.fileName || 'Unbenannter Vertrag')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hochgeladen: {contract.uploadedAt ? new Date(contract.uploadedAt).toLocaleDateString('de-DE') : '-'}
                      </p>
                    </div>
                  </div>
                  {contract.status !== 'completed' && (
                    <Badge
                      variant={getStatusVariant(contract.status)}
                      className={`flex-shrink-0 ml-3`}
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
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Noch keine Verträge hochgeladen.</p>
        )}
      </CardContent>
    </Card>
  );
}
