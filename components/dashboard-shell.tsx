"use client"

import { Button } from "@/components/ui/button"
import type React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import DiamondLogo from "@/components/ui/gd-logo"
import ApexAnalyticsAnimatedLogo from "@/components/ui/apex-analytics-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButtons } from "./auth-components"
import { NewAnalysisLink, AuthRedirectLink } from "./auth-redirect-link"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <AuthRedirectLink href="/" className="flex items-center gap-2">
            <DiamondLogo size="w-10 h-10" />
            <ApexAnalyticsAnimatedLogo fontSize="1.5rem" />
          </AuthRedirectLink>
          <nav className="flex items-center gap-4">
            <AuthRedirectLink href="/dashboard">
              <Button variant="ghost" size="sm" className="rounded-full px-4">
                Dashboard
              </Button>
            </AuthRedirectLink>
            <AuthRedirectLink href="/analytik">
              <Button variant="ghost" size="sm" className="rounded-full px-4">
                Analytik
              </Button>
            </AuthRedirectLink>
            <NewAnalysisLink>
              <Button size="sm" className="gap-1 rounded-full px-4">
                <Plus className="h-4 w-4" />
                Neue Analyse
              </Button>
            </NewAnalysisLink>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AuthButtons />
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6 md:py-8 lg:py-10">
        <div className="grid gap-6">{children}</div>
      </main>
      <footer className="w-full border-t border-border bg-background p-4 text-center text-xs text-muted-foreground"> 
        <p>ApexAnalytics (ehem. Baulytics) by GemDynamics <a href="https://www.linkedin.com/posts/digital-findet-stadt_heute-um-930-uhr-fiel-der-startschuss-f%C3%BCr-activity-7328393875927003137-7YDv?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFl5yTMBpndS-fRjaHR7lPY4AHbXT8uMcsc" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Gewinner</a> des <a href="https://www.digitalfindetstadt.at/akademie/bigevents/hackathon-2025" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Hackathon</a> der <a href="https://www.digitalfindetstadt.at/akademie/bigevents/ki-con-2025" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">KI CON</a> 2025 in Wien</p>
        <p className="mt-2">© 2025 ApexAnalytics by GemDynamics Alle Rechte vorbehalten.</p>
        <p className="mt-2">
          <a href="#/impressum" className="underline hover:text-primary">Impressum</a>
          <span className="mx-2">|</span>
          <a href="#/datenschutz" className="underline hover:text-primary">Datenschutz</a>
          <span className="mx-2">|</span>
          <a href="#/kontakt" className="underline hover:text-primary">Kontakt</a>
        </p>
      </footer>
    </div>
  )
}
