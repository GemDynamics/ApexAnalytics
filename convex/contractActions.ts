/// <reference path="../types/gemini-api.d.ts" />

"use node";

import { action, internalAction, internalMutation, internalQuery, mutation, query, QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import { PDFDocument } from 'pdf-lib';
import extract from 'pdf-text-extract';
import mammoth from 'mammoth';
import { Id, Doc } from "./_generated/dataModel";
import { promisify } from 'util';
import { RULES_FOR_ANALYSIS, LEGAL_BASIS_EXTRACT } from './ai_knowledge_base'; // Importiere die Konstanten
// Importiere die System-Prompts aus gemini.ts
import { SYSTEM_PROMPT_AGENT1_CHUNK, SYSTEM_PROMPT_AGENT2_STRUCTURE } from './gemini';

// Umwandlung des callback-basierten pdf-text-extract in eine Promise-basierte Version
// pdf-text-extract benötigt einen Dateipfad, daher können wir es nicht direkt mit Buffer verwenden
// Wir müssen eine temporäre Datei speichern oder eine andere Bibliothek verwenden
// Für dieses Beispiel entfernen wir die PDF-Extraktion, die fs/path benötigt
// const extractTextFromPDF = promisify(extract);

const CHUNK_SIZE_WORDS = 1500;
const PRE_CHUNK_SIZE_WORDS = 2500;

async function getBuffer(file: Blob | ArrayBuffer): Promise<Buffer> {
    if (file instanceof ArrayBuffer) {
        return Buffer.from(file);
    }
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// Aktualisierte Funktion für absatzbasiertes Pre-Chunking
function splitTextIntoPreChunks(text: string, chunkSizeInWords: number): string[] {
  // 1. Teile den Text in Absätze (Blöcke, die durch doppelte Zeilenumbrüche getrennt sind)
  //    Normalisiere Zeilenumbrüche zu \n und splitte dann
  const paragraphs = text.replace(/\r\n/g, '\n').split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunkLines: string[] = [];
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (trimmedParagraph.length === 0) continue; // Leere Absätze überspringen

    const paragraphWordCount = trimmedParagraph.split(/\s+/).filter(Boolean).length;

    // Wenn der aktuelle Absatz allein schon die Chunk-Größe überschreitet ODER
    // wenn das Hinzufügen dieses Absatzes zum aktuellen Chunk die Größe sprengen würde UND der aktuelle Chunk nicht leer ist
    if ((paragraphWordCount > chunkSizeInWords && currentChunkLines.length > 0) || 
        (currentWordCount + paragraphWordCount > chunkSizeInWords && currentWordCount > 0)) {
      // Finalisiere den aktuellen Chunk
      chunks.push(currentChunkLines.join("\n\n")); // Absätze wieder mit Doppelumbruch verbinden
      currentChunkLines = [];
      currentWordCount = 0;
    }

    // Füge den aktuellen Absatz zum (neuen oder bestehenden) Chunk hinzu
    currentChunkLines.push(trimmedParagraph);
    currentWordCount += paragraphWordCount;

    // Sonderfall: Wenn ein einzelner Absatz bereits die Chunk-Größe überschreitet, wird er zu einem eigenen Chunk
    if (paragraphWordCount >= chunkSizeInWords && currentChunkLines.length === 1) {
        chunks.push(currentChunkLines.join("\n\n"));
        currentChunkLines = [];
        currentWordCount = 0;
    }
  }

  // Füge den letzten verbleibenden Chunk hinzu, falls vorhanden
  if (currentChunkLines.length > 0) {
    chunks.push(currentChunkLines.join("\n\n"));
  }

  return chunks;
}

// Typ für die Rückgabe von runStage1Chunking (basierend auf dem Schema)
type LargeChunk = {
    chunkNumber: number;
    identifiedSections: string[];
    chunkContent: string;
};

// Typ für die Rückgabe von startFullContractAnalysis
type StartAnalysisResult = { message: string };

export const startFullContractAnalysis = action({
  args: { 
    storageId: v.id("_storage"),
    contractId: v.id("contracts") 
  },
  handler: async (ctx, args): Promise<StartAnalysisResult> => {
    console.log(`Starting STAGE 1: Full contract analysis for contractId: ${args.contractId}`);

    // 1. Status initial setzen
    await ctx.runMutation(internal.contractMutations.updateContractStatus, {
      contractId: args.contractId,
      status: "preprocessing_structure", 
    });

    // 2. Datei laden und Text extrahieren
    const fileBlob = await ctx.storage.get(args.storageId);
    if (!fileBlob) {
        // ... Fehlerbehandlung ...
        throw new ConvexError("File not found in storage.");
    }
    const fileBuffer = await getBuffer(fileBlob);

    let extractedText = "";
    // Contract holen für Dateiname/Typ
    const contractDocument: Doc<"contracts"> | null = await ctx.runQuery(api.contractQueries.getContractById, { contractId: args.contractId });
    if (!contractDocument) {
        // ... Fehlerbehandlung ...
        throw new ConvexError("Contract document not found in DB for text extraction.");
    }
    const fileName = contractDocument.fileName ? contractDocument.fileName.toLowerCase() : "undefined_filename";
    const fileType = fileName.endsWith(".docx") ? "docx" :
                     fileName.endsWith(".pdf") ? "pdf" :
                     fileName.endsWith(".txt") ? "txt" : undefined;
    
    console.log(`Attempting text extraction for: ${fileName}`);
    try {
        if (fileType === "pdf") {
            console.warn("PDF extraction using pdf-text-extract is currently disabled.");
            try {
                const pdfDoc = await PDFDocument.load(fileBuffer);
                extractedText = `PDF konnte nicht extrahiert werden (fs-Zugriff erforderlich). Das Dokument hat ${pdfDoc.getPageCount()} Seiten. Bitte manuell extrahieren und als TXT hochladen.`;
            } catch (pdfLibError: any) {
                extractedText = "Fehler beim Laden der PDF-Datei.";
            }
        } else if (fileType === "docx") {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
        } else if (fileType === "txt") { 
            extractedText = fileBuffer.toString('utf-8');
        } else {
            await ctx.runMutation(internal.contractMutations.updateContractStatus, {
                contractId: args.contractId, status: "failed", errorDetails: `Unsupported file type: ${fileName}`
            });
            throw new ConvexError(`Unsupported file type: ${fileName}.`);
        }
    } catch (error: any) {
        console.error(`Error during text extraction for ${fileName}:`, error);
        await ctx.runMutation(internal.contractMutations.updateContractStatus, {
            contractId: args.contractId, status: "failed", errorDetails: `Text extraction failed: ${error.message || 'Unknown error'}`
        });
        throw new ConvexError(`Failed to extract text from ${fileName}: ${error.message || 'Unknown error'}`);
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "failed",
        errorDetails: `Extracted text from ${fileName} is empty.`
      });
      throw new ConvexError(`Extracted text from ${fileName} is empty.`);
    }
    console.log(`Text extracted (length: ${extractedText.length}) from ${fileName}`);

    // ---- STUFE 1: GROB-CHUNKING ----
    await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "stage1_chunking_inprogress",
        currentProcessingStepDetail: "Starting Stage 1: Global Chunking"
    });

    try {
        // Expliziter Typ für das Ergebnis von runStage1Chunking
        // Korrekter Aufruf der spezifischen Action für Stufe 1
        const largeChunks: LargeChunk[] | null = await ctx.runAction(internal.gemini.runStage1Chunking, { 
            contractText: extractedText 
        });

        // Überprüfen, ob largeChunks ein Array ist und nicht leer
        if (!Array.isArray(largeChunks) || largeChunks.length === 0) {
            console.error("Stage 1 (runStage1Chunking) returned no chunks or invalid format.", largeChunks);
            await ctx.runMutation(internal.contractMutations.updateContractStatus, {
                contractId: args.contractId,
                status: "stage1_chunking_failed",
                errorDetails: "Stage 1: AI did not return valid large chunks."
            });
            throw new ConvexError("Stage 1: AI did not return valid large chunks.");
        }

        console.log(`Stage 1 completed successfully. Received ${largeChunks.length} large chunks.`);
        // 4. Erfolgreiche Chunks speichern und Stufe 2 triggern (über Mutation)
        await ctx.runMutation(internal.contractMutations.saveLargeChunks, { 
            contractId: args.contractId,
            largeChunks: largeChunks // largeChunks ist jetzt korrekt typisiert
        });
        
        console.log(`Next step: saveLargeChunks mutation will trigger Stage 2 structuring for contractId: ${args.contractId}`);
        return { message: `Stage 1 (Chunking) completed for ${largeChunks.length} chunks. Stage 2 will be triggered.` };

    } catch (error: any) {
        console.error(`Error during Stage 1 (runStage1Chunking) for contract ${args.contractId}:`, error);
        await ctx.runMutation(internal.contractMutations.updateContractStatus, {
            contractId: args.contractId,
            status: "stage1_chunking_failed",
            errorDetails: `Stage 1 failed: ${error.message || 'Unknown error'}`,
            currentProcessingStepDetail: "Stage 1: Global Chunking FAILED"
        });
        throw new ConvexError(`Stage 1 (Chunking) failed: ${error.message || 'Unknown error'}`);
    }
  },
});

// Globale Typdefinitionen, falls noch nicht vorhanden oder spezifischer benötigt
// (Diese sollten idealerweise in einer zentralen `types.d.ts` oder ähnlich liegen)
type StructuredElement = {
  elementType: "titleH1" | "sectionH2" | "clauseH3" | "paragraph";
  elementId: string;
  markdownContent: string;
  originalOrderInChunk: number; // Reihenfolge innerhalb des *Antwort-JSONs des KI-Agenten für einen Vor-Chunk*
  globalOriginalOrder: number; // Globale Reihenfolge über alle Elemente des Vertrags - NICHT MEHR OPTIONAL
};

export const structureContractIncrementallyAndCreateJsonElements = internalAction({
  args: {
    contractId: v.id("contracts"),
    preChunks: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(`Structuring ${args.preChunks.length} pre-chunks for contract ${args.contractId}.`);
    
    await ctx.runMutation(internal.contractMutations.updateContractStatus, {
      contractId: args.contractId,
      status: "structure_generation_inprogress", 
      totalElementsToAnalyze: args.preChunks.length, // Annahme: totalElementsToAnalyze ist das korrekte Feld
    });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables.");
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "failed",
        errorDetails: "GEMINI_API_KEY missing"
      });
      throw new ConvexError("GEMINI_API_KEY is not configured.");
    }

    let finalFullMarkdownText = "";
    let finalStructuredElementsList: StructuredElement[] = [];
    let globalElementCounter = 0;

    // System-Prompt für KI-Agent 1 (Strukturierungs-Agent) aus dem Gesamtplan
    // Wichtig: Im Gesamtplan ist der Prompt detaillierter, hier nur der Kern
    const systemPromptAgent1 = `Du bist ein KI-Assistent, spezialisiert auf die Analyse und Strukturierung von deutschsprachigen Bauverträgen. Deine Aufgabe ist es, den folgenden TEXTABSCHNITT eines Vertrags in ein **standardisiertes, gut strukturiertes Markdown-Format** zu überführen und die darin enthaltenen Strukturelemente präzise als eine Liste von JSON-Objekten zu identifizieren. Ziel ist eine **einheitliche Struktur** über alle Verträge hinweg.\n\nANWEISUNGEN ZUR STRUKTURIERUNG UND MARKDOWN-FORMATIERUNG INNERHALB DIESES TEXTABSCHNITTS:\n\n1.  **VERTRAGSTITEL (Nur relevant, wenn dieser Textabschnitt der absoluten Anfang des gesamten Dokuments darstellt):** Formatiere als H1: \`# Titeltext\`.\n2.  **HAUPTABSCHNITTE/PARAGRAPHEN:** Formatiere **einheitlich** als H2 mit Paragraphenzeichen und Nummerierung (falls vorhanden, sonst generiere fortlaufend): \`## § N Abschnittstitel\`. Beispiel: \`## § 1 Vertragsgrundlagen\`.\n3.  **UNTERPUNKTE/KLAUSELN:** Formatiere **einheitlich** als H3 mit Paragraphenzeichen und Nummerierung (z.B. \`§ N.M\`), gefolgt vom Klauseltext. Beispiel: \`### § 1.1 Geltung der VOB/B\\nDer Text der Klausel...\`. Auch materielle Listenpunkte sind als Klauseln (H3) zu formatieren.\n4.  **REINER TEXT/ABSCHNITTE OHNE EXPLIZITE STRUKTUR:** Formatiere als einfacher Markdown-Absatz.\n\nANWEISUNGEN ZUR JSON-AUSGABE FÜR DIESEN TEXTABSCHNITT:\n\nGib für JEDES identifizierte Strukturelement ein JSON-Objekt zurück. Alle JSON-Objekte dieses Textabschnitts müssen in einem JSON-Array zusammengefasst werden. Jedes JSON-Objekt MUSS folgende Felder haben:\n\n*   \`elementType\` (string): Gültige Werte: \"titleH1\", \"sectionH2\", \"clauseH3\", \"paragraph\".\n*   \`markdownContent\` (string): Der vollständige Inhalt im standardisierten Markdown-Format.\n*   \`originalOrderInChunk\` (number): Fortlaufende Nummer (beginnend bei 0) für die Reihenfolge der Elemente innerhalb dieses Textabschnitts.\n\nWICHTIG: Erhalte die exakte Reihenfolge der Inhalte. Zerlege den Textabschnitt vollständig. Stelle sicher, dass der Output ein valides JSON-Array ist. Beginne direkt mit [ und ende mit ].\n\nBeispiel für die JSON-Ausgabe (Array von Objekten):\n\`\`\`json\n[\n  {\n    \"elementType\": \"sectionH2\",\n    \"markdownContent\": \"## § 1 Vertragsgrundlagen\\n\\nGrundlage dieses Vertrages sind...\",\n    \"originalOrderInChunk\": 0\n  },\n  {\n    \"elementType\": \"clauseH3\",\n    \"markdownContent\": \"### § 1.1 Geltung der VOB/B\\nEs gilt die VOB/B...\",\n    \"originalOrderInChunk\": 1\n  },\n  {\n    \"elementType\": \"paragraph\",\n    \"markdownContent\": \"Dieser Text steht zwischen zwei Klauseln...\",\n    \"originalOrderInChunk\": 2\n  }\n]\n\`\`\`\n`;

    // Typ für Elemente direkt aus der KI-Antwort (ohne elementId und globalOriginalOrder)
    type RawStructuredElementFromAI = {
        elementType: string; // Hier noch allgemeiner string
        markdownContent: string;
        originalOrderInChunk: number;
    };

    for (let i = 0; i < args.preChunks.length; i++) {
      const preChunkText = args.preChunks[i];
      const chunkIndex = i; // Für elementId
      const chunkNumberForLog = i + 1;
      console.log(`Processing pre-chunk ${chunkNumberForLog}/${args.preChunks.length} for contract ${args.contractId}`);

      const userPromptForAgent1 = `--- TEXTABSCHNITT (AUS VOR-CHUNK ${chunkNumberForLog}) ---\n${preChunkText}\n--- ENDE TEXTABSCHNITT ---`;

      let rawElementsFromAI: RawStructuredElementFromAI[] = [];

      try {
        // --- START Echter Gemini API Call ---
        console.log("Calling Gemini for chunk structuring:", chunkIndex);
        const structuredJsonResponse = await ctx.runAction(internal.gemini.generateStructuredJson, {
          textInput: preChunkText, // Korrigiert von userPrompt zu textInput
          systemPrompt: systemPromptAgent1,
          modelName: "gemini-2.5-flash-preview-04-17" // Geändertes Modell
        });

        // Überprüfen, ob die Antwort ein Array ist (wie vom Prompt gefordert)
        if (Array.isArray(structuredJsonResponse)) {
          // Typ-Validierung für jedes Element (einfache Prüfung)
          rawElementsFromAI = structuredJsonResponse.filter(
            (item: any): item is RawStructuredElementFromAI => {
              // Explizite Prüfung der Felder und Typen
              return item != null && 
                     typeof item.elementType === 'string' &&
                     typeof item.markdownContent === 'string' &&
                     typeof item.originalOrderInChunk === 'number';
            }
          );
          console.log(`Received ${rawElementsFromAI.length} valid structured elements from Gemini for pre-chunk ${chunkNumberForLog}.`);
          if (rawElementsFromAI.length !== structuredJsonResponse.length) {
            console.warn(`Gemini response for pre-chunk ${chunkNumberForLog} contained some invalid elements.`);
          }
        } else {
          console.error(`Gemini response for pre-chunk ${chunkNumberForLog} was not a JSON array as expected. Response:`, structuredJsonResponse);
          // Hier optional Fehler werfen oder mit leerem Array weitermachen
          // rawElementsFromAI bleibt leer
        }
        // --- END Echter Gemini API Call ---

        if (rawElementsFromAI.length === 0) {
          console.warn(`Keine validen Strukturelemente aus Vor-Chunk ${chunkNumberForLog} extrahiert oder Fehler bei der Extraktion.`);
        }

      } catch (error: any) {
        console.error(`Error calling or processing Gemini response for pre-chunk ${chunkNumberForLog}:`, error);
        await ctx.runMutation(internal.contractMutations.updateContractStatus, {
          contractId: args.contractId,
          status: "failed",
          errorDetails: `Fehler bei der Strukturanalyse von Vor-Chunk ${chunkNumberForLog}: ${error.message || 'Unbekannter API Fehler'}`
        });
        // Im Fehlerfall mit nächstem Chunk weitermachen, aber Fehler ist im Status vermerkt
        continue; // Überspringe den Rest der Schleife für diesen fehlerhaften Chunk
      }
      
      // Füge die Elemente zur Gesamtliste hinzu, generiere elementId und setze globalOriginalOrder
      rawElementsFromAI.forEach((rawElement, elemIndexInChunk) => {
        // Generiere die programmatische elementId
        let typePrefix = 'unk';
        switch (rawElement.elementType) {
          case "titleH1": typePrefix = 'h1'; break;
          case "sectionH2": typePrefix = 'sH2'; break;
          case "clauseH3": typePrefix = 'cH3'; break;
          case "paragraph": typePrefix = 'p'; break;
          default: 
            console.warn(`Unknown elementType found: ${rawElement.elementType} in chunk ${chunkNumberForLog}`);
            typePrefix = 'unk'; // Oder spezifischer Fehler-Präfix
        }
        const elementId = `${typePrefix}_c${chunkIndex}_e${elemIndexInChunk}`;
        
        // Validiere elementType gegen den erlaubten Typ StructuredElement
        const validElementType = ["titleH1", "sectionH2", "clauseH3", "paragraph"].includes(rawElement.elementType) 
                                ? rawElement.elementType as StructuredElement['elementType'] 
                                : "paragraph"; // Fallback oder Fehler werfen?

        const elementWithGlobalOrder: StructuredElement = { 
            ...rawElement, 
            elementType: validElementType,
            elementId: elementId, 
            globalOriginalOrder: globalElementCounter++ 
        };
        finalStructuredElementsList.push(elementWithGlobalOrder);
        finalFullMarkdownText += elementWithGlobalOrder.markdownContent + "\n\n"; // Füge zwei Newlines für bessere Lesbarkeit hinzu
      });

      // Passe den Mutationsaufruf und die Felder an
      await ctx.runMutation(internal.contractMutations.updateContractStatus, { // Verwende updateContractStatus statt updateContractProcessingProgress
        contractId: args.contractId,
        // Entferne Fortschrittsfelder von hier, sie gehören in spezifische Mutationen
        // structuredLargeChunks: chunkNumberForLog, 
        currentProcessingStepDetail: `Struktur für Vor-Chunk ${chunkNumberForLog}/${args.preChunks.length} generiert.`,
        status: "structure_generation_inprogress" 
      });
    }

    // Speichere die gesammelten strukturierten Daten und den Markdown-Text
    await ctx.runMutation(internal.contractMutations.updateContractWithStructuredData, {
        contractId: args.contractId,
        fullMarkdownText: finalFullMarkdownText.trim(),
        structuredContractElements: finalStructuredElementsList as any, // Cast zu any, um den Typfehler zu umgehen, da globalChunkNumber fehlt
    });

    await ctx.runMutation(internal.contractMutations.updateContractStatus, {
      contractId: args.contractId,
      status: "structured_json_generated",
      totalElementsToAnalyze: finalStructuredElementsList.length // Passe das Feld an
    });

    console.log(`Strukturierung für Vertrag ${args.contractId} abgeschlossen. ${finalStructuredElementsList.length} Strukturelemente generiert.`);
    
    // Nächster Schritt: Analyse-Chunks erstellen (Stufe 2)
    await ctx.scheduler.runAfter(0, internal.contractActions.createAnalysisChunksFromStructuredElements, {
        contractId: args.contractId,
    });
    console.log(`Stufe 2 (Analysis Chunking) für Vertrag ${args.contractId} geplant.`);

    return { 
        message: `Strukturierung für Vertrag ${args.contractId} erfolgreich abgeschlossen und Analyse-Chunking geplant.`,
        structuredElementCount: finalStructuredElementsList.length
    };
  },
});

export const analyzeContractChunk = internalAction({
  args: {
    contractId: v.id("contracts"),
    chunkText: v.string(),
    rulesText: v.string(),
    legalBasisText: v.string(),
    chunkNumber: v.number(),
    totalChunks: v.number(),
  },
  handler: async (ctx, args) => {
    console.log(`Analyzing chunk ${args.chunkNumber}/${args.totalChunks} for contract ${args.contractId}`);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables.");
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "failed",
        errorDetails: "GEMINI_API_KEY missing"
      });
      throw new ConvexError("GEMINI_API_KEY is not configured.");
    }

    const systemPrompt = `Du bist ein spezialisierter KI-Assistent für die automatisierte Prüfung von deutschsprachigen Bauverträgen und Allgemeinen Geschäftsbedingungen (AGBs), insbesondere im Kontext des deutschen und österreichischen Baurechts (BGB, VOB, ÖNORM). Deine Hauptaufgabe ist es, Verträge schnell zu analysieren, Risiken zu identifizieren und Compliance für den Bauunternehmen sicherzustellen.

Bewerte Vertragsklauseln STRENG nach diesem Ampelsystem:

ROT (nicht akzeptabel):
- Pay-When-Paid Klauseln (Zahlungen abhängig von Zahlung des Bauherrn)
- Vollständige Übertragung gewerblicher Schutzrechte (anstelle von Nutzungsrechten)
- Vertragsstrafen ohne Begrenzung (max. akzeptabel: 5% der Auftragssumme)
- Back-to-Back Vertragsübernahme (vollständige Einbeziehung der Pflichten/Haftung aus Bauherrnvertrag)
- Bietergarantie (Bid-Bond) Forderungen
- Fehlendes fixes Bauende im Vertrag
- Verschuldensunabhängige Pönale/Schadenersatz-Klauseln
- Erfüllungsgarantien ohne Einschränkung

GELB (verhandelbar):
- Gestörter Bauablauf (Ausschluss von Bauzeitverlängerung/Mehrkosten)
- Ausschluss der ÖNORM B 2110
- Vertragserfüllungsbürgschaft über 10%
- Konzern- oder projektübergreifende Haftung
- Persönliche Haftung über gesetzlichen Rahmen hinaus
- Ausschluss von Sub-Sub-Vergabe
- Mängelregelung außerhalb der ÖNORM

GRÜN (akzeptabel):
- Klauseln, die keine der oben genannten Probleme aufweisen
- Vertragsstrafen mit klarer Begrenzung auf max. 5% der Auftragssumme
- Gewährung von Nutzungsrechten statt Übertragung von Schutzrechten
- Klare Abnahmeregelungen gemäß ÖNORM B 2110

Gib als Ergebnis NUR ein valides JSON-Array zurück, das die analysierten Klauseln dieses Chunks enthält. Jedes Objekt im Array MUSS folgende Felder haben: "clauseText" (string), "evaluation" (string: "Rot", "Gelb" oder "Grün"), "reason" (string), "recommendation" (string). Wenn keine identifizierbaren Klauseln in diesem Chunk sind, gib ein leeres JSON-Array zurück: [].

Beispiel: [{"clauseText": "Text der Klausel...", "evaluation": "Rot", "reason": "Pay-When-Paid Klausel: Die Zahlung ist von der Zahlung des Bauherrn abhängig, was nicht akzeptabel ist.", "recommendation": "Diese Klausel sollte entfernt oder dahingehend geändert werden, dass Zahlungen unabhängig von Zahlungen des Bauherrn erfolgen."}]`;

    const userPrompt = `Du analysierst einen Teil eines größeren Bauvertrags (Chunk ${args.chunkNumber}/${args.totalChunks}). Identifiziere alle Klauseln innerhalb dieses Textabschnitts, bewerte sie gemäß den beigefügten "Regeln für die Analyse" und erstelle ein Protokoll für die Klauseln in diesem Chunk. Berücksichtige bei deiner Bewertung auch die beigefügten juristischen Referenzinformationen.

--- VERTRAGSTEXT-CHUNK ANFANG ---
${args.chunkText}
--- VERTRAGSTEXT-CHUNK ENDE ---

--- REGELN FÜR DIE ANALYSE ANFANG ---
${args.rulesText}
--- REGELN FÜR DIE ANALYSE ENDE ---

--- JURISTISCHER BASIS-EXTRAKT ANFANG ---
${args.legalBasisText}
--- JURISTISCHER BASIS-EXTRAKT ENDE ---

Stelle sicher, dass deine Antwort ausschließlich ein valides JSON-Array ist, wie im Systemprompt beschrieben. Beginne deine Antwort direkt mit '[' und ende sie mit ']'.`;

    let analysisResultForChunk: Gemini.ContractClauseAnalysis[] = [];
    try {
      console.log(`Calling Gemini for chunk ${args.chunkNumber} of contract ${args.contractId}...`);
      const requestBody: Gemini.RequestBody = {
        contents: [
          { role: "user", parts: [{ text: systemPrompt }, { text: userPrompt }] }
        ],
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Gemini API error for chunk ${args.chunkNumber}: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}. Body: ${errorBody}`);
      }
      const responseData: Gemini.GenerateContentResponse = await response.json();
      if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content || !responseData.candidates[0].content.parts || !responseData.candidates[0].content.parts[0]) {
        console.error("Gemini API response is not in the expected format for chunk " + args.chunkNumber, responseData);
        throw new Error("Unexpected Gemini API response format.");
      }
      const geminiOutput = responseData.candidates[0].content.parts[0].text;
      let cleanedOutput = geminiOutput.trim();
      
      // Verbesserte Bereinigung: Entfernt Markdown-Code-Block-Marker und alles außerhalb
      if (cleanedOutput.startsWith("```json")) {
        cleanedOutput = cleanedOutput.substring(7);
        if (cleanedOutput.endsWith("```")) {
          cleanedOutput = cleanedOutput.substring(0, cleanedOutput.length - 3);
        }
      } else if (cleanedOutput.startsWith("```")) { // Falls nur ``` am Anfang ohne json
        cleanedOutput = cleanedOutput.substring(3);
        if (cleanedOutput.endsWith("```")) {
          cleanedOutput = cleanedOutput.substring(0, cleanedOutput.length - 3);
        }
      }
      if (cleanedOutput.endsWith("```")) { // Falls nur ``` am Ende
          cleanedOutput = cleanedOutput.substring(0, cleanedOutput.length - 3);
      }
      cleanedOutput = cleanedOutput.trim(); 

      // Versuch, das JSON zu parsen, auch wenn es fehlerhaft sein könnte
      // Manchmal ist die Ausgabe ein einzelnes Objekt statt eines Arrays
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(cleanedOutput);
      } catch (parseError: any) {
        console.error(`Failed to parse Gemini JSON output for chunk ${args.chunkNumber}. Output was:`, cleanedOutput, "Error:", parseError);
        // Versuche, häufige Fehler zu korrigieren, z.B. fehlende schließende Klammern oder Kommas
        // Dies ist ein sehr einfacher Versuch und benötigt ggf. eine ausgefeiltere Logik
        let recoveryAttempt = cleanedOutput;
        if (!recoveryAttempt.endsWith("]")) {
            if (recoveryAttempt.endsWith("}")) recoveryAttempt += "]"; // Wenn es wie ein Objekt in einem Array aussieht
            else if (!recoveryAttempt.endsWith("}")) recoveryAttempt += "}]"; // Sehr spekulativ
        }
        if (!recoveryAttempt.startsWith("[")) {
            if (recoveryAttempt.startsWith("{")) recoveryAttempt = "[" + recoveryAttempt;
        }

        try {
            parsedJson = JSON.parse(recoveryAttempt);
            console.warn(`Successfully parsed after recovery attempt for chunk ${args.chunkNumber}.`);
        } catch (recoveryParseError: any) {
             console.error(`Recovery attempt failed for chunk ${args.chunkNumber}.`, recoveryParseError);
             analysisResultForChunk = [{ 
                clauseText: `Fehler beim Parsen der KI-Antwort für Chunk ${args.chunkNumber}.`,
                evaluation: "Fehler",
                reason: `KI-Antwort war kein valides JSON und konnte nicht repariert werden: ${parseError.message}. Raw Output (erste 300 Zeichen): ${geminiOutput.substring(0,300)}...`,
                recommendation: "Überprüfe die KI-Antwort, den Prompt und die Gemini API-Stabilität. Der Chunk wurde nicht analysiert."
            }];
            // Wichtig: Hier nicht `throw new Error` sondern den Fehler im Ergebnis speichern
        }
      }

      if (parsedJson) { // Nur wenn Parsen (ggf. nach Reparatur) erfolgreich war
        if (Array.isArray(parsedJson)) {
          analysisResultForChunk = parsedJson as Gemini.ContractClauseAnalysis[];
        } else if (typeof parsedJson === 'object' && parsedJson !== null) {
          // Wenn Gemini ein einzelnes Objekt statt eines Arrays zurückgibt
          console.warn(`Gemini output for chunk ${args.chunkNumber} was a single object, wrapping in array. Output:`, parsedJson);
          analysisResultForChunk = [parsedJson as Gemini.ContractClauseAnalysis];
        } else {
          console.error(`Gemini output for chunk ${args.chunkNumber} was not an array or a valid single object after parsing. Output:`, parsedJson);
          analysisResultForChunk = [{ 
              clauseText: `Unerwartetes Datenformat von der KI für Chunk ${args.chunkNumber}.`,
              evaluation: "Fehler",
              reason: `Die KI-Antwort war valides JSON, aber weder ein Array noch ein erwartetes Objekt. Output: ${JSON.stringify(parsedJson).substring(0,200)}...`,
              recommendation: "Überprüfe die KI-Antwort und den Prompt. Der Chunk wurde nicht analysiert."
          }];
        }
      }
      // Sicherstellen, dass analysisResultForChunk immer ein Array ist, auch wenn ein Fehler oben auftrat und es noch nicht initialisiert wurde
      if (!Array.isArray(analysisResultForChunk)) {
        analysisResultForChunk = [{ 
            clauseText: `Interner Verarbeitungsfehler für Chunk ${args.chunkNumber}.`,
            evaluation: "Fehler",
            reason: `analysisResultForChunk wurde nicht korrekt als Array initialisiert. Dies sollte nicht passieren.`,
            recommendation: "Entwickler kontaktieren."
        }];
      }

    } catch (error: any) {
      console.error(`Error analyzing chunk ${args.chunkNumber} for contract ${args.contractId}:`, error.message, error.stack);
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "failed_partial_analysis", // Oder "failed"?
        errorDetails: error.message || `Unbekannter Fehler bei der Chunk-Analyse ${args.chunkNumber}`,
      });
      return; 
    }

    // Passe den Mutationsaufruf an, speichere das Ergebnis anders (z.B. über bulkMerge oder update einzelner Elemente)
    // Dieser Teil muss gemäß Stufe 3 Implementierung überarbeitet werden
    // Vorerst auskommentiert:
    /*
    await ctx.runMutation(internal.contractMutations.appendChunkAnalysis, {
      contractId: args.contractId,
      chunkNumber: args.chunkNumber,
      totalChunks: args.totalChunks,
      chunkResult: analysisResultForChunk,
    });
    */
    console.warn(`Speichern von Chunk ${args.chunkNumber} Analyse übersprungen - muss an neue Stufe 3 angepasst werden.`);
    console.log(`Successfully processed chunk ${args.chunkNumber} for contract ${args.contractId}`);
  },
});

// Neue Action zur Datei-Hochladung über fetch, da fetch() nur in Actions verfügbar ist
export const uploadFileAction = action({
  args: {
    fileName: v.string(),
    fileType: v.string(),
    fileBuffer: v.any(), // Wir akzeptieren unterschiedliche Buffer-Typen
  },
  handler: async (ctx, args): Promise<{ success: boolean; contractId?: string; storageId?: Id<"_storage">; error?: string }> => {
    console.log(`Uploading file via action: ${args.fileName} (${args.fileType})`);
    
    // Authentifizierung prüfen
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("User not authenticated to upload files.");
    }
    
    try {
      // 1. Upload-URL generieren
      const uploadUrl = await ctx.storage.generateUploadUrl();
      console.log("Generated upload URL:", uploadUrl);
      
      // 2. Blob aus dem ArrayBuffer erstellen
      let blob;
      if (args.fileBuffer instanceof ArrayBuffer) {
        blob = new Blob([new Uint8Array(args.fileBuffer)]);
      } else if (args.fileBuffer instanceof Uint8Array) {
        blob = new Blob([args.fileBuffer]);
      } else {
        blob = new Blob([args.fileBuffer]);
      }
      
      // 3. Upload zur URL durchführen (mit fetch, was nur in Actions erlaubt ist)
      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: blob
      });
      
      if (!uploadResult.ok) {
        throw new Error(`Failed to upload file: ${uploadResult.status} ${uploadResult.statusText}`);
      }
      
      // 4. StorageId aus der URL extrahieren
      const urlObj = new URL(uploadUrl);
      const pathParts = urlObj.pathname.split('/');
      
      // Die Storage-ID ist im Pfad. Wir parsen sie heraus.
      let storageId: string | undefined;
      for (let i = pathParts.length - 1; i >= 0; i--) {
        if (pathParts[i] && !['api', 'storage', 'upload', ''].includes(pathParts[i])) {
          storageId = pathParts[i];
          break;
        }
      }
      
      if (!storageId) {
        throw new ConvexError("Failed to extract valid storage ID from upload URL");
      }
      
      console.log(`File uploaded successfully with storageId: ${storageId}`);
      
      // 5. Vertrag in der Datenbank erstellen
      const contractId: string = await ctx.runMutation(api.contractMutations.createContractRecord, {
        fileName: args.fileName,
        storageId: storageId as Id<"_storage">
      });
      
      console.log(`Contract record created with ID: ${contractId}`);
      
      return { 
        success: true, 
        contractId, 
        storageId: storageId as Id<"_storage"> 
      };
    } catch (error) {
      console.error("Error in upload action:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
});

// Neue Action zur Optimierung einer einzelnen Klausel
export const optimizeClauseWithAI = action({
    args: {
        clauseText: v.string(),
        context: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<string[]> => {
        const clientCallId = `client_call_opt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        console.log(`[${clientCallId}] optimizeClauseWithAI START for clause: \"${args.clauseText.substring(0, 50)}...\"`);
        
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            console.error(`[${clientCallId}] GEMINI_API_KEY is not set.`);
            throw new ConvexError("GEMINI_API_KEY is not configured.");
        }

        // Überarbeiteter System-Prompt für mehr Flexibilität
        const systemPrompt = `Du bist ein KI-Assistent, spezialisiert auf die Überarbeitung von Texten im Kontext von deutschen und österreichischen Bauverträgen (BGB, VOB, ÖNORM). Deine Aufgabe ist es, den vom Benutzer übergebenen Text zu überarbeiten und zu optimieren.\n\n1.  **Primäres Ziel:** Formuliere den übergebenen Text so um, dass er klar, präzise und professionell im Stil einer Vertragsklausel klingt. Behalte die ursprüngliche Bedeutung bei, soweit möglich.\n2.  **Sekundäres Ziel (falls anwendbar):** Wenn der Text eine erkennbare vertragliche Regelung enthält, wende dein Wissen über typische Problembereiche für Bauunternehmer an (z.B. Pay-When-Paid, Schutzrechte, Pönalen, Garantien, Bauablauf) und optimiere den Text im Sinne des Bauunternehmers, während du rechtliche Korrektheit und Fairness berücksichtigst.\n3.  **Formatierung:** Die Länge des optimierten Textes sollte sich ungefähr an der Länge des ursprünglichen Textes orientieren. Vermeide unnötige Ausschweifungen.\n\n**WICHTIG:** Gib als Ergebnis NUR ein valides JSON-Array zurück, das EINEN String mit dem überarbeiteten Text enthält. Gib KEINE Präfixe, Erklärungen oder sonstigen Text aus. Format: ["Überarbeiteter Text"]`;

        // User-Prompt bleibt gleich (betont die Bearbeitung des spezifischen Textes)
        const userPrompt = `Hier ist eine Vertragsklausel oder ein Textentwurf, der optimiert werden soll:\n\n--- ZU OPTIMIERENDER TEXT ---\n\"${args.clauseText}\"\n--- ENDE TEXT ---\n\nDeine Aufgabe ist es, DIESEN TEXT zu überarbeiten und zu optimieren, sodass er für einen Bauunternehmer vorteilhafter ist. Nutze dein Wissen über die im Systemprompt genannten Problembereiche (Pay-When-Paid, Schutzrechte etc.), um DIESEN SPEZIFISCHEN TEXT zu verbessern. Konzentriere dich auf Klarheit, Risikominimierung und Ausgewogenheit. Die Länge des optimierten Textes sollte sich an der des ursprünglichen Textes orientieren. Gib keine Präfixe aus.\n\n${args.context ? `\nZusätzlicher Kontext:\n${args.context}` : ''}\n\nGib das Ergebnis als JSON-Array mit einem einzigen String zurück, wie im Systemprompt beschrieben. Beginne direkt mit '[' und ende mit ']'.`;

        let response: Response | undefined;
        try {
            console.log(`[${clientCallId}] Sending request to Gemini API for optimization...`);
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                contents: [
                        {
                            role: "user",
                            parts: [{ text: systemPrompt }, { text: userPrompt }]
                        }
                ],
                generationConfig: {
                    temperature: 0.3,
                    topP: 0.8,
                    topK: 40
                }
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[${clientCallId}] Gemini API error during optimization: ${response.status} ${errorBody}. Prompt (start): ${userPrompt.substring(0,100)}...`);
                throw new Error(`Gemini API error: ${response.status} ${errorBody}`);
            }

            const responseData: any = await response.json();
            const responseDataStr = JSON.stringify(responseData);
            console.log(`[${clientCallId}] Gemini API responseData for optimization (raw):`, responseDataStr.substring(0, 500) + (responseDataStr.length > 500 ? "..." : ""));
            
            const optimizedText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log(`[${clientCallId}] Extracted optimizedText from Gemini:`, optimizedText ? optimizedText.substring(0, 500) + (optimizedText.length > 500 ? "..." : "") : "null/undefined");
            
            if (optimizedText) {
                try {
                    const jsonMatch = optimizedText.match(/```(?:json)?\s*(\[.*?\])\s*```/s);
                    const jsonStringToParse = jsonMatch ? jsonMatch[1] : optimizedText.trim();
                    console.log(`[${clientCallId}] String to parse for JSON (optimization):`, jsonStringToParse.substring(0, 500) + (jsonStringToParse.length > 500 ? "..." : ""));
                    
                    const parsedArray = JSON.parse(jsonStringToParse);
                    console.log(`[${clientCallId}] Parsed array (optimization - length ${Array.isArray(parsedArray) ? parsedArray.length : 'N/A'}):`, parsedArray);

                    if (Array.isArray(parsedArray) && parsedArray.length === 1 && typeof parsedArray[0] === 'string') {
                        console.log(`[${clientCallId}] Returning optimized clause array:`, parsedArray);
                        return parsedArray; 
                    } else {
                        console.error(`[${clientCallId}] Parsed JSON from optimizeClauseAction is not an array with one string. Parsed:`, parsedArray, "Returning [].");
                        return []; 
                    }
                } catch (parseError: any) {
                    console.error(`[${clientCallId}] Failed to parse JSON from optimizeClauseAction. Error: ${parseError.message}. Raw optimizedText:`, optimizedText ? optimizedText.substring(0, 500) + (optimizedText.length > 500 ? "..." : "") : "null/undefined", "Returning [].");
                    return []; 
                }
            } else {
                const responseDataStrForWarn = JSON.stringify(responseData);
                console.warn(`[${clientCallId}] Could not extract optimizedText from Gemini response. ResponseData:`, responseDataStrForWarn.substring(0,300) + (responseDataStrForWarn.length > 300 ? "..." : ""), "Returning [].");
                return []; 
            }

        } catch (error: any) {
            console.error(`[${clientCallId}] Error in optimizeClauseWithAI action: ${error.message}. Stack: ${error.stack}`);
            throw new Error(`Failed to optimize clause with AI: ${error.message}`);
        }
    },
});

// Neue Action zur Generierung von 3 alternativen Formulierungen für eine Klausel
export const generateAlternativeFormulations = action({
    args: {
        clauseText: v.string(),
        context: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<string[]> => {
        const clientCallId = `client_call_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        console.log(`[${clientCallId}] generateAlternativeFormulations START for clause: \"${args.clauseText.substring(0, 50)}...\"`);
        
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            console.error(`[${clientCallId}] GEMINI_API_KEY is not set.`);
            throw new ConvexError("GEMINI_API_KEY is not configured.");
        }

        // Prompts using template literals for easier readability
        const systemPrompt = `Du bist ein spezialisierter Rechtsexperte für Bauverträge nach deutschem und österreichischem Recht (BGB, VOB, ÖNORM). Deine Aufgabe ist es, für eine problematische Vertragsklausel GENAU DREI unterschiedliche alternative Formulierungen zu entwickeln.\n\nDie drei Alternativen sollten:\n1. Eine KONSERVATIVE Variante, die minimale Änderungen vornimmt, aber das Hauptrisiko beseitigt.\n2. Eine AUSGEWOGENE Variante mit fairer Risikoverteilung zwischen den Parteien.\n3. Eine OPTIMALE Variante, die die Position des Bauunternehmers maximal stärkt.\n\nWICHTIG:\n- Gib NUR die reinen Klauseltexte zurück. KEINE Nummerierungen, KEINE Präfixe wie \"Alternative 1:\", \"Konservativ:\", etc.\n- Die Länge jeder Alternative sollte sich an der Länge der ursprünglichen Klausel orientieren. Vermeide unnötig lange Texte.\n- Das Ergebnis MUSS ein valides JSON-Array mit GENAU DREI Strings sein. Format: [\"Reiner Text Alternative 1\", \"Reiner Text Alternative 2\", \"Reiner Text Alternative 3\"]`;
        const userPrompt = `Bitte generiere GENAU DREI alternative Formulierungen für die folgende Vertragsklausel. Jede Alternative sollte einen anderen Ansatz oder Schwerpunkt haben, aber alle sollten für einen Bauunternehmer vorteilhafter sein. Achte auf die Länge und gib keine Präfixe aus.\n\nUrsprüngliche Klausel:\n\"${args.clauseText}\"\n\n${args.context ? `\nZusätzlicher Kontext:\n${args.context}` : ''}\n\nGib das Ergebnis als valides JSON-Array mit GENAU DREI Strings zurück, wie im Systemprompt beschrieben. Beginne direkt mit '[' und ende mit ']'.`;

        let response: Response | undefined;
        try {
            console.log(`[${clientCallId}] Sending request to Gemini API...`);
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                contents: [
                        {
                            role: "user",
                            parts: [{ text: systemPrompt }, { text: userPrompt }]
                        }
                ],
                generationConfig: {
                    temperature: 0.6,
                    topP: 0.9,
                    topK: 40
                }
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[${clientCallId}] Gemini API error: ${response.status} ${errorBody}. Prompt (start): ${userPrompt.substring(0,100)}...`);
                // Throw error to be caught by client's catch block
                throw new Error(`Gemini API error: ${response.status} ${errorBody}`);
            }

            const responseData: any = await response.json();
            const responseDataStr = JSON.stringify(responseData);
            console.log(`[${clientCallId}] Gemini API responseData (raw):`, responseDataStr.substring(0, 500) + (responseDataStr.length > 500 ? "..." : ""));
            
            const jsonText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log(`[${clientCallId}] Extracted jsonText from Gemini:`, jsonText ? jsonText.substring(0, 500) + (jsonText.length > 500 ? "..." : "") : "null/undefined");
            
            if (jsonText) {
                try {
                    // Use non-greedy match and handle potential markdown code fences
                    const jsonMatch = jsonText.match(/```(?:json)?\s*(\[.*?\])\s*```/s);
                    const jsonStringToParse = jsonMatch ? jsonMatch[1] : jsonText.trim();
                    console.log(`[${clientCallId}] String to parse for JSON:`, jsonStringToParse.substring(0, 500) + (jsonStringToParse.length > 500 ? "..." : ""));
                    
                    let alternativesArray = JSON.parse(jsonStringToParse);
                    console.log(`[${clientCallId}] Parsed alternativesArray (length: ${Array.isArray(alternativesArray) ? alternativesArray.length : 'N/A'}):`, alternativesArray);

                    if (Array.isArray(alternativesArray) && alternativesArray.every(item => typeof item === 'string')) {
                        const cleanedAlternatives = alternativesArray.map(alt => {
                            let cleanedAlt = alt.trim();
                            // Remove common prefixes
                            cleanedAlt = cleanedAlt.replace(/^Alternative\s*\d+\s*\(.*?\):\s*/i, '');
                            cleanedAlt = cleanedAlt.replace(/^Alternative\s*\d+:\s*/i, '');
                            cleanedAlt = cleanedAlt.replace(/^\d+\.\s+/, '');
                            cleanedAlt = cleanedAlt.replace(/^-+\s+/, '');
                            return cleanedAlt.trim();
                        });
                        console.log(`[${clientCallId}] Returning ${cleanedAlternatives.length} cleaned alternatives.`);
                        return cleanedAlternatives as string[];
                    } else {
                        console.error(`[${clientCallId}] Parsed JSON is not an array of strings or invalid structure. Parsed:`, alternativesArray, "Returning [].");
                        return []; 
                    }
                } catch (parseError: any) {
                    console.error(`[${clientCallId}] Failed to parse JSON. Error: ${parseError.message}. Raw jsonText:`, jsonText ? jsonText.substring(0, 500) + (jsonText.length > 500 ? "..." : "") : "null/undefined", "Returning [].");
                    return []; 
                }
            } else {
                const responseDataStrForWarn = JSON.stringify(responseData);
                console.warn(`[${clientCallId}] Could not extract jsonText from Gemini response. ResponseData:`, responseDataStrForWarn.substring(0, 300) + (responseDataStrForWarn.length > 300 ? "..." : ""), "Returning [].");
                return []; 
            }

        } catch (error: any) {
            // Log the error and re-throw it for the client catch block
            console.error(`[${clientCallId}] Error caught in generateAlternativeFormulations action: ${error.message}. Stack: ${error.stack}`);
            throw new Error(`Failed to generate alternative formulations: ${error.message}`);
        }
    },
});

// Typ für das Rückgabeformat der Analyse eines Elements
type ElementAnalysisResult = {
  elementId: string;
  evaluation: string;
  reason: string;
  recommendation: string;
  isError: boolean;
  errorMessage?: string;
};

// Interne Helper-Funktion für die Analyse eines einzelnen Chunks
async function _performSingleChunkAnalysis(
    ctx: ActionCtx, // ActionCtx wird benötigt für runAction und runMutation
    contractId: Id<"contracts">,
    analysisChunk: StructuredElement[] // Sicherstellen, dass StructuredElement hier verfügbar/importiert ist oder den Typ explizit definieren
): Promise<{ success: boolean; chunkIdentifier: string; results: ElementAnalysisResult[] }> { // Gibt jetzt Ergebnisse zurück
    const chunkIdentifier = analysisChunk.length > 0 ? analysisChunk[0].elementId : 'empty_chunk';
    console.log(`Starting analysis for chunk starting with ${chunkIdentifier} for contract ${contractId}`);
    let chunkAnalysisError = false;
    const elementResults: ElementAnalysisResult[] = []; // Array zum Sammeln der Ergebnisse für diesen Chunk

    for (const element of analysisChunk) {
        // Nur relevante Elemente analysieren
        if (element.elementType !== "clauseH3" && element.elementType !== "paragraph") {
            elementResults.push({ // Platzhalter für nicht analysierte Elemente, falls nötig
                 elementId: element.elementId,
                 evaluation: "N/A",
                 reason: "Element-Typ nicht analysiert",
                 recommendation: "Keine",
                 isError: false
             });
            continue;
        }

        console.log(`Analyzing element ${element.elementId} (${element.elementType})`);
        let currentElementResult: ElementAnalysisResult | null = null;

        try {
            // 1. Embedding
            const embedding = await ctx.runAction(internal.gemini.createEmbedding, {
                text: element.markdownContent,
            });

            // 2. Vektorsuche
            const KNOWLEDGE_LIMIT = 5;
            const similarKnowledgeChunks = await ctx.runAction(internal.knowledgeQueries.findSimilarKnowledgeChunks, {
                embedding: embedding,
                limit: KNOWLEDGE_LIMIT,
            });

            // 3. Kontext formatieren
            let retrievedKnowledgeContext = "Keine spezifischen Wissens-Chunks gefunden.";
            if (similarKnowledgeChunks && similarKnowledgeChunks.length > 0) {
                retrievedKnowledgeContext = similarKnowledgeChunks
                    .map((chunk: Doc<"knowledgeChunks">, index: number) =>
                        `--- Relevanter Wissens-Chunk ${index + 1} (Quelle: ${chunk.metadata.source || 'Unbekannt'}) ---\n${chunk.textContent}\n--- Ende Chunk ${index + 1} ---`
                    )
                    .join("\n\n");
            }

            // 4. System-Prompt
            const systemPromptAgent2 = `Du bist ein spezialisierter KI-Assistent für die Prüfung von Bauverträgen. Bewerte die Klausel nach dem AMPELSYSTEM (Rot, Gelb, Grün, Info). Gib eine Begründung und Empfehlung. Deine Antwort MUSS ein JSON-Array sein, das EIN Objekt für die analysierte Klausel enthält: [{ "analyzedElementId": "${element.elementId}", "evaluation": "...", "reason": "...", "recommendation": "..." }]`; // elementId im Prompt für besseres Matching

            // 5. User-Prompt
            const userPromptAgent2 = `BEWERTE FOLGENDE VERTRAGSKLAUSEL:\n\n--- ZU ANALYSIERENDES VERTRAGSELEMENT (Markdown, ID: ${element.elementId}) ---\n${element.markdownContent}\n--- ENDE ZU ANALYSIERENDES VERTRAGSELEMENT ---
\n--- RELEVANTE AUSZÜGE AUS DER WISSENSDATENBANK ---\n${retrievedKnowledgeContext}\n--- ENDE RELEVANTE AUSZÜGE ---
\nGib deine Analyse als JSON-Array mit genau einem Objekt zurück, dessen \"analyzedElementId\" exakt \"${element.elementId}\" ist.`;

            // 6. Gemini Pro Aufruf
            const analysisResultString = await ctx.runAction(internal.gemini.generateAnalysisWithPro, {
                // systemPrompt: systemPromptAgent2, // Wird in der Action gesetzt
                // contextPrompt: userPromptAgent2, // Wird in der Action gesetzt
                elementMarkdownContent: element.markdownContent, // Korrektes Argument gemäß Implementierungsplan
                elementId: element.elementId, // Korrektes Argument gemäß Implementierungsplan
                // modelName: "gemini-2.5-flash-preview-04-17" // Wird in der Action gesetzt
            });

            console.log(`Raw analysis result string for element ${element.elementId}:`, analysisResultString);

            // 7. JSON parsen
            let parsedAnalysis = null;
            try {
                // Versuche, direkt das JSON zu parsen, auch wenn Markdown-Blöcke vorhanden sind
                const jsonMatch = analysisResultString.match(/```(?:json)?\n?(\[.*?\])\n?```/s);
                const jsonStringToParse = jsonMatch ? jsonMatch[1] : analysisResultString.trim();
                parsedAnalysis = JSON.parse(jsonStringToParse);
            } catch (parseError: any) {
                console.error(`Failed to parse JSON response for element ${element.elementId}: ${parseError.message}. Raw response: ${analysisResultString.substring(0, 300)}...`);
                chunkAnalysisError = true;
                currentElementResult = {
                    elementId: element.elementId,
                    evaluation: "Fehler",
                    reason: "Ungültige JSON-Antwort von KI.",
                    recommendation: "Element konnte nicht analysiert werden.",
                    isError: true,
                    errorMessage: "Ungültige JSON-Antwort von KI."
                };
                 elementResults.push(currentElementResult); // Füge Fehlerergebnis hinzu
                continue; // Nächstes Element im Chunk
            }

            // 8. Ergebnisse validieren und zum Array hinzufügen
            if (Array.isArray(parsedAnalysis) && parsedAnalysis.length > 0) {
                const result = parsedAnalysis[0];
                // Stelle sicher, dass die ID übereinstimmt, um falsche Zuordnungen zu vermeiden
                if (result && result.analyzedElementId === element.elementId && result.evaluation && result.reason && result.recommendation) {
                    currentElementResult = {
                        elementId: element.elementId,
                        evaluation: result.evaluation,
                        reason: result.reason,
                        recommendation: result.recommendation,
                        isError: false,
                    };
                    console.log(`Successfully analyzed element ${element.elementId}`);
                } else {
                    console.error(`Invalid analysis result format or mismatched ID for element ${element.elementId}: Expected ${element.elementId}, got ${result?.analyzedElementId}. Result:`, result);
                    chunkAnalysisError = true;
                     currentElementResult = {
                        elementId: element.elementId,
                        evaluation: "Fehler",
                        reason: `Ungültiges Analyseformat oder ID-Mismatch (Erwartet: ${element.elementId}, Erhalten: ${result?.analyzedElementId}).`,
                        recommendation: "Ergebnis konnte nicht verarbeitet werden.",
                        isError: true,
                        errorMessage: "Ungültiges Analyseformat oder ID-Mismatch."
                    };
                }
            } else {
                console.error(`Parsed JSON is not a valid array or is empty for element ${element.elementId}. Parsed:`, parsedAnalysis);
                chunkAnalysisError = true;
                 currentElementResult = {
                    elementId: element.elementId,
                    evaluation: "Fehler",
                    reason: "Keine gültige Analyse im JSON-Format von KI erhalten.",
                    recommendation: "Element konnte nicht analysiert werden.",
                    isError: true,
                    errorMessage: "Keine gültige Analyse im JSON-Format von KI."
                 };
            }

        } catch (error: any) {
            console.error(`Error analyzing element ${element.elementId} in contract ${contractId}:`, error);
            chunkAnalysisError = true;
            currentElementResult = {
                elementId: element.elementId,
                evaluation: "Fehler",
                reason: `Analyse fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`,
                recommendation: "Erneute Analyse könnte erforderlich sein.",
                isError: true,
                errorMessage: `Analyse fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`
             };
        }

         if (currentElementResult) {
             elementResults.push(currentElementResult); // Füge das Ergebnis (Erfolg oder Fehler) hinzu
         }

    } // Ende der Element-Schleife

    console.log(`Finished analyzing chunk ${chunkIdentifier}. Chunk analysis error: ${chunkAnalysisError}`);
    // Gibt Erfolg des Chunks, Identifier und die gesammelten Ergebnisse zurück
    return { success: !chunkAnalysisError, chunkIdentifier, results: elementResults };
}

// Stufe 2 - Erstellt Analyse-Chunks und startet parallele Analyse
export const createAnalysisChunksFromStructuredElements = internalAction({
  args: {
    contractId: v.id("contracts"),
  },
  handler: async (ctx, args) => {
    console.log(`Starting Stufe 2: Creating analysis chunks for contract ${args.contractId}`);

    // 1. Status auf "chunking" setzen (kurzzeitig)
    await ctx.runMutation(internal.contractMutations.updateContractStatus, {
      contractId: args.contractId,
      status: "chunking",
    });

    // 2. Strukturelemente abrufen
    const contract = await ctx.runQuery(api.contractQueries.getContractById, { contractId: args.contractId });
    if (!contract || !contract.structuredContractElements || contract.structuredContractElements.length === 0) {
      console.warn(`No structured elements found for contract ${args.contractId} to create analysis chunks.`);
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "completed", // Oder "failed" mit Grund?
        totalElementsToAnalyze: 0, // Setze Elemente auf 0
        errorDetails: "Keine Strukturelemente für Analyse gefunden."
      });
      return { message: "No structured elements found. Analysis chunking skipped." };
    }
    const structuredElements = contract.structuredContractElements as StructuredElement[];

    // 3. Implementierung der Chunking-Logik
    const MAX_ANALYSIS_CHUNK_SIZE_CHARS = 10000;
    const analysisChunks: StructuredElement[][] = [];
    let currentChunk: StructuredElement[] = [];
    let currentChunkCharCount = 0;

    for (const element of structuredElements) {
      const elementCharCount = element.markdownContent.length;
      if (elementCharCount > MAX_ANALYSIS_CHUNK_SIZE_CHARS) {
        console.warn(`Element ${element.elementId} exceeds MAX_ANALYSIS_CHUNK_SIZE_CHARS and will be its own chunk.`);
        if (currentChunk.length > 0) {
          analysisChunks.push(currentChunk);
        }
        analysisChunks.push([element]);
        currentChunk = [];
        currentChunkCharCount = 0;
        continue;
      }
      if (currentChunkCharCount + elementCharCount > MAX_ANALYSIS_CHUNK_SIZE_CHARS && currentChunk.length > 0) {
        analysisChunks.push(currentChunk);
        currentChunk = [element];
        currentChunkCharCount = elementCharCount;
      } else {
        currentChunk.push(element);
        currentChunkCharCount += elementCharCount;
      }
    }
    if (currentChunk.length > 0) {
      analysisChunks.push(currentChunk);
    }

    console.log(`Created ${analysisChunks.length} analysis chunks for contract ${args.contractId}.`);

    // 4. Parallele Analyse starten
    if (analysisChunks.length > 0) {
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "analysis_inprogress",
        totalElementsToAnalyze: analysisChunks.length, // Annahme: totalElementsToAnalyze ist hier die Anzahl der Chunks?
      });

      // Array für die Promises der einzelnen Chunk-Analysen
      // Der Typ des Promises wird an den neuen Rückgabetyp angepasst
      const analysisPromises: Promise<{ success: boolean; chunkIdentifier: string; results: ElementAnalysisResult[] }>[] = [];

      // Schleife für parallele Verarbeitung
      for (let i = 0; i < analysisChunks.length; i++) {
        const chunk = analysisChunks[i];
        const chunkIdentifier = chunk.length > 0 ? chunk[0].elementId : `empty_chunk_${i}`;
        console.log(`Starting parallel processing for chunk starting with ${chunkIdentifier} for contract ${args.contractId} (${i + 1}/${analysisChunks.length})`);
        
        analysisPromises.push(
            _performSingleChunkAnalysis(ctx, args.contractId, chunk)
                .catch(error => {
                    console.error(`Error in _performSingleChunkAnalysis promise for chunk ${chunkIdentifier}:`, error);
                    // Im Fehlerfall ein Objekt zurückgeben, das dem erwarteten Format ähnelt
                    const currentFailedChunk = analysisChunks[i] || []; // Korrekter Zugriff auf den Chunk
                    return { 
                        success: false, 
                        chunkIdentifier, 
                        results: currentFailedChunk.map((el: StructuredElement) => ({ // Typ für el hinzugefügt und Variable korrigiert
                            elementId: el.elementId,
                            evaluation: "Fehler",
                            reason: `Chunk-Verarbeitung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`,
                            recommendation: "",
                            isError: true,
                            errorMessage: `Chunk-Verarbeitung fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`
                        }))
                    };
                })
        );
      }

      // Auf alle Analyse-Promises warten
      console.log(`Waiting for ${analysisPromises.length} chunk analyses to complete for contract ${args.contractId}...`);
      const results = await Promise.allSettled(analysisPromises);
      console.log(`All ${analysisPromises.length} chunk analyses settled for contract ${args.contractId}.`);

      let overallSuccess = true;
      let chunksProcessedCount = 0;
      const allElementResults: ElementAnalysisResult[] = []; // Array zum Sammeln aller Element-Ergebnisse

      results.forEach((result, index) => {
        chunksProcessedCount++;
        const chunkIdentifier = analysisChunks[index] && analysisChunks[index].length > 0 ? analysisChunks[index][0].elementId : `settled_chunk_${index}`;

        if (result.status === 'fulfilled') {
            // Füge die Ergebnisse dieses Chunks zur Gesamtliste hinzu
            allElementResults.push(...result.value.results);
            if (result.value.success) {
                console.log(`Chunk analysis for ${result.value.chunkIdentifier || chunkIdentifier} completed successfully.`);
            } else {
                overallSuccess = false;
                console.warn(`Chunk analysis for ${result.value.chunkIdentifier || chunkIdentifier} reported failure (success:false).`);
            }
        } else {
            // result.status === 'rejected'
            overallSuccess = false;
            console.error(`Chunk analysis for ${chunkIdentifier} failed (rejected promise):`, result.reason);
            // Füge Fehler-Ergebnisse für alle Elemente dieses Chunks hinzu (falls nicht schon im catch oben passiert)
            // Die Struktur oben im .catch sollte dies bereits abdecken.
             const failedChunkElements = analysisChunks[index] || [];
             failedChunkElements.forEach(el => {
                 allElementResults.push({
                     elementId: el.elementId,
                     evaluation: "Fehler",
                     reason: `Chunk-Verarbeitung fehlgeschlagen (Promise rejected): ${result.reason}`,
                     recommendation: "",
                     isError: true,
                     errorMessage: `Chunk-Verarbeitung fehlgeschlagen (Promise rejected): ${result.reason}`
                 });
             });
        }
      });
      
      // Aktualisiere den Gesamtfortschritt einmal am Ende der parallelen Verarbeitung
      await ctx.runMutation(internal.contractMutations.updateContractStatus, { // Verwende updateContractStatus
            contractId: args.contractId,
            // Entferne Fortschrittsfelder von hier
            // analyzedElements: chunksProcessedCount, 
            status: "analysis_inprogress", // Bleibt in Progress, bis finaler Status gesetzt wird
      });

      console.log(`Parallel analysis summary for ${args.contractId}: Total Chunks: ${chunksProcessedCount}, Overall Success Status: ${overallSuccess}`);

      // ---- NEU: Ergebnisse einzeln speichern ----
      console.log(`Saving ${allElementResults.length} individual element results for contract ${args.contractId}...`);
      try {
          for (const result of allElementResults) {
              // Stelle sicher, dass nur die erwarteten Felder übergeben werden
              // (errorMessage ist laut Fehlermeldung oben nicht erwartet)
              await ctx.runMutation(internal.contractMutations.mergeAnalysisResult, {
                  contractId: args.contractId,
                  elementId: result.elementId,
                  evaluation: result.evaluation,
                  reason: result.reason,
                  recommendation: result.recommendation,
                  isError: result.isError,
                  // errorMessage: result.errorMessage // Optional, falls die Mutation es doch unterstützt
              });
          }
          console.log(`Successfully saved ${allElementResults.length} element results for contract ${args.contractId}.`);
      } catch (mergeError: any) {
          console.error(`Error during saving analysis results for contract ${args.contractId}:`, mergeError);
          overallSuccess = false; // Markiere als fehlgeschlagen, wenn Speichern nicht klappt
          // Optional: Spezifischeren Fehlerstatus setzen?
      }
      // -----------------------------------------

      // Finale Statusaktualisierung nach Abschluss aller Chunks und des Speicherns
      const finalStatus = overallSuccess ? "completed" : "failed_partial_analysis"; // Oder spezifischerer Fehlerstatus?
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: finalStatus,
        errorDetails: overallSuccess ? undefined : `Einige Analyse-Chunks oder das finale Speichern sind fehlgeschlagen.` // Angepasste Fehlermeldung
      });

      console.log(`Finished Stufe 2 for contract ${args.contractId}. Final status: ${finalStatus}`);
      return { message: `Analysis chunks processed. Results saved: ${overallSuccess}` }; // Angepasste Nachricht
    } else {
      // Fall: Keine Analyse-Chunks erstellt
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "completed", // Oder anderer Status?
        totalElementsToAnalyze: 0, // Setze Elemente auf 0
      });
      return { message: "Analysis chunking completed. No chunks created." };
    }
  },
});

/**
 * INTERNAL ACTION: (Auskommentiert nach erfolgreicher Migration)
 * Iterates through all contracts and calls a mutation to migrate ownerId to userId and clear ownerId.
 * This was used for a one-time data migration.
 */
/*
export const migrateOwnerIdsToUserIds = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Starting migration: ownerId to userId...");
    const allContracts = await ctx.runQuery(
      internal.contractQueries.getAllContractsForMigration
    );

    let migratedCount = 0;
    let checkedCount = 0;
    let errorCount = 0;
    let copiedToUserIdCount = 0;
    let ownerIdClearedCount = 0;

    for (const contract of allContracts) {
      checkedCount++;
      try {
        // @ts-expect-error ownerId is removed from schema, this code is for completed migration
        const hasOwnerId = contract.ownerId && contract.ownerId.trim() !== "";
        // @ts-expect-error ownerId is removed from schema
        const hasUserId = contract.userId && contract.userId.trim() !== "";

        // Nur migrieren, wenn ownerId existiert und potenziell userId fehlt oder anders ist
        // Oder wenn ownerId einfach nur geleert werden muss
        if (hasOwnerId || contract.ownerId === "") { // auch leere ownerId-Strings behandeln
          const result = await ctx.runMutation(
            internal.contractMutations._migrateOwnerIdToUserIdAndClearOldField,
            { contractId: contract._id }
          );
          migratedCount++;
          if (result?.copiedToUserId) copiedToUserIdCount++;
          if (result?.ownerIdCleared) ownerIdClearedCount++;
        } else {
          // console.log(`Contract ${contract._id} does not have an ownerId or it is not relevant for migration. Skipping.`);
        }
      } catch (e) {
        console.error(`Error migrating contract ${contract._id}:`, e);
        errorCount++;
      }
    }
    const message = `Migration completed. Checked: ${checkedCount}, Processed (had ownerId or empty ownerId): ${migratedCount}, Copied to userId: ${copiedToUserIdCount}, OwnerId cleared: ${ownerIdClearedCount}, Errors: ${errorCount}`;
    console.log(message);
    return { message, checkedCount, migratedCount, copiedToUserIdCount, ownerIdClearedCount, errorCount };
  },
});
*/

// NEUE ACTION zum Starten und Orchestrieren von Stufe 2 (Detaillierte Strukturierung)
export const startStage2Structuring = internalAction({
    args: {
        contractId: v.id("contracts"),
    },
    handler: async (ctx, args): Promise<{ message: string }> => {
        console.log(`Starting STAGE 2: Detailed structuring for contract ${args.contractId}`);

        // 1. Vertragsdokument laden
        const contract: Doc<"contracts"> | null = await ctx.runQuery(api.contractQueries.getContractById, { contractId: args.contractId });
        if (!contract) {
            console.error(`Contract ${args.contractId} not found for starting Stage 2.`);
            // Wichtig: Fehler werfen, damit die Action fehlschlägt und nicht versucht, undefined zu verarbeiten
            throw new ConvexError(`Contract ${args.contractId} not found.`);
        }

        if (!contract.largeChunks || !Array.isArray(contract.largeChunks) || contract.largeChunks.length === 0) {
             console.error(`Contract ${args.contractId} has no large chunks to process for Stage 2.`);
            await ctx.runMutation(internal.contractMutations.updateContractStatus, {
                contractId: args.contractId,
                status: "stage2_structuring_failed",
                errorDetails: "Stage 2 cannot start: No large chunks found from Stage 1.",
                currentProcessingStepDetail: "Stage 2: No large chunks to process"
            });
            // Wichtig: Hier eine Nachricht zurückgeben, die dem Promise-Typ entspricht, oder Fehler werfen
            // Da die Funktion eine Nachricht erwartet, werfen wir einen Fehler, um den Kontrollfluss klar zu halten
            throw new ConvexError("No large chunks found to process for Stage 2.");
        }

        await ctx.runMutation(internal.contractMutations.updateContractStatus, {
            contractId: args.contractId,
            status: "stage2_structuring_inprogress",
            currentProcessingStepDetail: `Starting Stage 2: Structuring ${contract.largeChunks.length} large chunks.`,
        });

        const structuringPromises: Promise<any>[] = [];
        for (const largeChunk of contract.largeChunks) {
            console.log(`Scheduling Stage 2 structuring for chunk ${largeChunk.chunkNumber} of contract ${args.contractId}`);
            structuringPromises.push(
                ctx.runAction(internal.gemini.runStage2Structuring, {
                    chunkContent: largeChunk.chunkContent,
                    globalChunkNumber: largeChunk.chunkNumber,
                    identifiedSectionsOfParentChunk: largeChunk.identifiedSections,
                })
            );
        }

        try {
            console.log(`Waiting for ${structuringPromises.length} Stage 2 structuring actions to complete...`);
            const results = await Promise.allSettled(structuringPromises);
            console.log(`All Stage 2 structuring actions settled for contract ${args.contractId}.`);

            let allStructuredElements: any[] = []; 
            let hasErrors = false;
            let successfulChunks = 0;
            const errorMessages: string[] = [];

            results.forEach((result, index) => {
                const chunkNumber = contract.largeChunks![index]?.chunkNumber ?? `unknown_chunk_${index}`;
                if (result.status === 'fulfilled') {
                    if (Array.isArray(result.value)) {
                        console.log(`Stage 2 structuring succeeded for chunk ${chunkNumber}. Found ${result.value.length} elements.`);
                        allStructuredElements.push(...result.value);
                        successfulChunks++;
                    } else {
                        console.error(`Stage 2 action for chunk ${chunkNumber} returned non-array value:`, result.value);
                        hasErrors = true;
                        errorMessages.push(`Chunk ${chunkNumber}: Invalid format returned.`);
                    }
                } else {
                    console.error(`Stage 2 structuring failed for chunk ${chunkNumber}:`, result.reason);
                    hasErrors = true;
                    errorMessages.push(`Chunk ${chunkNumber}: ${result.reason?.message || 'Unknown error'}`);
                }
            });

            console.log(`Stage 2 Summary for ${args.contractId}: ${successfulChunks}/${contract.largeChunks?.length ?? 'unknown'} chunks successful. Total elements found: ${allStructuredElements.length}.`);

            allStructuredElements.sort((a, b) => {
                if (a.globalChunkNumber !== b.globalChunkNumber) {
                    return a.globalChunkNumber - b.globalChunkNumber;
                }
                return a.originalOrderInChunk - b.originalOrderInChunk;
            });

            const elementsWithGlobalOrder = allStructuredElements.map((element, index) => ({
                ...element,
                globalOriginalOrder: index 
            }));

            await ctx.runMutation(internal.contractMutations.saveStructuredElements, {
                contractId: args.contractId,
                structuredElements: elementsWithGlobalOrder, 
                stage2Errors: hasErrors ? errorMessages : undefined, 
                successfulChunksCount: successfulChunks 
            });
            
            console.log(`Stage 2 results saved. Next step: saveStructuredElements mutation will trigger Stage 3 analysis for contractId: ${args.contractId}`);
            return { message: `Stage 2 (Structuring) completed. ${successfulChunks}/${contract.largeChunks?.length ?? 'unknown'} chunks processed. Stage 3 will be triggered.` };

        } catch (error: any) { 
            console.error(`Critical error during Stage 2 orchestration for contract ${args.contractId}:`, error);
            await ctx.runMutation(internal.contractMutations.updateContractStatus, {
                contractId: args.contractId,
                status: "stage2_structuring_failed",
                errorDetails: `Stage 2 orchestration failed: ${error.message || 'Unknown error'}`,
                currentProcessingStepDetail: "Stage 2: Orchestration FAILED"
            });
            // Stelle sicher, dass auch im Fehlerfall ein Fehler geworfen wird, um den Promise.allSettled in der aufrufenden Action korrekt zu behandeln
            throw new ConvexError(`Stage 2 orchestration failed: ${error.message || 'Unknown error'}`);
        }
    },
});

/**
 * INTERNAL ACTION: (Auskommentiert nach erfolgreicher Migration)
 * Iterates through all contracts and calls a mutation to migrate ownerId to userId and clear ownerId.
 * This was used for a one-time data migration.
 */
/*
export const migrateOwnerIdsToUserIds = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Starting migration: ownerId to userId...");
    const allContracts = await ctx.runQuery(
      internal.contractQueries.getAllContractsForMigration
    );

    let migratedCount = 0;
    let checkedCount = 0;
    let errorCount = 0;
    let copiedToUserIdCount = 0;
    let ownerIdClearedCount = 0;

    for (const contract of allContracts) {
      checkedCount++;
      try {
        // @ts-expect-error ownerId is removed from schema, this code is for completed migration
        const hasOwnerId = contract.ownerId && contract.ownerId.trim() !== "";
        // @ts-expect-error ownerId is removed from schema
        const hasUserId = contract.userId && contract.userId.trim() !== "";

        // Nur migrieren, wenn ownerId existiert und potenziell userId fehlt oder anders ist
        // Oder wenn ownerId einfach nur geleert werden muss
        if (hasOwnerId || contract.ownerId === "") { // auch leere ownerId-Strings behandeln
          const result = await ctx.runMutation(
            internal.contractMutations._migrateOwnerIdToUserIdAndClearOldField,
            { contractId: contract._id }
          );
          migratedCount++;
          if (result?.copiedToUserId) copiedToUserIdCount++;
          if (result?.ownerIdCleared) ownerIdClearedCount++;
        } else {
          // console.log(`Contract ${contract._id} does not have an ownerId or it is not relevant for migration. Skipping.`);
        }
      } catch (e) {
        console.error(`Error migrating contract ${contract._id}:`, e);
        errorCount++;
      }
    }
    const message = `Migration completed. Checked: ${checkedCount}, Processed (had ownerId or empty ownerId): ${migratedCount}, Copied to userId: ${copiedToUserIdCount}, OwnerId cleared: ${ownerIdClearedCount}, Errors: ${errorCount}`;
    console.log(message);
    return { message, checkedCount, migratedCount, copiedToUserIdCount, ownerIdClearedCount, errorCount };
  },
});
*/

// NEUE ACTION zum Starten und Orchestrieren von Stufe 3 (Detaillierte Element-Analyse)
export const startStage3Analysis = internalAction({
    args: {
        contractId: v.id("contracts"),
    },
    handler: async (ctx, args): Promise<{ message: string }> => {
        console.log(`Starting STAGE 3: Detailed element analysis for contract ${args.contractId}`);

        // 1. Vertragsdokument laden
        // Ersetze durch korrekten Query-Namen (Annahme: api.contractQueries.getContractById)
        const contract: Doc<"contracts"> | null = await ctx.runQuery(api.contractQueries.getContractById, { contractId: args.contractId });
        if (!contract) {
            console.error(`Contract ${args.contractId} not found for starting Stage 3.`);
            throw new ConvexError(`Contract ${args.contractId} not found.`);
        }

        // Überprüfe structuredContractElements
        if (!contract.structuredContractElements || !Array.isArray(contract.structuredContractElements) || contract.structuredContractElements.length === 0) {
            console.warn(`Contract ${args.contractId} has no structured elements to analyze for Stage 3. Setting status to completed.`);
            await ctx.runMutation(internal.contractMutations.finalizeAnalysis, {
                contractId: args.contractId,
                analysisResults: [],
                stage3Errors: undefined
            });
            return { message: "Stage 3 skipped: No elements to analyze." };
        }

        // 2. Status aktualisieren und Fortschritt initialisieren
        await ctx.runMutation(internal.contractMutations.updateContractStatus, {
            contractId: args.contractId,
            status: "stage3_analysis_inprogress",
            currentProcessingStepDetail: `Starting Stage 3: Analyzing ${contract.structuredContractElements.length} elements.`,
            // Initialisiere Fortschritt hier
            // analyzedElements: 0, 
        });

        // 3. Parallele Verarbeitung der Elemente starten (mit Batching)
        const BATCH_SIZE = 50; // Verarbeite 50 Elemente pro Batch
        const allAnalysisResults: any[] = [];
        const totalElements = contract.structuredContractElements.length;

        for (let i = 0; i < totalElements; i += BATCH_SIZE) {
            const batch = contract.structuredContractElements.slice(i, i + BATCH_SIZE);
            console.log(`Processing Stage 3 - Batch ${Math.floor(i / BATCH_SIZE) + 1}: Analyzing ${batch.length} elements (from index ${i} to ${i + batch.length -1})`);
            
            const analysisPromises: Promise<any>[] = []; 
            for (const element of batch) {
                if (!element.markdownContent || element.markdownContent.trim().length === 0) {
                    analysisPromises.push(Promise.resolve({ 
                        elementId: element.elementId, 
                        evaluation: "Info", 
                        reason: "Kein analysierbarer Inhalt.", 
                        recommendation: "Keine Aktion erforderlich.",
                        isError: false
                    }));
                    continue;
                }

                analysisPromises.push(
                    ctx.runAction(internal.gemini.generateAnalysisWithPro, {
                        elementMarkdownContent: element.markdownContent,
                        elementId: element.elementId,
                    }).then(result => ({ ...result, elementId: element.elementId }))
                      .catch(error => { 
                         console.error(`Unexpected error in generateAnalysisWithPro for ${element.elementId}:`, error);
                         return { 
                             elementId: element.elementId, 
                             evaluation: "Fehler", 
                             reason: `Action-Level Fehler: ${error.message || 'Unknown error'}`, 
                             recommendation: "Fehler in der Action-Ausführung.",
                             isError: true,
                             errorMessage: `Action-Level Fehler: ${error.message || 'Unknown error'}`
                        };
                      })
                );
            }
            // Auf Abschluss des aktuellen Batches warten
            const batchResults = await Promise.all(analysisPromises);
            allAnalysisResults.push(...batchResults);
            console.log(`Stage 3 - Batch ${Math.floor(i / BATCH_SIZE) + 1} completed. Collected ${batchResults.length} results.`);
        }

        // 4. Auf Abschluss aller parallelen Actions warten und Ergebnisse sammeln (jetzt allAnalysisResults)
        try {
            console.log(`All Stage 3 batches completed. Total ${allAnalysisResults.length} element results collected.`);
            // const analysisResults = await Promise.all(analysisPromises); // Nicht mehr nötig, da Batches bereits awaited wurden
            // console.log(`All Stage 3 analysis actions completed for contract ${args.contractId}.`);

            const hasErrors = allAnalysisResults.some(result => result.isError);
            const errorMessages = allAnalysisResults.filter(result => result.isError).map(r => `Element ${r.elementId}: ${r.reason} (${r.errorMessage || 'No details'})`);

            console.log(`Stage 3 Summary for ${args.contractId}: ${allAnalysisResults.length} elements processed. ${errorMessages.length} errors encountered.`);

            // 5. Gesammelte Ergebnisse speichern und Analyse abschließen (über Mutation)
            await ctx.runMutation(internal.contractMutations.finalizeAnalysis, {
                contractId: args.contractId,
                analysisResults: allAnalysisResults, 
                stage3Errors: hasErrors ? errorMessages : undefined
            });
            
            console.log(`Stage 3 analysis results saved. Processing finished for contractId: ${args.contractId}`);
            return { message: `Stage 3 (Analysis) completed. ${allAnalysisResults.length} elements processed.` + (hasErrors ? " (with errors)" : "") };

        } catch (error: any) { 
            console.error(`Critical error during Stage 3 orchestration for contract ${args.contractId}:`, error);
            await ctx.runMutation(internal.contractMutations.updateContractStatus, {
                contractId: args.contractId,
                status: "failed_partial_analysis", 
                errorDetails: `Stage 3 orchestration failed: ${error.message || 'Unknown error'}`,
                currentProcessingStepDetail: "Stage 3: Orchestration FAILED"
            });
            throw new ConvexError(`Stage 3 orchestration failed: ${error.message || 'Unknown error'}`);
        }
    },
});

// Bestehende Action createAnalysisChunksFromStructuredElements (wird veraltet/ersetzt)
// ... existing code ... 

// --- DATENMIGRATION: Entfernen veralteter Felder --- 

/**
 * INTERNAL ACTION: Iteriert durch alle Verträge und ruft eine Mutation 
 * auf, um veraltete Felder (`analysisProtocol`, `processedChunks`, `totalChunks`) zu entfernen.
 * Dies behebt Schema-Validierungsfehler nach der Umstellung auf die neue Analyse-Pipeline.
 * 
 * HINWEIS: Diese Action muss manuell ausgeführt werden (z.B. über das Convex Dashboard oder `npx convex run contractActions:migrateRemoveObsoleteFields`).
 */
export const migrateRemoveObsoleteFields = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Starting migration: Remove obsolete fields (analysisProtocol, processedChunks, totalChunks)...");
    
    // 1. Alle relevanten Vertrags-IDs abrufen (oder ganze Dokumente, wenn die Menge überschaubar ist)
    // Annahme: Es existiert eine Query, die alle Verträge oder deren IDs zurückgibt.
    // Verwendung der Query aus der vorherigen Migration als Beispiel.
    const allContracts = await ctx.runQuery(
      internal.contractQueries.getAllContractsForMigration // Passe dies ggf. an die korrekte Query an!
    );

    let checkedCount = 0;
    let migratedCount = 0;
    let errorCount = 0;

    console.log(`Found ${allContracts.length} contracts to check.`);

    for (const contract of allContracts) {
      checkedCount++;
      try {
        // 2. Prüfen, ob veraltete Felder vorhanden sind (um unnötige Schreibvorgänge zu vermeiden)
        // Die veralteten Felder existieren nicht mehr im Schema, wir nutzen jetzt any-Cast
        // @ts-ignore
        const anyContract: any = contract; // Cast zu any um TypeScript-Fehler zu vermeiden
        const needsMigration = anyContract.analysisProtocol !== undefined || 
                             anyContract.processedChunks !== undefined || 
                             anyContract.totalChunks !== undefined;

        if (needsMigration) {
          // 3. Mutation zum Entfernen der Felder aufrufen
          await ctx.runMutation(
            // @ts-ignore - Die Funktion existiert zur Laufzeit, ist aber nicht in der Typdefinition
            internal.contractMutations._removeObsoleteContractFields, 
            { contractId: contract._id }
          );
          migratedCount++;
        } else {
          // console.log(`Contract ${contract._id} does not need migration. Skipping.`);
        }
      } catch (e: any) {
        console.error(`Error migrating contract ${contract._id}:`, e);
        errorCount++;
      }
    }
    const message = `Migration completed. Checked: ${checkedCount}, Migrated (had obsolete fields): ${migratedCount}, Errors: ${errorCount}`;
    console.log(message);
    return { message, checkedCount, migratedCount, errorCount };
  },
});