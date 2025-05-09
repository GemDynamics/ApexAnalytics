"use client"

import Link from "next/link"
import { FileText, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useContracts } from "@/hooks/useConvex"
import { Skeleton } from "@/components/ui/skeleton"
import type { Doc } from "@/convex/_generated/dataModel"

export function ContractsList() {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meine Verträge</CardTitle>
        <CardDescription>Liste Ihrer hochgeladenen und analysierten Verträge.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
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
            <p className="text-center text-muted-foreground py-8">Noch keine Verträge hochgeladen.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
