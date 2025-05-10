/// <reference path="../types/gemini-api.d.ts" />

"use node";

import { action, internalAction, internalMutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import { PDFDocument } from 'pdf-lib';
import extract from 'pdf-text-extract';
import mammoth from 'mammoth';
import { Id } from "./_generated/dataModel";
import { promisify } from 'util';
import { RULES_FOR_ANALYSIS, LEGAL_BASIS_EXTRACT } from './ai_knowledge_base'; // Importiere die Konstanten

// Umwandlung des callback-basierten pdf-text-extract in eine Promise-basierte Version
// pdf-text-extract benötigt einen Dateipfad, daher können wir es nicht direkt mit Buffer verwenden
// Wir müssen eine temporäre Datei speichern oder eine andere Bibliothek verwenden
// Für dieses Beispiel entfernen wir die PDF-Extraktion, die fs/path benötigt
// const extractTextFromPDF = promisify(extract);

const CHUNK_SIZE_WORDS = 1500;

async function getBuffer(file: Blob | ArrayBuffer): Promise<Buffer> {
    if (file instanceof ArrayBuffer) {
        return Buffer.from(file);
    }
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

function splitTextIntoChunks(text: string, chunkSizeInWords: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/); 
  const chunks: string[] = [];
  let currentChunk = "";
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const sentenceWordCount = sentence.split(/\s+/).length;
    if (currentWordCount + sentenceWordCount > chunkSizeInWords && currentWordCount > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
      currentWordCount = 0;
    }
    currentChunk += sentence + " ";
    currentWordCount += sentenceWordCount;
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
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
      status: "processing",
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
    const contractDocument = await ctx.runQuery(api.contractsQueries.getContractById, { contractId: args.contractId });
    if (!contractDocument) {
        await ctx.runMutation(internal.contractMutations.updateContractStatus, {
            contractId: args.contractId, status: "failed",
        });
        throw new ConvexError("Contract document not found in DB for text extraction.");
    }
    const fileName = contractDocument.fileName.toLowerCase();
    
    console.log(`Attempting text extraction for: ${fileName}`);

    try {
        if (fileName.endsWith(".pdf")) {
            // PDF-Extraktion mit pdf-text-extract wurde entfernt, da sie fs/path benötigt.
            console.warn("PDF extraction using pdf-text-extract is currently disabled because it requires filesystem access.");
            // Alternativ: Verwende eine andere Bibliothek oder eine Convex HTTP Action für die Extraktion.
            // Fallback mit pdf-lib (kann normalerweise keinen Text extrahieren)
            try {
                const pdfDoc = await PDFDocument.load(fileBuffer);
                extractedText = `PDF konnte nicht extrahiert werden (fs-Zugriff erforderlich). Das Dokument hat ${pdfDoc.getPageCount()} Seiten.`;
                console.log(`PDF loaded with pdf-lib. Page count: ${pdfDoc.getPageCount()}.`);
            } catch (pdfLibError: any) {
                console.error("Error loading PDF with pdf-lib:", pdfLibError);
                extractedText = "Fehler beim Laden der PDF-Datei.";
            }
            
        } else if (fileName.endsWith(".docx")) {
            console.log("Processing DOCX file...");
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
            console.log("DOCX text extracted successfully.");
        } else if (fileName.endsWith(".txt")) { 
            console.log("Processing TXT file...");
            extractedText = fileBuffer.toString('utf-8');
            console.log("TXT text extracted successfully.");
        } else {
            await ctx.runMutation(internal.contractMutations.updateContractStatus, {
                contractId: args.contractId, status: "failed",
            });
            throw new ConvexError(`Unsupported file type: ${contractDocument.fileName}. Only .pdf, .docx, and .txt are currently supported.`);
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
      throw new ConvexError(`Extracted text from ${contractDocument.fileName} is empty.`);
    }
    console.log(`Text extracted (length: ${extractedText.length}) from ${contractDocument.fileName}`);

    const rulesText = RULES_FOR_ANALYSIS;
    const legalBasisText = LEGAL_BASIS_EXTRACT;
    console.log("Knowledge base content loaded from constants.");

    const chunks = splitTextIntoChunks(extractedText, CHUNK_SIZE_WORDS);
    if (chunks.length === 0) {
      await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "failed",
      });
      throw new ConvexError("No chunks created from text.");
    }
    console.log(`Text split into ${chunks.length} chunks.`);

    await ctx.runMutation(internal.contractMutations.updateContractStatus, {
        contractId: args.contractId,
        status: "chunking",
        totalChunks: chunks.length,
    });

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Scheduling analysis for chunk ${i + 1}/${chunks.length}`);
      await ctx.scheduler.runAfter(0, internal.contractActions.analyzeContractChunk, {
        contractId: args.contractId,
        chunkText: chunks[i],
        rulesText: rulesText,
        legalBasisText: legalBasisText,
        chunkNumber: i + 1,
        totalChunks: chunks.length,
      });
    }
    console.log(`All chunks scheduled for contractId: ${args.contractId}`);
    return { message: `Analysis process started for ${chunks.length} chunks.` };
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

    const systemPrompt = `Du bist ein spezialisierter KI-Assistent für die automatisierte Prüfung von deutschsprachigen Bauverträgen und Allgemeinen Geschäftsbedingungen (AGBs), insbesondere im Kontext des deutschen und österreichischen Baurechts (BGB, VOB, ÖNORM). Deine Hauptaufgabe ist es, Nutzern zu helfen, Verträge schnell zu analysieren, Risiken zu identifizieren und Compliance sicherzustellen.
    Gib als Ergebnis NUR ein valides JSON-Array zurück, das die analysierten Klauseln dieses Chunks enthält. Jedes Objekt im Array MUSS folgende Felder haben: "clauseText" (string), "evaluation" (string: "Rot", "Gelb" oder "Grün"), "reason" (string), "recommendation" (string). Wenn keine identifizierbaren Klauseln in diesem Chunk sind, gib ein leeres JSON-Array zurück: []. Beispiel für ein einzelnes Klauselobjekt: {"clauseText": "Text der Klausel...", "evaluation": "Rot", "reason": "Verstößt gegen Regel X...", "recommendation": "Entfernen oder neu verhandeln..."}`;

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

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
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
        const systemPrompt = `Du bist ein KI-Assistent, spezialisiert auf die Optimierung von Klauseln in deutschsprachigen Bauverträgen. Deine Aufgabe ist es, basierend auf einer gegebenen Klausel, eine verbesserte Formulierung vorzuschlagen, die fairer, klarer oder weniger riskant für einen Bauunternehmer ist. Berücksichtige dabei gängige Praktiken und potenziell das deutsche/österreichische Baurecht.
        
        Gib als Ergebnis NUR ein valides JSON-Array mit EINEM String zurück. Dieser String ist die optimierte Formulierung. Beispiel: ["Hier ist der optimierte Text der Klausel."]`;

        const userPrompt = `Bitte optimiere die folgende Vertragsklausel für einen Bauunternehmer. Konzentriere dich auf Klarheit, Risikominimierung und Ausgewogenheit.

Klausel:
"${args.clauseText}"

${args.context ? `\nZusätzlicher Kontext:\n${args.context}` : ''}

Gib das Ergebnis als JSON-Array mit einem einzigen String zurück, wie im Systemprompt beschrieben. Beginne direkt mit '[' und ende mit ']'.`;

        try {
            const requestBody: Gemini.RequestBody = {
                contents: [
                    { role: "user", parts: [{ text: systemPrompt }, { text: userPrompt }] }
                ],
                generationConfig: {
                    temperature: 0.3, // Niedrigere Temperatur für stabilere Ergebnisse
                    topP: 0.8,
                    topK: 40
                }
            };

            console.log("Sending request to Gemini API for clause optimization...");
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Gemini API error during optimization: ${response.status} ${response.statusText}`, errorBody);
                // Fallback-Antwort bei API-Fehler
                return [args.clauseText]; // Gib den ursprünglichen Text zurück
            }

            const responseData: Gemini.GenerateContentResponse = await response.json();
            if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content || !responseData.candidates[0].content.parts || !responseData.candidates[0].content.parts[0]) {
                 console.error("Gemini API response is not in the expected format during optimization", responseData);
                 // Fallback-Antwort bei unerwartetem Format
                 return [args.clauseText]; // Gib den ursprünglichen Text zurück
            }

            const geminiOutput = responseData.candidates[0].content.parts[0].text;
            let cleanedOutput = geminiOutput.trim();

            // JSON Bereinigung
            if (cleanedOutput.startsWith("```json")) {
                cleanedOutput = cleanedOutput.substring(7);
                if (cleanedOutput.endsWith("```")) {
                    cleanedOutput = cleanedOutput.substring(0, cleanedOutput.length - 3);
                }
            } else if (cleanedOutput.startsWith("```")) {
                cleanedOutput = cleanedOutput.substring(3);
                if (cleanedOutput.endsWith("```")) {
                    cleanedOutput = cleanedOutput.substring(0, cleanedOutput.length - 3);
                }
            }
            cleanedOutput = cleanedOutput.trim();
            
            try {
                // Versuche, das JSON zu parsen
                const parsedJson = JSON.parse(cleanedOutput);
                
                if (Array.isArray(parsedJson) && parsedJson.length > 0 && typeof parsedJson[0] === 'string') {
                    // Erfolgreicher Fall: Ein JSON-Array mit einem String als erstem Element
                    console.log("Successfully parsed optimized clause from AI response");
                    return [parsedJson[0]]; // Nur die erste Alternative zurückgeben
                } else if (typeof parsedJson === 'string') {
                    // Falls direkt ein String zurückgegeben wird
                    return [parsedJson];
                } else if (typeof parsedJson === 'object' && parsedJson !== null) {
                    // Falls ein Objekt zurückgegeben wird, erste String-Eigenschaft verwenden
                    const stringValue = Object.values(parsedJson).find(val => typeof val === 'string');
                    if (stringValue) {
                        return [stringValue];
                    }
                }
                
                // Wenn kein String gefunden wurde, ursprünglichen Text zurückgeben
                return [args.clauseText];
            } catch (parseError) {
                // Wenn das JSON-Parsing fehlschlägt, versuche, den Text direkt zu verwenden
                if (cleanedOutput && cleanedOutput.length > 0) {
                    return [cleanedOutput]; // Rohen Text verwenden, wenn er nicht leer ist
                }
                
                // Fallback bei allen anderen Fehlern
                return [args.clauseText];
            }

        } catch (error) {
            console.error(`Error optimizing clause with AI:`, error);
            // Fallback-Antwort bei Fehlern
            return [args.clauseText]; // Gib den ursprünglichen Text zurück
        }
    },
}); 