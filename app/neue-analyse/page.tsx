import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { FileUpload } from "@/components/file-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, BarChart, PieChart } from "lucide-react"

export default function NeueAnalysePage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Neue Vertragsanalyse"
        text="Laden Sie einen Vertrag hoch oder wählen Sie eine Vorlage für die Analyse"
      />

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="upload" className="w-full">
            Vertrag hochladen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardHeader>
              <CardTitle>Vertrag hochladen und analysieren</CardTitle>
              <CardDescription>
                Laden Sie einen Vertrag hoch, um eine detaillierte Risikoanalyse zu erhalten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-card rounded-xl p-6 shadow-sm">
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
                    <BarChart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Risikoanalyse</h3>
                  <p className="text-sm text-muted-foreground">Visuelle Darstellung der Vertragsrisiken</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <div className="rounded-full bg-primary/10 p-3 mb-3">
                    <PieChart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Verhandlungseinblicke</h3>
                  <p className="text-sm text-muted-foreground">
                    Wahrscheinlichkeitsanalyse für erfolgreiche Verhandlungen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
