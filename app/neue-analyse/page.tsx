import { DashboardHeader } from "@/components/dashboard-header"
import { FileUpload } from "@/components/file-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NeueAnalysePage() {
  return (
    <>
      <DashboardHeader
        heading="Neue Vertragsanalyse"
        text="Laden Sie einen Vertrag hoch, um eine Analyse zu starten"
      />
      <Card>
            <CardHeader>
          <CardTitle>Vertrag hochladen</CardTitle>
              <CardDescription>
            Laden Sie einen Vertrag im PDF-, DOCX- oder TXT-Format hoch
              </CardDescription>
            </CardHeader>
            <CardContent>
                <FileUpload />
            </CardContent>
          </Card>
    </>
  )
}
