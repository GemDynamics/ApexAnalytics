"use client"

import { Button } from "@/components/ui/button"
import type React from "react"
import Link from "next/link"
import { Building2, Plus } from "lucide-react"
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
          <div className="flex items-center gap-2 font-bold">
            <div className="bg-primary p-1.5 rounded-md">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <AuthRedirectLink href="/">
              <span className="text-xl">BauVertragsanalyse</span>
            </AuthRedirectLink>
          </div>
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
      <footer className="border-t bg-muted/40">
        <div className="container flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between md:py-6">
          <div className="flex flex-col gap-4 md:gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="bg-primary p-1 rounded-md">
                <Building2 className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-semibold">BauVertragsanalyse</span>
            </div>
            <p className="text-xs text-muted-foreground">© 2024 BauVertragsanalyse. Alle Rechte vorbehalten.</p>
          </div>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <AuthRedirectLink href="#" className="transition-colors hover:text-foreground">
              Impressum
            </AuthRedirectLink>
            <AuthRedirectLink href="#" className="transition-colors hover:text-foreground">
              Datenschutz
            </AuthRedirectLink>
            <AuthRedirectLink href="#" className="transition-colors hover:text-foreground">
              Kontakt
            </AuthRedirectLink>
          </nav>
        </div>
      </footer>
    </div>
  )
}
