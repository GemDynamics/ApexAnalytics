"use client"

import type React from "react"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Search, FileText, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContractsList } from "@/components/contracts-list"
import { Input } from "@/components/ui/input"
import { NegotiationSimulator } from "@/components/negotiation-simulator"
import { ContractEditorWithContract } from "@/components/contract-editor-with-contract"
import { RiskAnalysisCharts } from "@/components/risk-analysis-charts"
import { useContract } from "@/hooks/useConvex"
import type { Id } from "@/convex/_generated/dataModel"

interface AnalyticsLayoutProps {
  children: React.ReactNode
  contractId?: string
  initialTab?: "editor" | "risikoanalyse" | "verhandlung" 
}

export function AnalyticsLayout({ children, contractId, initialTab = "editor" }: AnalyticsLayoutProps) {
  const [isListCollapsed, setIsListCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<"editor" | "risikoanalyse" | "verhandlung">(initialTab)
  const { contract } = useContract(contractId as Id<"contracts"> | undefined)

  const toggleList = () => {
    setIsListCollapsed(!isListCollapsed)
  }

  return (
    <div className="flex flex-col h-full min-h-screen pb-0">
      {/* Tabs Header mit fixer Breite */}
      <div className="border-b mb-2 w-full">
        <Tabs
          defaultValue="editor"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "editor" | "risikoanalyse" | "verhandlung")}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="editor" className="rounded-tl-md rounded-tr-none">
              Vertragseditor
            </TabsTrigger>
            <TabsTrigger value="risikoanalyse" className="rounded-none">
              Risikoanalyse
            </TabsTrigger>
            <TabsTrigger value="verhandlung" className="rounded-tr-md rounded-tl-none">
              Verhandlungssimulator
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content mit flexiblem Layout */}
      <div className="flex flex-1 relative gap-4 mb-1 overflow-hidden">
        {/* Vertragsliste - kann ein-/ausgeklappt werden */}
        <div
          className={`transition-all duration-300 flex flex-col h-full ${
            isListCollapsed ? "w-0 overflow-hidden" : "w-full md:w-64 lg:w-72"
          }`}
        >
          <div className="h-full space-y-4 flex flex-col flex-grow min-h-0">
            <div className="relative px-1 pt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Verträge durchsuchen..." className="pl-8 w-full" />
            </div>
            <div className="flex-grow overflow-auto min-h-0">
              <ContractsList />
            </div>
          </div>
        </div>

        {/* Toggle Button für die Vertragsliste */}
        <Button 
          variant="outline" 
          size="icon" 
          className={`absolute top-1 ${isListCollapsed ? 'left-0' : 'md:left-[240px] lg:left-[272px]'} z-10 h-8 w-8 rounded-full shadow-sm border-muted-foreground/20 transition-all duration-300`}
          onClick={toggleList}
        >
          {isListCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        {/* Content Area - nimmt immer volle Breite des Tab-Menüs ein */}
        <div className="flex-1 transition-all duration-300 h-full">
          <Tabs value={activeTab} className="h-full">
            <TabsContent value="editor" className="h-full mt-0">
              {contractId ? (
                <div className="h-full">
                  <ContractEditorWithContract contractId={contractId as Id<"contracts">} />
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Bitte wählen Sie einen Vertrag aus, um den Vertragseditor zu starten.
                </div>
              )}
            </TabsContent>
            <TabsContent value="risikoanalyse" className="h-full mt-0">
              {contractId && contract ? (
                <div className="p-4 h-full">
                  <RiskAnalysisCharts contract={contract} />
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Bitte wählen Sie einen Vertrag aus, um die Risikoanalyse zu starten.
                </div>
              )}
            </TabsContent>
            <TabsContent value="verhandlung" className="h-full mt-0">
              {contractId ? (
                <div className="h-full">
                  <NegotiationSimulator contractId={contractId as Id<"contracts">} />
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Bitte wählen Sie einen Vertrag aus, um Verhandlungen zu starten.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
