"use client";

import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import { AnalyticsLayout } from "@/components/analytics-layout";

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
  return (
    <AnalyticsLayout contractId={contractId} />
  );
}
