"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react"

interface NegotiationProbabilityProps {
  probability?: number
}

export function NegotiationProbability({ probability = 65 }: NegotiationProbabilityProps) {
  const getColorClass = (score: number) => {
    if (score < 40) return "text-red-500"
    if (score < 70) return "text-amber-500"
    return "text-green-500"
  }

  const getProgressColor = (score: number) => {
    if (score < 40) return "bg-red-500"
    if (score < 70) return "bg-amber-500"
    return "bg-green-500"
  }

  const getMessage = (score: number) => {
    if (score < 40) {
      return "Erhebliche Herausforderungen erwartet. Überdenken Sie die Vertragsbedingungen vor dem Fortfahren."
    }
    if (score < 70) {
      return "Moderate Verhandlungsherausforderungen. Konzentrieren Sie sich auf Klauseln mit hohem Risiko, um Ihre Position zu verbessern."
    }
    return "Gute Verhandlungsposition. Kleinere Anpassungen für ein optimales Ergebnis empfohlen."
  }

  const getIcon = (score: number) => {
    if (score < 40) return <AlertTriangle className="h-6 w-6 text-red-500" />
    if (score < 70) return <AlertCircle className="h-6 w-6 text-amber-500" />
    return <CheckCircle className="h-6 w-6 text-green-500" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Verhandlungswahrscheinlichkeit</h3>
            <div className="flex items-center gap-2">
              {getIcon(probability)}
              <span className={`text-2xl font-bold ${getColorClass(probability)}`}>{probability}%</span>
            </div>
          </div>

          <Progress value={probability} className="h-2 w-full mb-4">
            <div
              className={`h-full ${getProgressColor(probability)} rounded-full`}
              style={{ width: `${probability}%` }}
            />
          </Progress>

          <p className="text-sm text-muted-foreground mb-6">{getMessage(probability)}</p>

          <div className="space-y-4">
            <h4 className="font-medium">Empfohlene Verhandlungspunkte:</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium">Vertragsstrafen (§3 Abs. 2)</p>
                  <p className="text-sm text-muted-foreground">
                    Reduzierung auf 0,1% pro Werktag mit einer Obergrenze von 5% der Auftragssumme.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium">Haftungsbegrenzung (§9 Abs. 3)</p>
                  <p className="text-sm text-muted-foreground">
                    Einführung einer Haftungsbegrenzung auf die Höhe der Auftragssumme für Folgeschäden.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium">Zahlungsbedingungen (§5 Abs. 1)</p>
                  <p className="text-sm text-muted-foreground">
                    Verkürzung der Zahlungsfrist von 30 auf 14 Tage nach Rechnungseingang.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Verhandlungsstrategie</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                <span className="text-primary font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium">Priorisieren Sie kritische Klauseln</h4>
                <p className="text-sm text-muted-foreground">
                  Beginnen Sie mit den Klauseln, die das höchste Risiko darstellen, insbesondere Vertragsstrafen und
                  Haftungsklauseln.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                <span className="text-primary font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium">Bereiten Sie Alternativformulierungen vor</h4>
                <p className="text-sm text-muted-foreground">
                  Haben Sie konkrete Textvorschläge für problematische Klauseln bereit, um die Verhandlung zu
                  beschleunigen.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                <span className="text-primary font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium">Nutzen Sie Ihre Stärken</h4>
                <p className="text-sm text-muted-foreground">
                  Betonen Sie Ihre Expertise, Referenzen und den Wert, den Sie für das Projekt bringen.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
