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

export const startFullContractAnalysis = action({
  args: { 
    storageId: v.id("_storage"),
    contractId: v.id("contracts") 
  },
  handler: async (ctx, args) => {
    console.log(`Starting full contract analysis for contractId: ${args.contractId}`);

    await ctx.runMutation(internal.contractMutations.updateContractStatus, {
      contractId: args.contractId,
      status: "preprocessing_structure",
      totalChunks: 0,
    });

    const fileBlob = await ctx.storage.get(args.storageId);
    if (!fileBlob) {
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "failed",
      });
      throw new ConvexError("File not found in storage.");
    }
    const fileBuffer = await getBuffer(fileBlob);

    let extractedText = "";
    const contractDocument = await ctx.runQuery(api.contractQueries.getContractById, { contractId: args.contractId });
    if (!contractDocument) {
        await ctx.runMutation(internal.contractMutations.updateContractStatus, {
            contractId: args.contractId, status: "failed",
        });
        throw new ConvexError("Contract document not found in DB for text extraction.");
    }
    const fileName = contractDocument.fileName ? contractDocument.fileName.toLowerCase() : "undefined_filename";
    const fileType = fileName.endsWith(".docx") ? "docx" :
                     fileName.endsWith(".pdf") ? "pdf" :
                     fileName.endsWith(".txt") ? "txt" : undefined;
    
    console.log(`Attempting text extraction for: ${fileName}`);

    try {
        if (fileType === "pdf") {
            // PDF-Extraktion mit pdf-text-extract wurde entfernt, da sie fs/path benötigt.
            console.warn("PDF extraction using pdf-text-extract is currently disabled because it requires filesystem access.");
            // Alternativ: Verwende eine andere Bibliothek oder eine Convex HTTP Action für die Extraktion.
            // Fallback mit pdf-lib (kann normalerweise keinen Text extrahieren)
            try {
                const pdfDoc = await PDFDocument.load(fileBuffer);
                extractedText = `PDF konnte nicht extrahiert werden (fs-Zugriff erforderlich). Das Dokument hat ${pdfDoc.getPageCount()} Seiten. Bitte manuell extrahieren und als TXT hochladen.`; // Hinweis für den Benutzer
                console.log(`PDF loaded with pdf-lib. Page count: ${pdfDoc.getPageCount()}.`);
            } catch (pdfLibError: any) {
                console.error("Error loading PDF with pdf-lib:", pdfLibError);
                extractedText = "Fehler beim Laden der PDF-Datei.";
            }
            
        } else if (fileType === "docx") {
            console.log("Processing DOCX file...");
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
            console.log("DOCX text extracted successfully.");
        } else if (fileType === "txt") { 
            console.log("Processing TXT file...");
            extractedText = fileBuffer.toString('utf-8');
            console.log("TXT text extracted successfully.");
        } else {
            await ctx.runMutation(internal.contractMutations.updateContractStatus, {
                contractId: args.contractId, status: "failed",
            });
            throw new ConvexError(`Unsupported file type: ${fileName}. Only .docx and .txt are currently supported for full extraction.`);
        }
    } catch (error: any) {
        console.error(`Error during text extraction for ${fileName}:`, error);
        await ctx.runMutation(internal.contractMutations.updateContractStatus, {
            contractId: args.contractId, status: "failed",
        });
        throw new ConvexError(`Failed to extract text from ${fileName}: ${error.message || 'Unknown error'}`);
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "failed",
      });
      throw new ConvexError(`Extracted text from ${fileName} is empty.`);
    }
    console.log(`Text extracted (length: ${extractedText.length}) from ${fileName}`);

    // Entfernung von direkter Verwendung von RULES_FOR_ANALYSIS und LEGAL_BASIS_EXTRACT hier
    console.log("Knowledge base content will be used in later analysis stages.");

    const preChunks = splitTextIntoPreChunks(extractedText, PRE_CHUNK_SIZE_WORDS);
    if (preChunks.length === 0) {
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "failed",
      });
      throw new ConvexError("No pre-chunks created from text.");
    }
    console.log(`Text split into ${preChunks.length} pre-chunks.`);

    await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "preprocessing_structure_chunked",
        totalChunks: preChunks.length,
    });

    await ctx.scheduler.runAfter(0, internal.contractActions.structureContractIncrementallyAndCreateJsonElements, {
      contractId: args.contractId,
      preChunks: preChunks,
    });
    
    console.log(`Structuring process scheduled with ${preChunks.length} pre-chunks for contractId: ${args.contractId}`);
    return { message: `Structuring process started for ${preChunks.length} pre-chunks.` };
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
      totalChunks: args.preChunks.length, // Anzahl der Vor-Chunks als totalChunks
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
          modelName: "gemini-2.0-flash" // <<< Korrektes Modell
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

      await ctx.runMutation(internal.contractMutations.updateContractProcessingProgress, {
        contractId: args.contractId,
        chunksProcessed: chunkNumberForLog, // i + 1
        statusMessage: `Struktur für Vor-Chunk ${chunkNumberForLog}/${args.preChunks.length} generiert.`,
        currentStatus: "structure_generation_inprogress" // Hinzugefügt
      });
    }

    // Speichere die gesammelten strukturierten Daten und den Markdown-Text
    await ctx.runMutation(internal.contractMutations.updateContractWithStructuredData, {
        contractId: args.contractId,
        fullMarkdownText: finalFullMarkdownText.trim(),
        structuredContractElements: finalStructuredElementsList,
    });

    await ctx.runMutation(internal.contractMutations.updateContractStatus, {
      contractId: args.contractId,
      status: "structured_json_generated",
      totalChunks: finalStructuredElementsList.length // Jetzt ist totalChunks die Anzahl der Strukturelemente
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
      await ctx.runMutation(internal.contractMutations.appendChunkAnalysis, {
        contractId: args.contractId,
        chunkNumber: args.chunkNumber,
        totalChunks: args.totalChunks,
        chunkResult: [],
        error: "GEMINI_API_KEY missing"
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
      await ctx.runMutation(internal.contractMutations.appendChunkAnalysis, {
        contractId: args.contractId,
        chunkNumber: args.chunkNumber,
        totalChunks: args.totalChunks,
        chunkResult: [],
        error: error.message || "Unbekannter Fehler bei der Chunk-Analyse",
      });
      return; 
    }

    await ctx.runMutation(internal.contractMutations.appendChunkAnalysis, {
      contractId: args.contractId,
      chunkNumber: args.chunkNumber,
      totalChunks: args.totalChunks,
      chunkResult: analysisResultForChunk,
    });
    console.log(`Successfully processed and stored chunk ${args.chunkNumber} for contract ${args.contractId}`);
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
    handler: async (ctx, args) => {
        console.log(`Optimizing clause with AI: "${args.clauseText.substring(0, 50)}..."`);
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is not set in environment variables for optimizeClauseWithAI.");
            throw new ConvexError("GEMINI_API_KEY is not configured.");
        }

        // Angepasster Prompt für direkte Optimierung
        const systemPrompt = `Du bist ein spezialisierter Rechtsexperte für Bauverträge nach deutschem und österreichischem Recht (BGB, VOB, ÖNORM). Deine Aufgabe ist es, problematische Vertragsklauseln für Bauunternehmer zu verbessern.

Achte besonders auf folgende Problembereiche:
- Pay-When-Paid Klauseln (Zahlungsabhängigkeit) → Zahlung unabhängig von Drittparteien
- Übertragung gewerblicher Schutzrechte → Beschränkung auf Nutzungsrechte
- Vertragsstrafen/Pönalen → Begrenzung auf max. 5% der Auftragssumme + Verschuldensabhängigkeit
- Back-to-Back Klauseln → Spezifische, transparente Verpflichtungen statt Generalübernahme
- Bietergarantien/Erfüllungsgarantien → Ablehnung oder starke Einschränkung
- Bauablaufstörungen → Sicherung von Ansprüchen bei Verzögerungen
- ÖNORM B 2110 → Beibehaltung der Standardregelungen

Formuliere einen EINZELNEN optimierten Klauseltext, der rechtssicher, präzise und für den Bauunternehmer möglichst vorteilhaft ist. Klarer Stil und juristische Präzision sind wichtig.

Gib als Ergebnis NUR ein valides JSON-Array mit EINEM String zurück. Format: ["Optimierte Klausel"]`;

        const userPrompt = `Bitte optimiere die folgende Vertragsklausel für einen Bauunternehmer. Konzentriere dich auf Klarheit, Risikominimierung und Ausgewogenheit.

Klausel:
"${args.clauseText}"

${args.context ? `\nZusätzlicher Kontext:\n${args.context}` : ''}

Gib das Ergebnis als JSON-Array mit einem einzigen String zurück, wie im Systemprompt beschrieben. Beginne direkt mit '[' und ende mit ']'.`;

        let response: Response | undefined;
        try {
            console.log("Sending request to Gemini API for clause optimization...");
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
                    temperature: 0.3, // Niedrigere Temperatur für stabilere Ergebnisse
                    topP: 0.8,
                    topK: 40
                }
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Gemini API error during optimization:", response.status, errorBody);
                throw new Error(`Gemini API error: ${response.status} ${errorBody}`);
            }

            const responseData: any = await response.json();
            console.log("Gemini API response for optimization:", JSON.stringify(responseData).substring(0, 300) + "...");
            
            // Extrahiere den Text aus der Antwort
            const optimizedText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (optimizedText) {
                // Der Prompt erwartet nur einen String, also geben wir nur diesen zurück
                // Da die Action aber ein Array von Strings erwartet (basierend auf altem Code?), wrappen wir es.
                // TODO: Prüfen, ob das Frontend wirklich ein Array erwartet oder nur einen String.
                // Wenn nur ein String, dann direkt `return optimizedText;`
                return [optimizedText]; 
            } else {
                console.warn("Could not extract optimized text from Gemini response.", responseData);
                return []; // Leeres Array bei fehlendem Text
            }

        } catch (error: any) {
            console.error("Error in optimizeClauseWithAI action:", error);
            // Optional spezifischere Fehlermeldung zurückgeben
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
    handler: async (ctx, args) => {
        console.log(`Generating alternative formulations for clause: "${args.clauseText.substring(0, 50)}..."`);
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is not set in environment variables for generateAlternativeFormulations.");
            throw new ConvexError("GEMINI_API_KEY is not configured.");
        }

        // Angepasster Prompt für die Generierung von 3 Alternativen
        const systemPrompt = `Du bist ein spezialisierter Rechtsexperte für Bauverträge nach deutschem und österreichischem Recht (BGB, VOB, ÖNORM). Deine Aufgabe ist es, für problematische Vertragsklauseln GENAU DREI unterschiedliche alternative Formulierungen zu entwickeln.

Die drei Alternativen sollten:
1. Eine KONSERVATIVE Variante, die minimale Änderungen vornimmt, aber das Hauptrisiko beseitigt
2. Eine AUSGEWOGENE Variante mit fairer Risikoverteilung zwischen den Parteien
3. Eine OPTIMALE Variante, die die Position des Bauunternehmers maximal stärkt

Fokussiere dich besonders auf folgende Problemklauseln:
- Pay-When-Paid Klauseln → Zahlungsunabhängigkeit
- Übertragung gewerblicher Schutzrechte → Nutzungsrechte
- Vertragsstrafen/Pönalen → Begrenzung auf 5% + Verschuldensabhängigkeit
- Back-to-Back Klauseln → Spezifische Verpflichtungen
- Garantien (Bieter/Erfüllung) → Einschränkung/Ablehnung
- Bauablaufstörungen → Anspruchssicherung
- ÖNORM B 2110 → Beibehaltung vorteilhafter Standardregelungen

Gib als Ergebnis NUR ein valides JSON-Array mit GENAU DREI Strings zurück. Format: ["Alternative 1", "Alternative 2", "Alternative 3"]`;

        const userPrompt = `Bitte generiere GENAU DREI alternative Formulierungen für die folgende Vertragsklausel. Jede Alternative sollte einen anderen Ansatz oder Schwerpunkt haben, aber alle sollten für einen Bauunternehmer vorteilhafter sein.

Klausel:
"${args.clauseText}"

${args.context ? `\nZusätzlicher Kontext:\n${args.context}` : ''}

Gib das Ergebnis als JSON-Array mit GENAU DREI Strings zurück, wie im Systemprompt beschrieben. Beginne direkt mit '[' und ende mit ']'.`;

        let response: Response | undefined;
        try {
            console.log("Sending request to Gemini API for alternative formulations...");
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
                    temperature: 0.7, // Höhere Temperatur für vielfältigere Ergebnisse
                    topP: 0.9,
                    topK: 40
                }
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Gemini API error during alternative formulation generation:", response.status, errorBody);
                // Logge den Prompt bei Fehler
                console.error("Prompt used:", `${systemPrompt}\n\n--- URSPRÜNGLICHE KLAUSEL (MARKDOWN) ---\n${args.clauseText}\n--- ENDE URSPRÜNGLICHE KLAUSEL ---`);
                throw new Error(`Gemini API error: ${response.status} ${errorBody}`);
            }

            const responseData: any = await response.json();
            console.log("Gemini API response for alternatives:", JSON.stringify(responseData).substring(0, 300) + "...");
            
            // Extrahiere den JSON-Text aus der Antwort
            const jsonText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (jsonText) {
                try {
                    // Parse den JSON-String, der das Array der Alternativen enthält
                    const alternativesArray = JSON.parse(jsonText);
                    if (Array.isArray(alternativesArray) && alternativesArray.every(item => typeof item === 'string')) {
                        return alternativesArray as string[];
                    } else {
                        console.error("Parsed JSON from Gemini is not an array of strings:", alternativesArray);
                        return []; // Leeres Array bei ungültigem Format
                    }
                } catch (parseError: any) {
                    console.error("Failed to parse JSON from Gemini response for alternatives:", parseError, "Raw JSON text:", jsonText);
                    return []; // Leeres Array bei Parse-Fehler
                }
            } else {
                console.warn("Could not extract JSON text for alternatives from Gemini response.", responseData);
                return []; // Leeres Array bei fehlendem Text
            }

        } catch (error: any) {
            console.error("Error in generateAlternativeFormulations action:", error);
            throw new Error(`Failed to generate alternative formulations: ${error.message}`);
        }
    },
});

// Interne Helper-Funktion für die sequenzielle Analyse eines einzelnen Chunks
async function _performSingleChunkAnalysis(
    ctx: ActionCtx, // ActionCtx wird benötigt für runAction und runMutation
    contractId: Id<"contracts">,
    analysisChunk: StructuredElement[] // Sicherstellen, dass StructuredElement hier verfügbar/importiert ist oder den Typ explizit definieren
): Promise<{ success: boolean }> {
    const chunkIdentifier = analysisChunk.length > 0 ? analysisChunk[0].elementId : 'empty_chunk';
    console.log(`Starting analysis for chunk starting with ${chunkIdentifier} for contract ${contractId}`);
    let chunkAnalysisError = false;

    for (const element of analysisChunk) {
        // Nur relevante Elemente analysieren
        if (element.elementType !== "clauseH3" && element.elementType !== "paragraph") {
            continue;
        }

        console.log(`Analyzing element ${element.elementId} (${element.elementType})`);

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
            const systemPromptAgent2 = `Du bist ein spezialisierter KI-Assistent für die Prüfung von Bauverträgen. Bewerte die Klausel nach dem AMPELSYSTEM (Rot, Gelb, Grün, Info). Gib eine Begründung und Empfehlung. Deine Antwort MUSS ein JSON-Array sein, das EIN Objekt für die analysierte Klausel enthält: [{ "analyzedElementId": "...", "evaluation": "...", "reason": "...", "recommendation": "..." }]`;

            // 5. User-Prompt
            const userPromptAgent2 = `BEWERTE FOLGENDE VERTRAGSKLAUSEL:\n\n--- ZU ANALYSIERENDES VERTRAGSELEMENT (Markdown, ID: ${element.elementId}) ---\n${element.markdownContent}\n--- ENDE ZU ANALYSIERENDES VERTRAGSELEMENT ---\n\n--- RELEVANTE AUSZÜGE AUS DER WISSENSDATENBANK ---\n${retrievedKnowledgeContext}\n--- ENDE RELEVANTE AUSZÜGE ---\n\nGib deine Analyse als JSON-Array mit genau einem Objekt zurück.`;

            // 6. Gemini Pro Aufruf
            // WICHTIG: Die Retry-Logik sollte idealerweise in internal.gemini.generateAnalysisWithPro implementiert sein!
            const analysisResultString = await ctx.runAction(internal.gemini.generateAnalysisWithPro, {
                systemPrompt: systemPromptAgent2,
                contextPrompt: userPromptAgent2,
                modelName: "gemini-2.0-flash" // Standard: gemini-2.0-flash
            });

            console.log(`Raw analysis result string for element ${element.elementId}:`, analysisResultString);

            // 7. JSON parsen
            let parsedAnalysis = null;
            try {
                parsedAnalysis = JSON.parse(analysisResultString.trim());
            } catch (parseError: any) {
                console.error(`Failed to parse JSON response for element ${element.elementId}: ${parseError.message}. Raw response: ${analysisResultString.substring(0, 300)}...`);
                chunkAnalysisError = true;
                await ctx.runMutation(internal.contractMutations.mergeAnalysisResult, {
                    contractId: contractId,
                    elementId: element.elementId,
                    evaluation: "Fehler",
                    reason: "Ungültige JSON-Antwort von KI.",
                    recommendation: "Element konnte nicht analysiert werden.",
                    isError: true,
                });
                continue; // Nächstes Element im Chunk
            }

            // 8. Ergebnisse validieren und speichern
            if (Array.isArray(parsedAnalysis) && parsedAnalysis.length > 0) {
                const result = parsedAnalysis[0];
                if (result && result.analyzedElementId === element.elementId && result.evaluation && result.reason && result.recommendation) {
                    await ctx.runMutation(internal.contractMutations.mergeAnalysisResult, {
                        contractId: contractId,
                        elementId: element.elementId,
                        evaluation: result.evaluation,
                        reason: result.reason,
                        recommendation: result.recommendation,
                        isError: false,
                    });
                    console.log(`Successfully analyzed and saved element ${element.elementId}`);
                } else {
                    console.error(`Invalid analysis result format or mismatched ID for element ${element.elementId}:`, result);
                    chunkAnalysisError = true;
                    await ctx.runMutation(internal.contractMutations.mergeAnalysisResult, {
                        contractId: contractId,
                        elementId: element.elementId,
                        evaluation: "Fehler",
                        reason: "Ungültiges Analyseformat von KI.",
                        recommendation: "Ergebnis konnte nicht verarbeitet werden.",
                        isError: true,
                    });
                }
            } else {
                console.error(`Parsed JSON is not a valid array or is empty for element ${element.elementId}. Parsed:`, parsedAnalysis);
                chunkAnalysisError = true;
                await ctx.runMutation(internal.contractMutations.mergeAnalysisResult, {
                    contractId: contractId,
                    elementId: element.elementId,
                    evaluation: "Fehler",
                    reason: "Keine gültige Analyse im JSON-Format von KI erhalten.",
                    recommendation: "Element konnte nicht analysiert werden.",
                    isError: true,
                });
            }

        } catch (error: any) {
            console.error(`Error analyzing element ${element.elementId} in contract ${contractId}:`, error);
            chunkAnalysisError = true;
            try {
                await ctx.runMutation(internal.contractMutations.mergeAnalysisResult, {
                    contractId: contractId,
                    elementId: element.elementId,
                    evaluation: "Fehler",
                    reason: `Analyse fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`, // Hauptfehler speichern
                    recommendation: "Erneute Analyse könnte erforderlich sein.",
                    isError: true,
                });
            } catch (mutationError: any) {
                console.error(`Failed to save error status for element ${element.elementId}:`, mutationError);
            }
        }
    } // Ende der Element-Schleife

    console.log(`Finished analyzing chunk ${chunkIdentifier}. Chunk analysis error: ${chunkAnalysisError}`);
    return { success: !chunkAnalysisError };
}

// NEU: Stufe 2 - Erstellt Analyse-Chunks aus Strukturelementen UND STARTET DIE SEQUENZIELLE ANALYSE
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
        totalChunks: 0,
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

    // 4. SEQUENZIELLE Analyse starten
    if (analysisChunks.length > 0) {
      // Status auf "analysis_inprogress" setzen und Gesamtfortschritt initialisieren
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "analysis_inprogress",
        totalChunks: analysisChunks.length,
      });

      let overallSuccess = true;
      let chunksProcessedCount = 0;

      // Schleife für sequenzielle Verarbeitung
      for (const chunk of analysisChunks) {
        const chunkIdentifier = chunk.length > 0 ? chunk[0].elementId : 'empty_chunk';
        console.log(`Sequentially processing chunk starting with ${chunkIdentifier} for contract ${args.contractId} (${chunksProcessedCount + 1}/${analysisChunks.length})`);
        
        // Rufe die interne Analyse-Logik auf
        const result = await _performSingleChunkAnalysis(ctx, args.contractId, chunk);
        
        chunksProcessedCount++;
        if (!result.success) {
          overallSuccess = false;
          // Logik, ob hier abgebrochen oder weitergemacht werden soll
          console.warn(`Chunk analysis starting with ${chunkIdentifier} failed.`);
        }

        // Fortschritt nach jedem Chunk aktualisieren
        await ctx.runMutation(internal.contractMutations.updateContractProcessingProgress, { 
            contractId: args.contractId,
            chunksProcessed: chunksProcessedCount,
            currentStatus: "analysis_inprogress",
        });
      }

      // Finale Statusaktualisierung nach Abschluss aller Chunks
      const finalStatus = overallSuccess ? "completed" : "failed"; // Oder partieller Erfolg?
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: finalStatus,
      });

      console.log(`Sequential analysis finished for contract ${args.contractId}. Final status: ${finalStatus}. ${chunksProcessedCount}/${analysisChunks.length} chunks processed.`);
      return { message: `Sequential analysis finished. ${chunksProcessedCount}/${analysisChunks.length} chunks processed. Overall success: ${overallSuccess}` };

        } else {
      // Fall: Keine Analyse-Chunks erstellt
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "completed", // Oder anderer Status?
        totalChunks: 0,
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
// ... existing code ... 