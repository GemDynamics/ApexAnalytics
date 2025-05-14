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
    // Position: fixed mit top: 64px (Header-Höhe) statt 0, um unter dem Header zu bleiben
    // z-index: 10, um über dem normalen Inhalt, aber unter dem Header (z-40) zu sein
    <div className="fixed left-0 right-0 bottom-0 overflow-hidden bg-background" style={{ top: '64px', zIndex: 10 }}>
      {/* ContractsList Container - direkt am linken Rand ohne Abstände */}
      <div
        style={{
          width: `${contractsListPixelWidth}px`,
          transition: 'width 0.3s ease-in-out',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 20
        }}
        className="bg-background shadow-md" 
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
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${contractsListPixelWidth}px`,
            width: `${SEPARATOR_WIDTH_PX}px`,
            zIndex: 30,
            transition: 'left 0.3s ease-in-out',
            backgroundColor: 'hsl(var(--border))'
          }}
        />
      )}

      {/* Toggle Button */}
      {!isMobile && ( // Hide separator and button on mobile
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleContractsList}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${contractsListPixelWidth + SEPARATOR_WIDTH_PX + 2}px`,
            transform: 'translateY(-50%)',
            zIndex: 40,
            padding: '4px',
            backgroundColor: 'hsl(var(--background))',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'left 0.3s ease-in-out'
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

      {/* Main Content Area - statisch, kein flex, ohne Padding */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: `${contractsListPixelWidth + SEPARATOR_WIDTH_PX}px`,
          overflow: 'auto',
          transition: 'left 0.3s ease-in-out'
        }}
      >
        {children}
      </div>
    </div>
  )
}
