import React from "react"
import { ScrollToSection } from "@/components/scroll-to-section"
// import DiamondLogo from "./ui/gd-logo"; // DiamondLogo Komponente entfernt

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
}

export function DashboardHeader({ heading, text, children }: DashboardHeaderProps) {
  // Check if children is a valid React element and has props
  const isButtonWithSpecificText = 
    React.isValidElement(children) &&
    typeof children.props === 'object' && children.props !== null && // Sicherstellen, dass props ein Objekt ist
    'children' in children.props && // Sicherstellen, dass props.children existiert
    (children.props.children === "Neue Analyse" || children.props.children === "+ Neue Analyse");

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-3">
        {/* DiamondLogo Komponente entfernt */}
        {/* <DiamondLogo size="w-10 h-10" /> */}
        <div className="grid gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          {text && <p className="text-muted-foreground">{text}</p>}
        </div>
      </div>
      {isButtonWithSpecificText ? (
        <ScrollToSection targetId="upload-section">{children}</ScrollToSection>
      ) : (
        children
      )}
    </div>
  )
}
