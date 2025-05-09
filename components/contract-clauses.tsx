"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, AlertCircle, ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Doc } from "@/convex/_generated/dataModel"

// Typdefinition für eine einzelne Klausel aus dem analysisProtocol
type AnalysisClause = NonNullable<Doc<"contracts">["analysisProtocol"]>[number];

interface ContractClausesProps {
  clauses: AnalysisClause[];
}

export function ContractClauses({ clauses = [] }: ContractClausesProps) {
  const [openClauseId, setOpenClauseId] = useState<string | null>(null);

  // Hilfsfunktionen für Risikobewertung (adaptiert)
  const getRiskIcon = (evaluation: string) => {
    switch (evaluation.toLowerCase()) {
      case "rot":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "gelb":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "grün":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />; // Für "Fehler" oder unbekannt
    }
  };

  const getRiskColor = (evaluation: string) => {
    switch (evaluation.toLowerCase()) {
      case "rot":
        return "bg-red-50 border border-red-200";
      case "gelb":
        return "bg-amber-50 border border-amber-200";
      case "grün":
        return "bg-green-50 border border-green-200";
      default:
        return "bg-gray-50 border border-gray-200";
    }
  };

  const getRiskLabel = (evaluation: string) => {
    switch (evaluation.toLowerCase()) {
      case "rot": return "Hohes Risiko";
      case "gelb": return "Mittleres Risiko";
      case "grün": return "Niedriges Risiko";
      case "fehler": return "Fehler bei Analyse";
      default: return "Unbekannt";
    }
  };

  // Eindeutige ID für jede Klausel generieren (Index + Text als Fallback)
  const getClauseKey = (clause: AnalysisClause, index: number): string => {
    return `${index}-${clause.chunkNumber || '0'}-${clause.clauseText.substring(0, 10)}`;
  };

  return (
    <div className="rounded-lg border shadow-sm">
      <div className="divide-y">
        {clauses.map((clause, index) => {
          const clauseKey = getClauseKey(clause, index);
          return (
            <Collapsible
              key={clauseKey}
              open={openClauseId === clauseKey}
              onOpenChange={() => setOpenClauseId(openClauseId === clauseKey ? null : clauseKey)}
            >
              <CollapsibleTrigger className="w-full text-left p-4 hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getRiskIcon(clause.evaluation)}
                    <span className="font-medium">Klausel (Chunk {clause.chunkNumber || 'N/A'})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={clause.evaluation.toLowerCase() === 'rot' ? 'destructive' : clause.evaluation.toLowerCase() === 'gelb' ? 'outline' : 'default'}
                           className={clause.evaluation.toLowerCase() === 'gelb' ? 'bg-amber-100 text-amber-700 border-amber-200' : clause.evaluation.toLowerCase() === 'grün' ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                    >
                      {getRiskLabel(clause.evaluation)}
                    </Badge>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${openClauseId === clauseKey ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 p-4 pt-0">
                  <div className="rounded-md border p-3">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Klauseltext:</h4>
                    <p className="text-sm whitespace-pre-wrap">{clause.clauseText}</p>
                  </div>
                  <div className={`rounded-md border p-3 text-gray-900 dark:text-gray-900 ${getRiskColor(clause.evaluation)}`}>
                    <h4 className="text-sm font-medium mb-1">Begründung ({getRiskLabel(clause.evaluation)}):</h4>
                    <p className="text-sm whitespace-pre-wrap">{clause.reason}</p>
                  </div>
                  <div className="rounded-md border p-3 bg-primary/5">
                    <h4 className="text-sm font-medium mb-1">Empfehlung:</h4>
                    <p className="text-sm whitespace-pre-wrap">{clause.recommendation}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
