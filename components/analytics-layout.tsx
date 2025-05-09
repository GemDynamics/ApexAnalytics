"use client"

import type React from "react"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContractsList } from "@/components/contracts-list"
import { Input } from "@/components/ui/input"
import { NegotiationSimulator } from "@/components/negotiation-simulator"
import { ContractEditorWithContract } from "@/components/contract-editor-with-contract"
import type { Id } from "@/convex/_generated/dataModel"

interface AnalyticsLayoutProps {
  children: React.ReactNode
  contractId?: string
  initialTab?: "analyse" | "verhandlung" | "editor"
}

export function AnalyticsLayout({ children, contractId, initialTab = "analyse" }: AnalyticsLayoutProps) {
  const [isListCollapsed, setIsListCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<"analyse" | "verhandlung" | "editor">(initialTab)

  const toggleList = () => {
    setIsListCollapsed(!isListCollapsed)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Folder Menu */}
      <div className="border-b mb-4 w-full">
        <Tabs
          defaultValue="analyse"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "analyse" | "verhandlung" | "editor")}
          className="w-full flex-1"
        >
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="analyse" className="rounded-tl-md rounded-tr-none">
              Analyse
            </TabsTrigger>
            <TabsTrigger value="verhandlung" className="rounded-none">
              Verhandlung
            </TabsTrigger>
            <TabsTrigger value="editor" className="rounded-tr-md rounded-tl-none">
              Vertragseditor
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 gap-4 relative">
        {/* Collapsible Contract List */}
        <div
          className={`transition-all duration-300 ${
            isListCollapsed ? "w-16 overflow-visible" : "w-full md:w-1/3 lg:w-1/4"
          }`}
        >
          {/* Toggle Button - Now positioned at the top */}
          <div className="flex justify-end mb-4">
            {!isListCollapsed && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full shadow-sm border-muted-foreground/20"
                onClick={toggleList}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className={`space-y-4 ${isListCollapsed ? "opacity-0 invisible" : "opacity-100 visible"}`}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Verträge durchsuchen..." className="pl-8" />
            </div>
            <Button className="w-full mb-4 rounded-full">Neue Analyse</Button>
            <ContractsList />
          </div>
          {isListCollapsed && (
            <div className="absolute left-0 top-0 h-full border-r border-border bg-background/80 backdrop-blur-sm w-16 flex flex-col items-center py-4 gap-4 rounded-r-lg shadow-sm">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleList}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="flex flex-col gap-3 mt-4">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        setIsListCollapsed(false)
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className={`transition-all duration-300 ${isListCollapsed ? "w-full" : "w-full md:w-2/3 lg:w-3/4"}`}>
          <div className="relative">
            <Tabs value={activeTab} className="w-full">
              <TabsContent value="analyse" className="mt-0">
                {children}
              </TabsContent>
              <TabsContent value="verhandlung" className="mt-0">
                {contractId ? (
                  <div className="negotiation-content">
                    <NegotiationSimulator contractId={contractId as Id<"contracts">} />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Bitte wählen Sie einen Vertrag aus, um Verhandlungen zu starten.
                  </div>
                )}
              </TabsContent>
              <TabsContent value="editor" className="mt-0">
                {contractId ? (
                  <div className="contract-editor-content">
                    <ContractEditorWithContract contractId={contractId as Id<"contracts">} />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Bitte wählen Sie einen Vertrag aus, um den Vertragseditor zu starten.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
