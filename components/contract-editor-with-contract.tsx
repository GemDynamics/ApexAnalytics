"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ContractSection } from "@/components/contract-section"
import { ContractClauseLibrary } from "@/components/contract-clause-library"
import { AlertTriangle, CheckCircle, Plus, Save, FileText, Undo, Redo, Copy, Trash, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"

interface ContractEditorWithContractProps {
  contractId?: string
}

export function ContractEditorWithContract({ contractId }: ContractEditorWithContractProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [sections, setSections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("risikoanalyse") // Set default tab to risikoanalyse

  // Simulate loading contract data based on contractId
  useEffect(() => {
    if (contractId) {
      setIsLoading(true)
      // In a real app, this would be an API call to fetch the contract data
      setTimeout(() => {
        // Sample contract data with risk analysis
        const contractData = getContractData(contractId)
        setSections(contractData)
        setIsLoading(false)
      }, 500)
    } else {
      // Initialize with blank template if no contractId is provided
      setSections([
        {
          id: "section-1",
          title: "Präambel",
          content:
            "Zwischen [AUFTRAGGEBER], nachfolgend Auftraggeber genannt, und [AUFTRAGNEHMER], nachfolgend Auftragnehmer genannt, wird folgender Vertrag geschlossen:",
          risk: "low",
          needsRenegotiation: false,
          urgentAttention: false,
        },
        {
          id: "section-2",
          title: "§1 Vertragsgegenstand",
          content: "Gegenstand dieses Vertrages ist...",
          risk: "low",
          needsRenegotiation: false,
          urgentAttention: false,
        },
      ])
      setIsLoading(false)
    }
  }, [contractId])

  // Function to get contract data based on contractId
  const getContractData = (contractId: string) => {
    // This would be replaced with actual API call in a real application
    return [
      {
        id: "section-1",
        title: "Präambel",
        content:
          "Zwischen der Firma XYZ GmbH, vertreten durch den Geschäftsführer Max Mustermann, nachfolgend Auftraggeber genannt, und der Firma ABC Bau GmbH, vertreten durch den Geschäftsführer John Doe, nachfolgend Auftragnehmer genannt, wird folgender Vertrag geschlossen:",
        risk: "low",
        needsRenegotiation: false,
        urgentAttention: false,
      },
      {
        id: "section-2",
        title: "§1 Vertragsgegenstand",
        content:
          "Gegenstand dieses Vertrages ist die Errichtung eines Wohngebäudes in München-Schwabing gemäß den beigefügten Plänen und Leistungsbeschreibungen. Der Auftragnehmer verpflichtet sich, das Bauvorhaben nach den anerkannten Regeln der Technik und unter Einhaltung der einschlägigen DIN-Normen und gesetzlichen Vorschriften auszuführen.",
        risk: "low",
        needsRenegotiation: false,
        urgentAttention: false,
      },
      {
        id: "section-3",
        title: "§2 Vergütung",
        content:
          "Für die in §1 genannten Leistungen erhält der Auftragnehmer eine Vergütung in Höhe von 2.450.000,00 € (in Worten: zwei Millionen vierhundertfünfzigtausend Euro) zzgl. der gesetzlichen Mehrwertsteuer. Diese Vergütung ist ein Festpreis und beinhaltet alle Nebenkosten, sofern nicht anders vereinbart.",
        risk: "medium",
        needsRenegotiation: true,
        urgentAttention: false,
        alternativeFormulations: [
          {
            id: "alt-1",
            content:
              "Für die in §1 genannten Leistungen erhält der Auftragnehmer eine Vergütung in Höhe von 2.450.000,00 € (in Worten: zwei Millionen vierhundertfünfzigtausend Euro) zzgl. der gesetzlichen Mehrwertsteuer. Diese Vergütung ist ein Festpreis für den definierten Leistungsumfang. Zusätzliche Leistungen werden nach tatsächlichem Aufwand abgerechnet.",
          },
          {
            id: "alt-2",
            content:
              "Für die in §1 genannten Leistungen erhält der Auftragnehmer eine Vergütung in Höhe von 2.450.000,00 € (in Worten: zwei Millionen vierhundertfünfzigtausend Euro) zzgl. der gesetzlichen Mehrwertsteuer. Diese Vergütung basiert auf den aktuellen Materialpreisen und kann bei erheblichen Marktpreisänderungen (>10%) angepasst werden.",
          },
        ],
      },
      {
        id: "section-4",
        title: "§3 Vertragsstrafen",
        content:
          "Bei Überschreitung der vereinbarten Fertigstellungstermine wird eine Vertragsstrafe in Höhe von 0,3% der Auftragssumme pro Werktag, maximal jedoch 10% der Auftragssumme, fällig.",
        risk: "high",
        needsRenegotiation: true,
        urgentAttention: true,
        alternativeFormulations: [
          {
            id: "alt-3",
            content:
              "Bei Überschreitung der vereinbarten Fertigstellungstermine wird eine Vertragsstrafe in Höhe von 0,1% der Auftragssumme pro Werktag, maximal jedoch 5% der Auftragssumme, fällig. Die Vertragsstrafe gilt nur bei vom Auftragnehmer zu vertretenden Verzögerungen.",
          },
          {
            id: "alt-4",
            content:
              "Bei Überschreitung der vereinbarten Fertigstellungstermine wird eine Vertragsstrafe in Höhe von 0,05% der Auftragssumme pro Werktag, maximal jedoch 3% der Auftragssumme, fällig. Die Vertragsstrafe gilt nur bei vom Auftragnehmer zu vertretenden Verzögerungen und nach schriftlicher Mahnung.",
          },
        ],
      },
      {
        id: "section-5",
        title: "§4 Zahlungsbedingungen",
        content:
          "Die Zahlung erfolgt nach Baufortschritt in Raten: 20% bei Baubeginn, 30% nach Fertigstellung des Rohbaus, 40% nach Fertigstellung der Installationen, 10% nach Endabnahme. Die Zahlungsfrist beträgt 30 Tage nach Rechnungseingang.",
        risk: "medium",
        needsRenegotiation: true,
        urgentAttention: false,
        alternativeFormulations: [
          {
            id: "alt-5",
            content:
              "Die Zahlung erfolgt nach Baufortschritt in Raten: 20% bei Baubeginn, 30% nach Fertigstellung des Rohbaus, 40% nach Fertigstellung der Installationen, 10% nach Endabnahme. Die Zahlungsfrist beträgt 14 Tage nach Rechnungseingang.",
          },
        ],
      },
      {
        id: "section-6",
        title: "§5 Haftungsbegrenzung",
        content:
          "Der Auftragnehmer haftet unbegrenzt für alle Schäden, die durch seine Leistungen verursacht werden, einschließlich Folgeschäden und entgangenen Gewinn.",
        risk: "high",
        needsRenegotiation: true,
        urgentAttention: true,
        alternativeFormulations: [
          {
            id: "alt-6",
            content:
              "Der Auftragnehmer haftet für Schäden, die durch seine Leistungen verursacht werden, bis zur Höhe der Auftragssumme. Für Folgeschäden und entgangenen Gewinn ist die Haftung ausgeschlossen, soweit gesetzlich zulässig.",
          },
          {
            id: "alt-7",
            content:
              "Der Auftragnehmer haftet für Schäden, die durch seine Leistungen verursacht werden, bis zur Höhe der doppelten Auftragssumme. Für Folgeschäden und entgangenen Gewinn ist die Haftung auf Fälle von Vorsatz und grober Fahrlässigkeit beschränkt.",
          },
        ],
      },
    ]
  }

  const addNewSection = () => {
    const newSection = {
      id: `section-${sections.length + 1}`,
      title: `§${sections.length} Neue Sektion`,
      content: "Fügen Sie hier den Inhalt der neuen Vertragssektion ein.",
      risk: "low",
      needsRenegotiation: false,
      urgentAttention: false,
    }
    setSections([...sections, newSection])
    setActiveSection(newSection.id)
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const applyAlternativeFormulation = (sectionId: string, alternativeId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          const alternative = section.alternativeFormulations?.find((alt: any) => alt.id === alternativeId)
          if (alternative) {
            return {
              ...section,
              content: alternative.content,
              risk: "low", // Assuming the alternative reduces risk
              needsRenegotiation: false,
              urgentAttention: false,
            }
          }
        }
        return section
      }),
    )
  }

  const removeClause = (sectionId: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            content: "[Diese Klausel wurde entfernt aufgrund hoher Risikobewertung]",
            risk: "low",
            needsRenegotiation: false,
            urgentAttention: false,
            removed: true,
          }
        }
        return section
      }),
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vertrag wird geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-12rem)]">
      {/* Linke Spalte - Vertragssektionen */}
      <div className="w-full md:w-2/3 border-r">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Vertragsdokument</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Rückgängig">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Wiederholen">
              <Redo className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="icon" title="Kopieren">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Löschen">
              <Trash className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" className="gap-1">
              <Save className="h-4 w-4" />
              <span>Speichern</span>
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-3.5rem)]">
          <div className="p-4 space-y-4">
            {sections.map((section) => (
              <div key={section.id}>
                <ContractSection
                  section={section}
                  isActive={activeSection === section.id}
                  onClick={() => setActiveSection(section.id)}
                  onUpdate={(updatedSection) => {
                    setSections(sections.map((s) => (s.id === updatedSection.id ? { ...s, ...updatedSection } : s)))
                  }}
                />

                {/* Alternative Formulations for sections that need renegotiation */}
                {activeSection === section.id && section.needsRenegotiation && section.alternativeFormulations && (
                  <Card className="mt-2 border-dashed">
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <div className="flex items-center gap-2 mb-2">
                          {section.urgentAttention ? (
                            <Badge variant="destructive">Dringender Handlungsbedarf</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                              Verhandelbar
                            </Badge>
                          )}
                          <span className="text-sm font-medium">Alternative Formulierungen</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Diese Klausel wurde in der Risikoanalyse als{" "}
                          {section.risk === "high" ? "hochriskant" : "risikobehaftet"} eingestuft. Wählen Sie eine
                          alternative Formulierung oder entfernen Sie die Klausel.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {section.alternativeFormulations.map((alt: any) => (
                          <div
                            key={alt.id}
                            className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <p className="text-sm mb-2">{alt.content}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => applyAlternativeFormulation(section.id, alt.id)}
                            >
                              Diese Formulierung verwenden
                            </Button>
                          </div>
                        ))}

                        <div className="space-y-2 mt-4">
                          <h4 className="text-sm font-medium">Benutzerdefinierte Formulierung:</h4>
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
                      </div>

                      <div className="flex justify-start mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeClause(section.id)}
                        >
                          Klausel entfernen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}

            <Button onClick={addNewSection} variant="outline" className="w-full mt-4 gap-1">
              <Plus className="h-4 w-4" />
              <span>Neue Sektion hinzufügen</span>
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Rechte Spalte - Bibliothek und Vorlagen */}
     <div className="w-full md:w-1/3">
        <div className="flex flex-col h-full">
          <Tabs defaultValue="risikoanalyse" className="w-full h-full" onValueChange={(value) => setActiveTab(value)}>
      {/*    <div className="border-b">
              <TabsList className="w-full justify-start -mb-px h-12 rounded-none bg-transparent p-4">
                 <TabsTrigger
                      value="klauseln"
                      className="rounded-md data-[state=active]:bg-muted data-[state=active]:shadow-none"
                    >
                      Klauselbibliothek
                    </TabsTrigger>  
                <TabsTrigger
                  value="risikoanalyse"
                  className="rounded-md data-[state=active]:bg-muted data-[state=active]:shadow-none"
                >
                  Risikoanalyse
                </TabsTrigger>  
              </TabsList>
            </div>   */}

            {/*    <TabsContent value="klauseln" className="p-0 m-0 h-[calc(100%-3rem)] overflow-hidden">
                  <div className="h-full">
                    <ContractClauseLibrary
                      onSelectClause={(clause) => {
                        if (activeSection) {
                          setSections(
                            sections.map((s) =>
                              s.id === activeSection
                                ? {
                                    ...s,
                                    content: s.content + "\n\n" + clause.content,
                                    risk: clause.risk === "high" ? "high" : s.risk === "high" ? "high" : clause.risk,
                                  }
                                : s,
                            ),
                          )
                        }
                      }}
                    />
                  </div>
                </TabsContent>     */}

            <TabsContent value="risikoanalyse" className="p-0 m-0 h-[calc(100%-3rem)] flex flex-col">
              <div className="p-4">
                <h3 className="font-medium">Risikoanalyse des Vertrags</h3>
                <p className="text-sm text-muted-foreground">
                  Die folgende Analyse zeigt die Risikobewertung der einzelnen Vertragsklauseln. Klauseln mit hohem
                  Risiko sollten neu verhandelt oder entfernt werden.
                </p>
              </div>
              <div className="p-4 border-b">
                <h4 className="font-medium mb-2">Risikozusammenfassung</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-md">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {sections.filter((s) => s.risk === "high").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Hohes Risiko</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {sections.filter((s) => s.risk === "medium").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Mittleres Risiko</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-md">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {sections.filter((s) => s.risk === "low").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Niedriges Risiko</p>
                  </div>
                </div>
              </div>
              <ScrollArea className="h-[calc(100%-11rem)]">
                <div className="p-4 space-y-2">
                  {sections
                    .filter((section) => section.needsRenegotiation)
                    .map((section) => (
                      <div
                        key={section.id}
                        className={`p-3 border rounded-md ${
                          section.urgentAttention
                            ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50"
                            : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getRiskIcon(section.risk)}
                          <span className="font-medium">{section.title}</span>
                          {section.urgentAttention ? (
                            <Badge variant="destructive" className="ml-auto">
                              Dringend
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 ml-auto">
                              Verhandelbar
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mb-2 line-clamp-2">{section.content}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveSection(section.id)}
                          className="mt-1"
                        >
                          Bearbeiten
                        </Button>
                      </div>
                    ))}

                  {sections.filter((section) => section.needsRenegotiation).length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p>Keine risikobehafteten Klauseln gefunden.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
