"use client";

import { ContractStatus } from "@/components/ContractStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { useContract } from "@/hooks/useConvex";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ContractAnalysisPage({ params }: { params: { id: string } }) {
  const contractId = params.id as Id<"contracts">;
  const { contract, isLoading } = useContract(contractId);
  const router = useRouter();
  
  // Weiterleitung zur vollständigen Analyse-Seite, wenn fertig
  useEffect(() => {
    if (contract && contract.status === "completed") {
      // Optional: setTimeout für bessere UX, damit der Nutzer kurz den Status sieht
      const timer = setTimeout(() => {
        router.push(`/analyse-beispiel?contractId=${contractId}`);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [contract, contractId, router]);
  
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
      
      <h1 className="text-3xl font-bold mb-8">Vertragsanalyse</h1>
      
      <div className="grid gap-6">
        {/* Vertragsinformationen */}
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Vertragsinformationen</h2>
          
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : contract ? (
            <div className="space-y-2">
              <p className="font-medium">{contract.fileName}</p>
              <p className="text-sm text-muted-foreground">
                Hochgeladen am {new Date(contract.uploadedAt).toLocaleDateString('de-DE')}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">Vertrag nicht gefunden</p>
          )}
        </div>
        
        {/* Analyse-Status */}
        <ContractStatus contractId={contractId} />
        
        {/* Hinweis */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Die Analyse kann einige Minuten dauern. Sie werden automatisch zur Ergebnisseite weitergeleitet, 
            sobald die Analyse abgeschlossen ist.
          </p>
        </div>
      </div>
    </div>
  );
}
