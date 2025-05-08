"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle, Search, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

// Custom utility for hiding scrollbar while allowing scrolling
const scrollbarHideStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

interface Clause {
  id: string
  title: string
  category: string
  content: string
  risk: string
}

interface ContractClauseLibraryProps {
  onSelectClause: (clause: Clause) => void
}

export function ContractClauseLibrary({ onSelectClause }: ContractClauseLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Beispiel-Klauseln
  const clauses: Clause[] = [
    {
      id: "clause-1",
      title: "Standard Vertragsstrafe",
      category: "vertragsstrafen",
      content:
        "Bei Überschreitung der vereinbarten Fertigstellungstermine wird eine Vertragsstrafe in Höhe von 0,1% der Auftragssumme pro Werktag, maximal jedoch 5% der Auftragssumme, fällig.",
      risk: "medium",
    },
    {
      id: "clause-2",
      title: "Milde Vertragsstrafe",
      category: "vertragsstrafen",
      content:
        "Bei Überschreitung der vereinbarten Fertigstellungstermine wird eine Vertragsstrafe in Höhe von 0,05% der Auftragssumme pro Werktag, maximal jedoch 3% der Auftragssumme, fällig.",
      risk: "low",
    },
    {
      id: "clause-3",
      title: "Strenge Vertragsstrafe",
      category: "vertragsstrafen",
      content:
        "Bei Überschreitung der vereinbarten Fertigstellungstermine wird eine Vertragsstrafe in Höhe von 0,3% der Auftragssumme pro Werktag, maximal jedoch 10% der Auftragssumme, fällig.",
      risk: "high",
    },
    {
      id: "clause-4",
      title: "Standard Zahlungsbedingungen",
      category: "zahlungen",
      content:
        "Die Zahlung erfolgt nach Baufortschritt in Raten: 20% bei Baubeginn, 30% nach Fertigstellung des Rohbaus, 40% nach Fertigstellung der Installationen, 10% nach Endabnahme. Die Zahlungsfrist beträgt 14 Tage nach Rechnungseingang.",
      risk: "low",
    },
    {
      id: "clause-5",
      title: "Verzögerte Zahlungsbedingungen",
      category: "zahlungen",
      content:
        "Die Zahlung erfolgt nach Baufortschritt in Raten: 20% bei Baubeginn, 30% nach Fertigstellung des Rohbaus, 40% nach Fertigstellung der Installationen, 10% nach Endabnahme. Die Zahlungsfrist beträgt 30 Tage nach Rechnungseingang.",
      risk: "medium",
    },
    {
      id: "clause-6",
      title: "Standard Gewährleistung",
      category: "gewaehrleistung",
      content: "Die Gewährleistungsfrist beträgt 5 Jahre ab Abnahme für alle Bauleistungen gemäß VOB/B.",
      risk: "low",
    },
    {
      id: "clause-7",
      title: "Erweiterte Gewährleistung",
      category: "gewaehrleistung",
      content: "Die Gewährleistungsfrist beträgt 10 Jahre ab Abnahme für alle Bauleistungen.",
      risk: "low",
    },
    {
      id: "clause-8",
      title: "Begrenzte Haftung",
      category: "haftung",
      content:
        "Der Auftragnehmer haftet für Schäden, die durch seine Leistungen verursacht werden, bis zur Höhe der Auftragssumme. Für Folgeschäden und entgangenen Gewinn ist die Haftung ausgeschlossen, soweit gesetzlich zulässig.",
      risk: "low",
    },
    {
      id: "clause-9",
      title: "Unbegrenzte Haftung",
      category: "haftung",
      content:
        "Der Auftragnehmer haftet unbegrenzt für alle Schäden, die durch seine Leistungen verursacht werden, einschließlich Folgeschäden und entgangenen Gewinn.",
      risk: "high",
    },
    {
      id: "clause-10",
      title: "Kurze Kündigungsfrist",
      category: "kuendigung",
      content:
        "Der Auftraggeber kann den Vertrag jederzeit ohne Angabe von Gründen mit einer Frist von 14 Tagen kündigen. In diesem Fall hat der Auftragnehmer Anspruch auf Vergütung der bis dahin erbrachten Leistungen.",
      risk: "high",
    },
    {
      id: "clause-11",
      title: "Standard Kündigungsfrist",
      category: "kuendigung",
      content:
        "Der Auftraggeber kann den Vertrag jederzeit ohne Angabe von Gründen mit einer Frist von 30 Tagen kündigen. In diesem Fall hat der Auftragnehmer Anspruch auf Vergütung der bis dahin erbrachten Leistungen sowie eine Entschädigung für bereits bestellte Materialien.",
      risk: "medium",
    },
    {
      id: "clause-12",
      title: "Faire Kündigungsfrist",
      category: "kuendigung",
      content:
        "Der Auftraggeber kann den Vertrag jederzeit ohne Angabe von Gründen mit einer Frist von 60 Tagen kündigen. In diesem Fall hat der Auftragnehmer Anspruch auf Vergütung der bis dahin erbrachten Leistungen sowie eine Entschädigung für bereits bestellte Materialien und entgangenen Gewinn in Höhe von 5% der restlichen Auftragssumme.",
      risk: "low",
    },
  ]

  const filteredClauses = clauses.filter(
    (clause) =>
      clause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clause.content.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "high":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
            Hohes Risiko
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
            Mittleres Risiko
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
            Niedriges Risiko
          </Badge>
        )
      default:
        return null
    }
  }

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current
    if (!container) return

    // Check if we can scroll left (not at the beginning)
    setCanScrollLeft(container.scrollLeft > 0)

    // Check if we can scroll right (not at the end)
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1)
  }

  const handleScroll = () => {
    checkScrollPosition()
  }

  const scrollLeft = () => {
    const container = scrollContainerRef.current
    if (!container) return

    container.scrollBy({
      left: -container.clientWidth,
      behavior: "smooth",
    })
  }

  const scrollRight = () => {
    const container = scrollContainerRef.current
    if (!container) return

    container.scrollBy({
      left: container.clientWidth,
      behavior: "smooth",
    })
  }

  useEffect(() => {
    checkScrollPosition()

    // Check on resize
    const handleResize = () => {
      checkScrollPosition()
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      <style jsx>{scrollbarHideStyles}</style>
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Klauseln durchsuchen..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="alle" className="flex-1">
        <div className="relative">
          <div
            className="px-4 border-b overflow-x-auto scrollbar-hide"
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            <TabsList className="w-full min-w-max justify-start -mb-px h-12 rounded-none bg-transparent p-0 whitespace-nowrap">
              <TabsTrigger
                value="alle"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Alle
              </TabsTrigger>
              <TabsTrigger
                value="vertragsstrafen"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Vertragsstrafen
              </TabsTrigger>
              <TabsTrigger
                value="zahlungen"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Zahlungen
              </TabsTrigger>
              <TabsTrigger
                value="haftung"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Haftung
              </TabsTrigger>
              <TabsTrigger
                value="kuendigung"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Kündigung
              </TabsTrigger>
            </TabsList>
          </div>

          {canScrollLeft && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-950 shadow-md rounded-full h-8 w-8 z-10"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Nach links scrollen</span>
            </Button>
          )}

          {canScrollRight && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-950 shadow-md rounded-full h-8 w-8 z-10"
              onClick={scrollRight}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Nach rechts scrollen</span>
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 p-4 h-[calc(100%-7rem)]">
          <TabsContent value="alle" className="m-0">
            <div className="space-y-3">
              {filteredClauses.map((clause) => (
                <div
                  key={clause.id}
                  className="rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onSelectClause(clause)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getRiskIcon(clause.risk)}
                      <span className="font-medium">{clause.title}</span>
                    </div>
                    {getRiskBadge(clause.risk)}
                  </div>
                  <p className="text-sm line-clamp-2">{clause.content}</p>
                  <Button variant="ghost" size="sm" className="mt-2 h-7 gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Hinzufügen</span>
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {["vertragsstrafen", "zahlungen", "haftung", "kuendigung", "gewaehrleistung"].map((category) => (
            <TabsContent key={category} value={category} className="m-0">
              <div className="space-y-3">
                {filteredClauses
                  .filter((clause) => clause.category === category)
                  .map((clause) => (
                    <div
                      key={clause.id}
                      className="rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onSelectClause(clause)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getRiskIcon(clause.risk)}
                          <span className="font-medium">{clause.title}</span>
                        </div>
                        {getRiskBadge(clause.risk)}
                      </div>
                      <p className="text-sm line-clamp-2">{clause.content}</p>
                      <Button variant="ghost" size="sm" className="mt-2 h-7 gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        <span>Hinzufügen</span>
                      </Button>
                    </div>
                  ))}
              </div>
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
    </div>
  )
}
