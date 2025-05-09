"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertTriangle, LightbulbIcon, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import type { VerhandlungsFeedback, Bewertungspunkt } from "@/types/feedback"

interface FeedbackAnsichtProps {
  feedback: VerhandlungsFeedback
  vertragId: string
}

export function FeedbackAnsicht({ feedback, vertragId }: FeedbackAnsichtProps) {
  const router = useRouter();
  
  const startNeueSimulation = () => {
    router.push(`/vertraege/${vertragId}/vorbereitung`);
  };
  
  return (
    <div className="p-6 space-y-8">
      {/* Gesamtbewertung */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Gesamtbewertung</h3>
          <span className="text-2xl font-bold">{feedback.gesamtBewertung}/100</span>
        </div>
        <Progress value={feedback.gesamtBewertung} className="h-2" />
      </div>
      
      {/* Stärken und Verbesserungen Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Stärken</h3>
            <ul className="space-y-2">
              {feedback.stärken.map((stärke) => (
                <li key={stärke.id} className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>{stärke.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Verbesserungspotenzial</h3>
            <ul className="space-y-2">
              {feedback.verbesserungsPotenzial.map((verbesserung) => (
                <li key={verbesserung.id} className="flex">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 shrink-0 mt-0.5" />
                  <span>{verbesserung.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Emotionale Intelligenz */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Emotionale Intelligenz & Kommunikation</h3>
          <ul className="space-y-2">
            {feedback.emotionaleIntelligenz.map((punkt) => (
              <li key={punkt.id} className="flex">
                <LightbulbIcon className="h-5 w-5 text-blue-500 mr-2 shrink-0 mt-0.5" />
                <span>{punkt.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      {/* Tipps */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Tipps für die nächste Verhandlung
            </h3>
            <p className="whitespace-pre-wrap text-sm">{feedback.tippsNächsteVerhandlung}</p>
          </div>
          
          <div className="pt-4 mt-4 border-t flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-primary mr-2" />
              <span className="font-medium">Nächste Übung empfohlen in:</span>
            </div>
            <span className="font-bold text-red-500">{feedback.nächsteÜbungEmpfohlenIn} Tagen</span>
          </div>
        </CardContent>
      </Card>
      
      <Button className="w-full" onClick={startNeueSimulation}>
        Neue Simulation starten
      </Button>
    </div>
  )
} 