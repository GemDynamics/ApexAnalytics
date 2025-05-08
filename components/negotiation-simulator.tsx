"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Send,
  Info,
  Lightbulb,
  Clock,
  AlertCircle,
  Building,
  HardHat,
  ChevronDown,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type Feedback = {
  score: number
  strengths: string[]
  improvements: string[]
  emotionalInsights: string[]
  timestamp: Date
}

interface NegotiationSimulatorProps {
  contractId?: string
}

export function NegotiationSimulator({ contractId }: NegotiationSimulatorProps) {
  const [activeTab, setActiveTab] = useState("vorbereitung")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isSimulationActive, setIsSimulationActive] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [objectives, setObjectives] = useState("")
  const [constraints, setConstraints] = useState("")
  const [clauseNotes1, setClauseNotes1] = useState("")
  const [clauseNotes2, setClauseNotes2] = useState("")
  const [clauseNotes3, setClauseNotes3] = useState("")

  // Add simulated historical feedback entries
  const [feedbackHistory, setFeedbackHistory] = useState<Feedback[]>([
    {
      score: 65,
      strengths: [
        "Gute Vorbereitung auf die Verhandlung",
        "Sachliche Argumentation bei Vertragsstrafen",
        "Höflicher Umgangston während der gesamten Verhandlung",
      ],
      improvements: [
        "Zu schnelles Nachgeben bei kritischen Punkten",
        "Fehlende konkrete Gegenvorschläge bei der Haftungsbegrenzung",
        "Zu wenig Bezug auf Branchenstandards und Referenzprojekte",
      ],
      emotionalInsights: [
        "Teilweise unsicheres Auftreten bei Gegenargumenten",
        "Gute Balance zwischen Durchsetzungsvermögen und Kompromissbereitschaft",
        "Positive Grundhaltung trotz schwieriger Verhandlungspunkte",
      ],
      timestamp: new Date(2023, 11, 15, 14, 30), // 15. Dezember 2023, 14:30
    },
    {
      score: 42,
      strengths: ["Klare Darstellung der eigenen Position", "Gute Kenntnis der Vertragsdetails"],
      improvements: [
        "Zu konfrontative Kommunikation bei Meinungsverschiedenheiten",
        "Mangelnde Flexibilität bei Kompromissvorschlägen",
        "Unzureichende Vorbereitung auf Gegenargumente",
        "Zu starker Fokus auf eigene Interessen statt Win-Win-Lösungen",
      ],
      emotionalInsights: [
        "Sichtbare Frustration bei Widerspruch",
        "Wenig Empathie für die Position des Bauherrn",
        "Defensive Körpersprache in kritischen Momenten",
      ],
      timestamp: new Date(2024, 0, 22, 10, 15), // 22. Januar 2024, 10:15
    },
    {
      score: 58,
      strengths: [
        "Verbesserte Vorbereitung im Vergleich zur letzten Simulation",
        "Gute Reaktion auf unerwartete Einwände",
        "Konstruktive Lösungsvorschläge bei Zahlungsbedingungen",
      ],
      improvements: [
        "Noch immer zu wenig konkrete Zahlen und Fakten",
        "Unklare Priorisierung der Verhandlungspunkte",
        "Zu lange Redebeiträge, die vom Kern ablenken",
      ],
      emotionalInsights: [
        "Deutlich verbesserte emotionale Kontrolle",
        "Guter Aufbau von Rapport zu Beginn des Gesprächs",
        "Noch Verbesserungspotenzial bei nonverbaler Kommunikation",
      ],
      timestamp: new Date(2024, 2, 8, 16, 45), // 8. März 2024, 16:45
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Start simulation with initial message
  const startSimulation = () => {
    setIsSimulationActive(true)
    setActiveTab("simulation")

    // Initial message from the client (Bauherr)
    const initialMessage =
      "Guten Tag, ich bin der Bauherr des Projekts. Ich habe Ihr Angebot erhalten und möchte einige Vertragsklauseln besprechen, die mir Sorgen bereiten. Insbesondere die Vertragsstrafen und Haftungsbegrenzungen erscheinen mir sehr einseitig. Können wir darüber sprechen, wie wir diese Punkte fairer gestalten können?"

    setMessages([
      {
        role: "assistant",
        content: initialMessage,
        timestamp: new Date(),
      },
    ])
  }

  // Send a message in the simulation
  const sendMessage = () => {
    if (!inputMessage.trim()) return

    const newMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setInputMessage("")

    // Simulate response after a short delay
    setTimeout(() => {
      const responseMessage = generateResponse(inputMessage)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: responseMessage,
          timestamp: new Date(),
        },
      ])
    }, 1000)
  }

  // Generate a response based on the input message
  const generateResponse = (message: string): string => {
    // This is a simplified response generation
    // In a real implementation, this would use an AI model

    if (message.toLowerCase().includes("vertragsstrafe") || message.toLowerCase().includes("pönale")) {
      return "Ich verstehe Ihre Bedenken bezüglich der Vertragsstrafen. Wir könnten die Vertragsstrafe auf 0,1% pro Werktag mit einer Obergrenze von 5% der Auftragssumme reduzieren. Außerdem könnten wir klarstellen, dass die Vertragsstrafe nur bei von uns zu vertretenden Verzögerungen gilt. Wäre das ein akzeptabler Kompromiss für Sie?"
    } else if (message.toLowerCase().includes("haftung") || message.toLowerCase().includes("schaden")) {
      return "Bei der Haftungsbegrenzung ist es für uns wichtig, ein kalkulierbares Risiko zu haben. Wir könnten eine Begrenzung auf die Höhe der Auftragssumme für direkte Schäden vereinbaren, während wir für Folgeschäden und entgangenen Gewinn nur bei Vorsatz und grober Fahrlässigkeit haften. Dies entspricht auch der üblichen Praxis in der Baubranche."
    } else if (message.toLowerCase().includes("zahlung") || message.toLowerCase().includes("frist")) {
      return "Bezüglich der Zahlungsbedingungen könnten wir einen Kompromiss finden. Statt der von uns vorgeschlagenen 14 Tage könnten wir uns auf eine Zahlungsfrist von 21 Tagen nach Rechnungseingang einigen. Dies gibt Ihnen mehr Zeit für die Prüfung, sichert aber auch unsere Liquidität."
    } else {
      return "Danke für Ihre Rückmeldung. Als Bauunternehmer ist es uns wichtig, eine faire und ausgewogene Vertragsbeziehung zu etablieren. Können Sie mir genauer erläutern, welche Aspekte des Vertrags Sie anpassen möchten, damit wir eine für beide Seiten akzeptable Lösung finden können?"
    }
  }

  const endSimulation = () => {
    setIsSimulationActive(false)
    setActiveTab("feedback")

    // Generate feedback based on the conversation
    // This would be more sophisticated in a real implementation
    const newFeedback: Feedback = {
      score: 75,
      strengths: [
        "Klare Kommunikation der eigenen Position",
        "Aktives Zuhören und Eingehen auf Gegenargumente",
        "Konstruktive Lösungsvorschläge",
      ],
      improvements: [
        "Mehr konkrete Zahlen und Fakten zur Untermauerung der Argumente",
        "Stärkere Betonung der Vorteile für die Gegenseite",
        "Frühzeitigeres Ansprechen möglicher Kompromisse",
      ],
      emotionalInsights: [
        "Positive Gesprächsatmosphäre trotz Meinungsverschiedenheiten",
        "Empathisches Eingehen auf die Bedenken des Gegenübers",
        "Vermeidung von Konfrontation durch lösungsorientierte Sprache",
      ],
      timestamp: new Date(),
    }

    setFeedback(newFeedback)
    setFeedbackHistory((prevHistory) => [...prevHistory, newFeedback])
  }

  // Reset the simulation
  const resetSimulation = () => {
    setMessages([])
    setFeedback(null)
    setIsSimulationActive(false)
    setActiveTab("vorbereitung")
  }

  // Dynamisch Klauseldaten basierend auf der Contract-ID laden
  const getClauseData = () => {
    // In einer echten Anwendung würden diese Daten aus einer API oder Datenbank geladen
    // Hier verwenden wir Beispieldaten
    return [
      {
        id: 1,
        section: "§3 Abs. 2",
        title: "Vertragsstrafen",
        content:
          "Bei Überschreitung der vereinbarten Fertigstellungstermine wird eine Vertragsstrafe in Höhe von 0,3% der Auftragssumme pro Werktag, maximal jedoch 10% der Auftragssumme, fällig.",
        risk: "high",
        goal: "Reduzierung auf 0,1% pro Werktag mit einer Obergrenze von 5% der Auftragssumme.",
      },
      {
        id: 2,
        section: "§9 Abs. 3",
        title: "Haftungsbegrenzung",
        content:
          "Der Auftragnehmer haftet unbegrenzt für alle Schäden, die durch seine Leistungen verursacht werden, einschließlich Folgeschäden und entgangenen Gewinn.",
        risk: "high",
        goal: "Einführung einer Haftungsbegrenzung auf die Höhe der Auftragssumme für Folgeschäden und entgangenen Gewinn.",
      },
      {
        id: 3,
        section: "§5 Abs. 1",
        title: "Zahlungsbedingungen",
        content:
          "Die Zahlung erfolgt nach Baufortschritt in Raten: 20% bei Baubeginn, 30% nach Fertigstellung des Rohbaus, 40% nach Fertigstellung der Installationen, 10% nach Endabnahme. Die Zahlungsfrist beträgt 30 Tage nach Rechnungseingang.",
        risk: "medium",
        goal: "Verkürzung der Zahlungsfrist auf 14 Tage nach Rechnungseingang.",
      },
    ]
  }

  const clauseData = getClauseData()

  return (
    <Card className="shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vorbereitung">Vorbereitung</TabsTrigger>
          <TabsTrigger value="simulation" disabled={!isSimulationActive && activeTab !== "simulation"}>
            Simulation
          </TabsTrigger>
          <TabsTrigger value="feedback" disabled={!feedback && activeTab !== "feedback"}>
            Feedback
          </TabsTrigger>
        </TabsList>

        {/* Vorbereitung Tab */}
        <TabsContent value="vorbereitung" className="flex-grow">
          <CardHeader>
            <CardTitle>Verhandlungsvorbereitung</CardTitle>
            <CardDescription>Bereiten Sie sich auf Ihr Verhandlungsgespräch mit dem Bauherrn vor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <HardHat className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Ihre Rolle: Bauunternehmer</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sie vertreten das Bauunternehmen und verhandeln mit dem Bauherrn über die Vertragsklauseln. Ihr Ziel
                    ist es, faire Bedingungen zu erreichen, die Ihre Interessen schützen, aber auch eine gute
                    Geschäftsbeziehung mit dem Bauherrn ermöglichen.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Gegenüber: Bauherr</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Der Bauherr möchte die Vertragsklauseln zu seinen Gunsten verhandeln. Er ist besorgt über
                    potenzielle Risiken und möchte diese minimieren. Er hat Bedenken bezüglich der Vertragsstrafen,
                    Haftungsbegrenzungen und Zahlungsbedingungen.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ihre Verhandlungsziele</label>
              <Textarea
                placeholder="Definieren Sie Ihre Ziele für diese Verhandlung..."
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ihre Grenzen & nicht verhandelbare Punkte</label>
              <Textarea
                placeholder="Definieren Sie Ihre Grenzen und nicht verhandelbare Punkte..."
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Zu verhandelnde Klauseln</label>
                <Badge variant="outline" className="text-primary">
                  Aus Analyse übernommen
                </Badge>
              </div>

              <div className="space-y-4">
                {clauseData.map((clause) => (
                  <Card key={clause.id}>
                    <CardHeader className="py-3">
                      <div className="flex items-center gap-2">
                        {clause.risk === "high" ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                        <CardTitle className="text-sm">
                          {clause.section} - {clause.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="py-0">
                      <div className="text-sm text-muted-foreground mb-2">{clause.content}</div>
                      <div className="text-sm font-medium mb-1">Verhandlungsziel:</div>
                      <div className="text-sm mb-2">{clause.goal}</div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Ihre Argumente & Strategie:</label>
                        <Textarea
                          placeholder="Notieren Sie Ihre Argumente und Strategie für diese Klausel..."
                          className="min-h-[80px]"
                          value={
                            clause.id === 1
                              ? clauseNotes1
                              : clause.id === 2
                                ? clauseNotes2
                                : clause.id === 3
                                  ? clauseNotes3
                                  : ""
                          }
                          onChange={(e) => {
                            if (clause.id === 1) setClauseNotes1(e.target.value)
                            else if (clause.id === 2) setClauseNotes2(e.target.value)
                            else if (clause.id === 3) setClauseNotes3(e.target.value)
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Verhandlungstipps für Vertragsklauseln</h4>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                    <li>Bereiten Sie konkrete Alternativformulierungen für jede kritische Klausel vor</li>
                    <li>Erklären Sie die Gründe für Ihre Vorschläge aus Sicht des Bauunternehmers</li>
                    <li>Betonen Sie die Vorteile einer ausgewogenen Risikoverteilung für beide Seiten</li>
                    <li>Verweisen Sie auf Branchenstandards und übliche Praktiken</li>
                    <li>Zeigen Sie Verständnis für die Bedenken des Bauherrn</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={startSimulation} className="w-full">
              Simulation starten
            </Button>
          </CardFooter>
        </TabsContent>

        {/* Simulation Tab */}
        <TabsContent value="simulation" className="flex-grow flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle>Verhandlungssimulation</CardTitle>
            <CardDescription>Sie verhandeln als Bauunternehmer mit dem Bauherrn über Vertragsklauseln</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden flex flex-col">
            <div className="flex-grow overflow-y-auto mb-4 space-y-4 pr-2">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.role === "user" ? (
                        <>
                          <HardHat className="h-4 w-4" />
                          <span className="text-xs font-medium">Bauunternehmer (Sie)</span>
                        </>
                      ) : (
                        <>
                          <Building className="h-4 w-4" />
                          <span className="text-xs font-medium">Bauherr</span>
                        </>
                      )}
                      <span className="text-xs ml-auto opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Ihre Nachricht..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
              <Button size="icon" onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetSimulation}>
              Zurücksetzen
            </Button>
            <Button onClick={endSimulation}>Simulation beenden & Feedback erhalten</Button>
          </CardFooter>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="flex-grow">
          {feedback && (
            <>
              <CardHeader>
                <CardTitle>Verhandlungsfeedback</CardTitle>
                <CardDescription>Analyse Ihrer Verhandlungsleistung und Verbesserungsvorschläge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Gesamtbewertung</h3>
                    <span className="text-2xl font-bold">{feedback.score}/100</span>
                  </div>
                  <Progress value={feedback.score} className="h-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <CardTitle className="text-base">Stärken</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feedback.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <CardTitle className="text-base">Verbesserungspotenzial</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feedback.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <span className="text-sm">{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-base">Emotionale Intelligenz & Kommunikation</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feedback.emotionalInsights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Tipps für die nächste Verhandlung</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Bereiten Sie konkrete Zahlen und Fakten vor, um Ihre Argumente zu untermauern. Betonen Sie
                        stärker die Vorteile für die Gegenseite und sprechen Sie mögliche Kompromisse früher an. Ihre
                        empathische Kommunikation war ein Pluspunkt - bauen Sie darauf auf, um eine noch konstruktivere
                        Gesprächsatmosphäre zu schaffen.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-medium">Nächste Übung empfohlen in:</span>
                  </div>
                  <Badge variant="outline" className="text-primary">
                    2 Tagen
                  </Badge>
                </div>
                {feedbackHistory.length > 1 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Feedback-Verlauf</h3>
                    <div className="space-y-2">
                      {feedbackHistory
                        .slice(0, -1)
                        .reverse()
                        .map((historicalFeedback, index) => (
                          <Collapsible key={index} className="border rounded-lg">
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  Feedback vom {historicalFeedback.timestamp.toLocaleDateString()} um{" "}
                                  {historicalFeedback.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{historicalFeedback.score}/100</span>
                                <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="p-4 pt-0 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Stärken</h4>
                                    <ul className="space-y-1">
                                      {historicalFeedback.strengths.map((strength, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                          <span className="text-sm">{strength}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Verbesserungspotenzial</h4>
                                    <ul className="space-y-1">
                                      {historicalFeedback.improvements.map((improvement, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                          <span className="text-sm">{improvement}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Emotionale Intelligenz & Kommunikation</h4>
                                  <ul className="space-y-1">
                                    {historicalFeedback.emotionalInsights.map((insight, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                        <span className="text-sm">{insight}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={resetSimulation} className="w-full">
                  Neue Simulation starten
                </Button>
              </CardFooter>
            </>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  )
}
