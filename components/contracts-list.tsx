"use client"

import Link from "next/link"
import { FileText, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useContracts } from "@/hooks/useConvex"
import { Skeleton } from "@/components/ui/skeleton"
import type { Doc } from "@/convex/_generated/dataModel"

export function ContractsList() {
  const { contracts, isLoading } = useContracts();

  const getStatusVariant = (status: Doc<"contracts">["status"]) => {
    switch (status) {
      case "processing":
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
      case "failed": return "Fehlgeschlagen";
      default: return "Unbekannt";
    }
  };

  const stripFileExtension = (filename: string) => {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) return filename; // Keine Endung oder Punkt am Anfang
    return filename.substring(0, lastDot);
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Meine Verträge</CardTitle>
        <CardDescription>Liste Ihrer hochgeladenen und analysierten Verträge.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
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
          ) : contracts && contracts.length > 0 ? (
            <div className="space-y-3">
              {contracts.map((contract) => (
              <Link href={`/analytik/${contract._id}`} key={contract._id} className="block hover:bg-muted/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50">
                <div className="flex items-center justify-between p-3 border rounded-lg w-full min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-sm truncate whitespace-nowrap overflow-hidden text-ellipsis">
                        {stripFileExtension(contract.fileName)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hochgeladen: {new Date(contract.uploadedAt).toLocaleDateString('de-DE')}
                        </p>
            </div>
            </div>
                  {contract.status !== 'completed' && (
                    <Badge 
                      variant={getStatusVariant(contract.status)}
                      className={`flex-shrink-0 ml-3`}
                    >
                      {contract.status === 'processing' || contract.status === 'chunking' ? (
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
  )
}
