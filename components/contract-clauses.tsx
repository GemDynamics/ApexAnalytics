"use client"

import { useState } from "react"
import { AlertTriangle, AlertCircle, CheckCircle, Send } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ContractClauses() {
  const [clauses] = useState([
    {
      id: "1",
      title: "§3 Abs. 2 - Vertragsstrafen",
      risk: "high",
      content:
        "Bei Überschreitung der vereinbarten Fertigstellungstermine wird eine Vertragsstrafe in Höhe von 0,3% der Auftragssumme pro Werktag, maximal jedoch 10% der Auftragssumme, fällig.",
      recommendation:
        "Diese Klausel sollte neu verhandelt werden. Die Vertragsstrafe ist überdurchschnittlich hoch und birgt ein erhebliches finanzielles Risiko. Empfehlung: Reduzierung auf 0,1% pro Werktag mit einer Obergrenze von 5%.",
    },
    {
      id: "2",
      title: "§5 Abs. 1 - Zahlungsbedingungen",
      risk: "medium",
      content:
        "Die Zahlung erfolgt nach Baufortschritt in Raten: 20% bei Baubeginn, 30% nach Fertigstellung des Rohbaus, 40% nach Fertigstellung der Installationen, 10% nach Endabnahme. Die Zahlungsfrist beträgt 30 Tage nach Rechnungseingang.",
      recommendation:
        "Die Zahlungsbedingungen sind grundsätzlich akzeptabel, jedoch sollte die Zahlungsfrist auf 14 Tage verkürzt werden, um die Liquidität zu verbessern.",
    },
    {
      id: "3",
      title: "§7 - Gewährleistung",
      risk: "low",
      content: "Die Gewährleistungsfrist beträgt 5 Jahre ab Abnahme für alle Bauleistungen gemäß VOB/B.",
      recommendation: "Diese Klausel entspricht den üblichen Standards und ist akzeptabel.",
    },
    {
      id: "4",
      title: "§9 Abs. 3 - Haftungsbegrenzung",
      risk: "high",
      content:
        "Der Auftragnehmer haftet unbegrenzt für alle Schäden, die durch seine Leistungen verursacht werden, einschließlich Folgeschäden und entgangenen Gewinn.",
      recommendation:
        "Diese Klausel ist in der vorliegenden Form nicht akzeptabel. Eine Haftungsbegrenzung auf die Höhe der Auftragssumme für Folgeschäden und entgangenen Gewinn sollte verhandelt werden.",
    },
    {
      id: "5",
      title: "§12 - Kündigung",
      risk: "medium",
      content:
        "Der Auftraggeber kann den Vertrag jederzeit ohne Angabe von Gründen mit einer Frist von 14 Tagen kündigen. In diesem Fall hat der Auftragnehmer Anspruch auf Vergütung der bis dahin erbrachten Leistungen.",
      recommendation:
        "Die Kündigungsfrist ist sehr kurz. Es sollte eine längere Frist von mindestens 30 Tagen verhandelt werden, sowie eine Entschädigung für bereits bestellte Materialien.",
    },
    {
      id: "6",
      title: "§15 - Gerichtsstand",
      risk: "low",
      content: "Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist München.",
      recommendation: "Diese Klausel ist akzeptabel.",
    },
  ])

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "high":
        return <AlertCircle className="h-5 w-5 text-destructive" />
      case "medium":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "low":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      default:
        return null
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "high":
        return <Badge variant="destructive">Nicht akzeptabel</Badge>
      case "medium":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Verhandelbar
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="text-emerald-500 border-emerald-500">
            In Ordnung
          </Badge>
        )
      default:
        return null
    }
  }

  const addToContractEditor = (clause: any) => {
    // This would typically update the contract editor with the clause
    console.log("Adding to contract editor:", clause)

    // Show a notification to the user
    alert(`Klausel "${clause.title}" wurde zum Vertragseditor hinzugefügt.`)
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {clauses.map((clause) => (
        <AccordionItem key={clause.id} value={clause.id}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3 text-left">
              {getRiskIcon(clause.risk)}
              <span>{clause.title}</span>
              {getRiskBadge(clause.risk)}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Klauseltext:</h4>
                <p className="text-sm">{clause.content}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Empfehlung:</h4>
                <p className="text-sm">{clause.recommendation}</p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Benutzerdefinierte Formulierung:</h4>
                  <div className="relative">
                    <textarea
                      placeholder="Geben Sie Ihre eigene Formulierung für diese Klausel ein..."
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px]"
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Send className="h-4 w-4" />
                        <span>Einreichen</span>
                      </Button>
                      <Button size="sm" className="gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M12 8V4H8" />
                          <rect width="16" height="12" x="4" y="8" rx="2" />
                          <path d="M2 14h2" />
                          <path d="M20 14h2" />
                          <path d="M15 13v2" />
                          <path d="M9 13v2" />
                        </svg>
                        <span>Mit KI optimieren</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="relative mt-2">
                  <input
                    type="text"
                    defaultValue="Zum Vertragseditor hinzufügen"
                    className="flex h-9 w-full rounded-md border border-input bg-background pl-10 pr-10 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                    <span className="text-primary text-xs">✦✦✦</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => addToContractEditor(clause)}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Senden</span>
                  </Button>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
