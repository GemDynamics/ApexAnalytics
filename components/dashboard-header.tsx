import React from "react"
import { ScrollToSection } from "@/components/scroll-to-section"

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
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      {isButtonWithSpecificText ? (
        <ScrollToSection targetId="upload-section">{children}</ScrollToSection>
      ) : (
        children
      )}
    </div>
  )
}
