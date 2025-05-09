import { FeedbackAnsicht } from "@/components/feedback/feedback-ansicht"
import { PageHeader } from "@/components/layout/page-header"
import { ProgressTabs } from "@/components/layout/progress-tabs"
import { VertragService } from "@/services/vertrag-service"
import { FeedbackService } from "@/services/feedback-service"
import { Metadata } from "next"

export async function generateMetadata({ params }): Promise<Metadata> {
  const vertrag = await VertragService.getVertragById(params.vertragId)
  return {
    title: `Verhandlungsfeedback: ${vertrag.titel} | BauVertragsanalyse`
  }
}

export default async function FeedbackPage({ params, searchParams }) {
  const vertragId = params.vertragId
  const simulationId = searchParams.simulationId
  
  if (!simulationId) {
    return <div className="p-6">Keine Simulation ausgewählt.</div>
  }
  
  const vertrag = await VertragService.getVertragById(vertragId)
  const feedbackService = new FeedbackService()
  
  // Feedback abrufen oder generieren falls nötig
  let feedback;
  try {
    feedback = await feedbackService.getFeedbackBySimulationId(simulationId)
  } catch (error) {
    console.error("Fehler beim Laden des Feedbacks:", error)
    return (
      <div className="p-6">
        <h2 className="text-lg font-medium mb-2">Fehler beim Laden des Feedbacks</h2>
        <p>Die Feedback-Daten konnten nicht geladen werden.</p>
      </div>
    )
  }
  
  return (
    <div className="container py-4 space-y-6">
      <PageHeader
        title={vertrag.titel}
        subtitle="Analyse abgeschlossen"
        backHref={`/vertraege/${vertragId}`}
      />
      
      <div className="grid grid-cols-1 gap-4">
        <ProgressTabs
          vertragId={vertragId}
          activeTab="feedback"
        />
        
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/50">
            <h2 className="text-xl font-semibold">Verhandlungsfeedback</h2>
            <p className="text-sm text-muted-foreground">
              Analyse Ihrer Verhandlungsleistung und Verbesserungsvorschläge
            </p>
          </div>
          
          <FeedbackAnsicht feedback={feedback} vertragId={vertragId} />
        </div>
      </div>
    </div>
  )
} 