"use client"

import type React from "react"

import { useState, useEffect, ReactNode } from "react"
import { ChevronLeft, ChevronRight, Search, FileText, Menu, Loader2, PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContractsList, type ContractListProps } from "@/components/contracts-list"
import { Input } from "@/components/ui/input"
import { NegotiationSimulator } from "@/components/negotiation-simulator"
import { RiskAnalysisCharts } from "@/components/risk-analysis-charts"
import type { Id } from "@/convex/_generated/dataModel"
import dynamic from 'next/dynamic'
import { useIsMobile } from '@/hooks/use-mobile'

// Dynamischer Import für ContractEditorWithContract
const ContractEditorWithContract = dynamic(
  () => import('@/components/contract-editor-with-contract').then(mod => mod.ContractEditorWithContract),
  {
    ssr: false, // WICHTIG: Deaktiviert Server-Side Rendering für diese Komponente
    loading: () => (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Editor wird geladen...</p>
      </div>
    ), // Zeige eine Ladeanzeige
  }
)

// Define width constants
const EXPANDED_WIDTH_PX = 280;
const COLLAPSED_WIDTH_PX = 0;
const SEPARATOR_WIDTH_PX = 1;

interface AnalyticsLayoutProps {
  contractId?: string
  initialTab?: "editor" | "risikoanalyse" | "verhandlung" 
  children: ReactNode;
  contracts: ContractListProps['contracts']; // Ensure this type matches what ContractsList expects
  selectedContractId: string | undefined; // Or string, depending on usage
  isLoading: boolean;
}

export function AnalyticsLayout({ contractId, initialTab = "editor", children, contracts, selectedContractId, isLoading }: AnalyticsLayoutProps) {
  const isMobile = useIsMobile(); // Hook to determine if mobile view
  const [isContractsListExpanded, setIsContractsListExpanded] = useState(!isMobile);
  const [contractsListPixelWidth, setContractsListPixelWidth] = useState(
    isMobile ? COLLAPSED_WIDTH_PX : EXPANDED_WIDTH_PX
  );

  useEffect(() => {
    if (isMobile) {
      setIsContractsListExpanded(false);
    } else {
      setIsContractsListExpanded(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isContractsListExpanded) {
      setContractsListPixelWidth(EXPANDED_WIDTH_PX);
    } else {
      setContractsListPixelWidth(COLLAPSED_WIDTH_PX);
    }
  }, [isContractsListExpanded]);

  const handleToggleContractsList = () => {
    setIsContractsListExpanded(!isContractsListExpanded);
  };

  // Ensure contracts prop is null if undefined, as per instructions
  const contractsForList = contracts === undefined ? null : contracts;

  return (
    <div className="relative flex overflow-hidden bg-background">
      {/* ContractsList Container */}
      <div
        style={{
          width: `${contractsListPixelWidth}px`,
          transition: 'width 0.3s ease-in-out',
        }}
        className="absolute top-0 left-0 h-full z-20 bg-background shadow-md" // Added bg-background and shadow for better visual separation
      >
        {/* Render ContractsList only if its width is > 0 to avoid rendering it collapsed if it has no collapsed view */}
        {contractsListPixelWidth > 0 && (
           <ContractsList
            contracts={contractsForList}
            selectedContractId={selectedContractId}
            isMobile={isMobile}
            isCollapsed={!isContractsListExpanded}
            setIsCollapsed={(newCollapsedState: boolean) => setIsContractsListExpanded(!newCollapsedState)}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Separator Line */}
      {!isMobile && ( // Hide separator and button on mobile if ContractsList is always collapsed
        <div
          style={{
            left: `${contractsListPixelWidth}px`,
            transition: 'left 0.3s ease-in-out',
          }}
          className="absolute top-0 h-full z-30"
        >
          <div className="w-px h-full bg-border" /> {/* Using theme border color */}
        </div>
      )}

      {/* Toggle Button */}
      {!isMobile && ( // Hide separator and button on mobile
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleContractsList}
          className="absolute top-1/2 z-40 p-1" // Adjusted padding
          style={{
            left: `${contractsListPixelWidth -14 + SEPARATOR_WIDTH_PX}px`, // Position button relative to separator
            transform: 'translateY(-50%) translateX(-50%)', // Center button on the line
            transition: 'left 0.3s ease-in-out',
          }}
          aria-label={isContractsListExpanded ? "Collapse contracts list" : "Expand contracts list"}
        >
          {isContractsListExpanded ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* Main Content Area */}
      <div
        style={{
          marginLeft: isMobile ? `${COLLAPSED_WIDTH_PX}px` : `${contractsListPixelWidth + SEPARATOR_WIDTH_PX}px`,
          transition: 'margin-left 0.3s ease-in-out',
        }}
        className="h-full flex-grow overflow-y-auto" // Removed p-4/md:p-6, will be handled by child page or layout
      >
        {/* Padding should be inside this div if needed globally, or handled by the page consuming this layout */}
        {/* Example: <div className="p-4 md:p-6 h-full">{children}</div> */}
        {children}
      </div>
    </div>
  )
}
