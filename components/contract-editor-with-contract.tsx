"use client"

import { useState, useEffect, useCallback, useRef, MutableRefObject } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ContractSection } from "@/components/contract-section"
import { AlertTriangle, CheckCircle, Plus, Save, FileText, Undo, Redo, Copy, Trash, AlertCircle, Loader2, ChevronUp, ChevronDown, X, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useContract } from "@/hooks/useConvex"
import { useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import type { Doc, Id } from "@/convex/_generated/dataModel"

export interface EditorSection {
  id: string;
  title: string;
  content: string;
  risk: "low" | "medium" | "high" | "error";
  evaluation: string;
  reason?: string;
  recommendation?: string;
  needsRenegotiation: boolean;
  urgentAttention: boolean;
  alternativeFormulations?: { id: string; content: string }[];
  removed?: boolean;
  chunkNumber?: number;
}

// Interface für den History-Eintrag
interface HistoryEntry {
  sections: EditorSection[];
}

interface ContractEditorWithContractProps {
  contractId: Id<"contracts">
}

export function ContractEditorWithContract({ contractId }: ContractEditorWithContractProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([{ sections: [] }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [optimizingSectionId, setOptimizingSectionId] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [detailsVisible, setDetailsVisible] = useState<Set<string>>(new Set())
  const [isEditingFileName, setIsEditingFileName] = useState(false)
  const [editedFileName, setEditedFileName] = useState('')
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const editorScrollAreaRef = useRef<HTMLDivElement>(null)
  const fileNameInputRef = useRef<HTMLInputElement>(null)

  const { contract, isLoading } = useContract(contractId);
  const updateAnalysisMutation = useMutation(api.contractMutations.updateContractAnalysis);
  const optimizeClauseAction = useAction(api.contractActions.optimizeClauseWithAI);
  const generateAlternativesAction = useAction(api.contractActions.generateAlternativeFormulations);
  const updateFileNameMutation = useMutation(api.contractMutations.updateFileName);

  // Aktuelle Sektionen aus dem Verlauf ableiten
  const sections = history[historyIndex].sections;

  // Helper zum Aktualisieren des States und Hinzufügen zur History
  const updateSectionsAndHistory = useCallback((newSections: EditorSection[]) => {
    const newHistoryEntry = { sections: newSections };
    // Entferne alle zukünftigen Zustände nach dem aktuellen Index (falls wir Undo gemacht haben)
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newHistoryEntry]);
    setHistoryIndex(newHistory.length);
  }, [history, historyIndex]);

  useEffect(() => {
    if (contract) {
      // Zuerst prüfen, ob bearbeitete Daten (editedAnalysis) vorhanden sind
      if (contract.editedAnalysis && contract.editedAnalysis.length > 0) {
        console.log("Lade bearbeitete Vertragsdaten aus editedAnalysis");
        // Direkt die bearbeiteten Daten verwenden, da sie bereits im richtigen Format sind
        setHistory([{ sections: contract.editedAnalysis }]);
        setHistoryIndex(0);
      } 
      // Wenn keine bearbeiteten Daten verfügbar sind, aber analysisProtocol vorhanden
      else if (contract.analysisProtocol && contract.analysisProtocol.length > 0) {
        console.log("Lade ursprüngliche Vertragsdaten aus analysisProtocol");
        const transformedSections: EditorSection[] = contract.analysisProtocol.map((clause, index) => {
          let riskLevel: EditorSection["risk"] = "low";
          switch (clause.evaluation.toLowerCase()) {
            case "rot":
              riskLevel = "high";
              break;
            case "gelb":
              riskLevel = "medium";
              break;
            case "grün":
              riskLevel = "low";
              break;
            case "fehler":
              riskLevel = "error";
              break;
          }

          // Titel generieren basierend auf dem Inhalt der Klausel
          let title = `Klausel ${index + 1}`;
          
          // Extrahiere Nummerierung aus dem Klauseltext, falls vorhanden
          const numberMatch = clause.clauseText.match(/^(\d+\.[\d\.]*)\s+/);
          if (numberMatch) {
            // Verwende die gefundene Nummerierung im Titel
            title = `§ ${numberMatch[1]} (Klausel ${index + 1})`;
          } else {
            // Wenn keine Nummerierung gefunden, extrahiere den Themenschwerpunkt
            // Verwende die ersten 3-5 Wörter, max 40 Zeichen
            const words = clause.clauseText.split(' ');
            const thematicTitle = words.slice(0, 4).join(' ');
            title = thematicTitle.length > 40 
              ? thematicTitle.substring(0, 40) + '...' 
              : thematicTitle;
            title = `${index + 1}. ${title}`;
          }

          return {
            id: `clause-${clause.chunkNumber || '0'}-${index}`,
            title: title,
            content: clause.clauseText,
            risk: riskLevel,
            evaluation: clause.evaluation,
            reason: clause.reason,
            recommendation: clause.recommendation,
            needsRenegotiation: riskLevel === "high" || riskLevel === "medium",
            urgentAttention: riskLevel === "high",
            alternativeFormulations: [],
            chunkNumber: clause.chunkNumber,
          };
        });
        // Initialisiere die History mit den geladenen Daten
        setHistory([{ sections: transformedSections }]);
        setHistoryIndex(0);
      } else if (!isLoading && contract) {
          // Fall: Contract existiert, aber keine Analysedaten
          setHistory([{ sections: [] }]);
          setHistoryIndex(0);
      }
    } else if (!isLoading && !contract) {
        setHistory([{ sections: [] }]);
        setHistoryIndex(0);
    }
  }, [contract, isLoading]);

  const addNewSection = () => {
    console.warn("addNewSection: Diese Funktion muss überarbeitet werden, um mit dynamischen Vertragsdaten zu arbeiten.")
  };

  const getRiskIcon = (risk: EditorSection["risk"]) => {
    switch (risk) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  const applyAlternativeFormulation = (sectionId: string, alternativeId: string) => {
    const newSections = sections.map((section) => {
        if (section.id === sectionId) {
          const alternative = section.alternativeFormulations?.find((alt) => alt.id === alternativeId);
          if (alternative) {
            return {
              ...section,
              content: alternative.content,
              risk: "low" as EditorSection["risk"],
              evaluation: "Grün",
              needsRenegotiation: false,
              urgentAttention: false,
            };
          }
        }
        return section;
      });
    updateSectionsAndHistory(newSections);
  }

  const removeClause = (sectionId: string) => {
    const newSections = sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            content: "[Diese Klausel wurde vom Benutzer entfernt]",
            risk: "low" as EditorSection["risk"],
            evaluation: "N/A",
            needsRenegotiation: false,
            urgentAttention: false,
            removed: true,
          };
        }
        return section;
      });
     updateSectionsAndHistory(newSections);
  }
  
  const handleSaveContract = async () => {
    if (!contract?._id) {
        toast.error("Fehler: Keine Vertrags-ID zum Speichern vorhanden.");
        return;
    }
    setIsSaving(true);
    try {
        console.log("Speichern der Vertragsänderungen für contractId:", contract._id);
        
        // Bereinige die Sections für das Backend:
        // Prüfe, ob die API alternativeFormulations unterstützt
        // Falls nicht, entferne diese Eigenschaft aus allen Objekten
        const cleanedSections = sections.map(section => {
            const { alternativeFormulations, ...cleanSection } = section;
            // Schema wurde aktualisiert, sollte alternativeFormulations unterstützen
            // Falls nicht, werden sie hier entfernt
            return {
                ...cleanSection,
                alternativeFormulations: alternativeFormulations || []
            };
        });
        
        await updateAnalysisMutation({ 
            contractId: contract._id, 
            updatedSections: cleanedSections
        });
        toast.success("Vertragsänderungen erfolgreich gespeichert!");
    } catch (error) {
        console.error("Fehler beim Speichern der Vertragsänderungen:", error);
        
        // Bei Validierungsfehlern mit alternativeFormulations versuche ohne sie zu speichern
        if (error instanceof Error && error.message.includes("alternativeFormulations")) {
            try {
                console.log("Versuche erneut ohne alternativeFormulations...");
                const strippedSections = sections.map(({ alternativeFormulations, ...rest }) => rest);
                await updateAnalysisMutation({
                    contractId: contract._id,
                    updatedSections: strippedSections
                });
                toast.success("Vertragsänderungen gespeichert (ohne Alternativvorschläge)");
            } catch (fallbackError) {
                console.error("Auch der zweite Versuch ist fehlgeschlagen:", fallbackError);
                toast.error("Fehler beim Speichern der Änderungen.", { 
                    description: fallbackError instanceof Error ? fallbackError.message : "Unbekannter Fehler" 
                });
            }
        } else {
            toast.error("Fehler beim Speichern der Änderungen.", { 
                description: error instanceof Error ? error.message : "Unbekannter Fehler" 
            });
        }
    } finally {
        setIsSaving(false);
    }
  };

  // Undo Funktion
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Redo Funktion
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Copy Funktion
  const handleCopySection = () => {
    if (!activeSectionId) {
        toast.info("Bitte wählen Sie zuerst eine Sektion zum Kopieren aus.");
        return;
    }
    const sectionToCopy = sections.find(s => s.id === activeSectionId);
    if (!sectionToCopy) return;

    const newSection: EditorSection = {
      ...sectionToCopy,
      // Neue eindeutige ID generieren (z.B. mit Zeitstempel oder UUID)
      id: `clause-${sectionToCopy.chunkNumber || '0'}-${Date.now()}`,
      title: `${sectionToCopy.title} (Kopie)`
    };

    const currentIndex = sections.findIndex(s => s.id === activeSectionId);
    const newSections = [
        ...sections.slice(0, currentIndex + 1),
        newSection,
        ...sections.slice(currentIndex + 1)
    ];
    updateSectionsAndHistory(newSections);
    // Optional: Die neue Sektion direkt aktiv machen
    setActiveSectionId(newSection.id);
     toast.success(`Sektion "${sectionToCopy.title}" wurde kopiert.`);
  };

  // Delete Funktion
  const handleDeleteSection = () => {
     if (!activeSectionId) {
        toast.info("Bitte wählen Sie zuerst eine Sektion zum Löschen aus.");
        return;
    }
    const sectionToDelete = sections.find(s => s.id === activeSectionId);
    if (!sectionToDelete) return;

    const newSections = sections.filter(s => s.id !== activeSectionId);
    updateSectionsAndHistory(newSections);
    setActiveSectionId(null); // Keine Sektion mehr aktiv nach Löschen
    toast.success(`Sektion "${sectionToDelete.title}" wurde gelöscht.`);
  };

  // Platzhalter für "Einreichen" der benutzerdefinierten Formulierung
  const handleCustomFormulationSubmit = (sectionId: string, customContent: string) => {
    if (!customContent.trim()) {
      toast.info("Bitte geben Sie eine Formulierung ein.");
      return;
    }
    console.log(`Eigene Formulierung für Sektion ${sectionId} eingereicht:`, customContent);
    // Sektion aktualisieren
    const newSections = sections.map(s => s.id === sectionId ? {...s, content: customContent, risk: 'low' as EditorSection["risk"]} : s);
    updateSectionsAndHistory(newSections);
    toast.success("Eigene Formulierung übernommen (Speichern nicht vergessen).");
  };

  // "Mit KI optimieren"-Funktion für benutzerdefinierte Formulierungen
  const handleOptimizeWithAI = async (sectionId: string, textToOptimize?: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const isManualOptimization = typeof textToOptimize === 'string';
    const contentToOptimize = isManualOptimization ? textToOptimize : section.content;

    if (!contentToOptimize || contentToOptimize.trim().length === 0) {
      if (!isManualOptimization) {
          toast.info("Kein Inhalt in der Klausel zum Optimieren vorhanden.");
      }
      return;
    }
    
    setOptimizingSectionId(sectionId); 
    console.log(`KI-Optimierung angefordert für Sektion ${sectionId}. Manuell: ${isManualOptimization}. Inhalt:`, contentToOptimize);
    
    try {
        if (isManualOptimization) {
            // Fall 1: Bei einem manuellen Aufruf (Button "Mit KI optimieren")
            const alternatives = await optimizeClauseAction({ clauseText: contentToOptimize });
            console.log("Received alternatives:", alternatives);
            
            if (alternatives && alternatives.length > 0) {
                // Den optimierten Text direkt in das Eingabefeld einfügen
                const textarea = document.getElementById(`custom-formulation-${sectionId}`) as HTMLTextAreaElement;
                if (textarea) {
                    textarea.value = alternatives[0];
                    toast.success("Text wurde optimiert. Klicke auf 'Einreichen', um ihn zu übernehmen.");
                } else {
                    toast.error("Fehler: Konnte das Eingabefeld nicht finden.");
                }
            } else {
                toast.info("KI konnte keine Alternativen für diesen Text finden.");
            }
        } else {
            // Fall 2: Bei automatischem Aufruf (Detailkarte aufgeklappt)
            // Verwende die neue generateAlternativesAction für 3 alternative Formulierungen
            const alternatives = await generateAlternativesAction({ clauseText: contentToOptimize });
            console.log("Received alternative formulations:", alternatives);
            
            if (alternatives && alternatives.length > 0) {
                toast.success(`${alternatives.length} alternative Formulierungen generiert!`);
                const newSections = sections.map(s => {
                    if (s.id === sectionId) {
                        // Überschreibe immer die alternativeFormulations mit den neuesten Ergebnissen
                        return {
                            ...s,
                            alternativeFormulations: alternatives.map((altText, index) => ({ id: `ai-alt-${sectionId}-${index}-${Date.now()}`, content: altText }))
                        };
                    }
                    return s;
                });
                updateSectionsAndHistory(newSections);
            } else {
                toast.info("KI konnte keine Alternativen für diesen Text generieren.");
            }
        }
    } catch (error) {
        console.error("Fehler bei der KI-Optimierung:", error);
        toast.error("Fehler bei der KI-Optimierung.", { description: error instanceof Error ? error.message : "Unbekannter Fehler" });
    } finally {
        setOptimizingSectionId(null); 
    }
  };

  // Funktion, um sicherzustellen, dass Refs korrekt gesetzt werden
  const setSectionRef = (sectionId: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[sectionId] = el;
  };

  // Funktion zum Verfolgen der eingeklappten Sektionen
  const handleSectionCollapsedChange = (sectionId: string, isCollapsed: boolean) => {
    console.log(`Section ${sectionId} collapsed state changed to: ${isCollapsed}`);
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (isCollapsed) {
        newSet.add(sectionId);
      } else {
        newSet.delete(sectionId);
      }
      return newSet;
    });
  };

  // Funktion zum Umschalten der Sichtbarkeit der Details-Karte
  const toggleDetailsVisibility = (sectionId: string, e?: React.MouseEvent) => {
    // Immer das Event stoppen, um zu verhindern, dass es an die Hauptkachel weitergeleitet wird
    if (e) {
      e.stopPropagation();
    }
    
    console.log(`Toggling details for section ${sectionId}. Currently visible: ${detailsVisible.has(sectionId)}`);
    
    // Wenn die Sektion noch nicht aktiv ist, aktivieren
    if (activeSectionId !== sectionId) {
      setActiveSectionId(sectionId);
    }
    
    setDetailsVisible(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Funktion, die prüft, ob die Details für eine Sektion sichtbar sein sollen
  const isDetailsVisible = useCallback((sectionId: string) => {
    return activeSectionId === sectionId && !collapsedSections.has(sectionId) && detailsVisible.has(sectionId);
  }, [activeSectionId, collapsedSections, detailsVisible]);

  // Funktion zum Entfernen einer Klausel
  const handleRemoveClause = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    // Setze die removed Eigenschaft auf true statt tatsächlich zu löschen
    const newSections = sections.map(s => 
      s.id === sectionId ? {...s, removed: true} : s
    );
    
    // Aktualisiere Sektionen und History
    updateSectionsAndHistory(newSections);
    setActiveSectionId(null);
    toast.success(`Klausel "${section.title}" wurde entfernt.`);
  };

  // Effekt zum automatischen Laden von KI-Alternativen für aktive, riskante Sektionen ohne Alternativen
  useEffect(() => {
    if (activeSectionId && sections.length > 0) {
      const activeSection = sections.find(s => s.id === activeSectionId);
      
      // Prüfen, ob die Sektion existiert, riskant ist, noch keine Alternativen hat UND nicht gerade optimiert wird
      if (
        activeSection && 
        (activeSection.risk === "medium" || activeSection.risk === "high") && 
        (!activeSection.alternativeFormulations || activeSection.alternativeFormulations.length === 0) &&
        optimizingSectionId !== activeSectionId // Verhindert erneutes Laden, wenn schon aktiv
      ) {
        console.log(`Automatically fetching AI alternatives for active risky section: ${activeSectionId}`);
        // Rufe handleOptimizeWithAI für den Hauptinhalt der Klausel auf (ohne textToOptimize)
        handleOptimizeWithAI(activeSectionId);
      }
    }
    // Abhängigkeiten: Wird ausgeführt, wenn sich die aktive Sektion oder der Optimierungsstatus ändert
  }, [activeSectionId, sections, optimizingSectionId]); 

  // 1. Speichern-Unter-Funktionalität
  const handleDownloadContract = () => {
    if (!contract) {
      toast.error("Fehler: Vertrag konnte nicht geladen werden.");
      return;
    }

    // Den Inhalt des Vertrags aus den Sektionen zusammenstellen
    const contractContent = sections
      .filter(section => !section.removed)
      .map(section => section.content)
      .join('\n\n');

    // Dateinamen aus dem ursprünglichen Vertrag ableiten
    const originalFileName = contract.fileName;
    
    // Dateiendung extrahieren
    const fileExtension = originalFileName.includes('.') 
      ? originalFileName.split('.').pop()?.toLowerCase() 
      : 'txt';

    try {
      // MIME-Typ und Encoding je nach Dateityp festlegen
      let blob;
      
      // Für Textdateien: UTF-8 Encoding verwenden
      if (!fileExtension || fileExtension === 'txt') {
        // BOM (Byte Order Mark) für UTF-8 hinzufügen
        const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const textEncoder = new TextEncoder();
        const contentArray = textEncoder.encode(contractContent);
        
        // BOM und Inhalt zusammenführen
        const contentWithBOM = new Uint8Array(BOM.length + contentArray.length);
        contentWithBOM.set(BOM, 0);
        contentWithBOM.set(contentArray, BOM.length);
        
        blob = new Blob([contentWithBOM], { type: 'text/plain;charset=UTF-8' });
      } 
      // Für Word-Dokumente: Da wir keine echten Word-Dokumente erzeugen können, 
      // exportieren wir als .txt mit entsprechendem Hinweis
      else if (fileExtension === 'docx' || fileExtension === 'doc') {
        toast.info("Word-Format wird als UTF-8 Textdatei exportiert", {
          description: "Die eigentliche Word-Formatierung kann nicht beibehalten werden."
        });
        
        // BOM (Byte Order Mark) für UTF-8 hinzufügen
        const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const textEncoder = new TextEncoder();
        const contentArray = textEncoder.encode(contractContent);
        
        // BOM und Inhalt zusammenführen
        const contentWithBOM = new Uint8Array(BOM.length + contentArray.length);
        contentWithBOM.set(BOM, 0);
        contentWithBOM.set(contentArray, BOM.length);
        
        blob = new Blob([contentWithBOM], { type: 'text/plain;charset=UTF-8' });
      } 
      // Für andere Formate: als Textdatei behandeln
      else {
        toast.info(`Format .${fileExtension} wird als UTF-8 Textdatei exportiert`);
        
        // BOM (Byte Order Mark) für UTF-8 hinzufügen
        const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const textEncoder = new TextEncoder();
        const contentArray = textEncoder.encode(contractContent);
        
        // BOM und Inhalt zusammenführen
        const contentWithBOM = new Uint8Array(BOM.length + contentArray.length);
        contentWithBOM.set(BOM, 0);
        contentWithBOM.set(contentArray, BOM.length);
        
        blob = new Blob([contentWithBOM], { type: 'text/plain;charset=UTF-8' });
      }
      
      // URL für den Download erzeugen
      const url = URL.createObjectURL(blob);
      
      // Download-Link erstellen und klicken
      const a = document.createElement('a');
      a.href = url;
      a.download = originalFileName;
      document.body.appendChild(a);
      a.click();
      
      // Aufräumen
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Vertrag "${originalFileName}" wurde erfolgreich exportiert.`);
    } catch (error) {
      console.error("Fehler beim Export des Vertrags:", error);
      toast.error("Fehler beim Export des Vertrags", {
        description: error instanceof Error ? error.message : "Unbekannter Fehler"
      });
    }
  };

  // 2. Dateinamen-Bearbeitung Funktionen
  const handleStartEditFileName = () => {
    if (contract) {
      setEditedFileName(contract.fileName);
      setIsEditingFileName(true);
      // Focus auf das Input-Feld setzen (nach dem Rendern)
      setTimeout(() => {
        if (fileNameInputRef.current) {
          fileNameInputRef.current.focus();
          fileNameInputRef.current.select();
        }
      }, 10);
    }
  };

  const handleSaveFileName = async () => {
    if (!contract || !editedFileName.trim()) {
      setIsEditingFileName(false);
      return;
    }
    
    try {
      await updateFileNameMutation({
        contractId: contract._id,
        newFileName: editedFileName.trim()
      });
      toast.success("Dateiname erfolgreich aktualisiert.");
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Dateinamens:", error);
      toast.error("Fehler beim Aktualisieren des Dateinamens", {
        description: error instanceof Error ? error.message : "Unbekannter Fehler"
      });
    } finally {
      setIsEditingFileName(false);
    }
  };

  const handleCancelEditFileName = () => {
    setIsEditingFileName(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Vertragsdaten werden geladen...</p>
      </div>
    );
  }

  if (!contract || history[historyIndex].sections.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Keine Analysedaten</h3>
            <p className="text-muted-foreground">
                Für diesen Vertrag wurden keine analysierten Klauseln gefunden oder die Analyse ist noch nicht abgeschlossen/fehlgeschlagen.
            </p>
            {contract && (
                <p className="text-sm text-muted-foreground mt-1">Status: {contract.status}</p>
            )}
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between py-2 px-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isEditingFileName ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={fileNameInputRef}
                  value={editedFileName}
                  onChange={(e) => setEditedFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveFileName();
                    } else if (e.key === 'Escape') {
                      handleCancelEditFileName();
                    }
                  }}
                  className="h-8 max-w-md"
                />
                <Button variant="ghost" size="icon" onClick={handleSaveFileName} title="Speichern">
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancelEditFileName} title="Abbrechen">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h3 
                className="font-medium cursor-pointer hover:underline" 
                onDoubleClick={handleStartEditFileName}
                title="Doppelklick zum Bearbeiten"
              >
                Vertragsdokument: {contract?.fileName || 'Vertrag laden...'}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Rückgängig" onClick={handleUndo} disabled={historyIndex === 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Wiederholen" onClick={handleRedo} disabled={historyIndex === history.length - 1}>
              <Redo className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="icon" title="Kopieren" onClick={handleCopySection} disabled={!activeSectionId}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Löschen" onClick={handleDeleteSection} disabled={!activeSectionId}>
              <Trash className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" className="gap-1" onClick={handleSaveContract} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSaving ? "Speichern..." : "Speichern"}</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={handleDownloadContract}>
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

      <div className="flex flex-1 gap-4 p-4">
        <div className="flex-1 flex flex-col h-full min-h-0">
          <ScrollArea className="flex-1 h-full">
            <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} ref={setSectionRef(section.id)} className="section-container">
                <ContractSection
                  section={section}
                  isActive={activeSectionId === section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  onUpdate={(updatedContent) => {
                    // Update Funktion für einzelne Sektion
                    const newSections = sections.map((s) => 
                      s.id === section.id ? { ...s, content: updatedContent } : s
                    );
                    updateSectionsAndHistory(newSections);
                  }}
                  onRemoveClause={handleRemoveClause}
                  onOptimizeWithAI={handleOptimizeWithAI}
                  onSubmitCustomFormulation={handleCustomFormulationSubmit}
                  onApplyAlternativeFormulation={applyAlternativeFormulation}
                  optimizingSectionId={optimizingSectionId}
                  onToggleDetails={(sectionId, e) => toggleDetailsVisibility(sectionId, e)}
                  detailsVisible={detailsVisible.has(section.id)}
                />

                {/* Details Karte (Begründung, Empfehlung, Alternativen) */}
                {detailsVisible.has(section.id) && (
                  <Card className="mt-4 border-gray-200 dark:border-gray-700 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          {section.risk === "medium" && (
                            <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 mr-2">
                              Verhandelbar
                            </Badge>
                          )}
                          {section.risk === "high" && (
                            <Badge variant="destructive" className="mr-2">
                              Dringender Handlungsbedarf
                            </Badge>
                          )}
                          <h3 className="text-base font-semibold">Details und Alternative Formulierungen</h3>
                        </div>
                      </div>

                      {/* Begründung und Empfehlung */}
                      {(section.reason || section.recommendation) && (
                        <div className="space-y-3 mb-4 border-b pb-4 dark:border-gray-700">
                          {section.reason && (
                            <div className="p-3 border rounded-md bg-muted/50">
                              <h4 className="text-sm font-medium mb-1">Begründung ({section.risk === "high" ? "Hohes Risiko" : section.risk === "medium" ? "Mittleres Risiko" : section.risk === "low" ? "Niedriges Risiko" : "Fehler"}):</h4>
                              <p className="text-sm whitespace-pre-wrap">{section.reason}</p>
                            </div>
                          )}
                          {section.recommendation && (
                            <div className="p-3 border rounded-md bg-primary/5">
                              <h4 className="text-sm font-medium mb-1">Empfehlung:</h4>
                              <p className="text-sm whitespace-pre-wrap">{section.recommendation}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Alternative Formulierungen */}
                      {(section.risk === "high" || section.risk === "medium") && (
                        <>
                          <p className="text-sm text-muted-foreground mb-4">
                            Diese Klausel wurde in der Risikoanalyse als risikobehaftet eingestuft. Wählen Sie eine alternative Formulierung oder entfernen Sie die Klausel.
                          </p>

                          {/* KI-generierte Alternativen */}
                          {section.alternativeFormulations && section.alternativeFormulations.length > 0 && (
                            <div className="space-y-3 mb-6">
                              {section.alternativeFormulations.map((alt) => (
                                <div
                                  key={alt.id}
                                  className="p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 bg-white dark:bg-gray-900/30 transition-colors group"
                                >
                                  <p className="text-sm mb-2 whitespace-pre-wrap">{alt.content}</p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-500 text-blue-600 hover:bg-blue-100/60 hover:text-blue-700 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-900/50 dark:hover:text-blue-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      applyAlternativeFormulation(section.id, alt.id);
                                    }}
                                  >
                                    Diese Formulierung verwenden
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          {(!section.alternativeFormulations || section.alternativeFormulations.length === 0) && (
                            <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800/50 text-sm text-muted-foreground mb-6">
                               Für diese Klausel wurden von der KI noch keine Alternativen vorgeschlagen. Sie können unten eine eigene Formulierung eingeben oder die Klausel mit KI optimieren lassen.
                            </div>
                          )}

                          {/* Bereich für benutzerdefinierte Formulierung */}
                          <div className="space-y-2 pt-4 border-t dark:border-gray-700">
                            <h4 className="text-sm font-medium">Benutzerdefinierte Formulierung:</h4>
                            <div className="relative">
                              <Textarea 
                                placeholder="Geben Sie Ihre eigene Formulierung für diese Klausel ein..."
                                className="min-h-[100px] bg-white dark:bg-gray-900/30"
                                id={`custom-formulation-${section.id}`} 
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex flex-col sm:flex-row gap-2 mt-3 justify-between items-stretch">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-1 w-full sm:w-auto sm:mr-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveClause(section.id);
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                  <span>Klausel entfernen</span>
                                </Button>
                                
                                <div className="flex gap-2 w-full sm:w-auto">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="gap-1 flex-grow sm:flex-grow-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const textarea = document.getElementById(`custom-formulation-${section.id}`) as HTMLTextAreaElement;
                                      handleCustomFormulationSubmit(section.id, textarea?.value || '');
                                    }}
                                  >
                                    <Send className="h-4 w-4" />
                                    <span>Einreichen</span>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="gap-1 bg-destructive hover:bg-destructive/90 text-white flex-grow sm:flex-grow-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const textarea = document.getElementById(`custom-formulation-${section.id}`) as HTMLTextAreaElement;
                                      const customText = textarea?.value;
                                      // Rufe Optimierung NUR mit dem Text aus der Textarea auf, WENN er nicht leer ist.
                                      if (customText && customText.trim() !== "") {
                                        handleOptimizeWithAI(section.id, customText);
                                      } else {
                                        toast.info("Bitte geben Sie zuerst eine Formulierung in das Textfeld ein, um sie mit KI zu optimieren.");
                                      }
                                    }}
                                    disabled={optimizingSectionId === section.id}
                                  >
                                    {optimizingSectionId === section.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wand-2"><path d="m3 21 3.05-9.16A2 2 0 0 1 7.98 10.5H10.5a2 2 0 0 1 1.83 1.26L15 21M21 3l-9.16 3.05a2 2 0 0 1-1.34.24L9 6.05M14.5 6.5l3 3M6.5 14.5l3 3"/></svg>
                                    )}
                                    <span>{optimizingSectionId === section.id ? "Optimiere..." : "Mit KI optimieren"}</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
            {sections.length > 0 && (
                 <Button onClick={addNewSection} variant="outline" className="w-full mt-4 gap-1" title="Neue Sektion hinzufügen (TODO)">
              <Plus className="h-4 w-4" />
                    <span>Neue Sektion hinzufügen (Funktion überdenken)</span>
            </Button>
            )}
          </div>
        </ScrollArea>
      </div>

        <div className="w-96 flex-shrink-0">
          <div className="flex flex-col h-full">
              <div className="p-4 border-y rounded-t-md bg-gray-50 dark:bg-gray-800/30">
                <h4 className="font-medium mb-3 text-sm">Risikozusammenfassung</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className={`p-2 rounded-md text-xs ${sections.filter((s) => s.risk === "high").length > 0 ? 'bg-red-100 dark:bg-red-900/50' : 'bg-muted'}`}>
                        <p className={`font-bold ${sections.filter((s) => s.risk === "high").length > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>{sections.filter((s) => s.risk === "high").length}</p>
                        <p className="text-muted-foreground">Hoch</p>
                    </div>
                    <div className={`p-2 rounded-md text-xs ${sections.filter((s) => s.risk === "medium").length > 0 ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-muted'}`}>
                        <p className={`font-bold ${sections.filter((s) => s.risk === "medium").length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>{sections.filter((s) => s.risk === "medium").length}</p>
                        <p className="text-muted-foreground">Mittel</p>
                    </div>
                    <div className={`p-2 rounded-md text-xs ${sections.filter((s) => s.risk === "low" && s.evaluation !== "Fehler").length > 0 ? 'bg-green-100 dark:bg-green-900/50' : 'bg-muted'}`}>
                        <p className={`font-bold ${sections.filter((s) => s.risk === "low" && s.evaluation !== "Fehler").length > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>{sections.filter((s) => s.risk === "low" && s.evaluation !== "Fehler").length}</p>
                        <p className="text-muted-foreground">Niedrig</p>
                    </div>
                    {sections.filter((s) => s.risk === "error").length > 0 && (
                        <div className="p-2 mt-2 rounded-md bg-destructive/10 text-center col-span-3 text-xs">
                            <p className="font-bold text-destructive">{sections.filter((s) => s.risk === "error").length} Analysefehler</p>
                        </div>
                    )}
                </div>
            </div>
            
              <ScrollArea className="flex-grow border rounded-b-md h-full">
                  <div className="p-4 space-y-3">
                      <h4 className="text-sm font-medium mb-4">Kritische Klauseln:</h4>
                    {sections
                        .filter((section) => section.needsRenegotiation || section.risk === "error")
                        .map((section) => (
                          <div
                            key={`risk-${section.id}`}
                              className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow mb-3
                            ${ 
                            section.risk === "error" ? "bg-destructive/10 border-destructive/30 hover:border-destructive/50"
                            : section.urgentAttention
                                ? "bg-red-100 border-red-300 hover:border-red-400 dark:bg-red-900/50 dark:border-red-700/50"
                                : "bg-amber-100 border-amber-300 hover:border-amber-400 dark:bg-amber-900/50 dark:border-amber-700/50"
                            }`}
                            onClick={() => {
                              setActiveSectionId(section.id);
                            }}
                            onDoubleClick={() => {
                              const targetElement = sectionRefs.current[section.id];
                              const scrollAreaElement = editorScrollAreaRef.current;

                              if (targetElement && scrollAreaElement) {
                                setActiveSectionId(section.id);

                                setTimeout(() => {
                                  try {
                                    const viewport = scrollAreaElement.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');

                                    if (viewport) {
                                        const elementTopRelativeToScrollParent = targetElement.offsetTop - viewport.offsetTop;
                                        const desiredScrollTop = elementTopRelativeToScrollParent - 16;

                                      viewport.scrollTo({
                                          top: Math.max(0, desiredScrollTop),
                                        behavior: 'smooth'
                                      });
                                      
                                      targetElement.classList.add('highlight-section');
                                      setTimeout(() => {
                                        targetElement.classList.remove('highlight-section');
                                      }, 1500); 
                                    } else {
                                      targetElement.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start' 
                                      });
                                      targetElement.classList.add('highlight-section');
                                      setTimeout(() => {
                                        targetElement.classList.remove('highlight-section');
                                      }, 1500); 
                                    }
                                  } catch (error) {
                                      console.error("Error during scrolling calculation or execution:", error);
                                  }
                                }, 50); 
                              }
                            }}
                          >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                {getRiskIcon(section.risk)}
                                <span className="font-medium text-sm break-words" title={section.title}>{section.title}</span>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                {section.risk !== "error" && (
                                    section.urgentAttention ? (
                                          <Badge variant="destructive" className="text-xs px-2 py-0.5 whitespace-nowrap">Dringend</Badge>
                                    ) : section.risk === "medium" ? (
                                          <Badge variant="outline" className="border-amber-300 bg-amber-200/50 text-amber-700 text-xs px-2 py-0.5 whitespace-nowrap">Verhandelbar</Badge>
                                    ) : null
                                )}
                               </div>
                            </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-3" title={section.content}>{section.content}</p>
                            {section.risk === "error" && section.reason && (
                                   <p className="text-xs text-destructive/80 mt-2">Grund: {section.reason}</p>
                            )}
                          </div>
                        ))}
                    {sections.filter((section) => section.needsRenegotiation || section.risk === "error").length === 0 && (
                        <div className="p-4 text-center text-muted-foreground">
                            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                            <p className="text-sm">Keine kritischen Klauseln gefunden.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}