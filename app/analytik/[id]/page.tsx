"use client";

import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import { AnalyticsLayout } from "@/components/analytics-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractEditorWithContract } from "@/components/contract-editor-with-contract";
import { RiskAnalysisCharts } from "@/components/risk-analysis-charts";
import { NegotiationSimulator } from "@/components/negotiation-simulator";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

interface ContractAnalysisPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ContractAnalysisPage({ params }: ContractAnalysisPageProps) {
  // Verwende React.use, um die Promise-basierten Parameter aufzulösen
  // Siehe: https://react.dev/reference/react/use
  const resolvedParams = React.use(params); 
  const contractId = resolvedParams.id as Id<"contracts">;
  
  // Gib nur das Layout zurück und übergebe die ID.
  // Das Layout und seine Kindkomponenten (Editor, Charts etc.)
  // sind selbst für das Laden ihrer Daten verantwortlich.
  const contractsQuery = useQuery(api.contracts.getAllContracts, {});

  // Korrektur: contractsQuery ist das Array der Verträge oder undefined.
  // isLoading ist true, wenn contractsQuery undefined ist.
  const contracts = contractsQuery;
  const isLoading = contracts === undefined;

  // TODO: initialTab Logik basierend auf URL oder State Management implementieren
  const initialTab = "editor";

  return (
    <AnalyticsLayout contracts={contracts || null} selectedContractId={contractId} isLoading={isLoading}>
      <div className="w-full h-full flex flex-col">
        <Tabs defaultValue={initialTab} className="w-full h-full flex flex-col">
          {/* Sticky TabsList am oberen Rand, mit Minimal-Padding */}
          <TabsList className="sticky top-0 bg-background z-10 grid grid-cols-3 w-full rounded-none px-2">
            <TabsTrigger value="editor">Vertragseditor</TabsTrigger>
            <TabsTrigger value="risikoanalyse">Risikoanalyse</TabsTrigger>
            <TabsTrigger value="verhandlung">Verhandlung</TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className="flex-grow overflow-auto mt-0">
            {contractId ? (
              <ContractEditorWithContract contractId={contractId} />
            ) : (
              <div className="text-center text-muted-foreground py-8">Kein Vertrag ausgewählt.</div>
            )}
          </TabsContent>
          <TabsContent value="risikoanalyse" className="flex-grow overflow-auto mt-0">
            {contractId ? (
                <RiskAnalysisCharts contractId={contractId} />
            ) : (
              <div className="text-center text-muted-foreground py-8">Kein Vertrag ausgewählt.</div>
            )}
          </TabsContent>
          <TabsContent value="verhandlung" className="flex-grow overflow-auto mt-0">
            {contractId ? (
                <NegotiationSimulator contractId={contractId} />
            ) : (
              <div className="text-center text-muted-foreground py-8">Kein Vertrag ausgewählt.</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AnalyticsLayout>
  );
}
