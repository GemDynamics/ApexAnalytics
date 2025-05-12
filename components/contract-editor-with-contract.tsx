"use client"

import { useState, useEffect, useCallback, useRef, MutableRefObject } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ContractSection } from "@/components/contract-section"
import { 
    AlertTriangle, CheckCircle, Plus, Save, FileText as FileTextIcon, Undo, Redo, 
    Copy, Trash, AlertCircle, Loader2, ChevronUp, ChevronDown, X, Download, 
    File as FileIcon // Importiere File und FileText Icons
} from "lucide-react" 
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useContract } from "@/hooks/useConvex"
import { useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import ReactMarkdown from "react-markdown"
import { stripFileExtension } from "@/lib/utils"

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
  elementType: string;
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
  const [isClient, setIsClient] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingDocx, setIsExportingDocx] = useState(false)

  const { contract, isLoading } = useContract(contractId);
  const updateAnalysisMutation = useMutation(api.contractMutations.updateContractAnalysis);
  const optimizeClauseAction = useAction(api.contractActions.optimizeClauseWithAI);
  const generateAlternativesAction = useAction(api.contractActions.generateAlternativeFormulations);
  const updateFileNameMutation = useMutation(api.contractMutations.updateFileName);

  // useEffect Hook, um isClient nach dem Mounten zu setzen
  useEffect(() => {
    setIsClient(true);
  }, []);

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
    if (contract && !isLoading) {
      let initialSections: EditorSection[] = [];
      let sourceUsed = "";

      // Priorisiere structuredContractElements, falls vorhanden
      if (contract.structuredContractElements && contract.structuredContractElements.length > 0) {
        sourceUsed = "structuredContractElements";
        console.log(`Lade Daten aus ${sourceUsed}`);
        initialSections = contract.structuredContractElements
          .sort((a, b) => a.globalOriginalOrder - b.globalOriginalOrder) // Nach Reihenfolge sortieren
          .map((element, index) => {
            
            // Risiko ableiten
        let riskLevel: EditorSection["risk"] = "low";
            let needsRenegotiation = false;
            let urgentAttention = false;
            switch (element.evaluation?.toLowerCase()) {
          case "rot":
            riskLevel = "high";
                needsRenegotiation = true;
                urgentAttention = true;
            break;
          case "gelb":
            riskLevel = "medium";
                needsRenegotiation = true;
            break;
          case "grün":
            riskLevel = "low";
            break;
              case "info": // Behandlung für "Info" - wie "low" oder eigener Status?
                riskLevel = "low"; // Annahme: "Info" ist wie niedriges Risiko zu behandeln
                break;
          case "fehler":
            riskLevel = "error";
                needsRenegotiation = true; // Fehler erfordert Aufmerksamkeit
                urgentAttention = true; // Fehler ist dringend
                break;
              default: // Falls evaluation null/undefined oder unbekannt
                 if (element.reason || element.recommendation) {
                    // Wenn es Begründung/Empfehlung gibt, aber keine Wertung,
                    // behandeln wir es vorsichtshalber als mittleres Risiko
                    riskLevel = "medium";
                    needsRenegotiation = true;
                 } else {
                     riskLevel = "low";
                 }
            break;
        }


            // Titel-Extraktion aus Markdown
            let title = `Element ${element.globalOriginalOrder + 1}`;
            const markdownLines = element.markdownContent?.split('\\n') || [];
            const firstLine = markdownLines[0]?.trim() || "";

            if (firstLine.startsWith("# ")) {
              title = firstLine.substring(2).trim();
            } else if (firstLine.startsWith("## ")) {
              title = firstLine.substring(3).trim();
            } else if (firstLine.startsWith("### ")) {
              title = firstLine.substring(4).trim();
            } else if (element.elementType === "paragraph" || !element.markdownContent) {
              // Für Paragraphen oder leeren Content: Verwende Anfang des Textes
              const textSnippet = (element.markdownContent || "").substring(0, 50);
              title = `Absatz ${element.globalOriginalOrder + 1}: ${textSnippet}${element.markdownContent && element.markdownContent.length > 50 ? '...' : ''}`;
        } else {
                // Fallback: Erste Zeile als Titel (falls keine # gefunden)
                 title = firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
                 if (!title.trim()) { // Wenn erste Zeile leer ist, Fallback zum Element-Index
                    title = `Element ${element.globalOriginalOrder + 1}`;
                 }
        }

        return {
              id: element.elementId, // Eindeutige ID vom Backend
          title: title,
              content: element.markdownContent || "", // Der Markdown-Inhalt
          risk: riskLevel,
              evaluation: element.evaluation || "N/A",
              reason: element.reason || "",
              recommendation: element.recommendation || "",
              needsRenegotiation: needsRenegotiation,
              urgentAttention: urgentAttention,
              alternativeFormulations: [], // Wird später durch KI gefüllt
              chunkNumber: element.globalOriginalOrder, // Verwende globalOriginalOrder
              removed: false, // Standardmäßig nicht entfernt
              // Füge elementType hinzu, um es später verwenden zu können (z.B. für Styling)
              elementType: element.elementType,
            } as EditorSection; // Type assertion
          });
      }
      // Fallback auf editedAnalysis (vom Benutzer gespeicherte Änderungen)
      // ACHTUNG: editedAnalysis muss ggf. auch das elementType Feld enthalten oder wir müssen es hier raten
      else if (contract.editedAnalysis && contract.editedAnalysis.length > 0) {
        sourceUsed = "editedAnalysis";
        console.log(`Lade Daten aus ${sourceUsed} (Fallback)`);
        // Annahme: editedAnalysis hat bereits das EditorSection Format
        // Füge ggf. fehlendes elementType hinzu
        initialSections = contract.editedAnalysis.map((section: EditorSection) => ({
          ...section,
          elementType: section.elementType || 'unknown' // Füge Fallback für elementType hinzu
        }));
      }
      // Fallback auf analysisProtocol (alte Struktur), falls nichts anderes vorhanden
      else if (contract.analysisProtocol && contract.analysisProtocol.length > 0) {
        sourceUsed = "analysisProtocol";
        console.log(`Lade Daten aus ${sourceUsed} (Fallback - ALTE STRUKTUR)`);
        initialSections = contract.analysisProtocol.map((clause, index) => {
            // Bestehende Transformationslogik für analysisProtocol...
            let riskLevel: EditorSection["risk"] = "low";
            let needsRenegotiation = false;
            let urgentAttention = false;
            switch (clause.evaluation?.toLowerCase()) {
              case "rot": riskLevel = "high"; needsRenegotiation = true; urgentAttention = true; break;
              case "gelb": riskLevel = "medium"; needsRenegotiation = true; break;
              case "grün": riskLevel = "low"; break;
              case "fehler": riskLevel = "error"; needsRenegotiation = true; urgentAttention = true; break;
              default: // Fallback für null/undefined/unbekannt
                  if (clause.reason || clause.recommendation) {
                       riskLevel = "medium"; needsRenegotiation = true; 
                  } else {
                      riskLevel = "low";
                  }
                  break;
            }

            let title = `Klausel ${index + 1}`;
            // Titel-Extraktion (wie vorher, nur sicherstellen, dass clauseText existiert)
             const firstLine = (clause.clauseText || "").split('\\n')[0]?.trim();
             if (firstLine.startsWith("# ")) title = firstLine.substring(2).trim();
             else if (firstLine.startsWith("## ")) title = firstLine.substring(3).trim();
             else if (firstLine.startsWith("### ")) title = firstLine.substring(4).trim();
             else title = firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
             if (!title.trim()) title = `Klausel ${index + 1}`;


            return {
              id: `clause-${clause.chunkNumber || '0'}-${index}`, // ID-Generierung wie zuvor
              title: title,
              content: clause.clauseText || "", // Sicherstellen, dass content ein String ist
              risk: riskLevel,
              evaluation: clause.evaluation || "N/A",
              reason: clause.reason || "",
              recommendation: clause.recommendation || "",
              needsRenegotiation: needsRenegotiation,
              urgentAttention: urgentAttention,
          alternativeFormulations: [],
          chunkNumber: clause.chunkNumber,
              elementType: 'clauseH3', // Annahme: Altes Protokoll waren nur Klauseln
              removed: false,
        };
      });
      }
      // Wenn gar keine Daten vorhanden
      else {
        console.log("Keine Analysedaten (structured, edited, protocol) gefunden.");
        initialSections = [];
      }

      // Initialisiere die History nur, wenn sich die Datenquelle oder die Anzahl der Sektionen geändert hat
      // Oder wenn die History leer ist
      if (
        history.length === 1 && history[0].sections.length === 0 || // Wenn History leer ist
        JSON.stringify(history[historyIndex].sections) !== JSON.stringify(initialSections) // Wenn sich Daten geändert haben
      ) {
          console.log(`Initialisiere History mit Daten aus: ${sourceUsed || 'Nichts'}`);
          setHistory([{ sections: initialSections }]);
      setHistoryIndex(0);
          // Setze auch aktive/kollabierte/Details zurück
          setActiveSectionId(null);
          setCollapsedSections(new Set());
          setDetailsVisible(new Set());
      }
    
    } else if (!isLoading && !contract) {
      // Fall: Contract ID ungültig oder nicht gefunden
      console.log("Vertrag nicht gefunden oder Ladefehler.");
        setHistory([{ sections: [] }]);
        setHistoryIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, isLoading]);

  const addNewSection = () => {
    console.warn("addNewSection: Diese Funktion muss überarbeitet werden, um mit dynamischen Vertragsdaten zu arbeiten.")
    // TODO: Logik zum Hinzufügen einer neuen EditorSection zum History-State
    // Eine neue, leere Sektion mit einer eindeutigen temporären ID erstellen
    const newTempId = `new-section-${Date.now()}`;
    const newSection: EditorSection = {
      id: newTempId,
      title: "Neue Sektion",
      content: `### ${newTempId} Neue Sektion\n\nInhalt hier eingeben...`, // Start mit Markdown
      risk: "low",
      evaluation: "N/A",
      needsRenegotiation: false,
      urgentAttention: false,
      alternativeFormulations: [],
      removed: false,
      chunkNumber: (sections[sections.length - 1]?.chunkNumber ?? -1) + 1, // Fortlaufende Nummer
      elementType: 'clauseH3' // Standardmäßig als Klausel
    };

    const currentSections = history[historyIndex].sections;
    updateSectionsAndHistory([...currentSections, newSection]);
    // Optional: Zur neuen Sektion scrollen und sie aktivieren
    setTimeout(() => {
        setActiveSectionId(newTempId);
        // Scroll-Logik hier einfügen, falls gewünscht
    }, 100);
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
              risk: "low" as EditorSection["risk"], // Zurücksetzen auf niedriges Risiko nach Übernahme
              evaluation: "Grün (Alternative übernommen)", // Optional: Status anpassen
              needsRenegotiation: false,
              urgentAttention: false,
              // Optional: Alternativen entfernen, da eine gewählt wurde?
              // alternativeFormulations: [], 
            };
          }
        }
        return section;
      });
    updateSectionsAndHistory(newSections);
    toast.success("Alternative Formulierung übernommen.");
  }
  
  const handleSaveContract = async () => {
    if (!contract?._id) {
        toast.error("Fehler: Keine Vertrags-ID zum Speichern vorhanden.");
        return;
    }
    setIsSaving(true);
    try {
        console.log("Speichern der strukturierten Vertragsänderungen für contractId:", contract._id);
        
        // Hole die aktuellen Sektionen aus dem State
        const currentSectionsToSave = history[historyIndex].sections;

        // Bereinige die Sections für das Backend (optional, falls alternativeFormulations nicht persistiert werden sollen)
        const cleanedSections = currentSectionsToSave.map(section => {
            // Entferne alternativeFormulations, falls sie nicht im Backend gespeichert werden sollen
            // const { alternativeFormulations, ...cleanSection } = section;
            // return cleanSection;
            // Da das Schema es erlaubt, behalten wir sie bei:
             return section; 
        });
        
        // TODO: Stelle sicher, dass die Mutation 'updateContractAnalysis' im Backend
        // so angepasst wird, dass sie 'contract.structuredContractElements' 
        // mit den Daten aus 'updatedSections' (die dem EditorSection-Format entsprechen)
        // aktualisiert, anstatt 'contract.editedAnalysis' zu überschreiben.
        // Die Mutation muss das Mapping von EditorSection zurück zu StructuredElement durchführen.
        await updateAnalysisMutation({ 
            contractId: contract._id, 
            updatedSections: cleanedSections // Sendet das Array im EditorSection-Format
        });
        
        toast.success("Vertragsänderungen erfolgreich gespeichert! (Backend-Mutation muss ggf. angepasst werden)");
        
        // Optional: History zurücksetzen nach erfolgreichem Speichern?
        // setHistory([{ sections: cleanedSections }]);
        // setHistoryIndex(0);

    } catch (error) {
        console.error("Fehler beim Speichern der Vertragsänderungen:", error);
        // Bestehende Fehlerbehandlung beibehalten...
            toast.error("Fehler beim Speichern der Änderungen.", { 
                description: error instanceof Error ? error.message : "Unbekannter Fehler" 
            });
    } finally {
        setIsSaving(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

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
      id: `copied-${sectionToCopy.elementType}-${Date.now()}`, // Angepasste ID
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

  const handleRemoveClause = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const newSections = sections.map(s => 
      s.id === sectionId ? {...s, removed: true} : s
    );
    
    // Aktualisiere Sektionen und History
    updateSectionsAndHistory(newSections);
    // Mache keine Sektion aktiv oder schließe Details, falls offen
    if (activeSectionId === sectionId) setActiveSectionId(null);
    setDetailsVisible(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
    });

    toast.success(`Klausel "${section.title}" wurde als entfernt markiert.`);
  };

  const handleCustomFormulationSubmit = (sectionId: string, customContent: string) => {
    if (!customContent.trim()) {
      toast.info("Bitte geben Sie eine Formulierung ein.");
      return;
    }
    console.log(`Eigene Formulierung für Sektion ${sectionId} eingereicht:`, customContent);
    // Sektion aktualisieren
    const newSections = sections.map(s => 
        s.id === sectionId 
        ? {...s, 
            content: customContent, // Direkte Übernahme des Textes
            risk: 'low' as EditorSection["risk"], 
            evaluation: "Benutzerdefiniert", 
            needsRenegotiation: false, 
            urgentAttention: false
          } 
        : s);
    updateSectionsAndHistory(newSections);
    toast.success("Eigene Formulierung übernommen (Speichern nicht vergessen).");
  };

  const handleOptimizeWithAI = async (sectionId: string, textToOptimize?: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const isManualOptimization = typeof textToOptimize === 'string';
    const currentContent: string = section.content || ''; 
    const contentToUse: string = isManualOptimization ? (textToOptimize || '') : currentContent;
    const textForAction: string = contentToUse;

    if (!textForAction || textForAction.trim().length === 0) {
      toast.info("Kein Inhalt zum Verarbeiten durch KI vorhanden.");
      return;
    }
    
    setOptimizingSectionId(sectionId); 
    console.log(`KI-Aktion angefordert für Sektion ${sectionId}. Typ: ${isManualOptimization ? 'Optimize' : 'Generate Alternatives'}. Inhalt:`, textForAction);
    
    try {
        if (isManualOptimization) {
            // Fall 1: Optimize
            const optimizeResult = await optimizeClauseAction({ clauseText: textForAction }); 
            console.log("Received optimized text/result:", optimizeResult);

            // Prüfung, da der Linter 'any[]' meldet
            let optimizedText: string | null = null;
            if (typeof optimizeResult === 'string') {
                optimizedText = optimizeResult;
            } else if (Array.isArray(optimizeResult) && optimizeResult.length > 0 && typeof optimizeResult[0] === 'string') {
                console.warn("optimizeClauseAction hat ein Array zurückgegeben, erwartet wurde ein String. Verwende erstes Element.");
                optimizedText = optimizeResult[0];
            } else {
                 console.error("optimizeClauseAction hat ein unerwartetes Format zurückgegeben:", optimizeResult);
            }

            if (optimizedText !== null) {
                const textarea = document.getElementById(`custom-formulation-${sectionId}`) as HTMLTextAreaElement;
                if (textarea) {
                    textarea.value = optimizedText; // Jetzt sicher ein String oder null
                    toast.success("Text wurde optimiert. Klicke auf 'Übernehmen', um ihn zu speichern.");
                } else {
                    toast.error("Fehler: Konnte das Eingabefeld nicht finden.");
                }
            } else {
                toast.info("KI konnte diesen Text nicht optimieren oder gab ein unerwartetes Ergebnis zurück.");
            }
        } else {
            // Fall 2: Generate Alternatives
            const alternatives = await generateAlternativesAction({ clauseText: textForAction });
            console.log("Received alternative formulations:", alternatives);
            if (alternatives && Array.isArray(alternatives) && alternatives.length > 0) { // Zusätzliche Prüfung auf Array
                toast.success(`${alternatives.length} alternative Formulierungen generiert!`);
            const newSections = sections.map(s => {
                if (s.id === sectionId) {
                    return {
                        ...s,
                            alternativeFormulations: alternatives.map((altText, index) => ({ 
                                id: `ai-alt-${sectionId}-${index}-${Date.now()}`,
                                content: altText 
                            }))
                    };
                }
                return s;
            });
            updateSectionsAndHistory(newSections);
        } else {
                toast.info("KI konnte keine Alternativen für diesen Text generieren.");
                 const newSections = sections.map(s => s.id === sectionId ? { ...s, alternativeFormulations: [] } : s);
                 updateSectionsAndHistory(newSections);
        }
        }
    } catch (error) {
        console.error("Fehler bei der KI-Aktion:", error);
        toast.error("Fehler bei der KI-Aktion.", { description: error instanceof Error ? error.message : "Unbekannter Fehler" });
    } finally {
        setOptimizingSectionId(null); 
    }
  };

  const setSectionRef = (sectionId: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[sectionId] = el;
  };

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

  const toggleDetailsVisibility = (sectionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    console.log(`Toggling details for section ${sectionId}. Currently visible: ${detailsVisible.has(sectionId)}`);
    
    if (activeSectionId !== sectionId) {
      setActiveSectionId(sectionId);
    }
    
    setDetailsVisible(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
         // Optional: Generiere Alternativen nur beim ersten Öffnen der Details
        const section = sections.find(s => s.id === sectionId);
        if (section && 
            (section.risk === "medium" || section.risk === "high") &&
            (!section.alternativeFormulations || section.alternativeFormulations.length === 0) &&
             optimizingSectionId !== sectionId) {
            console.log(`Triggering AI alternatives on detail open for section ${sectionId}`);
            handleOptimizeWithAI(sectionId); 
        }
      }
      return newSet;
    });
  };

  const isDetailsVisible = useCallback((sectionId: string) => {
    return activeSectionId === sectionId && detailsVisible.has(sectionId);
  }, [activeSectionId, detailsVisible]);

  // Hilfsfunktion zum Herunterladen von Blobs
  const downloadBlob = (blob: Blob, fileName: string) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href); // Speicher freigeben
  };

  const handleExportDocx = async () => {
    if (!contract) {
        toast.error("Fehler: Vertragsdaten nicht verfügbar.");
      return;
    }
    setIsExportingDocx(true);
    toast.info("DOCX-Export wird vorbereitet...", { description: "Bitte haben Sie einen Moment Geduld." });

    try {
        // 1. Markdown-Inhalt holen (nur nicht entfernte Sektionen)
        const currentSections = history[historyIndex].sections;
        const contractMarkdownContent = currentSections
        .filter(section => !section.removed)
        .map(section => section.content)
        .join('\n\n');

        const originalFileName = contract.fileName || "Unbenannter Vertrag";

        // 2. API-Aufruf
        const response = await fetch('/api/export/docx', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                markdownContent: contractMarkdownContent,
                fileName: originalFileName 
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Fehlerdetails versuchen zu lesen
            throw new Error(`Serverfehler: ${response.status} ${response.statusText}. ${errorData?.details || ''}`);
        }

        // 3. Blob erhalten und herunterladen
        const blob = await response.blob();
        const exportFileName = stripFileExtension(originalFileName) + ".docx";
        downloadBlob(blob, exportFileName);

        toast.success("DOCX erfolgreich exportiert.", { description: exportFileName });

    } catch (error) {
        console.error("DOCX Export fehlgeschlagen:", error);
        toast.error("DOCX-Export fehlgeschlagen.", { description: error instanceof Error ? error.message : "Unbekannter Fehler" });
    } finally {
        setIsExportingDocx(false);
    }
  };

  const handleExportPdf = async () => {
    if (!contract) {
        toast.error("Fehler: Vertragsdaten nicht verfügbar.");
        return;
    }
    setIsExportingPdf(true);
    toast.info("PDF-Export wird vorbereitet...", { description: "Bitte haben Sie einen Moment Geduld." });

    try {
        // 1. Markdown-Inhalt holen (nur nicht entfernte Sektionen)
        const currentSections = history[historyIndex].sections;
        const contractMarkdownContent = currentSections
            .filter(section => !section.removed)
            .map(section => section.content)
            .join('\n\n');

        const originalFileName = contract.fileName || "Unbenannter Vertrag";

        // 2. API-Aufruf
        const response = await fetch('/api/export/pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                markdownContent: contractMarkdownContent,
                fileName: originalFileName 
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Fehlerdetails versuchen zu lesen
            throw new Error(`Serverfehler: ${response.status} ${response.statusText}. ${errorData?.details || ''}`);
        }

        // 3. Blob erhalten und herunterladen
        const blob = await response.blob();
        const exportFileName = stripFileExtension(originalFileName) + ".pdf";
        downloadBlob(blob, exportFileName);

        toast.success("PDF erfolgreich exportiert.", { description: exportFileName });

    } catch (error) {
        console.error("PDF Export fehlgeschlagen:", error);
        toast.error("PDF-Export fehlgeschlagen.", { description: error instanceof Error ? error.message : "Unbekannter Fehler" });
    } finally {
        setIsExportingPdf(false);
    }
  };

  const handleStartEditFileName = () => {
    if (contract) {
      setEditedFileName(contract.fileName || "");
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

  if (!contract || (history.length === 1 && history[0].sections.length === 0 && !isLoading) ) {
     // Zeige "Keine Daten" nur an, wenn nicht mehr geladen wird und wirklich keine Sektionen da sind
    return (
        <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Keine analysierten Daten</h3>
            <p className="text-muted-foreground max-w-md">
                Für diesen Vertrag wurden keine analysierten Klauseln gefunden oder die Analyse läuft noch bzw. ist fehlgeschlagen. Bitte überprüfen Sie den Status oder laden Sie den Vertrag neu hoch.
            </p>
            {contract && (
                <div className="text-sm text-muted-foreground mt-2">Status: <Badge variant={contract.status === 'failed' ? 'destructive' : 'secondary'}>{contract.status}</Badge></div>
            )}
            {!contract && !isLoading && (
                 <p className="text-sm text-destructive mt-2">Vertrag mit ID {contractId} konnte nicht geladen werden.</p>
            )}
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between py-2 px-4 border-b">
          <div className="flex items-center gap-2 flex-shrink min-w-0">
            <FileTextIcon className="h-5 w-5 text-primary flex-shrink-0" />
            {isEditingFileName ? (
              <div className="flex items-center gap-2 flex-grow min-w-0">
                <Input
                  ref={fileNameInputRef}
                  value={editedFileName}
                  onChange={(e) => setEditedFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveFileName();
                    else if (e.key === 'Escape') handleCancelEditFileName();
                  }}
                  className="h-8 w-full max-w-md"
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
                className="font-medium cursor-pointer hover:underline truncate"
                onDoubleClick={handleStartEditFileName}
                title={contract?.fileName || 'Vertrag laden...'}
              >
                {contract?.fileName || 'Vertrag laden...'}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="icon" title="Rückgängig" onClick={handleUndo} disabled={historyIndex === 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Wiederholen" onClick={handleRedo} disabled={historyIndex === history.length - 1}>
              <Redo className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" title="Kopieren" onClick={handleCopySection} disabled={!activeSectionId}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Als entfernt markieren" onClick={() => activeSectionId && handleRemoveClause(activeSectionId)} disabled={!activeSectionId}>
              <Trash className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="outline" size="sm" className="gap-1" onClick={handleSaveContract} disabled={isSaving || (history.length === 1 && historyIndex === 0)}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isSaving ? "Speichern..." : "Speichern"}</span>
            </Button>
            {/* Separate Export-Buttons */}
            {isClient && (
              <>
                <Button variant="outline" size="sm" className="gap-1 ml-2" onClick={handleExportPdf} disabled={isExportingPdf || isExportingDocx}> 
                    {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileIcon className="h-4 w-4" />}
                    <span>{isExportingPdf ? "PDF..." : "Als PDF"}</span>
                </Button>
                <Button variant="outline" size="sm" className="gap-1 ml-1" onClick={handleExportDocx} disabled={isExportingDocx || isExportingPdf}> 
                    {isExportingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileTextIcon className="h-4 w-4" />} 
                    <span>{isExportingDocx ? "DOCX..." : "Als DOCX"}</span>
                </Button>
              </>
            )}
          </div>
        </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 order-2 md:order-1 min-w-0">
            <h4 className="text-sm font-medium mb-3 px-1">Vertragsinhalt</h4>
          <ScrollArea className="flex-1 border rounded-md">
             <div ref={editorScrollAreaRef} className="h-full">
                <div className="p-4 space-y-4">
                {(sections.filter(s => !s.removed) || []).map((section) => (
              <div key={section.id} ref={setSectionRef(section.id)} className="section-container">
                <ContractSection
                  section={section}
                  isActive={activeSectionId === section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  onUpdate={(updatedContent) => {
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

                    {isDetailsVisible(section.id) && (
                    <Card className="mt-2 border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in-50 slide-in-from-top-2 duration-300">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                        {section.risk === "medium" && (
                            <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                            Verhandelbar
                          </Badge>
                        )}
                        {section.risk === "high" && (
                            <Badge variant="destructive">
                            Dringender Handlungsbedarf
                          </Badge>
                        )}
                              <h3 className="text-base font-semibold">Details & Alternativen</h3>
                      </div>
                            <Button variant="ghost" size="icon" onClick={(e) => toggleDetailsVisibility(section.id, e)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </Button>
                      </div>

                      {(section.reason || section.recommendation) && (
                        <div className="space-y-3 mb-4 border-b pb-4 dark:border-gray-700">
                          {section.reason && (
                            <div className="p-3 border rounded-md bg-muted/50">
                                <h4 className="text-sm font-medium mb-1">Begründung ({section.evaluation}):</h4>
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

                        {(section.risk === "high" || section.risk === "medium") ? (
                        <>
                      <p className="text-sm text-muted-foreground mb-4">
                            Diese Klausel wurde als risikobehaftet eingestuft. Wählen Sie eine alternative Formulierung, bearbeiten Sie sie manuell oder markieren Sie sie als entfernt.
                        </p>

                        {optimizingSectionId === section.id && (!section.alternativeFormulations || section.alternativeFormulations.length === 0) && (
                            <div className="flex items-center justify-center p-4 border rounded-md bg-muted/30 text-sm text-muted-foreground mb-6">
                                <Loader2 className="h-4 w-4 animate-spin mr-2"/>
                                Generiere Alternativen...
                            </div>
                        )}
                        {optimizingSectionId !== section.id && section.alternativeFormulations && section.alternativeFormulations.length > 0 && (
                        <div className="space-y-3 mb-6">
                          {section.alternativeFormulations.map((alt) => (
                            <div
                              key={alt.id}
                              className="p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 bg-white dark:bg-gray-900/30 transition-colors group"
                            >
                                 <div className="prose prose-sm dark:prose-invert max-w-none mb-2">
                                     <ReactMarkdown>{alt.content}</ReactMarkdown>
                                 </div>
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
                            {optimizingSectionId !== section.id && (!section.alternativeFormulations || section.alternativeFormulations.length === 0) && (
                        <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800/50 text-sm text-muted-foreground mb-6">
                            Für diese Klausel wurden von der KI keine Alternativen vorgeschlagen oder sie konnten nicht generiert werden. Sie können unten eine eigene Formulierung eingeben.
                        </div>
                      )}
                            </>
                        ) : null}
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
                </div>
          </div>
        </ScrollArea>
      </div>

        <div className="w-full md:w-[25rem] flex-shrink-0 order-1 md:order-2">
          <div className="flex flex-col h-full">
              <div className="p-4 border rounded-t-md bg-gray-50 dark:bg-gray-800/30">
                <h4 className="font-medium mb-3 text-sm">Risikozusammenfassung</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className={`p-2 rounded-md text-xs ${sections.filter((s) => !s.removed && s.risk === "high").length > 0 ? 'bg-red-100 dark:bg-red-900/50' : 'bg-muted'}`}>
                        <p className={`font-bold ${sections.filter((s) => !s.removed && s.risk === "high").length > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>{sections.filter((s) => !s.removed && s.risk === "high").length}</p>
                        <p className="text-xs text-muted-foreground">Hoch</p>
                    </div>
                    <div className={`p-2 rounded-md text-xs ${sections.filter((s) => !s.removed && s.risk === "medium").length > 0 ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-muted'}`}>
                        <p className={`font-bold ${sections.filter((s) => !s.removed && s.risk === "medium").length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>{sections.filter((s) => !s.removed && s.risk === "medium").length}</p>
                        <p className="text-xs text-muted-foreground">Mittel</p>
                    </div>
                    <div className={`p-2 rounded-md text-xs ${sections.filter((s) => !s.removed && s.risk === "low" && s.evaluation !== "Fehler").length > 0 ? 'bg-green-100 dark:bg-green-900/50' : 'bg-muted'}`}>
                        <p className={`font-bold ${sections.filter((s) => !s.removed && s.risk === "low" && s.evaluation !== "Fehler").length > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>{sections.filter((s) => !s.removed && s.risk === "low" && s.evaluation !== "Fehler").length}</p>
                        <p className="text-xs text-muted-foreground">Niedrig</p>
                    </div>
                    {sections.filter((s) => !s.removed && s.risk === "error").length > 0 && (
                        <div className="p-2 mt-2 rounded-md bg-destructive/10 text-center col-span-3 text-xs">
                            <p className="font-bold text-destructive">{sections.filter((s) => !s.removed && s.risk === "error").length} Analysefehler</p>
                        </div>
                    )}
                </div>
            </div>
            
             <ScrollArea className="flex-grow border rounded-b-md border-t-0">
                  <div className="p-4 space-y-3">
                      <h4 className="text-sm font-medium mb-2">Handlungsbedarf:</h4>
                    {sections
                        .filter((section) => !section.removed && (section.needsRenegotiation || section.risk === "error"))
                        .sort((a, b) => {
                            const riskOrder = { error: 0, high: 1, medium: 2, low: 3 };
                            return (riskOrder[a.risk] ?? 99) - (riskOrder[b.risk] ?? 99);
                         })
                        .map((section) => (
                          <div
                            key={`risk-${section.id}`}
                              className={`py-2 px-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow 
                            ${ 
                            section.risk === "error" ? "bg-destructive/10 border-destructive/30 hover:border-destructive/50"
                            : section.urgentAttention
                                ? "bg-red-100 border-red-300 hover:border-red-400 dark:bg-red-900/50 dark:border-red-700/50"
                                : "bg-amber-100 border-amber-300 hover:border-amber-400 dark:bg-amber-900/50 dark:border-amber-700/50"
                            }`}
                            onClick={() => {
                              setActiveSectionId(section.id);
                              const targetElement = sectionRefs.current[section.id];
                              const scrollAreaElement = editorScrollAreaRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
                              if (targetElement && scrollAreaElement) {
                                   const elementTopRelativeToScrollParent = targetElement.offsetTop - scrollAreaElement.offsetTop;
                                        const desiredScrollTop = elementTopRelativeToScrollParent - 16;
                                    scrollAreaElement.scrollTo({ top: Math.max(0, desiredScrollTop), behavior: 'smooth' });
                                      targetElement.classList.add('highlight-section');
                                    setTimeout(() => targetElement.classList.remove('highlight-section'), 1500); 
                               }
                            }}
                          >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                {getRiskIcon(section.risk)}
                                <span className="font-medium text-sm break-words truncate" title={section.title}>{section.title}</span>
                              </div>
                              <div className="flex-shrink-0 ml-1">
                                {section.risk !== "error" && (
                                    section.urgentAttention ? (
                                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5 whitespace-nowrap">Dringend</Badge>
                                    ) : section.risk === "medium" ? (
                                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 whitespace-nowrap border-amber-300 bg-amber-200/50 text-amber-700">Verhandelbar</Badge>
                                    ) : null
                                )}
                               </div>
                            </div>
                            {section.risk === "error" && section.reason && (
                                   <p className="text-xs text-destructive/80 mt-1">Grund: {section.reason}</p>
                            )}
                          </div>
                        ))}
                    {sections.filter((section) => !section.removed && (section.needsRenegotiation || section.risk === "error")).length === 0 && (
                        <div className="p-4 text-center text-muted-foreground">
                            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                            <p className="text-sm">Keine Klauseln mit dringendem Handlungsbedarf.</p>
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