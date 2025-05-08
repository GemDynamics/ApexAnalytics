"use client"
import { useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { RecentAnalyses } from "@/components/recent-analyses"
import { FileUpload } from "@/components/file-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload } from "lucide-react"

function HomePageClient() {
  useEffect(() => {
    // Check if we need to scroll to a target after navigation
    const targetId = sessionStorage.getItem("scrollToTarget")
    if (targetId) {
      // Clear the flag
      sessionStorage.removeItem("scrollToTarget")
      // Wait a bit for the page to fully render
      setTimeout(() => {
        const targetElement = document.getElementById(targetId)
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
      }, 100)
    }
  }, [])

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Vertragsanalyse Dashboard"
        text="Übersicht Ihrer Vertragsanalysen und Risikobewertungen"
      />

      <div className="grid gap-6">
        {/* Kürzlich analysierte Verträge */}
        <RecentAnalyses />

        {/* Upload-Bereich */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5" id="upload-section">
          <CardHeader>
            <CardTitle>Neuen Vertrag analysieren</CardTitle>
            <CardDescription>
              Laden Sie einen Vertrag hoch, um eine detaillierte Risikoanalyse zu erhalten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-card rounded-xl p-6 shadow-md">
              <FileUpload />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center text-center p-4">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-1">Risikobewertung</h3>
                <p className="text-sm text-muted-foreground">Farbkodierte Analyse der Vertragsklauseln</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <svg
                    className="h-6 w-6 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 20.9601 3 19.4V3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 15L11 11L15 15L19 11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Risikoanalyse</h3>
                <p className="text-sm text-muted-foreground">Visuelle Darstellung der Vertragsrisiken</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <svg
                    className="h-6 w-6 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 8V16M8 12H16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 2 12C2 6.47715 22 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Verhandlungseinblicke</h3>
                <p className="text-sm text-muted-foreground">
                  Wahrscheinlichkeitsanalyse für erfolgreiche Verhandlungen
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

// Export the client component as the default
export default function HomePage() {
  return <HomePageClient />
}
